import { useEffect, useRef, useState, useCallback } from 'react'
import type { RiftRunState, TimelineEvent } from '@/game/rift/riftTypes'
import {
  createInitialRiftState,
  tickCombat,
  spawnWave,
  spawnBoss,
  buildPostRunReward,
  triggerUpgradeChoice,
  applyUpgradeCard,
  reviveHeroes,
  type SpawnPattern,
} from '@/game/rift/riftRunState'
import { renderRiftFrame, clearCombatEmitCache } from '@/game/rift/combatLoop'
import { RIFT_DURATION_MS, WAVE_CLEAR_DELAY_MS } from '@/game/rift/waveDirector'
import { getRiftTier } from '@/game/rift/riftTiers'
import { computeHeroGearBonuses, computeRunGearBonuses } from '@/game/gear/gearStats'
import { ZONES } from '@/game/rift/zoneBackgrounds'
import UpgradeCardChoice from '@/ui/components/UpgradeCardChoice'
import BossHpBar from '@/ui/components/BossHpBar'
import BossEntrance from '@/ui/components/BossEntrance'
import BossDeathSequence from '@/ui/components/BossDeathSequence'
import WavePresentation from '@/ui/components/WavePresentation'
import LootBurstOverlay from '@/ui/components/LootBurstOverlay'
import type { LootItem } from '@/ui/components/LootBurstOverlay'
import RewardSummary from '@/ui/screens/RewardSummary'
import type { Rarity } from '@/constants/palette'
import { triggerShake, setReducedMotion } from '@/animation/screenShake'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { emitCoinBurst, emitHeroTrail } from '@/vfx/emitters'
import { getCosmeticById } from '@/data/cosmeticsData'
import heroesData from '@/data/art/heroes.visual.json'
import FloatingCurrency from '@/ui/components/FloatingCurrency'
import type { FloatEmit } from '@/ui/components/FloatingCurrency'
import CombatHint from '@/ui/components/CombatHint'
import { playTrack } from '@/audio/musicEngine'
import { useGameStore } from '@/store/gameStore'
import styles from './RiftRunScreen.module.css'

const FALLBACK_HERO_IDS = [
  'hero_copper_knight',
  'hero_mushroom_medic',
  'hero_goblin_sparkshot',
]

interface Props {
  onExit: (kills?: number, wasWipe?: boolean) => void
}

const CANVAS_W = 360
const CANVAS_H = 780

