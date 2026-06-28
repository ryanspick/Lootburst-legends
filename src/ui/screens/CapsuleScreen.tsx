import { useState, useEffect } from 'react'
import PixelButton from '@/ui/components/PixelButton'
import RarityFrame from '@/ui/components/RarityFrame'
import LootBurstOverlay from '@/ui/components/LootBurstOverlay'
import SparkleLayer from '@/ui/components/SparkleLayer'
import DuplicateShardConversion from '@/ui/components/DuplicateShardConversion'
import PityMeter from '@/ui/components/PityMeter'
import OddsPanel from '@/ui/components/OddsPanel'
import type { LootItem } from '@/ui/components/LootBurstOverlay'
import { playRarityReveal } from '@/vfx/rarityReveal'
import { playSound } from '@/audio/soundEvents'
import { generateCapsuleSprite } from '@/art/generated'
import { useGameStore } from '@/store/gameStore'
import heroesData from '@/data/art/heroes.visual.json'
import { RARITY_COLOURS } from '@/constants/palette'
import type { Rarity } from '@/constants/palette'
import styles from './CapsuleScreen.module.css'

const PULL_COSTS = { single: 160, ten: 1440 }
const PITY_MAX = 80
const ODDS = [
  { rarity: 'common' as Rarity,    pct: 58 },
  { rarity: 'uncommon' as Rarity,  pct: 27 },
  { rarity: 'rare' as Rarity,      pct: 10 },
  { rarity: 'epic' as Rarity,      pct: 4 },
  { rarity: 'legendary' as Rarity, pct: 0.9 },
  { rarity: 'mythic' as Rarity,    pct: 0.1 },
]

const DUPE_SHARDS = 10

function rollRarity(): Rarity {
  const r = Math.random() * 100
  let acc = 0
  for (const o of ODDS) {
    acc += o.pct
    if (r < acc) return o.rarity
  }
  return 'common'
}

function pickHeroForRarity(rarity: Rarity): string {
  const pool = heroesData.heroes.filter(h => h.rarity === rarity)
  if (!pool.length) return heroesData.heroes[0].id
  return pool[Math.floor(Math.random() * pool.length)].id
}

interface DupeNotif { heroName: string; shards: number }

interface Props { onPull?: () => void }

