# Manus score-boost ingest — 2026-08-27

**Zip:** `How to Complete Upgrade Run2_.zip`  
**Pastes:** `docs/research/pasted/manus-score-boost-2026-08-27/`  
**Answers prompt:** `docs/research/manus-score-boost-research-prompt-2026-08-27.md`  
**Prior plan:** `docs/research/score-boost-plan-post-28c-2026-08-27.md`

## Verdict

Manus agrees with the 29a draft and sharpens it: **28c proved spawn liveness, not terminal authority**. Ship one coupled batch — Encounter Terminal FSM + encounter pad lock + topic/PYOA branch commit + entity allowlist scrub + STATUS firewall + Free T12 / eval gates. **Honest uplift: 4.5–6.5/10 on worst cells**; 8/10 not credible this batch.

## What Manus recommended (P0)

1. **Encounter Terminal FSM** — idle→engaged→resolving→terminal; caps (LitRPG flee 2 / parley 1 / max 8; DnD flee 2 / parley 2 / max 10); exactly one `encounterCleared` per spawn.
2. **Encounter-aware ChoiceCompiler** — no travel / merchant / Earth junk / generic inspect while engaged; flee/parley drop at cap.
3. **NPC topic + PYOA branch commitment** — exhaustion → durable quest/branch lock (`branchLocked`), not dialogue reopen.
4. **Entity scrub constitution** — never replace protected mobs/items/NPCs/locations with `the mark` / `nearby building` / `the panel` / stranger/them generics.
5. **STATUS leak firewall** — strip `[GM_VOICE…]`, `[PYOA]`, `[RenderFallbackUsed]`, campaign-contract tags from player chrome.
6. **Eval gates** — spawn without clear by T50 fails; crisis without lock by T30 fails; Free T12 needs durable delta (not spawn-only).
7. **Free T12 hook** — levelTick | questStage≥2 | encounterCleared | branchLocked by T12; active spawn at T15 = purgatory fail.

## What we ship in 29a

Mapped onto existing Path A modules (extend, don’t greenfield rewrite). See `docs/research/path-a-ship-implementation-2026-08-29a.md`.

## Deferred

- Stagnation Mid writer (Opt 10) — Manus T12 anti-pattern until terminals pass
- Second LLM critic
- Full contamination/quarantine evaluator pipeline beyond existing evalHarness hooks
- Mode feature-flag shadow rollout (ship on by default for worst-cell uplift; rollback via stamp)

## Score ceiling (Manus T9)

| Horizon | Worst-cell band |
|---|---:|
| 29a | **4.5–6.5** |
| Portfolio average 29a | 3.5–6.0 (6 upside) |
| 8/10 | Not this batch |
