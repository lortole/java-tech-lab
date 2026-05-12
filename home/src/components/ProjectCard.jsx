export function ProjectCard({ project }) {
  return (
    <article className="project-card" style={{ '--accent': project.accent }}>
      <div className="card-meta">
        <span className="card-stack">{project.stack}</span>
        <span className="card-status">{'●'} {project.status}</span>
      </div>
      <h2 className="card-title">{project.title}</h2>
      <p className="card-description">{project.description}</p>
      <ul className="card-highlights">
        {project.highlights.map((highlight, index) => (
          <li key={index}>{highlight}</li>
        ))}
      </ul>
      <a
        href={project.url}
        target="_blank"
        rel="noopener noreferrer"
        className="card-link"
      >
        Ouvrir le lab &rarr;
      </a>
    </article>
  )
}
