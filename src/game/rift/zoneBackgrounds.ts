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

function stalactite(ctx: CanvasRenderingContext2D, x: number, len: number, w: number, color: string, alpha: number) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x - w / 2, 0)
  ctx.lineTo(x + w / 2, 0)
  ctx.lineTo(x, len)
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

function rockSilhouette(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  points: [number, number][],
  color: string,
  alpha: number,
) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x + points[0][0], y + points[0][1])
  for (let i = 1; i < points.length; i++) ctx.lineTo(x + points[i][0], y + points[i][1])
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

// ─── Zone 0: Candy Cavern Rift ────────────────────────────────────────────────

const candyCavern: ZoneDef = {
  id: 'candy_cavern_rift',
  displayName: 'Candy Cavern Rift',
  skyColor: '#0d0522',
  groundColor: '#1a0832',
  floorLineColor: '#6622aa',
  layers: [
    {
      id: 'cave_ceiling',
      speed: 0,
      draw(ctx, w, _h, timeMs) {
        // Cave roof band
        ctx.save()
        ctx.globalAlpha = 0.7
        const roofGrad = ctx.createLinearGradient(0, 0, 0, 38)
        roofGrad.addColorStop(0, '#1a0033')
        roofGrad.addColorStop(1, 'transparent')
        ctx.fillStyle = roofGrad
        ctx.fillRect(0, 0, w, 38)
        ctx.restore()

        // Stalactites hanging from top
        const stals: [number, number, number][] = [
          [25, 30, 7], [60, 18, 5], [90, 38, 9], [130, 22, 6],
          [165, 42, 10], [200, 15, 4], [235, 35, 8], [265, 20, 5],
          [300, 45, 11], [330, 25, 6], [360, 32, 8],
        ]
        stals.forEach(([x, len, ww], i) => {
          const pulse = 0.55 + 0.1 * Math.sin(timeMs / 1800 + i)
          stalactite(ctx, x, len, ww, '#661166', pulse)
          // Pink crystal tip glow
          ctx.save()
          ctx.globalAlpha = pulse * 0.4
          ctx.shadowColor = '#ff44aa'
          ctx.shadowBlur = 8
          ctx.fillStyle = '#ff88cc'
          ctx.beginPath()
          ctx.arc(x, len - 2, 2, 0, Math.PI * 2)
          ctx.fill()
          ctx.shadowBlur = 0
          ctx.restore()
        })
      },
    },
    {
      id: 'crystal_formations',
      speed: 0,
      draw(ctx, w, h, timeMs) {
        // Pink crystal clusters left wall
        const leftCrystals: [number, number, number, string][] = [
          [8, h - 28, 26, '#ff44aa'], [18, h - 38, 20, '#dd22cc'],
          [28, h - 22, 16, '#ff88dd'], [5, h - 42, 18, '#cc1177'],
        ]
        leftCrystals.forEach(([x, y, ht, col], i) => {
          const pulse = 0.5 + 0.15 * Math.sin(timeMs / 1200 + i * 0.7)
          ctx.save()
          ctx.globalAlpha = pulse
          ctx.shadowColor = col; ctx.shadowBlur = 12
          crystal(ctx, x, y, ht, col, 1)
          ctx.shadowBlur = 0
          ctx.restore()
        })

        // Cyan crystal clusters right wall
        const rightCrystals: [number, number, number, string][] = [
          [w - 8, h - 30, 28, '#00ffee'], [w - 20, h - 40, 22, '#22ddcc'],
          [w - 32, h - 24, 17, '#44ffdd'], [w - 12, h - 50, 20, '#00ccbb'],
        ]
        rightCrystals.forEach(([x, y, ht, col], i) => {
          const pulse = 0.45 + 0.15 * Math.sin(timeMs / 1400 + i * 0.9 + 1.5)
          ctx.save()
          ctx.globalAlpha = pulse
          ctx.shadowColor = col; ctx.shadowBlur = 14
          crystal(ctx, x, y, ht, col, 1)
          ctx.shadowBlur = 0
          ctx.restore()
        })

        // Scattered mid crystals (background)
        const midCrystals: [number, number, number, string][] = [
          [80, h - 15, 12, '#ff44aa'], [150, h - 12, 10, '#44ffee'],
          [220, h - 16, 14, '#ff88cc'], [290, h - 13, 11, '#22ddcc'],
        ]
        midCrystals.forEach(([x, y, ht, col], i) => {
          const pulse = 0.25 + 0.1 * Math.sin(timeMs / 1600 + i * 1.1)
          crystal(ctx, x, y, ht, col, pulse)
        })
      },
    },
    {
      id: 'gold_cracks_and_fog',
      speed: 0,
      draw(ctx, w, h, timeMs) {
        // Gold crack veins on floor
        ctx.save()
        ctx.strokeStyle = '#ffd700'
        ctx.lineWidth = 1
        ctx.globalAlpha = 0.22 + 0.08 * Math.sin(timeMs / 900)
        ctx.shadowColor = '#ffaa00'; ctx.shadowBlur = 6
        ctx.beginPath()
        ctx.moveTo(30, h - 8); ctx.lineTo(70, h - 16); ctx.lineTo(110, h - 10)
        ctx.moveTo(180, h - 6); ctx.lineTo(215, h - 18); ctx.lineTo(250, h - 9)
        ctx.moveTo(280, h - 7); ctx.lineTo(310, h - 14); ctx.lineTo(w - 20, h - 8)
        ctx.stroke()
        ctx.shadowBlur = 0
        ctx.restore()

        // Soft pink fog wisps drifting across mid
        for (let i = 0; i < 4; i++) {
          const x = ((timeMs * 0.008 + i * 100) % (w + 80)) - 40
          const y = h * 0.5 + Math.sin(timeMs / 2200 + i * 0.8) * 18
          ctx.save()
          ctx.globalAlpha = 0.06
          const grad = ctx.createRadialGradient(x, y, 0, x, y, 70)
          grad.addColorStop(0, '#ff66cc')
          grad.addColorStop(1, 'transparent')
          ctx.fillStyle = grad
          ctx.fillRect(x - 70, y - 70, 140, 140)
          ctx.restore()
        }

        // Floating crystal dust motes
        for (let i = 0; i < 12; i++) {
          const x = ((i * 31 + timeMs * 0.004) % w)
          const y = h * 0.3 + (i * 19) % (h * 0.45)
          const twinkle = 0.15 + 0.2 * Math.abs(Math.sin(timeMs / 700 + i * 0.6))
          const col = i % 2 === 0 ? '#ff88dd' : '#44ffee'
          ctx.save()
          ctx.globalAlpha = twinkle
          ctx.fillStyle = col
          ctx.fillRect(x, y, 1, 1)
          ctx.restore()
        }
      },
    },
  ],
}

