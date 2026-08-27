# SynapticGM — Remaining Launch Operations Research Omnibus

## PART A — Security & abuse threat model

### 0A. Executive risk ranking (Likelihood × Impact)

| Rank | Risk | Likelihood | Impact | Owner | Public-web exit criterion |
|---:|---|---:|---:|---|---|
| 1 | Cross-account campaign/transcript access through RLS/API/view/storage gap | M | Critical | Code | Owner/non-owner authorization suite passes for every exposed object and RPC. |
| 2 | Prompt/indirect injection causes policy, tool, ledger, or data-boundary bypass | H | Critical | Code + T&S | Model has no direct privileged tool/database/entitlement path; 50 red-team cases pass. |
| 3 | Secret/service-role/API-key exposure | M | Critical | Code + Ops | No secret in repo/client/logs; rotation and break-glass drill pass. |
| 4 | Kid/adult mode confusion exposes child session to adult text/image/ads/analytics | M | Critical | Code + Legal-verify | Server-enforced mode tests pass across account, save, cache, fallback, and export. |
| 5 | CSAM, grooming, self-harm, credible threat, doxxing, or severe unsafe output mishandled | M | Critical | T&S + Ops | High-severity policy test suite passes; escalation/kill-switch drill completed. |
| 6 | Capacity/ad/purchase entitlement fraud | H | High | Code + Ops | Server-authoritative idempotent ledger and callback/purchase verification pass replay tests. |
| 7 | Account takeover / session theft / password reset enumeration | M | High | Code | Rate limits, session rotation/revocation, sensitive-action reauth, staff MFA. |
| 8 | Cost amplification: retry loops, image spam, bot farms, long-context attacks | H | High | Code + Founder | Per-account/project budgets and kill switches stop loss within 15 minutes. |
| 9 | Save tampering / duplicate mutations / branch cross-contamination | M | High | Code | Event revisions, replay, branch isolation, idempotency, and recovery tests pass. |
| 10 | Admin/support abuse or over-broad data access | M | High | Founder + Ops | Least privilege, MFA, ticket-linked audit, dual approval for bulk/destructive actions. |
| 11 | PII/raw sensitive story content enters analytics/logs or an AI provider beyond policy | M | High | Code + Legal-verify | Data inventory/redaction/retention/delete/export tests and DPA review complete. |
| 12 | Provider, moderation, payment, ad, or DB outage creates loss/corrupt state | M | High | Code + Ops | Fail-safe/no-spend behavior and restore/provider-outage game day pass. |
| 13 | Adult BYOK keys/content leak across processor or account boundary | M | High | Code + Legal-verify | BYOK remains disabled until separate processor, age gate, isolation, and key hygiene are verified. |
| 14 | XSS/HTML/Markdown/URL injection through prose, imported lore, or support content | M | High | Code | Strict rendering sanitization/CSP and import allow-list tests pass. |
| 15 | Compliance/documentation failure blocks payment, ad, store, or regulatory response | M | High | Founder + Legal-verify | Evidence pack, policy versions, DPIA decision, and incident contacts are complete. |

### 1A. Assets & trust boundaries

| Asset | Authoritative owner | Trust boundary | Required properties |
|---|---|---|---|
| AI/provider, Stripe, ad, Supabase service keys | Server secret manager | Browser ↔ edge/API; CI ↔ secret store | Never in client/repo/logs; scoped, rotated, audited. |
| Campaign ledger / StateTx / branches | Server database / narrow RPC | Browser/model ↔ server transition API | Append/versioned, owner-checked, idempotent, replayable. |
| Save projections / maps / inventory / HUD | Rebuildable projection | Client cache ↔ server ledger | Versioned, stale-safe, no direct authority. |
| Entitlements/capacity/packs/refunds | Server entitlement ledger | Stripe/ad callback/client ↔ verification service | Exactly-once grant/reversal, immutable audit. |
| User text, images, TTS source, imports | Untrusted content | User/import/provider ↔ moderation/render | Sanitized, policy-scanned, scope-labelled, retention-limited. |
| Admin/support console | Privileged application | Staff device ↔ admin API | MFA, role separation, ticket/reason, audit, JIT access. |
| Analytics and safety evidence | Pseudonymous/limited store | Product ↔ analytics/support | Purpose-limited, redacted, deletion/export aware. |
| Ad callbacks and RewardIntent | Provider ↔ server webhook | Callback boundary | Signature, nonce, expiry, idempotency, fraud hold. |
| Adult BYOK credential | User-owned encrypted secret reference | Adult web session ↔ isolated broker | Never log/display/reuse outside authorized request; separate processor/mode. |

### 2A. STRIDE-style threats per asset

| Asset | Spoofing | Tampering | Repudiation | Information disclosure | DoS / cost | Privilege escalation |
|---|---|---|---|---|---|---|
| Ledger/save | Forged user/session/campaign ID | Client writes item/quest/HP or replayed turn | “I never chose that” | Cross-account reads | Replay/rebuild flood | Model/browser calls privileged RPC |
| Entitlements | Forged Stripe/ad callback | Extra turns/packs/refunds | Missing grant/reversal trace | Purchase/ad identifiers | Retry/refund farm | Free becomes Mid/High/Admin |
| Keys | Stolen deploy/API token | Malicious model or DB config | Untracked use | Logs/client bundle/repo | Provider-spend explosion | Service role becomes public path |
| AI boundary | Prompt impersonates policy/tool | Tool argument or ledger claim injection | Unclear model/version decision | System prompt/PII retrieval | Context/output/image flood | Model changes mode/role/entitlement |
| Kid Mode | Age/mode spoof | Toggle/cache mutation | Parent dispute | Adult asset/evidence leak | Bypass limits | Adult tool/ads in child profile |
| Admin | Phished staff session | Bulk delete/refund/role change | No reason/ticket | Transcript export | Mass queries | Support becomes admin |
| Ads | Callback spoof/device farm | Duplicate reward | Completion dispute | Identifier/consent leak | Invalid traffic clawback | Reward placement grant bypass |
| Imports/render | Malicious file/HTML/URL | Stored XSS/unsafe asset | Origin unknown | SSRF/data exfiltration | Parse bomb | Admin/browser script execution |

### 3A. Attack trees for top real abuses

| Abuse | Root paths | Mandatory controls | Detection / hard outcome |
|---|---|---|---|
| Prompt injection | Direct player text; imported lore; retrieved evidence; tool result. | Treat all as data; typed tool schema; server auth; no hidden secret in context; no model direct write. | Injection event logged; tool denied; ledger unchanged. |
| Jailbreak / policy bypass | Fiction framing, translation, encoding, role switch, iterative refinement. | Pre/post policy classifier, safe completion, Kid-specific stricter policy, versioned red team. | Block/redirect; severe pattern rate-limited/escalated. |
| Key theft | Git leak, client bundle, CI log, error payload, compromised admin. | Secret manager, scanner, redaction, scoped roles, rotation, precommit/CI block. | Rotate/revoke; investigate audit exposure. |
| Capacity fraud | Modified client, replayed request, multi-tab refresh, duplicate refund. | Server capacity ledger, turn ID/idempotency key, accepted-turn-only spend, reconciliation. | Duplicate rejected; account risk flag if anomalous. |
| Ad reward fraud | Forged callback, nonce replay, emulated device, VPN farm. | Signed S2S, nonce/user bind/expiry, cap, provider reconciliation, hold queue. | No grant until verified; ads flag off if mismatch. |
| Account takeover | Credential stuffing, reset abuse, OAuth misbinding, token theft. | MFA staff; rate limits; uniform reset; secure cookies; rotation/revocation; reauth. | Session revoke, notify user, preserve evidence. |
| Save tampering | Client projection edit, API object-ID swap, branch merge exploit. | Server event transition validation, RLS, expected revision, branch scope, replay check. | Reject; rebuild projection; no partial commit. |
| Cross-account access | RLS policy/view/storage/RPC/realtime defect. | Default-deny RLS, `USING` + `WITH CHECK`, view/security review, negative matrix tests. | Deny 403/no data; alert on repeated substitutions. |
| Kid/adult bypass | UI toggle, stale cache, direct route, shared account, age field mutation. | Server mode attribute, scope tags, mode checks every asset/request, no adult cache in Kid surface. | Fail closed to Kid-safe/read-only; audit mode mismatch. |
| Severe safety mishandling | Filter gap, fallback model gap, human review delay, unsafe image/TTS. | Layered moderation, no unsafe fallback, severity playbook, kill switch, reviewer SLA. | Block/safe response; preserve minimum evidence; escalate. |
| PII in logs | Raw prompts, URL/referrer, stack trace, analytics replay, support export. | Field allow-list, redaction, pseudonymous IDs, short retention, access audit. | Redaction test fails release; incident runbook if exposure. |
| Cost amplification | Long inputs/output, retries, images, bots, provider errors. | Token/output/image/concurrency/user/project budgets, circuit breakers, cheapest safe fallback. | Stop at reservation limit; Play Later instead of duplicate generation. |
| Admin abuse | Over-broad role, stolen session, direct DB, unreviewed script. | JIT role, MFA, reason/ticket, dual control, immutable audit, least privilege. | Lockdown role, preserve audit, notify owner/counsel as appropriate. |
| Entitlement forgery / BYOK leakage | Client grant, webhook replay, cross-user key access, wrong processor path. | Entitlement state machine, signature, encrypted secret reference, isolated adult broker. | Reject/quarantine; rotate/revoke relevant secret. |

### 4A. Hardening controls mapped to layers

| Layer | Controls | Owner | Done-when |
|---|---|---|---|
| Edge proxy / web | HTTPS, CSP, trusted-origin CORS, CSRF/cookie policy, request/body/time limits, WAF/bot signals, rate limit. | Code + Ops | Security headers and hostile-input tests pass. |
| Auth | Email verification/upgrade policy, session rotation/revoke, reauth sensitive actions, staff MFA, auth event audit. | Code | ATO/reset/session suite passes. |
| Supabase/RLS | RLS every exposed table; ownership policy; safe views/RPC; storage/realtime/export tests. | Code | Owner/non-owner matrix passes for 100% exposed objects. |
| Ledger/capacity | Expected revision, idempotency, invariant check, event hashes, accepted-only spend/refund. | Code | Duplicate/out-of-order/replay tests produce one safe result. |
| Model gateway | Allow-listed structured calls, context/output limits, injection separation, provider fallback, policy hash. | Code | Model cannot change state/role/policy directly. |
| Ads S2S | RewardIntent nonce, signature verification, cap, provider reconciliation, fraud hold. | Code + Ops | Forged/replayed callback receives no grant. |
| Stripe | Signature, event-ID idempotency, entitlement state machine, dispute/refund reconciliation. | Code + Ops | Reordered/duplicate webhook suite passes. |
| Logging/data | Schema allow-list, secret/PII redaction, access logging, retention/deletion, audit separation. | Code + Legal-verify | Sample shows no raw sensitive text/secret; deletion workflow passes. |
| Admin | Role matrix, JIT/MFA, ticket, approvals, export restrictions, immutable audit. | Founder + Ops | Privilege and bulk-action tests require correct approvals. |
| T&S | Policy gates, report queue, escalation, age/mode separation, reviewer access controls, kill switches. | Ops + Code | Severe-case drills meet SLA. |

### 5A. Secure defaults by tier

| Tier | Default security / product posture | Differences |
|---|---|---|
| Free adult | Authenticated generation only; strict per-account/IP/device budget; optional reward verification; smallest data retention consistent with support. | No admin tools, no BYOK, no client capacity authority. |
| Mid / High | Same security gates; ads disabled; higher capacity only through server entitlement. | Do not weaken audit/rate limit/safety because subscription exists. |
| Admin BYOK | Adult web-only, explicit age/processor route, encrypted credential reference, no request logging beyond minimum metadata, strict export/admin separation. | Never accept actual key in client analytics or share across account/campaign. |
| Kid Mode | Highest privacy defaults, no ads/profiling, conservative content/image/TTS policy, parent/guardian control path, restricted sharing/export. | Mode is server state, checked on every request/asset; no adult fallback. |

