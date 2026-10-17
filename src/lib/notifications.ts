import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import type { Monkey } from './monkey'
import { DUE_ID_BASE, RECURRING_IDS, loadPrefs, planReminders } from './reminders'

/**
 * On a phone, (re)schedules the morning reminders from the saved preferences:
 * the recurring nudges (weekends or every day) plus one on each due date.
 * Called whenever the troop changes so the wording stays current.
 *
 * On the web this does nothing yet. Sending reminders to a web app needs push
 * notifications from a server (planned for later); the preferences are still saved.
 */
export async function scheduleReminders(monkeys: Monkey[]): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    const perm = await LocalNotifications.checkPermissions()
    if (perm.display !== 'granted') return

    const old = [...RECURRING_IDS, ...Array.from({ length: 40 }, (_, i) => DUE_ID_BASE + i)].map((id) => ({ id }))
    await LocalNotifications.cancel({ notifications: old })

    const plan = planReminders(monkeys, loadPrefs())
    if (plan.length === 0) return

    await LocalNotifications.schedule({
      notifications: plan.map((r) => ({
        id: r.id,
        title: r.title,
        body: r.body,
        schedule: r.at
          ? { at: r.at, allowWhileIdle: true }
          : { on: { weekday: r.weekday, hour: r.hour, minute: r.minute }, allowWhileIdle: true },
      })),
    })
  } catch {
    // Reminders are a nice-to-have; never let them break the app.
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  const res = await LocalNotifications.requestPermissions()
  return res.display === 'granted'
}

/** True in the phone app (Capacitor); false in the browser / home-screen web app. */
export function notificationsSupported(): boolean {
  return Capacitor.isNativePlatform()
}
