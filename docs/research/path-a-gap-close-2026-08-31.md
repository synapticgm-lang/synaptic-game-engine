# Path A gap close — 2026-08-31h

**Stamp:** HUD `2026-08-31h` / BUILD `2026-08-31a`  
**Mid writer:** OFF  
**Auth:** John “close all gaps” + approved enforcement crossref.

Implements ranked P0/P1 owners from `docs/research/enforcement-crossref-2026-08-31.md` §5 — ledger-first, no Continuity-Warden LLM, no WOF.

| Rank | Owner | Module(s) | What landed | Residual |
|---:|---|---|---|---|
| P0-1 | Visible-foe / drought preface | `combatAuthority`, `arcDirector`, `useGame`, `fateAutoplay` | Drought/arc spawn sets `sceneFacts.pendingSpawnPreface` when foe not in present/last GM; `ensureEncounterSpawnPreface` prepends a visible spawn line before combat prose | Density/cooldown can still defer spawn; Flash Lite may ignore SPAWN mandate until preface scrub runs |
| P0-2 | Pad-from-intent + encounter filter | `choiceCompiler`, `playTranscript.resolveOfferedChoices` | Live encounter drops Look around / Examine the room; demand/flee drop room stalls; named chest/crate/door/panel pads when in props/lastBeat | Legal-edge banks can still be thin; invent-context filter still last-GM-only |
| P0-3 | Opening `stripChoiceList` | `parser` | Expanded choice verbs (`Get`/`Find`/…); strips mid-body + trailing numbered offers including stitch “1. Get your bearings” | Extremely novel verb forms may still slip |
| P0-4 | PYOA lock → pad eligibility | `pyoaBranchLedger.eligiblePyoaPadsAfterLock`, `choiceCompiler` | After lock: no Wait / Buy time / Call for help; reopen of opposite locked path dropped | Endings still unproven; Flash Lite can paraphrase delay outside pad labels |
| P1-5 | Inspect exhaustion → pads | `choiceCompiler` + discovery / `searchedEmpty` | Hard drop Examine-same / sift / room pads when ledger or empty-search exhausted | Only when discovery ledger / searchedEmpty already stamped |
| P1-6 | NPC tactic → pads | `npcTopicFsm.presentNpcForPads`, `choiceCompiler` | After topic suite / topicCommits: drop first-speech lecture chips; supplement leverage / change subject | Prose tactic change still SOFT CRAFT |
| P1-7 | Free T12 telemetry | `freeT12Hook.recordT12HookReceipt`, `arcDirector`, `playTranscript` | `arcDirector.t12HookReceipt` on commit ≥T12; Download play meta line | Product Free retention telemetry by turn band still open |
| P1-8 | Intent demand ack | `intentContract` | `demand` obligation; atmosphere-only without send-back/leave ack fails coverage → existing retry path | Soft length/false-negative still preferred; one retry only |

**Also:** scout/look-around no longer commits `sp-beat-hear-reason` or pays social talk XP on contradicted why (31c residual). Map L/R thumbs: no clear code owner — skipped.

**Vitest:** `src/game/playtest31hGapClose.test.ts`  
**Edge sync:** `combatAuthority` + `sceneFacts` + `types` via `scripts/sync-gm-edge-shared.mjs` (client pad/arc owners stay client-side).
