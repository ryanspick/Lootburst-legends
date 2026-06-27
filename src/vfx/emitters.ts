import { spawnParticle } from './ParticleEngine'
import { ELEMENT_COLOURS, PALETTE, RARITY_COLOURS } from '@/constants/palette'
import type { Rarity } from '@/constants/palette'

type Pos = { x: number; y: number }

function rand(min: number, max: number) { return min + Math.random() * (max - min) }
function randPM(v: number) { return rand(-v, v) }

export function emitCoinBurst(pos: Pos, amount: number, rarity?: Rarity) {
  const color = rarity ? RARITY_COLOURS[rarity].primary : PALETTE.gold
  const count = Math.min(amount, 20)
  for (let i = 0; i < count; i++) {
    spawnParticle({
      x: pos.x, y: pos.y,
      vx: randPM(120), vy: rand(-200, -60),
      ay: 200, gravity: 300,
      lifetimeMs: rand(600, 1000),
      startScale: 1.2, endScale: 0.3,
      color, shape: 'diamond',
      zIndex: 60, blendMode: 'add',
    })
  }
}

export function emitGemScatter(pos: Pos, amount: number, rarity?: Rarity) {
  const color = rarity ? RARITY_COLOURS[rarity].glow : PALETTE.cyan
  for (let i = 0; i < Math.min(amount, 15); i++) {
    spawnParticle({
      x: pos.x, y: pos.y,
      vx: randPM(150), vy: rand(-180, -40),
      gravity: 280,
      lifetimeMs: rand(700, 1200),
      startScale: 1.5, endScale: 0,
      color, shape: 'star',
      zIndex: 60, blendMode: 'add',
    })
  }
}

export function emitHitSpark(pos: Pos, element: string) {
  const color = ELEMENT_COLOURS[element] ?? PALETTE.white
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + randPM(0.3)
    const speed = rand(80, 180)
    spawnParticle({
      x: pos.x, y: pos.y,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      lifetimeMs: rand(150, 300),
      startScale: 1, endScale: 0,
      startAlpha: 1, endAlpha: 0,
      color, shape: 'pixel',
      zIndex: 40, blendMode: 'add',
    })
  }
}

export function emitCritPop(pos: Pos) {
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2
    spawnParticle({
      x: pos.x, y: pos.y,
      vx: Math.cos(angle) * rand(100, 220), vy: Math.sin(angle) * rand(100, 220),
      lifetimeMs: rand(200, 400),
      startScale: 1.5, endScale: 0,
      color: PALETTE.whiteCrit, shape: 'star',
      zIndex: 50, blendMode: 'add',
    })
  }
}

export function emitSlashArc(start: Pos, end: Pos, element: string) {
  const color = ELEMENT_COLOURS[element] ?? PALETTE.white
  const steps = 8
  for (let i = 0; i < steps; i++) {
    const t = i / steps
    spawnParticle({
      x: start.x + (end.x - start.x) * t + randPM(6),
      y: start.y + (end.y - start.y) * t + randPM(6),
      vx: randPM(20), vy: randPM(20),
      lifetimeMs: rand(150, 300),
      startScale: 2, endScale: 0,
      color, shape: 'diamond',
      zIndex: 40, blendMode: 'add',
    })
  }
}

export function emitProjectileTrail(pos: Pos, element: string) {
  const color = ELEMENT_COLOURS[element] ?? PALETTE.white
  spawnParticle({
    x: pos.x + randPM(4), y: pos.y + randPM(4),
    vx: randPM(15), vy: randPM(15),
    lifetimeMs: rand(100, 200),
    startScale: 0.8, endScale: 0,
    color, shape: 'circle',
    zIndex: 30, blendMode: 'add',
  })
}

