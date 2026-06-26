# Lootburst Legends — Implementation Plan

## Tech Stack Decision
**Greenfield project** — no existing code found in repo root.
- **Framework:** React 18 + TypeScript + Vite
- **Styling:** CSS Modules + global design tokens (no Tailwind — pixel art UI needs custom everything)
- **Particle engine:** Canvas 2D (pooled, no React state per particle)
- **Animation:** CSS keyframes for UI, requestAnimationFrame loop for combat/VFX
- **State:** Zustand (lightweight, no Redux overhead for idle game)
- **Build:** Vite + PWA plugin for mobile installability
- **Scripts:** ts-node or tsx for placeholder generator + validator

## Pass-by-Pass Build Plan

### PASS 0 — Context Ingestion ✅ COMPLETE
Read all 26 prompt files. Create 4 claude docs.
**Status:** Done.

---

### PASS 1 — Project Scaffold + Visual Foundation
**Goal:** Runnable React app with candy-dark design system.
**Files to create:**
```
package.json
vite.config.ts
tsconfig.json
index.html
src/main.tsx
src/App.tsx
src/constants/palette.ts          — PALETTE, RARITY_COLOURS, ELEMENT_COLOURS
src/constants/rarity.ts           — RarityConfig with beam/shake/hitstop/sound/haptic/particles
src/constants/animation.ts        — clip fps, hitstop durations, shake presets
src/constants/ui.ts               — touch targets, font sizes, z-index layers
src/types/art.ts                  — AnimationClipDefinition, ParticleField, RarityRevealOptions
src/types/entities.ts             — HeroDefinition, EnemyDefinition, BossDefinition, GearDefinition
src/styles/globals.css            — CSS reset, pixel-art rendering, dark body bg
src/styles/tokens.css             — CSS custom properties from palette
docs/visual-bible.md              — condensed from 02_ART_DIRECTION_VISUAL_BIBLE.md
```
**Priority:** Highest — everything depends on constants + types.

---

### PASS 2 — Asset Pipeline + Data
**Goal:** All metadata JSON files, asset manifest, loader, fallback.
**Files:**
```
src/data/art/heroes.visual.json
src/data/art/enemies.visual.json
src/data/art/bosses.visual.json
src/data/art/gear.visual.json
src/data/art/pets.visual.json
src/data/art/mounts.visual.json
src/data/art/zones.visual.json
src/data/art/vfx.visual.json
src/data/art/animations.visual.json
src/data/art/rarity.visual.json
src/art/assetManifest.ts          — typed manifest registry
src/art/assetLoader.ts            — getAsset/getSpriteClip/getIcon/getRarityFrame/getPlaceholder
src/art/generatedAssetPrompts.ts  — prompt registry for AI art generation
src/data/art/generatedAssetPrompts.json
scripts/validate-visuals.ts
public/assets/pixel/...           — folder structure (empty, with .gitkeep)
```
**Also:** `npm run validate:visuals`, `npm run export:asset-prompts`

---

### PASS 3 — Placeholder Art Generator
**Goal:** `npm run art:placeholders` generates stylish canvas-rendered PNG placeholders.
**Files:**
```
scripts/generate-placeholder-pixel-art.ts
public/assets/pixel/generated-placeholders/...
```
**Rules:**
- Seed = hash(assetId) → deterministic
- Heroes: 64×64, role prop, rarity accent, element glow, thick outline
- Enemies: 48×48 silhouettes
- Bosses: 128×128 / 192×192 with crown/core/weakpoints
- Gear: 48×48, exaggerated shape, rarity frame
- VFX sprites: coin, spark, star, slash, bubble, beam segment
- Zero grey boxes — every output has candy-dark style

---

