// Celebration sounds, made on the fly with the Web Audio API.
// Nothing is downloaded and there are no audio files to license: every sound below
// is synthesised from simple tones and noise, and the little tune is our own.

export type SoundName = 'whoosh' | 'catch' | 'peel' | 'pop' | 'munch' | 'fanfare' | 'ding'

/**
 * What plays when, in milliseconds from the celebration opening.
 * Lines up with the STEPS in FeedCelebration.vue.
 */
export const CELEBRATION_SOUNDS: { at: number; sound: SoundName }[] = [
  { at: 400, sound: 'whoosh' }, // banana flies in
  { at: 1150, sound: 'catch' }, // caught
  { at: 1550, sound: 'peel' }, // peeled
  { at: 1950, sound: 'pop' }, // streamers burst
  { at: 1950, sound: 'fanfare' }, // the tune
  { at: 2500, sound: 'munch' }, // bites (the banana shrinks in four chomps)
  { at: 3050, sound: 'munch' },
  { at: 2950, sound: 'ding' }, // the big tick
  { at: 3600, sound: 'munch' },
  { at: 4150, sound: 'munch' },
]

// ---------------------------------------------------------------------------
// On/off preference (per device). Guarded because storage can be unavailable.
// ---------------------------------------------------------------------------
const PREF_KEY = 'momb.sound'

export function soundEnabled(): boolean {
  try {
    return localStorage.getItem(PREF_KEY) !== 'off'
  } catch {
    return true
  }
}

export function setSoundEnabled(on: boolean): void {
  try {
    localStorage.setItem(PREF_KEY, on ? 'on' : 'off')
  } catch {
    // Nothing to do; the switch just won't be remembered.
  }
}

// ---------------------------------------------------------------------------
// Playback
// ---------------------------------------------------------------------------
let ctx: AudioContext | null = null

/**
 * Phones only allow sound to start from a tap. Call this inside the tap handler
 * (the Feed button) so the celebration can play a moment later.
 */
export function unlockAudio(): void {
  if (!soundEnabled() || typeof window === 'undefined') return
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    ctx ??= new Ctor()
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {
    ctx = null
  }
}

export interface Playback {
  /** Fades out anything still playing or scheduled. */
  stop(): void
}

const SILENT: Playback = { stop() {} }

/** Plays a list of sounds at their times. Returns a handle to stop them early. */
export function playSequence(plan: { at: number; sound: SoundName }[]): Playback {
  if (!soundEnabled() || !ctx) return SILENT
  const ac = ctx
  const master = createMaster(ac, ac.destination)
  const t0 = ac.currentTime + 0.03
  for (const { at, sound } of plan) SOUNDS[sound](ac, master, t0 + at / 1000)
  return {
    stop() {
      const now = ac.currentTime
      master.gain.cancelScheduledValues(now)
      master.gain.setValueAtTime(master.gain.value, now)
      master.gain.linearRampToValueAtTime(0, now + 0.15)
      setTimeout(() => master.disconnect(), 300)
    },
  }
}

export function playCelebration(): Playback {
  return playSequence(CELEBRATION_SOUNDS)
}

/** For a preview (e.g. turning sounds on in Settings). */
export function playOne(sound: SoundName): Playback {
  return playSequence([{ at: 0, sound }])
}

/**
 * Renders the celebration into any audio context, including an OfflineAudioContext.
 * Used to make demo recordings; the app itself uses playCelebration().
 */
export function renderCelebration(ac: BaseAudioContext, start = 0): void {
  const master = createMaster(ac, ac.destination)
  for (const { at, sound } of CELEBRATION_SOUNDS) SOUNDS[sound](ac, master, start + at / 1000)
}

function createMaster(ac: BaseAudioContext, out: AudioNode): GainNode {
  const master = ac.createGain()
  master.gain.value = 0.8
  const comp = ac.createDynamicsCompressor()
  comp.threshold.value = -12
  comp.ratio.value = 4
  master.connect(comp).connect(out)
  return master
}

// ---------------------------------------------------------------------------
// The sounds
// ---------------------------------------------------------------------------
type Synth = (ac: BaseAudioContext, out: AudioNode, t: number) => void

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>()

function noise(ac: BaseAudioContext): AudioBuffer {
  let buf = noiseBuffers.get(ac)
  if (!buf) {
    buf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    noiseBuffers.set(ac, buf)
  }
  return buf
}

function envelope(ac: BaseAudioContext, t: number, peak: number, attack: number, decay: number): GainNode {
  const g = ac.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
  return g
}

/** A burst of filtered noise. */
function noiseHit(ac: BaseAudioContext, out: AudioNode, t: number, filter: BiquadFilterType, freq: number, peak: number, dur: number) {
  const src = ac.createBufferSource()
  src.buffer = noise(ac)
  const f = ac.createBiquadFilter()
  f.type = filter
  f.frequency.value = freq
  const g = envelope(ac, t, peak, 0.005, dur)
  src.connect(f).connect(g).connect(out)
  src.start(t, Math.random() * 0.5)
  src.stop(t + dur + 0.05)
}