export function emitExplosion(pos: Pos, size: number, element: string) {
  const color = ELEMENT_COLOURS[element] ?? PALETTE.orange
  const count = Math.floor(size * 1.5)
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + randPM(0.4)
    const speed = rand(60, 200) * (size / 100)
    spawnParticle({
      x: pos.x, y: pos.y,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      ay: 50, gravity: 100,
      lifetimeMs: rand(400, 800),
      startScale: 2, endScale: 0,
      color, shape: 'circle',
      zIndex: 40, blendMode: 'add',
    })
  }
  // Core flash
  spawnParticle({
    x: pos.x, y: pos.y,
    vx: 0, vy: 0,
    lifetimeMs: 150,
    startScale: size / 20, endScale: 0,
    color: PALETTE.white, shape: 'circle',
    zIndex: 41, blendMode: 'add',
  })
}

export function emitPoisonBubbles(pos: Pos) {
  for (let i = 0; i < 8; i++) {
    spawnParticle({
      x: pos.x + randPM(20), y: pos.y,
      vx: randPM(20), vy: rand(-60, -20),
      lifetimeMs: rand(600, 1200),
      startScale: 1 + Math.random(), endScale: 0,
      startAlpha: 0.8, endAlpha: 0,
      color: PALETTE.lime, shape: 'circle',
      zIndex: 40,
    })
  }
}

export function emitFreezeCrack(pos: Pos) {
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2
    spawnParticle({
      x: pos.x, y: pos.y,
      vx: Math.cos(angle) * rand(40, 100), vy: Math.sin(angle) * rand(40, 100),
      lifetimeMs: rand(400, 700),
      startScale: 1.5, endScale: 0,
      color: PALETTE.cyan, shape: 'diamond',
      zIndex: 40, blendMode: 'add',
    })
  }
}

export function emitShieldBoing(pos: Pos) {
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2
    spawnParticle({
      x: pos.x + Math.cos(angle) * 30, y: pos.y + Math.sin(angle) * 30,
      vx: Math.cos(angle) * 40, vy: Math.sin(angle) * 40,
      lifetimeMs: rand(300, 500),
      startScale: 1, endScale: 0,
      color: PALETTE.cyanShield, shape: 'circle',
      zIndex: 40, blendMode: 'add',
    })
  }
}

export function emitGoldBeam(pos: Pos, rarity: Rarity = 'legendary') {
  const color = RARITY_COLOURS[rarity].primary
  const glowColor = RARITY_COLOURS[rarity].glow
  // Vertical beam particles
  for (let i = 0; i < 20; i++) {
    spawnParticle({
      x: pos.x + randPM(8), y: pos.y - rand(0, 200),
      vx: randPM(15), vy: rand(-80, -20),
      lifetimeMs: rand(500, 900),
      startScale: 1.5, endScale: 0,
      color: i % 3 === 0 ? PALETTE.white : color, shape: 'square',
      zIndex: 70, blendMode: 'add',
    })
  }
  // Coin rain
  for (let i = 0; i < 12; i++) {
    spawnParticle({
      x: pos.x + randPM(60), y: pos.y - rand(100, 300),
      vx: randPM(30), vy: rand(50, 120),
      gravity: 200,
      lifetimeMs: rand(800, 1400),
      startScale: 1.2, endScale: 0.4,
      color: glowColor, shape: 'diamond',
      zIndex: 60, blendMode: 'add',
    })
  }
}

export function emitRainbowMythicBurst(pos: Pos) {
  const colors = PALETTE.rainbow
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * Math.PI * 2 + randPM(0.2)
    const speed = rand(100, 400)
    spawnParticle({
      x: pos.x, y: pos.y,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      lifetimeMs: rand(600, 1400),
      startScale: 2, endScale: 0,
      colors: [...colors], shape: i % 3 === 0 ? 'star' : 'circle',
      zIndex: 70, blendMode: 'add',
    })
  }
  // Constellation specks
  for (let i = 0; i < 30; i++) {
    spawnParticle({
      x: pos.x + randPM(200), y: pos.y + randPM(200),
      vx: randPM(20), vy: randPM(20),
      lifetimeMs: rand(1000, 2000),
      startScale: 0.5, endScale: 0,
      startAlpha: 1, endAlpha: 0,
      color: PALETTE.white, shape: 'star',
      zIndex: 70, blendMode: 'add',
    })
  }
}

