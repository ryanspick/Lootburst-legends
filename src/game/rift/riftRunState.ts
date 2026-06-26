import type { RiftRunState, CombatEntity, Projectile, TimelineEvent } from './riftTypes'
import type { Rarity } from '@/constants/palette'
import type { HeroGearBonuses, RunGearBonuses } from '@/game/gear/gearStats'
import heroesData from '@/data/art/heroes.visual.json'
import enemiesData from '@/data/art/enemies.visual.json'
import bossesData from '@/data/art/bosses.visual.json'
import {
  getHeroSlot, CENTER_X, CENTER_Y, BOSS_X, BOSS_Y_POS,
  ENEMY_SPAWN_RADIUS_X, ENEMY_SPAWN_RADIUS_Y, WAVE_ANGLE_OFFSETS,
  ENEMY_DRIFT_SPEED, ELITE_DRIFT_SPEED, ENEMY_ENGAGE_RADIUS,
} from './arenaConstants'
import { getGeneratedSprite } from '@/art/generated'
import { cloneTimeline, getEnemyPoolForWave } from './waveDirector'
import { rollUpgradeCards, UPGRADE_CARDS } from './upgradeCards'
import { triggerHitstop } from '@/animation/hitstop'
import { triggerShake } from '@/animation/screenShake'
import { emitHitSpark, emitCritPop, emitCoinBurst, emitGoldBeam, emitExplosion } from '@/vfx/emitters'

let _dmgId = 0
let _lootId = 0
let _projId = 0

// Attack timing constants (milliseconds)
const BASIC_CD      = 1100   // slightly faster basics = more responsive feel
const SKILL_CD      = 4500
const ULTIMATE_CD   = 11000
const ENEMY_ATK_CD  = 2200   // normal enemies — slow hits so packs don't burst-kill
const ELITE_ATK_CD  = 3200   // elites hit slow but hard
const BOSS_ATK_CD   = 1800   // bosses attack frequently but for moderate damage

// Stagger per hero slot so they don't all fire simultaneously
const BASIC_STAGGER = 400
const SKILL_STAGGER = 2000
const ULT_STAGGER = 3000

