import { useState, useMemo } from 'react'
import StarUpSequence from '@/ui/components/StarUpSequence'
import SynergyBadge from '@/ui/components/SynergyBadge'
import GearSlot from '@/ui/components/GearSlot'
import HeroCard from '@/ui/components/HeroCard'
import HeroDetailPanel from '@/ui/components/HeroDetailPanel'
import SquadSlot from '@/ui/components/SquadSlot'
import heroesData from '@/data/art/heroes.visual.json'
import { useGameStore } from '@/store/gameStore'
import type { Rarity } from '@/constants/palette'
import { emitUpgradeCardSparkle } from '@/vfx/emitters'
import { computeSynergies } from '@/game/synergy/synergyEngine'
import styles from './SquadScreen.module.css'

const SQUAD_SIZE = 3

const SLOT_CONFIG = [
  { slot: 'weapon', label: 'Weapon', icon: '⚔' },
  { slot: 'armor',  label: 'Armor',  icon: '🛡' },
  { slot: 'charm',  label: 'Charm',  icon: '💎' },
]

export default function SquadScreen() {
  const heroes = heroesData.heroes
  const [selected, setSelected] = useState<string | null>('hero_copper_knight')
  const [starUpHero, setStarUpHero] = useState<{ name: string; newStars: number; maxStars: number } | null>(null)

  const squadHeroIds = useGameStore(s => s.squadHeroIds)
  const ownedHeroes = useGameStore(s => s.ownedHeroes)
  const globalShards = useGameStore(s => s.shards)
  const setSquadSlot = useGameStore(s => s.setSquadSlot)
  const upgradeHeroStar = useGameStore(s => s.upgradeHeroStar)
  const equippedFrame = useGameStore(s => s.equippedCosmetics?.frame ?? 'frame_default')

  const squad = squadHeroIds
  const selectedHero = heroes.find(h => h.id === selected)
  const selectedOwned = ownedHeroes.find(o => o.id === selected)

  const synergies = useMemo(() => {
    const squadHeroes = squad
      .filter(Boolean)
      .map(id => heroes.find(h => h.id === id))
      .filter(Boolean)
      .map(h => ({ element: h!.element, role: h!.role }))
    return computeSynergies(squadHeroes)
  }, [squad, heroes])

  function assignToSquad(heroId: string) {
    if (!ownedHeroes.find(o => o.id === heroId)) return
    if (squad.includes(heroId)) return
    const emptySlot = squad.findIndex(id => !id)
    const slot = emptySlot >= 0 ? emptySlot : SQUAD_SIZE - 1
    setSquadSlot(slot as 0 | 1 | 2, heroId)
    emitUpgradeCardSparkle({ x: 180, y: 120, w: 40, h: 40 }, 'common')
  }

  function removeFromSquad(slot: number) {
    setSquadSlot(slot as 0 | 1 | 2, null)
  }

  function handleUpgrade(heroId: string) {
    const owned = ownedHeroes.find(h => h.id === heroId)
    const heroDef = heroes.find(h => h.id === heroId)
    if (!owned || !heroDef) return
    const cost = (owned.stars + 1) * 20
    if (owned.shards + globalShards < cost) return
    if (owned.stars >= heroDef.maxStars) return
    upgradeHeroStar(heroId)
    setStarUpHero({ name: heroDef.displayName, newStars: owned.stars + 1, maxStars: heroDef.maxStars })
  }

  return (
    <div className={styles.screen}>
      {/* Squad slots */}
      <div className={styles.squadSection}>
        <div className={styles.squadLabel}>ACTIVE SQUAD</div>
        <div className={styles.squadSlots}>
          {[...Array(SQUAD_SIZE)].map((_, i) => {
            const hId = squad[i]
            const h = hId ? heroes.find(x => x.id === hId) : null
            return (
              <SquadSlot
                key={i}
                index={i}
                hero={h ? { id: h.id, displayName: h.displayName, rarity: h.rarity as Rarity, element: h.element } : null}
                isActive={h?.id === selected}
                onClick={() => hId ? removeFromSquad(i) : undefined}
              />
            )
          })}
        </div>

        {/* Live synergy badges */}
        <div className={styles.synergyRow}>
          {synergies.length === 0 && (
            <span className={styles.synergyEmpty}>Add heroes to activate synergies</span>
          )}
          {synergies.map(s => (
            <SynergyBadge key={s.id} synergy={s} showTooltip />
          ))}
        </div>
      </div>

      {/* Selected hero detail */}
      {selectedHero && (
        <div className={styles.detail}>
          <HeroDetailPanel
            id={selectedHero.id}
            displayName={selectedHero.displayName}
            rarity={selectedHero.rarity as Rarity}
            element={selectedHero.element}
            role={selectedHero.role}
            stars={selectedOwned?.stars ?? 0}
            maxStars={selectedHero.maxStars}
            owned={selectedOwned ? { stars: selectedOwned.stars, shards: selectedOwned.shards, level: selectedOwned.level, xp: selectedOwned.xp } : undefined}
            globalShards={globalShards}
            inSquad={squad.includes(selectedHero.id)}
            onAddToSquad={selectedOwned ? () => assignToSquad(selectedHero.id) : undefined}
            onUpgrade={selectedOwned ? () => handleUpgrade(selectedHero.id) : undefined}
          />
          {/* Gear loadout */}
          <div className={styles.gearSlots}>
            {SLOT_CONFIG.map(cfg => (
              <GearSlot
                key={cfg.slot}
                slot={cfg.slot}
                slotLabel={cfg.label}
                slotIcon={cfg.icon}
              />
            ))}
          </div>
        </div>
      )}

      {/* Hero grid */}
      <div className={styles.grid}>
        {heroes.map(hero => {
          const owned = ownedHeroes.find(o => o.id === hero.id)
          const isLocked = !owned
          return (
            <HeroCard
              key={hero.id}
              id={hero.id}
              displayName={hero.displayName}
              rarity={hero.rarity as Rarity}
              element={hero.element}
              role={hero.role}
              stars={owned?.stars ?? 0}
              maxStars={hero.maxStars}
              level={owned?.level}
              inSquad={squad.includes(hero.id)}
              selected={selected === hero.id}
              locked={isLocked}
              frameStyle={equippedFrame}
              onClick={() => setSelected(hero.id)}
            />
          )
        })}
      </div>

      {/* Star-up sequence overlay */}
      {starUpHero && (
        <StarUpSequence
          heroName={starUpHero.name}
          newStars={starUpHero.newStars}
          maxStars={starUpHero.maxStars}
          onDone={() => setStarUpHero(null)}
        />
      )}
    </div>
  )
}
