# Capsule Machine Summon Screen

Build a physical capsule-machine screen instead of a boring summon modal.

Mobile layout:
- Top: banner title, featured rewards, pity meter.
- Middle: giant capsule machine with bobbing capsules.
- Bottom: single pull, 10-pull, currency, odds/details.

Single pull sequence:
1. Pull button squashes and charges.
2. Currency flies into slot.
3. Machine lights pulse.
4. Lever pulls.
5. Capsule drops.
6. Capsule bounces.
7. Capsule cracks.
8. Rarity colour leaks.
9. Beam fires upward.
10. Reward silhouette appears.
11. Name/card slams.
12. Duplicate converts to shards.
13. Shard/star meter fills.

10-pull sequence:
- Machine overcharges.
- Ten capsules rattle and shoot into grid.
- Low rarities pop quickly.
- Highest rarity gets full reveal.
- Summary highlights best pull.

Pity must be visible:
- Legendary guaranteed in X pulls.
- Mythic spark at Y pulls.
- Duplicate protection/max-star conversion clear.
- Odds accessible and honest.

Components:
- CapsuleMachine.
- CapsulePullButton.
- CapsuleRevealGrid.
- PityMeter.
- OddsPanel.
- DuplicateShardConversion.
- StarUpSequence.

Codex operating rules:
- Work in the existing repo. Inspect package.json, src structure, current render stack, state management, and asset folders before editing.
- Preserve existing gameplay and data unless this file explicitly says to change presentation behaviour.
- Prefer isolated modules, data-driven configs, reusable components, and small integration adapters.
- Do not create static grey boxes. Every placeholder must already look like deliberate candy-dark pixel art.
- Do not hardcode a single hero, item, or boss into rendering logic. Use manifests and metadata.
- Every feature must have a visible result in-game or in a Visual Gallery/debug screen.
- Mobile readability beats decoration when the two conflict.
- Add reduced-motion and low-VFX paths for heavy shake, flashing, particles, and parallax.
