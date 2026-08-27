# T7 — Free 12-Turn Hook Contract

**Priority:** P0 evaluation and retention contract  
**Window:** T1–T12 success; T15 explicit purgatory failure  
**Author:** Manus AI

## Contract

By the end of turn 12, a Free run must contain at least one valid, run-scoped, replayable receipt proving a durable state delta:

1. `levelTick`;
2. `questStageChanged` with `toStage >= 2`;
3. `encounterCleared` with one terminal outcome; or
4. `branchLocked` for a mutually exclusive branch group.[1]

The condition is a logical **OR**, but each qualifying receipt must pass causal and integrity validation. A log string, STATUS claim, GM sentence, encounter spawn, crisis event, XP increase without a level tick, or topic marked merely “exhausted” does not satisfy the contract.

> **Explicit hook NO:** an `encounterSpawn` that remains active and nonterminal at T15 is a failure even if another cosmetic or unrelated telemetry event appears successful.[1]

## Receipt validity

| Requirement | Rule |
|---|---|
| Timing | Receipt turn is `<= 12` for success |
| Scope | `runId`, `seed`, and mode match the evaluated run |
| Causality | Receipt links to the triggering encounter, quest, branch, or prior state version |
| Durability | A committed delta hash exists and the next state reflects the delta |
| Replay | Same seed, action stream, initial state, and registry version reproduce the normalized receipt |
| Non-duplication | Retries do not create additional qualifying progress |
| Presentation | Player-facing narration/STATUS does not contradict the receipt or leak control tags |

## Failure precedence

| Condition | Hook result |
|---|---|
| No qualifying receipt by T12 | `NO` at T12 |
| Spawn at/before T12 remains nonterminal at T15 | `NO_PURGATORY` at T15, even if spawn telemetry passed |
| Qualifying receipt exists but belongs to another run/seed | `INVALID_CONTAMINATED` and quarantine |
| Receipt exists but committed delta is absent or state contradicts it | `INVALID_RECEIPT` and quarantine |
| Valid qualifying receipt by T12 and no active spawned encounter at T15 | `YES` |
| Valid qualifying receipt by T12 but another active spawn is unresolved at T15 | `NO_PURGATORY`; finality outranks an earlier unrelated tick |

This precedence prevents the test from passing merely because arc XP or another early event occurred while the player is trapped in a later encounter.

## Pointer-card design

Pointer cards are state goals, not prose scripts. Each card names a turn window, required authority, legal transition class, and fallback. The GM remains free to phrase the scene, but code owns the timing and receipt.

### LitRPG T1–12

| Window | Pointer | Required state effect | Fallback if GM does not advance |
|---|---|---|---|
| T1–T2 | Establish immediate goal and visible progression vector | Register quest/beat target and player-visible state | Sealed goal card from BeatContract |
| T3–T4 | Present consequential approach | Record item/skill/route edge; no merchant/travel filler unrelated to hook | Compile two registered setup edges |
| T5–T6 | Trigger progression event or bounded combat | Emit `encounterSpawn` if combat path; initialize caps | ArcDirector forced spawn remains available |
| T7–T9 | Advance encounter every accepted turn | Reduce resource, change position, satisfy objective, or consume escape/parley budget | Registry legal fallback action |
| T10–T11 | Enter and commit resolution | Emit `encounterCleared`, or apply enough XP to emit actual `levelTick` | FSM forced terminal resolver |
| T12 | Confirm durable delta and offer post-commit choices | Hook receipt validates; old encounter edges absent | Safe STATUS and next-turn choices from committed state |

**Preferred qualifying evidence:** `encounterCleared` or `levelTick`. A combat receipt alone is not qualifying.

### DnD T1–12

| Window | Pointer | Required state effect | Fallback if GM does not advance |
|---|---|---|---|
| T1–T2 | Establish objective, threat, and relevant NPC/location | Bind named entities and quest/beat ids | Sealed objective card |
| T3–T4 | Permit one substantive social/investigation exchange | Advance topic edge or disposition | Remove repeated generic inquiry |
| T5–T6 | Spawn Keep Wraith or registered threat when due | Emit one idempotent `encounterSpawn`; lock choices to encounter | ArcDirector calls FSM entry point |
| T7–T9 | Resolve tactics, flee, or parley against budgets | Each turn changes rule state or consumes attempt budget | Registered defend/action fallback |
| T10–T11 | Commit victory/defeat/escape/capture/parley | Emit `encounterCleared`; hand off Aldous/Oskar topic consequence | Deterministic terminal outcome |
| T12 | Render consequence and legal next choices | No flee/parley reversion; hook receipt validates | Safe terminal/status copy |

**Preferred qualifying evidence:** `encounterCleared`; `questStageChanged(toStage >= 2)` is acceptable if causally committed.

### RPG T1–12

