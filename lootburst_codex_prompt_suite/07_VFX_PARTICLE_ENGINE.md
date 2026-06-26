# VFX Particle Engine

Implement a pooled particle engine. Most production value should come from reusable VFX, not bespoke hero animations.

Particle fields:
```ts
id,x,y,vx,vy,ax,ay,rotation,rotationSpeed,ageMs,lifetimeMs,startScale,endScale,startAlpha,endAlpha,color,colors,spriteId,shape,gravity,blendMode,zIndex
```

Emitters to implement:
```ts
emitCoinBurst(position, amount, rarity?)
emitGemScatter(position, amount, rarity?)
emitHitSpark(position, element)
emitCritPop(position)
emitSlashArc(start,end,element)
emitProjectileTrail(position,element)
emitExplosion(position,size,element)
emitPoisonBubbles(position)
emitFreezeCrack(position)
emitShieldBoing(position)
emitGoldBeam(position,rarity)
emitRainbowMythicBurst(position)
emitChestVolcano(position,lootCount)
emitCapsuleCrack(position,rarity)
emitUpgradeCardSparkle(cardRect,rarity)
```

Layering:
1. background particles.
2. ground telegraphs.
3. characters/enemies.
4. projectile trails.
5. impact particles.
6. damage numbers.
7. loot drops.
8. rarity beams.
9. reward overlay.
10. UI.

Performance:
- normal combat cap: 350 particles.
- boss death cap: 500.
- legendary cap: 600.
- mythic cap: 700 temporary.
- low-performance mode: 120.
- Pool objects. Avoid React per-particle state updates.

Codex operating rules:
- Work in the existing repo. Inspect package.json, src structure, current render stack, state management, and asset folders before editing.
- Preserve existing gameplay and data unless this file explicitly says to change presentation behaviour.
- Prefer isolated modules, data-driven configs, reusable components, and small integration adapters.
- Do not create static grey boxes. Every placeholder must already look like deliberate candy-dark pixel art.
- Do not hardcode a single hero, item, or boss into rendering logic. Use manifests and metadata.
- Every feature must have a visible result in-game or in a Visual Gallery/debug screen.
- Mobile readability beats decoration when the two conflict.
- Add reduced-motion and low-VFX paths for heavy shake, flashing, particles, and parallax.
