# Path A ship — 2026-08-30e Google-only play + tester cohort

John authorized the tester window: new Google sign-ins play the game; the silent AI/capacity study is a bonus they should not see.

## Product

- Guest play is off. Auth overlay is Google only. Hub / New Game / Continue bounce unsigned users back to sign-in.
- Every signed-in Google account that is **not** a founder is a **tester cohort**:
  - Unlimited text turns (no daily cliff)
  - Hosted **Free** writer only (Gemini 2.5 Flash Lite)
  - No comic, memorable plates, portraits, or item-icon generation
  - No Test Lab UI (localStorage `enabled` alone cannot self-promote to Mid/High)
- Founder Test Lab is unchanged when the email is in `VITE_TEST_ACCOUNT_EMAILS` or marked via Settings → Test Lab. Mid/High + art still work there.

## Code

- `src/game/testLab.ts` — play-account context, `isTesterCohort`, capacity / writer / image helpers
- `src/game/capacityLedger.ts` — unlimited text for testers; image spend denied
- `src/game/comicImagePrompt.ts` — `allowsImageGeneration` hard-off for testers
- `src/App.tsx`, `BootScreens.tsx`, `useGame.ts` — guest path removed
- Settings / New Game hide comic + memorable for testers
- HUD stamp `2026-08-30e` (∞ turns without saying “Test Lab”)

## Edge + SQL (must apply to go live)

- `supabase/functions/_shared/playPrivileges.ts` — staff RPC or `FOUNDER_EMAILS`
- `gm-turn` forces Free writer unless privileged
- `generate-image` returns 403 unless privileged
- `supabase/migrations/017_tester_ops_rls_tighten.sql` — Ops SELECT on telemetry / AI traffic / moderation / feedback / payments is staff-only

Redeploy after push:

```
npx supabase db push
# or run 017 in the SQL editor
npx supabase secrets set FOUNDER_EMAILS=your@gmail.com
npx supabase functions deploy gm-turn
npx supabase functions deploy generate-image
```

## Honest residual

- `gm-turn` still accepts an anon JWT (Fate autoplay). A crafted client can still *call* the proxy; the writer is clamped to Free.
- Capacity remains a client ledger until server TurnLedger. Testers cannot turn images back on in the UI; they could still POST `generate-image` until the edge deploy lands.
- DEV builds still show Test Lab.
- Shop cosmetics stay `TEST_UNLOCK_ALL` (pre-existing).
- Testers see `∞ turns` — not labeled as a test, but it is a tell vs a 12/day Free meter.

## Tests

`src/game/playtest30eTesterGate.test.ts`

Mid writer stays **NO**.
