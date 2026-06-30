import type { Rarity } from '@/constants/palette'
import { getGeneratedSprite } from '@/art/generated'
import RarityFrame from './RarityFrame'
import styles from './GearIcon.module.css'

interface Props {
  id: string
  displayName: string
  slot: string
  rarity: Rarity
  size?: number
  equipped?: boolean
  selected?: boolean
  onClick?: () => void
}

const SLOT_FALLBACK: Record<string, string> = {
  weapon: 'WPN',
  trinket: 'TRK',
  relic: 'REL',
  armor: 'ARM',
  charm: 'CHM',
  boots: 'BOT',
  toy: 'TOY',
}

export default function GearIcon({ id, displayName, slot, rarity, size = 56, equipped, selected, onClick }: Props) {
  const sprite = getGeneratedSprite(id)
  const innerSize = Math.round(size * 0.76)
  const content = (
    <>
      <RarityFrame rarity={rarity} size={size} animate={selected}>
        {sprite ? (
          <img
            src={sprite}
            alt={displayName}
            width={innerSize}
            height={innerSize}
            style={{ imageRendering: 'pixelated', display: 'block' }}
          />
        ) : (
          <div className={styles.fallback} style={{ fontSize: Math.max(9, innerSize * 0.28) }}>
            {SLOT_FALLBACK[slot] ?? 'ITM'}
          </div>
        )}
      </RarityFrame>
      {equipped && <div className={styles.equippedPip}>E</div>}
    </>
  )

  if (onClick) {
    return (
      <button
        className={[
          styles.icon,
          equipped ? styles.equipped : '',
          selected ? styles.selected : '',
        ].filter(Boolean).join(' ')}
        onClick={onClick}
        title={displayName}
        data-rarity={rarity}
        data-interactive="true"
        type="button"
      >
        {content}
      </button>
    )
  }

  return (
    <span
      className={[
        styles.icon,
        equipped ? styles.equipped : '',
        selected ? styles.selected : '',
      ].filter(Boolean).join(' ')}
      title={displayName}
      data-rarity={rarity}
    >
      {content}
    </span>
  )
}
