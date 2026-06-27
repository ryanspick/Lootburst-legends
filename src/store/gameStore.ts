import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Rarity } from '@/constants/palette'
import {
  getRewardForStreak, CHEST_COOLDOWN_MS, STREAK_GRACE_MS, FREE_KEY_CD_MS,
  type DayReward,
} from '@/game/progression/dailyRewards'
import {
  rollDailyQuests, getDailyQuestDate, type QuestType,
} from '@/game/progression/dailyQuests'
import { FREE_COSMETIC_IDS, getCosmeticById } from '@/data/cosmeticsData'
import type { CosmeticType } from '@/data/cosmeticsData'
import { ACHIEVEMENTS } from '@/data/achievementsData'

export interface RunRecord {
  kills: number
  goldEarned: number
  elapsedMs: number
  tierLevel: number
  wasWipe: boolean
  timestamp: number
}

export interface OwnedHero {
  id: string
  stars: number
  shards: number
  level: number   // 1–10 hero mastery level
  xp: number      // accumulated XP toward next level
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

  // Daily quests
  dailyQuestDate: string                 // 'YYYY-MM-DD' of current quests
  dailyQuestProgress: Record<string, number>
  dailyQuestsClaimed: string[]

  // Cosmetics
  ownedCosmeticIds: string[]
  equippedCosmetics: Record<CosmeticType, string>

  // Equipped pet + mount (gameplay-affecting, separate from cosmetics)
  equippedPetId:   string   // '' = none, default pet_coin_bat
  equippedMountId: string   // '' = none

  // Tutorial: -1 = complete/skipped, 0+ = active step
  tutorialStep: number

  // Settings
  soundMuted:  boolean
  soundVolume: number    // 0–1
  musicMuted:  boolean
  vfxReduced:  boolean   // overrides system prefers-reduced-motion

  // Achievements — persisted set of unlocked IDs
  unlockedAchievements: string[]

  // Run history — ring buffer, last 10 runs
  runHistory: RunRecord[]

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
  recordRiftResult: (result: { kills: number; goldEarned: number; elapsedMs?: number; tierLevel?: number; wasWipe?: boolean }) => void
  recordCapsulePull: () => void
  setLastSeen: () => void
  initGemOffer: () => void
  buyStarterPack: (id: string, gems: number, gold: number, keys: number, gearIds: string[]) => void
  checkDailyLogin: () => void
  claimDailyChest: () => DayReward
  claimFreeKey: () => void
  tickDailyQuest: (type: QuestType, amount: number) => void
  claimDailyQuest: (questId: string) => { gold: number; gems: number }
  checkQuestRollover: () => void
  unlockCosmetic: (id: string) => void
  equipCosmetic: (id: string) => void
  advanceTutorialStep: () => void
  completeTutorial: () => void
  setSoundMuted:  (v: boolean) => void
  setSoundVolume: (v: number)  => void
  setMusicMuted:  (v: boolean) => void
  setVfxReduced:  (v: boolean) => void
  checkAchievements: () => string[]
  updateHighestPower: (power: number) => void
  awardRunXp: (heroIds: string[], xpTotal: number) => string[]
  equipPet:   (id: string) => void
  equipMount: (id: string) => void
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
        { id: 'hero_copper_knight',    stars: 0, shards: 0, level: 1, xp: 0 },
        { id: 'hero_mushroom_medic',   stars: 0, shards: 0, level: 1, xp: 0 },
        { id: 'hero_goblin_sparkshot', stars: 0, shards: 0, level: 1, xp: 0 },
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
      dailyQuestDate: '',
      dailyQuestProgress: {},
      dailyQuestsClaimed: [],
      ownedCosmeticIds: FREE_COSMETIC_IDS,
      equippedCosmetics: { trail: 'trail_default', frame: 'frame_default', capsule: 'capsule_classic' } as Record<CosmeticType, string>,
      equippedPetId:   'pet_coin_bat',
      equippedMountId: '',
      tutorialStep: 0,
      soundMuted:  false,
      soundVolume: 0.7,
      musicMuted:  false,
      vfxReduced:  false,
      unlockedAchievements: [],
      runHistory: [],

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
          set(s => ({ ownedHeroes: [...s.ownedHeroes, { id, stars: 0, shards: 0, level: 1, xp: 0 }] }))
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

