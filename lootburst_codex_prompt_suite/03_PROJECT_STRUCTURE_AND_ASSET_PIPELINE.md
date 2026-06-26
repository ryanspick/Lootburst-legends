# Project Structure and Asset Pipeline

Create a scalable asset pipeline. Final art can be AI-generated, but development must work with stylish procedural placeholders.

Required asset tree:
```txt
public/assets/pixel/heroes/{common,uncommon,rare,epic,legendary,mythic}/
public/assets/pixel/enemies/
public/assets/pixel/bosses/
public/assets/pixel/gear/{weapons,armor,charms,boots,relics,toys}/
public/assets/pixel/pets/
public/assets/pixel/mounts/
public/assets/pixel/cosmetics/{skins,trails,frames,chest-openings,death-effects,ultimate-effects}/
public/assets/pixel/ui/{panels,buttons,frames,capsule-machine,currencies}/
public/assets/pixel/vfx/{combat,loot,rarity,capsule,ui}/
public/assets/pixel/backgrounds/{hub,rifts,zones}/
public/assets/pixel/generated-placeholders/
```

Required metadata files:
```txt
src/data/art/heroes.visual.json
src/data/art/enemies.visual.json
src/data/art/bosses.visual.json
src/data/art/gear.visual.json
src/data/art/pets.visual.json
src/data/art/mounts.visual.json
src/data/art/zones.visual.json
src/data/art/vfx.visual.json
src/data/art/animations.visual.json
src/data/art/rarity.visual.json
```

Naming:
- IDs: snake_case, stable, no spaces: hero_copper_knight.
- Files: kebab-case: hero-common-copper-knight-idle.png.
- Clip IDs: assetId.clipName: hero_copper_knight.basic_attack.

Asset loader API:
```ts
getAsset(id)
getSpriteClip(assetId, clip)
getIcon(assetId)
getRarityFrame(rarity)
getPlaceholder(assetId)
```

Fallback rule: missing files must not break the game. Use deterministic placeholder art, log only in dev, and mark missing items in VisualGallery.

Add scripts:
```txt
npm run art:placeholders
npm run validate:visuals
npm run export:asset-prompts
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
