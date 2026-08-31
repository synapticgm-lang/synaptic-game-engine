# Enforcement cross-ref — competitor complaints × Manus craft × live owners

**Date:** 2026-08-31  
**Scope:** Read-only diagnosis. No game fixes, no stamp bump, Mid writer stays OFF, no WOF.  
**Question:** Did we research what people hate in similar apps *and* what makes a good book per mode — and do we enforce those things?

---

## 1. Yes — we have both

| Lane | What exists | Where |
|---|---|---|
| **Competitor / complaint research** | Rival teardown (AI Dungeon, NovelAI, SillyTavern, Kobold, DreamGen, AI Roguelite, Hidden Door) + **complaint encyclopedia A–J** | `docs/research/pasted/memory-cost-maxextract-manus-2026-08-18/SynapticGM_ Competitive Product and Systems Research Brief.md` (§2–3); notes `…/synapticgm_research_notes.md` (memory-consistency zip) |
| | Scorecard vs rivals (copy/avoid) | `docs/research/pasted/everything-audit-manus-2026-08-18/E1 — Current vs Competition Scorecard.md` |
| | LitRPG first-session frustrations | `docs/research/pack-03-litrpg-player-expectations-2026-08-14.md` §4 |
| | Engineering anti-patterns (do not re-fail) | `docs/research/pasted/manus-big-changes-2026-08-27/T10 — Ranked Anti-Patterns and Rejection Criteria.md` |
| | Gemini as **player-proxy** complaints (27w/28c) | `docs/bugs/gemini-reviews-2026-08-27/GEMINI-28C-VS-27W-SYNTHESIS.md`; cell reviews gemini-09…24 |
| | Decision memo tying Gemini → Path A | `docs/research/player-driven-decisions-2026-08-28.md` |
| | Traditional-RPG social benchmarks (not AI-chat churn) | `docs/research/pasted/manus-ws-7-social-gameplay-2026-08-28/competitor-social-mechanics-analysis.md` |
| **Manus mode craft / “good book”** | Full constitution D1–D10 (per-mode DO/DON’T, choice grammar, D6 writing anti-patterns) | `docs/research/pasted/manus-story-craft-guides-2026-08-30/SynapticGM Story-Craft Constitution.md` |
| | Ingest + SC-001 / Path A notes | `docs/research/story-craft-guides-ingest-2026-08-30.md` |
| | Live compiler design | `docs/research/craft-book-compiler-2026-08-31.md` |
| **Live craft compiler** | 48 typed rules (12/mode), ≤2 `CRAFT:` lines/turn, boost from collage/atmosphere/name/pad/hook | `src/game/craftBookCompiler.ts` (+ edge sync copy) |

### Honesty on competitor research thickness

We **do** have a structured complaint encyclopedia (A–J) and rival failure modes. We **do not** have a dedicated Reddit/App-Store scrape of Choice of Games / Character.AI / NovelAI review corpora as a separate deliverable. “Player complaints” in planning docs often mean **Gemini critic packs + Josie/John playtest + Manus A–J architecture**, not population-rated churn surveys. Free retention cliffs still call for telemetry (`player-driven-decisions-2026-08-28.md`). That is enough to cross-ref enforcement; it is not a substitute for live return-rate data.

---

## 2. Complaint themes → expected fix → enforcement → status

Status key:

- **HARD** — ledger / scrub / gate that can reject, rewrite, or commit state without trusting Flash Lite  
- **SOFT** — SNAPSHOT / CRAFT / AUTHORITY / fluid rail (model may ignore)  
- **PARTIAL** — some HARD coverage; residual failure still documented  
- **MISSING** — no owner that prevents the failure class

