// Core monkey types and pure helpers. Nothing in here touches storage or the DOM,
// so it is easy to unit test (see monkey.test.ts).

import { daysUntil, isDueSoon } from './due'

export type Effort = 'quick' | 'hour' | 'half' | 'full' | 'ongoing'

export interface Monkey {
  id: string
  troopId: string
  title: string
  notes: string | null
  effort: Effort
  createdAt: string // ISO timestamp
  fedAt: string | null // ISO timestamp when the job was done, null while still on your back
  dueOn: string | null // optional calendar day ("2026-10-24"); most monkeys have none
}

export interface NewMonkey {
  title: string
  notes?: string | null
  effort: Effort
  /** Lets people back-date a job they have been putting off for a while. */
  createdAt?: string
  dueOn?: string | null
}

export const EFFORTS: { value: Effort; label: string; short: string }[] = [
  { value: 'quick', label: 'Quick, under 30 minutes', short: '15–30 min' },
  { value: 'hour', label: 'An hour or two', short: '1–2 hours' },
  { value: 'half', label: 'Half a day', short: 'Half day' },
  { value: 'full', label: 'A full day', short: 'Full day' },
  { value: 'ongoing', label: 'Ongoing, chip away at it', short: 'Ongoing' },
]

export function effortShort(effort: Effort): string {
  return EFFORTS.find((e) => e.value === effort)?.short ?? effort
}

const DAY_MS = 24 * 60 * 60 * 1000

export function ageInDays(createdAt: string, now: Date = new Date()): number {
  const diff = now.getTime() - new Date(createdAt).getTime()
  return Math.max(0, Math.floor(diff / DAY_MS))
}

export function ageInWeeks(createdAt: string, now: Date = new Date()): number {
  return ageInDays(createdAt, now) / 7
}

/** "today", "3 days", "6 weeks", "5 months", "1 year" */
export function formatAge(createdAt: string, now: Date = new Date()): string {
  const days = ageInDays(createdAt, now)
  if (days === 0) return 'today'
  if (days < 14) return days === 1 ? '1 day' : `${days} days`
  const weeks = Math.floor(days / 7)
  if (days < 63) return `${weeks} weeks` // up to 8 weeks, so we never say "1 months"
  const months = Math.floor(days / 30.44)
  if (months < 12) return `${months} months`
  const years = Math.floor(days / 365.25)
  return years === 1 ? '1 year' : `${years} years`
}

/** 0 = very happy, 1 = happy, 2 = stressed, 3 = crying. Drives the face. */
export type Mood = 0 | 1 | 2 | 3

export function moodFor(createdAt: string, now: Date = new Date()): Mood {
  const weeks = ageInWeeks(createdAt, now)
  if (weeks < 2) return 0
  if (weeks < 6) return 1
  if (weeks < 12) return 2
  return 3
}

/**
 * How big a monkey is drawn, from 0 (brand new) to 1 (been there half a year or more).
 * Grows quickly at first then levels off, so a 6-month job is clearly bigger than a
 * 6-week one without the old ones taking over the whole tree.
 */
export function growth(createdAt: string, now: Date = new Date()): number {
  const weeks = ageInWeeks(createdAt, now)
  const capped = Math.min(weeks, 26)
  return Math.log1p(capped) / Math.log1p(26)
}

export function isOnBack(m: Monkey): boolean {
  return m.fedAt === null
}

/** Oldest first. */
export function byAge(a: Monkey, b: Monkey): number {
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
}

/**
 * Tree order: anything due within a week (or overdue) comes first, soonest first;
 * everything else follows, oldest first.
 */
export function byPriority(now: Date = new Date()): (a: Monkey, b: Monkey) => number {
  return (a, b) => {
    const aSoon = isDueSoon(a.dueOn, now)
    const bSoon = isDueSoon(b.dueOn, now)
    if (aSoon && bSoon) return daysUntil(a.dueOn!, now) - daysUntil(b.dueOn!, now) || byAge(a, b)
    if (aSoon) return -1
    if (bSoon) return 1
    return byAge(a, b)
  }
}

/**
 * @param n monkeys currently on your back
 * @param anyFed whether you have ever fed one (tells a brand-new tree from a cleared one)
 */
export function countLabel(n: number, anyFed = false): string {
  if (n === 0) return anyFed ? 'No monkeys left' : 'No monkeys yet'
  return n === 1 ? '1 monkey on your back' : `${n} monkeys on your back`
}