export function emitChestVolcano(pos: Pos, lootCount: number) {
  const count = Math.min(lootCount * 4, 40)
  const colors = [PALETTE.gold, PALETTE.goldLight, PALETTE.pink, PALETTE.cyan, PALETTE.orange]
  for (let i = 0; i < count; i++) {
    const angle = rand(-Math.PI * 0.8, -Math.PI * 0.2)
    spawnParticle({
      x: pos.x + randPM(10), y: pos.y,
      vx: Math.cos(angle) * rand(80, 250), vy: Math.sin(angle) * rand(150, 350),
      gravity: 400,
      lifetimeMs: rand(700, 1400),
      startScale: 1.5, endScale: 0.2,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: i % 4 === 0 ? 'star' : 'diamond',
      zIndex: 60, blendMode: 'add',
    })
  }
}

export function emitCapsuleCrack(pos: Pos, rarity: Rarity) {
  const color = RARITY_COLOURS[rarity].primary
  const glow = RARITY_COLOURS[rarity].glow
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2 + randPM(0.3)
    spawnParticle({
      x: pos.x, y: pos.y,
      vx: Math.cos(angle) * rand(60, 200), vy: Math.sin(angle) * rand(60, 200),
      lifetimeMs: rand(400, 900),
      startScale: 1.5, endScale: 0,
      color: i % 3 === 0 ? glow : color, shape: 'square',
      zIndex: 70, blendMode: 'add',
    })
  }
}

export function emitUpgradeCardSparkle(cardRect: { x: number; y: number; w: number; h: number }, rarity: Rarity) {
  const color = RARITY_COLOURS[rarity].glow
  for (let i = 0; i < 12; i++) {
    spawnParticle({
      x: cardRect.x + Math.random() * cardRect.w,
      y: cardRect.y + Math.random() * cardRect.h,
      vx: randPM(30), vy: rand(-60, -20),
      lifetimeMs: rand(400, 800),
      startScale: 1, endScale: 0,
      color, shape: 'star',
      zIndex: 50, blendMode: 'add',
    })
  }
}

// Candy-color palettes per element
const DEATH_CANDY: Record<string, string[]> = {
  fire:    ['#ff6644', '#ffaa22', '#ff3300', '#ffdd44'],
  ice:     ['#88eeff', '#aaffff', '#66aaff', '#ffffff'],
  poison:  ['#88ff44', '#44ff88', '#aaff22', '#ccff66'],
  shadow:  ['#cc44ff', '#ff44ff', '#8844cc', '#ff88ff'],
  machine: ['#44ffcc', '#22aaff', '#00ffee', '#88ddff'],
  nature:  ['#44ff22', '#88ee00', '#22dd44', '#bbff44'],
  gold:    ['#ffd700', '#ffaa00', '#ffee44', '#ffcc00'],
  storm:   ['#ffee00', '#aaddff', '#ffffff', '#ffff88'],
}
const DEATH_CANDY_DEFAULT = ['#ff88cc', '#88aaff', '#ffcc44', '#44ffcc']

