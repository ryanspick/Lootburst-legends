import type { TimelineEvent } from './riftTypes'

export const RIFT_DURATION_MS = 120_000

// Each wave_spawn event goes into a QUEUE — actual spawn fires when:
//   (a) previous wave enemies reach 0, AND
//   (b) WAVE_CLEAR_DELAY_MS rest has elapsed (or first wave spawns immediately)
// If enemies linger, the event stays queued until cleared, then rest starts.
export const WAVE_CLEAR_DELAY_MS = 6_000

export const TIMELINE: TimelineEvent[] = [
  // Waves 1-3 all queue at t=0 so they chain on completion (no waiting for time-gated events).
  // The waveQueue is FIFO — each wave waits for the previous to clear before spawning.
  { atMs: 0,       type: 'wave_spawn',    data: { wave: 1, count: 18, pattern: 'ring' },         fired: false },
  { atMs: 0,       type: 'wave_spawn',    data: { wave: 2, count: 22, pattern: 'scatter' },      fired: false },
  { atMs: 0,       type: 'wave_spawn',    data: { wave: 3, count: 30, pattern: 'burst_sides' },  fired: false },

  // Upgrade break + mid-boss (still time-gated so they fire after enough run time)
  { atMs: 56_000,  type: 'upgrade_choice', data: {},                                              fired: false },
  { atMs: 62_000,  type: 'boss_warning',   data: { bossId: 'boss_mushroom_matriarch' },           fired: false },
  { atMs: 65_000,  type: 'mid_boss',       data: { bossId: 'boss_mushroom_matriarch' },           fired: false },

  // Waves 4-5 also chain: both queue at the same time after the mid-boss window
  { atMs: 76_000,  type: 'wave_spawn',    data: { wave: 4, count: 25, pattern: 'ring' },         fired: false },
  { atMs: 76_000,  type: 'wave_spawn',    data: { wave: 5, count: 35, pattern: 'burst_top' },    fired: false },

  // Final upgrade + boss
  { atMs: 103_000, type: 'upgrade_choice', data: {},                                              fired: false },
  { atMs: 108_000, type: 'boss_warning',   data: { bossId: 'boss_king_slime_pop' },              fired: false },
  { atMs: 112_000, type: 'final_boss',     data: { bossId: 'boss_king_slime_pop' },              fired: false },
  { atMs: 120_000, type: 'end_run',        data: {},                                              fired: false },
]

// Enemy pool by wave — escalating threat
const WAVE_ENEMY_POOLS: Record<number, string[]> = {
  1: ['enemy_slime', 'enemy_bat', 'enemy_goblin'],
  2: ['enemy_slime', 'enemy_mushroom', 'enemy_skull'],
  3: ['enemy_goblin', 'enemy_gear_bug', 'enemy_ghost'],
  4: ['enemy_ghost', 'enemy_skull', 'enemy_elite_crystal_golem'],
  5: ['enemy_elite_crystal_golem', 'enemy_elite_gold_mimic'],
}

export function getEnemyPoolForWave(wave: number): string[] {
  return WAVE_ENEMY_POOLS[wave] ?? WAVE_ENEMY_POOLS[1]
}

export function cloneTimeline(): TimelineEvent[] {
  return TIMELINE.map(e => ({ ...e, data: e.data ? { ...e.data } : undefined, fired: false }))
}
