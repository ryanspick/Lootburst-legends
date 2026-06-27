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
  { id: 'q_kills_20',    type: 'kills',      label: 'Defeat 20 enemies',           target: 20,     rewardGold: 300,   rewardGems: 0  },
  { id: 'q_kills_50',    type: 'kills',      label: 'Defeat 50 enemies',           target: 50,     rewardGold: 600,   rewardGems: 5  },
  { id: 'q_kills_100',   type: 'kills',      label: 'Defeat 100 enemies',          target: 100,    rewardGold: 0,     rewardGems: 15 },
  { id: 'q_kills_200',   type: 'kills',      label: 'Slay 200 enemies',            target: 200,    rewardGold: 1000,  rewardGems: 20 },
  { id: 'q_rifts_1',     type: 'rifts',      label: 'Complete 1 rift run',         target: 1,      rewardGold: 200,   rewardGems: 5  },
  { id: 'q_rifts_3',     type: 'rifts',      label: 'Complete 3 rift runs',        target: 3,      rewardGold: 500,   rewardGems: 10 },
  { id: 'q_rifts_5',     type: 'rifts',      label: 'Complete 5 rift runs',        target: 5,      rewardGold: 0,     rewardGems: 25 },
  { id: 'q_pulls_1',     type: 'pulls',      label: 'Open 1 capsule',              target: 1,      rewardGold: 150,   rewardGems: 0  },
  { id: 'q_pulls_3',     type: 'pulls',      label: 'Open 3 capsules',             target: 3,      rewardGold: 300,   rewardGems: 10 },
  { id: 'q_pulls_10',    type: 'pulls',      label: 'Open 10 capsules',            target: 10,     rewardGold: 0,     rewardGems: 30 },
  { id: 'q_gold_1k',     type: 'gold_earned',label: 'Earn 1,000 gold in rifts',    target: 1000,   rewardGold: 0,     rewardGems: 8  },
  { id: 'q_gold_5k',     type: 'gold_earned',label: 'Earn 5,000 gold in rifts',    target: 5000,   rewardGold: 0,     rewardGems: 20 },
  { id: 'q_gold_10k',    type: 'gold_earned',label: 'Earn 10,000 gold today',      target: 10000,  rewardGold: 500,   rewardGems: 30 },
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
