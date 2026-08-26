# Manus ingest — Story Tones × GM Personality Maximizer (2026-08-26)

**Source zip:** `docs/research/pasted/how-to-maximize-task-completion-2026-08-26.zip`  
**Unpacked:** `docs/research/pasted/how-to-maximize-task-completion-2026-08-26/`  
**Canonical deliverables:** nested `…_deliverables.zip` → `deliverables/deliverables/`  
**Product stamp target:** `2026-08-26m`

## What this pack is

Implementation-ready omnibus for **story tone / narrator personality** applied through existing SynapticGM levers (`gmVoiceProfile`, `fluidProseRails`, status/repair chrome, never-lines, vitest fixtures). Personality is a **rendering contract only** — never ledger, dice, HP, inventory, presence, or quests.

## Launch portfolio (executive scorecard)

Strongest immediate release set:

| Tone / voice | Maps to shipped ID | Free | Notes |
|---|---|---|---|
| LitRPG System Registrar | `cold-system` | Launch | Classic Status chrome |
| Military / Field Procedural | `army-brief` | Launch | Situation → options |
| Dry Wit / Deadpan | `dry-wit` | Launch | Hard humor gates; never player-humiliation |
| Cozy Brutal | `cozy-brutal` | Launch | Featured LitRPG story diction |
| Hearthside / Cozy comfort | `fireside-innkeep` / `chilled-gm` | Launch | Tabletop + warm chronicle |
| Warm Chronicle | `fireside-innkeep` | Launch (rail) | Memory only if pinned |
| Bright Field Guide | `chilled-gm` | Launch (rail) | Discovery / Kid-friendly |
| PYOA Branching Crisis | `army-brief` | Launch for `pyoa` | Spatial, no false timers |
| Kid Plain Stakes | layer on `chilled-gm` | Mandatory layer | Not a shop genre |

**Later / Expert (not primary New Game shop):** grimdark, pulp, gothic, clinical auditor, mythic portent, street balladeer, ashen archivist, noir, fae uncanny, hard-SF terminal.

**No-Go:** Continuity-Warden second LLM critic; living-author clone banks; tone-driven combat/economy; full every-turn comic; folk accent-mockery; RAG as tone authority.

## New Game Simple picks (Part T2 / D2)

| Surface | Four Simple picks | Demote / Featured |
|---|---|---|
| **Narrator** (tabletop / RPG) | `chilled-gm` Friendly Guide; `dry-wit` Dry Wit; `army-brief` Mission Lead; `fireside-innkeep` Fireside Chronicler | `theatrical-jester` → More styles / Expert; old saves OK |
| **System chrome** (LitRPG) | `cold-system` Cold Registrar; `dry-wit` Sarcastic Patch; `army-brief` Army Quartermaster; `chilled-gm` Friendly System | `cozy-brutal` → Featured Tone + Expert; `theatrical-jester` valid on old saves only |

## P0 board (ship)

- P0-01 Tone preset registry on shipped IDs  
- P0-02 Renderer firewall header on fluid rails  
- P0-03 Tone→shipped-ID map for New Game  
- P0-04 Ledger-honest STATUS chrome variants (prompt rail hints)  
- P0-05 Deterministic never-lines in voice rails (no second LLM)  
- P0-06 Vitest personality ids + rail presence  
- P0-07 Non-binding theme suggestion chips  
- P0-08 Preserve Theatrical System on old saves  

## Theme suggestions (non-binding; pack matrix)

| Personality | Suggested kit key |
|---|---|
| `cold-system` | `phosphor-terminal` |
| `army-brief` | `dwarf-forgehall` |
| `dry-wit` | `goblin-scrapheap` |
| `chilled-gm` | `merfolk-abyss` / wood-elf for cozy |
| `fireside-innkeep` | `parchment-ledger` |
| `cozy-brutal` | `orc-warcamp` |
| `theatrical-jester` | (Expert) `neon-protocol` |

## Residual / deferred

- Full Expert tone catalogue + `tone_id` schema field (P1)  
- Memorable template IDs (style guide INPUT REQUIRED)  
- Choice-pad banks × Mode DNA (P1 adapter)  
- Blind taste protocol (research ops)  
- Comic-lite mood tokens / audio-lite / commerce bundles (P2 / No-Go near-term)

## Key files read

- `…_executive_scorecard.md`  
- `…_Part_T1_tone_catalogue.md`  
- `…_Part_T2_GM_application.md`  
- `…_Part_T6_scorecard_founder_decisions.md`  
- `…_p0_p1_p2_implementation_board.md`  
- `…_tone_to_gm_rails.csv`  
- `…_tone_fluid_rail_snippets.md`  
- `…_tone_status_chrome_templates.json`  
- `…_tone_never_lines.csv`  
- `…_tone_theme_image_matrix.csv`
