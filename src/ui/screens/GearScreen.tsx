import { useState } from 'react'
import RarityFrame from '@/ui/components/RarityFrame'
import PixelPanel from '@/ui/components/PixelPanel'
import gearData from '@/data/art/gear.visual.json'
import type { Rarity } from '@/constants/palette'
import { getGeneratedSprite } from '@/art/generated'
import styles from './GearScreen.module.css'

const SLOT_ICONS: Record<string, string> = {
  weapon: '⚔', armor: '🛡', charm: '📿', boots: '👢', relic: '🔮', toy: '🎪',
}

const SLOTS = ['weapon', 'armor', 'charm', 'boots', 'relic', 'toy'] as const
type GearSlot = typeof SLOTS[number]

export default function GearScreen() {
  const [activeSlot, setActiveSlot] = useState<GearSlot | 'all'>('all')
  const [selected, setSelected] = useState<string | null>(null)

  const filtered = activeSlot === 'all'
    ? gearData.gear
    : gearData.gear.filter(g => g.slot === activeSlot)

  const selectedItem = gearData.gear.find(g => g.id === selected)

  return (
    <div className={styles.screen}>
      {/* Slot filter */}
      <div className={styles.slotRow}>
        <button
          className={`${styles.slotBtn} ${activeSlot === 'all' ? styles.slotActive : ''}`}
          onClick={() => setActiveSlot('all')}
        >ALL</button>
        {SLOTS.map(slot => (
          <button
            key={slot}
            className={`${styles.slotBtn} ${activeSlot === slot ? styles.slotActive : ''}`}
            onClick={() => setActiveSlot(slot)}
          >
            {SLOT_ICONS[slot]}
          </button>
        ))}
      </div>

      {/* Selected item detail */}
      {selectedItem && (
        <PixelPanel rarity={selectedItem.rarity as Rarity} glow className={styles.detail}>
          <div className={styles.detailRow}>
            <RarityFrame rarity={selectedItem.rarity as Rarity} size={68} animate>
              {getGeneratedSprite(selectedItem.id) ? (
                <img
                  src={getGeneratedSprite(selectedItem.id)!}
                  alt={selectedItem.displayName}
                  style={{ width: 52, height: 52, imageRendering: 'pixelated' }}
                />
              ) : (
                <div style={{ fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                  {SLOT_ICONS[selectedItem.slot] ?? '❓'}
                </div>
              )}
            </RarityFrame>
            <div className={styles.detailInfo}>
              <span className={styles.itemName}>{selectedItem.displayName}</span>
              <span className={styles.itemMeta} data-rarity={selectedItem.rarity}>
                {selectedItem.rarity.toUpperCase()} · {selectedItem.slot}
              </span>
              <div className={styles.itemTags}>
                {selectedItem.tags.map(t => (
                  <span key={t} className={styles.itemTag}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </PixelPanel>
      )}

      {/* Gear grid */}
      <div className={styles.grid}>
        {filtered.map(item => {
          const sprite = getGeneratedSprite(item.id)
          return (
            <button
              key={item.id}
              className={`${styles.gearCard} ${selected === item.id ? styles.selected : ''}`}
              onClick={() => setSelected(item.id === selected ? null : item.id)}
            >
              <RarityFrame rarity={item.rarity as Rarity} size={52} animate={selected === item.id}>
                {sprite ? (
                  <img
                    src={sprite}
                    alt={item.displayName}
                    style={{ width: 40, height: 40, imageRendering: 'pixelated', display: 'block' }}
                  />
                ) : (
                  <div className={styles.gearIcon}>{SLOT_ICONS[item.slot] ?? '❓'}</div>
                )}
              </RarityFrame>
              <span className={styles.gearName}>{item.displayName}</span>
              <span className={styles.gearRarity} data-rarity={item.rarity}>
                {item.rarity.toUpperCase()}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
