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
- Merge as soon as a pull request is green. Long-lived branches are the main source of conflicts.

## Working in parallel

Several sessions may run at the same time. Conflicts only ever come from two sessions
touching the same file, so tasks are split by file, not by feature.

- Task specifications live in `docs/tasks/`. Read `docs/tasks/README.md` for the lane table.
- If a task specification names your lane, respect its "do not touch" list exactly.
  Reaching outside your lane is what breaks the other sessions.
- **Do not edit `docs/PROJECT-STATUS.md` or `docs/ROADMAP.md` while parallel work is in flight.**
  Every session updating them guarantees a conflict. Put anything worth sharing in the pull
  request description instead. Consolidating them is a separate, single-session task.
- Only one session at a time may add or update dependencies. `package-lock.json` cannot be
  merged by hand.

## Visual assets

- Covered snow cells, the flag, and the corner underlay come from
  `public/assets/frostbound/tiles-v5/`.
- Opened cells are **not** PNGs. They are a palette colour from `src/lib/ice-colors.ts` with a
  shared greyscale base drawing composited on top (`src/lib/tile-masks.ts`,
  `public/assets/frostbound/masks-v1/`). All 45 adjacency states get a distinct colour.
- Opened cells are 36 x 36 px. Covered snow cells are 36 x 38 px and render 2 px above the cell.
- Preserve PNG dimensions, transparency, hard pixel edges, layer order, and `image-rendering: pixelated`.
- The snow cast shadow is CSS, not baked into the snow PNG. It extends 3 px into the cell below.
- Do not restore or reference `tiles-v1` through `tiles-v4` without an explicit design decision.

### Two properties that are load-bearing

- Each mask in `masks-v1/` is built so its **mean is mid-grey**, which lets
  `mix-blend-mode: overlay` add texture without shifting the tile's lightness.
- The palette encodes the **bomb count as lightness**. If the mask shifts lightness, that
  encoding breaks. Do not switch `overlay` to `multiply`, and regenerate masks only with
  `scripts/extract-tile-masks.mjs`.

## Security and deployment

- Never commit `.env`, `.env.local`, service-role keys, tokens, or local tool authorization files.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be exposed to client code.
- Cloud builds should succeed without production credentials. Test production data through an authorized Netlify deployment.
- Netlify uses Node.js 20 and `npm run build` as defined in `netlify.toml`.

## Project handoff

- Read `docs/PROJECT-STATUS.md` before starting work, and `docs/tasks/` if a lane is assigned.
- Update `docs/PROJECT-STATUS.md` only when no parallel work is in flight (see "Working in
  parallel" above). Otherwise record the change in the pull request description.
- Keep explanations and user-facing handoffs in Japanese unless the user requests another language.
