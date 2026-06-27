import { useState, useEffect, useCallback } from 'react'
import { ACHIEVEMENTS, RARITY_COLOR } from '@/data/achievementsData'
import { playSound } from '@/audio/soundEvents'
import styles from './AchievementToast.module.css'

interface Toast {
  id: string
  achievementId: string
  key: number
}

let _toastKey = 0

interface Props {
  newIds: string[]
  onConsumed: () => void
}

export default function AchievementToast({ newIds, onConsumed }: Props) {
  const [queue, setQueue] = useState<Toast[]>([])
  const [visible, setVisible] = useState<Toast | null>(null)
  const [exiting, setExiting] = useState(false)

  // Enqueue new unlocks
  useEffect(() => {
    if (newIds.length === 0) return
    setQueue(q => [...q, ...newIds.map(id => ({ id, achievementId: id, key: _toastKey++ }))])
    onConsumed()
  }, [newIds])

  // Show next from queue when not already showing
  useEffect(() => {
    if (visible || queue.length === 0) return
    const [next, ...rest] = queue
    setQueue(rest)
    setVisible(next)
    setExiting(false)
    const ach = ACHIEVEMENTS.find(a => a.id === next.achievementId)
    if (ach) {
      const snd = ach.rarity === 'legendary' ? 'rarity_legendary_choir'
        : ach.rarity === 'epic' ? 'rarity_epic_bass'
        : ach.rarity === 'rare' ? 'rarity_rare_bell'
        : 'rarity_uncommon_pop'
      playSound(snd)
    }
  }, [queue, visible])

  const dismiss = useCallback(() => {
    setExiting(true)
    setTimeout(() => setVisible(null), 400)
  }, [])

  // Auto-dismiss after 3.5s
  useEffect(() => {
    if (!visible) return
    const t = setTimeout(dismiss, 3500)
    return () => clearTimeout(t)
  }, [visible, dismiss])

  if (!visible) return null
  const ach = ACHIEVEMENTS.find(a => a.id === visible.achievementId)
  if (!ach) return null

  const color = RARITY_COLOR[ach.rarity]

  return (
    <div
      className={`${styles.toast} ${exiting ? styles.toastOut : styles.toastIn}`}
      style={{ '--ach-color': color } as React.CSSProperties}
      onClick={dismiss}
      role="status"
      aria-live="polite"
    >
      <div className={styles.icon}>{ach.icon}</div>
      <div className={styles.body}>
        <div className={styles.label}>ACHIEVEMENT UNLOCKED</div>
        <div className={styles.title}>{ach.title}</div>
        <div className={styles.desc}>{ach.desc}</div>
      </div>
      <div className={styles.rarity} style={{ color }}>{ach.rarity.toUpperCase()}</div>
    </div>
  )
}
