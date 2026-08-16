# SynapticGM — tiers, payments, discovery, beta launch

**Date:** 2026-08-16  
**Status:** partial implementation 2026-08-16  
- Done: `player_feedback` + in-game Send feedback + Admin Player Inbox; entitlement tables + login sync; Admin BYOK catalog price £12.99  
- Next: Stripe Checkout edge fn + webhooks writing `subscriptions.plan_id` / `pack_balances` / `payment_events`  
**Companion canvas:** `canvases/launch-payments-plan.canvas.tsx` (Cursor project canvases)

## Verdict

Ship automation in this order: **in-game feedback → Admin inbox**, then **server entitlements + Stripe webhooks** for Mid/High/packs/themes, then **closed beta**, then **live Stripe**, then **separate adult processor for Admin BYOK** at about **£12.99/mo** (not £29.99). Discovery: own content + CreatorFetch/IMPRESS or real PR — never fake-install mills.

## Current code (honest baseline)

| Piece | Today |
| --- | --- |
| Tiers | `free` / `mid` / `high` / `admin` in `subscriptionTiers.ts` |
| Caps | Local `capacityLedger` (sub daily + never-expire packs) |
| Shop | UI exists; payments “not live yet” |
| Unlock | `localStorage` tier override |
| DB | `subscriptions` table exists (Free default) — nothing payment-driven writes it |
| Moderation | `moderation_reports` + Admin Flagged Narrative Review |
| Player inbox | **Missing** |

## What each SKU unlocks

| SKU | Price (catalog) | Processor | Unlock |
| --- | --- | --- | --- |
| Mid | £14.99/mo | Stripe | `subscriptionTier=mid` + Mid caps/models |
| High | £29.99/mo | Stripe | `subscriptionTier=high` |
| Text packs | £1.99 / £3.99 / £7.99 | Stripe | Increment pack balance (never expire) |
| Themes / bundles | catalog | Stripe | Cosmetic entitlement forever |
| Admin BYOK | **rec. £12.99/mo** (code still 29.99) | **Adult processor only** | `admin` + website-only key UI + Adult BYOK rails |

Cancel subscription → Free caps. Packs and cosmetics stay. Spend order already coded: sub allowance first, then packs.

## Payment → unlock (no manual flips)

1. Player must be signed in before checkout.
2. Edge fn `create-checkout` → Stripe Checkout (or adult checkout URL) with metadata `{ user_id, sku }`.
3. Webhook edge fn verifies signature, idempotent by event/payment id.
4. Writer updates:
   - `subscriptions` (tier, status, period end, provider ids)
   - `capacity_grants` / pack balances
   - `cosmetic_entitlements`
5. Return URL → client `syncEntitlements()`.
6. Self-serve cancel via Stripe Customer Portal (and adult equivalent).

### Stripe events

- `checkout.session.completed` — first grant  
- `invoice.paid` — renew  
- `customer.subscription.updated` — plan / past_due  
- `customer.subscription.deleted` — Free (keep packs/cosmetics)  
- refund / dispute — revoke if needed + admin log  

Staff gifts stay `provider=manual` in Admin Users (comps for creators).

## Stripe vs Admin BYOK

- **Stripe:** Mid, High, packs, themes. Market as AI GM game, not erotica. Enable Stripe Tax (UK VAT).
- **Admin BYOK:** separate adult merchant (CCBill / Segpay / Epoch / Verotel). Same entitlement writer, different `provider`. Web-only; never on Play/Apple builds.
- Stripe’s restricted list explicitly covers adult / mature-for-sexual-gratification content **including AI**. Dual checkout reduces routing risk; it is not a total firewall if the whole brand is sold as NSFW.

## Fair Admin BYOK price

High includes your model bill. BYOK should not.

| Option | Price | Note |
| --- | --- | --- |
| **Recommended** | £12.99/mo or £99/yr | Platform + Adult BYOK rails; player pays OpenRouter/BFL |
| Lifetime | £149 one-time | Fewer adult renewals |
| Avoid | £29.99/mo | Same as High + player still pays APIs |

## Feedback / bug / request system

Do **not** overload `moderation_reports`.

**New table `player_feedback`:** type (`bug`|`request`|`message`|`praise`), subject, body, status, player_id, campaign, engine_mode, turn, channel, optional `ai_traffic_id`, payload jsonb.

**Game:** Settings → Send feedback; auto-attach context; rate-limit.

**Admin:** new Inbox page (filter, triage, staff notes, CSV). Optional Discord/Slack on insert.

## Discovery (no fake apps)

| Legitimate | Role |
| --- | --- |
| CreatorFetch | DIY creator/press outreach CRM |
| IMPRESS | Creator discovery + coverage tracking |
| GamesPress / itch press kit | Asset home for journalists |
| Sparks Forge / Bonfire / Starfall | Real PR when budget + trailer exist |
| Own: Shorts, YT, Reddit, Discord, email | P0 until paid tools |

**Avoid:** guaranteed installs, ASO bots, review farms, clone-app “publishers.”

## Launch phases

0. **Pre-beta (1–2 wk):** feedback + entitlement sync + kill fake local buy  
1. **Closed beta (2–4 wk):** 50–150 invites, Mid comps, daily inbox  
2. **Open beta web (4–8 wk):** Stripe live, waitlist, Shorts cadence  
3. **Soft launch (8–12 wk):** marketing site, Admin BYOK on adult rail, PH week  
4. **Stores later:** store rails, no BYOK, IAP via stores  

## Suggested build order

1. Feedback inbox (game + Admin)  
2. Entitlement tables + client sync  
3. Stripe test mode checkout + webhooks  
4. Closed beta  
5. Stripe live + Tax + Portal  
6. Adult processor + Admin BYOK SKU  
7. Discovery push (tools/PR)  
