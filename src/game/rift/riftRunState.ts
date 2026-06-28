import type { RiftRunState, CombatEntity, Projectile, TimelineEvent, PendingSpawn } from './riftTypes'
import type { Rarity } from '@/constants/palette'
import type { HeroGearBonuses, RunGearBonuses } from '@/game/gear/gearStats'
import heroesData from '@/data/art/heroes.visual.json'
import enemiesData from '@/data/art/enemies.visual.json'
import bossesData from '@/data/art/bosses.visual.json'
import petsData from '@/data/art/pets.visual.json'
import {
  getHeroSlot, CENTER_X, CENTER_Y, BOSS_X, BOSS_Y_POS,
  ENEMY_SPAWN_RADIUS_X, ENEMY_SPAWN_RADIUS_Y, WAVE_ANGLE_OFFSETS,
  ENEMY_DRIFT_SPEED, ELITE_DRIFT_SPEED, ENEMY_ENGAGE_RADIUS,
} from './arenaConstants'
import { getGeneratedSprite } from '@/art/generated'
import { cloneTimeline, getTimelineForZone, getEnemyPoolForWaveInZone } from './waveDirector'
import { rollUpgradeCards, UPGRADE_CARDS } from './upgradeCards'
import { triggerHitstop } from '@/animation/hitstop'
import { triggerShake } from '@/animation/screenShake'
import { emitHitSpark, emitCritPop, emitCoinBurst, emitGoldBeam, emitExplosion } from '@/vfx/emitters'
import { playSound } from '@/audio/soundEvents'
import { haptic } from '@/audio/haptics'

let _dmgId = 0
let _lootId = 0
let _projId = 0

// Attack timing constants (milliseconds)
const BASIC_CD      = 1100   // slightly faster basics = more responsive feel
const SKILL_CD      = 4500
const ULTIMATE_CD   = 11000
const ENEMY_ATK_CD  = 3000   // normal enemies — slow enough that packs don't burst-kill
const ELITE_ATK_CD  = 4800   // elites hit very slow; each hit is punishing but rare
const BOSS_ATK_CD   = 1800   // bosses attack frequently but for moderate damage
const BOSS_SKILL_CD = 9_000  // boss skill cooldown (resets after each use)
const BOSS_ULT_CD   = 22_000 // boss ultimate cooldown (resets after each use)

// Stagger per hero slot so they don't all fire simultaneously
const BASIC_STAGGER = 400
const SKILL_STAGGER = 2000
const ULT_STAGGER = 3000

function makeHeroEntity(
  heroId: string,
  slotIndex: number,
  totalHeroes: number,
  gear: HeroGearBonuses = { atk: 0, hp: 0, def: 0 },
  heroLevel = 1,
): CombatEntity {
  const def = heroesData.heroes.find(h => h.id === heroId)
  if (!def) throw new Error(`Unknown hero: ${heroId}`)
  const idx = heroesData.heroes.indexOf(def)
  const pos = getHeroSlot(slotIndex, totalHeroes)
  const baseHp  = 1000 + idx * 80
  const baseAtk = 105  + idx * 15
  const baseDef = 14
  // +5% HP and ATK per level above 1 (level 10 = +45%)
  const levelMult = 1 + (heroLevel - 1) * 0.05
  return {
    id: heroId,
    displayName: def.displayName,
    hp: Math.round((baseHp + gear.hp) * levelMult),
    maxHp: Math.round((baseHp + gear.hp) * levelMult),
    atk: Math.round((baseAtk + gear.atk) * levelMult),
    def: baseDef + gear.def,
    spd: 1.0,
    x: pos.x,
    y: pos.y,
    rarity: def.rarity as Rarity,
    role: 'hero',
    element: def.element,
    assetId: heroId,
    spriteDataUrl: getGeneratedSprite(heroId),
    alive: true,
    hitstunMs: 0,
    flashMs: 0,
    deathAnimMs: 0,
    basicCdMs: 400 + slotIndex * BASIC_STAGGER,
    skillCdMs: 5000 + slotIndex * SKILL_STAGGER,
    ultimateCdMs: 12000 + slotIndex * ULT_STAGGER,
  }
}

// HP scales per wave — each successive wave spawns tankier enemies for a smooth ramp
const WAVE_HP_SCALE = [1.0, 1.20, 1.42, 1.68, 1.98, 2.32, 2.70] as const

function makeEnemyEntity(enemyId: string, x: number, y: number, index: number, diffMult = 1, hpMult = 1): CombatEntity {
  const def = enemiesData.enemies.find(e => e.id === enemyId)
  if (!def) throw new Error(`Unknown enemy: ${enemyId}`)
  const isElite = def.tier === 'elite'
  const base = isElite
    ? Math.round(350 * diffMult * hpMult)
    : Math.round(56  * diffMult * hpMult)
  const atkScale = 1 + (diffMult - 1) * 0.65
  return {
    id: `${enemyId}_${index}_${Date.now()}`,
    displayName: def.displayName,
    hp: base,
    maxHp: base,
    atk: isElite ? Math.round(26 * atkScale) : Math.round(9 * atkScale),
    def: isElite ? 8 : 2,
    spd: 0.8,
    x,
    y,
    rarity: isElite ? 'rare' : 'common',
    role: 'enemy',
    element: def.element,
    assetId: enemyId,
    spriteDataUrl: getGeneratedSprite(enemyId),
    alive: true,
    // Wide stagger so a full pack doesn't burst-attack simultaneously; first hit no earlier than 1.5s
    hitstunMs: 1500 + Math.random() * 4000,
    flashMs: 0,
    deathAnimMs: 0,
    basicCdMs: 0,
    skillCdMs: 0,
    ultimateCdMs: 0,
  }
}

