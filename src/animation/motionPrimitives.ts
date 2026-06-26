import { MOTION } from '@/constants/animation'

export function bob(timeMs: number, amplitude: number = MOTION.bobAmplitudePx, speedMs: number = MOTION.bobSpeedMs): number {
  return Math.sin((timeMs / speedMs) * Math.PI * 2) * amplitude
}

export function pulse(timeMs: number, min: number = MOTION.pulseMin, max: number = MOTION.pulseMax, speedMs: number = MOTION.pulseSpeedMs): number {
  const t = (Math.sin((timeMs / speedMs) * Math.PI * 2) + 1) / 2
  return min + (max - min) * t
}

export function wobble(timeMs: number, amplitude: number = 6, speedMs: number = 300): number {
  return Math.sin((timeMs / speedMs) * Math.PI * 2) * amplitude * Math.exp(-timeMs / 500)
}

export function floatUp(progressNormalized: number, distancePx = 40): number {
  return -distancePx * progressNormalized
}

export function bounceOut(progressNormalized: number): number {
  const n1 = 7.5625, d1 = 2.75
  let t = progressNormalized
  if (t < 1 / d1) return n1 * t * t
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
  return n1 * (t -= 2.625 / d1) * t + 0.984375
}

export function squashStretch(progressNormalized: number, intensity = 0.3): { scaleX: number; scaleY: number } {
  const squeeze = Math.sin(progressNormalized * Math.PI) * intensity
  return { scaleX: 1 - squeeze * 0.5, scaleY: 1 + squeeze }
}

export function orbit(timeMs: number, radiusPx: number, speedMs: number): { x: number; y: number } {
  const angle = (timeMs / speedMs) * Math.PI * 2
  return { x: Math.cos(angle) * radiusPx, y: Math.sin(angle) * radiusPx }
}

export function magnetToTarget(
  current: { x: number; y: number },
  target: { x: number; y: number },
  speedFactor = 0.12,
): { x: number; y: number } {
  return {
    x: current.x + (target.x - current.x) * speedFactor,
    y: current.y + (target.y - current.y) * speedFactor,
  }
}

export function rarityShimmer(timeMs: number, speedMs = MOTION.shimmerSpeedMs): number {
  return ((timeMs % speedMs) / speedMs)
}

// Easing helpers
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}