/** A soft, wooden marimba-like note: a sine plus a quiet bright overtone, quick decay. */
function marimba(ac: BaseAudioContext, out: AudioNode, t: number, freq: number, vol = 0.35, dur = 0.5) {
  for (const [mult, level] of [
    [1, 1],
    [3.9, 0.12],
  ] as const) {
    const osc = ac.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq * mult
    const g = envelope(ac, t, vol * level, 0.004, dur * (mult === 1 ? 1 : 0.3))
    osc.connect(g).connect(out)
    osc.start(t)
    osc.stop(t + dur + 0.05)
  }
}

function bass(ac: BaseAudioContext, out: AudioNode, t: number, freq: number, dur: number) {
  const osc = ac.createOscillator()
  osc.type = 'triangle'
  osc.frequency.value = freq
  const g = envelope(ac, t, 0.3, 0.01, dur)
  osc.connect(g).connect(out)
  osc.start(t)
  osc.stop(t + dur + 0.05)
}

const C5 = 523.25
const D5 = 587.33
const E5 = 659.25
const G5 = 783.99
const A5 = 880
const C6 = 1046.5
const E6 = 1318.51
const G6 = 1567.98
const C7 = 2093

const SOUNDS: Record<SoundName, Synth> = {
  // Banana sailing through the air: a noise sweep from low to high.
  whoosh(ac, out, t) {
    const src = ac.createBufferSource()
    src.buffer = noise(ac)
    const f = ac.createBiquadFilter()
    f.type = 'bandpass'
    f.Q.value = 1.4
    f.frequency.setValueAtTime(300, t)
    f.frequency.exponentialRampToValueAtTime(2600, t + 0.5)
    const g = ac.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.9, t + 0.3)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.65)
    src.connect(f).connect(g).connect(out)
    src.start(t)
    src.stop(t + 0.7)
  },

  // Caught! A rubbery "boop" that drops in pitch, with a tiny slap.
  catch(ac, out, t) {
    const osc = ac.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(760, t)
    osc.frequency.exponentialRampToValueAtTime(230, t + 0.13)
    const g = envelope(ac, t, 0.55, 0.004, 0.16)
    osc.connect(g).connect(out)
    osc.start(t)
    osc.stop(t + 0.2)
    noiseHit(ac, out, t, 'lowpass', 2500, 0.25, 0.04)
  },

  // Peeling: three quick little zips.
  peel(ac, out, t) {
    for (let i = 0; i < 3; i++) noiseHit(ac, out, t + i * 0.08, 'highpass', 3200 + i * 600, 0.22, 0.045)
  },

  // Party popper as the streamers go off.
  pop(ac, out, t) {
    noiseHit(ac, out, t, 'lowpass', 1800, 0.6, 0.12)
    const osc = ac.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(320, t)
    osc.frequency.exponentialRampToValueAtTime(1400, t + 0.12)
    const g = envelope(ac, t, 0.18, 0.005, 0.15)
    osc.connect(g).connect(out)
    osc.start(t)
    osc.stop(t + 0.2)
  },

  // A happy "nom": a soft low bump with a little crunch.
  munch(ac, out, t) {
    const osc = ac.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(190, t)
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.09)
    const g = envelope(ac, t, 0.4, 0.005, 0.1)
    osc.connect(g).connect(out)
    osc.start(t)
    osc.stop(t + 0.15)
    noiseHit(ac, out, t + 0.01, 'bandpass', 1100, 0.26, 0.06)
  },

  // The tune: a bouncy run up, a little skip, then a big bright landing chord.
  fanfare(ac, out, t) {
    const run = [C5, E5, G5, C6]
    run.forEach((f, i) => marimba(ac, out, t + i * 0.1, f, 0.32, 0.35))
    marimba(ac, out, t + 0.46, A5, 0.3, 0.25)
    marimba(ac, out, t + 0.56, G5, 0.3, 0.25)
    marimba(ac, out, t + 0.66, D5, 0.26, 0.2)
    const land = t + 0.78
    for (const f of [C5, E5, G5, C6]) marimba(ac, out, land, f, 0.26, 1.1)
    marimba(ac, out, land + 0.12, E6, 0.14, 0.6)
    marimba(ac, out, land + 0.22, G6, 0.12, 0.6)
    bass(ac, out, t, 130.81, 0.4)
    bass(ac, out, land, 130.81, 1.0)
  },

  // The tick: a bright two-note "ding-ding".
  ding(ac, out, t) {
    marimba(ac, out, t, G6, 0.28, 0.5)
    marimba(ac, out, t + 0.09, C7, 0.24, 0.7)
  },
}
