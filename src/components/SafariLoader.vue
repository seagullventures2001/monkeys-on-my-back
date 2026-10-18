<script setup lang="ts">
import MonkeyFace from './MonkeyFace.vue'
import AvatarFigure from './AvatarFigure.vue'
import { randomFact } from '@/lib/facts'
import { useAvatarStore } from '@/stores/avatar'

// A little safari bus (with a monkey passenger) driving to the troop,
// plus a fun fact to read on the way. Tap anywhere to skip.
const emit = defineEmits<{ skip: [] }>()
const fact = randomFact()
// You're driving (the front window), with a monkey along for the ride.
const me = useAvatarStore()

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
        <!-- roof rack: rail on little posts -->
        <path d="M44 33 H176" stroke="#6b4a2b" stroke-width="3" stroke-linecap="round" />
        <path d="M52 33 V39 M110 33 V39 M168 33 V39" stroke="#6b4a2b" stroke-width="3" stroke-linecap="round" />
        <!-- a big banana resting on the rack, ends curling up -->
        <path
          d="M57 9 C68 20 90 25 110 25 C130 25 152 20 163 7 C166 9 166 13 164 16 C152 29 130 33 110 33 C90 33 66 29 56 17 C53 14 54 10 57 9 Z"
          fill="#f2c230"
          stroke="#c99a12"
          stroke-width="1.5"
          stroke-linejoin="round"
        />
        <path d="M68 19 C88 27 132 27 152 18" fill="none" stroke="#fff3c4" stroke-width="2" stroke-linecap="round" opacity="0.85" />
        <path d="M57 10 L52 4" stroke="#a77a10" stroke-width="3.5" stroke-linecap="round" />
        <circle cx="164" cy="9" r="2" fill="#5a3d1a" />
        <!-- ropes over the middle, tied to the rack, with a knot on top -->
        <g fill="none" stroke="#9a7444" stroke-width="2.4" stroke-linecap="round">
          <path d="M91 35 C90 29 92 23.5 96 23 C100 23 101 29 100 35" />
          <path d="M120 35 C119 29 121 23.5 125 23 C129 23 130 29 129 35" />
        </g>
        <g fill="#9a7444">
          <circle cx="96" cy="23" r="2" />
          <circle cx="125" cy="23" r="2" />
        </g>
        <path d="M96 23 L93 17 M96 23 L100 18 M125 23 L122 17 M125 23 L129 18" stroke="#9a7444" stroke-width="1.8" stroke-linecap="round" />
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
        <!-- you, at the wheel in the front window -->
        <template v-if="me.avatar">
          <svg x="138" y="27" width="38" height="42" viewBox="18 4 84 92" overflow="hidden">
            <AvatarFigure :avatar="me.avatar" part="head" />
          </svg>
          <rect x="136" y="64" width="40" height="10" rx="3" fill="#e0b45c" />
          <path d="M160 70 a7 4 0 0 1 14 0" fill="none" stroke="#3a2a1e" stroke-width="3" stroke-linecap="round" />
        </template>
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
      <p class="heading">{{ me.avatar ? 'Driving to the troop…' : 'Heading to the troop…' }}</p>
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
