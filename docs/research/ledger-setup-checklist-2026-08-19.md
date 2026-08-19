# Ledger batch — setup checklist (paid / ops only)

**Date:** 2026-08-19  
**Scope:** Everything that costs money, needs external accounts, or requires production deploy — **not** in the code slices 0–5.

Code for slices 0–5 is complete at HUD stamp `2026-08-19ag`. Do these when you are ready to launch or turn on paid paths.

---

## 1. Deploy (free tier possible; redeploy when edge changes)

| Step | Command / action | When |
|---|---|---|
| Vercel production | Push `main`; confirm HTML meta `sgm-build` = `2026-08-19ag` and HUD stamp matches | After every ledger batch |
| Supabase edge | `npx supabase functions deploy gm-turn` if prompt/warden facts for traps/mobs changed | Only if edge diff exists |
| Supabase edge | `npx supabase functions deploy generate-image` | Only after art pipeline changes |

No Supabase redeploy is **required** for slices 3–5 — trap/Token D/looseItems/playPhase are client-only.

---

## 2. Stripe live (costs: payment processing fees)

| Step | Notes |
|---|---|
| Stripe Dashboard → Live mode keys | Replace test keys in Supabase secrets / Vercel env |
| Webhook endpoint | Point live webhook at production `entitlements` (or your Stripe handler) |
| Idempotency | Verify duplicate webhook events do not double-grant credits |
| Smoke test | One real £0.99 pack in staging account before public |

**Do not** flip live until counsel legal pack + Kid Mode public gate are signed off (see §4).

---

## 3. Rewarded ads (costs: ad network rev share; optional provider spend)

| Step | Notes |
|---|---|
| Ad provider account | Google AdMob / Unity / etc. — not wired in slices 0–5 |
| `OutOfTurnsAdOffer` / `OutOfMemorableAdOffer` | Connect provider SDK + server verify before enabling in production |
| Families policy | Kid Mode must not show adult ad inventory |

Existing UI stubs remain; no ad SDK in this batch.

---

## 4. Ops / legal gates (no direct API cost)

| Item | Owner | Blocker for |
|---|---|---|
| Server capacity / rate limits | Supabase + OpenRouter quotas | Public launch |
| Counsel legal pack | External | Store listing + Stripe live |
| Kid Mode public gate | Product + legal | Families / under-13 |
| Entitlement audit trail (P4) | Supabase tables + admin review | Paid tier trust |

---

## 5. Manual playtest after deploy

Use HUD `2026-08-19ag` on production:

1. **Trap room** — disarm fail/success; throw rock at trap (0 HP).
2. **Throw inventory item** — item on floor; Pick Up bar; no GM turn spent on pickup.
3. **Quest fail** — GM emits `<quest-fail>` or die on story RPG → modal + journal Failed tab.
4. **Death archive** — story RPG HP→0 → epitaph bar; export PDF has log + epilogue, no front stats page.
5. **LitRPG down** — HP→0 → `down` phase; input locked with recover message (not full ended).

Vitest covers deterministic paths: `ledgerSlice345.test.ts`, `ledgerFlee.test.ts`, `dungeonMobLedger.test.ts`, `saveMigration.test.ts`.

---

## 6. Explicit non-goals (this batch)

- Forced ads on out-of-turns
- Live Stripe without staging smoke test
- WOF / separate project paths
- Full a11y release gate, Expert author tools, full comic mode

---

**Next engineering slice (when funded):** P4 entitlements — Stripe staging, webhook idempotency, server-authoritative credit ledger (`ledger-architecture-acceptance-2026-08-19.md` §5).
