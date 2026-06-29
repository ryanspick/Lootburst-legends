import { useEffect, useRef, useState } from 'react'
import type { OfflineReward } from '@/game/offline/offlineRewardController'
import type { Rarity } from '@/constants/palette'
import { RARITY_COLOURS } from '@/constants/palette'
import PixelButton from '@/ui/components/PixelButton'
import { emitCoinBurst, emitGoldBeam, emitGemScatter } from '@/vfx/emitters'
import { playSound } from '@/audio/soundEvents'
import { bob } from '@/animation/motionPrimitives'
import { generateChestSprite, generateRewardIcon } from '@/art/generated'
import styles from './OfflineReturnSequence.module.css'

interface Props {
  reward: OfflineReward
  onClaim: () => void
}

type Phase = 'intro' | 'reveal' | 'claim'

export default function OfflineReturnSequence({ reward, onClaim }: Props) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [timeMs, setTimeMs] = useState(0)
  const rafRef = useRef<number>(0)
  const chestImg = generateChestSprite('rare', 'closed')
  const chestOpenImg = generateChestSprite('rare', 'open')

  const centerX = typeof window !== 'undefined' ? window.innerWidth / 2 : 180
  const centerY = typeof window !== 'undefined' ? window.innerHeight / 2 : 300

  useEffect(() => {
    playSound('reward_chest_rattle')

    const t1 = setTimeout(() => {
      setPhase('reveal')
      playSound('reward_chest_open')
      emitGoldBeam({ x: centerX, y: centerY - 60 })
      emitCoinBurst({ x: centerX, y: centerY }, 20)
      if (reward.gemsEarned > 0) emitGemScatter({ x: centerX, y: centerY }, 8)
    }, 800)

    return () => clearTimeout(t1)
  }, [])

  useEffect(() => {
    function frame(ts: number) {
      setTimeMs(ts)
      rafRef.current = requestAnimationFrame(frame)
    }
    rafRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  function handleClaim() {
    playSound('ui_button_pop')
    emitCoinBurst({ x: centerX, y: centerY }, 10)
    onClaim()
  }

  const chestBob = bob(timeMs, 6, 2000)
  const bestLootRarity: Rarity = reward.lootItems.reduce<Rarity>((best, item) => {
    const order: Rarity[] = ['common','uncommon','rare','epic','legendary','mythic']
    return order.indexOf(item.rarity) > order.indexOf(best) ? item.rarity : best
  }, 'common')

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <span className={styles.moonIcon}>🌙</span>
          <div>
            <div className={styles.title}>WELCOME BACK</div>
            <div className={styles.sub}>Away for {reward.durationLabel}</div>
          </div>
        </div>

        {/* Chest */}
        <div className={styles.chestWrap} style={{ transform: `translateY(${chestBob}px)` }}>
          {phase === 'reveal' && chestOpenImg ? (
            <img src={chestOpenImg} alt="chest open" className={styles.chestImg} />
          ) : chestImg ? (
            <img src={chestImg} alt="chest" className={styles.chestImg} />
          ) : (
            <span className={styles.chestEmoji}>{phase === 'reveal' ? '📭' : '📦'}</span>
          )}
        </div>

        {/* Rewards */}
        {phase === 'reveal' && (
          <div className={styles.rewards}>
            <div className={styles.rewardRow}>
              <img src={generateRewardIcon('gold', 'uncommon')} alt="" className={styles.rewardIcon} aria-hidden="true" />
              <span className={styles.rewardLabel}>Gold</span>
              <strong className={styles.rewardValue} style={{ color: '#ffd700' }}>
                +{reward.goldEarned.toLocaleString()}
              </strong>
            </div>
            {reward.gemsEarned > 0 && (
              <div className={styles.rewardRow}>
                <img src={generateRewardIcon('gem', 'rare')} alt="" className={styles.rewardIcon} aria-hidden="true" />
                <span className={styles.rewardLabel}>Gems</span>
                <strong className={styles.rewardValue} style={{ color: '#aa44ff' }}>
                  +{reward.gemsEarned}
                </strong>
              </div>
            )}
            {reward.shardEarned > 0 && (
              <div className={styles.rewardRow}>
                <img src={generateRewardIcon('shard', 'epic')} alt="" className={styles.rewardIcon} aria-hidden="true" />
                <span className={styles.rewardLabel}>Shards</span>
                <strong className={styles.rewardValue} style={{ color: '#44aaff' }}>
                  +{reward.shardEarned}
                </strong>
              </div>
            )}

            {reward.lootItems.length > 0 && (
              <div className={styles.lootSection}>
                <div className={styles.lootTitle}>LOOT FOUND</div>
                {reward.lootItems.map((item, i) => (
                  <div
                    key={i}
                    className={styles.lootItem}
                    style={{ borderColor: RARITY_COLOURS[item.rarity]?.primary ?? '#555' }}
                  >
                    <img
                      src={generateRewardIcon(item.type === 'gem' ? 'gem' : 'loot', item.rarity)}
                      alt=""
                      className={styles.lootIcon}
                      aria-hidden="true"
                    />
                    <span
                      className={styles.lootRarity}
                      style={{ color: RARITY_COLOURS[item.rarity]?.primary }}
                    >
                      {item.rarity.toUpperCase()}
                    </span>
                    <span className={styles.lootName}>{item.name}</span>
                  </div>
                ))}
              </div>
            )}

            <PixelButton
              variant="primary"
              size="lg"
              onClick={handleClaim}
              className={styles.claimBtn}
            >
              CLAIM REWARDS
            </PixelButton>
          </div>
        )}

        {phase === 'intro' && (
          <div className={styles.loadingDots}>
            <span>·</span><span>·</span><span>·</span>
          </div>
        )}
      </div>
    </div>
  )
}
