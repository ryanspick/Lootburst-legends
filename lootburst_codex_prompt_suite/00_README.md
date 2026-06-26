# Lootburst Legends Codex Prompt Suite

This package breaks the implementation into focused Codex prompt files. The concept is a mobile-first pixel idle roguelite squad collector: Vampire Survivors run energy, AFK progression, capsule-machine collection, and tiny pixel loot explosions.

Use order:
1. 01_MASTER_BUILD_PROMPT.md
2. 02_ART_DIRECTION_VISUAL_BIBLE.md
3. 03_PROJECT_STRUCTURE_AND_ASSET_PIPELINE.md
4. 04_PIXEL_ART_GENERATION_PROMPTS.md
5. 05_PLACEHOLDER_ART_GENERATOR.md
6. 06_ANIMATION_RUNTIME.md
7. 07_VFX_PARTICLE_ENGINE.md
8. 08_RARITY_SPECTACLE.md
9. 09_CAPSULE_MACHINE.md
10. 10_RIFT_RUN_PRESENTATION.md
11. Continue through the remaining feature files.

Target feeling: candy-dark pixel fantasy. Dark navy dungeon/cosmic backgrounds. Gold loot beams. Hot pink magic. Cyan shields. Lime poison. Orange explosions. Purple void. White crit flashes. Rainbow mythic reveals. Everything should feel like a fantasy arcade cabinet and magical capsule toy machine.

Primary deliverable: a working visual/animation framework that makes the game feel dopamine-rich even before final AI art is generated.

Codex operating rules:
- Work in the existing repo. Inspect package.json, src structure, current render stack, state management, and asset folders before editing.
- Preserve existing gameplay and data unless this file explicitly says to change presentation behaviour.
- Prefer isolated modules, data-driven configs, reusable components, and small integration adapters.
- Do not create static grey boxes. Every placeholder must already look like deliberate candy-dark pixel art.
- Do not hardcode a single hero, item, or boss into rendering logic. Use manifests and metadata.
- Every feature must have a visible result in-game or in a Visual Gallery/debug screen.
- Mobile readability beats decoration when the two conflict.
- Add reduced-motion and low-VFX paths for heavy shake, flashing, particles, and parallax.