### PASS 4 — Animation Runtime
**Files:**
```
src/animation/Animator.ts         — play/playOnce/update/getFrameRect/onFrameEvent/setFlipX/setSpeed
src/animation/AnimationRegistry.ts
src/animation/motionPrimitives.ts — bob/pulse/wobble/shake/floatUp/bounceOut/squashStretch/orbit/magnetToTarget/rarityShimmer
src/animation/hitstop.ts          — normal 25ms / crit 65ms / boss 200ms / legendary 350ms / mythic 700ms
src/animation/screenShake.ts      — presets: smallHit/crit/heavySkill/bossAttack/bossDeath/legendary/mythic + reducedMotion clamp
```
**Reusable systems — no per-hero hardcoding.**

---

### PASS 5 — VFX Particle Engine
**Files:**
```
src/vfx/ParticleEngine.ts         — pooled particle loop, canvas 2D render
src/vfx/emitters.ts               — all emitter functions
src/vfx/ParticleCanvas.tsx        — React wrapper (single canvas component)
src/vfx/vfxTypes.ts
```
**Caps:** normal 350 / boss 500 / legendary 600 / mythic 700 temp / low 120.
**No React state per particle.**

---

### PASS 6 — Rarity Spectacle System
**Files:**
```
src/vfx/rarityReveal.ts           — playRarityReveal() orchestrator
src/ui/components/RarityFrame.tsx
src/ui/components/RewardReveal.tsx
src/ui/components/RarityBeam.tsx
src/ui/components/RarityTextSlam.tsx
```
**Modes:** inline loot / reward card / capsule reveal / boss chest / full-screen mythic.

---

### PASS 7 — Core UI Kit + Mobile Shell
**Files:**
```
src/ui/components/PixelPanel.tsx
src/ui/components/PixelButton.tsx
src/ui/components/AnimatedIcon.tsx
src/ui/components/SpriteCharacter.tsx
src/ui/components/SparkleLayer.tsx
src/ui/components/FloatingCurrency.tsx
src/ui/layout/BottomNav.tsx       — Run | Squad | Capsule | Gear | Progress
src/ui/layout/AppShell.tsx
src/ui/screens/HubScreen.tsx      — animated hub with idle motion
```

---

### PASS 8 — Capsule Machine
**Files:**
```
src/game/capsule/CapsuleMachine.tsx
src/game/capsule/CapsulePullButton.tsx
src/game/capsule/CapsuleRevealGrid.tsx
src/game/capsule/PityMeter.tsx
src/game/capsule/OddsPanel.tsx
src/game/capsule/DuplicateShardConversion.tsx
src/game/capsule/StarUpSequence.tsx
src/game/capsule/capsuleController.ts — sequence orchestration
```

---

### PASS 9 — Rift Run + Boss + Loot Burst
**Files:**
```
src/game/rift/RiftRunScreen.tsx
src/game/rift/WavePresentation.tsx
src/game/rift/UpgradeCardChoice.tsx
src/game/rift/BossEntrance.tsx
src/game/rift/BossHPBar.tsx
src/game/rift/BossDeathSequence.tsx
src/game/rift/LootBurstOverlay.tsx
src/game/rift/RewardSummary.tsx
src/game/rift/riftController.ts   — 90s timeline
```

---

### PASS 10 — Hero Collection + Squad Screen
**Files:**
```
src/ui/screens/SquadScreen.tsx
src/ui/components/HeroCard.tsx
src/ui/components/HeroDetailPanel.tsx
src/ui/components/SquadSlot.tsx
src/ui/components/SynergyBadge.tsx
src/ui/components/StarMeter.tsx
```

---

### PASS 11 — Gear / Pets / Mounts / Cosmetics
**Files:**
```
src/ui/screens/GearScreen.tsx
src/ui/components/GearIcon.tsx
src/ui/components/GearSlot.tsx
src/ui/components/PetCompanion.tsx
src/ui/components/MountCard.tsx
src/ui/screens/ProgressScreen.tsx  — pets/mounts/relics/cosmetics/achievements
```

---

