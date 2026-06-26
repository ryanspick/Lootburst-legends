// Zone background definitions for canvas rendering
// Each zone has 3 parallax layers drawn onto the combat canvas

export interface ZoneLayer {
  id: string
  speed: number  // 0=static, 1=full scroll (unused for now, keeps API open)
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number, timeMs: number) => void
}

export interface ZoneDef {
  id: string
  displayName: string
  skyColor: string       // top gradient stop
  groundColor: string    // floor color
  floorLineColor: string
  layers: ZoneLayer[]
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function crystal(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, color: string, alpha: number) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x, y - h)
  ctx.lineTo(x + h * 0.3, y)
  ctx.lineTo(x - h * 0.3, y)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function lantern(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, timeMs: number) {
  const flicker = 0.7 + 0.3 * Math.sin(timeMs / 300 + x)
  ctx.save()
  ctx.globalAlpha = flicker * 0.6
  ctx.shadowColor = color
  ctx.shadowBlur = 10
  ctx.fillStyle = color
  ctx.fillRect(x - 4, y, 8, 10)
  ctx.fillRect(x - 2, y - 6, 4, 6)
  ctx.globalAlpha = flicker * 0.15
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y + 5, 20, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// ─── Zone 0: Candy Cavern Rift ────────────────────────────────────────────────

const candyCavern: ZoneDef = {
  id: 'candy_cavern_rift',
  displayName: 'Candy Cavern Rift',
  skyColor: '#050714',
  groundColor: '#0d1233',
  floorLineColor: '#331866',
  layers: [
    {
      id: 'far_crystals',
      speed: 0,
      draw(ctx, w, h, timeMs) {
        // Pink/cyan crystal formations along bottom edge
        const positions = [30, 70, 130, 200, 260, 300, 340]
        positions.forEach((x, i) => {
          const hgt = 20 + (i * 7) % 30
          const col = i % 2 === 0 ? '#ff44aa' : '#44ffee'
          const pulse = 0.4 + 0.2 * Math.sin(timeMs / 1000 + i)
          crystal(ctx, x, h - 20, hgt, col, pulse)
        })
      },
    },
    {
      id: 'mid_fog',
      speed: 0.3,
      draw(ctx, w, h, timeMs) {
        // Slow cyan fog wisps
        for (let i = 0; i < 3; i++) {
          const x = ((timeMs * 0.01 + i * 140) % (w + 60)) - 30
          const y = h * 0.55 + Math.sin(timeMs / 2000 + i) * 20
          ctx.save()
          ctx.globalAlpha = 0.05
          const grad = ctx.createRadialGradient(x, y, 0, x, y, 60)
          grad.addColorStop(0, '#44ffee')
          grad.addColorStop(1, 'transparent')
          ctx.fillStyle = grad
          ctx.fillRect(x - 60, y - 60, 120, 120)
          ctx.restore()
        }
      },
    },
    {
      id: 'gold_cracks',
      speed: 0,
      draw(ctx, w, _h, timeMs) {
        // Gold crack lines along top
        ctx.save()
        ctx.strokeStyle = '#ffd700'
        ctx.lineWidth = 1
        ctx.globalAlpha = 0.15 + 0.1 * Math.sin(timeMs / 800)
        ctx.beginPath()
        ctx.moveTo(40, 8); ctx.lineTo(80, 20); ctx.lineTo(120, 12)
        ctx.moveTo(200, 5); ctx.lineTo(230, 18); ctx.lineTo(270, 10)
        ctx.moveTo(300, 8); ctx.lineTo(330, 15); ctx.lineTo(360, 5)
        ctx.stroke()
        ctx.restore()
      },
    },
  ],
}

// ─── Zone 1: Goblin Glitter Mines ─────────────────────────────────────────────

const goblinMines: ZoneDef = {
  id: 'goblin_glitter_mines',
  displayName: 'Goblin Glitter Mines',
  skyColor: '#0a0a00',
  groundColor: '#1a1000',
  floorLineColor: '#4a3000',
  layers: [
    {
      id: 'rails',
      speed: 0,
      draw(ctx, w, h) {
        ctx.save()
        ctx.strokeStyle = '#886644'
        ctx.lineWidth = 2
        ctx.globalAlpha = 0.4
        // Perspective rails
        ctx.beginPath()
        ctx.moveTo(0, h - 18)
        ctx.lineTo(w, h - 18)
        ctx.moveTo(0, h - 14)
        ctx.lineTo(w, h - 14)
        // Ties
        for (let x = 0; x < w; x += 28) {
          ctx.moveTo(x, h - 20)
          ctx.lineTo(x + 4, h - 12)
        }
        ctx.stroke()
        ctx.restore()
      },
    },
    {
      id: 'lanterns',
      speed: 0,
      draw(ctx, w, h, timeMs) {
        const xs = [40, 120, 210, 300]
        xs.forEach(x => lantern(ctx, x, h - 60, '#ffaa22', timeMs))
      },
    },
    {
      id: 'copper_dust',
      speed: 0.5,
      draw(ctx, w, h, timeMs) {
        for (let i = 0; i < 8; i++) {
          const x = ((timeMs * 0.02 + i * 50) % (w + 20)) - 10
          const y = 40 + (i * 37) % (h * 0.5)
          star(ctx, x, y, 1, 0.3 + 0.2 * Math.sin(timeMs / 500 + i))
        }
      },
    },
  ],
}

// ─── Zone 2: Void Arcade ──────────────────────────────────────────────────────

const voidArcade: ZoneDef = {
  id: 'void_arcade',
  displayName: 'Void Arcade',
  skyColor: '#0a0014',
  groundColor: '#110011',
  floorLineColor: '#440066',
  layers: [
    {
      id: 'grid',
      speed: 0,
      draw(ctx, w, h, timeMs) {
        ctx.save()
        const scroll = (timeMs * 0.02) % 20
        ctx.strokeStyle = '#4400aa'
        ctx.lineWidth = 0.5
        ctx.globalAlpha = 0.2
        // Perspective grid
        const vanX = w / 2
        const vanY = h * 0.45
        for (let i = 0; i <= 12; i++) {
          const x = (i / 12) * w
          ctx.beginPath()
          ctx.moveTo(vanX, vanY)
          ctx.lineTo(x, h)
          ctx.stroke()
        }
        for (let j = 0; j < 6; j++) {
          const t = 1 - ((j / 6 + scroll / 100) % 1)
          const y = vanY + (h - vanY) * t
          const xSpan = (w / 2) * (1 - t)
          ctx.beginPath()
          ctx.moveTo(vanX - xSpan * 6, y)
          ctx.lineTo(vanX + xSpan * 6, y)
          ctx.stroke()
        }
        ctx.restore()
      },
    },
    {
      id: 'glitch_blocks',
      speed: 0,
      draw(ctx, w, h, timeMs) {
        // Cyan/magenta glitch rectangles at edges
        const blocks = [[0, 80, 14, 8], [w - 14, 100, 14, 6], [0, 150, 10, 10], [w - 12, 60, 12, 8]]
        blocks.forEach(([x, y, bw, bh], i) => {
          const flicker = Math.sin(timeMs / 200 + i * 1.3) > 0.5
          ctx.save()
          ctx.globalAlpha = flicker ? 0.6 : 0.2
          ctx.fillStyle = i % 2 === 0 ? '#00ffff' : '#ff00ff'
          ctx.fillRect(x, y, bw, bh)
          ctx.restore()
        })
      },
    },
    {
      id: 'bullet_lights',
      speed: 1,
      draw(ctx, w, h, timeMs) {
        for (let i = 0; i < 5; i++) {
          const x = ((timeMs * 0.08 + i * 80) % (w + 20)) - 10
          const y = 30 + (i * 41) % 60
          ctx.save()
          ctx.globalAlpha = 0.5
          ctx.fillStyle = i % 2 === 0 ? '#ff00ff' : '#00ffff'
          ctx.fillRect(x, y, 3, 3)
          ctx.restore()
        }
      },
    },
  ],
}

// ─── Zone 3: Moon Vault ───────────────────────────────────────────────────────

const moonVault: ZoneDef = {
  id: 'moon_vault',
  displayName: 'Moon Vault',
  skyColor: '#050a14',
  groundColor: '#0a1422',
  floorLineColor: '#224488',
  layers: [
    {
      id: 'vault_doors',
      speed: 0,
      draw(ctx, w, h) {
        // Silver vault door silhouettes at edges
        ctx.save()
        ctx.fillStyle = '#334455'
        ctx.globalAlpha = 0.5
        ctx.fillRect(0, h * 0.3, 20, h * 0.5)
        ctx.fillRect(w - 20, h * 0.3, 20, h * 0.5)
        // Concentric ring on doors
        ctx.strokeStyle = '#667788'
        ctx.lineWidth = 1
        ctx.globalAlpha = 0.3
        ctx.beginPath(); ctx.arc(10, h * 0.55, 14, 0, Math.PI * 2); ctx.stroke()
        ctx.beginPath(); ctx.arc(w - 10, h * 0.55, 14, 0, Math.PI * 2); ctx.stroke()
        ctx.restore()
      },
    },
    {
      id: 'moonbeams',
      speed: 0,
      draw(ctx, w, h, timeMs) {
        const pulse = 0.05 + 0.03 * Math.sin(timeMs / 2000)
        ctx.save()
        ctx.globalAlpha = pulse
        const grad = ctx.createLinearGradient(w / 2 - 40, 0, w / 2 + 40, h * 0.7)
        grad.addColorStop(0, '#aaccff')
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad
        ctx.fillRect(w / 2 - 30, 0, 60, h * 0.7)
        ctx.restore()
      },
    },
    {
      id: 'floating_keys',
      speed: 0,
      draw(ctx, w, h, timeMs) {
        const positions = [[80, 50], [280, 40], [160, 30]]
        positions.forEach(([x, y], i) => {
          const bobY = y + Math.sin(timeMs / 1500 + i) * 5
          ctx.save()
          ctx.globalAlpha = 0.25
          ctx.fillStyle = '#aaaacc'
          ctx.fillRect(x - 3, bobY - 8, 6, 10)
          ctx.beginPath(); ctx.arc(x, bobY - 8, 4, 0, Math.PI * 2); ctx.stroke()
          ctx.restore()
        })
      },
    },
  ],
}

// ─── Zone 4: Starforge Nursery ────────────────────────────────────────────────

const starforgeNursery: ZoneDef = {
  id: 'starforge_nursery',
  displayName: 'Starforge Nursery',
  skyColor: '#050310',
  groundColor: '#0a0520',
  floorLineColor: '#442266',
  layers: [
    {
      id: 'star_clouds',
      speed: 0.1,
      draw(ctx, w, h, timeMs) {
        for (let i = 0; i < 20; i++) {
          const x = ((i * 23 + timeMs * 0.003) % w)
          const y = 10 + (i * 17) % (h * 0.4)
          const twinkle = 0.2 + 0.4 * Math.abs(Math.sin(timeMs / 600 + i))
          star(ctx, x, y, 0.8 + (i % 3) * 0.5, twinkle)
        }
      },
    },
    {
      id: 'forge_sparks',
      speed: 0,
      draw(ctx, w, h, timeMs) {
        // Rainbow sparks floating up from forge (bottom center)
        const colors = ['#ff4444','#ff8800','#ffff00','#44ff44','#44ffff','#ff44ff']
        for (let i = 0; i < 6; i++) {
          const t = ((timeMs * 0.0008 + i / 6) % 1)
          const x = w / 2 + Math.sin(i * 1.2) * 40
          const y = h * 0.6 - t * h * 0.5
          ctx.save()
          ctx.globalAlpha = (1 - t) * 0.5
          ctx.fillStyle = colors[i]
          ctx.fillRect(x - 1, y - 1, 2, 2)
          ctx.restore()
        }
      },
    },
    {
      id: 'gold_anvil_edge',
      speed: 0,
      draw(ctx, w, h) {
        // Gold anvil silhouette hints at edges
        ctx.save()
        ctx.fillStyle = '#553300'
        ctx.globalAlpha = 0.3
        // Left anvil
        ctx.fillRect(0, h - 40, 25, 20)
        ctx.fillRect(5, h - 52, 15, 14)
        // Right anvil
        ctx.fillRect(w - 25, h - 40, 25, 20)
        ctx.fillRect(w - 20, h - 52, 15, 14)
        ctx.restore()
      },
    },
  ],
}

export const ZONES: ZoneDef[] = [
  candyCavern,
  goblinMines,
  voidArcade,
  moonVault,
  starforgeNursery,
]

export function getZone(id: string): ZoneDef {
  return ZONES.find(z => z.id === id) ?? ZONES[0]
}
