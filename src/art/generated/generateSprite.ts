import { createPC, tmpl, r, p, o, glow, toDataURL, darken, lighten, hexAlpha, addSpriteShading } from './pixelCanvas'
import { makeSpritePalette, makeGearPalette, makeBossPalette, makeEnemyPalette, seededRng } from './pixelPalettes'
import { HERO_TEMPLATES, roleToTemplate } from './heroTemplates'
import { ENEMY_TEMPLATES, tagsToEnemyTemplate } from './enemyTemplates'
import { GEAR_TEMPLATES, slotToGearTemplate } from './gearTemplates'
import { RARITY_COLOURS, ELEMENT_COLOURS } from '@/constants/palette'
import type { Rarity } from '@/constants/palette'

interface HeroInput {
  id: string
  rarity: Rarity
  element: string
  role: string
  tags?: string[]
}

interface EnemyInput {
  id: string
  element: string
  tags?: string[]
  tier?: string
}

interface BossInput {
  id: string
  element: string
  tags?: string[]
  spriteSize?: number
}

interface GearInput {
  id: string
  rarity: Rarity
  slot: string
  element?: string
}

interface PetInput {
  id: string
  rarity: Rarity
  tags?: string[]
}

// ── Hero (64×64) ─────────────────────────────────────────────────────────────

export function generateHeroSprite(hero: HeroInput): string {
  const { canvas, pc } = createPC(16, 16)
  const pal = makeSpritePalette(hero.element, hero.rarity, hero.role)
  const tmplKey = roleToTemplate(hero.role, hero.tags ?? [])
  const template = HERO_TEMPLATES[tmplKey]

  // Build palette mapping
  const palMap: Record<string, string | [string, number]> = {
    K: pal.K, H: pal.H, X: pal.X, E: pal.E,
    B: pal.B, A: pal.A, D: pal.D, L: pal.L,
    F: pal.F, P: pal.P, G: pal.G,
    S: pal.S,
  }

  // Draw glow for legendary/mythic
  if (hero.rarity === 'legendary' || hero.rarity === 'mythic') {
    glow(pc, 3, 1, 10, 14, RARITY_COLOURS[hero.rarity].glow, 10)
  } else if (hero.rarity === 'epic') {
    glow(pc, 4, 2, 8, 12, RARITY_COLOURS.epic.glow, 5)
  }

  tmpl(pc, template, palMap)

  // Post-process: pixel art shine highlights (upper-left specular)
  p(pc, 5, 4, '#ffffff', 0.72)
  p(pc, 6, 3, '#ffffff', 0.42)
  p(pc, 4, 5, '#ffffff', 0.28)

  // Body pixel dither texture for non-common heroes
  if (hero.rarity !== 'common') {
    for (let dy = 7; dy <= 12; dy++) {
      const rowStr = template[dy] ?? ''
      for (let dx = 3; dx <= 12; dx++) {
        if (rowStr[dx] === 'B' && (dx + dy) % 3 === 0) {
          p(pc, dx, dy, pal.A, 0.22)
        }
      }
    }
  }

  // Eye highlight dot (small shine inside eye)
  p(pc, 5, 5, pal.E, 0.8)

  // Rarity border dots (corners)
  if (hero.rarity !== 'common') {
    const rc = RARITY_COLOURS[hero.rarity].primary
    p(pc, 0, 0, rc); p(pc, 15, 0, rc)
    p(pc, 0, 15, rc); p(pc, 15, 15, rc)
    // Side accent bars
    p(pc, 0, 7, rc, 0.5); p(pc, 0, 8, rc, 0.5)
    p(pc, 15, 7, rc, 0.5); p(pc, 15, 8, rc, 0.5)
  }

  // Mythic: rainbow accent row
  if (hero.rarity === 'mythic') {
    const cols = ['#ff0000','#ff8800','#ffff00','#00ff00','#00ffff','#ff00ff','#ffffff','#ff00ff','#00ffff','#00ff00','#ffff00','#ff8800','#ff0000','#ff00ff','#ffffff','#00ffff']
    for (let i = 0; i < 16; i++) {
      p(pc, i, 15, cols[i], 0.7)
      p(pc, i, 0, cols[(i + 8) % 16], 0.4)
    }
  }

  addSpriteShading(pc, ELEMENT_COLOURS[hero.element] ?? '#8888cc')
  return toDataURL(canvas)
}

// ── Enemy (96×96 at PS=6, 16×16 logical) ────────────────────────────────────

