# Gemini STORY lens — Batch V T50 reply (seed 42)

**Premade:** The Summoned Pact · **Mode:** litrpg · **Turns:** 50 · **Writer:** gemini-2.5-flash-lite · **Run:** post–Batch-V (`2026-08-31v` / BUILD `2026-08-31n`)

**Source:** John paste 2026-09-01 · Tape: `scripts/fate-autoplay/runs/2026-09-01T18-16-49-695Z_summoned-pact_cold-system_s42`

---

**Verdict**
Stop at Turn 4; the book collapses into unreadable template substitution and engine UI lines masquerading as fiction — best stretch is T0–2.

**Book score**
2/10 — Opening vault beat is vivid, but by T3–4 faction names and role labels replace grammar, and stitched menu prose breaks immersion entirely.

**Findings**

* **P0 — Entity / variable template collapse (CRITICAL).** Faction and contact labels (`Scattered Scale`, `stall contact`) are promoted into substitution banks and reused as verbs, directions, and speakers.
* *Turns:* 2, 4, 6, 9, 14, 27–31
* *Quote:* "a stark contrast to the grim fortifications you just Scattered Scale." (Turn 4)
* *Quote:* `"the stall contact," the handler finally rasps, "the stall contact decree.` (Turn 6)
* *Quote:* "the stall contact across the stall leans stall contact, a low chuckle rumbling in their chest." (Turn 14)
* *Owner hint:* proseWarden / narrativeHarvest / chromeAuthority

* **P0 — UI / engine bleed in committed narration.** codedSceneMove / stitch banks commit as GM body; numbered choice menus leak into prose.
* *Turns:* 3, 15, 22, 26, 27
* *Quote:* "A shuttered stall and an open lane both invite a real move — talk, trade, or travel." (Turn 3)
* *Quote:* "In Lowmarket, ash still sifts between the stones. Someone at a nearby stall shifts weight…" (Turn 15)
* *Quote:* "1. Plunge into the thick of the Lowmarket crowd" (Turn 27)
* *Owner hint:* beatCommitGate / parser / readabilityGate

* **P0 — Combat causality erasure.** After flee-fail catch (T11), hide/inspect/talk then travel clears the skirmish without resolution; dual-location prose ping-pongs.
* *Turns:* 11–16, 20, 23
* *Quote:* Turn 15 narration is empty stitch while T14 still had live Pact-Hunter Skirmisher.
* *Quote:* "You leave Lowmarket behind and reach West Wall. In Lowmarket, ash still sifts between the stones." (Turn 23)
* *Owner hint:* encounterTerminalFsm / choiceCompiler / travelAuthority

* **P1 — Dialogue treadmill (Wall Sergeant / Fence).** Same demand loops without stage advance.
* *Turns:* 17–19, 21, 24–25
* *Owner hint:* npcTopicFsm / choiceCompiler

**YES/NO gates**

* **No unrequested recycle:** NO — Sergeant loiter loop T17–19; stitch banks T15/T22/T26.
* **Turn delta exists:** NO — T15 is pure stitch; T7–8 contingency loop.
* **Distinct choice outcomes:** NO — abstract Ask/Press pads repeat under live NPCs.
* **Continuation creates novelty:** NO — entity mad-libs escalate instead of advancing plot.
* **No unsupported invent:** YES (opening) / NO (mid) — stall contact as cast poisons later beats.

**Best stretch**
T0–2 — vault under fire, handler panic, first step toward Lowmarket.

**Free hook call**
NO — unreadable by T4; would not finish chapter one.
