# Manus mega-prompt — premium themes, materials, price tiers (2026-08-19)

**Why this exists:** John playtested **Vampire Nocturne** after the 2026-08-19p “materials not recolors” pass and still finds themes **crap / not premium**. Undead Ossuary left Integration teal; Vampire still reads as **generic dark maroon**, not aristocratic velvet / wine / night-court material. Shop price is **£3.99** per race kit — that shelf must look like a material set, not a hue shift of Integration Blue.

**Run as a NEW Manus project.** Do not continue contaminated, WOF, or hybrid-climate branches.  
**Bigger is better** — many complete downloadable markdown + JSON/CSV files > short chat summary. Empty sections = failure.

**Already done (extend, do not reinvent):**
- Pack 10 cosmetic catalog (`src/game/cosmeticCatalog.ts`) — themes, race kits, fonts, dice materials, voices, frames, bundles
- CSS var / texture / frame system (`src/index.css` `data-sgm-texture`, `data-sgm-frame`, `--sgm-*`; `src/game/uiTheme.ts`)
- Theme kit recognition rule (`docs/research/theme-kit-recognition-2026-08-16.md`): name it **with accent color blurred**
- V7 themes/typography/audio-lite (vibe maxextract) — theme is state language, not a cosmetic mask that hides semantics
- 2026-08-19p: Undead Ossuary bone/ash/moonlight; kit font/frame auto-heal; story prose uses theme typeface

**This prompt’s job:** maximum extract on what **Free / Mid / High / £-priced one-time kits** must look and feel like across the **entire SynapticGM surface**, competitive teardown of **same-named** theme genres, D&D/tabletop sheet theme patterns (cite publicly — never copy IP into banks), price-ladder acceptance tests, and a P0/P1/P2 backlog that **extends** the existing kit system.

**Attach (safe):**
1. This prompt  
2. Excerpts below (catalog + recognition notes) — or paste `src/game/cosmeticCatalog.ts` theme + `RACE_THEME_KITS` sections  
3. `docs/research/theme-kit-recognition-2026-08-16.md`  
4. Optional: `docs/research/pack-10-cosmetic-catalog-themes-fonts-voices-dice-2026-08-15.md`  
5. Optional: V7 `docs/research/pasted/vibe-maxextract-manus-2026-08-18/V7_themes_typography_audio_lite.md`  
6. **Strongly preferred:** John attaches screenshots of equipped **Vampire Nocturne**, **Undead Ossuary**, **Dwarf Forgehall**, Shop/Themes locker chips, Adventurer card, paper-doll/sheet, journal, map chrome, dice tray — same session, accent not the only cue  

**Do NOT attach:** `.env`, keys, player PII, Kid PINs, WOF packs, hybrid-climate junk, licensed art dumps.

**John’s complaint (verbatim intent):** Vampire Nocturne still feels like a dark maroon recolor — not premium vampire material. Themes overall still don’t feel worth paying for.

---

## COPY FROM HERE INTO A NEW MANUS PROJECT

