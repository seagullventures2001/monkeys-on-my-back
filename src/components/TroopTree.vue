<script setup lang="ts">
import { computed } from 'vue'
import MonkeyFigure from './MonkeyFigure.vue'
import { formatAge, moodFor, type Monkey } from '@/lib/monkey'
import { placeMonkeys, TREE_H, TREE_W } from '@/lib/layout'
import { daysUntil, dueLabel, dueTag, isDueSoon } from '@/lib/due'

// happyId: a monkey that has just been fed; it smiles until it leaves the tree.
const props = defineProps<{ monkeys: Monkey[]; selectedId: string | null; happyId?: string | null }>()
const emit = defineEmits<{ select: [id: string] }>()

const now = new Date()
const layout = computed(() =>
  placeMonkeys(props.monkeys, now).placed.map((p) => {
    const soon = isDueSoon(p.monkey.dueOn, now)
    const age = `on your back for ${formatAge(p.monkey.createdAt, now)}`
    return {
      ...p,
      tag: soon ? dueTag(p.monkey.dueOn!, now) : null,
      late: soon && daysUntil(p.monkey.dueOn!, now) < 0,
      label: `${p.monkey.title}, ${soon ? `${dueLabel(p.monkey.dueOn!, now).toLowerCase()}, ` : ''}${age}`,
    }
  }),
)
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
      <!-- lower left: two short branches, one monkey each, so nobody sits in front of you -->
      <path d="M176 252 C152 250 124 252 96 250" fill="none" stroke="var(--bark)" stroke-width="12" stroke-linecap="round" />
      <path d="M176 344 C152 342 124 344 96 342" fill="none" stroke="var(--bark)" stroke-width="12" stroke-linecap="round" />
      <path d="M182 202 C220 200 280 204 334 200" fill="none" stroke="var(--bark)" stroke-width="11" stroke-linecap="round" />
      <path d="M176 142 C150 140 110 142 66 140" fill="none" stroke="var(--bark)" stroke-width="10" stroke-linecap="round" />
      <path d="M184 112 C220 110 260 112 300 110" fill="none" stroke="var(--bark)" stroke-width="9" stroke-linecap="round" />
      <path d="M184 302 C220 300 270 304 324 300" fill="none" stroke="var(--bark)" stroke-width="11" stroke-linecap="round" />
      <path d="M0 376 H358" stroke="var(--leaf-400)" stroke-width="8" />
    </svg>

    <!-- Anything standing in front of the tree but behind the monkeys (your avatar). -->
    <slot name="behind" />

    <TransitionGroup name="monkey">
      <button
        v-for="p in layout"
        :key="p.monkey.id"
        type="button"
        class="monkey"
        :class="{ selected: p.monkey.id === selectedId }"
        :style="{ left: `${p.left}%`, top: `${p.top}%`, width: `${p.width}%` }"
        :aria-label="p.label"
        :aria-pressed="p.monkey.id === selectedId"
        @click="emit('select', p.monkey.id)"
      >
        <MonkeyFigure :mood="p.monkey.id === happyId ? 0 : moodFor(p.monkey.createdAt, now)" />
        <span v-if="p.tag" class="due-tag" :class="{ late: p.late }" aria-hidden="true">{{ p.tag }}</span>
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

/* Small date tag for anything due within a week. */
.due-tag {
  position: absolute;
  left: 50%;
  bottom: -2px;
  transform: translateX(-50%);
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--due);
  color: var(--white);
  font-size: 11px;
  font-weight: 800;
  line-height: 1.5;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(30, 58, 43, 0.3);
  pointer-events: none;
}

.due-tag.late {
  background: var(--danger);
}

/* A new monkey drops in from the canopy. */
.monkey-enter-active {
  animation: drop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Fed monkey drifts up off the branch and fades away, happy. */
.monkey-leave-active {
  animation: drift-off 1.4s ease-in forwards;
  pointer-events: none;
  z-index: 2;
}

@keyframes drift-off {
  0% {
    transform: none;
    opacity: 1;
  }
  25% {
    transform: translateY(-6%) scale(1.06);
    opacity: 1;
  }
  100% {
    transform: translateY(-45%) scale(0.6);
    opacity: 0;
  }
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


</style>
