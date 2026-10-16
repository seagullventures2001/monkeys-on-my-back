<script setup lang="ts">
import type { Mood } from '@/lib/monkey'
import MonkeyFace from './MonkeyFace.vue'

// A whole monkey sitting on a branch: big head, small body.
// viewBox is 100 x 130; the head fills the top 100 units, the body hangs below it.
// The monkey "sits" at y = 116 (see SIT_Y in lib/layout.ts).
withDefaults(defineProps<{ mood?: Mood }>(), { mood: 0 })
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

    <!-- arms: waving with joy when very happy, otherwise resting -->
    <template v-if="mood === 0">
      <path d="M36 98 Q26 94 24 84" fill="none" stroke="var(--fur)" stroke-width="7" stroke-linecap="round" />
      <path d="M64 98 Q74 94 76 84" fill="none" stroke="var(--fur)" stroke-width="7" stroke-linecap="round" />
      <circle cx="24" cy="82" r="4.5" fill="var(--face)" />
      <circle cx="76" cy="82" r="4.5" fill="var(--face)" />
    </template>
    <template v-else>
      <path d="M36 96 Q32 105 37 113" fill="none" stroke="var(--fur)" stroke-width="7" stroke-linecap="round" />
      <path d="M64 96 Q68 105 63 113" fill="none" stroke="var(--fur)" stroke-width="7" stroke-linecap="round" />
      <circle cx="38" cy="114" r="4.5" fill="var(--face)" />
      <circle cx="62" cy="114" r="4.5" fill="var(--face)" />
    </template>

    <!-- the head sits on top of everything -->
    <svg x="0" y="0" width="100" height="100" viewBox="0 0 100 100" overflow="visible">
      <MonkeyFace :mood="mood" />
    </svg>
  </svg>
</template>
