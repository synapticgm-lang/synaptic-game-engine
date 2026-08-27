# Manus mega research pack ingest — 2026-08-26

**Source zip (Downloads):** `c:\Users\littl\Downloads\Maximize Completion of Uploaded File Content.zip` (~1.0 MB, modified 2026-08-26 08:14)  
**Copied unchanged to:** `docs/research/pasted/mega-research-pack-manus-2026-08-26.zip`  
**Unpacked outer:** `docs/research/pasted/mega-research-pack-manus-2026-08-26/`  
**Canonical nested pack:** `docs/research/pasted/mega-research-pack-manus-2026-08-26/unpacked/SynapticGM_mega_research_pack_2026-08-25/`  
**Nested zip (also kept):** `…/mega-research-pack-manus-2026-08-26/SynapticGM_mega_research_pack_2026-08-25.zip` (~506 KB)  
**Prompt (verbatim in pack):** `pasted_content.txt` — SynapticGM MEGA RESEARCH PACK (assets + licenses + build gaps), prefix `SynapticGM_mega_research_pack_2026-08-25`  
**Wiring:** none — research ingest only (no `src/`, no commit)  
**Ignored lanes:** WOF / hybrid-climate (none present as deliverables)

## Verdict

This **is** the MEGA RESEARCH PACK (Parts A–C + packaging), not a different Manus job. Outer “Maximize Completion” folder is a **partial mirror + Manus chrome**; treat the **nested unpacked tree** as the source of truth.

| Score | Value |
| --- | --- |
| Identity match | MEGA RESEARCH PACK — confirmed via README + `pasted_content.txt` |
| Completeness vs prompt Parts A–D | **~95%** (all substantive A–C targets hit; Part D missing dedicated `gaps.md` / `sources.md`) |
| Internal validator | `validate_pack.py` → **PASS 674 / 0 fail** (re-run locally) |
| Pirate / binary image dump | **None** — index + metadata + prompts only |
| Licensed-series / WOF in GM-ready banks | **Clean** (WOF names appear only as banned-term lists in `validate_pack.py`) |
| Safe for later wiring | **Yes, as filtered research fuel** — not legal clearance, not shipped assets |

## Packaging note (important)

| Layer | What it is |
| --- | --- |
| Outer zip | Manus completion wrapper. Renames some files (`SynapticGM Counsel Outline.md`, `Free Cost Envelope - Methodology…`, `Validation Report.md`). **Missing** many primaries: `claim_pattern_bank.csv`, `visible_moat_copy.csv`, `opener_pointer_examples.md`, `free_cost_envelope.csv`, `item_icon_prompts.csv`, `audit_tracker.csv`, etc. Includes unrelated Manus `SKILL.md` (ImageGen routing) + `.safety_warning.md`. |
| Nested zip / `unpacked/…` | Full deliverable set (69 files). **Use this path for all future Cursor jobs.** |

## File list (canonical nested pack)

### Primary deliverables

