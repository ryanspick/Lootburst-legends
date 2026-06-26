// Shared idle motion system. All screens use these to stay "never dead".
// All functions are pure — call in a rAF loop with the current timestamp.

import { bob, pulse, wobble } from './motionPrimitives'

// ─── Per-entity bob offsets ────────────────────────────────────────────────────

export function heroIdleBob(timeMs: number, slotIndex: number): number {
  return bob(timeMs + slotIndex * 400, 5, 2000)
}

export function petIdleBob(timeMs: number, index: number): number {
  return bob(timeMs + index * 600, 3, 1800)
}

export function iconBob(timeMs: number, offset = 0): number {
  return bob(timeMs + offset, 2, 2200)
}

// ─── Glint timer ──────────────────────────────────────────────────────────────

/** Returns 0..1 glint intensity — spikes briefly every ~4s per item */
export function glintProgress(timeMs: number, seed: number, intervalMs = 4000, durationMs = 600): number {
  const phase = (timeMs + seed * 1337) % intervalMs
  if (phase < durationMs) {
    return Math.sin((phase / durationMs) * Math.PI)
  }
  return 0
}

// ─── Menu idle sparkle emitter timer ─────────────────────────────────────────

/** Returns true on the frame a sparkle should fire. Call in rAF. */
export function shouldSparkle(timeMs: number, lastSparkleMs: number, intervalMs = 800): boolean {
  return timeMs - lastSparkleMs >= intervalMs
}

// ─── Currency icon pulse ──────────────────────────────────────────────────────

export function currencyPulse(timeMs: number, offset = 0): number {
  return pulse(timeMs + offset, 0.96, 1.04, 1600)
}

// ─── Card hover wobble ────────────────────────────────────────────────────────

export function cardWobble(timeMs: number, hoverStartMs: number): number {
  return wobble(timeMs - hoverStartMs, 4, 280)
}

// ─── Parallax drift for background elements ───────────────────────────────────

export function parallaxDrift(timeMs: number, speedFactor: number, width: number): number {
  return ((timeMs * speedFactor * 0.001) % width)
}

// ─── Hub chest pulse ─────────────────────────────────────────────────────────

export function chestPulse(timeMs: number): number {
  return pulse(timeMs + 500, 0.97, 1.03, 2500)
}

// ─── Idle shimmer alpha for rarity frames ─────────────────────────────────────

export function rarityShimmerAlpha(timeMs: number, seed: number): number {
  return 0.3 + 0.5 * ((Math.sin((timeMs / 2000 + seed) * Math.PI * 2) + 1) / 2)
}

// ─── Pet wander (returns x/y offset in px) ───────────────────────────────────

export function petWander(timeMs: number, index: number): { x: number; y: number } {
  const t = timeMs / 1000
  return {
    x: Math.sin(t * 0.4 + index * 2.1) * 8,
    y: Math.cos(t * 0.3 + index * 1.7) * 4,
  }
}

// ─── Star meter fill shimmer ──────────────────────────────────────────────────

export function starFillBrightness(timeMs: number, starIndex: number): number {
  return 0.7 + 0.3 * Math.abs(Math.sin((timeMs / 1200 + starIndex * 0.4) * Math.PI))
}

// ─── Screen drift for hub hero silhouettes ────────────────────────────────────

export function heroSilhouetteDrift(timeMs: number, slotIndex: number): number {
  return Math.sin((timeMs / 3000) + slotIndex * 1.1) * 2
}
