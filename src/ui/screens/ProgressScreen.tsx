import { useState, useEffect } from 'react'
import RarityFrame from '@/ui/components/RarityFrame'
import SpriteCharacter from '@/ui/components/SpriteCharacter'
import MountCard from '@/ui/components/MountCard'
import PixelButton from '@/ui/components/PixelButton'
import petsData from '@/data/art/pets.visual.json'
import mountsData from '@/data/art/mounts.visual.json'
import { useGameStore } from '@/store/gameStore'
import {
  rollDailyQuests, getDailyQuestDate, buildActiveQuests,
} from '@/game/progression/dailyQuests'
import { COSMETICS } from '@/data/cosmeticsData'
import type { CosmeticType } from '@/data/cosmeticsData'
import type { Rarity } from '@/constants/palette'
import { emitCoinBurst, emitGemScatter } from '@/vfx/emitters'
import styles from './ProgressScreen.module.css'

const TABS = ['Pets', 'Mounts', 'Cosmetics', 'Stats', 'Achievements'] as const
type Tab = typeof TABS[number]

interface Achievement {
  id: string
  icon: string
  title: string
  desc: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  check: (s: AchievementStats) => boolean
  progress?: (s: AchievementStats) => { current: number; max: number }
}

interface AchievementStats {
  totalKills: number
  totalRifts: number
  totalCapsulePulls: number
  totalGoldEarned: number
  highestPower: number
  ownedHeroCount: number
  ownedGearCount: number
  squadFull: boolean
}

