# UI Components and Mobile Polish

Build a reusable UI kit that prevents the game from looking generic.

Components:
- PixelPanel.
- PixelButton.
- RarityFrame.
- AnimatedIcon.
- SpriteCharacter.
- UpgradeCardChoice.
- RewardReveal.
- LootBurstOverlay.
- CapsuleMachine.
- SparkleLayer.
- FloatingCurrency.
- VisualGallery.

Mobile bottom nav:
```txt
Run | Squad | Capsule | Gear | Progress
```
Progress groups pets, mounts, relics, statistics, collection, cosmetics, achievements.

Global rules:
- 44px minimum touch targets.
- Primary buttons 52-64px tall.
- Large icons.
- Short labels.
- No hover-only info.
- Dark panels behind text.
- Rarity visible by frame + icon + label.
- No tiny unreadable badges.

Primary Enter Rift button:
- gold/pink glow.
- breathing pulse.
- sparkle sweep.
- press squash.
- short tag like 90s Run.

Loading: bouncing pixel chest. Empty state: sleeping loot rat. Error: cracked capsule.

Codex operating rules:
- Work in the existing repo. Inspect package.json, src structure, current render stack, state management, and asset folders before editing.
- Preserve existing gameplay and data unless this file explicitly says to change presentation behaviour.
- Prefer isolated modules, data-driven configs, reusable components, and small integration adapters.
- Do not create static grey boxes. Every placeholder must already look like deliberate candy-dark pixel art.
- Do not hardcode a single hero, item, or boss into rendering logic. Use manifests and metadata.
- Every feature must have a visible result in-game or in a Visual Gallery/debug screen.
- Mobile readability beats decoration when the two conflict.
- Add reduced-motion and low-VFX paths for heavy shake, flashing, particles, and parallax.
