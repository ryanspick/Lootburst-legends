import { useEffect, useMemo, useState } from 'react'
import GearIcon from '@/ui/components/GearIcon'
import RarityFrame from '@/ui/components/RarityFrame'
import SpriteCharacter from '@/ui/components/SpriteCharacter'
import gearData from '@/data/art/gear.visual.json'
import heroesData from '@/data/art/heroes.visual.json'
import type { Rarity } from '@/constants/palette'
import { getGeneratedSprite } from '@/art/generated'
import { GEAR_STATS, getGearStatLine } from '@/game/gear/gearStats'
import { useGameStore } from '@/store/gameStore'
import type { GearSlot, OwnedGear } from '@/store/gameStore'
import { playSound } from '@/audio/soundEvents'
import { emitGemScatter } from '@/vfx/emitters'
import styles from './GearScreen.module.css'

const DISMANTLE_SHARDS: Record<Rarity, number> = {
  common: 1,
  uncommon: 3,
  rare: 8,
  epic: 20,
  legendary: 50,
  mythic: 150,
}

const SLOTS: GearSlot[] = ['weapon', 'trinket', 'relic']
const SLOT_LABELS: Record<GearSlot, string> = {
  weapon: 'Weapon',
  trinket: 'Trinket',
  relic: 'Relic',
}
const SLOT_ABBR: Record<GearSlot, string> = {
  weapon: 'WPN',
  trinket: 'TRK',
  relic: 'REL',
}
const RARITIES: Array<Rarity | 'all'> = ['all', 'uncommon', 'rare', 'epic', 'legendary', 'mythic']
const RARITY_ORDER: Record<Rarity, number> = {
  mythic: 0,
  legendary: 1,
  epic: 2,
  rare: 3,
  uncommon: 4,
  common: 5,
}

type SlotFilter = GearSlot | 'all'
type EquipFilter = 'all' | 'equipped' | 'unequipped'

function getGearVisual(id: string) {
  return gearData.gear.find(g => g.id === id)
}

function getGearSlot(id: string): GearSlot {
  return GEAR_STATS[id]?.slot ?? (getGearVisual(id)?.slot as GearSlot | undefined) ?? 'weapon'
}

function getGearRarity(id: string): Rarity {
  return (getGearVisual(id)?.rarity as Rarity | undefined) ?? 'common'
}

function getHeroVisual(heroId: string) {
  return heroesData.heroes.find(h => h.id === heroId)
}

function getHeroName(heroId: string): string {
  return getHeroVisual(heroId)?.displayName ?? heroId
}

function shortHeroName(heroId: string): string {
  return getHeroName(heroId).split(' ')[0] ?? heroId
}

function getEquippedGear(ownedGear: OwnedGear[], heroId: string, slot: GearSlot) {
  return ownedGear.find(g => g.equipped && g.equippedHeroId === heroId && g.equippedSlot === slot)
}

function formatRarity(rarity: Rarity | 'all') {
  return rarity === 'all' ? 'All Rarity' : rarity.toUpperCase()
}

function LoadoutGearSprite({ id, displayName, rarity, size = 42 }: {
  id: string
  displayName: string
  rarity: Rarity
  size?: number
}) {
  const sprite = getGeneratedSprite(id)
  const slot = getGearSlot(id)
  const innerSize = Math.round(size * 0.76)

  return (
    <RarityFrame rarity={rarity} size={size}>
      {sprite ? (
        <img
          src={sprite}
          alt={displayName}
          width={innerSize}
          height={innerSize}
          className={styles.loadoutSprite}
        />
      ) : (
        <span className={styles.spriteFallback}>{SLOT_ABBR[slot]}</span>
      )}
    </RarityFrame>
  )
}

