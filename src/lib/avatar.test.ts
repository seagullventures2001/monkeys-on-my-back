import { describe, expect, it } from 'vitest'
import { defaultAvatar, normalizeAvatar, shade, withBody } from './avatar'

describe('avatar', () => {
  it('has a sensible default for each body', () => {
    expect(defaultAvatar('male').hair).toBe('short')
    expect(defaultAvatar('female').hair).toBe('long')
  })

  it('switching body picks a hair style from that list but keeps the rest', () => {
    const a = { ...defaultAvatar('male'), skin: 'deep', topColor: 'navy' }
    const b = withBody(a, 'female')
    expect(b.body).toBe('female')
    expect(b.hair).toBe('long')
    expect(b.skin).toBe('deep')
    expect(b.topColor).toBe('navy')
  })

  it('keeps a hair style that suits the new body', () => {
    const a = { ...defaultAvatar('female'), hair: 'bob' as const }
    expect(withBody(a, 'female').hair).toBe('bob')
  })

  it('returns null when nothing has been chosen', () => {
    expect(normalizeAvatar(null)).toBeNull()
    expect(normalizeAvatar({})).toBeNull()
    expect(normalizeAvatar('male')).toBeNull()
  })

  it('fills in missing or unknown items with defaults', () => {
    const a = normalizeAvatar({ body: 'female', hair: 'mohawk', feet: 'boots', topColor: 'glitter' })
    expect(a).toEqual({ ...defaultAvatar('female'), feet: 'boots' })
  })

  it('darkens colours', () => {
    expect(shade('#ffffff', 0.5)).toBe('#808080')
    expect(shade('#000000')).toBe('#000000')
  })
})
