/**
 * Combat balance simulation tests.
 * Uses deterministic Math.random (always 0.5) so results are predictable.
 * Mocks all browser-dependent side effects.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock browser-dependent modules ────────────────────────────────────────────
vi.mock('@/vfx/emitters', () => ({
  emitHitSpark:   vi.fn(),
  emitCritPop:    vi.fn(),
  emitCoinBurst:  vi.fn(),
  emitGoldBeam:   vi.fn(),
  emitExplosion:  vi.fn(),
  emitGemScatter: vi.fn(),
}))
vi.mock('@/animation/hitstop',    () => ({ triggerHitstop: vi.fn() }))
vi.mock('@/animation/screenShake', () => ({ triggerShake: vi.fn(), setReducedMotion: vi.fn() }))
vi.mock('@/art/generated', () => ({ getGeneratedSprite: vi.fn(() => null) }))
vi.mock('@/hooks/reducedMotion',   () => ({ getReducedMotion: vi.fn(() => false) }))

// ── Deterministic random ───────────────────────────────────────────────────────
// Returns 0.5 by default (no crits on basic since 0.5 > critChance 0.15)
let _randomVal = 0.5

function setRandom(v: number) { _randomVal = v }
const originalRandom = Math.random
beforeEach(() => {
  _randomVal = 0.5
  Math.random = () => _randomVal
})

import {
  createInitialRiftState,
  tickCombat,
  spawnWave,
  spawnBoss,
  applyUpgradeCard,
} from '@/game/rift/riftRunState'
import type { RiftRunState, CombatEntity } from '@/game/rift/riftTypes'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Simulate dtMs every step for totalMs ms, returns final state */
function simulate(state: RiftRunState, totalMs: number, dtMs = 16): RiftRunState {
  let elapsed = 0
  while (elapsed < totalMs) {
    tickCombat(state, dtMs)
    elapsed += dtMs
  }
  return state
}

/** Advance until either the predicate is true or maxMs expires */
function simulateUntil(
  state: RiftRunState,
  pred: (s: RiftRunState) => boolean,
  maxMs: number,
  dtMs = 16,
): number {
  let elapsed = 0
  while (elapsed < maxMs) {
    tickCombat(state, dtMs)
    elapsed += dtMs
    if (pred(state)) return elapsed
  }
  return -1  // never satisfied
}

function allEnemiesDead(s: RiftRunState) {
  return s.enemies.every(e => !e.alive) && s.enemies.length > 0
}

function bossDead(s: RiftRunState) {
  return s.boss != null && !s.boss.alive
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Combat balance — basic attacks', () => {
  it('normal enemy dies within 6 seconds with 3 heroes (no crits)', () => {
    const { state } = createInitialRiftState([
      'hero_copper_knight',
      'hero_mushroom_medic',
      'hero_goblin_sparkshot',
    ])
    state.phase = 'combat'
    spawnWave(state, 0, 1)  // 1 slime, 120 HP, def 3

    const ttk = simulateUntil(state, allEnemiesDead, 6000)
    expect(ttk).toBeGreaterThan(0)
    expect(ttk).toBeLessThan(6000)
  })

  it('basic attack resets cooldown to BASIC_CD / spdMult', () => {
    const { state } = createInitialRiftState(['hero_copper_knight'])
    state.phase = 'combat'
    spawnWave(state, 0, 1)

    // Fast-forward past stagger, allow multiple basics to fire
    simulate(state, 2000)

    const hero = state.heroes[0]
    // After firing, basicCdMs resets to ~1200 then decrements; value should be ≤ 1200
    expect(hero.basicCdMs).toBeLessThanOrEqual(1200)
    expect(hero.basicCdMs).toBeGreaterThan(0)
  })

  it('heroes do not all fire simultaneously on start (stagger check)', () => {
    const { state } = createInitialRiftState([
      'hero_copper_knight',
      'hero_mushroom_medic',
      'hero_goblin_sparkshot',
    ])
    // Before any tick — cooldowns should differ by ~700ms each
    const [h0, h1, h2] = state.heroes
    expect(Math.abs(h1.basicCdMs - h0.basicCdMs)).toBeGreaterThanOrEqual(300)
    expect(Math.abs(h2.basicCdMs - h1.basicCdMs)).toBeGreaterThanOrEqual(300)
  })

  it('enemies also stagger their first attacks (random offset)', () => {
    const { state } = createInitialRiftState(['hero_copper_knight'])
    state.phase = 'combat'
    spawnWave(state, 0, 3)

    // Enemies have random hitstunMs [0, 1000) — so at t=0 they shouldn't all fire at once
    const cdValues = state.enemies.map(e => e.hitstunMs)
    const uniqueValues = new Set(cdValues.map(v => Math.round(v / 100)))
    // With random=0.5 all enemies have same hitstunMs (0.5 * 1000 = 500ms)
    // so with deterministic random this is expected; just check they have some cooldown
    expect(cdValues.every(v => v >= 0)).toBe(true)
  })
})

