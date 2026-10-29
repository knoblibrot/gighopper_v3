// setlist.fm matches artist names loosely: "Die Ärzte" also returns the tribute
// band "Die Toten Ärzte". Result rows name the artist whenever it isn't the one
// searched for, ignoring case and accents.
export function isOtherArtist(query: string, artistName: string): boolean {
  return query.trim().localeCompare(artistName.trim(), 'de', { sensitivity: 'base' }) !== 0
}
