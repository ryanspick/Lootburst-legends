import type { Rarity } from '@/constants/palette'

export type RiftPhase =
  | 'idle'
  | 'countdown'
  | 'combat'
  | 'upgrade_choice'
  | 'boss_warning'
  | 'post_run'

export type TimelineEventType =
  | 'wave_spawn'
  | 'upgrade_choice'
  | 'boss_warning'
  | 'mid_boss'
  | 'final_boss'
  | 'end_run'

export interface CombatEntity {
  id: string
  displayName: string
  hp: number
  maxHp: number
  atk: number
  def: number
  spd: number
  x: number
  y: number
  rarity: Rarity
  role: 'hero' | 'enemy' | 'boss'
  element: string
  assetId: string
  spriteDataUrl: string | null
  alive: boolean
  hitstunMs: number      // enemies use this as attack cooldown
  flashMs: number
  deathAnimMs: number
  // Hero ability cooldowns (0 on enemies/boss)
  basicCdMs: number
  skillCdMs: number
  ultimateCdMs: number
  // Boss-only
  enraged?: boolean
  enrageTriggered?: boolean
}

export interface Projectile {
  id: number
  heroId: string
  targetId: string       // entity instance id to look up on arrival
  fromX: number
  fromY: number
  toX: number
  toY: number
  progress: number       // 0 → 1
  totalMs: number        // travel time in ms
  elapsedMs: number
  dmg: number
  isCrit: boolean
  element: string
  abilityType: 'basic' | 'skill' | 'ultimate'
  aoe: boolean
}

export interface DamageNumber {
  id: number
  x: number
  y: number
  value: number
  isCrit: boolean
  color: string
  lifeMs: number
  maxLifeMs: number
  label?: string         // prefix override: '★' for ultimates, '✦' for crits
}

export interface LootDrop {
  id: number
  x: number
  y: number
  targetX: number
  targetY: number
  type: 'coin' | 'gem' | 'item'
  rarity: Rarity
  value: number
  collected: boolean
  lifeMs: number
}

export interface UpgradeCard {
  id: string
  title: string
  description: string
  icon: string
  rarity: Rarity
  apply: (state: RiftRunState) => void
}

export interface UpgradeChoice {
  cards: UpgradeCard[]
  pickedId: string | null
}

export interface AbilityAnnounce {
  x: number
  y: number
  text: string
  color: string
  lifeMs: number
  maxLifeMs: number
}

export interface PostRunReward {
  goldEarned: number
  gemsEarned: number
  xpEarned: number
  lootItems: Array<{ id: string; rarity: Rarity; name: string }>
  heroesLeveled: string[]
  newRecords: string[]
  wasWipe: boolean
  elapsedMs: number
  tierLevel: number
}

export interface RiftRunState {
  phase: RiftPhase
  timeMs: number
  elapsedMs: number

  heroes: CombatEntity[]
  enemies: CombatEntity[]
  boss: CombatEntity | null

  projectiles: Projectile[]
  damageNumbers: DamageNumber[]
  lootDrops: LootDrop[]
  abilityAnnounces: AbilityAnnounce[]
  impactFlashMs: number
  impactFlashColor: string

  waveIndex: number
  killCount: number
  goldCollected: number

  totalDamageDealt: number
  totalDamageReceived: number

  upgradeChoice: UpgradeChoice | null
  appliedUpgrades: string[]

  bossWarningId: string | null
  bossWarningTimeMs: number

  postRun: PostRunReward | null

  // Upgrade stat modifiers
  atkMult: number
  defMult: number
  spdMult: number
  critChance: number
  critMult: number
  goldMult: number
  lifeSteal: number
  aoeChance: number

  // Meta-progression / run options
  difficultyMult: number
  reviveUsed: boolean
  hasReviveToken: boolean

  // Rift tier
  riftTierLevel: number
  rewardMult: number

  // Boss phase tracking (React reads this for BossHpBar)
  bossPhase: 1 | 2

  // Trickle-spawn queue — populated by spawnWave, drained gradually in tickCombat
  pendingSpawns: PendingSpawn[]
  spawnTimerMs:  number

  // Pet companion — fires combat effects on a cooldown
  activePetId:    string
  petCooldownMs:  number
  petBonusLoot:   boolean  // loot_magnet passive: adds extra loot item

  // Equipped mount — bonus applied once at run start
  activeMountId: string

  // Active zone id — drives enemy pool selection per wave
  activeZoneId: string
}

export interface TimelineEvent {
  atMs: number
  type: TimelineEventType
  data?: Record<string, unknown>
  fired: boolean
}

export interface PendingSpawn {
  enemyId:  string
  x:        number
  y:        number
  diffMult: number
  hpMult:   number  // wave-progression HP scalar (1.0 for wave 1, up to 2.35 for wave 5)
}
