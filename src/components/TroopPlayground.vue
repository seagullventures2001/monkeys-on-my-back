<script setup lang="ts">
import { computed, ref } from 'vue'
import MonkeyFigure from './MonkeyFigure.vue'
import PeeledBanana from './PeeledBanana.vue'
import type { Monkey } from '@/lib/monkey'
import { GROUND_Y, SCENE_H, SEGMENT_W, placeTroop, waited, type PlaygroundMonkey } from '@/lib/playground'

// Every fed monkey lives here, having a great time: eating, waving, napping,
// swinging, strolling and bouncing. Tap one to see which job it was.
const props = defineProps<{ monkeys: Monkey[] }>()

const scene = computed(() => placeTroop(props.monkeys))
const selectedId = ref<string | null>(null)
const selected = computed(() => scene.value.monkeys.find((p) => p.monkey.id === selectedId.value) ?? null)

const dateFmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' })

const FIG = 1.3 // figure height / width

function top(p: PlaygroundMonkey): number {
  const h = p.size * FIG
  if (p.kind === 'branch') return p.y - h * (116 / 130)
  if (p.kind === 'hang') return p.y - h * (2 / 130)
  return p.y - h
}

function figureProps(p: PlaygroundMonkey) {
  switch (p.activity) {
    case 'eat':
      return { mood: 0, pose: 'eat', chewing: true } as const
    case 'nap':
      return { mood: 1, pose: 'rest', sleeping: true } as const
    case 'swing':
      return { mood: 0, pose: 'hang' } as const
    case 'stroll':
      return { mood: 1, pose: 'rest' } as const
    default:
      return { mood: 0, pose: 'auto' } as const
  }
}

function label(p: PlaygroundMonkey): string {
  return `${p.monkey.title}, fed ${dateFmt.format(new Date(p.monkey.fedAt!))}`
}

function toggle(id: string) {
  selectedId.value = selectedId.value === id ? null : id
}

const bubble = computed(() => {
  const p = selected.value
  if (!p) return null
  const w = 230
  const t = top(p)
  const above = t - 86 > 6
  return {
    left: Math.min(Math.max(p.x - w / 2, 8), scene.value.width - w - 8),
    top: above ? t - 86 : t + p.size * FIG + 8,
    title: p.monkey.title,
    line: `Fed ${dateFmt.format(new Date(p.monkey.fedAt!))} · waited ${waited(p.monkey.createdAt, p.monkey.fedAt!)}`,
  }
})

const segments = computed(() => Array.from({ length: scene.value.segments }, (_, i) => i * SEGMENT_W))
</script>

<template>
  <div class="scroller" tabindex="0" aria-label="Your troop's playground. Scroll sideways to see more trees.">
    <div class="scene" :style="{ width: `${scene.width}px`, height: `${SCENE_H}px` }" @click.self="selectedId = null">
      <svg class="backdrop" :viewBox="`0 0 ${scene.width} ${SCENE_H}`" :width="scene.width" :height="SCENE_H" aria-hidden="true">
        <!-- distant hills -->
        <ellipse v-for="x in segments" :key="`h${x}`" :cx="x + 160" :cy="GROUND_Y + 30" rx="260" ry="120" fill="var(--leaf-200)" />
        <!-- ground -->
        <rect x="0" :y="GROUND_Y - 4" :width="scene.width" :height="SCENE_H - GROUND_Y + 4" fill="#b9d4a4" />
        <rect x="0" :y="GROUND_Y - 4" :width="scene.width" height="6" fill="#a7c690" />

        <g v-for="x in segments" :key="x" :transform="`translate(${x} 0)`">
          <!-- canopy -->
          <circle cx="100" cy="122" r="80" fill="var(--leaf-300)" />
          <circle cx="226" cy="104" r="90" fill="var(--leaf-300)" />
          <circle cx="164" cy="58" r="70" fill="#c3dcb0" />
          <circle cx="58" cy="206" r="50" fill="var(--leaf-200)" />
          <circle cx="282" cy="206" r="52" fill="var(--leaf-200)" />
          <!-- trunk and branches (positions match SPOTS in lib/playground.ts) -->
          <path :d="`M146 ${GROUND_Y + 2} C150 330 152 220 154 118 L166 118 C168 220 170 330 174 ${GROUND_Y + 2} Z`" fill="var(--bark)" />
          <path d="M166 154 C210 150 260 152 298 150" fill="none" stroke="var(--bark)" stroke-width="10" stroke-linecap="round" />
          <path d="M154 182 C120 180 80 182 36 180" fill="none" stroke="var(--bark)" stroke-width="10" stroke-linecap="round" />
          <path d="M154 270 C120 268 84 270 46 268" fill="none" stroke="var(--bark)" stroke-width="11" stroke-linecap="round" />
          <path d="M166 252 C210 250 260 252 304 250" fill="none" stroke="var(--bark)" stroke-width="11" stroke-linecap="round" />
          <!-- grass tufts and a dropped peel or two -->
          <path :d="`M14 ${GROUND_Y} l4 -10 l3 10 M120 ${GROUND_Y} l3 -8 l4 8 M196 ${GROUND_Y} l4 -11 l3 11 M300 ${GROUND_Y} l3 -9 l3 9`" fill="none" stroke="#86ad6e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
          <g :transform="`translate(150 ${GROUND_Y + 12})`">
            <path d="M0 0 Q6 -6 12 0 Q6 -2 0 0 Z M2 0 L-4 4 M10 0 L16 4" fill="#f2c230" stroke="#c99a12" stroke-width="1.5" stroke-linecap="round" />
          </g>
        </g>
      </svg>

      <button
        v-for="p in scene.monkeys"
        :key="p.monkey.id"
        type="button"
        class="monkey"
        :class="[p.activity, { selected: p.monkey.id === selectedId }]"
        :style="{
          left: `${p.x - p.size / 2}px`,
          top: `${top(p)}px`,
          width: `${p.size}px`,
          '--delay': `${p.delay}s`,
          '--dur': `${p.duration}s`,
        }"
        :aria-label="label(p)"
        :aria-expanded="p.monkey.id === selectedId"
        @click="toggle(p.monkey.id)"
      >
        <span class="mover">
          <MonkeyFigure v-bind="figureProps(p)">
            <template v-if="p.activity === 'eat'" #held>
              <PeeledBanana />
            </template>
          </MonkeyFigure>
        </span>
        <span v-if="p.activity === 'nap'" class="zzz" aria-hidden="true">z<small>z</small></span>
      </button>

      <div v-if="bubble" class="bubble" :style="{ left: `${bubble.left}px`, top: `${bubble.top}px` }" role="status">
        <strong>{{ bubble.title }}</strong>
        <span>{{ bubble.line }}</span>
      </div>

      <div v-if="scene.monkeys.length === 0" class="sign">
        <strong>Nobody here yet</strong>
        <span>Feed your first monkey and it moves in here.</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scroller {
  overflow-x: auto;
  overflow-y: hidden;
  border-radius: var(--radius-lg);
  background: var(--leaf-50);
  scroll-snap-type: x proximity;
  -webkit-overflow-scrolling: touch;
}