function makeHeroEntity(
  heroId: string,
  slotIndex: number,
  totalHeroes: number,
  gear: HeroGearBonuses = { atk: 0, hp: 0, def: 0 },
): CombatEntity {
  const def = heroesData.heroes.find(h => h.id === heroId)
  if (!def) throw new Error(`Unknown hero: ${heroId}`)
  const idx = heroesData.heroes.indexOf(def)
  const pos = getHeroSlot(slotIndex, totalHeroes)
  const baseHp  = 1000 + idx * 80   // generous HP — early runs should feel winnable
  const baseAtk = 105  + idx * 15   // strong attack = kills feel satisfying
  const baseDef = 32
  return {
    id: heroId,
    displayName: def.displayName,
    hp: baseHp + gear.hp,
    maxHp: baseHp + gear.hp,
    atk: baseAtk + gear.atk,
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

function makeEnemyEntity(enemyId: string, x: number, y: number, index: number, diffMult = 1): CombatEntity {
  const def = enemiesData.enemies.find(e => e.id === enemyId)
  if (!def) throw new Error(`Unknown enemy: ${enemyId}`)
  const isElite = def.tier === 'elite'
  const base = isElite ? Math.round(1400 * diffMult) : Math.round(280 * diffMult)
  const atkScale = 1 + (diffMult - 1) * 0.65
  return {
    id: `${enemyId}_${index}_${Date.now()}`,
    displayName: def.displayName,
    hp: base,
    maxHp: base,
    atk: isElite ? Math.round(36 * atkScale) : Math.round(10 * atkScale),
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
    // Wide stagger so a full pack doesn't burst-attack simultaneously
    hitstunMs: 800 + Math.random() * 2800,
    flashMs: 0,
    deathAnimMs: 0,
    basicCdMs: 0,
    skillCdMs: 0,
    ultimateCdMs: 0,
  }
}

function makeBossEntity(bossId: string, diffMult = 1): CombatEntity {
  const def = bossesData.bosses.find(b => b.id === bossId)
  if (!def) throw new Error(`Unknown boss: ${bossId}`)
  const isFinal = bossId === 'boss_king_slime_pop'
  const atkScale = 1 + (diffMult - 1) * 0.65
  return {
    id: bossId,
    displayName: def.displayName,
    // Final boss must be significantly harder than mid-boss
    hp: isFinal ? Math.round(22000 * diffMult) : Math.round(9000 * diffMult),
    maxHp: isFinal ? Math.round(22000 * diffMult) : Math.round(9000 * diffMult),
    atk: isFinal ? Math.round(55 * atkScale) : Math.round(32 * atkScale),
    def: isFinal ? 35 : 22,
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
    skillCdMs: 0,
    ultimateCdMs: 0,
  }
}

// Loot table per tier level — quantity and rarity scale super-linearly with tier
function buildTierLoot(tierLevel: number, kills: number): Array<{ id: string; rarity: Rarity; name: string }> {
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
  return kills >= entry.minKills ? entry.items : []
}

const BOOST_EFFECTS: Record<string, (s: RiftRunState) => void> = {
  'boost_revive_token': s => { s.hasReviveToken = true },
  'boost_gold_magnet':  s => { s.goldMult = Math.min(s.goldMult * 1.5, 4) },
  'boost_quick_start':  s => { const card = rollUpgradeCards(1, s.appliedUpgrades)[0]; if (card) applyUpgradeCard(s, card.id) },
  'boost_iron_shield':  s => { s.defMult = Math.min(s.defMult * 1.3, 4) },
  'boost_fury_elixir':  s => { s.atkMult = Math.min(s.atkMult * 1.25, 8) },
}

export function createInitialRiftState(
  heroIds: string[],
  options?: {
    difficultyMult?: number
    startBoosts?: string[]
    rewardMult?: number
    tierLevel?: number
    heroGearBonuses?: HeroGearBonuses[]
    runGearBonuses?: RunGearBonuses
  },
): { state: RiftRunState; timeline: TimelineEvent[] } {
  const squadIds = heroIds.slice(0, 3)

  const heroes: CombatEntity[] = squadIds.map((id, i) =>
    makeHeroEntity(id, i, squadIds.length, options?.heroGearBonuses?.[i])
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

  return { state, timeline: cloneTimeline() }
}

export type SpawnPattern = 'ring' | 'scatter' | 'burst_top' | 'burst_bottom' | 'burst_sides'

export function spawnWave(state: RiftRunState, wave: number, count: number, pattern: SpawnPattern = 'ring'): void {
  const pool = getEnemyPoolForWave(wave)

  for (let i = 0; i < count; i++) {
    const id = pool[i % pool.length]
    let ex: number, ey: number

    if (pattern === 'scatter') {
      // Random positions near the screen edge (outer 20% of spawn ring)
      const angle = Math.random() * Math.PI * 2
      const rFrac = 0.80 + Math.random() * 0.20  // 80-100% of spawn radius (near edge)
      ex = Math.round(CENTER_X + Math.cos(angle) * ENEMY_SPAWN_RADIUS_X * rFrac)
      ey = Math.round(CENTER_Y + Math.sin(angle) * ENEMY_SPAWN_RADIUS_Y * rFrac)
    } else if (pattern === 'burst_top') {
      // Tight cluster sweeping across the top edge
      const spread = (count > 1 ? (i / (count - 1) - 0.5) : 0) * ENEMY_SPAWN_RADIUS_X * 1.8
      ex = Math.round(Math.max(20, Math.min(340, CENTER_X + spread)))
      ey = Math.round(CENTER_Y - ENEMY_SPAWN_RADIUS_Y + Math.random() * 40)
    } else if (pattern === 'burst_bottom') {
      const spread = (count > 1 ? (i / (count - 1) - 0.5) : 0) * ENEMY_SPAWN_RADIUS_X * 1.8
      ex = Math.round(Math.max(20, Math.min(340, CENTER_X + spread)))
      ey = Math.round(CENTER_Y + ENEMY_SPAWN_RADIUS_Y - Math.random() * 40)
    } else if (pattern === 'burst_sides') {
      // Alternating left/right walls, staggered vertically
      const side = i % 2 === 0 ? -1 : 1
      ex = Math.round(CENTER_X + side * ENEMY_SPAWN_RADIUS_X + side * (Math.random() * 20))
      ey = Math.round(CENTER_Y + (Math.random() - 0.5) * ENEMY_SPAWN_RADIUS_Y * 1.4)
    } else {
      // ring (default) — evenly spaced on ellipse with wave angle offset
      const angleOffset = WAVE_ANGLE_OFFSETS[wave % 6] ?? 0
      const angle = (count > 1 ? (i / count) * Math.PI * 2 : 0) + angleOffset
      ex = Math.round(CENTER_X + Math.cos(angle) * ENEMY_SPAWN_RADIUS_X)
      ey = Math.round(CENTER_Y + Math.sin(angle) * ENEMY_SPAWN_RADIUS_Y)
    }

    state.enemies.push(makeEnemyEntity(id, ex, ey, i, state.difficultyMult ?? 1))
  }
}

export function spawnBoss(state: RiftRunState, bossId: string): void {
  state.boss = makeBossEntity(bossId, state.difficultyMult ?? 1)
  state.enemies = []
  state.projectiles = []  // clear in-flight projectiles on boss spawn
}

export function tickCombat(state: RiftRunState, dtMs: number): void {
  if (state.phase !== 'combat') return

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
  for (const enemy of [...aliveEnemies, ...(bossAlive ? [state.boss!] : [])]) {
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

    enemy.hitstunMs = enemy.role === 'boss' ? BOSS_ATK_CD
      : enemy.rarity === 'rare' ? ELITE_ATK_CD
      : ENEMY_ATK_CD
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
      state.goldCollected += loot.type === 'coin' ? 5 : loot.type === 'gem' ? 20 : 0
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
        triggerShake('smallHit')
        state.impactFlashMs = 60
        state.impactFlashColor = '#ffffff'
      }
    } else if (p.abilityType === 'ultimate') {
      emitExplosion({ x: t.x, y: t.y }, 30, p.element)
      emitCritPop({ x: t.x, y: t.y })
      if (t === mainTarget) {
        emitGoldBeam({ x: t.x, y: t.y })
        triggerShake('heavySkill')
        triggerHitstop(150)
        state.impactFlashMs = 130
        state.impactFlashColor = '#ffffaa'
      }
    } else if (p.isCrit) {
      emitCritPop({ x: t.x, y: t.y })
      triggerHitstop(65)
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
  const goldAmt = Math.round((10 + Math.random() * 10) * state.goldMult)
  spawnLoot(state, enemy.x, enemy.y, 'coin', goldAmt)
  emitExplosion({ x: enemy.x, y: enemy.y }, 20, enemy.element)
}

function killBoss(state: RiftRunState): void {
  if (!state.boss) return
  state.boss.alive = false
  state.boss.deathAnimMs = 900
  state.killCount++
  triggerShake('bossDeath')
  triggerHitstop(380)
  emitGoldBeam({ x: state.boss.x, y: state.boss.y })
  const goldAmt = Math.round(200 * state.goldMult)
  for (let i = 0; i < 8; i++) {
    spawnLoot(state, state.boss.x + (Math.random() * 60 - 30), state.boss.y + Math.random() * 40, 'gem', 0)
  }
  spawnLoot(state, state.boss.x, state.boss.y, 'coin', goldAmt)
  emitCoinBurst({ x: state.boss.x, y: state.boss.y }, 20)
}

function spawnLoot(state: RiftRunState, x: number, y: number, type: 'coin' | 'gem', _value: number): void {
  const heroTarget = state.heroes.find(h => h.alive)
  state.lootDrops.push({
    id: _lootId++,
    x,
    y,
    targetX: heroTarget?.x ?? CENTER_X,
    targetY: heroTarget?.y ?? CENTER_Y,
    type,
    rarity: 'common',
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
    lootItems: buildTierLoot(state.riftTierLevel, state.killCount),
    heroesLeveled: state.heroes.filter(h => h.alive).map(h => h.displayName),
    newRecords: state.killCount >= 20 ? ['Kill Record'] : [],
    wasWipe,
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
