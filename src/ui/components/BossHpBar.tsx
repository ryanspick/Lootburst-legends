import type { CombatEntity } from '@/game/rift/riftTypes'
import { RARITY_COLOURS, ELEMENT_COLOURS } from '@/constants/palette'
import SpriteCharacter from './SpriteCharacter'
import styles from './BossHpBar.module.css'

interface Props {
  boss: CombatEntity
  phase?: number
  maxPhases?: number
}

export default function BossHpBar({ boss, phase = 1, maxPhases = 2 }: Props) {
  const pct = Math.max(0, boss.hp / boss.maxHp)
  const rc = RARITY_COLOURS['legendary']
  const ec = ELEMENT_COLOURS[boss.element] ?? '#8888cc'

  // Crack intensity based on HP
  const cracks = pct < 0.25 ? 3 : pct < 0.5 ? 2 : pct < 0.75 ? 1 : 0

  const barColor = pct > 0.6 ? '#ef4444'
    : pct > 0.3 ? '#f97316'
    : '#ff2222'

  return (
    <div className={styles.wrap}>
      {/* Boss portrait */}
      <div className={styles.portrait}>
        <SpriteCharacter
          assetId={boss.assetId}
          rarity="legendary"
          size={40}
          animate={boss.alive}
          flash={boss.flashMs > 0}
          dead={!boss.alive}
        />
      </div>

      <div className={styles.main}>
        {/* Name row */}
        <div className={styles.nameRow}>
          <span className={styles.name}>{boss.displayName}</span>
          <span
            className={styles.element}
            style={{ color: ec, borderColor: ec }}
          >
            {boss.element.toUpperCase()}
          </span>
          <div className={styles.phases}>
            {[...Array(maxPhases)].map((_, i) => (
              <div
                key={i}
                className={`${styles.phaseDot} ${i < phase ? styles.phaseDone : ''}`}
                style={i < phase ? {} : { borderColor: rc.primary }}
              />
            ))}
          </div>
        </div>

        {/* HP track */}
        <div className={styles.track}>
          {/* Phase segment dividers */}
          {maxPhases > 1 && [...Array(maxPhases - 1)].map((_, i) => (
            <div
              key={i}
              className={styles.segment}
              style={{ left: `${(100 / maxPhases) * (i + 1)}%` }}
            />
          ))}

          {/* Fill */}
          <div
            className={`${styles.fill} ${pct < 0.25 ? styles.critical : ''}`}
            style={{ width: `${pct * 100}%`, background: barColor }}
          />

          {/* Cracks */}
          {cracks >= 1 && <div className={`${styles.crack} ${styles.crack1}`} />}
          {cracks >= 2 && <div className={`${styles.crack} ${styles.crack2}`} />}
          {cracks >= 3 && <div className={`${styles.crack} ${styles.crack3}`} />}
        </div>

        {/* HP numbers */}
        <div className={styles.hpNumbers}>
          <span style={{ color: '#ff8888' }}>{Math.max(0, Math.round(boss.hp)).toLocaleString()}</span>
          <span style={{ color: 'var(--text-muted)' }}>/ {boss.maxHp.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}
