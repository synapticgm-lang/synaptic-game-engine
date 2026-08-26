# Part T3 — Theme and Image Pairing

**Author:** Manus AI  
**Evidence boundary:** The twenty-two exact kit keys and selected premium/comic rules come from the user-provided task summary. The underlying theme, template, and cost files were not attached; every detail that depends on those files is marked **INPUT REQUIRED**.

> **Presentation firewall:** A theme is a cosmetic material system. A tone may suggest a default kit, but the player may override it. Art is never ledger truth. Generated pixels contain no dialogue, captions, SFX glyphs, logos, UI, or watermarks; all lettering remains HTML/SVG overlay.

## T3.1 Tone-to-theme kit matrix

| Tone | Primary kit | Secondary kits | False friends to avoid | Kid | Recipe |
|---|---|---|---|---|---|
| `grimdark_bleak_consequence` | `infernal-pact` | `bone-reliquary`, `undead-ossuary` | `ember-depths`, `vampire-nocturne` | conditional | `recipe_grimdark_bleak_consequence_v1` |
| `cozy_low_stakes_comfort` | `wood-elf-grove` | `high-elf-spire`, `parchment-ledger` | `undead-ossuary`, `infernal-pact`, `noir-crimson` | yes | `recipe_cozy_low_stakes_comfort_v1` |
| `cozy_brutal` | `orc-warcamp` | `goblin-scrapheap`, `ember-depths` | `infernal-pact`, `vampire-nocturne` | conditional | `recipe_cozy_brutal_v1` |
| `pulp_kinetic_adventure` | `dragon-hoard` | `phoenix-ashrise`, `orc-warcamp` | `parchment-ledger`, `bone-reliquary` | yes | `recipe_pulp_kinetic_adventure_v1` |
| `gothic_moonlit_dread` | `vampire-nocturne` | `dark-elf-umbrance`, `glass-spire` | `infernal-pact`, `undead-ossuary`, `noir-crimson` | conditional | `recipe_gothic_moonlit_dread_v1` |
| `litrpg_system_registrar` | `phosphor-terminal` | `neon-protocol`, `cyborg-chassis` | `glass-spire`, `angelic-radiance` | yes | `recipe_litrpg_system_registrar_v1` |
| `military_procedural` | `dwarf-forgehall` | `orc-warcamp`, `cyborg-chassis` | `fae-glamour`, `angelic-radiance` | conditional | `recipe_military_procedural_v1` |
| `dry_wit_deadpan` | `goblin-scrapheap` | `parchment-ledger`, `noir-crimson` | `fae-glamour`, `angelic-radiance` | yes | `recipe_dry_wit_deadpan_v1` |
| `warm_chronicle` | `parchment-ledger` | `wood-elf-grove`, `high-elf-spire` | `phosphor-terminal`, `noir-crimson` | yes | `recipe_warm_chronicle_v1` |
| `clinical_auditor` | `glass-spire` | `cyborg-chassis`, `phosphor-terminal` | `angelic-radiance`, `fae-glamour` | conditional | `recipe_clinical_auditor_v1` |
| `mythic_portent` | `angelic-radiance` | `dragon-hoard`, `phoenix-ashrise` | `neon-protocol`, `noir-crimson` | yes | `recipe_mythic_portent_v1` |
| `street_balladeer` | `neon-protocol` | `goblin-scrapheap`, `noir-crimson` | `high-elf-spire`, `angelic-radiance` | yes | `recipe_street_balladeer_v1` |
| `ashen_archivist` | `undead-ossuary` | `bone-reliquary`, `parchment-ledger` | `vampire-nocturne`, `infernal-pact` | conditional | `recipe_ashen_archivist_v1` |
| `bright_field_guide` | `merfolk-abyss` | `wood-elf-grove`, `dragon-hoard` | `undead-ossuary`, `infernal-pact` | yes | `recipe_bright_field_guide_v1` |
| `noir_case_file` | `noir-crimson` | `glass-spire`, `neon-protocol` | `vampire-nocturne`, `infernal-pact`, `undead-ossuary` | conditional | `recipe_noir_case_file_v1` |
| `fae_uncanny_tale` | `fae-glamour` | `high-elf-spire`, `dark-elf-umbrance` | `vampire-nocturne`, `angelic-radiance` | conditional | `recipe_fae_uncanny_tale_v1` |
| `hard_sf_terminal` | `cyborg-chassis` | `phosphor-terminal`, `neon-protocol` | `glass-spire`, `angelic-radiance` | conditional | `recipe_hard_sf_terminal_v1` |
| `pyoa_branching_crisis` | `parchment-ledger` | `ember-depths`, `merfolk-abyss` | `fae-glamour`, `glass-spire` | yes | `recipe_pyoa_branching_crisis_v1` |
| `kid_plain_stakes` | `angelic-radiance` | `wood-elf-grove`, `phoenix-ashrise` | `infernal-pact`, `undead-ossuary`, `vampire-nocturne` | yes | `recipe_kid_plain_stakes_v1` |

