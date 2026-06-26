# Lootburst Legends — Pass Log

## PASS 0 — Context Ingestion
**Date:** 2026-06-25
**Status:** COMPLETE

### Files Read
- 00_README.md through 26_TASK_CHECKLIST.md (all 26 files in lootburst_codex_prompt_suite/)
- lootburst_codex_prompt_suite_manifest.json

### Files Created
- docs/claude_CONTEXT_SUMMARY.md
- docs/claude_IMPLEMENTATION_PLAN.md
- docs/claude_PASS_LOG.md (this file)
- docs/claude_NEXT_CONTEXT_HANDOFF.md

### Key Findings
- **Greenfield project** — repo root contains only the prompt suite + manifest. No package.json, no src/, no existing code.
- Tech stack not specified in prompts; deduced from type snippets (TypeScript, React components, npm scripts, canvas/WebGL for particles).
- 24_CODEX_CHUNK_PROMPTS.md (not 24_claude_CHUNK_PROMPTS.md as main.txt suggested — naming mismatch, content identical in intent).
- All 26 files successfully ingested.

### Systems Added
None (PASS 0 is docs only).

### Known Issues
- Project needs full scaffold from scratch (Vite + React + TypeScript).
- File 24 named `24_CODEX_CHUNK_PROMPTS.md` vs `24_claude_CHUNK_PROMPTS.md` in main.txt — minor, no impact.

### Remaining Tasks
ALL — PASS 1 through PASS 19 not started.

### Visual QA Notes
N/A — no visual systems yet.

---

## PASS 1 — Project Scaffold + Visual Foundation
**Date:** 2026-06-25
**Status:** COMPLETE

### Files Created
- package.json, tsconfig.json, tsconfig.node.json, vite.config.ts, index.html, .gitignore
- src/vite-env.d.ts (CSS modules + Vite env types)
- src/constants/palette.ts — PALETTE, ELEMENT_COLOURS, RARITY_COLOURS, Rarity type
- src/constants/rarity.ts — RARITY_CONFIG per rarity (beam/shake/hitstop/sound/haptic/particles)
- src/constants/animation.ts — clip FPS/frames/loops, HITSTOP_MS, SCREEN_SHAKE, MOTION
- src/constants/ui.ts — UI scale constants, BOTTOM_NAV_TABS, TabId
- src/types/art.ts — AnimationClipDefinition, ParticleField, RarityRevealOptions, AssetEntry, VisualMetadata
- src/types/entities.ts — HeroDefinition, EnemyDefinition, BossDefinition, GearDefinition, PetDefinition, MountDefinition, ZoneDefinition
- src/styles/globals.css — pixel art rendering, mobile reset, reduced motion, scrollable
- src/styles/tokens.css — CSS custom properties, shared animations (bob, pulse, shimmer, slam-in, bounce-in, rarity-glow-pulse)
- src/data/art/heroes.visual.json — 19 heroes (common→mythic)
- src/data/art/bosses.visual.json — 9 bosses
- src/data/art/enemies.visual.json — 9 enemies
- src/data/art/gear.visual.json — 8 gear items
- src/data/art/pets.visual.json — 8 pets
- src/data/art/zones.visual.json — 5 zones
- src/data/art/rarity.visual.json — all 6 rarities
- src/art/assetManifest.ts — typed asset map from JSON data
- src/art/assetLoader.ts — getAsset/getIcon/getPlaceholder/getRarityFrame/getSpriteClip/getMissingAssets
- src/animation/Animator.ts — play/playOnce/update/getFrameRect/onFrameEvent/setFlipX/setSpeed
- src/animation/motionPrimitives.ts — bob/pulse/wobble/floatUp/bounceOut/squashStretch/orbit/magnetToTarget/rarityShimmer
- src/animation/hitstop.ts — triggerHitstop/updateHitstop/isHitstopActive/hitstop.* presets
- src/animation/screenShake.ts — triggerShake/updateShake/tickShake/setReducedMotion
- src/vfx/ParticleEngine.ts — pooled canvas particle engine, 1000-particle pool
- src/vfx/emitters.ts — all 14 emitter functions
- src/vfx/ParticleCanvas.tsx — React canvas wrapper with RAF loop
- src/vfx/rarityReveal.ts — playRarityReveal() orchestrator
- src/audio/soundEvents.ts — playSound() with all 28 events + rate limiting
- src/audio/haptics.ts — haptic() with navigator.vibrate
- src/ui/layout/AppShell.tsx, BottomNav.tsx + CSS
- src/ui/components/PixelPanel.tsx, PixelButton.tsx, RarityFrame.tsx + CSS
- src/ui/screens/HubScreen.tsx — animated hub with RAF bob/pulse, offline banner, Enter Rift CTA
- src/ui/screens/SquadScreen.tsx — hero grid + detail panel with RarityFrame
- src/ui/screens/CapsuleScreen.tsx — functional capsule machine with pity, pull, visible odds
- src/ui/screens/GearScreen.tsx — gear grid with rarity frames
- src/ui/screens/ProgressScreen.tsx — pet/mount/progress stub
- src/ui/screens/VisualGallery.tsx — dev gallery: rarity reveals, particle tests, hero list, QA controls
- src/main.tsx, src/App.tsx

