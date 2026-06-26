import { useEffect, useRef } from 'react'
import { starFillBrightness } from '@/animation/idleMotion'
import styles from './StarMeter.module.css'

interface Props {
  stars: number        // filled stars
  maxStars: number
  size?: 'sm' | 'md' | 'lg'
  animate?: boolean
}

const SIZES = { sm: 12, md: 16, lg: 22 }

export default function StarMeter({ stars, maxStars, size = 'md', animate = true }: Props) {
  const rafRef = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!animate) return
    function frame(ts: number) {
      const els = containerRef.current?.querySelectorAll<HTMLSpanElement>('[data-star-index]')
      els?.forEach(el => {
        const idx = Number(el.dataset.starIndex)
        const filled = idx < stars
        if (filled) {
          const brightness = starFillBrightness(ts, idx)
          el.style.filter = `brightness(${brightness})`
        }
      })
      rafRef.current = requestAnimationFrame(frame)
    }
    rafRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafRef.current)
  }, [animate, stars])

  const px = SIZES[size]

  return (
    <div ref={containerRef} className={styles.meter} style={{ gap: size === 'lg' ? 3 : 2 }}>
      {Array.from({ length: maxStars }, (_, i) => (
        <span
          key={i}
          data-star-index={i}
          className={i < stars ? styles.filled : styles.empty}
          style={{ fontSize: px }}
        >
          ★
        </span>
      ))}
    </div>
  )
}
