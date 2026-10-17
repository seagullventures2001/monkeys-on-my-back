import { describe, expect, it } from 'vitest'
import { DEFAULT_PREFS, planReminders, type ReminderPrefs } from './reminders'
import type { Monkey } from './monkey'

// Local-time dates so the tests hold in any timezone. Thu 15 Oct 2026, 9pm.
const now = new Date(2026, 9, 15, 21, 0)

function monkey(id: string, daysAgo: number, dueOn: string | null = null, fed = false): Monkey {
  return {
    id,
    troopId: 't',
    title: id,
    notes: null,
    effort: 'hour',
    createdAt: new Date(now.getTime() - daysAgo * 86400000).toISOString(),
    fedAt: fed ? now.toISOString() : null,
    dueOn,
  }
}

const troop = [monkey('bbq', 42), monkey('gate', 7)]

describe('planReminders', () => {
  it('defaults to Saturday and Sunday mornings at 8', () => {
    const plan = planReminders(troop, { ...DEFAULT_PREFS, dueDates: false }, now)
    expect(plan.map((r) => r.weekday).sort()).toEqual([1, 7])
    expect(plan.every((r) => r.hour === 8 && r.minute === 0)).toBe(true)
  })

  it('sends one every day when asked, at the chosen time', () => {
    const prefs: ReminderPrefs = { frequency: 'daily', time: '06:30', dueDates: false }
    const plan = planReminders(troop, prefs, now)
    expect(plan).toHaveLength(7)
    expect(plan[0].hour).toBe(6)
    expect(plan[0].minute).toBe(30)
  })

  it('sends nothing recurring when off, or when nothing is on your back', () => {
    expect(planReminders(troop, { frequency: 'off', time: '08:00', dueDates: false }, now)).toHaveLength(0)
    expect(planReminders([monkey('done', 3, null, true)], DEFAULT_PREFS, now)).toHaveLength(0)
  })

  it('adds a one-off reminder on the morning a monkey is due', () => {
    const plan = planReminders([monkey('mow', 2, '2026-10-17')], { frequency: 'off', time: '07:00', dueDates: true }, now)
    expect(plan).toHaveLength(1)
    expect(plan[0].at?.getDate()).toBe(17)
    expect(plan[0].at?.getHours()).toBe(7)
    expect(plan[0].body).toContain('mow')
  })

  it('skips due dates that have passed or are too far away', () => {
    const list = [monkey('late', 2, '2026-10-10'), monkey('far', 2, '2027-06-01')]
    expect(planReminders(list, { frequency: 'off', time: '08:00', dueDates: true }, now)).toHaveLength(0)
  })
})
