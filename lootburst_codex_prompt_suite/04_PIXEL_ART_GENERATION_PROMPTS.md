# Pixel Art Generation Prompt Library

Create `src/art/generatedAssetPrompts.ts` and `src/data/art/generatedAssetPrompts.json`. These files store reusable prompts for AI-generated pixel art.

Universal negative prompt:
```txt
no text, no logo, no watermark, no copyrighted character, no modern UI, no realistic rendering, no blurry anti-aliased painting, no messy background, no extra limbs, no inconsistent frame sizes, no unreadable tiny details
```

Hero prompt template:
```txt
Create a high-quality pixel-art sprite sheet for [HERO_NAME], a [RARITY] [ROLE] hero in a candy-dark fantasy mobile squad collector.
Style: polished 32-bit pixel art, chibi proportions, strong silhouette, thick readable dark outline, saturated accent colour, transparent background, readable at [SIZE].
Design: [VISUAL_DESCRIPTION]. Emphasize [KEY_PROP], [ELEMENT], and [PERSONALITY_ANIMATION].
Animation: [FRAME_COUNT] frames of [ACTION], consistent proportions, evenly spaced, no camera movement.
Restrictions: no text, no logos, no watermark, no copyrighted references, no realistic rendering.
```

Boss prompt template:
```txt
Create a large pixel-art boss sprite sheet for [BOSS_NAME], a major boss in a candy-dark fantasy mobile roguelite.
Style: polished 32-bit pixel art, huge readable silhouette, thick outline, transparent background, 128x128 or 192x192 frames.
Design: [BOSS_DESCRIPTION]. Include visible weak points, glowing core, exaggerated boss identity, and strong phase-change readability.
Animation: [FRAME_COUNT] frames of [ACTION].
```

Gear prompt template:
```txt
Create a 48x48 game-ready pixel-art icon for [ITEM_NAME], a [RARITY] [SLOT] item.
Style: thick outline, transparent background, exaggerated toy-like shape, high contrast, rarity glow, readable at mobile size.
Design: [ITEM_DESCRIPTION]. Emphasize [KEY_FEATURE].
```

Initial prompts to include: Copper Knight, Mushroom Medic, Goblin Sparkshot, Pebble Golem, Cherry Bomb Imp, Bubble Priest, Moonlit Archer, Loot Rat King, Neon Blade Dancer, Storm Totem Cub, Frost Lantern Mage, Goldjaw Mimic, Solar Drum Paladin, Void Candy Witch, Dragonfire Courier, Rainbow Relic Slime, Starforge Baby Titan, Capsule King, Prismatic Reaper Cat, King Slime Pop, Goblin Minecart Ace, Mushroom Matriarch, Neon Bone Hydra, Tax Collector Mimic, Pumpkin Gearlord, Void Arcade Dragon, Moon Vault, Star-Eater Cherub.

Codex operating rules:
- Work in the existing repo. Inspect package.json, src structure, current render stack, state management, and asset folders before editing.
- Preserve existing gameplay and data unless this file explicitly says to change presentation behaviour.
- Prefer isolated modules, data-driven configs, reusable components, and small integration adapters.
- Do not create static grey boxes. Every placeholder must already look like deliberate candy-dark pixel art.
- Do not hardcode a single hero, item, or boss into rendering logic. Use manifests and metadata.
- Every feature must have a visible result in-game or in a Visual Gallery/debug screen.
- Mobile readability beats decoration when the two conflict.
- Add reduced-motion and low-VFX paths for heavy shake, flashing, particles, and parallax.
