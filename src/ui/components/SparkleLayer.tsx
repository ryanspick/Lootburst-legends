import { useEffect, useRef } from 'react'
import styles from './SparkleLayer.module.css'

interface Sparkle {
  id: number
  x: number
  y: number
  size: number
  color: string
  born: number
  life: number
}

const COLORS = ['#ffd700', '#ffffff', '#ff69b4', '#00ffff', '#aa44ff']

let _uid = 0

interface Props {
  active?: boolean
  density?: number      // sparkles per second
  area?: { w: number; h: number }
  colors?: string[]
  className?: string
}

export default function SparkleLayer({
  active = true,
  density = 6,
  area,
  colors = COLORS,
  className = '',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sparklesRef = useRef<Sparkle[]>([])
  const rafRef = useRef<number>(0)
  const lastSpawnRef = useRef<number>(0)
  const intervalMs = 1000 / density

  useEffect(() => {
    if (!active) return

    function frame(ts: number) {
      const canvas = canvasRef.current
      if (!canvas) { rafRef.current = requestAnimationFrame(frame); return }
      const ctx = canvas.getContext('2d')
      if (!ctx) { rafRef.current = requestAnimationFrame(frame); return }

      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      canvas.width = w
      canvas.height = h

      // Spawn
      if (ts - lastSpawnRef.current >= intervalMs) {
        lastSpawnRef.current = ts
        sparklesRef.current.push({
          id: _uid++,
          x: Math.random() * w,
          y: Math.random() * h,
          size: 1.5 + Math.random() * 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          born: ts,
          life: 500 + Math.random() * 800,
        })
      }

      // Cull dead
      sparklesRef.current = sparklesRef.current.filter(s => ts - s.born < s.life)

      // Draw
      ctx.clearRect(0, 0, w, h)
      for (const s of sparklesRef.current) {
        const t = (ts - s.born) / s.life
        const alpha = Math.sin(t * Math.PI)
        const sz = s.size * (1 - t * 0.5)
        ctx.save()
        ctx.globalAlpha = alpha * 0.8
        ctx.fillStyle = s.color
        ctx.shadowColor = s.color
        ctx.shadowBlur = 4
        // Diamond shape
        ctx.beginPath()
        ctx.moveTo(s.x,      s.y - sz)
        ctx.lineTo(s.x + sz, s.y)
        ctx.lineTo(s.x,      s.y + sz)
        ctx.lineTo(s.x - sz, s.y)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      }

      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafRef.current)
  }, [active, density, colors, intervalMs])

  const style = area ? { width: area.w, height: area.h } : undefined

  return (
    <canvas
      ref={canvasRef}
      className={`${styles.layer} ${className}`}
      style={style}
    />
  )
}
