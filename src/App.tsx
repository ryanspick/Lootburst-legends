import { useState } from 'react'
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

export default function App() {
  const [tab, setTab] = useState<TabId>('run')
  const [showGallery, setShowGallery] = useState(false)
  const [inRift, setInRift] = useState(false)

  function renderMain() {
    if (showGallery) return <VisualGallery onClose={() => setShowGallery(false)} />
    if (inRift) return <RiftRunScreen onExit={() => setInRift(false)} />
    switch (tab) {
      case 'run':      return <HubScreen onEnterRift={() => setInRift(true)} onOpenShop={() => setTab('shop')} />
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
    </AppShell>
  )
}
