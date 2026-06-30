import { useEffect, useRef, useState } from 'react'
import PixelButton from '@/ui/components/PixelButton'
import SpriteCharacter from '@/ui/components/SpriteCharacter'
import SparkleLayer from '@/ui/components/SparkleLayer'
import ZoneBackground from '@/ui/components/ZoneBackground'
import PetCompanion from '@/ui/components/PetCompanion'
import { pulse } from '@/animation/motionPrimitives'
import { heroIdleBob, chestPulse, iconBob } from '@/animation/idleMotion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { emitCoinBurst, emitGoldBeam, emitGemScatter, emitGearDropGlow } from '@/vfx/emitters'
import { playSound } from '@/audio/soundEvents'
import {
  scheduleChestNotification, scheduleFreeKeyNotification,
  cancelChestNotification, cancelFreeKeyNotification,
  notificationsGranted,
} from '@/notifications/pushNotifications'
import { generateChestSprite, generateCapsuleSprite, generateRewardIcon, generateUpgradeIcon } from '@/art/generated'
import { useGameStore } from '@/store/gameStore'
import type { GearSlot } from '@/store/gameStore'
import type { UpgradeBuild } from '@/game/rift/riftTypes'
import { getUnlockedTiers, getRiftTier, getVisibleRiftTiers } from '@/game/rift/riftTiers'
import { RIFT_DURATION_MS } from '@/game/rift/waveDirector'
import { ZONES } from '@/game/rift/zoneBackgrounds'
import { GEAR_STATS, GEAR_SLOT_LABEL, getGearPowerScore, getGearStatLine, computeSquadPower } from '@/game/gear/gearStats'
import {
  CHEST_COOLDOWN_MS, STREAK_GRACE_MS, getRewardForStreak, getNextReward,
  type PostRunOffer,
} from '@/game/progression/dailyRewards'
import { rollDailyQuests, getDailyQuestDate, buildActiveQuests } from '@/game/progression/dailyQuests'
import heroesData from '@/data/art/heroes.visual.json'
import gearData from '@/data/art/gear.visual.json'
import petsData from '@/data/art/pets.visual.json'
import type { Rarity } from '@/constants/palette'
import styles from './HubScreen.module.css'

function fmtMs(ms: number): string {
  if (ms <= 0) return '00:00:00'
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

const GEAR_SLOTS: GearSlot[] = ['weapon', 'trinket', 'relic']
const RARITY_ORDER: Record<string, number> = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 }

const ZONE_COLORS = ['#ff44aa', '#ff8800', '#00ccff', '#8888ff', '#ffcc00']

type BoostIcon =
  | { kind: 'reward'; reward: 'gold' | 'gem' | 'shard' | 'xp' | 'loot'; rarity: Rarity }
  | { kind: 'upgrade'; build: UpgradeBuild; rarity: Rarity }

const BOOST_CATALOG: Array<{ id: string; icon: BoostIcon; name: string; desc: string; cost: number }> = [
  { id: 'boost_revive_token', icon: { kind: 'reward', reward: 'shard', rarity: 'epic' }, name: 'Revive Token',  desc: 'Auto-revive once if squad falls', cost: 60  },
  { id: 'boost_gold_magnet',  icon: { kind: 'reward', reward: 'gold', rarity: 'rare' },  name: 'Gold Magnet',   desc: '+50% gold from kills',            cost: 100 },
  { id: 'boost_quick_start',  icon: { kind: 'upgrade', build: 'Power', rarity: 'rare' }, name: 'Battle Scroll', desc: 'Start with a random power-up',   cost: 140 },
  { id: 'boost_iron_shield',  icon: { kind: 'upgrade', build: 'Guard', rarity: 'rare' }, name: 'Iron Shield',   desc: '+30% hero HP this run',           cost: 160 },
  { id: 'boost_fury_elixir',  icon: { kind: 'upgrade', build: 'Power', rarity: 'epic' }, name: 'Fury Elixir',   desc: '+25% attack damage this run',    cost: 200 },
]

