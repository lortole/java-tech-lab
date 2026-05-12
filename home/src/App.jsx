import { Header } from './components/Header'
import { ProjectCard } from './components/ProjectCard'
import { Footer } from './components/Footer'
import { projects } from './data/projects'

export default function App() {
  return (
    <div className="site-wrapper">
      <Header />
      <main className="site-main">
        <p className="section-label">{'// labs disponibles'}</p>
        <div className="projects-grid">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