// ─── Zone 1: Goblin Glitter Mines ─────────────────────────────────────────────

const goblinMines: ZoneDef = {
  id: 'goblin_glitter_mines',
  displayName: 'Goblin Glitter Mines',
  skyColor: '#0a0800',
  groundColor: '#1e1200',
  floorLineColor: '#5a3800',
  layers: [
    {
      id: 'mine_walls',
      speed: 0,
      draw(ctx, w, h, timeMs) {
        // Rough stone ceiling band
        ctx.save()
        ctx.globalAlpha = 0.75
        const ceilGrad = ctx.createLinearGradient(0, 0, 0, 45)
        ceilGrad.addColorStop(0, '#110900')
        ceilGrad.addColorStop(1, 'transparent')
        ctx.fillStyle = ceilGrad
        ctx.fillRect(0, 0, w, 45)
        ctx.restore()

        // Left stone wall slab
        ctx.save()
        ctx.globalAlpha = 0.55
        const leftWall = ctx.createLinearGradient(0, 0, 35, 0)
        leftWall.addColorStop(0, '#1a0e00')
        leftWall.addColorStop(1, 'transparent')
        ctx.fillStyle = leftWall
        ctx.fillRect(0, 0, 35, h)
        ctx.restore()

        // Right stone wall slab
        ctx.save()
        ctx.globalAlpha = 0.55
        const rightWall = ctx.createLinearGradient(w, 0, w - 35, 0)
        rightWall.addColorStop(0, '#1a0e00')
        rightWall.addColorStop(1, 'transparent')
        ctx.fillStyle = rightWall
        ctx.fillRect(w - 35, 0, 35, h)
        ctx.restore()

        // Copper ore veins on ceiling
        ctx.save()
        ctx.strokeStyle = '#cd7f32'
        ctx.lineWidth = 1.5
        ctx.globalAlpha = 0.35
        ctx.beginPath()
        ctx.moveTo(10, 5); ctx.lineTo(55, 18); ctx.lineTo(90, 8)
        ctx.moveTo(120, 3); ctx.lineTo(160, 22); ctx.lineTo(195, 12)
        ctx.moveTo(220, 6); ctx.lineTo(260, 25); ctx.lineTo(300, 14)
        ctx.moveTo(320, 4); ctx.lineTo(w - 10, 20)
        ctx.stroke()
        ctx.restore()

        // Gold ore glint spots
        const goldSpots = [[45, 14], [155, 19], [255, 22], [330, 16]]
        goldSpots.forEach(([x, y], i) => {
          const pulse = 0.4 + 0.25 * Math.abs(Math.sin(timeMs / 900 + i))
          ctx.save()
          ctx.globalAlpha = pulse
          ctx.fillStyle = '#ffd700'
          ctx.shadowColor = '#ffaa00'; ctx.shadowBlur = 8
          ctx.fillRect(x - 2, y - 2, 4, 4)
          ctx.shadowBlur = 0
          ctx.restore()
        })
      },
    },
    {
      id: 'rails_and_lanterns',
      speed: 0,
      draw(ctx, w, h, timeMs) {
        // Rail ties
        ctx.save()
        ctx.strokeStyle = '#6b4a1e'
        ctx.lineWidth = 3
        ctx.globalAlpha = 0.45
        for (let x = 0; x < w; x += 22) {
          ctx.beginPath()
          ctx.moveTo(x, h - 22)
          ctx.lineTo(x + 6, h - 14)
          ctx.stroke()
        }
        ctx.restore()

        // Rail tracks
        ctx.save()
        ctx.strokeStyle = '#886644'
        ctx.lineWidth = 2
        ctx.globalAlpha = 0.55
        ctx.beginPath()
        ctx.moveTo(0, h - 20); ctx.lineTo(w, h - 20)
        ctx.moveTo(0, h - 14); ctx.lineTo(w, h - 14)
        ctx.stroke()
        ctx.restore()

        // Hanging lanterns
        const lanternX = [45, 120, 205, 290, 355]
        lanternX.forEach(x => {
          // Hanging chain
          ctx.save()
          ctx.globalAlpha = 0.3
          ctx.strokeStyle = '#554433'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(x, 0); ctx.lineTo(x, 35)
          ctx.stroke()
          ctx.restore()
          lantern(ctx, x, 35, '#ffaa22', timeMs)
        })
      },
    },
    {
      id: 'mine_particles',
      speed: 0.5,
      draw(ctx, w, h, timeMs) {
        // Falling gold dust
        for (let i = 0; i < 10; i++) {
          const x = ((i * 40 + timeMs * 0.015 * (1 + i % 3 * 0.4)) % w)
          const y = ((timeMs * 0.03 * (0.8 + i * 0.05) + i * 60) % (h * 0.7))
          const alpha = 0.2 + 0.2 * Math.sin(timeMs / 400 + i)
          ctx.save()
          ctx.globalAlpha = alpha
          ctx.fillStyle = i % 3 === 0 ? '#ffd700' : '#cd7f32'
          ctx.fillRect(x, y, 1, 1)
          ctx.restore()
        }

        // Goblin eye glow hints in shadows (left/right edges)
        const glowPairs = [[8, h * 0.45], [w - 12, h * 0.42], [15, h * 0.6]]
        glowPairs.forEach(([x, y], i) => {
          const blink = Math.sin(timeMs / 2000 + i * 2.1) > 0.7 ? 0 : 1
          if (blink === 0) return
          ctx.save()
          ctx.globalAlpha = 0.25
          ctx.fillStyle = '#88ff22'
          ctx.shadowColor = '#88ff22'; ctx.shadowBlur = 6
          ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill()
          ctx.beginPath(); ctx.arc(x + 7, y, 2, 0, Math.PI * 2); ctx.fill()
          ctx.shadowBlur = 0
          ctx.restore()
        })
      },
    },
  ],
}