const ACHIEVEMENTS: Achievement[] = [
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

const RARITY_COLOR: Record<string, string> = {
  common: '#aabbcc', rare: '#4488ff', epic: '#cc44ff', legendary: '#ffd700',
}

export default function ProgressScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('Pets')
  const [selectedMount, setSelectedMount] = useState<string | null>(null)

  const totalRifts = useGameStore(s => s.totalRifts)
  const totalKills = useGameStore(s => s.totalKills)
  const totalGoldEarned = useGameStore(s => s.totalGoldEarned)
  const totalCapsulePulls = useGameStore(s => s.totalCapsulePulls)
  const highestPower = useGameStore(s => s.highestPower)
  const ownedHeroes = useGameStore(s => s.ownedHeroes)
  const ownedGear = useGameStore(s => s.ownedGear)
  const squadHeroIds = useGameStore(s => s.squadHeroIds)

  const dailyQuestDate = useGameStore(s => s.dailyQuestDate)
  const dailyQuestProgress = useGameStore(s => s.dailyQuestProgress)
  const dailyQuestsClaimed = useGameStore(s => s.dailyQuestsClaimed)
  const claimDailyQuest = useGameStore(s => s.claimDailyQuest)
  const checkQuestRollover = useGameStore(s => s.checkQuestRollover)
  const ownedCosmeticIds = useGameStore(s => s.ownedCosmeticIds)
  const equippedCosmetics = useGameStore(s => s.equippedCosmetics)
  const equipCosmetic = useGameStore(s => s.equipCosmetic)

  useEffect(() => { checkQuestRollover() }, [])

  const today = getDailyQuestDate()
  const activeQuestDefs = rollDailyQuests(today)
  const activeQuests = buildActiveQuests(
    activeQuestDefs,
    dailyQuestDate === today ? dailyQuestProgress : {},
    dailyQuestDate === today ? dailyQuestsClaimed : [],
  )
  const questsCompleted = activeQuests.filter(q => q.progress >= q.target && !q.claimed).length
  const questsTotalDone = activeQuests.filter(q => q.claimed).length

  const achieveStats: AchievementStats = {
    totalKills,
    totalRifts,
    totalCapsulePulls,
    totalGoldEarned,
    highestPower,
    ownedHeroCount: ownedHeroes.length,
    ownedGearCount: ownedGear.length,
    squadFull: squadHeroIds.filter(Boolean).length >= 3,
  }
  const completedCount = ACHIEVEMENTS.filter(a => a.check(achieveStats)).length

  return (
    <div className={styles.screen}>
      <div className={styles.tabs}>
        {TABS.map(t => (
          <button
            key={t}
            className={`${styles.tab} ${activeTab === t ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'Pets' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>COMPANIONS</span>
            <span className={styles.sectionCount}>{petsData.pets.length} / {petsData.pets.length}</span>
          </div>
          <div className={styles.petGrid}>
            {petsData.pets.map(pet => (
              <div key={pet.id} className={styles.petCard}>
                <RarityFrame rarity={pet.rarity as Rarity} size={60} animate>
                  <SpriteCharacter
                    assetId={pet.id}
                    rarity={pet.rarity as Rarity}
                    size={48}
                    animate
                  />
                </RarityFrame>
                <span className={styles.petName}>{pet.displayName}</span>
                <span className={styles.petRarity} data-rarity={pet.rarity}>
                  {pet.rarity.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Mounts' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>MOUNTS</span>
            <span className={styles.sectionCount}>{mountsData.mounts.length} total</span>
          </div>
          <div className={styles.mountGrid}>
            {mountsData.mounts.map(mount => (
              <MountCard
                key={mount.id}
                mount={mount}
                owned
                selected={selectedMount === mount.id}
                onClick={() => setSelectedMount(mount.id === selectedMount ? null : mount.id)}
              />
            ))}
          </div>
          {selectedMount && (() => {
            const m = mountsData.mounts.find(x => x.id === selectedMount)
            if (!m) return null
            return (
              <div className={styles.mountDetail}>
                <div className={styles.mountDetailName}>{m.displayName}</div>
                <div className={styles.mountDetailRow}>
                  <span className={styles.mountDetailLabel}>Idle effect</span>
                  <span className={styles.mountDetailValue}>{m.idleEffect.replace(/_/g, ' ')}</span>
                </div>
                <div className={styles.mountDetailRow}>
                  <span className={styles.mountDetailLabel}>Element</span>
                  <span className={styles.mountDetailValue}>{m.element}</span>
                </div>
                <div className={styles.mountDetailRow}>
                  <span className={styles.mountDetailLabel}>Source</span>
                  <span className={styles.mountDetailValue}>{m.unlockSource.replace(/_/g, ' ')}</span>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {activeTab === 'Cosmetics' && (
        <div className={styles.section}>
          {(['trail', 'frame', 'capsule'] as CosmeticType[]).map(type => {
            const typeCos = COSMETICS.filter(c => c.type === type)
            const typeLabel = type === 'trail' ? 'TRAILS' : type === 'frame' ? 'FRAMES' : 'CAPSULE SKINS'
            return (
              <div key={type} className={styles.cosmeticTypeSection}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionTitle}>{typeLabel}</span>
                  <span className={styles.sectionCount}>
                    {typeCos.filter(c => ownedCosmeticIds.includes(c.id)).length} / {typeCos.length}
                  </span>
                </div>
                <div className={styles.cosmeticGrid}>
                  {typeCos.map(c => {
                    const owned = ownedCosmeticIds.includes(c.id)
                    const equipped = equippedCosmetics?.[type] === c.id
                    const rarityColor = RARITY_COLOR[c.rarity]
                    return (
                      <div
                        key={c.id}
                        className={[
                          styles.cosmeticCard,
                          equipped ? styles.cosmeticEquipped : owned ? styles.cosmeticOwned : styles.cosmeticLocked,
                        ].join(' ')}
                        style={equipped ? { borderColor: rarityColor, boxShadow: `0 0 10px ${rarityColor}44` } : undefined}
                        onClick={() => { if (owned && !equipped) equipCosmetic(c.id) }}
                      >
                        <div className={styles.cosmeticIcon}>{c.icon}</div>
                        <div className={styles.cosmeticName} style={{ color: owned ? rarityColor : undefined }}>
                          {c.displayName}
                        </div>
                        <div className={styles.cosmeticDesc}>{c.description}</div>
                        <div className={styles.cosmeticRarityBadge} style={{ color: rarityColor }}>
                          {c.rarity.toUpperCase()}
                        </div>
                        {equipped ? (
                          <span className={styles.cosmeticEquippedBadge}>✓ EQUIPPED</span>
                        ) : owned ? (
                          <PixelButton variant="secondary" size="sm" onClick={() => equipCosmetic(c.id)}>
                            EQUIP
                          </PixelButton>
                        ) : (
                          <span className={styles.cosmeticLockedBadge}>🔒</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'Stats' && (
        <div className={styles.section}>
          {/* Daily quests */}
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>DAILY QUESTS</span>
            <span className={styles.sectionCount}>{questsTotalDone} / {activeQuests.length} done</span>
          </div>
          <div className={styles.questList}>
            {activeQuests.map(q => {
              const pct = Math.round((q.progress / q.target) * 100)
              const ready = q.progress >= q.target && !q.claimed
              return (
                <div
                  key={q.id}
                  className={`${styles.questCard} ${q.claimed ? styles.questClaimed : ready ? styles.questReady : ''}`}
                >
                  <div className={styles.questBody}>
                    <div className={styles.questLabel}>{q.label}</div>
                    <div className={styles.questRewards}>
                      {q.rewardGold > 0 && <span className={styles.questReward} style={{ color: '#ffd700' }}>+{q.rewardGold.toLocaleString()} 💰</span>}
                      {q.rewardGems > 0 && <span className={styles.questReward} style={{ color: '#aa44ff' }}>+{q.rewardGems} 💎</span>}
                    </div>
                    {!q.claimed && (
                      <div className={styles.questProgress}>
                        <div className={styles.questTrack}>
                          <div className={styles.questFill} style={{ width: `${pct}%` }} />
                        </div>
                        <span className={styles.questPct}>{q.progress.toLocaleString()} / {q.target.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  {q.claimed ? (
                    <span className={styles.questCheck}>✓</span>
                  ) : ready ? (
                    <PixelButton
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const reward = claimDailyQuest(q.id)
                        const cx = window.innerWidth / 2, cy = window.innerHeight / 2
                        if (reward.gold) emitCoinBurst({ x: cx, y: cy }, 15)
                        if (reward.gems) emitGemScatter({ x: cx, y: cy }, reward.gems)
                      }}
                    >
                      CLAIM
                    </PixelButton>
                  ) : null}
                </div>
              )
            })}
          </div>

          <div className={styles.sectionHeader} style={{ marginTop: 8 }}>
            <span className={styles.sectionTitle}>LIFETIME STATS</span>
          </div>
          <div className={styles.statList}>
            {[
              { label: 'Total Rifts', value: totalRifts.toLocaleString() },
              { label: 'Enemies Slain', value: totalKills.toLocaleString() },
              { label: 'Heroes Owned', value: ownedHeroes.length.toLocaleString() },
              { label: 'Gold Collected', value: totalGoldEarned.toLocaleString() },
              { label: 'Capsules Pulled', value: totalCapsulePulls.toLocaleString() },
              { label: 'Highest Power', value: highestPower.toLocaleString() },
            ].map(({ label, value }) => (
              <div key={label} className={styles.statRow}>
                <span className={styles.statLabel}>{label}</span>
                <strong className={styles.statValue}>{value}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Achievements' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>ACHIEVEMENTS</span>
            <span className={styles.sectionCount}>{completedCount} / {ACHIEVEMENTS.length}</span>
          </div>
          <div className={styles.achieveList}>
            {ACHIEVEMENTS.map(a => {
              const done = a.check(achieveStats)
              const prog = a.progress?.(achieveStats)
              const pct = prog ? Math.round((prog.current / prog.max) * 100) : (done ? 100 : 0)
              const color = RARITY_COLOR[a.rarity]
              return (
                <div
                  key={a.id}
                  className={`${styles.achieveCard} ${done ? styles.achieveDone : styles.achieveLocked}`}
                  style={done ? { borderColor: color, boxShadow: `0 0 6px ${color}44` } : undefined}
                >
                  <div className={styles.achieveIcon} style={{ opacity: done ? 1 : 0.35 }}>{a.icon}</div>
                  <div className={styles.achieveBody}>
                    <div className={styles.achieveTitle} style={{ color: done ? color : undefined }}>
                      {a.title}
                      {done && <span className={styles.achieveCheck}> ✓</span>}
                    </div>
                    <div className={styles.achieveDesc}>{a.desc}</div>
                    {!done && prog && (
                      <div className={styles.achieveProgress}>
                        <div className={styles.achieveTrack}>
                          <div className={styles.achieveFill} style={{ width: `${pct}%`, background: color }} />
                        </div>
                        <span className={styles.achievePct}>{prog.current.toLocaleString()} / {prog.max.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.achieveRarity} style={{ color, opacity: done ? 1 : 0.5 }}>
                    {a.rarity.toUpperCase()}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
