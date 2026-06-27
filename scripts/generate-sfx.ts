/**
 * Generates placeholder WAV audio files for all 28 sound events.
 * Run: npm run generate:audio
 * Output: public/assets/audio/{category}/{name}.wav
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR   = path.resolve(__dirname, '../public/assets/audio')
const SAMPLE_RATE = 22050

type OscType = 'sine' | 'square' | 'sawtooth' | 'triangle'

interface Profile {
  freq:       number
  endFreq?:   number
  type:       OscType
  durationMs: number
  gain:       number
  attackMs?:  number
}

// Mirrors src/audio/soundEvents.ts PROFILES exactly
const PROFILES: Record<string, Profile> = {
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
  reward_chest_rattle:      { freq: 330, endFreq: 220,  type: 'triangle',  durationMs: 150, gain: 0.30 },
  reward_chest_crack:       { freq: 200, endFreq: 100,  type: 'sawtooth',  durationMs: 200, gain: 0.35 },
  reward_chest_volcano:     { freq: 120, endFreq: 600,  type: 'sawtooth',  durationMs: 400, gain: 0.45, attackMs: 20 },
  reward_capsule_spin:      { freq: 440, endFreq: 880,  type: 'sine',      durationMs: 300, gain: 0.30 },
  reward_rarity_beam:       { freq: 660, endFreq: 1320, type: 'sine',      durationMs: 500, gain: 0.35, attackMs: 30 },
  reward_gem_scatter:       { freq: 1047, endFreq: 880, type: 'sine',      durationMs: 200, gain: 0.25 },
  reward_star_up_slam:      { freq: 440, endFreq: 880,  type: 'square',    durationMs: 250, gain: 0.40, attackMs: 10 },
  reward_gear_equip_clink:  { freq: 880,                type: 'triangle',  durationMs: 160, gain: 0.30 },
  reward_level_up_flourish: { freq: 523, endFreq: 784,  type: 'sine',      durationMs: 400, gain: 0.40, attackMs: 20 },
  ui_hover_tick:            { freq: 880,                type: 'sine',      durationMs: 40,  gain: 0.12 },
  ui_button_pop:            { freq: 440, endFreq: 220,  type: 'square',    durationMs: 60,  gain: 0.22 },
  ui_tab_slide:             { freq: 330, endFreq: 440,  type: 'sine',      durationMs: 80,  gain: 0.18 },
  ui_upgrade_card_flip:     { freq: 660, endFreq: 440,  type: 'triangle',  durationMs: 100, gain: 0.25 },
  ui_claim_sweep:           { freq: 440, endFreq: 880,  type: 'sine',      durationMs: 200, gain: 0.28 },
  ui_pull_button_charge:    { freq: 220, endFreq: 440,  type: 'sawtooth',  durationMs: 300, gain: 0.30, attackMs: 40 },
  rarity_common_pop:        { freq: 440,                type: 'sine',      durationMs: 80,  gain: 0.25 },
  rarity_uncommon_pop:      { freq: 660,                type: 'sine',      durationMs: 120, gain: 0.28 },
  rarity_rare_bell:         { freq: 880,                type: 'sine',      durationMs: 320, gain: 0.32 },
  rarity_epic_bass:         { freq: 110, endFreq: 220,  type: 'sawtooth',  durationMs: 420, gain: 0.42, attackMs: 15 },
  rarity_legendary_choir:   { freq: 523, endFreq: 784,  type: 'sine',      durationMs: 650, gain: 0.45, attackMs: 30 },
  rarity_mythic_impact:     { freq: 80,  endFreq: 160,  type: 'sawtooth',  durationMs: 800, gain: 0.55, attackMs: 20 },
}

function renderProfile(p: Profile): Buffer {
  const { freq, endFreq, type, durationMs, gain, attackMs = 4 } = p
  const numSamples = Math.ceil(SAMPLE_RATE * durationMs / 1000)
  const totalSec   = durationMs / 1000
  const attackSec  = attackMs / 1000

  const samples = new Int16Array(numSamples)
  let phase = 0

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE

    // Exponential frequency sweep
    const freqNow = endFreq
      ? freq * Math.pow(endFreq / freq, t / totalSec)
      : freq

    // Accumulate phase (keeps numerical precision)
    phase = (phase + (2 * Math.PI * freqNow) / SAMPLE_RATE) % (2 * Math.PI)

    // Oscillator sample
    let s = 0
    switch (type) {
      case 'sine':
        s = Math.sin(phase)
        break
      case 'square':
        s = Math.sin(phase) >= 0 ? 1 : -1
        break
      case 'sawtooth':
        s = phase / Math.PI - 1   // phase ∈ [0,2π) → [-1, 1)
        break
      case 'triangle': {
        const p = phase / (2 * Math.PI)  // [0, 1)
        s = p < 0.5 ? 4 * p - 1 : 3 - 4 * p
        break
      }
    }

    // Envelope: linear attack → exponential decay
    let env: number
    if (t < attackSec) {
      env = attackSec > 0 ? t / attackSec : 1
    } else {
      const decayDur = totalSec - attackSec
      env = decayDur > 0 ? Math.pow(0.001, (t - attackSec) / decayDur) : 1
    }

    samples[i] = Math.round(Math.max(-1, Math.min(1, s * env * gain)) * 32767)
  }

  return wavBuffer(samples)
}

function wavBuffer(samples: Int16Array): Buffer {
  const dataBytes = samples.length * 2
  const buf = Buffer.alloc(44 + dataBytes)

  buf.write('RIFF', 0, 'ascii')
  buf.writeUInt32LE(36 + dataBytes, 4)
  buf.write('WAVE', 8, 'ascii')
  buf.write('fmt ', 12, 'ascii')
  buf.writeUInt32LE(16, 16)          // chunk size
  buf.writeUInt16LE(1, 20)           // PCM
  buf.writeUInt16LE(1, 22)           // mono
  buf.writeUInt32LE(SAMPLE_RATE, 24)
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28)  // byteRate (SR * channels * bps/8)
  buf.writeUInt16LE(2, 32)           // blockAlign
  buf.writeUInt16LE(16, 34)          // bitsPerSample
  buf.write('data', 36, 'ascii')
  buf.writeUInt32LE(dataBytes, 40)

  for (let i = 0; i < samples.length; i++) {
    buf.writeInt16LE(samples[i], 44 + i * 2)
  }

  return buf
}

// event → public path: combat_sword_tick → combat/sword-tick.wav
function eventToRelPath(event: string): string {
  const idx  = event.indexOf('_')
  const cat  = event.slice(0, idx)
  const name = event.slice(idx + 1).replace(/_/g, '-')
  return path.join(cat, `${name}.wav`)
}

let generated = 0, skipped = 0

for (const [event, profile] of Object.entries(PROFILES)) {
  const relPath = eventToRelPath(event)
  const outPath = path.join(OUT_DIR, relPath)
  const dir     = path.dirname(outPath)

  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const buf = renderProfile(profile)
  fs.writeFileSync(outPath, buf)
  console.log(`  ✓  ${relPath}  (${buf.length} bytes)`)
  generated++
}

console.log(`\nGenerated ${generated} WAV files → public/assets/audio/`)