function boostIconSrc(boost: { id: string; icon: BoostIcon }) {
  return boost.icon.kind === 'reward'
    ? generateRewardIcon(boost.icon.reward, boost.icon.rarity)
    : generateUpgradeIcon(boost.id, boost.icon.build, boost.icon.rarity)
}

interface HubProps {
  onEnterRift?: () => void
  onOpenShop?: () => void
  onOpenCapsule?: () => void
  onOpenProgress?: () => void
  postRunOffer?: PostRunOffer | null
  onDismissOffer?: () => void
}

export default function HubScreen({ onEnterRift, onOpenShop, onOpenCapsule, onOpenProgress, postRunOffer, onDismissOffer }: HubProps = {}) {
  const rafRef = useRef<number>(0)
  const [timeMs, setTimeMs] = useState(0)
  const [showShop, setShowShop] = useState(false)
  const [showGear, setShowGear] = useState(false)
  const [gearHeroIdx, setGearHeroIdx] = useState(0)
  const [offerTimeLeft, setOfferTimeLeft] = useState<number>(0)
  const offerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [dismissedNotifs, setDismissedNotifs] = useState<Set<string>>(new Set())
  const [gearPickerSlot, setGearPickerSlot] = useState<GearSlot | null>(null)
  const reducedMotion = useReducedMotion()
  const chestImg = generateChestSprite('epic', 'closed')
  const capsuleImg = generateCapsuleSprite('rare')
  const equippedPetId = useGameStore(s => s.equippedPetId)
  const activePet = petsData.pets.find(p => p.id === equippedPetId) ?? petsData.pets[0]

  const gold = useGameStore(s => s.gold)
  const gems = useGameStore(s => s.gems)
  const keys = useGameStore(s => s.keys)
  const shards = useGameStore(s => s.shards)
  const runBoosts = useGameStore(s => s.runBoosts)
  const buyBoost = useGameStore(s => s.buyBoost)
  const squadHeroIds = useGameStore(s => s.squadHeroIds)
  const addGold = useGameStore(s => s.addGold)
  const addGems = useGameStore(s => s.addGems)
  const addKeys = useGameStore(s => s.addKeys)
  const selectedRiftTier = useGameStore(s => s.selectedRiftTier)
  const setRiftTier = useGameStore(s => s.setRiftTier)
  const totalRifts = useGameStore(s => s.totalRifts)
  const ownedGear        = useGameStore(s => s.ownedGear)
  const equipGear        = useGameStore(s => s.equipGear)
  const unequipHeroSlot  = useGameStore(s => s.unequipHeroSlot)
  const dailyQuestDate = useGameStore(s => s.dailyQuestDate)
  const dailyQuestProgress = useGameStore(s => s.dailyQuestProgress)
  const dailyQuestsClaimed = useGameStore(s => s.dailyQuestsClaimed)
  const lastDailyChestAt = useGameStore(s => s.lastDailyChestAt)
  const loginStreak      = useGameStore(s => s.loginStreak)
  const nextFreeKeyAt    = useGameStore(s => s.nextFreeKeyAt)
  const claimDailyChest  = useGameStore(s => s.claimDailyChest)
  const claimFreeKey     = useGameStore(s => s.claimFreeKey)
  const checkDailyLogin  = useGameStore(s => s.checkDailyLogin)
  const addGear             = useGameStore(s => s.addGear)
  const updateHighestPower  = useGameStore(s => s.updateHighestPower)
  const ownedHeroes         = useGameStore(s => s.ownedHeroes)

  // Computed (driven by timeMs so countdowns update each rAF frame)
  const nowMs            = Date.now()
  const chestReady       = lastDailyChestAt === 0 || nowMs - lastDailyChestAt >= CHEST_COOLDOWN_MS
  const nextChestMs      = Math.max(0, lastDailyChestAt + CHEST_COOLDOWN_MS - nowMs)
  const streakEndsMs     = Math.max(0, lastDailyChestAt + STREAK_GRACE_MS - nowMs)
  const streakAtRisk     = chestReady && loginStreak > 1
  const streakDying      = streakAtRisk && streakEndsMs < 8 * 3_600_000 && lastDailyChestAt > 0
  const effectiveStreak  = Math.max(1, loginStreak)
  const currentReward    = getRewardForStreak(effectiveStreak)
  const nextReward       = getNextReward(effectiveStreak)
  const isNextJackpot    = nextReward.isJackpot ?? false
  const freeKeyReady     = nextFreeKeyAt === 0 || nowMs >= nextFreeKeyAt
  const nextKeyMs        = Math.max(0, nextFreeKeyAt - nowMs)

  const today = getDailyQuestDate()
  const questDefs = rollDailyQuests(today)
  const activeQuests = buildActiveQuests(
    questDefs,
    dailyQuestDate === today ? dailyQuestProgress : {},
    dailyQuestDate === today ? dailyQuestsClaimed : [],
  )
  const questsClaimable = activeQuests.filter(q => q.progress >= q.target && !q.claimed).length

  const unlockedTiers = getUnlockedTiers(totalRifts)
  const visibleTiers = getVisibleRiftTiers()
  const activeTierData = getRiftTier(selectedRiftTier)

  const squadHeroes = squadHeroIds
    .filter(Boolean)
    .map(id => heroesData.heroes.find(h => h.id === id))
    .filter(Boolean) as typeof heroesData.heroes

  const equippedGear = ownedGear.filter(g => g.equipped)
  const activeHeroIds = squadHeroIds.filter(Boolean)
  const heroLevels = activeHeroIds.map(id => ownedHeroes.find(h => h.id === id)?.level ?? 1)
  const squadPower = computeSquadPower(activeHeroIds, heroesData, equippedGear, heroLevels)

  // Update highestPower when squad changes
  useEffect(() => {
    if (squadPower > 0) updateHighestPower(squadPower)
  }, [squadPower])

  // rAF time for idle motion
  useEffect(() => {
    function frame(now: number) {
      setTimeMs(now)
      rafRef.current = requestAnimationFrame(frame)
    }
    rafRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // Daily login check on mount
  useEffect(() => { checkDailyLogin() }, [])

  // Schedule push notifications when chest/key ready times change
  useEffect(() => {
    if (!notificationsGranted()) return
    if (!chestReady && lastDailyChestAt > 0) {
      scheduleChestNotification(lastDailyChestAt + CHEST_COOLDOWN_MS)
    } else {
      cancelChestNotification()
    }
  }, [lastDailyChestAt, chestReady])

  useEffect(() => {
    if (!notificationsGranted()) return
    if (!freeKeyReady && nextFreeKeyAt > 0) {
      scheduleFreeKeyNotification(nextFreeKeyAt)
    } else {
      cancelFreeKeyNotification()
    }
  }, [nextFreeKeyAt, freeKeyReady])

  // Post-run offer countdown — display only, no auto-dismiss
  useEffect(() => {
    if (!postRunOffer) { setOfferTimeLeft(0); return }
    setOfferTimeLeft(postRunOffer.expiresInMs)
    offerTimerRef.current = setInterval(() => {
      setOfferTimeLeft(prev => Math.max(0, prev - 1000))
    }, 1000)
    return () => clearInterval(offerTimerRef.current!)
  }, [postRunOffer])

  function handleEnterRift() {
    playSound('ui_button_pop')
    emitGoldBeam({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
    onEnterRift?.()
  }

  function handleClaimDailyChest() {
    const reward = claimDailyChest()
    const cx = window.innerWidth / 2, cy = window.innerHeight / 2
    emitCoinBurst({ x: cx, y: cy }, 25)
    if (reward.gems > 0) emitGemScatter({ x: cx, y: cy }, reward.gems)
    if (reward.gearId) emitGearDropGlow({ x: cx, y: cy }, 'rare')
    playSound('ui_chest_open')
  }

  function handleClaimFreeKey() {
    claimFreeKey()
    emitCoinBurst({ x: window.innerWidth / 2, y: window.innerHeight / 2 }, 8)
    playSound('ui_button_pop')
    onOpenCapsule?.()
  }

  function handleClaimOffer(offer: PostRunOffer) {
    const cx = window.innerWidth / 2, cy = window.innerHeight / 2
    if (offer.gold)   addGold(offer.gold)
    if (offer.gems)   addGems(offer.gems)
    if (offer.keys)   addKeys(offer.keys)
    if (offer.gearId) addGear(offer.gearId)
    emitCoinBurst({ x: cx, y: cy }, offer.type === 'paid' ? 50 : 20)
    if (offer.gems) emitGemScatter({ x: cx, y: cy }, offer.gems)
    if (offer.gearId) emitGearDropGlow({ x: cx, y: cy }, 'epic')
    onDismissOffer?.()
  }

  const pulseScale = pulse(timeMs)
  const riftBtnStyle = { transform: `scale(${pulseScale})` }
  const activeZoneIdx = Math.max(0, Math.min(ZONES.length - 1, selectedRiftTier - 1))
  const activeZone = ZONES[activeZoneIdx]
  const zoneColor = ZONE_COLORS[activeZoneIdx]

  return (
    <div className={styles.hub}>
      {/* Canvas sparkle overlay */}
      {!reducedMotion && (
        <SparkleLayer active density={4} className={styles.sparkleLayer} />
      )}

      {/* CSS drift particles */}
      {!reducedMotion && (
        <div className={styles.bgParticles}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className={styles.bgParticle}
              style={{
                left: `${(i * 12.5) % 100}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${4 + (i % 3)}s`,
                background: ['#ffd70044','#ff69b444','#00ffff33','#aaff0033'][i % 4],
              }}
            />
          ))}
        </div>
      )}

      {/* Currency row */}
      <div className={styles.currencies}>
        <span className={styles.currency}>
          <img src={generateRewardIcon('gold', 'uncommon')} alt="" className={styles.currencyIcon} aria-hidden="true" />
          <strong>{gold.toLocaleString()}</strong>
        </span>
        <button className={styles.gemCurrencyBtn} onClick={onOpenShop}>
          <img src={generateRewardIcon('gem', 'rare')} alt="" className={styles.currencyIcon} aria-hidden="true" />
          <strong>{gems}</strong>
        </button>
        <span className={styles.currency}>
          <img src={generateCapsuleSprite('rare')} alt="" className={styles.currencyIcon} aria-hidden="true" />
          <strong>{keys}</strong>
        </span>
        <span className={styles.currency}>
          <img src={generateRewardIcon('shard', 'epic')} alt="" className={styles.currencyIcon} aria-hidden="true" />
          <strong>{shards}</strong>
        </span>
      </div>

      {/* ── Zone Hero Banner ───────────────────────────────────── */}
      <div className={styles.zoneBanner}>
        {/* Live zone canvas fills entire banner */}
        <div className={styles.zoneBannerBg}>
          <ZoneBackground zoneIndex={activeZoneIdx} width={400} height={200} />
        </div>

        {/* Rift portal — glowing disc in center-back */}
        <div className={styles.riftPortal}
          style={{ '--zone-color': zoneColor } as React.CSSProperties}
        >
          <div className={styles.riftPortalCore} />
          <div className={styles.riftPortalRing1} />
          <div className={styles.riftPortalRing2} />
          <div className={styles.riftPortalRing3} />
        </div>

        {/* Zone name badge — top left */}
        <div className={styles.bannerZoneName} style={{ color: zoneColor }}>
          {activeZone.displayName.toUpperCase()}
        </div>

        {/* Pet — top right */}
        <div className={styles.bannerPet}>
          <PetCompanion pet={activePet} index={0} size={32} />
        </div>

        {/* Collectibles — top center */}
        <div className={styles.bannerCollectibles}>
          <div className={styles.bannerCollectible}
            style={{ transform: reducedMotion ? undefined : `scale(${chestPulse(timeMs)})` }}
          >
            {chestImg
              ? <img src={chestImg} alt="chest" style={{ width: 28, height: 28, imageRendering: 'pixelated' }} />
              : '📦'}
            <span className={styles.bannerCollectibleLabel}>Chest</span>
          </div>
          <div className={styles.bannerCollectible}
            style={{ transform: reducedMotion ? undefined : `translateY(${iconBob(timeMs, 200) * 0.5}px)` }}
          >
            {capsuleImg
              ? <img src={capsuleImg} alt="capsule" style={{ width: 28, height: 28, imageRendering: 'pixelated' }} />
              : 'CAP'}
            <span className={styles.bannerCollectibleLabel}>Capsule</span>
          </div>
        </div>

        {/* Bottom gradient scrim for readability */}
        <div className={styles.bannerScrim} />

        {/* Hero sprites — pinned to banner bottom */}
        <div className={styles.heroesFront}>
          {[0, 1, 2].map(i => {
            const hero = squadHeroes[i]
            const bobY = reducedMotion ? 0 : heroIdleBob(timeMs, i)
            return (
              <div key={i} className={styles.heroFrontSlot}
                style={{ transform: `translateY(${bobY}px)` }}
              >
                {hero ? (
                  <>
                    <div className={styles.heroFrontBadge}
                      style={{ borderColor: hero.palette?.[0] ?? '#ffd700', boxShadow: `0 0 12px ${hero.palette?.[0] ?? '#ffd700'}55` }}
                    >
                      <SpriteCharacter
                        assetId={hero.id}
                        rarity={hero.rarity as Rarity}
                        size={52}
                        animate={false}
                      />
                    </div>
                    <span className={styles.heroFrontName}>{hero.displayName.split(' ')[0]}</span>
                  </>
                ) : (
                  <div className={styles.heroFrontBadge} style={{ borderColor: '#333355', opacity: 0.35 }}>
                    <span style={{ fontSize: 22, color: '#556' }}>+</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Run stats strip */}
      <div className={styles.statsStrip}>
        <span className={styles.statPill}><strong>{totalRifts}</strong> Rifts</span>
        <span className={styles.statDivider}>·</span>
        <span className={styles.statPill}><strong>{squadPower.toLocaleString()}</strong> Power</span>
        <span className={styles.statDivider}>·</span>
        <span className={styles.statPill} style={{ color: activeTierData.color }}>{activeTierData.name}</span>
      </div>

      {/* ── Zone Tier Cards (replaces old tier picker) ────────── */}
      <div className={styles.zoneTierRow}>
        {visibleTiers.map((tData, i) => {
          const tier = tData.level
          const mystery = !!tData.mystery
          const unlocked = !mystery && unlockedTiers.some(t => t.level === tier)
          const active = !mystery && selectedRiftTier === tier
          const zoneIndex = Math.min(i, ZONES.length - 1)
          return (
            <button key={tier}
              className={styles.zoneTierCard}
              data-active={active ? 'true' : undefined}
              data-mystery={mystery ? 'true' : undefined}
              disabled={!unlocked || mystery}
              onClick={() => unlocked && setRiftTier(tier)}
              title={mystery ? (tData.teaser ?? 'Unknown rift signal') : unlocked ? `${tData.name} x${tData.rewardMult} rewards` : `${tData.unlockAfterRifts} rifts to unlock`}
              style={active ? { '--card-color': ZONE_COLORS[zoneIndex] } as React.CSSProperties : undefined}
            >
              <div className={styles.zoneTierCanvas}>
                {mystery ? (
                  <div className={styles.zoneTierMystery}>???</div>
                ) : (
                  <ZoneBackground zoneIndex={zoneIndex} width={64} height={48} />
                )}
                {!unlocked && <div className={styles.zoneTierLockOverlay}>🔒</div>}
                {mystery && <div className={styles.zoneTierLockOverlay}>???</div>}
                {active && <div className={styles.zoneTierActiveBar} style={{ background: ZONE_COLORS[zoneIndex] }} />}
              </div>
              <span className={styles.zoneTierName}
                style={active ? { color: ZONE_COLORS[zoneIndex] } : undefined}
              >
                {tData.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Notification stack ──────────────────────────────────── */}
      <div className={styles.notifStack}>
        {/* CHEST READY — no dismiss, must claim */}
        {chestReady && (
          <div className={`${styles.notifCard} ${styles.notifGold}`} onClick={handleClaimDailyChest}>
            <img src={generateChestSprite('epic', 'closed')} alt="" className={styles.notifIcon} aria-hidden="true" />
            <div className={styles.notifBody}>
              <span className={styles.notifTitle}>DAY {effectiveStreak} CHEST READY!</span>
              <span className={styles.notifDetail}>{currentReward.label}</span>
              {isNextJackpot && (
                <span className={styles.notifDetail} style={{ color: '#ff44ff' }}>JACKPOT NEXT!</span>
              )}
            </div>
            <button className={styles.notifCta} onClick={e => { e.stopPropagation(); handleClaimDailyChest() }}>CLAIM</button>
          </div>
        )}
        {/* NEXT CHEST countdown — dismissible */}
        {!chestReady && !dismissedNotifs.has('next_chest') && (
          <div className={`${styles.notifCard} ${styles.notifGray}`}>
            <img src={generateChestSprite(streakDying ? 'legendary' : 'rare', 'closed')} alt="" className={styles.notifIcon} aria-hidden="true" />
            <div className={styles.notifBody}>
              <span className={styles.notifTitle}>{streakDying ? 'STREAK AT RISK!' : 'NEXT CHEST'}</span>
              <span className={styles.notifDetail}>
                {streakDying
                  ? `Day ${effectiveStreak} streak breaks in ${fmtMs(streakEndsMs)}`
                  : `Day ${Math.min(effectiveStreak + 1, 7)}: ${nextReward.label}`}
              </span>
            </div>
            <span className={`${styles.notifTimer} ${streakDying ? styles.notifTimerRed : ''}`}>
              {fmtMs(streakDying ? streakEndsMs : nextChestMs)}
            </span>
            <button className={styles.notifDismiss} onClick={e => { e.stopPropagation(); setDismissedNotifs(p => new Set(p).add('next_chest')) }}>X</button>
          </div>
        )}
        {/* QUESTS READY — no dismiss, must claim in Progress tab */}
        {questsClaimable > 0 && (
          <div className={`${styles.notifCard} ${styles.notifGreen}`} onClick={onOpenProgress}>
            <img src={generateRewardIcon('loot', 'uncommon')} alt="" className={styles.notifIcon} aria-hidden="true" />
            <div className={styles.notifBody}>
              <span className={styles.notifTitle}>{questsClaimable} QUEST{questsClaimable > 1 ? 'S' : ''} READY!</span>
              <span className={styles.notifDetail}>Claim rewards in Progress / Stats</span>
            </div>
            <button className={styles.notifCta} onClick={e => { e.stopPropagation(); onOpenProgress?.() }}>OPEN</button>
          </div>
        )}
        {/* FREE KEY READY — no dismiss, must claim */}
        {freeKeyReady && (
          <div className={`${styles.notifCard} ${styles.notifGreen}`} onClick={handleClaimFreeKey}>
            <img src={generateCapsuleSprite('rare')} alt="" className={styles.notifIcon} aria-hidden="true" />
            <div className={styles.notifBody}>
              <span className={styles.notifTitle}>FREE KEY READY!</span>
              <span className={styles.notifDetail}>Claim 1 key, then open a capsule</span>
            </div>
            <button className={styles.notifCta} onClick={e => { e.stopPropagation(); handleClaimFreeKey() }}>CLAIM</button>
          </div>
        )}
        {/* FREE KEY countdown — dismissible */}
        {!freeKeyReady && !dismissedNotifs.has('free_key_cd') && (
          <div className={`${styles.notifCard} ${styles.notifGray}`}>
            <img src={generateCapsuleSprite('uncommon')} alt="" className={styles.notifIcon} aria-hidden="true" />
            <div className={styles.notifBody}>
              <span className={styles.notifTitle}>FREE KEY IN</span>
              <span className={styles.notifDetail}>Next free capsule key timer</span>
            </div>
            <span className={styles.notifTimer}>{fmtMs(nextKeyMs)}</span>
            <button className={styles.notifDismiss} onClick={e => { e.stopPropagation(); setDismissedNotifs(p => new Set(p).add('free_key_cd')) }}>X</button>
          </div>
        )}
      </div>

      {/* ── Post-run offer modal ────────────────────────────────── */}
      {postRunOffer && (
        <div className={styles.postRunOverlay}>
          <div className={`${styles.postRunModal} ${postRunOffer.type === 'paid' ? styles.postRunPaid : styles.postRunFree}`}>
            <div className={styles.postRunIconWrap}>{postRunOffer.icon}</div>
            <div className={styles.postRunTitle}>{postRunOffer.title}</div>
            <div className={styles.postRunSub}>{postRunOffer.subtitle}</div>
            <div className={styles.postRunItems}>
              {postRunOffer.items.map((item, i) => (
                <span key={i} className={styles.postRunItem}>{item}</span>
              ))}
            </div>
            <div className={styles.offerCountdown}>
              Available for <strong>{Math.ceil(offerTimeLeft / 1000)}s</strong>
            </div>
            {postRunOffer.type === 'free' ? (
              <button className={styles.postRunFreeBtn} onClick={() => handleClaimOffer(postRunOffer)}>
                CLAIM FREE REWARD
              </button>
            ) : (
              <button className={styles.postRunPaidBtn} onClick={() => handleClaimOffer(postRunOffer)}>
                GET IT - {postRunOffer.price}
              </button>
            )}
            <button className={styles.postRunDismiss} onClick={onDismissOffer}>No thanks</button>
          </div>
        </div>
      )}

      {/* Boost shop */}
      {showShop && (
        <div className={styles.shopSheet}>
          <div className={styles.shopHeader}>
            <span className={styles.shopTitle}>BOOST YOUR RUN</span>
            <button className={styles.shopClose} onClick={() => setShowShop(false)}>✕</button>
          </div>
          {BOOST_CATALOG.map(boost => {
            const owned = runBoosts.filter(b => b === boost.id).length
            const canAfford = gold >= boost.cost
            return (
              <div key={boost.id} className={styles.shopItem}>
                <img src={boostIconSrc(boost)} alt="" className={styles.shopIcon} aria-hidden="true" />
                <div className={styles.shopItemInfo}>
                  <span className={styles.shopItemName}>{boost.name}{owned > 0 && <span className={styles.shopOwned}> ×{owned}</span>}</span>
                  <span className={styles.shopItemDesc}>{boost.desc}</span>
                </div>
                <button
                  className={styles.shopBuy}
                  disabled={!canAfford}
                  onClick={() => buyBoost(boost.id, boost.cost)}
                >
                  <img src={generateRewardIcon('gold', 'uncommon')} alt="" className={styles.buyIcon} aria-hidden="true" />
                  {boost.cost}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Active boosts row */}
      {!showShop && runBoosts.length > 0 && (
        <div className={styles.activeBoosts}>
          {[...new Set(runBoosts)].map(id => {
            const boost = BOOST_CATALOG.find(b => b.id === id)
            const count = runBoosts.filter(b => b === id).length
            return boost ? (
              <span key={id} className={styles.activeBadge}>
                <img src={boostIconSrc(boost)} alt="" className={styles.activeBadgeIcon} aria-hidden="true" />
                {count > 1 ? `x${count}` : ''}
              </span>
            ) : null
          })}
          <span className={styles.activeBoostLabel}>queued</span>
        </div>
      )}

      {/* Gear management panel */}
      {showGear && (() => {
        const heroId = squadHeroIds.filter(Boolean)[gearHeroIdx] ?? ''
        const heroName = heroesData.heroes.find(h => h.id === heroId)?.displayName ?? 'Hero'
        const equipped = (slot: GearSlot) =>
          ownedGear.find(g => g.equipped && g.equippedHeroId === heroId && g.equippedSlot === slot)
        const gearMeta = (id: string) => gearData.gear.find(g => g.id === id)

        if (gearPickerSlot) {
          const available = ownedGear
            .filter(g => !g.equipped && GEAR_STATS[g.id]?.slot === gearPickerSlot)
            .sort((a, b) => (RARITY_ORDER[gearData.gear.find(x => x.id === a.id)?.rarity ?? 'common'] ?? 4) -
                            (RARITY_ORDER[gearData.gear.find(x => x.id === b.id)?.rarity ?? 'common'] ?? 4) ||
                            getGearPowerScore(b) - getGearPowerScore(a))
          return (
            <div className={styles.gearSheet}>
              <div className={styles.gearHeader}>
                <button className={styles.gearBack} onClick={() => setGearPickerSlot(null)}>← Back</button>
                <span className={styles.gearTitle}>{GEAR_SLOT_LABEL[gearPickerSlot]}</span>
                <button className={styles.shopClose} onClick={() => { setGearPickerSlot(null); setShowGear(false) }}>✕</button>
              </div>
              {available.length === 0 && (
                <div className={styles.gearEmpty}>No {gearPickerSlot}s in inventory</div>
              )}
              {available.map(g => {
                const meta = gearMeta(g.id)
                return (
                  <div key={g.instanceId} className={styles.gearItem} data-rarity={meta?.rarity}
                    onClick={() => { equipGear(g.instanceId, heroId, gearPickerSlot); setGearPickerSlot(null) }}
                  >
                    <div className={styles.gearItemInfo}>
                      <span className={styles.gearItemName}>{meta?.displayName ?? g.id}</span>
                      <span className={styles.gearItemStats}>{getGearStatLine(g.id, g.stars ?? 0)}</span>
                    </div>
                    <span className={styles.gearEquipBtn}>EQUIP</span>
                  </div>
                )
              })}
            </div>
          )
        }

        return (
          <div className={styles.gearSheet}>
            <div className={styles.gearHeader}>
              <span className={styles.gearTitle}>GEAR</span>
              <button className={styles.shopClose} onClick={() => setShowGear(false)}>✕</button>
            </div>
            {/* Hero tabs */}
            <div className={styles.gearHeroTabs}>
              {squadHeroIds.filter(Boolean).map((hid, i) => {
                const hName = heroesData.heroes.find(h => h.id === hid)?.displayName.split(' ')[0] ?? '?'
                return (
                  <button key={hid} className={styles.gearHeroTab}
                    data-active={gearHeroIdx === i ? 'true' : undefined}
                    onClick={() => setGearHeroIdx(i)}
                  >{hName}</button>
                )
              })}
            </div>
            <div className={styles.gearHeroName}>{heroName}</div>
            {/* Slot rows */}
            {GEAR_SLOTS.map(slot => {
              const eq = equipped(slot)
              const meta = eq ? gearMeta(eq.id) : null
              return (
                <div key={slot} className={styles.gearSlotRow}>
                  <span className={styles.gearSlotLabel}>{GEAR_SLOT_LABEL[slot]}</span>
                  {eq && meta ? (
                    <div className={styles.gearSlotFilled} data-rarity={meta.rarity}>
                      <div className={styles.gearSlotItemInfo}>
                        <span className={styles.gearSlotItemName}>{meta.displayName}</span>
                        <span className={styles.gearSlotItemStats}>{getGearStatLine(eq.id, eq.stars ?? 0)}</span>
                      </div>
                      <button className={styles.gearUnequipBtn}
                        onClick={() => unequipHeroSlot(heroId, slot)}
                      >✕</button>
                    </div>
                  ) : (
                    <button className={styles.gearSlotEmpty}
                      onClick={() => setGearPickerSlot(slot)}
                    >+ EQUIP</button>
                  )}
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* Enter Rift CTA */}
      <div className={styles.riftCta}>
        {!showShop && !showGear && (
          <div className={styles.ctaBtnRow}>
            <button className={styles.boostBtn} style={{ flex: 1 }} onClick={() => setShowShop(true)}>
              BOOST <span className={styles.boostBtnSub}>from 60 gold</span>
            </button>
            <button className={styles.gearBtn} onClick={() => { setShowGear(true); setShowShop(false) }}>
              GEAR
              {ownedGear.filter(g => !g.equipped).length > 0 && (
                <span className={styles.gearBadge}>{ownedGear.filter(g => !g.equipped).length}</span>
              )}
            </button>
          </div>
        )}
        <div style={riftBtnStyle}>
          <PixelButton
            variant="primary"
            size="lg"
            onClick={handleEnterRift}
          >
            ENTER RIFT &nbsp;<span style={{ opacity: 0.7, fontSize: '13px' }}>{Math.round(RIFT_DURATION_MS / 1000)}s Run</span>
          </PixelButton>
        </div>
        <span className={styles.riftSubtext}>Squad Power: {squadPower.toLocaleString()}</span>
      </div>
    </div>
  )
}
