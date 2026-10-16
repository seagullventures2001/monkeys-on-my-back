import { describe, expect, it } from 'vitest'
import { celebrationMessage } from './celebration'

const now = new Date('2026-10-16T10:00:00Z')
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString()

describe('celebrationMessage', () => {
  it('is stable for the same monkey', () => {
    const m = { id: 'abc', createdAt: daysAgo(10) }
    expect(celebrationMessage(m, now)).toBe(celebrationMessage(m, now))
  })

  it('celebrates long-waiting jobs differently', () => {
    const msg = celebrationMessage({ id: 'abc', createdAt: daysAgo(120) }, now)
    expect(['Finally!', 'Worth the wait!', 'What a relief!']).toContain(msg)
  })

  it('varies between jobs', () => {
    const msgs = new Set(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((id) => celebrationMessage({ id, createdAt: daysAgo(3) }, now)))
    expect(msgs.size).toBeGreaterThan(2)
  })
})
