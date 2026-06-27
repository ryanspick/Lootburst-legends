export interface AchievementStats {
  totalKills: number
  totalRifts: number
  totalCapsulePulls: number
  totalGoldEarned: number
  highestPower: number
  ownedHeroCount: number
  ownedGearCount: number
  squadFull: boolean
}

export interface Achievement {
  id: string
  icon: string
  title: string
  desc: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  check: (s: AchievementStats) => boolean
  progress?: (s: AchievementStats) => { current: number; max: number }
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_blood',      icon: '⚔️',  title: 'First Blood',       desc: 'Defeat your first enemy',      rarity: 'common',    check: s => s.totalKills >= 1,          progress: s => ({ current: Math.min(s.totalKills, 1), max: 1 }) },
  { id: 'slayer',           icon: '💀',  title: 'Slayer',            desc: 'Defeat 100 enemies',           rarity: 'common',    check: s => s.totalKills >= 100,        progress: s => ({ current: Math.min(s.totalKills, 100), max: 100 }) },
  { id: 'executioner',      icon: '🔪',  title: 'Executioner',       desc: 'Defeat 1,000 enemies',         rarity: 'rare',      check: s => s.totalKills >= 1000,       progress: s => ({ current: Math.min(s.totalKills, 1000), max: 1000 }) },
  { id: 'mass_destruction', icon: '💥',  title: 'Mass Destruction',  desc: 'Defeat 10,000 enemies',        rarity: 'epic',      check: s => s.totalKills >= 10000,      progress: s => ({ current: Math.min(s.totalKills, 10000), max: 10000 }) },
  { id: 'first_rift',       icon: '🌀',  title: 'Rift Opener',       desc: 'Complete your first rift',     rarity: 'common',    check: s => s.totalRifts >= 1,          progress: s => ({ current: Math.min(s.totalRifts, 1), max: 1 }) },
  { id: 'rift_veteran',     icon: '🏆',  title: 'Rift Veteran',      desc: 'Complete 10 rifts',            rarity: 'rare',      check: s => s.totalRifts >= 10,         progress: s => ({ current: Math.min(s.totalRifts, 10), max: 10 }) },
  { id: 'rift_master',      icon: '👑',  title: 'Rift Master',       desc: 'Complete 100 rifts',           rarity: 'epic',      check: s => s.totalRifts >= 100,        progress: s => ({ current: Math.min(s.totalRifts, 100), max: 100 }) },
  { id: 'rift_legend',      icon: '🌟',  title: 'Rift Legend',       desc: 'Complete 1,000 rifts',         rarity: 'legendary', check: s => s.totalRifts >= 1000,       progress: s => ({ current: Math.min(s.totalRifts, 1000), max: 1000 }) },
  { id: 'first_pull',       icon: '🔮',  title: 'First Pull',        desc: 'Open your first capsule',      rarity: 'common',    check: s => s.totalCapsulePulls >= 1,   progress: s => ({ current: Math.min(s.totalCapsulePulls, 1), max: 1 }) },
  { id: 'gacha_fan',        icon: '🎰',  title: 'Gacha Fan',         desc: 'Pull 50 capsules',             rarity: 'rare',      check: s => s.totalCapsulePulls >= 50,  progress: s => ({ current: Math.min(s.totalCapsulePulls, 50), max: 50 }) },
  { id: 'capsule_whale',    icon: '🐋',  title: 'Capsule Whale',     desc: 'Pull 500 capsules',            rarity: 'legendary', check: s => s.totalCapsulePulls >= 500, progress: s => ({ current: Math.min(s.totalCapsulePulls, 500), max: 500 }) },
  { id: 'squad_captain',    icon: '🛡',  title: 'Squad Captain',     desc: 'Fill all 3 squad slots',       rarity: 'common',    check: s => s.squadFull },
  { id: 'hero_collector',   icon: '📚',  title: 'Hero Collector',    desc: 'Own 5 heroes',                 rarity: 'rare',      check: s => s.ownedHeroCount >= 5,      progress: s => ({ current: Math.min(s.ownedHeroCount, 5), max: 5 }) },
  { id: 'roster_master',    icon: '🎖',  title: 'Roster Master',     desc: 'Own 15 heroes',                rarity: 'epic',      check: s => s.ownedHeroCount >= 15,     progress: s => ({ current: Math.min(s.ownedHeroCount, 15), max: 15 }) },
  { id: 'gold_hoarder',     icon: '💰',  title: 'Gold Hoarder',      desc: 'Earn 100,000 gold lifetime',   rarity: 'rare',      check: s => s.totalGoldEarned >= 100000,   progress: s => ({ current: Math.min(s.totalGoldEarned, 100000), max: 100000 }) },
  { id: 'gold_baron',       icon: '🏅',  title: 'Gold Baron',        desc: 'Earn 1,000,000 gold lifetime', rarity: 'epic',      check: s => s.totalGoldEarned >= 1000000,  progress: s => ({ current: Math.min(s.totalGoldEarned, 1000000), max: 1000000 }) },
  { id: 'gearing_up',       icon: '⚙️',  title: 'Gearing Up',        desc: 'Collect your first gear',      rarity: 'common',    check: s => s.ownedGearCount >= 1 },
  { id: 'power_player',     icon: '⚡',  title: 'Power Player',      desc: 'Reach 5,000 squad power',      rarity: 'epic',      check: s => s.highestPower >= 5000,     progress: s => ({ current: Math.min(s.highestPower, 5000), max: 5000 }) },
]

export const RARITY_COLOR: Record<string, string> = {
  common: '#aabbcc', rare: '#4488ff', epic: '#cc44ff', legendary: '#ffd700',
}

export function buildAchievementStats(s: {
  totalKills: number
  totalRifts: number
  totalCapsulePulls: number
  totalGoldEarned: number
  highestPower: number
  ownedHeroCount: number
  ownedGearCount: number
  squadFull: boolean
}): AchievementStats {
  return s
}
