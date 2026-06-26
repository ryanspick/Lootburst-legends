import { useState } from 'react'
import RarityFrame from '@/ui/components/RarityFrame'
import PixelPanel from '@/ui/components/PixelPanel'
import PixelButton from '@/ui/components/PixelButton'
import SpriteCharacter from '@/ui/components/SpriteCharacter'
import StarMeter from '@/ui/components/StarMeter'
import StarUpSequence from '@/ui/components/StarUpSequence'
import heroesData from '@/data/art/heroes.visual.json'
import { useGameStore } from '@/store/gameStore'
import type { Rarity } from '@/constants/palette'
import { ELEMENT_COLOURS } from '@/constants/palette'
import { emitUpgradeCardSparkle } from '@/vfx/emitters'
import styles from './SquadScreen.module.css'

const SHARDS_PER_STAR = 20

const SQUAD_SIZE = 3

const ROLE_ICONS: Record<string, string> = {
  tank: '🛡', healer: '💚', ranged: '🏹', caster: '🔮',
  assassin: '⚡', support: '🎺', blob: '🫧', reaper: '💀',
}

export default function SquadScreen() {
  const heroes = heroesData.heroes
  const [selected, setSelected] = useState<string | null>('hero_copper_knight')

  const [starUpHero, setStarUpHero] = useState<{ name: string; newStars: number; maxStars: number } | null>(null)

  const squadHeroIds = useGameStore(s => s.squadHeroIds)
  const ownedHeroes = useGameStore(s => s.ownedHeroes)
  const setSquadSlot = useGameStore(s => s.setSquadSlot)
  const upgradeHeroStar = useGameStore(s => s.upgradeHeroStar)

  const squad = squadHeroIds
  const selectedHero = heroes.find(h => h.id === selected)

  function assignToSquad(heroId: string) {
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
    const cost = (owned.stars + 1) * SHARDS_PER_STAR
    if (owned.shards < cost) return
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
              <div
                key={i}
                className={`${styles.squadSlot} ${!hId ? styles.squadEmpty : ''}`}
                onClick={() => hId ? removeFromSquad(i) : undefined}
              >
                {h ? (
                  <>
                    <SpriteCharacter assetId={h.id} rarity={h.rarity as Rarity} size={44} animate />
                    <span className={styles.squadSlotName}>{h.displayName.split(' ')[0]}</span>
                  </>
                ) : (
                  <span className={styles.squadEmptyIcon}>＋</span>
                )}
              </div>
            )
          })}
        </div>
        {/* Synergy placeholder */}
        <div className={styles.synergyRow}>
          <div className={styles.synergyBadge} data-active="true">⚙ Machine ×2</div>
          <div className={styles.synergyBadge}>🌿 Nature ×1</div>
        </div>
      </div>

      {/* Selected hero detail */}
      {selectedHero && (
        <PixelPanel rarity={selectedHero.rarity as Rarity} glow className={styles.detail}>
          <div className={styles.detailRow}>
            <RarityFrame rarity={selectedHero.rarity as Rarity} size={76} animate>
              <SpriteCharacter
                assetId={selectedHero.id}
                rarity={selectedHero.rarity as Rarity}
                size={60}
                animate
              />
            </RarityFrame>
            <div className={styles.detailInfo}>
              <span className={styles.heroName}>{selectedHero.displayName}</span>
              <div className={styles.heroTags}>
                <span
                  className={styles.heroTag}
                  style={{ color: ELEMENT_COLOURS[selectedHero.element] ?? '#aaaacc', borderColor: ELEMENT_COLOURS[selectedHero.element] ?? '#aaaacc' }}
                >
                  {selectedHero.element.toUpperCase()}
                </span>
                <span className={styles.heroTag}>
                  {ROLE_ICONS[selectedHero.role] ?? '✦'} {selectedHero.role}
                </span>
              </div>
              <StarMeter stars={selectedHero.stars} maxStars={selectedHero.maxStars} size="md" animate />
              {/* Gear slots */}
              <div className={styles.gearSlots}>
                {['weapon', 'armor', 'charm'].map(slot => (
                  <div key={slot} className={styles.gearSlot} title={slot}>
                    <span className={styles.gearSlotIcon}>
                      {slot === 'weapon' ? '⚔' : slot === 'armor' ? '🛡' : '💎'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className={styles.detailActions}>
            <PixelButton
              variant="secondary"
              size="sm"
              onClick={() => assignToSquad(selectedHero.id)}
              disabled={squad.includes(selectedHero.id)}
            >
              {squad.includes(selectedHero.id) ? '✓ In Squad' : '+ Add to Squad'}
            </PixelButton>
            <PixelButton
              variant="ghost"
              size="sm"
              onClick={() => selectedHero && handleUpgrade(selectedHero.id)}
              disabled={(() => {
                const owned = ownedHeroes.find(h => h.id === selectedHero?.id)
                if (!owned || !selectedHero) return true
                const cost = (owned.stars + 1) * SHARDS_PER_STAR
                return owned.shards < cost || owned.stars >= selectedHero.maxStars
              })()}
            >
              ⬆ Upgrade ({(() => {
                const owned = ownedHeroes.find(h => h.id === selectedHero?.id)
                return owned ? `${owned.shards}/${(owned.stars + 1) * SHARDS_PER_STAR} 🔮` : '—'
              })()})
            </PixelButton>
          </div>
        </PixelPanel>
      )}

      {/* Hero grid */}
      <div className={styles.grid}>
        {heroes.map(hero => (
          <button
            key={hero.id}
            className={[
              styles.heroCard,
              selected === hero.id ? styles.selected : '',
              squad.includes(hero.id) ? styles.inSquad : '',
            ].filter(Boolean).join(' ')}
            onClick={() => setSelected(hero.id)}
          >
            <RarityFrame rarity={hero.rarity as Rarity} size={52} animate={selected === hero.id}>
              <SpriteCharacter
                assetId={hero.id}
                rarity={hero.rarity as Rarity}
                size={44}
                animate={selected === hero.id}
              />
            </RarityFrame>
            <span className={styles.cardName}>{hero.displayName}</span>
            {squad.includes(hero.id) && <div className={styles.squadIndicator}>✓</div>}
          </button>
        ))}
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
