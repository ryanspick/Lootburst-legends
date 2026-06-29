import { useEffect, useRef, useState } from 'react'
import type { Rarity } from '@/constants/palette'
import { RARITY_COLOURS } from '@/constants/palette'
import RarityFrame from './RarityFrame'
import RarityTextSlam from './RarityTextSlam'
import RarityBeam from './RarityBeam'
import { triggerShake } from '@/animation/screenShake'
import { emitRarityBurst } from '@/vfx/emitters'
import { generateRewardIcon } from '@/art/generated'
import styles from './RewardReveal.module.css'

interface Props {
  rarity: Rarity
  name: string
  description?: string
  iconUrl?: string
  iconEmoji?: string
  onClaim: () => void
}

type Phase = 'beam' | 'card_in' | 'hold' | 'claimed'

export default function RewardReveal({ rarity, name, description, iconUrl, iconEmoji, onClaim }: Props) {
  const [phase, setPhase] = useState<Phase>('beam')
  const [showSlam, setShowSlam] = useState(false)
  const onClaimRef = useRef(onClaim)
  onClaimRef.current = onClaim

  const rc = RARITY_COLOURS[rarity]

  useEffect(() => {
    if (rarity !== 'common' && rarity !== 'uncommon') {
      emitRarityBurst({ x: window.innerWidth / 2, y: window.innerHeight / 2 }, rarity)
    }
    if (rarity === 'legendary' || rarity === 'mythic') triggerShake('heavySkill')

    const cardTimer = setTimeout(() => {
      setPhase('card_in')
      setShowSlam(true)
    }, 400)
    const holdTimer = setTimeout(() => setPhase('hold'), 900)

    return () => { clearTimeout(cardTimer); clearTimeout(holdTimer) }
  }, [])

  if (phase === 'claimed') return null

  return (
    <div className={styles.overlay} onClick={() => { setPhase('claimed'); onClaimRef.current() }}>
      {/* Beam from below */}
      {(phase === 'beam' || phase === 'card_in') && (
        <RarityBeam rarity={rarity} x={50} />
      )}

      {/* Text slam */}
      {showSlam && phase !== 'hold' && (
        <RarityTextSlam rarity={rarity} />
      )}

      {/* Reward card */}
      {(phase === 'card_in' || phase === 'hold') && (
        <div className={`${styles.card} ${phase === 'hold' ? styles.cardHold : ''}`}>
          <RarityFrame rarity={rarity} size={88} animate>
            {iconUrl ? (
              <img src={iconUrl} alt={name} className={styles.icon} style={{ imageRendering: 'pixelated' }} />
            ) : !iconEmoji ? (
              <img src={generateRewardIcon('loot', rarity)} alt={name} className={styles.icon} style={{ imageRendering: 'pixelated' }} />
            ) : (
              <div className={styles.iconEmoji}>{iconEmoji}</div>
            )}
          </RarityFrame>
          <div className={styles.name} style={{ color: rc.primary }}>
            {name}
          </div>
          {description && (
            <div className={styles.description}>{description}</div>
          )}
          <div className={styles.rarityBadge} data-rarity={rarity}>
            {rarity.toUpperCase()}
          </div>
          <div className={styles.tapHint}>TAP TO COLLECT</div>
        </div>
      )}

      {/* Background vignette */}
      <div
        className={styles.vignette}
        style={{ background: `radial-gradient(ellipse at center, ${rc.glow}22 0%, #00000088 100%)` }}
      />
    </div>
  )
}