.scroller:focus-visible {
  outline: 3px solid var(--banana-deep);
  outline-offset: 2px;
}

.scene {
  position: relative;
  min-width: 100%;
}

.backdrop {
  position: absolute;
  inset: 0;
}

.monkey {
  position: absolute;
  aspect-ratio: 100 / 130;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  border-radius: 40%;
}

.monkey.selected {
  outline: 3px solid var(--banana-deep);
  outline-offset: 2px;
  background: rgba(242, 194, 48, 0.18);
}

.mover {
  display: block;
  width: 100%;
  height: 100%;
  animation-duration: var(--dur);
  animation-delay: var(--delay);
  animation-iteration-count: infinite;
  animation-timing-function: ease-in-out;
}

/* What each monkey is up to */
.eat .mover {
  animation-name: nibble;
  transform-origin: 50% 90%;
}
.wave .mover {
  animation-name: sway;
  animation-direction: alternate;
  transform-origin: 50% 90%;
}
.nap .mover {
  animation-name: breathe;
  animation-duration: calc(var(--dur) * 1.6);
  transform-origin: 50% 90%;
}
.swing .mover {
  animation-name: swing;
  animation-direction: alternate;
  transform-origin: 50% 1.5%;
}
.stroll .mover {
  animation-name: stroll;
  animation-duration: calc(var(--dur) * 4);
  animation-timing-function: linear;
}
.bounce .mover {
  animation-name: hop;
  animation-duration: calc(var(--dur) * 0.6);
  transform-origin: 50% 100%;
}

.zzz {
  position: absolute;
  right: -6px;
  top: -4px;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 16px;
  color: var(--leaf-700);
  animation: float-z 2.4s ease-out infinite;
  animation-delay: var(--delay);
  pointer-events: none;
}

.zzz small {
  font-size: 11px;
  margin-left: 1px;
}

.bubble {
  position: absolute;
  width: 230px;
  z-index: 3;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  background: var(--white);
  border-radius: var(--radius-md);
  box-shadow: 0 6px 18px rgba(30, 58, 43, 0.18);
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-muted);
  animation: pop-in 0.2s ease-out;
}

.bubble strong {
  font-family: var(--font-display);
  font-size: 17px;
  color: var(--leaf-900);
  line-height: 1.15;
}

.sign {
  position: absolute;
  left: 50%;
  bottom: 40px;
  transform: translateX(-50%);
  width: min(260px, 80%);
  padding: 12px 14px;
  text-align: center;
  background: #f6ead2;
  border: 3px solid var(--bark);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 14px;
  color: var(--leaf-900);
}

.sign strong {
  font-family: var(--font-display);
  font-size: 18px;
}

@keyframes nibble {
  0%,
  100% {
    transform: none;
  }
  50% {
    transform: scale(1.02, 0.98);
  }
}

@keyframes sway {
  from {
    transform: rotate(-6deg);
  }
  to {
    transform: rotate(6deg);
  }
}

@keyframes breathe {
  0%,
  100% {
    transform: none;
  }
  50% {
    transform: scale(1.03, 1.04);
  }
}

@keyframes swing {
  from {
    transform: rotate(-16deg);
  }
  to {
    transform: rotate(16deg);
  }
}

@keyframes stroll {
  0% {
    transform: translate(0, 0);
  }
  12.5% {
    transform: translate(9px, -3px);
  }
  25% {
    transform: translate(18px, 0);
  }
  37.5% {
    transform: translate(27px, -3px);
  }
  50% {
    transform: translate(36px, 0);
  }
  62.5% {
    transform: translate(27px, -3px);
  }
  75% {
    transform: translate(18px, 0);
  }
  87.5% {
    transform: translate(9px, -3px);
  }
  100% {
    transform: translate(0, 0);
  }
}

@keyframes hop {
  0%,
  100% {
    transform: none;
  }
  15% {
    transform: scale(1.06, 0.92);
  }
  45% {
    transform: translateY(-22%);
  }
  75% {
    transform: scale(1.04, 0.95);
  }
}

@keyframes float-z {
  0% {
    opacity: 0;
    transform: translate(0, 6px);
  }
  30% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(8px, -16px);
  }
}

@keyframes pop-in {
  from {
    opacity: 0;
    transform: translateY(4px) scale(0.96);
  }
}
</style>
