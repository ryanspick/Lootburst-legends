import { useEffect, useRef, useState } from 'react'
import type { PostRunReward } from '@/game/rift/riftTypes'
import type { Rarity } from '@/constants/palette'
import { RARITY_COLOURS } from '@/constants/palette'
import { emitCoinBurst, emitRarityBurst } from '@/vfx/emitters'
import { triggerShake } from '@/animation/screenShake'
import { playSound } from '@/audio/soundEvents'
import styles from './RewardSummary.module.css'

interface Props {
  reward: PostRunReward
  killCount: number
  totalDamage: number
  elapsedMs: number
  onContinue: () => void
}

const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic']
const RARITY_EMOJI: Record<Rarity, string> = {
  common: '⬜', uncommon: '🟩', rare: '🔵', epic: '🟣', legendary: '⭐', mythic: '🌈',
}

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

type Phase = 'header' | 'stats' | 'loot' | 'cta'

export default function RewardSummary({ reward, killCount, totalDamage, elapsedMs, onContinue }: Props) {
  const [phase, setPhase] = useState<Phase>('header')
  const [visibleLoot, setVisibleLoot] = useState(0)
  const [goldCount, setGoldCount] = useState(0)
  const [gemCount, setGemCount] = useState(0)
  const onContinueRef = useRef(onContinue)
  onContinueRef.current = onContinue

  const bestRarity = reward.lootItems.reduce<Rarity>((best, item) => {
    return RARITY_ORDER.indexOf(item.rarity) > RARITY_ORDER.indexOf(best) ? item.rarity : best
  }, 'common')

  const isWipe = reward.wasWipe
  const rc = isWipe ? { primary: '#ff4444', glow: '#ff220044' } : RARITY_COLOURS[bestRarity]

  useEffect(() => {
    emitCoinBurst({ x: window.innerWidth / 2, y: window.innerHeight * 0.3 }, 20)
    playSound(isWipe ? 'combat_shield_boing' : 'reward_level_up_flourish')
    if (!isWipe && (bestRarity === 'epic' || bestRarity === 'legendary' || bestRarity === 'mythic')) {
      triggerShake('heavySkill')
      emitRarityBurst({ x: window.innerWidth / 2, y: window.innerHeight * 0.3 }, bestRarity)
    }

    const seq: Array<[Phase | 'count_gold' | 'count_gems' | 'cascade_loot', number]> = [
      ['stats',        600],
      ['count_gold',   200],
      ['count_gems',   400],
      ['loot',         500],
      ['cascade_loot', 200],
      ['cta',          reward.lootItems.length * 160 + 400],
    ]
    let t = 0
    const timers: ReturnType<typeof setTimeout>[] = []
    let lootI = 0
    let lootInterval: ReturnType<typeof setInterval> | null = null

    for (const [s, delay] of seq) {
      t += delay
      const captured = s
      timers.push(setTimeout(() => {
        if (captured === 'count_gold') {
          let g = 0
          const iv = setInterval(() => {
            g = Math.min(reward.goldEarned, g + Math.ceil(reward.goldEarned / 20))
            setGoldCount(g)
            if (g >= reward.goldEarned) clearInterval(iv)
          }, 30)
          timers.push(iv as unknown as ReturnType<typeof setTimeout>)
        } else if (captured === 'count_gems') {
          let g = 0
          const iv = setInterval(() => {
            g = Math.min(reward.gemsEarned, g + Math.ceil(reward.gemsEarned / 15))
            setGemCount(g)
            if (g >= reward.gemsEarned) clearInterval(iv)
          }, 40)
          timers.push(iv as unknown as ReturnType<typeof setTimeout>)
        } else if (captured === 'cascade_loot') {
          lootInterval = setInterval(() => {
            lootI++
            setVisibleLoot(lootI)
            const item = reward.lootItems[lootI - 1]
            if (item && (item.rarity === 'epic' || item.rarity === 'legendary' || item.rarity === 'mythic')) {
              emitRarityBurst({ x: window.innerWidth * 0.5, y: window.innerHeight * 0.6 }, item.rarity)
            }
            if (lootI >= reward.lootItems.length) {
              clearInterval(lootInterval!)
              lootInterval = null
            }
          }, 160)
        } else {
          setPhase(captured as Phase)
        }
      }, t))
    }

    return () => {
      timers.forEach(t => clearTimeout(t))
      if (lootInterval) clearInterval(lootInterval)
    }
  }, [])

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={`${styles.header} ${isWipe ? styles.headerWipe : ''}`}>
        <div className={styles.runResult} style={{ color: isWipe ? '#ff4444' : rc.primary }}>
          {isWipe ? '✖ SQUAD DEFEATED' : '✦ RUN COMPLETE'}
        </div>
        {reward.newRecords.length > 0 && (
          <div className={styles.newRecord}>🏆 NEW RECORD</div>
        )}
      </div>

      {/* Stats row */}
      {(phase === 'stats' || phase === 'loot' || phase === 'cta') && (
        <div className={styles.statsGrid}>
          <div className={styles.statBox}>
            <span className={styles.statNum}>{killCount}</span>
            <span className={styles.statLbl}>KILLS</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statNum}>{formatMs(elapsedMs)}</span>
            <span className={styles.statLbl}>SURVIVED</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statNum}>{Math.round(totalDamage / 1000)}K</span>
            <span className={styles.statLbl}>DAMAGE</span>
          </div>
        </div>
      )}

      {/* Currency earned */}
      {(phase === 'stats' || phase === 'loot' || phase === 'cta') && (
        <div className={styles.currencyRow}>
          <div className={styles.currencyChip}>
            <span className={styles.currencyIcon}>💰</span>
            <span className={styles.currencyAmt} style={{ color: 'var(--gold)' }}>
              +{goldCount}
            </span>
          </div>
          <div className={styles.currencyChip}>
            <span className={styles.currencyIcon}>💎</span>
            <span className={styles.currencyAmt} style={{ color: '#88aaff' }}>
              +{gemCount}
            </span>
          </div>
          {reward.xpEarned > 0 && (
            <div className={styles.currencyChip}>
              <span className={styles.currencyIcon}>✨</span>
              <span className={styles.currencyAmt} style={{ color: '#44ccff' }}>
                +{Math.round(reward.xpEarned)} XP
              </span>
            </div>
          )}
        </div>
      )}

      {/* Loot items */}
      {(phase === 'loot' || phase === 'cta') && reward.lootItems.length > 0 && (
        <div className={styles.lootSection}>
          <div className={styles.lootTitle}>LOOT DROPS</div>
          <div className={styles.lootGrid}>
            {reward.lootItems.slice(0, visibleLoot).map((item, i) => {
              const irc = RARITY_COLOURS[item.rarity]
              return (
                <div
                  key={item.id}
                  className={styles.lootCard}
                  style={{ borderColor: irc.primary, animationDelay: `${i * 0.06}s` }}
                  data-rarity={item.rarity}
                >
                  <span className={styles.lootEmoji}>{RARITY_EMOJI[item.rarity]}</span>
                  <span className={styles.lootName}>{item.name}</span>
                  <span className={styles.lootRarity} style={{ color: irc.primary }}>
                    {item.rarity.toUpperCase()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Heroes leveled */}
      {(phase === 'loot' || phase === 'cta') && reward.heroesLeveled.length > 0 && (
        <div className={styles.levelUpBlock}>
          <div className={styles.levelUpHeader}>✦ LEVEL UP! ✦</div>
          <div className={styles.heroesRow}>
            {reward.heroesLeveled.map(name => (
              <div key={name} className={styles.heroLeveledChip}>
                ⬆ {name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      {phase === 'cta' && (
        <div className={styles.ctaRow}>
          <button
            className={styles.ctaBtn}
            style={{ borderColor: rc.primary, boxShadow: `0 0 20px ${rc.glow}` }}
            onClick={() => onContinueRef.current()}
          >
            CONTINUE
          </button>
        </div>
      )}
    </div>
  )
}