export function emitEnemyDeath(pos: Pos, element: string, isBoss = false, isElite = false) {
  const elColor = ELEMENT_COLOURS[element] ?? '#ff8844'
  const candy = DEATH_CANDY[element] ?? DEATH_CANDY_DEFAULT
  // Combined palette: element candy + bright accents
  const pal = [...candy, '#ffffff', '#ff66cc', '#66ffee']

  const burstCount  = isBoss ? 55 : isElite ? 32 : 20
  const maxSpeed    = isBoss ? 340 : isElite ? 240 : 175
  const maxLife     = isBoss ? 950 : isElite ? 700 : 540
  const maxScale    = isBoss ? 3.2 : isElite ? 2.6 : 2.0
  const shapes      = ['star', 'diamond', 'square', 'circle', 'pixel'] as const

  // Phase 1 — radial candy confetti burst
  for (let i = 0; i < burstCount; i++) {
    const angle = (i / burstCount) * Math.PI * 2 + randPM(0.45)
    const speed = rand(55, maxSpeed)
    spawnParticle({
      x: pos.x, y: pos.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - rand(15, 55),
      gravity: 380,
      lifetimeMs: rand(280, maxLife),
      startScale: rand(1.4, maxScale), endScale: 0,
      color: pal[i % pal.length],
      shape: shapes[i % shapes.length],
      zIndex: 45, blendMode: 'add',
    })
  }

  // Phase 2 — white core flash pop
  spawnParticle({
    x: pos.x, y: pos.y, vx: 0, vy: 0,
    lifetimeMs: isBoss ? 260 : 140,
    startScale: isBoss ? 9 : isElite ? 6 : 4.2, endScale: 0,
    startAlpha: 1, endAlpha: 0,
    color: '#ffffff', shape: 'circle',
    zIndex: 50, blendMode: 'add',
  })

  // Phase 3 — element color ring expanding outward
  const ringN = isBoss ? 18 : 10
  const ringR = isBoss ? 50 : isElite ? 34 : 22
  for (let i = 0; i < ringN; i++) {
    const angle = (i / ringN) * Math.PI * 2
    spawnParticle({
      x: pos.x + Math.cos(angle) * ringR,
      y: pos.y + Math.sin(angle) * ringR,
      vx: Math.cos(angle) * rand(35, 80),
      vy: Math.sin(angle) * rand(35, 80) - 15,
      lifetimeMs: rand(200, 480),
      startScale: isBoss ? 2.2 : 1.6, endScale: 0,
      startAlpha: 0.9, endAlpha: 0,
      color: elColor, shape: 'circle',
      zIndex: 44, blendMode: 'add',
    })
  }

  // Phase 4 — gold coin shower (dopamine reward feel)
  const coinCount = isBoss ? 22 : isElite ? 12 : 6
  for (let i = 0; i < coinCount; i++) {
    spawnParticle({
      x: pos.x + randPM(14), y: pos.y + randPM(8),
      vx: randPM(90), vy: rand(-240, -80),
      gravity: 480,
      lifetimeMs: rand(480, 950),
      startScale: 1.4, endScale: 0.3,
      color: i % 3 === 0 ? '#ffee44' : '#ffd700',
      shape: 'diamond',
      zIndex: 47, blendMode: 'add',
    })
  }

  // Phase 5 — candy mini-stars (short-lived sparkles)
  const starCount = isBoss ? 24 : isElite ? 14 : 8
  for (let i = 0; i < starCount; i++) {
    const angle = rand(0, Math.PI * 2)
    const r = rand(8, isBoss ? 60 : 35)
    spawnParticle({
      x: pos.x + Math.cos(angle) * r,
      y: pos.y + Math.sin(angle) * r,
      vx: randPM(40), vy: rand(-80, -20),
      lifetimeMs: rand(150, 380),
      startScale: rand(1, 2.2), endScale: 0,
      color: candy[i % candy.length],
      shape: 'star',
      zIndex: 46, blendMode: 'add',
    })
  }

  // Boss-only: extra rainbow star ring + screen-wide rain
  if (isBoss) {
    const cols = ['#ff4444','#ffdd00','#44ff88','#44aaff','#ff44ff','#ffaa00','#aaffff']
    for (let i = 0; i < 28; i++) {
      const angle = (i / 28) * Math.PI * 2
      spawnParticle({
        x: pos.x, y: pos.y,
        vx: Math.cos(angle) * rand(70, 190),
        vy: Math.sin(angle) * rand(70, 190) - 50,
        lifetimeMs: rand(700, 1500),
        startScale: 3.2, endScale: 0,
        colors: cols,
        shape: 'star',
        zIndex: 48, blendMode: 'add',
      })
    }
  }
}

