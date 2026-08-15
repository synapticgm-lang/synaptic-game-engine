# WOF — bolt.new combat-feel + session-length prompt

Paste into bolt.new. Download **`WOF_CombatFeel_Dump.md`**. Drop it in this chat or `docs/research/wof/pasted/`.

---

```
You are doing design research for WOF (World of Fantasy), a later-release text MMO. NOT live SynapticGM. No production code. Original names only in examples. Name real games as SOURCES.

FILE OUTPUT
1. One file: WOF_CombatFeel_Dump.md
2. Tell the user to download it from the bolt.new file tree.

LOCKED
- Lockstep rounds. NOT twitch. Two run modes: manual (all submit → server resolves) or plan-auto (BattlePlan fills). Pause auto on phase / adds / interrupt / ally-down / Stop.
- One runMode per encounter. Late narration may arrive with roundId; never rewrite HP.
- Dungeon narration Mode A. Raid narration later (C first is a dump recommendation, John still calls).
- Raid 10, weekly lockout, personal loot v1. Wipe → checkpoint. Join locks after first combat.
- Kit gates: no sword if you have a knife; no “cleared” with mobs left; combat buttons are fight moves; no lunge at a corpse.

ALREADY DONE
EncounterLedger, BattlePlan, Millstone Hollow 3-phase script. Do not redo schemas. This dump is FEEL and TIME.

FILL

## 1) What a good ROUND feels like in text
Compare: KoL fight, MUD round, Caves of Qud / traditional roguelike turn, Fallen London menaces, D&D theater of mind, F&F scene.
WOF round: everyone submits → numbers resolve → short prose per player (Mode A) or one shared beat.
Word budget per round (range). What the prose MUST include (your action + visible result) vs MUST NOT (invent HP).

## 2) Trash vs boss pacing
5-man: how many rooms, how many trash packs, rest spots.
Raid: 3 phases already for Millstone Hollow — expected wall-clock with 10 humans in MANUAL vs PLAN-AUTO.
Cite FFXIV/WoW “learning week vs farm week” as jobs.

## 3) Session lengths
Table: content | target minutes | mode default | logout mid-fight rule (already: Hold vs last plan — restated, then UX copy).
15 min / 45 min / 90 min / raid night.

## 4) Rest, wipe, checkpoint
How MUDs and graphical MMOs avoid “run back from entrance” rage (checkpoint already locked).
Inn / sit / food as gold sinks vs free rest in hub.

## 5) Plan-auto usability
How RTS/MMO “assist” and “follow” macros work as a JOB (not IP).
BattlePlan UI: roles (tank/heal/dps) in TEXT. Pause reasons the player understands.
Failure: auto through interrupt (already a listed failure) — write the player-facing Stop copy.

## 6) Non-HP modules (feel only)
bond_type catch round, score_set match, cozy no-wipe, frame_heat — one paragraph each on round feel. Do not invent new math modules.

## 7) John's calls (max 6)
Raid Mode C vs A; default runMode for first 5-man (manual vs plan-auto); rest cost; max prose words per player per round.

RULES
- Mark speculation. No twitch+LLM. No 25-man. No live SynapticGM.
```