All twenty-two required kit keys appear at least once as a primary or secondary recommendation. The matrix is a suggestion layer only; no renderer may use kit selection as evidence for location, faction, species, inventory, weather, or quest state.

## False-friend separations

| Boundary | Keep distinct | Deterministic prompt cue |
|---|---|---|
| Vampire Nocturne vs Infernal Pact | Moonlit velvet, predatory elegance, wine-black restraint vs sulfur, brass, seals, oath heat. | If `vampire-nocturne`, forbid sulfur vents, brass seals, and magma; if `infernal-pact`, forbid velvet salon cues and moonlit aristocratic portraiture. |
| Vampire Nocturne vs Undead Ossuary | Living nocturnal luxury vs bone, dust, burial architecture, and post-life archive. | `vampire-nocturne` requires textile and moon edge; `undead-ossuary` requires mineral/bone material and no sensual velvet emphasis. |
| Vampire Nocturne vs Noir Crimson | Gothic interior and moonlight vs urban case-file geometry and controlled crimson signal. | `noir-crimson` requires rain/street/blind light; `vampire-nocturne` requires moon/interior/velvet. |
| Infernal Pact vs Ember Depths | Contract, sulfur, brass, wax, and ritual obligation vs geology, magma, forge heat, and pressure. | Never use `infernal-pact` as a generic lava theme; never imply a bargain from `ember-depths`. |
| Phosphor Terminal vs Neon Protocol vs Cyborg Chassis | Retro terminal surface vs urban network energy vs embodied machine material. | Select terminal for registrar chrome, neon for city rhythm, chassis for physical machinery. |
| Bone Reliquary vs Undead Ossuary | Sacred object framing vs architectural burial field. | Reliquary centers one supplied object; ossuary composes space. |

## T3.2 Image-prompt recipes by tone


### `grimdark_bleak_consequence`

| Component | Append-only recipe |
|---|---|
| Memorable-plate delta | light_event=low raking sulfur glow through smoke; palette_pair=charcoal+brass-yellow; composition_bias=small figure against damaged civic scale; protect readable silhouette; append to Master Suffix |
| Template fit | INPUT REQUIRED: memorable_plate_style_guide.md absent |
| Why | Select ruins, confrontation, or aftermath layouts only after Template 01–20 definitions are supplied. |
| Comic-lite camera | low_three_quarter / compressed_long_lens |
| Gutter token | charcoal_hairline |
| Role preference | atmosphere_bg>frame_ornament>panel_tile |
| Negative prompt must-includes | no readable text; no letters or numbers; no dialogue balloons; no captions; no SFX glyphs; no logos; no watermarks; no UI; no HUD; no living-artist or studio imitation; no franchise lookalikes; no copyrighted character likeness; no extra factual entities not supplied by SceneManifest |
| Kid Mode visual rewrite | Replace gore, corpses, impalement, and despair poses with damaged gear, smoke, blocked routes, and determined recovery; keep consequence visible but non-graphic. |
| Font/dice note | Use severe high-contrast title tokens and dark neutral body tokens; exact premium font/dice mapping INPUT REQUIRED. Infernal means sulfur, brass, seals, and contract heat—not magma. |

### `cozy_low_stakes_comfort`