```text
NEW PROJECT. Unlimited run. Bigger is better. Prefer many complete downloadable markdown + JSON/CSV + checklist files over chat summaries. Empty sections = failure.
Filename prefix: SynapticGM_premium_themes_price_tiers_maxextract_2026-08-19

LIVE SynapticGM ONLY. No WOF. No hybrid climate. No patent. No MMO redesign.
No licensed races/places/series names IN SynapticGM player-facing content banks or recommended pack names (tropes + original SynapticGM names only).
Competitors, D&D Beyond themes, Fantasy Grounds, Roll20 sheets, Demiplane, Foundry modules, Discord clients, etc. MAY be NAMED as research sources with public citations — do NOT copy their art, logos, type locks, slogans, or unique UI chrome into SynapticGM asset banks.

You are a senior game UI/UX + monetization researcher + digital cosmetics systems designer. Mission: maximum extract so SynapticGM’s paid theme kits feel PREMIUM (materials, silhouette, type, dice, voice, chrome) at Free / Mid / High / one-time £ pack price points — and so a £3.99 kit never reads as “Integration Blue with a different accent.”

# PRODUCT LAW (do not contradict)

- Cosmetics ONLY. Never change dice odds, loot, quests, HP, permits, or story outcomes.
- Mandatory store line (already product law): “Cosmetic only. Does not affect dice rolls, loot, stats, or story outcomes.”
- Theme is a state language (V7): kits may change material / frame / type / motion / audio flavour — they must NOT hide or remap: player correction, pinned canon, StateTx, evidence, invention.
- Kid Mode: no pressure, no ads; high-contrast / readable defaults still win over decorative chaos.
- Extend existing system: `SHOP_CATALOG`, `RACE_THEME_KITS`, `--sgm-*` CSS vars, `data-sgm-texture`, `data-sgm-frame`, kit auto-heal in `uiTheme.ts`. Do NOT invent a parallel theme engine.
- Recognition rule (shipped intent): player can name the kit WITH ACCENT COLOR BLURRED — from material, silhouette, typeface, frame corners, dice material.

# REAL SYNAPTICGM CATALOG (use these exact names / keys)

## Free default
| Shop id | themeKey | Name | Price | Notes |
| theme.integration-blue | integration-blue | Integration Blue | Free | Cold registrar cyan on slate; texture plain |

## Standalone paid themes (no race kit bundle in catalog)
| Shop id | themeKey | Name | GBP | Texture / vibe (catalog) |
| theme.neon-protocol | neon-protocol | Neon Protocol | £3.99 | neon — night-city glitch |
| theme.parchment-ledger | parchment-ledger | Parchment Ledger | £3.99 | parchment — warm paper journal |
| theme.bone-reliquary | bone-reliquary | Bone Reliquary | £3.99 | bone — grimdark ash/blood |
| theme.phosphor-terminal | phosphor-terminal | Phosphor Terminal | £2.99 | phosphor — CRT green |
| theme.noir-crimson | noir-crimson | Noir Crimson | £3.99 | noir — pulp B&W + crimson |
| theme.glass-spire | glass-spire | Glass Spire | £3.99 | glass — frosted lilac/silver |
| theme.ember-depths | ember-depths | Ember Depths | £3.99 | ember — volcanic charcoal |

## Race / archetype kits (£3.99 unless noted) — EACH includes matching font + dice + voice + turn frame
| Shop id | themeKey | Name | GBP | Texture | Font | Dice material | Frame style | Voice flavour seed |
| theme.wood-elf-grove | wood-elf-grove | Wood Elf Grove | £3.99 | moss | Canopy Serif (Libre Baskerville) | wood | vine | Grove Whisper |
| theme.dark-elf-umbrance | dark-elf-umbrance | Dark Elf Umbrance | £3.99 | dusk | Umbrance Serif (Cormorant) | obsidian | filigree | Under-Realm |
| theme.high-elf-spire | high-elf-spire | High Elf Spire | £3.99 | ivory | Ivory Court (Cinzel) | ivory | ivory | Lofty Court |
| theme.dwarf-forgehall | dwarf-forgehall | Dwarf Forgehall | £3.99 | soot | Rune Stone (MedievalSharp) | brass | rune / hammer | Forge Deep |
| theme.orc-warcamp | orc-warcamp | Orc Warcamp | £3.99 | banner | War Banner (Impact-class) | iron | iron / spike | Warcamp |
| theme.dragon-hoard | dragon-hoard | Dragon Hoard | £3.99 | scale | Wyrm Gold (Cinzel Decorative) | scale | scale | Hoard Rumble |
| theme.phoenix-ashrise | phoenix-ashrise | Phoenix Ashrise | £3.99 | ember | Ember Script (Playfair) | ember | ember / feather | Ashrise |
| theme.cyborg-chassis | cyborg-chassis | Cyborg Chassis | £3.99 | circuit | Optic Mono (Orbitron) | circuit | circuit | Chassis Synth |
| theme.angelic-radiance | angelic-radiance | Angelic Radiance | £3.99 | halo | Marble Serif (Cormorant) | marble | halo | Radiance |
| theme.infernal-pact | infernal-pact | Infernal Pact | £3.99 | sulfur | Sulfur Serif (Crimson Pro) | sulfur | sulfur / wax seal | Pact Heat |
| theme.undead-ossuary | undead-ossuary | Undead Ossuary | £3.99 | bone | Crypt Serif (Special Elite) | bone | bone / knuckle | Ossuary |
| theme.fae-glamour | fae-glamour | Fae Glamour | £3.99 | glamour | Twilight Serif | iridescent | twilight | Glamour |
| theme.goblin-scrapheap | goblin-scrapheap | Goblin Scrapheap | £2.99 | scrap | Scrap Sans | scrap | scrap / rivet | Scrap Cackle |
| theme.merfolk-abyss | merfolk-abyss | Merfolk Abyss | £3.99 | tide | Tide Serif (Spectral) | tide | tide / pearl | Abyss Tide |
| theme.vampire-nocturne | vampire-nocturne | Vampire Nocturne | £3.99 | velvet | Velvet Gothic (Grenze Gotisch) | velvet | velvet / gothic arch | Nocturne |

## Dice materials enum (catalog)
wood | obsidian | ivory | brass | iron | scale | ember | circuit | marble | sulfur | bone | iridescent | scrap | tide | velvet | holo | frost | neon

## Theme textures enum (catalog)
plain | moss | dusk | soot | ivory | banner | scale | ember | circuit | halo | sulfur | bone | glamour | scrap | tide | velvet | parchment | phosphor | neon | glass | noir

## Standalone dice / fonts / voices / frames / bundles (shelf context)
- Dice: System Holo (£2.99), Bone & Iron (£2.99), Frost Crystal (£3.99), Neon Edge (£2.99) + race kit dice
- Voices: Cold Registrar, Street Chronicler, Grizzled Mentor (£4.99) + race kit voices
- Frames: Glitch Static, Ornate Brass (£1.99) + race kit frames
- Bundles: Integration Starter £7.99; Ledger Scholar £7.99; Ancestry Sampler £9.99 (Wood Elf + Dark Elf + Dwarf + Dragon)
- Free path also includes Cyborg Skull Circuit dice (logo-style) when that kit is in play

## Recognition cues already claimed (shipped intent — verify if they actually read premium in-game)
- Dwarf Forgehall: hammer-head corners · stone-grid soot · MedievalSharp
- Undead Ossuary: knucklebone corners · bone flecks · Special Elite · bone/ash/moonlight (NO teal)
- Vampire Nocturne: pointed gothic arches · flock velvet · Grenze Gotisch — **John says still generic dark maroon**
- Infernal: wax-seal · sulfur hotspot
- Goblin: rivet/bolt · scrap dots
- Orc: spike stud · banner dots
- Cyborg: hazard stripe · Orbitron · Skull Circuit dice
- Dragon: multi-row scale corners
- Phoenix: feather-flame corners

## Surfaces that MUST restyle when a kit is equipped (full coverage research)
Palette, panel textures, page/background atmosphere, typography (UI + story prose), frames/filigree, dice materials + tray FX, TTS/voice flavour, turn chrome, HUD accents, Shop/Themes preview fidelity (must not lie), Adventurer card, paper-doll / character sheet, journal, inventory/drawers, map chrome, Salvage / System windows, Settings hubs that show theme chrome.

# RESEARCH DOMAINS — COVER ALL

Separate **verified public mechanism** vs **SPECULATIVE transfer**. Cite URLs + access dates. No invented competitor internals.

## Domain A — Player expectations by price tier
What players expect from themes/cosmetics at:
1. Free default
2. Mid subscription / Mid tier included cosmetics (AI RPG / VTT / Discord Nitro-class patterns)
3. High / premium subscription cosmetics
4. One-time digital pack at ~£2.99–£4.99 and ~£7.99–£12.99 bundle

Harvest from: digital games cosmetics (MOBAs, battle pass skins, Fortnite/Roblox-class expectations as *patterns*), AI RPGs / adventure clients, TTRPG VTTs, character sheet apps, Discord/RP clients, mobile gacha skins (pattern-level only). Extract: “worth paying” cues, refund/regret triggers, “recolor tax” backlash, preview honesty norms.

## Domain B — Material language (not hue)
What makes velvet, bone, soot, brass, parchment, circuit, tide, sulfur READ as materials at phone + desktop sizes. Texture recipes (CSS-safe), corner silhouettes, typography pairing, dice material FX, micro-motion budgets, reduced-motion fallbacks. Anti-patterns: flat fills, single accent swap, Cinzel-everywhere, teal bleed from default System.

## Domain C — Competitive teardown: SAME OR SIMILAR THEME NAMES
Find public products/skins/sheets/themes whose marketing or UI names echo SynapticGM catalog tropes:
vampire / nocturne / undead / ossuary / bone / dwarf / forge / elf grove / umbrance / orc / goblin / merfolk / abyss / cyborg / angelic / infernal / fae / parchment / neon / noir / phosphor / glass.

For EACH trope cluster: “done well” visual checklist vs “cheap recolor” failure modes. Screenshot descriptions (not stolen assets). Score SynapticGM’s catalog names against that bar — especially Vampire Nocturne and Undead Ossuary.

## Domain D — D&D / tabletop character sheets & info sheets
Official and popular third-party visual themes / paper styles / “premium sheet” meaning:
- D&D Beyond themes (public help/marketing only)
- Fantasy Grounds, Roll20 character sheets, Demiplane, Foundry VTT modules
- Printable fancy sheets / parchment PDFs / deluxe form-fillable sheets (public storefronts)

Extract PATTERNS ONLY: paper grain, ink rules, header ornaments, section frames, serif vs display hierarchy, dark-mode gothic sheets, faction colour accents that still feel material. Cite publicly. Do NOT recommend copying WotC art, SRD layout locks, or franchise crests into SynapticGM banks. SynapticGM player copy already avoids D&D/WotC product naming — keep that fence.

## Domain E — Shop preview fidelity & locker UX
How good shops prevent “preview lied”: chip vs equipped fidelity, expand-one kit, font sample in the pack face, faceted material dice (not flat hex), Hear TTS, before/after, bundle clarity. Map to SynapticGM Themes + Shop (sticky chips, 2-col set grid, owned/equipped badges).

## Domain F — Accessibility & premium coexistence
Premium ≠ unreadable. Contrast, grayscale recognition, 200% text, color-not-only semantics (V7), motion preferences, Kid Mode calmer chrome. Premium kits must pass the same semantic vocabulary tests as Integration Blue.

# DELIVERABLES (Parts T1–T14) — ALL REQUIRED

## T1 — Executive: Premium Theme Constitution (≤3 pages)
Non-negotiable laws for SynapticGM cosmetics. Define “premium” operationally for a £3.99 kit vs Free. Explicit: materials > hue; kit completeness (font+dice+voice+frame+texture+surface coverage); shop honesty; semantic state language preserved.

## T2 — Price ladder matrix
Table: Free | Mid-included | High-included | £2.99–£3.99 kit | £7.99–£9.99 bundle.
Columns: must-have visual deltas | nice-to-have | anti-patterns | player regret triggers | SynapticGM shelf mapping (Integration Blue / Phosphor £2.99 / race kits £3.99 / Ancestry Sampler £9.99).

## T3 — Full surface coverage map
For EVERY surface listed above: what changes per kit; what stays Integration; CSS hook that already exists vs gap; acceptance criterion. Output CSV + markdown.

## T4 — Competitive teardown scorecard (≥12 products/domains)
product | theme trope overlap | material vs recolor | typography | frames | dice/chrome | preview honesty | price signal | steal | refuse | citations.

## T5 — Same-name trope deep dives (required tropes)
Minimum deep dives (each ≥1 page + checklist): Vampire/Nocturne; Undead/Ossuary/Bone; Dwarf/Forge; Elf (wood/dark/high); Orc; Goblin; Merfolk/Abyss; Cyborg; Angelic; Infernal; Fae; Parchment; Neon; Noir/Phosphor/Glass.
Each: premium reference patterns | cheap failures | SynapticGM gap vs claimed cues | SPECIFIC upgrade recipes compatible with CSS vars (no IP theft).

## T6 — Vampire Nocturne rescue brief (P0 focus)
John’s complaint: still generic dark maroon. Deliver:
- Target material language (velvet flock, wine glass, moonlight edge, aristocratic night — original, not franchise)
- What to keep from current kit (Grenze Gotisch, gothic arch, velvet texture token, Wine Obsidian dice, Nocturne TTS)
- What is failing (likely: panel still flat maroon; story/UI hierarchy; HUD still Integration; preview exaggerate)
- Before/after acceptance tests (blurred-accent naming; side-by-side vs Integration Blue; vs Undead Ossuary; vs Infernal Pact so vampire ≠ infernal)
- Concrete CSS/token backlog items (extend existing — no new engine)

## T7 — Tabletop sheet theme pattern library
Patterns from Domain D → SynapticGM Adventurer card / paper-doll / journal — transferable chrome recipes with “do not copy IP” notes. Include “premium sheet” definition checklist.

## T8 — Recognition & acceptance test suite
- “Name it with accent blurred” protocol (photo method, 5 raters, pass bar)
- Greyscale pass
- Shop chip vs in-play delta ≤ X (define X)
- Kit completeness gate (font loaded, frame corners visible at phone width, dice material ≠ flat fill, voice Hear works, story font applies to prose)
- False-friend tests: Vampire vs Infernal vs Noir Crimson vs Bone Reliquary vs Undead Ossuary must not collapse
- Kid Mode / a11y smoke

Provide printable score sheet CSV John can run tonight.

## T9 — Implementation backlog for SynapticGM (P0 / P1 / P2)
Extend `cosmeticCatalog.ts` + `index.css` + `uiTheme.ts` only.
P0: Vampire Nocturne + any kit that still fails blurred-accent; shop preview lies; teal bleed; missing kit parts on equip.
P1: Full surface restyle gaps (journal/map/sheet/System); dice FX completeness; font loading UX.
P2: Bundle ladder polish, seasonal, audio-lite stingers, advanced motion.
Each item: files likely touched | acceptance test id | effort S/M/L | depends on.

## T10 — Anti-list (hard refuse)
Explicit ban for future passes:
- Teal / Integration cyan bleeding into paid kits (esp. Undead, Merfolk, Cyborg)
- Cinzel-everywhere (High Elf / Dragon may use Cinzel family — others must not collapse to it)
- Hue-only “themes”
- Missing dice / voice / font / frame on a sold “kit”
- Shop preview more premium than equipped play chrome
- Flat hex dice pretending to be materials
- Decorative type encoding critical mechanics
- Licensed franchise names, crests, lookalike UI locks in banks
- Premium that fails contrast / grayscale / reduced motion

## T11 — Content / design banks (original only)
- Per-kit “material one-liner” + “never-line” for designers (no franchise)
- 20 CSS-safe texture recipe sketches (describe layers: noise, gradient, vignette, corner mask) mapped to existing ThemeTexture tokens
- Font pairing dos/don’ts per kit (UI vs story; display vs body)
- Dice material FX notes for Excited roll mode (cosmetic only)

## T12 — Monetization honesty brief
How to market kits without lying; refund-risk copy; bundle vs single; Mid/High subscription expectations if cosmetics are included later; what NOT to claim. Not legal advice — flag COUNSEL items.

## T13 — Eval harness JSON
Machine-readable gates: kit id → required tokens (texture, frame, fonts, diceMaterial) → surfaces checklist → pass/fail. Align with T8.

## T14 — What Manus still cannot know
List what requires John’s screenshots / live build / Stripe facts / counsel. Do not invent.

# OUTPUT RULES
- Many files under the filename prefix. Index README with links.
- Every competitive claim: citation + access date.
- Mark SPECULATIVE vs verified.
- Prefer tables + checklists John can execute.
- Never dump WOF or licensed asset packs as SynapticGM content.
```

