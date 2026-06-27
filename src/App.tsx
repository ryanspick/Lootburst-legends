import { useState, useEffect } from 'react'
import type { TabId } from '@/constants/ui'
import AppShell from '@/ui/layout/AppShell'
import BottomNav from '@/ui/layout/BottomNav'
import HubScreen from '@/ui/screens/HubScreen'
import SquadScreen from '@/ui/screens/SquadScreen'
import CapsuleScreen from '@/ui/screens/CapsuleScreen'
import GearScreen from '@/ui/screens/GearScreen'
import ProgressScreen from '@/ui/screens/ProgressScreen'
import VisualGallery from '@/ui/screens/VisualGallery'
import RiftRunScreen from '@/ui/screens/RiftRunScreen'
import ShopScreen from '@/ui/screens/ShopScreen'
import ParticleCanvas from '@/vfx/ParticleCanvas'
import TutorialOverlay from '@/ui/components/TutorialOverlay'
import SettingsModal from '@/ui/components/SettingsModal'
import { rollPostRunOffer, type PostRunOffer } from '@/game/progression/dailyRewards'
import { setMuted, setVolume } from '@/audio/soundEvents'
import { setReducedMotionVfx } from '@/vfx/ParticleEngine'
import { useGameStore } from '@/store/gameStore'

export default function App() {
  const [tab, setTab] = useState<TabId>('run')
  const [showGallery, setShowGallery] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [inRift, setInRift] = useState(false)
  const [postRunOffer, setPostRunOffer] = useState<PostRunOffer | null>(null)

  const soundMuted  = useGameStore(s => s.soundMuted)
  const soundVolume = useGameStore(s => s.soundVolume)
  const vfxReduced  = useGameStore(s => s.vfxReduced)

  // Sync persisted settings → audio / vfx systems
  useEffect(() => { setMuted(soundMuted)       }, [soundMuted])
  useEffect(() => { setVolume(soundVolume)     }, [soundVolume])
  useEffect(() => { setReducedMotionVfx(vfxReduced) }, [vfxReduced])

  function handleRiftExit(kills = 0) {
    setInRift(false)
    const offer = rollPostRunOffer(kills)
    if (offer) setPostRunOffer(offer)
  }

  function renderMain() {
    if (showGallery) return <VisualGallery onClose={() => setShowGallery(false)} />
    if (inRift) return <RiftRunScreen onExit={handleRiftExit} />
    switch (tab) {
      case 'run':      return (
        <HubScreen
          onEnterRift={() => setInRift(true)}
          onOpenShop={() => setTab('shop')}
          postRunOffer={postRunOffer}
          onDismissOffer={() => setPostRunOffer(null)}
        />
      )
      case 'squad':    return <SquadScreen />
      case 'capsule':  return <CapsuleScreen />
      case 'shop':     return <ShopScreen onClose={() => setTab('run')} />
      case 'gear':     return <GearScreen />
      case 'progress': return <ProgressScreen />
    }
  }

  return (
    <AppShell>
      <ParticleCanvas />
      {renderMain()}
      {!inRift && !showGallery && (
        <BottomNav active={tab} onChange={setTab} onGallery={() => setShowGallery(v => !v)} />
      )}
      {!inRift && !showGallery && <TutorialOverlay currentTab={tab} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {/* Settings gear button — fixed top-right, hidden during rift */}
      {!inRift && (
        <button
          onClick={() => setShowSettings(v => !v)}
          style={{
            position: 'fixed',
            top: 10,
            right: 12,
            zIndex: 95,
            background: 'none',
            border: 'none',
            fontSize: 20,
            cursor: 'pointer',
            padding: '6px',
            lineHeight: 1,
            opacity: 0.6,
            minWidth: 36,
            minHeight: 36,
          }}
          aria-label="Settings"
        >
          ⚙️
        </button>
      )}
    </AppShell>
  )
}
