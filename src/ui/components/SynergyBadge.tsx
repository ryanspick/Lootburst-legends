import type { Synergy } from '@/game/synergy/synergyEngine'
import styles from './SynergyBadge.module.css'

interface Props {
  synergy: Synergy
  showTooltip?: boolean
}

export default function SynergyBadge({ synergy, showTooltip }: Props) {
  return (
    <div
      className={`${styles.badge} ${synergy.active ? styles.active : styles.inactive}`}
      style={synergy.active ? { borderColor: synergy.color, color: synergy.color } : undefined}
      data-tier={synergy.tier}
      title={showTooltip ? synergy.description : undefined}
    >
      <span className={styles.icon}>{synergy.icon}</span>
      <span className={styles.label}>{synergy.label}</span>
      <span className={styles.count}>
        {synergy.count}/{synergy.required}
      </span>
      {synergy.active && synergy.tier >= 2 && (
        <span className={styles.tierPip} style={{ background: synergy.color }}>
          {synergy.tier === 3 ? '★★★' : '★★'}
        </span>
      )}
    </div>
  )
}