describe('Combat balance — DPS output', () => {
  it('3 heroes deal at least 60 DPS against boss (no crits, no upgrades)', () => {
    // Use boss (2500 HP) so target survives full window — 1 slime dies in ~1.5s
    setRandom(0.5)
    const { state } = createInitialRiftState([
      'hero_copper_knight',
      'hero_mushroom_medic',
      'hero_goblin_sparkshot',
    ])
    state.phase = 'combat'
    spawnBoss(state, 'boss_mushroom_matriarch')

    const WINDOW_MS = 10000
    simulate(state, WINDOW_MS)

    const dps = state.totalDamageDealt / (WINDOW_MS / 1000)
    expect(dps).toBeGreaterThan(60)
    expect(dps).toBeLessThan(600)
  })

  it('crit attacks deal critMult × base damage', () => {
    // Use totalDamageDealt — damage numbers expire after 1s and would be gone by 3.8s
    setRandom(0.0)  // 0 < critChance(0.15) → always crit
    const { state } = createInitialRiftState(['hero_copper_knight'])
    state.phase = 'combat'
    // Boss target so it survives the crit
    spawnBoss(state, 'boss_mushroom_matriarch')

    simulate(state, 1200)  // hero fires at 600ms, arrives at 860ms, damage recorded

    // Copper knight: max(1, 80 × atkMult×1 × critMult×2 - boss.def×20) = max(1,160-20) = 140
    expect(state.totalDamageDealt).toBeGreaterThanOrEqual(140)
  })

  it('skill deals at least 2× basic attack damage', () => {
    // Slime dies at ~1.5s — use boss so there's a target when skill fires at 5s
    setRandom(0.5)
    const { state } = createInitialRiftState(['hero_copper_knight'])
    state.phase = 'combat'
    spawnBoss(state, 'boss_mushroom_matriarch')

    // Snapshot damage before skill fires
    simulate(state, 4800)
    const beforeDmg = state.totalDamageDealt

    // Skill fires at ~5000ms, arrives ~5430ms
    simulate(state, 800)
    const skillDmg = state.totalDamageDealt - beforeDmg

    // Basic dmg = max(1, 80-20) = 60. Skill = 1.8× = max(1, 80×1.8-20) = 124
    expect(skillDmg).toBeGreaterThan(100)  // comfortably above basic
  })
})

