import type { TimelineEvent } from './riftTypes'

// 110-second timeline — horde mode, 10× enemy counts, waves every 4-8 seconds
export const RIFT_DURATION_MS = 110_000

export const TIMELINE: TimelineEvent[] = [
  // Phase 1 — opening swarm (0-20s): ring and scatter mix, easy density
  { atMs: 0,      type: 'wave_spawn', data: { wave: 0, count: 50,  pattern: 'ring'        }, fired: false },
  { atMs: 5_000,  type: 'wave_spawn', data: { wave: 0, count: 60,  pattern: 'scatter'     }, fired: false },
  { atMs: 10_000, type: 'wave_spawn', data: { wave: 1, count: 70,  pattern: 'burst_sides' }, fired: false },
  { atMs: 14_000, type: 'wave_spawn', data: { wave: 1, count: 70,  pattern: 'scatter'     }, fired: false },
  { atMs: 17_000, type: 'wave_spawn', data: { wave: 2, count: 80,  pattern: 'burst_top'   }, fired: false },
  { atMs: 21_000, type: 'wave_spawn', data: { wave: 2, count: 80,  pattern: 'ring'        }, fired: false },
  { atMs: 24_000, type: 'upgrade_choice', data: {},                                          fired: false },

  // Phase 2 — elites mix in (26-45s): harder enemies, new patterns
  { atMs: 26_000, type: 'wave_spawn', data: { wave: 2, count: 90,  pattern: 'burst_sides' }, fired: false },
  { atMs: 30_000, type: 'wave_spawn', data: { wave: 3, count: 30,  pattern: 'ring'        }, fired: false },
  { atMs: 34_000, type: 'wave_spawn', data: { wave: 2, count: 100, pattern: 'scatter'     }, fired: false },
  { atMs: 38_000, type: 'wave_spawn', data: { wave: 3, count: 40,  pattern: 'burst_top'   }, fired: false },
  { atMs: 40_000, type: 'boss_warning',   data: { bossId: 'boss_mushroom_matriarch' },       fired: false },
  { atMs: 43_000, type: 'mid_boss',       data: { bossId: 'boss_mushroom_matriarch' },       fired: false },

  // Phase 3 — post mid-boss surge (50-80s): dense multi-pattern assault
  { atMs: 50_000, type: 'upgrade_choice', data: {},                                          fired: false },
  { atMs: 53_000, type: 'wave_spawn', data: { wave: 4, count: 100, pattern: 'ring'        }, fired: false },
  { atMs: 58_000, type: 'wave_spawn', data: { wave: 4, count: 100, pattern: 'scatter'     }, fired: false },
  { atMs: 63_000, type: 'wave_spawn', data: { wave: 3, count: 50,  pattern: 'burst_sides' }, fired: false },
  { atMs: 68_000, type: 'wave_spawn', data: { wave: 4, count: 120, pattern: 'burst_bottom'}, fired: false },
  { atMs: 73_000, type: 'wave_spawn', data: { wave: 5, count: 80,  pattern: 'ring'        }, fired: false },
  { atMs: 78_000, type: 'wave_spawn', data: { wave: 5, count: 70,  pattern: 'scatter'     }, fired: false },

  // Phase 4 — final boss buildup (82-110s)
  { atMs: 82_000,  type: 'wave_spawn',    data: { wave: 5, count: 80,  pattern: 'burst_sides' }, fired: false },
  { atMs: 87_000,  type: 'wave_spawn',    data: { wave: 4, count: 140, pattern: 'ring'        }, fired: false },
  { atMs: 90_000,  type: 'boss_warning',  data: { bossId: 'boss_king_slime_pop' },              fired: false },
  { atMs: 93_000,  type: 'final_boss',    data: { bossId: 'boss_king_slime_pop' },              fired: false },
  { atMs: 110_000, type: 'end_run',       data: {},                                              fired: false },
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
