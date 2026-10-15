import { byAge, growth, type Monkey } from './monkey'

/** The tree is drawn in a 358 x 380 box; everything is converted to % so it scales. */
export const TREE_W = 358
export const TREE_H = 380

/** Seats on the branches, best (top of the tree) first. cx = centre, y = where the monkey's bottom sits. */
const SEATS: { cx: number; y: number }[] = [
  { cx: 240, y: 110 },
  { cx: 112, y: 140 },
  { cx: 296, y: 200 },
  { cx: 72, y: 250 },
  { cx: 214, y: 200 },
  { cx: 140, y: 250 },
  { cx: 288, y: 300 },
  { cx: 235, y: 300 },
  { cx: 104, y: 374 },
  { cx: 262, y: 374 },
]

export const MAX_SEATS = SEATS.length

export interface PlacedMonkey {
  monkey: Monkey
  /** CSS percentages relative to the tree box. */
  left: number
  top: number
  width: number
  /** In tree units, handy for tests. */
  size: number
}

export function monkeySize(m: Monkey, now: Date): number {
  return Math.round(46 + growth(m.createdAt, now) * 40)
}

/**
 * Oldest monkeys get the top seats so the job that has been dragging longest is
 * the first thing you see. Anything past the last seat is reported as overflow.
 */
export function placeMonkeys(
  monkeys: Monkey[],
  now: Date = new Date(),
): { placed: PlacedMonkey[]; overflow: number } {
  const sorted = [...monkeys].sort(byAge)
  const placed = sorted.slice(0, SEATS.length).map((monkey, i) => {
    const seat = SEATS[i]
    const size = monkeySize(monkey, now)
    return {
      monkey,
      size,
      left: ((seat.cx - size / 2) / TREE_W) * 100,
      top: ((seat.y - size + 4) / TREE_H) * 100,
      width: (size / TREE_W) * 100,
    }
  })
  return { placed, overflow: Math.max(0, sorted.length - SEATS.length) }
}
