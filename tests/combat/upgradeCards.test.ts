/**
 * Upgrade card balance validation tests.
 * Verifies every card applies correctly and keeps state within sane bounds.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

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

beforeEach(() => { Math.random = () => 0.5 })

import { createInitialRiftState, applyUpgradeCard } from '@/game/rift/riftRunState'
import { UPGRADE_CARDS } from '@/game/rift/upgradeCards'
import type { RiftRunState } from '@/game/rift/riftTypes'

function freshState(): RiftRunState {
  const { state } = createInitialRiftState(['hero_copper_knight'])
  return state
}

describe('Upgrade cards — field mutations', () => {
  it('blade_orbit increases aoeChance by 0.3, capped at 1.0', () => {
    const s = freshState()
    applyUpgradeCard(s, 'blade_orbit')
    expect(s.aoeChance).toBeCloseTo(0.3, 5)
    // Stack twice more — should cap at 1.0
    applyUpgradeCard(s, 'blade_orbit')
    applyUpgradeCard(s, 'blade_orbit')
    expect(s.aoeChance).toBeLessThanOrEqual(1.0)
  })

  it('gold_fever multiplies goldMult by 1.5', () => {
    const s = freshState()
    const before = s.goldMult
    applyUpgradeCard(s, 'gold_fever')
    expect(s.goldMult).toBeCloseTo(before * 1.5, 5)
  })

  it('tiny_meteor increases atkMult by 1.25×', () => {
    const s = freshState()
    applyUpgradeCard(s, 'tiny_meteor')
    expect(s.atkMult).toBeCloseTo(1.25, 5)
  })

  it('candy_shield increases defMult by 1.4×', () => {
    const s = freshState()
    applyUpgradeCard(s, 'candy_shield')
    expect(s.defMult).toBeCloseTo(1.4, 5)
  })

  it('lifesteal_bite increases lifeSteal by 0.15, capped at 0.5', () => {
    const s = freshState()
    applyUpgradeCard(s, 'lifesteal_bite')
    expect(s.lifeSteal).toBeCloseTo(0.15, 5)
    // Stack to cap
    applyUpgradeCard(s, 'lifesteal_bite')
    applyUpgradeCard(s, 'lifesteal_bite')
    applyUpgradeCard(s, 'lifesteal_bite')
    expect(s.lifeSteal).toBeLessThanOrEqual(0.5)
  })

  it('crit_candy increases critChance by 0.2 and critMult by 0.5', () => {
    const s = freshState()
    const prevChance = s.critChance
    const prevMult = s.critMult
    applyUpgradeCard(s, 'crit_candy')
    expect(s.critChance).toBeCloseTo(prevChance + 0.2, 5)
    expect(s.critMult).toBeCloseTo(prevMult + 0.5, 5)
    // Stacking should not exceed critChance cap of 0.8
    for (let i = 0; i < 5; i++) applyUpgradeCard(s, 'crit_candy')
    expect(s.critChance).toBeLessThanOrEqual(0.8)
  })

  it('speed_mushroom increases spdMult by 1.3×', () => {
    const s = freshState()
    applyUpgradeCard(s, 'speed_mushroom')
    expect(s.spdMult).toBeCloseTo(1.3, 5)
    // Stack — should compound
    applyUpgradeCard(s, 'speed_mushroom')
    expect(s.spdMult).toBeCloseTo(1.3 * 1.3, 4)
  })

  it('void_echo increases atkMult by 1.35×', () => {
    const s = freshState()
    applyUpgradeCard(s, 'void_echo')
    expect(s.atkMult).toBeCloseTo(1.35, 5)
  })

  it('golden_loot_magnet increases goldMult by 1.25×', () => {
    const s = freshState()
    applyUpgradeCard(s, 'golden_loot_magnet')
    expect(s.goldMult).toBeCloseTo(1.25, 5)
  })

  it('prismatic_core boosts atk + def + spd + critChance', () => {
    const s = freshState()
    const { atkMult, defMult, spdMult, critChance } = s
    applyUpgradeCard(s, 'prismatic_core')
    expect(s.atkMult).toBeCloseTo(atkMult * 1.15, 4)
    expect(s.defMult).toBeCloseTo(defMult * 1.15, 4)
    expect(s.spdMult).toBeCloseTo(spdMult * 1.15, 4)
    expect(s.critChance).toBeCloseTo(critChance + 0.1, 4)
  })
})

describe('Upgrade cards — power balance bounds', () => {
  it('no single card increases atkMult above 1.5× in one pick', () => {
    const s = freshState()
    for (const card of UPGRADE_CARDS) {
      const fresh = freshState()
      applyUpgradeCard(fresh, card.id)
      expect(fresh.atkMult).toBeLessThanOrEqual(1.5)
    }
  })

  it('no single card increases spdMult above 1.5× in one pick', () => {
    for (const card of UPGRADE_CARDS) {
      const fresh = freshState()
      applyUpgradeCard(fresh, card.id)
      expect(fresh.spdMult).toBeLessThanOrEqual(1.5)
    }
  })

  it('stacking all damage cards stays within 8× atkMult ceiling', () => {
    const s = freshState()
    const dmgCards = ['tiny_meteor', 'void_echo', 'prismatic_core', 'crit_candy']
    for (const id of dmgCards) applyUpgradeCard(s, id)
    // atkMult: 1 × 1.25 × 1.35 × 1.15 ≈ 1.94 — well within 8×
    expect(s.atkMult).toBeLessThan(8)
  })

  it('all cards are listed in UPGRADE_CARDS with required fields', () => {
    for (const card of UPGRADE_CARDS) {
      expect(card.id).toBeTruthy()
      expect(card.title).toBeTruthy()
      expect(card.description).toBeTruthy()
      expect(card.icon).toBeTruthy()
      expect(['common','uncommon','rare','epic','legendary','mythic']).toContain(card.rarity)
      expect(typeof card.apply).toBe('function')
    }
  })

  it('applyUpgradeCard records id in appliedUpgrades', () => {
    const s = freshState()
    applyUpgradeCard(s, 'gold_fever')
    expect(s.appliedUpgrades).toContain('gold_fever')
  })

  it('unknown card id is a no-op (no crash)', () => {
    const s = freshState()
    const before = { ...s }
    applyUpgradeCard(s, 'nonexistent_card')
    expect(s.atkMult).toBe(before.atkMult)
    expect(s.goldMult).toBe(before.goldMult)
  })

  it('gold income with gold_fever + loot_magnet stacked is ≤ 5× base', () => {
    const s = freshState()
    applyUpgradeCard(s, 'gold_fever')        // 1.5×
    applyUpgradeCard(s, 'golden_loot_magnet') // ×1.25
    // Combined: 1.5 × 1.25 = 1.875 — well below 5×
    expect(s.goldMult).toBeLessThan(5)
  })
})

describe('Upgrade cards — rollUpgradeCards', () => {
  it('returns requested count of distinct cards', async () => {
    const { rollUpgradeCards } = await import('@/game/rift/upgradeCards')
    const cards = rollUpgradeCards(3, [])
    expect(cards).toHaveLength(3)
    const ids = cards.map(c => c.id)
    expect(new Set(ids).size).toBe(3)
  })

  it('excludes already-applied card ids', async () => {
    const { rollUpgradeCards } = await import('@/game/rift/upgradeCards')
    const exclude = ['blade_orbit', 'gold_fever', 'tiny_meteor']
    const cards = rollUpgradeCards(3, exclude)
    for (const id of exclude) {
      expect(cards.map(c => c.id)).not.toContain(id)
    }
  })

  it('returns all remaining cards when pool is small', async () => {
    const { rollUpgradeCards } = await import('@/game/rift/upgradeCards')
    // Exclude all but 2
    const allIds = UPGRADE_CARDS.map(c => c.id)
    const keep = allIds.slice(0, 2)
    const exclude = allIds.filter(id => !keep.includes(id))
    const cards = rollUpgradeCards(3, exclude)
    expect(cards.length).toBe(2)
  })
})
