# D11 — Density Targets and Enforcement

The executable reference is [`D11_encounter_density.ts`](./D11_encounter_density.ts). Density combines **location quotas** with **turn-based drought pressure**. Quotas prevent empty dungeons and crisis-free chapters; drought prevents prolonged passivity; saturation and recovery guards prevent MMO-like encounter spam.

These numbers are product defaults to validate through playtest telemetry, not universal genre laws. Encounter pacing depends on the available combat plan, intensity sequence, recovery, and variation rather than one fixed formula.[1]

## Target Profiles

| Profile | Scope | Target mix | Drought trigger | Saturation/recovery |
| --- | --- | --- | --- | --- |
| **LitRPG dungeon** | 10 rooms | 4–6 trash; 1–2 elite; exactly 1 boss; 2–4 discoveries | Interactive beat at 8 turns; hostile encounter at 15 | Max 2 encounters in 5 turns; recovery after elite/boss; max 2 same-role consecutive |
| **DnD Cursed Keep** | 10 areas | 3–5 combats; 1–2 traps; 1–2 hazards; 2–4 checks; 1–2 puzzles; exactly 1 boss | Interactive challenge at 8 exploration turns; combat/hazard at 15 | Max 3 encounters in 8 turns; max 2 same-role consecutive; recovery after boss |
| **RPG Cape District** | 100 turns | 3–5 social pressures; 1–2 major crises; 0–1 political ambush; 2–5 discoveries | Material pressure at 12 turns; hostile pressure no sooner than 30 | Max 2 major encounters in 15 turns; major cooldown 15; recovery after crisis/ambush |
| **PYOA chapter** | 60 turns | 2–4 crises; 1–3 discovery/callback beats; at least 1 commitment fork | Consequential fork at 12 turns | Max 1 crisis in 12 turns; crisis IDs are one-shot; recovery/callback after crisis |

## Enforcement Order

Density is a preference layer below world authority. The director applies rules in this order:

```text
1. Hard legality: mode, bible, biome, site, faction reach, tier, prerequisites, exclusions.
2. Terminal availability: template has valid bound, forced terminal, and receipt contract.
3. Cooldown and one-shot locks.
4. Saturation and required recovery beat.
5. Location quota deficits.
6. Interactive or hostile drought preference.
7. Variety score and recent-role penalty.
8. Seeded selection among the best legal score band.
```

Drought pressure never cancels steps 1–4. When no legal encounter is available, the director uses the biome matrix’s legal fallback or writes a content-gap receipt.

## Location Enforcement

The density ledger counts only **terminally resolved encounters**. A spawned but unresolved encounter is a lifecycle failure and cannot satisfy density.

| Checkpoint | Required behavior |
| --- | --- |
| Midpoint of a 10-area dungeon | At least two interactive challenges and at least one noncombat challenge should have resolved. |
| Boss gate | Boss template, telegraphs, and arena/site authority must be ready; drought cannot substitute a generic elite. |
| Final area | Evaluate minima and maxima; report deficits before sealing the run. |
| Cleared node revisit | Do not count or respawn the cleared encounter unless a named repopulation event changed node state. |

A generation plan should allocate roles to rooms before prose, reserving the boss site and at least one recovery room. Dynamic picks fill role deficits but do not erase authored placements.

## Drought Enforcement

An **interactive beat** is an encounter, hazard, check, puzzle, crisis, or discovery that changes persistent state. Decorative prose does not reset the timer.

| Trigger | Preferred response | Invalid response |
| --- | --- | --- |
| LitRPG hostile drought at 15 turns | Legal trash, patrol, or roaming elite that fits the role budget | Spawn a boss outside its gate or import a wrong-bible actor |
| DnD interactive drought at 8 turns | Trap clue, skill check, puzzle, ghost interaction, or combat depending deficits | Empty room description that changes no state |
| RPG pressure drought at 12 turns | Advance a deadline, deliver an ultimatum, expose a betrayal, or start a social standoff | “Walk Away” scene that immediately reappears |
| PYOA fork drought at 12 turns | Present an eligible one-shot crisis or delayed callback | Repeat a resolved crisis with the same options |

## Saturation and Recovery

Recovery beats restore contrast and provide space to inspect receipts, heal, re-equip, question NPCs, review flags, or see consequences. After an elite, boss, major crisis, or ambush, the next selected beat should be non-hostile unless an authored escalation explicitly links the encounters.

| Guard | Default | Rationale |
| --- | ---: | --- |
| LitRPG encounter window | No more than 2 in 5 turns | Prevent continuous trash pressure. |
| DnD challenge window | No more than 3 in 8 turns | Preserve exploration and planning. |
| RPG major-conflict window | No more than 2 in 15 turns | Avoid melodramatic saturation. |
| PYOA crisis window | No more than 1 in 12 turns | Give branch facts time to produce callbacks. |

The same encounter role cannot occur more than twice consecutively, and PYOA crises cannot repeat consecutively at all.

## Enforcement Events

The density module emits structured events rather than silently changing spawn behavior:

| Event | Required fields |
| --- | --- |
| `density.deficit_detected` | Profile, scope, role, minimum, current, remaining rooms/turns |
| `density.drought_triggered` | Timer type, turns since qualifying beat, legal preferred roles |
| `density.candidate_rejected` | Template, normalized reason, current count, maximum/cooldown |
| `density.fallback_used` | Matrix row, fallback ID, original role deficit |
| `density.content_gap` | Bible, biome, desired role, every rejected candidate/reason |
| `density.scope_closed` | Counts, minima/maxima, deficits, gate result |

## Acceptance Tests

| Test | Pass condition |
| --- | --- |
| LitRPG 10-room plan | 4–6 trash, 1–2 elite, exactly 1 boss, no saturation violation |
| DnD Keep plan | Combat, trap/hazard, check/puzzle, and boss minima all met |
| RPG 100-turn plan | 3–5 social pressures and 1–2 crises; no more than one ambush |
| PYOA 60-turn chapter | 2–4 unique crises; each terminal; at least one fork callback occurs |
| Empty legal candidate set | Legal fallback or content-gap receipt, never wrong-bible substitution |
| Revisit cleared node | No count increase and no generic respawn |

## Tuning Plan

Collect at least run-level counts, turns between interactive beats, turns spent in each encounter, terminal distributions, warning coverage, receipt completeness, and abandonment points. Adjust target bands only after confirming that lifecycle failures are not masquerading as pacing problems. A 290-turn combat is not “high density”; it is one unresolved state machine.

## Reference

[1]: https://www.gamedeveloper.com/design/the-art-and-science-of-pacing-and-sequencing-combat-encounters "The Art and Science of Pacing and Sequencing Combat Encounters"
