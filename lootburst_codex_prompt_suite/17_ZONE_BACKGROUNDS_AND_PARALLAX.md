# Zone Backgrounds and Parallax

Implement parallax-ready zone backgrounds with dark readable centers.

Layer model:
- far layer.
- mid layer.
- near/edge layer.
- particles.
- lighting/vignette overlay.

Initial zones:
1. Candy Cavern Rift: deep navy cave, pink crystals, cyan fog, gold cracks.
2. Goblin Glitter Mines: rails, lanterns, copper veins, green goblin shapes, falling dust.
3. Moon Vault: silver doors, moonlight beams, floating keys, blue stone.
4. Void Arcade: dark purple, cyan/magenta grid, glitch blocks, bullet-pattern lights.
5. Starforge Nursery: cosmic forge, gold anvils, star clouds, rainbow sparks.

Rules:
- central combat area low-detail.
- bright props at edges.
- vignette.
- no readable text/logos.
- no high-frequency noise behind damage numbers.
- background motion must not compete with combat.

Codex operating rules:
- Work in the existing repo. Inspect package.json, src structure, current render stack, state management, and asset folders before editing.
- Preserve existing gameplay and data unless this file explicitly says to change presentation behaviour.
- Prefer isolated modules, data-driven configs, reusable components, and small integration adapters.
- Do not create static grey boxes. Every placeholder must already look like deliberate candy-dark pixel art.
- Do not hardcode a single hero, item, or boss into rendering logic. Use manifests and metadata.
- Every feature must have a visible result in-game or in a Visual Gallery/debug screen.
- Mobile readability beats decoration when the two conflict.
- Add reduced-motion and low-VFX paths for heavy shake, flashing, particles, and parallax.
