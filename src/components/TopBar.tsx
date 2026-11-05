import { content } from "../content";

type Props = {
  onNavigateHome?: () => void;
  compact?: boolean;
};

export function TopBar({ onNavigateHome, compact = false }: Props) {
  const { nav, links, person } = content;

  return (
    <header className={`topbar ${compact ? "topbar--compact" : ""}`}>
      <div className="topbar__left">
        {onNavigateHome ? (
          <button
            type="button"
            className="topbar__role mono link-hover"
            onClick={onNavigateHome}
            data-cursor="link"
          >
            {person.role.toUpperCase()}
          </button>
        ) : (
          <span className="topbar__role mono">{person.role.toUpperCase()}</span>
        )}
      </div>

      <div className="topbar__center mono">{person.year}</div>

      <nav className="topbar__links mono" aria-label={content.a11y.socialLinks}>
        <a
          href={links.github}
          target="_blank"
          rel="noreferrer"
          data-cursor="link"
          className="link-hover"
        >
          {nav.github} <span className="topbar__arrow">{nav.arrow}</span>
        </a>
        <a
          href={links.linkedin}
          target="_blank"
          rel="noreferrer"
          data-cursor="link"
          className="link-hover"
        >
          {nav.linkedin} <span className="topbar__arrow">{nav.arrow}</span>
        </a>
        <a
          href={links.resume}
          target="_blank"
          rel="noreferrer"
          data-cursor="link"
          className="link-hover"
        >
          {nav.resume} <span className="topbar__arrow">{nav.arrow}</span>
        </a>
      </nav>
    </header>
  );
}
