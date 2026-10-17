<script setup lang="ts">
import type { Mood } from '@/lib/monkey'

// 0 very happy · 1 happy · 2 stressed · 3 crying
// chewing: happy squeezed eyes, puffed cheeks and a munching mouth (used while eating the banana).
// sleeping: a contented nap, eyes closed and a little "o" mouth (Troop playground).
withDefaults(defineProps<{ mood?: Mood; label?: string; chewing?: boolean; sleeping?: boolean }>(), {
  mood: 0,
  label: '',
  chewing: false,
  sleeping: false,
})
</script>

<template>
  <svg
    viewBox="0 0 100 100"
    width="100%"
    height="100%"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
  >
    <!-- ears -->
    <circle cx="15" cy="50" r="14" fill="var(--fur)" />
    <circle cx="85" cy="50" r="14" fill="var(--fur)" />
    <circle cx="15" cy="50" r="7.5" fill="var(--face)" />
    <circle cx="85" cy="50" r="7.5" fill="var(--face)" />
    <!-- head and heart-shaped face -->
    <circle cx="50" cy="52" r="37" fill="var(--fur)" />
    <path
      d="M50 38 C44 28 26 30 26 46 C26 54 29 59 31 62 C30 76 40 84 50 84 C60 84 70 76 69 62 C71 59 74 54 74 46 C74 30 56 28 50 38 Z"
      fill="var(--face)"
    />

    <!-- rosy cheeks when happy -->
    <g v-if="chewing" fill="#f2a08a" opacity="0.6">
      <ellipse class="cheek" cx="32" cy="63" rx="7" ry="5" />
      <ellipse class="cheek" cx="68" cy="63" rx="7" ry="5" />
    </g>
    <g v-else-if="mood <= 1" fill="#f2a08a" opacity="0.55">
      <ellipse cx="33" cy="62" rx="5" ry="3.2" />
      <ellipse cx="67" cy="62" rx="5" ry="3.2" />
    </g>

    <!-- EYES -->
    <!-- asleep: relaxed closed eyes -->
    <path
      v-if="sleeping"
      d="M35 50 Q40 54 45 50 M55 50 Q60 54 65 50"
      fill="none"
      stroke="#2a1a10"
      stroke-width="3"
      stroke-linecap="round"
    />
    <!-- very happy: squeezed shut with joy -->
    <path
      v-else-if="mood === 0 || chewing"
      d="M35 51 Q40 44 45 51 M55 51 Q60 44 65 51"
      fill="none"
      stroke="#2a1a10"
      stroke-width="3.4"
      stroke-linecap="round"
    />
    <!-- open eyes, bigger when crying -->
    <template v-else>
      <ellipse cx="40" cy="50" :rx="mood === 3 ? 5.6 : 4.6" :ry="mood === 3 ? 6.6 : 5.4" fill="#2a1a10" />
      <ellipse cx="60" cy="50" :rx="mood === 3 ? 5.6 : 4.6" :ry="mood === 3 ? 6.6 : 5.4" fill="#2a1a10" />
      <circle cx="41.8" cy="47.6" r="1.9" fill="#ffffff" />
      <circle cx="61.8" cy="47.6" r="1.9" fill="#ffffff" />
    </template>

    <!-- worried brows: inner ends lifted, never angry -->
    <path
      v-if="mood >= 2 && !chewing"
      d="M32 41 Q38 40 45 36 M68 41 Q62 40 55 36"
      fill="none"
      stroke="#2a1a10"
      stroke-width="3"
      stroke-linecap="round"
    />

    <ellipse cx="50" cy="61" rx="3.5" ry="2.2" fill="#6b4a2b" />

    <!-- MOUTHS -->
    <!-- asleep: a small round snore -->
    <ellipse v-if="sleeping" cx="50" cy="71" rx="3" ry="3.4" fill="#5a2a1c" />
    <!-- chewing: alternates between a closed happy munch and a small open bite -->
    <g v-else-if="chewing">
      <path class="munch-closed" d="M42 70 Q50 76 58 70" fill="none" stroke="#2a1a10" stroke-width="3" stroke-linecap="round" />
      <ellipse class="munch-open" cx="50" cy="71" rx="5" ry="3.6" fill="#5a2a1c" stroke="#2a1a10" stroke-width="2" />
    </g>
    <!-- very happy: big open grin -->
    <g v-else-if="mood === 0">
      <path d="M39 66 Q50 82 61 66 Z" fill="#5a2a1c" stroke="#2a1a10" stroke-width="2.4" stroke-linejoin="round" />
      <path d="M44 73 Q50 78 56 73 Q50 71 44 73 Z" fill="#e46f6f" />
    </g>
    <!-- happy: warm smile -->
    <path v-else-if="mood === 1" d="M41 68 Q50 77 59 68" fill="none" stroke="#2a1a10" stroke-width="3" stroke-linecap="round" />
    <!-- stressed: nervous gritted-teeth grimace -->
    <g v-else-if="mood === 2">
      <rect x="41" y="68" width="18" height="7" rx="3" fill="#ffffff" stroke="#2a1a10" stroke-width="2.4" />
      <path d="M41.5 71.5 H58.5 M47 68.5 V74.5 M53 68.5 V74.5" stroke="#2a1a10" stroke-width="1.3" />
    </g>
    <!-- crying: open wobbly wail -->
    <path
      v-else
      d="M41 76 Q50 64 59 76 Q50 73 41 76 Z"
      fill="#5a2a1c"
      stroke="#2a1a10"
      stroke-width="2.4"
      stroke-linejoin="round"
    />

    <!-- stressed: sweat drop -->
    <path v-if="mood === 2 && !chewing" d="M74 30 Q69 38 72 41 Q76 43 77 38 Q77 34 74 30 Z" fill="#8fcbef" stroke="#4a9bd0" stroke-width="1" />

    <!-- crying: watery eyes and streaming tears -->
    <g v-if="mood === 3 && !chewing" fill="#6cb8e6">
      <path d="M34 55 Q40 59 46 55 Q40 57 34 55 Z" />
      <path d="M54 55 Q60 59 66 55 Q60 57 54 55 Z" />
      <path d="M36 57 Q32 66 34 74 Q38 74 38 66 Q38 61 36 57 Z" />
      <path d="M64 57 Q68 66 66 74 Q62 74 62 66 Q62 61 64 57 Z" />
    </g>
  </svg>
</template>

<style scoped>
.munch-closed {
  animation: munch 0.36s steps(1, end) infinite;
}
.munch-open {
  animation: munch 0.36s steps(1, end) infinite reverse;
}
.cheek {
  transform-box: fill-box;
  transform-origin: center;
  animation: puff 0.36s ease-in-out infinite alternate;
}
@keyframes munch {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
@keyframes puff {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.18);
  }
}
</style>
