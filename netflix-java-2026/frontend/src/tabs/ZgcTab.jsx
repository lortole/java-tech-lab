import { useState, useRef, useEffect } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts"

const rand = (min, max) => Math.round(Math.random() * (max - min) + min)

const generateGcPoint = (tick) => ({
  g1: tick % 15 === 0 ? rand(800, 1500) : tick % 7 === 0 ? rand(200, 600) : rand(5, 40),
  zgc: rand(0, 1),
})

function AnalogyCard({ icon, title, desc, color }) {
  return (
    <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "0.75rem 1rem", background: `${color}11`, border: `1px solid ${color}`, borderRadius: "var(--radius)" }}>
      <span style={{ fontSize: "1.5rem", lineHeight: 1, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: "0.85rem", color, marginBottom: "0.2rem" }}>{title}</div>
        <div style={{ fontSize: "0.8rem", color: "var(--muted)", textAlign: "left" }}>{desc}</div>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "0.6rem 0.9rem", fontFamily: "var(--font-mono)", fontSize: "0.78rem" }}>
      <div style={{ color: "var(--muted)", marginBottom: "0.35rem" }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>
          {p.name} : <strong>{p.value}ms</strong>
        </div>
      ))}
    </div>
  )
}

export default function ZgcTab() {
  const [running, setRunning] = useState(false)
  const [data, setData] = useState([])
  const [stats, setStats] = useState(null)
  const [mode, setMode] = useState("both") // "both" | "g1" | "zgc"
  const intervalRef = useRef(null)
  const tickRef = useRef(0)
  const allDataRef = useRef([])

  const start = () => {
    setRunning(true); setData([]); setStats(null)
    tickRef.current = 0; allDataRef.current = []

    intervalRef.current = setInterval(() => {
      const tick = ++tickRef.current
      const point = generateGcPoint(tick)
      const entry = { tick, label: `t${tick}`, g1: point.g1, zgc: point.zgc }
      allDataRef.current.push(entry)

      setData(prev => [...prev, entry].slice(-50))

      const all = allDataRef.current
      setStats({
        g1Max: Math.max(...all.map(d => d.g1)),
        g1Avg: Math.round(all.reduce((s, d) => s + d.g1, 0) / all.length),
        g1Stw: all.filter(d => d.g1 > 200).length,
        zgcMax: Math.max(...all.map(d => d.zgc)),
        total: all.length,
      })

      if (tick >= 60) stop()
    }, 180)
  }

  const stop = () => { clearInterval(intervalRef.current); setRunning(false) }
  const reset = () => { stop(); setData([]); setStats(null); tickRef.current = 0; allDataRef.current = [] }

  useEffect(() => () => clearInterval(intervalRef.current), [])

  const showG1 = mode === "both" || mode === "g1"
  const showZgc = mode === "both" || mode === "zgc"

  return (
    <div className="fade-in">
      <div className="tab-header">
        <h2>🗑️ <span className="highlight3">Generational ZGC</span></h2>
        <p>Comprends pourquoi le ramasse-miettes peut faire planter toute une infrastructure — et comment Netflix a résolu ça.</p>
      </div>

      {/* Intro analogie */}
      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <div className="card-title">🧠 Le problème en une image</div>
        <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginBottom: "1rem" }}>
          Le <strong>Garbage Collector (GC)</strong> c'est l'éboueur de ta JVM — il nettoie la mémoire inutilisée.
          Le problème avec G1GC : pour faire le ménage, il <strong>met tout en pause</strong> ("stop-the-world").
          Chez Netflix, 1,5 seconde de pause = des milliers de timeouts = une cascade de retries qui surcharge tout le cluster.
        </p>
        <div className="two-col">
          <AnalogyCard icon="🚮" title="G1GC — L'éboueur qui bloque la rue" desc="Pour ramasser les poubelles, il ferme toute la rue (stop-the-world). Les voitures (requêtes) attendent. Si ça dure 1,5s, tout le quartier s'embouteille." color="var(--danger)" />
          <AnalogyCard icon="🧹" title="ZGC — Le robot aspirateur en continu" desc="Nettoie la mémoire en arrière-plan, sans jamais bloquer la circulation. Les voitures passent sans s'arrêter. Pause < 1ms garantie." color="var(--accent)" />
        </div>
      </div>

      {/* Effet domino */}
      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <div className="card-title">💥 L'effet domino chez Netflix (G1GC)</div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          {[
            { icon: "⏸️", label: "Pause GC 1.5s", color: "var(--danger)" },
            { icon: "⏱️", label: "Timeout IPC déclenché", color: "var(--accent3)" },
            { icon: "🔁", label: "Cascade de retries", color: "var(--accent3)" },
            { icon: "📈", label: "Surcharge cluster", color: "var(--danger)" },
          ].map((step, i, arr) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ background: `${step.color}15`, border: `1px solid ${step.color}`, borderRadius: "var(--radius)", padding: "0.5rem 0.75rem", fontSize: "0.78rem", fontFamily: "var(--font-mono)", color: step.color, textAlign: "center" }}>
                {step.icon} {step.label}
              </div>
              {i < arr.length - 1 && <span style={{ color: "var(--muted)", fontSize: "1.2rem" }}>→</span>}
            </div>
          ))}
        </div>
        <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.75rem" }}>
          Résultat contre-intuitif : ZGC consomme plus de CPU, mais en supprimant les retry storms,
          il <strong style={{ color: "var(--accent)" }}>réduit la charge globale du cluster</strong>.
        </p>
      </div>

      {/* À qui ça parle */}
      <div className="card" style={{ marginBottom: "1.25rem", borderColor: "rgba(245,158,11,0.3)" }}>
        <div className="card-title">🎯 À qui ça parle ?</div>
        <div className="three-col">
          {[
            { icon: "🧑‍💻", who: "Dev / DevOps", impact: "1 flag JVM suffit : -XX:+UseZGC -XX:+ZGenerational" },
            { icon: "👷", who: "Archi / Tech Lead", impact: "Argument en revue : pas juste GC rapide, c'est éliminer les retry storms" },
            { icon: "🚀", who: "Contexte Netflix", impact: "Migration G1 → ZGC sur 4 000 services en production" },
          ].map((item, i) => (
            <div key={i} style={{ textAlign: "center", padding: "0.75rem" }}>
              <div style={{ fontSize: "1.75rem", marginBottom: "0.4rem" }}>{item.icon}</div>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.25rem" }}>{item.who}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{item.impact}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Config */}
      <div className="two-col" style={{ marginBottom: "1.25rem" }}>
        <div className="card">
          <div className="card-title" style={{ color: "var(--danger)" }}>G1GC — Le problème</div>
          <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "0.75rem" }}>
            Pauses stop-the-world pouvant atteindre <strong style={{ color: "var(--danger)" }}>~1,5s</strong>. Activé par défaut sur Java 21.
          </p>
          <pre style={{ background: "var(--code-bg)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1rem", fontSize: "0.78rem", lineHeight: 1.7, overflowX: "auto", margin: 0, textAlign: "left", fontFamily: "var(--font-mono)", color: "var(--text)" }}>{
            `# JVM par défaut sur Java 21
# G1GC activé implicitement
java -jar app.jar

# Stop-the-world observé :
# Minor GC  : 5-40ms
# Major GC  : 200-600ms
# Full GC   : 800-1500ms ⚠️`
          }</pre>
        </div>
        <div className="card">
          <div className="card-title" style={{ color: "var(--accent)" }}>Generational ZGC — Le fix</div>
          <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "0.75rem" }}>
            Pauses <strong style={{ color: "var(--accent)" }}>&lt;1ms</strong> garanties. Disponible dès Java 21.
          </p>
          <pre style={{ background: "var(--code-bg)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1rem", fontSize: "0.78rem", lineHeight: 1.7, overflowX: "auto", margin: 0, textAlign: "left", fontFamily: "var(--font-mono)", color: "var(--text)" }}>{
            `# Activer Generational ZGC
java -XX:+UseZGC \\
     -XX:+ZGenerational \\
     -Xms512m -Xmx2g \\
     -jar app.jar

# Dans Spring Boot :
# JAVA_OPTS="-XX:+UseZGC -XX:+ZGenerational"`
          }</pre>
        </div>
      </div>

      {/* Benchmark superposé */}
      <div className="card">
        <div className="card-title">Simulation GC — G1 vs ZGC</div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem", alignItems: "center" }}>
          {/* Filtre courbes */}
          <div style={{ display: "flex", gap: "0.35rem" }}>
            {[
              { id: "both", label: "G1 + ZGC" },
              { id: "g1", label: "G1 seul" },
              { id: "zgc", label: "ZGC seul" },
            ].map(opt => (
              <button key={opt.id} onClick={() => setMode(opt.id)} style={{
                padding: "0.35rem 0.75rem", borderRadius: "var(--radius)",
                fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 600,
                cursor: "pointer", border: `1px solid ${mode === opt.id ? "var(--accent2)" : "var(--border)"}`,
                background: mode === opt.id ? "rgba(70,149,235,.12)" : "transparent",
                color: mode === opt.id ? "var(--accent2)" : "var(--muted)",
                transition: "all 180ms ease"
              }}>{opt.label}</button>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          <button className="btn btn-primary" onClick={start} disabled={running}>{running ? <span className="pulse">⏳ En cours...</span> : "▶ Lancer"}</button>
          <button className="btn btn-secondary" onClick={stop} disabled={!running}>⏹ Stop</button>
          <button className="btn btn-secondary" onClick={reset} disabled={running}>↺ Reset</button>
        </div>

        {/* Légende manuelle */}
        <div style={{ display: "flex", gap: "1.25rem", marginBottom: "0.75rem", fontSize: "0.78rem", fontFamily: "var(--font-mono)" }}>
          {showG1 && <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}><div style={{ width: 24, height: 2, background: "#ef4444", borderRadius: 2 }} /> <span style={{ color: "var(--muted)" }}>G1GC — pauses jusqu'à 1500ms</span></div>}
          {showZgc && <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}><div style={{ width: 24, height: 2, background: "#6db33f", borderRadius: 2 }} /> <span style={{ color: "var(--muted)" }}>ZGC — pauses &lt; 1ms</span></div>}
          {running && <div style={{ marginLeft: "auto", color: "#ef4444" }} className="pulse">● LIVE</div>}
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="label" tick={{ fill: "var(--muted)", fontSize: 10, fontFamily: "JetBrains Mono" }} interval={9} />
            <YAxis tick={{ fill: "var(--muted)", fontSize: 11, fontFamily: "JetBrains Mono" }} unit="ms" />
            <Tooltip content={<CustomTooltip />} />
            {/* Ligne de danger timeout IPC */}
            <ReferenceLine y={500} stroke="var(--accent3)" strokeDasharray="6 3" label={{ value: "timeout IPC", fill: "var(--accent3)", fontSize: 10, fontFamily: "JetBrains Mono", position: "insideTopRight" }} />
            {showG1 && <Line type="monotone" dataKey="g1" name="G1GC" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />}
            {showZgc && <Line type="monotone" dataKey="zgc" name="ZGC" stroke="#6db33f" strokeWidth={2} dot={false} isAnimationActive={false} />}
          </LineChart>
        </ResponsiveContainer>

        <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.5rem", fontFamily: "var(--font-mono)", textAlign: "left" }}>
          — — — ligne orange : seuil de timeout IPC Netflix (500ms). Chaque pic G1 au-dessus déclenche un retry storm.
        </p>
      </div>

      {/* Stats */}
      {stats && stats.total >= 5 && (
        <div className="fade-in">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
            {[
              { value: `${stats.g1Max}ms`, label: "G1 pause max", color: "var(--danger)" },
              { value: `${stats.g1Avg}ms`, label: "G1 pause moy.", color: "var(--danger)" },
              { value: `${stats.g1Stw}`, label: "G1 stop-world", color: stats.g1Stw > 0 ? "var(--danger)" : "var(--accent)" },
              { value: `${stats.zgcMax}ms`, label: "ZGC pause max", color: "var(--accent)" },
            ].map((s, i) => (
              <div key={i} className="stat-card">
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {stats.g1Stw > 0 && (
            <div className="card fade-in" style={{ borderColor: "rgba(239,68,68,0.4)" }}>
              <div className="card-title" style={{ color: "var(--danger)" }}>⚠️ {stats.g1Stw} retry storm(s) simulé(s)</div>
              <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                {stats.g1Stw} pause(s) G1 au-dessus du seuil de timeout IPC (500ms).
                À l'échelle Netflix, chaque pic déclencherait une <strong style={{ color: "var(--danger)" }}>cascade de retries</strong> sur tous les services dépendants.
                ZGC : <strong style={{ color: "var(--accent)" }}>0 dépassement</strong>, 0 retry storm.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="card" style={{ borderColor: "rgba(245,158,11,0.3)" }}>
        <div className="card-title">💡 Ce que ça change en mission</div>
        <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
          Sur Spring Boot 3+ avec Java 21 : <code>-XX:+UseZGC -XX:+ZGenerational</code> est dispo maintenant.
          Argument en revue d'archi : ce n'est pas "juste un GC plus rapide",
          c'est <strong style={{ color: "var(--accent3)" }}>éliminer une source de retry storms</strong> sur les services à fort trafic.
          Pas forcément utile sur une appli CRUD légère — mais à avoir en tête.
        </p>
      </div>
    </div>
  )
}
