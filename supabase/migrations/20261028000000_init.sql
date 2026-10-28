-- Gighopper initial schema.
--
-- Reference data (artists, cities, venues, events) is shared and anchored on
-- external ids (MusicBrainz, GeoNames, setlist.fm) instead of fuzzy text.
-- Only the service role (edge functions) writes it; signed-in users read it.
-- Personal data (attendances) is owned by the user and guarded by RLS.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are readable by signed-in users"
  on public.profiles for select to authenticated using (true);

create policy "users update their own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(split_part(new.email, '@', 1), ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------------

-- German states, keyed by the two-letter code used in the UI (BY, BE, ...).
create table public.states (
  code text primary key,
  name text not null,
  geonames_admin1 text not null unique
);

insert into public.states (code, name, geonames_admin1) values
  ('BW', 'Baden-Württemberg', '01'),
  ('BY', 'Bayern', '02'),
  ('HB', 'Bremen', '03'),
  ('HH', 'Hamburg', '04'),
  ('HE', 'Hessen', '05'),
  ('NI', 'Niedersachsen', '06'),
  ('NW', 'Nordrhein-Westfalen', '07'),
  ('RP', 'Rheinland-Pfalz', '08'),
  ('SL', 'Saarland', '09'),
  ('SH', 'Schleswig-Holstein', '10'),
  ('BB', 'Brandenburg', '11'),
  ('MV', 'Mecklenburg-Vorpommern', '12'),
  ('SN', 'Sachsen', '13'),
  ('ST', 'Sachsen-Anhalt', '14'),
  ('TH', 'Thüringen', '15'),
  ('BE', 'Berlin', '16');

create table public.artists (
  id uuid primary key default gen_random_uuid(),
  mbid text unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.cities (
  id uuid primary key default gen_random_uuid(),
  geonames_id text unique,
  name text not null,
  country_code text not null,
  state_code text references public.states (code),
  lat double precision,
  lng double precision
);

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  setlistfm_id text unique,
  name text not null,
  city_id uuid not null references public.cities (id)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  setlistfm_id text unique,
  artist_id uuid not null references public.artists (id),
  venue_id uuid not null references public.venues (id),
  date date not null,
  tour_name text,
  -- Song titles in order, as reported by setlist.fm. Empty when unknown.
  songs text[] not null default '{}',
  setlistfm_url text,
  created_at timestamptz not null default now()
);

create index events_artist_date_idx on public.events (artist_id, date desc);

do $$
declare t text;
begin
  foreach t in array array['states', 'artists', 'cities', 'venues', 'events'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "reference data is readable by signed-in users" on public.%I for select to authenticated using (true)',
      t
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Attendances: "I was there" (past) or "I'm going" (future)
-- ---------------------------------------------------------------------------

create table public.attendances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  event_id uuid not null references public.events (id),
  rating smallint check (rating between 1 and 5),
  notes text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, event_id)
);

create index attendances_user_idx on public.attendances (user_id);

alter table public.attendances enable row level security;

create policy "users read their own attendances"
  on public.attendances for select to authenticated using (user_id = auth.uid());

create policy "users add their own attendances"
  on public.attendances for insert to authenticated with check (user_id = auth.uid());

create policy "users update their own attendances"
  on public.attendances for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "users delete their own attendances"
  on public.attendances for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Stats: the single place where counting rules live. The client only renders.
-- Only shows that already happened count.
-- ---------------------------------------------------------------------------

create function public.my_stats(p_year int default null) returns jsonb
language sql stable security invoker set search_path = '' as $$
  with all_mine as (
    select e.id, e.date, e.artist_id, e.venue_id, v.city_id, c.state_code, a.name as artist_name
    from public.attendances at
    join public.events e on e.id = at.event_id
    join public.artists a on a.id = e.artist_id
    join public.venues v on v.id = e.venue_id
    join public.cities c on c.id = v.city_id
    where at.user_id = auth.uid()
      and e.date <= current_date
  ),
  mine as (
    select * from all_mine
    where p_year is null or extract(year from date) = p_year
  )
  select jsonb_build_object(
    'shows', (select count(*) from mine),
    'cities', (select count(distinct city_id) from mine),
    'venues', (select count(distinct venue_id) from mine),
    'states', coalesce(
      (select jsonb_agg(distinct state_code) from mine where state_code is not null),
      '[]'::jsonb
    ),
    'top_artists', coalesce(
      (select jsonb_agg(t) from (
        select artist_name as name, count(*) as count
        from mine group by artist_id, artist_name
        order by count(*) desc, artist_name
        limit 5
      ) t),
      '[]'::jsonb
    ),
    'years', coalesce(
      (select jsonb_agg(y order by y desc) from (
        select distinct extract(year from date)::int as y from all_mine
      ) ys),
      '[]'::jsonb
    )
  );
$$;

-- Small facts shown on a show's detail page ("your show #47", "6th time
-- Kraftklub"). Counted here, next to my_stats, so the rules live in one place.
create function public.show_facts(p_event_id uuid) returns jsonb
language sql stable security invoker set search_path = '' as $$
  with target as (
    select e.date, e.artist_id, v.city_id
    from public.events e join public.venues v on v.id = e.venue_id
    where e.id = p_event_id
  ),
  mine as (
    select e.id, e.date, e.artist_id, v.city_id
    from public.attendances at
    join public.events e on e.id = at.event_id
    join public.venues v on v.id = e.venue_id
    where at.user_id = auth.uid()
  )
  select jsonb_build_object(
    'show_number', (select count(*) from mine, target where mine.date <= target.date),
    'artist_count', (select count(*) from mine, target where mine.artist_id = target.artist_id and mine.date <= target.date),
    'city_count', (select count(*) from mine, target where mine.city_id = target.city_id and mine.date <= target.date)
  );
$$;