| File | Role | Count / note |
| --- | --- | --- |
| `README.md` | Pack map + Cursor import order | Same body as outer `SynapticGM Mega Research Pack.md` |
| `research_manifest.md` | Planned Part A–D map + labels | |
| `asset_index.csv` | Part A YES-commercial index | **31** rows, all `commercial_use=YES`, `share_alike=NO` |
| `intake_checklist.md` | Part A founder intake | |
| `DO_NOT_USE.md` | Part A exclusions | |
| `share_alike_counsel_risk.csv` | Part A SA isolation | **1** row (OpenMoji CC-BY-SA → EXCLUDE default) |
| `theme_prompts.csv` | Part B | **66** = 22 kits × `panel_tile` / `frame_ornament` / `atmosphere_bg` |
| `item_icon_prompts.csv` | Part B | **40** |
| `memorable_plate_style_guide.md` | Part B | **20** scene templates |
| `map_chrome_prompts.md` | Part B | 24 prompts (pack claim) |
| `claim_pattern_bank.csv` | C1 | **12** claim types (exact prompt set) |
| `adversarial_almost_false.csv` | C1 | **40** |
| `visible_moat_copy.csv` | C2 | **120** (`allowed=YES` 112, `NO` 8 never-lines) |
| `opener_pointer_examples.md` | C3 | **9** families × **8** examples = **72** (floor of 8–12 asked) |
| `skill_growth_patterns.md` | C4 | 3 engines + 10 names each + FOUNDER-ONLY boundary |
| `free_cost_envelope.csv` | C5 | **27** Free scenarios |
| `cost_levers.csv` | C5 | **13** |
| `player_facing_cap_copy.csv` | C5 | **33** |
| `p0_trust_list.md` | C5 | |
| `cost_methodology.md` | C5 | Dated OpenRouter + fee + FX |
| `hook_plus_8_sensitivity.csv` | C5 | **3** |
| `model_price_reference.csv` | C5 | Free DeepSeek flash / Mid Haiku / High Sonnet (2026-08-25) |
| `counsel_outline.md` | C6 | Solicitor Qs + data-class table (not legal advice) |
| `public_claim_register.csv` | C6 | **35** (prompt name was `claim_register.csv`) |
| `screenshot_audit_playbook.md` | C7 | (prompt name was `screenshot_audit_protocol.md`) |
| `audit_tracker.csv` | C7 | **72** rows, all `NOT RUN` (36 desktop + 36 mobile) |
| `qa_report.md` / `file_manifest.csv` / `validate_pack.py` | Integrity | SHA-256 manifest |

### Support / reproducibility (not player-facing)

- `build_*.py`, `make_builders_portable.py` (outer only), `source_drafts/*.json`
- `research_notes_*.md`, `research_log_2026-08-25.md`
- ambientCG / Poly Haven catalog JSON + shortlist TSV (metadata only — **no texture binaries**)
- `cost_summary_base.csv`

### Outer-only noise (do not treat as SynapticGM product docs)

- `SKILL.md` — Manus ImageGen skill boilerplate  
- `.safety_warning.md` — Manus session safety protocol  
- Incomplete renamed duplicates of nested files  

## Completeness vs prompt Parts A–D

| Part | Expected | Status |
| --- | --- | --- |
| **A** License-first index + intake + DO_NOT_USE | CSV columns match; YES commercial; no pirate dump | **PASS** — 31 YES; SA isolated; Kenney/ambientCG/Poly Haven/Phosphor-style sources |
| **B** Theme / icon / memorable / map prompts | 22 kits × 3; 40 icons; 20 plates; map chrome | **PASS** |
| **C1** Claim bank + 40 adversarial | 12 types listed in prompt | **PASS** |
| **C2** Visible moat copy | Status / Why / repair / provenance / never-lines | **PASS** (120 rows incl. Kid + `allowed` filter) |
| **C3** Opener examples | 8–12 per 9 families | **PASS at floor** (8 each = 72) |
| **C4** Skill growth patterns | 3 engines, fields, UI, Kid, 10 names each | **PASS** — no series titles in engines |
| **C5** Free cost + levers + cap copy + P0 trust | Live catalog IDs; 100/1k/10k × 20/40/80 | **PASS** (SPECULATIVE tokens; telemetry still INPUT REQUIRED) |
| **C6** Counsel + claim register | Outline + register | **PASS** (filename `public_claim_register.csv`) |
| **C7** Screenshot protocol | Desktop+mobile filenames; no invented UI shots | **PASS** as playbook + tracker (all NOT RUN) |
| **D** README + all CSVs/md + gaps + sources; no image zip | | **MOSTLY** — README + files OK; **`gaps.md` MISSING**; **`sources.md` MISSING** (notes + citations partially cover) |

**Completeness: ~95%.** Empty-section failure mode avoided. Packaging gaps are documentation hygiene, not missing banks.

## Quality check details

### Part A — licenses

- Index is **URLs + licence facts**, not a third-party PNG archive.  
- All 31 default rows: `commercial_use=YES`, `share_alike=NO`.  
- OpenMoji CC-BY-SA parked only in `share_alike_counsel_risk.csv` with `EXCLUDE from default YES-commercial list`.  
- `DO_NOT_USE.md` covers WoW UI, AID/NovelAI chrome, Pinterest/ArtStation scrape, Humble-without-proof, CC-BY-NC, SA-default, etc.  
- `intake_checklist.md` present for hash / provenance / trademark diligence before any download.

