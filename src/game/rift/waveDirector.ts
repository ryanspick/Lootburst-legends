import type { TimelineEvent } from './riftTypes'

export const RIFT_DURATION_MS    = 110_000   // longest zone end_run; HUD timer max
export const NORMAL_WAVE_CLEAR_DELAY_MS = 250
export const WAVE_CLEAR_DELAY_MS = 1_500     // delay after boss death before post-boss waves spawn
export const WAVE_AUTO_ADVANCE_MS = 10_000   // max time before the next queued wave starts

const DEFAULT_ZONE_ID = 'candy_cavern_rift'

// Enemy pools per zone × wave — escalating threat, zone-themed elements
const ZONE_ENEMY_POOLS: Record<string, Record<number, string[]>> = {
  candy_cavern_rift: {
    1: ['enemy_slime', 'enemy_bat', 'enemy_goblin'],
    2: ['enemy_slime', 'enemy_mushroom', 'enemy_skull', 'enemy_goblin'],
    3: ['enemy_mushroom', 'enemy_skull', 'enemy_ghost'],
    4: ['enemy_elite_crystal_golem', 'enemy_ghost', 'enemy_skull'],
    5: ['enemy_elite_crystal_golem', 'enemy_elite_gold_mimic', 'enemy_elite_shadow_reaper'],
    6: ['enemy_void_wisp', 'enemy_ghost', 'enemy_elite_crystal_golem', 'enemy_elite_gold_mimic'],
    7: ['enemy_void_wisp', 'enemy_ghost', 'enemy_elite_crystal_golem', 'enemy_elite_shadow_reaper'],
  },
  goblin_glitter_mines: {
    1: ['enemy_goblin', 'enemy_gear_bug', 'enemy_gold_beetle'],
    2: ['enemy_goblin', 'enemy_gear_bug', 'enemy_bat'],
    3: ['enemy_gear_bug', 'enemy_gold_beetle', 'enemy_skull'],
    4: ['enemy_goblin', 'enemy_gold_beetle', 'enemy_flame_imp'],
    5: ['enemy_flame_imp', 'enemy_gold_beetle', 'enemy_elite_crystal_golem'],
    6: ['enemy_gold_beetle', 'enemy_flame_imp', 'enemy_elite_crystal_golem', 'enemy_elite_gold_mimic'],
    7: ['enemy_gold_beetle', 'enemy_flame_imp', 'enemy_elite_gold_mimic', 'enemy_elite_shadow_reaper'],
  },
  void_arcade: {
    1: ['enemy_gear_bug', 'enemy_bat', 'enemy_goblin'],
    2: ['enemy_gear_bug', 'enemy_skull', 'enemy_flame_imp'],
    3: ['enemy_ghost', 'enemy_void_wisp', 'enemy_ice_sprite'],
    4: ['enemy_void_wisp', 'enemy_ice_sprite', 'enemy_elite_crystal_golem'],
    5: ['enemy_void_wisp', 'enemy_elite_crystal_golem', 'enemy_elite_shadow_reaper'],
    6: ['enemy_void_wisp', 'enemy_ice_sprite', 'enemy_elite_crystal_golem', 'enemy_elite_shadow_reaper'],
    7: ['enemy_void_wisp', 'enemy_ice_sprite', 'enemy_elite_shadow_reaper', 'enemy_elite_gold_mimic'],
  },
  moon_vault: {
    1: ['enemy_skull', 'enemy_ghost', 'enemy_bat'],
    2: ['enemy_ghost', 'enemy_ice_sprite', 'enemy_skull'],
    3: ['enemy_ghost', 'enemy_void_wisp', 'enemy_ice_sprite'],
    4: ['enemy_void_wisp', 'enemy_ice_sprite', 'enemy_elite_crystal_golem'],
    5: ['enemy_void_wisp', 'enemy_elite_crystal_golem', 'enemy_elite_shadow_reaper'],
    6: ['enemy_void_wisp', 'enemy_ice_sprite', 'enemy_elite_crystal_golem', 'enemy_elite_shadow_reaper'],
    7: ['enemy_ghost', 'enemy_ice_sprite', 'enemy_elite_shadow_reaper', 'enemy_elite_crystal_golem'],
  },
  starforge_nursery: {
    1: ['enemy_ghost', 'enemy_void_wisp', 'enemy_ice_sprite'],
    2: ['enemy_void_wisp', 'enemy_ice_sprite', 'enemy_flame_imp'],
    3: ['enemy_void_wisp', 'enemy_flame_imp', 'enemy_ghost'],
    4: ['enemy_void_wisp', 'enemy_ice_sprite', 'enemy_elite_shadow_reaper'],
    5: ['enemy_void_wisp', 'enemy_elite_shadow_reaper', 'enemy_elite_crystal_golem'],
    6: ['enemy_void_wisp', 'enemy_ice_sprite', 'enemy_elite_shadow_reaper', 'enemy_elite_crystal_golem'],
    7: ['enemy_void_wisp', 'enemy_flame_imp', 'enemy_elite_shadow_reaper', 'enemy_elite_gold_mimic'],
  },
}

