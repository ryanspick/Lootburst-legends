# Mobile Performance and Accessibility

Performance budget:
- normal combat: 250-350 particles.
- boss death: 500.
- legendary: 600.
- mythic: 700 temporary.
- low VFX: 120.

Use pooling for particles, damage numbers, loot drops, temporary VFX sprites. Avoid React state updates per particle.

Use canvas/WebGL for particles and combat. DOM/CSS is fine for low-count UI motion.

Reduced motion:
- disable heavy shake.
- reduce particles.
- reduce parallax.
- avoid large zooms.
- keep rarity colour/icon/label feedback.

Readability:
- body text 14-16px.
- button text 16px+.
- tiny labels only for non-critical info.
- strong text outline/shadow over action.
- dark panels behind text.
- no hover-only info on mobile.

Flash safety:
- no rapid full-screen strobe.
- mythic dramatic but not flickering.
- white flash short and rare.

Codex operating rules:
- Work in the existing repo. Inspect package.json, src structure, current render stack, state management, and asset folders before editing.
- Preserve existing gameplay and data unless this file explicitly says to change presentation behaviour.
- Prefer isolated modules, data-driven configs, reusable components, and small integration adapters.
- Do not create static grey boxes. Every placeholder must already look like deliberate candy-dark pixel art.
- Do not hardcode a single hero, item, or boss into rendering logic. Use manifests and metadata.
- Every feature must have a visible result in-game or in a Visual Gallery/debug screen.
- Mobile readability beats decoration when the two conflict.
- Add reduced-motion and low-VFX paths for heavy shake, flashing, particles, and parallax.