export function emitGearDropGlow(pos: Pos, rarity: Rarity) {
  const color = RARITY_COLOURS[rarity].primary
  const glowC = RARITY_COLOURS[rarity].glow
  const count = rarity === 'legendary' || rarity === 'mythic' ? 28 : rarity === 'epic' ? 18 : 10
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2
    spawnParticle({
      x: pos.x + Math.cos(angle) * 12, y: pos.y + Math.sin(angle) * 12,
      vx: Math.cos(angle) * rand(25, 80), vy: Math.sin(angle) * rand(25, 80) - 40,
      gravity: 150,
      lifetimeMs: rand(500, 1100),
      startScale: 1.5, endScale: 0,
      color: i % 3 === 0 ? glowC : color,
      shape: 'star', zIndex: 55, blendMode: 'add',
    })
  }
  for (let i = 0; i < 6; i++) {
    spawnParticle({
      x: pos.x + randPM(4), y: pos.y,
      vx: randPM(12), vy: rand(-100, -50),
      lifetimeMs: rand(350, 700),
      startScale: 1, endScale: 0,
      color, shape: 'square', zIndex: 55, blendMode: 'add',
    })
  }
}

export function emitRarityBurst(pos: Pos, rarity: Rarity) {
  const RARITY_PALETTES: Record<string, string[]> = {
    rare:      ['#4488ff', '#88aaff', '#ffffff', '#aaccff'],
    epic:      ['#aa44ff', '#cc88ff', '#ffffff', '#ff88ff'],
    legendary: ['#ffd700', '#ffaa00', '#ffffff', '#ffe866'],
    mythic:    ['#ff00ff', '#ff0000', '#ffff00', '#00ffff', '#ffffff'],
  }
  const palette = RARITY_PALETTES[rarity] ?? RARITY_PALETTES.rare
  const count = rarity === 'mythic' ? 60 : rarity === 'legendary' ? 45 : 30
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2
    const speed = rand(120, 280)
    spawnParticle({
      x: pos.x, y: pos.y,
      vx: Math.cos(angle) * speed + randPM(40),
      vy: Math.sin(angle) * speed + randPM(40),
      lifetimeMs: rand(500, 1200),
      startScale: rand(1.2, 2.8), endScale: 0,
      color: palette[i % palette.length],
      shape: i % 3 === 0 ? 'star' : i % 3 === 1 ? 'diamond' : 'circle',
      zIndex: 65, blendMode: 'add',
    })
  }
  // Core flash
  for (let i = 0; i < 8; i++) {
    spawnParticle({
      x: pos.x + randPM(10), y: pos.y + randPM(10),
      vx: randPM(30), vy: rand(-60, -20),
      lifetimeMs: rand(200, 400),
      startScale: rand(2, 4), endScale: 0,
      color: '#ffffff',
      shape: 'circle',
      zIndex: 66, blendMode: 'add',
    })
  }
}

export function emitComboText(pos: Pos, combo: number) {
  const colors = ['#ffdd00', '#ff8800', '#ff4400', '#ff00ff', '#ffffff']
  const color = colors[Math.min(combo - 2, colors.length - 1)]
  for (let i = 0; i < combo * 2; i++) {
    spawnParticle({
      x: pos.x + randPM(30), y: pos.y + randPM(20),
      vx: randPM(60), vy: rand(-100, -40),
      lifetimeMs: rand(300, 600),
      startScale: 1, endScale: 0,
      color, shape: i % 2 === 0 ? 'star' : 'diamond',
      zIndex: 52, blendMode: 'add',
    })
  }
}

export function emitHeroTrail(pos: Pos, color: string) {
  for (let i = 0; i < 2; i++) {
    spawnParticle({
      x: pos.x + randPM(10), y: pos.y + randPM(10),
      vx: randPM(12), vy: rand(-25, 8),
      lifetimeMs: rand(180, 340),
      startScale: rand(0.5, 1.1), endScale: 0,
      startAlpha: 0.75, endAlpha: 0,
      color, shape: 'circle',
      zIndex: 18, blendMode: 'add',
    })
  }
}
