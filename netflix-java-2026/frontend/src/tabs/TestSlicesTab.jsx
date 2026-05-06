import { useState, useRef } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import CanvasTestSlices from "../CanvasTestSlices"

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

const STEPS_SPRING = [
  "Chargement ApplicationContext...",
  "Demarrage DataSource (H2)...",
  "Initialisation JPA / Hibernate...",
  "Chargement Spring Security...",
  "Demarrage DispatcherServlet...",
  "Chargement tous les @Beans...",
  "Contexte pret — lancement du test",
]

const STEPS_WEBMVC = [
  "Chargement slice Web uniquement...",
  "MockMvc initialise...",
  "Spring Security (slice)...",
  "Slice pret — lancement du test",
]

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

async function runBenchmark(type, onLog, onProgress, onDone) {
  const isSpring = type === "spring"
  const steps    = isSpring ? STEPS_SPRING : STEPS_WEBMVC
  const duration = isSpring ? rand(4200, 8500) : rand(380, 650)
  const stepDelay = Math.floor(duration / steps.length)

  onLog(`--- ${isSpring ? "@SpringBootTest" : "@WebMvcTest"} demarre ---`, "muted")

  for (let i = 0; i < steps.length; i++) {
    await new Promise(r => setTimeout(r, stepDelay))
    onLog(steps[i], "info")
    onProgress(Math.round(((i + 1) / steps.length) * 100))
  }

  onLog(`✔ Tests run: 2, Failures: 0 — ${duration}ms`, "ok")
  onDone(duration)
}

