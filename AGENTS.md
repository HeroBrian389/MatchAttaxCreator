# Agents Guide

Guidelines for autonomous or AI-assisted contributors working on the Match Attax Creator repository.

## Environment setup

- Node.js: use v22.17.0 (installed via nvm at `~/.nvm/versions/node/v22.17.0/bin`). Prepend `PATH=$HOME/.nvm/versions/node/v22.17.0/bin:$PATH` when running commands in stripped environments.
- Package manager: npm (lockfile committed).
- Framework: Next.js 15 (App Router) with React 19 and Tailwind CSS.

Install dependencies before making changes:

```bash
cd match-attax-generator
npm install
```

## Definition of done

Before marking a task complete:

1. Run `npm run lint` and resolve all warnings/errors.
2. Run `npx tsc --noEmit` and ensure zero type errors.
3. Run `npm run build` to confirm the Next.js production build succeeds.
4. Smoke test the UI locally (`npm run dev`) and verify card export still works.
5. Update documentation or comments for any new behaviour.

## Coding conventions

- Prefer explicit TypeScript types/interfaces over `any`.
- Keep rendering logic in `src/app/page.tsx`; extract helpers when complexity grows.
- Tailwind utilities are the default styling mechanism; add custom CSS to `globals.css` only when utilities fall short.
- Clamp numeric inputs between `0` and `110` to preserve card authenticity.

## Secrets and security

- No environment variables are required today. If a feature adds them, document the variable in `README.md`, add a `.env.example`, and keep `.env*` out of version control (already covered by `.gitignore`).
- Before committing, scan for credentials with `rg -n "(API_KEY|SECRET|TOKEN|PASSWORD|sk-[A-Za-z0-9]{20,})" .`.
- Ensure third-party dependencies carry licenses compatible with the repo’s chosen license.

## Documentation expectations

- `README.md` (repo root) is the canonical source of truth—update it for workflow or feature changes.
- `match-attax-generator/README.md` should remain a short pointer back to the root docs.
- Include GIFs or screenshots in PRs when UI changes are user-facing (place assets under `public/` as needed).

## Release hygiene

- Tag releases with semantic versions (e.g., `v0.1.0`) when publishing builds.
- Publish a short changelog (GitHub release notes are fine) summarising new features and breaking changes.
- Manually verify the downloadable PNG output after each release.

## Licensing guidance

If uncertain which license to apply, consider:

- **MIT License** – permissive default; minimal obligations and allows commercial use.
- **Apache 2.0** – like MIT but with an explicit patent grant.
- **GPL-3.0** – strong copyleft; use only if you require derivatives to stay open-source.

Pick one, add a `LICENSE` file at the repo root, and reference it in both this guide and the README.

## Ownership

The actively maintained app lives in `match-attax-generator`. Treat `MatchAttax-Card-Creator` as legacy material unless instructed otherwise. When in doubt, confirm scope with the project maintainer before editing legacy folders.
