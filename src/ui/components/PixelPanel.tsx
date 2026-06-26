import type { CSSProperties, ReactNode } from 'react'
import type { Rarity } from '@/constants/palette'
import styles from './PixelPanel.module.css'

interface Props {
  children: ReactNode
  rarity?: Rarity
  glow?: boolean
  className?: string
  style?: CSSProperties
}

export default function PixelPanel({ children, rarity, glow, className, style }: Props) {
  return (
    <div
      className={`${styles.panel} ${glow && rarity ? styles.glow : ''} ${className ?? ''}`}
      data-rarity={rarity}
      style={style}
    >
      {children}
    </div>
  )
}
