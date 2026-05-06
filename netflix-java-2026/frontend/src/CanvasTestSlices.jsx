import { useEffect, useRef } from "react"

export default function CanvasTestSlices() {
  const ref     = useRef(null)
  const animRef = useRef(null)
  const tRef    = useRef(0)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return

    const dpr  = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width  = rect.width  * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext("2d")
    ctx.scale(dpr, dpr)
    const W = rect.width
    const H = rect.height

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"
      ctx.fillRect(0, 0, W, H)
      tRef.current += 0.008

      // Detection theme a chaque frame — pas de closure stale
      const isDark = document.documentElement.getAttribute("data-theme") !== "light"
      const th     = isDark ? DARK : LIGHT

      const phase = (tRef.current % 12) / 12
      const leftP = Math.min(1, phase / 0.8)
      const right = phase > 0.18
      const mobile = W < 480

      if (mobile) {
        drawSpring(ctx, 0, 0,       W, H/2 - 4, leftP, tRef.current, th, true)
        // separateur horizontal
        ctx.save()
        ctx.strokeStyle = th.sep; ctx.lineWidth = 1; ctx.setLineDash([4,4])
        ctx.beginPath(); ctx.moveTo(8, H/2); ctx.lineTo(W-8, H/2); ctx.stroke()
        ctx.setLineDash([]); ctx.restore()
        drawWeb   (ctx, 0, H/2 + 4, W, H/2 - 4, right,  tRef.current, th, true)
      } else {
        drawSpring(ctx, 0,     0, W/2, H, leftP, tRef.current, th, false)
        // separateur vertical
        ctx.save()
        ctx.strokeStyle = th.sep; ctx.lineWidth = 1; ctx.setLineDash([4,4])
        ctx.beginPath(); ctx.moveTo(W/2, 8); ctx.lineTo(W/2, H-8); ctx.stroke()
        ctx.setLineDash([]); ctx.restore()
        drawWeb   (ctx, W/2+1, 0, W/2, H, right,  tRef.current, th, false)
      }

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  return <canvas ref={ref} style={{ display:"block", width:"100%", height: 220, borderRadius:8 }} />
}

const DARK = {
  sep:       "rgba(180,180,180,0.25)",
  emptyFill: "rgba(255,255,255,0.08)",
  emptyStr:  "rgba(255,255,255,0.28)",
  labelDim:  "rgba(255,255,255,0.35)",
  barBg:     "rgba(255,255,255,0.1)",
  mockedStr: "rgba(255,255,255,0.12)",
  mockedX:   "rgba(255,100,100,0.5)",
  mockedTxt: "rgba(255,255,255,0.3)",
  mockedLbl: "rgba(255,120,120,0.6)",
  springRed: "#ff6b6b",
  springSub: "rgba(255,107,107,0.7)",
  springBar: "#ff6b6b",
  springT:   "rgba(255,107,107,0.65)",
  greenMain: "#4ade80",
  greenSub:  "rgba(74,222,128,0.7)",
  greenT:    "rgba(74,222,128,0.45)",
  webFill:   "rgba(74,222,128,0.18)",
  webStr:    "#4ade80",
  webTxtOn:  "#4ade80",
  webTxtOff: "rgba(255,255,255,0.2)",
  webSub:    "rgba(74,222,128,0.7)",
  webSubOff: "rgba(255,255,255,0.15)",
  webEmpty:  "rgba(255,255,255,0.05)",
  webStrOff: "rgba(255,255,255,0.15)",
}

