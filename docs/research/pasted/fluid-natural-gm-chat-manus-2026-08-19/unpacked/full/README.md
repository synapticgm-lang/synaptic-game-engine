# SynapticGM — Fluid, Natural GM Chat: Research & Implementation Package

**Package ID:** `SynapticGM_fluid_natural_gm_chat_maxextract_2026-08-19`  
**Prepared:** 2026-08-19  
**Scope:** Live SynapticGM only. This package extends the specified ledger-first architecture; it does not propose a separate engine, MMO redesign, patent strategy, hybrid climate system, or player-facing licensed-series content.

## How to read this package

Start with the **Fluid GM Chat Constitution** and then the **Turn Protocol**. The Constitution establishes non-negotiable feel and authority laws; the protocol makes them programming-ready. The content and evaluation files then turn those rules into renderer rails, copy, fixtures, and a focused implementation backlog.

> **Evidence convention:** **VERIFIED PUBLIC MECHANISM** identifies a publicly documented mechanism or research finding. **SPECULATIVE TRANSFER** identifies a SynapticGM design proposal. **COUNSEL** flags an item for legal, trust-and-safety, accessibility, or child-safety review. The shared source register is [citations.md](citations.md).

## Deliverables

| Part | File | What it contains |
|---|---|---|
| Root | [00_executive_fluid_gm_constitution.md](00_executive_fluid_gm_constitution.md) | F1: non-negotiable fluid GM chat laws, measurable definition, release gate. |
| F2 | [F2_interaction_feel_teardown.md](F2_interaction_feel_teardown.md) | 12-product/domain interaction-feel teardown; steal/refuse decisions. |
| F3 | [F3_turn_protocol_spec.md](F3_turn_protocol_spec.md) | Input taxonomy, obligation coverage, adjudication/render pipeline, receipts, streaming, errors, sequence diagram, TypeScript-ish interfaces. |
| F3 | [turn_pipeline.mermaid](turn_pipeline.mermaid) | Standalone Mermaid source for the committed-turn sequence. |
| F4 | [F4_prose_rails.json](F4_prose_rails.json) | Machine-readable prose rails, warden rules, templates, and length bands. |
| F4 | [F4_prose_good_bad.md](F4_prose_good_bad.md) | 32 original Good / Bad / Why cases. |
| F5 | [F5_speech_acts.md](F5_speech_acts.md) | Full social-fluidity speech-act catalog and receipt policy. |
| F5 | [speech_acts.json](speech_acts.json) | Machine-readable runtime speech-act catalog. |
| F6 | [F6_repair_clarification_ux.md](F6_repair_clarification_ux.md) | Repair state machine, silent-inference criteria, and UX policy. |
| F6 | [F6_repair_copy_bank.csv](F6_repair_copy_bank.csv) | 144 engine × personality × situation repair lines. |
| F7 | [F7_voice_cadence.md](F7_voice_cadence.md) | 10 renderer-only voice profiles, cadence, TTS notes, blind A/B protocol. |
| F8 | [F8_audiobook_tts_writing.md](F8_audiobook_tts_writing.md) | Speakable prose rails and future text-parity TTS pilot spec. |
| F9 | [F9_streaming_decision_memo.md](F9_streaming_decision_memo.md) | Closed-beta decision: guarded post-commit streaming. |
| F10 | [F10_session_story_feel.md](F10_session_story_feel.md) | First-hour beat sheets, long-session and return-from-save rules, callback budgets. |
| F11 | [F11_eval_harness.md](F11_eval_harness.md) | Human / automated evaluation design and scoring rubric. |
| F11 | [F11_fluid_chat_eval_fixtures.json](F11_fluid_chat_eval_fixtures.json) | 44 pass/fail fixtures. |
| F11 | [F11_human_scoring_template.csv](F11_human_scoring_template.csv) | Blank per-fixture rater sheet. |
| F12 | [F12_backlog_and_anti_list.md](F12_backlog_and_anti_list.md) | P0/P1/P2 work, vibe done-when tests, and continuity/cost anti-list. |
| F13 | [F13_content_banks.md](F13_content_banks.md) | Original GM skeletons, repair lines, System notices, rewrites, and 20 opening replies. |
| F14 | [F14_checklist_and_7_day_plan.md](F14_checklist_and_7_day_plan.md) | Code-now/playtest/counsel checklist and a seven-day founder plan. |
| Research | [citations.md](citations.md) | Shared public source register and evidence-label definitions. |
| Research | [synapticgm_fluid_chat_research.json](synapticgm_fluid_chat_research.json) | Machine-readable strategic summary. |
| Research | [research/domain_research_packets.md](research/domain_research_packets.md) | Eight required domain packets; each includes source list, verified mechanisms, speculative transfers, and Copy / Avoid / Beat table. |
| Research | [research/eight_domain_research.json](research/eight_domain_research.json) | Raw structured research synthesis by domain. |
| Research | [research/eight_domain_research.csv](research/eight_domain_research.csv) | Same domain research in analysis-friendly CSV. |
| Build | [build_core_package.py](build_core_package.py) | Reproducible generator for core Markdown files. |
| Build | [build_artifacts.py](build_artifacts.py) | Reproducible generator for structured assets and content banks. |

## Decision summary

| Decision | Recommendation |
|---|---|
| Authority | Keep player correction above canon, `StateTx`, `SceneManifest`, evidence, and invention; never let RAG/summary decide kit, roster, HP, or quests. |
| Whole-message feeling | Compile every message into clause-level obligations and refuse a committed turn with an uncovered material clause. |
| Story quality | Render one coherent beat by default: direct answer or impact, concrete scene movement, consequence, and an earned opening. |
| Personality | Use a semantic-equivalence firewall: voice changes diction and cadence only. |
| Repair | Preserve the player bubble; repair with one contrastive question or an in-world boundary. |
| Streaming | For v1 closed beta, stream sentence/paragraph units only after a semantic plan and `StateTx` are committed. |
| Receipts | Keep state facts visible as silent/chip/expanded-Why? evidence rather than converting prose into a log. |
| Kid Mode | Treat it as a stricter interaction contract: plainer boundaries, safer defaults, no pressure, no ads. |
| Future audio | Do not create audio-only facts; maintain text parity and segmented playback. |

## Research coverage

The eight mandated evidence domains are covered in the research annex: interacting chat/companion products; narrative craft; audiobook/TTS; interactive fiction and parser systems; tabletop facilitation; conversation design/HCI/linguistics; rich NPC dialogue patterns; and improv/oral storytelling. The synthesis consciously separates sourced, public mechanisms from product proposals.

## Validation notes

The package contains **44** evaluation fixtures, **32** Good/Bad/Why prose cases, **17** speech-act runtime patterns, **144** engine/personality/situation repair-copy rows, **20** GM reply skeletons, **20** diegetic System notices, **12** chatbot-to-GM rewrite pairs, and **20** original opening replies. Content examples are original and trope-level only.

## Recommended implementation order

Read and build in this order: Constitution → F3 protocol → F4 rails → F6 repair → F11 fixtures → F7 voice firewall → F9 streaming → F10 first-hour packs. The day-by-day execution plan is in [F14_checklist_and_7_day_plan.md](F14_checklist_and_7_day_plan.md).

## Counsel flags

Before any launch claim, obtain appropriate specialist review for Kid Mode policy, content safety and escalation controls, streaming moderation, data correction/provenance and retention, accessibility statements, and any consumer-facing claim about memory or companionship. This package is product design research, not legal advice.
