# WOF Pack 13 — Battle plan + auto-run vs manual rounds

**Project:** WOF later release. Do not implement into live SynapticGM.  
**John (15 Aug 2026):** In dungeons/raids, the party can set a **plan of attack**, then either **auto-run** that plan until the fight ends (or pauses), or **everyone submits a turn**, the system resolves that full round, repeat to the end.

This matches lockstep combat. It is not twitch.

---

## Two run modes (same ledger)

One `EncounterLedger`. Same round index for everyone. Code resolves HP. LLM does not pick actions and does not invent kills.

| Mode | What players do | What the server does |
|------|-----------------|----------------------|
| **Manual round** | Each person picks an action. Ready-check (or timeout = Hold). | Resolve **one full round** for everyone at once. Recap. Wait for the next picks. Repeat until win/wipe. |
| **Plan auto** | Party (and each player) sets a **battle plan**, then hits Go. | Each round, code **fills actions from the plan**, resolves the round, repeats until fight end **or a pause**. |

You can switch mid-fight: pause auto → edit plan or take a manual round → Go again.

---

## Battle plan (code, not a GM essay)

Per player (and optional raid-wide marks):

```
BattlePlan
  playerId
  default: attack-marked | heal-lowest | soak | interrupt | hold
  mark?: skull | 1 | 2 | ...
  phaseOverrides[] { phaseId, default }
  pauseOn[]: phase-change | add-spawn | interrupt-window | ally-down | hp-below-N | player-stop
```

Raid lead can set **marks** and a shared pause list. Individuals still own their `default` action.

Auto-run: for each round, `action[player] = evaluate(plan, ledger)` then the same simultaneous resolve as manual.

---

## Auto-run must pause

Do not fire 25 rounds with no brain on soak/interrupt windows.

**Always pause (raid):** phase change, add spawn, interrupt window, ally HP 0, player Stop.  
**Dungeon v1:** pause on wipe-risk (party HP below threshold) and player Stop; optional pause on elite/boss phase.

While auto-running, use **Mode C** recap tables (cheap). On pause or fight end, optional Mode A paragraph. Matches Pack 9 cost gate.

---

## Fight loop

```
pull / ready
if mode == manual:
  loop until ended:
    collect actions (ready-check | timeout Hold)
    resolveRound(ledger)
    show recap
if mode == auto:
  loop until ended or paused:
    fill actions from BattlePlan
    resolveRound(ledger)
    show recap (table)
    if pauseOn matched: stop and wait for new plan or one manual round
```

Chat does not advance the round. Disconnect = Hold (manual) or keep using their last plan (auto) until Stop/kick.

---

## Failure modes

1. Auto-run through an interrupt window and wiping because nobody paused  
2. LLM rewriting the plan into different actions  
3. One player in manual, another in auto, on different round indexes — **forbidden**; instance has one run mode at a time  
4. Auto-run waiting on Mode A prose before the next round