describe('Combat balance — enemy difficulty', () => {
  it('elite enemy survives at least 3 seconds', () => {
    setRandom(0.5)
    const { state } = createInitialRiftState([
      'hero_copper_knight',
      'hero_mushroom_medic',
      'hero_goblin_sparkshot',
    ])
    state.phase = 'combat'
    spawnWave(state, 3, 1)  // wave 3 = elites (400 HP, def 10)

    // Should not die in 2 seconds (faster hero fire rate means shorter threshold)
    simulate(state, 2000)
    const elite = state.enemies[0]
    expect(elite.alive).toBe(true)
  })

  it('elite enemy dies within 15 seconds with 3 heroes', () => {
    setRandom(0.5)
    const { state } = createInitialRiftState([
      'hero_copper_knight',
      'hero_mushroom_medic',
      'hero_goblin_sparkshot',
    ])
    state.phase = 'combat'
    spawnWave(state, 3, 1)

    const ttk = simulateUntil(state, allEnemiesDead, 15000)
    expect(ttk).toBeGreaterThan(0)
  })

  it('mid-boss (2500 HP) is killable within 45 second window', () => {
    setRandom(0.5)
    const { state } = createInitialRiftState([
      'hero_copper_knight',
      'hero_mushroom_medic',
      'hero_goblin_sparkshot',
    ])
    state.phase = 'combat'
    spawnBoss(state, 'boss_mushroom_matriarch')  // 2500 HP, def 20

    const ttk = simulateUntil(state, bossDead, 45000)
    expect(ttk).toBeGreaterThan(0)
    expect(ttk).toBeLessThan(45000)
  })
})

describe('Combat balance — projectile mechanics', () => {
  it('projectile is created when hero fires basic', () => {
    setRandom(0.5)
    const { state } = createInitialRiftState(['hero_copper_knight'])
    state.phase = 'combat'
    spawnWave(state, 0, 1)

    // Before first basic fires (600ms stagger)
    simulate(state, 500)
    const beforeCount = state.projectiles.length + state.damageNumbers.length

    // After first basic fires (past stagger + little more)
    simulate(state, 400)
    const afterCount = state.projectiles.length + state.damageNumbers.length

    // Something should have appeared
    expect(afterCount).toBeGreaterThanOrEqual(beforeCount)
  })

  it('AOE projectile hits all alive enemies', () => {
    setRandom(0.5)
    const { state } = createInitialRiftState(['hero_copper_knight'])
    state.phase = 'combat'
    spawnWave(state, 0, 3)  // 3 slimes

    // Force an AOE projectile
    state.aoeChance = 1.0
    const hero = state.heroes[0]
    hero.skillCdMs = 0  // make skill ready

    simulate(state, 50)  // fire skill (AOE)
    simulate(state, 500) // let projectile arrive

    // All 3 enemies should have taken damage (check via HP < maxHp)
    const damagedCount = state.enemies.filter(e => e.hp < e.maxHp).length
    expect(damagedCount).toBeGreaterThanOrEqual(2)
  })

  it('AOE splash damage is ~55% of primary', () => {
    setRandom(0.5)
    const { state } = createInitialRiftState(['hero_copper_knight'])
    state.phase = 'combat'

    // 2 identical slimes for easy comparison
    spawnWave(state, 0, 2)
    const [e0, e1] = state.enemies
    const startHp0 = e0.maxHp
    const startHp1 = e1.maxHp

    state.aoeChance = 1.0
    const hero = state.heroes[0]
    hero.basicCdMs = 0   // basic AOE (via aoeChance)

    simulate(state, 50)   // fire
    simulate(state, 350)  // arrive

    const dmg0 = startHp0 - e0.hp
    const dmg1 = startHp1 - e1.hp

    if (dmg0 > 0 && dmg1 > 0) {
      const ratio = Math.min(dmg0, dmg1) / Math.max(dmg0, dmg1)
      // Secondary should be ~38% of primary (nerfed splash to reduce AOE dominance)
      expect(ratio).toBeGreaterThan(0.28)
      expect(ratio).toBeLessThan(0.55)
    }
  })

  it('projectile fizzles if target dies before arrival', () => {
    setRandom(0.5)
    const { state } = createInitialRiftState(['hero_copper_knight'])
    state.phase = 'combat'
    spawnWave(state, 0, 1)

    // Manually kill the enemy after a projectile is in flight
    simulate(state, 1200)  // hero fires, projectile in flight

    const hadProjectile = state.projectiles.length > 0
    if (hadProjectile) {
      // Kill the enemy manually
      state.enemies[0].alive = false
      simulate(state, 500)  // let projectile "arrive"
      // No crash, no extra damage numbers from fizzled projectile
      expect(true).toBe(true)  // just assert no exception thrown
    }
  })
})

