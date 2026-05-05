import { useState, useEffect } from "react"

const getAutoTheme = () => {
  const hour = new Date().getHours()
  return hour >= 8 && hour < 20 ? "light" : "dark"
}

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || getAutoTheme()
  })
  const [auto, setAuto] = useState(() => !localStorage.getItem("theme"))

  // Auto rotate : vérifie toutes les minutes si l'heure a changé
  useEffect(() => {
    if (!auto) return
    const interval = setInterval(() => {
      setTheme(getAutoTheme())
    }, 60_000)
    return () => clearInterval(interval)
  }, [auto])

  // Applique le theme sur <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
  }, [theme])

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark"
    setTheme(next)
    setAuto(false)
    localStorage.setItem("theme", next)
  }

  const resetAuto = () => {
    localStorage.removeItem("theme")
    setAuto(true)
    setTheme(getAutoTheme())
  }

  return { theme, auto, toggle, resetAuto }
}
