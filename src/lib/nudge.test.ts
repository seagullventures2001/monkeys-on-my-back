import { describe, expect, it } from 'vitest'
import { fitsFor, pickNudge } from './nudge'
import type { Effort, Monkey } from './monkey'

function at(iso: string): Date {
  return new Date(iso)
}

function monkey(id: string, daysAgo: number, effort: Effort, now: Date, fed = false, dueOn: string | null = null): Monkey {
  return {
    id,
    troopId: 't',
    title: id,
    notes: null,
    effort,
    createdAt: new Date(now.getTime() - daysAgo * 86400000).toISOString(),
    fedAt: fed ? now.toISOString() : null,
    dueOn,
  }
}

// These tests build local-time dates, so they hold in any timezone.
const satMorning = new Date(2026, 9, 17, 9, 0)
const tueEvening = new Date(2026, 9, 13, 19, 30)
const fridayArvo = new Date(2026, 9, 16, 15, 0)

describe('fitsFor', () => {
  it('offers bigger jobs on weekends than on weeknights', () => {
    expect(fitsFor(satMorning).efforts).toContain('half')
    expect(fitsFor(tueEvening).efforts).toEqual(['quick'])
  })

  it('looks ahead to Saturday from Friday afternoon', () => {
    expect(fitsFor(fridayArvo).when).toBe('Free Saturday morning?')
  })
})

describe('pickNudge', () => {
  it('returns null when every monkey has been fed', () => {
    expect(pickNudge([monkey('a', 10, 'hour', satMorning, true)], satMorning)).toBeNull()
  })

  it('picks the oldest job that fits a weekend morning', () => {
    const list = [
      monkey('gurney', 150, 'full', satMorning),
      monkey('bbq', 42, 'hour', satMorning),
      monkey('door', 21, 'half', satMorning),
    ]
    const n = pickNudge(list, satMorning)
    expect(n?.monkey.id).toBe('bbq')
    expect(n?.headline).toBe('Free Saturday morning?')
    expect(n?.body).toContain('6 weeks')
    expect(n?.body).toContain('an hour or two')
  })

  it('only suggests quick jobs on a weeknight', () => {
    const list = [monkey('bbq', 42, 'hour', tueEvening), monkey('latch', 7, 'quick', tueEvening)]
    expect(pickNudge(list, tueEvening)?.monkey.id).toBe('latch')
  })

  it('falls back to an ongoing job when nothing else fits', () => {
    const list = [monkey('course', 240, 'ongoing', tueEvening), monkey('bbq', 42, 'hour', tueEvening)]
    const n = pickNudge(list, tueEvening)
    expect(n?.monkey.id).toBe('course')
    expect(n?.body).toContain('Chip away')
  })

  it('suggests planning a big one when only big jobs remain', () => {
    const list = [monkey('gurney', 150, 'full', satMorning)]
    expect(pickNudge(list, satMorning)?.headline).toBe('Plan a big one')
  })

  it('handles a fixed ISO date too', () => {
    expect(pickNudge([], at('2026-10-17T00:00:00Z'))).toBeNull()
  })

  it('puts a job due within 3 days ahead of everything else', () => {
    const list = [
      monkey('bbq', 42, 'hour', satMorning),
      monkey('mow', 2, 'hour', satMorning, false, '2026-10-19'), // Monday
    ]
    const n = pickNudge(list, satMorning)
    expect(n?.monkey.id).toBe('mow')
    expect(n?.headline).toBe('Due Monday.')
  })

  it('ignores due dates further out', () => {
    const list = [monkey('bbq', 42, 'hour', satMorning), monkey('paint', 2, 'hour', satMorning, false, '2026-11-20')]
    expect(pickNudge(list, satMorning)?.monkey.id).toBe('bbq')
  })

  it('calls out overdue jobs', () => {
    const n = pickNudge([monkey('rego', 30, 'quick', satMorning, false, '2026-10-15')], satMorning)
    expect(n?.headline).toBe('Overdue.')
    expect(n?.body).toContain('2 days ago')
  })
})
