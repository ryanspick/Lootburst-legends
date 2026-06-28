import { BOTTOM_NAV_TABS, type TabId } from '@/constants/ui'
import { useGameStore } from '@/store/gameStore'
import { CHEST_COOLDOWN_MS } from '@/game/progression/dailyRewards'
import { rollDailyQuests, getDailyQuestDate, buildActiveQuests } from '@/game/progression/dailyQuests'
import { playSound } from '@/audio/soundEvents'
import styles from './BottomNav.module.css'

interface Props {
  active: TabId
  onChange: (tab: TabId) => void
  onGallery?: () => void
}

export default function BottomNav({ active, onChange, onGallery }: Props) {
  const ownedGear           = useGameStore(s => s.ownedGear)
  const keys                = useGameStore(s => s.keys)
  const pityCount           = useGameStore(s => s.pityCount)
  const gemOfferExpiresAt   = useGameStore(s => s.gemOfferExpiresAt)
  const lastDailyChestAt    = useGameStore(s => s.lastDailyChestAt)
  const dailyQuestDate      = useGameStore(s => s.dailyQuestDate)
  const dailyQuestProgress  = useGameStore(s => s.dailyQuestProgress)
  const dailyQuestsClaimed  = useGameStore(s => s.dailyQuestsClaimed)

  const unequippedGear  = ownedGear.filter(g => !g.equipped).length
  const shopSaleActive  = gemOfferExpiresAt > 0
  const chestReady      = lastDailyChestAt === 0 || Date.now() - lastDailyChestAt >= CHEST_COOLDOWN_MS

  const today = getDailyQuestDate()
  const questDefs   = rollDailyQuests(today)
  const questsReady = buildActiveQuests(
    questDefs,
    dailyQuestDate === today ? dailyQuestProgress : {},
    dailyQuestDate === today ? dailyQuestsClaimed : [],
  ).filter(q => q.progress >= q.target && !q.claimed).length

  const badges: Partial<Record<string, string | number>> = {
    run:      chestReady ? '🎁' : undefined,
    capsule:  keys > 0 ? keys : pityCount >= 70 ? '!' : undefined,
    shop:     shopSaleActive ? '🔥' : undefined,
    gear:     unequippedGear > 0 ? unequippedGear : undefined,
    progress: questsReady > 0 ? questsReady : undefined,
  }

  return (
    <nav className={styles.nav}>
      {BOTTOM_NAV_TABS.map(tab => {
        const badge = badges[tab.id]
        return (
          <button
            key={tab.id}
            className={`${styles.tab} ${active === tab.id ? styles.active : ''}`}
            onClick={() => { playSound('ui_tab_slide'); onChange(tab.id as TabId) }}
            aria-label={tab.label}
          >
            <span className={styles.iconWrap}>
              <span className={styles.icon}>{tab.icon}</span>
              {badge !== undefined && (
                <span className={`${styles.badge} ${(badge === '🔥' || badge === '🎁') ? styles.badgeFlame : ''}`}>
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