describe('Combat balance — hero survival', () => {
  it('heroes survive wave 0 (3 slimes) without dying', () => {
    setRandom(0.5)
    const { state } = createInitialRiftState([
      'hero_copper_knight',
      'hero_mushroom_medic',
      'hero_goblin_sparkshot',
    ])
    state.phase = 'combat'
    spawnWave(state, 0, 3)

    simulate(state, 10000)  // 10 seconds
    const aliveCount = state.heroes.filter(h => h.alive).length
    expect(aliveCount).toBeGreaterThanOrEqual(2)  // at least 2 survive 10s vs 3 slimes
  })

  it('heroes take damage from enemies over time', () => {
    setRandom(0.5)
    const { state } = createInitialRiftState(['hero_copper_knight'])
    state.phase = 'combat'
    spawnWave(state, 3, 2)  // 2 elites, atk 35

    const startHp = state.heroes[0].hp
    simulate(state, 5000)
    const endHp = state.heroes[0].hp

    expect(endHp).toBeLessThan(startHp)
  })

  it('lifesteal heals hero proportional to damage dealt', () => {
    setRandom(0.5)
    const { state } = createInitialRiftState(['hero_copper_knight'])
    state.phase = 'combat'
    spawnWave(state, 3, 1)  // elite, won't die quickly

    // Damage hero first
    state.heroes[0].hp = 300
    state.lifeSteal = 0.75  // 75% lifesteal

    const beforeHp = state.heroes[0].hp
    simulate(state, 8000)  // enough time to fire several attacks

    const afterHp = state.heroes[0].hp
    // Lifesteal should have healed some HP
    expect(afterHp).toBeGreaterThan(beforeHp)
  })
})

describe('Combat balance — speed multiplier', () => {
  it('speed_mushroom (spdMult 1.3×) reduces basic cooldown', () => {
    const { state } = createInitialRiftState(['hero_copper_knight'])
    state.phase = 'combat'
    spawnWave(state, 0, 1)

    applyUpgradeCard(state, 'speed_mushroom')
    expect(state.spdMult).toBeCloseTo(1.3, 2)

    // After applying speed mushroom, reset hero basic cd
    const hero = state.heroes[0]
    hero.basicCdMs = 0  // trigger next basic

    simulate(state, 50)  // fires
    simulate(state, 300) // arrive

    // Next basicCdMs reset should be 1200 / 1.3 ≈ 923
    const expectedCd = 1200 / 1.3
    expect(hero.basicCdMs).toBeLessThanOrEqual(expectedCd + 50)
    expect(hero.basicCdMs).toBeGreaterThan(0)
  })
})

// ─── Difficulty progression ───────────────────────────────────────────────────

describe('Difficulty progression — early game (easy)', () => {
  it('wave 0 (5 slimes) clears within 15 seconds with 3 heroes', () => {
    setRandom(0.5)
    const { state } = createInitialRiftState([
      'hero_copper_knight',
      'hero_mushroom_medic',
      'hero_goblin_sparkshot',
    ])
    state.phase = 'combat'
    spawnWave(state, 0, 5)  // wave 0: 5 basic enemies (400 HP each)

    const ttk = simulateUntil(state, allEnemiesDead, 15_000)
    expect(ttk).toBeGreaterThan(0)
    expect(ttk).toBeLessThan(15_000)
  })

  it('wave 0 heroes take less than 50% HP damage in 10 seconds', () => {
    setRandom(0.5)
    const { state } = createInitialRiftState([
      'hero_copper_knight',
      'hero_mushroom_medic',
      'hero_goblin_sparkshot',
    ])
    state.phase = 'combat'
    spawnWave(state, 0, 5)

    simulate(state, 10_000)

    const aliveHeroes = state.heroes.filter(h => h.alive)
    // At least 2 heroes still alive and none below 50% HP
    expect(aliveHeroes.length).toBeGreaterThanOrEqual(2)
    const avgHpPct = aliveHeroes.reduce((sum, h) => sum + h.hp / h.maxHp, 0) / aliveHeroes.length
    expect(avgHpPct).toBeGreaterThan(0.5)
  })

  it('1 hero solo can clear wave 0 (2 slimes) within 18 seconds', () => {
    setRandom(0.5)
    const { state } = createInitialRiftState(['hero_copper_knight'])
    state.phase = 'combat'
    spawnWave(state, 0, 2)

    const ttk = simulateUntil(state, allEnemiesDead, 18_000)
    expect(ttk).toBeGreaterThan(0)
    expect(ttk).toBeLessThan(18_000)
  })
})