function makeBossEntity(bossId: string, diffMult = 1): CombatEntity {
  const def    = bossesData.bosses.find(b => b.id === bossId)
  if (!def) throw new Error(`Unknown boss: ${bossId}`)
  const stats    = BOSS_STAT_CONFIG[bossId] ?? { hp: 9_000, atk: 32, def: 22, isFinal: false }
  const atkScale = 1 + (diffMult - 1) * 0.65
  return {
    id: bossId,
    displayName: def.displayName,
    hp:    Math.round(stats.hp  * diffMult),
    maxHp: Math.round(stats.hp  * diffMult),
    atk:   Math.round(stats.atk * atkScale),
    def:   stats.def,
    spd: 0.5,
    x: BOSS_X,
    y: BOSS_Y_POS,
    rarity: 'legendary',
    role: 'boss',
    element: def.element,
    assetId: bossId,
    spriteDataUrl: getGeneratedSprite(bossId),
    alive: true,
    hitstunMs: 1500,  // boss waits before first attack
    flashMs: 0,
    deathAnimMs: 0,
    basicCdMs: 0,
    skillCdMs: stats.isFinal ? 7_000 : 9_000,
    ultimateCdMs: stats.isFinal ? 16_000 : 20_000,
  }
}

// Loot table per tier level — quantity and rarity scale super-linearly with tier
function buildTierLoot(tierLevel: number, kills: number, bonusItem = false): Array<{ id: string; rarity: Rarity; name: string }> {
  type Item = { id: string; rarity: Rarity; name: string }
  const tables: Record<number, { minKills: number; items: Item[] }> = {
    1: { minKills: 8,  items: [
      { id: 'gear_lucky_frog_coin',     rarity: 'uncommon',  name: 'Lucky Frog Coin'    },
      { id: 'gear_glitter_boots',       rarity: 'uncommon',  name: 'Glitter Boots'      },
    ]},
    2: { minKills: 6,  items: [
      { id: 'gear_crystal_spike',       rarity: 'rare',      name: 'Crystal Spike'      },
      { id: 'gear_storm_band',          rarity: 'rare',      name: 'Storm Band'         },
      { id: 'gear_meteor_lunchbox',     rarity: 'rare',      name: 'Meteor Lunchbox'    },
    ]},
    3: { minKills: 5,  items: [
      { id: 'gear_bubblegum_shield',    rarity: 'rare',      name: 'Bubblegum Shield'   },
      { id: 'gear_tiny_dragon_plush',   rarity: 'rare',      name: 'Tiny Dragon Plush'  },
      { id: 'gear_boss_tooth_necklace', rarity: 'epic',      name: 'Boss Tooth Necklace'},
    ]},
    4: { minKills: 4,  items: [
      { id: 'gear_void_shard',          rarity: 'epic',      name: 'Void Shard'         },
      { id: 'gear_infernal_core',       rarity: 'epic',      name: 'Infernal Core'      },
      { id: 'gear_chaos_rune',          rarity: 'epic',      name: 'Chaos Rune'         },
      { id: 'gear_cursed_party_hat',    rarity: 'epic',      name: 'Cursed Party Hat'   },
    ]},
    5: { minKills: 3,  items: [
      { id: 'gear_void_shard',          rarity: 'epic',      name: 'Void Shard'         },
      { id: 'gear_chaos_rune',          rarity: 'epic',      name: 'Chaos Rune'         },
      { id: 'gear_squeaky_doom_hammer', rarity: 'rare',      name: 'Squeaky Doom Hammer'},
      { id: 'gear_cosmos_fragment',     rarity: 'legendary', name: 'Cosmos Fragment'    },
    ]},
  }
  const entry = tables[tierLevel] ?? tables[1]
  const items = kills >= entry.minKills ? [...entry.items] : []
  if (bonusItem && items.length > 0) {
    // loot_magnet: duplicate one random item from the table as bonus
    items.push(entry.items[Math.floor(Math.random() * entry.items.length)])
  }
  return items
}

const BOOST_EFFECTS: Record<string, (s: RiftRunState) => void> = {
  'boost_revive_token': s => { s.hasReviveToken = true },
  'boost_gold_magnet':  s => { s.goldMult = Math.min(s.goldMult * 1.5, 4) },
  'boost_quick_start':  s => { const card = rollUpgradeCards(1, s.appliedUpgrades)[0]; if (card) applyUpgradeCard(s, card.id) },
  'boost_iron_shield':  s => { s.defMult = Math.min(s.defMult * 1.3, 4) },
  'boost_fury_elixir':  s => { s.atkMult = Math.min(s.atkMult * 1.25, 8) },
}

// Pet fire cooldowns and initial delays (ms)
const PET_CD: Record<string, number> = {
  coin_divebomb: 8000, shield_bubble: 18000, loot_magnet: 0,
  egg_bomb: 10000,     fire_breath: 7000,    phase_strike: 15000,
  golden_sting: 8000,  copy_attack: 5000,
}
// Stagger so pet doesn't fire the moment combat starts
const PET_INITIAL_CD: Record<string, number> = {
  coin_divebomb: 8000, shield_bubble: 12000, loot_magnet: 0,
  egg_bomb: 6000,      fire_breath: 5000,    phase_strike: 10000,
  golden_sting: 7000,  copy_attack: 4000,
}
function getPetEffect(petId: string): string {
  return petsData.pets.find(p => p.id === petId)?.combatEffect ?? ''
}
function getPetInitialCd(petId: string): number {
  const effect = getPetEffect(petId)
  return PET_INITIAL_CD[effect] ?? 8000
}

// Per-boss base stats — mid bosses weaker than finals, scale with zone tier
const BOSS_STAT_CONFIG: Record<string, { hp: number; atk: number; def: number; isFinal: boolean }> = {
  boss_mushroom_matriarch:  { hp:  9_000, atk: 32, def: 22, isFinal: false },
  boss_goblin_minecart_ace: { hp: 10_500, atk: 34, def: 24, isFinal: false },
  boss_pumpkin_gearlord:    { hp: 12_000, atk: 37, def: 26, isFinal: false },
  boss_neon_bone_hydra:     { hp: 13_500, atk: 40, def: 28, isFinal: false },
  boss_king_slime_pop:      { hp: 22_000, atk: 55, def: 35, isFinal: true  },
  boss_tax_collector_mimic: { hp: 24_000, atk: 58, def: 36, isFinal: true  },
  boss_void_arcade_dragon:  { hp: 27_000, atk: 62, def: 38, isFinal: true  },
  boss_moon_vault:          { hp: 30_000, atk: 66, def: 40, isFinal: true  },
}

