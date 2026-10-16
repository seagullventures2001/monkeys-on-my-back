import { describe, expect, it } from 'vitest'
import { countLabel, formatAge, growth, moodFor, type Monkey } from './monkey'
import { placeMonkeys, splitTroop, MAX_SEATS } from './layout'

const now = new Date('2026-10-17T09:00:00+10:00') // a Saturday morning in Brisbane

function daysAgo(days: number): string {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
}

function monkey(id: string, days: number, extra: Partial<Monkey> = {}): Monkey {
  return {
    id,
    troopId: 't',
    title: id,
    notes: null,
    effort: 'hour',
    createdAt: daysAgo(days),
    fedAt: null,
    dueOn: null,
    ...extra,
  }
}

describe('formatAge', () => {
  it('reads naturally across ranges', () => {
    expect(formatAge(daysAgo(0), now)).toBe('today')
    expect(formatAge(daysAgo(1), now)).toBe('1 day')
    expect(formatAge(daysAgo(9), now)).toBe('9 days')
    expect(formatAge(daysAgo(42), now)).toBe('6 weeks')
    expect(formatAge(daysAgo(60), now)).toBe('8 weeks')
    expect(formatAge(daysAgo(63), now)).toBe('2 months')
    expect(formatAge(daysAgo(152), now)).toBe('4 months')
    expect(formatAge(daysAgo(400), now)).toBe('1 year')
    expect(formatAge(daysAgo(800), now)).toBe('2 years')
  })
})

describe('moodFor', () => {
  it('gets sadder with age', () => {
    expect(moodFor(daysAgo(7), now)).toBe(0)
    expect(moodFor(daysAgo(21), now)).toBe(1)
    expect(moodFor(daysAgo(42), now)).toBe(2)
    expect(moodFor(daysAgo(120), now)).toBe(3)
  })
})

describe('growth', () => {
  it('starts at 0, increases, and caps at 1', () => {
    expect(growth(daysAgo(0), now)).toBe(0)
    expect(growth(daysAgo(42), now)).toBeGreaterThan(growth(daysAgo(7), now))
    expect(growth(daysAgo(200), now)).toBe(1)
    expect(growth(daysAgo(900), now)).toBe(1)
  })
})

describe('countLabel', () => {
  it('handles singular and zero', () => {
    expect(countLabel(0)).toBe('No monkeys yet')
    expect(countLabel(0, true)).toBe('No monkeys left')
    expect(countLabel(1)).toBe('1 monkey on your back')
    expect(countLabel(4)).toBe('4 monkeys on your back')
  })
})

describe('placeMonkeys', () => {
  it('puts the oldest monkey in the top seat, biggest', () => {
    const { placed } = placeMonkeys([monkey('new', 2), monkey('old', 180), monkey('mid', 40)], now)
    expect(placed.map((p) => p.monkey.id)).toEqual(['old', 'mid', 'new'])
    expect(placed[0].size).toBeGreaterThan(placed[2].size)
  })

  it('reports overflow beyond the available seats', () => {
    const many = Array.from({ length: MAX_SEATS + 3 }, (_, i) => monkey(`m${i}`, i))
    const { placed, overflow } = placeMonkeys(many, now)
    expect(placed).toHaveLength(MAX_SEATS)
    expect(overflow).toBe(3)
  })

  it('caps the tree at 8 and sends the newest to the waiting list', () => {
    const many = Array.from({ length: 11 }, (_, i) => monkey(`m${i}`, 100 - i))
    const { onTree, waiting } = splitTroop(many)
    expect(MAX_SEATS).toBe(8)
    expect(onTree.map((m) => m.id)).toEqual(['m0', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'])
    expect(waiting.map((m) => m.id)).toEqual(['m8', 'm9', 'm10'])
  })

  it('keeps every monkey inside the tree box', () => {
    const many = Array.from({ length: MAX_SEATS }, (_, i) => monkey(`m${i}`, 300 - i))
    for (const p of placeMonkeys(many, now).placed) {
      expect(p.left).toBeGreaterThanOrEqual(0)
      expect(p.top).toBeGreaterThanOrEqual(0)
      expect(p.left + p.width).toBeLessThanOrEqual(100)
    }
  })

  it('gives jobs due within a week the top seats, soonest first', () => {
    const list = [
      monkey('old', 200),
      monkey('dueSoon', 1, { dueOn: '2026-10-20' }),
      monkey('dueSooner', 1, { dueOn: '2026-10-18' }),
      monkey('dueLater', 1, { dueOn: '2026-12-25' }),
    ]
    const { placed } = placeMonkeys(list, now)
    expect(placed.map((p) => p.monkey.id)).toEqual(['dueSooner', 'dueSoon', 'old', 'dueLater'])
  })
})
