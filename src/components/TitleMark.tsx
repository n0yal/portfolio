import rawWordmark from "../assets/noyal-martin-title.svg?raw";

type LetterPath = {
  letter: string;
  d: string;
  transform: string | undefined;
};

// Keep the supplied SVG as the source of truth. Pull its letter paths out at
// build time so they can be rendered as live React elements: `currentColor`
// keeps the mark themeable, and the `data-letter` attributes give the ball
// field one collision surface per glyph.
const LETTER_PATHS: LetterPath[] = Array.from(
  rawWordmark.matchAll(/<path\b[^>]*>/g),
  (match) => {
    const tag = match[0];
    const letter = /\bdata-letter="([^"]+)"/.exec(tag)?.[1];
    const d = /\bd="([^"]+)"/.exec(tag)?.[1];
    const transform = /\btransform="([^"]+)"/.exec(tag)?.[1];
    return letter && d ? { letter, d, transform } : null;
  },
).filter((path): path is LetterPath => path !== null);

const VIEWBOX =
  /<svg[^>]*\bviewBox="([^"]+)"/.exec(rawWordmark)?.[1] ?? "0 0 409.4 288";

export function TitleMark({ className }: { className?: string }) {
  return (
    <svg
      className={className ? `title-mark ${className}` : "title-mark"}
      viewBox={VIEWBOX}
      preserveAspectRatio="xMinYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="currentColor" fillRule="evenodd">
        {LETTER_PATHS.map((path, index) => (
          <path
            key={`${path.letter}-${index}`}
            data-letter={path.letter}
            d={path.d}
            transform={path.transform}
          />
        ))}
      </g>
    </svg>
  );
}
