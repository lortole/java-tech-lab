import { useEffect, useRef } from "react"

// Animation carrefour :
// Gauche : feu rouge sequentiel — voitures bloquees (Platform Threads)
// Droite : rond-point fluide — voitures qui circulent (Virtual Threads)
export default function CanvasVirtualThreads() {
  const ref = useRef(null)
  const animRef = useRef(null)
  const tRef = useRef(0)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext("2d")
    ctx.scale(dpr, dpr)
    const W = rect.width
    const H = rect.height
    const half = W / 2

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      tRef.current += 0.015

      drawTrafficLight(ctx, 20, 0, half - 30, H, tRef.current)

      // Separateur
      ctx.save()
      ctx.strokeStyle = "rgba(255,255,255,0.08)"
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(half, 8)
      ctx.lineTo(half, H - 8)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.restore()

      drawRoundabout(ctx, half + 10, 0, half - 30, H, tRef.current)

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  return (
    <canvas
      ref={ref}
      style={{ display: "block", width: "100%", height: 200, borderRadius: 8 }}
    />
  )
}

// ── Feu rouge sequentiel ─────────────────────────────────────────────────────
function drawTrafficLight(ctx, x, y, w, h, t) {
  const cx = x + w / 2
  const roadY = y + h * 0.5
  const roadH = 28

  // Label
  ctx.save()
  ctx.font = "bold 11px monospace"
  ctx.fillStyle = "#ef4444"
  ctx.textAlign = "center"
  ctx.fillText("Platform Threads", cx, y + 16)
  ctx.font = "9px monospace"
  ctx.fillStyle = "rgba(239,68,68,0.6)"
  ctx.fillText("feu rouge sequentiel", cx, y + 29)
  ctx.restore()

  // Route horizontale
  ctx.save()
  ctx.fillStyle = "rgba(255,255,255,0.06)"
  ctx.beginPath()
  ctx.rect(x + 4, roadY - roadH / 2, w - 8, roadH)
  ctx.fill()
  // Bandes blanches
  ctx.setLineDash([8, 6])
  ctx.strokeStyle = "rgba(255,255,255,0.15)"
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x + 4, roadY)
  ctx.lineTo(x + w - 4, roadY)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.restore()

  // Feu tricolore
  const lightX = cx + 10
  const lightY = roadY - roadH / 2 - 36
  const cycleLen = 180  // frames
  const phase = Math.floor(t * 60) % cycleLen
  const isGreen = phase > 130
  const isOrange = phase > 110 && phase <= 130

  ctx.save()
  ctx.fillStyle = "#1a1a1a"
  ctx.strokeStyle = "#555"
  ctx.lineWidth = 0.5
  ctx.beginPath()
  ctx.roundRect(lightX - 8, lightY, 16, 40, 4)
  ctx.fill()
  ctx.stroke()

  // Rouge
  ctx.beginPath()
  ctx.arc(lightX, lightY + 8, 5, 0, Math.PI * 2)
  ctx.fillStyle = !isGreen && !isOrange ? "#ef4444" : "rgba(239,68,68,0.2)"
  ctx.fill()
  // Orange
  ctx.beginPath()
  ctx.arc(lightX, lightY + 20, 5, 0, Math.PI * 2)
  ctx.fillStyle = isOrange ? "#f59e0b" : "rgba(245,158,11,0.2)"
  ctx.fill()
  // Vert
  ctx.beginPath()
  ctx.arc(lightX, lightY + 32, 5, 0, Math.PI * 2)
  ctx.fillStyle = isGreen ? "#6db33f" : "rgba(109,179,63,0.2)"
  ctx.fill()
  ctx.restore()

  // Voitures bloquees (5 voitures qui attendent)
  const nCars = 5
  for (let i = 0; i < nCars; i++) {
    const carX = isGreen
      ? x + 4 + (t * 80 + i * 24) % (w - 8) // avancent quand vert
      : lightX - 30 - i * 26 // bloquees quand rouge
    const carColor = ["#4695eb", "#6db33f", "#f59e0b", "#a78bfa", "#ef4444"][i]

    // Si bloque, faire rebondir legerement
    const bounce = !isGreen ? Math.sin(t * 3 + i) * 1.2 : 0

    ctx.save()
    ctx.fillStyle = carColor + "cc"
    ctx.strokeStyle = carColor
    ctx.lineWidth = 0.8
    ctx.beginPath()
    ctx.roundRect(carX - 10, roadY - 9 + bounce, 20, 12, 3)
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  }

  // Label "BLOQUE" quand rouge
  if (!isGreen) {
    const blinkAlpha = 0.5 + 0.4 * Math.abs(Math.sin(t * 3))
    ctx.save()
    ctx.font = "bold 9px monospace"
    ctx.fillStyle = `rgba(239,68,68,${blinkAlpha})`
    ctx.textAlign = "center"
    ctx.fillText("● BLOQUE", cx - 20, roadY + roadH / 2 + 14)
    ctx.restore()
  }

  // Compteur threads bloques
  ctx.save()
  ctx.font = "9px monospace"
  ctx.fillStyle = "rgba(239,68,68,0.7)"
  ctx.textAlign = "center"
  ctx.fillText(!isGreen ? `${nCars} threads en attente` : "passage 1 par 1", cx, y + h - 8)
  ctx.restore()
}