// Per-boss ability flavour — drives skill/ult text, colours, AoE mult, and special effects
interface BossAbilityDef {
  skillName: string; skillColor: string; skillAtkMult: number
  ultName:   string; ultColor:   string; ultAtkMult:   number; ultFlashColor: string
  ultHeals?: boolean
}
const BOSS_ABILITY_CFG: Record<string, BossAbilityDef> = {
  boss_mushroom_matriarch:  { skillName: '◆ Spore Cloud',    skillColor: '#66ff44', skillAtkMult: 1.6, ultName: '★ MEGA SPORE!',      ultColor: '#ff0066', ultAtkMult: 2.8, ultFlashColor: '#cc00ff' },
  boss_king_slime_pop:      { skillName: '◆ Slime Splash',   skillColor: '#44ffaa', skillAtkMult: 1.7, ultName: '★ ROYAL BOUNCE!',    ultColor: '#ff0066', ultAtkMult: 3.0, ultFlashColor: '#00ff88', ultHeals: true },
  boss_goblin_minecart_ace: { skillName: '◆ Rail Rush',      skillColor: '#cd7f32', skillAtkMult: 1.6, ultName: '★ MINECART SLAM!',   ultColor: '#ff6600', ultAtkMult: 2.9, ultFlashColor: '#ffd700' },
  boss_tax_collector_mimic: { skillName: '◆ Gold Drain',     skillColor: '#ffd700', skillAtkMult: 1.7, ultName: '★ TAX SEASON!',      ultColor: '#ffaa00', ultAtkMult: 3.1, ultFlashColor: '#ffaa00', ultHeals: true },
  boss_pumpkin_gearlord:    { skillName: '◆ Gear Throw',     skillColor: '#ff8800', skillAtkMult: 1.7, ultName: '★ GEAR STORM!',      ultColor: '#ff4400', ultAtkMult: 3.0, ultFlashColor: '#ff6600' },
  boss_void_arcade_dragon:  { skillName: '◆ Glitch Blast',   skillColor: '#00ffff', skillAtkMult: 1.8, ultName: '★ BULLET HELL!',     ultColor: '#ff00ff', ultAtkMult: 3.3, ultFlashColor: '#aa00ff' },
  boss_neon_bone_hydra:     { skillName: '◆ Hydra Strike',   skillColor: '#ff44ff', skillAtkMult: 1.8, ultName: '★ NEON SURGE!',      ultColor: '#ff00ff', ultAtkMult: 3.2, ultFlashColor: '#aa00ff' },
  boss_moon_vault:          { skillName: '◆ Moonbeam',       skillColor: '#aaeeff', skillAtkMult: 1.7, ultName: '★ VAULT LOCK!',      ultColor: '#ffffff', ultAtkMult: 3.1, ultFlashColor: '#0088ff' },
}

// Mount stat bonuses applied once at run start
const MOUNT_BONUSES: Record<string, { atkMult?: number; hpMult?: number; goldMult?: number; critChance?: number }> = {
  mount_iron_tortoise: { hpMult: 0.15 },
  mount_golden_boar:   { goldMult: 0.20 },
  mount_void_serpent:  { atkMult: 0.10, critChance: 0.05 },
  mount_crystal_stag:  { hpMult: 0.10, atkMult: 0.10 },
  mount_rainbow_drake: { hpMult: 0.15, atkMult: 0.15, goldMult: 0.10 },
}

export function createInitialRiftState(
  heroIds: string[],
  options?: {
    difficultyMult?: number
    startBoosts?: string[]
    rewardMult?: number
    tierLevel?: number
    heroGearBonuses?: HeroGearBonuses[]
    heroLevels?: number[]
    runGearBonuses?: RunGearBonuses
    equippedPetId?: string
    equippedMountId?: string
    zoneId?: string
  },
): { state: RiftRunState; timeline: TimelineEvent[] } {
  const squadIds = heroIds.slice(0, 3)

  const heroes: CombatEntity[] = squadIds.map((id, i) =>
    makeHeroEntity(id, i, squadIds.length, options?.heroGearBonuses?.[i], options?.heroLevels?.[i] ?? 1)
  )

  const state: RiftRunState = {
    phase: 'countdown',
    timeMs: 0,
    elapsedMs: 0,
    heroes,
    enemies: [],
    boss: null,
    projectiles: [],
    damageNumbers: [],
    lootDrops: [],
    abilityAnnounces: [],
    impactFlashMs: 0,
    impactFlashColor: '#ffffff',
    waveIndex: 0,
    killCount: 0,
    goldCollected: 0,
    totalDamageDealt: 0,
    totalDamageReceived: 0,
    upgradeChoice: null,
    appliedUpgrades: [],
    bossWarningId: null,
    bossWarningTimeMs: 0,
    postRun: null,
    atkMult: 1,
    defMult: 1,
    spdMult: 1,
    critChance: 0.15,
    critMult: 2,
    goldMult: 1,
    lifeSteal: 0,
    aoeChance: 0,
    difficultyMult: options?.difficultyMult ?? 1,
    reviveUsed: false,
    hasReviveToken: false,
    riftTierLevel: options?.tierLevel ?? 1,
    rewardMult: options?.rewardMult ?? 1,
    bossPhase: 1,
    pendingSpawns: [],
    spawnTimerMs: 0,
    activePetId:   options?.equippedPetId ?? 'pet_coin_bat',
    petCooldownMs: getPetInitialCd(options?.equippedPetId ?? 'pet_coin_bat'),
    petBonusLoot:  false,
    activeMountId: options?.equippedMountId ?? '',
    activeZoneId:  options?.zoneId ?? 'candy_cavern_rift',
  }

  for (const id of (options?.startBoosts ?? [])) {
    BOOST_EFFECTS[id]?.(state)
  }

  // Apply run-level gear bonuses (additive on top of defaults and boosts)
  const rgb = options?.runGearBonuses
  if (rgb) {
    state.critChance  = Math.min(0.80, state.critChance + rgb.critChanceBonus)
    state.critMult   += rgb.critMultBonus
    state.goldMult   += rgb.goldMultBonus
    state.spdMult    += rgb.spdMultBonus
    state.lifeSteal   = Math.min(0.60, state.lifeSteal + rgb.lifeStealBonus)
  }

  // Apply mount bonuses
  const mb = MOUNT_BONUSES[state.activeMountId]
  if (mb) {
    if (mb.atkMult)    state.atkMult     = Math.min(state.atkMult * (1 + mb.atkMult), 8)
    if (mb.goldMult)   state.goldMult   += mb.goldMult
    if (mb.critChance) state.critChance  = Math.min(0.80, state.critChance + mb.critChance)
    if (mb.hpMult) {
      for (const hero of state.heroes) {
        hero.hp     = Math.round(hero.hp * (1 + mb.hpMult))
        hero.maxHp  = hero.hp
      }
    }
  }

  // Loot magnet pet: passive flag so buildTierLoot adds a bonus item
  if (getPetEffect(state.activePetId) === 'loot_magnet') {
    state.petBonusLoot = true
  }

  return { state, timeline: getTimelineForZone(state.activeZoneId) }
}

