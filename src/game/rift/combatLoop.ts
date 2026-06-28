import type { RiftRunState, CombatEntity, DamageNumber, Projectile, AbilityAnnounce } from './riftTypes'
import { RARITY_COLOURS } from '@/constants/palette'
import { ZONES } from './zoneBackgrounds'
import { getReducedMotion } from '@/hooks/reducedMotion'
import { getProjectileSprite } from '@/art/generated/projectileSprites'
import { CENTER_X, CENTER_Y, ENEMY_SPAWN_RADIUS_X, ENEMY_SPAWN_RADIUS_Y } from './arenaConstants'
import { emitEnemyDeath, emitGearDropGlow } from '@/vfx/emitters'
import type { Rarity } from '@/constants/palette'

// Track which entities/loot items have already triggered particle emission
const _deadEmitted = new Set<string>()
const _lootEmitted = new Set<number>()

export function clearCombatEmitCache() {
  _deadEmitted.clear()
  _lootEmitted.clear()
}

const HERO_SPRITE_W = 22
const HERO_SPRITE_H = 22
const ENEMY_SPRITE_W = 24
const ENEMY_SPRITE_H = 24
const BOSS_W = 40
const BOSS_H = 40

// Orb display sizes (logical px) — matches sprite canvas sizes
const ORB_SIZE: Record<Projectile['abilityType'], number> = {
  basic:    18,
  skill:    28,
  ultimate: 44,
}

