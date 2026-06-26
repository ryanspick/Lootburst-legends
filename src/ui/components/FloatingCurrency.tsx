import { useEffect, useRef } from 'react'
import { getReducedMotion } from '@/hooks/reducedMotion'
import styles from './FloatingCurrency.module.css'

export interface FloatEmit {
  id: string
  type: 'gold' | 'gem'
  startX: number
  startY: number
  endX: number
  endY: number
}

interface Props {
  emissions: FloatEmit[]
  onDone: (id: string) => void
}

interface Particle {
  id: string
  type: 'gold' | 'gem'
  x: number
  y: number
  startX: number
  startY: number
  endX: number
  endY: number
  t: number   // 0→1
  done: boolean
}

const DURATION_MS = 600

export default function FloatingCurrency({ emissions, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef(0)
  const lastTsRef = useRef(0)

  // Ingest new emissions into particles
  useEffect(() => {
    for (const e of emissions) {
      if (!particlesRef.current.find(p => p.id === e.id)) {
        particlesRef.current.push({
          id: e.id,
          type: e.type,
          x: e.startX,
          y: e.startY,
          startX: e.startX,
          startY: e.startY,
          endX: e.endX,
          endY: e.endY,
          t: 0,
          done: false,
        })
      }
    }
  }, [emissions])

  // Resize canvas to match viewport
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    function resize() {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function loop(ts: number) {
      const dt = lastTsRef.current ? ts - lastTsRef.current : 16
      lastTsRef.current = ts

      const particles = particlesRef.current
      if (!particles.length || getReducedMotion()) {
        // On reduced motion, mark all done immediately
        if (getReducedMotion() && particles.length) {
          particles.forEach(p => { p.done = true; onDone(p.id) })
          particlesRef.current = []
        }
        rafRef.current = requestAnimationFrame(loop)
        return
      }

      const ctx = canvas!.getContext('2d')!
      ctx.clearRect(0, 0, canvas!.width, canvas!.height)

      const done: string[] = []
      for (const p of particles) {
        if (p.done) continue
        p.t = Math.min(1, p.t + dt / DURATION_MS)

        // Ease out quad
        const ease = 1 - (1 - p.t) * (1 - p.t)
        // Arc: parabola upward mid-flight
        const arc = Math.sin(p.t * Math.PI) * -40

        p.x = p.startX + (p.endX - p.startX) * ease
        p.y = p.startY + (p.endY - p.startY) * ease + arc

        const alpha = p.t > 0.85 ? 1 - (p.t - 0.85) / 0.15 : 1

        ctx.save()
        ctx.globalAlpha = alpha
        if (p.type === 'gem') {
          ctx.fillStyle = '#cc44ff'
          ctx.beginPath()
          ctx.moveTo(p.x, p.y - 5)
          ctx.lineTo(p.x + 3, p.y)
          ctx.lineTo(p.x, p.y + 5)
          ctx.lineTo(p.x - 3, p.y)
          ctx.closePath()
          ctx.fill()
          ctx.strokeStyle = '#ff88ff'
          ctx.lineWidth = 0.5
          ctx.stroke()
        } else {
          ctx.fillStyle = '#ffd700'
          ctx.beginPath()
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = '#ffaa00'
          ctx.lineWidth = 0.5
          ctx.stroke()
        }
        ctx.restore()

        if (p.t >= 1) {
          p.done = true
          done.push(p.id)
        }
      }

      // Prune done
      particlesRef.current = particles.filter(p => !p.done)
      done.forEach(id => onDone(id))

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [onDone])

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
    />
  )
}
