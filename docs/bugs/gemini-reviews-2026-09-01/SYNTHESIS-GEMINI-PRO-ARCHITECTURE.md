# SYNTHESIS — Gemini Pro architecture (2026-09-01)

Ten-line summary of Gemini Pro's architecture reply (gem 1) + alignment with Path A / Manus.

1. **Stop incremental RRR:** Gemini recommends abandoning Batch Y/Z scrub cycles; scores stuck at 1–3 are a sunk-cost loop, not fixable with deny-lists on Flash Lite.
2. **Root cause:** LLM is planner + referee + narrator; `narrativeHarvest` Title-Case heuristic feeds hallucinations back into `present[]` next turn.
3. **Ranked Path 1 (gold):** Authority inversion — engine computes `CommittedBeat` before GM; LLM renders delta only (JSON narration).
4. **Ranked Path 2:** Entity registry lockdown — rip Title-Case harvest; only registry NPCs/locations enter `present[]`.
5. **Ranked Path 3:** FSM-owned pads — `ChoiceCompiler` subjugated to `EncounterTerminalFsm` (e.g. caught → struggle/attack/plead only).
6. **Ranked Path 4:** JSON-schema enforcement on edge with diegetic fallback, not meta recovery strings in prompt.
7. **One highest-leverage fix:** Hypothesis E (combat FSM owns pads) + B (harvest freeze) — overnight 1→5 on story axis per Gemini.
8. **Milestone 1 (days 1–4):** Harvest freeze + intent enums instead of UI strings; gate = zero entity template collapse by T20.
9. **Milestone 2 (days 5–8):** Travel/inspect disabled under caught; HP/state before GM; gate = flee-fail→caught pad lock by T30.
10. **Milestone 3 (days 9–14):** CommittedBeat renderer pivot; aligns with our **authority inversion** hypothesis and Manus "state dictates text."

**Story lens (gem 2, Batch W):** Stop T4; book 1/10; P0 entity/variable collapse + UI bleed; supports Milestone 1 urgency.

**Related:** `GEMINI-PRO-META-PROMPT-FULL-RRR-A-TO-X.md` (prompt sent); `gemini-pro-architecture-response-2026-09-01.md`; `gemini-story-t50-batch-w-reply-pro.md`.
