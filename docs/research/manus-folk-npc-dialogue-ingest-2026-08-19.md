# Folk / NPC dialogue expectations — Manus ingest (2026-08-19)

**Source zip:** `Developing Authentic NPC Dialogue for Fantasy and Sci-Fi.zip`  
**Saved:** `docs/research/pasted/folk-npc-dialogue-manus-2026-08-19/`  
**Prompt answered:** `docs/research/RESEARCH-PROMPT-folk-voice-expectations-manus-2026-08-19.md`

## Verdict

Clean SynapticGM-only package. **No WOF / MMO / hybrid-climate contamination.** Public-domain folklore umbrellas + six original LitRPG folk; IP anti-list is strong. Ready to deepen the live rail.

## What was in the zip

| Deliverable | File(s) | Notes |
|---|---|---|
| P1 expectation matrix | `P1_expectation_matrix.md` | 18 profiles (12 umbrella + Ledgerborn, Mycelials, Ashkin, Glassborn, Tidebound, Woven) |
| P2 cross-folk | `P2_cross_folk_interaction.md` | Earned elf↔dwarf; orc↔human procedure; vampire threshold as campaign etiquette; goblin bargain patterns; beastfolk sensory consent |
| P3 schema + contract | `P3_folk_voice_profile.schema.json`, `P3_programming_contract.md` | Strict `FolkVoiceProfile`, precedence chain, state firewall, prompt template |
| P3 eval fixtures | `P3_eval_fixtures.json` | 20 pass/fail scenes (incl. “Elf merchant refuses haste”) |
| P4 dialogue bank | `P4_dialogue_beats.csv` | 80 beats tagged folk × act (ask/refuse/bargain/insult/thank) |
| P4 rewrite bank | `P4_stereotype_rewrite_pairs.md` | 40 stereotype → individual pairs |
| P5 anti-list | `P5_anti_list.md` | Release-blocking bans (accents, essentialism, Kid Mode, IP, state) |
| Research notes | `research_notes.md` | Folklore cites + design consequences |
| Validators | `validate_p3.py`, `validate_p4.py` | Structural count checks |

Duplicate pretty-named `.md` copies and an inner `…_package.zip` are present; use the `P*_` prefixed files as the stable set.

## Applied to live code

| Research | Code |
|---|---|
| P1 richer banks (18 folk) | Expanded `src/game/folkVoiceExpectations.ts` — cadence, metaphor, expect, kid, never |
| P2 cross-folk (compact) | Injected when 2+ matching folk are detected |
| P3/P5 product law + anti-list | Global never block + precedence line in prompt |
| Kid Mode transforms | `formatFolkVoiceForPrompt(state, { kidMode })` from `systemPrompt.ts` |
| Detection hygiene | Word-boundary label match (no `self` → `elf`); dropped `dragonborn` / `hobbit-folk` labels |
| Tests | Extended `fluidChatEval.test.ts` folk suite |
| Edge sync | `node scripts/sync-gm-edge-shared.mjs` (same FILES list; module already listed) |

**Not pasted wholesale into the prompt:** full 80-beat CSV, 40 rewrite pairs, JSON schema, 20 LLM fixtures — kept as research corpus (token budget / presentation-only).

## Still research-only (optional later)

- Wire selected P4 beats as few-shot examples for high-stakes NPC turns
- CI harness for all 20 P3 fixtures (needs LLM or structured rubric runner)
- Full P3 schema validation of exported profile JSON
- CampaignContract flags (`folkVoiceEnabled`, `vampireThresholdEtiquette`) if/when contract surface grows
- Soft keyword scoring from the programming contract (rejected for now — too many false positives)

## Product law (unchanged, reinforced)

Folk flavour = diction + social instinct only. Never changes ledger, stats, permits, kit, prices, or quest eligibility. Named NPC memory and CampaignContract win.
