<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import HouseholdTeaser from '@/components/HouseholdTeaser.vue'
import HouseholdTree from '@/components/HouseholdTree.vue'
import AvatarFigure from '@/components/AvatarFigure.vue'
import { hasPro } from '@/lib/pro'
import { defaultAvatar } from '@/lib/avatar'
import { effortShort, formatAge, type Monkey } from '@/lib/monkey'
import { dueLabel } from '@/lib/due'
import { useTroopStore } from '@/stores/troop'
import { useAvatarStore } from '@/stores/avatar'
import { useHouseholdStore } from '@/stores/household'
import type { Member } from '@/data/householdRepo'

// Household: everyone who lives with you, each with their own tree.
// You can look at their trees and hand them one of your monkeys from its details.
const pro = hasPro()
const troop = useTroopStore()
const avatar = useAvatarStore()
const house = useHouseholdStore()

onMounted(() => {
  if (pro && troop.userId) void house.load()
})

const signedIn = computed(() => troop.mode === 'supabase')
const sharing = computed(() => house.others.length > 0)

// --- Your name, so the others see "Sam's tree" rather than "Someone"
const nameInput = ref('')
const editingName = ref(false)
function startName() {
  nameInput.value = house.myName ?? ''
  editingName.value = true
}
async function saveName() {
  await house.setName(nameInput.value)
  if (!house.error) editingName.value = false
}

// --- Trees, yours first, then everyone else's
const trees = computed(() => [
  { key: 'me', title: 'Your tree', avatar: avatar.avatar, monkeys: troop.onBack, owner: 'your' },
  ...house.others.map((m) => ({
    key: m.userId,
    title: `${m.name?.trim() || 'Someone'}'s tree`,
    avatar: m.avatar,
    monkeys: house.trees[m.userId] ?? [],
    owner: `${m.name?.trim() || 'their'}'s`,
  })),
])
const selected = ref<{ tree: string; monkey: Monkey } | null>(null)
function select(treeKey: string, id: string) {
  const tree = trees.value.find((t) => t.key === treeKey)
  const monkey = tree?.monkeys.find((m) => m.id === id)
  selected.value = monkey && selected.value?.monkey.id !== id ? { tree: treeKey, monkey } : null
}
const selectedInfo = computed(() => {
  const s = selected.value
  if (!s) return null
  const tree = trees.value.find((t) => t.key === s.tree)
  const m = s.monkey
  return {
    title: m.title,
    line: `On ${s.tree === 'me' ? 'your' : tree?.owner} back for ${formatAge(m.createdAt)} · ${effortShort(m.effort)}`,
    due: m.dueOn ? dueLabel(m.dueOn) : null,
    from: m.handedBy ? `Handed over by ${m.handedBy === troop.userId ? 'you' : house.nameOf(m.handedBy)}` : null,
  }
})

// --- Inviting
const link = ref<string | null>(null)
const copied = ref(false)
const canShare = typeof navigator !== 'undefined' && 'share' in navigator
async function makeLink() {
  copied.value = false
  link.value = await house.invite()
}
async function share() {
  if (!link.value) return
  const text = `Join my household on Monkeys on My Back so we can see each other's jobs.`
  try {
    if (canShare) await navigator.share({ title: 'Monkeys on My Back', text, url: link.value })
    else await copy()
  } catch {
    // Share sheet closed; nothing to do.
  }
}
async function copy() {
  if (!link.value) return
  try {
    await navigator.clipboard.writeText(link.value)
    copied.value = true
  } catch {
    copied.value = false
  }
}

// --- Members
function memberName(m: Member): string {
  if (m.userId === troop.userId) return house.myName?.trim() ? `${house.myName} (you)` : 'You'
  return m.name?.trim() || 'Someone'
}
async function removeMember(m: Member) {
  if (window.confirm(`Remove ${m.name || 'this person'} from your household? Their tree stays theirs.`)) await house.remove(m)
}
async function leave() {
  if (window.confirm('Leave this household? Your tree and monkeys stay with you.')) {
    selected.value = null
    await house.leave()
  }
}
</script>

