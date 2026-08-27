# Review: Manus rivals-edge research → SynapticGM build priorities (2026-08-17)

Source: John’s Downloads `1._Rivals'_edge.docx` (Manus competitive memory/consistency brief).

## Verdict

The brief is strong and mostly **implementation-ready**. Our edge is correctly identified as **ledger + quests + bible**, not chat memory. Biggest gap vs the brief: we still treat too many continuity tools as **soft rails / prompts**. Rivals (and this doc) win by making roster, kit, intent, and canon **hard gates** before the player sees a reply.

Do **not** reinvent what we have — **harden and wire** it.

---

## Map: research → what we already have

| Research part | We already have | Gap |
|---------------|-----------------|-----|
| Canonical state ledger | Inventory, quests, relationships, sceneFacts, consequence ledger | Not full entity-ID transaction log; summaries can still overrule soft rails |
| Scene manifest | sceneFacts, locationSheet, locality/perspective wardens | Not a compact reserved **SceneManifest** injected every turn as hard authority |
| Player-intent contract | intentParser, groundPlayerAction, talk anti-recycle | Not a hard **obligation checklist** the draft must satisfy or refuse |
| Campaign / quest graph | bible, opening canon, starter quests, Guide Book lock | No immutable **campaign contract** + explicit divergence transactions |
| Evidence index | micro-summaries, pins, lorebook | Evidence can blur with canon; need “supporting only” label |
| Claim gate + retry director | claim grounding, prose wardens, refunds | Retries can resample same beat; no **beatFingerprint** alternate plan |
| Free-tier hook | story-start honeymoon + free opening covers | Not yet gated on **HookArc** (identity → choice → consequence) |
| Meta leak filter | System jargon filter, Status vs in-world System | Need stricter **visibility classes** + pre-send leak scanner |

---

## Ways to make us better (prioritized)

### P0 — kill the loudest complaints

1. **Compile a Scene Manifest every accepted turn**  
   place, present roster, visible kit, exits, threats, active talk. Inject in a reserved high-priority slot. **Block** drafts that name someone/somewhere not on the manifest (unless a new-entity permit).

2. **Entity / transaction layer on top of existing sheets**  
   IDs for people/places/items; each accepted turn writes before→after for location, present, kit, status. Corrections **supersede**; summaries never mutate truth.

3. **Intent contract before generate**  
   Parse obligations (act / answer / refuse / correct). Draft must cover each or explicitly resist. Ambiguous nouns → clarify / permit / reject — no free invention.

4. **Introduction permit**  
   New person/place only if player named it, bible/seed allows it, or scene-seed approved. Extends current anti-invention rails into a hard reject.

5. **Campaign contract from opening + premise**  
   Immutable invariants + active quest node + owed consequence. Plans that break hard canon are rejected; valid departures write a divergence record (don’t silently forget the promise).

6. **Diegetic visibility + leak scanner**  
   Engine / player / GM-only / in-world System. Narrative only gets diegetic facts; reject ledger/prompt/model vocabulary in prose. LitRPG windows only via bible templates.

### P1 — quality and retention

7. **Retry director via beatFingerprint**  
   On retry, force a different tactic / obstacle / revelation / consequence that still matches the ledger. Ban same event-dialogue-outcome triple.

8. **HookArc entitlement (optional next step after honeymoon)**  
   Free wall ends only after identity confirmed + first meaningful choice + observed consequence (with scene safety buffer). Complements story-start turns.

9. **Evidence index labeled “supporting only”**  
   Keep micro-summaries/RAG-like retrieval subordinate to ledger + manifest (authority order from the brief).

### P2 — Expert/Simple UX win vs rivals

10. **Player-facing continuity UI**  
    Simple: Scene / Threads / “Why this happened.”  
    Expert: sources, state diffs, one-click correction (player correction = highest authority).

---

## Authority order (adopt as product law)

1. Player correction  
2. Pinned campaign canon / opening invariant  
3. Accepted ledger transaction  
4. Current scene manifest  
5. Supporting retrieved evidence  
6. Draft invention (color only)

Lower layers may add atmosphere; they may **not** overwrite higher ones.

---

## Do not build (agree with the brief)

- One expanding master summary as truth  
- Semantic retrieval as inventory/roster/quest authority  
- Always-on full bible dump / pin-everything  
- Raw turn-count wall mid-action; auto-writing hallucinated prose into permanent state  

---

## Suggested ship order (when John says implement)

1. SceneManifest compile + inject + hard block  
2. Intent obligations + introduction permit  
3. Entity IDs / StateTx on top of inventory + sceneFacts + consequences  
4. Opening → campaign contract + divergence  
5. beatFingerprint retry director  
6. Leak scanner / visibility classes  
7. HookArc (after honeymoon proven in playtests)  
8. Simple/Expert continuity UI  

## Success tests to keep from the brief

- 100-turn state endurance (names/roster/kit exact)  
- Intent + invention gauntlet (50 inputs)  
- Premise-drift trial (10 openings × 40 turns)  
- Retry quality panel (20 retries, different beats)  
- Hook + leakage study (consequence before wall; zero meta leaks)

---

**Status:** research review only — not tickets until commissioned.

**Evening zip (2026-08-17):** same stack confirmed in `How Can SynapticGM Outperform Rivals in Memory and Consistency_.zip`. SceneManifest + expected-revision are now in code; remaining P0 is IntentContract / IntroductionPermit / CampaignContract / StateTx. Ingest note: `docs/research/memory-consistency-zip-ingest-2026-08-17.md`. The attached `PART_0_—_Executive.docx` is a **WOF multi-title** brief, not this memory brief.
