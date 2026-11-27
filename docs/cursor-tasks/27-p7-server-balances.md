# 27 — Paid balances, purchases and the free earn path on the server

**Phase:** Phase 7  
**Depends on:** Phase 0 (done)  
**Who does it:** Cursor, in a fresh chat  
**Gate:** Needs a Supabase migration; applying it to the live database needs John's yes.  

Read `docs/cursor-tasks/00-README.md` first. Its global rules apply here and win over anything in this brief.

## Goal
Balances and purchases live on the server; a free player can earn everything (including illustrated turns), just slower; 'Buy (soon)' never grants packs on a normal account.

## Background
Audit P12: bought packs are credited and spent in localStorage (capacityLedger.ts ~10, 434-446). Rule 10. Stripe functions exist (supabase/functions/create-checkout, stripe-webhook). Latest migration on main is 025.

## Files you may read
- src/game/capacityLedger.ts
- src/components/CapacityPackShop.tsx
- supabase/functions/create-checkout/index.ts
- supabase/functions/stripe-webhook/index.ts
- supabase/migrations/024_*.sql and 025_*.sql
- the 3 capacityLedger test files

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- new: supabase/migrations/026_server_ledger.sql (next free number)
- src/game/capacityLedger.ts (the client reads the server)
- src/components/CapacityPackShop.tsx
- supabase/functions/stripe-webhook/index.ts (credit the server ledger)
- the 3 capacityLedger tests (rewrite against the server ledger)

Nothing else, and no new files except those listed.

## Acceptance criteria
- No entitlement in localStorage.
- Buy on one device, see it on another.
- 'Buy (soon)' cannot raise a balance on a normal account.
- A free player can earn an illustrated turn.

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, and the targeted tests (`npx vitest run <changed test files>`).
- Real check (Synapticgm or John, after review; Cursor does not run it): a short live game on www.synapticgm.com or the PR's Vercel preview, focused on prose and read by a person: after deploy, clear storage and keep the balance; check on a second device. No real purchase without John.

## Forbidden
- Storing entitlement in the browser.
- Making a real payment.
- Printing keys.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Top model to plan; Auto to edit.

## Branch and PR
- Branch: `cursor/27-p7-server-balances` from the latest `main`.
- PR title: `[27] Paid balances, purchases and the free earn path on the server`.
- PR body: root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