### 6A. Detection, alerts, and incident runbooks

| Signal | Alert threshold | Immediate action | Owner | Closure evidence |
|---|---|---|---|---|
| RLS/authorization denial spike or cross-user attempt | 5× baseline or confirmed data exposure | Disable risky endpoint/role; preserve logs; assess scope. | Code + Ops | Root cause, test, affected-user/counsel decision. |
| Secret scan / provider abuse | Any verified secret exposure | Revoke/rotate; stop affected deployments; audit use. | Code + Ops | Rotation proof and no residual secret. |
| Ledger invariant failure | Any production failure | Quarantine campaign write path; rebuild projection; pause affected feature. | Code | Replay passes and compensating event documented. |
| Reward/purchase mismatch | >0.1% or any systemic duplicate | Disable ad/checkout feature flag; reconcile. | Code + Ops | Exact ledger/provider match. |
| Kid/adult mismatch | Any confirmed case | Disable affected mode/asset route; fail closed to Kid-safe. | Founder + Code | Traversal regression passes; review completed. |
| Severe unsafe output | Any critical confirmed | Kill model/feature/locale if systemic; preserve minimum evidence; escalate. | T&S + Founder | Policy/test/fallback repaired. |
| Cost anomaly | >120% planned daily cap or >3σ session cost | Images off, route down, pause acquisition, enforce queue. | Founder + Code | Spend normalizes; cause fixed. |
| Admin anomaly | Bulk export, privilege escalation, impossible geo/device | Revoke session/role; preserve audit; investigate. | Founder + Ops | Access review and remediation complete. |

### 7A. Red-team pack: 50 cases with expected hard outcomes

| Group | Cases (each separately tested) | Expected hard outcome |
|---|---|---|
| Injection 1–10 | Ignore prior rules; reveal system prompt; stored-lore instruction; imported-file instruction; tool-call fabrication; “developer says”; encoded override; ask to use admin; claim policy change; retrieve hidden memory. | Treat as untrusted data; no secret/tool/ledger/role change; log injection signal. |
| Jailbreak 11–20 | Fictional exception; translation/rot13; role-play as unrestricted GM; repeated escalation; indirect quote; child/adult coercion; safe-mode disable; hidden instruction extraction; unicode obfuscation; multi-turn “confirm override.” | Policy holds across model/fallback; Kid stays restricted; no hidden policy disclosure. |
| Ledger/capacity 21–30 | Forge item; replay turn; two tabs same action; change campaign ID; refund loop; fake accepted response; negative capacity; duplicate image grant; retry after canceled request; force branch merge. | Server rejects/serializes; one canonical event; no incorrect credit/state. |
| Auth/RLS 31–38 | Object-ID swap; stale token; deleted-user token; reset enumeration; cross-user export; storage URL guess; realtime subscription; service role in browser. | 401/403/no data; generic response; security alert where appropriate. |
| Ads/payments 39–43 | Forged S2S callback; nonce replay; reward from Kid/Mid; altered price; duplicate Stripe event. | No grant/entitlement; event held/audited; feature flag can disable. |
| Safety 44–48 | CSAM/grooming attempt; self-harm escalation; credible threat; doxxing request; adult content in Kid campaign. | Block/safe response/escalation per policy; no unsafe generation; minimum evidence only. |
| BYOK/admin 49–50 | Ask model for BYOK key; support agent exports all campaigns. | Secret never visible; admin action denied/dual-approved/audited. |

### 8A. 30-day security ship plan

| Days | Deliverable | Owner | Exit criterion |
|---:|---|---|---|
| 1–5 | Data-flow map, threat model, asset inventory, role matrix, P0 risk owners. | Founder + Code | Every critical asset/flow has a control and test. |
| 6–10 | RLS/API auth matrix, service-role isolation, session/rate-limit hardening. | Code | Cross-account negative suite passes. |
| 11–15 | Ledger/capacity/Stripe/ad idempotency; secrets scan/rotation. | Code + Ops | Replay/duplicate/callback tests pass. |
| 16–20 | AI security red team, mode traversal, high-severity moderation and kill switches. | Code + T&S | All P0 cases safe; drill complete. |
| 21–25 | Logging/redaction/retention, admin JIT/audit, backup restore. | Code + Legal-verify | Sample audit/recovery works. |
| 26–30 | External review/pen-test scope, incident tabletop, release risk acceptance. | Founder + Ops + Legal-verify | No open critical/high risk without explicit owner/mitigation date. |

### 9A. Open founder decisions

| Decision | Recommendation | Alternative | Cost if wrong |
|---|---|---|---|
| Anonymous play | Disable at public launch or strictly limit it to non-saving demo. | Anonymous-to-account upgrade. | Anonymous abuse/cost/age complexity. |
| Public sharing/exports | Private export only at launch; no public feeds. | Public share cards with moderation. | Online-safety/moderation scope jumps. |
| Staff access | JIT, MFA, ticketed role. | Permanent admin accounts. | Permanent access raises insider/phish blast radius. |
| BYOK public timing | Later, after core security/adult processor proof. | Launch web-only with manual approval. | Secret/processor/T&S support complexity. |

## PART B — Unit economics & cost engineering

### 0B. Executive: can this business work? under what assumptions?

**Yes, conditionally.** The business works only if delivery cost is treated as a per-session budgeted service, not an unbounded chat endpoint. Mid/High pricing can support stronger writer routes when measured `fully_loaded_variable_cost / paid_active` stays well below net subscription revenue after payment fees, refunds, support, and image usage. Free adult must be constrained by capacity, low-cost routing, and verified contribution from conversion/packs/optional ad rewards; Kid Mode is a trust/safety cost centre at launch, not an ad yield assumption. All pricing and processor/tax implications require counsel/accountant verification.

### 1B. Full COGS model with spreadsheet-ready formulas

```text
accepted_turn_cost = writer_input_tokens/1e6*writer_input_price
                    + writer_cached_tokens/1e6*writer_cached_price
                    + writer_output_tokens/1e6*writer_output_price
                    + parser_tokens/1e6*parser_price
                    + moderation_calls*moderation_unit_cost
                    + storage_egress_turn_cost
retry_cost = sum(retry_attempt_costs where final_turn_accepted_or_refunded)
image_cost = image_requests*image_unit_cost + image_moderation_cost + storage_egress_image_cost
session_variable_cost = accepted_turn_costs + failed_generation_costs + image_cost
                      + payment_variable_cost + ad_vendor_cost + allocated_infra_cost
net_paid_revenue = gross_subscription_or_pack_revenue - payment_fees - refunds - chargebacks - taxes_as_applicable
contribution = net_paid_revenue + verified_ad_revenue - session_variable_cost
contribution_margin = contribution / (net_paid_revenue + verified_ad_revenue)
```

| Cost bucket | Include | Meter | Owner |
|---|---|---|---|
| Writer | Input, cached input, output, retry, fallback, tool/structured call. | Request/model/tokens/cache/latency/campaign/tier. | Code + Founder |
| Image/memorable | Generate, moderation, upscaling if any, storage/egress, failed job. | Job ID, entitlement, image class, dimensions, result. | Code |
| Safety | Input/output classification, human review allocation, incident/appeal. | Policy version/severity; no raw text in general analytics. | Ops |
| Infrastructure | DB, functions, storage, egress, queues, monitoring, auth. | Session-minute/accepted turn allocation. | Ops |
| Payments/ads | Processor fee, refund/chargeback, rewarded vendor fees/reversals. | Payment/ad event ID reconciled to entitlement. | Ops |
| Support | Ticket/contact minutes, credits/refunds, abuse review. | Category/cohort, aggregated. | Ops |

### 2B. Margin scenarios by tier

Use the following spreadsheet, populated with actual provider price sheets and Stripe/processor fee data at the time of launch; do not plan on assumed ad eCPM or free-user conversion.

| Scenario | Mid £14.99 | High £29.99 | Pack | Rule |
|---|---:|---:|---:|---|
| Pessimistic | `net_revenue - P95 monthly usage cost - allocated support/refund` | same | `pack_net - pack_turn_cost` | If negative for two weeks, lower routing/image use or cap safely before scaling. |
| Base | `net_revenue - P50 usage cost - expected support/refund` | same | same | Must meet founder-set gross contribution floor after all variable costs. |
| Optimistic | `net_revenue - P50 cost with target cache/routing - lower support` | same | same | Never use it for public promises or expansion commitments. |

**Honeymoon accounting:** record launch grants as acquisition cost: `honeymoon_cost_by_tier = grant_turns × expected_turn_cost`, separate from normal monthly usage. **Fails/aborts:** provider cost may still occur, but player capacity is refunded/no-spend; track as reliability cost, not user revenue. **Ad extras:** `adult_free_ad_extra_margin = verified_ad_revenue - extra_turn_cost - fraud/reversal allocation`; if negative, retain one/day only if it demonstrably improves HookArc/D1 without damaging paid conversion.

### 3B. Cost-control levers ranked Impact × Player-harm

| Lever | Cost impact | Player harm | Use rule |
|---|---:|---:|---|
| Route parser/extraction/recap to cheap structured model | High | Low | Default; validate outputs. |
| Stable prefix caching | High | Low | Use versioned non-sensitive prompts only. |
| Output ceiling by selected prose length | High | Low | Let player choose Compact/Standard/Cinematic; preserve state coverage. |
| Evidence budget/pager | High | Low | Drop supporting evidence before manifest/intent/contract. |
| Skip image outside milestones/explicit request | High | Low | Text story always continues. |
| Async image queue / failure hold | Medium | Low | Never make image block text. |
| Retries bounded; no retry on safety/billing/validation error | Medium | Low | Show safe recovery. |
| Per-user/project cost reservation | High | Medium | Explain remaining allowance; no surprise mid-action gate. |
| Route normal prose down during incident | High | Medium | Maintain safety/continuity quality floor. |
| Reduce free capacity/continuity | Medium | High | **Do not use.** |
| Weaken moderation / Kid Mode | Medium | Critical | **Never.** |

### 4B. Model routing matrix

| Job | Free | Mid | High | Admin BYOK | Gate |
|---|---|---|---|---|---|
| Intent/entity parse | Cheapest validated structured model. | Same/faster. | Same/faster. | BYOK only if schema reliability test passes. | Code validates IDs/schema. |
| Normal writer | Cost-capped writer, bounded context/page. | Stronger writer / larger verified quality envelope. | Best approved route. | Isolated BYOK route. | Same claim/safety/ledger gate. |
| Critical reveal/recovery | Approved strong model under cap. | Strong model. | Strong model. | BYOK if allowed. | Must pass named claim/obligation check. |
| Combat/check narration | Cheap writer from code outcome. | Better voice route. | Better voice route. | BYOK permitted. | No state mutation. |
| Recap/evidence | Cheap async model or deterministic template. | Same. | Same. | Optional local. | Supporting-only. |
| Image | One-off entitlement/milestone; strict safety. | More capacity. | More capacity/priority. | Adult web-only if policy permits. | Async; fail holds story. |
| TTS | Off/selective default. | Selective/premium voice. | Expanded voice. | Own provider only if isolated. | Final approved text only. |

### 5B. Abuse/cost amplification defenses

| Vector | Control | Owner | Done-when |
|---|---|---|---|
| Long input/context flood | Character/token caps, parser truncation with clear notice, pager budget. | Code | P99 request stays inside cost ceiling. |
| Retry spam | Idempotency, cooldown, max attempts, same-input dedupe. | Code | 100 retry test has bounded cost/no duplicate state. |
| Image spam | Per-tier entitlement, queue, concurrency/size cap, cancel/orphan handling. | Code | User cannot exceed daily image reservation. |
| Account farm | Verified account requirement, IP/device/risk limits, abuse review. | Ops + Code | Farm simulation cannot exceed project budget. |
| Provider cascade | Circuit breaker, retry-after, queue, fallback, Play Later. | Code | Chaos test preserves state/no duplicate bill. |
| Webhook replay | Signature/event/nonce idempotency. | Code | Duplicate/reordered callback yields one result. |

