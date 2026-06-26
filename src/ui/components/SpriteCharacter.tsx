import { useEffect, useRef } from 'react'
import { getGeneratedSprite } from '@/art/generated'
import { RARITY_COLOURS } from '@/constants/palette'
import type { Rarity } from '@/constants/palette'
import styles from './SpriteCharacter.module.css'

interface Props {
  assetId: string
  rarity?: Rarity
  size?: number
  animate?: boolean
  flip?: boolean
  flash?: boolean
  dead?: boolean
  className?: string
  style?: React.CSSProperties
}

export default function SpriteCharacter({
  assetId,
  rarity = 'common',
  size = 64,
  animate = true,
  flip = false,
  flash = false,
  dead = false,
  className = '',
  style,
}: Props) {
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const img = imgRef.current
    if (!img) return
    const dataUrl = getGeneratedSprite(assetId)
    if (dataUrl) img.src = dataUrl
  }, [assetId])

  const rc = RARITY_COLOURS[rarity]

  const vars = {
    '--sprite-glow': rc.glow,
    '--sprite-size': `${size}px`,
  } as React.CSSProperties

  return (
    <div
      className={[
        styles.wrap,
        animate ? styles.bob : '',
        flip ? styles.flip : '',
        flash ? styles.flash : '',
        dead ? styles.dead : '',
        rarity !== 'common' ? styles.glowing : '',
        rarity === 'mythic' ? styles.rainbow : '',
        className,
      ].filter(Boolean).join(' ')}
      style={{ ...vars, width: size, height: size, ...style }}
    >
      <img
        ref={imgRef}
        alt={assetId}
        className={styles.sprite}
        style={{ imageRendering: 'pixelated', width: size, height: size }}
      />
    </div>
  )
}