| Theme | Source | Expected fix | Enforced how | Status |
|---|---|---|---|---|
| **A. Names / places / kit / roster vanish or swap** | Complaint enc. A; AID/NovelAI failure modes; pack-03 “forgets facts” | Typed StateTx + Scene Manifest + claim block | `sceneFacts` + SNAPSHOT; `sealedManifest`; inventory conservation / kit rails; `placeAuthority` / world-map invent-lock (29e); `pcNameAuthority`; `crowdAuthority`; prose wardens | **PARTIAL** — presence/kit/map much stronger than 2026-08-17; opening GM can still invent crowd size before harvest; ambient weapon invent residual (26p) |
| **B. Ignores player input; recycles dialogue; invents people/places** | Enc. B; AID repetition; Gemini pad loops | IntentContract + beatFingerprint + Introduction Permit | Pre-GM hard gate (invented items / absent talk); `semanticLoopDetector` (clone/collage/stall-pad); `ChoiceCompiler` fingerprints + diversity; `chromeAuthority` (panel ≠ person); alone invent-crowd gate; CRAFT boosts | **PARTIAL** — invent gates + anti-repeat HARD; “honor declared action” still largely SOFT (`dnd-*` / Intent coverage incomplete vs Manus stack) |
| **C. Premise / opening / quest spine drift** | Enc. C; Hidden Door weakly consequential choices | Campaign Contract + quest graph + divergence | `openingEstablishment`; `hookLock` (summon-why); quest sync + ArcDirector stage commits; sealed quest locks (30d); bible + BeatContract registry | **PARTIAL** — hookLock HARD for why; full CampaignContract / divergence UI still thin |
| **D. Samey openings / samey retries / thin replies** | Enc. D; AID/AI Roguelite repetitive prose | Opening decks + coverage gate + retry delta | `openingHooks` decks; stitch banks; near-clone reject (26u/30R); collage prefix strip (30Z); CRAFT collage/atmosphere boosts; fluid VALUE FLOOR | **PARTIAL** — HARD clone/collage; thin-reply still SOFT expand; Mid writer OFF by design |
| **E. Free wall before attachment** | Enc. E; Gemini Free hook NO | HookArc entitlement (identity → choice → consequence → next threat) | Story-start honeymoon turns; Free T12 ArcDirector + STATUS receipts (28a/b); tester gate (30e) | **PARTIAL** — honeymoon HARD capacity; “attachment complete before wall” not fully HookArc-gated; Gemini still Free-hook NO historically |
| **F. Meta / System jargon leaks into story** | Enc. F; Gemini STATUS leaks `[GM_VOICE]` | Visibility classes + leak scanner | STATUS firewall (29a/b); `fluidProseRails` / voice; strip residual mechanic tags; CRAFT story-first lines | **PARTIAL** — strip HARD for known tags; novel scaffold leaks still possible |
| **G. Combat / loot / quest disconnected from prose** | Enc. G; Gemini combat purgatory | Resolve then StateTx then narrate; terminal FSM | Ledger combat + `encounterTerminalFsm` (29a); clear XP + cooldown; sealedManifest combat omission/resurrection checks; ArcDirector drought spawn; loot via tags | **PARTIAL** — terminals HARD; drought can still attach after beat with no on-screen foe (31f residual); auto-fight still LLM-narrated |
| **H. Custom worlds empty or contradict canon** | Enc. H; NovelAI author burden | Canon compiler + sparse-world policy | Simple/Expert custom; blank-canvas; bible hard laws partial; invent-lock on maps | **PARTIAL** — Expert exists; full sparse-world compiler / coverage map MISSING |
| **I. Turn 50–200 degradation** | Enc. I; AID eviction; DreamGen date drift | State/evidence separation; invalidation on edit | Micro-summaries + pins + SNAPSHOT compact; discovery/inspect exhaustion; hub beat exhaustion; anti-repeat ledger | **PARTIAL** — not full hierarchical StateTx+invalidation; long-run still depends on compact SNAPSHOT + retrieval hygiene |
| **J. Kid Mode / tone / personality sticky** | Enc. J | Typed VoiceProfile + observable checks | `gmVoiceProfile` / System picker (26m); Kid Mode Families bar; CRAFT mode DNA | **PARTIAL** — rails SOFT+filters; no full never-line regex bank in proseWarden (26m residual) |
| **Fake / theater choices (PYOA)** | Gemini PYOA; Enc. B/C; Hidden Door | Branch lock + distinct futures | `pyoaBranchLedger` (+ V2); ChoiceCompiler; CRAFT `pyoa-fork-lock` / `pyoa-wait-fork` | **PARTIAL** — ledger HARD; Flash Lite can still offer delay paraphrases; endings not playtest-proven |
| **NPC first-speech / topic loop** | Gemini Aldous/Oskar; D6 #6; WS-7 | Topic FSM + tactic advance | `npcTopicFsm`; social milestone ledger; CRAFT `*-talk-tactic` | **PARTIAL** — FSM HARD for topics; “change tactic in prose” SOFT |
| **Inspect drip / room essay recycle** | D6 #4; LitRPG Gemini; Josie | Inspect exhaustion + atmosphere delta | `discoveryXpLedger` / searchedEmpty; `detectAtmosphereReprint`; CRAFT inspect rules; BEAT DELTA SNAPSHOT (31e) | **PARTIAL** — HARD flags + CRAFT boost; Flash Lite can still ignore two CRAFT lines |
| **Crowd size flip / chrome-as-person / bad PC name** | Josie playtests 30X–31e | Authority ledgers | `crowdAuthority`; `chromeAuthority`; `pcNameAuthority`; atmosphere pin deny (`isAtmospherePlaceName`) | **HARD** (with residuals: pre-harvest invent; handlers grammar) |
| **Numbered choice lists in story prose** | Playtest residual 31c | Strip from body | `stripChoiceList` in parser / useGame | **PARTIAL** — singleton `1.` on opening can still leak |
| **Pad ignores last intent / encounter** | Gemini; 31c residual | Pad-from-intent + combat pad lock | ChoiceCompiler encounter lock (29a); pad-follows-intent (31c); CRAFT pad boosts | **PARTIAL** — improved; ChoiceCompiler can re-offer Examine the room |
| **Passive world / no combat or crisis** | 27w; T10 #1 | Pre-GM ArcDirector commits | `arcDirector` + BeatContract + eval liveness gates | **HARD** for spawn/receipt; terminal/quality of fight still PARTIAL |
| **Prompt-only “be proactive” as the fix** | T10 #1–2 | Reject; use ledgers | Project rule + Path A shipped | **HARD** (process) — do not regress |
| **Second Continuity-Warden LLM** | T10 #4; ERROR-FIX-LOG | Forbidden | Classifier-only Continuity; `applyErrorRepairs` | **HARD** (constraint honored) |
| **Mid writer as Free default** | T10 #5 | Mid OFF | `writerPolicy.STAGNATION_MID_WRITER_ENABLED = false` | **HARD** intentional |
| **Social play has no state consequence** | WS-7; Gemini RPG leverage stall | Relationship / leverage ledgers | `socialMilestoneLedger`; faction standings; NPC topics; CRAFT rpg social-fork | **PARTIAL** — milestones HARD; full WS-7 disposition graph not live |
| **LitRPG System-first / fake XP** | pack-03; D2 LitRPG; D6 #8–9 | Story→System; code XP | STATUS strip bare invent XP; look-around XP skip (30S); CRAFT combat-story; ArcDirector XP | **PARTIAL** — invent XP HARD strip; story-first still SOFT for Flash Lite |
| **Map invents geography / essay rooms as pins** | 29e residual; 31f | Map authority + atmosphere deny | World map invent-lock; `isAtmospherePlaceName` harvest deny | **PARTIAL** — atlas HARD; Title-Case harvest heuristic residual |

