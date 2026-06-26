import { useState } from 'react'
import RarityFrame from '@/ui/components/RarityFrame'
import SpriteCharacter from '@/ui/components/SpriteCharacter'
import MountCard from '@/ui/components/MountCard'
import petsData from '@/data/art/pets.visual.json'
import mountsData from '@/data/art/mounts.visual.json'
import { useGameStore } from '@/store/gameStore'
import type { Rarity } from '@/constants/palette'
import styles from './ProgressScreen.module.css'

const TABS = ['Pets', 'Mounts', 'Stats', 'Cosmetics'] as const
type Tab = typeof TABS[number]

export default function ProgressScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('Pets')
  const [selectedMount, setSelectedMount] = useState<string | null>(null)

  const totalRifts = useGameStore(s => s.totalRifts)
  const totalKills = useGameStore(s => s.totalKills)
  const totalGoldEarned = useGameStore(s => s.totalGoldEarned)
  const totalCapsulePulls = useGameStore(s => s.totalCapsulePulls)
  const highestPower = useGameStore(s => s.highestPower)
  const ownedHeroes = useGameStore(s => s.ownedHeroes)

  return (
    <div className={styles.screen}>
      <div className={styles.tabs}>
        {TABS.map(t => (
          <button
            key={t}
            className={`${styles.tab} ${activeTab === t ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'Pets' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>COMPANIONS</span>
            <span className={styles.sectionCount}>{petsData.pets.length} / {petsData.pets.length}</span>
          </div>
          <div className={styles.petGrid}>
            {petsData.pets.map(pet => (
              <div key={pet.id} className={styles.petCard}>
                <RarityFrame rarity={pet.rarity as Rarity} size={60} animate>
                  <SpriteCharacter
                    assetId={pet.id}
                    rarity={pet.rarity as Rarity}
                    size={48}
                    animate
                  />
                </RarityFrame>
                <span className={styles.petName}>{pet.displayName}</span>
                <span className={styles.petRarity} data-rarity={pet.rarity}>
                  {pet.rarity.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Mounts' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>MOUNTS</span>
            <span className={styles.sectionCount}>{mountsData.mounts.length} total</span>
          </div>
          <div className={styles.mountGrid}>
            {mountsData.mounts.map(mount => (
              <MountCard
                key={mount.id}
                mount={mount}
                owned
                selected={selectedMount === mount.id}
                onClick={() => setSelectedMount(mount.id === selectedMount ? null : mount.id)}
              />
            ))}
          </div>
          {selectedMount && (() => {
            const m = mountsData.mounts.find(x => x.id === selectedMount)
            if (!m) return null
            return (
              <div className={styles.mountDetail}>
                <div className={styles.mountDetailName}>{m.displayName}</div>
                <div className={styles.mountDetailRow}>
                  <span className={styles.mountDetailLabel}>Idle effect</span>
                  <span className={styles.mountDetailValue}>{m.idleEffect.replace(/_/g, ' ')}</span>
                </div>
                <div className={styles.mountDetailRow}>
                  <span className={styles.mountDetailLabel}>Element</span>
                  <span className={styles.mountDetailValue}>{m.element}</span>
                </div>
                <div className={styles.mountDetailRow}>
                  <span className={styles.mountDetailLabel}>Source</span>
                  <span className={styles.mountDetailValue}>{m.unlockSource.replace(/_/g, ' ')}</span>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {activeTab === 'Stats' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>LIFETIME STATS</span>
          </div>
          <div className={styles.statList}>
            {[
              { label: 'Total Rifts', value: totalRifts.toLocaleString() },
              { label: 'Enemies Slain', value: totalKills.toLocaleString() },
              { label: 'Heroes Owned', value: ownedHeroes.length.toLocaleString() },
              { label: 'Gold Collected', value: totalGoldEarned.toLocaleString() },
              { label: 'Capsules Pulled', value: totalCapsulePulls.toLocaleString() },
              { label: 'Highest Power', value: highestPower.toLocaleString() },
            ].map(({ label, value }) => (
              <div key={label} className={styles.statRow}>
                <span className={styles.statLabel}>{label}</span>
                <strong className={styles.statValue}>{value}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Cosmetics' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>COSMETICS</span>
          </div>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🎭</div>
            <span className={styles.emptyText}>No cosmetics yet.</span>
            <span className={styles.emptyHint}>Earn from boss kills and limited events.</span>
          </div>
        </div>
      )}
    </div>
  )
}
