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
  { day: 1, gold: 350,  gems: 5,   keys: 2, gearId: null,                       label: '350 Gold + 5 Gems + 2 Keys' },
  { day: 2, gold: 600,  gems: 10,  keys: 1, gearId: null,                       label: '600 Gold + 10 Gems + 1 Key' },
  { day: 3, gold: 900,  gems: 15,  keys: 2, gearId: null,                       label: '900 Gold + 15 Gems + 2 Keys' },
  { day: 4, gold: 1400, gems: 20,  keys: 2, gearId: null,                       label: '1,400 Gold + 20 Gems + 2 Keys' },
  { day: 5, gold: 2200, gems: 35,  keys: 2, gearId: 'gear_storm_band',          label: '2,200 Gold + 35 Gems + Rare Gear' },
  { day: 6, gold: 3500, gems: 55,  keys: 3, gearId: null,                       label: '3,500 Gold + 55 Gems + 3 Keys' },
  { day: 7, gold: 6500, gems: 120, keys: 4, gearId: 'gear_boss_tooth_necklace', label: '6,500 Gold + 120 Gems + Epic Gear', isJackpot: true },
]

export const CHEST_COOLDOWN_MS = 24 * 3_600_000
export const STREAK_GRACE_MS   = 48 * 3_600_000
export const FREE_KEY_CD_MS    =  6 * 3_600_000

const POST_RUN_OFFER_EXPIRES_MS = 90_000

export function getRewardForStreak(streak: number): DayReward {
  return DAILY_REWARDS[Math.max(0, (streak - 1) % DAILY_REWARDS.length)]
}

export function getNextReward(streak: number): DayReward {
  return DAILY_REWARDS[streak % DAILY_REWARDS.length]
}

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
    id: 'free_bonus_haul', type: 'free', icon: '$',
    title: 'BONUS HAUL!', subtitle: 'Extra supplies recovered from the rift',
    items: ['420 Gold', '14 Gems'],
    gold: 420, gems: 14,
  },
  {
    id: 'free_lucky_drop', type: 'free', icon: '*',
    title: 'LUCKY DROP!', subtitle: 'A clean hit shook something loose',
    items: ['Lucky Frog Coin', '12 Gems'],
    gearId: 'gear_lucky_frog_coin', gems: 12,
  },
  {
    id: 'free_battle_bonus', type: 'free', icon: '+',
    title: 'BATTLE BONUS!', subtitle: 'Momentum reward for the next push',
    items: ['500 Gold', '1 Key'],
    gold: 500, keys: 1,
  },
]

const PAID_OFFERS: Omit<PostRunOffer, 'expiresInMs'>[] = [
  {
    id: 'paid_run_boost', type: 'paid', icon: '^',
    title: 'RUN BOOSTER!', subtitle: 'Optional supplies for your next push',
    items: ['650 Gems', '3 Keys', '+30% Gold for 5 runs'],
    price: '$0.99', gems: 650, keys: 3,
  },
  {
    id: 'paid_victory_pack', type: 'paid', icon: '#',
    title: 'VICTORY PACK!', subtitle: 'A compact kit for deeper rifts',
    items: ['1,250 Gems', '7,500 Gold', '1 Rare Gear'],
    price: '$1.99', gems: 1250, gold: 7500, gearId: 'gear_crystal_spike',
  },
  {
    id: 'paid_power_surge', type: 'paid', icon: '!',
    title: 'POWER SURGE!', subtitle: 'A stronger kit for tougher rifts',
    items: ['850 Gems', 'Epic Gear Token'],
    price: '$0.99', gems: 850, gearId: 'gear_infernal_core',
  },
]

const WIPE_OFFERS: Omit<PostRunOffer, 'expiresInMs'>[] = [
  {
    id: 'paid_second_chance', type: 'paid', icon: '+',
    title: 'CLOSE CALL!', subtitle: 'Optional recovery supplies for the next run',
    items: ['550 Gems', 'Revive Token', '+20% ATK boost'],
    price: '$0.99', gems: 550,
  },
  {
    id: 'paid_power_up_now', type: 'paid', icon: '^',
    title: 'REGROUP KIT', subtitle: 'Gear and keys for a stronger rematch',
    items: ['1,100 Gems', 'Epic Gear', '2 Keys'],
    price: '$1.99', gems: 1100, keys: 2, gearId: 'gear_void_shard',
  },
]

export interface PostRunOfferOptions {
  heroesDied?: boolean
  riftsBeat?: number
}

function withExpiry(base: Omit<PostRunOffer, 'expiresInMs'>): PostRunOffer {
  return { ...base, expiresInMs: POST_RUN_OFFER_EXPIRES_MS }
}

export function rollPostRunOffer(runKills: number, opts: PostRunOfferOptions = {}): PostRunOffer | null {
  const { heroesDied = false, riftsBeat = 0 } = opts

  if (heroesDied) {
    const earlyGame = riftsBeat < 5
    const chance = earlyGame ? 0.80 : 0.55
    if (Math.random() >= chance) return null
    const pool = earlyGame ? FREE_OFFERS : WIPE_OFFERS
    return withExpiry(pool[Math.floor(Math.random() * pool.length)])
  }

  if (riftsBeat < 5) {
    if (Math.random() < 0.80) {
      return withExpiry(FREE_OFFERS[Math.floor(Math.random() * FREE_OFFERS.length)])
    }
    return null
  }

  const chance = Math.min(0.55, 0.32 + Math.max(0, runKills) * 0.0015)
  if (Math.random() > chance) return null

  const paidChance = Math.min(0.50, 0.35 + Math.max(0, riftsBeat - 5) * 0.01)
  const pool = Math.random() < paidChance ? PAID_OFFERS : FREE_OFFERS
  return withExpiry(pool[Math.floor(Math.random() * pool.length)])
}