---

## 3. Per-mode craft (Manus D2 top DO/DON’T → owners)

Shared DON’T #1 (all modes): *Do not recycle prior beat / location essay / crisis / pad unless player asked* → global NO RECYCLE + `semanticLoopDetector` + CRAFT collage/atmosphere boosts. Status: **PARTIAL** (HARD detect/strip; writer may still paraphrase).

### LitRPG

| Manus rule (abbrev.) | Owner | Status |
|---|---|---|
| Story beat first; System after | `litrpg-default` / `litrpg-combat-story`; fluid MODE AUTHORITY | **SOFT** |
| Only ledger-backed System changes / no fake XP | inventory/XP ledgers; STATUS strip; sealedManifest | **HARD** + SOFT chrome order |
| Inspect → new fact / reminder / exhaustion | `litrpg-inspect-delta`, `litrpg-inspect-exhaust`; discovery / searchedEmpty | **PARTIAL** |
| Distinct approaches (Direct/Diplomatic/Solitary) | `litrpg-talk-approaches`, `litrpg-inspect-pad`; ChoiceCompiler DNA | **PARTIAL** |
| Honor locked summon-why | `hookLock` + `litrpg-hook-why` | **HARD** + SOFT craft |
| Deny-list names / no canned name-ask | `pcNameAuthority` + `litrpg-name-defer` | **HARD** + SOFT |
| No four inspect paraphrases | ChoiceCompiler diversity + CRAFT pad | **PARTIAL** |

