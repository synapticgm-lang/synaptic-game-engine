# Manus score-boost package (post-28c) — ingest

**Source zip:** `How to Complete Upgrade Run2_.zip` (John upload 2026-08-27)  
**Extracted:** `docs/research/pasted/manus-score-boost-2026-08-27/`  
**Prefix:** `SynapticGM_score_boost_post_28c_2026-08-27_*`  
**Executive summary (repo):** `docs/research/manus-score-boost-ingest-2026-08-27.md`

## Deliverable inventory

| ID | File | Role |
|---|---|---|
| T01 | `…_T01_executive_summary.md` | Why 28c didn’t move Gemini; 29a thesis (terminal authority) |
| T02 | `…_T02_encounter_terminal_fsm.md` (+ `.mmd` / `.png`) | Encounter FSM: idle→engaged→resolving→terminal; caps; receipts |
| T03 | `…_T03_entity_scrub_constitution.md` | Allowlist constitution; forbidden generic replacements |
| T04 | `…_T04_choice_compiler_encounter_lock.md` + edge CSV | Encounter-aware ChoiceCompiler pad lock |
| T05 | `…_T05_status_leak_firewall.md` | STATUS prompt-leak firewall (GM_VOICE / PYOA / RenderFallback…) |
| T06 | `…_T06_topic_and_pyoa_branch_enforcement.md` | NPC topic commit + PYOA `branchLocked` |
| T07 | `…_T07_free_t12_hook_contract.md` | Free T12 durable delta OR; spawn-purgatory fail at T15 |
| T08 | `…_T08_ranked_implementation_backlog.md` + CSV | Shipping plan SGM29A-001…017 |
| T09 | `…_T09_score_ceiling_model.md` | Honest band 4.5–6.5 worst cells; not 8/10 |
| T10 | `…_T10_eval_harness_gates.schema.json` | Eval gate schema |
| T11 | `…_T11_unknowns_and_evidence_requests.md` | Missing transcripts / path mapping |
| T12 | `…_T12_what_not_to_do.md` | Anti-patterns (scrub-only, Mid writer first, second LLM critic) |
| COMPLETE | `…_COMPLETE.md` | Bundle wrap-up |
| Packets | `01_`–`06_*.md`, `synthesize_29a_architecture_packets.json` | Architecture packets |
| Tools | `validate_bundle.py`, `package_release.py`, `test_eval_schema_fixtures.py` | Bundle validation |
| Nested | `…_BUNDLE.zip` | Same package nested |

## Thesis (one line)

> GM may narrate; only code may decide, commit, and prove `encounterCleared` / `branchLocked`.

## Mapping to live owners

| Manus surface | Repo owner |
|---|---|
| EncounterTerminalFsm | `encounterTerminalFsm.ts` + `ActiveEncounter` + `arcDirector` / `useGame` / `fateAutoplay` |
| ChoiceCompiler lock | `choiceCompiler.ts`, `choiceEdge.ts` |
| Entity scrub constitution | `typedEntityValidator.ts`, `narrativeScrub.ts`, `proseWarden.ts` |
| STATUS firewall | `statusFirewall.ts` → `systemLog.ts` / sealed fallback |
| npcTopicFsm / pyoaBranchLedger | existing modules (commit hardening) |
| Eval gates | `evalHarness.ts` |
