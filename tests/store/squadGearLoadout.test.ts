import { describe, expect, it } from 'vitest'
import {
  findUpgradeableGearInstance,
  transferEquippedGearLoadout,
  upgradeAllGearWithDupesInInventory,
  upgradeGearWithDupesInInventory,
  useGameStore,
  type OwnedGear,
} from '@/store/gameStore'
import { computeHeroGearBonusesFromGear, getRoleGearPowerScore } from '@/game/gear/gearStats'

describe('squad gear loadout transfer', () => {
  it('moves an occupied squad slot loadout onto the replacement hero', () => {
    const gear: OwnedGear[] = [
      {
        id: 'gear_squeaky_doom_hammer',
        instanceId: 'old_weapon',
        equipped: true,
        equippedHeroId: 'hero_old',
        equippedSlot: 'weapon',
      },
      {
        id: 'gear_lucky_frog_coin',
        instanceId: 'old_trinket',
        equipped: true,
        equippedHeroId: 'hero_old',
        equippedSlot: 'trinket',
      },
      {
        id: 'gear_crystal_spike',
        instanceId: 'new_weapon',
        equipped: true,
        equippedHeroId: 'hero_new',
        equippedSlot: 'weapon',
      },
    ]

    const result = transferEquippedGearLoadout(gear, 'hero_old', 'hero_new')

    expect(result.find(g => g.instanceId === 'old_weapon')).toMatchObject({
      equipped: true,
      equippedHeroId: 'hero_new',
      equippedSlot: 'weapon',
    })
    expect(result.find(g => g.instanceId === 'old_trinket')).toMatchObject({
      equipped: true,
      equippedHeroId: 'hero_new',
      equippedSlot: 'trinket',
    })
    expect(result.find(g => g.instanceId === 'new_weapon')).toMatchObject({
      equipped: false,
      equippedHeroId: undefined,
      equippedSlot: undefined,
    })
  })
})

describe('gear duplicate upgrades', () => {
  it('upgrades the target item and consumes two unequipped dupes', () => {
    const gear: OwnedGear[] = [
      { id: 'gear_crystal_spike', instanceId: 'target', equipped: true, equippedHeroId: 'hero_a', equippedSlot: 'weapon' },
      { id: 'gear_crystal_spike', instanceId: 'dupe_1', equipped: false },
      { id: 'gear_crystal_spike', instanceId: 'dupe_2', equipped: false },
      { id: 'gear_storm_band', instanceId: 'other', equipped: false },
    ]

    const result = upgradeGearWithDupesInInventory(gear, 'target')

    expect(result).not.toBeNull()
    expect(result?.find(g => g.instanceId === 'target')).toMatchObject({
      equipped: true,
      stars: 1,
      equippedHeroId: 'hero_a',
      equippedSlot: 'weapon',
    })
    expect(result?.some(g => g.instanceId === 'dupe_1')).toBe(false)
    expect(result?.some(g => g.instanceId === 'dupe_2')).toBe(false)
    expect(result?.some(g => g.instanceId === 'other')).toBe(true)
  })

  it('does not consume equipped duplicates or upgrade with only one spare copy', () => {
    const gear: OwnedGear[] = [
      { id: 'gear_crystal_spike', instanceId: 'target', equipped: false },
      { id: 'gear_crystal_spike', instanceId: 'spare', equipped: false },
      { id: 'gear_crystal_spike', instanceId: 'equipped_dupe', equipped: true, equippedHeroId: 'hero_b', equippedSlot: 'weapon' },
    ]

    expect(upgradeGearWithDupesInInventory(gear, 'target')).toBeNull()
  })

  it('finds upgradeable stacks and can upgrade every ready item', () => {
    const gear: OwnedGear[] = [
      { id: 'gear_bent_spoon', instanceId: 'spoon_0', equipped: false },
      { id: 'gear_bent_spoon', instanceId: 'spoon_1', equipped: false },
      { id: 'gear_bent_spoon', instanceId: 'spoon_2', equipped: false },
      { id: 'gear_tarnished_button', instanceId: 'button_0', equipped: true, equippedHeroId: 'hero_a', equippedSlot: 'trinket' },
      { id: 'gear_tarnished_button', instanceId: 'button_1', equipped: false },
      { id: 'gear_tarnished_button', instanceId: 'button_2', equipped: false },
    ]

    expect(findUpgradeableGearInstance(gear, 'gear_bent_spoon')?.instanceId).toBe('spoon_0')

    const result = upgradeAllGearWithDupesInInventory(gear)

    expect(result.upgrades).toBe(2)
    expect(result.ownedGear).toHaveLength(2)
    expect(result.ownedGear.find(g => g.id === 'gear_bent_spoon')).toMatchObject({ stars: 1 })
    expect(result.ownedGear.find(g => g.id === 'gear_tarnished_button')).toMatchObject({
      stars: 1,
      equipped: true,
      equippedHeroId: 'hero_a',
    })
  })

  it('makes upgraded gear stronger in combat stat calculations', () => {
    const base = computeHeroGearBonusesFromGear([{ id: 'gear_squeaky_doom_hammer' }])
    const upgraded = computeHeroGearBonusesFromGear([{ id: 'gear_squeaky_doom_hammer', stars: 2 }])

    expect(upgraded.atk).toBeGreaterThan(base.atk)
  })

  it('scores defensive relics higher for tanks than ranged heroes', () => {
    const defensive = { id: 'gear_cardboard_pauldron' }
    const offensive = { id: 'gear_sugar_rocket' }

    const tankPreference = getRoleGearPowerScore(defensive, 'tank') - getRoleGearPowerScore(offensive, 'tank')
    const rangedPreference = getRoleGearPowerScore(defensive, 'ranged') - getRoleGearPowerScore(offensive, 'ranged')

    expect(tankPreference).toBeGreaterThan(rangedPreference)
  })
})

describe('capsule key economy', () => {
  it('spends capsule keys and leaves the balance unchanged when short', () => {
    useGameStore.setState({ keys: 2 })

    expect(useGameStore.getState().spendKeys(1)).toBe(true)
    expect(useGameStore.getState().keys).toBe(1)

    expect(useGameStore.getState().spendKeys(2)).toBe(false)
    expect(useGameStore.getState().keys).toBe(1)
  })
})
