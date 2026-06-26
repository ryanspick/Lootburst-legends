import type { AnimationClipDefinition } from '@/types/art'
import { CLIP_FPS, CLIP_FRAMES, CLIP_LOOPS } from '@/constants/animation'

type FrameEventCallback = (eventName: string, frame: number) => void

export class Animator {
  private clip: AnimationClipDefinition | null = null
  private frameIndex = 0
  private elapsedMs = 0
  private flipX = false
  private speedMultiplier = 1
  private callbacks: FrameEventCallback[] = []
  private done = false

  play(clip: AnimationClipDefinition) {
    this.clip = clip
    this.frameIndex = 0
    this.elapsedMs = 0
    this.done = false
  }

  playOnce(clip: AnimationClipDefinition, onComplete?: () => void) {
    this.play(clip)
    if (onComplete) {
      const cb: FrameEventCallback = (ev) => {
        if (ev === '__complete__') {
          onComplete()
          this.callbacks = this.callbacks.filter(c => c !== cb)
        }
      }
      this.callbacks.push(cb)
    }
  }

  update(deltaMs: number) {
    if (!this.clip || this.done) return
    const msPerFrame = 1000 / (this.clip.fps * this.speedMultiplier)
    this.elapsedMs += deltaMs

    while (this.elapsedMs >= msPerFrame) {
      this.elapsedMs -= msPerFrame
      const prevFrame = this.frameIndex

      // Fire frame events
      if (this.clip.eventFrames?.[prevFrame]) {
        const ev = this.clip.eventFrames[prevFrame]
        this.callbacks.forEach(cb => cb(ev, prevFrame))
      }

      this.frameIndex++

      if (this.frameIndex >= this.clip.frameCount) {
        if (this.clip.loop) {
          this.frameIndex = 0
        } else if (this.clip.pingPong) {
          this.frameIndex = this.clip.frameCount - 2
        } else {
          this.frameIndex = this.clip.frameCount - 1
          this.done = true
          this.callbacks.forEach(cb => cb('__complete__', this.frameIndex))
        }
      }
    }
  }

  getFrameRect(): { x: number; y: number; w: number; h: number } {
    if (!this.clip) return { x: 0, y: 0, w: 64, h: 64 }
    return {
      x: this.frameIndex * this.clip.frameWidth,
      y: 0,
      w: this.clip.frameWidth,
      h: this.clip.frameHeight,
    }
  }

  onFrameEvent(cb: FrameEventCallback) {
    this.callbacks.push(cb)
  }

  setFlipX(flip: boolean) { this.flipX = flip }
  getFlipX() { return this.flipX }

  setSpeed(multiplier: number) { this.speedMultiplier = Math.max(0.1, multiplier) }

  isDone() { return this.done }

  getCurrentFrame() { return this.frameIndex }
}

// Factory: build clip definition from known hero clip names
export function makeHeroClip(assetId: string, clipName: keyof typeof CLIP_FPS): AnimationClipDefinition {
  return {
    id: `${assetId}.${clipName}`,
    assetId,
    file: '', // resolved by assetLoader
    frameWidth: 64,
    frameHeight: 64,
    frameCount: CLIP_FRAMES[clipName],
    fps: CLIP_FPS[clipName],
    loop: CLIP_LOOPS[clipName],
    eventFrames: clipName === 'basic_attack' ? { 2: 'impact' }
      : clipName === 'skill_cast'   ? { 2: 'cast' }
      : clipName === 'ultimate_pose'? { 3: 'ultimateRelease' }
      : undefined,
  }
}
