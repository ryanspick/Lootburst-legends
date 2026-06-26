# Lootburst Legends — Claude Context Summary

## Game Identity
**Lootburst Legends** — mobile-first pixel idle roguelite squad collector.
Hybrid: Vampire Survivors (90s run energy) + AFK Arena (idle progression) + Pokémon capsule machine (summon spectacle) + pixel loot explosion simulator.
Platform: Mobile web (React PWA). Short sessions, persistent idle progress, dopamine-heavy visual reward loop.

## Visual Pillars
1. **Candy-dark pixel fantasy** — dark navy/indigo backgrounds, bright neon accent rewards
2. **Never dead** — every screen has motion: bobs, pulses, drifts, glints
3. **Rarity is readable before text** — beam colour + sound + shake identify rarity instantly
4. **Mobile-first readability** — everything works at 360px width, 44px min touch targets
5. **Procedural VFX > bespoke animation** — flashiness from reusable particle/beam systems

## Art Style
- Polished 32-bit pixel art feel
- Chibi heroes: 48×48 / 64×64
- Bosses: 128×128 / 192×192
- Icons: 48×48, thick outline, readable at mobile size
- Transparent backgrounds on sprites
- Strong silhouettes, limited palette per asset, exaggerated props
- Crisp pixel edges — no blur/anti-aliasing
- Thick dark outlines where useful

## Colour Palette
| Role | Colours |
|------|---------|
| Background | deep navy, blue-black, charcoal, dark indigo |
| Gold/Reward | #FFD700, #FFA500 |
| Magic/Pink | hot pink #FF69B4 |
| Shields/Ice | cyan #00FFFF |
| Poison | lime #AAFF00 |
| Fire | orange #FF6600 |
| Void | purple #8A2BE2 |
| Crit | white #FFFFFF |
| Mythic | full rainbow spectrum |

## Rarity Language
| Rarity | Beam | Shake | Hitstop | Sound | Haptic | Particles |
|--------|------|-------|---------|-------|--------|-----------|
| common | white pop | none | 25ms | rarity_common_pop | light | 20 |
| uncommon | green beam | none | 25ms | rarity_uncommon_pop | light | 40 |
| rare | blue vertical beam | small | 65ms | rarity_rare_bell | medium | 80 |
| epic | purple spiral | medium | 65ms | rarity_epic_bass | medium | 150 |
| legendary | gold beam + 0.4s slow-mo | heavy | 350ms | rarity_legendary_choir | heavy | 300 |
| mythic | rainbow beam, screen darken | mythic | 700ms | rarity_mythic_impact | heavy×2 | 700 (temp) |

## Animation Style
- Sprite-sheet based (frame atlas)
- Hero clips: idle (4f@5fps), walk (6f@9fps), basic_attack (4f@12fps), skill_cast (4f@10fps), ultimate_pose (6f@8fps), hit (2f@12fps), ko (4f@8fps), victory (4f@5fps)
- Motion primitives: bob, pulse, wobble, shake, floatUp, bounceOut, squashStretch, orbit, magnetToTarget, rarityShimmer
- State priority: ko > hit > ultimate > skill > attack > walk > idle
- Most flash = procedural VFX, not bespoke per-hero frames

## VFX Style
- Pooled pixel particle engine (Canvas/WebGL, NOT React state per particle)
- Particle caps: normal 350, boss death 500, legendary 600, mythic 700 temp, low-VFX 120
- Emitter library: hitSpark, coinBurst, gemScatter, explosion, poisonBubbles, freezeCrack, shieldBoing, goldBeam, rainbowMythicBurst, chestVolcano, capsuleCrack, upgradeCardSparkle, slashArc, projectileTrail, critPop
- Layer order: bg particles → ground telegraphs → characters → projectile trails → impact → damage numbers → loot drops → rarity beams → reward overlay → UI

## Mobile UI Principles
- 44px min touch targets (buttons 52–64px tall)
- Dark panels behind all text
- No hover-only info
- Body text 14–16px, button text 16px+
- Strong text shadow/outline over action
- Bottom nav: Run | Squad | Capsule | Gear | Progress
- Rarity always shown as: frame colour + icon glow + text label (never text-only)

## Core Gameplay Loop
1. Player taps **Enter Rift** from hub
2. 90-second auto-combat run begins
3. Squad auto-attacks enemies; player picks upgrade cards every ~20–30s
4. Mid-boss at 45s, final boss at 90s
5. Boss death → chest volcano → loot burst → reward summary
6. Player claims rewards → idle progress continues between runs
7. Idle gold/XP accumulates offline

## Capsule Machine Loop
1. Player opens Capsule screen
2. Views banner: featured heroes, pity meter, visible odds
3. Single pull OR 10-pull → physical animation sequence:
   - Currency insert → machine lights → lever → capsule drop → bounce → crack → colour leak → beam → silhouette → name slam
4. Duplicate → shard conversion → star meter fill
5. 10-pull: grid of capsules, low rarities pop fast, highest rarity gets full reveal

## Rift Run Loop
- 0s: portal, squad drops in
- 5s: first wave
- 20s: upgrade card choice (combat slows, 3 cards fly in, pick one, burst effect)
- 45s: mid-boss entrance sequence
- 55s: upgrade card choice
- 75s: pressure wave
- 90s: final boss
- End: death sequence → chest volcano → rarity reveal queue → reward summary

## Loot Burst Loop
- Enemy kill: death pop + 1–3 coins + magnet to counter
- Elite kill: flash + large loot pop + rare item hover + sparkle + magnet
- Boss chest: lands → shakes → beams leak → erupts → rewards arc → rare+ hover → spotlight reveal → cascade
- Reward claim: gold/XP/gear/shards/tokens fly to respective UI counters

## Hero/Squad/Gear/Pet/Mount Collection Loop
- Hero cards show portrait, rarity frame, stars, element, role, new marker
- Star-up: shards magnet → meter fills → star slams → victory bounce → stat roll
- Squad: 3→5 slots, assignment = jump animation, synergy badges live-update
- Gear: 6 slots (weapon/armor/charm/boots/relic/toy), equip = item arc → snap → hero flash
- Pets: idle + follow + combat/menu effect
- Mounts: appear in hub/profile/run intro-outro

## Monetisation Guardrails (HARD RULES)
- Visible odds always shown on capsule screen
- Visible pity counter always shown
- Visible duplicate conversion rates always shown
- No hidden rates, no fake scarcity, no misleading timers
- No forced ad after every run
- Optional rewarded ad for bonus chest / double offline (always skippable)
- Ethical: cosmetics, battle pass, ad removal, QoL, bundles ONLY

## What Must Never Be Lost
1. Rarity = beam colour + sound before text — never text-only reward
2. No grey placeholder boxes — every placeholder has candy-dark pixel art style
3. Data-driven everything — no entity IDs hardcoded in render logic
4. Particle engine on canvas/WebGL — never React state per particle
5. Mobile-first at 360px — always test at this width
6. Reduced-motion path exists for every shake/flash/parallax effect
7. VisualGallery must always exist and show all systems
8. Sound/haptic hooks exist even with no audio files present
9. Pity system must be visible and honest
10. Every screen has idle motion — nothing is ever fully static
