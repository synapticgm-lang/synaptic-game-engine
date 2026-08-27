# SynapticGM Audit — Scope and Evidence Log

**Project:** SynapticGM Everything Audit 2026-08-18  
**Research date:** 2026-08-18 (GMT+1)  
**Prepared by:** Manus AI  
**Method:** Fresh public research plus the supplied product-law and current-state brief.

## Mission Boundary

This audit covers **only SynapticGM**, a single-player, ledger-first AI GM for LitRPG, story RPG, tabletop, and PYOA play. It excludes WOF, hybrid climate, patents, and MMO networking redesign. The audit uses the authority order supplied by the requester as a non-negotiable product law:

> Player correction → pinned canon / opening invariant → accepted StateTx → SceneManifest → supporting evidence → draft invention.

The audit further treats the following as invariant: the ledger, not retrieval, is the truth source; personality is diction only and cannot mutate facts; no recommendation is made to build a proprietary general-purpose narrator now; and Warden GPU work remains gated rather than assumed.

## Evidence Classes

| Class | Meaning | How this audit uses it |
|---|---|---|
| **EVIDENCED BY SNAPSHOT** | Explicitly stated as current in the supplied brief. | Presented as a product claim, not independently observed implementation behavior. |
| **PUBLICLY EVIDENCED** | Verified against a competitor’s public product, help, pricing, or policy material during this research cycle. | Cited with URL and access date. |
| **UNVERIFIED** | No supplied artifact, public demo, or test record supports the point. | Never presented as fact; converted into a test or information request. |
| **SPECULATIVE** | A design hypothesis or proposed estimate. | Clearly labeled and paired with a validation condition. |
| **COUNSEL** | A business/legal decision that requires qualified legal review. | Framed as an issue list, not legal advice. |

## Product Snapshot Available for This Audit

The supplied snapshot template was **not filled in**. No build/commit, public URL, screenshots, live-engine confirmation, pricing configuration, analytics export, actual model/token costs, or observed player session was provided. Therefore:

1. The listed capabilities are treated as **claimed current/building** rather than independently verified.
2. The E2 review is a **heuristic outside-player review of the supplied product contract**, not a visual UI/screenshot audit.
3. The E5 cohort model is a **parameterized scenario model**, not a forecast; no vendor pricing, conversion rate, retention, or actual cost data is invented.
4. The E9 continuity conclusions distinguish documented public behavior from plausible failure modes.

## SynapticGM Claimed Current State

| Area | Claimed in supplied brief | Audit treatment |
|---|---|---|
| Continuity | StateTx, SceneManifest, IntentContract and obligation coverage, CampaignContract, ledger revision and speculative retries. | EVIDENCED BY SNAPSHOT; requires trace/replay tests. |
| Narrative controls | IntroductionPermit, beatFingerprint, HookArc soft-offer guard, leak scanner. | EVIDENCED BY SNAPSHOT; requires adversarial fixture evidence. |
| Experience | GM voice profiles, quest what-next/provenance, combat receipt, HUD “Why?”, honeymoon turns, Memorable Moments Classic splash. | EVIDENCED BY SNAPSHOT; requires click-through and player comprehension testing. |
| Safety/ops | Kid Mode filters, operational kill switches. | EVIDENCED BY SNAPSHOT; requires mode-boundary and incident drills. |
| Commercial | Stripe foundation; Free adult web first; Mid/High no ads; Kid ads off; AppLixir only with written approval. | EVIDENCED BY SNAPSHOT; live status UNVERIFIED. |

## Questions Deliberately Deferred

The final E10 file enumerates questions requiring product telemetry, live player observation, screenshots, source code, financial data, or counsel. Research will not pretend those can be settled from public web sources.

## Financial Analysis Disclosure

The cost and monetization work uses a **unit-economics scenario basis** rather than investment valuation. The reference date is 2026-08-18. Inputs that are not supplied or sourced are labeled `INPUT REQUIRED` or `SPECULATIVE`; no personal financial advice or investment recommendation is provided.

## Project Structure

| Directory | Contents |
|---|---|
| `research/` | Raw public-source notes and research extracts. |
| `deliverables/` | Executive memo and E1–E12 Markdown deliverables. |
| `fixtures/` | CSV/JSON simulation and evaluation fixtures. |
| `appendices/` | Citation appendix, labels, and self-check. |
| `workpapers/` | Scope, assumptions, audit workpapers, and calculations. |

## Required Follow-up Artifacts for a True Product Audit

Please treat the following as inputs for a future revision: a current URL or build, 8–12 screenshots or a short click-through recording, one anonymized 100-turn trace (StateTx + manifests), one correction/reload trace, token and image CostEvent exports, pricing/entitlement configuration, and any recent playtest notes.

[Back to project index](../README.md)

<!-- Labels: EVIDENCED BY SNAPSHOT / PUBLICLY EVIDENCED / UNVERIFIED / SPECULATIVE / COUNSEL -->
