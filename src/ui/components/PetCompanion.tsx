import { useEffect, useRef, useState } from 'react'
import { petWander, petIdleBob } from '@/animation/idleMotion'
import { getGeneratedSprite } from '@/art/generated'
import type { Rarity } from '@/constants/palette'
import { RARITY_COLOURS } from '@/constants/palette'
import styles from './PetCompanion.module.css'

interface PetData {
  id: string
  displayName: string
  rarity: string
  menuEffect?: string
}

interface Props {
  pet: PetData
  index?: number
  size?: number
  className?: string
}

export default function PetCompanion({ pet, index = 0, size = 36, className = '' }: Props) {
  const elRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const [sprite, setSprite] = useState<string | null>(null)

  useEffect(() => {
    setSprite(getGeneratedSprite(pet.id))
  }, [pet.id])

  useEffect(() => {
    let startTs = 0
    function frame(ts: number) {
      if (!startTs) startTs = ts
      const t = ts - startTs
      const el = elRef.current
      if (!el) { rafRef.current = requestAnimationFrame(frame); return }

      const { x, y: wanderY } = petWander(t, index)
      const bobY = petIdleBob(t, index)
      el.style.transform = `translate(${x.toFixed(1)}px, ${(wanderY + bobY).toFixed(1)}px)`
      rafRef.current = requestAnimationFrame(frame)
    }
    rafRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafRef.current)
  }, [index])

  const rarityColor = RARITY_COLOURS[pet.rarity as Rarity]?.primary ?? '#888'

  return (
    <div
      ref={elRef}
      className={`${styles.pet} ${className}`}
      title={pet.displayName}
      style={{ width: size, height: size }}
    >
      {sprite ? (
        <img
          src={sprite}
          alt={pet.displayName}
          className={styles.sprite}
          style={{ imageRendering: 'pixelated' }}
        />
      ) : (
        <div
          className={styles.placeholder}
          style={{ background: rarityColor + '44', border: `1px solid ${rarityColor}` }}
        >
          <span style={{ fontSize: size * 0.5 }}>🐾</span>
        </div>
      )}
      <div className={styles.shadow} />
    </div>
  )
}
