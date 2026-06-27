import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Rarity } from '@/constants/palette'
import {
  getRewardForStreak, CHEST_COOLDOWN_MS, STREAK_GRACE_MS, FREE_KEY_CD_MS,
  type DayReward,
} from '@/game/progression/dailyRewards'

export interface OwnedHero {
  id: string
  stars: number
  shards: number
}

export type GearSlot = 'weapon' | 'trinket' | 'relic'

export interface OwnedGear {
  id: string
  instanceId: string
  equipped: boolean
  equippedHeroId?: string
  equippedSlot?: GearSlot
}

interface GameState {
  // Currency
  gold: number
  gems: number
  keys: number
  shards: number

  // Capsule
  pityCount: number

  // Heroes
  ownedHeroes: OwnedHero[]
  squadHeroIds: string[]   // up to 3, ordered

  // Gear
  ownedGear: OwnedGear[]

  // Rift tier selection (1–5)
  selectedRiftTier: number

  // Run boosts — queued for the next run, consumed on entry
  runBoosts: string[]

  // Stats
  totalRifts: number
  totalKills: number
  totalGoldEarned: number
  totalCapsulePulls: number
  highestPower: number

  // Session tracking
  lastSeenAt: number   // unix ms — written on unload, read on next load

  // New-player shop offer (20-hour window from first open)
  gemOfferExpiresAt: number  // 0 = not yet initialised

  // Starter pack gate — tracks which starter packs have been purchased
  starterPacksBought: string[]

  // Daily chest + login streak
  lastDailyChestAt: number   // 0 = never claimed
  loginStreak: number        // 0 = never tracked
  lastLoginDate: string      // 'YYYY-MM-DD'
  nextFreeKeyAt: number      // 0 = key available immediately

  // Actions
  addGold: (amount: number) => void
  spendGold: (amount: number) => boolean
  setRiftTier: (tier: number) => void
  buyBoost: (id: string, cost: number) => boolean
  consumeBoosts: () => string[]
  addGems: (amount: number) => void
  spendGems: (amount: number) => boolean
  addHero: (id: string) => void
  upgradeHeroStar: (id: string) => void
  addShardsToHero: (id: string, amount: number) => void
  setSquadSlot: (slot: 0 | 1 | 2, heroId: string | null) => void
  addGear: (id: string) => void
  equipGear: (instanceId: string, heroId: string, slot: GearSlot) => void
  unequipGear: (instanceId: string) => void
  unequipHeroSlot: (heroId: string, slot: GearSlot) => void
  incrementPity: () => void
  resetPity: () => void
  recordRiftResult: (result: { kills: number; goldEarned: number }) => void
  recordCapsulePull: () => void
  setLastSeen: () => void
  initGemOffer: () => void
  buyStarterPack: (id: string, gems: number, gold: number, keys: number, gearIds: string[]) => void
  checkDailyLogin: () => void
  claimDailyChest: () => DayReward
  claimFreeKey: () => void
}

