import type { Rarity } from '@/constants/palette'
import { ELEMENT_COLOURS } from '@/constants/palette'
import RarityFrame from './RarityFrame'
import SpriteCharacter from './SpriteCharacter'
import StarMeter from './StarMeter'
import styles from './HeroCard.module.css'

interface Props {
  id: string
  displayName: string
  rarity: Rarity
  element: string
  role: string
  stars: number
  maxStars: number
  level?: number
  inSquad?: boolean
  selected?: boolean
  locked?: boolean
  frameStyle?: string
  onClick?: () => void
}

const ROLE_ICONS: Record<string, string> = {
  tank: '🛡', healer: '💚', ranged: '🏹', caster: '🔮',
  assassin: '⚡', support: '🎺', blob: '🫧', reaper: '💀',
}

export default function HeroCard({
  id, displayName, rarity, element, role,
  stars, maxStars, level, inSquad, selected, locked, frameStyle, onClick,
}: Props) {
  const ec = ELEMENT_COLOURS[element] ?? '#8888cc'

  return (
    <button
      className={[
        styles.card,
        selected ? styles.selected : '',
        inSquad  ? styles.inSquad : '',
        locked   ? styles.locked : '',
      ].filter(Boolean).join(' ')}
      onClick={onClick}
      data-rarity={rarity}
      data-frame={frameStyle ?? 'frame_default'}
    >
      {/* Rarity accent stripe */}
      <div className={styles.rarityStripe} data-rarity={rarity} />

      {/* Sprite */}
      <RarityFrame rarity={rarity} size={56} animate={selected && !locked}>
        {locked ? (
          <div className={styles.lockIcon}>🔒</div>
        ) : (
          <SpriteCharacter assetId={id} rarity={rarity} size={46} animate={selected} />
        )}
      </RarityFrame>

      {/* Name + role */}
      <div className={styles.info}>
        <span className={styles.name}>{displayName}</span>
        <span className={styles.role} style={{ color: ec }}>
          {ROLE_ICONS[role] ?? '✦'} {role}
        </span>
      </div>

      {/* Stars */}
      <StarMeter stars={stars} maxStars={maxStars} size="sm" />

      {/* Level pip */}
      {level != null && level > 1 && (
        <div className={styles.levelPip}>Lv.{level}</div>
      )}

      {/* Squad indicator */}
      {inSquad && (
        <div className={styles.squadPip}>IN SQUAD</div>
      )}
    </button>
  )
}