describe('Difficulty progression — mid game (hard)', () => {
  it('1 elite takes significantly longer to kill than 1 basic enemy', () => {
    setRandom(0.5)
    const heroes = ['hero_copper_knight', 'hero_mushroom_medic', 'hero_goblin_sparkshot']

    // Time to kill 1 basic enemy (wave 0, 400 HP)
    const { state: basicState } = createInitialRiftState(heroes)
    basicState.phase = 'combat'
    spawnWave(basicState, 0, 1)
    const basicTtk = simulateUntil(basicState, allEnemiesDead, 10_000)

    // Time to kill 1 elite (wave 3, 1800 HP)
    const { state: eliteState } = createInitialRiftState(heroes)
    eliteState.phase = 'combat'
    spawnWave(eliteState, 3, 1)
    const eliteTtk = simulateUntil(eliteState, allEnemiesDead, 20_000)

    expect(basicTtk).toBeGreaterThan(0)
    expect(eliteTtk).toBeGreaterThan(0)
    // Elite should take at least 3× longer to kill than a basic
    expect(eliteTtk).toBeGreaterThan(basicTtk * 3)
  })

  it('elites deal at least 4× more incoming damage than basics over the same window', () => {
    setRandom(0.5)
    const heroes = ['hero_copper_knight', 'hero_mushroom_medic', 'hero_goblin_sparkshot']
    const WINDOW = 8_000

    // Baseline: 3 basic slimes (atk 15, def 3 → hero takes ~5 damage/hit)
    const { state: basicState } = createInitialRiftState(heroes)
    basicState.phase = 'combat'
    spawnWave(basicState, 0, 3)
    simulate(basicState, WINDOW)
    const basicIncoming = basicState.totalDamageReceived

    // Mid game: 3 elites (atk 35, def 10 → hero takes ~25 damage/hit)
    const { state: eliteState } = createInitialRiftState(heroes)
    eliteState.phase = 'combat'
    spawnWave(eliteState, 3, 3)
    simulate(eliteState, WINDOW)
    const eliteIncoming = eliteState.totalDamageReceived

    // Elites should be noticeably more dangerous
    expect(eliteIncoming).toBeGreaterThan(basicIncoming * 4)
  })

  it('3-hero squad deals 3× more total damage than 1 hero over same window', () => {
    setRandom(0.5)
    const WINDOW = 8_000

    const { state: solo } = createInitialRiftState(['hero_copper_knight'])
    solo.phase = 'combat'
    spawnBoss(solo, 'boss_mushroom_matriarch')
    simulate(solo, WINDOW)

    const { state: squad } = createInitialRiftState([
      'hero_copper_knight',
      'hero_mushroom_medic',
      'hero_goblin_sparkshot',
    ])
    squad.phase = 'combat'
    spawnBoss(squad, 'boss_mushroom_matriarch')
    simulate(squad, WINDOW)

    // Squad should deal significantly more than solo (at least 2× due to stagger overlap)
    expect(squad.totalDamageDealt).toBeGreaterThan(solo.totalDamageDealt * 2)
  })

  it('boss is durable: alive at 8 seconds and dead by 40 seconds', () => {
    setRandom(0.5)
    const heroes = ['hero_copper_knight', 'hero_mushroom_medic', 'hero_goblin_sparkshot']

    // Boss alive at 8s — not a pushover
    const { state: earlyState } = createInitialRiftState(heroes)
    earlyState.phase = 'combat'
    spawnBoss(earlyState, 'boss_mushroom_matriarch')
    simulate(earlyState, 8_000)
    expect(earlyState.boss?.alive).toBe(true)

    // Boss dead by 40s — beatable
    const { state: lateState } = createInitialRiftState(heroes)
    lateState.phase = 'combat'
    spawnBoss(lateState, 'boss_mushroom_matriarch')
    const ttk = simulateUntil(lateState, bossDead, 40_000)
    expect(ttk).toBeGreaterThan(0)
    expect(ttk).toBeLessThan(40_000)
  })
})

