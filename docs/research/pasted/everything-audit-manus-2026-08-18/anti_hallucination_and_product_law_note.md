# Anti-Hallucination and Product-Law Note

## Evidence Labels

| Label | Exact meaning | Permitted use |
|---|---|---|
| **EVIDENCED BY SNAPSHOT** | The supplied brief explicitly says a capability is built/building/current. No build was observed. | Describe as a claimed capability; attach a verification test. |
| **PUBLICLY EVIDENCED** | A cited public page reviewed on 2026-08-18 describes the feature/policy/price. | Attribute narrowly to the source; do not infer private implementation or quality. |
| **MARKETING CLAIM** | A product/company asserts a benefit. | Quote/describe as a claim, not independent proof. |
| **UNVERIFIED** | No sufficient source, live build, screenshot, trace, telemetry, or policy supports a conclusion. | State the unknown and test/artifact needed. |
| **SPECULATIVE** | A proposed design hypothesis, scenario, formula input, or forecast condition. | Label it and give a validation gate. |
| **COUNSEL** | Requires qualified legal review based on actual entity, audience, jurisdiction, data flows, contracts, and marketing. | Present as a question/checklist, never settled legal advice. |
| **INFERENCE** | A reasoned risk/failure mode derived from documented mechanics, not an observed product outcome. | Explain why it is plausible; do not present as competitor fact. |

## Snapshot Honesty Boundary

The Snapshot template in the supplied prompt was unfilled. The audit received no build/commit, public URL, screenshots, engine status confirmations, pricing/entitlement configuration, actual CostEvent data, player traces, or playtest notes. As a result:

1. The audit **does not** claim that SynapticGM features are shipped or functioning.
2. E2 is a heuristic review, not a screenshot/UI audit.
3. E5 is a parameterized formula model, not a financial forecast or pricing recommendation.
4. E1 comparisons show SynapticGM’s claimed stack alongside competitors’ public documentation; they are not a measured benchmark.
5. Every high-value claim has a corresponding test in E3/E4/E8 or a required input in E10.

## Product-Law Self-Check

| Requirement | Result | Where enforced in this audit |
|---|---|---|
| No WOF | **PASS** | No WOF recommendation, backlog item, or roadmap. |
| No hybrid climate | **PASS** | Excluded from scope, backlog, and founder plan. |
| No patent work | **PASS** | Excluded from scope, backlog, and founder plan. |
| No MMO networking redesign | **PASS** | Excluded from scope, backlog, and founder plan. |
| No RAG-as-truth | **PASS** | E3 RT39–42; E8 global invariant; E9 counters; E11 P0-8. |
| No build-your-own ChatGPT narrator now | **PASS** | E5/E11/E12 preserve API narrator; GPU path is measured/gated only. |
| Personality cannot override ledger | **PASS** | E3 RT47–50; E7 voice contract; E8 invariant; E11 P1-18. |
| Player correction has highest authority | **PASS** | Product-law stated in E0/E3/E8; E3 correction fixtures; E11 P0-1/3. |
| Pinned canon/opening invariant constrains corrections where appropriate | **PASS** | RT16; E7 repair language; E11 authority resolver. |
| Accepted StateTx outranks manifest/evidence/draft invention | **PASS** | E3 RT01–10/39–42; E8 CI architecture. |
| Supporting evidence is non-authoritative | **PASS** | E3 poison tests; E5/E8/E9 specifications. |
| Kid ads off / AppLixir written approval only | **PASS** | E5 tier posture; E6 hard gate; E12 purchase board. |
| Mid/High no ads | **PASS** | E5 tier posture; E6 tier gate. |

## Claims the Audit Does Not Make

The audit does not claim that SynapticGM is legally compliant; suitable for children; secure; private; ad-free; profitable; cost-efficient; superior to a named competitor; live in all engines; free of bugs; or ready for public launch. It identifies the evidence required to make narrower, substantiated versions of such claims.

## Writing/Source Discipline

All factual competitor and provider statements are paired with a source in the relevant deliverable and indexed in `competitor_citation_appendix.md`. Search snippets are not treated as citations. User-provided product facts are called out as Snapshot claims. Formula values without a source are not fabricated; they are marked `INPUT REQUIRED` or `SPECULATIVE`.

[Back to project index](../README.md)
