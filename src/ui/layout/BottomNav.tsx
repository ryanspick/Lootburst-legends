import { BOTTOM_NAV_TABS, type TabId } from '@/constants/ui'
import { useGameStore } from '@/store/gameStore'
import styles from './BottomNav.module.css'

interface Props {
  active: TabId
  onChange: (tab: TabId) => void
  onGallery?: () => void
}

export default function BottomNav({ active, onChange, onGallery }: Props) {
  const ownedGear        = useGameStore(s => s.ownedGear)
  const keys             = useGameStore(s => s.keys)
  const pityCount        = useGameStore(s => s.pityCount)
  const gemOfferExpiresAt = useGameStore(s => s.gemOfferExpiresAt)

  const unequippedGear   = ownedGear.filter(g => !g.equipped).length
  const shopSaleActive   = gemOfferExpiresAt > 0

  const badges: Partial<Record<string, string | number>> = {
    capsule: keys > 0 ? keys : pityCount >= 70 ? '!' : undefined,
    shop:    shopSaleActive ? '🔥' : undefined,
    gear:    unequippedGear > 0 ? unequippedGear : undefined,
  }

  return (
    <nav className={styles.nav}>
      {BOTTOM_NAV_TABS.map(tab => {
        const badge = badges[tab.id]
        return (
          <button
            key={tab.id}
            className={`${styles.tab} ${active === tab.id ? styles.active : ''}`}
            onClick={() => onChange(tab.id as TabId)}
            aria-label={tab.label}
          >
            <span className={styles.iconWrap}>
              <span className={styles.icon}>{tab.icon}</span>
              {badge !== undefined && (
                <span className={`${styles.badge} ${badge === '🔥' ? styles.badgeFlame : ''}`}>
                  {badge}
                </span>
              )}
            </span>
            <span className={styles.label}>{tab.label}</span>
          </button>
        )
      })}
      {onGallery && (
        <button
          className={`${styles.tab} ${styles.gallery}`}
          onClick={onGallery}
          aria-label="Visual Gallery"
          title="Dev: Visual Gallery"
        >
          <span className={styles.iconWrap}>
            <span className={styles.icon}>🎨</span>
          </span>
          <span className={styles.label}>Gallery</span>
        </button>
      )}
    </nav>
  )
}
