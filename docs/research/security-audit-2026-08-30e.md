# Security audit — 2026-08-30e (tester window)

Fresh pass over auth, capacity, hosted AI, and Ops RLS. Testers will all be signed-in Google users, so “any authenticated user can read X” is now the live threat model.

## Fixed in this batch

| Severity | Finding | Fix |
|---|---|---|
| Critical | `telemetry_logs` / `ai_traffic` SELECT was `authenticated USING (true)`. Every tester could dump every GM prompt and reply. | Migration `017` — staff-only SELECT. |
| High | `moderation_reports` and `player_feedback` SELECT/UPDATE were global. Testers could read/triage other players’ reports. | `017` — staff SELECT/UPDATE; players may still read their own feedback. |
| High | `payment_events` SELECT was global. | `017` — staff-only. |
| High | Guest play + `generate-image` accepted anon JWT. Anyone could burn the hosted Flux key. | Guest UI/path removed; `generate-image` requires staff / `FOUNDER_EMAILS`. |
| High | Test Lab was a localStorage flag. Any tester could set `enabled` + `aiPreviewTier: high` and get Sonnet + unlimited art in the client. | Founder check requires marked / env email (or DEV + toggle). Testers stay Free / no art even if they flip the key. |
| Medium | Client could ask `gm-turn` for Mid/High via `customModelId`. | Edge clamps non-privileged requests to Flash Lite. |

## Closed after review pass

| Severity | Finding | Fix |
|---|---|---|
| Critical | `playPrivileges` trusted an unverified JWT `email` claim (`verify_jwt=false`). A crafted token with a founder email would unlock Mid/High + images. | Edge now calls `/auth/v1/user` (signature checked) before `FOUNDER_EMAILS`. Staff still uses `is_staff_email()`. |
| High | Global SELECT/UPDATE on profiles, subscriptions, users, pack_balances, cosmetics, purchase_ledger. | `017` now own-or-staff SELECT; entitlement writes staff-only. Players still update their own `profiles` row. |
| Medium | Testers could add their email to `markedEmails` in localStorage and become a client-side founder. | Production founder = `VITE_TEST_ACCOUNT_EMAILS` only. Device marks are DEV-only. |

## Still open (do not treat as closed)

| Severity | Finding | Why it stays |
|---|---|---|
| Medium | `gm-turn` still accepts the anon key (`verify_jwt = false`). Fate autoplay and older guests rely on it. Writer is Free-clamped, but the endpoint is public. | Require a user JWT after autoplay has a service token. |
| Medium | Capacity / “unlimited testers” is client-side. A patched build can still send turns; you pay OpenRouter. | Server TurnLedger. |
| Medium | `TEST_UNLOCK_ALL = true` unlocks every shop cosmetic for everyone. | Intentional QA leftover. Turn off before a paid shop goes live. |
| Medium | DEV always shows Test Lab. A production build with `VITE_ENABLE_TEST_LAB=true` would show it to testers. | Keep the flag off on Vercel. |
| Low | HUD shows `∞ turns`. Not labeled “test”, but it is a tell. | Accept for the closed window. |
| Low | Telemetry INSERT is still open to anon. Fine for write; do not re-open SELECT. | — |
| Info | John’s Mid/High + art on production need `staff_members` **or** `FOUNDER_EMAILS` on the edge. Client Test Lab alone is not enough after deploy. | Set the secret before you play Mid yourself on synapticgm.com. |

## Auth notes

- Google OAuth via Supabase. Session JWT is the play ticket.
- Guest button and `handleGuestSignIn` no longer enter the hub.
- Cloud saves already required a signed-in user (`cloudSync`). Guests were local-only; that path is closed.
- Do not ask testers to export Debug. Hosted WARN/ERROR/TURN_START + `ai_traffic` still write; staff read them after `017`.

## What testers should not be able to do after deploy

1. Play without Google.
2. Switch to Mid/High in Settings.
3. Turn on Memorable / Comic / portraits.
4. Read other testers’ AI traffic or reports from the browser Supabase client.
5. Call `generate-image` successfully.

## Apply before inviting testers

1. Run `017_tester_ops_rls_tighten.sql` on the shared project.
2. `npx supabase secrets set FOUNDER_EMAILS=you@gmail.com`
3. Deploy `gm-turn` and `generate-image`.
4. Confirm your Google email is in `staff_members` and/or `FOUNDER_EMAILS` and `VITE_TEST_ACCOUNT_EMAILS`.
5. Confirm Vercel does **not** set `VITE_ENABLE_TEST_LAB=true`.