<template>
  <HouseholdTeaser v-if="!pro" />

  <main v-else class="page">
    <span class="badge">Pro · free while we test</span>
    <h1>Household</h1>
    <p class="lead muted">Everyone who lives with you, each with their own tree. Hand a job to someone else when it's theirs.</p>

    <!-- Not signed in: sharing needs an account -->
    <section v-if="!signedIn" class="card">
      <h2>Sign in to share</h2>
      <p>Households work through accounts, so everyone sees the same trees on their own phone.</p>
      <RouterLink to="/settings" class="btn btn-primary">Sign in from Settings</RouterLink>
    </section>

    <template v-else>
      <!-- Trees side by side: swipe between them -->
      <template v-if="sharing">
        <div class="trees" tabindex="0" aria-label="Household trees. Scroll sideways to see each one.">
          <HouseholdTree
            v-for="t in trees"
            :key="t.key"
            class="slide"
            :title="t.title"
            :avatar="t.avatar"
            :monkeys="t.monkeys"
            :selected-id="selected?.tree === t.key ? selected.monkey.id : null"
            @select="select(t.key, $event)"
          />
        </div>
        <p class="swipe muted">Swipe to see each tree. Tap a monkey to see the job.</p>

        <div v-if="selectedInfo" class="card info" role="status">
          <h2>{{ selectedInfo.title }}</h2>
          <p class="muted">{{ selectedInfo.line }}</p>
          <p v-if="selectedInfo.due" class="pill-line">{{ selectedInfo.due }}</p>
          <p v-if="selectedInfo.from" class="pill-line from">{{ selectedInfo.from }}</p>
        </div>
      </template>

      <div v-else class="art" aria-hidden="true">
        <span v-if="avatar.avatar" class="person"><AvatarFigure :avatar="avatar.avatar" /></span>
        <svg viewBox="0 0 140 150" class="mini-tree">
          <circle cx="70" cy="55" r="48" fill="var(--leaf-300)" />
          <rect x="62" y="70" width="16" height="80" rx="4" fill="var(--bark)" />
        </svg>
        <svg viewBox="0 0 140 150" class="mini-tree">
          <circle cx="70" cy="55" r="48" fill="var(--leaf-300)" />
          <rect x="62" y="70" width="16" height="80" rx="4" fill="var(--bark)" />
        </svg>
        <span class="person ghost">
          <AvatarFigure :avatar="defaultAvatar(avatar.avatar?.body === 'female' ? 'male' : 'female')" />
          <span class="q">?</span>
        </span>
      </div>

      <!-- Your name -->
      <section class="card">
        <template v-if="house.myName && !editingName">
          <div class="row-between">
            <span><span class="muted small">Your household sees you as</span><br /><strong class="name">{{ house.myName }}</strong></span>
            <button type="button" class="btn btn-ghost" @click="startName">Change</button>
          </div>
        </template>
        <form v-else class="name-form" @submit.prevent="saveName">
          <label for="my-name"><strong>Your name</strong> <span class="muted small">so people know whose tree is whose</span></label>
          <div class="name-row">
            <input id="my-name" v-model="nameInput" class="input" maxlength="40" autocomplete="given-name" placeholder="e.g. Jordan" required />
            <button type="submit" class="btn btn-primary">Save</button>
          </div>
        </form>
      </section>

      <!-- Invite -->
      <section class="card">
        <h2>{{ sharing ? 'Invite someone else' : 'Invite someone to share' }}</h2>
        <p class="muted small">Send them a link. When they open it and sign in, they join your household.</p>
        <button v-if="!link" type="button" class="btn btn-primary" :disabled="!house.myName" @click="makeLink">
          Make an invite link
        </button>
        <p v-if="!house.myName && !link" class="muted small">Add your name above first.</p>
        <template v-if="link">
          <p class="link" aria-label="Invite link">{{ link }}</p>
          <div class="row">
            <button type="button" class="btn btn-primary" @click="share">{{ canShare ? 'Share link' : 'Copy link' }}</button>
            <button v-if="canShare" type="button" class="btn btn-ghost" @click="copy">Copy</button>
          </div>
          <p class="muted small" role="status">{{ copied ? 'Copied.' : 'Each link works once and lasts 7 days.' }}</p>
        </template>
      </section>

      <!-- Who's in it -->
      <section v-if="house.household" class="card">
        <h2>In your household</h2>
        <ul class="members">
          <li v-for="m in house.household.members" :key="m.userId">
            <span class="head" aria-hidden="true">
              <AvatarFigure v-if="m.userId === troop.userId ? avatar.avatar : m.avatar" :avatar="(m.userId === troop.userId ? avatar.avatar : m.avatar)!" part="head" />
            </span>
            <span class="who">
              <strong>{{ memberName(m) }}</strong>
              <span v-if="m.role === 'owner'" class="muted small">Started the household</span>
            </span>
            <button v-if="house.isOwner && m.userId !== troop.userId" type="button" class="btn-link" @click="removeMember(m)">
              Remove
            </button>
          </li>
        </ul>
        <button type="button" class="btn btn-ghost leave" @click="leave">Leave household</button>
      </section>

      <section class="card soon">
        <h2>Coming later: family mode</h2>
        <p class="muted small">Kids get their own tree. They feed the monkey, a parent approves, and they earn rewards.</p>
      </section>

      <p v-if="house.error" class="error" role="alert">{{ house.error }}</p>
    </template>
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
  margin: 6px 0 16px;
  font-size: 15px;
  line-height: 1.45;
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

