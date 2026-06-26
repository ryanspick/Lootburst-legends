# Hero Collection and Squad UI

Collection must feel like a prize album, not a database.

Hero cards:
- animated portrait.
- rarity frame.
- stars.
- element icon.
- role/class icon.
- new/upgrade marker.
- idle bob.

Selected hero panel:
- large animated sprite.
- name and rarity.
- role/class/element.
- star meter.
- gear slots.
- passive/ultimate preview.
- upgrade button.
- pet companion if equipped.

Star-up sequence:
1. background darkens.
2. shards magnet into meter.
3. meter fills.
4. new star slams in.
5. sprite victory bounce.
6. stat numbers roll upward.

Squad slots:
- start 3, expand to 5.
- empty slots glow.
- assignment makes hero jump into slot.
- synergy badges update live.

Synergy badge states:
- inactive dim.
- near-active pulse.
- active glow.
- tier upgrade stronger border.

Codex operating rules:
- Work in the existing repo. Inspect package.json, src structure, current render stack, state management, and asset folders before editing.
- Preserve existing gameplay and data unless this file explicitly says to change presentation behaviour.
- Prefer isolated modules, data-driven configs, reusable components, and small integration adapters.
- Do not create static grey boxes. Every placeholder must already look like deliberate candy-dark pixel art.
- Do not hardcode a single hero, item, or boss into rendering logic. Use manifests and metadata.
- Every feature must have a visible result in-game or in a Visual Gallery/debug screen.
- Mobile readability beats decoration when the two conflict.
- Add reduced-motion and low-VFX paths for heavy shake, flashing, particles, and parallax.