export type SpawnPattern = 'ring' | 'scatter' | 'burst_top' | 'burst_bottom' | 'burst_sides'

// Trickle-spawn: 4 enemies per 50 ms = 80/sec; 100 enemies fully live in ~1.25s
// Queue pauses if alive count exceeds MAX_ALIVE_ENEMIES (CPU budget).
const SPAWN_BATCH_SIZE   = 4
const SPAWN_INTERVAL_MS  = 50
const MAX_ALIVE_ENEMIES  = 60

export function spawnWave(state: RiftRunState, wave: number, count: number, pattern: SpawnPattern = 'ring'): void {
  const pool    = getEnemyPoolForWaveInZone(wave, state.activeZoneId)
  const diff    = state.difficultyMult ?? 1
  const hpMult  = WAVE_HP_SCALE[Math.max(0, Math.min(wave - 1, WAVE_HP_SCALE.length - 1))]
  const pending: PendingSpawn[] = []

  for (let i = 0; i < count; i++) {
    const enemyId = pool[i % pool.length]
    let ex: number, ey: number

    if (pattern === 'scatter') {
      const angle = Math.random() * Math.PI * 2
      const rFrac = 0.80 + Math.random() * 0.20
      ex = Math.round(CENTER_X + Math.cos(angle) * ENEMY_SPAWN_RADIUS_X * rFrac)
      ey = Math.round(CENTER_Y + Math.sin(angle) * ENEMY_SPAWN_RADIUS_Y * rFrac)
    } else if (pattern === 'burst_top') {
      const spread = (count > 1 ? (i / (count - 1) - 0.5) : 0) * ENEMY_SPAWN_RADIUS_X * 1.8
      ex = Math.round(Math.max(20, Math.min(340, CENTER_X + spread)))
      ey = Math.round(CENTER_Y - ENEMY_SPAWN_RADIUS_Y + Math.random() * 40)
    } else if (pattern === 'burst_bottom') {
      const spread = (count > 1 ? (i / (count - 1) - 0.5) : 0) * ENEMY_SPAWN_RADIUS_X * 1.8
      ex = Math.round(Math.max(20, Math.min(340, CENTER_X + spread)))
      ey = Math.round(CENTER_Y + ENEMY_SPAWN_RADIUS_Y - Math.random() * 40)
    } else if (pattern === 'burst_sides') {
      const side = i % 2 === 0 ? -1 : 1
      ex = Math.round(CENTER_X + side * ENEMY_SPAWN_RADIUS_X + side * (Math.random() * 20))
      ey = Math.round(CENTER_Y + (Math.random() - 0.5) * ENEMY_SPAWN_RADIUS_Y * 1.4)
    } else {
      // ring
      const angleOffset = WAVE_ANGLE_OFFSETS[wave % 6] ?? 0
      const angle = (count > 1 ? (i / count) * Math.PI * 2 : 0) + angleOffset
      ex = Math.round(CENTER_X + Math.cos(angle) * ENEMY_SPAWN_RADIUS_X)
      ey = Math.round(CENTER_Y + Math.sin(angle) * ENEMY_SPAWN_RADIUS_Y)
    }

    pending.push({ enemyId, x: ex, y: ey, diffMult: diff, hpMult })
  }

  // Append to queue (don't reset timer — let existing drip continue)
  state.pendingSpawns.push(...pending)
}

export function spawnBoss(state: RiftRunState, bossId: string): void {
  state.boss = makeBossEntity(bossId, state.difficultyMult ?? 1)
  // Animate remaining enemies out rather than hard-clearing (avoids visual pop/despawn)
  for (const e of state.enemies) {
    if (e.alive) { e.alive = false; e.deathAnimMs = 450 }
  }
  state.pendingSpawns = []
  state.projectiles = []
}

