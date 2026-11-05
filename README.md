# Noyal Martin — Portfolio

A single-page portfolio built with React, Vite, TypeScript, Tailwind CSS, Matter.js and Canvas 2D.

## Run locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Editing content

All site copy and project data live in `src/content.ts`. Project descriptions, tech stacks, résumé links and footer copy can be changed there without touching components.

Entries marked with `// EDIT` are placeholders that still need confirmation:

- The public role/title.
- The FID Tool stack and project status.
- The Warehouse Management System status and stack.
- Project visit URLs, which currently point to the GitHub profile.

Project preview artwork is in `public/previews/*.svg`. The résumé served by the site is `public/Noyal_Martin_Resume_AI_Quality_Engineer.pdf`.

## How it works

- `src/App.tsx` handles the small History API router, intro state and page-level controls.
- `src/components/BallField.tsx` runs the Matter.js ball simulation and responds to the hero letter/hairline colliders.
- `src/components/Intro.tsx` measures the hero title and animates the ghost name, wipe and move into place.
- `src/components/Work.tsx` renders the project rows, sticky preview, hover cursor pill and preview artwork.
- `src/components/SignatureWall.tsx` replays seeded hand-drawn strokes on a canvas and lets visitors draw. Drawings persist in `localStorage` under `noyal-signature-wall-v1`; there is no server or real-time presence backend.
- `src/components/Footer.tsx` contains the "unseen" footer interpretation, including the non-interactive "TAP TO FEED IT" digits band.

## Motion

`prefers-reduced-motion: reduce` skips the intro, renders static balls, disables the custom cursor and PLAY control, and draws the signature wall immediately.

## Routes

- `/` — portfolio
- `/work/<slug>` — project case studies

## Deployment

`npm run build` writes the static site to `dist/`. Project pages are client-side routes, so configure the host to rewrite unknown paths (including `/work/*`) to `/index.html`.
