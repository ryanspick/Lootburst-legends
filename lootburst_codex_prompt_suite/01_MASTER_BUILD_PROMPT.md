# Master Codex Build Prompt

Implement the visual and animation foundation for Lootburst Legends, a pixel idle roguelite squad collector built around short 90-second rift runs, squad collection, loot bursts, capsule pulls, idle rewards, pets, relics, mounts, gear toys, and staged rarity reveals.

Highest priorities:
1. Look and feel.
2. Pixel-generated art workflow.
3. Reusable animation runtime.
4. Reusable VFX/particle runtime.
5. Rarity spectacle.
6. Capsule-machine summon screen.
7. Boss death and loot burst sequences.
8. Mobile-first animated UI.
9. Visual gallery for fast iteration.

Required source folders, adapted to existing conventions:
```txt
src/art/              palettes, rarity visuals, asset manifest, prompt registry
src/animation/        sprite animator, motion primitives, timeline, hitstop, shake
src/vfx/              particle engine, combat/loot/capsule/rarity emitters
src/audio/            sound event manifest and graceful fallback
src/ui/components/    PixelPanel, PixelButton, RarityFrame, SpriteCharacter, RewardReveal
src/game/rift/        rift presentation, wave presentation, boss presentation, loot burst
src/game/capsule/     capsule machine sequence and reveal controller
src/data/art/         heroes/enemies/bosses/gear/pets/zones/vfx/animations JSON
docs/                 visual bible, asset pipeline, animation spec, VFX spec
scripts/              placeholder generator, metadata validator, prompt exporter
```

Required visible systems:
- Animated hub with living background, bobbing squad, pulsing Enter Rift button, capsule teaser, chest, idle reward pile.
- 90-second rift demo flow with squad sprites, enemies, upgrade cards, mid-boss, final boss, loot burst, reward summary.
- Capsule machine with physical pull sequence: currency insert, lever, drop, bounce, crack, colour leak, beam, silhouette, name slam, shard conversion, pity fill.
- Rarity reveal system for common/uncommon/rare/epic/legendary/mythic.
- VisualGallery/debug screen to preview all sprites, VFX, rarity reveals, capsule pulls, boss deaths, reward claims, and performance stress tests.

Non-negotiable feel rule: the player must understand reward value before reading text. Rare is blue beam. Epic is purple spiral. Legendary is gold pause/beam/rain. Mythic is screen-darkening rainbow spectacle.

Codex operating rules:
- Work in the existing repo. Inspect package.json, src structure, current render stack, state management, and asset folders before editing.
- Preserve existing gameplay and data unless this file explicitly says to change presentation behaviour.
- Prefer isolated modules, data-driven configs, reusable components, and small integration adapters.
- Do not create static grey boxes. Every placeholder must already look like deliberate candy-dark pixel art.
- Do not hardcode a single hero, item, or boss into rendering logic. Use manifests and metadata.
- Every feature must have a visible result in-game or in a Visual Gallery/debug screen.
- Mobile readability beats decoration when the two conflict.
- Add reduced-motion and low-VFX paths for heavy shake, flashing, particles, and parallax.
