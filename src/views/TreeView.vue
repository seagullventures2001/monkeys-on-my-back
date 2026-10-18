<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
import WelcomeDialog from '@/components/WelcomeDialog.vue'
import AvatarFigure from '@/components/AvatarFigure.vue'
import AvatarSetupDialog from '@/components/AvatarSetupDialog.vue'
import { useAvatarStore } from '@/stores/avatar'
import { defaultAvatar, type Body } from '@/lib/avatar'
import { unlockAudio } from '@/lib/sound'
import type { Monkey } from '@/lib/monkey'

const store = useTroopStore()
const me = useAvatarStore()
const selectedId = ref<string | null>(null)
const adding = ref(false)
const toast = ref<{ id: string; title: string } | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | undefined

const showWaiting = ref(false)

// First launch with an empty tree: explain what a monkey is.
const WELCOMED_KEY = 'momb.welcomed.v1'
function seenWelcome(): boolean {
  try {
    return localStorage.getItem(WELCOMED_KEY) === '1'
  } catch {
    return true
  }
}
const welcomeDismissed = ref(seenWelcome())
// Order on first open: pick your avatar, then the welcome (if the tree is empty), then the edit tip.
const showWelcome = computed(
  () => !welcomeDismissed.value && me.checked && !me.needsSetup && !store.loading && store.monkeys.length === 0,
)

function pickBody(body: Body) {
  me.set(defaultAvatar(body))
}

// A one-off pointer to the little edit button next to your avatar.
const TIP_KEY = 'momb.avatarTip.v1'
function seenTip(): boolean {
  try {
    return localStorage.getItem(TIP_KEY) === '1'
  } catch {
    return true
  }
}
const tipDismissed = ref(seenTip())
const showTip = computed(
  () =>
    !!me.avatar &&
    !tipDismissed.value &&
    !showWelcome.value &&
    !adding.value &&
    !celebrating.value &&
    !selectedId.value,
)
// Sizing: you stand from the top of the tree down to just above the menu, as tall as the
// screen allows (aiming for about 70% of it), with your feet towards the camera.
// The monkeys are drawn on top of you, so they're always clear and tappable.
const treeWrap = ref<HTMLElement | null>(null)
const meVars = ref<Record<string, string>>({})
const AVATAR_RATIO = 120 / 300
function measureMe() {
  const wrap = treeWrap.value
  if (!wrap) return
  const vh = window.innerHeight
  const treeTop = wrap.getBoundingClientRect().top + window.scrollY
  const treeH = wrap.offsetHeight
  const treeW = wrap.offsetWidth
  const navH = document.querySelector('.tabs')?.getBoundingClientRect().height ?? 80
  const room = vh - treeTop - navH - 6
  const h = Math.round(Math.min(Math.max(room, treeH * 0.7), vh * 0.7))
  const w = h * AVATAR_RATIO
  // Head centred over the left edge of the tree, a little of you past the screen edge is fine.
  // ...but never so far that your head is cut off.
  const left = Math.round(Math.max(treeW * 0.15 - w / 2, -w * 0.2 - 8))
  meVars.value = {
    '--me-h': `${h}px`,
    '--me-w': `${Math.round(w)}px`,
    '--me-left': `${left}px`,
    '--me-drop': `${Math.max(0, h - treeH)}px`,
    // Keep the panel's text clear of your legs.
    '--me-pad': `${Math.max(20, Math.round(20 + left + w * 0.76 + 8))}px`,
  }
}
let pageResize: ResizeObserver | undefined
onMounted(() => {
  measureMe()
  window.addEventListener('resize', measureMe)
  pageResize = new ResizeObserver(() => measureMe())
  const page = treeWrap.value?.parentElement
  if (page) pageResize.observe(page)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', measureMe)
  pageResize?.disconnect()
})
watch(
  () => [me.avatar !== null, store.nudge?.monkey.id, store.loading, store.onBack.length > 0],
  () => nextTick(measureMe),
)

function closeTip() {
  tipDismissed.value = true
  try {
    localStorage.setItem(TIP_KEY, '1')
  } catch {
    // Shows again next time; harmless.
  }
}
function closeWelcome(addNow: boolean) {
  welcomeDismissed.value = true
  try {
    localStorage.setItem(WELCOMED_KEY, '1')
  } catch {
    // Not remembered; it will show again next time, which is harmless.
  }
  if (addNow) adding.value = true
}

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

