import { useEffect, useRef } from "react"

// Animation rue :
// Gauche : G1GC — eboueurs bloquent la rue (stop-the-world)
// Droite : ZGC — robot aspirateur en arriere-plan, circulation fluide
export default function CanvasZgc({ running, g1Stw }) {
  const ref = useRef(null)
  const animRef = useRef(null)
  const tRef = useRef(0)
  const gcPauseRef = useRef(0)

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
      tRef.current += 0.016

      // Declenchement pause G1 toutes les ~8 secondes
      const gcCycle = Math.floor(tRef.current * 60) % 480
      const isGcPause = gcCycle > 380 && gcCycle < 460

      drawG1Street(ctx, 16, 0, half - 28, H, tRef.current, isGcPause)

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

      drawZgcStreet(ctx, half + 12, 0, half - 28, H, tRef.current)

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [running])

  return (
    <canvas
      ref={ref}
      style={{ display: "block", width: "100%", height: 200, borderRadius: 8 }}
    />
  )
}

// ── Rue G1GC — eboueurs bloquent tout ───────────────────────────────────────
function drawG1Street(ctx, x, y, w, h, t, isGcPause) {
  const cx = x + w / 2
  const roadY = y + h * 0.52
  const roadH = 26

  // Label
  ctx.save()
  ctx.font = "bold 11px monospace"
  ctx.fillStyle = "#ef4444"
  ctx.textAlign = "center"
  ctx.fillText("G1GC", cx, y + 16)
  ctx.font = "9px monospace"
  ctx.fillStyle = "rgba(239,68,68,0.6)"
  ctx.fillText("stop-the-world", cx, y + 28)
  ctx.restore()

  // Route
  ctx.save()
  ctx.fillStyle = "rgba(255,255,255,0.05)"
  ctx.beginPath()
  ctx.rect(x + 4, roadY - roadH / 2, w - 8, roadH)
  ctx.fill()
  ctx.setLineDash([8, 6])
  ctx.strokeStyle = "rgba(255,255,255,0.12)"
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x + 4, roadY)
  ctx.lineTo(x + w - 4, roadY)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.restore()

  if (isGcPause) {
    // Eboueurs en train de bloquer la rue (overlay rouge)
    const pauseAlpha = 0.18 + 0.1 * Math.abs(Math.sin(t * 5))
    ctx.save()
    ctx.fillStyle = `rgba(239,68,68,${pauseAlpha})`
    ctx.beginPath()
    ctx.rect(x + 4, roadY - roadH / 2 - 4, w - 8, roadH + 8)
    ctx.fill()
    ctx.restore()

    // Camion poubelle qui bloque
    ctx.save()
    ctx.fillStyle = "#374151"
    ctx.strokeStyle = "#ef4444"
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.roundRect(cx - 22, roadY - 14, 44, 20, 4)
    ctx.fill()
    ctx.stroke()
    ctx.font = "bold 9px monospace"
    ctx.fillStyle = "#ef4444"
    ctx.textAlign = "center"
    ctx.fillText("GC", cx, roadY - 1)
    ctx.restore()

    // Barriere de chaque cote
    ctx.save()
    ctx.strokeStyle = "#ef4444"
    ctx.lineWidth = 2
    for (let i = 0; i < 3; i++) {
      const bx = x + 8 + i * 10
      ctx.beginPath()
      ctx.moveTo(bx, roadY - roadH / 2 - 2)
      ctx.lineTo(bx + 6, roadY + roadH / 2 + 2)
      ctx.stroke()
    }
    ctx.restore()

    // Voitures bloquees
    for (let i = 0; i < 4; i++) {
      const carX = x + 8 + i * 18
      const bounce = Math.sin(t * 4 + i * 1.2) * 1.5
      const carColor = ["#4695eb", "#a78bfa", "#f59e0b", "#06b6d4"][i]
      ctx.save()
      ctx.fillStyle = carColor + "bb"
      ctx.strokeStyle = carColor
      ctx.lineWidth = 0.8
      ctx.beginPath()
      ctx.roundRect(carX, roadY - 8 + bounce, 16, 10, 2)
      ctx.fill()
      ctx.stroke()
      ctx.restore()
    }

    // PAUSE label clignotant
    const blinkA = 0.6 + 0.4 * Math.abs(Math.sin(t * 4))
    ctx.save()
    ctx.font = "bold 10px monospace"
    ctx.fillStyle = `rgba(239,68,68,${blinkA})`
    ctx.textAlign = "center"
    ctx.fillText("STOP-THE-WORLD", cx, roadY + roadH / 2 + 14)
    ctx.restore()

    // Duree pause
    ctx.save()
    ctx.font = "9px monospace"
    ctx.fillStyle = "rgba(239,68,68,0.8)"
    ctx.textAlign = "center"
    ctx.fillText("pause ~800-1500ms", cx, y + h - 8)
    ctx.restore()
  } else {
    // Circulation normale
    const speed = 55
    for (let i = 0; i < 4; i++) {
      const carX = x + 4 + (t * speed + i * (w / 4)) % (w - 8)
      const carColor = ["#4695eb", "#a78bfa", "#f59e0b", "#06b6d4"][i]
      ctx.save()
      ctx.fillStyle = carColor + "aa"
      ctx.strokeStyle = carColor
      ctx.lineWidth = 0.8
      ctx.beginPath()
      ctx.roundRect(carX - 8, roadY - 7, 16, 10, 2)
      ctx.fill()
      ctx.stroke()
      ctx.restore()
    }

    // Memoire qui s'accumule (petits points)
    for (let i = 0; i < 8; i++) {
      const mx = x + 10 + (i * 28 + Math.floor(t * 30)) % (w - 20)
      const my = roadY - roadH / 2 - 8 - (i % 3) * 5
      ctx.save()
      ctx.globalAlpha = 0.4 + 0.3 * Math.sin(t * 2 + i)
      ctx.fillStyle = "#f59e0b"
      ctx.beginPath()
      ctx.arc(mx, my, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    ctx.save()
    ctx.font = "9px monospace"
    ctx.fillStyle = "rgba(109,179,63,0.6)"
    ctx.textAlign = "center"
    ctx.fillText("circulation ok... pour l'instant", cx, y + h - 8)
    ctx.restore()
  }
}

// ── Rue ZGC — robot aspirateur en arriere-plan ───────────────────────────────
function drawZgcStreet(ctx, x, y, w, h, t) {
  const cx = x + w / 2
  const roadY = y + h * 0.52
  const roadH = 26

  // Label
  ctx.save()
  ctx.font = "bold 11px monospace"
  ctx.fillStyle = "#6db33f"
  ctx.textAlign = "center"
  ctx.fillText("Generational ZGC", cx, y + 16)
  ctx.font = "9px monospace"
  ctx.fillStyle = "rgba(109,179,63,0.6)"
  ctx.fillText("concurrent < 1ms", cx, y + 28)
  ctx.restore()

  // Route
  ctx.save()
  ctx.fillStyle = "rgba(255,255,255,0.05)"
  ctx.beginPath()
  ctx.rect(x + 4, roadY - roadH / 2, w - 8, roadH)
  ctx.fill()
  ctx.setLineDash([8, 6])
  ctx.strokeStyle = "rgba(255,255,255,0.12)"
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x + 4, roadY)
  ctx.lineTo(x + w - 4, roadY)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.restore()

  // Voitures qui circulent TOUJOURS fluides
  const speed = 55
  for (let i = 0; i < 4; i++) {
    const carX = x + 4 + (t * speed + i * (w / 4)) % (w - 8)
    const carColor = ["#4695eb", "#a78bfa", "#f59e0b", "#06b6d4"][i]
    ctx.save()
    ctx.fillStyle = carColor + "cc"
    ctx.strokeStyle = carColor
    ctx.lineWidth = 0.8
    ctx.beginPath()
    ctx.roundRect(carX - 8, roadY - 7, 16, 10, 2)
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  }

  // Robot aspirateur (ZGC) qui se deplace sur le trottoir en arriere-plan
  const robotX = x + 8 + (t * 32) % (w - 20)
  const robotY = roadY - roadH / 2 - 14

  ctx.save()
  // Corps du robot
  ctx.fillStyle = "rgba(109,179,63,0.3)"
  ctx.strokeStyle = "#6db33f"
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(robotX, robotY, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  // Antenne
  ctx.beginPath()
  ctx.moveTo(robotX, robotY - 8)
  ctx.lineTo(robotX, robotY - 13)
  ctx.strokeStyle = "#6db33f"
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(robotX, robotY - 13, 2, 0, Math.PI * 2)
  ctx.fillStyle = "#6db33f"
  ctx.fill()
  // Rotation indicateur
  ctx.strokeStyle = "rgba(109,179,63,0.8)"
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(robotX, robotY, 5, t * 4, t * 4 + Math.PI * 1.3)
  ctx.stroke()
  ctx.restore()

  // Trail de nettoyage (petits points disparaissent)
  for (let i = 1; i <= 5; i++) {
    const trailX = robotX - i * 12
    if (trailX < x + 4) continue
    ctx.save()
    ctx.globalAlpha = (1 - i / 6) * 0.4
    ctx.fillStyle = "#6db33f"
    ctx.beginPath()
    ctx.arc(trailX, robotY, 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // Memoire en cours de nettoyage (points qui s'effacent devant le robot)
  for (let i = 0; i < 5; i++) {
    const mx = robotX + 12 + i * 14
    if (mx > x + w - 4) continue
    const my = roadY - roadH / 2 - 8 - (i % 3) * 4
    const fadeAlpha = 0.3 + 0.3 * Math.sin(t * 3 + i)
    ctx.save()
    ctx.globalAlpha = fadeAlpha
    ctx.fillStyle = "#f59e0b"
    ctx.beginPath()
    ctx.arc(mx, my, 2.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // ZGC label
  ctx.save()
  ctx.font = "8px monospace"
  ctx.fillStyle = "rgba(109,179,63,0.6)"
  ctx.textAlign = "center"
  ctx.fillText("ZGC", robotX, robotY + 18)
  ctx.restore()

  ctx.save()
  ctx.font = "9px monospace"
  ctx.fillStyle = "rgba(109,179,63,0.8)"
  ctx.textAlign = "center"
  ctx.fillText("circulation ininterrompue", cx, y + h - 8)
  ctx.restore()
}