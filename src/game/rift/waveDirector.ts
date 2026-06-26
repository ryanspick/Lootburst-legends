import type { TimelineEvent } from './riftTypes'

// 80-second timeline — bullet-hell pace, waves every 3-5 seconds
export const RIFT_DURATION_MS = 80_000

export const TIMELINE: TimelineEvent[] = [
  // Phase 1 — opening swarm (0-20s): ring and scatter mix, easy density
  { atMs: 0,      type: 'wave_spawn', data: { wave: 0, count: 5,  pattern: 'ring'        }, fired: false },
  { atMs: 4_000,  type: 'wave_spawn', data: { wave: 0, count: 6,  pattern: 'scatter'     }, fired: false },
  { atMs: 8_000,  type: 'wave_spawn', data: { wave: 1, count: 7,  pattern: 'burst_sides' }, fired: false },
  { atMs: 11_000, type: 'wave_spawn', data: { wave: 1, count: 7,  pattern: 'scatter'     }, fired: false },
  { atMs: 14_000, type: 'wave_spawn', data: { wave: 2, count: 8,  pattern: 'burst_top'   }, fired: false },
  { atMs: 17_000, type: 'wave_spawn', data: { wave: 2, count: 8,  pattern: 'ring'        }, fired: false },
  { atMs: 19_000, type: 'upgrade_choice', data: {},                                         fired: false },

  // Phase 2 — elites mix in (21-35s): harder enemies, new patterns
  { atMs: 21_000, type: 'wave_spawn', data: { wave: 2, count: 9,  pattern: 'burst_sides' }, fired: false },
  { atMs: 24_000, type: 'wave_spawn', data: { wave: 3, count: 3,  pattern: 'ring'        }, fired: false },
  { atMs: 27_000, type: 'wave_spawn', data: { wave: 2, count: 10, pattern: 'scatter'     }, fired: false },
  { atMs: 30_000, type: 'wave_spawn', data: { wave: 3, count: 4,  pattern: 'burst_top'   }, fired: false },
  { atMs: 31_000, type: 'boss_warning',   data: { bossId: 'boss_mushroom_matriarch' },       fired: false },
  { atMs: 33_000, type: 'mid_boss',       data: { bossId: 'boss_mushroom_matriarch' },       fired: false },

  // Phase 3 — post mid-boss surge (39-60s): dense multi-pattern assault
  { atMs: 39_000, type: 'upgrade_choice', data: {},                                         fired: false },
  { atMs: 42_000, type: 'wave_spawn', data: { wave: 4, count: 10, pattern: 'ring'        }, fired: false },
  { atMs: 45_000, type: 'wave_spawn', data: { wave: 4, count: 10, pattern: 'scatter'     }, fired: false },
  { atMs: 48_000, type: 'wave_spawn', data: { wave: 3, count: 5,  pattern: 'burst_sides' }, fired: false },
  { atMs: 51_000, type: 'wave_spawn', data: { wave: 4, count: 12, pattern: 'burst_bottom'}, fired: false },
  { atMs: 54_000, type: 'wave_spawn', data: { wave: 5, count: 8,  pattern: 'ring'        }, fired: false },
  { atMs: 57_000, type: 'wave_spawn', data: { wave: 5, count: 7,  pattern: 'scatter'     }, fired: false },

  // Phase 4 — final boss buildup (60-80s)
  { atMs: 60_000, type: 'wave_spawn', data: { wave: 5, count: 8,  pattern: 'burst_sides' }, fired: false },
  { atMs: 63_000, type: 'wave_spawn', data: { wave: 4, count: 14, pattern: 'ring'        }, fired: false },
  { atMs: 66_000, type: 'boss_warning',   data: { bossId: 'boss_king_slime_pop' },          fired: false },
  { atMs: 68_000, type: 'final_boss',     data: { bossId: 'boss_king_slime_pop' },          fired: false },
  { atMs: 80_000, type: 'end_run',        data: {},                                         fired: false },
]

// Enemy pool by wave — escalating threat
const WAVE_ENEMY_POOLS: Record<number, string[]> = {
  0: ['enemy_slime', 'enemy_bat', 'enemy_goblin'],
  1: ['enemy_slime', 'enemy_mushroom', 'enemy_skull'],
  2: ['enemy_goblin', 'enemy_gear_bug', 'enemy_ghost'],
  3: ['enemy_elite_crystal_golem', 'enemy_elite_gold_mimic'],
  4: ['enemy_ghost', 'enemy_skull', 'enemy_elite_crystal_golem'],   // elites enter mid-game
  5: ['enemy_elite_crystal_golem', 'enemy_elite_gold_mimic'],        // all-elite final surge
}

export function getEnemyPoolForWave(wave: number): string[] {
  return WAVE_ENEMY_POOLS[wave] ?? WAVE_ENEMY_POOLS[0]
}

export function cloneTimeline(): TimelineEvent[] {
  return TIMELINE.map(e => ({ ...e, data: e.data ? { ...e.data } : undefined, fired: false }))
}
