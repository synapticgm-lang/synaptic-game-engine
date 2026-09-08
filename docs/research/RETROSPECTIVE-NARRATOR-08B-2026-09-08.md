# Retrospective Narrator 08b (2026-09-08)

**Status:** Live SynapticGM stitch-process pass on Architecture 1. Not committed / not pushed. `gm-turn` not deployed.

**Why:** 08a 4×T50 Gemini mean 1.25. `proseViolatesEventPacket` rejected any off-list Title-Case, so packet stitch became the writer (PYOA 50/51 landing stub; combat `The blow landed`). Synthesis: `docs/bugs/gemini-reviews-2026-09-02/SYNTHESIS-08A-VS-02AC.md`.

## What 08b changed

1. **Shrink the gate.** Reject ledger contradictions only: living lastKill, instruction voice, numbered lists, loot-too-early, wrong HERE. Off-list Title-Case no longer forces stitch.
2. **Authored stitch, rare.** `assemblePacketStitch` uses opening-stitch quality lines keyed by verb+outcome. Rotates so the same 3-sentence template never commits twice in last 10. Never `You acted at landing. That beat closed. The next move was yours.`
3. **Who/where = ledger nouns.** `extractTarget` matches present named / encounter / lastKill-as-corpse only. Never pad remainder (`what is going on`, `a direct question`, `with what you are holding`).
4. **Outcome follows verb.** Inspect during a fight is `inspected`, not hit. Talk lastKill is illegal. After kill: loot/leave/inspect body. Pads: `isLastKillTalkPad` on graph / compiler / closed-universe fallbacks.

Stamps: HUD / BUILD `2026-09-08b`. Mid writer OFF. Free stays `deepseek/deepseek-v4-flash-0731`. Vitest `playtest08bStitchGate`.

## 4×T50 (DeepSeek, seed 42, no Gemini critic)

All 50/50, 0 empties. Stitch vs GM-commit: LitRPG 40/50 (80%) · D&D 36/50 (72%) · RPG 30/50 (60%) · PYOA 28/50 (56%). 08a was ~75 / 75 / 86 / 98. PYOA landing stub is gone; stitch is still majority because other commit gates (sealed CAST / recycle / fact-close) still call `assemblePacketStitch`. Combat receipts 2 / 2 / 1 / 0. L2 T12 / T13 / T13. Pastes under `scripts/fate-autoplay/runs/gemini-paste-2026-09-08b-t50/`.

## Leftovers

- John scores Gemini himself.
- Mid writer still OFF.
- Full spatial graph / gender lock still later.
- Opening GM path still `callOpeningGm` (not this packet).
- Stitch still majority; combat receipts ≥3; `Hunter Skirmisher's` talk mash.
