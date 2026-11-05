import { useState } from "react";
import { content } from "../content";

export function Footer({ onTop }: { onTop: () => void }) {
  const { footer, links, nav, person } = content;
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(person.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const digits = Array.from({ length: 10 }, (_, index) => (
    <span key={index}>{footer.digitStream}</span>
  ));

  return (
    <footer className="footer" id="contact">
      <div className="footer__digits">
        <div className="footer__digits-track mono" aria-hidden="true">
          {digits}
        </div>
        <span className="footer__digits-label mono">
          <span className="footer__digits-dot" aria-hidden="true" />
          {footer.digitsLabel}
        </span>
      </div>

      <div className="footer__inner">
        <h2 className="footer__heading">{footer.heading}</h2>

        <div className="footer__contact">
          <div className="footer__say">
            <p className="footer__label mono">{footer.sayHi}</p>
            <div className="footer__email-row">
              <a
                href={`mailto:${person.email}`}
                className="footer__email"
                data-cursor="link"
              >
                {person.email}
              </a>
              <button
                type="button"
                className="footer__copy mono"
                onClick={copyEmail}
                data-cursor="link"
                aria-live="polite"
              >
                {copied ? footer.copied : footer.copy}
              </button>
            </div>
          </div>

          <div className="footer__call">
            <a
              href={links.bookCall}
              className="footer__book"
              data-cursor="link"
            >
              {footer.bookCall}
            </a>
            <p className="footer__note">{footer.note}</p>
          </div>
        </div>

        <div className="footer__bottom">
          <p className="footer__copyright mono">{footer.copyright}</p>

          <nav className="footer__links mono" aria-label={content.a11y.footerLinks}>
            <a
              href={links.github}
              target="_blank"
              rel="noreferrer"
              data-cursor="link"
            >
              {nav.github} {nav.arrow}
            </a>
            <a
              href={links.linkedin}
              target="_blank"
              rel="noreferrer"
              data-cursor="link"
            >
              {nav.linkedin} {nav.arrow}
            </a>
            <a
              href={links.resume}
              target="_blank"
              rel="noreferrer"
              data-cursor="link"
            >
              {nav.resume} {nav.arrow}
            </a>
            <button
              type="button"
              onClick={onTop}
              className="footer__top mono"
              data-cursor="link"
            >
              {nav.top}
            </button>
          </nav>
        </div>

        <p className="footer__made mono">{footer.madeWith}</p>
      </div>
    </footer>
  );
}
