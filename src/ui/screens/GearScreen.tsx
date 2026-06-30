import { useEffect, useMemo, useState } from 'react'
import GearIcon from '@/ui/components/GearIcon'
import SpriteCharacter from '@/ui/components/SpriteCharacter'
import gearData from '@/data/art/gear.visual.json'
import heroesData from '@/data/art/heroes.visual.json'
import type { Rarity } from '@/constants/palette'
import {
  GEAR_STATS,
  MAX_GEAR_STARS,
  getGearPowerScore,
  getGearStatLine,
  getRoleGearPowerScore,
  normalizeGearStars,
} from '@/game/gear/gearStats'
import {
  findUpgradeableGearInstance,
  useGameStore,
  type GearSlot,
  type OwnedGear,
} from '@/store/gameStore'
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
const RARITIES: Array<Rarity | 'all'> = ['all', 'common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic']
const RARITY_ORDER: Record<Rarity, number> = {
  mythic: 0,
  legendary: 1,
  epic: 2,
  rare: 3,
  uncommon: 4,
  common: 5,
}

type MainTab = 'loadout' | 'items' | 'forge'
type SlotFilter = GearSlot | 'all'
type EquipFilter = 'all' | 'equipped' | 'unequipped'
type NoticeTone = 'info' | 'success' | 'warn'

interface GearStack {
  id: string
  items: OwnedGear[]
  count: number
  equippedCount: number
  best: OwnedGear
  bestUnequipped: OwnedGear | null
  slot: GearSlot
  rarity: Rarity
  displayName: string
  upgradeTarget: OwnedGear | null
}

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

function getHeroRole(heroId: string): string {
  return getHeroVisual(heroId)?.role ?? 'ranged'
}

function shortHeroName(heroId: string): string {
  return getHeroName(heroId).split(' ')[0] ?? heroId
}

function getEquippedGear(ownedGear: OwnedGear[], heroId: string, slot: GearSlot) {
  return ownedGear.find(g => g.equipped && g.equippedHeroId === heroId && g.equippedSlot === slot)
}

function getGearRankLabel(gear: OwnedGear): string {
  const stars = normalizeGearStars(gear.stars ?? 0)
  return stars > 0 ? `+${stars}` : ''
}

function compareGearInstances(a: OwnedGear, b: OwnedGear): number {
  return (b.stars ?? 0) - (a.stars ?? 0) ||
    getGearPowerScore(b) - getGearPowerScore(a) ||
    Number(b.equipped) - Number(a.equipped) ||
    a.instanceId.localeCompare(b.instanceId)
}

function buildGearStacks(ownedGear: OwnedGear[]): GearStack[] {
  const groups = new Map<string, OwnedGear[]>()
  for (const gear of ownedGear) {
    const group = groups.get(gear.id) ?? []
    group.push(gear)
    groups.set(gear.id, group)
  }

  return Array.from(groups.entries()).map(([id, items]) => {
    const sorted = [...items].sort(compareGearInstances)
    const visual = getGearVisual(id)
    return {
      id,
      items: sorted,
      count: sorted.length,
      equippedCount: sorted.filter(g => g.equipped).length,
      best: sorted[0],
      bestUnequipped: sorted.find(g => !g.equipped) ?? null,
      slot: getGearSlot(id),
      rarity: getGearRarity(id),
      displayName: visual?.displayName ?? id,
      upgradeTarget: findUpgradeableGearInstance(ownedGear, id),
    }
  })
}

function formatRarity(rarity: Rarity | 'all') {
  return rarity === 'all' ? 'All Rarity' : rarity.toUpperCase()
}

function sortStacks(a: GearStack, b: GearStack, role = 'ranged'): number {
  return Number(Boolean(b.upgradeTarget)) - Number(Boolean(a.upgradeTarget)) ||
    RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity] ||
    getRoleGearPowerScore(b.best, role) - getRoleGearPowerScore(a.best, role) ||
    b.count - a.count ||
    a.displayName.localeCompare(b.displayName)
}