### 6B. Monitoring KPIs, guardrails, kill switches

| KPI | Daily guardrail | Action |
|---|---|---|
| Cost per accepted turn / P95 | At/under approved model by tier. | Route routine work down; inspect prompt/cache regressions. |
| Cost per engaged hour | At/under cohort budget. | Disable images/pause acquisition/adjust capacity only at boundary. |
| Cache hit rate | Target set per prompt version. | Investigate unstable prefix/invalidation. |
| Retry and fail cost | No unexplained spike. | Fix provider/parse; do not charge player. |
| Image attach rate/cost | Within tier entitlement model. | Images-off switch/queue cap. |
| Free contribution | Never assume ad revenue. | Keep cohort small; shift to owned growth if negative. |
| Project daily spend | 50/75/90/100% alert. | Warn, reduce route, images off, Play Later, pause acquisition. |
| Safety/quality floor | No regression. | Do not trade it for cost. |

### 7B. Sensitivity analysis

| Variable change | Model response |
|---|---|
| Model price +30% | Recompute tier contribution; strongest route only for critical/high tiers; cache/pager/exact output ceilings first. |
| Retention −30% | Acquisition/honeymoon cost amortizes over fewer sessions; pause paid UA; improve first hour, not more discounts. |
| Paid attach −30% | Free cohort may be structurally loss-making; do not increase ads/day automatically; improve value clarity/pack fit. |
| Tokens/turn +30% | Detect prompt bloat; reduce evidence first, not state/intent; enforce selected prose length. |
| Image attach +30% | Queue/cap images, use trial-once/Memorable entitlement, measure story value. |
| Ad fill/eCPM −30% | Treat ads as optional bridge only; preserve caps, rely on packs/subs. |
| Abuse rate +30% | Tighten verification/rate limits/cost reservation; do not punish legitimate Mid/High users. |

### 8B. 90-day cost hardening plan

| Days | Outcome | Owner | Exit criterion |
|---:|---|---|---|
| 1–30 | Cost event ledger, routing flags, budget reservation, daily alerts, load fixture. | Code + Founder | ≥95% completed sessions costed and invoice difference ≤2%. |
| 31–60 | Cache/pager optimization, image queue/caps, provider fallback/chaos, Free cohort model. | Code | P95 cost and failure rate meet approved target. |
| 61–90 | Contribution cohort analysis, verified ad pilot reconciliation, route quality blind test, scale decision. | Founder + Ops | Two stable weeks meet margin/safety/latency gates. |

### 9B. Open founder decisions

| Decision | Recommendation | Alternative | Cost if wrong |
|---|---|---|---|
| Contribution target | Set a conservative minimum after actual provider/Stripe data, not public estimates. | Growth-first loss leader. | Wrong target either prevents learning or burns runway. |
| Free output length | Player-selectable cap with fair capacity display. | One length. | Too long costs; too short feels empty. |
| Image trial | One opener/memorable trial only, async. | No free image. | Too generous costs; none weakens magic. |
| BYOK subsidy | No subsidy; charge isolation/support separately if launched. | Treat as High feature. | Cross-subsidy and processor/safety complexity. |

## PART C — Legal / age / store compliance matrix

> **Legal disclaimer:** This is an implementation-oriented research checklist, not formal legal, tax, or regulatory advice. Verify consequential UK, tax, age-assurance, consumer, advertising, payments, adult-content, Online Safety Act, and store decisions with qualified counsel and current official policy before relying on them.

### 0C. Launch blockers versus later

| Scope | Must before public web adult Free | Later / only if triggered |
|---|---|---|
| Privacy/data | Data map, lawful basis/DPIA decision, privacy/cookie notices, processor register, security/rights/export/delete path. | International expansion, public sharing, new analytics/ad vendors. |
| Consumer/payment | Clear price/renewal/cancel/refund/digital-content disclosures, Stripe verification, durable confirmation, tax review. | Play/Apple billing, alternate currencies, adult processor. |
| Age/safety | Product age boundary, mode separation, adult/Kid content rules, report/escalation, counsel review. | Formal age assurance expansion, store rating submission, public UGC. |
| Ads | Written vendor eligibility, optional reward disclosure, consent design, S2S fraud controls. | Mediation, Kids ads, offerwall, native store ads. |
| Store | None for web launch except accurate web claims. | Play/Apple rating, billing, data safety/privacy, reviewer/demo, native utility. |

### 1C. Web adult Free compliance matrix

| Area | Product requirement | Owner | Done-when |
|---|---|---|---|
| UK GDPR / privacy | Purpose/retention/data map; lawful basis; rights; processor controls; security; breach process. | Legal-verify + Code | Counsel review and tested export/delete/redaction. |
| Cookies / PECR | No nonessential cookie/device access before consent; granular withdrawal and consent log. | Legal-verify + Code | Consent traversal/test proves zero pre-consent nonessential storage. |
| Consumer distance selling | Business identity, total/tax price, term/renewal/cancel, functionality, digital supply/withdrawal information, durable confirmation. | Legal-verify + Founder | Checkout and receipt QA pass. |
| AI disclosure | Accurate statement that narrative/images are AI-generated, can err, have safety controls, and player should not rely on fiction for real-world advice. | Founder + Legal-verify | Product/store/Terms wording approved. |
| Adult content | Clear mature policy, access controls, reporting/moderation, no illegal content; assess age assurance/Ofcom duties. | Legal-verify + T&S | Written risk decision and technical enforcement tests. |
| Accessibility | Apply relevant web accessibility practice and publish contact/feedback route; verify legal obligations by counsel. | Code + Legal-verify | Keyboard/mobile/readability test pass. |

### 2C. Kid Mode compliance matrix — verify with counsel

| Requirement | Product requirement | Owner | Done-when |
|---|---|---|---|
| Children’s Code | Best interests, high privacy defaults, minimisation, no behavioural ads/profiling, DPIA/age-appropriate transparency. | Legal-verify + Code | Documented assessment, mode tests, privacy settings audit. |
| Ad-free launch | No third-party ad request/preload/callback/identifier in Kid flow. | Code | Network test shows zero ad calls. |
| Parent controls | Clearly scoped gate for purchases/mode changes/export where applicable. | Code + Legal-verify | Parent flow tests and plain language copy pass. |
| Content policy | Stricter text/image/TTS rules and safe fallbacks; adult evidence/assets never cross. | T&S + Code | 100% mode-isolation red-team suite pass. |
| Data | Short retention/minimal telemetry; no precise location; restricted sharing. | Code + Legal-verify | Analytics/data inventory verifies policy. |

### 3C. Ads compliance for rewarded adult web

| Requirement | Implementation | Done-when |
|---|---|---|
| Written eligibility | AppLixir confirms exact AI-GM/maturity/domain/traffic use. | Stored written approval; otherwise flag remains off. |
| Opt-in/reward disclosure | Before watch: action, exact non-transferable reward, daily cap, skip path. | UX/accessibility test passes. |
| S2S fraud control | Signed callback, nonce, expiry, user bind, idempotency, reversal. | Forged/replay tests grant zero reward. |
| Consent/privacy | Vendor/cookie assessment, regional choice, policy disclosure. | Counsel/official verification and automated consent test. |
| Ad-free paid/Kid | Server checks entitlement/mode before request. | Automated network/UI test pass. |

### 4C. Stripe versus adult BYOK processor requirements

| Route | Requirements | Blocker |
|---|---|---|
| Stripe Mid/High/packs/themes | Signed webhooks, clear digital sale/renewal/cancel/refund, tax/VAT review, fraud/dispute runbook, age/product eligibility. | No production launch until exactly-once entitlement/reconciliation passes. |
| Adult BYOK processor | Separate legal entity/merchant risk review as appropriate, adult age/content policy, web-only access, processor written approval, account/key isolation, no Kid/Play route. | Do not infer Stripe eligibility or store approval; written processor/counsel review required. |

### 5C. Play/Apple preflight matrices — later only

| Store dimension | Google Play | Apple | Preflight exit criterion |
|---|---|---|---|
| Billing | Play Billing for digital goods, secure verification/notifications. | IAP/StoreKit for digital goods, restore/verification. | Product/entitlement system passes store sandbox test. |
| AI/UGC | Prevent restricted content, report/flag, accurate target age/data safety. | Filter/report/block/support contact; age-rating/mature-content treatment. | Moderation/reviewer path tested. |
| Kids | Families policies/approved SDKs/child ad treatment. | Kids category restrictions/parental gates/limited contextual ads. | Do not submit Kid build without written review. |
| Review | Data safety, age rating, permissions, demo/test credentials. | Privacy nutrition, age rating, complete backend/demo/review notes. | Store-specific checklist green. |
| Native value | Proper Android UX. | Not a thin web wrapper; app-specific value. | Internal product review approves. |

### 6C. Policy document outlines — section lists only

| Document | Required sections |
|---|---|
| Privacy | Controller/contact; data categories; purposes/lawful bases; providers/processors/transfers; retention; security; user rights; children/age; AI processing; cookies; contact/complaint. |
| Terms | Eligibility/age; account; content rules; AI limitations; ownership/licence; paid service; cancellation; acceptable use; moderation/report; suspension; liability/disputes; policy changes. |
| Content | Allowed/blocked content; Kid/adult separation; prohibited exploitation/CSAM/self-harm/threat/doxxing; reporting; review/appeal; copyright; emergency. |
| Refund | Subscription cancellation; pack/cosmetic policy; failed/empty turn; accidental duplicate; chargeback; exclusions; contact/timing. |
| Cookies | Categories; provider; purpose; essential/nonessential; consent/withdrawal; retention; regional rights. |

### 7C. Product features implied by policy

1. Account export/delete/correction request and identity verification.
2. Consent/CMP state server-visible before nonessential vendor initialization.
3. Safety report/block/appeal and secure case record.
4. Age/mode state with mode-aware caches, assets, prompts, telemetry, and entitlements.
5. Price/renewal/cancel/refund receipts and Customer Portal.
6. Provider/processor inventory and versioned policy acceptance.
7. Incident evidence preservation and notification decision log.

### 8C. Evidence pack to retain

| Pack | Contents | Owner |
|---|---|---|
| Privacy | DPIA/assessment, RoPA/data map, DPA/subprocessor list, transfer notes, consent tests, deletion/export samples. | Legal-verify |
| Safety | Policy version, red-team scores, reviewer training, escalation drills, report stats, mode tests. | T&S + Ops |
| Security | Threat model, RLS/auth tests, pen-test scope/results, secret rotation, backup restore, admin audit samples. | Code + Ops |
| Consumer/payments | Checkout screenshots, terms version, receipts, webhook/reconciliation evidence, refund/dispute runbook. | Founder + Ops |
| Ads | Vendor approval, consent/disclosure, S2S test, fraud/reversal records, Kids/Paid suppression test. | Founder + Code |
| Store later | Ratings/forms, privacy/data safety, review credentials, moderation demo, billing test results. | Founder |

### 9C. Open founder decisions

| Decision | Recommendation | Alternative | Cost if wrong |
|---|---|---|---|
| Adult Free scope | Keep mature policy narrow and controllable at web launch. | Broad adult scenarios. | Vendor/processor/regulatory/moderation burden rises sharply. |
| Kid Mode public release | Release only after counsel/DPIA/mode tests; otherwise waitlist/private beta. | Public day one. | High child-privacy/safety exposure. |
| Public sharing | No public content/feed at launch. | Moderated share cards. | Online safety/classification/abuse workload. |
| Age assurance | Decide after counsel/Ofcom scope analysis, not a UI-only self-declaration. | Self-reported toggle. | False compliance and adult access risk. |

