import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import type { Monkey } from './monkey'
import { pickNudge } from './nudge'

const WEEKEND_NUDGE_ID = 1001

/**
 * On a phone, schedules a Saturday 8am reminder that names a real monkey.
 * Rescheduled whenever the troop changes so the text stays current.
 * On the web it does nothing (browser push needs a server; that comes later).
 */
export async function scheduleWeekendNudge(monkeys: Monkey[]): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    const perm = await LocalNotifications.checkPermissions()
    if (perm.display !== 'granted') return

    await LocalNotifications.cancel({ notifications: [{ id: WEEKEND_NUDGE_ID }] })

    const saturdayMorning = nextSaturdayAt8()
    const nudge = pickNudge(monkeys, saturdayMorning)
    if (!nudge) return

    await LocalNotifications.schedule({
      notifications: [
        {
          id: WEEKEND_NUDGE_ID,
          title: nudge.headline,
          body: nudge.body,
          schedule: { on: { weekday: 7, hour: 8, minute: 0 }, allowWhileIdle: true },
        },
      ],
    })
  } catch {
    // Notifications are a nice-to-have; never let them break the app.
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  const res = await LocalNotifications.requestPermissions()
  return res.display === 'granted'
}

export function notificationsSupported(): boolean {
  return Capacitor.isNativePlatform()
}

function nextSaturdayAt8(from = new Date()): Date {
  const d = new Date(from)
  d.setHours(8, 0, 0, 0)
  const add = (6 - d.getDay() + 7) % 7 || (from > d ? 7 : 0)
  d.setDate(d.getDate() + add)
  return d
}
