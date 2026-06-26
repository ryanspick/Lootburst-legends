import { useEffect, useRef, useState } from 'react'
import { emitUpgradeCardSparkle, emitGoldBeam } from '@/vfx/emitters'
import { triggerShake } from '@/animation/screenShake'
import { playSound } from '@/audio/soundEvents'
import { bounceOut } from '@/animation/motionPrimitives'
import StarMeter from '@/ui/components/StarMeter'
import styles from './StarUpSequence.module.css'

interface Props {
  heroName: string
  newStars: number
  maxStars: number
  onDone: () => void
}

export default function StarUpSequence({ heroName, newStars, maxStars, onDone }: Props) {
  const [phase, setPhase] = useState<'slam' | 'hold' | 'done'>('slam')
  const [progress, setProgress] = useState(0)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(0)
  const SLAM_MS = 600

  useEffect(() => {
    const cx = window.innerWidth / 2
    const cy = window.innerHeight * 0.45

    playSound('reward_star_up')
    triggerShake('crit')
    emitGoldBeam({ x: cx, y: cy })

    // Animate progress 0→1 over SLAM_MS
    function frame(ts: number) {
      if (!startRef.current) startRef.current = ts
      const t = Math.min((ts - startRef.current) / SLAM_MS, 1)
      setProgress(bounceOut(t))
      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame)
      } else {
        setPhase('hold')
        emitUpgradeCardSparkle({ x: cx, y: cy, w: 120, h: 40 }, 'epic')
        setTimeout(() => { setPhase('done'); setTimeout(onDone, 300) }, 1200)
      }
    }
    rafRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  if (phase === 'done') return null

  const scale = 0.5 + progress * 0.5

  return (
    <div className={styles.overlay}>
      <div className={styles.panel} style={{ transform: `scale(${scale.toFixed(3)})` }}>
        <div className={styles.label}>STAR UP!</div>
        <div className={styles.heroName}>{heroName}</div>
        <div className={styles.stars}>
          <StarMeter stars={newStars} maxStars={maxStars} size="lg" animate />
        </div>
        <div className={styles.newStars}>★ {newStars} Stars</div>
      </div>
    </div>
  )
}