export function generateEnemySprite(enemy: EnemyInput): string {
  const { canvas, pc } = createPC(16, 16)
  const isElite = enemy.tier === 'elite'
  const pal     = makeEnemyPalette(enemy.element)
  const tmplKey = tagsToEnemyTemplate(enemy.tags ?? [])
  const template = ENEMY_TEMPLATES[tmplKey]
  const elemColor = ELEMENT_COLOURS[enemy.element] ?? '#8888cc'

  const palMap: Record<string, string | [string, number]> = {
    K: pal.K, H: pal.H, X: pal.X, E: pal.E,
    B: pal.B, A: pal.A, D: pal.D, P: pal.P,
    G: pal.G, S: pal.S,
  }

  // Aura glow behind sprite
  if (isElite) {
    glow(pc, 1, 1, 14, 14, RARITY_COLOURS.epic.glow, 14)
    glow(pc, 2, 2, 12, 12, pal.B, 7)
  } else {
    glow(pc, 2, 2, 12, 12, pal.B, 3)
  }

  tmpl(pc, template, palMap)

  // Eye enhancement: scan template for X pixels, add multi-pixel glow
  for (let row = 0; row < template.length; row++) {
    const rowStr = template[row] ?? ''
    for (let col = 0; col < rowStr.length; col++) {
      if (rowStr[col] === 'X') {
        p(pc, col,     row,     '#ffffff', 0.65)  // bright center
        p(pc, col,     row - 1, pal.X,    0.50)  // glow above
        p(pc, col,     row + 1, pal.X,    0.30)  // glow below
        p(pc, col - 1, row,     pal.X,    0.28)  // glow left
        p(pc, col + 1, row,     pal.X,    0.28)  // glow right
        p(pc, col - 1, row - 1, pal.X,    0.14)  // diagonal glows
        p(pc, col + 1, row - 1, pal.X,    0.14)
      }
    }
  }

  // Per-element accent pixels scaled to 16×16 coordinate space
  switch (enemy.element) {
    case 'fire':
      p(pc, 1,  1,  '#ff8800', 0.70); p(pc, 14, 1,  '#ff8800', 0.70)
      p(pc, 0,  2,  '#ff4400', 0.50); p(pc, 15, 2,  '#ff4400', 0.50)
      p(pc, 2,  0,  '#ff6600', 0.40); p(pc, 13, 0,  '#ff6600', 0.40)
      break
    case 'ice':
      p(pc, 0,  4,  '#aaffff', 0.55); p(pc, 15, 4,  '#aaffff', 0.55)
      p(pc, 0,  9,  '#aaffff', 0.38); p(pc, 15, 9,  '#aaffff', 0.38)
      p(pc, 6,  0,  '#ffffff', 0.55); p(pc, 7,  0,  '#ffffff', 0.55)
      p(pc, 8,  0,  '#ffffff', 0.42); p(pc, 5,  0,  '#aaffff', 0.35)
      break
    case 'poison':
      p(pc, 1,  12, '#44ff88', 0.60); p(pc, 14, 12, '#44ff88', 0.60)
      p(pc, 0,  13, '#44ff44', 0.40); p(pc, 15, 13, '#44ff44', 0.40)
      p(pc, 2,  14, '#22dd66', 0.30); p(pc, 13, 14, '#22dd66', 0.30)
      break
    case 'shadow':
      p(pc, 0,  2,  '#cc44ff', 0.50); p(pc, 15, 2,  '#cc44ff', 0.50)
      p(pc, 0,  10, '#cc44ff', 0.32); p(pc, 15, 10, '#cc44ff', 0.32)
      p(pc, 1,  0,  '#8822cc', 0.38); p(pc, 14, 0,  '#8822cc', 0.38)
      break
    case 'machine':
      p(pc, 0,  5,  '#00ffcc', 0.55); p(pc, 15, 5,  '#00ffcc', 0.55)
      p(pc, 0,  9,  '#00ffcc', 0.38); p(pc, 15, 9,  '#00ffcc', 0.38)
      p(pc, 1,  0,  '#44ffee', 0.45); p(pc, 14, 0,  '#44ffee', 0.45)
      break
    case 'nature':
      p(pc, 1,  13, '#44ff22', 0.55); p(pc, 14, 13, '#44ff22', 0.55)
      p(pc, 0,  14, '#22cc00', 0.38); p(pc, 15, 14, '#22cc00', 0.38)
      p(pc, 3,  0,  '#66ff44', 0.40); p(pc, 12, 0,  '#66ff44', 0.40)
      break
    case 'gold':
      p(pc, 1,  0,  '#ffd700', 0.65); p(pc, 14, 0,  '#ffd700', 0.65)
      p(pc, 0,  1,  '#ffaa00', 0.50); p(pc, 15, 1,  '#ffaa00', 0.50)
      p(pc, 1,  14, '#ffd700', 0.50); p(pc, 14, 14, '#ffd700', 0.50)
      p(pc, 0,  13, '#ffcc00', 0.35); p(pc, 15, 13, '#ffcc00', 0.35)
      break
    case 'storm':
      p(pc, 0,  1,  '#ffee00', 0.58); p(pc, 15, 1,  '#ffee00', 0.58)
      p(pc, 1,  0,  '#ffffff', 0.50); p(pc, 14, 0,  '#ffffff', 0.50)
      p(pc, 0,  7,  '#aaddff', 0.38); p(pc, 15, 7,  '#aaddff', 0.38)
      break
  }

  // Elite post-processing
  if (isElite) {
    const rc = RARITY_COLOURS.epic.primary
    // Corner rarity markers
    p(pc, 0,  0,  rc); p(pc, 15, 0,  rc)
    p(pc, 0,  15, rc); p(pc, 15, 15, rc)
    // Side accent bars
    p(pc, 0,  7,  rc, 0.70); p(pc, 15, 7,  rc, 0.70)
    p(pc, 0,  8,  rc, 0.70); p(pc, 15, 8,  rc, 0.70)
    // Mini crown (3 gold pixels centered at top)
    p(pc, 5,  0,  '#ffd700', 0.95)
    p(pc, 8,  0,  '#ffd700')
    p(pc, 11, 0,  '#ffd700', 0.95)
    // Body shimmer dither
    for (let dy = 2; dy <= 14; dy++) {
      const rowStr = template[dy] ?? ''
      for (let dx = 1; dx <= 14; dx++) {
        if (rowStr[dx] === 'B' && (dx + dy) % 2 === 0) {
          p(pc, dx, dy, pal.A, 0.28)
        }
      }
    }
  }

  // Gradient shading pass: AO + specular + element rim
  addSpriteShading(pc, elemColor)

  return toDataURL(canvas)
}

// ── Boss (128×128 or 192×192) ─────────────────────────────────────────────────