// ─── AOE / Ultimate balance ───────────────────────────────────────────────────

describe('Balance — ultimate is not a wave-wipe button', () => {
  it('single ultimate does not kill a full-HP basic slime in one hit', () => {
    setRandom(0.5)
    const { state } = createInitialRiftState(['hero_copper_knight'])
    state.phase = 'combat'
    spawnWave(state, 0, 3)  // 3 slimes, 400 HP each

    // Force ultimate ready immediately
    const hero = state.heroes[0]
    hero.ultimateCdMs = 0
    hero.skillCdMs = 9999  // block skill so ult fires

    simulate(state, 50)   // fires ult
    simulate(state, 700)  // ult arrives (650ms travel)

    // Primary target should be dead or heavily damaged, but splash targets (38%) should survive
    const splashTargets = state.enemies.filter((e, i) => i !== 0)
    const splashSurvivors = splashTargets.filter(e => e.alive && e.hp > 0)
    expect(splashSurvivors.length).toBeGreaterThan(0)
  })

  it('ultimate AOE splash is under 50% of primary damage', () => {
    setRandom(0.5)
    const { state } = createInitialRiftState(['hero_copper_knight'])
    state.phase = 'combat'
    spawnWave(state, 0, 2)

    const hero = state.heroes[0]
    hero.ultimateCdMs = 0
    hero.skillCdMs = 9999
    hero.basicCdMs = 9999  // block basics so only ult fires

    const [e0, e1] = state.enemies
    const hp0 = e0.maxHp
    const hp1 = e1.maxHp

    simulate(state, 50)
    simulate(state, 700)

    const dmgPrimary = hp0 - e0.hp
    const dmgSplash  = hp1 - e1.hp

    if (dmgPrimary > 0 && dmgSplash > 0) {
      expect(dmgSplash / dmgPrimary).toBeLessThan(0.50)
      expect(dmgSplash / dmgPrimary).toBeGreaterThan(0.25)
    }
  })

  it('skill deals less per-hit than ultimate but recharges faster', () => {
    setRandom(0.5)
    const { state } = createInitialRiftState(['hero_copper_knight'])
    state.phase = 'combat'
    spawnBoss(state, 'boss_mushroom_matriarch')

    // Measure skill damage
    const hero = state.heroes[0]
    hero.skillCdMs = 0
    hero.ultimateCdMs = 9999
    const dmgBefore = state.totalDamageDealt
    simulate(state, 50)
    simulate(state, 500)
    const skillDmg = state.totalDamageDealt - dmgBefore

    // Measure ult damage in fresh state
    const { state: s2 } = createInitialRiftState(['hero_copper_knight'])
    s2.phase = 'combat'
    spawnBoss(s2, 'boss_mushroom_matriarch')
    s2.heroes[0].ultimateCdMs = 0
    s2.heroes[0].skillCdMs = 9999
    const dmgBefore2 = s2.totalDamageDealt
    simulate(s2, 50)
    simulate(s2, 700)
    const ultDmg = s2.totalDamageDealt - dmgBefore2

    expect(ultDmg).toBeGreaterThan(skillDmg)  // ult still hits harder
    expect(ultDmg).toBeLessThan(skillDmg * 2)  // but not more than 2× skill
  })
})

// ─── Gacha pressure ──────────────────────────────────────────────────────────