### Systems Added
- Full TypeScript + Vite + React scaffold
- Candy-dark design system (CSS tokens + globals)
- All visual data: 19 heroes, 9 bosses, 9 enemies, 8 gear, 8 pets, 5 zones
- Asset manifest + loader with graceful missing-asset fallback
- Animation runtime (Animator + motion primitives + hitstop + screen shake)
- Pooled Canvas 2D particle engine + 14 emitters
- Rarity spectacle system (playRarityReveal)
- Sound events (28 events, graceful no-file fallback)
- Haptics (navigator.vibrate)
- Hub screen with idle motion (bob, pulse, CSS drift particles)
- Capsule screen with functional pull, visible pity, visible odds
- VisualGallery dev screen

### Build Result
✓ 69 modules. 188KB JS / 20KB CSS. Clean tsc + vite build.

### Known Issues / Remaining
- Real sprite images not yet present (placeholder generator not yet built — PASS 3)
- Audio files not present (graceful fallback active)
- Rift run screen not built (PASS 9)
- animations.visual.json, mounts.visual.json, vfx.visual.json not yet created
- Script stubs (generate-placeholder-pixel-art.ts etc) not yet built

---

---

## PASS 2 — Pixel Placeholder Art Generator
**Date:** 2026-06-25
**Status:** COMPLETE

### Files Created
- src/art/generated/generateSprite.ts — template-based 16×16 pixel sprite generator
  - generateHeroSprite / generateEnemySprite / generateBossSprite / generateGearIcon / generatePetSprite / generateCapsuleSprite / generateChestSprite
  - Seeded LCG RNG (deterministic per asset ID)
  - Boss draw functions keyed by tags: slime/dragon/chest/hydra/pumpkin/vault/cherub/vehicle/generic
- src/art/generated/generatedAssetRegistry.ts — Map cache, preGenerateAll(), clearGeneratedCache()
- src/art/generated/index.ts — barrel exports
- src/art/assetLoader.ts — updated: added getGeneratedSprite fallback to getAsset()

### Files Updated
- src/ui/screens/VisualGallery.tsx — added 'art' section showing all generated sprites grouped by type
- src/ui/screens/VisualGallery.module.css — artGroup/artGrid/artEntry/artSprite CSS

### Build Result
✓ Clean tsc + vite build.

---

## PASS 3 — Placeholder Art Generator
**Status:** MERGED INTO PASS 2

---

## PASS 4 — Animation Runtime
**Status:** BUILT IN PASS 1 (Animator.ts, motionPrimitives.ts, hitstop.ts, screenShake.ts)

---

## PASS 5 — VFX Particle Engine
**Status:** BUILT IN PASS 1 (ParticleEngine.ts, emitters.ts, ParticleCanvas.tsx)

---

## PASS 6 — Rarity Spectacle
**Status:** BUILT IN PASS 1 (rarityReveal.ts, RARITY_CONFIG with beam/shake/hitstop/sound/haptic)

---

## PASS 7 — 90s Rift Run Core Loop
**Date:** 2026-06-25
**Status:** COMPLETE

### Files Created
- src/game/rift/riftTypes.ts — RiftPhase, CombatEntity, DamageNumber, LootDrop, UpgradeCard, RiftRunState, TimelineEvent types
- src/game/rift/upgradeCards.ts — 10 upgrade cards, rollUpgradeCards()
- src/game/rift/waveDirector.ts — RIFT_DURATION_MS=90000, 12-event TIMELINE, getEnemyPoolForWave, cloneTimeline
- src/game/rift/riftRunState.ts — createInitialRiftState, spawnWave, spawnBoss, tickCombat, buildPostRunReward, triggerUpgradeChoice, applyUpgradeCard
- src/game/rift/combatLoop.ts — renderRiftFrame, setActiveZone, entity draw with bob/flash/glow, damage numbers, loot drops, progress bar, zone-driven background
- src/game/rift/zoneBackgrounds.ts — 5 ZoneDef objects (candyCavern/goblinMines/voidArcade/moonVault/starforgeNursery), 3 parallax layers each
- src/ui/screens/RiftRunScreen.tsx — RAF combat loop, timeline event firing, phase state machine, countdown/boss warning/boss entrance/upgrade choice/loot burst/post run
- src/ui/screens/RiftRunScreen.module.css — all HUD/overlay styles + keyframes (bounce-in/pulse-scale/slam-in/fade-in-out)
- src/ui/components/UpgradeCardChoice.tsx + .module.css — 3-card stagger bounce-in overlay
- src/ui/components/SpriteCharacter.tsx + .module.css — unified sprite with bob/flip/flash/dead/glow/rainbow
- src/ui/components/BossHpBar.tsx + .module.css — phase dots, crack marks, HP fill
- src/ui/components/BossEntrance.tsx + .module.css — 5-step dim→glyph→name→tags→done sequence
- src/ui/components/LootBurstOverlay.tsx + .module.css — chest_land→chest_shake→chest_burst→items_cascade→summary phases
- src/ui/components/FloatingCurrency.tsx + .module.css — coin/gem arc particles fly toward HUD gold counter