export default function GearScreen() {
  const ownedGear = useGameStore(s => s.ownedGear)
  const squadHeroIds = useGameStore(s => s.squadHeroIds)
  const equipGear = useGameStore(s => s.equipGear)
  const unequipGear = useGameStore(s => s.unequipGear)
  const removeGear = useGameStore(s => s.removeGear)
  const addShards = useGameStore(s => s.addShards)

  const activeSquad = useMemo(() => squadHeroIds.filter(Boolean), [squadHeroIds])
  const [selectedHeroId, setSelectedHeroId] = useState(activeSquad[0] ?? '')
  const [selectedSlot, setSelectedSlot] = useState<GearSlot>('weapon')
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null)
  const [slotFilter, setSlotFilter] = useState<SlotFilter>('all')
  const [equipFilter, setEquipFilter] = useState<EquipFilter>('all')
  const [rarityFilter, setRarityFilter] = useState<Rarity | 'all'>('all')
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    if (activeSquad.length === 0) {
      setSelectedHeroId('')
      return
    }
    if (!selectedHeroId || !activeSquad.includes(selectedHeroId)) {
      setSelectedHeroId(activeSquad[0])
    }
  }, [activeSquad, selectedHeroId])

  const slotCounts = useMemo(() => {
    const counts: Record<SlotFilter, number> = { all: ownedGear.length, weapon: 0, trinket: 0, relic: 0 }
    for (const gear of ownedGear) counts[getGearSlot(gear.id)]++
    return counts
  }, [ownedGear])

  const selectedGear = selectedInstanceId ? ownedGear.find(g => g.instanceId === selectedInstanceId) ?? null : null
  const selectedVisual = selectedGear ? getGearVisual(selectedGear.id) : null
  const selectedGearSlot = selectedGear ? getGearSlot(selectedGear.id) : selectedSlot
  const selectedRarity = selectedGear ? getGearRarity(selectedGear.id) : 'common'
  const selectedStatLine = selectedGear ? getGearStatLine(selectedGear.id) : ''
  const activeEquippedCount = ownedGear.filter(g =>
    g.equipped && g.equippedHeroId && activeSquad.includes(g.equippedHeroId)
  ).length

  const filteredGear = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    return ownedGear
      .filter(gear => {
        const slot = getGearSlot(gear.id)
        const visual = getGearVisual(gear.id)
        const rarity = getGearRarity(gear.id)
        if (slotFilter !== 'all' && slot !== slotFilter) return false
        if (equipFilter === 'equipped' && !gear.equipped) return false
        if (equipFilter === 'unequipped' && gear.equipped) return false
        if (rarityFilter !== 'all' && rarity !== rarityFilter) return false
        if (q && !(visual?.displayName.toLowerCase().includes(q) || gear.id.toLowerCase().includes(q))) return false
        return true
      })
      .sort((a, b) => {
        const rarityDiff = RARITY_ORDER[getGearRarity(a.id)] - RARITY_ORDER[getGearRarity(b.id)]
        if (rarityDiff !== 0) return rarityDiff
        if (a.equipped !== b.equipped) return a.equipped ? 1 : -1
        return (getGearVisual(a.id)?.displayName ?? a.id).localeCompare(getGearVisual(b.id)?.displayName ?? b.id)
      })
  }, [equipFilter, ownedGear, rarityFilter, searchText, slotFilter])

  function selectHeroSlot(heroId: string, slot: GearSlot) {
    const equipped = getEquippedGear(ownedGear, heroId, slot)
    setSelectedHeroId(heroId)
    setSelectedSlot(slot)
    setSlotFilter(slot)
    setSelectedInstanceId(equipped?.instanceId ?? null)
  }

  function selectGear(gear: OwnedGear) {
    const slot = getGearSlot(gear.id)
    setSelectedInstanceId(gear.instanceId)
    setSelectedSlot(slot)
    if (gear.equippedHeroId) setSelectedHeroId(gear.equippedHeroId)
  }

  function handleEquip(instanceId: string, heroId = selectedHeroId) {
    if (!heroId) return
    const gear = ownedGear.find(g => g.instanceId === instanceId)
    if (!gear) return
    const slot = getGearSlot(gear.id)
    equipGear(instanceId, heroId, slot)
    playSound('reward_gear_equip_clink')
    setSelectedHeroId(heroId)
    setSelectedSlot(slot)
    setSelectedInstanceId(instanceId)
  }

  function handleUnequip(instanceId: string) {
    unequipGear(instanceId)
    playSound('ui_tab_slide')
  }

  function handleDismantle() {
    if (!selectedGear || selectedGear.equipped) return
    const shards = DISMANTLE_SHARDS[selectedRarity] ?? 1
    removeGear(selectedGear.instanceId)
    addShards(shards)
    playSound('reward_shard_gain')
    emitGemScatter({ x: window.innerWidth / 2, y: window.innerHeight * 0.5 }, shards)
    setSelectedInstanceId(null)
  }

  const selectedHeroName = selectedHeroId ? shortHeroName(selectedHeroId) : 'Hero'
  const emptySlotFocus = !selectedGear && selectedHeroId

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Equipment</span>
          <h1 className={styles.title}>Squad Gear</h1>
        </div>
        <div className={styles.rules}>
          <span>Per hero</span>
          <span>1 Weapon</span>
          <span>1 Trinket</span>
          <span>1 Relic</span>
        </div>
      </header>

      <section className={styles.loadout}>
        <div className={styles.sectionHead}>
          <span>Squad Loadouts</span>
          <strong>{activeEquippedCount}/{activeSquad.length * SLOTS.length} filled</strong>
        </div>

        {activeSquad.length === 0 ? (
          <div className={styles.emptyBlock}>No squad heroes selected.</div>
        ) : (
          <div className={styles.heroGrid}>
            {activeSquad.map(heroId => {
              const hero = getHeroVisual(heroId)
              const equippedCount = SLOTS.filter(slot => getEquippedGear(ownedGear, heroId, slot)).length
              return (
                <article
                  key={heroId}
                  className={styles.heroCard}
                  data-active={selectedHeroId === heroId ? 'true' : undefined}
                >
                  <button
                    className={styles.heroButton}
                    onClick={() => setSelectedHeroId(heroId)}
                    type="button"
                  >
                    <SpriteCharacter
                      assetId={heroId}
                      rarity={(hero?.rarity as Rarity | undefined) ?? 'common'}
                      size={54}
                    />
                    <span>
                      <strong>{shortHeroName(heroId)}</strong>
                      <small>{equippedCount}/3 slots</small>
                    </span>
                  </button>

                  <div className={styles.slotGrid}>
                    {SLOTS.map(slot => {
                      const equipped = getEquippedGear(ownedGear, heroId, slot)
                      const visual = equipped ? getGearVisual(equipped.id) : null
                      const active = selectedHeroId === heroId && selectedSlot === slot
                      return (
                        <button
                          key={slot}
                          type="button"
                          className={styles.slotTile}
                          data-active={active ? 'true' : undefined}
                          data-filled={equipped ? 'true' : undefined}
                          onClick={() => selectHeroSlot(heroId, slot)}
                        >
                          <span className={styles.slotAbbr}>{SLOT_ABBR[slot]}</span>
                          {equipped && visual ? (
                            <>
                              <LoadoutGearSprite
                                id={equipped.id}
                                displayName={visual.displayName}
                                rarity={visual.rarity as Rarity}
                                size={42}
                              />
                              <span className={styles.slotItem}>{visual.displayName}</span>
                            </>
                          ) : (
                            <>
                              <span className={styles.emptySlotMark}>+</span>
                              <span className={styles.emptySlotText}>{SLOT_LABELS[slot]}</span>
                            </>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className={styles.inventory}>
        <div className={styles.sectionHead}>
          <span>Inventory</span>
          <strong>{filteredGear.length}/{ownedGear.length}</strong>
        </div>

        <div className={styles.filters}>
          <div className={styles.segmented} aria-label="Slot filter">
            {(['all', ...SLOTS] as SlotFilter[]).map(slot => (
              <button
                key={slot}
                type="button"
                className={styles.filterBtn}
                data-active={slotFilter === slot ? 'true' : undefined}
                onClick={() => setSlotFilter(slot)}
              >
                <span>{slot === 'all' ? 'All' : SLOT_LABELS[slot]}</span>
                <small>{slotCounts[slot]}</small>
              </button>
            ))}
          </div>

          <div className={styles.filterRow}>
            <select
              className={styles.select}
              value={equipFilter}
              onChange={event => setEquipFilter(event.target.value as EquipFilter)}
              aria-label="Equip status"
            >
              <option value="all">All items</option>
              <option value="unequipped">Unequipped</option>
              <option value="equipped">Equipped</option>
            </select>
            <select
              className={styles.select}
              value={rarityFilter}
              onChange={event => setRarityFilter(event.target.value as Rarity | 'all')}
              aria-label="Rarity"
            >
              {RARITIES.map(rarity => (
                <option key={rarity} value={rarity}>{formatRarity(rarity)}</option>
              ))}
            </select>
            <input
              className={styles.search}
              type="search"
              value={searchText}
              onChange={event => setSearchText(event.target.value)}
              placeholder="Search gear"
            />
          </div>
        </div>

        <div className={styles.workbench}>
          <div className={styles.gearList}>
            {filteredGear.length === 0 ? (
              <div className={styles.emptyBlock}>No gear matches these filters.</div>
            ) : (
              filteredGear.map(gear => {
                const visual = getGearVisual(gear.id)
                if (!visual) return null
                const slot = getGearSlot(gear.id)
                const rarity = visual.rarity as Rarity
                const isSelected = selectedInstanceId === gear.instanceId
                return (
                  <article
                    key={gear.instanceId}
                    className={styles.gearCard}
                    data-selected={isSelected ? 'true' : undefined}
                    data-equipped={gear.equipped ? 'true' : undefined}
                    data-rarity={rarity}
                    onClick={() => selectGear(gear)}
                  >
                    <GearIcon
                      id={gear.id}
                      displayName={visual.displayName}
                      slot={slot}
                      rarity={rarity}
                      size={54}
                      selected={isSelected}
                      equipped={gear.equipped}
                    />
                    <div className={styles.gearInfo}>
                      <span className={styles.gearName}>{visual.displayName}</span>
                      <span className={styles.gearMeta}>
                        {rarity.toUpperCase()} | {SLOT_LABELS[slot]}
                      </span>
                      <span className={styles.gearStats}>{getGearStatLine(gear.id)}</span>
                      {gear.equipped && gear.equippedHeroId && (
                        <span className={styles.equippedText}>
                          {shortHeroName(gear.equippedHeroId)} | {SLOT_LABELS[gear.equippedSlot ?? slot]}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className={styles.quickEquip}
                      onClick={event => {
                        event.stopPropagation()
                        handleEquip(gear.instanceId)
                      }}
                      disabled={!selectedHeroId}
                    >
                      {gear.equipped ? 'MOVE' : 'EQUIP'}
                    </button>
                  </article>
                )
              })
            )}
          </div>

          <aside className={styles.detail}>
            {selectedGear && selectedVisual ? (
              <>
                <div className={styles.detailTop}>
                  <GearIcon
                    id={selectedGear.id}
                    displayName={selectedVisual.displayName}
                    slot={selectedGearSlot}
                    rarity={selectedRarity}
                    size={70}
                    selected
                    equipped={selectedGear.equipped}
                  />
                  <div className={styles.detailCopy}>
                    <span className={styles.detailName}>{selectedVisual.displayName}</span>
                    <span className={styles.detailMeta}>
                      {selectedRarity.toUpperCase()} | {SLOT_LABELS[selectedGearSlot]}
                    </span>
                    <span className={styles.detailStats}>{selectedStatLine}</span>
                    {selectedGear.equipped && selectedGear.equippedHeroId && (
                      <span className={styles.detailEquipped}>
                        Equipped by {getHeroName(selectedGear.equippedHeroId)}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.heroTargets}>
                  {activeSquad.map(heroId => (
                    <button
                      key={heroId}
                      type="button"
                      className={styles.heroTarget}
                      data-active={selectedGear.equippedHeroId === heroId ? 'true' : undefined}
                      onClick={() => handleEquip(selectedGear.instanceId, heroId)}
                    >
                      {shortHeroName(heroId)}
                    </button>
                  ))}
                </div>

                <div className={styles.actionRow}>
                  {selectedGear.equipped ? (
                    <button
                      type="button"
                      className={styles.unequipBtn}
                      onClick={() => handleUnequip(selectedGear.instanceId)}
                    >
                      UNEQUIP
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.equipBtn}
                      onClick={() => handleEquip(selectedGear.instanceId)}
                      disabled={!selectedHeroId}
                    >
                      EQUIP TO {selectedHeroName.toUpperCase()}
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.dismantleBtn}
                    onClick={handleDismantle}
                    disabled={selectedGear.equipped}
                  >
                    SHARDS +{DISMANTLE_SHARDS[selectedRarity] ?? 1}
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.detailEmpty}>
                <span>{emptySlotFocus ? `${selectedHeroName}'s ${SLOT_LABELS[selectedSlot]}` : 'Select gear'}</span>
                <small>
                  {emptySlotFocus
                    ? `${filteredGear.filter(g => getGearSlot(g.id) === selectedSlot && !g.equipped).length} unequipped options`
                    : 'Pick an inventory item or a hero slot'}
                </small>
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>
  )
}
