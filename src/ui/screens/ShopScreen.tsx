import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { emitCoinBurst, emitGemScatter } from '@/vfx/emitters'
import { initiatePurchase } from '@/services/iapService'
import { generateChestSprite, generateRewardIcon, getGeneratedSprite } from '@/art/generated'
import type { Rarity } from '@/constants/palette'
import styles from './ShopScreen.module.css'

const IAP_ENABLED = !!import.meta.env.VITE_IAP_API

interface ShopProps { onClose?: () => void }

// ── Starter packs (gate the full shop) ────────────────────────────────────────
// EU-compliant: full shop is visibly locked, not hidden. Existence disclosed.
const STARTER_PACKS = [
  {
    id: 'starter_blade',
    iconAsset: 'gear_lucky_frog_coin',
    name: "Beginner's Blade",
    price: '$0.99',
    items: ['450 Gems', '2,500 Gold', '3 Keys', 'Lucky Frog Coin gear'],
    gems: 450, gold: 2_500, keys: 3,
    gearIds: ['gear_lucky_frog_coin'],
    highlight: false,
    tag: 'START HERE',
  },
  {
    id: 'starter_vault',
    iconAsset: 'gear_crystal_spike',
    name: "Founder's Vault",
    price: '$1.99',
    items: ['1,200 Gems', '12,000 Gold', '6 Keys', 'Storm Band + Crystal Spike'],
    gems: 1200, gold: 12_000, keys: 6,
    gearIds: ['gear_storm_band', 'gear_crystal_spike'],
    highlight: true,
    tag: 'BEST VALUE',
  },
] as const

// ── Full gem packs (locked until starter purchased) ────────────────────────────
const GEM_PACKS: { id: string; gems: number; price: string; label: string; tag: string; bonus?: string }[] = [
  { id: 'gems_80',   gems: 80,   price: '$0.99',  label: '80 Gems',    tag: '' },
  { id: 'gems_500',  gems: 500,  price: '$4.99',  label: '500 Gems',   tag: 'POPULAR',   bonus: '+10%' },
  { id: 'gems_1200', gems: 1200, price: '$9.99',  label: '1,200 Gems', tag: 'BEST VALUE', bonus: '+25%' },
  { id: 'gems_2500', gems: 2500, price: '$19.99', label: '2,500 Gems', tag: '',              bonus: '+40%' },
  { id: 'gems_6500', gems: 6500, price: '$49.99', label: '6,500 Gems', tag: '',              bonus: '+80%' },
]

const BUNDLES = [
  {
    id: 'bundle_rift_hunter',
    iconAsset: 'gear_storm_band',
    name: 'Rift Hunter Pack',
    price: '$14.99',
    items: ['2,000 Gems', '50,000 Gold', '3x Rare Gear', '5 Capsule Keys'],
    tag: '',
    gems: 2000, gold: 50_000,
    gearIds: ['gear_storm_band', 'gear_crystal_spike', 'gear_bubblegum_shield'],
  },
  {
    id: 'bundle_legends_vault',
    iconAsset: 'chest_epic_closed',
    name: 'Legends Vault',
    price: '$49.99',
    items: ['8,000 Gems', '200,000 Gold', '2x Epic Gear', '20 Keys'],
    tag: 'HOT',
    gems: 8000, gold: 200_000,
    gearIds: ['gear_boss_tooth_necklace', 'gear_infernal_core'],
  },
  {
    id: 'bundle_ultimate',
    iconAsset: 'chest_legendary_closed',
    name: 'Ultimate Vault',
    price: '$99.99',
    items: ['25,000 Gems', '1,000,000 Gold', '1x Legendary Gear', '50 Keys', '25x Boosts'],
    tag: 'ULTIMATE',
    gems: 25_000, gold: 1_000_000,
    gearIds: ['gear_cosmos_fragment', 'gear_chaos_rune'],
  },
] as const

