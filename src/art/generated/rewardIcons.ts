import type { Rarity } from '@/constants/palette'
import { RARITY_COLOURS } from '@/constants/palette'
import { addSpriteShading, createPC, darken, glow, lighten, p, r, tmpl, toDataURL } from './pixelCanvas'

export type RewardIconKind = 'gold' | 'gem' | 'shard' | 'xp' | 'loot'

type PixelContext = ReturnType<typeof createPC>['pc']

const cache = new Map<string, string>()

export function generateRewardIcon(kind: RewardIconKind, rarity: Rarity = 'rare'): string {
  const key = `${kind}:${rarity}`
  const cached = cache.get(key)
  if (cached) return cached

  const { canvas, pc } = createPC(24, 24)
  const rc = RARITY_COLOURS[rarity]

  drawRewardAura(pc, rc.primary, rc.glow, rarity)

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
      drawXp(pc, rarity)
      break
    case 'loot':
      drawLoot(pc, rarity)
      break
  }

  drawPrizeGlints(pc, rc.primary, rarity)
  addSpriteShading(pc, kindAccent(kind, rarity))

  const url = toDataURL(canvas)
  cache.set(key, url)
  return url
}

function kindAccent(kind: RewardIconKind, rarity: Rarity): string {
  if (kind === 'gold') return '#ffd700'
  if (kind === 'gem') return RARITY_COLOURS[rarity].primary
  if (kind === 'shard') return '#d8b4fe'
  if (kind === 'xp') return '#44ccff'
  return RARITY_COLOURS[rarity].primary
}

function drawRewardAura(pc: PixelContext, primary: string, glowColor: string, rarity: Rarity) {
  const strength = rarity === 'common' ? 3 : rarity === 'uncommon' ? 5 : rarity === 'rare' ? 7 : 10
  glow(pc, 4, 4, 16, 16, glowColor, strength)
  r(pc, 11, 1, 2, 22, primary, 0.12)
  r(pc, 1, 11, 22, 2, primary, 0.12)

  for (let i = 0; i < 8; i++) {
    p(pc, 4 + i, 4 + i, glowColor, 0.11)
    p(pc, 19 - i, 4 + i, glowColor, 0.11)
  }

  if (rarity === 'legendary' || rarity === 'mythic') {
    r(pc, 3, 3, 18, 18, glowColor, 0.06)
    r(pc, 5, 5, 14, 14, primary, 0.08)
  }
}

function drawPrizeGlints(pc: PixelContext, primary: string, rarity: Rarity) {
  sparkle(pc, 3, 4, '#ffffff')
  sparkle(pc, 20, 5, primary)
  sparkle(pc, 4, 20, primary)
  p(pc, 18, 18, '#ffffff', 0.85)
  p(pc, 21, 15, primary, 0.7)

  if (rarity === 'mythic') {
    const cols = ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#00ffff', '#4488ff', '#ff00ff']
    for (let i = 0; i < 7; i++) {
      p(pc, 7 + i, 22, cols[i], 0.9)
      p(pc, 22, 7 + i, cols[(i + 2) % cols.length], 0.75)
      p(pc, 1, 7 + i, cols[(i + 4) % cols.length], 0.55)
    }
  }
}

function sparkle(pc: PixelContext, x: number, y: number, color: string) {
  p(pc, x, y - 2, color, 0.55)
  p(pc, x - 1, y - 1, color, 0.75)
  p(pc, x, y - 1, '#ffffff')
  p(pc, x + 1, y - 1, color, 0.75)
  p(pc, x - 2, y, color, 0.55)
  p(pc, x - 1, y, '#ffffff')
  p(pc, x, y, '#ffffff')
  p(pc, x + 1, y, '#ffffff')
  p(pc, x + 2, y, color, 0.55)
  p(pc, x - 1, y + 1, color, 0.75)
  p(pc, x, y + 1, '#ffffff')
  p(pc, x + 1, y + 1, color, 0.75)
  p(pc, x, y + 2, color, 0.55)
}

function drawGold(pc: PixelContext) {
  const edge = '#4b2600'
  const amber = '#d97706'
  const gold = '#ffd34a'
  const hot = '#fff4a8'

  tmpl(pc, [
    '....KKKKKKK.....',
    '..KKAAAAAAAK....',
    '.KAAAGGGGAAK...',
    '.KAAGHHHHGAK...',
    '.KAAGHGGHGAK...',
    '.KAAAGGGGAAK...',
    '..KKAAAAAKK....',
    '....KKKKK......',
  ], { K: edge, A: amber, G: gold, H: hot }, 4, 3)

  r(pc, 5, 14, 14, 4, amber)
  r(pc, 4, 13, 16, 1, edge)
  r(pc, 4, 17, 16, 1, edge)
  r(pc, 5, 12, 14, 4, gold)
  r(pc, 4, 12, 1, 4, edge)
  r(pc, 19, 12, 1, 4, edge)
  r(pc, 7, 13, 5, 1, hot)

  r(pc, 8, 18, 11, 3, amber)
  r(pc, 7, 18, 13, 1, edge)
  r(pc, 7, 20, 13, 1, edge)
  r(pc, 9, 17, 10, 3, gold)
  r(pc, 10, 18, 4, 1, hot)
}

