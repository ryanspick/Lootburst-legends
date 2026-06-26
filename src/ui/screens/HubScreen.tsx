import { useEffect, useRef, useState } from 'react'
import PixelButton from '@/ui/components/PixelButton'
import SpriteCharacter from '@/ui/components/SpriteCharacter'
import SparkleLayer from '@/ui/components/SparkleLayer'
import ZoneBackground from '@/ui/components/ZoneBackground'
import PetCompanion from '@/ui/components/PetCompanion'
import OfflineReturnSequence from '@/ui/screens/OfflineReturnSequence'
import { calculateOfflineRewards, isOfflineRewardSignificant } from '@/game/offline/offlineRewardController'
import type { OfflineReward } from '@/game/offline/offlineRewardController'
import { pulse } from '@/animation/motionPrimitives'
import { heroIdleBob, chestPulse, iconBob } from '@/animation/idleMotion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { emitCoinBurst, emitGoldBeam } from '@/vfx/emitters'
import { playSound } from '@/audio/soundEvents'
import { generateChestSprite, generateCapsuleSprite } from '@/art/generated'
import { useGameStore } from '@/store/gameStore'
import type { GearSlot } from '@/store/gameStore'
import { getUnlockedTiers, getRiftTier } from '@/game/rift/riftTiers'
import { GEAR_STATS, GEAR_SLOT_LABEL, getGearStatLine } from '@/game/gear/gearStats'
import heroesData from '@/data/art/heroes.visual.json'
import gearData from '@/data/art/gear.visual.json'
import petsData from '@/data/art/pets.visual.json'
import type { Rarity } from '@/constants/palette'
import styles from './HubScreen.module.css'

const GEAR_SLOTS: GearSlot[] = ['weapon', 'trinket', 'relic']
const RARITY_ORDER: Record<string, number> = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 }

const BOOST_CATALOG = [
  { id: 'boost_revive_token', icon: '💫', name: 'Revive Token',  desc: 'Auto-revive once if squad falls', cost: 60  },
  { id: 'boost_gold_magnet',  icon: '🧲', name: 'Gold Magnet',   desc: '+50% gold from kills',            cost: 100 },
  { id: 'boost_quick_start',  icon: '⚡', name: 'Battle Scroll', desc: 'Start with a random power-up',   cost: 140 },
  { id: 'boost_iron_shield',  icon: '🛡️', name: 'Iron Shield',   desc: '+30% hero HP this run',           cost: 160 },
  { id: 'boost_fury_elixir',  icon: '🔥', name: 'Fury Elixir',   desc: '+25% attack damage this run',    cost: 200 },
]

interface HubProps { onEnterRift?: () => void; onOpenShop?: () => void }

