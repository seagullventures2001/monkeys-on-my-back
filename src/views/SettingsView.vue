<script setup lang="ts">
import { ref } from 'vue'
import { useTroopStore } from '@/stores/troop'
import { supabaseConfigured } from '@/lib/supabase'
import { localRepo } from '@/data/localRepo'
import { notificationsSupported, requestNotificationPermission, scheduleWeekendNudge } from '@/lib/notifications'
import { playOne, setSoundEnabled, soundEnabled, unlockAudio } from '@/lib/sound'

const store = useTroopStore()

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

async function enableNotifications() {
  const ok = await requestNotificationPermission()
  if (ok) await scheduleWeekendNudge(store.monkeys)
  notifMsg.value = ok ? 'Done. You will get a nudge on Saturday mornings.' : 'Notifications are turned off for this app in your phone settings.'
}
</script>

<template>
  <main class="page">
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

    <section v-if="notificationsSupported()" class="card">
      <h2>Weekend nudges</h2>
      <p>A Saturday morning reminder that names a monkey that fits the time you have.</p>
      <button type="button" class="btn btn-primary" @click="enableNotifications">Turn on nudges</button>
      <p v-if="notifMsg" class="muted small" role="status">{{ notifMsg }}</p>
    </section>

    <section v-if="hasDemo && store.mode === 'local'" class="card">
      <h2>Example monkeys</h2>
      <p>The tree started with a few example jobs so it was not empty. Clear them when you are ready to add your own.</p>
      <button type="button" class="btn btn-ghost" @click="clearDemo">Clear example monkeys</button>
    </section>
  </main>
</template>

<style scoped>
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

.small {
  font-size: 14px;
}

.error {
  color: var(--danger);
  font-weight: 700;
}

code {
  background: var(--leaf-100);
  padding: 1px 5px;
  border-radius: 6px;
}
</style>
