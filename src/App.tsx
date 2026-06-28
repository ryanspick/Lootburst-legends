import { useState, useEffect, useCallback } from 'react'
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
import AchievementToast from '@/ui/components/AchievementToast'
import { rollPostRunOffer, type PostRunOffer } from '@/game/progression/dailyRewards'
import { setMuted, setVolume } from '@/audio/soundEvents'
import { playTrack, stopMusic, setMusicMuted } from '@/audio/musicEngine'
import { requestNotificationPermission, restoreNotificationSchedule } from '@/notifications/pushNotifications'
import { setReducedMotionVfx } from '@/vfx/ParticleEngine'
import { useGameStore } from '@/store/gameStore'
import { handleIAPRedirect } from '@/services/iapService'

export default function App() {
  const [tab, setTab] = useState<TabId>('run')
  const [showGallery, setShowGallery] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [inRift, setInRift] = useState(false)
  const [postRunOffer, setPostRunOffer] = useState<PostRunOffer | null>(null)
  const [pendingAchievements, setPendingAchievements] = useState<string[]>([])
  const [iapToast, setIapToast] = useState<string | null>(null)

  const soundMuted        = useGameStore(s => s.soundMuted)
  const soundVolume       = useGameStore(s => s.soundVolume)
  const musicMuted        = useGameStore(s => s.musicMuted)
  const vfxReduced        = useGameStore(s => s.vfxReduced)
  const checkAchievements = useGameStore(s => s.checkAchievements)
  const ownedHeroCount    = useGameStore(s => s.ownedHeroes.length)
  const ownedGearCount    = useGameStore(s => s.ownedGear.length)
  const squadFull         = useGameStore(s => s.squadHeroIds.filter(Boolean).length >= 3)
  const highestPower      = useGameStore(s => s.highestPower)
  const totalRifts        = useGameStore(s => s.totalRifts)
  const addGems           = useGameStore(s => s.addGems)
  const addGold           = useGameStore(s => s.addGold)

  // Sync persisted settings → audio / vfx systems
  useEffect(() => { setMuted(soundMuted)            }, [soundMuted])
  useEffect(() => { setVolume(soundVolume)          }, [soundVolume])
  useEffect(() => { setMusicMuted(musicMuted)       }, [musicMuted])
  useEffect(() => { setReducedMotionVfx(vfxReduced) }, [vfxReduced])

  // Start hub music (deferred — AudioContext requires user gesture in most browsers)
  useEffect(() => { playTrack('hub') }, [])

  // Request notification permission after a short delay (not on first frame)
  useEffect(() => {
    const t = setTimeout(() => {
      requestNotificationPermission().then(granted => {
        if (granted) restoreNotificationSchedule()
      })
    }, 8000)  // wait 8s — don't interrupt first-time experience
    return () => clearTimeout(t)
  }, [])

  const triggerAchievementCheck = useCallback(() => {
    const newIds = checkAchievements()
    if (newIds.length > 0) setPendingAchievements(prev => [...prev, ...newIds])
  }, [checkAchievements])

  // Check on mount to seed already-earned achievements silently (no toast for pre-existing)
  useEffect(() => { checkAchievements() }, [])

  // Re-check when collection / squad / power state changes
  useEffect(() => { triggerAchievementCheck() }, [ownedHeroCount, ownedGearCount, squadFull, highestPower])

  // Handle Stripe redirect-back after IAP checkout
  useEffect(() => {
    handleIAPRedirect().then(result => {
      if (!result?.ok) return
      if (result.gems) addGems(result.gems)
      if (result.gold) addGold(result.gold)
      const parts: string[] = []
      if (result.gems) parts.push(`+${result.gems} 💎`)
      if (result.gold) parts.push(`+${result.gold} 💰`)
      setIapToast(`Purchase complete! ${parts.join(' · ')}`)
      setTimeout(() => setIapToast(null), 5000)
    })
  }, [])

  function handleRiftExit(kills = 0, wasWipe = false) {
    setInRift(false)
    playTrack(wasWipe ? 'wipe' : 'victory')
    // Return to hub music after sting finishes
    const stingMs = wasWipe ? 3500 : 4500
    setTimeout(() => playTrack('hub'), stingMs)
    const offer = rollPostRunOffer(kills, { heroesDied: wasWipe, riftsBeat: totalRifts })
    if (offer) setPostRunOffer(offer)
    triggerAchievementCheck()
  }

  function renderMain() {
    if (showGallery) return <VisualGallery onClose={() => setShowGallery(false)} />
    if (inRift) return <RiftRunScreen onExit={handleRiftExit} />
    switch (tab) {
      case 'run':      return (
        <HubScreen
          onEnterRift={() => { setInRift(true); playTrack('rift') }}
          onOpenShop={() => setTab('shop')}
          postRunOffer={postRunOffer}
          onDismissOffer={() => setPostRunOffer(null)}
        />
      )
      case 'squad':    return <SquadScreen />
      case 'capsule':  return <CapsuleScreen onPull={triggerAchievementCheck} />
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
      <AchievementToast
        newIds={pendingAchievements}
        onConsumed={() => setPendingAchievements([])}
      />

      {/* IAP purchase success toast */}
      {iapToast && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          background: '#001a0a', border: '1px solid #44ff8888', borderRadius: 12,
          padding: '10px 20px', color: '#44ff88', fontFamily: 'monospace',
          fontSize: 13, fontWeight: 700, zIndex: 200, whiteSpace: 'nowrap',
          boxShadow: '0 0 20px #44ff8833',
        }}>
          {iapToast}
        </div>
      )}

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