// ── Rond-point fluide ────────────────────────────────────────────────────────
function drawRoundabout(ctx, x, y, w, h, t) {
  const cx = x + w / 2
  const cy = y + h / 2
  const r = Math.min(w, h) * 0.28

  // Label
  ctx.save()
  ctx.font = "bold 11px monospace"
  ctx.fillStyle = "#6db33f"
  ctx.textAlign = "center"
  ctx.fillText("Virtual Threads", cx, y + 16)
  ctx.font = "9px monospace"
  ctx.fillStyle = "rgba(109,179,63,0.6)"
  ctx.fillText("rond-point fluide", cx, y + 29)
  ctx.restore()

  // Cercle central (ilot)
  ctx.save()
  ctx.fillStyle = "rgba(109,179,63,0.08)"
  ctx.strokeStyle = "rgba(109,179,63,0.25)"
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.38, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.restore()

  // Anneau du rond-point
  ctx.save()
  ctx.strokeStyle = "rgba(255,255,255,0.08)"
  ctx.lineWidth = 22
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()

  // Tirets de voie
  ctx.strokeStyle = "rgba(255,255,255,0.12)"
  ctx.lineWidth = 1
  ctx.setLineDash([6, 8])
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.restore()

  // Voitures sur l'anneau (6 voitures qui tournent en continu)
  const nCars = 6
  for (let i = 0; i < nCars; i++) {
    const angle = (t * 1.4 + (i * Math.PI * 2) / nCars) % (Math.PI * 2)
    const carX = cx + Math.cos(angle) * r
    const carY = cy + Math.sin(angle) * r
    const carColor = ["#4695eb", "#6db33f", "#f59e0b", "#a78bfa", "#ef4444", "#06b6d4"][i]

    ctx.save()
    ctx.translate(carX, carY)
    ctx.rotate(angle + Math.PI / 2)
    ctx.fillStyle = carColor + "cc"
    ctx.strokeStyle = carColor
    ctx.lineWidth = 0.8
    ctx.beginPath()
    ctx.roundRect(-6, -10, 12, 16, 3)
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  }

  // "VT" label au centre
  ctx.save()
  ctx.font = "bold 10px monospace"
  ctx.fillStyle = "#6db33f"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText("VT", cx, cy)
  ctx.restore()

  // Compteur
  ctx.save()
  ctx.font = "9px monospace"
  ctx.fillStyle = "rgba(109,179,63,0.7)"
  ctx.textAlign = "center"
  ctx.fillText(`${nCars} threads actifs`, cx, y + h - 8)
  ctx.restore()
}