import { useState, useMemo } from 'react'
import RarityFrame from '@/ui/components/RarityFrame'
import PixelPanel from '@/ui/components/PixelPanel'
import GearIcon from '@/ui/components/GearIcon'
import gearData from '@/data/art/gear.visual.json'
import heroesData from '@/data/art/heroes.visual.json'
import type { Rarity } from '@/constants/palette'
import { getGeneratedSprite } from '@/art/generated'
import { GEAR_STATS, GEAR_SLOT_LABEL, getGearStatLine } from '@/game/gear/gearStats'
import type { GearSlot } from '@/store/gameStore'
import { useGameStore } from '@/store/gameStore'
import { playSound } from '@/audio/soundEvents'
import { emitGemScatter } from '@/vfx/emitters'
import styles from './GearScreen.module.css'

const SLOT_ICONS: Record<string, string> = { weapon: '⚔', trinket: '💫', relic: '🛡' }

const DISMANTLE_SHARDS: Record<Rarity, number> = {
  common: 1, uncommon: 3, rare: 8, epic: 20, legendary: 50, mythic: 150,
}
const SLOTS = ['weapon', 'trinket', 'relic'] as const

function getGearVisual(id: string) {
  return gearData.gear.find(g => g.id === id)
}

function getHeroName(heroId: string): string {
  return heroesData.heroes.find(h => h.id === heroId)?.displayName.split(' ')[0] ?? heroId
}

