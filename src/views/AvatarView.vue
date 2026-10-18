<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AvatarFigure from '@/components/AvatarFigure.vue'
import { useAvatarStore } from '@/stores/avatar'
import {
  BODIES,
  BOTTOMS,
  FEET,
  HAIR_COLORS,
  HAIR_STYLES,
  SKINS,
  TOP_COLORS,
  TOPS,
  defaultAvatar,
  withBody,
  type Avatar,
  type Body,
} from '@/lib/avatar'

// Change how you look. Every tap saves straight away (and to your profile when signed in).
const me = useAvatarStore()
const router = useRouter()

const avatar = computed<Avatar>(() => me.avatar ?? defaultAvatar('male'))

function change(patch: Partial<Avatar>) {
  me.set({ ...avatar.value, ...patch })
}

function setBody(body: Body) {
  me.set(withBody(avatar.value, body))
}

const hairStyles = computed(() => HAIR_STYLES[avatar.value.body])

function done() {
  if (window.history.state?.back) router.back()
  else router.push('/')
}
</script>

<template>
  <main class="page">
    <button type="button" class="back" @click="done">
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      Back to the tree
    </button>
    <h1>Your avatar</h1>

    <div class="stage" aria-hidden="true">
      <svg class="stage-tree" viewBox="0 0 200 200">
        <circle cx="100" cy="70" r="62" fill="var(--leaf-300)" />
        <circle cx="62" cy="96" r="36" fill="var(--leaf-200)" />
        <circle cx="140" cy="96" r="38" fill="var(--leaf-200)" />
        <rect x="92" y="100" width="16" height="100" rx="5" fill="var(--bark)" />
      </svg>
      <div class="ground" />
      <span class="figure"><AvatarFigure :avatar="avatar" /></span>
    </div>

    <section class="card">
      <h2 id="body-h">Body</h2>
      <div class="pills" role="radiogroup" aria-labelledby="body-h">
        <button
          v-for="b in BODIES"
          :key="b.id"
          type="button"
          role="radio"
          class="pill"
          :class="{ on: avatar.body === b.id }"
          :aria-checked="avatar.body === b.id"
          @click="setBody(b.id)"
        >
          {{ b.label }}
        </button>
      </div>

      <h3 id="skin-h">Skin</h3>
      <div class="swatches" role="radiogroup" aria-labelledby="skin-h">
        <button
          v-for="s in SKINS"
          :key="s.id"
          type="button"
          role="radio"
          class="swatch"
          :class="{ on: avatar.skin === s.id }"
          :style="{ '--c': s.color }"
          :aria-checked="avatar.skin === s.id"
          :aria-label="s.label"
          @click="change({ skin: s.id })"
        />
      </div>
    </section>

    <section class="card">
      <h2 id="hair-h">Hair</h2>
      <div class="tiles" role="radiogroup" aria-labelledby="hair-h">
        <button
          v-for="h in hairStyles"
          :key="h.id"
          type="button"
          role="radio"
          class="tile"
          :class="{ on: avatar.hair === h.id }"
          :aria-checked="avatar.hair === h.id"
          @click="change({ hair: h.id })"
        >
          <span class="tile-head"><AvatarFigure :avatar="{ ...avatar, hair: h.id }" part="head" /></span>
          <span>{{ h.label }}</span>
        </button>
      </div>

      <h3 id="haircol-h">Colour</h3>
      <div class="swatches" role="radiogroup" aria-labelledby="haircol-h">
        <button
          v-for="s in HAIR_COLORS"
          :key="s.id"
          type="button"
          role="radio"
          class="swatch"
          :class="{ on: avatar.hairColor === s.id }"
          :style="{ '--c': s.color }"
          :aria-checked="avatar.hairColor === s.id"
          :aria-label="s.label"
          @click="change({ hairColor: s.id })"
        />
      </div>
    </section>

    <section class="card">
      <h2 id="top-h">Shirt</h2>
      <div class="pills" role="radiogroup" aria-labelledby="top-h">
        <button
          v-for="t in TOPS"
          :key="t.id"
          type="button"
          role="radio"
          class="pill"
          :class="{ on: avatar.top === t.id }"
          :aria-checked="avatar.top === t.id"
          @click="change({ top: t.id })"
        >
          {{ t.label }}
        </button>
      </div>

      <h3 id="topcol-h">Colour</h3>
      <div class="swatches" role="radiogroup" aria-labelledby="topcol-h">
        <button
          v-for="s in TOP_COLORS"
          :key="s.id"
          type="button"
          role="radio"
          class="swatch"
          :class="{ on: avatar.topColor === s.id }"
          :style="{ '--c': s.color }"
          :aria-checked="avatar.topColor === s.id"
          :aria-label="s.label"
          @click="change({ topColor: s.id })"
        />
      </div>
    </section>

    <section class="card">
      <h2 id="bottom-h">Pants</h2>
      <div class="pills" role="radiogroup" aria-labelledby="bottom-h">
        <button
          v-for="b in BOTTOMS"
          :key="b.id"
          type="button"
          role="radio"
          class="pill"
          :class="{ on: avatar.bottom === b.id }"
          :aria-checked="avatar.bottom === b.id"
          @click="change({ bottom: b.id })"
        >
          {{ b.label }}
        </button>
      </div>

      <h3 id="feet-h">On your feet</h3>
      <div class="pills" role="radiogroup" aria-labelledby="feet-h">
        <button
          v-for="f in FEET"
          :key="f.id"
          type="button"
          role="radio"
          class="pill"
          :class="{ on: avatar.feet === f.id }"
          :aria-checked="avatar.feet === f.id"
          @click="change({ feet: f.id })"
        >
          {{ f.label }}
        </button>
      </div>
    </section>

    <p class="soon">More outfits on the way: hats, sunnies, footy jerseys and more.</p>

    <p v-if="me.error" class="error" role="alert">{{ me.error }}</p>

    <button type="button" class="btn btn-primary done" @click="done">Done</button>
  </main>
