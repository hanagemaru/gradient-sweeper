# Gradient Sweeper project instructions

## Project overview

- Next.js 15 / React 19 / TypeScript puzzle game.
- The board is a fixed 9 x 9 grid with 36 px cells.
- The current visual theme is `Gradient Glacier`: snow-covered cells reveal colored ice.
- Production hosting is Netlify. Score data is stored in Supabase.

## Setup and verification

- Use Node.js 20.
- Install dependencies with `npm ci`.
- Run `npm run lint` after code changes.
- Run `npm run build` before opening or updating a pull request.
- Do not claim completion when either command fails.

## Source-control workflow

- Treat GitHub `main` as the stable source of truth.
- Work on one task per branch. Use `codex/` or `claude/` branch prefixes for new cloud tasks.
- Do not let two agents edit the same branch concurrently.
- Push checkpoints early and keep the pull-request description updated so another agent can continue.
- Do not push directly to `main`; use a pull request and inspect its Netlify preview first.

## Visual assets

- Production tile assets live in `public/assets/frostbound/tiles-v5/`.
- Opened cells are 36 x 36 px. Covered snow cells are 36 x 38 px and render 2 px above the cell.
- Preserve PNG dimensions, transparency, hard pixel edges, layer order, and `image-rendering: pixelated`.
- The snow cast shadow is CSS, not baked into the snow PNG. It extends 3 px into the cell below.
- Do not restore or reference `tiles-v1` through `tiles-v4` without an explicit design decision.

## Security and deployment

- Never commit `.env`, `.env.local`, service-role keys, tokens, or local tool authorization files.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be exposed to client code.
- Cloud builds should succeed without production credentials. Test production data through an authorized Netlify deployment.
- Netlify uses Node.js 20 and `npm run build` as defined in `netlify.toml`.

## Project handoff

- Read `docs/PROJECT-STATUS.md` before starting work.
- Update it when the current visual baseline, known limitations, or next steps change materially.
- Keep explanations and user-facing handoffs in Japanese unless the user requests another language.
