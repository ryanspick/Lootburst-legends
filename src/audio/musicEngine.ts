// Procedural background music via Web Audio API.
// All tracks are synthesized — no audio files required.

export type MusicTrack = 'hub' | 'rift' | 'boss' | 'victory' | 'wipe'

// ── Frequency table ───────────────────────────────────────────────────────────
const N: Record<string, number> = {
  C2: 65.41,  D2: 73.42,  E2: 82.41,  F2: 87.31,  G2: 98.00,
  A2: 110.00, Bb2: 116.54,
  C3: 130.81, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61,
  G3: 196.00, Ab3: 207.65, A3: 220.00, Bb3: 233.08, B3: 246.94,
  C4: 261.63, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23,
  G4: 392.00, Ab4: 415.30, A4: 440.00, Bb4: 466.16, B4: 493.88,
  C5: 523.25, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46,
  G5: 783.99, A5: 880.00,
}

// [freq, startBeat, durationBeats, gain, oscType]
type NoteEvt = [number, number, number, number, OscillatorType]

interface TrackDef {
  bpm:   number
  beats: number   // loop length
  loop:  boolean
  notes: NoteEvt[]
}

const TRACKS: Record<MusicTrack, TrackDef> = {
  // ── Hub: C major, 88bpm, 16 beats (≈10.9s loop) ──────────────────────────
  hub: {
    bpm: 88, beats: 16, loop: true,
    notes: [
      // Bass (sawtooth, filtered) — I VI IV V
      [N.C2,  0, 3.8, 0.28, 'sawtooth'],
      [N.A2,  4, 3.8, 0.28, 'sawtooth'],
      [N.F2,  8, 3.8, 0.28, 'sawtooth'],
      [N.G2, 12, 3.8, 0.28, 'sawtooth'],
      // Pad chords (triangle, sustained)
      [N.C3,  0, 3.6, 0.14, 'triangle'], [N.E3,  0, 3.6, 0.11, 'triangle'], [N.G3,  0, 3.6, 0.08, 'triangle'],
      [N.A3,  4, 3.6, 0.14, 'triangle'], [N.C4,  4, 3.6, 0.11, 'triangle'], [N.E4,  4, 3.6, 0.08, 'triangle'],
      [N.F3,  8, 3.6, 0.14, 'triangle'], [N.A3,  8, 3.6, 0.11, 'triangle'], [N.C4,  8, 3.6, 0.08, 'triangle'],
      [N.G3, 12, 3.6, 0.14, 'triangle'], [N.B3, 12, 3.6, 0.11, 'triangle'], [N.D4, 12, 3.6, 0.08, 'triangle'],
      // Melody (sine, arpeggios)
      [N.C5,  0, .8, 0.18, 'sine'], [N.E5,  1, .8, 0.18, 'sine'], [N.G5,  2, .8, 0.18, 'sine'], [N.E5,  3, .7, 0.16, 'sine'],
      [N.A4,  4, .8, 0.18, 'sine'], [N.C5,  5, .8, 0.18, 'sine'], [N.E5,  6, .8, 0.18, 'sine'], [N.C5,  7, .7, 0.16, 'sine'],
      [N.F4,  8, .8, 0.18, 'sine'], [N.A4,  9, .8, 0.18, 'sine'], [N.C5, 10, .8, 0.18, 'sine'], [N.A4, 11, .7, 0.16, 'sine'],
      [N.G4, 12, .8, 0.18, 'sine'], [N.B4, 13, .8, 0.18, 'sine'], [N.D5, 14, .8, 0.18, 'sine'], [N.G5, 15, 1.0, 0.20, 'sine'],
    ],
  },

  // ── Rift: A minor, 140bpm, 16 beats (≈6.9s loop) ─────────────────────────
  rift: {
    bpm: 140, beats: 16, loop: true,
    notes: [
      // Bass (sawtooth, driving eighth-note feel)
      [N.A2,  0, .8, 0.35, 'sawtooth'], [N.A2,  1, .4, 0.30, 'sawtooth'],
      [N.C3,  2, .4, 0.30, 'sawtooth'], [N.G2,  3, .8, 0.30, 'sawtooth'],
      [N.A2,  4, .8, 0.35, 'sawtooth'], [N.A2,  5, .4, 0.30, 'sawtooth'],
      [N.E3,  6, .4, 0.30, 'sawtooth'], [N.D3,  7, .8, 0.30, 'sawtooth'],
      [N.A2,  8, .8, 0.35, 'sawtooth'], [N.A2,  9, .4, 0.30, 'sawtooth'],
      [N.C3, 10, .4, 0.30, 'sawtooth'], [N.G2, 11, .8, 0.30, 'sawtooth'],
      [N.E2, 12, .8, 0.35, 'sawtooth'], [N.G2, 13, .4, 0.30, 'sawtooth'],
      [N.A2, 14, .8, 0.35, 'sawtooth'], [N.A2, 15, .4, 0.26, 'sawtooth'],
      // Pad chords (triangle) — Am Dm Em Am
      [N.A3,  0, 3.8, 0.12, 'triangle'], [N.C4,  0, 3.8, 0.10, 'triangle'], [N.E4,  0, 3.8, 0.08, 'triangle'],
      [N.D4,  4, 3.8, 0.12, 'triangle'], [N.F4,  4, 3.8, 0.10, 'triangle'], [N.A4,  4, 3.8, 0.08, 'triangle'],
      [N.E4,  8, 3.8, 0.12, 'triangle'], [N.G4,  8, 3.8, 0.10, 'triangle'], [N.B4,  8, 3.8, 0.08, 'triangle'],
      [N.A3, 12, 3.8, 0.12, 'triangle'], [N.C4, 12, 3.8, 0.10, 'triangle'], [N.E4, 12, 3.8, 0.08, 'triangle'],
      // Melody (triangle, A minor pentatonic runs)
      [N.A4,  0, .4, 0.20, 'triangle'], [N.C5,  1, .4, 0.20, 'triangle'],
      [N.D5,  2, .4, 0.20, 'triangle'], [N.E5,  3, .4, 0.20, 'triangle'],
      [N.G5,  4, .6, 0.22, 'triangle'], [N.E5,  5, .4, 0.18, 'triangle'],
      [N.D5,  6, .4, 0.18, 'triangle'], [N.C5,  7, .4, 0.18, 'triangle'],
      [N.A4,  8, .4, 0.20, 'triangle'], [N.C5,  9, .4, 0.20, 'triangle'],
      [N.D5, 10, .4, 0.20, 'triangle'], [N.E5, 11, .4, 0.20, 'triangle'],
      [N.E5, 12, 1.2, 0.22, 'triangle'], [N.D5, 13, .4, 0.18, 'triangle'],
      [N.C5, 14, .4,  0.18, 'triangle'], [N.A4, 15, .8, 0.18, 'triangle'],
    ],
  },

  // ── Boss: D minor, 160bpm, 8 beats (≈3.0s loop) ──────────────────────────
  boss: {
    bpm: 160, beats: 8, loop: true,
    notes: [
      // Heavy bass (sawtooth)
      [N.D2,   0, 1.9, 0.42, 'sawtooth'],
      [N.A2,   2, 1.9, 0.38, 'sawtooth'],
      [N.Bb2,  4, 1.9, 0.40, 'sawtooth'],
      [N.A2,   6, 1.9, 0.38, 'sawtooth'],
      // Dissonant stab chords (square)
      [N.D3,   0, .4, 0.20, 'square'], [N.Ab3,  0, .4, 0.16, 'square'],
      [N.Eb4,  .5, .4, 0.14, 'square'],
      [N.D3,   2, .3, 0.18, 'square'],
      [N.D3,   4, .4, 0.20, 'square'], [N.Ab3,  4, .4, 0.16, 'square'],
      [N.Eb4, 4.5, .4, 0.14, 'square'],
      [N.D3,   6, .4, 0.20, 'square'], [N.F3,  6.5, .4, 0.18, 'square'],
      [N.Ab3,  7, .4, 0.15, 'square'],
      // Tension lead (sawtooth)
      [N.D5,   0,  .4, 0.18, 'sawtooth'], [N.Eb5,  1, .4, 0.18, 'sawtooth'],
      [N.D5,   2, 1.8, 0.20, 'sawtooth'],
      [N.C5,   4,  .4, 0.18, 'sawtooth'], [N.Bb4,  5, .4, 0.18, 'sawtooth'],
      [N.A4,   6, 1.8, 0.20, 'sawtooth'],
    ],
  },

  // ── Victory: C major fanfare, 120bpm, 4 beats (non-looping) ──────────────
  victory: {
    bpm: 120, beats: 4, loop: false,
    notes: [
      [N.C3,  0, 4.0, 0.28, 'triangle'], [N.E3,  0, 4.0, 0.22, 'triangle'], [N.G3,  0, 4.0, 0.18, 'triangle'],
      [N.C4,   0,  .4, 0.30, 'sine'],
      [N.E4,  .5,  .4, 0.30, 'sine'],
      [N.G4, 1.0,  .4, 0.30, 'sine'],
      [N.C5, 1.5, 2.5, 0.38, 'sine'],
      [N.G4,   0,  .2, 0.24, 'square'],
      [N.C5,  .5,  .2, 0.24, 'square'],
      [N.E5, 1.0,  .2, 0.24, 'square'],
      [N.G5, 1.5, 2.5, 0.30, 'square'],
    ],
  },

  // ── Wipe: A minor sting, 80bpm, 4 beats (non-looping) ────────────────────
  wipe: {
    bpm: 80, beats: 4, loop: false,
    notes: [
      [N.A2,  0, 2.0, 0.25, 'sawtooth'], [N.E2,  2, 2.0, 0.25, 'sawtooth'],
      [N.A3,  0, 1.0, 0.16, 'triangle'], [N.C4,  0, 1.0, 0.13, 'triangle'],
      [N.G4,  0,  .5, 0.18, 'sine'],
      [N.F4,  1,  .5, 0.18, 'sine'],
      [N.E4,  2,  .5, 0.18, 'sine'],
      [N.D4,  3,  .8, 0.16, 'sine'],
    ],
  },
}