// ─── Zone 2: Void Arcade ──────────────────────────────────────────────────────

const voidArcade: ZoneDef = {
  id: 'void_arcade',
  displayName: 'Void Arcade',
  skyColor: '#07001a',
  groundColor: '#0e0020',
  floorLineColor: '#550088',
  layers: [
    {
      id: 'scanlines',
      speed: 0,
      draw(ctx, w, h, timeMs) {
        // CRT scanline overlay on upper area
        ctx.save()
        ctx.globalAlpha = 0.04
        ctx.fillStyle = '#000000'
        for (let y = 0; y < h * 0.55; y += 3) {
          ctx.fillRect(0, y, w, 1)
        }
        ctx.restore()

        // Subtle scanline scroll effect
        const scanY = (timeMs * 0.05) % h
        ctx.save()
        ctx.globalAlpha = 0.06
        const scanGrad = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20)
        scanGrad.addColorStop(0, 'transparent')
        scanGrad.addColorStop(0.5, '#ffffff')
        scanGrad.addColorStop(1, 'transparent')
        ctx.fillStyle = scanGrad
        ctx.fillRect(0, scanY - 20, w, 40)
        ctx.restore()
      },
    },
    {
      id: 'perspective_grid',
      speed: 0,
      draw(ctx, w, h, timeMs) {
        const scroll = (timeMs * 0.025) % 24
        const vanX = w / 2
        const vanY = h * 0.42
        ctx.save()
        ctx.strokeStyle = '#6600cc'
        ctx.lineWidth = 0.75
        ctx.globalAlpha = 0.28

        // Vertical perspective lines
        for (let i = 0; i <= 14; i++) {
          const x = (i / 14) * w
          ctx.beginPath()
          ctx.moveTo(vanX, vanY)
          ctx.lineTo(x, h)
          ctx.stroke()
        }
        // Horizontal grid rows
        for (let j = 0; j < 7; j++) {
          const t = 1 - ((j / 7 + scroll / 140) % 1)
          const y = vanY + (h - vanY) * t
          const halfSpan = (w / 2) * (1 - Math.pow(t, 0.6))
          ctx.beginPath()
          ctx.moveTo(vanX - halfSpan * 7, y)
          ctx.lineTo(vanX + halfSpan * 7, y)
          ctx.stroke()
        }
        ctx.restore()

        // Glowing horizon line
        ctx.save()
        ctx.globalAlpha = 0.2 + 0.1 * Math.sin(timeMs / 1200)
        const horizGrad = ctx.createLinearGradient(0, vanY, w, vanY)
        horizGrad.addColorStop(0, 'transparent')
        horizGrad.addColorStop(0.3, '#ff00ff')
        horizGrad.addColorStop(0.5, '#00ffff')
        horizGrad.addColorStop(0.7, '#ff00ff')
        horizGrad.addColorStop(1, 'transparent')
        ctx.fillStyle = horizGrad
        ctx.fillRect(0, vanY - 1, w, 2)
        ctx.restore()
      },
    },
    {
      id: 'glitch_elements',
      speed: 0,
      draw(ctx, w, h, timeMs) {
        // Glitch block artifacts at edges
        const blocks: [number, number, number, number, number][] = [
          [0, 75, 18, 7, 0], [w - 18, 95, 18, 6, 1],
          [0, 145, 12, 10, 0], [w - 14, 60, 14, 8, 1],
          [0, 200, 20, 4, 0], [w - 20, 180, 20, 5, 1],
        ]
        blocks.forEach(([x, y, bw, bh, side], i) => {
          const flicker = Math.sin(timeMs / (180 + i * 40) + i * 0.8) > 0.4
          ctx.save()
          ctx.globalAlpha = flicker ? 0.5 : 0.15
          ctx.fillStyle = side === 0 ? '#00ffff' : '#ff00ff'
          ctx.fillRect(x, y, bw, bh)
          ctx.restore()
        })

        // Neon power-up icons scattered in background
        const icons = [[55, 55], [w - 55, 70], [w / 2 - 80, 40], [w / 2 + 80, 45]]
        icons.forEach(([x, y], i) => {
          const pulse = 0.1 + 0.08 * Math.sin(timeMs / 800 + i * 1.4)
          ctx.save()
          ctx.globalAlpha = pulse
          ctx.fillStyle = i % 2 === 0 ? '#00ffff' : '#ff00ff'
          ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 8
          // Diamond icon
          ctx.beginPath()
          ctx.moveTo(x, y - 7); ctx.lineTo(x + 5, y); ctx.lineTo(x, y + 7); ctx.lineTo(x - 5, y)
          ctx.closePath(); ctx.fill()
          ctx.shadowBlur = 0
          ctx.restore()
        })

        // Scrolling bullet trail lights
        for (let i = 0; i < 6; i++) {
          const x = ((timeMs * 0.1 + i * 60) % (w + 20)) - 10
          const y = 25 + (i * 38) % 55
          ctx.save()
          ctx.globalAlpha = 0.45
          ctx.fillStyle = i % 2 === 0 ? '#ff00ff' : '#00ffff'
          ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 6
          ctx.fillRect(x, y, 3, 3)
          // Trailing pixels
          ctx.globalAlpha = 0.2
          ctx.fillRect(x - 5, y + 1, 4, 1)
          ctx.fillRect(x - 9, y + 1, 3, 1)
          ctx.shadowBlur = 0
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
  skyColor: '#050912',
  groundColor: '#0b1228',
  floorLineColor: '#1e3a6a',
  layers: [
    {
      id: 'vault_structure',
      speed: 0,
      draw(ctx, w, h, timeMs) {
        // Stone ceiling arch
        ctx.save()
        ctx.globalAlpha = 0.65
        const archGrad = ctx.createLinearGradient(0, 0, 0, 50)
        archGrad.addColorStop(0, '#0e1a2a')
        archGrad.addColorStop(1, 'transparent')
        ctx.fillStyle = archGrad
        ctx.fillRect(0, 0, w, 50)
        ctx.restore()

        // Left vault door slab
        ctx.save()
        ctx.fillStyle = '#1c2e44'
        ctx.globalAlpha = 0.6
        ctx.fillRect(0, h * 0.22, 28, h * 0.56)
        // Door rivets
        ctx.globalAlpha = 0.35
        ctx.fillStyle = '#8899bb'
        const rivetYs = [h * 0.3, h * 0.42, h * 0.54, h * 0.65]
        rivetYs.forEach(ry => {
          ctx.beginPath(); ctx.arc(14, ry, 3, 0, Math.PI * 2); ctx.fill()
        })
        // Door ring
        ctx.strokeStyle = '#667799'
        ctx.lineWidth = 1.5
        ctx.globalAlpha = 0.4
        ctx.beginPath(); ctx.arc(14, h * 0.48, 10, 0, Math.PI * 2); ctx.stroke()
        ctx.restore()

        // Right vault door slab
        ctx.save()
        ctx.fillStyle = '#1c2e44'
        ctx.globalAlpha = 0.6
        ctx.fillRect(w - 28, h * 0.22, 28, h * 0.56)
        ctx.globalAlpha = 0.35
        ctx.fillStyle = '#8899bb'
        rivetYs.forEach(ry => {
          ctx.beginPath(); ctx.arc(w - 14, ry, 3, 0, Math.PI * 2); ctx.fill()
        })
        ctx.strokeStyle = '#667799'
        ctx.lineWidth = 1.5
        ctx.globalAlpha = 0.4
        ctx.beginPath(); ctx.arc(w - 14, h * 0.48, 10, 0, Math.PI * 2); ctx.stroke()
        ctx.restore()

        // Stone floor tiles
        ctx.save()
        ctx.strokeStyle = '#1e3a6a'
        ctx.lineWidth = 0.5
        ctx.globalAlpha = 0.2
        for (let x = 0; x < w; x += 30) {
          ctx.beginPath(); ctx.moveTo(x, h - 22); ctx.lineTo(x, h); ctx.stroke()
        }
        ctx.restore()
      },
    },
    {
      id: 'moonbeams',
      speed: 0,
      draw(ctx, w, h, timeMs) {
        // Central moonbeam shaft
        const pulse = 0.06 + 0.025 * Math.sin(timeMs / 2400)
        ctx.save()
        ctx.globalAlpha = pulse
        const beam = ctx.createLinearGradient(w / 2 - 50, 0, w / 2 + 50, h * 0.6)
        beam.addColorStop(0, '#99ccff')
        beam.addColorStop(0.6, '#4477aa44')
        beam.addColorStop(1, 'transparent')
        ctx.fillStyle = beam
        ctx.beginPath()
        ctx.moveTo(w / 2 - 25, 0)
        ctx.lineTo(w / 2 + 25, 0)
        ctx.lineTo(w / 2 + 55, h * 0.65)
        ctx.lineTo(w / 2 - 55, h * 0.65)
        ctx.closePath()
        ctx.fill()
        ctx.restore()

        // Star field in upper sky
        const staticStars: [number, number, number][] = [
          [40, 12, 0.8], [85, 22, 0.6], [130, 8, 0.9], [175, 18, 0.7],
          [220, 11, 0.8], [265, 25, 0.5], [310, 14, 0.9], [345, 20, 0.6],
          [65, 35, 0.5], [155, 38, 0.6], [245, 32, 0.7], [320, 40, 0.5],
        ]
        staticStars.forEach(([x, y, sz], i) => {
          const twinkle = 0.3 + 0.25 * Math.abs(Math.sin(timeMs / 900 + i * 0.7))
          star(ctx, x, y, sz, twinkle)
        })

        // Moon disc in upper center
        ctx.save()
        ctx.globalAlpha = 0.18 + 0.04 * Math.sin(timeMs / 3000)
        ctx.fillStyle = '#ddeeff'
        ctx.shadowColor = '#aaccff'; ctx.shadowBlur = 20
        ctx.beginPath(); ctx.arc(w / 2, 22, 14, 0, Math.PI * 2); ctx.fill()
        // Moon crescent shadow
        ctx.globalAlpha = 0.1
        ctx.fillStyle = '#0a1222'
        ctx.beginPath(); ctx.arc(w / 2 + 5, 20, 12, 0, Math.PI * 2); ctx.fill()
        ctx.shadowBlur = 0
        ctx.restore()
      },
    },
    {
      id: 'floating_keys',
      speed: 0,
      draw(ctx, w, h, timeMs) {
        // Floating keys drifting in background
        const keys: [number, number, number][] = [
          [75, 55, 0], [255, 42, 1.2], [160, 32, 2.4], [310, 60, 0.6],
        ]
        keys.forEach(([x, y, phase], i) => {
          const bobY = y + Math.sin(timeMs / 1600 + phase) * 6
          const alpha = 0.2 + 0.08 * Math.sin(timeMs / 2000 + i)
          ctx.save()
          ctx.globalAlpha = alpha
          ctx.strokeStyle = '#aabbdd'
          ctx.fillStyle = '#aabbdd'
          ctx.lineWidth = 1.5
          // Key shaft
          ctx.fillRect(x - 2, bobY - 10, 4, 12)
          // Key bow
          ctx.beginPath(); ctx.arc(x, bobY - 12, 5, 0, Math.PI * 2); ctx.stroke()
          // Key teeth
          ctx.fillRect(x + 2, bobY - 2, 4, 2)
          ctx.fillRect(x + 2, bobY + 1, 3, 2)
          // Gold sparkle on key
          ctx.globalAlpha = alpha * 0.6
          ctx.fillStyle = '#ffd700'
          ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 4
          ctx.beginPath(); ctx.arc(x, bobY - 12, 2.5, 0, Math.PI * 2); ctx.fill()
          ctx.shadowBlur = 0
          ctx.restore()
        })

        // Silver motes drifting upward
        for (let i = 0; i < 8; i++) {
          const x = ((i * 48 + timeMs * 0.005) % w)
          const y = h * 0.65 - ((timeMs * 0.015 + i * 70) % (h * 0.55))
          const alpha = 0.15 + 0.1 * Math.sin(timeMs / 600 + i)
          star(ctx, x, y, 0.7, alpha)
        }
      },
    },
  ],
}

// ─── Zone 4: Starforge Nursery ────────────────────────────────────────────────

const starforgeNursery: ZoneDef = {
  id: 'starforge_nursery',
  displayName: 'Starforge Nursery',
  skyColor: '#040210',
  groundColor: '#0c0522',
  floorLineColor: '#3a1a66',
  layers: [
    {
      id: 'nebula_sky',
      speed: 0.08,
      draw(ctx, w, h, timeMs) {
        // Deep nebula clouds in background
        const clouds: [number, number, string, number][] = [
          [w * 0.2, h * 0.2, '#441166', 55],
          [w * 0.7, h * 0.15, '#113366', 65],
          [w * 0.45, h * 0.3, '#662244', 50],
          [w * 0.85, h * 0.35, '#224455', 45],
        ]
        clouds.forEach(([x, y, col, r], i) => {
          const drift = timeMs * 0.001 * (i % 2 === 0 ? 1 : -1)
          const cx = x + Math.sin(drift + i) * 8
          ctx.save()
          ctx.globalAlpha = 0.12
          const grad = ctx.createRadialGradient(cx, y, 0, cx, y, r)
          grad.addColorStop(0, col)
          grad.addColorStop(1, 'transparent')
          ctx.fillStyle = grad
          ctx.fillRect(cx - r, y - r, r * 2, r * 2)
          ctx.restore()
        })

        // Dense star field — two layers of density
        for (let i = 0; i < 28; i++) {
          const x = ((i * 13 + timeMs * 0.002) % w)
          const y = 6 + (i * 17) % (h * 0.5)
          const twinkle = 0.18 + 0.25 * Math.abs(Math.sin(timeMs / (500 + i * 30) + i * 0.5))
          const sz = i % 5 === 0 ? 1.2 : 0.7
          star(ctx, x, y, sz, twinkle)
        }
      },
    },
    {
      id: 'forge_glow',
      speed: 0,
      draw(ctx, w, h, timeMs) {
        // Forge glow rising from bottom center
        const pulse = 0.12 + 0.05 * Math.abs(Math.sin(timeMs / 600))
        ctx.save()
        ctx.globalAlpha = pulse
        const forgeGrad = ctx.createRadialGradient(w / 2, h + 10, 0, w / 2, h + 10, 90)
        forgeGrad.addColorStop(0, '#ff6600')
        forgeGrad.addColorStop(0.4, '#ff440044')
        forgeGrad.addColorStop(1, 'transparent')
        ctx.fillStyle = forgeGrad
        ctx.fillRect(w / 2 - 90, h - 45, 180, 55)
        ctx.restore()

        // Forge anvil silhouettes at bottom corners
        ctx.save()
        ctx.fillStyle = '#221100'
        ctx.globalAlpha = 0.55
        // Left anvil
        ctx.fillRect(0, h - 44, 30, 22)
        ctx.fillRect(6, h - 58, 18, 16)
        ctx.fillRect(3, h - 62, 10, 6)
        // Right anvil
        ctx.fillRect(w - 30, h - 44, 30, 22)
        ctx.fillRect(w - 24, h - 58, 18, 16)
        ctx.fillRect(w - 13, h - 62, 10, 6)
        // Anvil glow
        ctx.globalAlpha = 0.2 + 0.1 * Math.sin(timeMs / 400)
        ctx.fillStyle = '#ff6600'
        ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 12
        ctx.fillRect(0, h - 46, 30, 4)
        ctx.fillRect(w - 30, h - 46, 30, 4)
        ctx.shadowBlur = 0
        ctx.restore()

        // Constellation floor pattern
        ctx.save()
        ctx.globalAlpha = 0.1
        ctx.strokeStyle = '#446688'
        ctx.lineWidth = 0.5
        const constellPts: [number, number][] = [
          [80, h - 18], [120, h - 28], [155, h - 14], [195, h - 30],
          [230, h - 18], [260, h - 26], [295, h - 16],
        ]
        ctx.beginPath()
        constellPts.forEach(([x, y], i) => {
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        })
        ctx.stroke()
        constellPts.forEach(([x, y]) => {
          ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill()
        })
        ctx.restore()
      },
    },
    {
      id: 'sparks_and_motes',
      speed: 0,
      draw(ctx, w, h, timeMs) {
        // Rainbow forge sparks rising from bottom
        const sparkColors = ['#ff4444', '#ff8800', '#ffff00', '#44ff88', '#44ffff', '#ff44ff', '#ffffff']
        for (let i = 0; i < 9; i++) {
          const t = ((timeMs * 0.0007 + i / 9) % 1)
          const x = w / 2 + Math.sin(i * 1.4 + t * 2) * 50
          const y = h * 0.72 - t * h * 0.55
          const alpha = (1 - t) * 0.55
          ctx.save()
          ctx.globalAlpha = alpha
          ctx.fillStyle = sparkColors[i % sparkColors.length]
          ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 4
          ctx.fillRect(x - 1, y - 1, 2, 2)
          ctx.shadowBlur = 0
          ctx.restore()
        }

        // Gold star motes floating in upper half
        for (let i = 0; i < 7; i++) {
          const x = ((i * 55 + timeMs * 0.004) % w)
          const y = 15 + (i * 29) % (h * 0.38)
          const pulse = 0.2 + 0.25 * Math.abs(Math.sin(timeMs / 700 + i * 0.9))
          ctx.save()
          ctx.globalAlpha = pulse
          ctx.fillStyle = '#ffd700'
          ctx.shadowColor = '#ffaa00'; ctx.shadowBlur = 5
          ctx.fillRect(x - 1, y - 1, 2, 2)
          ctx.shadowBlur = 0
          ctx.restore()
        }
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