// Element → glow colour mapping
const ELEMENT_GLOW: Record<string, string> = {
  fire: '#ff7722', ice: '#66ddff', earth: '#88cc33', void: '#cc44ff',
  arcane: '#ff88ee', nature: '#44ff88', electric: '#ffee44',
  water: '#4488ff', metal: '#bbccdd', shadow: '#8844cc', light: '#ffeeaa',
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

// ─── Image cache ──────────────────────────────────────────────────────────────

const _imgCache = new Map<string, HTMLImageElement>()

function getImg(url: string): HTMLImageElement | null {
  if (!url) return null
  if (_imgCache.has(url)) return _imgCache.get(url)!
  const img = new Image()
  img.src = url
  _imgCache.set(url, img)
  return img
}

// ─── Arena floor rune circle ─────────────────────────────────────────────────

function drawArenaFloor(ctx: CanvasRenderingContext2D, w: number, h: number, timeMs: number) {
  const rm = getReducedMotion()

  // Subtle pixel checkerboard floor in the battle zone
  ctx.save()
  ctx.globalAlpha = 0.045
  const gridSz = 18
  const floorTop = CENTER_Y - 110
  const floorBot = CENTER_Y + 150
  ctx.fillStyle = '#7766cc'
  for (let gy = floorTop; gy < floorBot; gy += gridSz) {
    for (let gx = 0; gx < w; gx += gridSz) {
      if (((Math.floor(gx / gridSz) + Math.floor(gy / gridSz)) & 1) === 0) {
        ctx.fillRect(gx, gy, gridSz, gridSz)
      }
    }
  }
  ctx.restore()

  // Glowing arena disc
  if (!rm) {
    const pulse = 0.11 + Math.abs(Math.sin(timeMs / 2400)) * 0.055
    ctx.save()
    ctx.globalAlpha = pulse
    const disc = ctx.createRadialGradient(CENTER_X, CENTER_Y, 8, CENTER_X, CENTER_Y, 100)
    disc.addColorStop(0, '#8877ff')
    disc.addColorStop(0.55, '#5544cc55')
    disc.addColorStop(1, '#5544cc00')
    ctx.fillStyle = disc
    ctx.beginPath()
    ctx.ellipse(CENTER_X, CENTER_Y, 100, 78, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // Inner rune ring (static)
  ctx.save()
  ctx.globalAlpha = rm ? 0.14 : 0.18 + Math.sin(timeMs / 3200) * 0.04
  ctx.strokeStyle = '#8877ee'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.arc(CENTER_X, CENTER_Y, 38, 0, Math.PI * 2); ctx.stroke()
  ctx.globalAlpha = rm ? 0.08 : 0.10 + Math.sin(timeMs / 2800) * 0.03
  ctx.lineWidth = 0.5
  ctx.beginPath(); ctx.arc(CENTER_X, CENTER_Y, 68, 0, Math.PI * 2); ctx.stroke()
  ctx.restore()

  // Rotating tick marks on inner ring
  if (!rm) {
    const rot = (timeMs / 9000) % (Math.PI * 2)
    ctx.save()
    ctx.globalAlpha = 0.22
    ctx.strokeStyle = '#bbaaff'
    ctx.lineWidth = 1.5
    ctx.translate(CENTER_X, CENTER_Y)
    ctx.rotate(rot)
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(Math.cos(a) * 33, Math.sin(a) * 33)
      ctx.lineTo(Math.cos(a) * 43, Math.sin(a) * 43)
      ctx.stroke()
    }
    ctx.restore()
  }
}

// ─── HP bar ───────────────────────────────────────────────────────────────────

function drawHpBar(
  ctx: CanvasRenderingContext2D,
  entity: CombatEntity,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const pct = Math.max(0, entity.hp / entity.maxHp)
  ctx.fillStyle = '#111122'
  ctx.fillRect(x, y, w, h)
  const col = pct > 0.5 ? '#22c55e' : pct > 0.25 ? '#f59e0b' : '#ef4444'
  ctx.fillStyle = col
  const fillW = Math.round(w * pct)
  ctx.fillRect(x, y, fillW, h)
  // Pixel shine stripe
  if (fillW > 2) {
    ctx.fillStyle = '#ffffff44'
    ctx.fillRect(x, y, fillW, 1)
  }
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 1
  ctx.strokeRect(x, y, w, h)
}

// ─── Entity shadow ────────────────────────────────────────────────────────────

function drawEntityShadow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  ctx.save()
  ctx.globalAlpha = 0.22
  ctx.fillStyle = '#000011'
  ctx.beginPath()
  ctx.ellipse(x, y + Math.round(w / 2) + 3, w * 0.38, 5, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// ─── Entity ───────────────────────────────────────────────────────────────────

function drawEntity(
  ctx: CanvasRenderingContext2D,
  entity: CombatEntity,
  w: number,
  h: number,
  timeMs: number,
) {
  const cx = entity.x
  const cy = entity.y

  if (!entity.alive) {
    if (entity.deathAnimMs <= 0) return

    // First-frame death burst
    if (!_deadEmitted.has(entity.id)) {
      _deadEmitted.add(entity.id)
      emitEnemyDeath(
        { x: cx, y: cy },
        entity.element,
        entity.role === 'boss',
        entity.rarity === 'rare',
      )
    }

    const maxAnim = entity.role === 'boss' ? 1050 : 580
    const t = Math.min(1, 1 - entity.deathAnimMs / maxAnim)
    const dir = (entity.id.charCodeAt(0) & 1) ? 1 : -1
    const img = entity.spriteDataUrl ? getImg(entity.spriteDataUrl) : null

    ctx.save()

    if (t < 0.15) {
      // Phase 1 — POP: scale up, white flash
      const pT = easeOutCubic(t / 0.15)
      ctx.globalAlpha = 1
      ctx.translate(cx, cy - pT * 5)
      ctx.scale(1 + pT * 0.6, 1 + pT * 0.6)
      ctx.filter = `brightness(${(8 - pT * 5.5).toFixed(1)})`
    } else if (t < 0.52) {
      // Phase 2 — SHATTER: spin, hue-rotate, partial shrink
      const sT = easeOutCubic((t - 0.15) / 0.37)
      ctx.globalAlpha = Math.max(0.25, 1 - sT * 0.5)
      ctx.translate(cx, cy + sT * 10)
      ctx.scale(1.6 - sT * 0.75, 1.6 - sT * 0.75)
      ctx.rotate(dir * sT * 0.7)
      ctx.filter = `hue-rotate(${Math.round(sT * 270)}deg) brightness(${(2.3 - sT * 1.2).toFixed(1)})`
    } else {
      // Phase 3 — VANISH: spin out, drift down, fade
      const fT = (t - 0.52) / 0.48
      ctx.globalAlpha = Math.max(0, 0.55 - fT * 0.75)
      ctx.translate(cx, cy + 10 + fT * 32)
      const sc = Math.max(0.04, 0.85 - fT * 0.82)
      ctx.scale(sc, sc)
      ctx.rotate(dir * (0.7 + fT * 1.6))
    }

    if (img) {
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(img, -w / 2, -h / 2, w, h)
    } else {
      ctx.fillStyle = '#ff4488'
      ctx.fillRect(-w / 2, -h / 2, w, h)
    }

    ctx.restore()
    ctx.filter = 'none'
    ctx.shadowBlur = 0
    return
  }

  // ── Alive entity ─────────────────────────────────────────────────────────────
  const rm = getReducedMotion()
  const bobY = rm ? 0
    : entity.role === 'hero'
      ? Math.sin(timeMs / 600 + entity.x * 0.02) * 2.5
      : Math.sin(timeMs / 720 + entity.x * 0.03) * 1.8

  const pumpRaw = entity.flashMs > 0
    ? entity.flashMs / (entity.role === 'hero' ? 130 : 200)
    : 0
  const pumpScale = 1 + pumpRaw * 0.07

  ctx.save()
  ctx.translate(cx, cy + bobY)
  ctx.scale(pumpScale, pumpScale)

  if (entity.flashMs > 0) {
    ctx.filter = 'brightness(4) saturate(0)'
  }

  const hpPct = entity.hp / entity.maxHp
  if (entity.role === 'hero' && hpPct < 0.35 && !getReducedMotion()) {
    const danger = 0.4 + Math.abs(Math.sin(timeMs / 350)) * 0.6
    ctx.shadowColor = '#ff2244'
    ctx.shadowBlur = 14 * danger
  } else if (entity.rarity !== 'common') {
    const rc = RARITY_COLOURS[entity.rarity]
    ctx.shadowColor = rc.glow
    ctx.shadowBlur = entity.rarity === 'mythic' ? 24
      : entity.rarity === 'legendary' ? 18
      : 10
  }

  const img = entity.spriteDataUrl ? getImg(entity.spriteDataUrl) : null
  if (img) {
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(img, -w / 2, -h / 2, w, h)
  } else {
    const rc = RARITY_COLOURS[entity.rarity]
    ctx.fillStyle = rc.primary
    ctx.fillRect(-w / 2, -h / 2, w, h)
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.strokeRect(-w / 2, -h / 2, w, h)
  }

  ctx.restore()
  ctx.filter = 'none'
  ctx.shadowBlur = 0

  drawHpBar(ctx, entity, cx - w / 2, cy + h / 2 + 2, w, 3)
}

// ─── Charge ring (ready indicator) ────────────────────────────────────────────

function drawHeroReadyRing(
  ctx: CanvasRenderingContext2D,
  hero: CombatEntity,
  timeMs: number,
) {
  if (!hero.alive || getReducedMotion()) return
  const ultReady = hero.ultimateCdMs <= 0
  const skillReady = hero.skillCdMs <= 0
  if (!ultReady && !skillReady) return

  const col = ultReady ? '#ffd700' : '#cc44ff'
  const pulse = 0.45 + Math.abs(Math.sin(timeMs / 190)) * 0.55
  const radius = 30

  ctx.save()
  ctx.globalAlpha = pulse * 0.9
  ctx.strokeStyle = col
  ctx.lineWidth = ultReady ? 3 : 2
  ctx.shadowColor = col
  ctx.shadowBlur = ultReady ? 16 : 10
  ctx.beginPath()
  ctx.arc(hero.x, hero.y, radius, 0, Math.PI * 2)
  ctx.stroke()

  if (ultReady) {
    // Rotating arc pair
    ctx.globalAlpha = pulse * 0.55
    ctx.lineWidth = 1.5
    const rot = (timeMs / 380) % (Math.PI * 2)
    ctx.beginPath()
    ctx.arc(hero.x, hero.y, radius + 7, rot, rot + Math.PI * 0.75)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(hero.x, hero.y, radius + 7, rot + Math.PI, rot + Math.PI * 1.75)
    ctx.stroke()
  }
  ctx.restore()
  ctx.shadowBlur = 0
}

// ─── Projectile ───────────────────────────────────────────────────────────────

function drawProjectile(
  ctx: CanvasRenderingContext2D,
  proj: Projectile,
  timeMs: number,
) {
  const ease = easeOutCubic(proj.progress)
  const x = proj.fromX + (proj.toX - proj.fromX) * ease
  const y = proj.fromY + (proj.toY - proj.fromY) * ease

  const baseSize = ORB_SIZE[proj.abilityType]
  const spriteUrl = getProjectileSprite(proj.abilityType, proj.element)
  const orbImg = getImg(spriteUrl)
  const glowColor = ELEMENT_GLOW[proj.element] ?? '#8888ff'

  const rm = getReducedMotion()

  // ── Trail ──────────────────────────────────────────────────────────────────
  if (!rm) {
    const trailSteps = proj.abilityType === 'ultimate' ? 10
      : proj.abilityType === 'skill' ? 7 : 2
    const stepSize = proj.abilityType === 'ultimate' ? 0.052
      : proj.abilityType === 'skill' ? 0.048 : 0.06
    const shrink = proj.abilityType === 'ultimate' ? 0.085
      : proj.abilityType === 'skill' ? 0.11 : 0.18
    for (let i = 1; i <= trailSteps; i++) {
      const trailEase = easeOutCubic(Math.max(0, proj.progress - i * stepSize))
      const tx = proj.fromX + (proj.toX - proj.fromX) * trailEase
      const ty = proj.fromY + (proj.toY - proj.fromY) * trailEase
      const trailAlpha = (1 - i / (trailSteps + 1)) * 0.40
      const trailSize = baseSize * Math.max(0.25, 1 - i * shrink)
      ctx.save()
      ctx.globalAlpha = trailAlpha
      ctx.imageSmoothingEnabled = false
      if (orbImg) {
        ctx.drawImage(orbImg, tx - trailSize / 2, ty - trailSize / 2, trailSize, trailSize)
      }
      ctx.restore()
    }
  }

  // ── Glow halo pass (drawn before main orb) ────────────────────────────────
  if (!rm && proj.abilityType !== 'basic' && orbImg) {
    const glowSize = proj.abilityType === 'ultimate' ? 26 : 14
    ctx.save()
    ctx.translate(x, y)
    ctx.globalAlpha = 0.55
    ctx.shadowColor = glowColor
    ctx.shadowBlur = glowSize
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(orbImg, -baseSize / 2, -baseSize / 2, baseSize, baseSize)
    ctx.shadowBlur = 0
    ctx.restore()
  }

  // ── Main orb ───────────────────────────────────────────────────────────────
  ctx.save()
  ctx.imageSmoothingEnabled = false
  ctx.translate(x, y)

  if (proj.abilityType === 'ultimate') {
    const pulse = 1 + Math.sin(timeMs / 80) * 0.13
    if (!rm) ctx.rotate((timeMs / 700) % (Math.PI * 2))
    ctx.scale(pulse, pulse)
  } else if (proj.abilityType === 'skill' && !rm) {
    const pulse = 1 + Math.sin(timeMs / 140) * 0.07
    ctx.scale(pulse, pulse)
  }

  if (orbImg) {
    // For skill/ultimate also apply shadowBlur on the crisp pass for extra punch
    if (proj.abilityType !== 'basic') {
      ctx.shadowColor = glowColor
      ctx.shadowBlur = proj.abilityType === 'ultimate' ? 14 : 8
    }
    ctx.drawImage(orbImg, -baseSize / 2, -baseSize / 2, baseSize, baseSize)
    ctx.shadowBlur = 0
  } else {
    ctx.fillStyle = glowColor
    ctx.beginPath()
    ctx.arc(0, 0, baseSize / 2, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

// ─── Ability announce text ────────────────────────────────────────────────────

function drawAbilityAnnounce(ctx: CanvasRenderingContext2D, ann: AbilityAnnounce) {
  const t = 1 - ann.lifeMs / ann.maxLifeMs
  const floatY = ann.y - t * 22
  const alpha = ann.lifeMs < 280 ? ann.lifeMs / 280 : 1
  const scale = 1 + (1 - t) * 0.28

  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(ann.x, floatY)
  ctx.scale(scale, scale)
  ctx.font = 'bold 10px monospace'
  ctx.textAlign = 'center'
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 3
  ctx.fillStyle = ann.color
  ctx.strokeText(ann.text, 0, 0)
  ctx.fillText(ann.text, 0, 0)
  ctx.restore()
}

// ─── Damage numbers ───────────────────────────────────────────────────────────

function drawDamageNumber(ctx: CanvasRenderingContext2D, dn: DamageNumber) {
  const t = 1 - dn.lifeMs / dn.maxLifeMs
  const y = dn.y - t * 52
  const alpha = dn.lifeMs < 240 ? dn.lifeMs / 240 : 1

  const isUlt = dn.label === '★'
  const fontSize = isUlt ? 18 : dn.isCrit ? 14 : 11
  const scale = isUlt ? 1 + (1 - t) * 0.65
    : dn.isCrit ? 1 + (1 - t) * 0.45
    : 1
  const prefix = dn.label ?? ''
  const text = `${prefix}${dn.value}`

  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(dn.x, y)
  ctx.scale(scale, scale)
  ctx.font = `bold ${fontSize}px monospace`
  ctx.textAlign = 'center'
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = isUlt ? 5 : 3
  ctx.fillStyle = dn.color
  ctx.strokeText(text, 0, 0)
  ctx.fillText(text, 0, 0)
  ctx.restore()
}

// ─── Background ───────────────────────────────────────────────────────────────

let _activeZoneIdx = 0

export function setActiveZone(idx: number) {
  _activeZoneIdx = Math.min(Math.max(0, idx), ZONES.length - 1)
}

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, timeMs: number) {
  const zone = ZONES[_activeZoneIdx]

  // Sky-to-ground gradient full height
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, zone.skyColor)
  grad.addColorStop(0.45, zone.skyColor)
  grad.addColorStop(1, zone.groundColor)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
  ctx.globalAlpha = 1

  // Parallax layers
  const rm = getReducedMotion()
  for (const layer of zone.layers) {
    if (rm && layer.speed > 0) continue
    ctx.save()
    layer.draw(ctx, w, h, rm ? 0 : timeMs)
    ctx.restore()
    ctx.globalAlpha = 1
  }

  // Radial arena darkness — deepens near spawn ring, creates battle-pit feel
  const arenaGrd = ctx.createRadialGradient(CENTER_X, CENTER_Y, 0, CENTER_X, CENTER_Y, ENEMY_SPAWN_RADIUS_X + 50)
  arenaGrd.addColorStop(0, 'rgba(0,0,0,0.0)')
  arenaGrd.addColorStop(0.58, 'rgba(0,0,0,0.12)')
  arenaGrd.addColorStop(1, 'rgba(0,0,0,0.55)')
  ctx.fillStyle = arenaGrd
  ctx.fillRect(0, 0, w, h)

  // Faint pulsing elliptical spawn ring indicator
  if (!rm) {
    ctx.save()
    ctx.globalAlpha = 0.08 + Math.sin(timeMs / 2100) * 0.04
    ctx.strokeStyle = '#8899cc'
    ctx.lineWidth = 1
    ctx.setLineDash([6, 10])
    ctx.beginPath()
    ctx.ellipse(CENTER_X, CENTER_Y, ENEMY_SPAWN_RADIUS_X, ENEMY_SPAWN_RADIUS_Y, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()
  }

  // Vignette
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.72)
  vig.addColorStop(0, 'rgba(0,0,0,0)')
  vig.addColorStop(1, 'rgba(0,0,0,0.48)')
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, w, h)
}

// ─── Loot drops ───────────────────────────────────────────────────────────────

function drawLootDrops(ctx: CanvasRenderingContext2D, state: RiftRunState, timeMs: number) {
  for (const loot of state.lootDrops) {
    if (loot.collected) continue

    // Emit particles on first appearance
    if (!_lootEmitted.has(loot.id)) {
      _lootEmitted.add(loot.id)
      if (loot.type === 'item') {
        emitGearDropGlow({ x: loot.x, y: loot.y }, loot.rarity as Rarity)
      }
    }

    const fadeAlpha = Math.min(1, loot.lifeMs / 400)
    const bobY = Math.sin(timeMs / 480 + loot.x * 0.08) * 3.5
    const spin = (timeMs / 650) % (Math.PI * 2)

    ctx.save()
    ctx.globalAlpha = fadeAlpha
    ctx.translate(loot.x, loot.y + bobY)

    if (loot.type === 'gem') {
      // Outer glow ring
      ctx.save()
      ctx.globalAlpha = fadeAlpha * 0.35
      ctx.strokeStyle = '#cc44ff'
      ctx.lineWidth = 1.5
      ctx.shadowColor = '#cc44ff'
      ctx.shadowBlur = 10
      ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.stroke()
      ctx.shadowBlur = 0
      ctx.restore()
      // Spinning gem body
      ctx.rotate(spin)
      ctx.fillStyle = '#aa44ff'
      ctx.shadowColor = '#cc44ff'
      ctx.shadowBlur = 7
      ctx.beginPath()
      ctx.moveTo(0, -8); ctx.lineTo(6, 0); ctx.lineTo(0, 8); ctx.lineTo(-6, 0)
      ctx.closePath(); ctx.fill()
      ctx.shadowBlur = 0
      ctx.strokeStyle = '#ff88ff'; ctx.lineWidth = 1; ctx.stroke()
      // Shine facet
      ctx.globalAlpha = fadeAlpha * 0.7
      ctx.fillStyle = '#ffffff99'
      ctx.beginPath()
      ctx.moveTo(-1, -6); ctx.lineTo(2, -2); ctx.lineTo(-2, -1)
      ctx.closePath(); ctx.fill()
    } else if (loot.type === 'item') {
      // Gear drop — star shape with rarity glow
      const rc = RARITY_COLOURS[loot.rarity as Rarity]
      ctx.shadowColor = rc.glow; ctx.shadowBlur = 12
      ctx.fillStyle = rc.primary
      ctx.rotate(spin * 0.3)
      const sr = 8, ir = 4, pts = 4
      ctx.beginPath()
      for (let i = 0; i < pts * 2; i++) {
        const a = (i * Math.PI) / pts - Math.PI / 2
        const ra = i % 2 === 0 ? sr : ir
        i === 0 ? ctx.moveTo(Math.cos(a) * ra, Math.sin(a) * ra)
                : ctx.lineTo(Math.cos(a) * ra, Math.sin(a) * ra)
      }
      ctx.closePath(); ctx.fill()
      ctx.shadowBlur = 0
      ctx.strokeStyle = rc.glow; ctx.lineWidth = 1; ctx.stroke()
    } else {
      // Gold coin with detail
      ctx.fillStyle = '#ffd700'; ctx.shadowColor = '#ffaa00'; ctx.shadowBlur = 9
      ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill()
      ctx.shadowBlur = 0
      ctx.strokeStyle = '#aa7700'; ctx.lineWidth = 1; ctx.stroke()
      ctx.strokeStyle = '#cc990088'; ctx.lineWidth = 0.5
      ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, Math.PI * 2); ctx.stroke()
      ctx.globalAlpha = fadeAlpha * 0.5
      ctx.fillStyle = '#ffffffaa'
      ctx.beginPath(); ctx.arc(-1.5, -2, 2, 0, Math.PI * 2); ctx.fill()
    }

    ctx.restore()
    ctx.shadowBlur = 0
  }
}

// ─── Time progress bar ────────────────────────────────────────────────────────

function drawProgressBar(ctx: CanvasRenderingContext2D, elapsedMs: number, totalMs: number, w: number) {
  const pct = Math.min(1, elapsedMs / totalMs)
  const barH = 5
  // Track background
  ctx.fillStyle = '#0d0d1e'
  ctx.fillRect(0, 0, w, barH)
  // Pixel segment markers (every 10%)
  ctx.fillStyle = '#1a1a3a'
  for (let i = 1; i < 10; i++) {
    ctx.fillRect(Math.round(w * i / 10) - 1, 0, 2, barH)
  }
  // Fill gradient
  const fillW = Math.round(w * pct)
  if (fillW > 0) {
    const barGrad = ctx.createLinearGradient(0, 0, w, 0)
    barGrad.addColorStop(0, '#4455ff')
    barGrad.addColorStop(0.4, '#cc44ff')
    barGrad.addColorStop(0.7, '#ff44aa')
    barGrad.addColorStop(1, '#ffaa00')
    ctx.fillStyle = barGrad
    ctx.fillRect(0, 0, fillW, barH)
    // Shine stripe
    ctx.fillStyle = '#ffffff33'
    ctx.fillRect(0, 0, fillW, 2)
    // Leading edge glow
    ctx.save()
    ctx.shadowColor = '#ff44ff'
    ctx.shadowBlur = 8
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(fillW - 2, 0, 2, barH)
    ctx.restore()
    ctx.shadowBlur = 0
  }
}

// ─── Main render ──────────────────────────────────────────────────────────────

export function renderRiftFrame(
  ctx: CanvasRenderingContext2D,
  state: RiftRunState,
  canvasW: number,
  canvasH: number,
  timeMs: number,
  zoneIdx = 0,
) {
  _activeZoneIdx = zoneIdx
  ctx.clearRect(0, 0, canvasW, canvasH)
  drawBackground(ctx, canvasW, canvasH, timeMs)
  drawArenaFloor(ctx, canvasW, canvasH, timeMs)

  // Screen flash from skill/ultimate impact
  if (state.impactFlashMs > 0) {
    const flashAlpha = (state.impactFlashMs / 130) * 0.30
    ctx.fillStyle = state.impactFlashColor
    ctx.globalAlpha = flashAlpha
    ctx.fillRect(0, 0, canvasW, canvasH)
    ctx.globalAlpha = 1
  }

  // Time progress bar
  drawProgressBar(ctx, state.elapsedMs, 120_000, canvasW)

  // Build entity list sorted by y (painter's algorithm — lower on screen renders in front)
  type EntityEntry = [CombatEntity, number, number]
  const entityList: EntityEntry[] = []
  if (state.boss) entityList.push([state.boss, BOSS_W, BOSS_H])
  for (const e of state.enemies) entityList.push([e, ENEMY_SPRITE_W, ENEMY_SPRITE_H])
  for (const h of state.heroes) entityList.push([h, HERO_SPRITE_W, HERO_SPRITE_H])
  entityList.sort((a, b) => a[0].y - b[0].y)

  // Ground shadows drawn first (under all sprites)
  for (const [ent, w] of entityList) {
    if (ent.alive || ent.deathAnimMs > 0) drawEntityShadow(ctx, ent.x, ent.y, w)
  }

  // Charge rings + sprites in depth order
  for (const [ent, w, h] of entityList) {
    if (ent.role === 'hero') drawHeroReadyRing(ctx, ent, timeMs)
    drawEntity(ctx, ent, w, h, timeMs)
  }

  // Projectiles (above entities)
  for (const proj of state.projectiles) {
    drawProjectile(ctx, proj, timeMs)
  }

  // Loot
  drawLootDrops(ctx, state, timeMs)

  // Ability announce text (above projectiles)
  for (const ann of state.abilityAnnounces) {
    drawAbilityAnnounce(ctx, ann)
  }

  // Damage numbers (topmost)
  for (const dn of state.damageNumbers) {
    drawDamageNumber(ctx, dn)
  }

  // Boss warning text
  if (state.bossWarningId && state.bossWarningTimeMs > 0) {
    const alpha = Math.min(1, state.bossWarningTimeMs / 500)
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.font = 'bold 20px monospace'
    ctx.fillStyle = '#ff4444'
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 4
    ctx.textAlign = 'center'
    const pulse = 1 + Math.sin(timeMs / 150) * 0.08
    ctx.translate(canvasW / 2, canvasH / 2)
    ctx.scale(pulse, pulse)
    ctx.strokeText('⚠ BOSS INCOMING ⚠', 0, 0)
    ctx.fillText('⚠ BOSS INCOMING ⚠', 0, 0)
    ctx.restore()
  }
}