const LIGHT = {
  sep:       "rgba(0,0,0,0.18)",
  emptyFill: "rgba(0,0,0,0.06)",
  emptyStr:  "rgba(0,0,0,0.28)",
  labelDim:  "rgba(0,0,0,0.45)",
  barBg:     "rgba(0,0,0,0.1)",
  mockedStr: "rgba(0,0,0,0.18)",
  mockedX:   "rgba(180,0,0,0.5)",
  mockedTxt: "rgba(0,0,0,0.45)",
  mockedLbl: "rgba(160,0,0,0.65)",
  springRed: "#c0392b",
  springSub: "rgba(192,57,43,0.75)",
  springBar: "#c0392b",
  springT:   "rgba(192,57,43,0.7)",
  greenMain: "#15803d",
  greenSub:  "rgba(21,128,61,0.75)",
  greenT:    "rgba(21,128,61,0.55)",
  webFill:   "rgba(21,128,61,0.12)",
  webStr:    "#15803d",
  webTxtOn:  "#15803d",
  webTxtOff: "rgba(0,0,0,0.25)",
  webSub:    "rgba(21,128,61,0.75)",
  webSubOff: "rgba(0,0,0,0.2)",
  webEmpty:  "rgba(0,0,0,0.04)",
  webStrOff: "rgba(0,0,0,0.18)",
}

const MODULES = [
  { name:"DataSource",  dark:"#60a5fa", light:"#1d4ed8" },
  { name:"JPA",         dark:"#34d399", light:"#065f46" },
  { name:"Security",    dark:"#fbbf24", light:"#92400e" },
  { name:"Dispatcher",  dark:"#f87171", light:"#991b1b" },
  { name:"@Beans x120", dark:"#c084fc", light:"#5b21b6" },
  { name:"Ready \u2713",dark:"#4ade80", light:"#15803d" },
]

function drawSpring(ctx, x, y, w, h, progress, t, th, mobile) {
  const cx  = x + w/2
  const N   = MODULES.length
  const isDark = th === DARK
  const PAD = mobile ? 8 : 10
  const GAP = mobile ? 3 : 5
  const bW  = (w - PAD*2 - GAP*(N-1)) / N
  const bH  = mobile ? 30 : 46
  const bY  = y + (mobile ? h*0.38 : h*0.34)

  ctx.save()
  ctx.textAlign = "center"
  ctx.font = "bold 11px 'JetBrains Mono',monospace"
  ctx.fillStyle = th.springRed
  ctx.fillText("@SpringBootTest", cx, y + 14)
  ctx.font = "9px monospace"
  ctx.fillStyle = th.springSub
  ctx.fillText("charge tout \u2014 4 \u00e0 8 secondes", cx, y + 26)
  ctx.restore()

  MODULES.forEach((mod, i) => {
    const bx   = x + PAD + i*(bW+GAP)
    const fill = Math.max(0, Math.min(1, progress*N - i))
    const col  = isDark ? mod.dark : mod.light
    const glow = fill > 0 && fill < 1

    ctx.save()
    ctx.fillStyle   = th.emptyFill
    ctx.strokeStyle = th.emptyStr
    ctx.lineWidth   = 1
    ctx.beginPath(); ctx.roundRect(bx, bY, bW, bH, 3); ctx.fill(); ctx.stroke()

    if (fill > 0) {
      ctx.globalAlpha = fill * (glow ? 0.55 + 0.4*Math.abs(Math.sin(t*5+i)) : 1)
      ctx.fillStyle   = col + (isDark ? "55" : "28")
      ctx.strokeStyle = col
      ctx.lineWidth   = 2
      ctx.beginPath(); ctx.roundRect(bx, bY, bW, bH, 3); ctx.fill(); ctx.stroke()
    }
    ctx.restore()

    ctx.save()
    ctx.font      = "7px monospace"
    ctx.fillStyle = fill > 0.3 ? col : th.labelDim
    ctx.textAlign = "center"
    ctx.fillText(mod.name.replace(" x120",""), bx+bW/2, bY+bH+11)
    ctx.restore()
  })

  const barW = w - PAD*2, barY = bY + bH + 22
  ctx.save()
  ctx.fillStyle = th.barBg
  ctx.beginPath(); ctx.roundRect(x+PAD, barY, barW, 3, 2); ctx.fill()
  ctx.fillStyle = th.springBar; ctx.globalAlpha = 0.85
  ctx.beginPath(); ctx.roundRect(x+PAD, barY, barW*progress, 3, 2); ctx.fill()
  ctx.restore()

  const ms = Math.round(progress*6000)
  ctx.save()
  ctx.font      = "bold 10px monospace"
  ctx.fillStyle = progress >= 1 ? th.springRed : th.springT
  ctx.textAlign = "center"
  ctx.fillText(progress >= 1 ? "~6s \u2014 contexte pr\u00eat" : `${ms}ms... ${Math.round(progress*N)}/6`, cx, y+h-6)
  ctx.restore()
}

