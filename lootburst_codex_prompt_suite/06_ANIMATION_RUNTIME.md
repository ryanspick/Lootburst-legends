# Animation Runtime

Implement a reusable sprite-sheet animation runtime.

Types:
```ts
type AnimationClipDefinition = {
  id: string;
  assetId: string;
  file: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  fps: number;
  loop: boolean;
  pingPong?: boolean;
  anchorX?: number;
  anchorY?: number;
  scale?: number;
  eventFrames?: Record<number,string>;
  nextClip?: string;
};
```

Animator API:
```ts
play(clipId)
playOnce(clipId, nextClip?)
update(deltaMs)
getFrameRect()
onFrameEvent(callback)
setFlipX(boolean)
setSpeed(multiplier)
```

Required hero clips:
- idle: 4 frames @ 5 fps.
- walk: 6 frames @ 9 fps.
- basic_attack: 4 frames @ 12 fps, event frame impact.
- skill_cast: 4 frames @ 10 fps, event frame cast.
- ultimate_pose: 6 frames @ 8 fps, event frame ultimateRelease.
- hit: 2 frames @ 12 fps.
- ko: 4 frames @ 8 fps non-loop.
- victory: 4 frames @ 5 fps.

State priority: ko > hit > ultimate > skill > attack > walk > idle.

Add motion primitives: bob, pulse, wobble, shake, floatUp, bounceOut, squashStretch, orbit, magnetToTarget, rarityShimmer.

Add hitstop: normal hit 25ms, crit 65ms, boss death 200ms, legendary 350ms, mythic 700ms.

Add screen shake presets: smallHit, crit, heavySkill, bossAttack, bossDeath, legendary, mythic. Clamp intensity and respect reduced motion.

Codex operating rules:
- Work in the existing repo. Inspect package.json, src structure, current render stack, state management, and asset folders before editing.
- Preserve existing gameplay and data unless this file explicitly says to change presentation behaviour.
- Prefer isolated modules, data-driven configs, reusable components, and small integration adapters.
- Do not create static grey boxes. Every placeholder must already look like deliberate candy-dark pixel art.
- Do not hardcode a single hero, item, or boss into rendering logic. Use manifests and metadata.
- Every feature must have a visible result in-game or in a Visual Gallery/debug screen.
- Mobile readability beats decoration when the two conflict.
- Add reduced-motion and low-VFX paths for heavy shake, flashing, particles, and parallax.
