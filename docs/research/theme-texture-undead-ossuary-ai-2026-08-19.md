# Theme texture image prompts — Undead Ossuary AI pass (2026-08-19ab)

Prior (19aa): CSS + SVG only — **no** hosted `generate-image` for theme materials.

This pass: script `scripts/generate-theme-textures.mjs` uses the same OpenRouter path as `supabase/functions/generate-image` (images/generations → chat modalities fallback; model `black-forest-labs/flux.2-klein-4b`).

## Run

```bash
# Direct OpenRouter (reads VITE_OPENROUTER_API_KEY or OPENROUTER_API_KEY from .env)
node scripts/generate-theme-textures.mjs --only undead-ossuary

# Or through hosted edge (needs VITE_SUPABASE_* + edge OPENROUTER secret or clientApiKey)
node scripts/generate-theme-textures.mjs --only undead-ossuary --proxy
```

Outputs land in `public/themes/undead-ossuary/`:

| File | Role |
|------|------|
| `panel-ash.png` | Panel / Adventurer card texture (`--sgm-panel-texture`) |
| `frame-filigree.png` | Optional knuckle filigree strip |
| `atmosphere.png` | Body full-bleed crypt atmosphere |
| `*.svg` | Always-on CSS fallbacks (ship even if AI fails) |

## Prompts (kid-safe abstract materials)

See script `THEMES['undead-ossuary'].assets` — bone dust, ash linen, cold moonlight, no gore, no skull heroes, no teal/velvet.

## CSS wiring

```css
html[data-sgm-texture='bone'] .sgm-info-panel {
  --sgm-panel-texture: url('/themes/undead-ossuary/panel-ash.png');
  background-image: var(--sgm-panel-texture), url('/themes/undead-ossuary/panel-ash.svg'), /* gradients */;
}
html[data-sgm-texture='bone'] body {
  background-image: url('/themes/undead-ossuary/atmosphere.png'), url('/themes/undead-ossuary/atmosphere.svg'), …;
}
```