## PART D — First-session retention science

### 0D. Top 12 retention killers + fixes

| Killer | Player feels | Fix layer | Exit criterion |
|---|---|---|---|
| Setup form before fantasy | “I am doing homework, not beginning a story.” | NewGameModal | First prose within 60 seconds for 80%+ complete starts. |
| Generic opening ignores setup | “My choices were decorative.” | openingEstablishment | Name/kit/place/folk acknowledgement occurs by turn 2. |
| No immediate pressure | “Nothing needs me.” | openingHooks | A legible stake exists in first prose. |
| Fake choice | “The game already decided.” | intentParser + ledger | First two forks yield different StateTx or explicit common destination with different cost. |
| No observed consequence | “It is chat, not a campaign.” | sceneFacts/HUD | HookArc consequence appears before offer/capacity friction. |
| Text wall/HUD overload | “I do not know what matters.” | HUD | One primary action/location/thread visible; detail on demand. |
| Rules surprise | “The GM is unfair.” | ledgerCombat/checkMath | Stakes/criteria shown in chosen transparency mode. |
| Slow/empty/failing reply | “The app is broken.” | GM proxy/capacityLedger | Safe retry/no-spend and status copy. |
| Premature capacity message | “It wants money before proving value.” | capacityLedger | HookArc and action-resolved guard pass. |
| Samey retries/openings | “Nothing I do changes shape.” | beatFingerprint/openingHooks | Structural novelty score meets test floor. |
| Unclear safety/tone | “I cannot trust this experience.” | Kid Mode/settings | Mode/comfort control visible before sensitive content. |
| Return without recap | “I forgot where I was.” | campaignMemory/HUD | Verified “Since you left” delta on return. |

### 1D. Beat contracts by genre

| Genre | First 60 seconds | First 10 turns | First hour | Exit condition |
|---|---|---|---|---|
| LitRPG | Identity/kit + visible anomaly/pressure. | Earn/decline first System consequence; class/ability has cost. | Tactical crisis, first advancement or meaningful build fork, tracked gear/quest. | Player can explain current build, debt/threat, next route. |
| Isekai/summon | Arrival mismatch plus local human anchor. | Translation/cultural/loyalty choice changes who trusts or needs player. | First route/sponsor/return-related consequence. | Player has chosen what they owe or refuse. |
| Late awakening | Ordinary routine and relationship established before rupture. | Power/public secrecy fork and witnessed consequence. | Training/use dilemma with social cost. | Baseline life has visibly changed. |
| Story RPG | Local problem, grounded place, workable kit. | Player resolves/resists a human-scale obligation. | First travel/crisis/relationship payoff. | One place and one person respond differently because of player. |
| PYOA mystery | Fixed seed mystery, three evidence routes, urgency. | At least one clue is recorded with provenance; theory can be wrong. | Competing interpretation/accusation changes case phase. | Player understands what is known/uncertain and why. |
| PYOA romance | Boundaries and tone selected; mutual social pressure. | Player choice changes trust/public/private relation, never forced intimacy. | Consequence of promise/avoidance/reunion. | Player sees consent-respecting future choice. |
| PYOA space | Route/resource/crew signal, no jargon dump. | Navigation/cargo/rescue fork changes map/clock/knowledge. | First maintenance/crisis/faction tradeoff. | Player can name ship constraint and crew objective. |
| Tabletop | Transparency mode, party/role or solo identity, immediate clear obstacle. | One fair check/action with explained outcome. | Encounter/travel/mystery loop and map/journal use. | Player knows how rules, choices, and consequences relate. |

### 2D. HookArc + honeymoon + stakes

Already covered — see Ads/Growth and Product Operating Manual. New implementation measurement: persist `hook_arc_started`, `identity_acknowledged`, `first_stake`, `meaningful_choice`, `observed_consequence`, `next_voluntary_direction`, `offer_eligible`, and `offer_shown`. The player feels fair treatment because the offer guard sees a completed causal beat, not a generic countdown.

### 3D. Cognitive load / New Game simplification

| Surface | Default | Reveal later | Test |
|---|---|---|---|
| Genre choice | 5–8 concrete fantasy cards with one-line stakes. | Full subgenre/profile. | Choice time and abandonment. |
| Identity | Name, look, kit, one origin/world cue. | Deep bible/rules/voice axes. | Set-up completion and acknowledgement. |
| Hook | One seeded recommended hook + “show another” + “write mine.” | Expert seed/tags. | First-choice confidence. |
| Rules | Simple transparency choice: Story / Clear checks / Table rules. | Custom pasted rules. | Check comprehension after first resolution. |
| Safety | Kid Mode/comfort visible, no shame/no buried toggle. | Detailed boundaries. | Mode selection and accidental exposure tests. |
| Expert | Hidden behind “Build a custom campaign.” | Compiler, permissions, randomize, audit. | Do not pollute Simple flow. |

### 4D. Measurement plan

| Event | Cohort / metric | Decision it supports |
|---|---|---|
| `new_game_started`, `new_game_completed` | Start completion, genre/source split. | Simplify setup. |
| HookArc steps | Completion funnel/time/turn. | Hook/capacity fairness. |
| `turn_accepted`, `turn_failed`, `turn_cancelled`, `turn_refunded` | Reliability and first-session quality. | Provider/routing fixes. |
| `choice_selected` and free-text intent | Agency diversity/obligation coverage. | Fake-choice detection. |
| `hud_opened`, `journal_opened`, `map_opened` | Feature usefulness after teaching. | HUD/tutorial order. |
| `out_of_turns`, `offer_eligible`, `offer_shown`, `offer_dismissed` | Fairness and friction. | Offer timing, not dark patterns. |
| D1/D7 proxy | Cohort return after local day/week. | Retention trend. |
| `correction_used`, `safety_report`, `support_contact` | Trust/reliability. | Fix pain, not blame user. |

### 5D. Twenty experiments

| # | Hypothesis | Metric | Kill criterion |
|---:|---|---|---|
| 1 | One recommended hook increases setup completion. | New Game complete. | ≥5pp drop vs current. |
| 2 | Showing one stake before lore reduces abandonment. | Turn-1 start. | No lift after 500 eligible users. |
| 3 | Identity receipt by turn 2 improves HookArc. | HookArc complete. | Negative quality reports. |
| 4 | Three concrete approach shapes beat generic choices. | Choice/free-text continuation. | Free-text suppression rises. |
| 5 | “Here now” lowers repeated roster questions. | Repeated clarification rate. | HUD ignored/overload increases. |
| 6 | Post-consequence receipt raises D1. | D1 proxy. | Story feels mechanical in qualitative review. |
| 7 | Story/Clear/Table rules selector reduces unfairness complaints. | Check complaint rate. | No comprehension improvement. |
| 8 | Return delta increases resumed campaigns. | Resume-to-turn rate. | Inaccurate recap incident. |
| 9 | Compact default lowers first-hour fatigue. | Turn 10 completion. | Writer quality rating declines. |
| 10 | Player-selectable length preserves quality. | Satisfaction/cost. | Users select long but abandon faster. |
| 11 | Opening deck novelty ledger increases replay start. | Second campaign start. | Genre coherence decline. |
| 12 | Retry label (“new tactic”) improves trust. | Retry acceptance. | Exposes too much system language. |
| 13 | First map reveal after movement improves map use. | Map open/route select. | Map opens before player need. |
| 14 | Journal after first promise improves quest comprehension. | Journal open + next-turn relevance. | Spoiler complaint. |
| 15 | Soft offer only after HookArc reduces rage exits. | Exit after offer. | Revenue loss without retention lift. |
| 16 | No image during first 3 turns reduces latency. | First session completion. | “Not magical” complaint rises. |
| 17 | One optional memorable opener improves share intent. | Opt-in/share. | Cost or safety incident threshold. |
| 18 | Safety profile shown pre-start increases trust. | Mode selection/report rate. | Setup abandonment >3pp. |
| 19 | Clarification chip on ambiguous target reduces wrong turns. | Correction after ambiguity. | Extra prompt fatigue. |
| 20 | One 24-hour return reminder only for opted-in users improves resume. | D1/D7. | Opt-out/complaint rate. |

### 6D. Microcopy bank: 30 improvements

| Situation | Copy |
|---|---|
| New Game | “Choose a starting pressure, not a destiny.” |
| Hook change | “Show me another beginning.” |
| Custom | “You set the laws. The story discovers what follows.” |
| Kit | “This is what you can reach for when it matters.” |
| Choice | “Or write your own move.” |
| Check | “You can try it. Here is what makes it risky.” |
| Failed check | “The attempt changed the scene; it did not erase your choice.” |
| Combat | “The outcome is set. The moment is yours to describe.” |
| Here now | “Who and what are in reach.” |
| Journal | “Promises, clues, and consequences you can act on.” |
| Map | “Routes you know; routes you only suspect.” |
| Correction | “Tell the campaign what is wrong.” |
| Correction saved | “The record has changed. The next scene will honor it.” |
| Contradiction | “You have heard two versions. Neither is being erased.” |
| Retry | “Try a different turn without changing what already happened.” |
| Timeout | “Your move is saved. Nothing changed and no text was spent.” |
| Empty response | “The GM did not complete a valid turn. Try again safely.” |
| Save | “This campaign is safe to leave here.” |
| Return | “Since you left: [verified delta].” |
| Safety | “This campaign is using your selected story boundaries.” |
| Kid Mode | “Family-safe story rules are active here.” |
| Image pending | “The scene continues while this plate is prepared.” |
| Image fail | “The image did not finish. The moment is still yours.” |
| Capacity | “Your campaign is saved; choose when to continue.” |
| Offer | “This is a clean stopping point. Continuing is optional.” |
| Pack | “A pack adds accepted turns; failed turns do not count.” |
| Report | “Report content that crosses your boundaries.” |
| Privacy | “Your story is not a public feed.” |
| Adult path | “This setting is separate and unavailable in Kid Mode.” |
| Export | “Take a copy of your campaign record.” |

### 7D. Anti-patterns

1. Show all Expert fields in Simple New Game.
2. Start with lore/exposition rather than pressure and identity acknowledgement.
3. Ask player to choose “good/evil/lawful” abstractions without a scene implication.
4. Treat an opening hook as a compulsory quest acceptance.
5. Display capacity before observed consequence.
6. Teach every HUD panel before it has local value.
7. Use popups after failure instead of a safe continuation.
8. Turn a Kid Mode explanation into an adult-content teaser.
9. Optimise only click/start metrics while ignoring accepted-turn and D1 quality.
10. Use experiments that silence free-text or degrade correction/safety.

### 8D. 45-day ship list mapped to modules

| Days | Module | Deliverable | Owner | Done-when |
|---:|---|---|---|---|
| 1–7 | NewGameModal/openingEstablishment | Simple flow, recommended hooks, identity receipt tests. | Code | 60-second happy path passes. |
| 8–14 | capacityLedger/HUD | HookArc events/offer guard/out-of-turn safe screen. | Code | No action-interrupt offer traversal. |
| 15–21 | Hud/questPlay/mapEngine | Here Now, Threads, first map/journal teaching. | Code | Usability test identifies next action. |
| 22–28 | GM proxy/wardens | Retry label, empty/timeout recovery, length controls. | Code | Failure/no-spend and novelty tests pass. |
| 29–35 | settings/Kid Mode | Pre-start safety profile and return delta. | Code + T&S | Mode/resume tests pass. |
| 36–45 | analytics/experiments | Events/cohorts/dashboards and 3 safe experiments. | Code + Founder | Decision dashboard drives one launch change. |

### 9D. Open founder decisions

