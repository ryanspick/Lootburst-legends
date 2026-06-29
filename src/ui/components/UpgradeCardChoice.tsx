import { useEffect, useMemo, useRef, useState } from 'react'
import type { UpgradeChoice } from '@/game/rift/riftTypes'
import { getUpgradeBuildCounts, getUpgradeBuildSummary } from '@/game/rift/upgradeCards'
import { generateUpgradeIcon } from '@/art/generated'
import RarityFrame from './RarityFrame'
import { playSound } from '@/audio/soundEvents'
import styles from './UpgradeCardChoice.module.css'

interface Props {
  choice: UpgradeChoice
  onPick: (cardId: string) => void
  appliedUpgradeIds?: string[]
}

export default function UpgradeCardChoice({ choice, onPick, appliedUpgradeIds = [] }: Props) {
  const [picked, setPicked] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const buildSummary = useMemo(() => getUpgradeBuildSummary(appliedUpgradeIds), [appliedUpgradeIds])
  const buildCounts = useMemo(() => getUpgradeBuildCounts(appliedUpgradeIds), [appliedUpgradeIds])

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  useEffect(() => { playSound('ui_upgrade_card_flip') }, [])

  function handlePick(id: string) {
    if (picked) return
    setPicked(id)
    playSound('ui_claim_sweep')
    timerRef.current = setTimeout(() => onPick(id), 400)
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.header}>
        <span className={styles.title}>ROUND CLEAR</span>
        <span className={styles.sub}>Pick a build upgrade</span>
      </div>
      <div className={styles.buildSummary}>
        <span>BUILD</span>
        <strong>{buildSummary.primaryBuild ?? 'OPEN'}</strong>
        <small>{buildSummary.total} picks</small>
      </div>
      {buildSummary.activeBuilds.length > 0 && (
        <div className={styles.buildLanes}>
          {buildSummary.activeBuilds.slice(0, 4).map(build => (
            <span key={build} className={styles.buildLane}>
              {build} {buildCounts[build]}
            </span>
          ))}
        </div>
      )}
      <div className={styles.cards}>
        {choice.cards.map(card => {
          const laneCount = buildCounts[card.build] ?? 0
          const comboReady = Boolean(card.combo?.length && card.combo.every(build => (buildCounts[build] ?? 0) > 0))
          return (
            <button
              key={card.id}
              className={`${styles.card} ${picked === card.id ? styles.picked : ''} ${picked && picked !== card.id ? styles.dimmed : ''}`}
              onClick={() => handlePick(card.id)}
              disabled={!!picked}
            >
              <RarityFrame rarity={card.rarity} size={56} animate={!picked}>
                <img
                  src={generateUpgradeIcon(card.id, card.build, card.rarity)}
                  alt=""
                  className={styles.cardIcon}
                  aria-hidden="true"
                />
              </RarityFrame>
              <div className={styles.cardTitle} data-rarity={card.rarity}>{card.title}</div>
              <div className={styles.buildTag}>{card.build}</div>
              <div
                className={styles.laneHint}
                data-hot={laneCount > 0 ? 'true' : undefined}
                data-payoff={comboReady ? 'true' : undefined}
              >
                {comboReady ? 'PAYOFF' : laneCount > 0 ? `LANE ${laneCount + 1}` : 'NEW LANE'}
              </div>
              <div className={styles.cardDesc}>{card.description}</div>
              {card.synergy && <div className={styles.synergy}>{card.synergy}</div>}
              <div className={styles.cardRarity} data-rarity={card.rarity}>{card.rarity.toUpperCase()}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
