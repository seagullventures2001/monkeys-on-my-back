<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTroopStore } from '@/stores/troop'
import TroopPlayground from '@/components/TroopPlayground.vue'
import SafariLoader from '@/components/SafariLoader.vue'
import MonkeyFace from '@/components/MonkeyFace.vue'
import { fedThisMonth, waited } from '@/lib/playground'
import { troopVisited, markTroopVisited, takeRideRequest } from '@/lib/session'

const store = useTroopStore()
const route = useRoute()
const router = useRouter()

// Playground or list, kept in the address (?view=list) so Back works as expected.
const view = computed<'playground' | 'list'>(() => (route.query.view === 'list' ? 'list' : 'playground'))
function setView(v: 'playground' | 'list') {
  void router.replace({ query: v === 'list' ? { view: 'list' } : {} })
}

// The safari bus shows on the first visit each time the app is opened (long enough
// to read a fun fact), and whenever the monkeys are still loading. Tap to skip.
const MIN_LOADER_MS = 2600
// The banana counter on the tree screen always asks for the ride.
const rideRequested = takeRideRequest()
const minTimeDone = ref(troopVisited() && !rideRequested)
let timer: ReturnType<typeof setTimeout> | undefined
onMounted(() => {
  if (!minTimeDone.value) timer = setTimeout(() => (minTimeDone.value = true), MIN_LOADER_MS)
  markTroopVisited()
})
onBeforeUnmount(() => clearTimeout(timer))
const showLoader = computed(() => store.loading || !minTimeDone.value)
function skipLoader() {
  clearTimeout(timer)
  minTimeDone.value = true
}

const count = computed(() => store.fed.length)
const thisMonth = computed(() => fedThisMonth(store.fed))
const dateFmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

async function remove(id: string, title: string) {
  if (window.confirm(`Delete “${title}” for good? It will leave your troop and can't be brought back.`)) {
    await store.remove(id)
  }
}

// If the troop empties while on the list, nothing else to do; just keep the view.
watch(count, (n) => {
  if (n === 0 && view.value === 'list') setView('playground')
})
</script>

<template>
  <main class="page troop-page">
    <header class="head">
      <div>
        <h1>Your troop</h1>
        <p class="muted lead">
          <template v-if="count === 0">Every monkey you feed moves in here.</template>
          <template v-else>
            {{ count === 1 ? '1 monkey' : `${count} monkeys` }} off your back
            <template v-if="thisMonth > 0"> · {{ thisMonth }} this month</template>
          </template>
        </p>
      </div>
    </header>

    <div class="switcher" role="group" aria-label="How to show your troop">
      <button type="button" :aria-pressed="view === 'playground'" @click="setView('playground')">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3c-4 0-7 3-7 6.5 0 2.5 1.6 4.6 4 5.6V21h6v-5.9c2.4-1 4-3.1 4-5.6C19 6 16 3 12 3z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" />
        </svg>
        Playground
      </button>
      <button type="button" :aria-pressed="view === 'list'" @click="setView('list')">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
        </svg>
        List
      </button>
    </div>

    <template v-if="view === 'playground'">
      <TroopPlayground :monkeys="store.fed" class="playground" />
      <p v-if="store.fed.length >= 7" class="hint muted">Swipe sideways to see the rest of the troop. Tap a monkey to see its job.</p>
      <p v-else-if="store.fed.length > 0" class="hint muted">Tap a monkey to see which job it was.</p>
    </template>

    <template v-else>
      <ul class="list">
        <li v-for="m in store.fed" :key="m.id" class="row">
          <span class="face"><MonkeyFace :mood="0" /></span>
          <div class="text">
            <span class="title">{{ m.title }}</span>
            <span class="meta muted">Fed {{ dateFmt.format(new Date(m.fedAt!)) }} · waited {{ waited(m.createdAt, m.fedAt!) }}</span>
          </div>
          <div class="actions">
            <button type="button" class="icon-btn" :aria-label="`Put ${m.title} back on the tree`" title="Put back on the tree" @click="store.unfeed(m.id)">
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <button type="button" class="icon-btn danger" :aria-label="`Delete ${m.title}`" title="Delete" @click="remove(m.id, m.title)">
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
        </li>
      </ul>
      <p v-if="store.fed.length === 0" class="muted">Nothing fed yet. Your first banana is waiting.</p>
    </template>

    <p v-if="store.error" class="error" role="alert">{{ store.error }}</p>

    <Transition name="loader">
      <SafariLoader v-if="showLoader" @skip="skipLoader" />
    </Transition>
  </main>
</template>

<style scoped>
.head h1 {
  font-size: clamp(30px, 9vw, 38px);
  font-weight: 800;
}

.lead {
  margin: 4px 0 0;
  font-size: 15px;
  font-weight: 600;
}

.switcher {
  margin: 16px 0 14px;
  display: inline-flex;
  padding: 4px;
  gap: 4px;
  background: var(--white);
  border-radius: 999px;
}

.switcher button {
  min-height: 40px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--ink-muted);
  font-weight: 800;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.switcher button[aria-pressed='true'] {
  background: var(--leaf-900);
  color: var(--white);
}

.playground {
  margin: 0 -8px;
}

.hint {
  margin: 10px 0 0;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--white);
  border-radius: var(--radius-md);
  padding: 10px 8px 10px 12px;
}

.face {
  width: 40px;
  height: 40px;
  flex: none;
}

.text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.title {
  font-weight: 800;
  overflow-wrap: anywhere;
}

.meta {
  font-size: 13px;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 2px;
  flex: none;
}

.icon-btn {
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--leaf-700);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.icon-btn:hover {
  background: var(--leaf-100);
}

.icon-btn.danger {
  color: var(--danger);
}

.error {
  color: var(--danger);
  font-weight: 700;
}

.loader-leave-active {
  transition: opacity 0.35s ease;
}

.loader-leave-to {
  opacity: 0;
}
</style>
