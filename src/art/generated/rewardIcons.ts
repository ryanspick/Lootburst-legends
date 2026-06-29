import type { Rarity } from '@/constants/palette'
import { RARITY_COLOURS } from '@/constants/palette'
import { createPC, darken, glow, lighten, o, p, r, toDataURL } from './pixelCanvas'

export type RewardIconKind = 'gold' | 'gem' | 'shard' | 'xp' | 'loot'

const cache = new Map<string, string>()

export function generateRewardIcon(kind: RewardIconKind, rarity: Rarity = 'rare'): string {
  const key = `${kind}:${rarity}`
  const cached = cache.get(key)
  if (cached) return cached

  const { canvas, pc } = createPC(16, 16)
  const rc = RARITY_COLOURS[rarity]

  glow(pc, 2, 2, 12, 12, rc.glow, rarity === 'common' ? 3 : 8)

  switch (kind) {
    case 'gold':
      drawGold(pc)
      break
    case 'gem':
      drawGem(pc, rarity)
      break
    case 'shard':
      drawShard(pc, rarity)
      break
    case 'xp':
      drawXp(pc)
      break
    case 'loot':
      drawLoot(pc, rarity)
      break
  }

  if (rarity === 'legendary' || rarity === 'mythic') {
    sparkle(pc, 1, 2, rc.primary)
    sparkle(pc, 13, 3, '#ffffff')
    sparkle(pc, 2, 13, rc.primary)
  } else {
    p(pc, 2, 2, '#ffffff', 0.5)
    p(pc, 13, 12, rc.primary, 0.45)
  }

  const url = toDataURL(canvas)
  cache.set(key, url)
  return url
}

function sparkle(pc: ReturnType<typeof createPC>['pc'], x: number, y: number, color: string) {
  p(pc, x, y - 1, color, 0.75)
  p(pc, x - 1, y, color, 0.75)
  p(pc, x, y, '#ffffff')
  p(pc, x + 1, y, color, 0.75)
  p(pc, x, y + 1, color, 0.75)
}

function drawGold(pc: ReturnType<typeof createPC>['pc']) {
  const gold = '#ffd34a'
  const hot = '#fff2a8'
  const amber = '#ff9f1c'
  const edge = '#5a3100'

  r(pc, 3, 8, 10, 5, amber)
  o(pc, 3, 8, 10, 5, edge)
  r(pc, 4, 7, 10, 5, gold)
  o(pc, 4, 7, 10, 5, edge)
  r(pc, 2, 5, 10, 5, gold)
  o(pc, 2, 5, 10, 5, edge)
  r(pc, 4, 6, 5, 1, hot)
  p(pc, 7, 8, hot, 0.9)
  p(pc, 8, 7, hot, 0.8)
  sparkle(pc, 12, 4, '#fff6aa')
}

function drawGem(pc: ReturnType<typeof createPC>['pc'], rarity: Rarity) {
  const rc = RARITY_COLOURS[rarity]
  const body = rarity === 'common' ? '#cfe8ff' : rc.primary
  const hi = lighten(body, 70)
  const low = darken(body, 45)
  const edge = '#111122'

  r(pc, 5, 2, 6, 2, hi)
  r(pc, 3, 4, 10, 2, body)
  r(pc, 4, 6, 8, 2, body)
  r(pc, 5, 8, 6, 2, low)
  r(pc, 6, 10, 4, 2, low)
  r(pc, 7, 12, 2, 1, darken(low, 30))
  p(pc, 4, 3, edge); p(pc, 11, 3, edge)
  p(pc, 3, 4, edge); p(pc, 12, 4, edge)
  p(pc, 4, 8, edge); p(pc, 11, 8, edge)
  p(pc, 5, 10, edge); p(pc, 10, 10, edge)
  p(pc, 7, 13, edge); p(pc, 8, 13, edge)
  r(pc, 6, 4, 2, 6, '#ffffff', 0.30)
  p(pc, 5, 3, '#ffffff', 0.85)
}

function drawShard(pc: ReturnType<typeof createPC>['pc'], rarity: Rarity) {
  const rc = RARITY_COLOURS[rarity]
  const core = rarity === 'common' ? '#68d8ff' : rc.primary
  const edge = '#14142e'

  r(pc, 7, 1, 3, 12, core)
  r(pc, 5, 4, 3, 9, darken(core, 28))
  r(pc, 9, 5, 3, 7, lighten(core, 22))
  p(pc, 8, 0, lighten(core, 72))
  p(pc, 6, 2, edge); p(pc, 10, 2, edge)
  p(pc, 5, 4, edge); p(pc, 12, 5, edge)
  p(pc, 4, 10, edge); p(pc, 11, 12, edge)
  r(pc, 3, 12, 10, 2, '#000000', 0.22)
  r(pc, 7, 4, 1, 7, '#ffffff', 0.35)
  sparkle(pc, 12, 3, lighten(core, 70))
}

function drawXp(pc: ReturnType<typeof createPC>['pc']) {
  const cyan = '#4de8ff'
  const blue = '#2276ff'
  const white = '#ffffff'
  const edge = '#08152d'

  p(pc, 8, 1, white); p(pc, 8, 2, cyan)
  p(pc, 7, 3, cyan); p(pc, 9, 3, cyan)
  r(pc, 6, 4, 5, 2, white)
  r(pc, 4, 6, 9, 2, cyan)
  r(pc, 6, 8, 5, 2, blue)
  p(pc, 5, 9, blue); p(pc, 11, 9, blue)
  p(pc, 4, 10, blue); p(pc, 12, 10, blue)
  p(pc, 8, 10, cyan)
  p(pc, 8, 11, white)
  p(pc, 2, 7, edge); p(pc, 13, 7, edge); p(pc, 8, 13, edge)
  sparkle(pc, 3, 3, '#ffee66')
  sparkle(pc, 13, 4, '#9ff7ff')
}

function drawLoot(pc: ReturnType<typeof createPC>['pc'], rarity: Rarity) {
  const rc = RARITY_COLOURS[rarity]
  const wood = '#9b6234'
  const dark = '#432404'

  r(pc, 3, 6, 10, 7, wood)
  o(pc, 3, 6, 10, 7, dark)
  r(pc, 2, 4, 12, 4, lighten(wood, 28))
  o(pc, 2, 4, 12, 4, dark)
  r(pc, 4, 7, 8, 2, rc.primary, 0.82)
  r(pc, 7, 4, 2, 9, rc.primary)
  r(pc, 6, 7, 4, 3, '#fff2aa', 0.45)
  r(pc, 4, 3, 8, 2, rc.glow, 0.45)
  sparkle(pc, 5, 2, rc.primary)
  sparkle(pc, 11, 3, '#ffffff')
}
