import type { ParticleField } from '@/types/art'

const POOL_SIZE = 1000
let _cap = 350
let _lowVfxMode = false
let _reducedMotion = false

const _pool: ParticleField[] = []
const _active: ParticleField[] = []
let _idCounter = 0

function createParticle(): ParticleField {
  return {
    id: 0, x: 0, y: 0, vx: 0, vy: 0, ax: 0, ay: 0,
    rotation: 0, rotationSpeed: 0,
    ageMs: 0, lifetimeMs: 1000,
    startScale: 1, endScale: 0,
    startAlpha: 1, endAlpha: 0,
    color: '#ffffff', colors: undefined, spriteId: undefined,
    shape: 'circle',
    gravity: 0, blendMode: 'normal', zIndex: 40,
  }
}

for (let i = 0; i < POOL_SIZE; i++) _pool.push(createParticle())

function acquire(): ParticleField | null {
  if (_active.length >= _cap) return null
  const p = _pool.pop() ?? createParticle()
  p.id = ++_idCounter
  _active.push(p)
  return p
}

function releaseAt(index: number) {
  const p = _active[index]
  _active.splice(index, 1)
  _pool.push(p)
}

export function setParticleCap(cap: number) { _cap = cap }
export function setLowVfxMode(v: boolean) { _lowVfxMode = v; _cap = v ? 120 : 350 }
export function setReducedMotionVfx(v: boolean) { _reducedMotion = v }
export function getActiveCount() { return _active.length }

export function spawnParticle(config: Partial<ParticleField>): ParticleField | null {
  if (_reducedMotion) return null
  if (_lowVfxMode && _active.length >= 60) return null
  const p = acquire()
  if (!p) return null
  Object.assign(p, { ...createParticle(), ...config, id: p.id, ageMs: 0 })
  return p
}

export function updateParticles(deltaMs: number) {
  const dt = deltaMs / 1000
  for (let i = _active.length - 1; i >= 0; i--) {
    const p = _active[i]
    p.ageMs += deltaMs
    if (p.ageMs >= p.lifetimeMs) { releaseAt(i); continue }
    p.vx += p.ax * dt
    p.vy += (p.ay + p.gravity) * dt
    p.x  += p.vx * dt
    p.y  += p.vy * dt
    p.rotation += p.rotationSpeed * dt
  }
}

export function renderParticles(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.clearRect(0, 0, width, height)

  for (const p of _active) {
    const t = p.ageMs / p.lifetimeMs
    const alpha = p.startAlpha + (p.endAlpha - p.startAlpha) * t
    const scale = p.startScale + (p.endScale - p.startScale) * t
    if (alpha <= 0 || scale <= 0) continue

    ctx.save()
    ctx.globalAlpha = alpha
    ctx.globalCompositeOperation = p.blendMode === 'add' ? 'lighter'
      : p.blendMode === 'screen' ? 'screen' : 'source-over'
    ctx.translate(p.x, p.y)
    ctx.rotate(p.rotation)

    const color = p.colors ? p.colors[Math.floor(t * p.colors.length) % p.colors.length] : p.color
    ctx.fillStyle = color

    const s = scale * 4 // base pixel size = 4px
    switch (p.shape) {
      case 'circle':
        ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill(); break
      case 'square':
        ctx.fillRect(-s, -s, s * 2, s * 2); break
      case 'diamond':
        ctx.beginPath()
        ctx.moveTo(0, -s); ctx.lineTo(s, 0); ctx.lineTo(0, s); ctx.lineTo(-s, 0)
        ctx.closePath(); ctx.fill(); break
      case 'star':
        drawStar(ctx, 0, 0, 5, s, s * 0.4); break
      case 'pixel':
        ctx.fillRect(-2, -2, 4, 4); break
    }

    ctx.restore()
  }
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, points: number, outerR: number, innerR: number) {
  ctx.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2
    const r = i % 2 === 0 ? outerR : innerR
    if (i === 0) ctx.moveTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r)
    else ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r)
  }
  ctx.closePath(); ctx.fill()
}

export function clearParticles() {
  while (_active.length > 0) {
    const p = _active.pop()!
    _pool.push(p)
  }
}
