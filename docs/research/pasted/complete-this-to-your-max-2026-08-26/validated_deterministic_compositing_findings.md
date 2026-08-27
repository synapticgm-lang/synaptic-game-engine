# Validated Findings — Deterministic Compositing and Scene State

## Ren'Py layered images and UI separation

Sources:

- **Ren'Py Documentation — Layered Images**, https://www.renpy.org/doc/html/layeredimage.html
- **Ren'Py Documentation — Screens and Screen Language**, https://www.renpy.org/doc/html/screens.html

Ren'Py documents layered character images as a remedy for the combinatorial cost of pre-rendering every outfit, hairstyle, and expression combination. A character can have an always-present base plus mutually exclusive attribute groups such as outfit or face; conditions select layers at runtime. The screen system separately renders user interface elements, including speaker name and dialogue, and allows multiple screens to coexist.

**SynapticGM transfer:** Build the Free deterministic fallback from rights-cleared reusable assets keyed by canonical entity IDs and a small attribute vocabulary. The compositor should combine one background or plate, a bounded number of portrait/sprite layers, optional foreground/effect layers, and existing HTML/SVG lettering. Mutually exclusive equipment slots prevent two incompatible weapons or outfits from being shown simultaneously. The combinatorial explosion is controlled by compositing a small layer library rather than pre-rendering every combination.

## Foundry VTT scenes and tiles

Sources:

- **Foundry Virtual Tabletop — Scenes**, https://foundryvtt.com/article/scenes/
- **Foundry Virtual Tabletop — Tiles**, https://foundryvtt.com/article/tiles/

Foundry documents a scene as a stored state with an active/viewed distinction, background and foreground images, positioned placeables, an initial camera view, lighting/ambience, and preloading. Tiles are reusable artwork above a scene background with explicit position, z-index, size, rotation, opacity, tint, visibility, and lock state.

**SynapticGM transfer:** Treat a comic-lite panel as a declarative scene receipt rather than a monolithic image. Stable z-order and coordinates make deterministic portraits, props, effects, borders, and lettering cheap to compose. Preload the likely next plate or portraits when capacity permits, but do not activate stale art until the corresponding story commit remains current. An image job should carry a turn/beat revision key so corrected text invalidates old results.

## Product implications

| Technique | Benefit | Marginal model cost | Primary risk | Required control |
|---|---|---:|---|---|
| Layered character attributes | Many visual variants from a small rights-cleared library | Zero | Invalid attribute combinations | Mutually exclusive equipped-slot groups |
| Stored scene state | Rapid reuse of backgrounds and placed entities | Zero | Stale scene after correction or travel | Atomic replacement keyed by place and revision |
| Explicit z-order | Reliable bubbles, borders, portraits, and effects | Zero | Overlay obscures faces/action | Reserved negative-space anchor zones |
| Preloading | Lower perceived latency for likely assets | Zero generation cost, some bandwidth | Waste and privacy/cache leakage | Preload only approved cached assets; never speculative generation |
| Separate UI/text layer | Legible, editable canonical dialogue | Zero image cost | Speaker/beat mismatch | Bind overlay to accepted utterance ID and speaker ID |

## Guardrails

The deterministic fallback must not quietly invent absent props, companions, wounds, or location details. It should prefer omission to contradiction. Art-layer state is a view of accepted ledger fields, not an alternate state store. Generated assets and reused plates require rights and provenance metadata, and all text remains outside live pixels.
