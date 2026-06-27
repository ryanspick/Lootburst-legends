import { useEffect, useState } from 'react'
import type { TabId } from '@/constants/ui'
import { useGameStore } from '@/store/gameStore'
import { playSound } from '@/audio/soundEvents'
import styles from './TutorialOverlay.module.css'

// Must match BOTTOM_NAV_TABS order in constants/ui.ts
const NAV_TAB_INDEX: Partial<Record<TabId, number>> = {
  run: 0, squad: 1, capsule: 2, shop: 3, gear: 4, progress: 5,
}

interface TutStep {
  emoji: string
  title: string
  body: string
  cta?: string
  navTarget?: TabId
}

const STEPS: TutStep[] = [
  {
    emoji: '⚔️',
    title: 'Welcome to Lootburst Legends!',
    body: 'Pull heroes, build your squad, and battle through the Rift for epic loot and glory!',
    cta: 'GET STARTED',
  },
  {
    emoji: '🔮',
    title: 'Pull New Heroes',
    body: 'Tap CAPSULE below to visit the hero machine and summon your first heroes!',
    navTarget: 'capsule',
  },
  {
    emoji: '👥',
    title: 'Meet Your Squad',
    body: 'Tap SQUAD to set your hero lineup and discover powerful synergy bonuses!',
    navTarget: 'squad',
  },
  {
    emoji: '🛡️',
    title: 'Gear Up',
    body: 'Tap GEAR to equip weapons, trinkets, and relics — each gives unique stat bonuses!',
    navTarget: 'gear',
  },
  {
    emoji: '⚔️',
    title: 'Enter the Rift!',
    body: 'Head back to RUN and press ENTER RIFT to start your first battle. Fight!',
    navTarget: 'run',
  },
  {
    emoji: '🏆',
    title: "You're All Set!",
    body: 'Survive waves of monsters, grab upgrade cards mid-run, defeat bosses, and collect loot. Good luck!',
    cta: "LET'S BURST! ⚔️",
  },
]

interface Props {
  currentTab: TabId
}

export default function TutorialOverlay({ currentTab }: Props) {
  const tutorialStep        = useGameStore(s => s.tutorialStep)
  const advanceTutorialStep = useGameStore(s => s.advanceTutorialStep)
  const completeTutorial    = useGameStore(s => s.completeTutorial)

  // Wait for user to navigate away from the current tab before auto-advancing
  const [awaitingNav, setAwaitingNav] = useState(false)

  const step = (tutorialStep >= 0 && tutorialStep < STEPS.length)
    ? STEPS[tutorialStep]
    : undefined

  // When step changes, decide if we need to wait for a nav change
  useEffect(() => {
    if (!step?.navTarget) { setAwaitingNav(false); return }
    setAwaitingNav(currentTab !== step.navTarget)
  }, [tutorialStep]) // intentionally only reruns on step change

  // Auto-advance when user navigates to the target tab
  useEffect(() => {
    if (!step?.navTarget || !awaitingNav) return
    if (currentTab === step.navTarget) {
      setAwaitingNav(false)
      playSound('ui_tab_slide')
      advanceTutorialStep()
    }
  }, [currentTab, awaitingNav])

  if (!step || tutorialStep < 0) return null

  function handleCta() {
    playSound('ui_button_pop')
    if (tutorialStep >= STEPS.length - 1) completeTutorial()
    else advanceTutorialStep()
  }

  function handleSkip() {
    playSound('ui_button_pop')
    completeTutorial()
  }

  const tabIdx     = step.navTarget !== undefined ? NAV_TAB_INDEX[step.navTarget] : undefined
  const isFullCard = step.cta !== undefined  // welcome + done steps = centred modal

  return (
    <div className={`${styles.overlay} ${isFullCard ? styles.overlayFull : ''}`}>
      {/* Pulsing gold ring over target nav tab */}
      {tabIdx !== undefined && (
        <div
          className={styles.tabHighlight}
          style={{ left: `calc(${tabIdx * 2 + 1} / 12 * 100% - 22px)` }}
        />
      )}

      {/* Bouncing arrow above the nav pointing down */}
      {tabIdx !== undefined && (
        <div
          className={styles.navArrow}
          style={{ left: `calc(${tabIdx * 2 + 1} / 12 * 100% - 8px)` }}
        />
      )}

      {/* Tutorial card */}
      <div className={`${styles.card} ${isFullCard ? styles.cardFull : ''}`}>
        <button className={styles.skipBtn} onClick={handleSkip}>SKIP</button>

        <div className={styles.cardEmoji}>{step.emoji}</div>
        <div className={styles.cardTitle}>{step.title}</div>
        <div className={styles.cardBody}>{step.body}</div>

        {/* Progress dots */}
        <div className={styles.dots}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={[
                styles.dot,
                i === tutorialStep ? styles.dotActive  : '',
                i <  tutorialStep ? styles.dotDone    : '',
              ].filter(Boolean).join(' ')}
            />
          ))}
        </div>

        {step.cta ? (
          <button className={styles.ctaBtn} onClick={handleCta}>
            {step.cta}
          </button>
        ) : (
          <div className={styles.navHint}>
            Tap <strong>{step.navTarget?.toUpperCase()}</strong> in the nav below ↓
          </div>
        )}

        {step.navTarget && (
          <button className={styles.nextBtn} onClick={advanceTutorialStep}>
            skip step →
          </button>
        )}
      </div>
    </div>
  )
}
