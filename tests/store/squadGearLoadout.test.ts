import { describe, expect, it } from 'vitest'
import { transferEquippedGearLoadout, type OwnedGear } from '@/store/gameStore'

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