export function generateBossSprite(boss: BossInput): string {
  const logW = boss.spriteSize === 192 ? 48 : 32
  const logH = boss.spriteSize === 192 ? 48 : 32
  const { canvas, pc } = createPC(logW, logH)
  const pal = makeBossPalette(boss.element)
  const tags = (boss.tags ?? []).map(t => t.toLowerCase()).join(' ')
  const rng = seededRng(boss.id)

  // Background glow
  glow(pc, 2, 2, logW - 4, logH - 4, ELEMENT_COLOURS[boss.element] ?? '#8888cc', 10)

  // Body type based on tags
  if (tags.includes('slime') || tags.includes('jelly')) {
    drawBossSlime(pc, pal, logW, logH)
  } else if (tags.includes('dragon')) {
    drawBossDragon(pc, pal, logW, logH)
  } else if (tags.includes('mimic') || tags.includes('chest')) {
    drawBossChest(pc, pal, logW, logH)
  } else if (tags.includes('hydra') || tags.includes('multi-head')) {
    drawBossHydra(pc, pal, logW, logH)
  } else if (tags.includes('pumpkin') || tags.includes('gourd')) {
    drawBossPumpkin(pc, pal, logW, logH)
  } else if (tags.includes('vault') || tags.includes('door')) {
    drawBossVault(pc, pal, logW, logH)
  } else if (tags.includes('cherub') || tags.includes('cosmic')) {
    drawBossCherub(pc, pal, logW, logH)
  } else if (tags.includes('goblin') || tags.includes('vehicle')) {
    drawBossVehicle(pc, pal, logW, logH)
  } else if (tags.includes('mushroom') || tags.includes('spore')) {
    drawBossMushroomMatriarch(pc, pal, logW, logH)
  } else {
    drawBossGeneric(pc, pal, logW, logH, rng)
  }

  addSpriteShading(pc, ELEMENT_COLOURS[boss.element] ?? '#8888cc')
  return toDataURL(canvas)
}

function drawBossSlime(pc: ReturnType<typeof createPC>['pc'], pal: ReturnType<typeof makeBossPalette>, w: number, h: number) {
  // Crown on top
  const crown = ['#ffd700', '#ffd700', '#ffaa00']
  for (let i = 0; i < 3; i++) {
    r(pc, 8 + i * 6, 0, 4, 4, crown[i])
  }
  r(pc, 6, 3, w - 12, 2, crown[0])

  // Huge blob body
  r(pc, 4, 4, w - 8, h - 10, pal.B)
  o(pc, 4, 4, w - 8, h - 10, pal.K)

  // Shine
  r(pc, 6, 6, 6, 4, pal.A)

  // Eyes (two large angry eyes)
  const ex = Math.floor(w / 2) - 5
  r(pc, ex, 12, 4, 4, pal.X)
  r(pc, ex + 7, 12, 4, 4, pal.X)
  r(pc, ex + 1, 13, 2, 2, '#ff2222')
  r(pc, ex + 8, 13, 2, 2, '#ff2222')

  // Internal bubbles
  r(pc, 8, 18, 4, 4, lighten(pal.B, 40))
  r(pc, 18, 22, 3, 3, lighten(pal.B, 40))
  r(pc, 14, 14, 3, 3, lighten(pal.B, 30))

  // Ground shadow
  r(pc, 4, h - 5, w - 8, 2, '#00000044')
}

function drawBossDragon(pc: ReturnType<typeof createPC>['pc'], pal: ReturnType<typeof makeBossPalette>, w: number, h: number) {
  // Wings (spread wide)
  r(pc, 0, 4, 8, 20, pal.D)
  r(pc, w - 8, 4, 8, 20, pal.D)
  o(pc, 0, 4, 8, 20, pal.K)
  o(pc, w - 8, 4, 8, 20, pal.K)

  // Wing membranes
  for (let i = 0; i < 5; i++) {
    r(pc, 1 + i, 5 + i, 2, 16 - i * 2, pal.P)
    r(pc, w - 3 - i, 5 + i, 2, 16 - i * 2, pal.P)
  }

  // Body
  r(pc, 8, 6, w - 16, h - 14, pal.B)
  o(pc, 8, 6, w - 16, h - 14, pal.K)

  // Head (top)
  r(pc, 10, 0, w - 20, 10, pal.B)
  o(pc, 10, 0, w - 20, 10, pal.K)

  // Eyes
  r(pc, 13, 2, 4, 4, pal.X)
  r(pc, w - 17, 2, 4, 4, pal.X)
  r(pc, 14, 3, 2, 2, '#ff4444')
  r(pc, w - 16, 3, 2, 2, '#ff4444')

  // Horns
  r(pc, 11, 0, 3, 2, pal.P)
  r(pc, w - 14, 0, 3, 2, pal.P)

  // Scales
  for (let i = 0; i < 4; i++) {
    r(pc, 10 + i * 4, 10, 2, 3, pal.A)
  }

  r(pc, 4, h - 4, w - 8, 2, '#00000044')
}

function drawBossChest(pc: ReturnType<typeof createPC>['pc'], pal: ReturnType<typeof makeBossPalette>, w: number, h: number) {
  // Chest body
  r(pc, 2, 6, w - 4, h - 14, pal.B)
  r(pc, 2, 6, w - 4, 4, pal.D) // lid top
  o(pc, 2, 6, w - 4, h - 14, pal.K)

  // Gold clasps
  r(pc, w / 2 - 2, 8, 4, h - 20, pal.P)
  r(pc, w / 2 - 4, 10, 8, 4, pal.P)

  // Evil eyes on lid
  const ey = 8
  r(pc, 8, ey, 4, 4, pal.X)
  r(pc, w - 12, ey, 4, 4, pal.X)
  r(pc, 9, ey + 1, 2, 2, '#ff4444')
  r(pc, w - 11, ey + 1, 2, 2, '#ff4444')

  // Teeth row (open mouth effect)
  const ty = Math.floor(h / 2) + 1
  for (let i = 0; i < 6; i++) {
    r(pc, 3 + i * 4, ty, 2, 4, '#eeeeee')
    r(pc, 5 + i * 4, ty, 2, 4, pal.D)
  }

  // Lock
  r(pc, w / 2 - 3, 4, 6, 3, pal.P)
  o(pc, w / 2 - 3, 4, 6, 3, pal.K)

  // Arms (holding coins)
  r(pc, 0, 12, 3, 10, pal.B)
  r(pc, w - 3, 12, 3, 10, pal.B)
  r(pc, 0, 10, 3, 3, pal.P) // coin
  r(pc, w - 3, 10, 3, 3, pal.P)

  r(pc, 4, h - 4, w - 8, 2, '#00000044')
}

