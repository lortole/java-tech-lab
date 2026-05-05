import { useState, useEffect, useRef } from "react"
import Prism from "prismjs"
import "prismjs/components/prism-java"

function CodeBlock({ code, label }) {
  const ref = useRef(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => { if (ref.current) Prism.highlightElement(ref.current) }, [code])

  const copy = () => {
    navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800) })
  }

  return (
    <div style={{ marginBottom: "0.75rem" }}>
      {label && <div style={{ fontSize: "0.68rem", fontFamily: "var(--font-mono)", color: "var(--muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>}
      <div style={{ position: "relative" }}>
        <pre style={{ background: "var(--code-bg)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1rem 3rem 1rem 1.25rem", fontSize: "0.78rem", lineHeight: 1.7, overflowX: "auto", margin: 0, textAlign: "left" }}>
          <code ref={ref} className="language-java" style={{ fontFamily: "var(--font-mono)", background: "none" }}>{code}</code>
        </pre>
        <button onClick={copy} style={{ position: "absolute", top: "0.6rem", right: "0.6rem", background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: "4px", padding: "0.25rem 0.5rem", fontSize: "0.68rem", fontFamily: "var(--font-mono)", color: copied ? "var(--accent)" : "var(--muted)", cursor: "pointer", transition: "all 180ms ease" }}>
          {copied ? "✓ copié" : "copy"}
        </button>
      </div>
    </div>
  )
}

function AnalogyStep({ icon, title, desc, color, active }) {
  return (
    <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "0.75rem 1rem", background: active ? `${color}11` : "transparent", border: `1px solid ${active ? color : "var(--border)"}`, borderRadius: "var(--radius)", transition: "all 300ms ease", opacity: active ? 1 : 0.45 }}>
      <span style={{ fontSize: "1.5rem", lineHeight: 1, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: "0.85rem", color, marginBottom: "0.2rem" }}>{title}</div>
        <div style={{ fontSize: "0.8rem", color: "var(--muted)", textAlign: "left" }}>{desc}</div>
      </div>
    </div>
  )
}

function ThreadDiagram({ mode, step }) {
  const badge = (label, value, color) => (
    <div style={{ background: `${color}22`, border: `1px solid ${color}`, borderRadius: "var(--radius)", padding: "0.4rem 0.75rem", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color, textAlign: "center", minWidth: 110 }}>
      {label}<br /><strong>{value}</strong>
    </div>
  )
  const arrow = (label, ok) => (
    <div style={{ textAlign: "center", padding: "0.3rem 0" }}>
      <div style={{ fontSize: "0.68rem", fontFamily: "var(--font-mono)", color: ok ? "var(--accent)" : "var(--danger)", marginBottom: "0.15rem" }}>{label}</div>
      <div style={{ color: ok ? "var(--accent)" : "var(--danger)", fontSize: "1.1rem" }}>↓</div>
    </div>
  )
  const isBug = mode === "bug"
  return (
    <div style={{ background: "var(--code-bg)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.25rem", minHeight: 280 }}>
      <div style={{ opacity: step >= 1 ? 1 : 0.2, transition: "opacity 400ms" }}>
        {badge("Thread principal", 'USER = "loic"', "var(--accent2)")}
      </div>
      {step >= 2 && arrow("fork() →", true)}
      {!isBug && step >= 2 && (
        <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--accent)", textAlign: "center", marginBottom: "0.25rem" }}>📸 ContextSnapshot.captureAll()</div>
      )}
      {step >= 2 && (
        <div style={{ opacity: 1, transition: "opacity 400ms", marginLeft: "2rem" }}>
          {badge("Virtual Thread enfant",
            isBug ? (step >= 3 ? 'USER = null ❌' : 'USER = ?') : (step >= 3 ? 'USER = "loic" ✓' : 'USER = ?'),
            isBug ? "var(--danger)" : "var(--accent)"
          )}
        </div>
      )}
      {step >= 3 && arrow(isBug ? "ThreadLocal perdu" : "contexte restauré", !isBug)}
      {step >= 3 && (
        <div style={{ background: isBug ? "rgba(239,68,68,.12)" : "rgba(109,179,63,.12)", border: `1px solid ${isBug ? "var(--danger)" : "var(--accent)"}`, borderRadius: "var(--radius)", padding: "0.6rem 1rem", fontSize: "0.82rem", fontFamily: "var(--font-mono)", color: isBug ? "var(--danger)" : "var(--accent)", textAlign: "center" }}>
          {isBug ? "💥 Spring Security : auth null → deadlock" : "✅ Authentication propagée — aucun deadlock"}
        </div>
      )}
    </div>
  )
}

const ANALOGY_BUG = [
  { icon: "🏢", title: "Le livreur part avec un colis",       desc: 'Le thread principal sait qui il est : il a son badge "loic" dans sa poche.',                                color: "var(--accent2)" },
  { icon: "👷", title: "Il mandate un sous-traitant",         desc: "Il envoie un collègue (virtual thread) faire la livraison. Mais il oublie de lui donner une copie du badge.", color: "var(--accent3)" },
  { icon: "🚪", title: "Le sous-traitant arrive à la porte", desc: "Le gardien (Spring Security) demande le badge. Le collègue cherche… sa poche est vide.",                     color: "var(--danger)"  },
  { icon: "💥", title: "Accès refusé — tout se bloque",       desc: "Sans badge, le collègue est bloqué indéfiniment. Le livreur attend sa réponse. Deadlock.",                    color: "var(--danger)"  },
]

