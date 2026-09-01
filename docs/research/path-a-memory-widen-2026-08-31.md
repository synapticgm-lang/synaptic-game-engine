# Path A modest memory widen — 2026-08-31n

**Stamp:** HUD `2026-08-31n` / BUILD `2026-08-31g`  
**Mid writer:** OFF  
**John:** “if you think that will help lets try it”

## Landed

`buildContextPrompt` raw recent log window is last **4** `state.log` lines × **500** chars each (GM + player as they appear). SNAPSHOT / lastSnapshotGist / AUTHORITY still override prose. No last-15 dump, no full transcript. Collage / anti-repeat unchanged.

Constants: `RECENT_LOG_WINDOW = 4`, `RECENT_LOG_CHAR_CAP = 500` in `src/game/systemPrompt.ts` (edge copy synced).

## Verify

```
npx vitest run src/game/playtest31nMemoryWiden.test.ts
```

Redeploy when John asks: client + `node scripts/sync-gm-edge-shared.mjs` + `npx supabase functions deploy gm-turn`.