function drawBossHydra(pc: ReturnType<typeof createPC>['pc'], pal: ReturnType<typeof makeBossPalette>, w: number, h: number) {
  // Three necks + heads
  const headXs = [4, w / 2 - 4, w - 16]
  headXs.forEach((hx, i) => {
    // Neck
    r(pc, hx + 3, 8 + i * 2, 4, 14, pal.B)
    // Head
    r(pc, hx, 3 + i * 2, 10, 8, pal.B)
    o(pc, hx, 3 + i * 2, 10, 8, pal.K)
    // Eye
    r(pc, hx + 2, 5 + i * 2, 3, 3, pal.X)
    r(pc, hx + 3, 6 + i * 2, 1, 1, '#ff2222')
    // Bone accent
    r(pc, hx + 6, 4 + i * 2, 2, 6, pal.A)
  })

  // Shared body
  r(pc, 6, 20, w - 12, h - 26, pal.B)
  o(pc, 6, 20, w - 12, h - 26, pal.K)
  r(pc, 4, h - 6, w - 8, 2, '#00000044')
}

function drawBossPumpkin(pc: ReturnType<typeof createPC>['pc'], pal: ReturnType<typeof makeBossPalette>, w: number, h: number) {
  // Stem
  r(pc, w / 2 - 2, 0, 4, 5, darken(pal.B, 40))

  // Pumpkin body (three lobes)
  r(pc, 6, 6, w - 12, h - 16, pal.B)
  r(pc, 2, 8, 6, h - 22, darken(pal.B, 20))
  r(pc, w - 8, 8, 6, h - 22, darken(pal.B, 20))
  o(pc, 2, 6, w - 4, h - 16, pal.K)

  // Jack-o-lantern face (triangle eyes, zig-zag mouth)
  r(pc, 8, 10, 5, 5, pal.X)  // left eye triangle
  r(pc, w - 13, 10, 5, 5, pal.X)  // right eye
  r(pc, 9, 11, 3, 3, '#ff6600')
  r(pc, w - 12, 11, 3, 3, '#ff6600')

  // Gears on sides
  for (let i = 0; i < 3; i++) {
    r(pc, 0, 10 + i * 5, 3, 3, pal.P)
    r(pc, w - 3, 10 + i * 5, 3, 3, pal.P)
  }
  r(pc, 4, h - 4, w - 8, 2, '#00000044')
}

function drawBossVault(pc: ReturnType<typeof createPC>['pc'], pal: ReturnType<typeof makeBossPalette>, w: number, h: number) {
  // Giant vault door
  r(pc, 2, 2, w - 4, h - 8, pal.B)
  o(pc, 2, 2, w - 4, h - 8, pal.K)

  // Concentric rings
  o(pc, 4, 4, w - 8, h - 12, pal.D)
  o(pc, 6, 6, w - 12, h - 16, pal.A)

  // Center dial
  r(pc, w / 2 - 5, h / 2 - 5, 10, 10, pal.P)
  o(pc, w / 2 - 5, h / 2 - 5, 10, 10, pal.K)
  r(pc, w / 2 - 1, h / 2 - 5, 2, 10, pal.K) // dial pointer

  // Lock bolts
  const bolts = [[4, 6], [w - 6, 6], [4, h - 16], [w - 6, h - 16]]
  bolts.forEach(([bx, by]) => {
    r(pc, bx, by, 4, 4, pal.P)
    o(pc, bx, by, 4, 4, pal.K)
  })

  // Moon glow beam from crack
  r(pc, w / 2 - 1, 2, 2, h - 10, lighten(pal.B, 80), 0.4)
  r(pc, 4, h - 4, w - 8, 2, '#00000044')
}

function drawBossCherub(pc: ReturnType<typeof createPC>['pc'], pal: ReturnType<typeof makeBossPalette>, w: number, h: number) {
  // Large galaxy wings
  r(pc, 0, 6, 12, h - 20, pal.D)
  r(pc, w - 12, 6, 12, h - 20, pal.D)
  o(pc, 0, 6, 12, h - 20, pal.K)
  o(pc, w - 12, 6, 12, h - 20, pal.K)

  // Wing galaxy particles
  for (let i = 0; i < 8; i++) {
    r(pc, 1 + i, 7 + i, 2, 2, pal.G)
    r(pc, w - 3 - i, 7 + i, 2, 2, pal.G)
  }

  // Body (chubby baby)
  r(pc, 10, 8, w - 20, h - 20, pal.H)
  o(pc, 10, 8, w - 20, h - 20, pal.K)

  // Cracked halo
  r(pc, 8, 2, w - 16, 4, pal.P)
  r(pc, w / 2 - 1, 2, 3, 4, pal.K) // crack

  // Void maw (dark mouth showing stars)
  r(pc, 12, 16, w - 24, 8, '#000011')
  for (let i = 0; i < 6; i++) {
    r(pc, 13 + i * 3, 17 + (i % 3), 2, 2, pal.G)
  }
  o(pc, 12, 16, w - 24, 8, pal.K)

  // Eyes (star-shaped, glowing)
  r(pc, 13, 10, 5, 5, pal.X)
  r(pc, w - 18, 10, 5, 5, pal.X)
  r(pc, 14, 11, 3, 3, pal.G)
  r(pc, w - 17, 11, 3, 3, pal.G)

  r(pc, 4, h - 4, w - 8, 2, '#00000044')
}