export default function GearScreen() {
  const [activeSlot, setActiveSlot] = useState<GearSlot | 'all'>('all')
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null)
  const [pickingHero, setPickingHero] = useState(false)

  const ownedGear    = useGameStore(s => s.ownedGear)
  const squadHeroIds = useGameStore(s => s.squadHeroIds)
  const equipGear    = useGameStore(s => s.equipGear)
  const unequipGear  = useGameStore(s => s.unequipGear)
  const removeGear   = useGameStore(s => s.removeGear)
  const addShards    = useGameStore(s => s.addShards)

  const filteredGear = useMemo(() =>
    ownedGear.filter(g =>
      activeSlot === 'all' || GEAR_STATS[g.id]?.slot === activeSlot
    ),
    [ownedGear, activeSlot]
  )

  const selectedGear   = selectedInstanceId ? ownedGear.find(g => g.instanceId === selectedInstanceId) : null
  const selectedVisual = selectedGear ? getGearVisual(selectedGear.id) : null
  const selectedStats  = selectedGear ? GEAR_STATS[selectedGear.id] : null
  const statLine       = selectedGear ? getGearStatLine(selectedGear.id) : ''

  function handleSelectGear(instanceId: string) {
    setSelectedInstanceId(prev => prev === instanceId ? null : instanceId)
    setPickingHero(false)
  }

  function handleEquipToHero(heroId: string) {
    if (!selectedGear || !selectedStats) return
    equipGear(selectedGear.instanceId, heroId, selectedStats.slot)
    playSound('reward_gear_equip_clink')
    setPickingHero(false)
  }

  function handleUnequip() {
    if (!selectedGear) return
    unequipGear(selectedGear.instanceId)
    setPickingHero(false)
  }

  function handleDismantle() {
    if (!selectedGear || !selectedVisual) return
    if (selectedGear.equipped) return  // must unequip first
    const shards = DISMANTLE_SHARDS[selectedVisual.rarity as Rarity] ?? 1
    removeGear(selectedGear.instanceId)
    addShards(shards)
    playSound('reward_shard_gain')
    emitGemScatter({ x: window.innerWidth / 2, y: window.innerHeight * 0.5 }, shards)
    setSelectedInstanceId(null)
    setPickingHero(false)
  }

  const activeSquad = squadHeroIds.filter(Boolean)

  return (
    <div className={styles.screen}>
      {/* Slot filter */}
      <div className={styles.slotRow}>
        <button
          className={`${styles.slotBtn} ${activeSlot === 'all' ? styles.slotActive : ''}`}
          onClick={() => { setActiveSlot('all'); setPickingHero(false) }}
        >ALL</button>
        {SLOTS.map(slot => (
          <button
            key={slot}
            className={`${styles.slotBtn} ${activeSlot === slot ? styles.slotActive : ''}`}
            onClick={() => { setActiveSlot(slot); setPickingHero(false) }}
          >
            {SLOT_ICONS[slot]}
          </button>
        ))}
      </div>

      {/* Selected item detail */}
      {selectedGear && selectedVisual && (
        <PixelPanel rarity={selectedVisual.rarity as Rarity} glow className={styles.detail}>
          <div className={styles.detailRow}>
            <RarityFrame rarity={selectedVisual.rarity as Rarity} size={68} animate>
              {getGeneratedSprite(selectedGear.id) ? (
                <img
                  src={getGeneratedSprite(selectedGear.id)!}
                  alt={selectedVisual.displayName}
                  style={{ width: 52, height: 52, imageRendering: 'pixelated' }}
                />
              ) : (
                <div style={{ fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                  {SLOT_ICONS[selectedStats?.slot ?? 'weapon'] ?? '❓'}
                </div>
              )}
            </RarityFrame>
            <div className={styles.detailInfo}>
              <span className={styles.itemName}>{selectedVisual.displayName}</span>
              <span className={styles.itemMeta} data-rarity={selectedVisual.rarity}>
                {selectedVisual.rarity.toUpperCase()} · {GEAR_SLOT_LABEL[selectedStats?.slot ?? 'weapon']}
              </span>
              {statLine && <span className={styles.itemStats}>{statLine}</span>}
              {selectedGear.equipped && selectedGear.equippedHeroId && (
                <span className={styles.itemEquippedBy}>
                  ✓ {getHeroName(selectedGear.equippedHeroId)}
                </span>
              )}
            </div>
          </div>

          {/* Equip / unequip actions */}
          {activeSquad.length > 0 && (
            <div className={styles.equipActions}>
              {selectedGear.equipped ? (
                <button className={styles.unequipBtn} onClick={handleUnequip}>
                  UNEQUIP
                </button>
              ) : (
                <button
                  className={`${styles.equipBtn} ${pickingHero ? styles.equipBtnActive : ''}`}
                  onClick={() => setPickingHero(v => !v)}
                >
                  {pickingHero ? 'CANCEL' : 'EQUIP →'}
                </button>
              )}
            </div>
          )}

          {/* Hero picker */}
          {pickingHero && !selectedGear.equipped && (
            <div className={styles.heroPicker}>
              <div className={styles.heroPickerLabel}>EQUIP TO HERO:</div>
              <div className={styles.heroPickerRow}>
                {activeSquad.map(heroId => (
                  <button
                    key={heroId}
                    className={styles.heroPickBtn}
                    onClick={() => handleEquipToHero(heroId)}
                  >
                    {getHeroName(heroId)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dismantle — only for unequipped gear */}
          {!selectedGear.equipped && !pickingHero && selectedVisual && (
            <button
              className={styles.dismantleBtn}
              onClick={handleDismantle}
              title="Break down into shards"
            >
              🔮 DISMANTLE +{DISMANTLE_SHARDS[selectedVisual.rarity as Rarity] ?? 1} shards
            </button>
          )}
        </PixelPanel>
      )}

      {/* Gear grid or empty state */}
      {filteredGear.length === 0 ? (
        <div className={styles.emptyGear}>
          <span className={styles.emptyGearIcon}>🎒</span>
          <span className={styles.emptyGearText}>No gear yet</span>
          <span className={styles.emptyGearHint}>Complete rifts to earn gear</span>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredGear.map(gear => {
            const visual = getGearVisual(gear.id)
            if (!visual) return null
            const isSelected = selectedInstanceId === gear.instanceId
            return (
              <div
                key={gear.instanceId}
                className={[
                  styles.gearCard,
                  isSelected ? styles.selected : '',
                  gear.equipped ? styles.gearEquipped : '',
                ].filter(Boolean).join(' ')}
                onClick={() => handleSelectGear(gear.instanceId)}
              >
                <GearIcon
                  id={gear.id}
                  displayName={visual.displayName}
                  slot={GEAR_STATS[gear.id]?.slot ?? visual.slot}
                  rarity={visual.rarity as Rarity}
                  size={52}
                  selected={isSelected}
                  equipped={gear.equipped}
                />
                <span className={styles.gearName}>{visual.displayName}</span>
                <span className={styles.gearRarity} data-rarity={visual.rarity}>
                  {visual.rarity.toUpperCase()}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
