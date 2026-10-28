# Gighopper

Dein Konzert-Tagebuch: trag ein, wo du warst, und sieh, was daraus wird.

A mobile-first PWA for logging the concerts you've been to. German first,
built to add languages later.

## Stack

- React + TypeScript + Vite, React Router, TanStack Query, Tailwind CSS
- Supabase: Postgres with row level security, email login, edge functions
- setlist.fm as the source for past (and announced) shows
- i18next, German strings in `src/i18n/de.json`

## How it fits together

- **Reference data is anchored on external ids.** Artists (MusicBrainz id),
  cities (GeoNames id), venues and events (setlist.fm ids) are written only by
  the `setlist-search` edge function. No fuzzy text matching.
- **Attendances are the user's own data.** One row per "I was there" /
  "I'm going", guarded by RLS.
- **Counting rules live in SQL.** `my_stats()` and `show_facts()` in the
  migration are the only place that decides what counts. The client renders.
- **Design tokens** for direction A ("Abriss") are in `src/index.css`. A dark
  theme means redefining those variables, not touching components.

## Setup

1. Create a Supabase project and copy `.env.example` to `.env.local` with its
   URL and anon key.
2. Get a setlist.fm API key at https://www.setlist.fm/settings/api.
3. With the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase link --project-ref <your-project-ref>
```

```bash
supabase db push
```

```bash
supabase secrets set SETLISTFM_API_KEY=<key> ALLOWED_ORIGINS=http://localhost:5173
```

```bash
supabase functions deploy setlist-search
```

4. In Supabase → Authentication → URL Configuration, add your app URL
   (e.g. `http://localhost:5173`) to the redirect URLs for the login link.

## Development

```bash
npm install
```

```bash
npm run dev
```

```bash
npm test
```

## Next up

- Friends and "wer war noch da" on a show
- Share card ("Mein Konzertjahr") as an image
- Photos on a show
- Tour alerts with ticket links (Ticketmaster / Eventim affiliate) in "Für dich"
- Manual entry for shows setlist.fm doesn't know
