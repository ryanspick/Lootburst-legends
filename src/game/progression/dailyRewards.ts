export interface DayReward {
  day: number
  gold: number
  gems: number
  keys: number
  gearId: string | null
  label: string
  isJackpot?: boolean
}

export const DAILY_REWARDS: DayReward[] = [
  { day: 1, gold: 200,  gems: 0,   keys: 1, gearId: null,                       label: '200 💰 + 1 🔑' },
  { day: 2, gold: 350,  gems: 5,   keys: 1, gearId: null,                       label: '350 💰 + 5 💎' },
  { day: 3, gold: 600,  gems: 10,  keys: 1, gearId: null,                       label: '600 💰 + 10 💎' },
  { day: 4, gold: 1000, gems: 15,  keys: 2, gearId: null,                       label: '1,000 💰 + 15 💎' },
  { day: 5, gold: 1500, gems: 25,  keys: 2, gearId: 'gear_storm_band',          label: '1,500 💰 + 25 💎 + RARE GEAR' },
  { day: 6, gold: 2500, gems: 40,  keys: 3, gearId: null,                       label: '2,500 💰 + 40 💎' },
  { day: 7, gold: 5000, gems: 100, keys: 3, gearId: 'gear_boss_tooth_necklace', label: '5,000 💰 + 100 💎 + EPIC GEAR', isJackpot: true },
]

export const CHEST_COOLDOWN_MS = 24 * 3_600_000
export const STREAK_GRACE_MS   = 48 * 3_600_000  // streak breaks if unclaimed for 2 days
export const FREE_KEY_CD_MS    =  8 * 3_600_000   // 1 free key every 8h

export function getRewardForStreak(streak: number): DayReward {
  return DAILY_REWARDS[Math.max(0, (streak - 1) % DAILY_REWARDS.length)]
}

export function getNextReward(streak: number): DayReward {
  return DAILY_REWARDS[streak % DAILY_REWARDS.length]
}

// ── Post-run offers ────────────────────────────────────────────────────────────

export type OfferType = 'free' | 'paid'

export interface PostRunOffer {
  id: string
  type: OfferType
  icon: string
  title: string
  subtitle: string
  items: string[]
  price?: string
  gold?: number
  gems?: number
  keys?: number
  gearId?: string
  expiresInMs: number
}

const FREE_OFFERS: Omit<PostRunOffer, 'expiresInMs'>[] = [
  {
    id: 'free_bonus_haul',   type: 'free', icon: '🎁',
    title: 'BONUS HAUL!',   subtitle: 'Looted from the rift shadows',
    items: ['150 💰 Gold', '8 💎 Gems'],
    gold: 150, gems: 8,
  },
  {
    id: 'free_lucky_drop',  type: 'free', icon: '🍀',
    title: 'LUCKY DROP!',   subtitle: 'The Rift smiles upon you',
    items: ['Rare Gear Fragment', '5 💎 Gems'],
    gearId: 'gear_lucky_frog_coin', gems: 5,
  },
  {
    id: 'free_battle_bonus', type: 'free', icon: '⚡',
    title: 'BATTLE BONUS!', subtitle: 'Victory spoils from deep rift',
    items: ['200 💰 Gold', '1 🔑 Key'],
    gold: 200, keys: 1,
  },
]

const PAID_OFFERS: Omit<PostRunOffer, 'expiresInMs'>[] = [
  {
    id: 'paid_run_boost',    type: 'paid', icon: '🔥',
    title: 'RUN BOOSTER!',  subtitle: 'ONE-TIME deal — gone in seconds',
    items: ['500 💎 Gems', '3 🔑 Keys', '+25% Gold next 5 runs'],
    price: '$0.99',  gems: 500,
  },
  {
    id: 'paid_victory_pack', type: 'paid', icon: '🏆',
    title: 'VICTORY PACK!', subtitle: 'Claim your champion\'s reward',
    items: ['1,200 💎 Gems', '5,000 💰 Gold', '1 Rare Gear'],
    price: '$1.99',  gems: 1200, gold: 5000, gearId: 'gear_crystal_spike',
  },
  {
    id: 'paid_power_surge',  type: 'paid', icon: '💥',
    title: 'POWER SURGE!',  subtitle: 'Limited. Will not appear again soon.',
    items: ['800 💎 Gems', 'Epic Gear Token'],
    price: '$0.99',  gems: 800, gearId: 'gear_infernal_core',
  },
]

export function rollPostRunOffer(runKills: number): PostRunOffer | null {
  // 45% chance overall; higher kill count = slightly better odds
  const chance = Math.min(0.6, 0.35 + runKills * 0.002)
  if (Math.random() > chance) return null

  // 55% free / 45% paid
  const pool = Math.random() < 0.55 ? FREE_OFFERS : PAID_OFFERS
  const base = pool[Math.floor(Math.random() * pool.length)]
  return { ...base, expiresInMs: 30_000 }
}
