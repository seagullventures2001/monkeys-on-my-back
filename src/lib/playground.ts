// Where each fed monkey hangs out on the Troop playground, and what it is up to.
// Pure functions (no DOM), so the layout is easy to test.
import type { Monkey } from './monkey'

export type Activity = 'eat' | 'wave' | 'nap' | 'swing' | 'stroll' | 'bounce'

/** The playground is a row of tree "segments", each this wide, side by side. */
export const SEGMENT_W = 320
export const SCENE_H = 440
export const GROUND_Y = 414

/** The most monkeys drawn at once (newest first); the rest are counted in the list view. */
export const MAX_PLAYGROUND = 70

type SpotKind = 'branch' | 'hang' | 'ground'

/**
 * Spots in one segment, in fill order. x is the monkey's centre; y is where it sits
 * (branch top), where its hands grip (hang), or where its feet touch the ground.
 * Matches the tree drawn in TroopPlayground.vue.
 */
export const SPOTS: { x: number; y: number; kind: SpotKind }[] = [
  { x: 236, y: 150, kind: 'branch' },
  { x: 92, y: 180, kind: 'branch' },
  { x: 66, y: GROUND_Y, kind: 'ground' },
  { x: 104, y: 268, kind: 'branch' },
  { x: 272, y: 254, kind: 'hang' },
  { x: 244, y: GROUND_Y, kind: 'ground' },
  { x: 204, y: 250, kind: 'branch' },
]

export const PER_SEGMENT = SPOTS.length

export interface PlaygroundMonkey {
  monkey: Monkey
  kind: SpotKind
  activity: Activity
  /** Centre x and anchor y in scene pixels. */
  x: number
  y: number
  /** Width in pixels (the figure is 1.3x as tall). */
  size: number
  /** Negative delay so monkeys start mid-animation and don't move in sync. */
  delay: number
  duration: number
}

export interface Playground {
  width: number
  segments: number
  monkeys: PlaygroundMonkey[]
  hidden: number
}

/** Small stable hash so each monkey always gets the same spot style and timing. */
export function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0
  return h
}

const BY_KIND: Record<SpotKind, Activity[]> = {
  branch: ['eat', 'wave', 'nap', 'eat'],
  hang: ['swing'],
  ground: ['stroll', 'bounce', 'eat'],
}

export function placeTroop(fed: Monkey[]): Playground {
  const shown = fed.slice(0, MAX_PLAYGROUND)
  const segments = Math.max(1, Math.ceil(shown.length / PER_SEGMENT))
  const monkeys = shown.map((monkey, i) => {
    const seg = Math.floor(i / PER_SEGMENT)
    const spot = SPOTS[i % PER_SEGMENT]
    const h = hash(monkey.id)
    const options = BY_KIND[spot.kind]
    const activity = options[h % options.length]
    return {
      monkey,
      kind: spot.kind,
      activity,
      x: seg * SEGMENT_W + spot.x,
      y: spot.y,
      size: 54 + (h % 9),
      delay: -((h >>> 8) % 1000) / 250,
      duration: 1.6 + ((h >>> 16) % 7) / 10,
    }
  })
  return { width: segments * SEGMENT_W, segments, monkeys, hidden: Math.max(0, fed.length - shown.length) }
}

/** "3 days", "6 weeks", "4 months": how long a job hung around before it was fed. */
export function waited(createdAt: string, fedAt: string): string {
  const days = Math.max(0, Math.round((new Date(fedAt).getTime() - new Date(createdAt).getTime()) / 86400000))
  if (days === 0) return 'the same day'
  if (days < 14) return days === 1 ? '1 day' : `${days} days`
  if (days < 63) return `${Math.floor(days / 7)} weeks`
  return `${Math.floor(days / 30.44)} months`
}

/** How many were fed in the current calendar month. */
export function fedThisMonth(fed: Monkey[], now: Date = new Date()): number {
  return fed.filter((m) => {
    const d = new Date(m.fedAt!)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }).length
}