| Component | Append-only recipe |
|---|---|
| Memorable-plate delta | light_event=dappled window or canopy light; palette_pair=moss-green+honey; composition_bias=eye-level shared activity with generous breathing room; append to Master Suffix |
| Template fit | INPUT REQUIRED: memorable_plate_style_guide.md absent |
| Why | Choose quiet-arrival, shared-task, or object-discovery layouts after template definitions are supplied. |
| Comic-lite camera | eye_level_medium / gentle_overhead |
| Gutter token | cream_soft |
| Role preference | panel_tile>atmosphere_bg>frame_ornament |
| Negative prompt must-includes | no readable text; no letters or numbers; no dialogue balloons; no captions; no SFX glyphs; no logos; no watermarks; no UI; no HUD; no living-artist or studio imitation; no franchise lookalikes; no copyrighted character likeness; no extra factual entities not supplied by SceneManifest |
| Kid Mode visual rewrite | Keep warm light, clear faces, open paths, and friendly distance; remove sharp weapons, looming silhouettes, and ambiguous menace. |
| Font/dice note | Prefer highly legible warm serif body text and soft natural dice; pack-specific token names INPUT REQUIRED. |

### `cozy_brutal`

| Component | Append-only recipe |
|---|---|
| Memorable-plate delta | light_event=campfire edge against hard impact sparks; palette_pair=soot-black+stew-amber; composition_bias=close action foreground with safe communal anchor behind; append to Master Suffix |
| Template fit | INPUT REQUIRED: memorable_plate_style_guide.md absent |
| Why | Select duel, aftermath, or shared-meal layouts only after the template guide is present. |
| Comic-lite camera | handheld_medium / impact_closeup |
| Gutter token | ink_heavy |
| Role preference | frame_ornament>atmosphere_bg>panel_tile |
| Negative prompt must-includes | no readable text; no letters or numbers; no dialogue balloons; no captions; no SFX glyphs; no logos; no watermarks; no UI; no HUD; no living-artist or studio imitation; no franchise lookalikes; no copyrighted character likeness; no extra factual entities not supplied by SceneManifest |
| Kid Mode visual rewrite | Convert wounds to scuffs, torn cloth, dust, and comic soot; keep the camp, meal, teamwork, and honest loss of position or item. |
| Font/dice note | Pair sturdy utilitarian body type with warm camp accents; exact dice set INPUT REQUIRED. Ember means forge or magma heat, not occult pact sulfur. |

### `pulp_kinetic_adventure`

| Component | Append-only recipe |
|---|---|
| Memorable-plate delta | light_event=hard backlight plus sparks; palette_pair=vermillion+sunlit-gold; composition_bias=diagonal motion with one readable hazard and one escape vector; append to Master Suffix |
| Template fit | INPUT REQUIRED: memorable_plate_style_guide.md absent |
| Why | Prioritize chase, leap, reveal, and narrow-escape layouts after template definitions are supplied. |
| Comic-lite camera | wide_action / low_angle_tracking |
| Gutter token | white_slash |
| Role preference | atmosphere_bg>panel_tile>frame_ornament |
| Negative prompt must-includes | no readable text; no letters or numbers; no dialogue balloons; no captions; no SFX glyphs; no logos; no watermarks; no UI; no HUD; no living-artist or studio imitation; no franchise lookalikes; no copyrighted character likeness; no extra factual entities not supplied by SceneManifest |
| Kid Mode visual rewrite | Keep speed, discovery, and near-misses; show theatrical defeat rather than injury and leave exits visually open. |
| Font/dice note | Use bold condensed title tokens only for HTML/SVG overlay and high-contrast dice; exact premium mapping INPUT REQUIRED. |

### `gothic_moonlit_dread`

| Component | Append-only recipe |
|---|---|
| Memorable-plate delta | light_event=single cold moon edge through interior shadow; palette_pair=wine-black+silver-blue; composition_bias=deep doorway or window frame with negative space and no confirmed hidden figure; append to Master Suffix |
| Template fit | INPUT REQUIRED: memorable_plate_style_guide.md absent |
| Why | Choose threshold, portrait-distance, or architectural-dread layouts only after definitions are supplied. |
| Comic-lite camera | locked_symmetry / slow_push_composition |
| Gutter token | wine_velvet |
| Role preference | frame_ornament>atmosphere_bg>panel_tile |
| Negative prompt must-includes | no readable text; no letters or numbers; no dialogue balloons; no captions; no SFX glyphs; no logos; no watermarks; no UI; no HUD; no living-artist or studio imitation; no franchise lookalikes; no copyrighted character likeness; no extra factual entities not supplied by SceneManifest |
| Kid Mode visual rewrite | Shift terror to theatrical mystery: moonlight, curtains, cobwebs, and curious shadows; remove blood, predatory intimacy, corpses, and trapped-child imagery. |
| Font/dice note | PROVIDED SUMMARY: flock velvet, moonlit edge, Wine Obsidian dice, and Grenze for titles only. Body text must remain a readable non-display face. |

