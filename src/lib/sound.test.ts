import { describe, expect, it } from 'vitest'
import { CELEBRATION_SOUNDS } from './sound'

describe('celebration sound plan', () => {
  it('fits inside the 4.3 second celebration', () => {
    for (const s of CELEBRATION_SOUNDS) {
      expect(s.at).toBeGreaterThanOrEqual(0)
      expect(s.at).toBeLessThanOrEqual(4300)
    }
  })

  it('has the tune start with the streamers and four munches for four bites', () => {
    const fanfare = CELEBRATION_SOUNDS.find((s) => s.sound === 'fanfare')
    const pop = CELEBRATION_SOUNDS.find((s) => s.sound === 'pop')
    expect(fanfare?.at).toBe(pop?.at)
    expect(CELEBRATION_SOUNDS.filter((s) => s.sound === 'munch')).toHaveLength(4)
  })
})