### Tabletop (`dnd`)

| Manus rule (abbrev.) | Owner | Status |
|---|---|---|
| Portray changed situation; fair ruling; success stands | `dnd-default`, `dnd-combat-ruling` | **SOFT** |
| No boxed-text reprint | `dnd-boxed-cut`, `dnd-inspect-info`; collage/atmosphere | **PARTIAL** |
| Distinct tactical futures | `dnd-pad-tactics`; ChoiceCompiler | **PARTIAL** |
| NPC desire+method, not lecture | `dnd-talk-motive`; `npcTopicFsm` | **PARTIAL** |
| Share spotlight | `dnd-spotlight` | **SOFT** only |
| No licensed lore invent | opening rails + CRAFT; content policy | **SOFT** / process |
| Hook / no railroad | `hookLock` + `dnd-hook-why` | **PARTIAL** |

### Story RPG (`rpg`)

| Manus rule (abbrev.) | Owner | Status |
|---|---|---|
| Advance relationship via leverage / moral cost | `rpg-default`, `rpg-talk-tactic` | **SOFT** + partial social ledger |
| Change NPC tactic; no first-speech loop | `npcTopicFsm` + `rpg-talk-tactic` | **PARTIAL** |
| Preserve PC interiority | `rpg-interiority`, `rpg-opening-demand` | **SOFT** |
| Two socially distinct futures | `rpg-social-fork`; ChoiceCompiler | **PARTIAL** |
| Do not default talk→combat | `rpg-combat-leverage`; encounter pads | **PARTIAL** |
| Waiting costs relationship clock | `rpg-wait-clock`; pressureClock (partial) | **SOFT** / PARTIAL |

### PYOA

| Manus rule (abbrev.) | Owner | Status |
|---|---|---|
| Resolve fork → lock → change crisis → distinct futures | `pyoa-default`, `pyoa-fork-lock` | **SOFT** + ledger |
| No Wait-Wait-Wait | `pyoa-wait-fork`; branch ledger delay exhaustion | **PARTIAL** |
| Do not reopen locked route | `pyoaBranchLedger` + `pyoa-talk-lock` | **PARTIAL** (receipt vs full lock historically weak; improved 29a+) |
| No crisis paragraph reprint | `pyoa-crisis-delta`; collage | **PARTIAL** |
| Ending when central question answered | `pyoa-ending-close`; campaign-ending plate | **SOFT** / unproven |
| Inspect → new detail / cost / exhaustion | `pyoa-inspect-page` | **PARTIAL** |