### Part B — prompts

- Theme roles match live kit keys from the prompt (integration-blue skipped).  
- Memorable guide: ink-and-watercolour, adult viewpoint default, Template 01–20.  
- No image binaries under the pack tree.

### Part C — building fuel

- Claim types exact match prompt list (object_in_hand … invented_title_or_rank).  
- Visible moat groups: status_chip 30, why_line 20, repair_banner 40, correction_confirmation 10, quest_provenance 12, never_line 8.  
- Cost model uses **current** Free writer `deepseek/deepseek-v4-flash-0731`, Mid Haiku 4.5, High Sonnet 4.6 (lookup date 2026-08-25).  
- Audit honesty preserved: zero fabricated screenshots.

### Contamination

| Check | Result |
| --- | --- |
| Solo Leveling / Shield Hero / Wandering Inn / MVS / SAO / DCC / ORV / ToG / Fable / Albion / Ghibli / Marvel in GM banks | **No hits** |
| WOF names (Ash Compact, Hearthborn, Lanternfolk, …) in injectable banks | **No hits** |
| WOF / series strings in `validate_pack.py` | Present as **forbidden-term scanner lists** only — correct |
| NovelAI / WoW | Only in `DO_NOT_USE.md` (exclusion) |
| Hybrid-climate / SELV cassette dump | **Absent** |
| Outer `SKILL.md` | Manus ImageGen contamination — ignore |

### Gaps vs prompt / README claims

1. **`gaps.md` / `sources.md`** — listed in manifest + referenced by `DO_NOT_USE` escalation; not delivered as standalone files.  
2. **Opener depth** — 8/family not 12; still within “8–12” and matches pack’s “72 examples” claim.  
3. **Filename aliases** — `counsel_outline` / `public_claim_register` / `screenshot_audit_playbook` vs prompt names (content present).  
4. **Outer zip incompleteness** — easy to wire the wrong folder if someone ignores nested unpack.  
5. **Cost / counsel** — still SPECULATIVE / INPUT REQUIRED for telemetry, VAT, contracts; validator PASS ≠ legal approval.  
6. **`DO_NOT_USE` → gaps.md** — escalation path points at a missing file.

## Recommended next Cursor jobs (do not auto-start)

Prefer work against `unpacked/SynapticGM_mega_research_pack_2026-08-25/`.

| Priority | Job | Why |
| ---: | --- | --- |
| 1 | **Generate theme materials from `theme_prompts.csv`** (review before ship) | Highest leverage visual fuel; already matches live kit keys |
| 2 | **Filter-wire `claim_pattern_bank` + `adversarial_almost_false` into existing regex / proseWarden path** | C1 is built for shipped hard-gate architecture — no second LLM |
| 3 | **Import `visible_moat_copy` + `player_facing_cap_copy` with `allowed=YES` + Kid filters** | Exact player strings; never-lines are fixtures |
| 4 | **Item icons from `item_icon_prompts.csv` / map chrome prompts** | Optional polish after themes |
| 5 | **Hand `counsel_outline.md` + `public_claim_register.csv` to counsel** | Ops/legal — not a code wire |
| 6 | **John runs `screenshot_audit_playbook` + fills `audit_tracker.csv`** | All rows NOT RUN; needs live staging shots |
| 7 | **Skill engines (`skill_growth_patterns.md`)** | Product feature work — larger than a prompt bank scrub |
| — | Skip wiring outer incomplete folder / ImageGen `SKILL.md` | Contamination / missing files |

## Founder summary (one screen)

Manus returned the requested **Mega Research Pack** (2026-08-25). Canonical tree is the **nested unpack** (~95% complete). Part A is a clean commercial index (no pirate images). Parts B–C banks are present at target counts; validator PASS. Contamination in GM-ready columns is clean. Missing only packaging `gaps.md`/`sources.md`. **Safe as later wiring fuel with filters; not cleared for blind paste into prompts without `allowed`/Kid/`FOUNDER-ONLY` gates.** Best first Cursor job: generate + review themes from `theme_prompts.csv`, then scrub claim bank into the existing warden path.
