<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useTroopStore } from '@/stores/troop'
import { countLabel, moodFor, type Effort, type NewMonkey } from '@/lib/monkey'
import { splitTroop } from '@/lib/layout'
import MonkeyFace from '@/components/MonkeyFace.vue'
import WaitingDialog from '@/components/WaitingDialog.vue'
import TroopTree from '@/components/TroopTree.vue'
import NudgeCard from '@/components/NudgeCard.vue'
import MonkeySheet from '@/components/MonkeySheet.vue'
import AddMonkeyDialog from '@/components/AddMonkeyDialog.vue'
import BananaIcon from '@/components/BananaIcon.vue'
import FeedCelebration from '@/components/FeedCelebration.vue'
import type { Monkey } from '@/lib/monkey'

const store = useTroopStore()
const selectedId = ref<string | null>(null)
const adding = ref(false)
const toast = ref<{ id: string; title: string } | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | undefined

const showWaiting = ref(false)

// The monkey being celebrated, and the one still waving goodbye on the tree afterwards.
const celebrating = ref<Monkey | null>(null)
const leaving = ref<Monkey | null>(null)
// It stays in its usual mood until it has had the banana, then smiles as it leaves.
const happyId = ref<string | null>(null)

// A fed monkey stays on its branch (smiling) until you tap Continue, then fades away.
const troop = computed(() => splitTroop(leaving.value ? [...store.onBack, leaving.value] : store.onBack))
const anyFed = computed(() => store.fed.length > 0)
const isEmpty = computed(() => store.onBack.length === 0 && !store.loading)
const subline = computed(() => {
  if (store.onBack.length > 0) return 'Bigger, sadder monkeys have been waiting longer for their banana.'
  return anyFed.value ? 'Every monkey has been fed.' : 'Add the jobs that keep getting pushed aside.'
})
const selected = computed(() => store.onBack.find((m) => m.id === selectedId.value) ?? null)

function select(id: string) {
  selectedId.value = selectedId.value === id ? null : id
}

const panel = ref<HTMLElement | null>(null)

// A waiting monkey is not on the tree, so bring its details into view.
async function pickWaiting(id: string) {
  showWaiting.value = false
  selectedId.value = id
  await nextTick()
  panel.value?.scrollIntoView({ behavior: 'smooth', block: 'end' })
}

async function feed(id: string) {
  const monkey = store.onBack.find((m) => m.id === id)
  if (!monkey) return
  selectedId.value = null
  leaving.value = monkey
  celebrating.value = monkey
  await store.feed(id)
  if (store.error) {
    celebrating.value = null
    leaving.value = null
  }
}

function finishCelebration() {
  const monkey = celebrating.value
  celebrating.value = null
  happyId.value = monkey?.id ?? null
  // Let the celebration fade out first, then the monkey leaves the tree.
  setTimeout(() => {
    leaving.value = null
    happyId.value = null
    if (monkey) showToast(monkey.id, monkey.title)
  }, 450)
}

function showToast(id: string, title: string) {
  toast.value = { id, title }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = null), 6000)
}

async function undo() {
  if (!toast.value) return
  const id = toast.value.id
  toast.value = null
  await store.unfeed(id)
}

async function add(input: NewMonkey) {
  const m = await store.add(input)
  adding.value = false
  if (m) selectedId.value = m.id
}

async function save(id: string, patch: { title: string; effort: Effort; notes: string | null; dueOn: string | null }) {
  await store.update(id, patch)
}

async function remove(id: string) {
  selectedId.value = null
  await store.remove(id)
}

// If the selected monkey disappears (fed on another device, removed), clear the selection.
watch(
  () => store.onBack.length,
  () => {
    if (selectedId.value && !selected.value) selectedId.value = null
  },
)

onBeforeUnmount(() => clearTimeout(toastTimer))
</script>

