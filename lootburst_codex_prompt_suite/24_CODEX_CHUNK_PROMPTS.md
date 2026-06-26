# Copy-Paste Codex Chunk Prompts

Use these as individual Codex passes.

1. Visual foundation:
```txt
Implement the candy-dark pixel fantasy visual foundation: palettes, rarity visual definitions, art tokens, UI scale constants, and visual metadata types. Add docs/visual-bible.md. Do not change gameplay.
```

2. Asset pipeline:
```txt
Create the pixel asset folder structure, visual JSON metadata, asset manifest, asset loader, missing asset fallback, prompt registry, and validation/export scripts.
```

3. Placeholder art:
```txt
Implement deterministic procedural placeholder pixel art for heroes, enemies, bosses, gear, pets, capsules, chests, rarity frames, and VFX. No grey boxes.
```

4. Animation runtime:
```txt
Implement sprite-sheet animator, animation registry, frame events, motion primitives, hitstop, screen shake, and reduced-motion support.
```

5. VFX runtime:
```txt
Implement pooled particle engine and emitters for combat, loot, rarity, capsule, boss death, and upgrade cards. Add particle caps and low-VFX mode.
```

6. Rarity spectacle:
```txt
Implement common/uncommon/rare/epic/legendary/mythic reveal sequences with unique beams, particles, pause, shake, border animation, sound hooks, and haptics.
```

7. Capsule machine:
```txt
Build the physical capsule summon screen with currency insert, lever, drop, bounce, crack, leak, beam, silhouette reveal, card/name slam, duplicate shard conversion, pity meter, single pull and 10-pull.
```

8. Rift run:
```txt
Build the 90-second rift presentation with squad sprites, waves, upgrade cards, mid-boss, final boss, boss death, loot volcano, and reward summary.
```

9. Hub/offline:
```txt
Build animated hub and staged offline rewards with hero return, loot pile, rare beams, and claim magnet animation.
```

10. Visual QA:
```txt
Add VisualGallery for all sprites, animations, VFX, rarity reveals, capsule flows, boss deaths, reward claims, mobile/performance checks, missing asset reporting.
```

Codex operating rules:
- Work in the existing repo. Inspect package.json, src structure, current render stack, state management, and asset folders before editing.
- Preserve existing gameplay and data unless this file explicitly says to change presentation behaviour.
- Prefer isolated modules, data-driven configs, reusable components, and small integration adapters.
- Do not create static grey boxes. Every placeholder must already look like deliberate candy-dark pixel art.
- Do not hardcode a single hero, item, or boss into rendering logic. Use manifests and metadata.
- Every feature must have a visible result in-game or in a Visual Gallery/debug screen.
- Mobile readability beats decoration when the two conflict.
- Add reduced-motion and low-VFX paths for heavy shake, flashing, particles, and parallax.
