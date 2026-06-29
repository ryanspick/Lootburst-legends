import { useEffect, useRef, useState } from 'react'
import type { Rarity } from '@/constants/palette'
import { RARITY_COLOURS } from '@/constants/palette'
import { emitChestVolcano, emitGoldBeam, emitCoinBurst } from '@/vfx/emitters'
import { playRarityReveal } from '@/vfx/rarityReveal'
import { triggerShake } from '@/animation/screenShake'
import { generateChestSprite, generateRewardIcon, getGeneratedSprite } from '@/art/generated'
import { playSound } from '@/audio/soundEvents'
import styles from './LootBurstOverlay.module.css'

export interface LootItem {
  id: string
  name: string
  rarity: Rarity
  type: 'hero' | 'gear' | 'gem' | 'coin' | 'shard'
  assetId?: string
}

interface Props {
  items: LootItem[]
  gold?: number
  xp?: number
  onClaim: () => void
}

type Phase = 'chest_land' | 'chest_shake' | 'chest_burst' | 'items_cascade' | 'summary'

function getLootIcon(item: LootItem): string {
  if ((item.type === 'hero' || item.type === 'gear') && item.assetId) {
    return getGeneratedSprite(item.assetId) ?? generateRewardIcon('loot', item.rarity)
  }
  if (item.type === 'coin') return generateRewardIcon('gold', item.rarity)
  if (item.type === 'gem') return generateRewardIcon('gem', item.rarity)
  if (item.type === 'shard') return generateRewardIcon('shard', item.rarity)
  return generateRewardIcon('loot', item.rarity)
}

export default function LootBurstOverlay({ items, gold = 0, xp = 0, onClaim }: Props) {
  const [phase, setPhase] = useState<Phase>('chest_land')
  const [visibleItems, setVisibleItems] = useState<number>(0)
  const chestRef = useRef<HTMLDivElement>(null)

  const bestRarity = items.reduce<Rarity>((best, item) => {
    const order: Rarity[] = ['common','uncommon','rare','epic','legendary','mythic']
    return order.indexOf(item.rarity) > order.indexOf(best) ? item.rarity : best
  }, 'common')

  const chestDataUrl = generateChestSprite(bestRarity, 'closed')
  const chestOpenUrl = generateChestSprite(bestRarity, 'open')

  useEffect(() => {
    const seq: Array<[Phase, number]> = [
      ['chest_land',  400],
      ['chest_shake', 600],
      ['chest_burst', 800],
      ['items_cascade', 2000],
      ['summary', 0],
    ]
    let t = 0
    const timers: ReturnType<typeof setTimeout>[] = []
    let cascadeInterval: ReturnType<typeof setInterval> | null = null

    for (const [s, delay] of seq) {
      const captured = s
      t += delay
      timers.push(setTimeout(() => {
        setPhase(captured)
        if (captured === 'chest_land')  playSound('reward_chest_rattle')
        if (captured === 'chest_shake') playSound('reward_chest_crack')
        if (captured === 'chest_burst') {
          const rect = chestRef.current?.getBoundingClientRect()
          const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
          const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2
          playSound('reward_chest_volcano')
          triggerShake('bossDeath')
          emitChestVolcano({ x: cx, y: cy }, items.length)
          emitGoldBeam({ x: cx, y: cy })
          if (bestRarity === 'legendary' || bestRarity === 'mythic') {
            playRarityReveal({
              rarity: bestRarity,
              position: { x: cx, y: cy },
              rewardType: 'gear',
              rewardName: items.find(i => i.rarity === bestRarity)?.name ?? '',
              iconAssetId: items.find(i => i.rarity === bestRarity)?.assetId ?? '',
              mode: 'reward_card',
            })
          }
        }
        if (captured === 'items_cascade') {
          let i = 0
          cascadeInterval = setInterval(() => {
            i++
            setVisibleItems(i)
            if (i >= items.length) {
              clearInterval(cascadeInterval!)
              cascadeInterval = null
            }
          }, 150)
          emitCoinBurst({ x: window.innerWidth / 2, y: window.innerHeight * 0.5 }, gold > 0 ? Math.min(gold / 20, 30) : 5)
        }
      }, t))
    }
    return () => {
      timers.forEach(clearTimeout)
      if (cascadeInterval) clearInterval(cascadeInterval)
    }
  }, [])

  const rc = RARITY_COLOURS[bestRarity]

  return (
    <div className={styles.overlay}>
      {/* Chest */}
      {(phase === 'chest_land' || phase === 'chest_shake' || phase === 'chest_burst') && (
        <div
          ref={chestRef}
          className={[
            styles.chest,
            phase === 'chest_land' ? styles.chestLand : '',
            phase === 'chest_shake' ? styles.chestShake : '',
            phase === 'chest_burst' ? styles.chestBurst : '',
          ].filter(Boolean).join(' ')}
          style={{ '--chest-glow': rc.glow } as React.CSSProperties}
        >
          <img
            src={phase === 'chest_burst' ? chestOpenUrl : chestDataUrl}
            alt="chest"
            className={styles.chestImg}
            style={{ imageRendering: 'pixelated' }}
          />
          {phase === 'chest_shake' && (
            <div className={styles.beamLeaks}>
              {[0, 60, 120, 180, 240, 300].map(deg => (
                <div
                  key={deg}
                  className={styles.beamLeak}
                  style={{ transform: `rotate(${deg}deg)`, background: rc.primary }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Items cascade */}
      {(phase === 'items_cascade' || phase === 'summary') && (
        <div className={styles.itemsWrap}>
          <div className={styles.itemsTitle} style={{ color: rc.primary }}>
            LOOT DROPS
          </div>
          <div className={styles.itemGrid}>
            {items.slice(0, visibleItems).map((item, i) => {
              const irc = RARITY_COLOURS[item.rarity]
              return (
                <div
                  key={item.id}
                  className={styles.itemCard}
                  style={{
                    borderColor: irc.primary,
                    color: irc.primary,
                    animationDelay: `${i * 0.05}s`,
                  }}
                  data-rarity={item.rarity}
                >
                  <img
                    src={getLootIcon(item)}
                    alt=""
                    className={styles.itemIcon}
                    aria-hidden="true"
                  />
                  <span className={styles.itemName}>{item.name}</span>
                  <span className={styles.itemRarity} style={{ color: irc.primary }}>
                    {item.rarity.toUpperCase()}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Currency row */}
          {phase === 'summary' && (
            <div className={styles.currencyRow}>
              {gold > 0 && (
                <div className={styles.currencyItem}>
                  <img src={generateRewardIcon('gold', 'uncommon')} alt="" className={styles.currencyIcon} aria-hidden="true" />
                  <span className={styles.currencyVal} style={{ color: 'var(--gold)' }}>+{gold}</span>
                </div>
              )}
              {xp > 0 && (
                <div className={styles.currencyItem}>
                  <img src={generateRewardIcon('xp', bestRarity)} alt="" className={styles.currencyIcon} aria-hidden="true" />
                  <span className={styles.currencyVal} style={{ color: '#44ccff' }}>+{Math.round(xp)} XP</span>
                </div>
              )}
            </div>
          )}

          {phase === 'summary' && (
            <button
              className={styles.claimBtn}
              style={{ borderColor: rc.primary, boxShadow: `0 0 16px ${rc.glow}` }}
              onClick={onClaim}
            >
              COLLECT REWARDS
            </button>
          )}
        </div>
      )}
    </div>
  )
}
