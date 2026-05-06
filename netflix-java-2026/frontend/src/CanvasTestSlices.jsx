import { useEffect, useRef } from "react"

// Animation : maison se construisant brique par brique (SpringBootTest)
//             vs porte qui s'ouvre instantanement (WebMvcTest)
export default function CanvasTestSlices({ running, springProg, webmvcDone }) {
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

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      tRef.current += 0.018

      const t = tRef.current
      const half = W / 2

      // ── Cote gauche : SpringBootTest ── construction maison ──────────
      drawHouseBuilding(ctx, 20, 20, half - 40, H - 40, springProg / 100, t)

      // Separateur
      ctx.save()
      ctx.strokeStyle = "rgba(255,255,255,0.08)"
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(half, 10)
      ctx.lineTo(half, H - 10)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.restore()

      // ── Cote droit : WebMvcTest ── porte qui s'ouvre ─────────────────
      drawDoor(ctx, half + 20, 20, half - 40, H - 40, webmvcDone, t)

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [running, springProg, webmvcDone])

  return (
    <canvas
      ref={ref}
      style={{ display: "block", width: "100%", height: 180, borderRadius: 8 }}
    />
  )
}

function drawHouseBuilding(ctx, x, y, w, h, progress, t) {
  const cx = x + w / 2
  const label = "@SpringBootTest"
  const layers = [
    { name: "DataSource", color: "#4695eb" },
    { name: "JPA/Hibernate", color: "#6db33f" },
    { name: "Spring Security", color: "#f59e0b" },
    { name: "DispatcherServlet", color: "#e05252" },
    { name: "All @Beans", color: "#a78bfa" },
    { name: "Context ready", color: "#6db33f" },
  ]
  const totalLayers = layers.length
  const brickH = (h * 0.55) / totalLayers
  const brickY = y + h * 0.35
  const brickW = w * 0.72
  const brickX = cx - brickW / 2

  // Label
  ctx.save()
  ctx.font = "bold 11px monospace"
  ctx.fillStyle = "#ef4444"
  ctx.textAlign = "center"
  ctx.fillText(label, cx, y + 14)
  ctx.restore()

  // Toit (apparait quand progress >= 0.9)
  if (progress >= 0.9) {
    const roofAlpha = Math.min(1, (progress - 0.9) / 0.1)
    ctx.save()
    ctx.globalAlpha = roofAlpha
    ctx.fillStyle = "#92400e"
    ctx.beginPath()
    ctx.moveTo(brickX - 8, brickY)
    ctx.lineTo(cx, brickY - 28)
    ctx.lineTo(brickX + brickW + 8, brickY)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  // Briques
  layers.forEach((layer, i) => {
    const layerProgress = Math.max(0, Math.min(1, (progress * totalLayers) - i))
    if (layerProgress <= 0) return
    const by = brickY + (totalLayers - 1 - i) * brickH
    ctx.save()
    ctx.globalAlpha = layerProgress
    ctx.fillStyle = layer.color + "33"
    ctx.strokeStyle = layer.color
    ctx.lineWidth = 0.8
    ctx.beginPath()
    ctx.roundRect(brickX, by, brickW * Math.min(1, layerProgress * 2), brickH - 2, 3)
    ctx.fill()
    ctx.stroke()
    if (layerProgress > 0.5) {
      ctx.font = "9px monospace"
      ctx.fillStyle = layer.color
      ctx.globalAlpha = Math.min(1, (layerProgress - 0.5) * 2)
      ctx.fillText(layer.name, brickX + 6, by + brickH / 2 + 3)
    }
    ctx.restore()
  })

  // Temps simule
  const simMs = Math.round(progress * 6500)
  ctx.save()
  ctx.font = "bold 11px monospace"
  ctx.fillStyle = progress >= 1 ? "#ef4444" : "rgba(239,68,68,0.5)"
  ctx.textAlign = "center"
  ctx.fillText(progress >= 1 ? `~${(simMs / 1000).toFixed(1)}s` : `${simMs}ms...`, cx, y + h - 8)
  ctx.restore()

  // Spinner si en cours
  if (progress > 0 && progress < 1) {
    ctx.save()
    ctx.strokeStyle = "#ef4444"
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.7
    ctx.beginPath()
    ctx.arc(cx + brickW / 2 + 18, brickY + (totalLayers * brickH) / 2, 7, 0, Math.PI * 1.5 + (t * 3) % (Math.PI * 2))
    ctx.stroke()
    ctx.restore()
  }
}

function drawDoor(ctx, x, y, w, h, done, t) {
  const cx = x + w / 2
  const label = "@WebMvcTest"
  const doorW = w * 0.45
  const doorH = h * 0.58
  const doorX = cx - doorW / 2
  const doorY = y + h * 0.28

  // Label
  ctx.save()
  ctx.font = "bold 11px monospace"
  ctx.fillStyle = "#6db33f"
  ctx.textAlign = "center"
  ctx.fillText(label, cx, y + 14)
  ctx.restore()

  // Mur simple
  ctx.save()
  ctx.fillStyle = "rgba(255,255,255,0.04)"
  ctx.strokeStyle = "rgba(255,255,255,0.1)"
  ctx.lineWidth = 0.5
  ctx.beginPath()
  ctx.roundRect(x + w * 0.05, doorY - 8, w * 0.9, doorH + 16, 4)
  ctx.fill()
  ctx.stroke()
  ctx.restore()

  // Porte
  const openAngle = done ? Math.min(Math.PI * 0.5, (t - (tRef.current - 0.5)) * 4) : 0
  const openRatio = done ? Math.min(1, openAngle / (Math.PI * 0.5)) : 0

  ctx.save()
  // Cadre
  ctx.strokeStyle = "#92400e"
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.rect(doorX, doorY, doorW, doorH)
  ctx.stroke()

  // Panneau de porte (s'ouvre vers la droite en perspective)
  const visibleW = doorW * (1 - openRatio * 0.85)
  ctx.fillStyle = done ? "rgba(109,179,63,0.25)" : "rgba(139,92,46,0.4)"
  ctx.strokeStyle = done ? "#6db33f" : "#92400e"
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.rect(doorX, doorY, visibleW, doorH)
  ctx.fill()
  ctx.stroke()

  // Poignee
  if (visibleW > 20) {
    ctx.beginPath()
    ctx.arc(doorX + visibleW - 12, doorY + doorH / 2, 4, 0, Math.PI * 2)
    ctx.fillStyle = "#f59e0b"
    ctx.fill()
  }

  // Check ou fleche
  if (done) {
    ctx.font = "bold 18px monospace"
    ctx.fillStyle = "#6db33f"
    ctx.textAlign = "center"
    ctx.fillText("✓", doorX + doorW / 2 + doorW * openRatio * 0.4, doorY + doorH / 2 + 6)
  }
  ctx.restore()

  // Temps
  ctx.save()
  ctx.font = "bold 11px monospace"
  ctx.fillStyle = done ? "#6db33f" : "rgba(109,179,63,0.4)"
  ctx.textAlign = "center"
  ctx.fillText(done ? "~400ms" : "En attente...", cx, y + h - 8)
  ctx.restore()

  // Mock label
  ctx.save()
  ctx.font = "9px monospace"
  ctx.fillStyle = "rgba(109,179,63,0.55)"
  ctx.textAlign = "center"
  ctx.fillText("Service: mocked", cx, doorY - 14)
  ctx.restore()
}