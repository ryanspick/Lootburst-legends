export type QuestType = 'kills' | 'rifts' | 'pulls' | 'gold_earned'

export interface QuestDef {
  id: string
  type: QuestType
  label: string
  target: number
  rewardGold: number
  rewardGems: number
}

export interface ActiveQuest extends QuestDef {
  progress: number
  claimed: boolean
}

const QUEST_POOL: QuestDef[] = [
  { id: 'q_kills_15',    type: 'kills',      label: 'Defeat 15 enemies',           target: 15,     rewardGold: 350,   rewardGems: 5  },
  { id: 'q_kills_40',    type: 'kills',      label: 'Defeat 40 enemies',           target: 40,     rewardGold: 700,   rewardGems: 8  },
  { id: 'q_kills_90',    type: 'kills',      label: 'Defeat 90 enemies',           target: 90,     rewardGold: 400,   rewardGems: 18 },
  { id: 'q_kills_180',   type: 'kills',      label: 'Slay 180 enemies',            target: 180,    rewardGold: 1300,  rewardGems: 24 },
  { id: 'q_rifts_1',     type: 'rifts',      label: 'Complete 1 rift run',         target: 1,      rewardGold: 350,   rewardGems: 8  },
  { id: 'q_rifts_3',     type: 'rifts',      label: 'Complete 3 rift runs',        target: 3,      rewardGold: 700,   rewardGems: 14 },
  { id: 'q_rifts_5',     type: 'rifts',      label: 'Complete 5 rift runs',        target: 5,      rewardGold: 500,   rewardGems: 30 },
  { id: 'q_pulls_1',     type: 'pulls',      label: 'Open 1 capsule',              target: 1,      rewardGold: 250,   rewardGems: 5  },
  { id: 'q_pulls_3',     type: 'pulls',      label: 'Open 3 capsules',             target: 3,      rewardGold: 400,   rewardGems: 12 },
  { id: 'q_pulls_10',    type: 'pulls',      label: 'Open 10 capsules',            target: 10,     rewardGold: 0,     rewardGems: 30 },
  { id: 'q_gold_800',    type: 'gold_earned',label: 'Earn 800 gold in rifts',      target: 800,    rewardGold: 200,   rewardGems: 8  },
  { id: 'q_gold_4k',     type: 'gold_earned',label: 'Earn 4,000 gold in rifts',    target: 4000,   rewardGold: 300,   rewardGems: 22 },
  { id: 'q_gold_9k',     type: 'gold_earned',label: 'Earn 9,000 gold today',       target: 9000,   rewardGold: 700,   rewardGems: 34 },
]

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

export function getDailyQuestDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export function rollDailyQuests(dateSeed: string): QuestDef[] {
  let hash = 0
  for (let i = 0; i < dateSeed.length; i++) {
    hash = (hash * 31 + dateSeed.charCodeAt(i)) | 0
  }
  const rng = seededRandom(Math.abs(hash))
  const pool = [...QUEST_POOL]
  const picked: QuestDef[] = []
  while (picked.length < 3 && pool.length > 0) {
    const idx = Math.floor(rng() * pool.length)
    picked.push(pool.splice(idx, 1)[0])
  }
  return picked
}

export function buildActiveQuests(
  defs: QuestDef[],
  progress: Record<string, number>,
  claimed: string[],
): ActiveQuest[] {
  return defs.map(def => ({
    ...def,
    progress: Math.min(progress[def.id] ?? 0, def.target),
    claimed: claimed.includes(def.id),
  }))
}