export default function RiftRunScreen({ onExit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<RiftRunState | null>(null)
  const timelineRef = useRef<TimelineEvent[]>([])
  const lastTsRef = useRef<number>(0)
  const rafRef = useRef<number>(0)
  const timeMsRef = useRef<number>(0)
  const trailTimerRef = useRef<number>(0)

  const squadHeroIds = useGameStore(s => s.squadHeroIds)
  const totalRifts = useGameStore(s => s.totalRifts)
  const selectedRiftTier = useGameStore(s => s.selectedRiftTier)
  const addGold = useGameStore(s => s.addGold)
  const addGems = useGameStore(s => s.addGems)
  const addGear = useGameStore(s => s.addGear)
  const spendGems = useGameStore(s => s.spendGems)
  const recordRiftResult = useGameStore(s => s.recordRiftResult)
  const consumeBoosts = useGameStore(s => s.consumeBoosts)
  const ownedGear = useGameStore(s => s.ownedGear)
  const awardRunXp = useGameStore(s => s.awardRunXp)

  const REVIVE_COST = 5
  const reducedMotion = useReducedMotion()

  // Sync reduced-motion preference into the shake module
  useEffect(() => { setReducedMotion(reducedMotion) }, [reducedMotion])

  const [phase, setPhase] = useState<RiftRunState['phase']>('countdown')
  const [countdown, setCountdown] = useState(3)
  const [upgradeChoice, setUpgradeChoice] = useState<RiftRunState['upgradeChoice']>(null)
  const [postRun, setPostRun] = useState<RiftRunState['postRun']>(null)
  const [stats, setStats] = useState({ kills: 0, gold: 0, elapsedMs: 0 })
  const [bossWarning, setBossWarning] = useState(false)
  const [bossEntrance, setBossEntrance] = useState<RiftRunState['boss']>(null)
  const [bossSnap, setBossSnap] = useState<RiftRunState['boss']>(null)
  const [bossPhase, setBossPhase] = useState<1 | 2>(1)
  const [showLootBurst, setShowLootBurst] = useState(false)
  const [showRevivePrompt, setShowRevivePrompt] = useState(false)
  const [bossDeathSnap, setBossDeathSnap] = useState<{ boss: RiftRunState['boss']; killCount: number; goldCollected: number } | null>(null)
  const [showBossDeath, setShowBossDeath] = useState(false)
  const [wavePresentation, setWavePresentation] = useState<{ waveIndex: number; enemyCount: number; isBoss?: boolean } | null>(null)
  const prevBossAliveRef = useRef<boolean | null>(null)
  const zoneIdxRef = useRef(Math.floor(Math.random() * ZONES.length))
  const [showZoneName, setShowZoneName] = useState(false)
  const [floatEmissions, setFloatEmissions] = useState<FloatEmit[]>([])
  const floatIdRef = useRef(0)
  const emittedLootRef = useRef(new Set<number>())
  const goldHudRef = useRef<HTMLSpanElement>(null)

  // First-run contextual hints (only during totalRifts === 0)
  const isFirstRift = totalRifts === 0
  const [combatHint, setCombatHint] = useState<{ msg: string; icon: string } | null>(null)
  const shownHintsRef = useRef(new Set<string>())
  const lastGoldFlushRef = useRef(0)
  const lastFlushedGoldRef = useRef(0)
  // Wave queue — completion-based spawning
  const waveQueueRef = useRef<{ wave: number; count: number; pattern: SpawnPattern }[]>([])
  const wavePhaseRef = useRef<'idle' | 'active' | 'resting'>('idle')
  const waveClearTimerRef = useRef(0)
  const lastWaveShownRef = useRef(-1)
  const [nextWaveIn, setNextWaveIn] = useState<number | null>(null)

  // Bootstrap state once
  useEffect(() => {
    const heroIds = squadHeroIds.filter(Boolean).length >= 1
      ? squadHeroIds.filter(Boolean)
      : FALLBACK_HERO_IDS
    const tierData = getRiftTier(selectedRiftTier)
    const runDiff = Math.min(1 + totalRifts * 0.025, 2.5)
    const difficultyMult = runDiff * tierData.enemyMult
    const startBoosts = consumeBoosts()

    // Compute gear bonuses from store (snapshot at run start)
    const storeSnapshot = useGameStore.getState()
    const gearSnapshot = storeSnapshot.ownedGear
    const heroGearBonuses = heroIds.map(heroId =>
      computeHeroGearBonuses(
        gearSnapshot.filter(g => g.equipped && g.equippedHeroId === heroId).map(g => g.id)
      )
    )
    const heroLevels = heroIds.map(heroId =>
      storeSnapshot.ownedHeroes.find(h => h.id === heroId)?.level ?? 1
    )
    const runGearBonuses = computeRunGearBonuses(
      gearSnapshot.filter(g => g.equipped).map(g => g.id)
    )

    const { state, timeline } = createInitialRiftState(heroIds, {
      difficultyMult,
      startBoosts,
      rewardMult: tierData.rewardMult,
      tierLevel: tierData.level,
      heroGearBonuses,
      heroLevels,
      runGearBonuses,
      equippedPetId:   storeSnapshot.equippedPetId,
      equippedMountId: storeSnapshot.equippedMountId,
    })
    stateRef.current = state
    timelineRef.current = timeline
    clearCombatEmitCache()

    // Countdown 3→2→1→GO
    let count = 3
    setCountdown(count)
    const iv = setInterval(() => {
      count--
      setCountdown(count)
      if (count <= 0) {
        clearInterval(iv)
        if (stateRef.current) {
          stateRef.current.phase = 'combat'
          setPhase('combat')
          setShowZoneName(true)
          setTimeout(() => setShowZoneName(false), 2500)
        }
      }
    }, 1000)

    return () => { clearInterval(iv); cancelAnimationFrame(rafRef.current) }
  }, [])

  const handleUpgradePick = useCallback((cardId: string) => {
    if (!stateRef.current) return
    applyUpgradeCard(stateRef.current, cardId)
    setUpgradeChoice(null)
    setPhase('combat')
  }, [])

  const handleReviveAccept = useCallback(() => {
    if (!stateRef.current) return
    spendGems(REVIVE_COST)
    reviveHeroes(stateRef.current)
    setShowRevivePrompt(false)
  }, [spendGems])

  const claimPostRunRewards = useCallback((postRun: NonNullable<typeof stateRef.current>['postRun'], killCount: number) => {
    if (!postRun) return
    addGold(postRun.goldEarned)
    addGems(postRun.gemsEarned)
    postRun.lootItems.forEach(item => addGear(item.id))
    recordRiftResult({
      kills: killCount,
      goldEarned: postRun.goldEarned,
      elapsedMs: postRun.elapsedMs,
      tierLevel: postRun.tierLevel,
      wasWipe: postRun.wasWipe,
    })
    // Award XP to active squad heroes — mutates postRun.heroesLeveled in place for RewardSummary
    const s = useGameStore.getState()
    const heroIds = s.squadHeroIds.filter(Boolean)
    const leveledIds = awardRunXp(heroIds, Math.round(postRun.xpEarned))
    if (leveledIds.length > 0) {
      postRun.heroesLeveled = leveledIds.map(id =>
        heroesData.heroes.find(h => h.id === id)?.displayName ?? id
      )
    }
  }, [addGold, addGems, addGear, recordRiftResult, awardRunXp])

  const handleReviveDecline = useCallback(() => {
    setShowRevivePrompt(false)
    const s = stateRef.current!
    claimPostRunRewards(s.postRun, s.killCount)
    setPostRun(s.postRun)
    setPhase('post_run')
    setShowLootBurst(true)
  }, [claimPostRunRewards])

  const handleFloatDone = useCallback((id: string) => {
    setFloatEmissions(prev => prev.filter(e => e.id !== id))
  }, [])

  // RAF game loop
  useEffect(() => {
    function loop(ts: number) {
      const state = stateRef.current
      if (!state) { rafRef.current = requestAnimationFrame(loop); return }

      const dt = lastTsRef.current ? Math.min(ts - lastTsRef.current, 50) : 16
      lastTsRef.current = ts
      timeMsRef.current += dt

      // Canvas render (always)
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (ctx) {
        renderRiftFrame(ctx, state, CANVAS_W, CANVAS_H, timeMsRef.current, zoneIdxRef.current)
      }

      if (state.phase === 'combat') {
        state.elapsedMs += dt
        tickCombat(state, dt)

        // Hero trail cosmetic
        if (ts - trailTimerRef.current >= 80) {
          trailTimerRef.current = ts
          const trailId = useGameStore.getState().equippedCosmetics?.trail ?? 'trail_default'
          const trailDef = getCosmeticById(trailId)
          if (trailDef?.trailColor) {
            for (const hero of state.heroes) {
              if (hero.alive) emitHeroTrail({ x: hero.x, y: hero.y }, trailDef.trailColor)
            }
          }
        }

        // Hero wipe detected inside tickCombat — check for revive before ending run.
        // Read via ref to escape TypeScript's control-flow narrowing of state.phase.
        if (stateRef.current!.phase === 'post_run') {
          const wasWipe = state.postRun?.wasWipe
          const canRevive = wasWipe && !state.reviveUsed &&
            useGameStore.getState().gems >= REVIVE_COST
          if (canRevive) {
            setShowRevivePrompt(true)
          } else {
            claimPostRunRewards(state.postRun, state.killCount)
            setPostRun(state.postRun)
            setPhase('post_run')
            setShowLootBurst(true)
          }
          rafRef.current = requestAnimationFrame(loop)
          return
        }

        // Detect boss death (transition alive→dead)
        if (state.boss) {
          const wasAlive = prevBossAliveRef.current
          const isAlive = state.boss.alive
          if (wasAlive === true && !isAlive && !showBossDeath) {
            setBossDeathSnap({ boss: { ...state.boss }, killCount: state.killCount, goldCollected: state.goldCollected })
            setShowBossDeath(true)
            playTrack('rift')
          }
          prevBossAliveRef.current = isAlive
        } else {
          prevBossAliveRef.current = null
        }

        // Boss warning countdown
        if (state.bossWarningId && state.bossWarningTimeMs > 0) {
          state.bossWarningTimeMs = Math.max(0, state.bossWarningTimeMs - dt)
          if (state.bossWarningTimeMs <= 0) state.bossWarningId = null
        }

        // Fire timeline events
        for (const event of timelineRef.current) {
          if (event.fired) continue
          if (state.elapsedMs < event.atMs) continue
          event.fired = true

          switch (event.type) {
            case 'wave_spawn': {
              const wave = (event.data?.wave as number) ?? 0
              const count = (event.data?.count as number) ?? 3
              const pattern = (event.data?.pattern as SpawnPattern) ?? 'ring'
              waveQueueRef.current.push({ wave, count, pattern })
              break
            }
            case 'upgrade_choice':
              triggerUpgradeChoice(state)
              setUpgradeChoice({ cards: state.upgradeChoice!.cards, pickedId: null })
              setPhase('upgrade_choice')
              if (isFirstRift && !shownHintsRef.current.has('cards')) {
                shownHintsRef.current.add('cards')
                setCombatHint({ msg: 'Pick an upgrade — cards power up your squad!', icon: '✨' })
              }
              break
            case 'boss_warning': {
              const bId = event.data?.bossId as string
              state.bossWarningId = bId
              state.bossWarningTimeMs = 2000
              setBossWarning(true)
              setTimeout(() => setBossWarning(false), 2000)
              triggerShake('bossAttack')
              break
            }
            case 'mid_boss': {
              const bId = event.data?.bossId as string
              spawnBoss(state, bId)
              state.bossPhase = 1
              triggerShake('bossDeath')
              setBossEntrance(state.boss)
              setBossPhase(1)
              setWavePresentation(null)
              prevBossAliveRef.current = true
              playTrack('boss')
              if (isFirstRift && !shownHintsRef.current.has('boss')) {
                shownHintsRef.current.add('boss')
                setCombatHint({ msg: 'BOSS FIGHT! Your squad fights automatically!', icon: '⚠️' })
              }
              break
            }
            case 'final_boss': {
              const bId = event.data?.bossId as string
              spawnBoss(state, bId)
              state.bossPhase = 1
              triggerShake('bossDeath')
              setBossEntrance(state.boss)
              setBossPhase(1)
              setWavePresentation(null)
              prevBossAliveRef.current = true
              playTrack('boss')
              break
            }
            case 'end_run':
              buildPostRunReward(state)
              setPostRun(state.postRun)
              setPhase('post_run')
              setShowLootBurst(true)
              emitCoinBurst({ x: 180, y: 270 }, 30)
              claimPostRunRewards(state.postRun, state.killCount)
              break
          }
        }

        // Wave queue: completion-based spawning
        {
          const bossAlive = !!state.boss?.alive
          const aliveEnemies = state.enemies.filter(e => e.alive).length + state.pendingSpawns.length

          // Detect wave cleared (non-boss enemies gone) — spawn next almost instantly
          if (wavePhaseRef.current === 'active' && aliveEnemies === 0 && !bossAlive) {
            wavePhaseRef.current = 'resting'
            waveClearTimerRef.current = 300
            setNextWaveIn(null)
          }

          // Tick rest countdown
          if (wavePhaseRef.current === 'resting') {
            waveClearTimerRef.current = Math.max(0, waveClearTimerRef.current - dt)
            setNextWaveIn(waveClearTimerRef.current > 0 ? Math.ceil(waveClearTimerRef.current / 1000) : null)
          }

          // Spawn next wave when ready (idle first wave, or resting timer done)
          const canSpawnNext = !bossAlive && waveQueueRef.current.length > 0 && (
            wavePhaseRef.current === 'idle' ||
            (wavePhaseRef.current === 'resting' && waveClearTimerRef.current <= 0)
          )
          if (canSpawnNext) {
            const next = waveQueueRef.current.shift()!
            spawnWave(state, next.wave, next.count, next.pattern)
            wavePhaseRef.current = 'active'
            waveClearTimerRef.current = 0
            setNextWaveIn(null)
            if (next.wave !== lastWaveShownRef.current) {
              lastWaveShownRef.current = next.wave
              setWavePresentation({ waveIndex: next.wave, enemyCount: next.count })
            }
          }

          // Boss cleared → return to idle so post-boss waves can spawn
          if (wavePhaseRef.current === 'active' && bossAlive === false &&
              state.boss !== null && !state.boss.alive && aliveEnemies === 0) {
            wavePhaseRef.current = 'resting'
            waveClearTimerRef.current = WAVE_CLEAR_DELAY_MS
          }
        }

        // Track new loot drops — gems fly immediately, gold is batched
        const freshCollected = state.lootDrops.filter(l => l.collected && !emittedLootRef.current.has(l.id))
        freshCollected.forEach(l => emittedLootRef.current.add(l.id))
        if (freshCollected.length > 0) {
          const canvasEl = canvasRef.current
          const canvasRect = canvasEl?.getBoundingClientRect()
          const hudEl = goldHudRef.current
          const hudRect = hudEl?.getBoundingClientRect()
          if (canvasRect && hudRect) {
            const gemDrops = freshCollected.filter(l => l.type === 'gem')
            if (gemDrops.length > 0) {
              const gemEmits: FloatEmit[] = gemDrops.map(l => ({
                id: `fc_${floatIdRef.current++}`,
                type: 'gem' as const,
                startX: (l.x / CANVAS_W) * canvasRect.width + canvasRect.left,
                startY: (l.y / CANVAS_H) * canvasRect.height + canvasRect.top,
                endX: hudRect.left + hudRect.width / 2,
                endY: hudRect.top + hudRect.height / 2,
              }))
              setFloatEmissions(prev => [...prev, ...gemEmits])
            }
          }
        }
        // Flush batched gold every 2.5s — emit one combined animation showing total earned
        if (state.elapsedMs - lastGoldFlushRef.current >= 2500) {
          const goldDelta = state.goldCollected - lastFlushedGoldRef.current
          if (goldDelta > 0) {
            const hudEl = goldHudRef.current
            const hudRect = hudEl?.getBoundingClientRect()
            const canvasEl = canvasRef.current
            const canvasRect = canvasEl?.getBoundingClientRect()
            if (hudRect && canvasRect) {
              setFloatEmissions(prev => [...prev, {
                id: `fc_${floatIdRef.current++}`,
                type: 'gold' as const,
                startX: canvasRect.left + canvasRect.width / 2,
                startY: canvasRect.top + canvasRect.height * 0.55,
                endX: hudRect.left + hudRect.width / 2,
                endY: hudRect.top + hudRect.height / 2,
                amount: goldDelta,
              }])
              lastFlushedGoldRef.current = state.goldCollected
            }
          }
          lastGoldFlushRef.current = state.elapsedMs
        }

        // Update HUD stats periodically (not every frame for perf)
        if (Math.round(timeMsRef.current / 200) !== Math.round((timeMsRef.current - dt) / 200)) {
          setStats({ kills: state.killCount, gold: state.goldCollected, elapsedMs: state.elapsedMs })
          // Boss HP snap for React HUD
          if (state.boss) {
            setBossSnap({ ...state.boss })
            if (state.bossPhase === 2 && bossPhase !== 2) setBossPhase(2)
          } else setBossSnap(null)
        }
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const timeLeft = Math.max(0, Math.ceil((RIFT_DURATION_MS - stats.elapsedMs) / 1000))

  return (
    <div className={styles.screen}>
      {/* Canvas arena */}
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className={styles.arena}
      />

      {/* Floating currency particles */}
      <FloatingCurrency emissions={floatEmissions} onDone={handleFloatDone} />

      {/* First-rift contextual hint */}
      {combatHint && (
        <CombatHint
          key={combatHint.msg}
          message={combatHint.msg}
          icon={combatHint.icon}
          durationMs={4500}
          onDone={() => setCombatHint(null)}
        />
      )}

      {/* HUD overlay */}
      <div className={styles.hud}>
        <div className={styles.hudLeft}>
          <span className={styles.hudStat}>⚔️ {stats.kills}</span>
          <span ref={goldHudRef} className={styles.hudStat}>💰 {stats.gold}</span>
        </div>
        <div className={styles.hudCenter}>
          <div className={styles.hudTimer} data-urgent={timeLeft <= 15 ? 'true' : undefined}>
            {timeLeft}s
          </div>
          {selectedRiftTier > 1 && (
            <span className={styles.hudTier} data-tier={selectedRiftTier}>
              RIFT {['','I','II','III','IV','V'][selectedRiftTier]}
            </span>
          )}
        </div>
        <div className={styles.hudRight}>
          <button className={styles.exitBtn} onClick={() => onExit()}>✕</button>
        </div>
      </div>

      {/* Boss HP bar — shown when boss is alive */}
      {bossSnap && bossSnap.alive && (
        <div className={styles.bossBarWrap}>
          <BossHpBar boss={bossSnap} phase={bossPhase} maxPhases={2} />
        </div>
      )}

      {/* Hero HP bars */}
      {stateRef.current && (
        <div className={styles.heroHpRow}>
          {stateRef.current.heroes.map(h => (
            <div key={h.id} className={styles.heroHpEntry}>
              <div className={styles.heroHpName}>{h.displayName.split(' ')[0]}</div>
              <div className={styles.heroHpTrack}>
                <div
                  className={styles.heroHpFill}
                  style={{ width: `${Math.max(0, (h.hp / h.maxHp) * 100).toFixed(1)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Revive prompt — intercepts hero wipe before post-run */}
      {showRevivePrompt && (
        <div className={styles.reviveOverlay}>
          <div className={styles.revivePanel}>
            <div className={styles.reviveTitle}>⚠️ SQUAD FALLEN</div>
            <div className={styles.reviveDesc}>Revive heroes at 50% HP?</div>
            <div className={styles.reviveBtns}>
              <button className={styles.reviveYes} onClick={handleReviveAccept}>
                REVIVE &nbsp;💎{REVIVE_COST}
              </button>
              <button className={styles.reviveNo} onClick={handleReviveDecline}>
                Give Up
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Countdown overlay */}
      {phase === 'countdown' && (
        <div className={styles.countdownOverlay}>
          <div className={styles.countdownNum}>{countdown > 0 ? countdown : 'GO!'}</div>
        </div>
      )}

      {/* Zone name flash */}
      {showZoneName && (
        <div className={styles.zoneNameFlash}>
          {ZONES[zoneIdxRef.current].displayName}
        </div>
      )}

      {/* Boss warning */}
      {bossWarning && !bossEntrance && (
        <div className={styles.bossWarningOverlay}>
          <div className={styles.bossWarningText}>⚠ BOSS INCOMING ⚠</div>
        </div>
      )}

      {/* Wave presentation banner — keyed so a new wave always remounts with fresh timers */}
      {wavePresentation && (
        <WavePresentation
          key={`wave_${wavePresentation.waveIndex}_${wavePresentation.enemyCount}`}
          waveIndex={wavePresentation.waveIndex}
          enemyCount={wavePresentation.enemyCount}
          isBossWave={wavePresentation.isBoss}
          zoneName={ZONES[zoneIdxRef.current]?.displayName}
          onDone={() => setWavePresentation(null)}
        />
      )}

      {/* Between-wave countdown */}
      {nextWaveIn != null && nextWaveIn > 0 && (
        <div className={styles.waveCountdown}>
          NEXT WAVE IN {nextWaveIn}
        </div>
      )}

      {/* Boss entrance sequence */}
      {bossEntrance && (
        <BossEntrance boss={bossEntrance} onDone={() => setBossEntrance(null)} />
      )}

      {/* Boss death cinematic */}
      {showBossDeath && bossDeathSnap?.boss && (
        <BossDeathSequence
          boss={bossDeathSnap.boss}
          killCount={bossDeathSnap.killCount}
          goldEarned={Math.round(bossDeathSnap.goldCollected)}
          onDone={() => setShowBossDeath(false)}
        />
      )}

      {/* Upgrade choice */}
      {phase === 'upgrade_choice' && upgradeChoice && (
        <UpgradeCardChoice choice={upgradeChoice} onPick={handleUpgradePick} />
      )}

      {/* Post-run: loot burst first, then summary */}
      {phase === 'post_run' && postRun && showLootBurst && (
        <LootBurstOverlay
          items={[
            ...postRun.lootItems.map(i => ({
              id: i.id,
              name: i.name,
              rarity: i.rarity,
              type: 'gear' as const,
              assetId: i.id,
            })),
            { id: 'gold_reward', name: `${postRun.goldEarned} Gold`, rarity: 'common' as Rarity, type: 'coin' as const },
          ]}
          gold={postRun.goldEarned}
          xp={postRun.xpEarned}
          onClaim={() => { setShowLootBurst(false) }}
        />
      )}

      {phase === 'post_run' && postRun && !showLootBurst && (
        <RewardSummary
          reward={postRun}
          killCount={stateRef.current?.killCount ?? 0}
          totalDamage={stateRef.current?.totalDamageDealt ?? 0}
          elapsedMs={stateRef.current?.elapsedMs ?? 0}
          onContinue={() => onExit(stats.kills, stateRef.current?.postRun?.wasWipe)}
        />
      )}
    </div>
  )
}