function tickPetEffect(state: RiftRunState, dtMs: number): void {
  const effect = getPetEffect(state.activePetId)
  if (!effect || effect === 'loot_magnet') return   // loot_magnet is passive, handled at init

  state.petCooldownMs -= dtMs
  if (state.petCooldownMs > 0) return
  state.petCooldownMs = PET_CD[effect] ?? 8000

  const aliveEnemies = state.enemies.filter(e => e.alive)
  const aliveBoss    = state.boss?.alive ? [state.boss] : []
  const targets      = [...aliveEnemies, ...aliveBoss]
  const aliveHeroes  = state.heroes.filter(h => h.alive)
  if (aliveHeroes.length === 0) return

  const avgAtk = Math.round(aliveHeroes.reduce((s, h) => s + h.atk, 0) / aliveHeroes.length)

  function petDamage(target: CombatEntity, dmg: number, ignoresDef = false): void {
    const reduced = ignoresDef ? dmg : Math.max(1, dmg - Math.floor(target.def * 0.5))
    target.hp = Math.max(0, target.hp - reduced)
    if (target.hp <= 0) target.alive = false
    state.damageNumbers.push({
      id: ++_dmgId, x: target.x, y: target.y - 20,
      value: reduced, isCrit: false, color: '#ffffff', lifeMs: 700, maxLifeMs: 700,
    })
  }

  function petAnnounce(text: string, color: string): void {
    state.abilityAnnounces.push({
      x: aliveHeroes[0].x, y: aliveHeroes[0].y - 30,
      text, color, lifeMs: 1200, maxLifeMs: 1200,
    })
  }

  const rndTarget = targets.length > 0
    ? targets[Math.floor(Math.random() * targets.length)]
    : null

  switch (effect) {
    case 'coin_divebomb':
      state.goldCollected += 20
      state.damageNumbers.push({
        id: ++_dmgId, x: aliveHeroes[0].x, y: aliveHeroes[0].y - 30,
        value: 20, isCrit: false, color: '#ffd700', label: '💰', lifeMs: 800, maxLifeMs: 800,
      })
      playSound('combat_coin_ping')
      break
    case 'shield_bubble': {
      const weakest = aliveHeroes.reduce((a, b) => a.hp < b.hp ? a : b)
      const heal = 150
      weakest.hp = Math.min(weakest.maxHp, weakest.hp + heal)
      petAnnounce(`🐸 +${heal} SHIELD`, '#44ffaa')
      playSound('combat_shield_boing')
      break
    }
    case 'egg_bomb':
      if (rndTarget) {
        petDamage(rndTarget, 60)
        petAnnounce('🐣 EGG BOMB!', '#ffaa00')
        emitExplosion({ x: rndTarget.x, y: rndTarget.y }, 12, 'fire')
      }
      break
    case 'fire_breath': {
      const fireTargets = targets.slice(0, 3)
      for (const t of fireTargets) petDamage(t, 80)
      if (fireTargets.length > 0) petAnnounce('🐉 FIRE BREATH!', '#ff6600')
      break
    }
    case 'phase_strike':
      if (rndTarget) {
        petDamage(rndTarget, 200, true)
        petAnnounce('👻 PHASE STRIKE!', '#aa44ff')
      }
      break
    case 'golden_sting':
      if (rndTarget) {
        petDamage(rndTarget, 80)
        state.goldCollected += 30
        state.damageNumbers.push({
          id: ++_dmgId, x: rndTarget.x, y: rndTarget.y - 40,
          value: 30, isCrit: false, color: '#ffd700', label: '💰', lifeMs: 800, maxLifeMs: 800,
        })
        petAnnounce('🐝 GOLDEN STING!', '#ffd700')
        playSound('combat_coin_ping')
      }
      break
    case 'copy_attack':
      if (rndTarget) {
        petDamage(rndTarget, avgAtk)
        petAnnounce('🐶 COPY ATK!', '#88ccff')
      }
      break
  }
}