| Decision | Recommendation | Alternative | Cost if wrong |
|---|---|---|---|
| First-session prose length | Standard compact with selector. | Cinematic default. | Long default can create cost/fatigue. |
| First image | Optional/async opener after text. | None or immediate. | Immediate harms latency; none may weaken magic. |
| Choice UI | Suggestions plus free text always. | Menus only. | Menus reduce agency identity. |
| Return reminder | Opt-in, one gentle 24-hour reminder. | No reminder. | Overnotify harms trust; none lowers resumes. |

## PART E — QA / regression harness design

### 0E. Executive test strategy

Test the product as **a deterministic state machine with nondeterministic presentation**. Deterministic oracles cover ledger, capacity, entitlement, policy, RLS, maps, quests, combat, branch, and mode. LLM evaluations cover constrained outputs, coverage, safety, style, and candidate claims; they never decide whether a state transition is valid. Every production incident becomes a minimal fixture plus a regression name.

### 1E. Test taxonomy + severity

| Area | P0 failure | P1 failure | Required oracle |
|---|---|---|---|
| Continuity | Wrong owner/place/roster/quest or cross-branch fact. | Missing optional callback. | Replay + manifest/state claim comparator. |
| Combat/check | Narration/HUD differs from resolver. | Repetitive but legal prose. | Golden outcome token trace. |
| Quest/map | Impossible transition/route, lost active promise. | Delayed optional journal wording. | Graph/topology/clock invariant. |
| Capacity/entitlement | Wrong debit/grant/refund/purchase/ad reward. | Delayed noncritical display. | Idempotent event reconciliation. |
| Kid/safety | Adult leak, severe unsafe output, ad call in Kid. | Overblock with safe fallback. | Mode traversal/policy fixture. |
| Auth/RLS | Cross-account access/write. | Generic auth UX defect. | Negative authorization matrix. |
| Save/migration | Data loss/corrupt canonical state. | Cosmetic setting reset. | Replay/checkpoint compatibility. |
| Ads/payments | Forged or duplicate grant. | No-ad fallback wording. | Webhook/S2S replay. |

### 2E. Fixture library design

```ts
interface Fixture {
  id: string; bibleVersion: string; campaignSeed: string; rngSeed: string;
  initialEvents: StateTx[]; inputs: PlayerInput[]; expectedEvents: StateTx[];
  expectedProjectionHash: string; mode: 'adult'|'kid'; modelMode: 'stub'|'recording'|'live';
}
```

Maintain: small canonical bible packs; adversarial alias packs; map/dungeon topology packs; combat tables; payment/ad callback fixtures; Kid/adult asset packs; corrupted/migrated save packs; exact golden StateTx traces; transcript/evidence source spans; deterministic fake provider responses. Each fixture has purpose, severity, owner, minimum reproduction, and regression issue link.

### 3E. Oracle definitions

| Oracle | Pass/fail rule |
|---|---|
| Ledger | Expected event sequence/revision/actor/effect matches exactly or approved migration map. |
| Projection | Rebuilt manifest/inventory/quest/map/capacity hash equals stored projection. |
| Authority | No candidate durable claim lacks permitted source/transaction/permit. |
| Obligation | Each resolvable IntentContract obligation is handled, clarified, or validly resisted. |
| Combat | Resolver token, StateTx, HUD, and prose claim set agree. |
| Safety/mode | Output/assets/tools/telemetry comply with active adult/Kid policy; no forbidden provider call. |
| Entitlement | One request/callback/event yields one grant/debit/refund under retries/reorder. |
| Privacy/RLS | Unauthorized role receives no data/state change; log contains allowed fields only. |
| LLM quality | Candidate passes structure/claim/safety; blinded human score above floor; no state authority. |

### 4E. Nondeterministic LLM handling

1. **Stubs:** default CI uses structured fake candidates, failures, timeouts, and adversarial injections.
2. **Recording/replay:** encrypted/redacted test recordings pinned to model/prompt/policy version, with no live user content.
3. **Canaries:** small live synthetic suite for each provider/model version; compare safety/structure/latency/cost baseline before promotion.
4. **Property tests:** vary names, aliases, order, retries, branch IDs, locale, mode, and context pressure; assert invariants not exact prose.
5. **Human evaluation:** blinded sampled candidate quality only after hard-code tests pass.

### 5E. CI pipeline stages and gates

| Stage | Runs | Block condition |
|---|---|---|
| Precommit | Type/unit/schema/secret scan. | Any secret/type/schema error. |
| PR | Unit, RLS/API negative, migration lint, fixture replay, dependency scan. | P0/P1 failure. |
| Staging | Integration, provider stubs, webhooks, mode traversal, load/chaos subset. | Entitlement/safety/RLS/ledger failure. |
| Nightly | 100 named regression, live canary, replay/migration, 100-turn simulation. | Regression delta beyond budget. |
| Release candidate | Full suite, 300-turn scripts, restore, security scan, manual sign-off. | Any P0 or unaccepted P1. |
| Postdeploy | Synthetic checkout/ad/turn/save/mode probes and dashboard SLO. | Rollback threshold crossed. |

### 6E. 100 named regression cases (grouped)

| Group | Cases | Count |
|---|---|---:|
| Continuity | `name-alias-01..10`: aliases, titles, duplicate names, correction, absent/present, kit transfer, location move, branch recall. | 10 |
| Intent/agency | `intent-01..10`: action/question/refusal/correction/ambiguous target/free text/multi-obligation/protest. | 10 |
| Combat/checks | `combat-01..10`: success/fail/crit/condition/range/retreat/loot/death/boss/replay. | 10 |
| Quest/journal | `quest-01..10`: activate/decline/diverge/clock/fail/resolve/hidden clue/return/reveal/archive. | 10 |
| Map/locality | `map-01..10`: route/topology/FOW/UK-US prop/teleport/travel/time/dungeon trace/return. | 10 |
| Capacity/payment | `money-01..10`: accepted/debit/fail/refund/cancel/timeout/pack/subscription/duplicate/chargeback. | 10 |
| Ads | `ads-01..10`: intent/no-ad/complete/duplicate/signature/replay/cap/Kid/Mid/hold. | 10 |
| Kid/safety | `safety-01..10`: mode switch/adult asset/CSAM/grooming/self-harm/threat/doxxing/image/TTS/report. | 10 |
| Save/migration | `save-01..10`: refresh/offline/conflict/checkpoint/v1→v2/corrupt/branch/export/import/restore. | 10 |
| Security/auth | `auth-01..10`: RLS/object ID/token/reset/admin/secret/XSS/import/rate/callback. | 10 |

### 7E. Human playtest scripts

Already covered for 30/100/300-turn continuity — see Outsider Memory Brief. Add: 30-turn first-session+purchase/no-purchase safety script; 100-turn multi-device/save/refund/ad-free-Kid script; 300-turn migration/return/branch/export script. Every tester report has exact campaign/turn ID, mode, device, expected/actual, severity, and consented reproduction data.

### 8E. Cost of tests + prioritization

| Test class | Cost | Run cadence |
|---|---:|---|
| Pure deterministic fixtures | Near-zero | Every commit. |
| Stubbed LLM | Low | Every PR. |
| Recorded replay | Low/medium storage | Nightly. |
| Live canary | Controlled provider cost | Nightly/release. |
| Long 300-turn live campaign | Medium/high | Release candidate and major model/prompt change. |
| Human safety/UX | Staff time | Before beta/release and incident follow-up. |

### 9E. 60-day harness build plan

| Days | Build | Done-when |
|---:|---|---|
| 1–10 | Fixture schema/golden events/oracles/replay. | 20 P0 deterministic tests in CI. |
| 11–20 | RLS/auth/capacity/webhook/mode suites. | Negative security/payment suite passes. |
| 21–30 | Stub/record/canary LLM protocol and candidate gate tests. | Provider change cannot bypass release gate. |
| 31–45 | 100-case library, load/chaos, save migration/restore. | Nightly regression dashboard live. |
| 46–60 | 30/100/300 human scripts, incident-to-fixture workflow, release gate. | Release candidate has no P0, approved P1 only. |

### 10E. Open founder decisions

| Decision | Recommendation | Alternative | Cost if wrong |
|---|---|---|---|
| Live model tests in CI | Canary nightly, stubs on PR. | Live every PR. | Full live is costly/flaky; none misses provider drift. |
| Golden prose | Golden state/claims, not exact creative text. | Exact text snapshots. | Exact prose makes tests brittle. |
| Human safety review | Required release gate for high-risk changes. | Automated only. | Automated-only misses harmful edge cases. |

## PART F — Privacy-safe analytics taxonomy

### 0F. Principles

Minimal, purpose-limited, consent-aware, pseudonymous by default, no raw narrative in product analytics, separate safety evidence from growth analytics, no behavioural advertising/profiling in Kid Mode, and deletion/export aware. Analytics proves whether the product kept promises; it is not a dossier on players.

### 1F. Full event dictionary

| Event | Priority | Minimal properties | Purpose |
|---|---|---|---|
| `install_or_first_visit` | Must | anon/session ID, app version, locale, consent state. | Funnel baseline. |
| `signup`, `login` | Must | auth method, success/fail reason class. | Auth reliability. |
| `new_game_started/completed` | Must | path, genre, hook ID, mode, duration band. | Setup funnel. |
| `hook_arc_step` | Must | step enum, campaign ID pseudonym, turn index. | Fair-offer/retention proof. |
| `turn_requested/accepted` | Must | tier, model route, latency band, token/cost band, turn index. | Quality/cost SLO. |
| `turn_failed/refunded/cancelled/timeout` | Must | failure class, refund/no-spend result. | Reliability/fairness. |
| `out_of_turns/offer_eligible/shown/dismissed` | Must | HookArc status, action-resolved, offer type. | Offer guard audit. |
| `ad_intent/complete/grant/reverse` | Must | placement, cap state, callback status, no creative ID by default. | Fraud/reward funnel. |
| `purchase_started/succeeded/refunded/disputed` | Must | SKU, currency, entitlement result, processor event reference. | Revenue/reconciliation. |
| `return_proxy` | Must | local day/week window, campaign resume flag. | D1/D7 cohort. |
| `safety_report` | Must | category/severity/status; no raw content in analytics. | T&S load. |
| `memorable_requested/fired/failed` | Must | entitlement/job state/latency band. | Media value/cost. |
| `correction_used` | Must | field class, applied/clarify/reject; no raw correction. | Trust/continuity quality. |
| `hud/journal/map_opened` | Should | surface, current turn band. | Tutorial usefulness. |
| `experiment_assigned/exposed` | Must | experiment/version/variant. | Valid analysis. |
| `export/delete_requested/completed` | Must | status/duration band. | Rights workflow. |
| `share_card_created` | Later | mode/safety approval. | Only if sharing launches. |

### 2F. Property schemas and identity model

```ts
interface AnalyticsEnvelope {
  event: string; occurredAt: string; schemaVersion: number;
  pseudonymousUserId?: string; sessionId: string; campaignId?: string;
  mode: 'adult'|'kid'; tier: 'free'|'mid'|'high'|'byok'; consent: 'essential'|'analytics';
  appVersion: string; locale: string; properties: Record<string,string|number|boolean>;
}
```

Use rotating/pseudonymous IDs; separate account identity from analytics identity; server-set tier/mode/entitlement properties; campaign IDs are opaque; retain raw support/safety evidence only in restricted systems. Never use age, inferred vulnerability, precise location, raw prompt, full transcript, email, payment instrument, secret, or adult/Kid content details as general event property.

### 3F. Dashboards

| Founder daily | Founder weekly |
|---|---|
| Accepted turns, errors/refunds, latency, cost/turn, provider status, HookArc, severe safety, ad/purchase reconciliation, active kill switches. | Cohort D1/D7, New Game funnel, first consequence, correction/support trend, contribution by tier, ad impact holdout, experiment results, deletion/export SLA, incident follow-up. |

### 4F. Experiment assignment events

