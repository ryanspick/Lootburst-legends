# Safe Monetisation Guardrails

Keep the capsule/collection loop exciting without predatory mechanics.

Required:
- visible odds.
- visible pity.
- visible duplicate conversion.
- no hidden rates.
- no fake scarcity.
- no child-targeted pressure.
- no paid-only hard progression wall.
- no forced ads after every run.
- no misleading countdowns.

Good monetisation surfaces:
- optional rewarded ad for bonus chest.
- optional rewarded ad for double offline rewards.
- cosmetic battle pass.
- ad-removal pass.
- skins.
- mounts.
- extra team presets.
- banner currency bundles.
- non-essential starter pack.
- quality-of-life upgrades.

Bad:
- forced ad after every 90s run.
- no-pity capsule.
- hidden odds.
- fake limited timer.
- PvP whale domination.
- manipulative loss-aversion popups.

Capsule screen must show: rarity odds, pity progress, duplicate conversion, banner contents, guarantee text.

Codex operating rules:
- Work in the existing repo. Inspect package.json, src structure, current render stack, state management, and asset folders before editing.
- Preserve existing gameplay and data unless this file explicitly says to change presentation behaviour.
- Prefer isolated modules, data-driven configs, reusable components, and small integration adapters.
- Do not create static grey boxes. Every placeholder must already look like deliberate candy-dark pixel art.
- Do not hardcode a single hero, item, or boss into rendering logic. Use manifests and metadata.
- Every feature must have a visible result in-game or in a Visual Gallery/debug screen.
- Mobile readability beats decoration when the two conflict.
- Add reduced-motion and low-VFX paths for heavy shake, flashing, particles, and parallax.