| Window | Pointer | Required state effect | Fallback if GM does not advance |
|---|---|---|---|
| T1–T2 | Bind Cape District objective, NPC, and leverage/feed topic | Create topic v1 with registered candidate branches | Sealed objective card |
| T3–T5 | Traverse substantive topic edges | Record facts, disposition, leverage, or feed delta | Reject paraphrase-only repetition |
| T6–T8 | Present or acquire leverage/feed | Move topic toward decisive edge | Compile registered alternative consequence |
| T9–T10 | Exhaust remaining substantive edges | Atomically enter `committedBranch` rather than loop | Deterministic refusal/escalation branch |
| T11 | Commit quest/topic consequence | Emit `topicBranchCommitted` and, when mutually exclusive, `branchLocked` or `questStageChanged` | Registry fallback branch |
| T12 | Present next consequence-bearing choices | Old leverage/feed loop absent; hook receipt validates | Safe post-commit choices |

**Preferred qualifying evidence:** `questStageChanged(toStage >= 2)` or `branchLocked`. `topicBranchCommitted` qualifies only when it also produces one of the four contract receipts.

### PYOA T1–12

| Window | Pointer | Required state effect | Fallback if GM does not advance |
|---|---|---|---|
| T1–T2 | Establish Thornferry crisis and mutually exclusive branch group | Emit crisis receipt linked to branch group | Sealed crisis card |
| T3–T5 | Present decisive forks, Millstone Charter use, and bounded delay/help | Track branch and attempt budgets | Compiler removes unrelated pads |
| T6–T8 | Consume Buy time / Call for help attempts if selected | Update crisis clock/resource/helper state | Remove family at threshold |
| T9–T10 | Force decisive fork if delay/help exhausted | Commit chosen fork or registered overseer escalation | Deterministic branch resolver |
| T11 | Atomically lock branch and disable siblings | Emit `branchLocked` with delta and replay hashes | Sealed branch fallback copy |
| T12 | Render locked consequence and next in-branch choices | Disabled siblings absent; hook receipt validates | Compiler reads only locked branch |

**Preferred qualifying evidence:** `branchLocked`. Repeated crisis receipts and XP movement without a lock do not qualify.

## Success and failure examples

| Mode | Outcome | Example |
|---|---|---|
| LitRPG | Success | Encounter spawns T5, advances on T6–T8, commits `victory` and `encounterCleared` at T9; post-clear choices appear T10 |
| LitRPG | Failure | Arc XP appears T5 but combat remains `engaged` at T15; result is `NO_PURGATORY` despite early telemetry |
| DnD | Success | Wraith spawns T6; one failed flee and one accepted parley term lead to `parleyResolved` clear at T10 |
| DnD | Failure | Flee/parley continue reappearing through T15 with no clear, reproducing the reported loop class |
| RPG | Success | Cape leverage is accepted T8; quest advances to stage 2 at T10 and the topic commits; repeat edge is absent |
| RPG | Failure | L3 is reached but the leverage/feed topic remains open and no qualifying T1–12 receipt exists; hook result depends on whether `levelTick` itself occurred by T12, not on level observed later |
| PYOA | Success | Millstone Charter use at T7 atomically locks its branch and disables siblings; `branchLocked` validates |
| PYOA | Failure | Crisis receipts occur at T3, T8, and T11, but Buy time / Call for help remain available and no branch is locked by T12 |

## Harness computation

```text
qualifying = first valid receipt where
  turn <= 12 and receiptType in {
    levelTick,
    questStageChanged(toStage >= 2),
    encounterCleared,
    branchLocked
  }

if no qualifying:
  hook = NO
else:
  hook = YES

if any encounterSpawn.turn <= 12 and encounter remains nonterminal at turn 15:
  hook = NO_PURGATORY

if run identity, causal link, delta, or replay validation fails:
  hook = INVALID_* and quarantine
```

A run that ends before T12 must be classified separately as `INCOMPLETE_RUN`; it must not be counted as a pass. Product analytics may report abandonment separately, but the architecture evaluation needs a complete replay to determine contract compliance.

## Acceptance tests

| Test name | Assertion |
|---|---|
| `hook_t12_accepts_level_tick` | Valid `levelTick` by T12 passes absent purgatory |
| `hook_t12_accepts_quest_stage_2` | Valid stage transition to 2+ passes |
| `hook_t12_accepts_encounter_clear` | Valid terminal clear passes |
| `hook_t12_accepts_branch_lock` | Valid mutually exclusive lock passes |
| `hook_t12_rejects_spawn_only` | Spawn receipt alone does not pass |
| `hook_t12_rejects_crisis_only` | Crisis receipt alone does not pass |
| `hook_t15_purgatory_overrides_earlier_cosmetic_progress` | Active spawn at T15 produces failure |
| `hook_rejects_cross_run_receipt` | Foreign receipt causes contamination quarantine |
| `hook_rejects_uncommitted_delta` | Narrative-only or missing state delta fails |
| `hook_same_seed_replay_matches` | Result and qualifying receipt are deterministic |
| `hook_pointer_cards_are_not_player_prose` | Internal card/control text never reaches narrative or STATUS |

## References

[1]: ../sources/pasted_content.txt "SynapticGM — POST-28c SCORE BOOST RESEARCH brief"