const ANALOGY_FIX = [
  { icon: "🏢", title: "Le livreur part avec un colis",       desc: 'Le thread principal sait qui il est : badge "loic" dans sa poche.',                              color: "var(--accent2)" },
  { icon: "📸", title: "Il photocopie son badge d'abord",    desc: "Avant de mandater le collègue, il fait une copie (ContextSnapshot.captureAll).",                  color: "var(--accent3)" },
  { icon: "👷", title: "Il donne la copie au sous-traitant", desc: "Le collègue reçoit la copie du badge avant de partir. Il sait qui il représente.",                 color: "var(--accent)"  },
  { icon: "✅", title: "Livraison réussie",                    desc: "Le gardien demande le badge. Le collègue présente la copie. Accès accordé. Pas de blocage.",       color: "var(--accent)"  },
]

const CODE_BUG = `// ❌ Sans fix — ThreadLocal perdu (Netflix JDK 21)

ThreadLocal<String> USER = new ThreadLocal<>();

// Thread principal : on pose l'identité
USER.set("loic");

try (var scope = new StructuredTaskScope<String>()) {
    scope.fork(() -> {
        // Virtual thread enfant
        String user = USER.get(); // null ❌ badge perdu !

        // Spring Security lève une exception ici
        // → deadlock intermittent en production
        return user;
    });
    scope.join();
}`

const CODE_FIX = `// ✅ Avec fix — micrometer-context-propagation (JDK 25)

// 1. Enregistrer le ThreadLocal dans Micrometer
//    (fait auto pour MDC, SecurityContext, etc.)
ContextRegistry.getInstance()
    .registerThreadLocalAccessor("user",
        USER::get, USER::set, USER::remove);

USER.set("loic");

// 2. Capturer le contexte AVANT le fork
ContextSnapshot snapshot = ContextSnapshot.captureAll();

try (var scope = new StructuredTaskScope<String>()) {
    scope.fork(snapshot.wrap(() -> {
        // Badge copié → disponible ici ✓
        String user = USER.get(); // "loic" ✓
        return user;
    }));
    scope.join();
}`

const DELAY = (ms) => new Promise(r => setTimeout(r, ms))

