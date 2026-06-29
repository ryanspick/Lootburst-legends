import type { Rarity } from '@/constants/palette'
import { RARITY_COLOURS } from '@/constants/palette'
import type { UpgradeBuild } from '@/game/rift/riftTypes'
import { addSpriteShading, createPC, darken, glow, lighten, p, r, toDataURL } from './pixelCanvas'

type PixelContext = ReturnType<typeof createPC>['pc']

const cache = new Map<string, string>()

const BUILD_COLORS: Record<UpgradeBuild, string> = {
  Barrage: '#ffcc44',
  Skill: '#44ccff',
  Ultimate: '#cc66ff',
  Crit: '#ff4f9a',
  AoE: '#44ff88',
  Guard: '#88aaff',
  Drain: '#dd55ff',
  Economy: '#ffd700',
  Power: '#ff6644',
  Rainbow: '#ffffff',
}

export function generateUpgradeIcon(id: string, build: UpgradeBuild, rarity: Rarity): string {
  const key = `${id}:${build}:${rarity}`
  const cached = cache.get(key)
  if (cached) return cached

  const { canvas, pc } = createPC(24, 24)
  const rc = RARITY_COLOURS[rarity]
  const primary = BUILD_COLORS[build] ?? rc.primary
  const accent = rarity === 'legendary' || rarity === 'mythic' ? rc.primary : primary

  drawIconFrame(pc, primary, rc.glow, rarity)

  switch (build) {
    case 'Barrage':
      drawBarrage(pc, primary)
      break
    case 'Skill':
      drawSkill(pc, primary)
      break
    case 'Ultimate':
      drawUltimate(pc, primary, accent)
      break
    case 'Crit':
      drawCrit(pc, primary)
      break
    case 'AoE':
      drawAoe(pc, primary)
      break
    case 'Guard':
      drawGuard(pc, primary)
      break
    case 'Drain':
      drawDrain(pc, primary)
      break
    case 'Economy':
      drawEconomy(pc, primary)
      break
    case 'Power':
      drawPower(pc, primary)
      break
    case 'Rainbow':
      drawRainbow(pc)
      break
  }

  drawCardSpecificAccent(pc, id, accent)
  addSpriteShading(pc, primary)

  const url = toDataURL(canvas)
  cache.set(key, url)
  return url
}

function drawIconFrame(pc: PixelContext, primary: string, glowColor: string, rarity: Rarity) {
  glow(pc, 4, 4, 16, 16, glowColor, rarity === 'legendary' || rarity === 'mythic' ? 10 : 6)
  r(pc, 5, 5, 14, 14, '#0b1024', 0.92)
  r(pc, 5, 5, 14, 1, primary)
  r(pc, 5, 18, 14, 1, darken(primary, 30))
  r(pc, 5, 5, 1, 14, darken(primary, 45))
  r(pc, 18, 5, 1, 14, lighten(primary, 30))
  p(pc, 3, 3, primary, 0.75)
  p(pc, 20, 4, '#ffffff', 0.7)
  p(pc, 4, 20, primary, 0.55)
}

function drawBarrage(pc: PixelContext, color: string) {
  for (let i = 0; i < 4; i++) {
    r(pc, 6 + i * 3, 8 + (i % 2), 2, 8, color)
    r(pc, 6 + i * 3, 6 + (i % 2), 2, 2, '#ffffff')
    p(pc, 7 + i * 3, 17, darken(color, 45))
  }
}

function drawSkill(pc: PixelContext, color: string) {
  r(pc, 10, 4, 4, 16, color)
  r(pc, 8, 7, 8, 4, lighten(color, 40))
  r(pc, 7, 11, 10, 2, '#ffffff', 0.7)
  p(pc, 8, 5, '#ffffff')
  p(pc, 15, 17, lighten(color, 60))
}

function drawUltimate(pc: PixelContext, color: string, accent: string) {
  r(pc, 11, 3, 2, 18, '#ffffff')
  r(pc, 9, 5, 6, 14, color)
  r(pc, 6, 9, 12, 6, accent, 0.85)
  p(pc, 11, 1, '#ffffff')
  p(pc, 12, 22, accent)
  p(pc, 4, 12, color)
  p(pc, 19, 12, color)
}

