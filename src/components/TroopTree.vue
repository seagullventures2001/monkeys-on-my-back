<script setup lang="ts">
import { computed } from 'vue'
import MonkeyFigure from './MonkeyFigure.vue'
import BananaIcon from './BananaIcon.vue'
import { formatAge, moodFor, type Monkey } from '@/lib/monkey'
import { placeMonkeys, TREE_H, TREE_W } from '@/lib/layout'

const props = defineProps<{ monkeys: Monkey[]; selectedId: string | null }>()
const emit = defineEmits<{ select: [id: string] }>()

const now = new Date()
const layout = computed(() => placeMonkeys(props.monkeys, now))
</script>

<template>
  <div class="tree" :style="{ aspectRatio: `${TREE_W} / ${TREE_H}` }">
    <svg class="tree-art" :viewBox="`0 0 ${TREE_W} ${TREE_H}`" aria-hidden="true">
      <circle cx="110" cy="120" r="80" fill="var(--leaf-300)" />
      <circle cx="240" cy="100" r="88" fill="var(--leaf-300)" />
      <circle cx="180" cy="60" r="70" fill="#c3dcb0" />
      <circle cx="70" cy="210" r="56" fill="var(--leaf-200)" />
      <circle cx="290" cy="200" r="58" fill="var(--leaf-200)" />
      <path d="M160 380 C166 300 168 220 172 120 L188 120 C192 220 196 300 202 380 Z" fill="var(--bark)" />
      <path d="M176 252 C140 248 90 254 36 250" fill="none" stroke="var(--bark)" stroke-width="12" stroke-linecap="round" />
      <path d="M182 202 C220 200 280 204 334 200" fill="none" stroke="var(--bark)" stroke-width="11" stroke-linecap="round" />
      <path d="M176 142 C150 140 110 142 66 140" fill="none" stroke="var(--bark)" stroke-width="10" stroke-linecap="round" />
      <path d="M184 112 C220 110 260 112 300 110" fill="none" stroke="var(--bark)" stroke-width="9" stroke-linecap="round" />
      <path d="M184 302 C220 300 270 304 324 300" fill="none" stroke="var(--bark)" stroke-width="11" stroke-linecap="round" />
      <path d="M0 376 H358" stroke="var(--leaf-400)" stroke-width="8" />
    </svg>

    <TransitionGroup name="monkey">
      <button
        v-for="p in layout.placed"
        :key="p.monkey.id"
        type="button"
        class="monkey"
        :class="{ selected: p.monkey.id === selectedId }"
        :style="{ left: `${p.left}%`, top: `${p.top}%`, width: `${p.width}%` }"
        :aria-label="`${p.monkey.title}, on your back for ${formatAge(p.monkey.createdAt, now)}`"
        :aria-pressed="p.monkey.id === selectedId"
        @click="emit('select', p.monkey.id)"
      >
        <MonkeyFigure :mood="moodFor(p.monkey.createdAt, now)" />
        <span class="banana"><BananaIcon :size="28" /></span>
      </button>
    </TransitionGroup>

  </div>
</template>

<style scoped>
.tree {
  position: relative;
  width: 100%;
}

.tree-art {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.monkey {
  position: absolute;
  aspect-ratio: 100 / 130;
  padding: 0;
  border: 0;
  background: transparent;
  border-radius: 40% 40% 30% 30%;
  cursor: pointer;
  /* When a monkey leaves, the others shuffle up into the free seats. */
  transition:
    transform 0.15s ease,
    left 0.6s ease 0.5s,
    top 0.6s ease 0.5s,
    width 0.6s ease 0.5s;
}

.monkey:hover {
  transform: translateY(-2px);
}

.monkey.selected {
  outline: 3px solid var(--banana-deep);
  outline-offset: 2px;
  background: rgba(242, 194, 48, 0.18);
}

.banana {
  position: absolute;
  left: 50%;
  top: -10%;
  transform: translateX(-50%);
  opacity: 0;
  pointer-events: none;
}

/* A new monkey drops in from the canopy. */
.monkey-enter-active {
  animation: drop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Fed monkey grabs the banana, hops, and leaps off the tree. */
.monkey-leave-active {
  animation: jump-off 0.9s ease-in forwards;
  pointer-events: none;
  z-index: 2;
}

.monkey-leave-active .banana {
  animation: banana-in 0.9s ease-out forwards;
}

@keyframes drop-in {
  from {
    transform: translateY(-60px) scale(0.6);
    opacity: 0;
  }
  to {
    transform: none;
    opacity: 1;
  }
}

@keyframes jump-off {
  0% {
    transform: none;
  }
  30% {
    transform: translateY(-8px) scale(1.08);
  }
  45% {
    transform: translateY(4px) scale(0.96, 1.04);
  }
  100% {
    transform: translate(160px, -140px) rotate(35deg) scale(0.6);
    opacity: 0;
  }
}

@keyframes banana-in {
  0% {
    opacity: 0;
    transform: translate(-50%, -30px);
  }
  30% {
    opacity: 1;
    transform: translate(-50%, 0);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

</style>
