<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useTroopStore } from '@/stores/troop'
import { countLabel, type Effort, type NewMonkey } from '@/lib/monkey'
import TroopTree from '@/components/TroopTree.vue'
import NudgeCard from '@/components/NudgeCard.vue'
import MonkeySheet from '@/components/MonkeySheet.vue'
import AddMonkeyDialog from '@/components/AddMonkeyDialog.vue'
import BananaIcon from '@/components/BananaIcon.vue'

const store = useTroopStore()
const selectedId = ref<string | null>(null)
const adding = ref(false)
const toast = ref<{ id: string; title: string } | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | undefined

const selected = computed(() => store.onBack.find((m) => m.id === selectedId.value) ?? null)

function select(id: string) {
  selectedId.value = selectedId.value === id ? null : id
}

async function feed(id: string) {
  const title = selected.value?.title ?? ''
  selectedId.value = null
  await store.feed(id)
  if (!store.error) showToast(id, title)
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

async function save(id: string, patch: { title: string; effort: Effort; notes: string | null }) {
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
      <RouterLink to="/fed" class="chip" :aria-label="`${store.fed.length} monkeys fed so far`">
        <BananaIcon :size="22" />
        <span>{{ store.fed.length }} fed</span>
      </RouterLink>
    </header>

    <h1 class="count">{{ countLabel(store.onBack.length) }}</h1>
    <p class="muted sub">Bigger, grumpier monkeys have been hanging around longer.</p>

    <NudgeCard v-if="store.nudge" :nudge="store.nudge" class="nudge" @open="select" />

    <div class="tree-wrap">
      <TroopTree :monkeys="store.onBack" :selected-id="selectedId" @select="select" />
      <button type="button" class="fab" aria-label="Add a new monkey" @click="adding = true">
        <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
        </svg>
      </button>
    </div>

    <div class="panel">
      <p v-if="store.error" class="error" role="alert">{{ store.error }}</p>

      <MonkeySheet
        v-if="selected"
        :monkey="selected"
        @feed="feed"
        @save="save"
        @remove="remove"
        @close="selectedId = null"
      />
      <div v-else-if="store.onBack.length === 0 && !store.loading" class="empty">
        <h2>Your back is clear</h2>
        <p class="muted">Every monkey has been fed. When a job starts nagging you, hang it on the tree.</p>
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

.fab {
  position: absolute;
  right: 0;
  bottom: 18px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 0;
  background: var(--leaf-700);
  color: var(--white);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px rgba(30, 58, 43, 0.3);
  z-index: 5;
}
</style>