export function tickCombat(state: RiftRunState, dtMs: number): void {
  if (state.phase !== 'combat') return

  // Pet combat effect
  tickPetEffect(state, dtMs)

  // Drain pending spawn queue at a steady drip rate (4 per 50ms = ~80/s).
  // Wave clears when visible enemies hit 0; remaining pending are discarded by the wave director.
  if (state.pendingSpawns.length > 0 && !state.boss?.alive) {
    const currentAlive = state.enemies.reduce((n, e) => n + (e.alive ? 1 : 0), 0)
    if (currentAlive < MAX_ALIVE_ENEMIES) {
      state.spawnTimerMs += dtMs
      if (state.spawnTimerMs >= SPAWN_INTERVAL_MS) {
        state.spawnTimerMs = 0
        const canSpawn = Math.min(SPAWN_BATCH_SIZE, MAX_ALIVE_ENEMIES - currentAlive)
        const batch = state.pendingSpawns.splice(0, canSpawn)
        for (const { enemyId, x, y, diffMult, hpMult } of batch) {
          state.enemies.push(makeEnemyEntity(enemyId, x, y, 0, diffMult, hpMult))
        }
      }
    }
  }

  const aliveHeroes = state.heroes.filter(h => h.alive)
  const aliveEnemies = state.enemies.filter(e => e.alive)
  const bossAlive = state.boss?.alive

  // Tick flash and death animations for everyone
  for (const e of [...state.heroes, ...state.enemies, ...(state.boss ? [state.boss] : [])]) {
    if (e.flashMs > 0) e.flashMs = Math.max(0, e.flashMs - dtMs)
    if (e.deathAnimMs > 0) e.deathAnimMs = Math.max(0, e.deathAnimMs - dtMs)
  }

  // Tick enemy attack cooldowns
  for (const e of [...aliveEnemies, ...(bossAlive ? [state.boss!] : [])]) {
    if (e.hitstunMs > 0) e.hitstunMs = Math.max(0, e.hitstunMs - dtMs)
  }

  // Enemies drift inward toward hero cluster, stopping at engage radius
  for (const enemy of aliveEnemies) {
    const dx = CENTER_X - enemy.x
    const dy = CENTER_Y - enemy.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > ENEMY_ENGAGE_RADIUS) {
      const def = enemiesData.enemies.find(e => e.id === enemy.assetId)
      const speed = (def?.tier === 'elite' ? ELITE_DRIFT_SPEED : ENEMY_DRIFT_SPEED) * dtMs
      enemy.x += (dx / dist) * speed
      enemy.y += (dy / dist) * speed
    }
  }

  // Tick hero ability cooldowns
  for (const h of aliveHeroes) {
    if (h.basicCdMs > 0) h.basicCdMs = Math.max(0, h.basicCdMs - dtMs)
    if (h.skillCdMs > 0) h.skillCdMs = Math.max(0, h.skillCdMs - dtMs)
    if (h.ultimateCdMs > 0) h.ultimateCdMs = Math.max(0, h.ultimateCdMs - dtMs)
  }

  // Heroes fire abilities → create projectiles
  const targets = bossAlive ? [state.boss!] : aliveEnemies
  if (targets.length > 0) {
    for (const hero of aliveHeroes) {
      // Pick closest target (more natural combat feel, avoids long diagonal shots)
      const target = targets.reduce((best, t) => {
        const dx = t.x - hero.x, dy = t.y - hero.y
        const bx = best.x - hero.x, by = best.y - hero.y
        return (dx*dx + dy*dy) < (bx*bx + by*by) ? t : best
      })
      if (!target) continue

      let abilityType: 'basic' | 'skill' | 'ultimate'
      let dmgMult: number
      let travelMs: number
      let aoe: boolean
      let isCrit: boolean

      if (hero.ultimateCdMs <= 0) {
        abilityType = 'ultimate'
        dmgMult = 2.0           // nerfed from 3.0 — still impactful, won't nuke full waves
        travelMs = 650          // slightly slower — easier to read, more telegraphed
        aoe = true              // always AOE, but splash % reduced in applyProjectileHit
        isCrit = true           // ultimates always display as crits
        hero.ultimateCdMs = ULTIMATE_CD / state.spdMult
      } else if (hero.skillCdMs <= 0) {
        abilityType = 'skill'
        dmgMult = 1.6           // nerfed from 1.8
        travelMs = 430
        aoe = Math.random() < state.aoeChance
        isCrit = Math.random() < (state.critChance + 0.1)  // slightly higher crit on skill
        hero.skillCdMs = SKILL_CD / state.spdMult
      } else if (hero.basicCdMs <= 0) {
        abilityType = 'basic'
        dmgMult = 1
        travelMs = 260
        aoe = Math.random() < state.aoeChance
        isCrit = Math.random() < state.critChance
        hero.basicCdMs = BASIC_CD / state.spdMult
      } else {
        continue  // nothing ready
      }

      // Ultimate doesn't stack critMult — the 5× multiplier is the power
      const critMult = abilityType === 'ultimate' ? 1 : (isCrit ? state.critMult : 1)
      const raw = hero.atk * state.atkMult * dmgMult * critMult
      const dmg = Math.max(1, Math.round(raw - target.def * state.defMult))

      state.projectiles.push({
        id: _projId++,
        heroId: hero.id,
        targetId: target.id,
        fromX: hero.x,
        fromY: hero.y - 10,
        toX: target.x,
        toY: target.y,
        progress: 0,
        totalMs: travelMs,
        elapsedMs: 0,
        dmg,
        isCrit,
        element: hero.element,
        abilityType,
        aoe,
      })

      if (abilityType === 'skill' || abilityType === 'ultimate') {
        state.abilityAnnounces.push({
          x: hero.x,
          y: hero.y - 36,
          text: abilityType === 'ultimate' ? '★ ULTIMATE' : '⚡ SKILL',
          color: abilityType === 'ultimate' ? '#ffd700' : '#cc44ff',
          lifeMs: 850,
          maxLifeMs: 850,
        })
      }
    }
  }

  // Advance projectiles and apply damage on arrival
  const arrived: Projectile[] = []
  for (const p of state.projectiles) {
    p.elapsedMs += dtMs
    p.progress = Math.min(1, p.elapsedMs / p.totalMs)
    if (p.progress >= 1) arrived.push(p)
  }
  state.projectiles = state.projectiles.filter(p => p.progress < 1)

  for (const p of arrived) {
    const allAlive = state.boss?.alive
      ? [state.boss!]
      : state.enemies.filter(e => e.alive)

    if (p.aoe) {
      // AOE always lands on all alive (even if original target died)
      applyProjectileHit(state, p, allAlive, true)
    } else {
      const mainTarget = allAlive.find(t => t.id === p.targetId)
      if (!mainTarget) continue  // target died mid-flight, projectile fizzles
      applyProjectileHit(state, p, [mainTarget], false)
    }
  }

  // Enemies attack heroes
  for (const enemy of aliveEnemies) {
    if (!enemy.alive || enemy.hitstunMs > 0) continue
    const heroTarget = aliveHeroes[Math.floor(Math.random() * aliveHeroes.length)]
    if (!heroTarget) continue

    const dmg = Math.max(1, Math.round(enemy.atk - heroTarget.def * state.defMult * 0.5))
    heroTarget.hp -= dmg
    heroTarget.flashMs = 180
    state.totalDamageReceived += dmg

    state.damageNumbers.push({
      id: _dmgId++,
      x: heroTarget.x + (Math.random() * 24 - 12),
      y: heroTarget.y - 14,
      value: dmg,
      isCrit: false,
      color: '#ff4444',
      lifeMs: 600,
      maxLifeMs: 600,
    })

    if (heroTarget.hp <= 0) {
      heroTarget.alive = false
      heroTarget.deathAnimMs = 500
    }

    enemy.hitstunMs = enemy.rarity === 'rare' ? ELITE_ATK_CD : ENEMY_ATK_CD
  }

  // Boss attacks heroes — basic, skill, and ultimate abilities
  if (bossAlive && state.boss!.alive) {
    const boss = state.boss!
    boss.skillCdMs    = Math.max(0, boss.skillCdMs    - dtMs)
    boss.ultimateCdMs = Math.max(0, boss.ultimateCdMs - dtMs)

    if (boss.hitstunMs <= 0 && aliveHeroes.length > 0) {
      const cfg         = BOSS_ABILITY_CFG[boss.id] ?? BOSS_ABILITY_CFG['boss_mushroom_matriarch']
      const enrageScale = boss.enraged ? 0.65 : 1

      if (boss.ultimateCdMs <= 0) {
        // ULTIMATE — heavy AoE on all heroes
        for (const hero of aliveHeroes) {
          const dmg = Math.max(1, Math.round(boss.atk * cfg.ultAtkMult - hero.def * state.defMult * 0.2))
          hero.hp -= dmg
          hero.flashMs = 400
          state.totalDamageReceived += dmg
          if (hero.hp <= 0) { hero.alive = false; hero.deathAnimMs = 500 }
          state.damageNumbers.push({
            id: _dmgId++, x: hero.x + (Math.random() * 24 - 12), y: hero.y - 20,
            value: dmg, isCrit: true, color: cfg.ultColor, lifeMs: 900, maxLifeMs: 900, label: '★',
          })
        }
        if (cfg.ultHeals) {
          boss.hp = Math.min(boss.maxHp, boss.hp + Math.round(boss.maxHp * 0.05))
        }
        boss.ultimateCdMs = Math.round(BOSS_ULT_CD * enrageScale)
        boss.hitstunMs    = Math.round(BOSS_ATK_CD * (boss.enraged ? 0.5 : 1.5))
        state.impactFlashMs    = 350
        state.impactFlashColor = cfg.ultFlashColor
        state.abilityAnnounces.push({
          x: boss.x, y: boss.y - 30,
          text: cfg.ultName, color: cfg.ultColor, lifeMs: 1800, maxLifeMs: 1800,
        })
        triggerShake('bossDeath')
        triggerHitstop(180)
        playSound('combat_boss_death_boom')
      } else if (boss.skillCdMs <= 0) {
        // SKILL — medium AoE on all heroes
        for (const hero of aliveHeroes) {
          const dmg = Math.max(1, Math.round(boss.atk * cfg.skillAtkMult - hero.def * state.defMult * 0.35))
          hero.hp -= dmg
          hero.flashMs = 250
          state.totalDamageReceived += dmg
          if (hero.hp <= 0) { hero.alive = false; hero.deathAnimMs = 500 }
          state.damageNumbers.push({
            id: _dmgId++, x: hero.x + (Math.random() * 24 - 12), y: hero.y - 16,
            value: dmg, isCrit: false, color: cfg.skillColor, lifeMs: 700, maxLifeMs: 700,
          })
        }
        boss.skillCdMs = Math.round(BOSS_SKILL_CD * enrageScale)
        boss.hitstunMs = boss.enraged ? Math.round(BOSS_ATK_CD * 0.55) : BOSS_ATK_CD
        state.abilityAnnounces.push({
          x: boss.x, y: boss.y - 20,
          text: cfg.skillName, color: cfg.skillColor, lifeMs: 1200, maxLifeMs: 1200,
        })
        triggerShake('heavySkill')
        playSound('combat_poison_bubble')
      } else {
        // BASIC — single random hero
        const heroTarget = aliveHeroes[Math.floor(Math.random() * aliveHeroes.length)]
        const dmg = Math.max(1, Math.round(boss.atk - heroTarget.def * state.defMult * 0.5))
        heroTarget.hp -= dmg
        heroTarget.flashMs = 180
        state.totalDamageReceived += dmg
        if (heroTarget.hp <= 0) { heroTarget.alive = false; heroTarget.deathAnimMs = 500 }
        state.damageNumbers.push({
          id: _dmgId++, x: heroTarget.x + (Math.random() * 24 - 12), y: heroTarget.y - 14,
          value: dmg, isCrit: false, color: '#ff4444', lifeMs: 600, maxLifeMs: 600,
        })
        boss.hitstunMs = boss.enraged ? Math.round(BOSS_ATK_CD * 0.6) : BOSS_ATK_CD
      }
    }
  }

  // Wipe detection — all heroes died this tick
  if (state.heroes.every(h => !h.alive)) {
    if (state.hasReviveToken && !state.reviveUsed) {
      state.heroes.forEach(h => { h.alive = true; h.hp = Math.round(h.maxHp * 0.5) })
      state.enemies = state.enemies.slice(0, 2)
      state.projectiles = []
      state.hasReviveToken = false
      state.reviveUsed = true
      return
    }
    buildPostRunReward(state, true)
    return
  }

  // Age announces and impact flash
  if (state.impactFlashMs > 0) state.impactFlashMs = Math.max(0, state.impactFlashMs - dtMs)
  state.abilityAnnounces = state.abilityAnnounces.filter(a => {
    a.lifeMs -= dtMs
    return a.lifeMs > 0
  })

  // Loot magnet
  for (const loot of state.lootDrops) {
    if (loot.collected) continue
    const dx = loot.targetX - loot.x
    const dy = loot.targetY - loot.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 5) {
      loot.collected = true
      state.goldCollected += loot.value
    } else {
      const spd = Math.min(dist, 4)
      loot.x += (dx / dist) * spd
      loot.y += (dy / dist) * spd
    }
    loot.lifeMs -= dtMs
  }
  state.lootDrops = state.lootDrops.filter(l => l.lifeMs > 0)

  // Age damage numbers
  state.damageNumbers = state.damageNumbers.filter(d => {
    d.lifeMs -= dtMs
    return d.lifeMs > 0
  })

  // Prune dead enemies whose death animation has finished — keeps array bounded
  state.enemies = state.enemies.filter(e => e.alive || e.deathAnimMs > 0)
}

