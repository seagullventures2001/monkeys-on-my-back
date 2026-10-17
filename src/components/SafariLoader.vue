<script setup lang="ts">
import MonkeyFace from './MonkeyFace.vue'
import { randomFact } from '@/lib/facts'

// A little safari bus (with a monkey passenger) driving to the troop,
// plus a fun fact to read on the way. Tap anywhere to skip.
const emit = defineEmits<{ skip: [] }>()
const fact = randomFact()

// Bushes and trees along the roadside, drawn twice so the strip can loop seamlessly.
const roadside = [
  { x: 20, r: 18, tree: false },
  { x: 95, r: 0, tree: true },
  { x: 170, r: 24, tree: false },
  { x: 230, r: 14, tree: false },
  { x: 310, r: 0, tree: true },
  { x: 380, r: 20, tree: false },
]
</script>

<template>
  <div class="loader" role="status" aria-live="polite" @click="emit('skip')">
    <p class="sr-only">Loading your troop.</p>

    <div class="road-scene" aria-hidden="true">
      <div class="sun" />
      <div class="strip hills">
        <svg v-for="n in 2" :key="n" viewBox="0 0 440 120" preserveAspectRatio="none">
          <path d="M0 120 L0 70 Q60 20 130 60 Q200 100 260 50 Q330 0 440 70 L440 120 Z" fill="var(--leaf-200)" />
        </svg>
      </div>
      <div class="strip roadside">
        <svg v-for="n in 2" :key="n" viewBox="0 0 440 110">
          <template v-for="(b, i) in roadside" :key="i">
            <g v-if="b.tree">
              <rect :x="b.x - 5" y="40" width="10" height="70" fill="var(--bark)" />
              <circle :cx="b.x" cy="38" r="30" fill="var(--leaf-300)" />
              <circle :cx="b.x + 18" cy="50" r="18" fill="#c3dcb0" />
            </g>
            <g v-else>
              <circle :cx="b.x" :cy="110 - b.r * 0.6" :r="b.r" fill="#a7c690" />
              <circle :cx="b.x + b.r * 0.9" :cy="110 - b.r * 0.4" :r="b.r * 0.7" fill="#b9d4a4" />
            </g>
          </template>
        </svg>
      </div>
      <div class="road">
        <div class="dashes" />
      </div>

      <svg class="bus" viewBox="0 0 220 130">
        <!-- banana strapped to the roof rack -->
        <path d="M70 28 C80 40 110 40 122 26" fill="none" stroke="#f2c230" stroke-width="9" stroke-linecap="round" />
        <path d="M121 27 L126 21" stroke="#a77a10" stroke-width="3" stroke-linecap="round" />
        <path d="M40 36 H180 M60 30 V40 M160 30 V40" stroke="#6b4a2b" stroke-width="3" stroke-linecap="round" />
        <!-- body -->
        <rect x="14" y="38" width="190" height="64" rx="16" fill="#e0b45c" />
        <rect x="14" y="80" width="190" height="9" fill="var(--leaf-700)" />
        <rect x="192" y="58" width="16" height="30" rx="6" fill="#d19f45" />
        <!-- windows -->
        <rect x="28" y="48" width="40" height="26" rx="6" fill="#d8eef6" />
        <rect x="80" y="48" width="44" height="26" rx="6" fill="#d8eef6" />
        <rect x="136" y="48" width="40" height="26" rx="6" fill="#d8eef6" />
        <!-- monkey passenger leaning out of the middle window -->
        <svg x="84" y="30" width="36" height="36" viewBox="0 0 100 100" overflow="visible">
          <MonkeyFace :mood="0" />
        </svg>
        <rect x="80" y="64" width="44" height="10" rx="3" fill="#e0b45c" />
        <!-- headlight -->
        <circle cx="200" cy="62" r="5" fill="#fff6c8" stroke="#d19f45" stroke-width="2" />
        <!-- wheels -->
        <g class="wheel">
          <circle cx="58" cy="104" r="17" fill="#3a2a1e" />
          <circle cx="58" cy="104" r="7" fill="#cfcfcf" />
          <path d="M58 92 V116 M46 104 H70" stroke="#3a2a1e" stroke-width="3" />
        </g>
        <g class="wheel">
          <circle cx="164" cy="104" r="17" fill="#3a2a1e" />
          <circle cx="164" cy="104" r="7" fill="#cfcfcf" />
          <path d="M164 92 V116 M152 104 H176" stroke="#3a2a1e" stroke-width="3" />
        </g>
      </svg>
    </div>

    <div class="words">
      <p class="heading">Heading to the troop…</p>
      <p class="label">Did you know?</p>
      <p class="fact">{{ fact }}</p>
      <p class="skip muted">Tap to skip</p>
    </div>
  </div>
</template>

<style scoped>
.loader {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 18px;
  padding: calc(24px + var(--safe-top)) 24px calc(110px + var(--safe-bottom));
  background: var(--leaf-100);
  cursor: pointer;
}

.road-scene {
  position: relative;
  width: min(100vw, 520px);
  height: 230px;
  overflow: hidden;
}

.sun {
  position: absolute;
  right: 18%;
  top: 6px;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: var(--banana);
  opacity: 0.85;
}

.strip {
  position: absolute;
  left: 0;
  display: flex;
  width: 200%;
  animation: scroll linear infinite;
}

.strip svg {
  width: 50%;
  flex: none;
}

.hills {
  bottom: 70px;
  height: 120px;
  animation-duration: 14s;
}

.hills svg {
  height: 120px;
}

.roadside {
  bottom: 52px;
  height: 110px;
  animation-duration: 5s;
}

.road {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 54px;
  background: #c9a97a;
  overflow: hidden;
}

.dashes {
  position: absolute;
  left: 0;
  top: 24px;
  width: 200%;
  height: 6px;
  background: repeating-linear-gradient(90deg, #f6ead2 0 28px, transparent 28px 60px);
  animation: scroll 0.9s linear infinite;
}

.bus {
  position: absolute;
  left: 50%;
  bottom: 22px;
  width: 200px;
  transform: translateX(-50%);
  animation: rumble 0.32s ease-in-out infinite alternate;
  overflow: visible;
}

.wheel {
  transform-box: fill-box;
  transform-origin: center;
  animation: spin 0.6s linear infinite;
}

.words {
  max-width: 340px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.words p {
  margin: 0;
}

.heading {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 24px;
  color: var(--leaf-900);
}

.label {
  margin-top: 8px !important;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--leaf-700);
}

.fact {
  font-size: 17px;
  font-weight: 700;
  line-height: 1.4;
  color: var(--leaf-900);
}

.skip {
  margin-top: 10px !important;
  font-size: 13px;
  font-weight: 700;
}

@keyframes scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

@keyframes rumble {
  from {
    transform: translateX(-50%) translateY(0);
  }
  to {
    transform: translateX(-50%) translateY(-2px) rotate(-0.6deg);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
