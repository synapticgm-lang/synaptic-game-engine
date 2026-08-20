# Theme AI textures — 2026-08-20g

## John’s question (honest)

**No.** Before this pass, only **Undead Ossuary** had OpenRouter-generated PNGs under `public/themes/undead-ossuary/`. The other 14 race kits and mid/high material shop themes were CSS gradients + a few shared SVGs (`moss-grain.svg`, `dusk-thread.svg`, etc.). Integration Blue stayed plain by design.

## Now generated (3 PNGs each)

| Kit | Folder |
|---|---|
| Wood Elf Grove | `public/themes/wood-elf-grove/` |
| Dark Elf Umbrance | `public/themes/dark-elf-umbrance/` |
| High Elf Spire | `public/themes/high-elf-spire/` |
| Dwarf Forgehall | `public/themes/dwarf-forgehall/` |
| Orc Warcamp | `public/themes/orc-warcamp/` |
| Dragon Hoard | `public/themes/dragon-hoard/` |
| Phoenix Ashrise | `public/themes/phoenix-ashrise/` |
| Cyborg Chassis | `public/themes/cyborg-chassis/` |
| Angelic Radiance | `public/themes/angelic-radiance/` |
| Infernal Pact | `public/themes/infernal-pact/` |
| Undead Ossuary | `public/themes/undead-ossuary/` (legacy `panel-ash.png`) |
| Fae Glamour | `public/themes/fae-glamour/` |
| Goblin Scrapheap | `public/themes/goblin-scrapheap/` |
| Merfolk Abyss | `public/themes/merfolk-abyss/` |
| Vampire Nocturne | `public/themes/vampire-nocturne/` |
| Neon Protocol | `public/themes/neon-protocol/` |
| Parchment Ledger | `public/themes/parchment-ledger/` |
| Bone Reliquary | `public/themes/bone-reliquary/` |
| Phosphor Terminal | `public/themes/phosphor-terminal/` |
| Noir Crimson | `public/themes/noir-crimson/` |
| Glass Spire | `public/themes/glass-spire/` |
| Ember Depths | `public/themes/ember-depths/` |

**Skipped (plain / free ladder):** `theme.integration-blue`

Per kit files: `panel.png` (Undead: `panel-ash.png`), `frame-filigree.png`, `atmosphere.png`.

## Wiring

- `scripts/generate-theme-textures.mjs` — all 22 kits; `--skip-existing`, `--only`, `--list`
- `uiTheme.ts` — `MATERIAL_THEME_KEYS`; sets `--sgm-panel-texture`, `--sgm-atmosphere`, `--sgm-frame-filigree` by **themeKey**
- `index.css` — `html[data-sgm-material='1']` panel/atmosphere overlays + stronger frames
- HUD stamp **2026-08-20g**

## One moderation retry

`orc-warcamp/panel.png` first failed BFL Violence moderation (“blood-rust”); prompt softened to ochre-iron flecks and regenerated OK.

## Verify

1. Hard refresh → HUD shows `2026-08-20g`
2. Equip Vampire Nocturne / Wood Elf Grove / Dwarf Forgehall — panels should show AI grain, not flat fill
3. Equip Integration Blue — stays plain CSS
4. `npx vitest run src/game/uiTheme.test.ts`
