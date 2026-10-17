<script setup lang="ts">
import { computed } from 'vue'
import type { Mood } from '@/lib/monkey'
import MonkeyFace from './MonkeyFace.vue'

// A whole monkey sitting on a branch: big head, small body.
// viewBox is 100 x 130; the head fills the top 100 units, the body hangs below it.
// The monkey "sits" at y = 116 (see SIT_Y in lib/layout.ts).
//
// pose: 'auto' follows the mood (arms up when very happy), 'catch' raises both arms,
// 'eat' brings the hands to the chin, 'hang' reaches both arms straight up (grip at y = 2). Anything in the "held" slot is drawn on top,
// in the same 100 x 130 coordinates (used for the banana in the celebration).
const props = withDefaults(
  defineProps<{ mood?: Mood; pose?: 'auto' | 'catch' | 'eat' | 'rest' | 'hang'; chewing?: boolean; sleeping?: boolean }>(),
  { mood: 0, pose: 'auto', chewing: false, sleeping: false },
)
const arms = computed(() => {
  if (props.pose === 'eat') return 'eat'
  if (props.pose === 'rest') return 'rest'
  if (props.pose === 'hang') return 'hang'
  if (props.pose === 'catch' || props.mood === 0) return 'up'
  return 'rest'
})
</script>

<template>
  <svg viewBox="0 0 100 130" width="100%" height="100%" aria-hidden="true" overflow="visible">
    <!-- tail curling off the branch -->
    <path
      d="M62 114 C74 120 86 118 86 108 C86 101 79 100 78 105"
      fill="none"
      stroke="var(--fur)"
      stroke-width="4.5"
      stroke-linecap="round"
    />

    <!-- legs dangling over the branch -->
    <path d="M43 110 Q41 119 40 125" fill="none" stroke="var(--fur)" stroke-width="8" stroke-linecap="round" />
    <path d="M57 110 Q59 119 60 125" fill="none" stroke="var(--fur)" stroke-width="8" stroke-linecap="round" />
    <ellipse cx="39" cy="127" rx="5" ry="3.2" fill="var(--face)" />
    <ellipse cx="61" cy="127" rx="5" ry="3.2" fill="var(--face)" />

    <!-- little round body and belly -->
    <ellipse cx="50" cy="103" rx="17" ry="15" fill="var(--fur)" />
    <ellipse cx="50" cy="106" rx="10" ry="9" fill="var(--face)" />

    <!-- arms: up (waving or catching), at the chin (eating), or resting -->
    <template v-if="arms === 'up'">
      <path d="M36 98 Q26 94 24 84" fill="none" stroke="var(--fur)" stroke-width="7" stroke-linecap="round" />
      <path d="M64 98 Q74 94 76 84" fill="none" stroke="var(--fur)" stroke-width="7" stroke-linecap="round" />
      <circle cx="24" cy="82" r="4.5" fill="var(--face)" />
      <circle cx="76" cy="82" r="4.5" fill="var(--face)" />
    </template>
    <!-- hanging from a branch: arms straight up behind the head, hands on top (drawn later) -->
    <template v-else-if="arms === 'hang'">
      <path d="M38 97 Q34 50 39 3" fill="none" stroke="var(--fur)" stroke-width="7" stroke-linecap="round" />
      <path d="M62 97 Q66 50 61 3" fill="none" stroke="var(--fur)" stroke-width="7" stroke-linecap="round" />
    </template>
    <template v-else-if="arms === 'rest'">
      <path d="M36 96 Q32 105 37 113" fill="none" stroke="var(--fur)" stroke-width="7" stroke-linecap="round" />
      <path d="M64 96 Q68 105 63 113" fill="none" stroke="var(--fur)" stroke-width="7" stroke-linecap="round" />
      <circle cx="38" cy="114" r="4.5" fill="var(--face)" />
      <circle cx="62" cy="114" r="4.5" fill="var(--face)" />
    </template>

    <!-- the head sits on top of everything -->
    <svg x="0" y="0" width="100" height="100" viewBox="0 0 100 100" overflow="visible">
      <MonkeyFace :mood="mood" :chewing="chewing" :sleeping="sleeping" />
    </svg>

    <!-- eating: hands come up in front of the chin, drawn over the head -->
    <template v-if="arms === 'eat'">
      <path d="M36 97 Q30 90 41 86" fill="none" stroke="var(--fur)" stroke-width="7" stroke-linecap="round" />
      <path d="M64 97 Q70 90 59 86" fill="none" stroke="var(--fur)" stroke-width="7" stroke-linecap="round" />
    </template>
    <template v-if="arms === 'hang'">
      <circle cx="39" cy="2" r="4.5" fill="var(--face)" />
      <circle cx="61" cy="2" r="4.5" fill="var(--face)" />
    </template>
    <slot name="held" />
    <template v-if="arms === 'eat'">
      <circle cx="43" cy="86" r="4.5" fill="var(--face)" />
      <circle cx="57" cy="86" r="4.5" fill="var(--face)" />
    </template>
  </svg>
</template>
