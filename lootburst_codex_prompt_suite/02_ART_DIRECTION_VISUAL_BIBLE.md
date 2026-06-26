# Art Direction Visual Bible

Style phrase: candy-dark pixel fantasy.

The game should feel like a dark fantasy arcade cabinet filled with capsule toys, glowing loot beams, tiny heroes, chaotic but readable combat, and prize-machine reward energy.

Palette:
- Base: deep navy, blue-black, charcoal, dark indigo, muted dungeon stone.
- Reward: gold, hot pink, cyan, lime, orange, purple, white, rainbow.
- Backgrounds must be dark and low-contrast behind action/UI. Put bright accents at edges and during rewards.

Pixel style:
- Polished 32-bit pixel art feel.
- Thick readable outline.
- Strong silhouettes.
- Chibi heroes at 48x48/64x64.
- Bosses at 128x128/192x192.
- Icons readable at 48x48.
- Avoid noisy internal detail. Use a few strong shapes and bright accent pixels.

Shape language:
- Common: round, soft, plain, small bounce.
- Rare: sharper highlight, blue glow, extra prop.
- Epic: neon accents, purple/pink afterimage, more particles.
- Legendary: halo/gold trim, strong aura, elegant silhouette.
- Mythic: impossible/rainbow/cosmic, silhouette reveal, constellation particles.

UI style:
- Dark blue-black panels.
- Pixel bevels and inner shadows.
- Rarity-colour accents only where meaningful.
- Large icons, short labels, strong hierarchy.
- Animated but not cluttered.
- Menus must feel like a toy machine, not a spreadsheet.

Motion rule: every screen needs motion even when idle: bobbing units, pulsing buttons, chest breathing, capsule bubbles, floating particles, glint sweeps, rarity frame shimmer, pets wandering.

Codex operating rules:
- Work in the existing repo. Inspect package.json, src structure, current render stack, state management, and asset folders before editing.
- Preserve existing gameplay and data unless this file explicitly says to change presentation behaviour.
- Prefer isolated modules, data-driven configs, reusable components, and small integration adapters.
- Do not create static grey boxes. Every placeholder must already look like deliberate candy-dark pixel art.
- Do not hardcode a single hero, item, or boss into rendering logic. Use manifests and metadata.
- Every feature must have a visible result in-game or in a Visual Gallery/debug screen.
- Mobile readability beats decoration when the two conflict.
- Add reduced-motion and low-VFX paths for heavy shake, flashing, particles, and parallax.