### `litrpg_system_registrar`

| Component | Append-only recipe |
|---|---|
| Memorable-plate delta | light_event=phosphor glow on physical surfaces; palette_pair=near-black+phosphor-green; composition_bias=centered subject with empty overlay-safe margins, but pixels contain no interface; append to Master Suffix |
| Template fit | INPUT REQUIRED: memorable_plate_style_guide.md absent |
| Why | Select scan, threshold, or inventory-object layouts after template definitions are supplied. |
| Comic-lite camera | orthographic_medium / centered_scan |
| Gutter token | phosphor_hairline |
| Role preference | panel_tile>frame_ornament>atmosphere_bg |
| Negative prompt must-includes | no readable text; no letters or numbers; no dialogue balloons; no captions; no SFX glyphs; no logos; no watermarks; no UI; no HUD; no living-artist or studio imitation; no franchise lookalikes; no copyrighted character likeness; no extra factual entities not supplied by SceneManifest |
| Kid Mode visual rewrite | Keep simple glowing shapes and friendly scale; remove surveillance threat, body horror, and dense pseudo-data. |
| Font/dice note | Monospaced metrics in HTML/SVG only, with accessible body fallback; dice may use luminous edge but never unreadable numerals. Exact premium tokens INPUT REQUIRED. |

### `military_procedural`

| Component | Append-only recipe |
|---|---|
| Memorable-plate delta | light_event=worklight pools with clear sightlines; palette_pair=gunmetal+signal-amber; composition_bias=wide spatial read showing only supplied cover, exits, and present units; append to Master Suffix |
| Template fit | INPUT REQUIRED: memorable_plate_style_guide.md absent |
| Why | Choose briefing, objective, or formation layouts after template definitions are supplied. |
| Comic-lite camera | high_oblique / shoulder_recon |
| Gutter token | grid_hairline |
| Role preference | atmosphere_bg>panel_tile>frame_ornament |
| Negative prompt must-includes | no readable text; no letters or numbers; no dialogue balloons; no captions; no SFX glyphs; no logos; no watermarks; no UI; no HUD; no living-artist or studio imitation; no franchise lookalikes; no copyrighted character likeness; no extra factual entities not supplied by SceneManifest |
| Kid Mode visual rewrite | Reframe combat as rescue, scouting, or team mission; replace firearms and wounds with tools, signals, shields, and clear safe routes. |
| Font/dice note | Use compact utilitarian labels and high-contrast dice; no stencil text inside imagery. Exact pack choices INPUT REQUIRED. |

### `dry_wit_deadpan`

| Component | Append-only recipe |
|---|---|
| Memorable-plate delta | light_event=flat practical light interrupted by one absurdly precise highlight; palette_pair=dust-grey+acid-lime; composition_bias=static framing around an incongruous but supplied prop; append to Master Suffix |
| Template fit | INPUT REQUIRED: memorable_plate_style_guide.md absent |
| Why | Choose reaction, object, or aftermath layouts only after definitions are supplied. |
| Comic-lite camera | locked_medium / dead_center_wide |
| Gutter token | neutral_thin |
| Role preference | panel_tile>frame_ornament>atmosphere_bg |
| Negative prompt must-includes | no readable text; no letters or numbers; no dialogue balloons; no captions; no SFX glyphs; no logos; no watermarks; no UI; no HUD; no living-artist or studio imitation; no franchise lookalikes; no copyrighted character likeness; no extra factual entities not supplied by SceneManifest |
| Kid Mode visual rewrite | Use harmless visual mismatch and silly scale, never a child or player as the joke; keep hazards readable. |
| Font/dice note | Neutral readable type with one restrained accent; dice remain conventional. Exact premium mappings INPUT REQUIRED. |

