# 🖥️ netflix-java-2026 — Frontend

> Interface de démonstration interactive pour les trois modules Java 21+ du lab.

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=flat&logo=vercel&logoColor=white)](https://lortole-dev-lab.vercel.app/)

🌐 **Live :** [lortole-dev-lab.vercel.app](https://lortole-dev-lab.vercel.app/)

---

## 🎯 Rôle du frontend

Ce frontend n'est pas une application métier — c'est une **vitrine interactive** qui documente et illustre chacun des trois modules du lab :

| Tab | Module backend | Ce qu'on visualise |
|-----|---------------|-------------------|
| Test Slices | `testslices/` | Architecture du test slice, flux de requête mocké |
| Virtual Threads | `virtualthreads/` | Timeline d'exécution, context propagation |
| ZGC | `zgc/` | Comportement GC sous charge, comparaison pauses |

---

## 🛠️ Stack

- **React 18** — UI composants
- **Vite 5** — bundler ultra-rapide
- **CSS custom** — thème sombre, responsive

---

## ▶️ Lancer en local

```bash
npm install
npm run dev
# → http://localhost:5173
```

### Build production

```bash
npm run build
npm run preview
```

---

## 🚀 Déploiement

Le frontend est déployé automatiquement sur **Vercel** à chaque push sur `main`.

```
Branch: main → lortole-dev-lab.vercel.app
```

---

## 📁 Structure

```
frontend/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/          # Images statiques
│   ├── tabs/
│   │   ├── TestSlicesTab.jsx       # Onglet Test Slices
│   │   ├── VirtualThreadsTab.jsx   # Onglet Virtual Threads
│   │   └── ZgcTab.jsx              # Onglet ZGC
│   ├── App.jsx          # Composant racine + routing tabs
│   ├── App.css          # Styles globaux
│   ├── useTheme.js      # Hook thème clair/sombre
│   └── main.jsx         # Point d'entrée
├── index.html
├── vite.config.js
└── package.json
```

---

*Partie du projet [`netflix-java-2026`](../README.md)*