function ev(atMs: number, type: TimelineEvent['type'], data?: Record<string, unknown>): TimelineEvent {
  return { atMs, type, data, fired: false }
}

// Per-zone timelines define wave rosters, upgrade breaks, and zone-matched bosses.
// RiftRunScreen pulls wave_spawn entries into explicit queues at run start; fixed
// timeline timestamps no longer decide when normal waves begin.
const ZONE_TIMELINES: Record<string, TimelineEvent[]> = {
  candy_cavern_rift: [
    ev(0,        'wave_spawn',   { wave: 1, count: 22, pattern: 'ring' }),
    ev(0,        'wave_spawn',   { wave: 2, count: 28, pattern: 'scatter' }),
    ev(0,        'wave_spawn',   { wave: 3, count: 32, pattern: 'burst_sides' }),
    ev(0,        'wave_spawn',   { wave: 4, count: 38, pattern: 'burst_top' }),
    ev(0,        'wave_spawn',   { wave: 5, count: 42, pattern: 'ring' }),
    ev(15_000,   'upgrade_choice'),
    ev(30_000,   'upgrade_choice'),
    ev(44_000,   'upgrade_choice'),
    ev(45_000,   'wave_spawn',   { wave: 6, count: 28, pattern: 'burst_sides' }),
    ev(45_000,   'wave_spawn',   { wave: 7, count: 34, pattern: 'scatter' }),
    ev(47_000,   'boss_warning', { bossId: 'boss_mushroom_matriarch' }),
    ev(50_000,   'mid_boss',     { bossId: 'boss_mushroom_matriarch' }),
    ev(68_000,   'upgrade_choice'),
    ev(73_000,   'boss_warning', { bossId: 'boss_king_slime_pop' }),
    ev(76_000,   'final_boss',   { bossId: 'boss_king_slime_pop' }),
    ev(91_000,   'end_run'),
  ],
  goblin_glitter_mines: [
    ev(0,        'wave_spawn',   { wave: 1, count: 25, pattern: 'ring' }),
    ev(0,        'wave_spawn',   { wave: 2, count: 30, pattern: 'scatter' }),
    ev(0,        'wave_spawn',   { wave: 3, count: 36, pattern: 'burst_sides' }),
    ev(0,        'wave_spawn',   { wave: 4, count: 40, pattern: 'burst_top' }),
    ev(0,        'wave_spawn',   { wave: 5, count: 44, pattern: 'ring' }),
    ev(17_000,   'upgrade_choice'),
    ev(34_000,   'upgrade_choice'),
    ev(48_000,   'upgrade_choice'),
    ev(49_000,   'wave_spawn',   { wave: 6, count: 30, pattern: 'burst_sides' }),
    ev(49_000,   'wave_spawn',   { wave: 7, count: 36, pattern: 'scatter' }),
    ev(51_000,   'boss_warning', { bossId: 'boss_goblin_minecart_ace' }),
    ev(54_000,   'mid_boss',     { bossId: 'boss_goblin_minecart_ace' }),
    ev(73_000,   'upgrade_choice'),
    ev(78_000,   'boss_warning', { bossId: 'boss_tax_collector_mimic' }),
    ev(81_000,   'final_boss',   { bossId: 'boss_tax_collector_mimic' }),
    ev(97_000,   'end_run'),
  ],
  void_arcade: [
    ev(0,        'wave_spawn',   { wave: 1, count: 27, pattern: 'ring' }),
    ev(0,        'wave_spawn',   { wave: 2, count: 33, pattern: 'scatter' }),
    ev(0,        'wave_spawn',   { wave: 3, count: 38, pattern: 'burst_sides' }),
    ev(0,        'wave_spawn',   { wave: 4, count: 42, pattern: 'burst_top' }),
    ev(0,        'wave_spawn',   { wave: 5, count: 46, pattern: 'ring' }),
    ev(19_000,   'upgrade_choice'),
    ev(38_000,   'upgrade_choice'),
    ev(52_000,   'upgrade_choice'),
    ev(53_000,   'wave_spawn',   { wave: 6, count: 30, pattern: 'burst_sides' }),
    ev(53_000,   'wave_spawn',   { wave: 7, count: 36, pattern: 'scatter' }),
    ev(55_000,   'boss_warning', { bossId: 'boss_pumpkin_gearlord' }),
    ev(58_000,   'mid_boss',     { bossId: 'boss_pumpkin_gearlord' }),
    ev(77_000,   'upgrade_choice'),
    ev(82_000,   'boss_warning', { bossId: 'boss_void_arcade_dragon' }),
    ev(85_000,   'final_boss',   { bossId: 'boss_void_arcade_dragon' }),
    ev(101_000,  'end_run'),
  ],
  moon_vault: [
    ev(0,        'wave_spawn',   { wave: 1, count: 28, pattern: 'ring' }),
    ev(0,        'wave_spawn',   { wave: 2, count: 34, pattern: 'scatter' }),
    ev(0,        'wave_spawn',   { wave: 3, count: 40, pattern: 'burst_sides' }),
    ev(0,        'wave_spawn',   { wave: 4, count: 44, pattern: 'burst_top' }),
    ev(0,        'wave_spawn',   { wave: 5, count: 48, pattern: 'ring' }),
    ev(21_000,   'upgrade_choice'),
    ev(42_000,   'upgrade_choice'),
    ev(56_000,   'upgrade_choice'),
    ev(57_000,   'wave_spawn',   { wave: 6, count: 32, pattern: 'burst_sides' }),
    ev(57_000,   'wave_spawn',   { wave: 7, count: 38, pattern: 'scatter' }),
    ev(59_000,   'boss_warning', { bossId: 'boss_neon_bone_hydra' }),
    ev(62_000,   'mid_boss',     { bossId: 'boss_neon_bone_hydra' }),
    ev(81_000,   'upgrade_choice'),
    ev(86_000,   'boss_warning', { bossId: 'boss_moon_vault' }),
    ev(89_000,   'final_boss',   { bossId: 'boss_moon_vault' }),
    ev(105_000,  'end_run'),
  ],
  starforge_nursery: [
    ev(0,        'wave_spawn',   { wave: 1, count: 30, pattern: 'ring' }),
    ev(0,        'wave_spawn',   { wave: 2, count: 36, pattern: 'scatter' }),
    ev(0,        'wave_spawn',   { wave: 3, count: 42, pattern: 'burst_sides' }),
    ev(0,        'wave_spawn',   { wave: 4, count: 46, pattern: 'burst_top' }),
    ev(0,        'wave_spawn',   { wave: 5, count: 50, pattern: 'ring' }),
    ev(23_000,   'upgrade_choice'),
    ev(46_000,   'upgrade_choice'),
    ev(60_000,   'upgrade_choice'),
    ev(61_000,   'wave_spawn',   { wave: 6, count: 34, pattern: 'burst_sides' }),
    ev(61_000,   'wave_spawn',   { wave: 7, count: 40, pattern: 'scatter' }),
    ev(63_000,   'boss_warning', { bossId: 'boss_moon_vault' }),
    ev(66_000,   'mid_boss',     { bossId: 'boss_moon_vault' }),
    ev(86_000,   'upgrade_choice'),
    ev(91_000,   'boss_warning', { bossId: 'boss_star_eater_cherub' }),
    ev(94_000,   'final_boss',   { bossId: 'boss_star_eater_cherub' }),
    ev(110_000,  'end_run'),
  ],
}

export function getEnemyPoolForWaveInZone(wave: number, zoneId: string): string[] {
  const pools = ZONE_ENEMY_POOLS[zoneId] ?? ZONE_ENEMY_POOLS[DEFAULT_ZONE_ID]
  const maxWave = Math.max(...Object.keys(pools).map(Number))
  return pools[Math.min(wave, maxWave)] ?? pools[1] ?? ['enemy_slime']
}

export function getEnemyPoolForWave(wave: number): string[] {
  return getEnemyPoolForWaveInZone(wave, DEFAULT_ZONE_ID)
}

export function getTimelineForZone(zoneId: string): TimelineEvent[] {
  const src = ZONE_TIMELINES[zoneId] ?? ZONE_TIMELINES[DEFAULT_ZONE_ID]
  return src.map(e => ({ ...e, data: e.data ? { ...e.data } : undefined, fired: false }))
}

export function cloneTimeline(): TimelineEvent[] {
  return getTimelineForZone(DEFAULT_ZONE_ID)
}
