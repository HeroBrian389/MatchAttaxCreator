# Match Attax Creator

Interactive toolkit for designing custom Match Attax-inspired trading cards. The Next.js app inside `match-attax-generator/` renders a live preview, lets you customise stats, colours, and imagery, then exports a print-ready PNG. This root README is the canonical documentation for the project you’ll publish to GitHub.

## Directory layout

- `match-attax-generator/` – primary Next.js 15 App Router project (TypeScript + Tailwind).
- `MatchAttax-Card-Creator/` – legacy material retained for reference; nothing from this folder ships.
- `AGENTS.md` – automation playbook for AI or scripted contributors.

## Quick start

```bash
cd match-attax-generator
npm install
npm run dev
```

Visit `http://localhost:3000` for the builder UI. Hot reloading is enabled by default.

### Useful scripts

- `npm run dev` – start the Turbopack dev server.
- `npm run build` – create an optimised production build.
- `npm run start` – serve the production build locally.
- `npm run lint` – run ESLint with the repository ruleset.
- `npx tsc --noEmit` – TypeScript type-check (recommended before commits and releases).

## Key features

- High-fidelity canvas renderer mirroring classic Match Attax styling.
- Live editing for player name, position, six stats, attack/defence ratings, accent colours, and imagery.
- Upload support for player and club graphics (stored as in-browser data URLs; no server uploads).
- One-click download that produces a 1080×1350 PNG suitable for printing or sharing.
- Responsive layout tuned for desktop and tablet workflows.

## Project structure

```
match-attax-generator/
  src/
    app/
      page.tsx       # UI + canvas rendering logic
      layout.tsx     # Root layout and metadata
      globals.css    # Tailwind layers & base styles
  public/            # Favicon and static assets
  tailwind.config.ts # Tailwind configuration
```

## Customisation notes

- Update `DEFAULT_STATS` in `src/app/page.tsx` to adjust initial stat labels/values.
- Tweak card dimensions or styling constants (`CARD_WIDTH`, `CARD_HEIGHT`, etc.) near the top of `src/app/page.tsx`.
- Tailwind tokens live in `tailwind.config.ts`; fonts are configured via `next/font` in `src/app/layout.tsx`.
- For new styling needs, prefer Tailwind utilities before falling back to `globals.css`.

## Deployment

Run `npm run build` followed by `npm run start` to verify the production output locally. Deploy the repository to any Next.js-friendly host (Vercel, Netlify, Render, Azure, etc.). No environment variables are required today; document new ones if you introduce them.

## Roadmap ideas

- Persist card settings to localStorage.
- Offer templates for goalkeeper/defender/midfielder/forward variants.
- Provide shareable URLs or QR codes for generated cards.
- Enable batch exports or PDF contact sheets.

## Contributing

1. Branch from `main`.
2. Make changes inside `match-attax-generator`.
3. Run linting and type checks (`npm run lint && npx tsc --noEmit`).
4. Run `npm run build` to ensure production mode succeeds.
5. Open a PR with screenshots or GIFs for any UI change.

For automation guidelines, read [`AGENTS.md`](AGENTS.md).

## License

Choose a license before publishing publicly. MIT is the most common default (permissive, commercial-friendly). If you need a patent grant, consider Apache 2.0; if you want copyleft, consider GPL-3.0. Add the selected license text as `LICENSE` at the repo root and reference it here.