function applyProjectileHit(
  state: RiftRunState,
  p: Projectile,
  hitList: CombatEntity[],
  isAoe: boolean,
): void {
  const firer = state.heroes.find(h => h.id === p.heroId)
  const [mainTarget] = hitList

  for (const t of hitList) {
    // AOE splash is weaker — ultimates feel powerful on primary without clearing full waves
    const finalDmg = (isAoe && t !== mainTarget) ? Math.max(1, Math.round(p.dmg * 0.22)) : p.dmg
    t.hp -= finalDmg
    t.flashMs = p.abilityType === 'ultimate' ? 220
      : p.abilityType === 'skill' ? 150
      : 80
    state.totalDamageDealt += finalDmg

    if (firer && state.lifeSteal > 0) {
      firer.hp = Math.min(firer.maxHp, firer.hp + finalDmg * state.lifeSteal)
    }

    // Damage number with label prefix
    const isUlt = p.abilityType === 'ultimate'
    const isCritDisplay = p.isCrit || isUlt
    state.damageNumbers.push({
      id: _dmgId++,
      x: t.x + (Math.random() * 28 - 14),
      y: t.y - 16,
      value: finalDmg,
      isCrit: isCritDisplay,
      color: isUlt ? '#ffee44' : p.isCrit ? '#ffd700' : '#ffffff',
      lifeMs: isUlt ? 1200 : p.isCrit ? 1000 : 700,
      maxLifeMs: isUlt ? 1200 : p.isCrit ? 1000 : 700,
      label: isUlt ? '★' : p.isCrit ? '✦' : undefined,
    })

    // VFX on arrival
    emitHitSpark({ x: t.x, y: t.y }, p.element)

    if (p.abilityType === 'skill') {
      emitExplosion({ x: t.x, y: t.y }, 14, p.element)
      if (t === mainTarget) {
        playSound('combat_spell_sparkle')
        triggerShake('smallHit')
        state.impactFlashMs = 60
        state.impactFlashColor = '#ffffff'
      }
    } else if (p.abilityType === 'ultimate') {
      emitExplosion({ x: t.x, y: t.y }, 30, p.element)
      emitCritPop({ x: t.x, y: t.y })
      if (t === mainTarget) {
        playSound('combat_fire_burst')
        haptic('medium')
        emitGoldBeam({ x: t.x, y: t.y })
        triggerShake('heavySkill')
        triggerHitstop(150)
        state.impactFlashMs = 130
        state.impactFlashColor = '#ffffaa'
      }
    } else if (p.isCrit) {
      playSound('combat_crit_snap')
      haptic('light')
      emitCritPop({ x: t.x, y: t.y })
      triggerHitstop(65)
    } else {
      playSound('combat_sword_tick')
    }

    // Boss phase 2 — enrage at 50% HP
    if (t.role === 'boss' && t.alive && !t.enrageTriggered && t.hp <= t.maxHp * 0.5) {
      t.enrageTriggered = true
      t.enraged = true
      t.flashMs = 800
      t.hitstunMs = 0
      state.bossPhase = 2
      playSound('combat_boss_death_boom')
      haptic('heavy')
      triggerShake('bossDeath')
      triggerHitstop(200)
      emitExplosion({ x: t.x, y: t.y }, 30, t.element)
      state.impactFlashMs = 180
      state.impactFlashColor = '#ff2200'
      // Spawn 2 reinforcement minions
      for (let i = 0; i < 2; i++) {
        const pool = enemiesData.enemies.filter(e => e.tier === 'elite' || e.tier === 'normal')
        const def = pool[Math.floor(Math.random() * pool.length)]
        if (def) {
          const minion: CombatEntity = {
            id: `enrage_minion_${i}_${Date.now()}`,
            displayName: def.displayName,
            hp: Math.round(800 * (state.difficultyMult ?? 1)),
            maxHp: Math.round(800 * (state.difficultyMult ?? 1)),
            atk: Math.round(40 * (state.difficultyMult ?? 1)),
            def: 5,
            spd: 120,
            x: t.x + (i === 0 ? -80 : 80),
            y: t.y + 40,
            rarity: 'uncommon',
            role: 'enemy',
            element: t.element,
            assetId: def.id,
            spriteDataUrl: null,
            alive: true,
            hitstunMs: 600,
            flashMs: 0,
            deathAnimMs: 0,
            basicCdMs: 0,
            skillCdMs: 0,
            ultimateCdMs: 0,
          }
          state.enemies.push(minion)
        }
      }
    }

    if (t.hp <= 0 && t.alive) {
      if (t.role === 'boss') killBoss(state)
      else killEnemy(state, t)
    }
  }
}

