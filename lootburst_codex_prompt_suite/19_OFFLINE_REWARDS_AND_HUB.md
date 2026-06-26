# Offline Rewards and Animated Hub

Hub must be alive:
- animated background.
- tiny squad idle.
- pets wandering.
- capsule machine teaser.
- floating chest.
- primary Enter Rift button.
- offline reward pile.
- daily/event widget.
- currency counters that bounce on gain.

Offline return sequence:
1. heroes return from portal.
2. sacks/chests drop.
3. offline duration appears.
4. reward pile forms.
5. common rewards reveal quickly.
6. rare+ rewards get beams.
7. claim button pulses.
8. claim sends rewards to counters/inventory.

Rewards may include gold, XP, common loot, crafting dust, banner tokens, pet snacks, relic fragments, reputation, low-rate boss keys. Active runs should still provide strongest rarity spikes.

Optional ad bonus, if present, must be optional. Base claim stays available. No pressure copy.

Codex operating rules:
- Work in the existing repo. Inspect package.json, src structure, current render stack, state management, and asset folders before editing.
- Preserve existing gameplay and data unless this file explicitly says to change presentation behaviour.
- Prefer isolated modules, data-driven configs, reusable components, and small integration adapters.
- Do not create static grey boxes. Every placeholder must already look like deliberate candy-dark pixel art.
- Do not hardcode a single hero, item, or boss into rendering logic. Use manifests and metadata.
- Every feature must have a visible result in-game or in a Visual Gallery/debug screen.
- Mobile readability beats decoration when the two conflict.
- Add reduced-motion and low-VFX paths for heavy shake, flashing, particles, and parallax.
