<script setup lang="ts">
import { computed } from 'vue'
import TroopTree from './TroopTree.vue'
import AvatarFigure from './AvatarFigure.vue'
import type { Avatar } from '@/lib/avatar'
import { byPriority, type Monkey } from '@/lib/monkey'
import { splitTroop } from '@/lib/layout'

// One person's tree in the household, with them standing beside it.
const props = defineProps<{ title: string; avatar: Avatar | null; monkeys: Monkey[]; selectedId: string | null }>()
const emit = defineEmits<{ select: [id: string] }>()

const split = computed(() => splitTroop([...props.monkeys].sort(byPriority())))
const countLine = computed(() => {
  const n = props.monkeys.length
  if (n === 0) return 'No monkeys right now'
  const more = split.value.waiting.length
  return `${n} monkey${n === 1 ? '' : 's'}${more ? ` (${more} in the bushes)` : ''}`
})
</script>

<template>
  <section class="person-tree" :aria-label="title">
    <header>
      <h2>{{ title }}</h2>
      <span class="muted">{{ countLine }}</span>
    </header>
    <TroopTree :monkeys="split.onTree" :selected-id="selectedId" @select="emit('select', $event)">
      <template #behind>
        <div v-if="avatar" class="me"><AvatarFigure :avatar="avatar" /></div>
      </template>
    </TroopTree>
  </section>
</template>

<style scoped>
.person-tree {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  padding: 0 4px;
}

h2 {
  font-size: 22px;
}

header .muted {
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
}

/* Same framing as the main tree: head level with the top branch, feet at the base. */
.me {
  position: absolute;
  left: -3%;
  top: 28%;
  height: 77%;
  aspect-ratio: 120 / 300;
  pointer-events: none;
}
</style>
