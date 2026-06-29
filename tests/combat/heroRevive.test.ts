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

import { CENTER_X, CENTER_Y } from '@/game/rift/arenaConstants'
import {
  createInitialRiftState,
  HERO_REVIVE_MS,
  spawnWave,
  tickCombat,
} from '@/game/rift/riftRunState'

describe('Hero auto-revive', () => {
  it('starts a 30s revive charge when a hero is downed', () => {
    const { state } = createInitialRiftState(['hero_copper_knight', 'hero_mushroom_medic'])
    state.phase = 'combat'

    spawnWave(state, 1, 1)
    tickCombat(state, 16)

    const hero = state.heroes[1]
    const enemy = state.enemies[0]
    hero.hp = 1
    enemy.x = CENTER_X
    enemy.y = CENTER_Y
    enemy.hitstunMs = 0
    enemy.atk = hero.maxHp * 10

    tickCombat(state, 16)

    expect(hero.alive).toBe(false)
    expect(hero.hp).toBe(0)
    expect(hero.reviveMs).toBe(HERO_REVIVE_MS)
    expect(hero.reviveTotalMs).toBe(HERO_REVIVE_MS)
    expect(state.phase).toBe('combat')
    expect(state.postRun).toBeNull()
  })

  it('revives a downed hero at half HP when the charge completes', () => {
    const { state } = createInitialRiftState(['hero_copper_knight', 'hero_mushroom_medic'])
    state.phase = 'combat'

    const hero = state.heroes[0]
    hero.alive = false
    hero.hp = 0
    hero.deathAnimMs = 0
    hero.reviveMs = HERO_REVIVE_MS
    hero.reviveTotalMs = HERO_REVIVE_MS

    tickCombat(state, HERO_REVIVE_MS - 1)
    expect(hero.alive).toBe(false)
    expect(hero.reviveMs).toBe(1)
    expect(state.phase).toBe('combat')

    tickCombat(state, 1)

    expect(hero.alive).toBe(true)
    expect(hero.hp).toBe(Math.round(hero.maxHp * 0.5))
    expect(hero.reviveMs).toBe(0)
    expect(state.postRun).toBeNull()
  })

  it('ends the run immediately when the full squad is down even if revive timers exist', () => {
    const { state } = createInitialRiftState([
      'hero_copper_knight',
      'hero_mushroom_medic',
      'hero_goblin_sparkshot',
    ])
    state.phase = 'combat'

    for (const hero of state.heroes) {
      hero.alive = false
      hero.hp = 0
      hero.deathAnimMs = 0
      hero.reviveMs = HERO_REVIVE_MS
      hero.reviveTotalMs = HERO_REVIVE_MS
    }

    tickCombat(state, 5_000)

    expect(state.phase).toBe('post_run')
    expect(state.postRun?.wasWipe).toBe(true)
    expect(state.heroes.every(h => !h.alive)).toBe(true)
    expect(state.heroes.every(h => (h.reviveMs ?? 0) === HERO_REVIVE_MS)).toBe(true)
  })
})
