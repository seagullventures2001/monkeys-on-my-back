<script setup lang="ts">
import { computed } from 'vue'
import { HAIR_COLORS, SKINS, TOP_COLORS, colorOf, shade, type Avatar } from '@/lib/avatar'

// The user's cartoon self, in the same flat style as the monkeys: big friendly head,
// simple body. Drawn in a 120 x 300 box, feet on the ground at y = 284.
// part="head" crops to just the head (used for the bus driver).
const props = withDefaults(defineProps<{ avatar: Avatar; part?: 'full' | 'head' }>(), { part: 'full' })

const viewBox = computed(() => (props.part === 'head' ? '18 4 84 92' : '0 0 120 300'))

const c = computed(() => {
  const a = props.avatar
  const skin = colorOf(SKINS, a.skin)
  const hair = colorOf(HAIR_COLORS, a.hairColor)
  const top = colorOf(TOP_COLORS, a.topColor)
  return {
    skin,
    skinShade: shade(skin, 0.12),
    hair,
    hairShade: shade(hair, 0.18),
    top,
    topShade: shade(top, 0.14),
    female: a.body === 'female',
  }
})

// Arms hang slightly out from the body; the right one (nearest the tree) gives a little wave.
const LEFT_ARM = 'M35 106 Q25 138 23 170'
const RIGHT_ARM = 'M85 106 Q99 98 104 70'
const LEFT_SLEEVE_SHORT = 'M35 106 Q31 118 29 128'
const RIGHT_SLEEVE_SHORT = 'M85 106 Q92 102 96 94'
</script>