### `warm_chronicle`

| Component | Append-only recipe |
|---|---|
| Memorable-plate delta | light_event=late-afternoon window or hearth rim; palette_pair=parchment-cream+chestnut; composition_bias=human-scale tableau with one memory-bearing supplied prop; append to Master Suffix |
| Template fit | INPUT REQUIRED: memorable_plate_style_guide.md absent |
| Why | Choose reunion, travel-rest, keepsake, or shared-table layouts after definitions are supplied. |
| Comic-lite camera | eye_level_tableau / gentle_wide |
| Gutter token | parchment_rule |
| Role preference | frame_ornament>panel_tile>atmosphere_bg |
| Negative prompt must-includes | no readable text; no letters or numbers; no dialogue balloons; no captions; no SFX glyphs; no logos; no watermarks; no UI; no HUD; no living-artist or studio imitation; no franchise lookalikes; no copyrighted character likeness; no extra factual entities not supplied by SceneManifest |
| Kid Mode visual rewrite | Increase clarity and companionship; remove grief-heavy symbols unless explicitly present and keep the route forward visible. |
| Font/dice note | Warm bookish body face with modest illuminated initial treatment in HTML/SVG; tactile neutral dice. Exact pack tokens INPUT REQUIRED. |

### `clinical_auditor`

| Component | Append-only recipe |
|---|---|
| Memorable-plate delta | light_event=cool diffuse inspection light; palette_pair=frosted-glass+graphite; composition_bias=orthogonal evidence layout with scale cues only when supplied; append to Master Suffix |
| Template fit | INPUT REQUIRED: memorable_plate_style_guide.md absent |
| Why | Choose evidence, specimen, or site-survey layouts after definitions are supplied. |
| Comic-lite camera | orthographic_close / top_down_evidence |
| Gutter token | glass_rule |
| Role preference | panel_tile>atmosphere_bg>frame_ornament |
| Negative prompt must-includes | no readable text; no letters or numbers; no dialogue balloons; no captions; no SFX glyphs; no logos; no watermarks; no UI; no HUD; no living-artist or studio imitation; no franchise lookalikes; no copyrighted character likeness; no extra factual entities not supplied by SceneManifest |
| Kid Mode visual rewrite | Turn forensic imagery into safe inspection and puzzle-solving; remove medical detail, body damage, and intimidating surveillance. |
| Font/dice note | Use neutral sans and tabular numerals in overlay; transparent or clear dice with high-contrast pips. Exact premium mapping INPUT REQUIRED. |

### `mythic_portent`

| Component | Append-only recipe |
|---|---|
| Memorable-plate delta | light_event=column of dawn or eclipse rim; palette_pair=deep-indigo+old-gold; composition_bias=low-angle monumental silhouette with no invented deity or omen-object; append to Master Suffix |
| Template fit | INPUT REQUIRED: memorable_plate_style_guide.md absent |
| Why | Choose arrival, vow, relic, or horizon-reveal layouts only after definitions are supplied. |
| Comic-lite camera | low_angle_wide / frontal_iconic |
| Gutter token | gold_rule |
| Role preference | frame_ornament>atmosphere_bg>panel_tile |
| Negative prompt must-includes | no readable text; no letters or numbers; no dialogue balloons; no captions; no SFX glyphs; no logos; no watermarks; no UI; no HUD; no living-artist or studio imitation; no franchise lookalikes; no copyrighted character likeness; no extra factual entities not supplied by SceneManifest |
| Kid Mode visual rewrite | Make scale wondrous rather than apocalyptic; replace judgment, sacrifice, and doom symbols with stars, dawn, and protective geometry. |
| Font/dice note | Use ceremonial display type only for overlay headings and accessible body text; luminous dice without sacred-symbol appropriation. Exact tokens INPUT REQUIRED. |

### `street_balladeer`