function drawBossVehicle(pc: ReturnType<typeof createPC>['pc'], pal: ReturnType<typeof makeBossPalette>, w: number, h: number) {
  // Minecart body
  r(pc, 2, 10, w - 4, h - 22, pal.B)
  o(pc, 2, 10, w - 4, h - 22, pal.K)

  // Cart front brace
  r(pc, 4, 8, w - 8, 4, pal.P)
  o(pc, 4, 8, w - 8, 4, pal.K)

  // Wheels
  r(pc, 2, h - 12, 8, 8, pal.D)
  o(pc, 2, h - 12, 8, 8, pal.K)
  r(pc, w - 10, h - 12, 8, 8, pal.D)
  o(pc, w - 10, h - 12, 8, 8, pal.K)
  // Spoke
  r(pc, 5, h - 9, 2, 2, pal.P)
  r(pc, w - 7, h - 9, 2, 2, pal.P)

  // Goblin driver (on top)
  r(pc, w / 2 - 5, 0, 10, 10, pal.H)
  o(pc, w / 2 - 5, 0, 10, 10, pal.K)
  r(pc, w / 2 - 4, 2, 8, 4, pal.D) // goggles
  r(pc, w / 2 - 2, 3, 3, 2, pal.A) // goggle lens

  // Spark trails
  for (let i = 0; i < 4; i++) {
    r(pc, w - 4 + i, h - 14 - i * 2, 2, 2, pal.P, 0.8)
    r(pc, w - 2 + i, h - 8 - i * 2, 1, 1, '#ffaa00', 0.6)
  }
  r(pc, 4, h - 4, w - 8, 2, '#00000044')
}

function drawBossGeneric(pc: ReturnType<typeof createPC>['pc'], pal: ReturnType<typeof makeBossPalette>, w: number, h: number, rng: () => number) {
  // Generic intimidating boss shape
  r(pc, 6, 6, w - 12, h - 14, pal.B)
  o(pc, 6, 6, w - 12, h - 14, pal.K)

  // Crown
  for (let i = 0; i < 3; i++) {
    r(pc, 8 + i * 5, 2, 3, 5, pal.P)
  }
  r(pc, 6, 5, w - 12, 3, pal.P)
  o(pc, 6, 5, w - 12, 3, pal.K)

  // Eyes
  r(pc, 10, 10, 5, 5, pal.X)
  r(pc, w - 15, 10, 5, 5, pal.X)
  r(pc, 11, 11, 3, 3, '#ff4444')
  r(pc, w - 14, 11, 3, 3, '#ff4444')

  // Shine
  r(pc, 8, 8, 5, 3, pal.A)

  r(pc, 4, h - 4, w - 8, 2, '#00000044')
}

// ── Gear Icon (48×48) ─────────────────────────────────────────────────────────

export function generateGearIcon(gear: GearInput): string {
  const { canvas, pc } = createPC(12, 12)
  const pal = makeGearPalette(gear.element ?? 'machine', gear.rarity)
  const tmplKey = slotToGearTemplate(gear.slot)
  const template = GEAR_TEMPLATES[tmplKey]

  const palMap: Record<string, string | [string, number]> = {
    K: pal.K, B: pal.B, A: pal.A, D: pal.D,
    P: pal.P, G: pal.G, X: pal.X,
    S: pal.S,
  }

  if (gear.rarity === 'legendary' || gear.rarity === 'mythic') {
    glow(pc, 1, 1, 10, 10, RARITY_COLOURS[gear.rarity].glow, 8)
  } else if (gear.rarity === 'epic') {
    glow(pc, 1, 1, 10, 10, RARITY_COLOURS.epic.glow, 4)
  }

  tmpl(pc, template, palMap)

  // Specular shine dot on gear icon
  p(pc, 2, 2, '#ffffff', 0.65)
  p(pc, 3, 1, '#ffffff', 0.38)

  // Rarity corner dots
  if (gear.rarity !== 'common') {
    const rc = RARITY_COLOURS[gear.rarity].primary
    p(pc, 0, 0, rc); p(pc, 11, 0, rc)
    p(pc, 0, 11, rc); p(pc, 11, 11, rc)
    p(pc, 1, 0, rc, 0.5); p(pc, 0, 1, rc, 0.5)
  }

  // Mythic glint + rainbow row
  if (gear.rarity === 'mythic') {
    const cols = ['#ff0000','#ffff00','#00ffff','#ff00ff']
    for (let i = 0; i < 4; i++) {
      p(pc, 1 + i * 3, 11, cols[i], 0.75)
      p(pc, 1 + i * 3, 0, cols[(i + 2) % 4], 0.5)
    }
  }

  addSpriteShading(pc, ELEMENT_COLOURS[gear.element ?? 'machine'] ?? '#8888cc')
  return toDataURL(canvas)
}

// ── Pet (48×48) ──────────────────────────────────────────────────────────────

const PET_TEMPLATE = [
  '............',
  '....KKKK....',
  '...KHHHHHK..',
  '...KHXHHXK..',
  '...KAHHHAK..',
  '....KKKK....',
  '...KBBBBK...',
  '..KBBBBBBK..',
  '..KBBBBBBK..',
  '...KBBBBK...',
  '....SSSS....',
  '............',
]

export function generatePetSprite(pet: PetInput): string {
  const { canvas, pc } = createPC(12, 12)
  const pal = makeSpritePalette('void', pet.rarity, 'support')
  const tags = (pet.tags ? pet.tags.join(' ') : pet.id).toLowerCase()

  // Pick body color from rarity or name
  let bodyColor = RARITY_COLOURS[pet.rarity].primary

  const palMap: Record<string, string | [string, number]> = {
    K: '#111122', H: pal.H, X: '#222233', E: '#ffffff',
    B: bodyColor, A: lighten(bodyColor, 50), S: ['#000000', 0.25] as [string, number],
  }

  tmpl(pc, PET_TEMPLATE, palMap)

  // Pet-specific features (ears, wings, etc.)
  if (tags.includes('bat') || tags.includes('wyvern')) {
    r(pc, 1, 2, 3, 3, bodyColor)  // wing left
    r(pc, 8, 2, 3, 3, bodyColor)  // wing right
  }
  if (tags.includes('cat') || tags.includes('ferret') || tags.includes('puppy')) {
    r(pc, 3, 0, 2, 2, pal.H)  // ear left
    r(pc, 7, 0, 2, 2, pal.H)  // ear right
  }
  if (tags.includes('frog') || tags.includes('slime')) {
    r(pc, 2, 1, 3, 2, pal.H)  // frog eye bump left
    r(pc, 7, 1, 3, 2, pal.H)  // frog eye bump right
  }
  if (tags.includes('bee')) {
    // Stripes
    r(pc, 3, 7, 6, 1, '#ffcc00')
    r(pc, 3, 9, 6, 1, '#ffcc00')
  }

  // Rarity glow
  if (pet.rarity === 'legendary' || pet.rarity === 'mythic') {
    const rc = RARITY_COLOURS[pet.rarity].primary
    p(pc, 0, 0, rc, 0.8); p(pc, 11, 0, rc, 0.8)
    p(pc, 0, 11, rc, 0.8); p(pc, 11, 11, rc, 0.8)
  }

  return toDataURL(canvas)
}

