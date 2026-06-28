import { useEffect, useRef, useState } from 'react'
import styles from './WavePresentation.module.css'

interface Props {
  waveIndex: number
  enemyCount: number
  isBossWave?: boolean
  zoneName?: string
  onDone: () => void
}

const WAVE_LABELS = [
  'INCOMING', 'SURGE', 'ONSLAUGHT', 'ASSAULT', 'BARRAGE', 'STORM', 'BLITZ',
]

export default function WavePresentation({ waveIndex, enemyCount, isBossWave, zoneName, onDone }: Props) {
  const [visible, setVisible] = useState(true)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  const label = isBossWave
    ? '⚠ BOSS'
    : `WAVE ${waveIndex}`
  const subLabel = isBossWave
    ? 'PREPARE YOURSELVES'
    : `${WAVE_LABELS[(waveIndex - 1) % WAVE_LABELS.length]} — ${enemyCount} ENEMIES`

  useEffect(() => {
    const hideTimer = setTimeout(() => setVisible(false), 1600)
    const doneTimer = setTimeout(() => onDoneRef.current(), 2000)
    return () => { clearTimeout(hideTimer); clearTimeout(doneTimer) }
  }, [])

  if (!visible) return null

  return (
    <div className={`${styles.wrap} ${isBossWave ? styles.boss : ''}`}>
      <div className={styles.bar}>
        <div className={styles.swoopLeft} />
        <div className={styles.content}>
          {zoneName && <div className={styles.zone}>{zoneName}</div>}
          <div className={styles.label} data-boss={isBossWave}>{label}</div>
          <div className={styles.sub}>{subLabel}</div>
        </div>
        <div className={styles.swoopRight} />
      </div>
    </div>
  )
}
