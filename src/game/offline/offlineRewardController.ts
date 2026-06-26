import type { Rarity } from '@/constants/palette'

export interface OfflineReward {
  goldEarned: number
  gemsEarned: number
  shardEarned: number
  durationMs: number
  durationLabel: string
  lootItems: OfflineLootItem[]
}

export interface OfflineLootItem {
  id: string
  name: string
  rarity: Rarity
  type: 'gear' | 'shard' | 'gem'
}

const GOLD_PER_HOUR = 800
const GEM_PER_4H = 4
const SHARD_PER_6H = 2
const MAX_OFFLINE_HOURS = 8

const OFFLINE_LOOT_TABLE: Array<{ weight: number; rarity: Rarity; name: string; type: OfflineLootItem['type'] }> = [
  { weight: 40, rarity: 'common',   name: 'Iron Shard',    type: 'shard' },
  { weight: 30, rarity: 'uncommon', name: 'Steel Charm',   type: 'gear'  },
  { weight: 18, rarity: 'rare',     name: 'Rune Pendant',  type: 'gear'  },
  { weight: 8,  rarity: 'epic',     name: 'Void Crystal',  type: 'shard' },
  { weight: 3,  rarity: 'legendary',name: 'Star Fragment',  type: 'gem'   },
  { weight: 1,  rarity: 'mythic',   name: 'Prismatic Core', type: 'gem'  },
]

function rollOfflineLoot(count: number): OfflineLootItem[] {
  const totalWeight = OFFLINE_LOOT_TABLE.reduce((a, b) => a + b.weight, 0)
  const items: OfflineLootItem[] = []
  for (let i = 0; i < count; i++) {
    let r = Math.random() * totalWeight
    for (const entry of OFFLINE_LOOT_TABLE) {
      r -= entry.weight
      if (r <= 0) {
        items.push({ id: `offline_loot_${Date.now()}_${i}`, name: entry.name, rarity: entry.rarity, type: entry.type })
        break
      }
    }
  }
  return items
}

function formatDuration(ms: number): string {
  const totalMins = Math.floor(ms / 60_000)
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function calculateOfflineRewards(lastSeenTimestamp: number): OfflineReward {
  const now = Date.now()
  const rawMs = now - lastSeenTimestamp
  const cappedMs = Math.min(rawMs, MAX_OFFLINE_HOURS * 3_600_000)
  const hours = cappedMs / 3_600_000

  const goldEarned = Math.floor(GOLD_PER_HOUR * hours)
  const gemsEarned = Math.floor((hours / 4) * GEM_PER_4H)
  const shardEarned = Math.floor((hours / 6) * SHARD_PER_6H)

  // 0–1 loot items per 2 hours offline
  const lootCount = Math.min(3, Math.floor(hours / 2))
  const lootItems = rollOfflineLoot(lootCount)

  return {
    goldEarned,
    gemsEarned,
    shardEarned,
    durationMs: cappedMs,
    durationLabel: formatDuration(cappedMs),
    lootItems,
  }
}

export function isOfflineRewardSignificant(reward: OfflineReward): boolean {
  return reward.durationMs >= 60_000 // show if away 1+ minute
}
