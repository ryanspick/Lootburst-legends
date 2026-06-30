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

type PullPayment = 'key' | 'gems'
interface DupeNotif { heroName: string; shards: number }
interface Props { onPull?: () => void }

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

export default function CapsuleScreen({ onPull }: Props = {}) {
  const [pulling, setPulling] = useState(false)
  const [lastResult, setLastResult] = useState<Rarity | null>(null)
  const [capsuleSprites, setCapsuleSprites] = useState<Partial<Record<Rarity, string>>>({})
  const [tenPullItems, setTenPullItems] = useState<LootItem[] | null>(null)
  const [dupeNotif, setDupeNotif] = useState<DupeNotif | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const pity = useGameStore(s => s.pityCount)
  const gems = useGameStore(s => s.gems)
  const keys = useGameStore(s => s.keys)
  const ownedHeroes = useGameStore(s => s.ownedHeroes)
  const spendGems = useGameStore(s => s.spendGems)
  const spendKeys = useGameStore(s => s.spendKeys)
  const addHero = useGameStore(s => s.addHero)
  const incrementPity = useGameStore(s => s.incrementPity)
  const resetPity = useGameStore(s => s.resetPity)
  const recordCapsulePull = useGameStore(s => s.recordCapsulePull)
  const capsuleSkin = useGameStore(s => s.equippedCosmetics?.capsule ?? 'capsule_classic')

  const rarities: Rarity[] = ['common','uncommon','rare','epic','legendary','mythic']
  const canSinglePull = keys > 0 || gems >= PULL_COSTS.single
  const canTenPull = keys >= 10 || gems >= PULL_COSTS.ten
  const singleCostLabel = keys > 0 ? 'KEY x1' : `GEM ${PULL_COSTS.single}`
  const tenCostLabel = keys >= 10 ? 'KEY x10' : `GEM ${PULL_COSTS.ten}`
  const readyOpenCount = keys > 0 ? keys : Math.floor(gems / PULL_COSTS.single)
  const readyStatus = readyOpenCount > 0
    ? `${readyOpenCount} capsule open${readyOpenCount === 1 ? '' : 's'} ready`
    : `Need 1 key or ${PULL_COSTS.single} gems`

  useEffect(() => {
    const sprites: Partial<Record<Rarity, string>> = {}
    for (const r of rarities) {
      sprites[r] = generateCapsuleSprite(r)
    }
    setCapsuleSprites(sprites)
  }, [])

  function resolvePull(): Rarity {
    const nextPity = useGameStore.getState().pityCount + 1
    const rarity = nextPity >= PITY_MAX ? 'legendary' : rollRarity()
    if (rarity === 'legendary' || rarity === 'mythic') resetPity()
    else incrementPity()
    return rarity
  }

  function spendSinglePull(): PullPayment | null {
    if (keys > 0 && spendKeys(1)) return 'key'
    if (spendGems(PULL_COSTS.single)) return 'gems'
    return null
  }

  function spendTenPull(): PullPayment | null {
    if (keys >= 10 && spendKeys(10)) return 'key'
    if (spendGems(PULL_COSTS.ten)) return 'gems'
    return null
  }

  async function doPull() {
    if (pulling) return
    const payment = spendSinglePull()
    if (!payment) {
      setNotice(`Need 1 key or ${PULL_COSTS.single} gems.`)
      return
    }

    setNotice(payment === 'key' ? 'Opening with 1 key.' : `Opening with ${PULL_COSTS.single} gems.`)
    setPulling(true)
    playSound('ui_pull_button_charge')
    await new Promise(r => setTimeout(r, 300))
    playSound('reward_capsule_spin')

    const rarity = resolvePull()
    const heroId = pickHeroForRarity(rarity)
    const heroName = heroesData.heroes.find(h => h.id === heroId)?.displayName ?? heroId
    const isDupe = ownedHeroes.some(h => h.id === heroId)
    addHero(heroId)
    recordCapsulePull()
    onPull?.()
    setLastResult(rarity)

    if (isDupe) {
      setDupeNotif({ heroName, shards: DUPE_SHARDS })
    }
    setNotice(isDupe ? `${heroName} duplicate converted to shards.` : `${heroName} joined your roster.`)

    await playRarityReveal({
      rarity,
      position: { x: 200, y: 300 },
      rewardType: 'hero',
      rewardName: heroName,
      iconAssetId: heroId,
      mode: isDupe ? 'reward_card' : 'capsule_reveal',
    })
    setPulling(false)
  }

  function doTenPull() {
    if (pulling) return
    const payment = spendTenPull()
    if (!payment) {
      setNotice(`Need 10 keys or ${PULL_COSTS.ten} gems.`)
      return
    }

    setNotice(payment === 'key' ? 'Opening 10 capsules with keys.' : `Opening 10 capsules with ${PULL_COSTS.ten} gems.`)
    setPulling(true)
    playSound('ui_pull_button_charge')

    const items: LootItem[] = []
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
        name: isDupe ? `${hero?.displayName ?? heroId} *DUP` : (hero?.displayName ?? heroId),
        rarity,
        type: 'hero',
        assetId: heroId,
      })
    }
    setNotice('10 capsule rewards ready to claim.')
    setTenPullItems(items)
  }

  return (
    <div className={styles.screen}>
      <SparkleLayer active density={3} colors={['#ffd700','#aa44ff','#ffffff','#ff69b4']} />

      <div className={styles.banner}>
        <h2 className={styles.bannerTitle}>Hero Capsule</h2>
        <span className={styles.bannerSub}>Legendary pity by pull {PITY_MAX}</span>
      </div>

      <div className={styles.resourceStrip} aria-live="polite">
        <span className={styles.resourcePill}>KEYS {keys}</span>
        <span className={styles.resourcePill}>GEMS {gems}</span>
        <span className={styles.resourceStatus}>{notice ?? readyStatus}</span>
      </div>

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
              capsuleSprites.common ? (
                <img
                  src={capsuleSprites.common}
                  alt="capsule"
                  className={styles.capsulePlaceholder}
                  style={{ width: 56, height: 56, imageRendering: 'pixelated', animation: 'bob 2s ease-in-out infinite' }}
                />
              ) : (
                <span className={styles.capsuleFallback}>CAP</span>
              )
            )}
          </div>
          <div
            className={styles.lever}
            data-disabled={pulling || !canSinglePull}
            onClick={!pulling && canSinglePull ? doPull : undefined}
            role="button"
            aria-label="Open one capsule"
          >
            <div className={`${styles.leverArm} ${pulling ? styles.leverPulled : ''}`} />
          </div>
        </div>
      </div>

      <PityMeter pulls={pity} pityThreshold={PITY_MAX} guaranteedRarity="LEGENDARY" />

      <div className={styles.pullButtons}>
        <PixelButton
          variant="secondary"
          size="sm"
          onClick={doPull}
          disabled={pulling || !canSinglePull}
        >
          OPEN 1 - {singleCostLabel}
        </PixelButton>
        <PixelButton
          variant="primary"
          size="sm"
          onClick={doTenPull}
          pulse={!pulling}
          disabled={pulling || !canTenPull}
        >
          OPEN 10 - {tenCostLabel}
        </PixelButton>
      </div>

      <OddsPanel
        odds={ODDS.map(o => ({ rarity: o.rarity, chance: o.pct }))}
        pullCost={PULL_COSTS.single}
        currency="GEM"
      />

      {dupeNotif && (
        <DuplicateShardConversion
          heroName={dupeNotif.heroName}
          shardsGained={dupeNotif.shards}
          onDone={() => setDupeNotif(null)}
        />
      )}

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
