import styles from './PityMeter.module.css'

interface Props {
  pulls: number
  pityThreshold?: number
  guaranteedRarity?: string
}

export default function PityMeter({ pulls, pityThreshold = 80, guaranteedRarity = 'LEGENDARY' }: Props) {
  const pct = Math.min(1, pulls / pityThreshold)
  const isNear = pct >= 0.7
  const isClose = pct >= 0.9

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.label}>PITY METER</span>
        <span className={styles.count} data-close={isClose}>{pulls} / {pityThreshold}</span>
      </div>
      <div className={styles.track}>
        <div
          className={`${styles.fill} ${isNear ? styles.near : ''} ${isClose ? styles.close : ''}`}
          style={{ width: `${pct * 100}%` }}
        />
        {/* Milestone markers */}
        {[0.5, 0.75, 0.9].map(m => (
          <div
            key={m}
            className={styles.marker}
            style={{ left: `${m * 100}%` }}
            data-reached={pct >= m}
          />
        ))}
      </div>
      <div className={styles.footer}>
        <span className={styles.hint}>
          {isClose
            ? `⚠ Guaranteed ${guaranteedRarity} in ${pityThreshold - pulls} pulls!`
            : isNear
            ? `${pityThreshold - pulls} pulls until guaranteed ${guaranteedRarity}`
            : `Guaranteed ${guaranteedRarity} by pull #${pityThreshold}`}
        </span>
      </div>
    </div>
  )
}
