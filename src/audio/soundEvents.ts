const SOUND_PATHS: Record<string, string> = {
  // Combat
  combat_sword_tick:        '/assets/audio/combat/sword-tick.mp3',
  combat_crit_snap:         '/assets/audio/combat/crit-snap.mp3',
  combat_projectile_whoosh: '/assets/audio/combat/projectile-whoosh.mp3',
  combat_spell_sparkle:     '/assets/audio/combat/spell-sparkle.mp3',
  combat_shield_boing:      '/assets/audio/combat/shield-boing.mp3',
  combat_fire_burst:        '/assets/audio/combat/fire-burst.mp3',
  combat_poison_bubble:     '/assets/audio/combat/poison-bubble.mp3',
  combat_freeze_crack:      '/assets/audio/combat/freeze-crack.mp3',
  combat_coin_ping:         '/assets/audio/combat/coin-ping.mp3',
  combat_boss_death_boom:   '/assets/audio/combat/boss-death-boom.mp3',
  // Reward
  reward_chest_rattle:      '/assets/audio/reward/chest-rattle.mp3',
  reward_chest_crack:       '/assets/audio/reward/chest-crack.mp3',
  reward_chest_volcano:     '/assets/audio/reward/chest-volcano.mp3',
  reward_capsule_spin:      '/assets/audio/reward/capsule-spin.mp3',
  reward_rarity_beam:       '/assets/audio/reward/rarity-beam.mp3',
  reward_gem_scatter:       '/assets/audio/reward/gem-scatter.mp3',
  reward_star_up_slam:      '/assets/audio/reward/star-up-slam.mp3',
  reward_gear_equip_clink:  '/assets/audio/reward/gear-equip-clink.mp3',
  reward_level_up_flourish: '/assets/audio/reward/level-up-flourish.mp3',
  // UI
  ui_hover_tick:            '/assets/audio/ui/hover-tick.mp3',
  ui_button_pop:            '/assets/audio/ui/button-pop.mp3',
  ui_tab_slide:             '/assets/audio/ui/tab-slide.mp3',
  ui_upgrade_card_flip:     '/assets/audio/ui/upgrade-card-flip.mp3',
  ui_claim_sweep:           '/assets/audio/ui/claim-sweep.mp3',
  ui_pull_button_charge:    '/assets/audio/ui/pull-button-charge.mp3',
  // Rarity
  rarity_common_pop:        '/assets/audio/rarity/common-pop.mp3',
  rarity_uncommon_pop:      '/assets/audio/rarity/uncommon-pop.mp3',
  rarity_rare_bell:         '/assets/audio/rarity/rare-bell.mp3',
  rarity_epic_bass:         '/assets/audio/rarity/epic-bass.mp3',
  rarity_legendary_choir:   '/assets/audio/rarity/legendary-choir.mp3',
  rarity_mythic_impact:     '/assets/audio/rarity/mythic-impact.mp3',
}

const _audioCache: Map<string, HTMLAudioElement> = new Map()
const _rateLimits: Map<string, number> = new Map()
const RATE_LIMIT_MS = 80

let _muted = false
let _volume = 0.7

export function setMuted(v: boolean) { _muted = v }
export function setVolume(v: number) { _volume = Math.max(0, Math.min(1, v)) }

const HIGH_RARITY_EVENTS = new Set([
  'rarity_legendary_choir', 'rarity_mythic_impact',
  'reward_chest_volcano', 'combat_boss_death_boom',
])

export function playSound(eventName: string, options?: { volume?: number; loop?: boolean }) {
  if (_muted && !HIGH_RARITY_EVENTS.has(eventName)) return

  const now = Date.now()
  const last = _rateLimits.get(eventName) ?? 0
  if (now - last < RATE_LIMIT_MS && !HIGH_RARITY_EVENTS.has(eventName)) return
  _rateLimits.set(eventName, now)

  const path = SOUND_PATHS[eventName]
  if (!path) {
    if (import.meta.env.DEV) console.warn(`[Sound] No path for: ${eventName}`)
    return
  }

  try {
    let audio = _audioCache.get(path)
    if (!audio) {
      audio = new Audio(path)
      _audioCache.set(path, audio)
    }
    const instance = audio.cloneNode() as HTMLAudioElement
    instance.volume = options?.volume ?? _volume
    instance.loop = options?.loop ?? false
    instance.play().catch(() => {
      // Graceful fail — audio not loaded or autoplay blocked
    })
  } catch {
    // No-op — audio unavailable
  }
}

export function getAllSoundEvents(): string[] {
  return Object.keys(SOUND_PATHS)
}
