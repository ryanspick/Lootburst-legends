import { useEffect, useRef, useState } from 'react'
import { bob, pulse } from '@/animation/motionPrimitives'
import { getGeneratedSprite } from '@/art/generated'
import RarityFrame from '@/ui/components/RarityFrame'
import type { Rarity } from '@/constants/palette'
import styles from './MountCard.module.css'

interface MountData {
  id: string
  displayName: string
  rarity: string
  element: string
  idleEffect: string
  unlockSource: string
  tags: string[]
}

interface Props {
  mount: MountData
  owned?: boolean
  selected?: boolean
  onClick?: () => void
}

export default function MountCard({ mount, owned = true, selected = false, onClick }: Props) {
  const rafRef = useRef<number>(0)
  const spriteRef = useRef<HTMLDivElement>(null)
  const [sprite, setSprite] = useState<string | null>(null)

  useEffect(() => {
    setSprite(getGeneratedSprite(mount.id))
  }, [mount.id])

  useEffect(() => {
    function frame(ts: number) {
      const el = spriteRef.current
      if (!el) { rafRef.current = requestAnimationFrame(frame); return }
      const b = bob(ts, 5, 2200)
      const s = pulse(ts + 300, 0.97, 1.03, 1800)
      el.style.transform = `translateY(${b.toFixed(1)}px) scale(${s.toFixed(3)})`
      rafRef.current = requestAnimationFrame(frame)
    }
    rafRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <button
      className={`${styles.card} ${selected ? styles.selected : ''} ${!owned ? styles.locked : ''}`}
      onClick={onClick}
    >
      <RarityFrame rarity={mount.rarity as Rarity} size={60} animate={selected}>
        <div ref={spriteRef} className={styles.spriteWrap}>
          {sprite ? (
            <img src={sprite} alt={mount.displayName} className={styles.sprite} />
          ) : (
            <span className={styles.emoji}>🐴</span>
          )}
        </div>
      </RarityFrame>

      <span className={styles.name}>{mount.displayName}</span>
      <span className={styles.rarity} data-rarity={mount.rarity}>
        {mount.rarity.toUpperCase()}
      </span>
      <span className={styles.source}>{mount.unlockSource.replace(/_/g, ' ')}</span>

      {!owned && <div className={styles.lockOverlay}>🔒</div>}
    </button>
  )
}