function pickWaiting(id: string) {
  showWaiting.value = false
  selectedId.value = id
}

// The details slide up from the bottom of the screen, so they're always in view
// whatever the phone size. If the sheet would cover the monkey that was tapped,
// scroll the page so the monkey stays visible above it.
const sheet = ref<HTMLElement | null>(null)
const sheetHeight = ref(0)
let sheetResize: ResizeObserver | undefined

watch(selectedId, async (id) => {
  sheetResize?.disconnect()
  if (!id) {
    sheetHeight.value = 0
    return
  }
  await nextTick()
  if (!sheet.value) return
  sheetHeight.value = sheet.value.offsetHeight
  sheetResize = new ResizeObserver(() => (sheetHeight.value = sheet.value?.offsetHeight ?? 0))
  sheetResize.observe(sheet.value)
  sheet.value.focus({ preventScroll: true })
  await nextTick()
  const monkey = document.querySelector('.tree .monkey.selected')
  if (monkey) {
    const gap = monkey.getBoundingClientRect().bottom - sheet.value.getBoundingClientRect().top + 16
    if (gap > 0) window.scrollBy({ top: gap, behavior: 'smooth' })
  }
})

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && selectedId.value && !adding.value && !celebrating.value) selectedId.value = null
}

// Tapping anywhere outside the details (and not on another monkey) closes them.
// Left open while editing, so a stray tap doesn't throw away changes.
function onPointerDown(e: PointerEvent) {
  if (!selectedId.value || !sheet.value) return
  const target = e.target as Element | null
  if (!target || sheet.value.contains(target)) return
  if (target.closest('.tree .monkey, .nudge, dialog')) return
  if (sheet.value.querySelector('form')) return
  selectedId.value = null
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  document.addEventListener('pointerdown', onPointerDown)
})

async function feed(id: string) {
  const monkey = store.onBack.find((m) => m.id === id)
  if (!monkey) return
  // Must happen during the tap itself, or phones won't let the celebration play sound.
  unlockAudio()
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

onBeforeUnmount(() => {
  clearTimeout(toastTimer)
  sheetResize?.disconnect()
  window.removeEventListener('keydown', onKey)
  document.removeEventListener('pointerdown', onPointerDown)
})
</script>

<template>
  <main class="page tree-page" :class="{ 'with-me': me.avatar }" :style="{ '--sheet-space': `${sheetHeight}px`, ...meVars }">
    <header class="top">
      <div class="brand">
        <RouterLink to="/settings" class="gear" aria-label="Settings">
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2.2" />
            <path
              d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linejoin="round"
            />
          </svg>
        </RouterLink>
        <span class="wordmark">Monkeys on my back</span>
      </div>
      <div class="top-actions">
        <RouterLink to="/troop" class="chip" :aria-label="`${store.fed.length} monkeys fed so far. Ride out to your troop.`">
          <BananaIcon :size="22" />
          <span>{{ store.fed.length }}</span>
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

    <div ref="treeWrap" class="tree-wrap">
      <TroopTree :monkeys="troop.onTree" :selected-id="selectedId" :happy-id="happyId" @select="select">
        <template #behind>
          <!-- You, standing in front of your tree like someone's taking your photo. -->
          <div v-if="me.avatar" class="me">
            <AvatarFigure :avatar="me.avatar" />
            <RouterLink to="/avatar" class="edit-me" aria-label="Edit your avatar" @click="closeTip">
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" />
              </svg>
            </RouterLink>
            <div v-if="showTip" class="tip" role="status">
              <svg class="tip-arrow" width="44" height="40" viewBox="0 0 44 40" aria-hidden="true">
                <path d="M38 36 C38 18 26 8 8 6" fill="none" stroke="var(--leaf-900)" stroke-width="3" stroke-linecap="round" />
                <path d="M15 1 L6 6 L14 12" fill="none" stroke="var(--leaf-900)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <strong>This is you!</strong>
              <span>Tap the pencil to change your hair and clothes.</span>
              <button type="button" class="btn-link tip-ok" @click="closeTip">Got it</button>
            </div>
          </div>
        </template>
      </TroopTree>
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

    <div class="panel">
      <p v-if="store.error" class="error" role="alert">{{ store.error }}</p>

      <div v-if="isEmpty && anyFed" class="empty">
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

    <Transition name="sheet">
      <section
        v-if="selected"
        ref="sheet"
        class="details-sheet"
        tabindex="-1"
        aria-label="Monkey details"
      >
        <span class="handle" aria-hidden="true" />
        <button type="button" class="close" aria-label="Close details" @click="selectedId = null">
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
          </svg>
        </button>
        <MonkeySheet :monkey="selected" @feed="feed" @save="save" @remove="remove" @close="selectedId = null" />
      </section>
    </Transition>

    <AvatarSetupDialog v-if="me.needsSetup" @pick="pickBody" />
    <WelcomeDialog v-if="showWelcome" @add="closeWelcome(true)" @close="closeWelcome(false)" />
    <AddMonkeyDialog :open="adding" @close="adding = false" @add="add" />
    <Transition name="celebrate">
      <FeedCelebration v-if="celebrating" :monkey="celebrating" :fed-count="store.fed.length" @continue="finishCelebration" />
    </Transition>
    <WaitingDialog :open="showWaiting" :monkeys="troop.waiting" @close="showWaiting = false" @pick="pickWaiting" />
  </main>
</template>

<style scoped>
/* Monkey details: slides up from just above the menu. */
.details-sheet {
  position: fixed;
  left: 50%;
  bottom: calc(64px + var(--safe-bottom));
  transform: translateX(-50%);
  width: 100%;
  max-width: 520px;
  max-height: calc(100dvh - 150px);
  overflow-y: auto;
  z-index: 9;
  padding: 24px 20px 34px;
  background: var(--white);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  box-shadow: 0 -10px 30px rgba(30, 58, 43, 0.18);
}

.details-sheet:focus {
  outline: none;
}

.handle {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 5px;
  border-radius: 999px;
  background: var(--leaf-300);
}

.close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 50%;
  background: var(--leaf-100);
  color: var(--leaf-900);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.details-sheet :deep(h2) {
  padding-right: 48px;
}

.sheet-enter-active,
.sheet-leave-active {
  transition: transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1);
}

