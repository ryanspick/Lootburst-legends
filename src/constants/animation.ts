export const CLIP_FPS = {
  idle:          5,
  walk:          9,
  basic_attack:  12,
  skill_cast:    10,
  ultimate_pose: 8,
  hit:           12,
  ko:            8,
  victory:       5,
} as const

export const CLIP_FRAMES = {
  idle:          4,
  walk:          6,
  basic_attack:  4,
  skill_cast:    4,
  ultimate_pose: 6,
  hit:           2,
  ko:            4,
  victory:       4,
} as const

export const CLIP_LOOPS = {
  idle:          true,
  walk:          true,
  basic_attack:  false,
  skill_cast:    false,
  ultimate_pose: false,
  hit:           false,
  ko:            false,
  victory:       true,
} as const

export type ClipName = keyof typeof CLIP_FPS

// State priority (higher index = higher priority)
export const CLIP_PRIORITY: ClipName[] = [
  'idle', 'walk', 'basic_attack', 'skill_cast', 'ultimate_pose', 'hit', 'ko',
]

export const HITSTOP_MS = {
  normalHit:   25,
  crit:        65,
  bossDeath:   200,
  legendary:   350,
  mythic:      700,
} as const

export const SCREEN_SHAKE = {
  smallHit:    { intensityPx: 3,  durationMs: 150, frequency: 20 },
  crit:        { intensityPx: 6,  durationMs: 200, frequency: 18 },
  heavySkill:  { intensityPx: 8,  durationMs: 250, frequency: 16 },
  bossAttack:  { intensityPx: 10, durationMs: 300, frequency: 15 },
  bossDeath:   { intensityPx: 16, durationMs: 500, frequency: 12 },
  legendary:   { intensityPx: 12, durationMs: 400, frequency: 14 },
  mythic:      { intensityPx: 20, durationMs: 700, frequency: 10 },
} as const

export type ShakePresetKey = keyof typeof SCREEN_SHAKE

// Motion primitive speeds
export const MOTION = {
  bobAmplitudePx:    4,
  bobSpeedMs:        2000,
  pulseMin:          0.95,
  pulseMax:          1.05,
  pulseSpeedMs:      1500,
  glintDurationMs:   600,
  glintIntervalMs:   4000,
  driftSpeedPx:      0.3,
  shimmerSpeedMs:    2000,
} as const
