// Morning reminder preferences, and the plan of what to send when.
// The plan is pure (no device APIs) so it can be tested; notifications.ts hands it
// to the phone. On the web nothing is sent yet; that needs a small push server later.
import { isOnBack, type Monkey } from './monkey'
import { pickNudge } from './nudge'
import { parseDay } from './due'

export type Frequency = 'off' | 'weekends' | 'daily'

export interface ReminderPrefs {
  frequency: Frequency
  /** "08:00" */
  time: string
  /** A reminder on the morning a monkey is due. */
  dueDates: boolean
}

export const DEFAULT_PREFS: ReminderPrefs = { frequency: 'weekends', time: '08:00', dueDates: true }

const KEY = 'momb.reminders.v1'

export function loadPrefs(): ReminderPrefs {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<ReminderPrefs>) } : { ...DEFAULT_PREFS }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

export function savePrefs(prefs: ReminderPrefs): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs))
  } catch {
    // Not saved; defaults apply next time.
  }
}

/** One notification to schedule. `weekday` repeats every week (1 = Sunday … 7 = Saturday); `at` fires once. */
export interface PlannedReminder {
  id: number
  title: string
  body: string
  hour: number
  minute: number
  weekday?: number
  at?: Date
}

export const RECURRING_IDS = [1001, 1002, 1003, 1004, 1005, 1006, 1007]
export const DUE_ID_BASE = 2000
const MAX_DUE = 40
const DUE_WINDOW_DAYS = 60

function parseTime(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(':').map(Number)
  return { hour: Number.isFinite(h) ? h : 8, minute: Number.isFinite(m) ? m : 0 }
}

/** The next date (from now) that falls on a JS weekday (0 = Sunday) at the given time. */
function nextOn(jsDay: number, hour: number, minute: number, now: Date): Date {
  const d = new Date(now)
  d.setHours(hour, minute, 0, 0)
  let add = (jsDay - d.getDay() + 7) % 7
  if (add === 0 && d <= now) add = 7
  d.setDate(d.getDate() + add)
  return d
}

export function planReminders(monkeys: Monkey[], prefs: ReminderPrefs, now: Date = new Date()): PlannedReminder[] {
  const plan: PlannedReminder[] = []
  const { hour, minute } = parseTime(prefs.time)
  const waiting = monkeys.filter(isOnBack)

  // Recurring morning nudges, each naming a real monkey that suits that day.
  const days = prefs.frequency === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : prefs.frequency === 'weekends' ? [6, 0] : []
  for (const jsDay of days) {
    const nudge = pickNudge(waiting, nextOn(jsDay, hour, minute, now))
    if (!nudge) continue
    plan.push({
      id: RECURRING_IDS[jsDay],
      title: nudge.headline,
      body: nudge.body,
      hour,
      minute,
      weekday: jsDay + 1,
    })
  }

  // One-off reminders on the morning each dated monkey is due.
  if (prefs.dueDates) {
    const horizon = now.getTime() + DUE_WINDOW_DAYS * 86400000
    const dated = waiting
      .filter((m) => m.dueOn)
      .map((m) => {
        const at = parseDay(m.dueOn!)
        at.setHours(hour, minute, 0, 0)
        return { m, at }
      })
      .filter(({ at }) => at.getTime() > now.getTime() && at.getTime() <= horizon)
      .sort((a, b) => a.at.getTime() - b.at.getTime())
      .slice(0, MAX_DUE)
    dated.forEach(({ m, at }, i) =>
      plan.push({
        id: DUE_ID_BASE + i,
        title: 'Due today',
        body: `“${m.title}” is due today. Time to feed that monkey a banana?`,
        hour,
        minute,
        at,
      }),
    )
  }

  return plan
}
