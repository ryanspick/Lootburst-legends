# Procedural Placeholder Pixel Art Generator

Implement deterministic placeholder art so the game looks good before final generated art.

Create `scripts/generate-placeholder-pixel-art.ts` or JS equivalent. Command: `npm run art:placeholders`.

Generate:
- Heroes: 64x64 chibi sprites with role prop, thick outline, rarity accent, element glow.
- Enemies: 48x48 silhouettes: slime, bat, goblin, mushroom, skull, gear bug, ghost.
- Bosses: 128x128/192x192 silhouettes with crown/horns/locks/core/weak points.
- Gear: 48x48 icons for weapon, armor, charm, boots, relic, toy.
- Pets: 32x32/48x48 small companions.
- Capsules/chests/currency icons.
- Rarity frames.
- Basic VFX sprites: coin, gem, spark, star, slash, explosion puff, bubble, ice shard, beam segment.

Seed rule:
```ts
seed = hash(assetId)
```
Same ID must always generate same placeholder.

Hero prop mapping:
- tank: shield.
- healer: staff/orb.
- ranged: bow/gun.
- caster: wand/staff.
- assassin: daggers.
- support: banner/charm.

Element mapping:
- fire: orange flame pixels.
- ice: cyan shards.
- poison: lime bubbles.
- holy: gold rays.
- shadow: purple smoke.
- storm: cyan lightning.
- machine: copper sparks.
- nature: green leaves.
- gold: coin sparkles.

No output should look like a plain rectangle. Use chunky outlines, tiny glints, and rarity framing.

Codex operating rules:
- Work in the existing repo. Inspect package.json, src structure, current render stack, state management, and asset folders before editing.
- Preserve existing gameplay and data unless this file explicitly says to change presentation behaviour.
- Prefer isolated modules, data-driven configs, reusable components, and small integration adapters.
- Do not create static grey boxes. Every placeholder must already look like deliberate candy-dark pixel art.
- Do not hardcode a single hero, item, or boss into rendering logic. Use manifests and metadata.
- Every feature must have a visible result in-game or in a Visual Gallery/debug screen.
- Mobile readability beats decoration when the two conflict.
- Add reduced-motion and low-VFX paths for heavy shake, flashing, particles, and parallax.
