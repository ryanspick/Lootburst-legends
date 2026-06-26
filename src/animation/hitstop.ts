import { HITSTOP_MS } from '@/constants/animation'

let _hitstopRemainingMs = 0
let _onResume: (() => void) | null = null

export function triggerHitstop(durationMs: number, onResume?: () => void) {
  _hitstopRemainingMs = Math.max(_hitstopRemainingMs, durationMs)
  if (onResume) _onResume = onResume
}

export function updateHitstop(deltaMs: number): boolean {
  if (_hitstopRemainingMs <= 0) return false
  _hitstopRemainingMs -= deltaMs
  if (_hitstopRemainingMs <= 0) {
    _hitstopRemainingMs = 0
    _onResume?.()
    _onResume = null
  }
  return true
}

export function isHitstopActive(): boolean {
  return _hitstopRemainingMs > 0
}

export const hitstop = {
  normalHit:  () => triggerHitstop(HITSTOP_MS.normalHit),
  crit:       () => triggerHitstop(HITSTOP_MS.crit),
  bossDeath:  (cb?: () => void) => triggerHitstop(HITSTOP_MS.bossDeath, cb),
  legendary:  (cb?: () => void) => triggerHitstop(HITSTOP_MS.legendary, cb),
  mythic:     (cb?: () => void) => triggerHitstop(HITSTOP_MS.mythic, cb),
}