<template>
  <svg :viewBox="viewBox" width="100%" height="100%" aria-hidden="true">
    <!-- hair that falls behind the head and shoulders -->
    <g :fill="c.hair">
      <path v-if="avatar.hair === 'long'" d="M27 60 Q22 20 60 20 Q98 20 93 60 L97 126 Q80 136 60 130 Q40 136 23 126 Z" />
      <path v-else-if="avatar.hair === 'bob'" d="M26 62 Q22 20 60 20 Q98 20 94 62 L95 92 Q88 98 80 92 L40 92 Q32 98 25 92 Z" />
      <template v-else-if="avatar.hair === 'ponytail'">
        <path d="M82 30 Q116 30 112 66 Q110 96 98 112 Q100 84 92 64 Q88 50 80 42 Z" />
        <circle cx="88" cy="36" r="5.5" :fill="c.hairShade" />
      </template>
      <circle v-else-if="avatar.hair === 'bun'" cx="60" cy="19" r="13" />
    </g>

    <template v-if="part === 'full'">
      <!-- legs -->
      <template v-if="avatar.bottom === 'jeans'">
        <path d="M48 174 L48 266 M72 174 L72 266" stroke="#4a6fa5" stroke-width="21" stroke-linecap="round" />
        <path d="M60 176 V198" stroke="#3b5c8c" stroke-width="2" />
        <path d="M44 190 V262 M76 190 V262" stroke="#6a8dc0" stroke-width="1.6" opacity="0.7" />
      </template>
      <template v-else>
        <path d="M48 196 L48 264 M72 196 L72 264" :stroke="c.skin" stroke-width="15" stroke-linecap="round" />
        <path d="M33 170 L87 170 L89 214 L63 214 L60 194 L57 214 L31 214 Z" fill="#c9a66b" />
        <path d="M60 172 V194" stroke="#a9884f" stroke-width="2" />
      </template>

      <!-- footwear -->
      <g v-if="avatar.feet === 'boots'" fill="#6b4226">
        <rect x="37" y="244" width="22" height="30" rx="5" />
        <rect x="61" y="244" width="22" height="30" rx="5" />
        <ellipse cx="45" cy="277" rx="14" ry="7.5" />
        <ellipse cx="75" cy="277" rx="14" ry="7.5" />
        <path d="M33 282 H57 M63 282 H87" stroke="#3a2416" stroke-width="4" stroke-linecap="round" />
        <path d="M37 252 H59 M61 252 H83" stroke="#8a5a36" stroke-width="2.5" />
      </g>
      <g v-else>
        <path d="M33 278 Q31 266 42 266 L48 266 Q58 268 58 278 Z M62 278 Q62 268 72 266 L78 266 Q89 266 87 278 Z" fill="#3d4f5c" />
        <path d="M31 278 H59 M61 278 H89" stroke="#e4e8e4" stroke-width="6" stroke-linecap="round" />
        <path d="M31 281 H59 M61 281 H89" stroke="#9aa5a8" stroke-width="2" stroke-linecap="round" />
        <path d="M41 270 L49 270 M71 270 L79 270" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
      </g>

      <!-- arms (skin), sleeves are drawn over them -->
      <path :d="LEFT_ARM" fill="none" :stroke="c.skin" stroke-width="13" stroke-linecap="round" />
      <path :d="RIGHT_ARM" fill="none" :stroke="c.skin" stroke-width="13" stroke-linecap="round" />
      <template v-if="avatar.top === 'long'">
        <path :d="LEFT_ARM" fill="none" :stroke="c.topShade" stroke-width="15" stroke-linecap="round" />
        <path :d="RIGHT_ARM" fill="none" :stroke="c.topShade" stroke-width="15" stroke-linecap="round" />
      </template>
      <template v-else-if="avatar.top === 'tee'">
        <path :d="LEFT_SLEEVE_SHORT" fill="none" :stroke="c.topShade" stroke-width="16" stroke-linecap="round" />
        <path :d="RIGHT_SLEEVE_SHORT" fill="none" :stroke="c.topShade" stroke-width="16" stroke-linecap="round" />
      </template>
      <!-- hands -->
      <circle cx="23" cy="172" r="8" :fill="c.skin" />
      <circle cx="104" cy="67" r="8" :fill="c.skin" />
      <path d="M99 60 L97 54 M104 59 V52 M109 61 L111 55" :stroke="c.skin" stroke-width="4" stroke-linecap="round" />

      <!-- body -->
      <path
        v-if="avatar.top === 'singlet'"
        d="M40 100 L46 100 Q60 112 74 100 L80 100 Q86 104 86 118 L88 176 Q60 182 32 176 L34 118 Q34 104 40 100 Z"
        :fill="c.top"
      />
      <path
        v-else-if="c.female"
        d="M40 96 Q60 92 80 96 Q90 100 90 114 L84 146 L88 176 Q60 182 32 176 L36 146 L30 114 Q30 100 40 96 Z"
        :fill="c.top"
      />
      <path v-else d="M40 96 Q60 92 80 96 Q91 100 91 114 L88 176 Q60 182 32 176 L29 114 Q29 100 40 96 Z" :fill="c.top" />
      <path v-if="avatar.top === 'singlet'" d="M34 104 Q30 104 30 112 M86 104 Q90 104 90 112" :stroke="c.skin" stroke-width="5" fill="none" stroke-linecap="round" />
      <path d="M33 168 Q60 174 87 168" fill="none" :stroke="c.topShade" stroke-width="3" />
    </template>

    <!-- neck -->
    <rect x="52" y="82" width="16" height="18" rx="5" :fill="c.skinShade" />
    <path v-if="part === 'full' && avatar.top !== 'singlet'" d="M48 96 Q60 106 72 96" fill="none" :stroke="c.topShade" stroke-width="4" stroke-linecap="round" />

    <!-- head -->
    <circle cx="30" cy="62" r="6.5" :fill="c.skin" />
    <circle cx="90" cy="62" r="6.5" :fill="c.skin" />
    <circle cx="30" cy="62" r="3" :fill="c.skinShade" />
    <circle cx="90" cy="62" r="3" :fill="c.skinShade" />
    <ellipse cx="60" cy="58" rx="30" ry="33" :fill="c.skin" />

    <!-- face -->
    <circle cx="44" cy="70" r="5" fill="#f08f7a" opacity="0.35" />
    <circle cx="76" cy="70" r="5" fill="#f08f7a" opacity="0.35" />
    <ellipse cx="49" cy="60" rx="3.6" ry="4.4" fill="#2a1a10" />
    <ellipse cx="71" cy="60" rx="3.6" ry="4.4" fill="#2a1a10" />
    <circle cx="50.3" cy="58.4" r="1.4" fill="#ffffff" />
    <circle cx="72.3" cy="58.4" r="1.4" fill="#ffffff" />
    <path v-if="c.female" d="M45 56.5 L42.5 54.5 M75 56.5 L77.5 54.5" stroke="#2a1a10" stroke-width="1.8" stroke-linecap="round" />
    <path
      d="M43 50 Q49 47 54 49 M66 49 Q71 47 77 50"
      fill="none"
      :stroke="c.hairShade"
      :stroke-width="c.female ? 2 : 3"
      stroke-linecap="round"
    />
    <path d="M58 66 Q60 68.5 62 66" fill="none" :stroke="c.skinShade" stroke-width="2.4" stroke-linecap="round" />
    <path d="M51 74 Q60 82 69 74 Q60 77 51 74 Z" fill="#5a2a1c" stroke="#2a1a10" stroke-width="2" stroke-linejoin="round" />

    <!-- hair on top of the head -->
    <g :fill="c.hair">
      <path
        v-if="avatar.hair === 'short'"
        d="M29 58 Q26 24 60 23 Q94 24 91 58 Q88 44 78 39 Q64 46 46 39 Q34 44 29 58 Z"
      />
      <path
        v-else-if="avatar.hair === 'quiff'"
        d="M29 56 Q27 30 50 26 Q58 10 80 15 Q71 19 73 27 Q93 31 91 56 Q87 43 76 39 Q60 44 44 39 Q34 44 29 56 Z"
      />
      <template v-else-if="avatar.hair === 'curly'">
        <circle cx="34" cy="44" r="9" />
        <circle cx="40" cy="33" r="10" />
        <circle cx="52" cy="27" r="10" />
        <circle cx="66" cy="26" r="10" />
        <circle cx="78" cy="32" r="10" />
        <circle cx="86" cy="43" r="9" />
        <circle cx="60" cy="36" r="10" />
        <circle cx="45" cy="40" r="8" />
        <circle cx="75" cy="40" r="8" />
      </template>
      <path
        v-else-if="avatar.hair === 'buzz'"
        d="M31 54 Q30 26 60 25 Q90 26 89 54 Q82 38 60 36 Q38 38 31 54 Z"
        opacity="0.9"
      />
      <path v-else-if="avatar.hair === 'long'" d="M29 64 Q26 24 60 23 Q94 24 91 64 Q88 40 68 34 Q50 40 33 54 Z" />
      <path v-else-if="avatar.hair === 'bob'" d="M29 56 Q29 24 60 23 Q91 24 91 56 Q88 45 60 45 Q32 45 29 56 Z" />
      <path
        v-else-if="avatar.hair === 'ponytail'"
        d="M29 58 Q26 24 60 23 Q94 24 91 58 Q86 40 70 36 Q54 42 40 40 Q32 46 29 58 Z"
      />
      <path v-else-if="avatar.hair === 'bun'" d="M29 58 Q27 25 60 25 Q93 25 91 58 Q86 40 60 38 Q34 40 29 58 Z" />
    </g>
    <circle v-if="avatar.hair === 'bun'" cx="60" cy="29" r="4" :fill="c.hairShade" />
  </svg>
</template>
