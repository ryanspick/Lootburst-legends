# Lootburst Legends — Next Context Handoff

## Current State
All core passes complete. Clean build (✓ 99 modules, 0 TS errors, 255KB JS). Full game loop playable: Hub → Enter Rift → 90s combat → Boss entrance → Upgrade choices → Loot burst → Summary → Return. All screens functional with generated pixel sprites.

## Repo Location
`C:\Users\ryans\Documents\GitHub\lootburst legends\`

## Store Architecture
`src/store/gameStore.ts` — Zustand + persist middleware. Saves to `localStorage` key `lootburst-game-state`.
- Currency: gold, gems, keys, shards
- Heroes: ownedHeroes (id/stars/shards), squadHeroIds[3]
- Gear: ownedGear (instanceId, equipped, equippedHeroId)
- Capsule: pityCount (hard-enforced at 80)
- Stats: totalRifts, totalKills, totalGoldEarned, totalCapsulePulls, highestPower
- addHero() deduplicates → shards on duplicate
- spendGems() / spendGold() return false if insufficient (no spend on fail)

Screens wired: HubScreen, CapsuleScreen, SquadScreen, RiftRunScreen, ProgressScreen.

## What's Complete
- [x] PASS 0 — Context ingestion and docs
- [x] PASS 1 — Full scaffold + animation/VFX/sound/particle systems
- [x] PASS 2 — Pixel placeholder art generator (generateSprite.ts, generatedAssetRegistry.ts)
- [x] PASS 3 — Merged into PASS 2
- [x] PASS 4 — Merged into PASS 1 (Animator.ts, motionPrimitives.ts, hitstop, screenShake)
- [x] PASS 5 — Merged into PASS 1 (ParticleEngine.ts, 14 emitters)
- [x] PASS 6 — Merged into PASS 1 (rarityReveal.ts, RARITY_CONFIG)
- [x] PASS 7 — 90s rift run (riftTypes, upgradeCards, waveDirector, riftRunState, combatLoop, zoneBackgrounds, RiftRunScreen)
- [x] PASS 8 — Boss presentation (BossEntrance, BossHpBar)
- [x] PASS 9 — Loot burst (LootBurstOverlay)
- [x] PASS 10 — Hero collection + Squad screen
- [x] PASS 11 — Gear + Pets screens
- [x] PASS 12 — Merged into PASS 1 (soundEvents.ts, haptics.ts)
- [x] PASS 13 — Merged into PASS 1 (HubScreen bob/pulse/CSS drift)
- [x] PASS 14 — Zone backgrounds + parallax (zoneBackgrounds.ts, 5 zones, 3 layers each)
- [x] PASS 15 — Offline rewards (HubScreen uses LootBurstOverlay on boot)
- [x] PASS 16 — Monetisation verify (odds enforced, pity hard-enforced at pull 80, misleading banner removed)
- [x] PASS 17 — Visual Gallery QA (VisualGallery art section with all generated sprites)
- [x] PASS 18 — Performance + Accessibility (useReducedMotion hook, getReducedMotion() canvas singleton, reduced-motion paths in combatLoop + FloatingCurrency, font size floor 12px)

## What Remains
- [ ] PASS 19 — Final Polish: real audio files (graceful fallback active now), git commit, icon/splashscreen assets
- [ ] Synergy system — SquadScreen shows hardcoded "Machine ×2 / Nature ×1" badges; actual synergy logic not computed
- [ ] HubScreen squad power — "Squad Power: 4,280" is hardcoded; no actual hero stat computation
- [ ] Hero stats in rift — CombatEntity atk/def/spd from riftRunState spawnHero uses placeholder values
- [ ] Gear equip in rift — GearScreen equip calls store but rift combat doesn't read gear bonuses

## Architecture — Key Files
```
src/
  art/generated/
    generateSprite.ts         — all 7 sprite generators (hero/enemy/boss/gear/pet/capsule/chest)
    generatedAssetRegistry.ts — Map cache, preGenerateAll(), clearGeneratedCache()
  game/rift/
    riftTypes.ts              — all combat types
    upgradeCards.ts           — 10 cards, rollUpgradeCards()
    waveDirector.ts           — 90s TIMELINE, 12 events
    riftRunState.ts           — createInitialRiftState, tickCombat, spawnWave/Boss, buildPostRunReward
    combatLoop.ts             — renderRiftFrame (zone bg + entities + damage numbers + loot)
    zoneBackgrounds.ts        — 5 ZoneDef, 3 parallax layers each
  hooks/
    useReducedMotion.ts       — React hook
    reducedMotion.ts          — canvas-safe singleton
  ui/
    screens/
      RiftRunScreen.tsx       — RAF loop + timeline + phase state machine
      HubScreen.tsx           — LootBurstOverlay for offline rewards
      CapsuleScreen.tsx       — pity hard-enforced at pull 80
    components/
      SpriteCharacter.tsx     — bob/flip/flash/dead/glow/rainbow
      BossEntrance.tsx        — 5-step cinematic sequence
      BossHpBar.tsx           — phase dots + crack marks
      LootBurstOverlay.tsx    — chest_land→shake→burst→cascade→summary
      UpgradeCardChoice.tsx   — 3-card stagger bounce
      FloatingCurrency.tsx    — coin/gem arc toward HUD
```

## Design Decisions (Never Change)
1. Particle engine — Canvas 2D pooled loop, NEVER React state per particle
2. Rarity = beam + sound BEFORE text reveals
3. RAF combat loop — all entity state in refs, React state only for HUD snapshots every 200ms
4. Zone backgrounds — pure canvas draw functions, no React, no DOM
5. Sprites — 16×16 logical → 64×64 canvas (PS=4), `image-rendering: pixelated`
6. Pity MUST be hard-enforced in code, not just shown in UI
7. Mobile-first: 360px min width, 44px min touch targets

## Build Command
```
cd "C:\Users\ryans\Documents\GitHub\lootburst legends"
npm run build   # must pass 0 TS errors
npm run dev     # dev server
```

## Next Exact Instruction
```
Read docs/claude_NEXT_CONTEXT_HANDOFF.md and docs/claude_PASS_LOG.md. Then continue PASS 19:
1. Wire Zustand store (src/store/gameStore.ts) — persist gold, gems, heroes, pity count across screen navigations
2. Pass real squad hero IDs from store into RiftRunScreen (currently hardcoded DEFAULT_HERO_IDS)
3. Build 10-pull multi-reveal sequence in CapsuleScreen — pull 10, then cascade through LootBurstOverlay items
4. Calibrate FloatingCurrency viewport coords on mobile (absolute positioned canvas vs getBoundingClientRect)
Project builds cleanly at 99 modules. Never break tsc. Candy-dark pixel fantasy, dopamine-heavy, mobile-first.
```
