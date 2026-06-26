import type { RarityRevealOptions } from '@/types/art'
import { RARITY_CONFIG } from '@/constants/rarity'
import { triggerShake } from '@/animation/screenShake'
import { triggerHitstop } from '@/animation/hitstop'
import { playSound } from '@/audio/soundEvents'
import { haptic } from '@/audio/haptics'
import {
  emitGoldBeam, emitRainbowMythicBurst, emitCoinBurst, emitGemScatter,
} from './emitters'

export async function playRarityReveal(opts: RarityRevealOptions): Promise<void> {
  const config = RARITY_CONFIG[opts.rarity]
  const pos = opts.position

  return new Promise(resolve => {
    // Sound and haptics immediately
    playSound(config.soundEvent)
    haptic(config.hapticEvent)

    // Hitstop
    triggerHitstop(config.hitstopMs)

    // Screen shake
    if (config.shakePreset !== 'none') {
      triggerShake(config.shakePreset as Parameters<typeof triggerShake>[0])
    }

    // Particles based on rarity
    switch (opts.rarity) {
      case 'uncommon':
        emitCoinBurst(pos, 8, 'uncommon'); break
      case 'rare':
        emitGemScatter(pos, 12, 'rare')
        emitGoldBeam(pos, 'rare'); break
      case 'epic':
        emitGemScatter(pos, 20, 'epic')
        emitGoldBeam(pos, 'epic'); break
      case 'legendary':
        emitGoldBeam(pos, 'legendary')
        emitCoinBurst(pos, 30, 'legendary'); break
      case 'mythic':
        emitRainbowMythicBurst(pos); break
    }

    setTimeout(() => {
      opts.onComplete?.()
      resolve()
    }, config.revealDurationMs)
  })
}
