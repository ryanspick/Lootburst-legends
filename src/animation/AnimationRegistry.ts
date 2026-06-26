import type { AnimationClipDefinition } from '@/types/art'
import { CLIP_FPS, CLIP_FRAMES, CLIP_LOOPS } from '@/constants/animation'
import type { ClipName } from '@/constants/animation'

const ROW_MAP: Record<ClipName, number> = {
  idle:          0,
  walk:          1,
  basic_attack:  2,
  skill_cast:    3,
  ultimate_pose: 4,
  hit:           5,
  ko:            6,
  victory:       7,
}

// Builds a clip definition from a sprite sheet url + clip name.
// Sprite sheet rows follow ROW_MAP above.
export function buildClip(
  entityId: string,
  clipName: ClipName,
  spriteSheetFile: string,
  spriteW: number,
  spriteH: number,
  row?: number,
): AnimationClipDefinition {
  const sheetRow = row ?? (ROW_MAP[clipName] ?? 0)
  return {
    id: `${entityId}_${clipName}`,
    assetId: entityId,
    file: spriteSheetFile,
    frameWidth: spriteW,
    frameHeight: spriteH,
    frameCount: CLIP_FRAMES[clipName],
    fps: CLIP_FPS[clipName],
    loop: CLIP_LOOPS[clipName],
    anchorX: 0,
    anchorY: sheetRow * spriteH,
  }
}

// Fallback single-frame clip for entities without a real sprite sheet
export function buildPlaceholderClip(
  entityId: string,
  clipName: ClipName,
  spriteW = 48,
  spriteH = 48,
): AnimationClipDefinition {
  return {
    id: `${entityId}_${clipName}_placeholder`,
    assetId: entityId,
    file: '',
    frameWidth: spriteW,
    frameHeight: spriteH,
    frameCount: 1,
    fps: CLIP_FPS[clipName],
    loop: CLIP_LOOPS[clipName],
  }
}

const _cache = new Map<string, AnimationClipDefinition>()

export function getCachedClip(
  entityId: string,
  clipName: ClipName,
  spriteSheetFile: string,
  spriteW: number,
  spriteH: number,
): AnimationClipDefinition {
  const key = `${entityId}:${clipName}`
  if (!_cache.has(key)) {
    _cache.set(key, buildClip(entityId, clipName, spriteSheetFile, spriteW, spriteH))
  }
  return _cache.get(key)!
}
