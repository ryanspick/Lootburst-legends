/**
 * Hybrid audio system:
 *   1. Tries loading pre-generated WAV files from /assets/audio/{cat}/{name}.wav
 *   2. Falls back to Web Audio API oscillator synthesis if the file is unavailable
 *
 * Generate WAV files: npm run generate:audio
 */

interface SoundProfile {
  freq:       number
  endFreq?:   number
  type:       OscillatorType
  durationMs: number
  gain:       number
  attackMs?:  number
}

// All 28 sound events with oscillator synthesis profiles
const PROFILES: Record<string, SoundProfile> = {
  // Combat
  combat_sword_tick:        { freq: 220, endFreq: 110,  type: 'sawtooth',  durationMs: 80,  gain: 0.30 },
  combat_crit_snap:         { freq: 880, endFreq: 440,  type: 'square',    durationMs: 60,  gain: 0.40 },
  combat_projectile_whoosh: { freq: 440, endFreq: 220,  type: 'sine',      durationMs: 120, gain: 0.25 },
  combat_spell_sparkle:     { freq: 880, endFreq: 1200, type: 'sine',      durationMs: 100, gain: 0.30 },
  combat_shield_boing:      { freq: 220,                type: 'triangle',  durationMs: 200, gain: 0.35 },
  combat_fire_burst:        { freq: 110, endFreq: 55,   type: 'sawtooth',  durationMs: 150, gain: 0.35 },
  combat_poison_bubble:     { freq: 440, endFreq: 330,  type: 'sine',      durationMs: 120, gain: 0.25 },
  combat_freeze_crack:      { freq: 660, endFreq: 1320, type: 'square',    durationMs: 80,  gain: 0.30 },
  combat_coin_ping:         { freq: 1047,               type: 'sine',      durationMs: 280, gain: 0.35 },
  combat_boss_death_boom:   { freq: 80,  endFreq: 40,   type: 'sawtooth',  durationMs: 600, gain: 0.55, attackMs: 10 },
  // Reward
  reward_chest_rattle:      { freq: 330, endFreq: 220,  type: 'triangle',  durationMs: 150, gain: 0.30 },
  reward_chest_crack:       { freq: 200, endFreq: 100,  type: 'sawtooth',  durationMs: 200, gain: 0.35 },
  reward_chest_volcano:     { freq: 120, endFreq: 600,  type: 'sawtooth',  durationMs: 400, gain: 0.45, attackMs: 20 },
  reward_capsule_spin:      { freq: 440, endFreq: 880,  type: 'sine',      durationMs: 300, gain: 0.30 },
  reward_rarity_beam:       { freq: 660, endFreq: 1320, type: 'sine',      durationMs: 500, gain: 0.35, attackMs: 30 },
  reward_gem_scatter:       { freq: 1047, endFreq: 880, type: 'sine',      durationMs: 200, gain: 0.25 },
  reward_star_up_slam:      { freq: 440, endFreq: 880,  type: 'square',    durationMs: 250, gain: 0.40, attackMs: 10 },
  reward_gear_equip_clink:  { freq: 880,                type: 'triangle',  durationMs: 160, gain: 0.30 },
  reward_level_up_flourish: { freq: 523, endFreq: 784,  type: 'sine',      durationMs: 400, gain: 0.40, attackMs: 20 },
  // UI
  ui_hover_tick:            { freq: 880,                type: 'sine',      durationMs: 40,  gain: 0.12 },
  ui_button_pop:            { freq: 440, endFreq: 220,  type: 'square',    durationMs: 60,  gain: 0.22 },
  ui_tab_slide:             { freq: 330, endFreq: 440,  type: 'sine',      durationMs: 80,  gain: 0.18 },
  ui_upgrade_card_flip:     { freq: 660, endFreq: 440,  type: 'triangle',  durationMs: 100, gain: 0.25 },
  ui_claim_sweep:           { freq: 440, endFreq: 880,  type: 'sine',      durationMs: 200, gain: 0.28 },
  ui_pull_button_charge:    { freq: 220, endFreq: 440,  type: 'sawtooth',  durationMs: 300, gain: 0.30, attackMs: 40 },
  // Rarity reveal
  rarity_common_pop:        { freq: 440,                type: 'sine',      durationMs: 80,  gain: 0.25 },
  rarity_uncommon_pop:      { freq: 660,                type: 'sine',      durationMs: 120, gain: 0.28 },
  rarity_rare_bell:         { freq: 880,                type: 'sine',      durationMs: 320, gain: 0.32 },
  rarity_epic_bass:         { freq: 110, endFreq: 220,  type: 'sawtooth',  durationMs: 420, gain: 0.42, attackMs: 15 },
  rarity_legendary_choir:   { freq: 523, endFreq: 784,  type: 'sine',      durationMs: 650, gain: 0.45, attackMs: 30 },
  rarity_mythic_impact:     { freq: 80,  endFreq: 160,  type: 'sawtooth',  durationMs: 800, gain: 0.55, attackMs: 20 },
}

