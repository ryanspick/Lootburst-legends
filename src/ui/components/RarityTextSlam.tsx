import { useEffect, useRef, useState } from 'react'
import type { Rarity } from '@/constants/palette'
import { RARITY_COLOURS } from '@/constants/palette'
import { triggerShake } from '@/animation/screenShake'
import styles from './RarityTextSlam.module.css'

interface Props {
  rarity: Rarity
  label?: string
  subLabel?: string
  onDone?: () => void
}

const RARITY_LABELS: Record<Rarity, string> = {
  common: 'COMMON',
  uncommon: 'UNCOMMON',
  rare: 'RARE',
  epic: 'EPIC',
  legendary: 'LEGENDARY',
  mythic: 'MYTHIC',
}

const RARITY_SUBS: Record<Rarity, string> = {
  common: '',
  uncommon: 'Nice.',
  rare: 'Nice drop!',
  epic: 'Oh yeah.',
  legendary: '✦ INCREDIBLE ✦',
  mythic: '🌈 IMPOSSIBLE. 🌈',
}

export default function RarityTextSlam({ rarity, label, subLabel, onDone }: Props) {
  const [phase, setPhase] = useState<'slam' | 'hold' | 'out'>('slam')
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  const rc = RARITY_COLOURS[rarity]

  useEffect(() => {
    // Shake on slam
    if (rarity === 'mythic') triggerShake('legendary')
    else if (rarity === 'legendary') triggerShake('heavySkill')
    else if (rarity === 'epic') triggerShake('smallHit')

    const holdTimer = setTimeout(() => setPhase('hold'), 400)
    const outTimer  = setTimeout(() => setPhase('out'),  1400)
    const doneTimer = setTimeout(() => onDoneRef.current?.(), 1800)
    return () => { clearTimeout(holdTimer); clearTimeout(outTimer); clearTimeout(doneTimer) }
  }, [])

  if (rarity === 'common') return null

  return (
    <div className={`${styles.wrap} ${styles[phase]}`} data-rarity={rarity}>
      <div
        className={styles.rarityText}
        style={{ color: rc.primary, textShadow: `0 0 40px ${rc.glow}, 0 4px 0 #000` }}
      >
        {label ?? RARITY_LABELS[rarity]}
      </div>
      {(subLabel ?? RARITY_SUBS[rarity]) && (
        <div className={styles.subText} style={{ color: rc.glow }}>
          {subLabel ?? RARITY_SUBS[rarity]}
        </div>
      )}
      {rarity === 'mythic' && (
        <div className={styles.rainbowBar} />
      )}
    </div>
  )
}
