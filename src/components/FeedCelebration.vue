<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import MonkeyFigure from './MonkeyFigure.vue'
import { formatAge, moodFor, type Monkey } from '@/lib/monkey'
import { monkeySize } from '@/lib/layout'
import { celebrationMessage } from '@/lib/celebration'

/**
 * Full-screen "you fed a monkey" moment.
 *
 * It only plays the celebration; saving is done by whoever opens it. That keeps it
 * reusable for a future approval flow (a child marks a job done, a parent approves,
 * and this plays after the approval).
 */
const props = defineProps<{ monkey: Monkey; fedCount: number }>()
const emit = defineEmits<{ continue: [] }>()

// The sequence, in milliseconds from opening.
const STEPS = [
  { at: 0, phase: 0 }, // zoom in on the monkey, as it is on the tree
  { at: 400, phase: 1 }, // banana flies in
  { at: 1150, phase: 2 }, // caught
  { at: 1550, phase: 3 }, // peeled
  { at: 1950, phase: 4 }, // eating, streamers, joyful face
  { at: 2500, phase: 5 }, // job title
  { at: 2950, phase: 6 }, // big tick
  { at: 3400, phase: 7 }, // "Great job!"
  { at: 3900, phase: 8 }, // Continue
  { at: 4300, phase: 9 }, // banana finished, monkey cheers
] as const
const DONE = 8

const phase = ref(0)
const timers: ReturnType<typeof setTimeout>[] = []
const continueBtn = ref<HTMLButtonElement | null>(null)

const startMood = moodFor(props.monkey.createdAt)
const mood = computed(() => (phase.value >= 4 ? 0 : startMood))
const pose = computed(() => (phase.value >= 9 ? 'auto' : phase.value >= 2 ? 'eat' : 'catch'))
const chewing = computed(() => phase.value >= 4 && phase.value < 9)
const holding = computed(() => phase.value >= 2 && phase.value < 9)

// Same size as on the tree, so a long-waiting monkey is a big monkey here too.
const scale = computed(() => {
  const size = monkeySize(props.monkey, new Date())
  return 0.82 + ((size - 46) / 40) * 0.28
})

const age = formatAge(props.monkey.createdAt)
const message = celebrationMessage(props.monkey)
const detail = computed(() => {
  const waited = age === 'today' ? 'Done the same day.' : `It was on your back for ${age}.`
  const count = props.fedCount === 1 ? 'Your first banana!' : `That's ${props.fedCount} fed so far.`
  return `${waited} ${count}`
})

// Streamers: fixed per monkey so they don't reshuffle on re-render.
const COLORS = ['#f2c230', '#2f6b45', '#b4501a', '#e46f6f', '#6cb8e6', '#cfe3bf']
const confetti = Array.from({ length: 34 }, (_, i) => {
  const angle = (i / 34) * Math.PI * 2 + (i % 3) * 0.2
  const dist = 120 + ((i * 37) % 90)
  return {
    style: {
      '--dx': `${Math.cos(angle) * dist}px`,
      '--dy': `${Math.sin(angle) * dist * 0.8 - 40}px`,
      '--rot': `${(i * 97) % 360}deg`,
      '--delay': `${(i % 5) * 40}ms`,
      background: COLORS[i % COLORS.length],
    },
    round: i % 4 === 0,
  }
})

function goTo(p: number) {
  phase.value = Math.max(phase.value, p)
  if (phase.value >= DONE) void nextTick(() => continueBtn.value?.focus())
}

/** Tapping before the end skips straight to the result. */
function skip() {
  if (phase.value < DONE) {
    timers.forEach(clearTimeout)
    goTo(9)
  }
}

onMounted(() => {
  document.documentElement.style.overflow = 'hidden'
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduced) return goTo(9)
  for (const s of STEPS) timers.push(setTimeout(() => goTo(s.phase), s.at))
  timers.push(setTimeout(() => navigator.vibrate?.(25), 1150))
})

