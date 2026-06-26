import { useEffect, useRef, useState } from 'react'
import type { CombatEntity } from '@/game/rift/riftTypes'
import { ELEMENT_COLOURS } from '@/constants/palette'
import SpriteCharacter from './SpriteCharacter'
import styles from './BossEntrance.module.css'

interface Props {
  boss: CombatEntity
  onDone: () => void
}

type Step = 'dim' | 'glyph' | 'name' | 'tags' | 'done'

export default function BossEntrance({ boss, onDone }: Props) {
  const [step, setStep] = useState<Step>('dim')
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    const seq: Array<[Step, number]> = [
      ['dim',  300],
      ['glyph', 500],
      ['name',  700],
      ['tags',  900],
      ['done', 600],
    ]
    let t = 0
    const timers: ReturnType<typeof setTimeout>[] = []
    for (const [s, delay] of seq) {
      t += delay
      const tid = setTimeout(() => setStep(s), t)
      timers.push(tid)
    }
    const doneTid = setTimeout(() => onDoneRef.current(), t)
    timers.push(doneTid)
    return () => timers.forEach(clearTimeout)
  }, [])

  const ec = ELEMENT_COLOURS[boss.element] ?? '#8888cc'
  const glyphs = '⚡☠⚔💀🔥✦◈☽⬡'
  const glyph = glyphs[boss.assetId.length % glyphs.length]

  if (step === 'done') return null

  return (
    <div className={styles.overlay} data-step={step}>
      {step !== 'dim' && (
        <>
          {/* Warning glyph */}
          {(step === 'glyph' || step === 'name' || step === 'tags') && (
            <div className={styles.glyph} style={{ color: ec }}>
              {glyph}
            </div>
          )}

          {/* Boss silhouette + name */}
          {(step === 'name' || step === 'tags') && (
            <div className={styles.bossReveal}>
              <div className={styles.silhouette}>
                <SpriteCharacter
                  assetId={boss.assetId}
                  rarity="legendary"
                  size={96}
                  animate
                />
              </div>
              <div className={styles.nameplate} style={{ borderColor: ec }}>
                <span className={styles.bossName}>{boss.displayName}</span>
              </div>
            </div>
          )}

          {/* Tags */}
          {step === 'tags' && (
            <div className={styles.tags}>
              <span className={styles.tag} style={{ borderColor: ec, color: ec }}>
                {boss.element.toUpperCase()}
              </span>
              <span className={styles.tag} style={{ borderColor: '#ff4444', color: '#ff4444' }}>
                BOSS
              </span>
            </div>
          )}
        </>
      )}

      {/* Arena edge pulse ring */}
      <div className={styles.edgePulse} style={{ borderColor: ec }} />
    </div>
  )
}