| Component | Append-only recipe |
|---|---|
| Memorable-plate delta | light_event=streetlamp or sign spill without readable signage; palette_pair=electric-cyan+brick-red; composition_bias=street-level diagonal with audience-space and one supplied focal act; append to Master Suffix |
| Template fit | INPUT REQUIRED: memorable_plate_style_guide.md absent |
| Why | Choose crowd-edge, performance, chase, or proclamation layouts after definitions are supplied. |
| Comic-lite camera | street_level_wide / moving_medium |
| Gutter token | torn_poster_edge |
| Role preference | atmosphere_bg>frame_ornament>panel_tile |
| Negative prompt must-includes | no readable text; no letters or numbers; no dialogue balloons; no captions; no SFX glyphs; no logos; no watermarks; no UI; no HUD; no living-artist or studio imitation; no franchise lookalikes; no copyrighted character likeness; no extra factual entities not supplied by SceneManifest |
| Kid Mode visual rewrite | Keep music, movement, and friendly crowds; remove adult nightlife cues, threatening gangs, and humiliating caricature. |
| Font/dice note | Use energetic display accents only in overlay, paired with plain body text; dice may be scuffed and high-contrast. Exact pack mapping INPUT REQUIRED. |

### `ashen_archivist`

| Component | Append-only recipe |
|---|---|
| Memorable-plate delta | light_event=grey skylight through dust; palette_pair=bone-white+ash-grey; composition_bias=layered shelves, fragments, or ruins with one verified object centered; append to Master Suffix |
| Template fit | INPUT REQUIRED: memorable_plate_style_guide.md absent |
| Why | Choose archive, relic, ruin, or aftermath layouts only after definitions are supplied. |
| Comic-lite camera | static_wide / macro_relic |
| Gutter token | ash_deckle |
| Role preference | frame_ornament>panel_tile>atmosphere_bg |
| Negative prompt must-includes | no readable text; no letters or numbers; no dialogue balloons; no captions; no SFX glyphs; no logos; no watermarks; no UI; no HUD; no living-artist or studio imitation; no franchise lookalikes; no copyrighted character likeness; no extra factual entities not supplied by SceneManifest |
| Kid Mode visual rewrite | Use dusty museum mystery, fossils, and old maps; remove corpses, exposed remains, nihilism, and death fixation. |
| Font/dice note | Use restrained archival serif and ash-neutral dice; no faux-inscription inside art. Exact premium tokens INPUT REQUIRED. |

### `bright_field_guide`

| Component | Append-only recipe |
|---|---|
| Memorable-plate delta | light_event=sunbeam, bioluminescent shaft, or clear reflected daylight; palette_pair=teal+coral; composition_bias=observable subject with environmental context and no invented taxonomic labels; append to Master Suffix |
| Template fit | INPUT REQUIRED: memorable_plate_style_guide.md absent |
| Why | Choose discovery, specimen-distance, route, or habitat layouts after definitions are supplied. |
| Comic-lite camera | macro_context / wide_observational |
| Gutter token | field_note_rule |
| Role preference | panel_tile>atmosphere_bg>frame_ornament |
| Negative prompt must-includes | no readable text; no letters or numbers; no dialogue balloons; no captions; no SFX glyphs; no logos; no watermarks; no UI; no HUD; no living-artist or studio imitation; no franchise lookalikes; no copyrighted character likeness; no extra factual entities not supplied by SceneManifest |
| Kid Mode visual rewrite | Favor friendly scale, obvious paths, and wonder; remove predation close-ups, drowning cues, and ambiguous poisonous contact. |
| Font/dice note | Use highly legible naturalist labels in overlay and bright high-contrast dice; exact premium mapping INPUT REQUIRED. |

### `noir_case_file`

| Component | Append-only recipe |
|---|---|
| Memorable-plate delta | light_event=venetian-blind slash or rain-reflected streetlight; palette_pair=charcoal+controlled-crimson; composition_bias=off-center clue with occluded depth but no invented suspect; append to Master Suffix |
| Template fit | INPUT REQUIRED: memorable_plate_style_guide.md absent |
| Why | Choose clue, threshold, interview, or city-exterior layouts after definitions are supplied. |
| Comic-lite camera | dutch_subtle / long_lens_street |
| Gutter token | black_crimson |
| Role preference | atmosphere_bg>frame_ornament>panel_tile |
| Negative prompt must-includes | no readable text; no letters or numbers; no dialogue balloons; no captions; no SFX glyphs; no logos; no watermarks; no UI; no HUD; no living-artist or studio imitation; no franchise lookalikes; no copyrighted character likeness; no extra factual entities not supplied by SceneManifest |
| Kid Mode visual rewrite | Shift from vice and violence to detective mystery; use rainy streets, footprints, and missing objects without weapons, blood, or predatory adults. |
| Font/dice note | Use condensed case headings only in overlay and sober body text; crimson accent must not reduce contrast. Exact premium mapping INPUT REQUIRED. |

