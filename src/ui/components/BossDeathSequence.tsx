import { useEffect, useRef, useState } from 'react'
import type { CombatEntity } from '@/game/rift/riftTypes'
import { ELEMENT_COLOURS, RARITY_COLOURS } from '@/constants/palette'
import { triggerShake } from '@/animation/screenShake'
import { emitExplosion, emitChestVolcano, emitGoldBeam } from '@/vfx/emitters'
import styles from './BossDeathSequence.module.css'

interface Props {
  boss: CombatEntity
  killCount: number
  goldEarned: number
  onDone: () => void
}

type Phase = 'shockwave' | 'text_slam' | 'stats' | 'done'

export default function BossDeathSequence({ boss, killCount, goldEarned, onDone }: Props) {
  const [phase, setPhase] = useState<Phase>('shockwave')
  const [statsVisible, setStatsVisible] = useState(false)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  const ec = ELEMENT_COLOURS[boss.element] ?? '#cc44ff'
  const rc = RARITY_COLOURS.legendary

  useEffect(() => {
    // Immediate shockwave VFX
    triggerShake('bossDeath')
    emitExplosion({ x: window.innerWidth / 2, y: window.innerHeight * 0.42 }, 60, boss.element)
    setTimeout(() => {
      emitGoldBeam({ x: window.innerWidth / 2, y: window.innerHeight * 0.42 })
      emitChestVolcano({ x: window.innerWidth / 2, y: window.innerHeight * 0.42 }, 8)
    }, 200)

    const seq: Array<[Phase | 'stats_vis', number]> = [
      ['text_slam', 600],
      ['stats',     800],
      ['stats_vis', 200],
      ['done',      2800],
    ]
    let t = 0
    const timers: ReturnType<typeof setTimeout>[] = []
    for (const [s, delay] of seq) {
      t += delay
      const captured = s
      timers.push(setTimeout(() => {
        if (captured === 'stats_vis') { setStatsVisible(true); return }
        setPhase(captured as Phase)
        if (captured === 'done') onDoneRef.current()
      }, t))
    }
    return () => timers.forEach(clearTimeout)
  }, [])

  if (phase === 'done') return null

  return (
    <div className={styles.overlay}>
      {/* Radial shockwave ring */}
      <div className={styles.shockwave} style={{ '--ec': ec } as React.CSSProperties} />
      <div className={styles.shockwaveOuter} style={{ '--ec': ec } as React.CSSProperties} />

      {/* Element color flash fill */}
      <div className={styles.flashFill} style={{ background: ec }} />

      {(phase === 'text_slam' || phase === 'stats') && (
        <>
          {/* Boss name + DEFEATED */}
          <div className={styles.bossLabel} style={{ color: ec }}>{boss.displayName}</div>
          <div className={styles.defeatedText} style={{ '--glow': rc.glow } as React.CSSProperties}>
            DEFEATED
          </div>

          {/* Separator */}
          <div className={styles.separator} style={{ background: ec }} />

          {/* Stats cascade */}
          {phase === 'stats' && (
            <div className={`${styles.statsRow} ${statsVisible ? styles.statsVisible : ''}`}>
              <div className={styles.stat}>
                <span className={styles.statIcon}>⚔️</span>
                <span className={styles.statVal}>{killCount}</span>
                <span className={styles.statLabel}>KILLS</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statIcon}>💰</span>
                <span className={styles.statVal}>{goldEarned}</span>
                <span className={styles.statLabel}>GOLD</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
