# Menu Idle Motion System

Menus must never feel dead.

Implement shared idle motion with:
- bob.
- pulse.
- sparkle timer.
- glint sweep.
- slow drift.
- rarity shimmer.
- pet wander.
- parallax.

Motion intensity: low, normal, high.
- Low: reduced-motion/accessibility.
- Normal: default subtle bob/sparkle.
- High: capsule/reward screens.

Hub idle:
- squad shifts weight.
- pets wander.
- capsule machine bubbles.
- chest breathes.
- Enter Rift button pulses.
- background particles drift.

Squad screen:
- selected hero idle animation.
- upgrade-ready slots glint.
- star meter sparkles.

Gear screen:
- equipped items bob.
- new item tags pulse.
- legendary/mythic gear emits tiny particles.

Capsule screen:
- machine lights pulse.
- capsules bob.
- lever wiggles.
- pity milestone glints.

Codex operating rules:
- Work in the existing repo. Inspect package.json, src structure, current render stack, state management, and asset folders before editing.
- Preserve existing gameplay and data unless this file explicitly says to change presentation behaviour.
- Prefer isolated modules, data-driven configs, reusable components, and small integration adapters.
- Do not create static grey boxes. Every placeholder must already look like deliberate candy-dark pixel art.
- Do not hardcode a single hero, item, or boss into rendering logic. Use manifests and metadata.
- Every feature must have a visible result in-game or in a Visual Gallery/debug screen.
- Mobile readability beats decoration when the two conflict.
- Add reduced-motion and low-VFX paths for heavy shake, flashing, particles, and parallax.
