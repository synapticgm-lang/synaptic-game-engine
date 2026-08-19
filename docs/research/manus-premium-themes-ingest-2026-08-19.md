# Manus premium themes ingest — 2026-08-19

**Source zip:** `docs/research/pasted/premium-themes-manus-2026-08-19/How to Complete the Task from Uploaded File_.zip`
**Unpacked:** same folder + nested `SynapticGM_premium_themes_price_tiers_maxextract_2026-08-19_DELIVERABLES_unpacked/`
**Prompt:** `docs/research/RESEARCH-PROMPT-premium-themes-price-tiers-manus-2026-08-19.md`
**Ignored:** any WOF / hybrid-climate contamination (none in this package).

## What Manus delivered

Full maxextract dossier (T1–T14) plus research framework, browser findings, design synthesis, CSV score sheet, and eval harness JSON.

| Priority read | File | Takeaway |
|---|---|---|
| P0 rescue | `T6_vampire_nocturne_rescue_brief.md` | Vampire fails as **flat maroon**, not missing gothic. Need flocked velvet + wine-glass glint + **moonlit** edge; Grenze **title-only**; Wine Obsidian dice faceted, not burgundy hex. |
| Backlog | `T9_implementation_backlog.md` | P0-01 Vampire material hierarchy; P0-02 auto-heal visibility; P0-03 kill Integration cyan leak; P0-04 Shop preview = equipped path; P0-05 complete kit parts. P1 surfaces/dice/fonts/a11y. P2 bundles/seasonal/audio-lite. |
| Constitution | `T1_premium_theme_constitution.md` | Cosmetics only; extend existing `--sgm-*` / texture / frame / kit heal — no parallel engine. |
| Evidence gaps | `T14_unknowns_and_evidence_request.md` | Screenshots, commerce/counsel, a11y device pass, five-rater CSV — Manus could not see live build. |
| False friends | T5 deep dives + design synthesis | Vampire ≠ Infernal (sulfur/seal) ≠ Ossuary (bone/ash) ≠ Noir (matte case-file). |

**Thesis (kept):** a £3.99 kit is a **material system** (texture + frame + type policy + dice + voice + turn chrome). Accent-blurred recognition must still name the kit.

## P0 applied now (live code — HUD `2026-08-19t`)

Without boiling the ocean; public-domain tropes only; no licensed art/IP banks.

1. **Vampire Nocturne token rescue** — catalog near-black plum (`#171018` / `#22131f`), wine accent `#8d2746`, cool muted `#c9b5bb`; blurb rewritten.
2. **Velvet texture/frame CSS** — flock + moon rim instead of maroon wash; gothic arch keeps silhouette with moonlit + wine edge.
3. **Font policy** — Inter UI + Playfair story; Grenze Gotisch loaded only for Nocturne headings/HUD brand.
4. **Wine Obsidian dice** — dark plum body, pale shine, thin wine rim; SVG flock cues in `DicePreview`.
5. **False-friend separation** — Infernal → char + sulfur-amber accent / UI Inter + Crimson Pro story; Noir → matte case-file + thin crimson interruption.
6. **Tests** — `uiTheme.test.ts` asserts Vampire tokens, no `#be123c` / Integration cyan, Infernal/Noir texture distinctness.

## Later (do not ship from this ingest alone)

| Item | Why wait |
|---|---|
| P0-04 Shop preview parity audit | Needs component walk + screenshots |
| P0-02 degraded-kit telemetry UI | Visible "degraded" badge / fallback report |
| P1 full surface coverage (map/journal/System/Settings) | Selector audit + playtest evidence |
| P1/P2 a11y matrix, audio-lite stingers, seasonal/bundles | Product + counsel + profiling |
| Five-rater acceptance (T8 CSV) | Needs John (or raters) + screenshots |
| Bitmap flock textures / custom font licenses beyond Google Fonts | Optional polish if CSS still insufficient |
| Counsel: refund/VAT/entitlement copy (T12) | Not a CSS change |

## What John must still provide (only if blocking polish)

**Not blocking for the next playtest of `2026-08-19t`.** Equip Vampire Nocturne and compare to Infernal / Noir / Undead.

Helpful next (non-blocking):

1. **3–5 screenshots** after hard refresh showing stamp `2026-08-19t`: Adventurer card, turn chrome, dice tray, Shop expanded Vampire card — so we can confirm CDN + residual maroon.
2. Optional: greyscale / accent-blurred crop if he still cannot name the kit without hue.

Counsel / Stripe / refund tables are **not** required to continue material CSS work.
