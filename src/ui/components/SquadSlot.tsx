import type { Rarity } from '@/constants/palette'
import SpriteCharacter from './SpriteCharacter'
import styles from './SquadSlot.module.css'

interface HeroMeta {
  id: string
  displayName: string
  rarity: Rarity
  element: string
}

interface Props {
  index: number
  hero: HeroMeta | null
  isActive?: boolean
  onClick?: () => void
}

const SLOT_GLYPHS = ['I', 'II', 'III']

export default function SquadSlot({ index, hero, isActive, onClick }: Props) {
  return (
    <button
      className={`${styles.slot} ${!hero ? styles.empty : ''} ${isActive ? styles.active : ''}`}
      onClick={onClick}
      data-rarity={hero?.rarity}
    >
      {hero ? (
        <>
          <div className={styles.spriteWrap}>
            <SpriteCharacter
              assetId={hero.id}
              rarity={hero.rarity}
              size={44}
              animate={isActive}
            />
          </div>
          <span className={styles.name}>{hero.displayName.split(' ')[0]}</span>
          <span className={styles.remove} title="Remove from squad">✕</span>
          {isActive && <div className={styles.activeRing} />}
        </>
      ) : (
        <>
          <span className={styles.emptyGlyph}>{SLOT_GLYPHS[index] ?? '+'}</span>
          <span className={styles.emptyLabel}>EMPTY</span>
        </>
      )}
    </button>
  )
}
