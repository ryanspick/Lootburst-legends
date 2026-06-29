import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/vfx/emitters', () => ({
  emitHitSpark: vi.fn(),
  emitCritPop: vi.fn(),
  emitCoinBurst: vi.fn(),
  emitGoldBeam: vi.fn(),
  emitExplosion: vi.fn(),
}))
vi.mock('@/animation/hitstop', () => ({ triggerHitstop: vi.fn() }))
vi.mock('@/animation/screenShake', () => ({ triggerShake: vi.fn(), setReducedMotion: vi.fn() }))
vi.mock('@/art/generated', () => ({ getGeneratedSprite: vi.fn(() => null) }))
vi.mock('@/audio/soundEvents', () => ({ playSound: vi.fn() }))
vi.mock('@/audio/haptics', () => ({ haptic: vi.fn() }))

beforeEach(() => {
  Math.random = () => 0.5
})

import {
  createInitialRiftState,
  hasWaveMobsRemaining,
  spawnWave,
  tickCombat,
} from '@/game/rift/riftRunState'
import { getTimelineForZone } from '@/game/rift/waveDirector'

const THREE_HEROES = ['hero_copper_knight', 'hero_mushroom_medic', 'hero_goblin_sparkshot']

describe('Wave spawning regressions', () => {
  it('counts pending spawns as active wave mobs before the first batch appears', () => {
    const { state } = createInitialRiftState(THREE_HEROES)
    state.phase = 'combat'

    spawnWave(state, 1, 3)

    expect(state.waveIndex).toBe(1)
    expect(state.enemies).toHaveLength(0)
    expect(state.pendingSpawns).toHaveLength(3)
    expect(hasWaveMobsRemaining(state)).toBe(true)
  })

  it('drains the first spawn batch on the next combat tick', () => {
    const { state } = createInitialRiftState(THREE_HEROES)
    state.phase = 'combat'

    spawnWave(state, 1, 3)
    tickCombat(state, 16)

    expect(state.enemies.length).toBeGreaterThan(0)
    expect(state.pendingSpawns).toHaveLength(0)
    expect(hasWaveMobsRemaining(state)).toBe(true)
  })

  it('keeps each zone wave roster ordered for the screen wave queue', () => {
    const waveNumbers = getTimelineForZone('candy_cavern_rift')
      .filter(event => event.type === 'wave_spawn')
      .map(event => event.data?.wave)

    expect(waveNumbers).toEqual([1, 2, 3, 4, 5, 6, 7])
  })
})