export default function VirtualThreadsTab() {
  const [mode, setMode]       = useState(null)
  const [step, setStep]       = useState(0)
  const [running, setRunning] = useState(false)
  const [view, setView]       = useState("analogy")

  const run = async (m) => {
    setMode(m); setStep(0); setRunning(true)
    for (let i = 1; i <= 3; i++) { await DELAY(900); setStep(i) }
    setRunning(false)
  }

  const reset   = () => { setMode(null); setStep(0) }
  const analogy = mode === "fix" ? ANALOGY_FIX : ANALOGY_BUG

  return (
    <div className="fade-in">
      <div className="tab-header">
        <h2>🧵 <span className="highlight2">Virtual Threads</span></h2>
        <p>Comprends pourquoi Netflix a annulé son déploiement — et comment corriger le bug de propagation de contexte.</p>
      </div>

      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <div className="card-title">🧠 Le problème en une image</div>
        <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginBottom: "1rem" }}>
          Les <strong>Virtual Threads</strong> permettent de gérer des milliers de tâches en parallèle sans bloquer.
          Le problème : quand un thread délègue à un sous-traitant (virtual thread), il oublie de lui passer
          son <strong>badge d'identité</strong> (ThreadLocal). Spring Security ne reconnaît plus personne — deadlock.
        </p>
        <div className="two-col">
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "0.75rem 1rem", background: "rgba(239,68,68,.11)", border: "1px solid var(--danger)", borderRadius: "var(--radius)" }}>
            <span style={{ fontSize: "1.5rem" }}>🏷️</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--danger)", marginBottom: "0.2rem" }}>JDK 21 — Badge perdu</div>
              <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Le virtual thread enfant ne reçoit pas le ThreadLocal du parent. Spring Security perd l'authentification → deadlock.</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "0.75rem 1rem", background: "rgba(109,179,63,.11)", border: "1px solid var(--accent)", borderRadius: "var(--radius)" }}>
            <span style={{ fontSize: "1.5rem" }}>📸</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--accent)", marginBottom: "0.2rem" }}>JDK 25 — Badge photocopié</div>
              <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>ContextSnapshot capture le contexte avant le fork et le restore dans le virtual thread enfant. Problème résolu.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1.25rem", borderColor: "rgba(70,149,235,0.3)" }}>
        <div className="card-title">🎯 À qui ça parle ?</div>
        <div className="three-col">
          {[
            { icon: "🧑‍💻", who: "Dev Java 21+",      impact: "Ne pas activer spring.threads.virtual.enabled=true à l'aveugle avec Spring Security" },
            { icon: "👷",   who: "Tech Lead / Archi", impact: "Tester micrometer-context-propagation avant mise en prod" },
            { icon: "🚀",   who: "Contexte Netflix",  impact: "Annulation du déploiement JDK 21, résolu en JDK 25" },
          ].map((item, i) => (
            <div key={i} style={{ textAlign: "center", padding: "0.75rem" }}>
              <div style={{ fontSize: "1.75rem", marginBottom: "0.4rem" }}>{item.icon}</div>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.25rem" }}>{item.who}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{item.impact}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <div className="card-title">Timeline Netflix</div>
        <div style={{ display: "flex" }}>
          {[
            { label: "JDK 21", desc: "Virtual Threads activés",    color: "var(--accent3)", icon: "🚀" },
            { label: "Prod",   desc: "Deadlocks détectés",         color: "var(--danger)",  icon: "💥" },
            { label: "Cause",  desc: "ThreadLocal + synchronized", color: "var(--accent2)", icon: "🔍" },
            { label: "JDK 25", desc: "Pinning résolu + fix ctx",   color: "var(--accent)",  icon: "✅" },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", padding: "0 0.5rem" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${s.color}22`, border: `2px solid ${s.color}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.5rem", fontSize: "1.1rem" }}>{s.icon}</div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, fontFamily: "var(--font-mono)", color: s.color }}>{s.label}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: "0.2rem" }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-title">Simulation interactive</div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
          <button className="btn btn-danger"    onClick={() => run("bug")} disabled={running}>{running && mode === "bug" ? <span className="pulse">⏳</span> : "▶"} Sans fix (JDK 21)</button>
          <button className="btn btn-primary"   onClick={() => run("fix")} disabled={running}>{running && mode === "fix" ? <span className="pulse">⏳</span> : "▶"} Avec fix (JDK 25)</button>
          <button className="btn btn-secondary" onClick={reset} disabled={running}>↺ Reset</button>
          <div style={{ marginLeft: "auto", display: "flex", gap: "0.35rem" }}>
            {["analogy", "technical"].map(v => (
              <button key={v} onClick={() => setView(v)} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.85rem", borderRadius: "var(--radius)", fontFamily: "var(--font-mono)", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", border: `1px solid ${view === v ? "var(--accent2)" : "var(--border)"}`, background: view === v ? "rgba(70,149,235,.12)" : "transparent", color: view === v ? "var(--accent2)" : "var(--muted)", transition: "all 180ms ease" }}>
                {v === "analogy" ? "🚚 Analogie" : "🔬 Technique"}
              </button>
            ))}
          </div>
        </div>

        {view === "analogy" && (
          <div className="two-col">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {analogy.map((s, i) => <AnalogyStep key={i} {...s} active={!mode ? false : step >= i + 1} />)}
            </div>
            <ThreadDiagram mode={mode || "bug"} step={mode ? step : 0} />
          </div>
        )}

        {view === "technical" && (
          <div className="two-col">
            <CodeBlock code={CODE_BUG} label="❌ Sans fix — JDK 21" />
            <CodeBlock code={CODE_FIX} label="✅ Avec fix — JDK 25" />
          </div>
        )}
      </div>

      {mode && step === 3 && (
        <div className="card fade-in" style={{ borderColor: mode === "fix" ? "rgba(109,179,63,0.4)" : "rgba(239,68,68,0.4)" }}>
          {mode === "bug" ? (
            <>
              <div className="card-title" style={{ color: "var(--danger)" }}>💥 Bug reproduit</div>
              <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                Le badge (ThreadLocal) n'a pas été copié pour le sous-traitant (virtual thread).
                Spring Security ne trouve plus l'authentification → <strong style={{ color: "var(--danger)" }}>deadlock intermittent</strong>.
                C'est exactement ce que Netflix a vécu en prod sur JDK 21.
              </p>
            </>
          ) : (
            <>
              <div className="card-title" style={{ color: "var(--accent)" }}>✅ Fix opérationnel</div>
              <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                <code>ContextSnapshot.captureAll()</code> capture le contexte avant le fork,
                <code>snapshot.wrap(task)</code> le restore dans le virtual thread enfant.
                <strong style={{ color: "var(--accent)" }}> Aucun deadlock.</strong>{" "}
                En prod, <code>micrometer-context-propagation</code> fait ça automatiquement pour MDC, SecurityContext, TraceContext.
              </p>
            </>
          )}
        </div>
      )}

      <div className="card" style={{ borderColor: "rgba(70,149,235,0.3)" }}>
        <div className="card-title">💡 Ce que ça change en mission</div>
        <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
          Java 21+ avec Spring Security : <strong style={{ color: "var(--accent3)" }}>ne pas activer</strong>{" "}
          <code>spring.threads.virtual.enabled=true</code> à l'aveugle.
          Tester sans Spring Security d'abord, puis ajouter <code>micrometer-context-propagation</code>.
          JDK 25 règle le pinning — la propagation de contexte reste à configurer explicitement.
        </p>
      </div>
    </div>
  )
}
