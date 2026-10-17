<script setup lang="ts">
import { ref } from 'vue'
import { useTroopStore } from '@/stores/troop'
import { supabaseConfigured } from '@/lib/supabase'
import { localRepo } from '@/data/localRepo'
import { notificationsSupported, requestNotificationPermission, scheduleReminders } from '@/lib/notifications'
import { loadPrefs, savePrefs, type Frequency } from '@/lib/reminders'
import { playOne, setSoundEnabled, soundEnabled, unlockAudio } from '@/lib/sound'

const store = useTroopStore()

// e.g. "0.8.0 (2257a31)": the app version plus the git commit it was built from.
const version = `${__APP_VERSION__} (${__APP_COMMIT__})`

const email = ref('')
const linkSent = ref(false)
const copyMsg = ref('')
const hasDemo = ref(localRepo.hasDemo())
const notifMsg = ref('')

const sounds = ref(soundEnabled())
function toggleSounds() {
  setSoundEnabled(sounds.value)
  if (sounds.value) {
    unlockAudio()
    playOne('ding')
  }
}

async function sendLink() {
  if (!email.value.trim()) return
  linkSent.value = await store.signIn(email.value.trim())
}

async function copyLocal() {
  const n = await store.copyLocalToAccount()
  copyMsg.value = n === 0 ? 'Nothing to copy (demo monkeys are skipped).' : `Copied ${n} monkeys to your account.`
}

async function clearDemo() {
  localRepo.clearDemo()
  hasDemo.value = false
  await store.refresh()
}

// Morning reminders: saved on this device. On the phone app they're scheduled straight
// away; the web version keeps the choice until push notifications are set up.
const prefs = ref(loadPrefs())
const native = notificationsSupported()
const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'weekends', label: 'Weekends' },
  { value: 'daily', label: 'Every day' },
]

async function saveReminders() {
  savePrefs(prefs.value)
  notifMsg.value = ''
  if (!native) return
  const wantsAny = prefs.value.frequency !== 'off' || prefs.value.dueDates
  if (wantsAny && !(await requestNotificationPermission())) {
    notifMsg.value = 'Notifications are turned off for this app in your phone settings.'
    return
  }
  await scheduleReminders(store.monkeys)
}
</script>

<template>
  <main class="page">
    <RouterLink to="/" class="back">
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      Back to the tree
    </RouterLink>
    <h1>Settings</h1>

    <section class="card">
      <h2>Where your monkeys live</h2>

      <template v-if="store.mode === 'supabase'">
        <p>Synced to your account <strong>{{ store.email }}</strong>. They show up on any device you sign in on.</p>
        <div class="row">
          <button type="button" class="btn btn-ghost" @click="copyLocal">Copy monkeys from this device</button>
          <button type="button" class="btn btn-ghost" @click="store.signOut()">Sign out</button>
        </div>
        <p v-if="copyMsg" class="muted small" role="status">{{ copyMsg }}</p>
      </template>

      <template v-else>
        <p>Saved on this device only.</p>

        <form v-if="supabaseConfigured && !linkSent" class="signin" @submit.prevent="sendLink">
          <div class="field">
            <label for="email">Sign in to sync across devices</label>
            <input id="email" v-model="email" type="email" class="input" autocomplete="email" placeholder="you@example.com" required />
          </div>
          <button type="submit" class="btn btn-primary">Email me a sign-in link</button>
        </form>
        <p v-else-if="linkSent" class="muted" role="status">Check your email for the sign-in link.</p>
        <p v-else class="muted small">
          Accounts are switched off in this build. Add your Supabase keys to <code>.env.local</code> to turn them on
          (see the README).
        </p>
      </template>
      <p v-if="store.error" class="error" role="alert">{{ store.error }}</p>
    </section>

    <section class="card">
      <label class="switch-row" for="sounds-toggle">
        <span class="switch-text">
          <h2>Sounds</h2>
          <span class="muted small">A little tune when you feed a monkey</span>
        </span>
        <input id="sounds-toggle" v-model="sounds" type="checkbox" role="switch" class="switch" @change="toggleSounds" />
      </label>
    </section>

    <section class="card">
      <h2>Morning reminders</h2>
      <p class="muted small">A gentle nudge with a monkey that suits your free time.</p>

      <fieldset class="freq">
        <legend class="sr-only">How often</legend>
        <label v-for="f in FREQUENCIES" :key="f.value" class="pill" :class="{ on: prefs.frequency === f.value }">
          <input v-model="prefs.frequency" type="radio" name="frequency" :value="f.value" class="sr-only" @change="saveReminders" />
          {{ f.label }}
        </label>
      </fieldset>

      <div v-if="prefs.frequency !== 'off'" class="row-between">
        <label for="reminder-time"><strong>Time</strong></label>
        <input id="reminder-time" v-model="prefs.time" type="time" step="900" class="input time" @change="saveReminders" />
      </div>

      <label class="switch-row" for="due-reminders">
        <span class="switch-text">
          <strong>On due dates</strong>
          <span class="muted small">A reminder the morning a monkey is due</span>
        </span>
        <input id="due-reminders" v-model="prefs.dueDates" type="checkbox" role="switch" class="switch" @change="saveReminders" />
      </label>

      <p v-if="!native" class="note small">
        Reminders aren't switched on in the web version yet. Your choice is saved and will be used as soon as they are.
      </p>
      <p v-if="notifMsg" class="muted small" role="status">{{ notifMsg }}</p>
    </section>

    <section v-if="hasDemo && store.mode === 'local'" class="card">
      <h2>Example monkeys</h2>
      <p>The tree started with a few example jobs so it was not empty. Clear them when you are ready to add your own.</p>
      <button type="button" class="btn btn-ghost" @click="clearDemo">Clear example monkeys</button>
    </section>
    <p class="version">Monkeys on My Back · version {{ version }}</p>
  </main>
</template>

<style scoped>
.back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 44px;
  margin-bottom: 4px;
  color: var(--leaf-700);
  font-weight: 800;
  text-decoration: none;
}

h1 {
  font-size: 36px;
  font-weight: 800;
  margin-bottom: 16px;
}

.card {
  background: var(--white);
  border-radius: var(--radius-lg);
  padding: 18px;
  margin-bottom: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card h2 {
  font-size: 20px;
}

.card p {
  margin: 0;
  line-height: 1.45;
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.signin {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
}

.switch-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.freq {
  border: 0;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pill {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  padding: 0 16px;
  border-radius: 999px;
  border: 2px solid var(--leaf-300);
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;
}

.pill.on {
  background: var(--leaf-900);
  border-color: var(--leaf-900);
  color: var(--white);
}

.pill:has(input:focus-visible) {
  outline: 3px solid var(--banana-deep);
  outline-offset: 2px;
}

.row-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.time {
  width: auto;
  min-width: 130px;
}

.note {
  background: var(--leaf-100);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  font-weight: 600;
}

.small {
  font-size: 14px;
}

.error {
  color: var(--danger);
  font-weight: 700;
}

.version {
  margin: 24px 0 0;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-muted);
}

code {
  background: var(--leaf-100);
  padding: 1px 5px;
  border-radius: 6px;
}
</style>