export default function TestSlicesTab() {
  const [running, setRunning]       = useState(false)
  const [results, setResults]       = useState({ spring: null, webmvc: null })
  const [springLogs, setSpringLogs] = useState([])
  const [webmvcLogs, setWebmvcLogs] = useState([])
  const [springProg, setSpringProg] = useState(0)
  const [webmvcProg, setWebmvcProg] = useState(0)
  const [springDone, setSpringDone] = useState(false)
  const [webmvcDone, setWebmvcDone] = useState(false)
  const springRef = useRef(null)
  const webmvcRef = useRef(null)

  const scrollLog = (ref) => {
    setTimeout(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight }, 50)
  }

  const addSpringLog = (msg, type) => {
    setSpringLogs(prev => [...prev, { msg, type, id: Date.now() + Math.random() }])
    scrollLog(springRef)
  }
  const addWebmvcLog = (msg, type) => {
    setWebmvcLogs(prev => [...prev, { msg, type, id: Date.now() + Math.random() }])
    scrollLog(webmvcRef)
  }

  const runBoth = async () => {
    setRunning(true)
    setResults({ spring: null, webmvc: null })
    setSpringLogs([]); setWebmvcLogs([])
    setSpringProg(0);  setWebmvcProg(0)
    setSpringDone(false); setWebmvcDone(false)

    const pSpring = runBenchmark(
      "spring", addSpringLog, setSpringProg,
      (ms) => { setResults(prev => ({ ...prev, spring: ms })); setSpringDone(true) }
    )
    const pWebmvc = runBenchmark(
      "webmvc", addWebmvcLog, setWebmvcProg,
      (ms) => { setResults(prev => ({ ...prev, webmvc: ms })); setWebmvcDone(true) }
    )

    await Promise.all([pSpring, pWebmvc])
    setRunning(false)
  }

  const reset = () => {
    setResults({ spring: null, webmvc: null })
    setSpringLogs([]); setWebmvcLogs([])
    setSpringProg(0);  setWebmvcProg(0)
    setSpringDone(false); setWebmvcDone(false)
  }

  const gain = results.spring && results.webmvc
    ? Math.round((1 - results.webmvc / results.spring) * 100) : null

  const chartData = results.spring && results.webmvc ? [
    { name: "@SpringBootTest", ms: results.spring, fill: "#ef4444" },
    { name: "@WebMvcTest",     ms: results.webmvc, fill: "#6db33f" },
  ] : []

  return (
    <div className="fade-in">
      <div className="tab-header">
        <h2>⚡ <span className="highlight">Test Slices</span></h2>
        <p>Pourquoi tes tests sont lents — et comment les accelerer sans changer une ligne de code metier.</p>
      </div>

      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <div className="card-title">🎪 Le probleme en une image</div>
        <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginBottom: "0.75rem" }}>
          Imagine que pour tester si <strong>une seule porte</strong> de ta maison ferme bien,
          tu doives construire toute la maison a chaque fois — cuisine, cave, garage, jardin.
          C'est ce que fait <code style={{ background: "rgba(239,68,68,0.15)", color: "#ff6b6b", padding: "0.1rem 0.4rem", borderRadius: 3 }}>@SpringBootTest</code>.
        </p>

        <div style={{ background: "var(--code-bg)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.5rem", marginBottom: "0.75rem" }}>
          <CanvasTestSlices running={running} springProg={springProg} webmvcDone={webmvcDone} />
        </div>

        <div className="two-col">
          <AnalogyCard
            icon="🏠"
            title="@SpringBootTest — construire toute la maison"
            desc="Demarre la base de donnees, JPA, Spring Security, tous les beans... pour tester un seul endpoint. Prend 4 a 8 secondes."
            color="var(--danger)"
          />
          <AnalogyCard
            icon="🚪"
            title="@WebMvcTest — tester juste la porte"
            desc="Charge uniquement la couche Web. Le reste est mocke. Meme couverture, 10x plus rapide. Prend moins de 500ms."
            color="var(--accent)"
          />
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1.25rem", borderColor: "rgba(109,179,63,0.3)" }}>
        <div className="card-title">🎓 A qui ca parle ?</div>
        <div className="three-col">
          {[
            { icon: "👨‍💻", who: "Dev Java / Spring", impact: "Tes builds CI passent de 10min a 3min" },
            { icon: "👷",   who: "Tech Lead",          impact: "Tu proposes ca en revue de code des demain" },
            { icon: "🚀",   who: "Contexte Netflix",   impact: "Industrialise sur 4 000 microservices" },
          ].map((item, i) => (
            <div key={i} style={{ textAlign: "center", padding: "0.75rem" }}>
              <div style={{ fontSize: "1.75rem", marginBottom: "0.4rem" }}>{item.icon}</div>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.25rem" }}>{item.who}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{item.impact}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="two-col" style={{ marginBottom: "1.25rem" }}>
        <div className="card">
          <div className="card-title" style={{ color: "var(--danger)" }}>@SpringBootTest</div>
          <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "0.75rem" }}>
            Charge le contexte Spring <strong>complet</strong>. Necessaire pour les tests d'integration end-to-end, surdimensionne pour tester un seul Controller.
          </p>
          <pre style={{ background: "var(--code-bg)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1rem", fontSize: "0.78rem", lineHeight: 1.7, overflowX: "auto", margin: 0, textAlign: "left", fontFamily: "var(--font-mono)", color: "var(--text)" }}>{`@SpringBootTest
class TrackControllerTest {
  @Autowired MockMvc mockMvc;
  // Charge TOUT le contexte Spring
  // DataSource, JPA, Security...
  // ~5 000ms au demarrage
}`}</pre>
        </div>
        <div className="card">
          <div className="card-title" style={{ color: "var(--accent)" }}>@WebMvcTest — Test Slice</div>
          <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "0.75rem" }}>
            Charge <strong>uniquement</strong> la couche Web. Le Service est mocke. Resultat : demarrage 10x plus rapide, test plus cible.
          </p>
          <pre style={{ background: "var(--code-bg)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1rem", fontSize: "0.78rem", lineHeight: 1.7, overflowX: "auto", margin: 0, textAlign: "left", fontFamily: "var(--font-mono)", color: "var(--text)" }}>{`@WebMvcTest(TrackController.class)
class TrackControllerTest {
  @Autowired MockMvc mockMvc;
  @MockBean TrackService service;
  // Slice Web uniquement
  // ~400ms au demarrage
}`}</pre>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Benchmark — les deux en parallele</div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
          <button className="btn btn-primary" onClick={runBoth} disabled={running}>
            {running ? <span className="pulse">⏳</span> : "▶▶"} Lancer les deux
          </button>
          <button className="btn btn-secondary" onClick={reset} disabled={running}>↻ Reset</button>
        </div>

        <div className="two-col">
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
              <div style={{ fontSize: "0.72rem", fontFamily: "var(--font-mono)", color: "var(--danger)", fontWeight: 700 }}>@SpringBootTest</div>
              {springDone && results.spring && (
                <div style={{ fontSize: "0.72rem", fontFamily: "var(--font-mono)", color: "var(--danger)" }}>{(results.spring / 1000).toFixed(1)}s</div>
              )}
            </div>
            {running && !springDone && (
              <div style={{ marginBottom: "0.4rem" }}>
                <div className="progress-wrap">
                  <div className="progress-bar" style={{ width: `${springProg}%`, background: "var(--danger)" }} />
                </div>
              </div>
            )}
            <div ref={springRef} className="terminal" style={{ height: 160 }}>
              {springLogs.length === 0 && <span className="log-muted">// En attente...</span>}
              {springLogs.map(l => <div key={l.id} className={`log-${l.type}`}>{l.msg}</div>)}
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
              <div style={{ fontSize: "0.72rem", fontFamily: "var(--font-mono)", color: "var(--accent)", fontWeight: 700 }}>@WebMvcTest</div>
              {webmvcDone && results.webmvc && (
                <div style={{ fontSize: "0.72rem", fontFamily: "var(--font-mono)", color: "var(--accent)" }}>{results.webmvc}ms</div>
              )}
            </div>
            {running && !webmvcDone && (
              <div style={{ marginBottom: "0.4rem" }}>
                <div className="progress-wrap">
                  <div className="progress-bar" style={{ width: `${webmvcProg}%`, background: "var(--accent)" }} />
                </div>
              </div>
            )}
            <div ref={webmvcRef} className="terminal" style={{ height: 160 }}>
              {webmvcLogs.length === 0 && <span className="log-muted">// En attente...</span>}
              {webmvcLogs.map(l => <div key={l.id} className={`log-${l.type}`}>{l.msg}</div>)}
            </div>
          </div>
        </div>

        {webmvcDone && results.webmvc && (
          <div className="fade-in" style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "rgba(109,179,63,.08)", border: "1px solid rgba(109,179,63,.3)", borderRadius: "var(--radius)", fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>
            <span style={{ color: "var(--accent)" }}>✔ @WebMvcTest termine en {results.webmvc}ms</span>
            {!springDone && <span style={{ color: "var(--muted)" }}> — @SpringBootTest encore en cours...</span>}
            {springDone && gain && <span style={{ color: "var(--accent3)" }}> — gain : <strong>-{gain}%</strong></span>}
          </div>
        )}
      </div>

      {results.spring && results.webmvc && (
        <div className="fade-in">
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-value" style={{ color: "var(--danger)" }}>{(results.spring / 1000).toFixed(1)}s</div>
              <div className="stat-label">@SpringBootTest</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: "var(--accent)" }}>{results.webmvc}ms</div>
              <div className="stat-label">@WebMvcTest</div>
            </div>
            {gain && (
              <div className="stat-card">
                <div className="stat-value" style={{ color: "var(--accent3)" }}>-{gain}%</div>
                <div className="stat-label">Gain de temps</div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title">Comparaison (ms)</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: "var(--muted)", fontSize: 11, fontFamily: "JetBrains Mono" }} />
                <YAxis tick={{ fill: "var(--muted)", fontSize: 11, fontFamily: "JetBrains Mono" }} unit="ms" />
                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }} labelStyle={{ color: "var(--text)", fontFamily: "JetBrains Mono" }} formatter={(v) => [`${v}ms`, "Duree"]} />
                <Bar dataKey="ms" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="card" style={{ borderColor: "rgba(109,179,63,0.3)" }}>
        <div className="card-title">💡 Ce que ca change en mission</div>
        <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
          Sur un projet avec 50 tests Controller, passer de <code style={{ background: "rgba(239,68,68,0.12)", color: "var(--danger)", padding: "0.1rem 0.35rem", borderRadius: 3 }}>@SpringBootTest</code> a <code style={{ background: "rgba(109,179,63,0.12)", color: "var(--accent)", padding: "0.1rem 0.35rem", borderRadius: 3 }}>@WebMvcTest</code>{" "}
          economise <strong style={{ color: "var(--accent)" }}>2 a 5 minutes par build</strong>.
          Sur une CI qui tourne 20x par jour : 40 a 100 minutes economisees.
          Netflix l'a industrialise sur 4 000 microservices.
        </p>
      </div>
    </div>
  )
}