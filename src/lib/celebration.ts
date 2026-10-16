import { ageInWeeks, type Monkey } from './monkey'

const EVERYDAY = ['Great job!', 'Nailed it!', 'One less monkey!', 'Banana well earned!', 'Off your back!', 'Look at that smile!']
const LONG_WAIT = ['Finally!', 'Worth the wait!', 'What a relief!']

/**
 * A cheerful line for the celebration. Picked from the monkey's id so it stays the
 * same if the screen re-renders, but differs from job to job. Jobs that hung around
 * for three months or more get a "finally" style message.
 */
export function celebrationMessage(m: Pick<Monkey, 'id' | 'createdAt'>, now: Date = new Date()): string {
  const pool = ageInWeeks(m.createdAt, now) >= 12 ? LONG_WAIT : EVERYDAY
  let hash = 0
  for (const ch of m.id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return pool[hash % pool.length]
}
