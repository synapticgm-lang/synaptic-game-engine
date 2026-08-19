# Theme texture image prompts — 2026-08-19aa

Hosted `generate-image` is wired for memorable plates / paper-doll / item icons, **not** a theme-texture pipeline. This session shipped **CSS + SVG** materials under `public/themes/`. Use these prompts later if you want bitmap flock/grain plates (seamless tile, low contrast, no figures, no text, no logos).

Save outputs as `public/themes/<slug>-tile.webp` (512², tileable) and wire with:

```css
html[data-sgm-texture='moss'] .sgm-info-panel {
  background-image: url('/themes/moss-tile.webp'), /* existing gradients */;
}
```

## Prompts (original SynapticGM materials only)

1. **moss-tile** — Seamless dark forest-floor tile: damp moss grain, soft leaf-shadow silhouettes, near-black green, no bright neon, no characters, flat orthographic texture.
2. **dusk-tile** — Seamless dusk velvet weave: blue-black textile, sparse violet thread glints, matte, no sparkle noise, no characters.
3. **soot-tile** — Seamless soot stone: charcoal mineral dust, faint brass spark flecks, stone-grid suggestion, no orange lava wash.
4. **ivory-tile** — Seamless ivory stone: warm off-white mineral, silver hairline veins, cool shadow wells, no gold glitter fields.
5. **banner-tile** — Seamless weathered canvas: warp/weft weave, dry mud stain, iron-stud hint, matte, no cartoon green.
6. **scale-tile** — Seamless enamel scale: offset arc rows, aged gold edge glint only, deep green base, sparse not tiled loudly.
7. **ember-tile** — Seamless ash paper: charcoal rock, one narrow rose-gold fissure, soot vignette, no full-panel fire.
8. **circuit-tile** — Seamless brushed chassis: graphite, orthogonal trace lines, one clipped sky-optic line, amber hazard corner only — not Integration cyan flood.
9. **halo-tile** — Seamless pearl marble: opaque pale reading field, warm halo rim outside center, soft vein, high legibility.
10. **glamour-tile** — Seamless twilight veil: muted pink-teal prism shift at low saturation, soft bloom, no rainbow noise.
11. **scrap-tile** — Seamless dry scrap plates: mismatched seams, rivet dots, oil-free grit, yellow scrap accent sparse.
12. **tide-tile** — Seamless deep tide: blue-black depth, low-amplitude caustic rings, pearl rim glints, not animated waves.
13. **velvet-tile** — Seamless flocked near-black plum: wine edge glint only, cool moonlit rim dust, no flat maroon fill.
14. **bone-tile** — Seamless ossuary ash: bone flecks, hairline cracks, cold moonlight, no teal.

Kid Mode: keep abstract materials only — no gore, no weapons as heroes, no sexualized forms.
