import { useEffect, useRef } from 'react'
import { bob, pulse } from '@/animation/motionPrimitives'
import { glintProgress } from '@/animation/idleMotion'
import styles from './AnimatedIcon.module.css'

type Motion = 'bob' | 'pulse' | 'spin' | 'glint' | 'none'

interface Props {
  src?: string
  emoji?: string
  alt?: string
  size?: number
  motion?: Motion
  seed?: number
  className?: string
}

export default function AnimatedIcon({
  src,
  emoji,
  alt = '',
  size = 32,
  motion = 'bob',
  seed = 0,
  className = '',
}: Props) {
  const rafRef = useRef<number>(0)
  const elRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (motion === 'none') return

    let startTs = 0
    function frame(ts: number) {
      if (!startTs) startTs = ts
      const t = ts - startTs
      const el = elRef.current
      if (!el) { rafRef.current = requestAnimationFrame(frame); return }

      let transform = ''
      let filter = ''

      if (motion === 'bob') {
        transform = `translateY(${bob(t + seed * 300, 4, 2000).toFixed(2)}px)`
      } else if (motion === 'pulse') {
        const s = pulse(t + seed * 300, 0.92, 1.08, 1600).toFixed(3)
        transform = `scale(${s})`
      } else if (motion === 'spin') {
        const deg = ((t / 4000) * 360) % 360
        transform = `rotate(${deg.toFixed(1)}deg)`
      } else if (motion === 'glint') {
        const g = glintProgress(t, seed)
        filter = g > 0 ? `brightness(${1 + g * 0.8})` : ''
      }

      if (transform) el.style.transform = transform
      if (filter !== undefined) el.style.filter = filter

      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafRef.current)
  }, [motion, seed])

  return (
    <div ref={elRef} className={`${styles.icon} ${className}`} style={{ width: size, height: size }}>
      {src ? (
        <img src={src} alt={alt} className={styles.img} style={{ imageRendering: 'pixelated' }} />
      ) : (
        <span className={styles.emoji} style={{ fontSize: size * 0.7 }}>{emoji}</span>
      )}
    </div>
  )
}