// ── Capsule (64×64) ──────────────────────────────────────────────────────────

const CAPSULE_TEMPLATE = [
  '................',
  '......KKKK......',
  '.....KAAAAK.....',
  '....KAAAAAAK....',
  '....KAAAAAAK....',
  '.....KAAAAKK....',
  '.....KBBBBB.....',
  '....KBBBBBBK....',
  '....KBBBBBBK....',
  '.....KBBBBK.....',
  '......KBBK......',
  '......KBBK......',
  '.....KBBBBK.....',
  '....KBBBBBBK....',
  '.....KBBBBK.....',
  '......KKKK......',
]

export function generateCapsuleSprite(rarity: Rarity): string {
  const { canvas, pc } = createPC(16, 16)
  const rc = RARITY_COLOURS[rarity]

  const palMap: Record<string, string | [string, number]> = {
    K: '#111122',
    A: rc.primary,
    B: '#e8e8f8',
    S: ['#000000', 0.2] as [string, number],
  }

  // Glow for higher rarities
  if (rarity === 'legendary' || rarity === 'mythic') {
    glow(pc, 4, 1, 8, 14, rc.glow, 8)
  }

  tmpl(pc, CAPSULE_TEMPLATE, palMap)

  // Mythic rainbow capsule seam
  if (rarity === 'mythic') {
    const cols = ['#ff0000','#ff8800','#ffff00','#00ff00','#00ffff','#0088ff','#ff00ff']
    for (let i = 0; i < 7; i++) p(pc, 5 + i, 8, cols[i], 0.8)
  }

  // Shine dots
  p(pc, 6, 3, '#ffffffcc')
  p(pc, 7, 2, '#ffffff88')

  return toDataURL(canvas)
}

// ── Chest (64×64) ──────────────────────────────────────────────────────────

const CHEST_TEMPLATE = [
  '................',
  '................',
  '...KKKKKKKKKK...',
  '..KBBBBBBBBBBK..',
  '..KBAABBBBBBBK..',
  '..KBBBBBBBBBBK..',
  '..KKKKKKKKKKK...',
  '..KPPPPPPPPPPK..',
  '..KBBBBBBBBBBK..',
  '..KBBBBBBBBBBK..',
  '..KBBBBBBBBBBK..',
  '..KBBBBBBBBBBK..',
  '..KBBBBBBBBBBK..',
  '...KKKKKKKKKK...',
  '................',
  '................',
]

export function generateChestSprite(rarity: Rarity, state: 'closed'|'open'|'cracked' = 'closed'): string {
  const { canvas, pc } = createPC(16, 16)
  const rc = RARITY_COLOURS[rarity]

  const palMap: Record<string, string | [string, number]> = {
    K: '#2a1800',
    B: '#8b6534',
    A: lighten('#8b6534', 60),
    P: rc.primary,
    S: ['#000000', 0.2] as [string, number],
  }

  if (rarity === 'legendary' || rarity === 'mythic') {
    glow(pc, 2, 2, 12, 12, rc.glow, 8)
  }

  tmpl(pc, CHEST_TEMPLATE, palMap)

  // Lock clasp
  r(pc, 7, 6, 2, 2, rc.primary)

  if (state === 'cracked') {
    // Crack lines
    p(pc, 5, 8, '#0a0a0a'); p(pc, 6, 9, '#0a0a0a'); p(pc, 7, 10, '#0a0a0a')
    p(pc, 9, 7, '#0a0a0a'); p(pc, 10, 8, '#0a0a0a')
  } else if (state === 'open') {
    // Glow from inside
    r(pc, 3, 6, 10, 7, rc.glow, 0.4)
    r(pc, 4, 5, 8, 2, rc.glow, 0.6)
  }

  // Shine
  p(pc, 4, 3, '#ffffff88')
  p(pc, 5, 4, '#ffffff66')

  return toDataURL(canvas)
}

// ── Boss: Mushroom Matriarch ──────────────────────────────────────────────────

function drawBossMushroomMatriarch(pc: ReturnType<typeof createPC>['pc'], pal: ReturnType<typeof makeBossPalette>, w: number, h: number) {
  const capH = Math.floor(h * 0.45)
  const stemX = Math.floor(w / 2) - 5
  const stemW = 10

  // Giant rounded cap
  r(pc, 3, 3, w - 6, capH, pal.B)
  r(pc, 6, 1, w - 12, 4, pal.B)        // crown arch
  o(pc, 3, 3, w - 6, capH, pal.K)

  // Cap spots (big pale blobs)
  r(pc, 6, 5, 6, 5, pal.A)
  r(pc, w - 12, 5, 6, 5, pal.A)
  r(pc, w / 2 - 3, 3, 6, 4, pal.A)

  // Cracks in cap (damage lines)
  r(pc, w / 2 - 1, 1, 2, capH + 2, pal.D, 0.65)
  r(pc, w / 2 + 3, 6, 6, 1, pal.D, 0.55)
  r(pc, w / 2 - 7, 8, 5, 1, pal.D, 0.55)

  // Glowing eyes under cap brim
  const eyeY = capH
  r(pc, 8, eyeY, 5, 5, pal.X)
  r(pc, w - 13, eyeY, 5, 5, pal.X)
  r(pc, 9, eyeY + 1, 3, 3, '#44ff44')
  r(pc, w - 12, eyeY + 1, 3, 3, '#44ff44')
  p(pc, 10, eyeY + 2, '#ffffff')
  p(pc, w - 11, eyeY + 2, '#ffffff')

  // Spore puffs around cap edges
  r(pc, 0, 4, 4, 3, pal.A, 0.55)
  r(pc, w - 4, 4, 4, 3, pal.A, 0.55)
  r(pc, 0, 9, 3, 3, pal.A, 0.40)
  r(pc, w - 3, 9, 3, 3, pal.A, 0.40)

  // Stem (thick, pale)
  r(pc, stemX, capH + 4, stemW, h - capH - 8, pal.H)
  o(pc, stemX, capH + 4, stemW, h - capH - 8, pal.K)
  // Stem highlight
  r(pc, stemX + 1, capH + 5, 3, h - capH - 12, pal.A)
  // Stem ring (skirt/gills)
  r(pc, stemX - 4, capH + 3, stemW + 8, 3, pal.D)
  o(pc, stemX - 4, capH + 3, stemW + 8, 3, pal.K)

  // Root base
  r(pc, stemX - 3, h - 5, stemW + 6, 3, pal.D)
  o(pc, stemX - 3, h - 5, stemW + 6, 3, pal.K)

  // Ground shadow
  r(pc, 4, h - 4, w - 8, 2, '#00000044')
}

