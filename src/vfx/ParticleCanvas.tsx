import { useEffect, useRef } from 'react'
import { updateParticles, renderParticles, setReducedMotionVfx } from './ParticleEngine'
import { tickShake } from '@/animation/screenShake'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const lastRef = useRef<number>(0)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    setReducedMotionVfx(reducedMotion)
  }, [reducedMotion])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function resize() {
      if (!canvas) return
      const parent = canvas.parentElement
      canvas.width = parent?.clientWidth ?? window.innerWidth
      canvas.height = parent?.clientHeight ?? window.innerHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)

    function frame(now: number) {
      rafRef.current = requestAnimationFrame(frame)
      const delta = Math.min(now - lastRef.current, 50) // cap at 50ms
      lastRef.current = now
      tickShake(delta)
      updateParticles(delta)
      renderParticles(ctx!, canvas!.width, canvas!.height)
    }

    lastRef.current = performance.now()
    rafRef.current = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0,
        pointerEvents: 'none',
        zIndex: 40,
        imageRendering: 'pixelated',
      }}
    />
  )
}