</template>

<style scoped>
.back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 44px;
  margin-bottom: 4px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--leaf-700);
  font-weight: 800;
  cursor: pointer;
}

h1 {
  font-size: 36px;
  font-weight: 800;
  margin-bottom: 12px;
}

/* The preview stays in view while you scroll through the options. */
.stage {
  position: sticky;
  top: 0;
  z-index: 2;
  height: 230px;
  margin: 0 -20px 14px;
  overflow: hidden;
  background: var(--leaf-100);
  box-shadow: 0 8px 12px -10px rgba(30, 58, 43, 0.35);
}

.stage-tree {
  position: absolute;
  left: 50%;
  bottom: 30px;
  width: 200px;
  transform: translateX(-10%);
}

.ground {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 40px;
  background: #b9d4a4;
}

.figure {
  position: absolute;
  left: 50%;
  bottom: 12px;
  height: 205px;
  aspect-ratio: 120 / 300;
  transform: translateX(-62%);
}

.card {
  background: var(--white);
  border-radius: var(--radius-lg);
  padding: 18px;
  margin-bottom: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card h2 {
  font-size: 20px;
}

.card h3 {
  margin-top: 6px;
  font-size: 15px;
  color: var(--ink-muted);
}

.pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pill {
  min-height: 44px;
  padding: 0 16px;
  border-radius: 999px;
  border: 2px solid var(--leaf-300);
  background: var(--white);
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;
}

.pill.on {
  background: var(--leaf-900);
  border-color: var(--leaf-900);
  color: var(--white);
}

.swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.swatch {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 3px solid var(--white);
  background: var(--c);
  box-shadow: 0 0 0 2px var(--leaf-300);
  cursor: pointer;
}

.swatch.on {
  box-shadow: 0 0 0 3px var(--leaf-900);
}

.tiles {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 4px 6px;
  border-radius: var(--radius-sm);
  border: 2px solid var(--leaf-300);
  background: var(--white);
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.tile.on {
  border-color: var(--leaf-900);
  background: var(--leaf-100);
  box-shadow: inset 0 0 0 1px var(--leaf-900);
}

.tile-head {
  width: 52px;
  aspect-ratio: 84 / 92;
}

.soon {
  margin: 0 0 14px;
  padding: 12px 14px;
  border: 2px dashed var(--leaf-300);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 700;
  color: var(--ink-muted);
  text-align: center;
}

.error {
  color: var(--danger);
  font-weight: 700;
}

.done {
  width: 100%;
}
</style>
