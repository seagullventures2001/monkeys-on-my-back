<script setup lang="ts">
import MonkeyFigure from '@/components/MonkeyFigure.vue'
import AvatarFigure from '@/components/AvatarFigure.vue'
import { useAvatarStore } from '@/stores/avatar'
import { defaultAvatar } from '@/lib/avatar'

// What Household offers, shown when Pro isn't unlocked (see lib/pro.ts).
// Each person stands by their own tree. Yours is real; the other is a placeholder.
const me = useAvatarStore()
</script>

<template>
  <main class="page">
    <span class="badge">Pro · Coming soon</span>
    <h1>Household</h1>
    <p class="lead muted">Share the jobs around the house with the people you live with.</p>

    <div class="art" aria-hidden="true">
      <div class="tree-pair">
        <span v-if="me.avatar" class="person you"><AvatarFigure :avatar="me.avatar" /></span>
        <span v-if="me.avatar" class="person them">
          <AvatarFigure :avatar="defaultAvatar(me.avatar.body === 'male' ? 'female' : 'male')" />
          <span class="q">?</span>
        </span>
        <svg viewBox="0 0 140 150" class="mini-tree">
          <circle cx="70" cy="55" r="48" fill="var(--leaf-300)" />
          <rect x="62" y="70" width="16" height="80" rx="4" fill="var(--bark)" />
          <path d="M70 92 H22" stroke="var(--bark)" stroke-width="7" stroke-linecap="round" />
        </svg>
        <svg viewBox="0 0 140 150" class="mini-tree">
          <circle cx="70" cy="55" r="48" fill="var(--leaf-300)" />
          <rect x="62" y="70" width="16" height="80" rx="4" fill="var(--bark)" />
          <path d="M70 92 H118" stroke="var(--bark)" stroke-width="7" stroke-linecap="round" />
        </svg>
        <span class="m m1"><MonkeyFigure :mood="0" /></span>
        <span class="m m2"><MonkeyFigure :mood="1" pose="rest" /></span>
      </div>
    </div>
    <p v-if="me.avatar" class="caption muted">You by your tree, and whoever you share with by theirs.</p>

    <ul class="features">
      <li>
        <strong>Two trees, side by side</strong>
        <span>See your partner's monkeys next to yours, or swipe between trees.</span>
      </li>
      <li>
        <strong>Hand a monkey over</strong>
        <span>Assign a job to someone else in the household.</span>
      </li>
      <li>
        <strong>Family mode</strong>
        <span>Kids get their own tree. They feed the monkey, a parent approves, and they earn rewards.</span>
      </li>
    </ul>
  </main>
</template>

<style scoped>
.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--banana);
  color: var(--leaf-900);
  font-size: 13px;
  font-weight: 800;
}

h1 {
  margin-top: 10px;
  font-size: clamp(30px, 9vw, 38px);
  font-weight: 800;
}

.lead {
  margin: 6px 0 0;
  font-size: 15px;
  line-height: 1.45;
}

.art {
  margin: 20px 0;
  display: flex;
  justify-content: center;
}

.tree-pair {
  position: relative;
  display: flex;
  gap: 18px;
}

.mini-tree {
  width: 130px;
}

.person {
  position: absolute;
  bottom: -4px;
  height: 120px;
  aspect-ratio: 120 / 300;
  z-index: 1;
}

.you {
  left: -30px;
}

.them {
  right: -30px;
  filter: grayscale(1);
  opacity: 0.35;
}

.q {
  position: absolute;
  left: 50%;
  top: -30px;
  transform: translateX(-50%);
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 800;
  color: var(--leaf-900);
}

.caption {
  margin: -8px 0 16px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
}

.m {
  position: absolute;
  width: 42px;
  aspect-ratio: 100 / 130;
}

.m1 {
  left: 18px;
  top: 47px;
}

.m2 {
  right: 18px;
  top: 47px;
}

.features {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.features li {
  background: var(--white);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.features strong {
  font-family: var(--font-display);
  font-size: 18px;
}

.features span {
  font-size: 14px;
  color: var(--ink-muted);
  line-height: 1.4;
}
</style>
