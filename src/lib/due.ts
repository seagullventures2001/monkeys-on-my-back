// Optional due dates. Most monkeys never have one; the few that do jump the queue
// as the date gets close. Dates are stored as plain calendar days ("2026-10-24"),
// so "due Saturday" means Saturday wherever you are.

/** A monkey counts as "due soon" within this many days (or once it is overdue). */
export const DUE_SOON_DAYS = 7

/** The weekend nudge switches to a dated job this many days out. */
export const DUE_NUDGE_DAYS = 3

function localDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

export function parseDay(dueOn: string): Date {
  const [y, m, d] = dueOn.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** "2026-10-24" for a Date, in local time (what <input type="date"> expects). */
export function toDayString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Whole days from today until the due date: 0 = today, 1 = tomorrow, -2 = two days late. */
export function daysUntil(dueOn: string, now: Date = new Date()): number {
  return Math.round((localDay(parseDay(dueOn)) - localDay(now)) / 86400000)
}

export function isDueSoon(dueOn: string | null | undefined, now: Date = new Date()): boolean {
  return !!dueOn && daysUntil(dueOn, now) <= DUE_SOON_DAYS
}

const weekday = (d: Date, style: 'short' | 'long') => d.toLocaleDateString('en-AU', { weekday: style })
const dayMonth = (d: Date) => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })

/** Short tag for the tree: "Late", "Today", "Tmrw", "Sat", "24 Oct". */
export function dueTag(dueOn: string, now: Date = new Date()): string {
  const n = daysUntil(dueOn, now)
  if (n < 0) return 'Late'
  if (n === 0) return 'Today'
  if (n === 1) return 'Tmrw'
  if (n < 7) return weekday(parseDay(dueOn), 'short')
  return dayMonth(parseDay(dueOn))
}

/** Readable label: "Overdue by 2 days", "Due today", "Due tomorrow", "Due Saturday", "Due 24 Oct". */
export function dueLabel(dueOn: string, now: Date = new Date()): string {
  const n = daysUntil(dueOn, now)
  if (n === -1) return 'Was due yesterday'
  if (n < 0) return `Overdue by ${-n} days`
  if (n === 0) return 'Due today'
  if (n === 1) return 'Due tomorrow'
  if (n < 7) return `Due ${weekday(parseDay(dueOn), 'long')}`
  return `Due ${dayMonth(parseDay(dueOn))}`
}

/** The coming Saturday (today if it is Saturday). A sensible default for a new due date. */
export function nextSaturday(now: Date = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7))
  return toDayString(d)
}