// ── Mount (16×12 logical, 96×72 canvas) ──────────────────────────────────────

interface MountInput {
  id: string
  rarity: Rarity
  element: string
  tags: string[]
  palette?: string[]
}

function makeMountPalette(mount: MountInput): ReturnType<typeof makeSpritePalette> {
  const cp = mount.palette ?? []
  const bodyBase = cp[0] ?? (ELEMENT_COLOURS[mount.element] ?? '#886644')
  const rc = RARITY_COLOURS[mount.rarity]
  return {
    K: '#111122',
    H: cp[2] ?? lighten(bodyBase, 45),
    B: bodyBase,
    A: lighten(bodyBase, 55),
    D: cp[1] ?? darken(bodyBase, 40),
    L: darken(bodyBase, 28),
    F: darken(bodyBase, 58),
    P: rc.primary,
    X: '#1a1a2e',
    E: '#ffffff',
    G: rc.glow,
    S: ['#000000', 0.25] as [string, number],
  }
}

// Tortoise — wide domed shell, head right, 4 stubs
function drawMountTortoise(pc: ReturnType<typeof createPC>['pc'], pal: ReturnType<typeof makeSpritePalette>) {
  r(pc, 2, 1, 11, 5, pal.B); o(pc, 2, 1, 11, 5, pal.K)
  r(pc, 4, 0, 7, 1, pal.K)   // top arch
  r(pc, 4, 2, 3, 2, pal.A);  r(pc, 8, 2, 3, 2, pal.A)   // shell highlights
  r(pc, 6, 4, 3, 1, pal.A)
  r(pc, 2, 6, 11, 1, pal.D)  // underbelly
  r(pc, 13, 3, 3, 3, pal.H); o(pc, 13, 3, 3, 3, pal.K)  // head peeking right
  p(pc, 14, 3, pal.X)          // eye
  r(pc, 3, 7, 2, 2, pal.H);  o(pc, 3, 7, 2, 2, pal.K)   // legs
  r(pc, 6, 7, 2, 2, pal.H);  o(pc, 6, 7, 2, 2, pal.K)
  r(pc, 9, 7, 2, 2, pal.H);  o(pc, 9, 7, 2, 2, pal.K)
  r(pc, 12, 7, 2, 2, pal.H); o(pc, 12, 7, 2, 2, pal.K)
  r(pc, 2, 10, 13, 1, '#000000', 0.22)
}

// Boar — stocky oval body, snout left, tusks, curly tail, 4 chunky legs
function drawMountBoar(pc: ReturnType<typeof createPC>['pc'], pal: ReturnType<typeof makeSpritePalette>) {
  r(pc, 3, 2, 10, 5, pal.B);  o(pc, 3, 2, 10, 5, pal.K)  // body
  r(pc, 0, 3, 5, 4, pal.H);   o(pc, 0, 3, 5, 4, pal.K)   // snout/head left
  p(pc, 0, 4, pal.D); p(pc, 0, 5, pal.D)  // nostrils
  p(pc, 3, 3, pal.X)          // eye
  p(pc, 0, 7, pal.A); p(pc, 1, 7, pal.A)  // tusks
  r(pc, 5, 3, 4, 2, pal.A)    // body highlight
  p(pc, 13, 3, pal.D); p(pc, 14, 4, pal.D); p(pc, 13, 5, pal.D)  // curly tail
  r(pc, 3, 7, 2, 3, pal.H);  o(pc, 3, 7, 2, 3, pal.K)   // legs
  r(pc, 6, 7, 2, 3, pal.H);  o(pc, 6, 7, 2, 3, pal.K)
  r(pc, 9, 7, 2, 3, pal.H);  o(pc, 9, 7, 2, 3, pal.K)
  r(pc, 12, 7, 2, 3, pal.H); o(pc, 12, 7, 2, 3, pal.K)
  r(pc, 3, 10, 2, 1, pal.F); r(pc, 6, 10, 2, 1, pal.F)   // hooves
  r(pc, 9, 10, 2, 1, pal.F); r(pc, 12, 10, 2, 1, pal.F)
  r(pc, 2, 11, 13, 1, '#000000', 0.22)
}

// Serpent — S-curve body with triangular head top-right, tail bottom-left
function drawMountSerpent(pc: ReturnType<typeof createPC>['pc'], pal: ReturnType<typeof makeSpritePalette>) {
  // Head + upper body (top-right)
  r(pc, 12, 0, 4, 3, pal.B); o(pc, 12, 0, 4, 3, pal.K)
  p(pc, 13, 0, pal.X)           // eye
  p(pc, 15, 1, pal.P); p(pc, 15, 2, pal.P)  // forked tongue
  // Upper body curve
  r(pc, 8, 2, 6, 3, pal.B); o(pc, 8, 2, 6, 3, pal.K)
  p(pc, 9, 2, pal.A); p(pc, 11, 2, pal.A); p(pc, 13, 3, pal.A)  // scales
  // Middle body
  r(pc, 4, 4, 7, 3, pal.B); o(pc, 4, 4, 7, 3, pal.K)
  p(pc, 5, 4, pal.A); p(pc, 7, 5, pal.A); p(pc, 9, 5, pal.A)
  // Lower body
  r(pc, 1, 7, 8, 3, pal.B); o(pc, 1, 7, 8, 3, pal.K)
  p(pc, 2, 7, pal.A); p(pc, 5, 8, pal.A); p(pc, 7, 8, pal.A)
  // Tail tip
  r(pc, 0, 9, 3, 2, pal.D)
  p(pc, 0, 10, pal.K); p(pc, 1, 11, pal.K)
  r(pc, 0, 11, 8, 1, '#000000', 0.18)
}

