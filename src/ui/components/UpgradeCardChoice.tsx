import { useEffect, useRef, useState } from 'react'
import type { UpgradeChoice } from '@/game/rift/riftTypes'
import RarityFrame from './RarityFrame'
import styles from './UpgradeCardChoice.module.css'

interface Props {
  choice: UpgradeChoice
  onPick: (cardId: string) => void
}

export default function UpgradeCardChoice({ choice, onPick }: Props) {
  const [picked, setPicked] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  function handlePick(id: string) {
    if (picked) return
    setPicked(id)
    timerRef.current = setTimeout(() => onPick(id), 400)
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.header}>
        <span className={styles.title}>CHOOSE UPGRADE</span>
        <span className={styles.sub}>Pick one to power up your squad</span>
      </div>
      <div className={styles.cards}>
        {choice.cards.map(card => (
          <button
            key={card.id}
            className={`${styles.card} ${picked === card.id ? styles.picked : ''} ${picked && picked !== card.id ? styles.dimmed : ''}`}
            onClick={() => handlePick(card.id)}
            disabled={!!picked}
          >
            <RarityFrame rarity={card.rarity} size={56} animate={!picked}>
              <div className={styles.cardIcon}>{card.icon}</div>
            </RarityFrame>
            <div className={styles.cardTitle} data-rarity={card.rarity}>{card.title}</div>
            <div className={styles.cardDesc}>{card.description}</div>
            <div className={styles.cardRarity} data-rarity={card.rarity}>{card.rarity.toUpperCase()}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
