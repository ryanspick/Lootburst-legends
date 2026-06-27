import { useEffect, useState } from 'react'
import styles from './CombatHint.module.css'

interface Props {
  message: string
  icon?: string
  durationMs?: number
  onDone?: () => void
}

export default function CombatHint({ message, icon = '💡', durationMs = 4000, onDone }: Props) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in')

  useEffect(() => {
    const inT  = setTimeout(() => setPhase('hold'), 400)
    const outT = setTimeout(() => setPhase('out'),  durationMs - 500)
    const doneT = setTimeout(() => onDone?.(), durationMs)
    return () => { clearTimeout(inT); clearTimeout(outT); clearTimeout(doneT) }
  }, [durationMs])

  return (
    <div className={`${styles.hint} ${styles[phase]}`}>
      <span className={styles.icon}>{icon}</span>
      <span className={styles.text}>{message}</span>
    </div>
  )
}