function drawGem(pc: PixelContext, rarity: Rarity) {
  const rc = RARITY_COLOURS[rarity]
  const body = rarity === 'common' ? '#cfe8ff' : rc.primary
  const edge = '#101026'
  const hi = lighten(body, 76)
  const mid = lighten(body, 24)
  const low = darken(body, 44)
  const deep = darken(body, 70)

  tmpl(pc, [
    '......KKKK......',
    '....KKHHHHKK....',
    '...KHHMMMMHHK...',
    '..KMMBBBBMMMK..',
    '.KMMBBBBBBBBK.',
    '.KBBBBBBBBBBK.',
    '..KBBBBBBBBK..',
    '...KBBBBBBK...',
    '....KLLLLK....',
    '.....KLLK.....',
    '......KK......',
  ], { K: edge, H: hi, M: mid, B: body, L: low }, 4, 4)

  r(pc, 10, 7, 2, 8, '#ffffff', 0.28)
  r(pc, 13, 7, 1, 7, deep, 0.5)
  p(pc, 9, 5, '#ffffff', 0.9)
  p(pc, 8, 6, '#ffffff', 0.6)
}

function drawShard(pc: PixelContext, rarity: Rarity) {
  const rc = RARITY_COLOURS[rarity]
  const core = rarity === 'common' ? '#68d8ff' : rc.primary
  const edge = '#14142e'
  const hi = lighten(core, 76)
  const mid = lighten(core, 18)
  const low = darken(core, 42)

  tmpl(pc, [
    '......KK........',
    '.....KHHK.......',
    '.....KHHK.......',
    '....KHHMMK......',
    '....KHHMMK......',
    '...KHHMMBBK.....',
    '...KHHMMBBK.....',
    '..KHHMMBBBBK....',
    '..KHHMMBBBBK....',
    '.KHHMMBBBBLLK...',
    '.KHHMMBBBBLLK...',
    '..KKMMBBBBLK....',
    '....KBBBBLK.....',
    '.....KBBLK......',
    '......KKK.......',
  ], { K: edge, H: hi, M: mid, B: core, L: low }, 4, 3)

  r(pc, 5, 12, 3, 7, darken(core, 30))
  r(pc, 4, 13, 1, 5, edge)
  r(pc, 7, 12, 1, 6, edge)
  p(pc, 6, 11, hi)
  r(pc, 17, 10, 3, 8, mid)
  r(pc, 16, 11, 1, 6, edge)
  r(pc, 20, 12, 1, 5, edge)
  p(pc, 18, 9, hi)
  r(pc, 5, 20, 14, 2, '#000000', 0.22)
}

function drawXp(pc: PixelContext, rarity: Rarity) {
  const rc = RARITY_COLOURS[rarity]
  const cyan = '#45e8ff'
  const blue = '#2276ff'
  const white = '#ffffff'
  const edge = '#07152c'
  const gold = '#ffe66d'

  tmpl(pc, [
    '........KK........',
    '.......KHHK.......',
    '......KHHHHK......',
    '...KKKHHHHHHKKK...',
    '..KHHHHWWWWHHHHK..',
    '...KHHWWWWWWHHK...',
    '....KWWCCCCWWK....',
    '...KWWCCCCCCWWK...',
    '..KWWCCBBBBCCWWK..',
    '...KCCBBBBBBCCK...',
    '....KBBBBBBBBK....',
    '.....KBBBBBBK.....',
    '......KBBBBK......',
    '.......KKKK.......',
  ], { K: edge, H: gold, W: white, C: cyan, B: blue }, 3, 2)

  r(pc, 7, 14, 3, 1, white)
  r(pc, 8, 15, 2, 1, cyan)
  r(pc, 9, 16, 3, 1, white)
  r(pc, 7, 17, 3, 1, cyan)
  r(pc, 7, 18, 3, 1, white)

  r(pc, 14, 14, 4, 1, white)
  r(pc, 14, 15, 1, 4, cyan)
  r(pc, 15, 16, 3, 1, white)
  r(pc, 18, 15, 1, 1, cyan)
  r(pc, 18, 17, 1, 1, cyan)
}

function drawLoot(pc: PixelContext, rarity: Rarity) {
  const rc = RARITY_COLOURS[rarity]
  const edge = '#2a1600'
  const wood = '#9b6234'
  const lightWood = '#c98745'
  const darkWood = '#5a320e'
  const metal = rc.primary
  const shine = lighten(rc.primary, 72)

  r(pc, 6, 7, 12, 5, lightWood)
  r(pc, 5, 8, 14, 1, edge)
  r(pc, 5, 11, 14, 1, edge)
  r(pc, 4, 11, 16, 8, wood)
  r(pc, 4, 11, 1, 8, edge)
  r(pc, 19, 11, 1, 8, edge)
  r(pc, 5, 18, 14, 1, edge)
  r(pc, 5, 12, 14, 2, darkWood, 0.45)

  r(pc, 11, 6, 2, 13, metal)
  r(pc, 8, 12, 8, 4, metal)
  r(pc, 9, 13, 6, 2, shine, 0.48)
  r(pc, 10, 9, 4, 2, shine, 0.35)

  r(pc, 8, 5, 2, 4, '#ffd34a')
  r(pc, 14, 5, 2, 4, '#45e8ff')
  p(pc, 7, 4, '#fff4a8')
  p(pc, 16, 4, '#ffffff')

  r(pc, 4, 19, 16, 2, '#000000', 0.22)
  sparkle(pc, 18, 7, shine)
}
