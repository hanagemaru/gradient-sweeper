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

## Superseded experiments

`tiles-v1` through `tiles-v4` and the former grass/soil set are local design experiments. They are intentionally excluded from GitHub and must not be used by production code.
