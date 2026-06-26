# Rarity Spectacle System

Implement rarity visuals that are recognizable before reading text.

Rarities:
- common: white pop, small sparkle, soft click.
- uncommon: green beam, coin sprinkle, light pop.
- rare: blue vertical beam, chest bounce, bell sting.
- epic: purple beam, screen shake, bass hit, particle spiral.
- legendary: gold beam, 0.4s slow-motion, chest cracks, choir stab, gold rain.
- mythic: rainbow beam, screen darkens, everything pauses, capsule spins, impact sound, pixel fireworks, silhouette reveal, name slam.

Add `rarityVisuals` config with primary colour, secondary colour, beam type, shake preset, hitstop, particle count, reveal duration, sound event, haptic event, border animation.

API:
```ts
playRarityReveal({ rarity, position, rewardType, rewardName, iconAssetId, mode, onComplete })
```

Modes:
- inline loot.
- reward card.
- capsule reveal.
- boss chest.
- full-screen mythic.

Create components:
- RarityFrame.
- RewardReveal.
- RarityBeam.
- RarityTextSlam.

Mythic reveal must be the strongest single-screen event in the game, but no unsafe strobing.

Codex operating rules:
- Work in the existing repo. Inspect package.json, src structure, current render stack, state management, and asset folders before editing.
- Preserve existing gameplay and data unless this file explicitly says to change presentation behaviour.
- Prefer isolated modules, data-driven configs, reusable components, and small integration adapters.
- Do not create static grey boxes. Every placeholder must already look like deliberate candy-dark pixel art.
- Do not hardcode a single hero, item, or boss into rendering logic. Use manifests and metadata.
- Every feature must have a visible result in-game or in a Visual Gallery/debug screen.
- Mobile readability beats decoration when the two conflict.
- Add reduced-motion and low-VFX paths for heavy shake, flashing, particles, and parallax.
