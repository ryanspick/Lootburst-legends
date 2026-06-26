# 90-Second Rift Run Presentation

Create or enhance the active rift run screen.

Run flow:
- 0s: rift portal opens, squad drops in.
- 5s: first wave.
- 20s: upgrade cards.
- 45s: mid-boss.
- 55s: upgrade cards.
- 75s: pressure wave.
- 90s: final boss.
- End: boss death, chest volcano, reward summary.

Presentation:
- Top-down survivor arena preferred. Side-view acceptable if current game uses it.
- Squad grouped near center/left.
- Enemies enter from edges/right.
- Projectiles and damage numbers readable.
- Timer visible.
- Upgrade icons show current build.
- Loot bounces and magnetizes to counters.

Upgrade card interruption:
1. combat slows/freezes.
2. background dims.
3. three cards fly in and flip.
4. selected card enlarges.
5. effect bursts onto squad.
6. combat resumes.

Initial upgrades: Blade Orbit, Gold Fever, Tiny Meteor, Slime Splitter, Emergency Bubble, Boss Biter, Crit Confetti, Chest Magnet, Ultimate Battery, Rainbow Overload.

Do not wait for complete balance logic. Implement visual hooks and sample data if needed.

Codex operating rules:
- Work in the existing repo. Inspect package.json, src structure, current render stack, state management, and asset folders before editing.
- Preserve existing gameplay and data unless this file explicitly says to change presentation behaviour.
- Prefer isolated modules, data-driven configs, reusable components, and small integration adapters.
- Do not create static grey boxes. Every placeholder must already look like deliberate candy-dark pixel art.
- Do not hardcode a single hero, item, or boss into rendering logic. Use manifests and metadata.
- Every feature must have a visible result in-game or in a Visual Gallery/debug screen.
- Mobile readability beats decoration when the two conflict.
- Add reduced-motion and low-VFX paths for heavy shake, flashing, particles, and parallax.