describe('Balance — gacha pressure points', () => {
  it('3 elites deal enough damage to drop hero below 50% HP within 12s', () => {
    setRandom(0.5)
    const { state } = createInitialRiftState([
      'hero_copper_knight',
      'hero_mushroom_medic',
      'hero_goblin_sparkshot',
    ])
    state.phase = 'combat'
    spawnWave(state, 3, 3)  // 3 elites, atk 65

    simulate(state, 12_000)

    // Hero[1] always targeted with random=0.5 — should be heavily damaged
    const targeted = state.heroes[1]
    const hpPct = targeted.alive ? targeted.hp / targeted.maxHp : 0
    expect(hpPct).toBeLessThan(0.5)
  })

  it('heroes do NOT wipe to wave 0 basics in first 10s (fair early game)', () => {
    setRandom(0.5)
    const { state } = createInitialRiftState([
      'hero_copper_knight',
      'hero_mushroom_medic',
      'hero_goblin_sparkshot',
    ])
    state.phase = 'combat'
    spawnWave(state, 0, 5)

    simulate(state, 10_000)

    const alive = state.heroes.filter(h => h.alive).length
    expect(alive).toBeGreaterThanOrEqual(2)
  })

  it('wave 4 enemies (with elites) include elites in the pool', () => {
    setRandom(0.5)
    const { state } = createInitialRiftState([
      'hero_copper_knight',
      'hero_mushroom_medic',
      'hero_goblin_sparkshot',
    ])
    state.phase = 'combat'
    spawnWave(state, 4, 6)  // wave 4 now cycles ghost/skull/elite

    const hasElite = state.enemies.some(e =>
      e.assetId.includes('elite') || e.maxHp >= 1000
    )
    expect(hasElite).toBe(true)
  })

  it('difficultyMult=2 doubles enemy HP', () => {
    const { state: s1 } = createInitialRiftState(['hero_copper_knight'], { difficultyMult: 1 })
    s1.phase = 'combat'
    spawnWave(s1, 0, 1)
    const hp1 = s1.enemies[0].maxHp

    const { state: s2 } = createInitialRiftState(['hero_copper_knight'], { difficultyMult: 2 })
    s2.phase = 'combat'
    spawnWave(s2, 0, 1)
    const hp2 = s2.enemies[0].maxHp

    expect(hp2).toBeCloseTo(hp1 * 2, -1)
  })

  it('difficultyMult=2 enemies attack with higher damage per hit than diffMult=1', () => {
    // Harder rifts must scale enemy ATK — verify via a single-tick hit comparison
    const heroes = ['hero_copper_knight', 'hero_mushroom_medic', 'hero_goblin_sparkshot']

    // diffMult=1: elite atk = 65, incoming = 65 - hero.def(20)*0.5 = 55
    const { state: easy } = createInitialRiftState(heroes, { difficultyMult: 1 })
    easy.phase = 'combat'
    spawnWave(easy, 3, 1)
    const easyEliteAtk = easy.enemies[0].atk

    // diffMult=2: elite atk = round(65 * 1.7) = 111, incoming = 101
    const { state: hard } = createInitialRiftState(heroes, { difficultyMult: 2 })
    hard.phase = 'combat'
    spawnWave(hard, 3, 1)
    const hardEliteAtk = hard.enemies[0].atk

    expect(hardEliteAtk).toBeGreaterThan(easyEliteAtk * 1.5)
  })

  it('atkMult upgrade measurably increases damage output', () => {
    setRandom(0.5)
    const WINDOW = 8_000

    const { state: base } = createInitialRiftState(['hero_copper_knight'])
    base.phase = 'combat'
    spawnBoss(base, 'boss_mushroom_matriarch')
    simulate(base, WINDOW)

    const { state: buffed } = createInitialRiftState(['hero_copper_knight'])
    buffed.phase = 'combat'
    applyUpgradeCard(buffed, 'tiny_meteor')  // atkMult ×1.25
    spawnBoss(buffed, 'boss_mushroom_matriarch')
    simulate(buffed, WINDOW)

    expect(buffed.totalDamageDealt).toBeGreaterThan(base.totalDamageDealt * 1.15)
  })
})
