import { useEffect, useState } from 'react'
import { emitGemScatter } from '@/vfx/emitters'
import { playSound } from '@/audio/soundEvents'
import styles from './DuplicateShardConversion.module.css'

interface Props {
  heroName: string
  shardsGained: number
  position?: { x: number; y: number }
  onDone: () => void
}

export default function DuplicateShardConversion({ heroName, shardsGained, position, onDone }: Props) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    playSound('reward_shard_gain')
    const px = position?.x ?? window.innerWidth / 2
    const py = position?.y ?? window.innerHeight * 0.4
    emitGemScatter({ x: px, y: py }, shardsGained * 2)

    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 300)
    }, 2000)
    return () => clearTimeout(t)
  }, [])

  if (!visible) return null

  return (
    <div className={styles.toast}>
      <div className={styles.icon}>🔮</div>
      <div className={styles.body}>
        <div className={styles.label}>DUPLICATE</div>
        <div className={styles.name}>{heroName}</div>
        <div className={styles.shards}>+{shardsGained} Shards</div>
      </div>
    </div>
  )
}
