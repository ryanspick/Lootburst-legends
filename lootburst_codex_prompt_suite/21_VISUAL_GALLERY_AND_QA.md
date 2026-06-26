# Visual Gallery and QA

Add a VisualGallery/debug screen.

Must preview:
- all heroes idle/attack/ultimate.
- all enemies.
- all bosses entrance/death.
- all gear icons.
- all pets/mounts.
- all rarity reveals.
- all VFX emitters.
- capsule single pull.
- capsule 10-pull.
- duplicate conversion.
- star-up.
- loot burst.
- reward claim.
- buttons/panels/cards.

QA buttons:
- Play common/rare/epic/legendary/mythic reveal.
- Spawn 100/300/700 particles.
- Toggle reduced motion.
- Toggle low VFX.
- Show missing assets.
- Show frame time.
- Show particle count.

Fail conditions:
- reward appears as text only.
- boss just disappears.
- capsule result appears instantly.
- grey boxes shown.
- text unreadable at 360px width.
- rarity not identifiable without text.

Codex operating rules:
- Work in the existing repo. Inspect package.json, src structure, current render stack, state management, and asset folders before editing.
- Preserve existing gameplay and data unless this file explicitly says to change presentation behaviour.
- Prefer isolated modules, data-driven configs, reusable components, and small integration adapters.
- Do not create static grey boxes. Every placeholder must already look like deliberate candy-dark pixel art.
- Do not hardcode a single hero, item, or boss into rendering logic. Use manifests and metadata.
- Every feature must have a visible result in-game or in a Visual Gallery/debug screen.
- Mobile readability beats decoration when the two conflict.
- Add reduced-motion and low-VFX paths for heavy shake, flashing, particles, and parallax.