function killEnemy(state: RiftRunState, enemy: CombatEntity): void {
  enemy.alive = false
  enemy.deathAnimMs = 450
  state.killCount++
  const goldAmt = Math.round((20 + Math.random() * 15) * state.goldMult)
  spawnLoot(state, enemy.x, enemy.y, 'coin', goldAmt)
  playSound('combat_coin_ping')
  emitExplosion({ x: enemy.x, y: enemy.y }, 20, enemy.element)
}

function killBoss(state: RiftRunState): void {
  if (!state.boss) return
  state.boss.alive = false
  state.boss.deathAnimMs = 900
  state.killCount++
  playSound('combat_boss_death_boom')
  haptic('double')
  triggerShake('bossDeath')
  triggerHitstop(380)
  emitGoldBeam({ x: state.boss.x, y: state.boss.y })
  const goldAmt = Math.round(500 * state.goldMult)
  for (let i = 0; i < 8; i++) {
    spawnLoot(state, state.boss.x + (Math.random() * 60 - 30), state.boss.y + Math.random() * 40, 'gem', 0)
  }
  spawnLoot(state, state.boss.x, state.boss.y, 'coin', goldAmt)
  emitCoinBurst({ x: state.boss.x, y: state.boss.y }, 20)
}

function spawnLoot(state: RiftRunState, x: number, y: number, type: 'coin' | 'gem', value: number): void {
  const heroTarget = state.heroes.find(h => h.alive)
  state.lootDrops.push({
    id: _lootId++,
    x,
    y,
    targetX: heroTarget?.x ?? CENTER_X,
    targetY: heroTarget?.y ?? CENTER_Y,
    type,
    rarity: 'common',
    value: value > 0 ? value : (type === 'gem' ? 20 : 0),
    collected: false,
    lifeMs: 3500,
  })
}

export function buildPostRunReward(state: RiftRunState, wasWipe = false): void {
  const rm = state.rewardMult
  state.postRun = {
    goldEarned: Math.round(state.goldCollected * rm),
    gemsEarned: Math.round(Math.floor(state.killCount / 3) * rm),
    xpEarned: (state.totalDamageDealt / 10) * rm,
    lootItems: buildTierLoot(state.riftTierLevel, state.killCount, state.petBonusLoot),
    heroesLeveled: [],
    newRecords: state.killCount >= 20 ? ['Kill Record'] : [],
    wasWipe,
    elapsedMs: state.elapsedMs,
    tierLevel: state.riftTierLevel,
  }
  state.phase = 'post_run'
}

export function reviveHeroes(state: RiftRunState): void {
  state.heroes.forEach(h => { h.alive = true; h.hp = Math.round(h.maxHp * 0.5) })
  state.enemies = state.enemies.slice(0, 2)
  state.projectiles = []
  state.reviveUsed = true
  state.postRun = null
  state.phase = 'combat'
}

export function triggerUpgradeChoice(state: RiftRunState): void {
  const cards = rollUpgradeCards(3, state.appliedUpgrades)
  state.upgradeChoice = { cards, pickedId: null }
  state.phase = 'upgrade_choice'
}

export function applyUpgradeCard(state: RiftRunState, cardId: string): void {
  const card = UPGRADE_CARDS.find(c => c.id === cardId)
  if (!card) return
  card.apply(state)
  state.appliedUpgrades.push(cardId)
  state.upgradeChoice = null
  state.phase = 'combat'
}
