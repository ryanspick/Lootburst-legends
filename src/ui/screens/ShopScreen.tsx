import { useEffect, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import styles from './ShopScreen.module.css'

interface ShopProps { onClose?: () => void }

const GEM_PACKS: { id: string; gems: number; price: string; label: string; tag: string; bonus?: string }[] = [
  { id: 'gems_80',   gems: 80,   price: '$0.99',  label: '80 Gems',    tag: '' },
  { id: 'gems_500',  gems: 500,  price: '$4.99',  label: '500 Gems',   tag: '⭐ POPULAR',   bonus: '+10%' },
  { id: 'gems_1200', gems: 1200, price: '$9.99',  label: '1,200 Gems', tag: '💎 BEST VALUE', bonus: '+25%' },
  { id: 'gems_2500', gems: 2500, price: '$19.99', label: '2,500 Gems', tag: '',              bonus: '+40%' },
  { id: 'gems_6500', gems: 6500, price: '$49.99', label: '6,500 Gems', tag: '',              bonus: '+80%' },
]

const BUNDLES = [
  {
    id: 'bundle_rift_hunter',
    icon: '⚔️',
    name: 'Rift Hunter Pack',
    price: '$14.99',
    items: ['🔮 2,000 Gems', '💰 50,000 Gold', '⭐ 3× Rare Gear', '🔑 5 Capsule Keys'],
    tag: '',
  },
  {
    id: 'bundle_legends_vault',
    icon: '🏛️',
    name: 'Legends Vault',
    price: '$49.99',
    items: ['💎 8,000 Gems', '💰 200,000 Gold', '🌟 2× Epic Gear', '🔑 20 Capsule Keys', '⚡ 10× Boosts'],
    tag: '🔥 HOT',
  },
  {
    id: 'bundle_ultimate',
    icon: '👑',
    name: 'Ultimate Vault',
    price: '$99.99',
    items: ['💎 25,000 Gems', '💰 1,000,000 Gold', '✨ 1× Legendary Gear', '🔑 50 Capsule Keys', '⚡ 25× Boosts', '🌈 All Heroes Unlocked'],
    tag: '👑 ULTIMATE',
  },
] as const

function formatCountdown(msLeft: number): string {
  if (msLeft <= 0) return '00:00:00'
  const totalSec = Math.floor(msLeft / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function ShopScreen({ onClose }: ShopProps) {
  const gems = useGameStore(s => s.gems)
  const addGems = useGameStore(s => s.addGems)
  const addGold = useGameStore(s => s.addGold)
  const addGear = useGameStore(s => s.addGear)
  const gemOfferExpiresAt = useGameStore(s => s.gemOfferExpiresAt)
  const initGemOffer = useGameStore(s => s.initGemOffer)

  const [now, setNow] = useState(Date.now())
  const [boughtOffer, setBoughtOffer] = useState(false)
  const [flashId, setFlashId] = useState<string | null>(null)

  useEffect(() => {
    initGemOffer()
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const offerActive = gemOfferExpiresAt > 0 && now < gemOfferExpiresAt && !boughtOffer
  const offerMsLeft = gemOfferExpiresAt - now

  function flash(id: string) {
    setFlashId(id)
    setTimeout(() => setFlashId(null), 700)
  }

  function buyGemPack(pack: typeof GEM_PACKS[number]) {
    // TODO: integrate Stripe / RevenueCat for real IAP
    addGems(pack.gems)
    flash(pack.id)
  }

  function buyBundle(bundle: typeof BUNDLES[number]) {
    // TODO: integrate Stripe / RevenueCat for real IAP
    if (bundle.id === 'bundle_rift_hunter') {
      addGems(2000); addGold(50_000)
      addGear('gear_storm_band'); addGear('gear_crystal_spike'); addGear('gear_bubblegum_shield')
    } else if (bundle.id === 'bundle_legends_vault') {
      addGems(8000); addGold(200_000)
      addGear('gear_boss_tooth_necklace'); addGear('gear_infernal_core')
    } else if (bundle.id === 'bundle_ultimate') {
      addGems(25_000); addGold(1_000_000)
      addGear('gear_cosmos_fragment'); addGear('gear_chaos_rune')
    }
    flash(bundle.id)
  }

  function buyWelcomeOffer() {
    // TODO: integrate Stripe / RevenueCat for real IAP
    addGems(500); addGold(5_000)
    addGear('gear_crystal_spike'); addGear('gear_storm_band')
    setBoughtOffer(true)
    flash('welcome')
  }

  return (
    <div className={styles.shopScreen}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.headerTitle}>💎 GEM SHOP</span>
        <div className={styles.headerGems}>💎 {gems.toLocaleString()}</div>
        {onClose && <button className={styles.closeBtn} onClick={onClose}>✕</button>}
      </div>

      <div className={styles.scroll}>

        {/* New player offer */}
        {offerActive && (
          <div className={styles.welcomeOffer} data-flash={flashId === 'welcome' ? 'true' : undefined}>
            <div className={styles.welcomeTag}>🎉 NEW PLAYER OFFER</div>
            <div className={styles.welcomeBadge}>90% OFF</div>
            <div className={styles.welcomeName}>Welcome Bundle</div>
            <div className={styles.welcomeItems}>
              500 💎 Gems &nbsp;·&nbsp; 5,000 💰 Gold &nbsp;·&nbsp; 2× Rare Gear
            </div>
            <div className={styles.welcomePrices}>
              <span className={styles.welcomeOld}>$9.99</span>
              <span className={styles.welcomeNew}>$0.99</span>
            </div>
            <div className={styles.welcomeTimer}>
              ⏱ Expires in <strong>{formatCountdown(offerMsLeft)}</strong>
            </div>
            <button className={styles.welcomeBuyBtn} onClick={buyWelcomeOffer}>
              CLAIM NOW — $0.99
            </button>
          </div>
        )}

        {/* Gem packs */}
        <div className={styles.sectionLabel}>GEM PACKS</div>
        <div className={styles.gemGrid}>
          {GEM_PACKS.map(pack => (
            <button
              key={pack.id}
              className={styles.gemPack}
              data-popular={pack.tag ? 'true' : undefined}
              data-flash={flashId === pack.id ? 'true' : undefined}
              onClick={() => buyGemPack(pack)}
            >
              {pack.tag && <div className={styles.packTag}>{pack.tag}</div>}
              <div className={styles.packGems}>💎</div>
              <div className={styles.packLabel}>{pack.label}</div>
              {pack.bonus && <div className={styles.packBonus}>{pack.bonus}</div>}
              <div className={styles.packPrice}>{pack.price}</div>
            </button>
          ))}
        </div>

        {/* Bundles */}
        <div className={styles.sectionLabel}>BUNDLES</div>
        {BUNDLES.map(bundle => (
          <div
            key={bundle.id}
            className={styles.bundle}
            data-tag={bundle.tag ? 'hot' : undefined}
            data-flash={flashId === bundle.id ? 'true' : undefined}
          >
            {bundle.tag && <div className={styles.bundleTag}>{bundle.tag}</div>}
            <div className={styles.bundleLeft}>
              <div className={styles.bundleIcon}>{bundle.icon}</div>
              <div className={styles.bundleInfo}>
                <div className={styles.bundleName}>{bundle.name}</div>
                <div className={styles.bundleItems}>
                  {bundle.items.map(item => (
                    <span key={item} className={styles.bundleItem}>{item}</span>
                  ))}
                </div>
              </div>
            </div>
            <button className={styles.bundleBuyBtn} onClick={() => buyBundle(bundle)}>
              {bundle.price}
            </button>
          </div>
        ))}

        <div className={styles.disclaimer}>
          All purchases are final. Gems are virtual currency with no cash value.
          Prices shown in USD. Real IAP integration coming soon.
        </div>
      </div>
    </div>
  )
}
