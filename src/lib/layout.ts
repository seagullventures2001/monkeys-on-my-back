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
]

/** Monkeys are drawn as a 100 x 130 figure (head + small body) and sit at y = 116 of it. */
export const FIGURE_RATIO = 130 / 100
const SIT_Y = 116 / 130

/** The most monkeys shown on the tree at once. The rest wait in a list. */
export const MAX_SEATS = SEATS.length

/**
 * Splits monkeys into the ones on the tree and the ones waiting off it.
 * Oldest (the jobs dragging on longest) get the tree; newer ones wait.
 */
export function splitTroop<T extends { createdAt: string }>(monkeys: T[]): { onTree: T[]; waiting: T[] } {
  const sorted = [...monkeys].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  return { onTree: sorted.slice(0, MAX_SEATS), waiting: sorted.slice(MAX_SEATS) }
}

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
    const height = size * FIGURE_RATIO
    return {
      monkey,
      size,
      left: ((seat.cx - size / 2) / TREE_W) * 100,
      top: ((seat.y - height * SIT_Y + 2) / TREE_H) * 100,
      width: (size / TREE_W) * 100,
    }
  })
  return { placed, overflow: Math.max(0, sorted.length - SEATS.length) }
}