.sheet-enter-from,
.sheet-leave-to {
  transform: translateX(-50%) translateY(110%);
}

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

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.gear {
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--white);
  color: var(--leaf-700);
  display: flex;
  align-items: center;
  justify-content: center;
}

.wordmark {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 15px;
  color: var(--leaf-700);
}

.chip {
  white-space: nowrap;
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

/* Your avatar stands in front of the tree and the panel below it, but behind the monkeys,
   so every monkey stays clear and tappable. */
.with-me .tree-wrap {
  z-index: 2;
}

.with-me .panel {
  padding-left: var(--me-pad, 20px);
}

/* The "more in the bushes" bar stays on top of your legs. */
.with-me .waiting {
  position: relative;
  z-index: 3;
}

.me {
  position: absolute;
  top: 0;
  left: var(--me-left, -40px);
  width: var(--me-w, 180px);
  height: var(--me-h, 450px);
  pointer-events: none;
}

.edit-me {
  position: absolute;
  z-index: 3;
  left: max(16%, calc(20px - var(--me-left, 0px)));
  top: 1%;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--white);
  color: var(--leaf-700);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  box-shadow: 0 2px 8px rgba(30, 58, 43, 0.25);
}

.edit-me::before {
  /* Bigger tap target than the drawn circle. */
  content: '';
  position: absolute;
  inset: -6px;
}

.tip {
  position: absolute;
  z-index: 4;
  left: calc(max(16%, calc(20px - var(--me-left, 0px))) + 30px);
  top: calc(1% + 52px);
  width: 190px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  background: var(--banana);
  color: var(--leaf-900);
  box-shadow: 0 6px 18px rgba(30, 58, 43, 0.22);
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.35;
  pointer-events: auto;
  animation: tip-in 0.35s ease-out 0.4s both;
}

.tip strong {
  font-family: var(--font-display);
  font-size: 18px;
}

.tip-arrow {
  position: absolute;
  left: -36px;
  top: -30px;
}

.tip-ok {
  align-self: flex-end;
  min-height: 36px;
}

@keyframes tip-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}

.panel {
  position: relative;
  flex: 1;
  margin: 4px -20px 0;
  padding: 20px 20px calc(92px + var(--safe-bottom) + var(--sheet-space, 0px));
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
