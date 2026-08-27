# Memory / consistency zip ingest (2026-08-17 evening)

**Sources:** Downloads `How Can SynapticGM Outperform Rivals in Memory and Consistency_.zip` + `PART_0_—_Executive.docx`  
**Verbatim zip extract:** `docs/research/pasted/memory-consistency-zip-2026-08-17/`  
**Status:** research review only. Do not implement until John opens an update wave.

## Two different briefs in one drop

| File | What it actually is | Live game? |
|------|---------------------|------------|
| Zip (memory title) | Omnibus: rivals-edge continuity stack + many already-ingested 2026-08-17 briefs (ops, ads, comic, living sim, layout) | Live SynapticGM memory thesis |
| `PART_0_—_Executive.docx` | **Not** a memory executive. It is a **WOF / multi-title online-RPG operating model** (Ember Crown, Pactbeasts, 36-month MP roadmap) | **No.** Quarantine. Review: `docs/research/wof/pack-24-part0-multi-title-ingest-2026-08-17.md` |

The zip title matches the rivals-edge work. The Word file does not. Treat them separately.

## Memory thesis (unchanged, still right)

Rivals win on **context assembly** (summaries, lorebooks, RAG). Our edge is **ledger + quests + bible**, not chat memory. Beat them by making roster, kit, intent, and canon **hard gates** before the player sees a reply.

Authority order (product law): player correction → pinned canon / opening invariant → accepted ledger transaction → Scene Manifest → supporting evidence → draft invention.

## Map to code (evening 2026-08-17)

| Brief part | Code now | Gap |
|------------|----------|-----|
| Scene Manifest | `sceneManifest.ts` compiled + prompt slot; warden invent notes; `continuityStrict` can mark a continuity break if ≥2 leftover Title-Case names | Not a hard reject of every unpermitted named entity; roster still mixes recent NPC memories |
| Expected-revision / speculative retry | `ledgerRevision.ts` + pending-turn expected revision | Not a full append-only `StateTx` entity log |
| Intent contract | intent parser + unresolved-action notes | No obligation checklist that **must** be satisfied or explicitly resisted |
| Introduction permit | prompt rule + claim-ground scrub | No typed permit object; atmosphere roles still allowed (correct) |
| Campaign contract | bible, opening canon, quests, Guide Book | No immutable contract + divergence transaction |
| Claim gate | warden notes / fact locks | Retries can still resample the same beat (no `beatFingerprint`) |
| Leak scanner / visibility classes | System jargon filter | Not a full engine/player/GM/diegetic split |
| HookArc | story-start honeymoon turns | Not gated on identity → choice → consequence |
| Expert “why this loaded” | none | Simple/Expert continuity UI still research |

## Do not build (zip agrees)

- One expanding master summary as truth  
- Semantic retrieval as inventory / roster / quest authority  
- Always-on full bible dump / pin-everything  
- Raw turn-count wall mid-action  
- Auto-writing hallucinated prose into permanent state  

## Next code slice (when John says implement)

Same order as `PLAN-OF-ACTION-2026-08-17.md` W1:

1. IntentContract + IntroductionPermit (hard)  
2. CampaignContract + divergence records  
3. StateTx adapter on inventory / presence / quest / combat  
4. beatFingerprint retry director  
5. Leak scanner / visibility classes  
6. HookArc after honeymoon is proven  

Success tests to keep: 100-turn state endurance; 50-input intent/invention gauntlet; 10×40 premise-drift; 20-retry novelty; leak study.

## Zip leftovers (not this review)

Ops, ads, comic, living-sim, layout, remaining-systems, product manual — already ingested as 2026-08-17 research files. Do not reopen.

WOF Gloamwild / creature-collect JSON in the zip is **not** the frozen WOF world. See pack-24.