const HIGH_PRIORITY = new Set([
  'rarity_legendary_choir', 'rarity_mythic_impact',
  'reward_chest_volcano', 'combat_boss_death_boom',
])

const RATE_LIMIT_MS = 80
const _rateLimits   = new Map<string, number>()
const _wavCache     = new Map<string, HTMLAudioElement>()
const _wavFailed    = new Set<string>()

let _muted  = false
let _volume = 0.7
let _ctx: AudioContext | null = null

// event_name_here → /assets/audio/event/name-here.wav
function eventToWavPath(event: string): string {
  const idx  = event.indexOf('_')
  const cat  = event.slice(0, idx)
  const name = event.slice(idx + 1).replace(/_/g, '-')
  return `/assets/audio/${cat}/${name}.wav`
}

function getCtx(): AudioContext | null {
  if (!_ctx) {
    try { _ctx = new AudioContext() } catch { return null }
  }
  if (_ctx.state === 'suspended') _ctx.resume().catch(() => undefined)
  return _ctx
}

function synthesize(eventName: string, vol: number): void {
  const profile = PROFILES[eventName]
  if (!profile) return
  const ctx = getCtx()
  if (!ctx) return

  try {
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = profile.type
    osc.frequency.setValueAtTime(profile.freq, ctx.currentTime)
    if (profile.endFreq) {
      osc.frequency.exponentialRampToValueAtTime(
        profile.endFreq,
        ctx.currentTime + profile.durationMs / 1000,
      )
    }

    const attackSec = (profile.attackMs ?? 4) / 1000
    const endSec    = profile.durationMs / 1000
    const amplitude = vol * profile.gain

    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(amplitude, ctx.currentTime + attackSec)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + endSec)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + endSec + 0.01)
  } catch {
    // silent
  }
}

function playWav(eventName: string, vol: number): boolean {
  if (_wavFailed.has(eventName)) return false

  let audio = _wavCache.get(eventName)
  if (!audio) {
    audio = new Audio(eventToWavPath(eventName))
    audio.preload = 'auto'
    audio.addEventListener('error', () => _wavFailed.add(eventName), { once: true })
    _wavCache.set(eventName, audio)
  }

  try {
    const instance = audio.cloneNode() as HTMLAudioElement
    instance.volume = vol
    instance.play().catch(() => {
      // File exists but play() blocked — synthesize instead
      synthesize(eventName, vol / _volume)
    })
    return true
  } catch {
    _wavFailed.add(eventName)
    return false
  }
}

export function setMuted(v: boolean)  { _muted = v }
export function setVolume(v: number)  { _volume = Math.max(0, Math.min(1, v)) }

export function playSound(eventName: string, options?: { volume?: number }) {
  if (_muted && !HIGH_PRIORITY.has(eventName)) return

  const now  = Date.now()
  const last = _rateLimits.get(eventName) ?? 0
  if (now - last < RATE_LIMIT_MS && !HIGH_PRIORITY.has(eventName)) return
  _rateLimits.set(eventName, now)

  const vol = options?.volume ?? _volume

  // WAV file first (snappier, no AudioContext needed), then synthesize
  if (!playWav(eventName, vol)) {
    synthesize(eventName, vol)
  }
}

export function getAllSoundEvents(): string[] {
  return Object.keys(PROFILES)
}
