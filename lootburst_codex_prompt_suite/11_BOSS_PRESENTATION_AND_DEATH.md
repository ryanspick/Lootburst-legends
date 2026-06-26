# Boss Presentation and Death

Bosses must be event spikes.

Entrance sequence:
1. Combat dips/dims.
2. Warning glyph appears.
3. Arena edge pulses.
4. Boss silhouette appears.
5. Boss drops/warps/slides in.
6. Name plate slams.
7. Threat/element tags appear.
8. Boss roars or bounces.
9. Fight resumes.

Boss HP bar:
- Large top bar.
- Phase segments.
- boss portrait.
- element icons.
- cracks as HP lowers.

Death sequence:
1. final hit freeze.
2. white flash.
3. boss cracks.
4. screen shake.
5. sprite breaks/explodes.
6. quiet 150-300ms pause.
7. chest lands.
8. chest shakes.
9. loot volcano.
10. rarity reveal queue.

Initial bosses: King Slime Pop, Goblin Minecart Ace, Mushroom Matriarch, Neon Bone Hydra, Tax Collector Mimic, Pumpkin Gearlord, Void Arcade Dragon, The Moon Vault, Star-Eater Cherub.

Boss-specific deaths:
- Slime inflates then pops.
- Minecart flips and sparks.
- Mushroom cap cracks into spores.
- Hydra heads shatter one by one.
- Mimic safe opens and stolen gold sprays.
- Gearlord gears fly outward.
- Arcade Dragon glitches into rainbow shards.
- Moon Vault locks shatter then door beams.
- Star-Eater Cherub implodes into delayed cosmic shockwave.

Codex operating rules:
- Work in the existing repo. Inspect package.json, src structure, current render stack, state management, and asset folders before editing.
- Preserve existing gameplay and data unless this file explicitly says to change presentation behaviour.
- Prefer isolated modules, data-driven configs, reusable components, and small integration adapters.
- Do not create static grey boxes. Every placeholder must already look like deliberate candy-dark pixel art.
- Do not hardcode a single hero, item, or boss into rendering logic. Use manifests and metadata.
- Every feature must have a visible result in-game or in a Visual Gallery/debug screen.
- Mobile readability beats decoration when the two conflict.
- Add reduced-motion and low-VFX paths for heavy shake, flashing, particles, and parallax.
