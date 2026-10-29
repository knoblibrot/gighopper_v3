import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { db } from '../lib/supabase'
import type { Attendance, FoundArtist, SearchPage, ShowFacts, Stats } from '../lib/types'

const ATTENDANCE_SELECT = `
  id, rating, notes,
  event:events (
    id, date, tour_name, songs, setlistfm_url,
    artist:artists ( id, name ),
    venue:venues ( id, name, city:cities ( name, state_code ) )
  )
`

export const keys = {
  diary: ['diary'] as const,
  attendance: (id: string) => ['attendance', id] as const,
  facts: (eventId: string) => ['facts', eventId] as const,
  stats: (year: number | null) => ['stats', year] as const,
  artists: (query: string) => ['artists', query] as const,
  shows: (mbid: string) => ['shows', mbid] as const,
}

export function useDiary() {
  return useQuery({
    queryKey: keys.diary,
    queryFn: async () => {
      const { data, error } = await db().from('attendances').select(ATTENDANCE_SELECT)
      if (error) throw error
      return data as unknown as Attendance[]
    },
  })
}

export function useAttendance(id: string) {
  return useQuery({
    queryKey: keys.attendance(id),
    queryFn: async () => {
      const { data, error } = await db().from('attendances').select(ATTENDANCE_SELECT).eq('id', id).single()
      if (error) throw error
      return data as unknown as Attendance
    },
  })
}

export function useShowFacts(eventId: string | undefined) {
  return useQuery({
    queryKey: keys.facts(eventId ?? ''),
    enabled: Boolean(eventId),
    queryFn: async () => {
      const { data, error } = await db().rpc('show_facts', { p_event_id: eventId })
      if (error) throw error
      return data as ShowFacts
    },
  })
}

export function useStats(year: number | null) {
  return useQuery({
    queryKey: keys.stats(year),
    queryFn: async () => {
      const { data, error } = await db().rpc('my_stats', { p_year: year })
      if (error) throw error
      return data as Stats
    },
  })
}

export class RateLimitedError extends Error {}

async function setlistSearch<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error, response } = await db().functions.invoke<T>('setlist-search', { body })
  if (response?.status === 429) throw new RateLimitedError()
  if (error) throw error
  return data!
}

// Step one of adding shows: which artist is meant.
export function useArtistSearch(query: string) {
  return useQuery({
    queryKey: keys.artists(query),
    enabled: query.length >= 2,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => (await setlistSearch<{ artists: FoundArtist[] }>({ artist: query })).artists,
  })
}

// Step two: that artist's shows in Germany, by MusicBrainz id.
export function useShowSearch(mbid: string | undefined) {
  return useInfiniteQuery({
    queryKey: keys.shows(mbid ?? ''),
    enabled: Boolean(mbid),
    initialPageParam: 1,
    staleTime: 10 * 60 * 1000,
    queryFn: ({ pageParam }) => setlistSearch<SearchPage>({ mbid, page: pageParam }),
    getNextPageParam: (last) => (last.page * last.perPage < last.total ? last.page + 1 : undefined),
  })
}

// Every write that changes the diary goes through here, so counts and stats
// never go stale on another screen.
function useInvalidateDiary() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: keys.diary }),
      queryClient.invalidateQueries({ queryKey: ['stats'] }),
      queryClient.invalidateQueries({ queryKey: ['facts'] }),
    ])
}

export function useLogShows() {
  const invalidate = useInvalidateDiary()
  return useMutation({
    mutationFn: async (eventIds: string[]) => {
      const { error } = await db()
        .from('attendances')
        .upsert(eventIds.map((event_id) => ({ event_id })), { onConflict: 'user_id,event_id', ignoreDuplicates: true })
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useUpdateAttendance(id: string) {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateDiary()
  return useMutation({
    mutationFn: async (patch: Partial<Pick<Attendance, 'rating' | 'notes'>>) => {
      const { error } = await db().from('attendances').update(patch).eq('id', id)
      if (error) throw error
    },
    // Optimistic: the star lights up immediately.
    onMutate: (patch) => {
      queryClient.setQueryData<Attendance>(keys.attendance(id), (old) => (old ? { ...old, ...patch } : old))
    },
    onSettled: invalidate,
  })
}

export function useRemoveAttendance() {
  const invalidate = useInvalidateDiary()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db().from('attendances').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}