### Files Updated
- src/App.tsx — added RiftRunScreen, inRift state, renderMain() dispatch, hides BottomNav during rift
- src/ui/screens/HubScreen.tsx — onEnterRift prop, Enter Rift CTA wired up; offline banner replaced by LootBurstOverlay

### Zone Wiring
- zoneIdxRef seeded random per run, passed to renderRiftFrame each frame
- Zone name flashes 2.5s at combat start (fade-in-out animation)
- Reduced motion: static zone layers, no entity bob, FloatingCurrency skips to done

### Build Result
✓ 99 modules. 255KB JS / 41KB CSS. Clean tsc + vite build.

---

## PASS 8 — Boss Presentation
**Status:** COMPLETE (merged into PASS 7 — BossEntrance.tsx, BossHpBar.tsx)

---

## PASS 9 — Loot Burst
**Status:** COMPLETE (merged into PASS 7 — LootBurstOverlay.tsx)

---

## PASS 10 — Hero Collection + Squad
**Date:** 2026-06-25
**Status:** COMPLETE

### Files Updated
- src/ui/screens/SquadScreen.tsx — squad slots (3), synergy badges, selected hero detail with gear slots, hero grid with RarityFrame
- src/ui/screens/SquadScreen.module.css

---

## PASS 11 — Gear / Pets
**Date:** 2026-06-25
**Status:** COMPLETE

### Files Updated
- src/ui/screens/GearScreen.tsx — slot filter tabs, generated gear sprites, 3-column grid
- src/ui/screens/ProgressScreen.tsx — Pets/Stats/Cosmetics tabs with SpriteCharacter grid

---

## PASS 12 — Sound + Haptics
**Status:** BUILT IN PASS 1 (soundEvents.ts 28 events, haptics.ts)

---

## PASS 13 — Menu Idle Motion
**Status:** BUILT IN PASS 1 (HubScreen bob/pulse animations, bgParticles CSS drift)

---

## PASS 14 — Zone Backgrounds + Parallax
**Status:** COMPLETE (zoneBackgrounds.ts in PASS 7)

---

## PASS 15 — Offline Rewards
**Date:** 2026-06-25
**Status:** COMPLETE

### Change
- HubScreen offline banner replaced with LootBurstOverlay ceremony (chest_land → burst → items_cascade → claim)

---

## PASS 16 — Monetisation Scaffolding
**Date:** 2026-06-25
**Status:** COMPLETE

### Checks
- Odds sum: 58 + 27 + 10 + 4 + 0.9 + 0.1 = 100.0% ✓
- Odds visible: `<details>` expand (all rarities + percentages) ✓
- Pity UI: counter "{pity}/{PITY_MAX}", countdown "guaranteed in N pulls" ✓
- Pity ENFORCED: `nextPity >= PITY_MAX → force 'legendary'` (was UI-only, now hard-enforced) ✓
- Misleading banner removed: "Featured: Legendary rate ×2" → "Pity guarantee: legendary by pull 80" ✓
- Duplicates convert to Shards noted in odds note ✓
- No auto-play, no fake countdown timers ✓

---

## PASS 17 — Visual Gallery + QA
**Status:** COMPLETE (merged into PASS 2 — VisualGallery art section with all generated sprites)

---

## PASS 18 — Performance + Accessibility
**Date:** 2026-06-25
**Status:** COMPLETE

### Changes
- src/hooks/useReducedMotion.ts — React hook for prefers-reduced-motion
- src/hooks/reducedMotion.ts — getReducedMotion() singleton for canvas loops
- combatLoop.ts — entity bob skipped on reduced motion, scrolling zone layers skipped, timeMs=0 on static layers
- FloatingCurrency.tsx — skips to done immediately on reduced motion
- globals.css — prefers-reduced-motion: all animation/transition forced to 0.01ms (already present in PASS 1)
- CapsuleScreen.tsx font sizes: 11px → 12px for pityGuarantee + oddsNote
- ProgressScreen.css: petRarity 7px → 9px

---

## PASS 19 — Final Polish
**Status:** IN PROGRESS — remaining: commit, real audio files (graceful fallback active)
