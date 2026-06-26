export const PS = 4 // canvas pixels per logical pixel

export interface PC {
  ctx: CanvasRenderingContext2D
  w: number // logical width
  h: number // logical height
}

export function createPC(logW: number, logH: number): { canvas: HTMLCanvasElement; pc: PC } {
  const canvas = document.createElement('canvas')
  canvas.width = logW * PS
  canvas.height = logH * PS
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  return { canvas, pc: { ctx, w: logW, h: logH } }
}

// Fill one logical pixel
export function p(pc: PC, x: number, y: number, color: string, alpha = 1) {
  if (x < 0 || y < 0 || x >= pc.w || y >= pc.h) return
  if (alpha !== 1) pc.ctx.globalAlpha = alpha
  pc.ctx.fillStyle = color
  pc.ctx.fillRect(Math.floor(x) * PS, Math.floor(y) * PS, PS, PS)
  if (alpha !== 1) pc.ctx.globalAlpha = 1
}

// Fill a logical rect
export function r(pc: PC, x: number, y: number, w: number, h: number, color: string, alpha = 1) {
  if (alpha !== 1) pc.ctx.globalAlpha = alpha
  pc.ctx.fillStyle = color
  pc.ctx.fillRect(x * PS, y * PS, w * PS, h * PS)
  if (alpha !== 1) pc.ctx.globalAlpha = 1
}

// Outline only (1px border)
export function o(pc: PC, x: number, y: number, w: number, h: number, color: string) {
  const c = pc.ctx
  c.fillStyle = color
  c.fillRect(x * PS, y * PS, w * PS, PS)            // top
  c.fillRect(x * PS, (y + h - 1) * PS, w * PS, PS) // bottom
  c.fillRect(x * PS, y * PS, PS, h * PS)            // left
  c.fillRect((x + w - 1) * PS, y * PS, PS, h * PS) // right
}

// Draw shadow glow ring around a rect
export function glow(pc: PC, x: number, y: number, w: number, h: number, color: string, strength = 6) {
  const c = pc.ctx
  c.save()
  c.shadowColor = color
  c.shadowBlur = strength * PS / 4
  c.fillStyle = color + '00' // invisible fill, only shadow matters
  c.fillRect((x - 0.5) * PS, (y - 0.5) * PS, (w + 1) * PS, (h + 1) * PS)
  c.restore()
}

// Render a 16×16 (or any) string template onto the canvas
// Template: array of strings, each char is a palette key or '.'=transparent
export function tmpl(pc: PC, rows: string[], pal: Record<string, string | [string, number]>, ox = 0, oy = 0) {
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y]
    for (let x = 0; x < row.length; x++) {
      const ch = row[x]
      if (ch === '.') continue
      const val = pal[ch]
      if (!val) continue
      if (typeof val === 'string') {
        p(pc, x + ox, y + oy, val)
      } else {
        p(pc, x + ox, y + oy, val[0], val[1])
      }
    }
  }
}

export function toDataURL(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png')
}

// Lighten / darken a hex color
export function lighten(hex: string, amt: number): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, ((n >> 16) & 0xff) + amt)
  const g = Math.min(255, ((n >> 8) & 0xff) + amt)
  const b = Math.min(255, (n & 0xff) + amt)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export function darken(hex: string, amt: number): string { return lighten(hex, -amt) }

export function hexAlpha(hex: string, a: number): string {
  const aa = Math.round(a * 255).toString(16).padStart(2, '0')
  return hex + aa
}
