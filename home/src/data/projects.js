export const projects = [
  {
    id: "virtual-threads-lab",
    title: "Virtual Threads Lab",
    accent: "#1D9E75",
    url: "https://lortole-vt-lab.vercel.app",
    stack: "Spring Boot 3.4 + Angular 18",
    status: "Live",
    description: "Exploration des Virtual Threads Java 21 avec Spring Boot 3.4. Comparaison de performances entre platform threads et virtual threads sous charge.",
    highlights: [
      "Benchmarks Virtual Threads vs Platform Threads",
      "API REST Spring Boot avec endpoints concurrents",
      "Dashboard Angular 18 avec metriques en temps reel"
    ]
  },
  {
    id: "netflix-java-2026",
    title: "Netflix Java 2026",
    accent: "#E50914",
    url: "https://lortole-java-netflix-lab.vercel.app",
    stack: "Spring Boot + Angular 18",
    status: "Live",
    description: "Clone pedagogique Netflix avec backend Java Spring Boot et frontend Angular 18. Architecture orientee catalogue de contenus.",
    highlights: [
      "Catalogue films avec recherche et filtrage",
      "Frontend Angular 18 responsive",
      "Deploiement Railway (backend) + Vercel (frontend)"
    ]
  },
  {
    id: "transaction-lab",
    title: "Transaction Lab",
    accent: "#378ADD",
    url: "https://lortole-transaction-lab.vercel.app",
    stack: "Spring Boot 3 + Angular 18",
    status: "Live",
    description: "Demonstration des mecanismes de transactions Spring : propagation, isolation, rollback et gestion des erreurs en conditions reelles.",
    highlights: [
      "Scenarios REQUIRED, REQUIRES_NEW, NESTED",
      "Niveaux d'isolation et cas de deadlock",
      "Visualisation du comportement transactionnel"
    ]
  },
  {
    id: "incidents-lab",
    title: "Incidents Lab",
    accent: "#BA7517",
    url: "https://lortole-incidents-lab.vercel.app",
    stack: "Angular 18",
    status: "Live",
    description: "Post-mortems sur 6 incidents de developpement rencontres en prod et en CI. Causes racines, solutions appliquees et lecons retenues.",
    highlights: [
      "6 incidents documentes avec analyse detaillee",
      "Badges de severite LOW / MEDIUM / HIGH / CRITICAL",
      "Format post-mortem structure et actionnable"
    ]
  }
]
