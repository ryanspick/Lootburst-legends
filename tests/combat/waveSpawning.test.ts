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
import {
  ENDLESS_MAX_COUNT,
  getEndlessDifficultyMultiplier,
  getEndlessWaveEntry,
  getTimelineForZone,
} from '@/game/rift/waveDirector'

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

  it('builds endless waves after scripted wave 7 with rising mob counts', () => {
    const first = getEndlessWaveEntry(1)
    const second = getEndlessWaveEntry(2)
    const third = getEndlessWaveEntry(3)
    const late = getEndlessWaveEntry(99)

    expect(first.wave).toBe(8)
    expect(second.wave).toBe(9)
    expect(second.count).toBeGreaterThan(first.count)
    expect(third.count - second.count).toBeGreaterThanOrEqual(second.count - first.count)
    expect(late.count).toBe(ENDLESS_MAX_COUNT)
    expect(getEndlessDifficultyMultiplier(2, 3)).toBeGreaterThan(2)
  })

  it('ramps endless difficulty with increasing compound pressure', () => {
    const wave1 = getEndlessDifficultyMultiplier(2, 1)
    const wave2 = getEndlessDifficultyMultiplier(wave1, 2)
    const wave3 = getEndlessDifficultyMultiplier(wave2, 3)
    const wave8 = Array.from({ length: 5 }, (_, i) => i + 4)
      .reduce((diff, wave) => getEndlessDifficultyMultiplier(diff, wave), wave3)

    expect(wave2 / wave1).toBeGreaterThan(wave1 / 2)
    expect(wave3 / wave2).toBeGreaterThan(wave2 / wave1)
    expect(wave8).toBeGreaterThan(2 * 5)
  })

  it('makes endless pressure jump hard before deep waves', () => {
    const wave1 = getEndlessWaveEntry(1)
    const wave5 = getEndlessWaveEntry(5)
    const wave10 = getEndlessWaveEntry(10)
    const diff5 = Array.from({ length: 5 }, (_, i) => i + 1)
      .reduce((diff, wave) => getEndlessDifficultyMultiplier(diff, wave), 2)

    expect(wave1.count).toBeGreaterThanOrEqual(40)
    expect(wave5.count).toBeGreaterThan(wave1.count * 2)
    expect(wave10.count).toBeGreaterThan(wave5.count)
    expect(diff5).toBeGreaterThan(9)
  })
})
