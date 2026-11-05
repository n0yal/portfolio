import { content } from "../content";
import type { Project } from "../content";
import { PreviewArt } from "./PreviewArt";
import { TopBar } from "./TopBar";

type Props = {
  project: Project;
  onBack: () => void;
  onOpenProject: (project: Project) => void;
};

export function ProjectDetail({ project, onBack, onOpenProject }: Props) {
  const { projects, caseStudy, links, person } = content;
  const projectIndex = projects.findIndex((item) => item.slug === project.slug);
  const nextProject = projects[(projectIndex + 1) % projects.length] ?? project;

  return (
    <div className="case-study">
      <TopBar onNavigateHome={onBack} compact />

      <main className="case-study__main">
        <button
          type="button"
          className="case-study__back mono"
          onClick={onBack}
          data-cursor="link"
        >
          {caseStudy.back}
        </button>

        <div className="case-study__hero">
          <div className="case-study__intro">
            <p className="case-study__index mono">
              {project.index} / {String(projects.length).padStart(2, "0")}
            </p>
            <h1 className="case-study__title">{project.title}</h1>
            <p className="case-study__role mono">
              {project.role} · {project.year}
            </p>
            <p className="case-study__description">{project.longDescription}</p>

            <div className="case-study__actions">
              <a
                href={project.visitUrl}
                target="_blank"
                rel="noreferrer"
                className="case-study__visit mono"
                data-cursor="link"
              >
                {caseStudy.visit} {content.nav.arrow}
              </a>
              <a
                href={links.resume}
                target="_blank"
                rel="noreferrer"
                className="case-study__resume mono"
                data-cursor="link"
              >
                {content.nav.resume} {content.nav.arrow}
              </a>
            </div>
          </div>

          <div className="case-study__art">
            <PreviewArt active={project} projects={projects} />
          </div>
        </div>

        <div className="case-study__grid">
          <section className="case-study__notes">
            <p className="case-study__label mono">{caseStudy.notes}</p>
            <ul>
              {project.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          </section>

          <aside className="case-study__facts">
            <div>
              <p className="case-study__label mono">{caseStudy.year}</p>
              <p className="case-study__fact">{project.year}</p>
            </div>
            <div>
              <p className="case-study__label mono">{caseStudy.stack}</p>
              <div className="chip-list">
                {project.tech.map((tech) => (
                  <span className="chip mono" key={tech}>
                    {tech}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="case-study__label mono">{caseStudy.overview}</p>
              <p className="case-study__fact">{project.role}</p>
            </div>
          </aside>
        </div>

        <button
          type="button"
          className="case-study__next"
          onClick={() => onOpenProject(nextProject)}
          data-cursor="project"
          data-index={nextProject.index}
          data-color={nextProject.color}
        >
          <span className="case-study__next-label mono">{caseStudy.next}</span>
          <span className="case-study__next-title">{nextProject.title}</span>
          <span className="case-study__next-arrow mono">
            {content.nav.arrow}
          </span>
        </button>

        <footer className="case-study__footer mono">
          <span>{content.footer.copyright}</span>
          <span>{person.email}</span>
        </footer>
      </main>
    </div>
  );
}
