// The person whose back the monkeys are on. Saved on the device and, when signed in,
// on your profile so other people in a shared household can see it.
//
// Every option is stored as a short id (not a colour or a drawing), so new items can be
// added later, including ones you unlock or buy, without changing saved avatars.

export type Body = 'male' | 'female'
export type HairStyle = 'short' | 'quiff' | 'curly' | 'buzz' | 'long' | 'bob' | 'ponytail' | 'bun'
export type Top = 'tee' | 'long' | 'singlet'
export type Bottom = 'shorts' | 'jeans'
export type Feet = 'shoes' | 'boots'

export interface Avatar {
  body: Body
  skin: string
  hair: HairStyle
  hairColor: string
  top: Top
  topColor: string
  bottom: Bottom
  feet: Feet
}

export interface Option<T extends string = string> {
  id: T
  label: string
}

export interface Swatch extends Option {
  color: string
}

export const BODIES: Option<Body>[] = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
]

export const SKINS: Swatch[] = [
  { id: 'light', label: 'Light', color: '#f6d9c0' },
  { id: 'fair', label: 'Fair', color: '#ecc29c' },
  { id: 'tan', label: 'Tan', color: '#d29a6c' },
  { id: 'brown', label: 'Brown', color: '#a86c44' },
  { id: 'deep', label: 'Deep', color: '#6f452c' },
]

export const HAIR_STYLES: Record<Body, Option<HairStyle>[]> = {
  male: [
    { id: 'short', label: 'Short' },
    { id: 'quiff', label: 'Quiff' },
    { id: 'curly', label: 'Curly' },
    { id: 'buzz', label: 'Buzz cut' },
  ],
  female: [
    { id: 'long', label: 'Long' },
    { id: 'bob', label: 'Bob' },
    { id: 'ponytail', label: 'Ponytail' },
    { id: 'bun', label: 'Bun' },
  ],
}

export const HAIR_COLORS: Swatch[] = [
  { id: 'black', label: 'Black', color: '#2b1e18' },
  { id: 'brown', label: 'Brown', color: '#6b4226' },
  { id: 'blonde', label: 'Blonde', color: '#e3bd62' },
  { id: 'ginger', label: 'Ginger', color: '#c2622e' },
  { id: 'grey', label: 'Grey', color: '#a7a7a2' },
]

export const TOPS: Option<Top>[] = [
  { id: 'tee', label: 'Short sleeve' },
  { id: 'long', label: 'Long sleeve' },
  { id: 'singlet', label: 'Singlet' },
]

export const TOP_COLORS: Swatch[] = [
  { id: 'leaf', label: 'Green', color: '#2f6b45' },
  { id: 'banana', label: 'Yellow', color: '#f2c230' },
  { id: 'sky', label: 'Blue', color: '#4f9fd1' },
  { id: 'coral', label: 'Coral', color: '#e8735a' },
  { id: 'navy', label: 'Navy', color: '#2c3e66' },
  { id: 'white', label: 'White', color: '#f7f4ec' },
]

export const BOTTOMS: Option<Bottom>[] = [
  { id: 'shorts', label: 'Shorts' },
  { id: 'jeans', label: 'Jeans' },
]

export const FEET: Option<Feet>[] = [
  { id: 'shoes', label: 'Shoes' },
  { id: 'boots', label: 'Boots' },
]

export function defaultAvatar(body: Body): Avatar {
  return body === 'female'
    ? { body, skin: 'fair', hair: 'long', hairColor: 'brown', top: 'tee', topColor: 'coral', bottom: 'jeans', feet: 'shoes' }
    : { body, skin: 'fair', hair: 'short', hairColor: 'brown', top: 'tee', topColor: 'leaf', bottom: 'shorts', feet: 'shoes' }
}

/** Switching male/female keeps everything else, but picks a hair style from that list. */
export function withBody(a: Avatar, body: Body): Avatar {
  const hairOk = HAIR_STYLES[body].some((h) => h.id === a.hair)
  return { ...a, body, hair: hairOk ? a.hair : defaultAvatar(body).hair }
}

function pick<T extends string>(value: unknown, options: Option<T>[], fallback: T): T {
  return options.some((o) => o.id === value) ? (value as T) : fallback
}

/**
 * Turns whatever was saved (on the device or on the profile) into a valid avatar.
 * Unknown or missing items fall back to the defaults, so an old or partly saved
 * avatar never breaks the drawing. Returns null if there's no avatar at all.
 */
export function normalizeAvatar(raw: unknown): Avatar | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (r.body !== 'male' && r.body !== 'female') return null
  const d = defaultAvatar(r.body)
  const allHair = [...HAIR_STYLES.male, ...HAIR_STYLES.female]
  return {
    body: r.body,
    skin: pick(r.skin, SKINS, d.skin),
    hair: pick(r.hair, allHair, d.hair),
    hairColor: pick(r.hairColor, HAIR_COLORS, d.hairColor),
    top: pick(r.top, TOPS, d.top),
    topColor: pick(r.topColor, TOP_COLORS, d.topColor),
    bottom: pick(r.bottom, BOTTOMS, d.bottom),
    feet: pick(r.feet, FEET, d.feet),
  }
}

export function colorOf(list: Swatch[], id: string): string {
  return (list.find((s) => s.id === id) ?? list[0]).color
}

/** A darker shade of a #rrggbb colour, for shadows and seams. */
export function shade(hex: string, amount = 0.15): string {
  const n = parseInt(hex.slice(1), 16)
  const ch = (v: number) => Math.round(v * (1 - amount))
  const r = ch((n >> 16) & 255)
  const g = ch((n >> 8) & 255)
  const b = ch(n & 255)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

// ---------------------------------------------------------------------------
// Saving on this device
// ---------------------------------------------------------------------------
const KEY = 'momb.avatar.v1'
let memory: Avatar | null = null

export function loadLocalAvatar(): Avatar | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? normalizeAvatar(JSON.parse(raw)) : memory
  } catch {
    return memory
  }
}

export function saveLocalAvatar(a: Avatar): void {
  memory = a
  try {
    localStorage.setItem(KEY, JSON.stringify(a))
  } catch {
    // Kept in memory for this session only.
  }
}