Full D2 lists, D6 ranking, D9 critic gates: **research-only** (correct per D7 thinning — do not paste into live prompt).

---

## 4. Honest gaps (still SOFT or MISSING)

Things competitors/Gemini/Josie complain about that we still mainly **ask** Flash Lite to do, or do not own:

1. **Story-first / value-floor prose quality** — CRAFT + fluid rails; Mid writer intentionally OFF (`writerPolicy`). Eloquent passivity still possible.  
2. **Honor declared approach / IntentContract completeness** — hard gates cover invent/absent entities more than “did the beat answer the typed verb.”  
3. **Share spotlight / preserve interiority / success-stands nuance** — CRAFT SOFT; no deterministic PC-interiority scrub beyond perspective warden.  
4. **Numbered `1.` lists on opening** — `stripChoiceList` residual (31c).  
5. **Pad-from-intent residual** — Examine-the-room / stall pads can reappear (31c/ChoiceCompiler).  
6. **Drought spawn without on-screen foe** — ArcDirector can commit encounter after a beat that never showed the foe (31f).  
7. **PYOA ending honesty + Free T12 “resolved hook”** — branch ledger exists; Gemini Free-hook NO; endings not human-proven.  
8. **RPG leverage → stage commit** — topic FSM exists; Gemini leverage/listen/wait basin residual.  
9. **Expert “Why this scene knows this” inspector** — recommended in memory brief; not a Simple/Expert player surface.  
10. **Custom sparse-world compiler / coverage map** — Expert fields exist; H complaint not fully closed.  
11. **Full D2 / D9 as live critic** — correctly research-only; offline Gemini packs can use D9, not live Continuity-Warden.  
12. **Free retention telemetry by turn band** — still a product gap (`player-driven-decisions` / deep-research).

**Not gaps (intentional):** Mid writer OFF; no Continuity-Warden LLM; no WOF; scrub-only batches rejected by T10.

---

## 5. Recommended next owners (≤8, ledger-only)

Ranked P0/P1. No Mid writer, no Continuity-Warden LLM, no WOF.

| Rank | Owner | Closes | Why now |
|---:|---|---|---|
| **P0-1** | **Encounter preface / visible-foe gate** before drought commit or auto-fight narrate | Drought-without-foe; combat disconnect (G) | 31f residual; ArcDirector already spawns — bind spawn to narrated presence or force preface STATUS |
| **P0-2** | **Pad-from-intent + encounter-state hard filter** (extend ChoiceCompiler) | Pad ignore intent/combat; D6 #3 | 31c residual; Gemini encounter-blind pads |
| **P0-3** | **Opening `stripChoiceList` completeness** (singleton / bare `1.`) | Numbered lists in prose | Cheap HARD; already partially owned |
| **P0-4** | **PYOA branch lock → next pad eligibility** (no reopen without new event) | Theater forks; Enc. B/C; D6 #10 | Ledger receipts without lock was 28c pathology |
| **P1-5** | **Inspect/atmosphere exhaustion → choice pad remove** (not only CRAFT) | Inspect drip; D6 #4 | CRAFT soft; discovery ledger should delete Examine-same-target |
| **P1-6** | **NPC tactic state → pad/topic disposition** (extend `npcTopicFsm`) | First-speech loop; RPG stall | WS-7 + Gemini Aldous class |
| **P1-7** | **Free HookArc gate telemetry + T12 durable-delta assert in eval** | Enc. E; Free churn | Measurement before more capacity; Path A receipts already exist |
| **P1-8** | **Intent obligation ack gate** (thin): reject/retry only when player verb family never appears in beat obligations | Enc. B ignore-input | Closest ledger form of Manus IntentContract without a second LLM |