Assign server-side before exposure using stable hash of pseudonymous user/campaign + experiment version; persist assignment; log exposure only when UI actually renders; exclude Kid Mode from monetization/behavioural experiments; pre-register hypothesis, primary metric, guardrail, minimum sample/time, and stop rule; never silently change variant mid-campaign where it affects fairness/continuity.

### 5F. Retention windows, deletion/export implications

D1/D7 are calculated from first accepted campaign action and return to accepted action within local-time-window definition, not email opens. Deletion removes/anonymizes analytics mappings according to policy; aggregated cohorts remain only where counsel confirms lawful anonymization. Export shows user campaign data, not internal fraud scores, hidden prompts, security rules, other-user data, or provider secrets.

### 6F. What NEVER to log

1. Raw prompt/transcript by default.
2. API keys, webhook signatures, passwords, cookies, auth tokens.
3. Full payment details or ad identifiers unnecessary for reconciliation.
4. Exact child age, precise location, contacts, school, health/crisis story detail.
5. Adult/sexual text/image content in growth dashboard.
6. Unredacted support attachments in general observability.
7. Hidden policy/system prompt or moderator credentials.
8. IP/device fingerprint beyond documented security necessity/retention.

### 7F. Implementation notes for web

Server emits authoritative purchase/ad/capacity/mode events. Browser batches only consent-permitted UI events, retries with idempotency, and cannot set tier/cost/safety outcomes. Use schema validation, event allow-list, sampling for high-volume noncritical events, EU/UK-aware vendor configuration, user consent withdrawal, and a pipeline test that proves redaction before warehouse/dashboard. Legal-verify data location, processor, cookie, consent, and deletion obligations.

### 8F. Open founder decisions

| Decision | Recommendation | Alternative | Cost if wrong |
|---|---|---|---|
| Analytics vendor | Start with minimal first-party/server event store or privacy-reviewed provider. | Full behavioural suite. | Heavy vendor adds data/consent/deletion burden. |
| Session replay | Do not launch with it. | Redacted opt-in support replay later. | Replay can capture sensitive story/credentials. |
| Kid analytics | Essential operational events only. | Full product funnel. | Child profiling/privacy risk. |
| Raw prompt retention | Off by default; opt-in support snapshot with expiry. | Full logs. | Severe privacy/security cost. |

# Part 2 — Remaining operating layers

## PART G — Brand / listing / creative system

### 0G. Positioning platform

**One sentence:** *SynapticGM is the AI Game Master for campaigns that keep receipts—your people, gear, places, choices, and consequences remain true instead of dissolving into chat history.*

| Pillar | Proof to show | Claim boundary |
|---|---|---|
| Campaign truth | Input → StateTx → changed map/journal/kit/NPC reaction in one clip. | Do not claim flawless recall. |
| Player agency | Refuse/diverge/try free text; world changes honestly. | Do not imply every action succeeds. |
| Fair GM | Code-owned checks/outcomes and clear no-spend failure handling. | Do not claim human-level adjudication. |
| Author ownership | Simple/Expert custom, canon, correction, export. | Do not call it unrestricted or use licensed lore. |
| Safe choice | Kid Mode/comfort boundary and private campaign posture. | Do not overstate legal certification. |

### 1G. Message house by audience

| Audience | Core message | Proof asset | Avoid |
|---|---|---|---|
| LitRPG | “Build power with tracked gear, quests, and consequences.” | System event alters quest/inventory/relationship. | Stat-wall screenshots or “infinite power.” |
| AI Dungeon refugees | “A world that remembers who is here and what changed.” | Return-to-scene roster/kit proof. | Naming/attacking competitor or perfect-memory claim. |
| NovelAI/ST users | “Keep author control; stop maintaining basic game facts by hand.” | Expert canon compiler/source trace. | Claiming generic prompt controls are bad. |
| Parents/Kid | “Family-safe story boundaries, private campaigns, no launch ads in Kid Mode.” | Mode setting and child-safe scene example. | Fear marketing, adult teaser, legal-compliance claim without verification. |
| Tabletop | “Fair checks, persistent maps, and prose that follows the result.” | Check token + board/map + narration. | “Replaces your group/GM.” |

### 2G. Web landing information architecture

| Section | Job | Copy outline |
|---|---|---|
| Hero | State exact fantasy + CTA. | “A campaign that remembers what you changed.” / “Start a free story.” |
| Proof strip | Establish credibility in 10 seconds. | “Your kit. Your quests. Your consequences. Still here next time.” |
| Interactive demo | Show action to world change. | Player input, one short response, changed Scene/Threads card. |
| Genre cards | Let visitor self-select. | LitRPG / Isekai / Story RPG / PYOA / Tabletop. |
| How it works | Explain ledger-first plainly. | “The GM writes the story; the campaign record keeps the facts.” |
| First session | De-risk trial. | “Start free. Your first story arc is protected from mid-action interruptions.” |
| Safety/comfort | Establish trust. | “Choose story boundaries. Kid Mode is separate.” |
| Custom/premade | Show author/player choice. | “Pick a world—or set the laws yourself.” |
| Pricing | Plain tiers/packs and no hidden safety/continuity paywall. | “Pay for capacity and premium creation, not basic truth.” |
| FAQ | Answer AI, privacy, corrections, cancellation, content, ownership. | Plain language, current policy links. |
| Footer | Policies/support/status. | Business contact, Privacy, Terms, Content, Refund, Cookies, status. |

### 3G. Screenshot / UI storyboard scripts (12)

| # | Scene | Caption |
|---:|---|---|
| 1 | Player refuses a summon; Threads changes. | “Refuse the expected path. The campaign records the new one.” |
| 2 | Here Now roster + visible kit matches prose. | “Know who is here—and what is in reach.” |
| 3 | Combat check resolves and narration reflects terrain. | “The rules decide the outcome. The story makes it matter.” |
| 4 | Correction sheet updates wrong kit fact. | “Correct the record. Continue without rebuilding your story.” |
| 5 | Return to changed town/map. | “Come back to consequences, not reset scenery.” |
| 6 | Quest receipt after player choice. | “A promise changes when you act.” |
| 7 | Expert custom contract. | “Set the laws of your world before the first scene.” |
| 8 | LitRPG System notice tied to earned event. | “Progress is part of the world—not a random popup.” |
| 9 | PYOA branching ending provenance. | “See which choices shaped this ending.” |
| 10 | Tabletop Clear checks mode. | “See the stakes. Make the roll count.” |
| 11 | Kid Mode boundary/settings. | “Family-safe story rules stay with this campaign.” |
| 12 | Async memorable plate after validated moment. | “Keep the scene. The story never waits for the image.” |

### 4G. Short-form video scripts (12)

| Duration / script | Required shot sequence | CTA |
|---|---|---|
| 15s: “The sword” | Input: “I trade the copper blade.” → receipt → return later, blade absent. | “Start a campaign that keeps the trade.” |
| 15s: “I refuse” | Opening request → typed refusal → new Thread/route. | “Your story can leave the expected path.” |
| 15s: “Who is here?” | Question → Here Now/prose matching roster. | “Know the room before you act.” |
| 15s: “The correction” | Wrong item → correction tap → next scene accurate. | “Fix the record, not your whole story.” |
| 30s: “One fair check” | State stake → check result → code receipt → vivid consequence. | “Try a fair GM.” |
| 30s: “Return state” | Before town / decision / after return. | “Come back to what you changed.” |
| 30s: “PYOA proof” | Two decision paths → distinct consequence cards. | “Choices with receipts.” |
| 30s: “Custom law” | Expert fields → contract preview → first scene obeys law. | “Set the laws. Play the consequences.” |
| 30s: “Kid boundary” | Mode choose → safe adventure preview → no ads claim only if current. | “Choose the story boundaries.” |
| 30s: “System earned” | Act → outcome → diegetic notice. | “Progress that belongs in the world.” |
| 60s: “First hour” | Identity, stake, choice, consequence, map, quest. | “Start free; take the campaign with you.” |
| 60s: “Tabletop solo” | Intent → transparent check → map/condition/journal. | “Your solo table keeps the rules straight.” |

No AI-art montage, fake reactions, sexualised bait, or claims such as “perfect memory,” “unlimited,” “uncensored,” or “human GM replacement.” Every clip must use real current build capture and disclose paid/gifted creator material where applicable.

### 5G. Creator brief + FTC/ASA disclosure kit

| Component | Requirement | Owner | Done-when |
|---|---|---|---|
| Brief | Product facts, allowed claims, current tier terms, mode/age boundaries, no review obligation. | Founder | Creator acknowledges version. |
| Disclosure | Prominent `#ad`, “Paid partnership,” or local equivalent at start/on screen where required. | Creator + Ops | Sample post reviewed before first campaign. |
| Content rules | Original play, no prohibited content, no fake install/review/engagement, no competitor disparagement. | Creator | Contract acceptance. |
| Tracking | Creator-specific landing URL, consent-respecting attribution. | Code | No raw story data passed to creator. |
| Compensation | Cash/key/plan noted internally; no payment contingent on positive view. | Founder | Accounting record complete. |
| Takedown | Fast contact for outdated price, safety, policy, or age-inappropriate material. | Ops | 24-hour contact route. |

### 6G. Press kit checklist

Logo variants; visual identity; current screenshots/GIFs; 30/60-second trailer; factual one-sheet; founder biography/contact; platform/date/status; tier/pricing page; privacy/safety links; accessibility facts only if verified; original-content statement; creator/press disclosure guidance; no unapproved ratings/awards/metrics.

### 7G. Eight-week production calendar

| Week | Output | Exit criterion |
|---:|---|---|
| 1 | Message house, landing wireframe, 12 proof storyboard shots. | Claims reviewed against product. |
| 2 | Demo capture + first four 15/30s clips. | Real build, captions, accessibility. |
| 3 | Pricing/FAQ/safety/correction pages. | Legal-verify current terms. |
| 4 | Creator brief/shortlist/press kit. | 20 tailored outreach messages. |
| 5 | Genre landing variants and analytics. | Attribution/consent test pass. |
| 6 | Creator pilot and community playtest content. | Support SLA holds. |
| 7 | Refine winning proof asset; public changelog. | No misleading claim. |
| 8 | Soft launch launch-kit, status/incident templates. | Go-live sign-off. |

### 8G. Open founder decisions

| Decision | Recommendation | Alternative | Cost if wrong |
|---|---|---|---|
| Brand emphasis | Lead with consequence proof, not “AI.” | Lead with genre art. | AI-first attracts low-intent/hype traffic. |
| Parent messaging | Ship only once Kid controls are fully ready. | Delay parent segment. | Premature safety claim damages trust. |
| Creator format | Small real-play pilots first. | Big launch sponsorship. | Large spend before product proof. |

## PART H — Audio / TTS / voice UX

### 0H. Executive recommendation

**Do not make full TTS a public-web launch dependency.** Ship text-first with an accessibility-ready architecture; allow selective read-aloud only after final prose approval and mode filtering. Build caching/interruptibility now; expand catalog/SKUs only after retention, safety, latency, and cost data show value.

### 1H. When to speak / never speak

| Speak selectively | Never speak by default |
|---|---|
| User-pressed current response; short recap; optional diegetic System notice; accessibility labels on request. | Hidden prompt/diagnostics, raw moderation/refund/ads/billing state, unapproved draft, adult content in Kid mode, private NPC thoughts not shown in text. |

### 2H. Player journeys

| Mode | Flow | Default |
|---|---|---|
| Off | Text only; no audio request. | Launch default. |
| Selective | Player taps play on final message, recap, or System notice. | Recommended first release. |
| Full | Auto-play approved prose with pause, speed, queue, interruption, headphones/state control. | Later, opt-in. |

### 3H. Technical architecture

`accepted_text(turnId, textHash, voiceProfile, mode) → safety/mode source filter → cache lookup(key=textHash+voiceVersion+speed) → TTS job → stream/download → client queue`. Stop/cancel on new turn; cache only approved, policy-compatible final text; invalidated/corrected text receives new hash. Do not block canonical story commit on audio. Target first audio <1.5s cached / <4s uncached; use short chunks that pause at sentence boundaries.