<template>
  <main class="page tree-page">
    <header class="top">
      <span class="wordmark">Monkeys on my back</span>
      <div class="top-actions">
        <RouterLink to="/fed" class="chip" :aria-label="`${store.fed.length} monkeys fed so far`">
          <BananaIcon :size="22" />
          <span>{{ store.fed.length }} fed</span>
        </RouterLink>
        <button type="button" class="add" aria-label="Add a new monkey" @click="adding = true">
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </header>

    <h1 class="count">{{ countLabel(store.onBack.length, anyFed) }}</h1>
    <p class="muted sub">{{ subline }}</p>

    <NudgeCard v-if="store.nudge" :nudge="store.nudge" class="nudge" @open="select" />

    <div class="tree-wrap">
      <TroopTree :monkeys="troop.onTree" :selected-id="selectedId" :happy-id="happyId" @select="select" />
    </div>

    <button v-if="troop.waiting.length" type="button" class="waiting" @click="showWaiting = true">
      <span class="waiting-faces" aria-hidden="true">
        <span v-for="m in troop.waiting.slice(0, 3)" :key="m.id" class="waiting-face">
          <MonkeyFace :mood="moodFor(m.createdAt)" />
        </span>
      </span>
      <span class="waiting-text">
        <strong>{{ troop.waiting.length }} more waiting in the bushes</strong>
        <span>The tree fits 8. Tap to see them.</span>
      </span>
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" class="waiting-chev">
        <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
      </svg>
    </button>

    <div ref="panel" class="panel">
      <p v-if="store.error" class="error" role="alert">{{ store.error }}</p>

      <MonkeySheet
        v-if="selected"
        :monkey="selected"
        @feed="feed"
        @save="save"
        @remove="remove"
        @close="selectedId = null"
      />
      <div v-else-if="isEmpty && anyFed" class="empty">
        <h2>Your back is clear</h2>
        <p class="muted">
          Every monkey has had its banana. That's {{ store.fed.length }} off your back so far. When a new job starts
          nagging you, hang it on the tree.
        </p>
      </div>
      <div v-else-if="isEmpty" class="empty">
        <h2>Start your troop</h2>
        <p class="muted">
          Think of a job you keep putting off: the BBQ, the gutters, that course you started. Each one becomes a monkey
          on your tree.
        </p>
        <button type="button" class="btn btn-primary first" @click="adding = true">Add your first monkey</button>
      </div>
      <p v-else class="hint muted">Tap a monkey to see its job.</p>

      <Transition name="toast">
        <div v-if="toast" class="toast" role="status">
          <span>“{{ toast.title }}” jumped off your back.</span>
          <button type="button" class="btn-link undo" @click="undo">Undo</button>
        </div>
      </Transition>
    </div>

    <AddMonkeyDialog :open="adding" @close="adding = false" @add="add" />
    <Transition name="celebrate">
      <FeedCelebration v-if="celebrating" :monkey="celebrating" :fed-count="store.fed.length" @continue="finishCelebration" />
    </Transition>
    <WaitingDialog :open="showWaiting" :monkeys="troop.waiting" @close="showWaiting = false" @pick="pickWaiting" />
  </main>
</template>

<style scoped>
.tree-page {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  padding-bottom: 0;
}

.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.add {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 0;
  background: var(--leaf-700);
  color: var(--white);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(30, 58, 43, 0.25);
}

.waiting {
  margin-top: 10px;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  background: var(--banana);
  color: var(--leaf-900);
  border: 0;
  border-radius: var(--radius-md);
  padding: 10px 14px;
  min-height: 60px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(30, 58, 43, 0.15);
}

.waiting-faces {
  display: flex;
  flex: none;
}

.waiting-face {
  width: 34px;
  height: 34px;
  margin-left: -10px;
  background: var(--banana);
  border-radius: 50%;
}

.waiting-face:first-child {
  margin-left: 0;
}

.waiting-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  font-size: 13px;
  font-weight: 600;
}

.waiting-text strong {
  font-size: 15px;
  font-weight: 800;
}

.waiting-chev {
  flex: none;
}

.wordmark {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 17px;
  color: var(--leaf-700);
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 0 12px 0 8px;
  background: var(--white);
  border-radius: 999px;
  font-weight: 800;
  font-size: 15px;
  color: var(--leaf-900);
  text-decoration: none;
}

.count {
  margin-top: 10px;
  font-size: clamp(32px, 9vw, 40px);
  font-weight: 800;
}

.sub {
  margin: 4px 0 0;
  font-size: 15px;
}

.nudge {
  margin-top: 16px;
}

.tree-wrap {
  position: relative;
  margin-top: 8px;
}

.panel {
  position: relative;
  flex: 1;
  margin: 4px -20px 0;
  padding: 20px 20px calc(92px + var(--safe-bottom));
  min-height: 150px;
  background: var(--white);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  box-shadow: 0 -6px 24px rgba(30, 58, 43, 0.08);
}

.hint {
  margin: 4px 0 0;
  font-size: 15px;
  font-weight: 600;
}

.empty h2 {
  font-size: 24px;
}

.empty p {
  margin: 6px 0 0;
  line-height: 1.45;
}

.empty .first {
  margin-top: 14px;
  width: 100%;
}

.error {
  margin: 0 0 12px;
  color: var(--danger);
  font-weight: 700;
}

.toast {
  margin-top: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: var(--leaf-100);
  border-radius: var(--radius-sm);
  padding: 8px 8px 8px 14px;
  font-size: 14px;
  font-weight: 700;
  color: var(--leaf-700);
}

.undo {
  flex: none;
  min-height: 40px;
}

.celebrate-leave-active {
  transition: opacity 0.4s ease;
}

.celebrate-leave-to {
  opacity: 0;
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

</style>