      recordRiftResult: ({ kills, goldEarned, elapsedMs = 0, tierLevel = 1, wasWipe = false }) => {
        const today = getDailyQuestDate()
        const s = get()
        const isNewDay = s.dailyQuestDate !== today
        const baseProgress = isNewDay ? {} : s.dailyQuestProgress
        const quests = rollDailyQuests(today)
        const newProgress = { ...baseProgress }
        for (const q of quests) {
          if (q.type === 'rifts')       newProgress[q.id] = Math.min((newProgress[q.id] ?? 0) + 1, q.target)
          if (q.type === 'kills')       newProgress[q.id] = Math.min((newProgress[q.id] ?? 0) + kills, q.target)
          if (q.type === 'gold_earned') newProgress[q.id] = Math.min((newProgress[q.id] ?? 0) + goldEarned, q.target)
        }
        const record: RunRecord = { kills, goldEarned, elapsedMs, tierLevel, wasWipe, timestamp: Date.now() }
        set(st => ({
          totalRifts: st.totalRifts + 1,
          totalKills: st.totalKills + kills,
          totalGoldEarned: st.totalGoldEarned + goldEarned,
          dailyQuestDate: today,
          dailyQuestProgress: newProgress,
          dailyQuestsClaimed: isNewDay ? [] : st.dailyQuestsClaimed,
          runHistory: [record, ...st.runHistory].slice(0, 10),
        }))
      },

      recordCapsulePull: () => {
        const today = getDailyQuestDate()
        const s = get()
        const isNewDay = s.dailyQuestDate !== today
        const baseProgress = isNewDay ? {} : s.dailyQuestProgress
        const quests = rollDailyQuests(today)
        const newProgress = { ...baseProgress }
        for (const q of quests.filter(q => q.type === 'pulls')) {
          newProgress[q.id] = Math.min((newProgress[q.id] ?? 0) + 1, q.target)
        }
        set(st => ({
          totalCapsulePulls: st.totalCapsulePulls + 1,
          dailyQuestDate: today,
          dailyQuestProgress: newProgress,
          dailyQuestsClaimed: isNewDay ? [] : st.dailyQuestsClaimed,
        }))
      },

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

      tickDailyQuest: (type, amount) => {
        const today = getDailyQuestDate()
        const s = get()
        // Roll new quests if date changed
        let progress = s.dailyQuestProgress
        let claimed = s.dailyQuestsClaimed
        if (s.dailyQuestDate !== today) {
          progress = {}
          claimed = []
        }
        const quests = rollDailyQuests(today)
        const matching = quests.filter(q => q.type === type)
        if (matching.length === 0) return
        const newProgress = { ...progress }
        for (const q of matching) {
          newProgress[q.id] = Math.min((newProgress[q.id] ?? 0) + amount, q.target)
        }
        set({ dailyQuestDate: today, dailyQuestProgress: newProgress, dailyQuestsClaimed: claimed })
      },

      claimDailyQuest: (questId) => {
        const today = getDailyQuestDate()
        const s = get()
        const quests = rollDailyQuests(today)
        const quest = quests.find(q => q.id === questId)
        if (!quest) return { gold: 0, gems: 0 }
        const prog = s.dailyQuestProgress[questId] ?? 0
        if (prog < quest.target) return { gold: 0, gems: 0 }
        if (s.dailyQuestsClaimed.includes(questId)) return { gold: 0, gems: 0 }
        set(st => ({
          gold: st.gold + quest.rewardGold,
          gems: st.gems + quest.rewardGems,
          totalGoldEarned: st.totalGoldEarned + quest.rewardGold,
          dailyQuestsClaimed: [...st.dailyQuestsClaimed, questId],
        }))
        return { gold: quest.rewardGold, gems: quest.rewardGems }
      },