onBeforeUnmount(() => {
  timers.forEach(clearTimeout)
  document.documentElement.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div class="celebration" role="dialog" aria-modal="true" aria-labelledby="celebrate-title" @click="skip">
      <p class="sr-only" aria-live="polite">Fed: {{ monkey.title }}. {{ message }}</p>

      <div class="scene" aria-hidden="true">
        <svg class="backdrop" viewBox="0 0 340 300" preserveAspectRatio="xMidYMid slice">
          <circle cx="70" cy="70" r="90" fill="var(--leaf-300)" />
          <circle cx="280" cy="60" r="110" fill="var(--leaf-300)" />
          <circle cx="170" cy="20" r="80" fill="#c3dcb0" />
          <circle cx="30" cy="210" r="70" fill="var(--leaf-200)" />
          <circle cx="320" cy="220" r="80" fill="var(--leaf-200)" />
          <path d="M-10 236 C80 228 260 230 350 238" fill="none" stroke="var(--bark)" stroke-width="16" stroke-linecap="round" />
        </svg>

        <div v-if="phase >= 4" class="confetti">
          <span v-for="(c, i) in confetti" :key="i" class="bit" :class="{ round: c.round }" :style="c.style" />
        </div>

        <div class="figure" :class="{ caught: phase >= 2, cheer: phase >= 9 }" :style="{ '--scale': scale }">
          <MonkeyFigure :mood="mood" :pose="pose" :chewing="chewing">
            <template #held>
              <g v-if="holding" class="held" :class="{ peeled: phase >= 3, eating: phase >= 4 }">
                <rect class="fruit" x="45.5" y="70" width="9" height="21" rx="4.5" fill="#fff3c4" stroke="#e8d08a" />
                <path class="peel peel-l" d="M46 90 Q41.5 79 46.5 69.5 L50 70 L50 90 Z" fill="#f2c230" stroke="#c99a12" />
                <path class="peel peel-r" d="M54 90 Q58.5 79 53.5 69.5 L50 70 L50 90 Z" fill="#f2c230" stroke="#c99a12" />
                <path class="peel peel-c" d="M47.5 90 L52.5 90 L51.5 69 Q50 67 48.5 69 Z" fill="#e2b21c" stroke="#c99a12" />
                <rect x="47" y="88.5" width="6" height="6" rx="2" fill="#a77a10" />
              </g>
            </template>
          </MonkeyFigure>

          <svg v-if="phase === 1" class="flyer" viewBox="0 0 40 40">
            <path d="M8 14 C10 28 24 34 34 24" fill="none" stroke="#f2c230" stroke-width="9" stroke-linecap="round" />
            <path d="M33 25 L37 20" stroke="#a77a10" stroke-width="3" stroke-linecap="round" />
          </svg>
        </div>
      </div>

      <div class="words">
        <div class="title-row" :class="{ show: phase >= 5 }">
          <h2 id="celebrate-title">{{ monkey.title }}</h2>
          <svg class="tick" :class="{ show: phase >= 6 }" viewBox="0 0 48 48" aria-hidden="true">
            <circle cx="24" cy="24" r="21" fill="var(--leaf-700)" />
            <path d="M14 25 L21 32 L35 17" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <p class="message" :class="{ show: phase >= 7 }">{{ message }}</p>
        <p class="detail" :class="{ show: phase >= 7 }">{{ detail }}</p>
        <button
          ref="continueBtn"
          type="button"
          class="btn btn-banana continue"
          :class="{ show: phase >= DONE }"
          :tabindex="phase >= DONE ? 0 : -1"
          @click.stop="emit('continue')"
        >
          Continue
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.celebration {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: calc(24px + var(--safe-top)) 20px calc(28px + var(--safe-bottom));
  background: var(--leaf-100);
  overflow: hidden;
  animation: fade-in 0.35s ease-out;
}

.scene {
  position: relative;
  width: min(92vw, 420px);
  aspect-ratio: 340 / 300;
  flex: none;
  animation: zoom-in 0.5s cubic-bezier(0.2, 0.9, 0.3, 1.2);
}

.backdrop {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* The monkey sits on the branch, which is drawn at y = 236 of 300. */
.figure {
  position: absolute;
  left: 50%;
  bottom: calc((300 - 236) / 300 * 100% - 2%);
  width: 50%;
  aspect-ratio: 100 / 130;
  transform: translateX(-50%) scale(var(--scale));
  transform-origin: 50% 89%;
}

.figure.caught {
  animation: bounce 0.4s ease-out;
}

.figure.cheer {
  animation: hop 0.6s ease-out 2;
}

/* Banana flight: in from the top right, spinning, landing at the monkey's hands. */
.flyer {
  position: absolute;
  left: 50%;
  top: 66%;
  width: 38%;
  overflow: visible;
  animation: fly 0.75s cubic-bezier(0.3, 0.1, 0.4, 1) forwards;
}

.held {
  animation: pop 0.25s ease-out;
}

.peel {
  transition: transform 0.35s ease-out;
}
.peel-l {
  transform-origin: 47px 90px;
}
.peel-r {
  transform-origin: 53px 90px;
}
.peel-c {
  transform-origin: 50px 90px;
}
.peeled .peel-l {
  transform: rotate(-150deg);
}
.peeled .peel-r {
  transform: rotate(150deg);
}
.peeled .peel-c {
  transform: scaleY(-0.9);
}

/* Bites: the fruit gets shorter from the top in four chomps. */
.fruit {
  transform-origin: 50px 91px;
}
.eating .fruit {
  animation: bites 2.2s steps(4, end) forwards;
}

.confetti {
  position: absolute;
  left: 50%;
  top: 48%;
  width: 0;
  height: 0;
}

.bit {
  position: absolute;
  width: 7px;
  height: 14px;
  border-radius: 2px;
  opacity: 0;
  animation: burst 1.6s cubic-bezier(0.15, 0.7, 0.3, 1) var(--delay) forwards;
}

.bit.round {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.words {
  width: min(100%, 420px);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 6px;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

h2 {
  font-size: clamp(22px, 6.5vw, 30px);
  font-weight: 800;
  overflow-wrap: anywhere;
}

.tick {
  width: 40px;
  height: 40px;
  flex: none;
  transform: scale(0);
}

.tick.show {
  animation: tick-pop 0.45s cubic-bezier(0.3, 1.6, 0.5, 1) forwards;
}

.tick path {
  stroke-dasharray: 40;
  stroke-dashoffset: 40;
}

.tick.show path {
  animation: draw 0.35s ease-out 0.15s forwards;
}

.message {
  margin: 6px 0 0;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(30px, 9vw, 42px);
  line-height: 1.05;
  color: var(--leaf-700);
}

.detail {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--ink-muted);
}

.continue {
  margin-top: 14px;
  min-width: 220px;
  min-height: 54px;
}

/* Text pieces rise in one after another. */
.title-row,
.message,
.detail,
.continue {
  opacity: 0;
  transform: translateY(10px);
  transition:
    opacity 0.35s ease-out,
    transform 0.35s ease-out;
}

.title-row.show,
.message.show,
.detail.show,
.continue.show {
  opacity: 1;
  transform: none;
}

.continue:not(.show) {
  pointer-events: none;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}

@keyframes zoom-in {
  from {
    transform: scale(0.55);
    opacity: 0;
  }
}

@keyframes fly {
  0% {
    transform: translate(150%, -260%) rotate(-320deg) scale(1.1);
  }
  100% {
    transform: translate(-50%, -50%) rotate(0deg) scale(0.45);
  }
}

@keyframes pop {
  from {
    transform: scale(0.7);
  }
}

@keyframes bounce {
  0% {
    transform: translateX(-50%) scale(var(--scale));
  }
  35% {
    transform: translateX(-50%) scale(calc(var(--scale) * 1.07), calc(var(--scale) * 0.94));
  }
  70% {
    transform: translateX(-50%) translateY(-4%) scale(var(--scale));
  }
  100% {
    transform: translateX(-50%) scale(var(--scale));
  }
}

@keyframes hop {
  0%,
  100% {
    transform: translateX(-50%) scale(var(--scale));
  }
  40% {
    transform: translateX(-50%) translateY(-8%) scale(var(--scale));
  }
}

@keyframes bites {
  from {
    transform: scaleY(1);
  }
  to {
    transform: scaleY(0);
  }
}

@keyframes burst {
  0% {
    opacity: 1;
    transform: translate(0, 0) rotate(0deg) scale(0.4);
  }
  60% {
    opacity: 1;
    transform: translate(var(--dx), var(--dy)) rotate(var(--rot)) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(var(--dx), calc(var(--dy) + 120px)) rotate(calc(var(--rot) + 180deg)) scale(1);
  }
}

@keyframes tick-pop {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

@keyframes draw {
  to {
    stroke-dashoffset: 0;
  }
}
</style>
