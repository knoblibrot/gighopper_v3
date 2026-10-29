import { describe, expect, it } from 'vitest'
import { isOtherArtist } from './search'

describe('isOtherArtist', () => {
  it('treats the searched artist as the same, ignoring case, accents and spaces', () => {
    expect(isOtherArtist('Kraftklub', 'Kraftklub')).toBe(false)
    expect(isOtherArtist('kraftklub ', 'Kraftklub')).toBe(false)
    expect(isOtherArtist('die arzte', 'Die Ärzte')).toBe(false)
  })

  it('flags similarly named artists', () => {
    expect(isOtherArtist('Die Ärzte', 'Die Toten Ärzte')).toBe(true)
    expect(isOtherArtist('Kraft', 'DJ Kraft')).toBe(true)
  })
})
