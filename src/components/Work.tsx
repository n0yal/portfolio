import { useState } from "react";
import type { CSSProperties } from "react";
import { content } from "../content";
import type { Project } from "../content";
import { PreviewArt } from "./PreviewArt";

type Props = {
  onOpenProject: (project: Project) => void;
};

export function Work({ onOpenProject }: Props) {
  const { work, projects } = content;
  const [activeIndex, setActiveIndex] = useState(0);
  const activeProject = projects[activeIndex] ?? projects[0];

  return (
    <section className="work" id="work" aria-labelledby="work-heading">
      <div className="work__header">
        <p className="work__kicker mono">{work.kicker}</p>
        <h2 className="work__heading" id="work-heading">
          {work.heading}
        </h2>
      </div>

      <div
        className="hairline work__hairline"
        data-ball-platform
        aria-hidden="true"
      />

      <div className="work__grid">
        <div className="work__list">
          {projects.map((project, index) => {
            const active = index === activeIndex;
            return (
              <a
                href={`/work/${project.slug}`}
                className={`project-row ${active ? "is-active" : ""}`}
                key={project.slug}
                data-cursor="project"
                data-index={project.index}
                data-color={project.color}
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                onClick={(event) => {
                  event.preventDefault();
                  onOpenProject(project);
                }}
                style={
                  { "--row-hover": `var(--${project.color})` } as CSSProperties
                }
              >
                <span className="project-row__index mono">{project.index}</span>
                <span className="project-row__body">
                  <span
                    className={`project-row__title ${
                      project.title.length > 18
                        ? "project-row__title--long"
                        : ""
                    }`}
                  >
                    {project.title}
                  </span>
                  <span className="project-row__foot">
                    <span className="project-row__meta mono">
                      {project.meta.join(" · ")}
                    </span>
                    <span className="project-row__year mono">
                      {project.year}
                    </span>
                  </span>
                </span>
              </a>
            );
          })}
        </div>

        <aside className="work__aside" aria-live="polite">
          <PreviewArt active={activeProject} projects={projects} />

          <div className="work__details" key={activeProject.slug}>
            <p className="work__preview-kicker mono">
              {activeProject.role} · {activeProject.title} · {activeProject.year}
            </p>
            <p className="work__description">{activeProject.description}</p>

            <div className="chip-list">
              {activeProject.tech.map((tech) => (
                <span className="chip mono" key={tech}>
                  {tech}
                </span>
              ))}
            </div>

            <div className="work__links">
              <a
                href={`/work/${activeProject.slug}`}
                className="work__explore mono"
                data-cursor="link"
                onClick={(event) => {
                  event.preventDefault();
                  onOpenProject(activeProject);
                }}
              >
                {activeProject.exploreLabel}
              </a>
              <a
                href={activeProject.visitUrl}
                target="_blank"
                rel="noreferrer"
                className="work__visit mono"
                data-cursor="link"
              >
                {activeProject.visitLabel}
              </a>
            </div>
          </div>
        </aside>
      </div>

      <div className="work__more">
        <div className="work__more-top">
          <p className="work__more-label mono">{work.moreLabel}</p>
          <p className="work__more-heading">{work.moreHeading}</p>
          <a
            href={content.links.resume}
            target="_blank"
            rel="noreferrer"
            className="work__more-link mono"
            data-cursor="link"
          >
            {work.moreLink}
          </a>
        </div>

        <div className="work__more-grid">
          {work.moreItems.map((item) => (
            <div className="more-item" key={`${item.role}-${item.place}`}>
              <span className="more-item__period mono">{item.period}</span>
              <div>
                <p className="more-item__role">{item.role}</p>
                <p className="more-item__place mono">{item.place}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
