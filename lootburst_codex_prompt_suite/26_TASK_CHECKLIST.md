# Task Checklist

## Foundation
- [x] Palette tokens (`src/constants/palette.ts`)
- [x] Rarity visual config (`src/constants/rarity.ts`)
- [x] Art direction constants (`src/constants/animation.ts`, `ui.ts`)
- [x] Asset manifest (`src/art/assetManifest.ts`)
- [x] Metadata JSON — heroes, enemies, bosses, gear, pets, zones, mounts, animations, vfx
- [x] Asset prompt registry (`src/art/generated/generatedAssetRegistry.ts`)
- [x] Placeholder generator (`src/art/generated/` canvas-based)
- [x] Visual validator (`scripts/validate-visuals.ts` → `npm run validate:visuals`)

## Animation/VFX
- [x] Sprite-sheet animator (`src/animation/Animator.ts`)
- [x] Animation registry (`src/animation/AnimationRegistry.ts`)
- [x] Motion primitives (`src/animation/motionPrimitives.ts`)
- [x] Idle motion system (`src/animation/idleMotion.ts`) — wired into HubScreen, CapsuleScreen
- [x] Hitstop (`src/animation/hitstop.ts`)
- [x] Screen shake (`src/animation/screenShake.ts`) — respects reducedMotion
- [x] Particle engine (`src/vfx/ParticleEngine.ts`)
- [x] VFX types (`src/vfx/vfxTypes.ts`)
- [x] Combat emitters (`src/vfx/emitters.ts`)
- [x] Loot emitters (in `emitters.ts`)
- [x] Rarity emitters (in `emitters.ts`)
- [x] Capsule emitters (in `emitters.ts`)

## Core screens
- [x] Animated hub (`src/ui/screens/HubScreen.tsx`) — idleMotion, SparkleLayer, ZoneBackground, PetCompanion
- [x] 90-second rift run (`src/ui/screens/RiftRunScreen.tsx`) — reducedMotion wired
- [x] Upgrade card draft (`src/ui/components/UpgradeCardChoice.tsx`)
- [x] Boss entrance/death (`src/ui/components/BossEntrance.tsx`)
- [x] Loot burst (`src/ui/components/LootBurstOverlay.tsx`)
- [x] Reward summary (inline in `RiftRunScreen.tsx`)
- [x] Capsule machine (`src/ui/screens/CapsuleScreen.tsx`) — SparkleLayer, dupe detection
- [x] Hero collection + Squad UI (`src/ui/screens/SquadScreen.tsx`) — StarMeter, StarUpSequence
- [x] Gear screen (`src/ui/screens/GearScreen.tsx`)
- [x] Pets/progress (`src/ui/screens/ProgressScreen.tsx`) — Mounts tab added
- [x] Offline rewards (`src/ui/screens/OfflineReturnSequence.tsx` + `offlineRewardController.ts`)

## UI Components
- [x] PixelPanel, PixelButton, RarityFrame, SpriteCharacter
- [x] BossHpBar, BossEntrance, UpgradeCardChoice, LootBurstOverlay
- [x] FloatingCurrency, AnimatedIcon, SparkleLayer, ZoneBackground
- [x] StarMeter, PetCompanion, MountCard
- [x] DuplicateShardConversion, StarUpSequence

## QA
- [x] VisualGallery (`src/ui/screens/VisualGallery.tsx`)
- [x] Missing asset report (in VisualGallery + validate-visuals.ts)
- [x] Particle stress test (in VisualGallery)
- [x] 360px mobile layout audit
- [x] Reduced motion — hook + wired into HubScreen (disables sparkle/idleMotion) + RiftRunScreen (disables shake)
- [x] Low VFX mode toggle (in VisualGallery)
- [x] Safe monetisation copy/odds/pity visible (CapsuleScreen)
