# Path A Batch E — 2026-09-01 morning Gemini + Flash Lite P0s

**Stamp:** HUD `2026-08-31p` / BUILD `2026-08-31h`  
**Mid writer:** OFF  
**John:** authorized Batch E — implement P0s from SP morning reviews, then commit / push / `gm-turn` deploy.  
**Sources:** `scripts/fate-autoplay/runs/morning-review-2026-09-01/gemini-replies/summoned-pact__story-and-game__gemini-pro-reply.md` + Flash Lite SP scores.

## Landed (P0)

1. **Prompt bleed** — `stripChoiceList` adds continue/remain/duck/ready/touch/observe; strips trailing orphan `4.`; strips `What do you do? touch.` fragments.

2. **Verbatim stall** — banned `the moment has not moved on` / `figure N is still here` (sealedManifest + `isVerbatimStallStub`). `stitchCommitDelta` never emits that chrome; qualityGovernance rejects + restitches once (same Class A recovery pattern as 31i HUD stubs).

3. **Inspect/Wait/Scout treadmill** — scout/ready enter loiter family; ChoiceCompiler interrupts at ≥3 with exit/talk/travel pads; ChoiceEdge stops recycling Scout/Ready under loiter.

4. **Location amnesia** — `scrubFalseArrivalWhenHere` + `ensureTravelArrivalProse` no-op when already at hub; wired into `applyProseWarden`.

5. **Drought spawn setup** — `autoFightSpawnPreface` no longer says `already on you` / invents debris; rewrites bare already-on-you; keeps 31m `pendingEncounter` + preface before live attach.

## Landed (P1, same stamp)

- Role adjective person-slot ban (`Field` from field chirurgeon) in chromeAuthority + prose scrub.
- Body HP/MP status dumps stripped from story prose.
- Parley exhausted no longer free-clears the encounter (combat stays on ledger).

## Also in this ship

- Uncommitted 31m drought park + stripChoiceList mid-body + memory-widen / auto-improve heal (`playtest31o`) when present in the working tree.

## Residuals

- Flash Lite can still ignore CRAFT / SNAPSHOT rails.
- Inspect treadmill interrupt is pad + streak — GM can still write same-room essays until clone/commit gate fires.
- Parley *success* path still needs a real ledger resolve (not shipped as auto-success).
- Admin Feedback still unmounted.
- CK / Salt / Thornferry Gemini replies still awaited — not overnight curriculum.

## Verify

```
npx vitest run src/game/playtest31pBatchE.test.ts
```

Optional SP smoke (when John asks — not overnight):

```
npm run fate-autoplay -- --bible summoned-pact --turns 50 --seed 105
```

Redeploy: client + `node scripts/sync-gm-edge-shared.mjs` + `npx supabase functions deploy gm-turn`.
