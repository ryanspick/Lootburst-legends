import { BOTTOM_NAV_TABS, type TabId } from '@/constants/ui'
import styles from './BottomNav.module.css'

interface Props {
  active: TabId
  onChange: (tab: TabId) => void
  onGallery?: () => void
}

export default function BottomNav({ active, onChange, onGallery }: Props) {
  return (
    <nav className={styles.nav}>
      {BOTTOM_NAV_TABS.map(tab => (
        <button
          key={tab.id}
          className={`${styles.tab} ${active === tab.id ? styles.active : ''}`}
          onClick={() => onChange(tab.id as TabId)}
          aria-label={tab.label}
        >
          <span className={styles.icon}>{tab.icon}</span>
          <span className={styles.label}>{tab.label}</span>
        </button>
      ))}
      {onGallery && (
        <button
          className={`${styles.tab} ${styles.gallery}`}
          onClick={onGallery}
          aria-label="Visual Gallery"
          title="Dev: Visual Gallery"
        >
          <span className={styles.icon}>🎨</span>
          <span className={styles.label}>Gallery</span>
        </button>
      )}
    </nav>
  )
}
