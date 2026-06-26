# Initial Visual Data Roster

Create initial data entries for this roster.

Common heroes:
- Copper Knight: tank, machine/gold, shield bash, copper sparks.
- Mushroom Medic: healer, nature/poison, spore puffs, green healing puddles.
- Goblin Sparkshot: ranged, machine/gold, spark pistol, coin crits.
- Pebble Golem: tank, earth, glowing cracks.

Rare heroes:
- Cherry Bomb Imp: fire bomber, red-orange pixel burst.
- Bubble Priest: healer/shielder, cyan bubbles.
- Moonlit Archer: ranger, silver split arrows.
- Loot Rat King: support, crown, gold trail, drop bonus.

Epic heroes:
- Neon Blade Dancer: assassin, purple/pink afterimages.
- Storm Totem Cub: storm support, lightning towers.
- Frost Lantern Mage: ice caster, blue crystal freeze.
- Goldjaw Mimic: treasure fighter, eats/spits upgraded loot.

Legendary heroes:
- Solar Drum Paladin: support/tank, golden rhythm shockwave.
- Void Candy Witch: caster, purple-black candy orbitals.
- Dragonfire Courier: rider, burning loot crates.
- Rainbow Relic Slime: support, converts bullets to gems.

Mythic heroes:
- Starforge Baby Titan: cosmic hammer, constellation explosions.
- Capsule King: screen becomes capsule machine.
- Prismatic Reaper Cat: rainbow scythe death arcs.

Bosses: King Slime Pop, Goblin Minecart Ace, Mushroom Matriarch, Neon Bone Hydra, Tax Collector Mimic, Pumpkin Gearlord, Void Arcade Dragon, The Moon Vault, Star-Eater Cherub.

Gear examples: Squeaky Doom Hammer, Lucky Frog Coin, Meteor Lunchbox, Glitter Boots, Cursed Party Hat, Tiny Dragon Plush, Boss Tooth Necklace, Bubblegum Shield.

Codex operating rules:
- Work in the existing repo. Inspect package.json, src structure, current render stack, state management, and asset folders before editing.
- Preserve existing gameplay and data unless this file explicitly says to change presentation behaviour.
- Prefer isolated modules, data-driven configs, reusable components, and small integration adapters.
- Do not create static grey boxes. Every placeholder must already look like deliberate candy-dark pixel art.
- Do not hardcode a single hero, item, or boss into rendering logic. Use manifests and metadata.
- Every feature must have a visible result in-game or in a Visual Gallery/debug screen.
- Mobile readability beats decoration when the two conflict.
- Add reduced-motion and low-VFX paths for heavy shake, flashing, particles, and parallax.