      checkQuestRollover: () => {
        const today = getDailyQuestDate()
        if (get().dailyQuestDate !== today) {
          set({ dailyQuestDate: today, dailyQuestProgress: {}, dailyQuestsClaimed: [] })
        }
      },

      unlockCosmetic: (id) =>
        set(s => ({
          ownedCosmeticIds: s.ownedCosmeticIds.includes(id)
            ? s.ownedCosmeticIds
            : [...s.ownedCosmeticIds, id],
        })),

      equipCosmetic: (id) => {
        const def = getCosmeticById(id)
        if (!def || !get().ownedCosmeticIds.includes(id)) return
        set(s => ({ equippedCosmetics: { ...s.equippedCosmetics, [def.type]: id } }))
      },

      advanceTutorialStep: () =>
        set(s => ({ tutorialStep: s.tutorialStep + 1 })),

      completeTutorial: () =>
        set({ tutorialStep: -1 }),

      setSoundMuted:  (v) => set({ soundMuted: v }),
      setSoundVolume: (v) => set({ soundVolume: Math.max(0, Math.min(1, v)) }),
      setMusicMuted:  (v) => set({ musicMuted: v }),
      setVfxReduced:  (v) => set({ vfxReduced: v }),

      updateHighestPower: (power) =>
        set(s => ({ highestPower: Math.max(s.highestPower, power) })),

      awardRunXp: (heroIds, xpTotal) => {
        const XP_THRESHOLDS = [0, 100, 250, 500, 800, 1200, 1800, 2500, 3500, 5000]
        const MAX_LEVEL = 10
        const leveled: string[] = []
        const xpPerHero = Math.round(xpTotal / Math.max(1, heroIds.length))
        const heroes = get().ownedHeroes
        const updated = heroes.map(h => {
          if (!heroIds.includes(h.id)) return h
          let { level, xp } = h
          xp += xpPerHero
          while (level < MAX_LEVEL && xp >= XP_THRESHOLDS[level]) {
            xp -= XP_THRESHOLDS[level]
            level++
            leveled.push(h.id)
          }
          return { ...h, level, xp }
        })
        set({ ownedHeroes: updated })
        return leveled
      },

      equipPet:   (id) => set({ equippedPetId: id }),
      equipMount: (id) => set(s => ({ equippedMountId: s.equippedMountId === id ? '' : id })),

      checkAchievements: () => {
        const s = get()
        const stats = {
          totalKills:       s.totalKills,
          totalRifts:       s.totalRifts,
          totalCapsulePulls:s.totalCapsulePulls,
          totalGoldEarned:  s.totalGoldEarned,
          highestPower:     s.highestPower,
          ownedHeroCount:   s.ownedHeroes.length,
          ownedGearCount:   s.ownedGear.length,
          squadFull:        s.squadHeroIds.filter(Boolean).length >= 3,
        }
        const newlyUnlocked = ACHIEVEMENTS
          .filter(a => !s.unlockedAchievements.includes(a.id) && a.check(stats))
          .map(a => a.id)
        if (newlyUnlocked.length > 0) {
          set(st => ({ unlockedAchievements: [...st.unlockedAchievements, ...newlyUnlocked] }))
        }
        return newlyUnlocked
      },
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
        dailyQuestDate: s.dailyQuestDate,
        dailyQuestProgress: s.dailyQuestProgress,
        dailyQuestsClaimed: s.dailyQuestsClaimed,
        ownedCosmeticIds: s.ownedCosmeticIds,
        equippedCosmetics: s.equippedCosmetics,
        tutorialStep:         s.tutorialStep,
        soundMuted:           s.soundMuted,
        soundVolume:          s.soundVolume,
        musicMuted:           s.musicMuted,
        vfxReduced:           s.vfxReduced,
        unlockedAchievements: s.unlockedAchievements,
        runHistory: s.runHistory,
        equippedPetId:   s.equippedPetId,
        equippedMountId: s.equippedMountId,
      }),
    }
  )
)