### `fae_uncanny_tale`

| Component | Append-only recipe |
|---|---|
| Memorable-plate delta | light_event=impossible dapple or twilight refraction; palette_pair=pearl-green+violet; composition_bias=beautiful symmetry with one rule-breaking detail explicitly grounded in supplied props; append to Master Suffix |
| Template fit | INPUT REQUIRED: memorable_plate_style_guide.md absent |
| Why | Choose threshold, bargain, path, or mirrored-garden layouts after definitions are supplied. |
| Comic-lite camera | frontal_symmetry / overhead_maze |
| Gutter token | iridescent_vine |
| Role preference | frame_ornament>panel_tile>atmosphere_bg |
| Negative prompt must-includes | no readable text; no letters or numbers; no dialogue balloons; no captions; no SFX glyphs; no logos; no watermarks; no UI; no HUD; no living-artist or studio imitation; no franchise lookalikes; no copyrighted character likeness; no extra factual entities not supplied by SceneManifest |
| Kid Mode visual rewrite | Keep wonder and harmless mischief; make bargains literal and visible, remove abduction cues, body transformation, predatory beauty, and hidden costs. |
| Font/dice note | Use elegant readable display accents only for overlay; iridescent dice require high-contrast numerals. Exact premium mapping INPUT REQUIRED. |

### `hard_sf_terminal`

| Component | Append-only recipe |
|---|---|
| Memorable-plate delta | light_event=instrument glow and hard vacuum rim; palette_pair=graphite+diagnostic-cyan; composition_bias=orthogonal machinery and scale cues sourced strictly from SceneManifest; append to Master Suffix |
| Template fit | INPUT REQUIRED: memorable_plate_style_guide.md absent |
| Why | Choose scan, machinery, EVA, or anomaly layouts after definitions are supplied. |
| Comic-lite camera | orthographic_wide / helmet_pov |
| Gutter token | terminal_grid |
| Role preference | panel_tile>atmosphere_bg>frame_ornament |
| Negative prompt must-includes | no readable text; no letters or numbers; no dialogue balloons; no captions; no SFX glyphs; no logos; no watermarks; no UI; no HUD; no living-artist or studio imitation; no franchise lookalikes; no copyrighted character likeness; no extra factual entities not supplied by SceneManifest |
| Kid Mode visual rewrite | Use clear shapes, friendly robots, and safe mission-control stakes; remove body horror, decompression imagery, and dense unreadable instrumentation. |
| Font/dice note | Use monospaced telemetry only in HTML/SVG overlay with tabular numerals; dice retain clear physical numerals. Exact premium tokens INPUT REQUIRED. |

### `pyoa_branching_crisis`

| Component | Append-only recipe |
|---|---|
| Memorable-plate delta | light_event=single directional hazard light; palette_pair=storm-blue+signal-orange; composition_bias=first-person or shoulder view with only supplied routes and tools visible; append to Master Suffix |
| Template fit | INPUT REQUIRED: memorable_plate_style_guide.md absent |
| Why | Choose fork, timerless hazard, tool, or escape layouts after definitions are supplied. |
| Comic-lite camera | first_person / over_shoulder_route |
| Gutter token | choice_wedge |
| Role preference | panel_tile>atmosphere_bg>frame_ornament |
| Negative prompt must-includes | no readable text; no letters or numbers; no dialogue balloons; no captions; no SFX glyphs; no logos; no watermarks; no UI; no HUD; no living-artist or studio imitation; no franchise lookalikes; no copyrighted character likeness; no extra factual entities not supplied by SceneManifest |
| Kid Mode visual rewrite | Keep the decision urgent but not frightening; show safe distances, clear exits, and tools without injury or countdown pressure. |
| Font/dice note | Use direct, high-contrast action labels in overlay and conventional dice; exact pack mapping INPUT REQUIRED. |

