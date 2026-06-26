# Gear, Pets, Mounts, and Cosmetics

Each unit has six visually collectible slots: weapon, armor, charm, boots, relic, toy.

Gear icon rules:
- 48x48.
- thick outline.
- one exaggerated feature.
- rarity frame.
- tiny glint for rare+.
- readable at mobile size.

Examples: Squeaky Doom Hammer, Lucky Frog Coin, Meteor Lunchbox, Glitter Boots, Cursed Party Hat, Tiny Dragon Plush, Boss Tooth Necklace, Bubblegum Shield.

Equip animation:
1. item lifts from inventory.
2. arcs to slot/hero.
3. slot glows.
4. item snaps in.
5. hero flashes.
6. stat number rolls upward.

Pets:
- Coin Bat, Bubble Frog, Loot Ferret, Bomb Chick, Tiny Wyvern, Ghost Cat, Solar Bee, Mimic Puppy.
- Pets need idle, follow, and one combat/menu effect.

Mounts:
- Slime Scooter, Rocket Broom, Baby Dragon, Minecart, Cloud Sheep, Treasure Snail, Skateboard Golem.
- Mounts appear in hub/profile/run intro/outro.

Cosmetics:
- skins, trails, portrait frames, base decorations, death effects, chest-opening animations, ultimate effects, capsule machine skins.
- preview all cosmetics before equip.

Codex operating rules:
- Work in the existing repo. Inspect package.json, src structure, current render stack, state management, and asset folders before editing.
- Preserve existing gameplay and data unless this file explicitly says to change presentation behaviour.
- Prefer isolated modules, data-driven configs, reusable components, and small integration adapters.
- Do not create static grey boxes. Every placeholder must already look like deliberate candy-dark pixel art.
- Do not hardcode a single hero, item, or boss into rendering logic. Use manifests and metadata.
- Every feature must have a visible result in-game or in a Visual Gallery/debug screen.
- Mobile readability beats decoration when the two conflict.
- Add reduced-motion and low-VFX paths for heavy shake, flashing, particles, and parallax.
