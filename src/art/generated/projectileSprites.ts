// Pre-generates pixel-art orb sprites for each element × ability type.
// Sizes: basic=18, skill=28, ultimate=44. Cached by key after first use.

type AbilityType = 'basic' | 'skill' | 'ultimate'

interface OrbPalette {
  core: string
  bright: string
  mid: string
  outer: string
  rim: string
}

const ELEMENT_PALETTE: Record<string, OrbPalette> = {
  fire:     { core: '#ffffff', bright: '#ffe0a0', mid: '#ff7722', outer: '#cc2200', rim: '#660000' },
  ice:      { core: '#ffffff', bright: '#e0f8ff', mid: '#66ddff', outer: '#2288dd', rim: '#004488' },
  earth:    { core: '#ffffff', bright: '#ddffaa', mid: '#88cc33', outer: '#446600', rim: '#223300' },
  void:     { core: '#ffffff', bright: '#f0d0ff', mid: '#cc44ff', outer: '#7700cc', rim: '#330055' },
  arcane:   { core: '#ffffff', bright: '#ffe0ff', mid: '#ff88ee', outer: '#cc00aa', rim: '#660044' },
  nature:   { core: '#ffffff', bright: '#d0ffd8', mid: '#44ff88', outer: '#008844', rim: '#003322' },
  electric: { core: '#ffffff', bright: '#ffffd0', mid: '#ffee44', outer: '#ff8800', rim: '#663300' },
  water:    { core: '#ffffff', bright: '#d0e8ff', mid: '#4488ff', outer: '#0033cc', rim: '#001155' },
  metal:    { core: '#ffffff', bright: '#eef4ff', mid: '#bbccdd', outer: '#778899', rim: '#334455' },
  shadow:   { core: '#ffffff', bright: '#ead0ff', mid: '#8844cc', outer: '#440088', rim: '#110033' },
  light:    { core: '#ffffff', bright: '#fffff0', mid: '#ffeeaa', outer: '#ddaa00', rim: '#886600' },
}
const DEFAULT_PAL: OrbPalette = {
  core: '#ffffff', bright: '#ddddff', mid: '#8888ff', outer: '#4444cc', rim: '#221144',
}

function pal(element: string): OrbPalette {
  return ELEMENT_PALETTE[element] ?? DEFAULT_PAL
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ]
}

function lerpColor(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  const r    = Math.round(ar + (br - ar) * t)
  const g    = Math.round(ag + (bg - ag) * t)
  const blue = Math.round(ab + (bb - ab) * t)
  return `rgb(${r},${g},${blue})`
}

function paintOrb(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  p: OrbPalette,
  withRings = false,
  withStarburst = false,
): void {
  const ir = Math.floor(r)
  const img = ctx.createImageData(ir * 2 + 1, ir * 2 + 1)
  const d = img.data

  for (let py = -ir; py <= ir; py++) {
    for (let px = -ir; px <= ir; px++) {
      const dist = Math.sqrt(px * px + py * py)
      if (dist > ir) continue

      const norm = dist / ir
      let color: string
      let alpha = 255

      if      (norm < 0.10) color = '#ffffff'
      else if (norm < 0.25) color = lerpColor('#ffffff', p.bright, (norm - 0.10) / 0.15)
      else if (norm < 0.52) color = lerpColor(p.bright,  p.mid,   (norm - 0.25) / 0.27)
      else if (norm < 0.78) color = lerpColor(p.mid,    p.outer,  (norm - 0.52) / 0.26)
      else if (norm < 0.94) color = lerpColor(p.outer,  p.rim,    (norm - 0.78) / 0.16)
      else { color = p.rim; alpha = Math.round(255 * (1 - (norm - 0.94) / 0.06)) }

      // Upper-left specular highlight
      const hl = (px < 0 && py < 0) ? Math.max(0, 1 - norm * 2.0) * 0.45 : 0
      const [r2, g2, b2] = hexToRgb(color)
      const idx = ((py + ir) * (ir * 2 + 1) + (px + ir)) * 4
      d[idx]     = Math.min(255, r2 + Math.round(hl * 255))
      d[idx + 1] = Math.min(255, g2 + Math.round(hl * 255))
      d[idx + 2] = Math.min(255, b2 + Math.round(hl * 255))
      d[idx + 3] = alpha
    }
  }

  ctx.putImageData(img, Math.round(cx - ir), Math.round(cy - ir))

  if (withRings) {
    ctx.save()
    ctx.strokeStyle = p.mid + 'cc'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(cx, cy, r + 2.5, 0, Math.PI * 2)
    ctx.stroke()
    ctx.strokeStyle = p.outer + '88'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(cx, cy, r + 5.0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.strokeStyle = p.rim + '44'
    ctx.lineWidth = 0.5
    ctx.beginPath()
    ctx.arc(cx, cy, r + 7.5, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }

  if (withStarburst) {
    ctx.save()
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const isMain = i % 2 === 0
      ctx.globalAlpha = isMain ? 0.65 : 0.38
      ctx.strokeStyle = isMain ? p.bright : p.mid
      ctx.lineWidth = isMain ? 1.5 : 0.8
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(angle) * (r * 0.18), cy + Math.sin(angle) * (r * 0.18))
      ctx.lineTo(cx + Math.cos(angle) * (r * (isMain ? 0.95 : 0.72)), cy + Math.sin(angle) * (r * (isMain ? 0.95 : 0.72)))
      ctx.stroke()
    }
    ctx.restore()
  }
}

function makeCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  return [c, c.getContext('2d')!]
}

function genBasic(element: string): string {
  const size = 18
  const [c, ctx] = makeCanvas(size)
  const p = pal(element)
  // Soft outer bloom
  ctx.save()
  const bloom = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  bloom.addColorStop(0, p.mid + '44')
  bloom.addColorStop(1, p.mid + '00')
  ctx.fillStyle = bloom
  ctx.fillRect(0, 0, size, size)
  ctx.restore()
  paintOrb(ctx, size / 2, size / 2, size / 2 - 1.5, p, false, false)
  return c.toDataURL()
}

function genSkill(element: string): string {
  const size = 28
  const [c, ctx] = makeCanvas(size)
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 2.5
  const p = pal(element)

  // Bloom behind orb
  ctx.save()
  const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, r + 8)
  bloom.addColorStop(0, p.mid + '66')
  bloom.addColorStop(0.5, p.mid + '33')
  bloom.addColorStop(1, p.mid + '00')
  ctx.fillStyle = bloom
  ctx.beginPath()
  ctx.arc(cx, cy, r + 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  paintOrb(ctx, cx, cy, r, p, true, false)
  return c.toDataURL()
}

function genUltimate(element: string): string {
  const size = 44
  const [c, ctx] = makeCanvas(size)
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 4
  const p = pal(element)

  // Large outer bloom
  ctx.save()
  const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, r + 14)
  bloom.addColorStop(0, p.mid + '77')
  bloom.addColorStop(0.4, p.mid + '44')
  bloom.addColorStop(1, p.mid + '00')
  ctx.fillStyle = bloom
  ctx.beginPath()
  ctx.arc(cx, cy, r + 14, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Secondary colour ring for depth
  ctx.save()
  const innerBloom = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r + 4)
  innerBloom.addColorStop(0, p.bright + '55')
  innerBloom.addColorStop(1, p.outer + '00')
  ctx.fillStyle = innerBloom
  ctx.beginPath()
  ctx.arc(cx, cy, r + 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  paintOrb(ctx, cx, cy, r, p, true, true)
  return c.toDataURL()
}

const _cache = new Map<string, string>()

export function getProjectileSprite(abilityType: AbilityType, element: string): string {
  const key = `${abilityType}__${element}`
  if (_cache.has(key)) return _cache.get(key)!

  const url = abilityType === 'basic'    ? genBasic(element)
            : abilityType === 'skill'    ? genSkill(element)
            :                              genUltimate(element)

  _cache.set(key, url)
  return url
}

export function preloadProjectileSprites(elements: string[]): void {
  for (const el of elements) {
    getProjectileSprite('basic', el)
    getProjectileSprite('skill', el)
    getProjectileSprite('ultimate', el)
  }
}