export default function CapsuleScreen({ onPull }: Props = {}) {
  const [pulling, setPulling] = useState(false)
  const [lastResult, setLastResult] = useState<Rarity | null>(null)
  const [capsuleSprites, setCapsuleSprites] = useState<Partial<Record<Rarity, string>>>({})
  const [tenPullItems, setTenPullItems] = useState<LootItem[] | null>(null)
  const [dupeNotif, setDupeNotif] = useState<DupeNotif | null>(null)

  const pity = useGameStore(s => s.pityCount)
  const gems = useGameStore(s => s.gems)
  const ownedHeroes = useGameStore(s => s.ownedHeroes)
  const spendGems = useGameStore(s => s.spendGems)
  const addHero = useGameStore(s => s.addHero)
  const incrementPity = useGameStore(s => s.incrementPity)
  const resetPity = useGameStore(s => s.resetPity)
  const recordCapsulePull = useGameStore(s => s.recordCapsulePull)
  const capsuleSkin = useGameStore(s => s.equippedCosmetics?.capsule ?? 'capsule_classic')

  const rarities: Rarity[] = ['common','uncommon','rare','epic','legendary','mythic']

  useEffect(() => {
    const sprites: Partial<Record<Rarity, string>> = {}
    for (const r of rarities) {
      sprites[r] = generateCapsuleSprite(r)
    }
    setCapsuleSprites(sprites)
  }, [])

  function resolvePull(): Rarity {
    const nextPity = pity + 1
    const rarity = nextPity >= PITY_MAX ? 'legendary' : rollRarity()
    if (rarity === 'legendary' || rarity === 'mythic') resetPity()
    else incrementPity()
    return rarity
  }

  async function doPull() {
    if (pulling) return
    if (!spendGems(PULL_COSTS.single)) return
    setPulling(true)
    playSound('ui_pull_button_charge')
    await new Promise(r => setTimeout(r, 300))
    playSound('reward_capsule_spin')

    const rarity = resolvePull()
    const heroId = pickHeroForRarity(rarity)
    const isDupe = ownedHeroes.some(h => h.id === heroId)
    addHero(heroId)
    recordCapsulePull()
    onPull?.()
    setLastResult(rarity)

    if (isDupe) {
      const hero = heroesData.heroes.find(h => h.id === heroId)
      setDupeNotif({ heroName: hero?.displayName ?? heroId, shards: DUPE_SHARDS })
    }

    await playRarityReveal({
      rarity,
      position: { x: 200, y: 300 },
      rewardType: 'hero',
      rewardName: heroesData.heroes.find(h => h.id === heroId)?.displayName ?? 'Hero',
      iconAssetId: heroId,
      mode: isDupe ? 'reward_card' : 'capsule_reveal',
    })
    setPulling(false)
  }

  function doTenPull() {
    if (pulling) return
    if (!spendGems(PULL_COSTS.ten)) return
    setPulling(true)
    playSound('ui_pull_button_charge')

    const items: LootItem[] = []
    // snapshot owned heroes before any addHero calls so dupe check is accurate per-pull
    const ownedSnapshot = new Set(ownedHeroes.map(h => h.id))
    for (let i = 0; i < 10; i++) {
      const rarity = resolvePull()
      const heroId = pickHeroForRarity(rarity)
      const isDupe = ownedSnapshot.has(heroId)
      if (!isDupe) ownedSnapshot.add(heroId)
      addHero(heroId)
      recordCapsulePull()
      if (i === 9) onPull?.()
      const hero = heroesData.heroes.find(h => h.id === heroId)
      items.push({
        id: `pull_${i}_${heroId}`,
        name: isDupe ? `${hero?.displayName ?? heroId} ✦DUP` : (hero?.displayName ?? heroId),
        rarity,
        type: 'hero',
        assetId: heroId,
      })
    }
    setTenPullItems(items)
  }

  return (
    <div className={styles.screen}>
      <SparkleLayer active density={3} colors={['#ffd700','#aa44ff','#ffffff','#ff69b4']} />

      <div className={styles.banner}>
        <h2 className={styles.bannerTitle}>✨ Hero Capsule</h2>
        <span className={styles.bannerSub}>Pity guarantee: legendary by pull {PITY_MAX}</span>
      </div>

      {/* Machine visual */}
      <div className={styles.machine}>
        <div className={`${styles.machineBody} ${pulling ? styles.machineActive : ''}`} data-skin={capsuleSkin}>
          <div className={styles.capsuleWindow}>
            {lastResult ? (
              <RarityFrame rarity={lastResult} size={72} animate>
                {capsuleSprites[lastResult] ? (
                  <img
                    src={capsuleSprites[lastResult]}
                    alt={lastResult}
                    style={{ width: 56, height: 56, imageRendering: 'pixelated', display: 'block' }}
                  />
                ) : (
                  <div style={{ width: 56, height: 56, background: RARITY_COLOURS[lastResult].primary, borderRadius: '50%' }} />
                )}
              </RarityFrame>
            ) : (
              capsuleSprites['common'] ? (
                <img
                  src={capsuleSprites['common']}
                  alt="capsule"
                  className={styles.capsulePlaceholder}
                  style={{ width: 56, height: 56, imageRendering: 'pixelated', animation: 'bob 2s ease-in-out infinite' }}
                />
              ) : (
                <span className={styles.capsulePlaceholder}>🔮</span>
              )
            )}
          </div>
          <div className={styles.lever} onClick={!pulling ? doPull : undefined}>
            <div className={`${styles.leverArm} ${pulling ? styles.leverPulled : ''}`} />
          </div>
        </div>
      </div>

      {/* Pity meter */}
      <PityMeter pulls={pity} pityThreshold={PITY_MAX} guaranteedRarity="LEGENDARY" />

      {/* Gem balance */}
      <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
        💎 {gems} gems
      </div>

      {/* Pull buttons */}
      <div className={styles.pullButtons}>
        <PixelButton
          variant="secondary"
          size="md"
          onClick={doPull}
          disabled={pulling || gems < PULL_COSTS.single}
        >
          × 1 Pull — 💎 {PULL_COSTS.single}
        </PixelButton>
        <PixelButton
          variant="primary"
          size="md"
          onClick={doTenPull}
          pulse={!pulling}
          disabled={pulling || gems < PULL_COSTS.ten}
        >
          × 10 Pull — 💎 {PULL_COSTS.ten}
        </PixelButton>
      </div>

      {/* Odds */}
      <OddsPanel
        odds={ODDS.map(o => ({ rarity: o.rarity, chance: o.pct }))}
        pullCost={PULL_COSTS.single}
        currency="💎"
      />

      {/* Duplicate shard conversion toast */}
      {dupeNotif && (
        <DuplicateShardConversion
          heroName={dupeNotif.heroName}
          shardsGained={dupeNotif.shards}
          onDone={() => setDupeNotif(null)}
        />
      )}

      {/* 10-pull multi-reveal */}
      {tenPullItems && (
        <LootBurstOverlay
          items={tenPullItems}
          onClaim={() => {
            setTenPullItems(null)
            setPulling(false)
          }}
        />
      )}
    </div>
  )
}