// ── Engine state ──────────────────────────────────────────────────────────────
let _ctx:         AudioContext | null = null
let _masterGain:  GainNode    | null = null
let _muted        = false
let _volume       = 0.45  // music volume (lower than SFX)
let _currentTrack: MusicTrack | null = null
let _pendingTrack: MusicTrack | null = null
let _currentDef:  TrackDef    | null = null
let _loopTimeout: ReturnType<typeof setTimeout> | null = null
let _activeNodes: OscillatorNode[] = []

function getCtx(): AudioContext | null {
  try {
    if (!_ctx) {
      _ctx = new AudioContext()
      _masterGain = _ctx.createGain()
      _masterGain.gain.value = _muted ? 0 : _volume
      _masterGain.connect(_ctx.destination)
    }
    return _ctx
  } catch {
    return null
  }
}

function clearLoop() {
  if (_loopTimeout !== null) { clearTimeout(_loopTimeout); _loopTimeout = null }
  for (const n of _activeNodes) { try { n.stop() } catch { /* already stopped */ } }
  _activeNodes = []
  _currentDef = null
}

function scheduleLoop(def: TrackDef, startTime: number): OscillatorNode[] {
  const ctx = getCtx()
  if (!ctx || !_masterGain) return []

  const beatDur = 60 / def.bpm
  const nodes: OscillatorNode[] = []

  for (const [freq, startBeat, durBeats, gain, type] of def.notes) {
    const t0 = startTime + startBeat * beatDur
    const t1 = t0 + durBeats * beatDur

    const osc = ctx.createOscillator()
    const amp = ctx.createGain()

    if (freq < 200) {
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = def === TRACKS.boss ? 380 : 750
      osc.connect(filter)
      filter.connect(amp)
    } else {
      osc.connect(amp)
    }
    amp.connect(_masterGain)

    osc.type = type
    osc.frequency.value = freq

    const attack  = Math.min(0.04, durBeats * beatDur * 0.08)
    const release = Math.min(0.10, durBeats * beatDur * 0.15)

    amp.gain.setValueAtTime(0.0001, t0)
    amp.gain.linearRampToValueAtTime(gain, t0 + attack)
    amp.gain.setValueAtTime(gain, Math.max(t0 + attack, t1 - release))
    amp.gain.linearRampToValueAtTime(0.0001, t1)

    osc.start(t0)
    osc.stop(t1 + 0.02)
    nodes.push(osc)
  }

  return nodes
}