let gearInstanceCounter = 0

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      gold: 48_220,
      gems: 340,
      keys: 2,
      shards: 12,
      pityCount: 34,
      selectedRiftTier: 1,
      runBoosts: [],
      ownedHeroes: [
        { id: 'hero_copper_knight', stars: 0, shards: 0 },
        { id: 'hero_mushroom_medic', stars: 0, shards: 0 },
        { id: 'hero_goblin_sparkshot', stars: 0, shards: 0 },
      ],
      squadHeroIds: [
        'hero_copper_knight',
        'hero_mushroom_medic',
        'hero_goblin_sparkshot',
      ],
      ownedGear: [
        { id: 'gear_lucky_frog_coin',     instanceId: 'g_start_0', equipped: false },
        { id: 'gear_glitter_boots',       instanceId: 'g_start_1', equipped: false },
        { id: 'gear_squeaky_doom_hammer', instanceId: 'g_start_2', equipped: false },
        { id: 'gear_meteor_lunchbox',     instanceId: 'g_start_3', equipped: false },
        { id: 'gear_crystal_spike',       instanceId: 'g_start_4', equipped: false },
        { id: 'gear_storm_band',          instanceId: 'g_start_5', equipped: false },
      ],
      totalRifts: 42,
      totalKills: 1840,
      totalGoldEarned: 284_220,
      totalCapsulePulls: 67,
      highestPower: 6400,
      lastSeenAt: Date.now() - 2 * 3_600_000,
      gemOfferExpiresAt: 0,
      starterPacksBought: [],
      lastDailyChestAt: 0,
      loginStreak: 0,
      lastLoginDate: '',
      nextFreeKeyAt: 0,

      addGold: (amount) => set(s => ({ gold: s.gold + amount, totalGoldEarned: s.totalGoldEarned + amount })),
      spendGold: (amount) => {
        if (get().gold < amount) return false
        set(s => ({ gold: s.gold - amount }))
        return true
      },
      setRiftTier: (tier) => set({ selectedRiftTier: Math.max(1, Math.min(5, tier)) }),
      buyBoost: (id, cost) => {
        if (get().gold < cost) return false
        set(s => ({ gold: s.gold - cost, runBoosts: [...s.runBoosts, id] }))
        return true
      },
      consumeBoosts: () => {
        const boosts = get().runBoosts
        set({ runBoosts: [] })
        return boosts
      },
      addGems: (amount) => set(s => ({ gems: s.gems + amount })),
      spendGems: (amount) => {
        if (get().gems < amount) return false
        set(s => ({ gems: s.gems - amount }))
        return true
      },

      addHero: (id) => {
        const owned = get().ownedHeroes.find(h => h.id === id)
        if (owned) {
          // Duplicate → shards
          set(s => ({
            ownedHeroes: s.ownedHeroes.map(h =>
              h.id === id ? { ...h, shards: h.shards + 10 } : h
            ),
          }))
        } else {
          set(s => ({ ownedHeroes: [...s.ownedHeroes, { id, stars: 0, shards: 0 }] }))
        }
      },

      upgradeHeroStar: (id) =>
        set(s => ({
          ownedHeroes: s.ownedHeroes.map(h =>
            h.id === id ? { ...h, stars: Math.min(h.stars + 1, 5) } : h
          ),
        })),

      addShardsToHero: (id, amount) =>
        set(s => ({
          ownedHeroes: s.ownedHeroes.map(h =>
            h.id === id ? { ...h, shards: h.shards + amount } : h
          ),
        })),

      setSquadSlot: (slot, heroId) =>
        set(s => {
          const squad = [...s.squadHeroIds]
          if (heroId === null) {
            squad[slot] = ''
          } else {
            // Remove from any existing slot first
            const existing = squad.indexOf(heroId)
            if (existing !== -1) squad[existing] = ''
            squad[slot] = heroId
          }
          return { squadHeroIds: squad }
        }),

      addGear: (id) =>
        set(s => ({
          ownedGear: [...s.ownedGear, {
            id,
            instanceId: `gear_${id}_${++gearInstanceCounter}_${Date.now()}`,
            equipped: false,
          }],
        })),

      equipGear: (instanceId, heroId, slot) =>
        set(s => ({
          ownedGear: s.ownedGear.map(g => {
            // Bump out any gear already in this slot for this hero
            if (g.equipped && g.equippedHeroId === heroId && g.equippedSlot === slot && g.instanceId !== instanceId)
              return { ...g, equipped: false, equippedHeroId: undefined, equippedSlot: undefined }
            if (g.instanceId === instanceId)
              return { ...g, equipped: true, equippedHeroId: heroId, equippedSlot: slot }
            return g
          }),
        })),

      unequipGear: (instanceId) =>
        set(s => ({
          ownedGear: s.ownedGear.map(g =>
            g.instanceId === instanceId
              ? { ...g, equipped: false, equippedHeroId: undefined, equippedSlot: undefined }
              : g
          ),
        })),

      unequipHeroSlot: (heroId, slot) =>
        set(s => ({
          ownedGear: s.ownedGear.map(g =>
            g.equipped && g.equippedHeroId === heroId && g.equippedSlot === slot
              ? { ...g, equipped: false, equippedHeroId: undefined, equippedSlot: undefined }
              : g
          ),
        })),

      incrementPity: () => set(s => ({ pityCount: s.pityCount + 1 })),
      resetPity: () => set({ pityCount: 0 }),

      recordRiftResult: ({ kills, goldEarned }) =>
        set(s => ({
          totalRifts: s.totalRifts + 1,
          totalKills: s.totalKills + kills,
          totalGoldEarned: s.totalGoldEarned + goldEarned,
        })),

      recordCapsulePull: () =>
        set(s => ({ totalCapsulePulls: s.totalCapsulePulls + 1 })),

      setLastSeen: () => set({ lastSeenAt: Date.now() }),
      initGemOffer: () => {
        if (get().gemOfferExpiresAt === 0)
          set({ gemOfferExpiresAt: Date.now() + 20 * 3_600_000 })
      },
      buyStarterPack: (id, gems, gold, keys, gearIds) => {
        if (get().starterPacksBought.includes(id)) return
        const { addGear } = get()
        set(s => ({
          gems: s.gems + gems,
          gold: s.gold + gold,
          keys: s.keys + keys,
          totalGoldEarned: s.totalGoldEarned + gold,
          starterPacksBought: [...s.starterPacksBought, id],
        }))
        for (const gid of gearIds) addGear(gid)
      },
      checkDailyLogin: () => {
        const today = new Date().toISOString().split('T')[0]
        const { lastLoginDate, loginStreak } = get()
        if (lastLoginDate === today) return
        const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0]
        const streakBroken = lastLoginDate
          ? new Date(today).getTime() - new Date(lastLoginDate).getTime() > STREAK_GRACE_MS
          : false
        set({
          loginStreak: streakBroken ? 1 : loginStreak + 1,
          lastLoginDate: today,
        })
      },
      claimDailyChest: () => {
        const { loginStreak, addGear } = get()
        const reward = getRewardForStreak(Math.max(1, loginStreak))
        set(s => ({
          gold: s.gold + reward.gold,
          totalGoldEarned: s.totalGoldEarned + reward.gold,
          gems: s.gems + reward.gems,
          keys: s.keys + reward.keys,
          lastDailyChestAt: Date.now(),
        }))
        if (reward.gearId) addGear(reward.gearId)
        return reward
      },
      claimFreeKey: () => set(s => ({
        keys: s.keys + 1,
        nextFreeKeyAt: Date.now() + FREE_KEY_CD_MS,
      })),
    }),
    {
      name: 'lootburst-game-state',
      partialize: (s) => ({
        gold: s.gold,
        gems: s.gems,
        keys: s.keys,
        shards: s.shards,
        pityCount: s.pityCount,
        selectedRiftTier: s.selectedRiftTier,
        runBoosts: s.runBoosts,
        ownedHeroes: s.ownedHeroes,
        squadHeroIds: s.squadHeroIds,
        ownedGear: s.ownedGear,
        totalRifts: s.totalRifts,
        totalKills: s.totalKills,
        totalGoldEarned: s.totalGoldEarned,
        totalCapsulePulls: s.totalCapsulePulls,
        highestPower: s.highestPower,
        lastSeenAt: s.lastSeenAt,
        gemOfferExpiresAt: s.gemOfferExpiresAt,
        starterPacksBought: s.starterPacksBought,
        lastDailyChestAt: s.lastDailyChestAt,
        loginStreak: s.loginStreak,
        lastLoginDate: s.lastLoginDate,
        nextFreeKeyAt: s.nextFreeKeyAt,
      }),
    }
  )
)