---

## Catalog excerpt for attach (optional paste)

**Vampire Nocturne (current catalog intent):**
- themeKey `vampire-nocturne` · £3.99 · accent `#be123c` · bg `#0c0004` · panel `#3f0a1a`
- texture `velvet` · frame `Gothic Arch` / style `velvet` · font Velvet Gothic (`Grenze Gotisch`)
- dice Wine Obsidian · material `velvet` · voice Nocturne (“Night has better manners than day.”)

**Undead Ossuary (post-19p intent):**
- themeKey `undead-ossuary` · bone ivory / grave ash / cold moonlight — **not System teal**
- font Crypt Serif (`Special Elite`) · dice Bone Knuckle · frame Bone Knuckle · texture `bone`

**Recognition rule:** name the theme with the accent color blurred — material, silhouette, typeface.

---

## How John runs this

1. Open a **new** Manus project (do not continue an old branch).  
2. Paste everything inside the `COPY FROM HERE` fenced block.  
3. Attach this file + catalog excerpts (or `cosmeticCatalog.ts` theme/kit sections) + `theme-kit-recognition-2026-08-16.md`.  
4. Attach screenshots of Vampire Nocturne + Undead Ossuary + Dwarf Forgehall in play (Adventurer, sheet, journal, map, dice, Shop chip).  
5. Tell Manus: unlimited files; empty sections = failure; live SynapticGM only.
