# Project status

Last updated: 2026-08-11

## Current baseline

- The glacier theme work is merged into the mainline history (commit `0a73ac5`). There is no
  long-running theme branch anymore; start new work from `main` on a fresh `codex/` or `claude/` branch.
- The approved snow and ice assets are in `public/assets/frostbound/tiles-v5/`.
- The `/style-lab` page remains available as a visual reference and inspection screen.
  Its child route `/style-lab/color-map` renders every adjacency-to-tile mapping with the real
  sprites. It calls the production `getIceAsset()` from `src/lib/tile-assets.ts` directly, so it
  cannot drift from the game — change the mapping and the page follows.
- Covered cells still use the `tiles-v5` snow, flag, corner underlay, and cast-shadow layers.
- **Opened cells no longer use per-state PNGs.** They are a palette colour
  (`src/lib/ice-colors.ts`) with a shared greyscale base drawing composited on top via
  `mix-blend-mode: overlay` (`src/lib/tile-masks.ts`). All 45 adjacency states get a distinct
  colour, and only 5 base drawings are needed. Compare them at `/style-lab/tile-masks`.
- Each mask is built so its mean is mid-grey, which keeps `overlay` from shifting the tile's
  lightness. The palette encodes the bomb count as lightness, so that property is load-bearing —
  do not replace `overlay` with `multiply`.
- The game screen uses the dark-blue pixel HUD and icy background from the approved style direction.
- The glacier visual language is applied to `/game` only. Home, ranking, and result pages are still
  generic Tailwind gradients, and `src/components/Icon.tsx` still uses emoji placeholders.

## Tile rules

- Cell footprint: 36 x 36 px with no grid gap.
- Opened ice tile: 36 x 36 px.
- Covered snow tile: 36 x 38 px, positioned 2 px above the cell with its lower edge aligned.
- Snow cast shadow: symmetrical, 3 px downward, semi-transparent multiply blend.
- Flag overlay: 18 x 22 px at `left: 12px; top: 5px`.
- Mixed red/blue adjacency uses purple ice; strongly dominant colors use red or blue ice.

## Known limitations

- **No automated tests exist.** `npm run lint` and `npm run build` are the only gates, so neither
  catches a gameplay regression. Treat any change to `src/lib/game-logic.ts` or `src/hooks/useGame.ts`
  as unverified until tests are added.
- **Endless scores are client-authoritative.** `src/app/api/score/route.ts` validates only `score >= 0`.
- **Supabase RLS is not enabled** (see `docs/DEPLOYMENT.md`).

## Known follow-up work

See `docs/ROADMAP.md` for the prioritised plan and the ordering constraints between tasks.

- Review the integrated game screen on a real phone and refine spacing after feedback.
- Plan the Next.js 16 migration as a separate task. As of 2026-08-11, `npm audit --omit=dev` reports three high-severity findings in the Next.js 15 build/image toolchain (`postcss` and `sharp`); the available fix is a major-version upgrade.

## Development and deployment

- Runtime: Node.js 20
- Install: `npm ci`
- Verify: `npm run lint` and `npm run build`
- Production: Netlify
- Database: Supabase; production secrets are not stored in GitHub.
- CI (`.github/workflows/ci.yml`) runs lint and build on pushes to `main`, `codex/**`, `claude/**`,
  and `ui-**`, and on every pull request.