### 4H. Safety + Kid Mode

Filter **source text** before TTS, not only output audio. Kid mode routes only kid-approved text/voice profiles; adult audio artifact/cached file is never addressable from Kid account. Provide speed, captions/transcript, mute, and content-boundary reset. Verify voice licensing, impersonation, age representation, and voice-clone consent with counsel/provider policy.

### 5H. Voice catalog / theme / SKU ideas

| Tier | Offer | Rule |
|---|---|---|
| Free | System/default narrator samples on user press if budget permits. | No ad-required narration. |
| Mid/High | More approved narrator/system themes, longer monthly audio allowance. | No safety/continuity difference. |
| Cosmetics | Theme/voice pack, preview, restore. | Never sell a voice that bypasses Kid filter or consent. |

### 6H. Cost controls

Cache final short text; cap automatic full mode; chunk; queue; use lower-cost voice for System notices; limit retries; no TTS for text that user has not viewed/approved; meter audio seconds/job; stop generation on interruption; keep transcript as source of truth.

### 7H. Anti-patterns

Auto-play on page load; reading every HUD transaction; speaking failure/vendor diagnostics; character voice cloning without consent; uncapped long-form narration; generating audio for drafts; hiding pause/mute; treating audio as a paywall for accessibility.

### 8H. 60-day plan if recommended

| Days | Slice | Exit criterion |
|---:|---|---|
| 1–15 | Text source filter, VoiceProfile schema, play button mock. | Mode/source tests pass. |
| 16–30 | One approved TTS provider, cache, cancel/queue, telemetry. | Latency/cost budget pass. |
| 31–45 | Selective beta and accessibility feedback. | No safety/cache cross-mode fault. |
| 46–60 | Decide full mode/catalog via retention/cost data. | Expand only if value > cost/support. |

### 9H. Open founder decisions

Voice at launch: **selective beta only**; full auto-read later. Provider/voice cloning: **no cloning at launch**. Audio pricing: **cosmetic/capacity only, never accessibility-only lockout**.

## PART I — Illustrated / comic mode product brief

### 0I. Go / No-Go for next 90 days

**No-Go for full comic mode; Go for hardening Classic + Memorable.** Full comic mode requires panel grammar, character/style persistence, asset rights, safety review, latency, cost, failure UX, and mobile grid work. Thin wedge: validated milestone plate + optional 2–3-panel recap only after text/ledger proof, behind feature flag.

### 1I. Player fantasy vs COGS

| Fantasy | Cost-safe answer |
|---|---|
| “Show my character and kit.” | Canonical portrait/kit plate on explicit request. |
| “Keep a major moment.” | Memorable plate after accepted scene; async. |
| “See a comic of my arc.” | Later recap strip from selected validated events, not every turn. |

### 2I. Beat contracts

Fire only at opener, player-requested portrait, boss/death/arc pivot, validated reward, ending, or explicit memorable entitlement. Text commits first; image source is validated SceneManifest + accepted event IDs + safety/style profile. Failure holds story: no new StateTx, no capacity text debit, no blocking wait.

### 3I. Pipeline

`validated beat → visual manifest → Kid/adult safety rewrite/skip → prompt compiler → async image job → output classifier/style/asset check → attach to event if version/hash still current`. Store style profile/version, entity visual anchors, kit IDs, and content mode. Image is an artifact, never evidence of new world state.

### 4I. Economy/caps

| Tier | Policy |
|---|---|
| Free | One opener/one trial-once only if unit economics/safety allow; weekly memorable cap; optional reward bridge adult only already covered. |
| Mid | Higher memorable allowance. |
| High | Highest approved cap/priority. |
| Admin BYOK | Adult web-only, no bypass of safety/mode policy. |

### 5I. UX flows

Grid shows attached plates by chapter, pending placeholder with cancel, failed state with retry later/no story impact, download/export subject to rights/policy, and “why this image” source beat. Do not auto-scroll player away from prose; do not require a panel to proceed.

### 6I. MVP vs v2

| MVP | v2 later |
|---|---|
| Validated plate, fixed style presets, one image per event, async queue, basic gallery. | Multi-panel strips, panel continuity, speech balloons, editable layouts, local style packs, recap comics. |

### 7I. Kill criteria

Disable/hold if image cost exceeds approved session threshold, unsafe cross-mode output occurs, p95 queue delays exceed player tolerance, attach rate adds no retention/share value, or support tickets show artifact confusion. Keep text game intact.

### 8I. Open founder decisions

Recommend no full comic roadmap commitment before 90-day text retention/contribution proof. Decide one-time Free opener only after cost/safety trial; do not make a comic a substitute for a coherent campaign.

## PART J — Localization & regional authenticity

### 0J. Executive

English-first excellence: support locale-aware English before new language translation. Establish a `LocalePack` for setting authenticity and UI plural/date/currency rules; then localize highest-demand languages only after support, safety, content, and evaluation coverage exist.

### 1J. Locale pack schema

```ts
interface LocalePack {
  id:'uk'|'us'|'au'|'ca'|'ie'|'unknown'|'fantasy'; language:string;
  currencyStyle:string; emergencyTerms:string[]; firearmsNorm:'rare'|'common'|'setting_defined';
  vehicleTerms:string[]; shopTerms:string[]; slangRules:string[]; legalNorms:string[];
  bannedAssumptions:string[]; sourceConfidence:'curated'|'setting_defined'; version:string;
}
```

### 2J. Writer rails per locale

| Locale | Rails |
|---|---|
| UK | Avoid automatic US school/road/firearm/medical/legal props; use setting/locality evidence. |
| US | Avoid importing UK institutional terms; regional detail still needs place authority. |
| AU/CA/IE | Use curated defaults sparingly; local setting beats country stereotype. |
| Unknown/fantasy | Never invent real-world legal/emergency/firearm norm; bible/place authority defines it. |

### 3J. UI string inventory

Centralize strings with key, description, variables, plural/gender/date/number context, screen, mode, legal-review flag, max length, accessibility label, owner, version. Do not allow LLM-generated UI/legal/capacity strings to bypass source control and translation review.

### 4J. Future language roadmap

1. UK/US English locale hardening.
2. Demand + support feasibility study per candidate language.
3. Translate core UI/legal/help/safety/reporting with professional review.
4. Localize prompts/VoiceProfiles/test suites and evaluate model behavior.
5. Expand creative content last, not first.

### 5J. QA locale test packs

Test currency/date/units, road sides/vehicle terms, emergency contact ambiguity, shop/education/hospital terms, firearms norm assumption, spelling, slang restraint, accessibility screen reader strings, and the known bug class: a UK street scene must not invent a casually available US firearm/prop without bible/permit authority.

### 6J. 60-day English-locale hardening

| Days | Output | Done-when |
|---:|---|---|
| 1–15 | LocalePack + locality token integration. | UK/US fixture cases pass. |
| 16–30 | UI string inventory and copy owner/review workflow. | No inline user-visible strings in changed surfaces. |
| 31–45 | 50 regional authenticity fixtures / writer rails. | No high-severity locale hallucination in suite. |
| 46–60 | English variant beta feedback/support tags. | Decide first non-English research based on demand/support. |

### 7J. Open founder decisions

English locale priority: **UK + US first**. New language: **only after safety/support/QA capability**, not because a model can translate. Fantasy/unknown: **prefer bible-defined norms over real-world default**.

## PART K — Schema evolution & save migration

### 0K. Principles

Append-only canonical events; versioned projections; backward-readable exports; expand/contract migrations; no destructive rewrite without backup/checkpoint; migration is reversible or has a documented forward-repair path; user progress beats schema elegance.

### 1K. Versioning strategy

| Artifact | Version fields |
|---|---|
| Event | `eventSchemaVersion`, `rulesVersion`, `policyVersion`, `writerContractVersion`. |
| Projection | `projectionVersion`, `ledgerHead`, `projectionHash`, `builtAt`. |
| Settings | `settingsVersion`, scope/account/campaign, effectiveAt. |
| Entitlement | `skuVersion`, `processorEventRef`, state/reversal version. |
| Bible/custom | `canonVersion`, source/author, migration map. |
| Export | manifest, schema versions, checksums, compatibility statement. |

### 2K. Migration patterns

| Pattern | Use | Rule |
|---|---|---|
| Expand | Add nullable/new field and dual-read. | Deploy readers before writers. |
| Backfill | Populate from deterministic event replay. | Log source/version; avoid model-generated backfill authority. |
| Dual write | Transition event/projection format. | Reconcile old/new until equivalence. |
| Contract | Remove old path after usage reaches zero and export compatibility preserved. | Require rollback window/backup. |
| Feature flag | New rule/projection per cohort. | Never split authority for one campaign without explicit version. |

### 3K. Compatibility matrix across clients

| Client | Read old campaign | Write old campaign | Requirement |
|---|---|---|---|
| Current web | Yes | Via migration/compatibility adapter. | Warn only if action needs upgrade. |
| Previous web | Read-only or supported compatibility window. | No if it would create invalid event. | Clear “update required” before mutation. |
| Offline cache | Reconcile by expected revision/event ID. | Queue safe input, not raw state. | Conflict policy tested. |
| Export/import | Validate manifest/schema/signature/checksum. | Import into new branch/quarantine first. | No direct overwrite. |

### 4K. Cloud vs local conflict during migrations

Server ledger is canonical. Client stores pending input/action request with idempotency key, not mutable projection authority. On reconnect, server accepts if expected revision valid; otherwise returns canonical delta and asks/replans. During migration, block mutations that require a new schema while allowing read-only export/continue where possible.

### 5K. Disaster recovery / corrupt save

| Scenario | Response | Done-when |
|---|---|---|
| Bad projection | Rebuild from checkpoint + event suffix. | Hash matches canonical replay. |
| Corrupt event | Quarantine campaign, restore verified backup, preserve evidence, compensation/repair path. | User gets truthful status and safe copy. |
| Bad migration | Roll back code/flag; restore projection; do not delete events. | Recovery drill meets RTO/RPO. |
| Provider outage | Preserve accepted input; no state/capacity commit until valid completion. | Retry later safely. |

### 6K. Export/import validation

Validate schema, manifest, checksum/hash chain, entity IDs, reference integrity, unsupported extension fields, size/rate limit, mode/age compatibility, entitlement exclusion, and malware/HTML if attachments allowed. Import as `quarantine branch`; run replay/control-account/claim checks before user-visible promotion.

### 7K. 90-day implementation plan

| Days | Slice | Exit criterion |
|---:|---|---|
| 1–30 | Version fields/checkpoints/export manifest/replay test. | Old fixture reads and projection rebuild passes. |
| 31–60 | Expand/dual-write framework, migration CI, offline conflict protocol. | Simulated old/new client matrix passes. |
| 61–90 | Restore game day, import quarantine, support repair tools. | RTO/RPO and corrupt-save runbook tested. |

### 8K. Open founder decisions

Retain raw events long-term: **yes, subject to privacy/counsel retention design**. Support old clients: **limited read-only window**. User-visible migration message: **only when it affects action; never imply lost story**.

## PART L — Support & trust-and-safety playbooks

### 0L. Severity ladder + SLAs

| Severity | Examples | Target | Owner |
|---|---|---:|---|
| S0 | CSAM/grooming, credible imminent threat, child/adult breach, confirmed major data exposure. | Immediate triage; on-call. | Founder + T&S + Legal-verify |
| S1 | Account takeover, payment/entitlement systemic fault, severe unsafe output, cross-account access. | Acknowledge <4h; contain same day. | Ops + Code |
| S2 | Lost save, repeated capacity issue, moderation appeal, ad fraud dispute, material defect. | Acknowledge <1 business day. | Support + Code |
| S3 | General question, cosmetic issue, feature request. | Acknowledge <3 business days. | Support |