.card p {
  margin: 0;
  line-height: 1.45;
}

.small {
  font-size: 14px;
}

/* Trees, one per screen width, swipe sideways */
.trees {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  margin: 0 -20px;
  padding: 0 20px 4px;
  scrollbar-width: none;
}

.trees::-webkit-scrollbar {
  display: none;
}

.slide {
  flex: none;
  width: calc(100% - 28px);
  scroll-snap-align: center;
}

.swipe {
  margin: 6px 0 12px;
  text-align: center;
  font-size: 13px;
  font-weight: 700;
}

.info h2 {
  font-size: 22px;
}

.pill-line {
  align-self: flex-start;
  padding: 2px 10px;
  border-radius: 999px;
  background: var(--leaf-100);
  font-size: 13px;
  font-weight: 800;
}

.pill-line.from {
  background: var(--banana);
}

/* Before anyone has joined: you by your tree, a "?" by the other */
.art {
  position: relative;
  display: flex;
  justify-content: center;
  gap: 18px;
  margin: 4px 0 18px;
}

.mini-tree {
  width: 120px;
}

.person {
  position: absolute;
  bottom: -4px;
  height: 116px;
  aspect-ratio: 120 / 300;
  left: calc(50% - 160px);
}

.ghost {
  left: auto;
  right: calc(50% - 160px);
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

.row-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.name {
  font-family: var(--font-display);
  font-size: 22px;
}

.name-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.name-row {
  display: flex;
  gap: 8px;
}

.name-row .input {
  flex: 1;
  min-width: 0;
}

.link {
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: var(--leaf-100);
  font-size: 13px;
  font-weight: 700;
  word-break: break-all;
  user-select: all;
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.members {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.members li {
  display: flex;
  align-items: center;
  gap: 12px;
}

.head {
  flex: none;
  width: 44px;
  height: 48px;
  border-radius: 50%;
  background: var(--leaf-100);
  overflow: hidden;
}

.who {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.leave {
  align-self: flex-start;
}

.soon {
  border: 2px dashed var(--leaf-300);
  background: transparent;
}

.error {
  color: var(--danger);
  font-weight: 700;
}
</style>