function fmt(ms: number): string {
  if (ms <= 0) return '00:00:00'
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function shopAssetIcon(assetId: string, rarity: Rarity = 'rare'): string {
  return getGeneratedSprite(assetId) ?? generateChestSprite(rarity, 'closed')
}

export default function ShopScreen({ onClose }: ShopProps) {
  const gems               = useGameStore(s => s.gems)
  const addGems            = useGameStore(s => s.addGems)
  const addGold            = useGameStore(s => s.addGold)
  const addGear            = useGameStore(s => s.addGear)
  const gemOfferExpiresAt  = useGameStore(s => s.gemOfferExpiresAt)
  const initGemOffer       = useGameStore(s => s.initGemOffer)
  const starterPacksBought = useGameStore(s => s.starterPacksBought)
  const buyStarterPack     = useGameStore(s => s.buyStarterPack)

  const [now, setNow] = useState(Date.now())
  const [flashId, setFlashId] = useState<string | null>(null)
  const [justUnlocked, setJustUnlocked] = useState(false)
  const [purchasingId, setPurchasingId] = useState<string | null>(null)
  const prevUnlocked = useRef(starterPacksBought.length > 0)

  useEffect(() => {
    initGemOffer()
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const shopUnlocked   = starterPacksBought.length > 0
  const offerActive    = gemOfferExpiresAt > 0 && now < gemOfferExpiresAt
                         && !starterPacksBought.includes('welcome_offer')
  const offerMsLeft    = gemOfferExpiresAt - now

  function flash(id: string) {
    setFlashId(id)
    setTimeout(() => setFlashId(null), 700)
  }

  function handleBuyStarter(pack: typeof STARTER_PACKS[number]) {
    buyStarterPack(pack.id, pack.gems, pack.gold, pack.keys, [...pack.gearIds])
    flash(pack.id)
    emitCoinBurst({ x: window.innerWidth / 2, y: window.innerHeight / 2 }, 30)
    emitGemScatter({ x: window.innerWidth / 2, y: window.innerHeight / 2 }, pack.gems)
    if (!prevUnlocked.current) {
      setJustUnlocked(true)
      prevUnlocked.current = true
      setTimeout(() => setJustUnlocked(false), 2000)
    }
  }

  function handleBuyWelcome() {
    buyStarterPack('welcome_offer', 650, 8_000, 4, ['gear_crystal_spike', 'gear_storm_band'])
    flash('welcome_offer')
    emitCoinBurst({ x: window.innerWidth / 2, y: window.innerHeight / 2 }, 35)
    emitGemScatter({ x: window.innerWidth / 2, y: window.innerHeight / 2 }, 650)
    if (!prevUnlocked.current) {
      setJustUnlocked(true)
      prevUnlocked.current = true
      setTimeout(() => setJustUnlocked(false), 2000)
    }
  }

  async function buyGemPack(pack: typeof GEM_PACKS[number]) {
    if (IAP_ENABLED) {
      setPurchasingId(pack.id)
      try { await initiatePurchase(pack.id) }
      catch { setPurchasingId(null) }
      return
    }
    // Dev mode — grant directly
    addGems(pack.gems)
    flash(pack.id)
    emitGemScatter({ x: window.innerWidth / 2, y: window.innerHeight / 2 }, pack.gems)
  }

  async function buyBundle(bundle: typeof BUNDLES[number]) {
    if (IAP_ENABLED) {
      setPurchasingId(bundle.id)
      try { await initiatePurchase(bundle.id) }
      catch { setPurchasingId(null) }
      return
    }
    // Dev mode — grant directly
    addGems(bundle.gems)
    addGold(bundle.gold)
    for (const gid of bundle.gearIds) addGear(gid)
    flash(bundle.id)
    emitCoinBurst({ x: window.innerWidth / 2, y: window.innerHeight / 2 }, 40)
    emitGemScatter({ x: window.innerWidth / 2, y: window.innerHeight / 2 }, bundle.gems)
  }

  return (
    <div className={styles.shopScreen}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.headerTitle}>
          <img src={generateRewardIcon('gem', 'rare')} alt="" className={styles.headerIcon} aria-hidden="true" />
          GEM SHOP
        </span>
        <div className={styles.headerGems}>
          <img src={generateRewardIcon('gem', 'rare')} alt="" className={styles.headerGemIcon} aria-hidden="true" />
          {gems.toLocaleString()}
        </div>
        {onClose && <button className={styles.closeBtn} onClick={onClose}>✕</button>}
      </div>

      <div className={styles.scroll}>

        {/* ── STARTER DEALS (always visible, gates the full shop) ── */}
        <div className={styles.starterSection}>
          <div className={styles.starterLabel}>
            {shopUnlocked ? 'YOUR STARTER PACKS' : 'STARTER DEALS - UNLOCK THE VAULT'}
          </div>

          {/* Welcome offer (time-limited, replaces starter_blade while active) */}
          {offerActive && (
            <div className={`${styles.starterCard} ${styles.starterWelcome}`}
              data-flash={flashId === 'welcome_offer' ? 'true' : undefined}
            >
              <div className={styles.starterTag}>WELCOME VALUE</div>
              <div className={styles.starterRow}>
                <img src={generateChestSprite('epic', 'closed')} alt="" className={styles.starterIcon} aria-hidden="true" />
                <div className={styles.starterInfo}>
                  <div className={styles.starterName}>Welcome Bundle</div>
                  <div className={styles.starterItems}>
                    650 Gems - 8,000 Gold - 4 Keys - 2x Rare Gear
                  </div>
                  <div className={styles.welcomeTimer}>
                    Available for <strong>{fmt(offerMsLeft)}</strong>
                  </div>
                </div>
                <div className={styles.starterPriceCol}>
                  <span className={styles.strikePrice}>$9.99</span>
                  <span className={styles.starterPrice}>$0.99</span>
                </div>
              </div>
              <button className={styles.starterBuyBtn} onClick={handleBuyWelcome}>
                {shopUnlocked ? 'BUY - $0.99' : 'CLAIM & UNLOCK SHOP'}
              </button>
            </div>
          )}

          {/* Permanent starter packs */}
          {STARTER_PACKS.map(pack => {
            // Hide starter_blade while welcome offer is active (same price point)
            if (pack.id === 'starter_blade' && offerActive) return null
            const bought = starterPacksBought.includes(pack.id)
            return (
              <div
                key={pack.id}
                className={`${styles.starterCard} ${pack.highlight ? styles.starterHighlight : ''}`}
                data-flash={flashId === pack.id ? 'true' : undefined}
              >
                  {pack.tag && <div className={styles.starterTag}>{pack.tag}</div>}
                  <div className={styles.starterRow}>
                  <img src={shopAssetIcon(pack.iconAsset, pack.highlight ? 'epic' : 'rare')} alt="" className={styles.starterIcon} aria-hidden="true" />
                  <div className={styles.starterInfo}>
                    <div className={styles.starterName}>{pack.name}</div>
                    <div className={styles.starterItems}>
                      {pack.items.join(' · ')}
                    </div>
                  </div>
                  <div className={styles.starterPriceCol}>
                    <span className={styles.starterPrice}>{pack.price}</span>
                  </div>
                </div>
                <button
                  className={`${styles.starterBuyBtn} ${pack.highlight ? styles.starterBuyHighlight : ''}`}
                  disabled={bought}
                  onClick={() => !bought && handleBuyStarter(pack)}
                >
                  {bought ? 'PURCHASED ✓' : shopUnlocked ? `BUY — ${pack.price}` : `UNLOCK SHOP — ${pack.price}`}
                </button>
              </div>
            )
          })}
        </div>

        {/* ── FULL SHOP — always visible, greyed out until starter purchased ── */}
        <>
          {justUnlocked && (
            <div className={styles.unlockBanner}>
              GEM VAULT UNLOCKED! Welcome to the full shop!
            </div>
          )}

          {!shopUnlocked && (
            <div className={styles.vaultHint}>
              Purchase a starter deal above to unlock gem packs &amp; bundles
            </div>
          )}

          {/* Gem packs */}
          <div className={styles.sectionLabel}>GEM PACKS</div>
          <div className={`${styles.gemGrid} ${!shopUnlocked ? styles.vaultDimmed : ''}`}>
            {GEM_PACKS.map(pack => (
              <button
                key={pack.id}
                className={styles.gemPack}
                data-popular={pack.tag ? 'true' : undefined}
                data-flash={flashId === pack.id ? 'true' : undefined}
                disabled={!shopUnlocked || purchasingId === pack.id}
                onClick={() => shopUnlocked && buyGemPack(pack)}
              >
                {pack.tag && <div className={styles.packTag}>{pack.tag}</div>}
                <img src={generateRewardIcon('gem', 'rare')} alt="" className={styles.packGems} aria-hidden="true" />
                <div className={styles.packLabel}>{pack.label}</div>
                {pack.bonus && <div className={styles.packBonus}>{pack.bonus}</div>}
                <div className={styles.packPrice}>
                  {purchasingId === pack.id ? '...' : pack.price}
                </div>
              </button>
            ))}
          </div>

          {/* Bundles */}
          <div className={styles.sectionLabel}>BUNDLES</div>
          <div className={!shopUnlocked ? styles.vaultDimmed : undefined}>
            {BUNDLES.map(bundle => (
              <div
                key={bundle.id}
                className={styles.bundle}
                data-tag={bundle.tag ? 'hot' : undefined}
                data-flash={flashId === bundle.id ? 'true' : undefined}
              >
                {bundle.tag && <div className={styles.bundleTag}>{bundle.tag}</div>}
                <div className={styles.bundleLeft}>
                  <img src={shopAssetIcon(bundle.iconAsset, 'epic')} alt="" className={styles.bundleIcon} aria-hidden="true" />
                  <div className={styles.bundleInfo}>
                    <div className={styles.bundleName}>{bundle.name}</div>
                    <div className={styles.bundleItems}>
                      {bundle.items.map(item => (
                        <span key={item} className={styles.bundleItem}>{item}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  className={styles.bundleBuyBtn}
                  disabled={!shopUnlocked || purchasingId === bundle.id}
                  onClick={() => shopUnlocked && buyBundle(bundle)}
                >
                  {purchasingId === bundle.id ? '...' : bundle.price}
                </button>
              </div>
            ))}
          </div>
        </>

        <div className={styles.disclaimer}>
          All purchases are final. Gems are virtual currency with no cash value.
          Prices in USD; local tax may apply. Additional purchasable content exists beyond starter packs.
          {IAP_ENABLED ? ' Payments processed securely via Stripe.' : ' (dev mode — purchases are simulated)'}
        </div>
      </div>
    </div>
  )
}
