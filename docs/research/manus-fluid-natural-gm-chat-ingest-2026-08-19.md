# Fluid natural GM chat — Manus ingest (2026-08-19)

**Source zip:** `New Research Project Completion Plan.zip` → saved under `docs/research/pasted/fluid-natural-gm-chat-manus-2026-08-19/` (nested maxextract in `unpacked/full/`).

## Race / folk personalities?

**Not in this package.** Manus covered chat fluidity, speech acts, prose rails, streaming, audiobook cadence, repair — not “how elves vs dwarves talk.”

**Filled in code for now:** `src/game/folkVoiceExpectations.ts` — public-domain folklore expectations (elf, dwarf, orc, goblin, halfling, beastfolk, dragonfolk, vampire, ghost, troll, merfolk, human) injected into the system prompt when those folk appear in appearance/bio/NPC memory/log. Individuals + memory override stereotypes; no licensed IP.

**Optional next Manus prompt:** `docs/research/RESEARCH-PROMPT-folk-voice-expectations-manus-2026-08-19.md` for deeper banks (regional variants, cross-folk friction, Kid Mode).

## Applied to live game (response feel)

| Research | Code |
|---|---|
| F4 prose rails / constitution | `fluidProseRails.ts` + systemPrompt wire |
| F5 speech acts | `speechActRails.ts` |
| Folk gap (John ask) | `folkVoiceExpectations.ts` |
| Anti “What do you do?” spam | Softened BASE_PROMPT / complete-response rules |
| F6 repair CSV | `repairCopyBank.ts` + `repairEngine.ts` + CenterPanel banner + useGame hold/resolve |
| F9 post-commit stream | `streamReveal.ts` — status chrome + sentence reveal after StateTx (no raw pre-commit tokens) |
| F11 eval fixtures | `src/game/__fixtures__/fluidChatEvalFixtures.json` + `fluidChatEval.test.ts` (vitest) |

## Settings

- **Show full GM reply at once** (`preferFullResponse`) — Settings → Narrative; skips sentence reveal.

## Key files in pack

`unpacked/full/00_executive_fluid_gm_constitution.md`, `F3_turn_protocol_spec.md`, `F4_prose_rails.json`, `F5_speech_acts.md`, `F9_streaming_decision_memo.md`, `F12_backlog_and_anti_list.md`
