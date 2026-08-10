# Project status

Last updated: 2026-08-11

## Current baseline

- Active work branch: `ui-theme-snow`
- The approved snow and ice assets are in `public/assets/frostbound/tiles-v5/`.
- The `/style-lab` page remains available as a visual reference and inspection screen.
- The production game board now uses the same `tiles-v5` snow, ice, flag, corner underlay, and cast-shadow layers.
- The game screen uses the dark-blue pixel HUD and icy background from the approved style direction.

## Tile rules

- Cell footprint: 36 x 36 px with no grid gap.
- Opened ice tile: 36 x 36 px.
- Covered snow tile: 36 x 38 px, positioned 2 px above the cell with its lower edge aligned.
- Snow cast shadow: symmetrical, 3 px downward, semi-transparent multiply blend.
- Flag overlay: 18 x 22 px at `left: 12px; top: 5px`.
- Mixed red/blue adjacency uses purple ice; strongly dominant colors use red or blue ice.

## Known follow-up work

- Review the integrated game screen on a real phone and refine spacing after feedback.
- Apply the glacier visual language to home, ranking, and result pages if desired.
- Add automated tests for core game logic before larger feature changes.
- Add automated browser checks after the GitHub/Netlify cloud workflow is stable.
- Plan the Next.js 16 migration as a separate task. As of 2026-08-11, `npm audit --omit=dev` reports three high-severity findings in the Next.js 15 build/image toolchain (`postcss` and `sharp`); the available fix is a major-version upgrade.

## Development and deployment

- Runtime: Node.js 20
- Install: `npm ci`
- Verify: `npm run lint` and `npm run build`
- Production: Netlify
- Database: Supabase; production secrets are not stored in GitHub.
