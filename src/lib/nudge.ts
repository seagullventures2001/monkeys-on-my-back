import { byAge, formatAge, isOnBack, type Effort, type Monkey } from './monkey'

export interface Nudge {
  monkey: Monkey
  headline: string
  body: string
}

/**
 * Which jobs realistically fit into the next free pocket of time.
 * Weeknights are short; weekends can take bigger jobs.
 */
export function fitsFor(now: Date): { when: string; efforts: Effort[] } {
  const day = now.getDay() // 0 Sun ... 6 Sat
  const hour = now.getHours()

  if (day === 6 || day === 0) {
    const today = day === 6 ? 'Saturday' : 'Sunday'
    if (hour < 12) return { when: `Free ${today} morning?`, efforts: ['quick', 'hour', 'half'] }
    if (hour < 17) return { when: `Spare ${today} afternoon?`, efforts: ['quick', 'hour', 'half'] }
    return { when: 'Ten minutes tonight?', efforts: ['quick'] }
  }

  if (day === 5 && hour >= 12) {
    return { when: 'Free Saturday morning?', efforts: ['quick', 'hour', 'half'] }
  }

  if (hour >= 17) return { when: 'Ten minutes tonight?', efforts: ['quick'] }
  return { when: 'Got a spare moment?', efforts: ['quick'] }
}

/**
 * Picks the oldest monkey that fits the next free pocket of time.
 * Ongoing jobs (like a course) get nudged on their own only if nothing else fits,
 * and full-day jobs only show up when nothing smaller is waiting.
 */
export function pickNudge(monkeys: Monkey[], now: Date = new Date()): Nudge | null {
  const waiting = monkeys.filter(isOnBack).sort(byAge)
  if (waiting.length === 0) return null

  const { when, efforts } = fitsFor(now)
  const fitting = waiting.find((m) => efforts.includes(m.effort))
  const fallback = waiting.find((m) => m.effort === 'ongoing') ?? null
  const pick = fitting ?? fallback

  if (!pick) {
    const biggest = waiting[0]
    return {
      monkey: biggest,
      headline: 'Plan a big one',
      body: `“${biggest.title}” has been on your back for ${formatAge(biggest.createdAt, now)}. Worth blocking out a day for it?`,
    }
  }

  if (pick.effort === 'ongoing') {
    return {
      monkey: pick,
      headline: when,
      body: `Chip away at “${pick.title}”. It has been hanging around for ${formatAge(pick.createdAt, now)}.`,
    }
  }

  return {
    monkey: pick,
    headline: when,
    body: `“${pick.title}” has been on your back for ${formatAge(pick.createdAt, now)}, and it is only ${effortPhrase(pick.effort)}.`,
  }
}

function effortPhrase(effort: Effort): string {
  switch (effort) {
    case 'quick':
      return 'a quick job'
    case 'hour':
      return 'an hour or two'
    case 'half':
      return 'half a day'
    case 'full':
      return 'a full day'
    case 'ongoing':
      return 'an ongoing one'
  }
}