### PASS 12 — Sound + Haptics Layer
**Files:**
```
src/audio/soundEvents.ts          — event manifest + playSound() with rate-limit
src/audio/haptics.ts              — haptic('light'|'medium'|'heavy'|'double')
src/audio/soundManifest.json      — all event names with file paths (graceful missing-file fallback)
```

---

### PASS 13 — Menu Idle Motion System
**Files:**
```
src/animation/idleMotion.ts       — shared bob/pulse/sparkleTimer/glint/drift/shimmer/petWander/parallax
```
Integrate into HubScreen, SquadScreen, GearScreen, CapsuleMachine.

---

### PASS 14 — Zone Backgrounds + Parallax
**Files:**
```
src/ui/components/ZoneBackground.tsx
src/data/art/zones.visual.json    — 5 initial zones with layer specs
public/assets/pixel/backgrounds/  — placeholder layers
```

---

### PASS 15 — Offline Rewards + Hub Polish
**Files:**
```
src/game/offline/offlineRewardController.ts
src/ui/screens/OfflineReturnSequence.tsx
```

---

### PASS 16 — Monetisation Scaffolding
No gameplay gates. Add visible odds/pity UI, optional rewarded-ad hook placeholders, ethical copy checks.

---

### PASS 17 — Visual Gallery + QA Screen
**Files:**
```
src/ui/screens/VisualGallery.tsx  — previews all sprites/VFX/rarity/capsule/boss/reward/UI
```
QA buttons: rarity reveals × 6, particle stress tests, toggle reduced-motion, missing asset report, frame time, particle count.

---

### PASS 18 — Performance + Accessibility Pass
- Particle pooling audit
- Reduced-motion CSS media query integration
- Low-VFX mode toggle
- Flash safety audit (no rapid strobe, short white flashes only)
- 360px layout audit

---

### PASS 19 — Final Polish
Run task checklist. Tighten anything static/generic/dead/unreadable.

## Priority Order
1. PASS 1 (scaffold + constants) — blocks everything
2. PASS 2 (data/manifest) — blocks placeholder gen + rendering
3. PASS 5 (VFX engine) — high production value, early
4. PASS 6 (rarity spectacle) — core identity
5. PASS 7 (UI kit + hub) — first playable screen
6. PASS 8 (capsule) — second most important screen
7. PASS 9 (rift run) — core gameplay loop
8. PASS 4 (animation runtime) — can partially mock in earlier passes
9. PASS 3 (placeholder gen) — nice-to-have early, required before asset import
10. PASS 10–19 in order

## What Should Be Scaffolding Only (Initially)
- Real audio files (sound events exist, files missing — graceful fallback)
- Real AI-generated sprites (placeholders fill gap)
- Full balance/game logic (visual hooks and sample data OK)
- Pet/mount/cosmetic full screens (data schema first)
- Full monetisation backend (UI scaffolding only)

## Visual Systems That Must Be Reusable
- `rarityReveal()` — used in capsule, loot burst, boss chest, inline drop
- `ParticleEngine` — used in combat, rewards, hub idle, capsule
- `screenShake()` / `hitstop()` — used in boss hit, legendary reveal, mythic
- `RarityFrame` — used on hero cards, gear icons, capsule reveal, reward card
- `motionPrimitives` (bob/pulse/etc.) — used everywhere

## Schema-Driven Data
- All heroes, enemies, bosses, gear, pets, mounts, zones via JSON
- Rarity config via `rarity.visual.json` + `src/constants/rarity.ts`
- Animation clips via `animations.visual.json`
- VFX emitter profiles via `vfx.visual.json`
- Sound events via `soundManifest.json`
- Asset prompts via `generatedAssetPrompts.json`

## Procedural vs Manual Animation
**Procedural (engine):** particles, beams, shake, hitstop, bob, pulse, glint, trails, coin spray, explosion puff
**Manual sprite frames:** idle, walk, attack, skill, ultimate, ko, victory (4–6 frames each)
**Rule:** if it can be done with particles + motion primitives, don't bake it into sprite frames
