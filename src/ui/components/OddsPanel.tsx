import { useState } from 'react'
import type { Rarity } from '@/constants/palette'
import { RARITY_COLOURS } from '@/constants/palette'
import styles from './OddsPanel.module.css'

interface OddsEntry {
  rarity: Rarity
  chance: number
  guaranteed?: boolean
}

interface Props {
  odds: OddsEntry[]
  pullCost: number
  currency: '💎' | '🎟️'
  title?: string
}

const DEFAULT_ODDS: OddsEntry[] = [
  { rarity: 'mythic',    chance: 0.2  },
  { rarity: 'legendary', chance: 1.5  },
  { rarity: 'epic',      chance: 8.0  },
  { rarity: 'rare',      chance: 20.0 },
  { rarity: 'uncommon',  chance: 30.3 },
  { rarity: 'common',    chance: 40.0 },
]

export default function OddsPanel({ odds = DEFAULT_ODDS, pullCost, currency, title = 'DROP RATES' }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className={styles.wrap}>
      <button className={styles.toggle} onClick={() => setOpen(o => !o)}>
        <span className={styles.toggleLabel}>{title}</span>
        <span className={styles.toggleIcon}>{open ? '▲' : '▼'}</span>
        <span className={styles.pullCost}>{currency} {pullCost} / pull</span>
      </button>

      {open && (
        <div className={styles.table}>
          {odds.map(entry => {
            const rc = RARITY_COLOURS[entry.rarity]
            const barW = Math.min(100, entry.chance * 2)
            return (
              <div key={entry.rarity} className={styles.row}>
                <span className={styles.rarityLabel} style={{ color: rc.primary }}>
                  {entry.rarity.toUpperCase()}
                </span>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${barW}%`, background: rc.primary }}
                  />
                </div>
                <span className={styles.pct} style={{ color: rc.primary }}>
                  {entry.chance.toFixed(1)}%
                  {entry.guaranteed && ' ✓'}
                </span>
              </div>
            )
          })}
          <div className={styles.disclaimer}>
            Rates are per single pull. Pity guarantees a Legendary by pull #80.
            All rates are independently verified.
          </div>
        </div>
      )}
    </div>
  )
}