function drawWeb(ctx, x, y, w, h, done, t, th, mobile) {
  const cx  = x + w/2
  const PAD = 14
  const bH  = mobile ? 34 : 46
  const bY  = y + (mobile ? h*0.34 : h*0.34)
  const bX  = x + PAD, bW = w - PAD*2

  ctx.save()
  ctx.textAlign = "center"
  ctx.font = "bold 11px 'JetBrains Mono',monospace"
  ctx.fillStyle = th.greenMain
  ctx.fillText("@WebMvcTest", cx, y + 14)
  ctx.font = "9px monospace"
  ctx.fillStyle = th.greenSub
  ctx.fillText("couche Web uniquement \u2014 ~400ms", cx, y + 26)
  ctx.restore()

  const pulse = done ? (0.85 + 0.15*Math.abs(Math.sin(t*2))) : 1
  ctx.save()
  ctx.globalAlpha = done ? pulse : 0.22
  ctx.fillStyle   = done ? th.webFill  : th.webEmpty
  ctx.strokeStyle = done ? th.webStr   : th.webStrOff
  ctx.lineWidth   = done ? 2 : 0.8
  ctx.beginPath(); ctx.roundRect(bX, bY, bW, bH, 6); ctx.fill(); ctx.stroke()
  ctx.restore()

  ctx.save()
  ctx.textAlign = "center"; ctx.textBaseline = "middle"
  ctx.font = "bold 12px monospace"
  ctx.fillStyle = done ? th.webTxtOn : th.webTxtOff
  ctx.fillText(done ? "Web Layer \u2713" : "Web Layer", cx, bY + bH*0.38)
  ctx.font = "9px monospace"
  ctx.fillStyle = done ? th.webSub : th.webSubOff
  ctx.fillText("MockMvc + @MockBean", cx, bY + bH*0.75)
  ctx.restore()

  const MOCKED = ["DataSource","JPA","Security","@Beans"]
  const mW = (bW - 4) / MOCKED.length
  const mY = bY + bH + 6

  MOCKED.forEach((name, i) => {
    const mx = bX + i*(mW+1.3)
    ctx.save()
    ctx.fillStyle = th.emptyFill; ctx.strokeStyle = th.mockedStr; ctx.lineWidth = 0.6
    ctx.beginPath(); ctx.roundRect(mx, mY, mW, 14, 2); ctx.fill(); ctx.stroke()
    ctx.strokeStyle = th.mockedX; ctx.lineWidth = 0.8
    ctx.beginPath(); ctx.moveTo(mx+3, mY+3); ctx.lineTo(mx+mW-3, mY+11); ctx.stroke()
    ctx.font = "7px monospace"; ctx.fillStyle = th.mockedTxt; ctx.textAlign = "center"
    ctx.fillText(name, mx+mW/2, mY+8)
    ctx.restore()
  })

  ctx.save()
  ctx.font = "8px monospace"; ctx.fillStyle = th.mockedLbl; ctx.textAlign = "center"
  ctx.fillText("d\u00e9sactiv\u00e9s \u00b7 simul\u00e9s par @MockBean", cx, mY + 24)
  ctx.restore()

  ctx.save()
  ctx.font = "bold 10px monospace"
  ctx.fillStyle = done ? th.greenMain : th.greenT
  ctx.textAlign = "center"
  ctx.fillText(done ? "~400ms \u2014 pr\u00eat !" : "En attente...", cx, y+h-6)
  ctx.restore()
}