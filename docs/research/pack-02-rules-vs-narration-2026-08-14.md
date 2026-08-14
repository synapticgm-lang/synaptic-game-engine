# Pack 2 — Rules Engine vs LLM Narration Split (2026-08-14)

**Status:** Captured for end-of-packs summary. Do not implement until John asks.  
**Scope:** Code owns math/state; LLM narrates; extend existing SynapticGM pipeline (don’t rebuild).

Architecture already decided: `intent → checkMath → CODE ENFORCED OUTCOME → GM narrate → Warden on tags`.

---

## 1) Comparison

| Feature | App | How it works | Failure mode | Copy / avoid |
|---------|-----|--------------|--------------|--------------|
| Code combat math | DungeonsDeep | Rules engine: to-hit, damage, crits, conditions; AI narrates after | None documented (reference) | **Copy** — AI never fudges rolls |
| LLM-led math | Friends & Fables | Franz rolls, applies HP, initiative in text | Wrong die (d4 Perception); dead+alive; combat off by default | **Avoid** — cautionary case |
| Agentic loop | Shift.dev / academic | LLM proposes → code resolves → observation token → narrate | Accuracy drops if state not externalized | **Copy loop shape** + observation handoff |
| Schema pipeline | MDPI 2026 | JSON schema; reject/retry invalid output | Retry latency; over-constrain voice | **Copy** — extend Warden |
| Platform memory | DungeonsDeep, RoleForge | Structured campaign state; LLM gets constructed sheet | Retrieval misses | **Copy** — feed only this-turn needs |
| VTT + LLM | Foundry + RPGX | Foundry owns tokens/dice; LLM dialogue/narration only | LLM may suggest illegal moves | **Copy separation** — ledger = our “grid” |

---

## 2) ALWAYS code

Dice, damage, HP, conditions, initiative/turn order, loot rarity, dungeon hidden state, XP/level, spell slots/resources, death/downed, inventory ownership, skill check DCs.

## 3) ALWAYS AI

Outcome narration, NPC dialogue, atmosphere, emotional framing, choice generation (then code-validate), free-text intent mapping, lore flavor, tone from outcome token.

---

## 4) Outcome token (code → LLM)

Structured handoff (not raw die for the LLM to reinterpret). Example fields:

- `action_id`, `actor`, `action_type`, `target`
- `resolution`: die, roll, mod, total, dc, outcome, degree
- `effects[]`: damage/heal/condition/loot/reveal + `target_hp_after`, `target_status`
- `state_changes`: HP, conditions, position
- `narration_hooks`: tone, outcome_flavor, target_reaction

LLM must not re-derive any number. Narrates hooks into prose.

---

## 5) Failure that sticks

| Product | What sticks | Enforcement |
|---------|-------------|-------------|
| DungeonsDeep | HP, conditions, slots, durability | Engine owns condition list; heal = code action |
| F&F | Intended same; unreliable | Undo/edit only |
| Foundry | Status effects on tokens | LLM no write access |
| Agentic loop | Whatever code tracks | Observation re-injected every turn |

**SynapticGM recommendation:** persistent `conditions[]` ledger (`id`, `effect`, `removal`, `expires`). LLM must narrate effects; cannot remove. Warden flags omitted conditions.

---

## 6) Anti-contradiction stack

1. Feed full **outcome token** (not tags alone) — “ledger truth, do not alter/omit.”
2. **Post-narration validation:** damage type, target status, active conditions present, no invented conditions/entities, no wrong HP/loot tier/position → retry with correction (max 2).
3. **State re-injection** every turn from code ledger (halts drift).

F&F = post-hoc player undo only → failure mode.

---

## 7) Recommended turn pipeline (8 steps)

| # | Step | New? |
|---|------|------|
| 1 | Intent Parse → structured intent; reject impossible before roll | **Add** (make explicit) |
| 2 | Hidden State Check (trap/ambush before player resolution) | **Add** |
| 3 | checkMath | Existing |
| 4 | CODE ENFORCED OUTCOME → commit ledger | Existing |
| 5 | Context Sheet Build (current+prev location, conditions, token, hooks, inventory summary) | **Add** (explicit) |
| 6 | GM Narrate (story first) | Existing |
| 7 | Warden Validation (extend §6 checks; max 2 retries) | **Extend** |
| 8 | Render + Commit (System chrome after story) | **Add** (explicit) |

### Add next (not rebuild)

1. Explicit intent parse before math  
2. Hidden-state resolve before roll  
3. Deterministic context sheet assembly  
4. Extend Warden: damage type, status, conditions, no invention, no ledger rewrite  
5. Explicit render/commit boundary  

---

## 8) Schemas to implement later

- Outcome token schema (JSON above)
- Context sheet schema (`current_location`, `previous_location`, `player_state`, `outcome_token`, `narration_directives`)
- Warden rules 1–8 (damage type, status, conditions, no invent, HP match, no loot tier in prose, position match)
- Prompt rules: token is truth; no numeric HP/dice in prose; no rarity/pity in prose; reflect conditions; miss = miss; story before System

---

## SynapticGM backlog from this pack (≤10)

1. Formalize outcome token object from `runPlayerCheck` / combat / loot.  
2. Inject token into GM user payload every turn.  
3. Explicit intent parse gate (impossible action → no roll).  
4. Hidden-state pre-check (trap before open/loot).  
5. Named context-sheet builder (wrap situation packet + token + conditions).  
6. Extend Warden: omit-condition / invent-entity / contradict-outcome retries.  
7. Persistent conditions ledger + removal only via code.  
8. Prompt: “miss stays miss”; no soft-invert of CODE outcome.  
9. UI: System chrome only after validated narration.  
10. Cap narration retries at 2, then surgical fact-lock cut (no canned collage).

---

## Sources (accessed Aug 14, 2026)

- DungeonsDeep vs AI Dungeon / vs F&F / F&F 2026 review  
- TableForge / Char-Gen best AI DM 2026  
- DEV: LLMs as DMs without cheating  
- Shift.dev D&D AI game engine  
- MDPI Schema-Governed LLM Pipeline  
- Foundry RPGX package  
- Collin Wilkins structured outputs  
- Reddit F&F AI GM complaints  
- GitHub ai-dungeon-master topic  

---

## Delta vs current code

Already have: intent parser, checkMath, code outcome text, situation packet, Warden tags, dual location.  
Gaps vs this pack: structured outcome **token**, hidden-state **pre**-check, post-narration Warden depth, conditions ledger, explicit context-sheet + render commit.