### `kid_plain_stakes`

| Component | Append-only recipe |
|---|---|
| Memorable-plate delta | light_event=clear daylight or warm protective glow; palette_pair=sky-blue+sun-gold; composition_bias=readable foreground action, visible helper distance, and unobstructed safe route; append to Master Suffix |
| Template fit | INPUT REQUIRED: memorable_plate_style_guide.md absent |
| Why | Choose discovery, teamwork, safe-challenge, or return-home layouts after definitions are supplied. |
| Comic-lite camera | eye_level_clear / wide_safe_route |
| Gutter token | rounded_clean |
| Role preference | panel_tile>frame_ornament>atmosphere_bg |
| Negative prompt must-includes | no readable text; no letters or numbers; no dialogue balloons; no captions; no SFX glyphs; no logos; no watermarks; no UI; no HUD; no living-artist or studio imitation; no franchise lookalikes; no copyrighted character likeness; no extra factual entities not supplied by SceneManifest |
| Kid Mode visual rewrite | This is already the Kid layer: reject gore, adult romance, menace toward children, captivity, coercion, unreadable clutter, and false danger signals. |
| Font/dice note | Use open, highly legible body type and high-contrast friendly dice; no decorative face for core instructions. Exact pack mapping INPUT REQUIRED. |

## Master append contract

Each `plate_delta` is appended **after** the unavailable `memorable_plate_style_guide.md` Master Suffix. Until that source is supplied, do not flatten these deltas into standalone prompts and do not assign Templates 01–20. A production prompt builder should assemble `scene_facts + character_refs + base_style_suffix + tone_delta + global_negative`, then run a deterministic entity and lettering scrub before enqueueing.

## T3.3 Cost and eligibility honesty

OpenRouter documents model discovery, endpoint-specific capability records, and all-or-nothing image billing.[6] A live check on 2026-08-26 found `black-forest-labs/flux.2-klein-4b` at **$0.014 per output megapixel** and `black-forest-labs/flux.2-pro` at **$0.03 per output megapixel**, with each endpoint exposing one image per request. These are point-in-time public records, not a SynapticGM contract; runtime discovery is mandatory. The missing internal cost model means turn-frequency and monthly COGS cannot be verified.

| Tier | Proposed eligibility | Model policy | Suppression rules | Evidence status |
|---|---|---|---|---|
| Free | Sparse comic-lite; target approximately 20% of otherwise eligible memorable beats, never 20% of all turns. | PROVIDED SUMMARY: Klein 4B for comic-lite and icons. Runtime capability probe required. | Suppress thin turns, ambiguous presence, duplicate camera beat, cooldown, Kid skip, safety/repair, and queue pressure. | PROVIDED SUMMARY; exact COGS INPUT REQUIRED. |
| Mid | Memorable plates at chapter turns, major discoveries, boss introductions, and earned aftermath; no every-turn promise. | PROVIDED SUMMARY: Flux Pro when allowed; Klein fallback may be considered only by product config. | Same gates plus account budget and latency budget. | SPECULATIVE frequency; cost model INPUT REQUIRED. |
| High | More frequent memorable plates and optional later strip experiments, still asynchronous and gated. | Flux Pro where approved; never bind completion to the GM turn. | Same gates; no full comic treadmill. | SPECULATIVE frequency; cost model INPUT REQUIRED. |

### Eligibility decision order

The deterministic order is: **Kid skip → scene fact sufficiency → memorable-beat classifier → duplicate/cooldown gate → tier entitlement → budget/capacity → model capability → asynchronous enqueue**. If any gate fails, narration proceeds normally. The GM turn never waits for art, and a failed art job never rewrites or blocks StateTx.

A turn is too thin when it lacks a completed or revealed beat, has fewer than two stable visual anchors, or contains unresolved presence/location ambiguity. “Alone invent risk” means the prompt would need to fabricate an actor, prop, architecture, or effect to form a coherent frame. In that case, suppress art rather than embellish.

## References

[6]: https://openrouter.ai/docs/guides/overview/multimodal/image-generation "Image Generation — OpenRouter Documentation"
