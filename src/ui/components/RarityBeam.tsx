import { useEffect, useRef } from 'react'
import type { Rarity } from '@/constants/palette'
import { RARITY_COLOURS } from '@/constants/palette'
import styles from './RarityBeam.module.css'

interface Props {
  rarity: Rarity
  x?: number
  onDone?: () => void
}

export default function RarityBeam({ rarity, x = 50, onDone }: Props) {
  const rc = RARITY_COLOURS[rarity]
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    if (!onDone) return
    const t = setTimeout(() => onDoneRef.current?.(), 1400)
    return () => clearTimeout(t)
  }, [])

  if (rarity === 'common' || rarity === 'uncommon') return null

  return (
    <div
      className={styles.beam}
      style={{
        left: `${x}%`,
        '--beam-color': rc.primary,
        '--beam-glow': rc.glow,
      } as React.CSSProperties}
    >
      <div className={styles.core} />
      <div className={styles.wide} />
      <div className={styles.flare} />
      {(rarity === 'legendary' || rarity === 'mythic') && (
        <div className={styles.sideRays}>
          {[-60, -30, 30, 60].map(deg => (
            <div
              key={deg}
              className={styles.ray}
              style={{ transform: `rotate(${deg}deg)` }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
