import { describe, expect, it } from 'vitest'
import { MAX_PLAYGROUND, PER_SEGMENT, SEGMENT_W, fedThisMonth, placeTroop, waited } from './playground'
import { FACTS } from './facts'
import type { Monkey } from './monkey'

function fed(id: string, fedAt = '2026-10-10T00:00:00Z'): Monkey {
  return { id, troopId: 't', title: id, notes: null, effort: 'hour', createdAt: '2026-09-01T00:00:00Z', fedAt, dueOn: null }
}

describe('placeTroop', () => {
  it('always has a spare tree, even with no monkeys', () => {
    const p = placeTroop([])
    expect(p.segments).toBe(2)
    expect(p.width).toBe(2 * SEGMENT_W)
    expect(p.monkeys).toHaveLength(0)
  })

  it('adds a tree for every few monkeys, plus one spare', () => {
    const p = placeTroop(Array.from({ length: PER_SEGMENT + 1 }, (_, i) => fed(`m${i}`)))
    expect(p.segments).toBe(3)
    expect(p.monkeys[PER_SEGMENT].x).toBeGreaterThan(SEGMENT_W)
  })

  it('always fills the screen width', () => {
    const p = placeTroop([], 1000)
    expect(p.width).toBeGreaterThanOrEqual(1000)
  })

  it('gives a monkey the same spot style every time', () => {
    const a = placeTroop([fed('bbq')]).monkeys[0]
    const b = placeTroop([fed('bbq')]).monkeys[0]
    expect(a.activity).toBe(b.activity)
    expect(a.delay).toBe(b.delay)
  })

  it('makes hanging monkeys swing', () => {
    const p = placeTroop(Array.from({ length: PER_SEGMENT }, (_, i) => fed(`m${i}`)))
    for (const m of p.monkeys) if (m.kind === 'hang') expect(m.activity).toBe('swing')
  })

  it('caps how many are drawn and reports the rest', () => {
    const p = placeTroop(Array.from({ length: MAX_PLAYGROUND + 5 }, (_, i) => fed(`m${i}`)))
    expect(p.monkeys).toHaveLength(MAX_PLAYGROUND)
    expect(p.hidden).toBe(5)
  })

  it('keeps every monkey inside the scene', () => {
    const p = placeTroop(Array.from({ length: 30 }, (_, i) => fed(`m${i}`)))
    for (const m of p.monkeys) {
      expect(m.x - m.size / 2).toBeGreaterThanOrEqual(0)
      expect(m.x + m.size / 2).toBeLessThanOrEqual(p.width)
    }
  })
})

describe('waited', () => {
  it('reads naturally', () => {
    expect(waited('2026-10-01T00:00:00Z', '2026-10-01T05:00:00Z')).toBe('the same day')
    expect(waited('2026-10-01T00:00:00Z', '2026-10-04T00:00:00Z')).toBe('3 days')
    expect(waited('2026-08-01T00:00:00Z', '2026-09-12T00:00:00Z')).toBe('6 weeks')
    expect(waited('2026-05-01T00:00:00Z', '2026-10-01T00:00:00Z')).toBe('5 months')
  })
})

describe('fedThisMonth', () => {
  it('counts only this calendar month', () => {
    const now = new Date(2026, 9, 17)
    const list = [fed('a', new Date(2026, 9, 2).toISOString()), fed('b', new Date(2026, 8, 30).toISOString())]
    expect(fedThisMonth(list, now)).toBe(1)
  })
})

describe('facts', () => {
  it('has a good handful, no duplicates', () => {
    expect(FACTS.length).toBeGreaterThanOrEqual(10)
    expect(new Set(FACTS).size).toBe(FACTS.length)
  })
})
