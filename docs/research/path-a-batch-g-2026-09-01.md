# Path A Batch G + PYOA spine v1 — 2026-09-01

**Stamp:** HUD `2026-08-31r` / BUILD `2026-08-31j`  
**Mid writer:** OFF  
**John:** Ship Batch G + PYOA spine v1, then commit / push / `gm-turn` deploy.  
**Source:** `FIX-PLAN-gemini-t300-2026-09-01.md` (+ Thornferry spine product ask).

## Batch G landed

1. **Combat pad lock** — live encounter drops Open crate / Scout / Wait / look-around / loot; Fate gets Press the attack / flee / parley.
2. **Idle FSM** — loot/scout/wait do **not** tick `engagedTurnCount`; no free `max_engaged` victory XP while AFK-looting.
3. **Crate exhaustion** — `crate|chest|box|barrel` normalize + `emptyContainers` on open; pad drops Open crate; duplicate bird/locket blocked.
4. **holds-the-beat ban** — stall ban + rotating diegetic `stitchCommitDelta` (no bystanders mad-lib).
5. **Director chrome** — diegetic drought preface; `isDirectorChromeLeak` + scrub/reject (Do not invent / telegraph / CRAFT / AUTHORITY / TURN JOB).
6. **stripChoiceList** — Attempt/Try-to offer verbs mid-body.
7. **TURN JOB + world-moving pad** — compact ArcDirector job; after loiter exhaust always ≥1 exit/talk/leverage pad (no Scout recycle).

## PYOA spine v1 (Thornferry only)

- Module: `src/game/pyoaSpine.ts` — **12 nodes**, **3 major forks**, **4 ending leaves**.
- Persisted on `GameState.pyoaSpine`.
- ChoiceCompiler / ChoiceEdge pads = legal exits; delay once then force edge.
- SNAPSHOT / TURN JOB: current node + exits.
- Other PYOA bibles: unchanged (no spine seed).

## Verify

```
npx vitest run src/game/playtest31rBatchG.test.ts src/game/playtest31rPyoaSpine.test.ts
```

Smoke Thornferry Fate T30:

```
npm run fate-autoplay -- --bible thornferry-road --turns 30 --seed 42
```

Redeploy: client + `node scripts/sync-gm-edge-shared.mjs` + `npx supabase functions deploy gm-turn`.

## Residuals

- CK / Salt Gemini still separate; SP T300 re-score after this stamp.
- Flash Lite can still ignore CRAFT / invent menus after one firewall pass.
- Admin Feedback still unmounted.
- Non-Thornferry PYOA densify deferred.
