import type { Rarity } from '@/constants/palette'
import GearIcon from './GearIcon'
import styles from './GearSlot.module.css'

interface GearItem {
  id: string
  displayName: string
  slot: string
  rarity: Rarity
}

interface Props {
  slot: string
  slotLabel: string
  slotIcon: string
  equippedGear?: GearItem
  onClick?: () => void
  highlighted?: boolean
}

export default function GearSlot({ slot, slotLabel, slotIcon, equippedGear, onClick, highlighted }: Props) {
  return (
    <button
      className={`${styles.slot} ${highlighted ? styles.highlighted : ''} ${equippedGear ? styles.filled : styles.empty}`}
      onClick={onClick}
      title={`${slotLabel} slot`}
      data-slot={slot}
    >
      {equippedGear ? (
        <GearIcon
          id={equippedGear.id}
          displayName={equippedGear.displayName}
          slot={equippedGear.slot}
          rarity={equippedGear.rarity}
          size={44}
          equipped
        />
      ) : (
        <div className={styles.emptyInner}>
          <span className={styles.slotIcon}>{slotIcon}</span>
          <span className={styles.slotLabel}>{slotLabel}</span>
        </div>
      )}
    </button>
  )
}
