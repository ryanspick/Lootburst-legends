import { SCREEN_SHAKE, type ShakePresetKey } from '@/constants/animation'

interface ShakeState {
  intensityPx: number
  durationMs: number
  frequency: number
  elapsedMs: number
}

let _shake: ShakeState | null = null
let _reducedMotion = false

export function setReducedMotion(v: boolean) { _reducedMotion = v }

export function triggerShake(preset: ShakePresetKey) {
  if (_reducedMotion) return
  const config = SCREEN_SHAKE[preset]
  _shake = { ...config, elapsedMs: 0 }
}

export function updateShake(deltaMs: number): { dx: number; dy: number } {
  if (!_shake) return { dx: 0, dy: 0 }
  _shake.elapsedMs += deltaMs
  if (_shake.elapsedMs >= _shake.durationMs) { _shake = null; return { dx: 0, dy: 0 } }

  const progress = _shake.elapsedMs / _shake.durationMs
  const decay = 1 - progress
  const intensity = _shake.intensityPx * decay
  const t = _shake.elapsedMs / (1000 / _shake.frequency)
  const dx = Math.sin(t * Math.PI * 2.1) * intensity
  const dy = Math.cos(t * Math.PI * 1.7) * intensity * 0.6
  return { dx, dy }
}

export function isShaking(): boolean {
  return _shake !== null
}

// CSS class approach for shake (applied to app-shell)
export function getShakeStyle(): React.CSSProperties {
  const { dx, dy } = updateShake(0) // peek without advancing
  if (dx === 0 && dy === 0) return {}
  return { transform: `translate(${dx}px, ${dy}px)` }
}

// Shake hook for requestAnimationFrame loop
let _shakeCallbacks: ((dx: number, dy: number) => void)[] = []
export function onShakeUpdate(cb: (dx: number, dy: number) => void) {
  _shakeCallbacks.push(cb)
  return () => { _shakeCallbacks = _shakeCallbacks.filter(c => c !== cb) }
}

export function tickShake(deltaMs: number) {
  const { dx, dy } = updateShake(deltaMs)
  _shakeCallbacks.forEach(cb => cb(dx, dy))
}

import type React from 'react'