export default function HubScreen({ onEnterRift, onOpenShop }: HubProps = {}) {
  const rafRef = useRef<number>(0)
  const [timeMs, setTimeMs] = useState(0)
  const [offlineReward, setOfflineReward] = useState<OfflineReward | null>(null)
  const [showShop, setShowShop] = useState(false)
  const [showGear, setShowGear] = useState(false)
  const [gearHeroIdx, setGearHeroIdx] = useState(0)
  const [gearPickerSlot, setGearPickerSlot] = useState<GearSlot | null>(null)
  const reducedMotion = useReducedMotion()
  const chestImg = generateChestSprite('epic', 'closed')
  const capsuleImg = generateCapsuleSprite('rare')
  const activePet = petsData.pets[0] // first pet as hub companion

  const gold = useGameStore(s => s.gold)
  const gems = useGameStore(s => s.gems)
  const keys = useGameStore(s => s.keys)
  const shards = useGameStore(s => s.shards)
  const runBoosts = useGameStore(s => s.runBoosts)
  const buyBoost = useGameStore(s => s.buyBoost)
  const squadHeroIds = useGameStore(s => s.squadHeroIds)
  const lastSeenAt = useGameStore(s => s.lastSeenAt)
  const addGold = useGameStore(s => s.addGold)
  const addGems = useGameStore(s => s.addGems)
  const setLastSeen = useGameStore(s => s.setLastSeen)
  const selectedRiftTier = useGameStore(s => s.selectedRiftTier)
  const setRiftTier = useGameStore(s => s.setRiftTier)
  const totalRifts = useGameStore(s => s.totalRifts)
  const ownedGear = useGameStore(s => s.ownedGear)
  const equipGear = useGameStore(s => s.equipGear)
  const unequipHeroSlot = useGameStore(s => s.unequipHeroSlot)

  const unlockedTiers = getUnlockedTiers(totalRifts)
  const activeTierData = getRiftTier(selectedRiftTier)

  const squadHeroes = squadHeroIds
    .filter(Boolean)
    .map(id => heroesData.heroes.find(h => h.id === id))
    .filter(Boolean) as typeof heroesData.heroes

  // rAF time for idle motion
  useEffect(() => {
    function frame(now: number) {
      setTimeMs(now)
      rafRef.current = requestAnimationFrame(frame)
    }
    rafRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // Calculate offline reward on mount
  useEffect(() => {
    const reward = calculateOfflineRewards(lastSeenAt)
    if (isOfflineRewardSignificant(reward)) {
      setOfflineReward(reward)
    }
    // Mark seen now; save on unload too
    setLastSeen()
    const onUnload = () => setLastSeen()
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [])

  function handleEnterRift() {
    playSound('ui_button_pop')
    emitGoldBeam({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
    onEnterRift?.()
  }

  function handleClaimOffline() {
    if (!offlineReward) return
    addGold(offlineReward.goldEarned)
    addGems(offlineReward.gemsEarned)
    emitCoinBurst({ x: window.innerWidth / 2, y: window.innerHeight / 2 }, 30)
    setOfflineReward(null)
  }

  const pulseScale = pulse(timeMs)
  const riftBtnStyle = { transform: `scale(${pulseScale})` }

  return (
    <div className={styles.hub}>
      {/* Zone background — subtle candy cavern behind hub */}
      <div className={styles.zoneBg}>
        <ZoneBackground zoneIndex={0} width={360} height={220} />
      </div>

      {/* Canvas sparkle overlay */}
      {!reducedMotion && (
        <SparkleLayer active density={4} className={styles.sparkleLayer} />
      )}

      {/* CSS drift particles fallback (still shows when reduced motion off) */}
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
        <span className={styles.currency}>💰 <strong>{gold.toLocaleString()}</strong></span>
        <button className={styles.gemCurrencyBtn} onClick={onOpenShop}>
          💎 <strong>{gems}</strong>
        </button>
        <span className={styles.currency}>🔑 <strong>{keys}</strong></span>
        <span className={styles.currency}>🔮 <strong>{shards}</strong></span>
      </div>

      {/* Squad display */}
      <div className={styles.squad}>
        {[0, 1, 2].map(i => {
          const hero = squadHeroes[i]
          const bobY = reducedMotion ? 0 : heroIdleBob(timeMs, i)
          return (
            <div key={i} className={styles.heroSlot}
              style={{ transform: `translateY(${bobY}px)` }}
            >
              {hero ? (
                <>
                  <div className={styles.heroBadge}
                    style={{ borderColor: hero.palette?.[0] ?? '#ffd700' }}
                  >
                    <SpriteCharacter
                      assetId={hero.id}
                      rarity={hero.rarity as Rarity}
                      size={44}
                      animate={false}
                    />
                  </div>
                  <span className={styles.heroName}>{hero.displayName.split(' ')[0]}</span>
                </>
              ) : (
                <div className={styles.heroBadge} style={{ borderColor: '#333355', opacity: 0.4 }}>
                  <span style={{ fontSize: 20 }}>+</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Chest and capsule */}
      <div className={styles.collectibles}>
        <div className={styles.chest}
          style={{ transform: reducedMotion ? undefined : `scale(${chestPulse(timeMs)})` }}
        >
          {chestImg
            ? <img src={chestImg} alt="chest" style={{ width: 40, height: 40, imageRendering: 'pixelated' }} />
            : '📦'}
          <span className={styles.collectibleLabel}>Chest</span>
        </div>
        <div className={styles.capsule}
          style={{ transform: reducedMotion ? undefined : `translateY(${iconBob(timeMs, 200)}px)` }}
        >
          {capsuleImg
            ? <img src={capsuleImg} alt="capsule" style={{ width: 40, height: 40, imageRendering: 'pixelated' }} />
            : '🔮'}
          <span className={styles.collectibleLabel}>Capsule</span>
        </div>
      </div>

      {/* Pet companion — hub idle buddy */}
      <div className={styles.petRow}>
        <PetCompanion pet={activePet} index={0} size={40} />
        <span className={styles.petName}>{activePet.displayName}</span>
      </div>

      {/* Offline reward sequence */}
      {offlineReward && (
        <OfflineReturnSequence
          reward={offlineReward}
          onClaim={handleClaimOffline}
        />
      )}

      {/* Boost shop */}
      {showShop && (
        <div className={styles.shopSheet}>
          <div className={styles.shopHeader}>
            <span className={styles.shopTitle}>⚡ BOOST YOUR RUN</span>
            <button className={styles.shopClose} onClick={() => setShowShop(false)}>✕</button>
          </div>
          {BOOST_CATALOG.map(boost => {
            const owned = runBoosts.filter(b => b === boost.id).length
            const canAfford = gold >= boost.cost
            return (
              <div key={boost.id} className={styles.shopItem}>
                <span className={styles.shopIcon}>{boost.icon}</span>
                <div className={styles.shopItemInfo}>
                  <span className={styles.shopItemName}>{boost.name}{owned > 0 && <span className={styles.shopOwned}> ×{owned}</span>}</span>
                  <span className={styles.shopItemDesc}>{boost.desc}</span>
                </div>
                <button
                  className={styles.shopBuy}
                  disabled={!canAfford}
                  onClick={() => buyBoost(boost.id, boost.cost)}
                >
                  💰{boost.cost}
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
                {boost.icon}{count > 1 ? `×${count}` : ''}
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
                            (RARITY_ORDER[gearData.gear.find(x => x.id === b.id)?.rarity ?? 'common'] ?? 4))
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
                      <span className={styles.gearItemStats}>{getGearStatLine(g.id)}</span>
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
              <span className={styles.gearTitle}>⚔️ GEAR</span>
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
                        <span className={styles.gearSlotItemStats}>{getGearStatLine(eq.id)}</span>
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

      {/* Rift tier selector */}
      {!showShop && (
        <div className={styles.tierPicker}>
          <div className={styles.tierBtns}>
            {[1, 2, 3, 4, 5].map(lvl => {
              const unlocked = unlockedTiers.some(t => t.level === lvl)
              const active = selectedRiftTier === lvl
              const tData = getRiftTier(lvl)
              return (
                <button
                  key={lvl}
                  className={styles.tierBtn}
                  data-active={active ? 'true' : undefined}
                  data-tier={lvl}
                  disabled={!unlocked}
                  onClick={() => unlocked && setRiftTier(lvl)}
                  title={unlocked ? `${tData.name} • ×${tData.rewardMult} rewards` : `Unlock after ${tData.unlockAfterRifts} rifts`}
                >
                  {tData.label}
                  {!unlocked && <span className={styles.tierLock}>🔒</span>}
                </button>
              )
            })}
          </div>
          <div className={styles.tierInfo} style={{ color: activeTierData.color }}>
            {activeTierData.name} <span className={styles.tierReward}>×{activeTierData.rewardMult} REWARDS</span>
          </div>
        </div>
      )}

      {/* Enter Rift CTA */}
      <div className={styles.riftCta}>
        {!showShop && !showGear && (
          <div className={styles.ctaBtnRow}>
            <button className={styles.boostBtn} style={{ flex: 1 }} onClick={() => setShowShop(true)}>
              ⚡ BOOST <span className={styles.boostBtnSub}>from 💰60</span>
            </button>
            <button className={styles.gearBtn} onClick={() => { setShowGear(true); setShowShop(false) }}>
              ⚔️ GEAR
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
            ⚔️ ENTER RIFT &nbsp;<span style={{ opacity: 0.7, fontSize: '13px' }}>90s Run</span>
          </PixelButton>
        </div>
        <span className={styles.riftSubtext}>Squad Power: 4,280</span>
      </div>
    </div>
  )
}