export default function GearScreen() {
  const ownedGear = useGameStore(s => s.ownedGear)
  const squadHeroIds = useGameStore(s => s.squadHeroIds)
  const equipGear = useGameStore(s => s.equipGear)
  const unequipGear = useGameStore(s => s.unequipGear)
  const upgradeGearWithDupes = useGameStore(s => s.upgradeGearWithDupes)
  const upgradeAllGearWithDupes = useGameStore(s => s.upgradeAllGearWithDupes)
  const removeGear = useGameStore(s => s.removeGear)
  const addShards = useGameStore(s => s.addShards)

  const activeSquad = useMemo(() => squadHeroIds.filter(Boolean), [squadHeroIds])
  const stacks = useMemo(() => buildGearStacks(ownedGear), [ownedGear])

  const [tab, setTab] = useState<MainTab>('loadout')
  const [selectedHeroId, setSelectedHeroId] = useState(activeSquad[0] ?? '')
  const [selectedSlot, setSelectedSlot] = useState<GearSlot>('weapon')
  const [selectedGearId, setSelectedGearId] = useState<string | null>(null)
  const [slotFilter, setSlotFilter] = useState<SlotFilter>('all')
  const [equipFilter, setEquipFilter] = useState<EquipFilter>('all')
  const [rarityFilter, setRarityFilter] = useState<Rarity | 'all'>('all')
  const [searchText, setSearchText] = useState('')
  const [equipPicker, setEquipPicker] = useState<{ heroId: string; slot: GearSlot } | null>(null)
  const [forgeFlashId, setForgeFlashId] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ text: string; tone: NoticeTone; nonce: number }>({
    text: 'Loadout ready.',
    tone: 'info',
    nonce: 0,
  })

  function showNotice(text: string, tone: NoticeTone = 'info') {
    setNotice({ text, tone, nonce: Date.now() })
  }

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

  const activeTarget = equipPicker ?? (selectedHeroId ? { heroId: selectedHeroId, slot: selectedSlot } : null)
  const targetRole = activeTarget ? getHeroRole(activeTarget.heroId) : 'ranged'
  const targetEquipped = activeTarget ? getEquippedGear(ownedGear, activeTarget.heroId, activeTarget.slot) : null
  const activeEquippedCount = ownedGear.filter(g =>
    g.equipped && g.equippedHeroId && activeSquad.includes(g.equippedHeroId)
  ).length
  const upgradeReadyCount = stacks.filter(stack => stack.upgradeTarget).length
  const totalItemCount = ownedGear.length
  const isSlotPicker = Boolean(equipPicker)
  const screenTitle = tab === 'loadout'
    ? 'Loadout'
    : tab === 'forge'
      ? 'Forge'
      : isSlotPicker && equipPicker
        ? SLOT_LABELS[equipPicker.slot]
        : 'Items'
  const sectionTitle = tab === 'loadout'
    ? 'Squad Loadout'
    : tab === 'forge'
      ? 'Upgrade Forge'
      : isSlotPicker
        ? 'Slot Choices'
        : 'Item Bag'
  const sectionMeta = tab === 'loadout'
    ? `${activeEquippedCount}/${activeSquad.length * SLOTS.length} filled`
    : tab === 'forge'
      ? `${upgradeReadyCount} ready`
      : `${stacks.length} stacks`

  const filteredStacks = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    const forcedSlot = equipPicker?.slot ?? null

    return stacks
      .filter(stack => {
        if (tab === 'forge' && !stack.upgradeTarget) return false
        if (forcedSlot && stack.slot !== forcedSlot) return false
        if (!forcedSlot && slotFilter !== 'all' && stack.slot !== slotFilter) return false
        if (equipFilter === 'equipped' && stack.equippedCount === 0) return false
        if (equipFilter === 'unequipped' && !stack.bestUnequipped) return false
        if (rarityFilter !== 'all' && stack.rarity !== rarityFilter) return false
        if (q && !(stack.displayName.toLowerCase().includes(q) || stack.id.toLowerCase().includes(q))) return false
        return true
      })
      .sort((a, b) => sortStacks(a, b, targetRole))
  }, [equipFilter, equipPicker, rarityFilter, searchText, slotFilter, stacks, tab, targetRole])

  useEffect(() => {
    if (selectedGearId && filteredStacks.some(stack => stack.id === selectedGearId)) return
    setSelectedGearId(filteredStacks[0]?.id ?? null)
  }, [filteredStacks, selectedGearId])

  const selectedStack = selectedGearId
    ? stacks.find(stack => stack.id === selectedGearId) ?? filteredStacks[0] ?? null
    : filteredStacks[0] ?? null
  const selectedGear = selectedStack?.best ?? null
  const selectedStars = selectedGear ? normalizeGearStars(selectedGear.stars ?? 0) : 0
  const selectedStatLine = selectedGear ? getGearStatLine(selectedGear.id, selectedStars) : ''
  const nextStatLine = selectedGear && selectedStars < MAX_GEAR_STARS
    ? getGearStatLine(selectedGear.id, selectedStars + 1)
    : ''
  const selectedStackOnTarget = selectedStack && activeTarget
    ? selectedStack.items.find(g =>
      g.equipped &&
      g.equippedHeroId === activeTarget.heroId &&
      g.equippedSlot === selectedStack.slot
    ) ?? null
    : null

  function bestInstanceForTarget(stack: GearStack, heroId: string): OwnedGear {
    const role = getHeroRole(heroId)
    const onTarget = stack.items.find(g =>
      g.equipped &&
      g.equippedHeroId === heroId &&
      g.equippedSlot === stack.slot
    )
    if (onTarget) return onTarget

    const sorted = [...stack.items].sort((a, b) =>
      getRoleGearPowerScore(b, role) - getRoleGearPowerScore(a, role) ||
      compareGearInstances(a, b)
    )
    return sorted.find(g => !g.equipped) ?? sorted[0]
  }

  function openSlotPicker(heroId: string, slot: GearSlot) {
    const equipped = getEquippedGear(ownedGear, heroId, slot)
    const bestCandidate = stacks
      .filter(stack => stack.slot === slot)
      .sort((a, b) => sortStacks(a, b, getHeroRole(heroId)))[0]

    setSelectedHeroId(heroId)
    setSelectedSlot(slot)
    setSlotFilter(slot)
    setEquipFilter('all')
    setRarityFilter('all')
    setEquipPicker({ heroId, slot })
    setSelectedGearId(equipped?.id ?? bestCandidate?.id ?? null)
    setTab('items')
    showNotice(`Target: ${SLOT_LABELS[slot]} for ${shortHeroName(heroId)}.`, 'info')
  }

  function handleEquipStack(stack: GearStack, heroId = activeTarget?.heroId ?? selectedHeroId) {
    if (!heroId) {
      showNotice('No squad target selected.', 'warn')
      return
    }
    const slot = stack.slot
    const gear = bestInstanceForTarget(stack, heroId)
    if (!gear) {
      showNotice(`No ${SLOT_LABELS[slot]} copy is available to equip.`, 'warn')
      return
    }
    equipGear(gear.instanceId, heroId, slot)
    playSound('reward_gear_equip_clink')
    setSelectedHeroId(heroId)
    setSelectedSlot(slot)
    setSelectedGearId(stack.id)
    showNotice(`Equipped ${stack.displayName} to ${shortHeroName(heroId)}.`, 'success')
    if (equipPicker) {
      setEquipPicker(null)
      setTab('loadout')
    }
  }

  function handleUnequipSelected() {
    if (!selectedStack || !activeTarget || !selectedStackOnTarget) {
      showNotice('This selected item is not equipped on the target hero.', 'warn')
      return
    }
    const targetName = activeTarget ? shortHeroName(activeTarget.heroId) : 'hero'
    const itemName = getGearVisual(selectedStackOnTarget.id)?.displayName ?? selectedStackOnTarget.id
    unequipGear(selectedStackOnTarget.instanceId)
    playSound('ui_tab_slide')
    showNotice(`Unequipped ${itemName} from ${targetName}.`, 'success')
  }

  function handleAutoEquip() {
    if (activeSquad.length === 0) {
      showNotice('Add heroes to the squad before auto-equipping.', 'warn')
      return
    }
    const used = new Set<string>()
    let equippedCount = 0

    for (const heroId of activeSquad) {
      const role = getHeroRole(heroId)
      for (const slot of SLOTS) {
        const candidate = ownedGear
          .filter(gear => getGearSlot(gear.id) === slot && !used.has(gear.instanceId))
          .sort((a, b) =>
            getRoleGearPowerScore(b, role) - getRoleGearPowerScore(a, role) ||
            compareGearInstances(a, b)
          )[0]
        if (!candidate) continue
        used.add(candidate.instanceId)
        equipGear(candidate.instanceId, heroId, slot)
        equippedCount++
      }
    }

    if (equippedCount > 0) {
      playSound('reward_gear_equip_clink')
      setTab('loadout')
      showNotice(`Auto-equipped ${equippedCount} best-fit items across the squad.`, 'success')
    } else {
      showNotice('No matching gear found for the current squad.', 'warn')
    }
  }

  function markForgeFlash(id: string) {
    setForgeFlashId(id)
    window.setTimeout(() => setForgeFlashId(current => current === id ? null : current), 850)
  }

  function handleUpgradeStack(stack: GearStack) {
    const target = stack.upgradeTarget
    if (!target) {
      showNotice(`${stack.displayName}: requires 3 matching copies.`, 'warn')
      return
    }
    const upgraded = upgradeGearWithDupes(target.instanceId)
    if (!upgraded) {
      showNotice(`${stack.displayName} could not be upgraded yet.`, 'warn')
      return
    }
    playSound('reward_level_up_flourish')
    setSelectedGearId(stack.id)
    markForgeFlash(stack.id)
    showNotice(`${stack.displayName} upgraded to +${normalizeGearStars((target.stars ?? 0) + 1)}.`, 'success')
  }

  function handleUpgradeAll() {
    const upgrades = upgradeAllGearWithDupes()
    if (upgrades <= 0) {
      showNotice('No upgrades ready. Collect duplicate item copies.', 'warn')
      return
    }
    playSound('reward_level_up_flourish')
    markForgeFlash('all')
    showNotice(`Completed ${upgrades} item upgrade${upgrades === 1 ? '' : 's'}.`, 'success')
  }

  function handleDismantleOne(stack: GearStack) {
    const item = stack.bestUnequipped
    if (!item) {
      showNotice('Only unequipped copies can be dismantled.', 'warn')
      return
    }
    const shards = DISMANTLE_SHARDS[stack.rarity] ?? 1
    removeGear(item.instanceId)
    addShards(shards)
    playSound('reward_shard_gain')
    emitGemScatter({ x: window.innerWidth / 2, y: window.innerHeight * 0.5 }, shards)
    showNotice(`Dismantled ${stack.displayName} for ${shards} shard${shards === 1 ? '' : 's'}.`, 'success')
  }

  function handleSelectStack(stack: GearStack) {
    setSelectedGearId(stack.id)
    if (tab === 'items' && !equipPicker) {
      setSelectedSlot(stack.slot)
      showNotice(`${stack.displayName} selected.`, 'info')
    }
  }

  const renderStackCard = (stack: GearStack) => {
    const selected = selectedStack?.id === stack.id
    const rankLabel = getGearRankLabel(stack.best)
    const targetHeroId = activeTarget?.heroId ?? ''
    const canEquipToTarget = Boolean(targetHeroId && equipPicker)
    const equippedOnTarget = Boolean(targetHeroId && stack.items.some(g =>
      g.equipped &&
      g.equippedHeroId === targetHeroId &&
      g.equippedSlot === stack.slot
    ))

    return (
      <article
        key={stack.id}
        className={styles.stackCard}
        data-selected={selected ? 'true' : undefined}
        data-rarity={stack.rarity}
        data-upgrade={stack.upgradeTarget ? 'true' : undefined}
        data-flash={forgeFlashId === stack.id || forgeFlashId === 'all' ? 'true' : undefined}
        onClick={() => handleSelectStack(stack)}
      >
        <div className={styles.iconWrap}>
          <GearIcon
            id={stack.id}
            displayName={stack.displayName}
            slot={stack.slot}
            rarity={stack.rarity}
            size={58}
            selected={selected}
          />
        </div>
        <div className={styles.stackInfo}>
          <span className={styles.stackName}>{stack.displayName}</span>
          <span className={styles.stackBadgeRow}>
            <span className={styles.countBadge}>x{stack.count}</span>
            {stack.upgradeTarget && <span className={styles.upgradeBadge}>UPGRADE READY</span>}
            {stack.equippedCount > 0 && <span className={styles.equippedBadge}>EQUIPPED x{stack.equippedCount}</span>}
          </span>
          <span className={styles.stackMeta}>
            {stack.rarity.toUpperCase()} | {SLOT_LABELS[stack.slot]}{rankLabel ? ` | ${rankLabel}` : ''}
          </span>
          <span className={styles.stackStats}>{getGearStatLine(stack.id, stack.best.stars ?? 0)}</span>
        </div>
        <div className={styles.stackActions}>
          {tab === 'forge' ? (
            <button
              type="button"
              className={styles.upgradeMiniBtn}
              onClick={event => {
                event.stopPropagation()
                handleUpgradeStack(stack)
              }}
              disabled={!stack.upgradeTarget}
            >
              UPGRADE
            </button>
          ) : (
            <button
              type="button"
              className={styles.quickEquip}
              onClick={event => {
                event.stopPropagation()
                if (equipPicker) handleEquipStack(stack)
                else handleSelectStack(stack)
              }}
              disabled={Boolean(equipPicker) && (!canEquipToTarget || equippedOnTarget)}
            >
              {equipPicker ? equippedOnTarget ? 'ON' : 'EQUIP' : 'VIEW'}
            </button>
          )}
        </div>
      </article>
    )
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Equipment</span>
          <h1 className={styles.title}>{screenTitle}</h1>
        </div>
        <button
          type="button"
          className={styles.autoEquipBtn}
          onClick={handleAutoEquip}
          disabled={activeSquad.length === 0 || ownedGear.length === 0}
        >
          AUTO EQUIP
        </button>
      </header>

      <nav className={styles.tabs} aria-label="Gear sections">
        {([
          ['loadout', 'Squad', `${activeEquippedCount}/${activeSquad.length * SLOTS.length}`],
          ['items', 'Items', `${stacks.length}`],
          ['forge', 'Forge', `${upgradeReadyCount}`],
        ] as Array<[MainTab, string, string]>).map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            className={styles.tabBtn}
            data-active={tab === id ? 'true' : undefined}
            onClick={() => {
              setTab(id)
              setEquipPicker(null)
              if (id === 'items') {
                setSlotFilter('all')
                setEquipFilter('all')
              }
              if (id === 'loadout') showNotice('Loadout view active.', 'info')
              if (id === 'items') showNotice('Item bag open.', 'info')
              if (id === 'forge') showNotice(`${upgradeReadyCount} forge upgrade${upgradeReadyCount === 1 ? '' : 's'} ready.`, 'info')
            }}
          >
            <span>{label}</span>
            <strong>{count}</strong>
          </button>
        ))}
      </nav>

      <div key={notice.nonce} className={styles.noticeBar} data-tone={notice.tone}>
        <span>{notice.tone === 'success' ? 'DONE' : notice.tone === 'warn' ? 'CHECK' : 'TIP'}</span>
        <strong>{notice.text}</strong>
      </div>

      <main className={styles.contentGrid} data-tab={tab}>
        {tab === 'loadout' ? (
          <section className={`${styles.panel} ${styles.loadoutPanel}`}>
            <div className={styles.sectionHead}>
              <span>{sectionTitle}</span>
              <strong>{sectionMeta}</strong>
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
                        type="button"
                        className={styles.heroButton}
                        onClick={() => setSelectedHeroId(heroId)}
                      >
                        <SpriteCharacter
                          assetId={heroId}
                          rarity={(hero?.rarity as Rarity | undefined) ?? 'common'}
                          size={36}
                        />
                        <span>
                          <strong>{shortHeroName(heroId)}</strong>
                          <small>{getHeroRole(heroId).toUpperCase()} | {equippedCount}/3</small>
                        </span>
                      </button>

                      <div className={styles.slotGrid}>
                        {SLOTS.map(slot => {
                          const equipped = getEquippedGear(ownedGear, heroId, slot)
                          const visual = equipped ? getGearVisual(equipped.id) : null
                          const rarity = equipped ? getGearRarity(equipped.id) : 'common'
                          const active = selectedHeroId === heroId && selectedSlot === slot
                          const upgradeReady = equipped ? Boolean(findUpgradeableGearInstance(ownedGear, equipped.id)) : false
                          return (
                            <button
                              key={slot}
                              type="button"
                              className={styles.slotTile}
                              data-active={active ? 'true' : undefined}
                              data-filled={equipped ? 'true' : undefined}
                              onClick={() => openSlotPicker(heroId, slot)}
                            >
                              <span className={styles.slotAbbr}>{SLOT_ABBR[slot]}</span>
                              {equipped && visual ? (
                                <>
                                  <GearIcon
                                    id={equipped.id}
                                    displayName={visual.displayName}
                                    slot={slot}
                                    rarity={rarity}
                                    size={32}
                                  />
                                  <span className={styles.slotItem}>{visual.displayName}</span>
                                  <span className={styles.slotMeta}>
                                    {getGearRankLabel(equipped) || 'BASE'}{upgradeReady ? ' | UP' : ''}
                                  </span>
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
        ) : (
          <section className={styles.panel}>
            <div className={styles.sectionHead}>
              <span>{sectionTitle}</span>
              <strong>{tab === 'forge' || isSlotPicker ? `${filteredStacks.length}/${stacks.length}` : sectionMeta}</strong>
            </div>

            {equipPicker && (
              <div className={styles.targetStrip}>
                <button
                  type="button"
                  className={styles.backBtn}
                  onClick={() => {
                    setEquipPicker(null)
                    setTab('loadout')
                    showNotice('Loadout view active.', 'info')
                  }}
                >
                  BACK
                </button>
                <div className={styles.targetMain}>
                  <span>{shortHeroName(equipPicker.heroId)}</span>
                  <strong>{SLOT_LABELS[equipPicker.slot]}</strong>
                  <small>{targetEquipped ? getGearVisual(targetEquipped.id)?.displayName ?? targetEquipped.id : 'Empty slot'}</small>
                </div>
                <span className={styles.targetPill}>{filteredStacks.length} choices</span>
              </div>
            )}

            {tab === 'items' && !equipPicker && (
              <div className={styles.inventoryBar}>
                <span><strong>{totalItemCount}</strong> items</span>
                <span><strong>{stacks.length}</strong> stacks</span>
                <span><strong>{activeEquippedCount}</strong> equipped</span>
                <span data-ready={upgradeReadyCount > 0 ? 'true' : undefined}><strong>{upgradeReadyCount}</strong> upgrades</span>
              </div>
            )}

            {tab !== 'forge' && (
              <div className={styles.filters}>
                <div className={styles.segmented} aria-label="Slot filter">
                  {(['all', ...SLOTS] as SlotFilter[]).map(slot => (
                    <button
                      key={slot}
                      type="button"
                      className={styles.filterBtn}
                      data-active={(equipPicker?.slot ?? slotFilter) === slot ? 'true' : undefined}
                      onClick={() => {
                        if (equipPicker) return
                        setSlotFilter(slot)
                      }}
                      disabled={Boolean(equipPicker)}
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
            )}

            {tab === 'forge' && (
              <div className={styles.forgeBar}>
                <span>{upgradeReadyCount} ready</span>
                <button
                  type="button"
                  className={styles.upgradeAllBtn}
                  onClick={handleUpgradeAll}
                  disabled={upgradeReadyCount === 0}
                >
                  UPGRADE ALL
                </button>
              </div>
            )}

            <div className={styles.stackList}>
              {filteredStacks.length === 0 ? (
                <div className={styles.emptyBlock}>No items found.</div>
              ) : (
                filteredStacks.map(renderStackCard)
              )}
            </div>
          </section>
        )}

        {tab !== 'loadout' && (
          <aside
            className={styles.detail}
            data-flash={selectedStack && (forgeFlashId === selectedStack.id || forgeFlashId === 'all') ? 'true' : undefined}
          >
          {selectedStack && selectedGear ? (
            <>
              <div className={styles.detailTop}>
                <div className={styles.detailIconWrap}>
                  <GearIcon
                    id={selectedStack.id}
                    displayName={selectedStack.displayName}
                    slot={selectedStack.slot}
                    rarity={selectedStack.rarity}
                    size={78}
                    selected
                  />
                </div>
                <div className={styles.detailCopy}>
                  <span className={styles.detailName}>{selectedStack.displayName}</span>
                  <span className={styles.stackBadgeRow}>
                    <span className={styles.countBadge}>x{selectedStack.count}</span>
                    {selectedStack.upgradeTarget && <span className={styles.upgradeBadge}>UPGRADE READY</span>}
                    {selectedStack.equippedCount > 0 && <span className={styles.equippedBadge}>EQUIPPED x{selectedStack.equippedCount}</span>}
                  </span>
                  <span className={styles.detailMeta}>
                    {selectedStack.rarity.toUpperCase()} | {SLOT_LABELS[selectedStack.slot]}{selectedStars > 0 ? ` | +${selectedStars}` : ''}
                  </span>
                  <span className={styles.detailStats}>{selectedStatLine}</span>
                  {selectedStack.upgradeTarget && (
                    <span className={styles.detailForge}>Upgrade ready</span>
                  )}
                </div>
              </div>

              {selectedStack.upgradeTarget && nextStatLine && (
                <div className={styles.compareBox}>
                  <span>Next</span>
                  <strong>{nextStatLine}</strong>
                </div>
              )}

              {tab === 'items' && !equipPicker && activeSquad.length > 0 && (
                <div className={styles.heroTargetBlock}>
                  <div className={styles.detailSubhead}>
                    <span>Equip To</span>
                    <strong>{SLOT_LABELS[selectedStack.slot]}</strong>
                  </div>
                  <div className={styles.heroTargets}>
                    {activeSquad.map(heroId => {
                      const current = getEquippedGear(ownedGear, heroId, selectedStack.slot)
                      const selectedOnHero = current?.id === selectedStack.id
                      const actionLabel = selectedOnHero ? 'ON' : current ? 'SWAP' : 'EQUIP'
                      return (
                        <button
                          key={heroId}
                          type="button"
                          className={styles.heroTarget}
                          data-active={selectedOnHero ? 'true' : undefined}
                          data-selected={selectedHeroId === heroId ? 'true' : undefined}
                          onClick={() => {
                            setSelectedHeroId(heroId)
                            setSelectedSlot(selectedStack.slot)
                            handleEquipStack(selectedStack, heroId)
                          }}
                          disabled={selectedOnHero}
                        >
                          <span>{shortHeroName(heroId)}</span>
                          <small>{actionLabel}</small>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className={styles.actionRow} data-mode={tab}>
                {tab === 'items' && (
                  <button
                    type="button"
                    className={styles.equipBtn}
                    onClick={() => handleEquipStack(selectedStack)}
                    disabled={!activeTarget}
                  >
                    {equipPicker ? 'EQUIP SLOT' : selectedHeroId ? `EQUIP ${shortHeroName(selectedHeroId).toUpperCase()}` : 'EQUIP'}
                  </button>
                )}
                <button
                  type="button"
                  className={styles.upgradeBtn}
                  onClick={() => handleUpgradeStack(selectedStack)}
                  disabled={!selectedStack.upgradeTarget}
                >
                  {selectedStars >= MAX_GEAR_STARS ? 'MAX' : 'UPGRADE'}
                </button>
                {tab === 'items' && (
                  <button
                    type="button"
                    className={styles.unequipBtn}
                    onClick={handleUnequipSelected}
                    disabled={!selectedStackOnTarget}
                  >
                    UNEQUIP
                  </button>
                )}
                <button
                  type="button"
                  className={styles.dismantleBtn}
                  onClick={() => handleDismantleOne(selectedStack)}
                  disabled={!selectedStack.bestUnequipped}
                >
                  SHARDS +{DISMANTLE_SHARDS[selectedStack.rarity] ?? 1}
                </button>
              </div>
            </>
          ) : (
            <div className={styles.detailEmpty}>
              <span>No item selected</span>
              <small>{tab === 'forge' ? 'No forge-ready selection.' : 'Inventory stack details.'}</small>
            </div>
          )}
          </aside>
        )}
      </main>
    </div>
  )
}