function startTrack(def: TrackDef) {
  const ctx = getCtx()
  if (!ctx || ctx.state !== 'running') return

  clearLoop()
  _currentDef = def

  const beatDur = 60 / def.bpm
  const loopDur = def.beats * beatDur

  function iterate(iterStart: number) {
    if (_currentDef !== def) return
    _activeNodes = scheduleLoop(def, iterStart)

    if (def.loop) {
      const msUntilNext = Math.max(50, (loopDur - 0.25) * 1000)
      _loopTimeout = setTimeout(() => {
        if (_currentDef === def) iterate(iterStart + loopDur)
      }, msUntilNext)
    }
  }

  iterate(ctx.currentTime + 0.08)
}

function applyGain(to: number, durationSec: number, onDone?: () => void) {
  const ctx = getCtx()
  if (!ctx || !_masterGain) { onDone?.(); return }
  const now = ctx.currentTime
  _masterGain.gain.cancelScheduledValues(now)
  _masterGain.gain.setValueAtTime(_masterGain.gain.value, now)
  _masterGain.gain.linearRampToValueAtTime(to, now + durationSec)
  if (onDone) setTimeout(onDone, durationSec * 1000 + 10)
}

// ── Public API ────────────────────────────────────────────────────────────────

export function playTrack(track: MusicTrack) {
  if (_currentTrack === track) return

  const prev = _currentTrack
  _currentTrack = track
  const def = TRACKS[track]

  const ctx = getCtx()
  if (!ctx) return

  if (ctx.state !== 'running') {
    _pendingTrack = track
    ctx.resume().then(() => {
      if (_pendingTrack === track) {
        _pendingTrack = null
        _currentTrack = null  // allow re-entry
        playTrack(track)
      }
    }).catch(() => undefined)
    return
  }

  const targetVol = _muted ? 0 : _volume

  if (prev !== null) {
    applyGain(0, 0.35, () => {
      if (_currentTrack !== track) return
      startTrack(def)
      applyGain(targetVol, 0.55)
    })
  } else {
    if (_masterGain) _masterGain.gain.setValueAtTime(0, ctx.currentTime)
    startTrack(def)
    applyGain(targetVol, 0.7)
  }
}

export function stopMusic(fadeSec = 0.8) {
  const prev = _currentTrack
  _currentTrack = null
  if (prev === null) return
  applyGain(0, fadeSec, () => clearLoop())
}

export function setMusicMuted(v: boolean) {
  _muted = v
  const ctx = getCtx()
  if (!ctx || !_masterGain) return
  const now = ctx.currentTime
  _masterGain.gain.cancelScheduledValues(now)
  _masterGain.gain.linearRampToValueAtTime(v ? 0 : _volume, now + 0.15)
}

export function setMusicVolume(v: number) {
  _volume = Math.max(0, Math.min(1, v))
  if (_muted) return
  const ctx = getCtx()
  if (!ctx || !_masterGain) return
  const now = ctx.currentTime
  _masterGain.gain.cancelScheduledValues(now)
  _masterGain.gain.setValueAtTime(_masterGain.gain.value, now)
  _masterGain.gain.linearRampToValueAtTime(_volume, now + 0.1)
}