// Stag — slim body, antler branches, 4 long legs
function drawMountStag(pc: ReturnType<typeof createPC>['pc'], pal: ReturnType<typeof makeSpritePalette>) {
  // Antlers
  r(pc, 4, 0, 1, 4, pal.D)
  p(pc, 3, 0, pal.D); p(pc, 3, 1, pal.D); p(pc, 5, 0, pal.D)
  r(pc, 10, 0, 1, 4, pal.D)
  p(pc, 9, 0, pal.D); p(pc, 9, 1, pal.D); p(pc, 11, 0, pal.D)
  // Body
  r(pc, 3, 4, 10, 4, pal.B); o(pc, 3, 4, 10, 4, pal.K)
  r(pc, 5, 5, 5, 2, pal.A)    // highlight
  // Head
  r(pc, 5, 2, 5, 3, pal.H);  o(pc, 5, 2, 5, 3, pal.K)
  p(pc, 6, 2, pal.X)           // eye
  p(pc, 9, 4, pal.D)           // nose
  // 4 slim legs
  r(pc, 4, 8, 1, 3, pal.L); r(pc, 7, 8, 1, 3, pal.L)
  r(pc, 9, 8, 1, 3, pal.L); r(pc, 12, 8, 1, 3, pal.L)
  // Hooves
  p(pc, 4, 11, pal.F); p(pc, 7, 11, pal.F)
  p(pc, 9, 11, pal.F); p(pc, 12, 11, pal.F)
  r(pc, 3, 11, 11, 1, '#000000', 0.20)
}

// Drake — wings spread, chunky body, head right, tail left
function drawMountDrake(pc: ReturnType<typeof createPC>['pc'], pal: ReturnType<typeof makeSpritePalette>) {
  // Wings
  r(pc, 0, 2, 5, 4, pal.D);  o(pc, 0, 2, 5, 4, pal.K)
  r(pc, 11, 2, 5, 4, pal.D); o(pc, 11, 2, 5, 4, pal.K)
  p(pc, 1, 3, pal.P); p(pc, 2, 4, pal.P); p(pc, 3, 5, pal.P)     // left membrane
  p(pc, 14, 3, pal.P); p(pc, 13, 4, pal.P); p(pc, 12, 5, pal.P)  // right membrane
  // Body
  r(pc, 4, 3, 8, 5, pal.B); o(pc, 4, 3, 8, 5, pal.K)
  r(pc, 6, 4, 4, 2, pal.A)
  // Head + neck (right side)
  r(pc, 10, 0, 5, 4, pal.B); o(pc, 10, 0, 5, 4, pal.K)
  p(pc, 11, 1, pal.X)           // eye
  p(pc, 11, 0, pal.P); p(pc, 13, 0, pal.P)  // horns
  r(pc, 9, 2, 3, 3, pal.B)      // neck join
  // Tail (left)
  r(pc, 1, 6, 4, 2, pal.B)
  p(pc, 0, 7, pal.D); p(pc, 0, 8, pal.D)
  // Feet / claws
  r(pc, 5, 8, 2, 2, pal.H); r(pc, 9, 8, 2, 2, pal.H)
  p(pc, 5, 10, pal.K); p(pc, 6, 10, pal.K)
  p(pc, 9, 10, pal.K); p(pc, 10, 10, pal.K)
  r(pc, 4, 11, 8, 1, '#000000', 0.14)  // lighter shadow (flying)
}

export function generateMountSprite(mount: MountInput): string {
  const { canvas, pc } = createPC(16, 12)
  const pal = makeMountPalette(mount)
  const rc = RARITY_COLOURS[mount.rarity]
  const elemColor = ELEMENT_COLOURS[mount.element] ?? '#8888cc'

  if (mount.rarity === 'legendary' || mount.rarity === 'mythic') {
    glow(pc, 2, 1, 12, 9, rc.glow, 8)
  } else if (mount.rarity === 'epic') {
    glow(pc, 3, 1, 10, 8, rc.glow, 5)
  }

  const t = mount.tags.join(' ').toLowerCase()
  const id = mount.id.toLowerCase()

  if (t.includes('serpent'))                              drawMountSerpent(pc, pal)
  else if (t.includes('drake') || t.includes('dragon'))  drawMountDrake(pc, pal)
  else if (id.includes('tortoise'))                      drawMountTortoise(pc, pal)
  else if (id.includes('stag') || t.includes('majestic')) drawMountStag(pc, pal)
  else                                                   drawMountBoar(pc, pal)

  // Rainbow drake: rainbow tint row
  if (mount.rarity === 'mythic' && t.includes('drake')) {
    const cols = ['#ff0000','#ff8800','#ffff00','#00ff00','#00ffff','#0088ff','#ff00ff','#ff0000']
    for (let i = 0; i < 8; i++) p(pc, 4 + i, 3, cols[i], 0.55)
    for (let i = 0; i < 8; i++) p(pc, 4 + i, 6, cols[(i + 4) % 8], 0.35)
  }

  if (mount.rarity !== 'common') {
    p(pc, 0, 0, rc.primary); p(pc, 15, 0, rc.primary)
    p(pc, 0, 11, rc.primary); p(pc, 15, 11, rc.primary)
  }

  addSpriteShading(pc, elemColor)
  return toDataURL(canvas)
}