function drawCrit(pc: PixelContext, color: string) {
  r(pc, 11, 4, 2, 16, '#ffffff')
  r(pc, 4, 11, 16, 2, '#ffffff')
  r(pc, 8, 8, 8, 8, color)
  r(pc, 10, 10, 4, 4, lighten(color, 60))
  p(pc, 6, 6, color)
  p(pc, 17, 7, color)
  p(pc, 16, 18, color)
}

function drawAoe(pc: PixelContext, color: string) {
  r(pc, 8, 8, 8, 8, color, 0.85)
  r(pc, 10, 10, 4, 4, '#ffffff', 0.8)
  r(pc, 6, 11, 12, 2, lighten(color, 30), 0.75)
  r(pc, 11, 6, 2, 12, lighten(color, 30), 0.75)
  p(pc, 5, 5, color)
  p(pc, 18, 6, color)
  p(pc, 5, 18, color)
  p(pc, 18, 18, color)
}

function drawGuard(pc: PixelContext, color: string) {
  r(pc, 8, 5, 8, 3, lighten(color, 32))
  r(pc, 6, 8, 12, 6, color)
  r(pc, 8, 14, 8, 5, darken(color, 30))
  r(pc, 11, 8, 2, 10, '#ffffff', 0.45)
  p(pc, 7, 6, '#ffffff')
  p(pc, 16, 6, '#ffffff')
}

function drawDrain(pc: PixelContext, color: string) {
  r(pc, 10, 4, 4, 12, color)
  r(pc, 8, 7, 8, 7, lighten(color, 30))
  r(pc, 9, 15, 6, 4, darken(color, 35))
  p(pc, 8, 5, '#ffffff')
  p(pc, 15, 6, '#ffffff')
  r(pc, 5, 12, 4, 2, color, 0.75)
  r(pc, 15, 12, 4, 2, color, 0.75)
}

function drawEconomy(pc: PixelContext, color: string) {
  r(pc, 7, 11, 10, 7, darken(color, 30))
  r(pc, 6, 9, 10, 7, color)
  r(pc, 8, 10, 5, 1, '#ffffff')
  r(pc, 11, 5, 6, 6, color)
  r(pc, 12, 6, 3, 1, '#ffffff')
  p(pc, 16, 4, '#ffffff')
  p(pc, 5, 17, color)
}

function drawPower(pc: PixelContext, color: string) {
  r(pc, 11, 3, 4, 8, lighten(color, 28))
  r(pc, 9, 9, 6, 5, color)
  r(pc, 7, 13, 5, 8, darken(color, 28))
  r(pc, 12, 12, 5, 3, '#ffffff', 0.6)
  p(pc, 15, 4, '#ffffff')
  p(pc, 7, 20, color)
}

function drawRainbow(pc: PixelContext) {
  const cols = ['#ff3366', '#ff8800', '#ffee44', '#44ff88', '#44ccff', '#aa66ff']
  for (let i = 0; i < cols.length; i++) {
    r(pc, 6 + i, 6 + i, 10, 2, cols[i])
  }
  r(pc, 8, 15, 8, 3, '#ffffff', 0.75)
  p(pc, 6, 5, '#ffffff')
  p(pc, 18, 17, '#ffffff')
}

function drawCardSpecificAccent(pc: PixelContext, id: string, color: string) {
  if (id.includes('jackpot') || id.includes('loot') || id.includes('gold')) {
    r(pc, 15, 15, 4, 4, '#ffd700')
    p(pc, 16, 16, '#ffffff')
  }
  if (id.includes('cyclone') || id.includes('storm')) {
    p(pc, 5, 7, color)
    p(pc, 18, 16, color)
    p(pc, 7, 18, color)
  }
  if (id.includes('relay') || id.includes('reactor')) {
    r(pc, 4, 10, 3, 1, color)
    r(pc, 17, 13, 3, 1, color)
  }
  if (id.includes('compound') || id.includes('shield')) {
    r(pc, 9, 18, 6, 2, color)
  }
}
