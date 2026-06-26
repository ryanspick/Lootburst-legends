import type { CSSProperties, ReactNode } from 'react'
import type { Rarity } from '@/constants/palette'
import { RARITY_CONFIG } from '@/constants/rarity'
import styles from './RarityFrame.module.css'

interface Props {
  rarity: Rarity
  children: ReactNode
  size?: number
  showLabel?: boolean
  animate?: boolean
  style?: CSSProperties
}

export default function RarityFrame({ rarity, children, size, showLabel, animate, style }: Props) {
  const cfg = RARITY_CONFIG[rarity]

  return (
    <div
      className={[
        styles.frame,
        styles[rarity],
        animate ? styles[`anim_${cfg.borderAnimation}`] : '',
      ].join(' ')}
      data-rarity={rarity}
      style={{
        '--frame-color': cfg.primary,
        '--frame-glow': cfg.glow,
        width: size, height: size,
        ...style,
      } as CSSProperties}
    >
      <div className={styles.inner}>{children}</div>
      {showLabel && (
        <span className={styles.label}>{rarity.toUpperCase()}</span>
      )}
    </div>
  )
}
