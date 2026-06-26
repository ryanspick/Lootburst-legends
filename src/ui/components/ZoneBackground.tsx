import { useEffect, useRef } from 'react'
import { ZONES } from '@/game/rift/zoneBackgrounds'
import styles from './ZoneBackground.module.css'

interface Props {
  zoneIndex?: number
  zoneId?: string
  width?: number
  height?: number
  className?: string
}

export default function ZoneBackground({
  zoneIndex,
  zoneId,
  width = 360,
  height = 300,
  className = '',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  const zone = zoneId
    ? ZONES.find(z => z.id === zoneId) ?? ZONES[0]
    : ZONES[Math.max(0, Math.min(ZONES.length - 1, zoneIndex ?? 0))]

  useEffect(() => {
    let startTs = 0

    function frame(ts: number) {
      if (!startTs) startTs = ts
      const timeMs = ts - startTs
      const canvas = canvasRef.current
      if (!canvas) { rafRef.current = requestAnimationFrame(frame); return }
      const ctx = canvas.getContext('2d')
      if (!ctx) { rafRef.current = requestAnimationFrame(frame); return }

      const w = canvas.width
      const h = canvas.height

      // Sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, h * 0.6)
      sky.addColorStop(0, zone.skyColor)
      sky.addColorStop(1, zone.groundColor)
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, w, h)

      // Ground
      ctx.fillStyle = zone.groundColor
      ctx.fillRect(0, h * 0.6, w, h * 0.4)

      // Floor line
      ctx.strokeStyle = zone.floorLineColor
      ctx.lineWidth = 2
      ctx.globalAlpha = 0.6
      ctx.beginPath()
      ctx.moveTo(0, h - 30)
      ctx.lineTo(w, h - 30)
      ctx.stroke()
      ctx.globalAlpha = 1

      // Zone layers
      for (const layer of zone.layers) {
        layer.draw(ctx, w, h, timeMs)
      }

      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafRef.current)
  }, [zone])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`${styles.canvas} ${className}`}
    />
  )
}
