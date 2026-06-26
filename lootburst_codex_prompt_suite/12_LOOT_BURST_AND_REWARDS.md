# Loot Burst and Reward Sequences

Rewards must never just appear as a text list.

Small enemy kill:
- death pop.
- 1-3 coins/sparks.
- quick magnet.
- top bar ping.

Elite kill:
- flash.
- larger coin/loot pop.
- rare item hovers if dropped.
- rarity sparkle.
- magnet.

Boss chest volcano:
- chest lands.
- chest shakes.
- beams leak.
- chest erupts.
- rewards arc outward.
- rare+ rewards hover longer.
- highest rarity gets spotlight reveal.
- remaining rewards cascade.

Reward claim:
- gold flies to gold counter.
- XP flies to hero bars.
- gear flies to bag.
- shards fly to hero portraits.
- capsule tokens fly to capsule icon.
- boss keys fly to key icon.

Reward summary panel:
- best drop top.
- currency row.
- XP row.
- gear/shards/tokens/cards.
- claim button pulses.
- dark panel with gold trim and sparkles.

Codex operating rules:
- Work in the existing repo. Inspect package.json, src structure, current render stack, state management, and asset folders before editing.
- Preserve existing gameplay and data unless this file explicitly says to change presentation behaviour.
- Prefer isolated modules, data-driven configs, reusable components, and small integration adapters.
- Do not create static grey boxes. Every placeholder must already look like deliberate candy-dark pixel art.
- Do not hardcode a single hero, item, or boss into rendering logic. Use manifests and metadata.
- Every feature must have a visible result in-game or in a Visual Gallery/debug screen.
- Mobile readability beats decoration when the two conflict.
- Add reduced-motion and low-VFX paths for heavy shake, flashing, particles, and parallax.
