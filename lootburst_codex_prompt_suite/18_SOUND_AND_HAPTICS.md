# Sound and Haptics Event Layer

Create sound/haptic events with graceful missing-file fallback.

Combat events:
- combat_sword_tick.
- combat_crit_snap.
- combat_projectile_whoosh.
- combat_spell_sparkle.
- combat_shield_boing.
- combat_fire_burst.
- combat_poison_bubble.
- combat_freeze_crack.
- combat_coin_ping.
- combat_boss_death_boom.

Reward events:
- reward_chest_rattle.
- reward_chest_crack.
- reward_chest_volcano.
- reward_capsule_spin.
- reward_rarity_beam.
- reward_gem_scatter.
- reward_star_up_slam.
- reward_gear_equip_clink.
- reward_level_up_flourish.

UI events:
- ui_hover_tick.
- ui_button_pop.
- ui_tab_slide.
- ui_upgrade_card_flip.
- ui_claim_sweep.
- ui_pull_button_charge.

Rarity events:
- rarity_common_pop.
- rarity_uncommon_pop.
- rarity_rare_bell.
- rarity_epic_bass.
- rarity_legendary_choir.
- rarity_mythic_impact.

API:
```ts
playSound(eventName, options?)
haptic('light'|'medium'|'heavy'|'double')
```

Rate-limit repeated sounds. Never skip high-rarity reveal sounds unless muted.

Codex operating rules:
- Work in the existing repo. Inspect package.json, src structure, current render stack, state management, and asset folders before editing.
- Preserve existing gameplay and data unless this file explicitly says to change presentation behaviour.
- Prefer isolated modules, data-driven configs, reusable components, and small integration adapters.
- Do not create static grey boxes. Every placeholder must already look like deliberate candy-dark pixel art.
- Do not hardcode a single hero, item, or boss into rendering logic. Use manifests and metadata.
- Every feature must have a visible result in-game or in a Visual Gallery/debug screen.
- Mobile readability beats decoration when the two conflict.
- Add reduced-motion and low-VFX paths for heavy shake, flashing, particles, and parallax.
