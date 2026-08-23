# Visual assets

## Production tile set

The active tile set is `public/assets/frostbound/tiles-v5/`.

| Asset | Size | Purpose |
| --- | --- | --- |
| `ice-clear-1..2.png` | 36 x 36 | Opened cell with no adjacent bombs |
| `ice-red-1..4.png` | 36 x 36 | Red-dominant opened cells |
| `ice-mix-1..4.png` | 36 x 36 | Mixed red/blue opened cells |
| `ice-blue-1..4.png` | 36 x 36 | Blue-dominant opened cells |
| `snow-1..3.png` | 36 x 38 | Covered cells |
| `snow-underlay.png` | 36 x 38 | Fills chamfered snow corners |
| `flag-overlay.png` | 18 x 22 | Flag and its local shadow |
| `ui-button.png` | 240 x 240 | Style-lab UI source asset |

The snow cast shadow is rendered in CSS so it can extend onto and blend with the opened cell below. Keep all sprite dimensions unchanged and edit with a 1 px pencil without anti-aliasing.

## Production bomb set

The active bomb sprites are in `public/assets/frostbound/bombs-v1/`.

| Asset | Canvas | Opaque bounds | Purpose |
| --- | --- | --- | --- |
| `bomb-red.png` | 36 x 36 | 24 x 24, 6 px padding | Red bomb revealed on the strongest red ice |
| `bomb-blue.png` | 36 x 36 | 24 x 24, 6 px padding | Blue bomb revealed on the strongest blue ice |

The red and blue sprites share the same silhouette and pixel placement. Their alpha channels
contain only 0 or 255, so the edges remain hard and contain no anti-aliasing. Editable SVG
sources are in `bombs-v1/source/`.

After editing a source, regenerate and validate both PNGs with:

```bash
node scripts/render-bomb-assets.mjs
```

## Superseded experiments

`tiles-v1` through `tiles-v4` and the former grass/soil set are local design experiments. They are intentionally excluded from GitHub and must not be used by production code.
