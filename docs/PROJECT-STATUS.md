# Project status

Last updated: 2026-08-11

## Current baseline

- The glacier theme work is merged into the mainline history (commit `0a73ac5`). There is no
  long-running theme branch anymore; start new work from `main` on a fresh `codex/` or `claude/` branch.
- The approved snow and ice assets are in `public/assets/frostbound/tiles-v5/`.
- The `/style-lab` page remains available as a visual reference and inspection screen.
- The production game board uses the same `tiles-v5` snow, ice, flag, corner underlay, and cast-shadow layers.
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
- **The ice colour mapping collapses.** 45 possible (red, blue) adjacency states map to only
  11 distinct tiles; `ice-mix-1` and `ice-mix-3` are never rendered at all. See
  `docs/technical/COLOR-MAPPING.md` for the full table and the four specific problems.
- **The game board re-renders 10 times per second while idle.** `useTimer` (`src/hooks/useTimer.ts`)
  ticks every 100 ms and its state lives in the same component as `<Board>`
  (`src/app/game/page.tsx`), so all 81 cells and their `next/image` elements reconcile on every tick.
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
