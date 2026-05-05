import { useState } from "react"
import { useTheme } from "./useTheme"
import TestSlicesTab from "./tabs/TestSlicesTab"
import VirtualThreadsTab from "./tabs/VirtualThreadsTab"
import ZgcTab from "./tabs/ZgcTab"
import "./App.css"

const TABS = [
  { id: "testslices",     label: "Test Slices",     icon: "⚡" },
  { id: "virtualthreads", label: "Virtual Threads",  icon: "🧵" },
  { id: "zgc",            label: "ZGC",              icon: "🗑️" },
]

export default function App() {
  const [activeTab, setActiveTab] = useState("testslices")
  const { theme, auto, toggle, resetAuto } = useTheme()

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <span className="header-logo">☕</span>
            <div>
              <h1>Netflix Java Lab</h1>
              <p>How Netflix Uses Java — 2026 Edition · TP Interactif</p>
            </div>
          </div>
          <div className="header-actions">
            <div className="theme-switcher">
              <button className="theme-btn" onClick={toggle} title="Changer le thème">
                {theme === "dark" ? "☀️" : "🌙"}
              </button>
              <button
                className={`auto-btn ${auto ? "active" : ""}`}
                onClick={auto ? undefined : resetAuto}
                title={auto ? "Auto actif — dark 20h→8h, light 8h→20h" : "Revenir en auto"}
              >
                {auto ? "⏱ auto" : "⏱ manuel"}
              </button>
            </div>
            <a
              href="https://www.youtube.com/watch?v=ucJTPda_zx0"
              target="_blank"
              rel="noreferrer"
              className="header-link"
            >
              ▶ Voir la conférence
            </a>
          </div>
        </div>
        <nav className="tab-nav">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="app-main">
        {activeTab === "testslices" && <TestSlicesTab />}
        {activeTab === "virtualthreads" && <VirtualThreadsTab />}
        {activeTab === "zgc" && <ZgcTab />}
      </main>

      <footer className="app-footer">
        <span>TP par <strong>Loïc ORTOLÉ</strong></span>
        <span>·</span>
        <a href="https://github.com/HighX97/java-tech-lab" target="_blank" rel="noreferrer">GitHub</a>
        <span>·</span>
        <a href="https://www.linkedin.com/in/lortole/" target="_blank" rel="noreferrer">LinkedIn</a>
      </footer>
    </div>
  )
}