Do **not** prioritize: Mid writer, embedding-only semantic governance, big encounter bible expansion before terminal/pad proofs (T10 #3/#6/#10).

---

## Live owner index (confirmed in `src/game/`)

| Module | Role |
|---|---|
| `craftBookCompiler.ts` | ≤2 CRAFT lines; 48 rules; learning boosts |
| `qualityGovernance.ts` | Integrates governance snapshot, prose, choices, craft signals, commit |
| `semanticLoopDetector.ts` | Clone, stall-pad recycle, collage prefix, atmosphere reprint |
| `crowdAuthority.ts` | Crowd headcount lock + scrub |
| `chromeAuthority.ts` | UI chrome ≠ person / speaker |
| `hookLock.ts` | Summon-why lock |
| `pcNameAuthority.ts` | Deny-list PC names |
| `choiceCompiler.ts` | Legal pad, fingerprints, gate disposition |
| `arcDirector.ts` | Pre-GM commits / drought / quest stage |
| `sealedManifest.ts` | Manifest + prose validate + one-repair fallback |
| `encounterTerminalFsm.ts` | Flee/parley/clear / cooldown |
| `openingEstablishment.ts` | Opening covers complete |
| `placeAuthority.ts` / map path | Place + invent geography |
| `npcTopicFsm.ts` | Topic exhaust |
| `pyoaBranchLedger.ts` (+ V2) | Branch lock / delay |
| `discoveryXpLedger.ts` | Inspect uniqueness |
| `proseWarden.ts` / `fluidProseRails.ts` | Scrub + MODE AUTHORITY |
| `parser.stripChoiceList` | Numbered lists out of body |
| `questPlay.isAtmospherePlaceName` | Atmosphere essay ≠ map pin |
| `writerPolicy.ts` | Mid writer OFF |

Playtest residual list (authoritative for “still broken in the wild”): `.cursor/rules/playtest-notes.mdc` Open section (31a–31g residuals).

---

## Bottom line

**Yes:** competitor-style complaint research (A–J + rival teardowns + Gemini/Josie) and Manus per-mode craft (D1–D10 → `craftBookCompiler`) both exist and are cross-mapped above.  

**Most factual continuity complaints are PARTIAL→HARD.**  
**Most “feels like a good book” craft rules are SOFT CRAFT lines on top of HARD ledgers for the failure modes Flash Lite actually hits (recycle, inspect, branch, combat spawn).**  

Next leverage is **closing the residuals that already have half an owner** (foe visibility, pad-from-intent, PYOA lock→pad, stripChoiceList), not another prompt constitution.

---

## Gap close note — 2026-08-31h (John: close all gaps)

Shipped ledger owners for §5 P0-1…P1-8. Stamp HUD `2026-08-31h` / BUILD `2026-08-31a`. Mid writer OFF. Details: `docs/research/path-a-gap-close-2026-08-31.md`. Vitest `playtest31hGapClose`.

Status updates vs §2/§4 after this ship:

| Theme / gap | Was | Now |
|---|---|---|
| Drought without on-screen foe (G / §4 #6) | PARTIAL (31f residual) | **HARD** preface pending + prepend (`combatAuthority` / ArcDirector) |
| Pad ignore intent / Examine room | PARTIAL | **HARD** encounter + intent filters in ChoiceCompiler |
| Numbered `1.` on opening | PARTIAL | **HARD** stripChoiceList verb expand + mid-body |
| PYOA Wait-Wait after lock | PARTIAL | **HARD** `eligiblePyoaPadsAfterLock` |
| Inspect drip pads | PARTIAL (CRAFT) | **HARD** pad drop on discovery/searchedEmpty |
| NPC first-speech pad loop | PARTIAL | **HARD** tactic disposition on pads |
| Free T12 measurement | PARTIAL | **HARD** `t12HookReceipt` on commit + Download play |
| Honor demand vs atmosphere | PARTIAL / SOFT | **HARD** thin `demand` obligation + atmosphere fail |

Still open (intentional or out of scope): Mid writer OFF; full D2 critic; Free retention bands; Expert sparse-world inspector; map L/R thumbs (no clear owner).