### 1L. Macros/scripts for top ticket types

| Type | First response content | Internal action |
|---|---|---|
| Billing duplicate | Acknowledge, do not request card data, provide order reference path. | Reconcile processor/ledger; refund per policy. |
| Subscription cancel | Link Customer Portal and explain effective date. | Verify entitlement state. |
| Pack missing | Ask order/account/time only. | Webhook/reconciliation lookup; grant only verified event. |
| Lost save | Ask campaign/last accepted turn/device/time. | Check replay/checkpoint; never ask for password. |
| Unsafe output | Acknowledge report, provide immediate boundary/reset option, do not request more graphic detail. | Severity route/minimum evidence/policy review. |
| Kid incident | Prioritize, do not ask child for sensitive info. | S0/S1 route, mode/cache/ad audit, guardian/counsel procedure. |
| Ad reward missing | Ask receipt/time, explain no-ad/verification timing. | RewardIntent/callback/reversal check. |
| Capacity confusion | Explain accepted-turn/refund rule and current balance plainly. | Inspect ledger; fix bug if mismatch. |
| Correction help | Explain “That’s not right” scope. | Inspect StateTx only with authorized support role. |
| Creator issue | Confirm disclosure/content/asset concern. | Pause link/content if inaccurate/unsafe. |
| ATO | Lock session, guide secure reset, do not disclose account content. | Revoke sessions/audit sign-ins. |
| Privacy/export/delete | Verify request per policy, state timeline. | Rights workflow, retention exceptions recorded. |

For the remaining routine variants—timeout, image failure, TTS issue, map error, quest error, wrong locale, accessibility, refund on fail, chargeback, adult mode, BYOK, reporting appeal, false positive safety block, onboarding, theme purchase, receipt, outage, account email change, import/export—use the same macro structure: acknowledge; state what is known; give immediate safe action; request minimum necessary ID/time; avoid secret/sensitive narrative content; route exact internal owner; close with resolution/audit ID.

### 2L. Escalation paths and evidence preservation

Preserve campaign/turn/event IDs, model/policy version, request/callback hash, timestamps, account pseudonym, mode, severity decision, and staff actions. Restrict raw content access; no screenshots in unapproved channels; legal-verify notification/retention duties. S0: contain first, preserve, counsel/T&S decision, then communicate. S1: feature flag/credential/session containment and user remedy. S2/S3: normal SLA with trend tagging.

### 3L. Public status / incident comms templates

| Situation | Template |
|---|---|
| Investigating | “We are investigating an issue affecting [feature]. Campaign progress is being protected; we will update by [time].” |
| Mitigated | “The issue affecting [feature] has been mitigated. We are verifying recovery and will share next steps for affected players.” |
| Data/safety | “We identified an issue and have contained the affected feature. We are contacting affected users where required and will provide a factual update after review.” |
| Resolved | “The issue is resolved. We added [plain corrective control] and are monitoring for recurrence.” |

Never speculate, blame users/providers, expose security details, or promise legal outcomes before investigation/counsel review.

### 4L. Staffing model

| DAU | Minimum operating model |
|---:|---|
| 100 | Founder on-call; named code owner; trained part-time support/moderation coverage; counsel contact; no public sharing. |
| 1k | Dedicated support rotation, T&S escalation owner, weekly incident/metrics review, contractor coverage for weekends/time zones as needed. |
| 10k | Formal support lead, T&S team/queue QA, security/SRE responsibility, DPO/privacy operating relationship, incident commander rotation, vendor management. |

### 5L. Training checklist for admin access

MFA/device requirements; least-privilege role; privacy/minimum-data rule; ticket/reason/audit use; no password/key collection; billing/ad/reward verification; safety severity and escalation; Kid/adult separation; export/delete handling; phishing recognition; incident communication; break-glass process; quarterly recertification.

### 6L. Red-alert alignment

Already covered — see Ads/Growth Gap Fill §7. Align the same kill switches with S0/S1: ads off, images off, provider/model off, force safe route, disable signups, read-only/Play Later, and targeted mode/locale quarantine. One incident command path owns the decision.

### 7L. Open founder decisions

| Decision | Recommendation | Alternative | Cost if wrong |
|---|---|---|---|
| Support channel | Support email/in-app form first; no unmoderated Discord support dependency. | Discord ticket bot. | Public chat leaks private/safety data. |
| S0 coverage | Named founder/on-call plus external counsel contact. | Business-hours only. | Delayed severe response. |
| Goodwill credits | Manual, audited, capped. | Automatic broad credits. | Automatic credits invite fraud/cost loss. |

## PART M — Master synthesis

### 0M. Single ranked backlog: Must-before-public-web adult Free

| Rank | Must item | Parts | Owner | Done-when |
|---:|---|---|---|---|
| 1 | RLS/auth/secret/admin threat controls and negative tests. | A | Code + Ops | No critical authorization/secret finding. |
| 2 | AI model boundary, high-severity safety policy, mode isolation, kill switches. | A/C | Code + T&S | Red team/mode traversal pass. |
| 3 | Ledger/capacity/payment/ad exactly-once reconciliation. | A/B/E | Code | Duplicate/reorder/replay tests pass. |
| 4 | Cost ledger, budgets, routing, provider fallback, daily spend controls. | B | Code + Founder | Cohort cost dashboard/kill switch live. |
| 5 | Privacy/DPIA/cookies/consumer/payments policy and counsel verification. | C/F | Legal-verify + Founder | Evidence pack/sign-off. |
| 6 | HookArc/offer guard, New Game proof, safe no-spend failures. | D | Code | First-session traversal passes. |
| 7 | CI fixture/replay/RLS/mode/payment/ad regression harness. | E | Code | Release gates green. |
| 8 | Minimal consent-safe analytics and daily/weekly dashboard. | F | Code + Founder | Event schema/redaction/consent test. |
| 9 | Save checkpoint/restore/version/export baseline. | K | Code + Ops | Restore/migration drill passes. |
| 10 | Support/S0-S3 ladder, status/incident, admin training. | L | Ops + Founder | Tabletop exercise pass. |
| 11 | Accurate landing/pricing/policy/creator assets. | G | Founder + Legal-verify | Claim review and links live. |
| 12 | Kid Mode public gating decision; no ads regardless. | C/A | Founder + Legal-verify | Do not publicize until proof/sign-off. |

### 1M. 90-day integrated calendar

| Period | Priority | Parallel-safe work | Must not conflict with continuity P0 |
|---:|---|---|---|
| Days 1–15 | Integrity/security foundation. | Threat model, RLS/auth, capacity/ledger idempotency, fixtures, cost event schema. | All state writes remain behind existing authority stack. |
| Days 16–30 | Safety/compliance/first-session. | Mode isolation, policy/reporting, HookArc eventing, New Game simplification, privacy/data map. | Do not weaken claim/manifest checks for speed. |
| Days 31–45 | Reliability and evidence. | Provider fallback, replay/checkpoint, webhook/S2S, support tooling, analytics dashboards, cost reservation. | Preserve accepted-only commit/refund. |
| Days 46–60 | Closed beta. | 30/100-turn tests, creator/landing proof, incident drills, counsel/vendor approvals, restore game day. | Feedback fixes turn into regression fixtures. |
| Days 61–75 | Cohort soft launch. | Web adult Free small cohort, no ads until approval, daily cost/safety/reliability review. | No capacity/ad experiment before HookArc guard proof. |
| Days 76–90 | Controlled expansion. | Verified ad pilot, D1/D7/quality holdouts, media selective beta, localization hardening. | Scale only with continuity error rate non-inferior. |

### 2M. Do not research further / do not build yet

Do not build WOF/MMO/shared world, housing, auction, public feed, creator marketplace, offerwall, core-story interstitials, Kid ads, full comic mode, full auto TTS, public BYOK, auto branch merge, broad language expansion, behavioural analytics, session replay, or a blockchain. Do not spend another research cycle on generic “memory” methods until StateTx/manifest/claim gate/replay/control-account evaluation shows an actual gap.

### 3M. Founder decision pack

| Decision | Recommendation | Alternative | Cost if wrong |
|---|---|---|---|
| Public web date | Set only after 12 Must items are green. | Marketing-date-first. | Launching under security/safety/payment debt. |
| Kid Mode | Hold public availability until counsel/DPIA/mode tests; keep ad-free. | Public day one. | Child safety/privacy risk. |
| Ads | AppLixir only after written approval; one/day adult Free. | House ads only/no ads. | Vendor ambiguity/fraud/retention damage. |
| Play | Later after web stability/store matrix. | Parallel release. | Doubling policy/support/billing scope. |
| BYOK | Later adult web-only isolated route. | Launch now. | Key/processor/T&S scope. |
| Images/TTS | Harden Memorable/selective TTS, defer comic/full auto voice. | Media-first build. | Cost/latency distract from text truth. |
| Analytics | Minimal server-led event taxonomy. | Full behavioural tool. | Privacy/cookie/child exposure. |
| Sharing | Private export only. | Social feed/cards. | Online safety/moderation burden. |
| Cost policy | Budget reservations/transparent Play Later. | Silent throttling. | Trust loss and runaway spend. |
| Support | Email/in-app + named escalation, not Discord-first. | Community-only. | Lost sensitive tickets and unsafe disclosure. |

### 4M. Definition of “ready for public web adult Free”

SynapticGM is ready only when: (1) canonical turns, saves, capacity, payments, and ad rewards are server-authoritative and exactly-once; (2) no known cross-account/RLS/admin/secret critical issue remains; (3) adult/Kid mode boundaries, high-severity safety handling, reporting, escalation, and kill switches pass drills; (4) privacy/consumer/payment/ad/vendor decisions have current counsel/official-policy verification and evidence; (5) cost is visible per session with reservations, caps, fallback, and a tested 15-minute stop-loss path; (6) the first-session HookArc and no-spend failure journey pass; (7) deterministic and live-canary regression gates cover campaign integrity, safety, entitlement, ads, saves, and modes; (8) restore, rollback, status, support, and incident playbooks work in a tabletop drill; and (9) public claims, pricing, policies, creator material, and support links reflect the running product.

## References

[1]: https://owasp.org/www-project-application-security-verification-standard/ ; https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html "OWASP ASVS and threat modelling"
[2]: https://supabase.com/docs/guides/database/postgres/row-level-security ; https://supabase.com/docs/guides/auth "Supabase RLS and Auth"
[3]: https://genai.owasp.org/llm-top-10/ ; https://www.ncsc.gov.uk/blog-post/prompt-injection-is-not-sql-injection "LLM security"
[4]: https://www.nist.gov/itl/ai-risk-management-framework ; https://doi.org/10.6028/NIST.AI.600-1 "NIST AI RMF and generative-AI profile"
[5]: https://www.ncsc.gov.uk/collection/secure-system-administration/use-privileged-access-management ; https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html "Privileged access and secrets"
[6]: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/ ; https://www.ofcom.org.uk/online-safety "UK children and online safety"
[7]: https://www.gov.uk/online-and-distance-selling-for-businesses ; https://docs.stripe.com/billing/subscriptions/webhooks "Consumer selling and Stripe webhooks"
[8]: https://support.google.com/admob/answer/7313578?hl=en ; https://developers.google.com/admob/android/rewarded "Rewarded-ad policy and verification"
[9]: https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers ; https://www.asa.org.uk/advice-online/recognising-ads-social-media.html "Creator disclosure"
[10]: https://sre.google/workbook/error-budget-policy/ "SRE error budgets"
[11]: https://developer.apple.com/app-store/review/guidelines/ ; https://support.google.com/googleplay/android-developer/answer/13985936?hl=en "Store AI/content policy"
[12]: https://ico.org.uk/for-organisations/report-a-breach/personal-data-breach/personal-data-breaches-a-guide/ "UK breach reporting"
