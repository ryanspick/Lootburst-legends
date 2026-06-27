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
import { ACHIEVEMENTS, RARITY_COLOR, type AchievementStats } from '@/data/achievementsData'
import styles from './ProgressScreen.module.css'

const TABS = ['Pets', 'Mounts', 'Cosmetics', 'Stats', 'Achievements'] as const
type Tab = typeof TABS[number]

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
