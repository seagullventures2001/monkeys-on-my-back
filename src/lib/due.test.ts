import { describe, expect, it } from 'vitest'
import { daysUntil, dueLabel, dueTag, isDueSoon, nextSaturday } from './due'

// Local-time dates so the tests hold in any timezone.
const thursday = new Date(2026, 9, 15, 21, 30) // Thu 15 Oct 2026, evening

describe('daysUntil', () => {
  it('counts calendar days, ignoring the time of day', () => {
    expect(daysUntil('2026-10-15', thursday)).toBe(0)
    expect(daysUntil('2026-10-16', thursday)).toBe(1)
    expect(daysUntil('2026-10-13', thursday)).toBe(-2)
  })
})

describe('labels', () => {
  it('reads naturally', () => {
    expect(dueLabel('2026-10-13', thursday)).toBe('Overdue by 2 days')
    expect(dueLabel('2026-10-14', thursday)).toBe('Was due yesterday')
    expect(dueLabel('2026-10-15', thursday)).toBe('Due today')
    expect(dueLabel('2026-10-16', thursday)).toBe('Due tomorrow')
    expect(dueLabel('2026-10-17', thursday)).toBe('Due Saturday')
    expect(dueLabel('2026-10-30', thursday)).toBe('Due 30 Oct')
  })

  it('has short tree tags', () => {
    expect(dueTag('2026-10-13', thursday)).toBe('Late')
    expect(dueTag('2026-10-15', thursday)).toBe('Today')
    expect(dueTag('2026-10-16', thursday)).toBe('Tmrw')
    expect(dueTag('2026-10-17', thursday)).toBe('Sat')
  })
})

describe('isDueSoon', () => {
  it('is true within a week or when overdue, false otherwise', () => {
    expect(isDueSoon(null, thursday)).toBe(false)
    expect(isDueSoon('2026-10-22', thursday)).toBe(true)
    expect(isDueSoon('2026-10-23', thursday)).toBe(false)
    expect(isDueSoon('2026-10-01', thursday)).toBe(true)
  })
})

describe('nextSaturday', () => {
  it('finds the coming Saturday, or today on a Saturday', () => {
    expect(nextSaturday(thursday)).toBe('2026-10-17')
    expect(nextSaturday(new Date(2026, 9, 17, 9))).toBe('2026-10-17')
  })
})
