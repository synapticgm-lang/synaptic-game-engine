# P0–P2 Implementation Board

**Author:** Manus AI  
**Operating rule:** Deterministic banks and invariant tests ship before expanded tone selection or art frequency.

## P0 — Ship soon, low architectural risk

| ID | Work item | Existing extension point | Acceptance criteria | Dependency | Status |
|---|---|---|---|---|---|
| P0-01 | Add tone preset registry for shipped voices | `gmVoiceProfile` IDs | Exact IDs only; no parallel personality engine; old-save rendering unchanged. | Product schema owner | READY |
| P0-02 | Add renderer firewall header | `fluidProseRails` | Every tone block preserves answer-first, one-beat, agency, earned-handoff, and authority precedence. | `tone_fluid_rail_snippets.md` | READY |
| P0-03 | Add tone-to-shipped-ID map | New Game configuration | Cold, Patch, Army, Friendly, Cozy Brutal, and tabletop five resolve deterministically. | `tone_to_gm_rails.csv` | READY |
| P0-04 | Add ledger-honest chrome variants | Status/why/repair templates | Exact values preserved; critical contexts disable humor; all errors are constructive and non-blaming.[12] [13] | `tone_status_chrome_templates.json` | READY |
| P0-05 | Extend deterministic `proseWarden` | Regex/classifier validators | No second LLM; blocks invented entities, numbers, exits, timers, style-clone prompts, and baked lettering. | `tone_prose_warden_rules.json` | READY |
| P0-06 | Add invariant fixture suite | Vitest | 24 fixtures × 3 tones; canonical hash equality; Kid gates; snapshots reviewed in CI.[10] [11] | Fixtures and adapter to live renderer | READY WITH ADAPTER |
| P0-07 | Add non-binding theme suggestion chips | Existing theme picker | Tone suggests; player override always available; kit never enters authority resolver. | Theme-token registry | READY WITH INPUT |
| P0-08 | Preserve legacy Theatrical System saves | Save migration/render adapter | Existing saves continue to resolve; not promoted in primary New Game system list. | Save-version inventory | INPUT REQUIRED |

## P1 — Expert breadth and visual validation

| ID | Work item | Existing extension point | Acceptance criteria | Dependency | Status |
|---|---|---|---|---|---|
| P1-01 | Add full Expert tone catalogue | Existing picker | 18 tone presets plus `kid_plain_stakes` as a layer; no licensed labels. | UX capacity test | PROPOSED |
| P1-02 | Add optional intensity | Rail parameter | Changes density/cadence only; never facts; three bounded values recommended. | Blind taste | SPECULATIVE |
| P1-03 | Wire Mode-DNA choice banks | `choiceTierRules` | 10 patterns per tone × four modes; every placeholder binds to allowed entity, item, route, or goal. | Live choice schema | READY WITH ADAPTER |
| P1-04 | Wire memorable-plate deltas | Existing prompt builder | Delta appends after master suffix; global negatives mandatory; no text in pixels. | `memorable_plate_style_guide.md` | INPUT REQUIRED |
| P1-05 | Validate flagship visual presets | Theme tokens and art queue | Vampire/gothic, cozy, registrar, noir, fae, and hard-SF pass false-friend and fact-inference tests. | Premium and mega source files | INPUT REQUIRED |
| P1-06 | Add opener camera transforms | `openingEstablishment` | System Arrival and Debt Under Glass vary camera only; other families wait for source file. | `opener_pointer_examples.md` | PARTIAL |
| P1-07 | Run blind taste | Research harness | Comprehension and trust gates pass before preference ranking. | Representative participants | RESEARCH OPS |

## P2 — Optional presentation expansion

| ID | Work item | Existing extension point | Acceptance criteria | Dependency | Status |
|---|---|---|---|---|---|
| P2-01 | Add comic-lite mood tokens | Deterministic `BeatSpec` / `PanelSpec` | Sparse eligibility; overlay lettering; Kid skip precedes capacity; no Director on P0. | Maximizer files | INPUT REQUIRED |
| P2-02 | Trial Mid/High strip format | Async art job path | Never every turn; no GM timeout coupling; factual anchors survive visual review. | Cost model and latency data | SPECULATIVE |
| P2-03 | Add audio-lite flavor | Existing voice layer | Thin prosody and pacing only; no character imitation; accessibility fallback. | Voice vendor and consent review | COUNSEL |
| P2-04 | Seasonal kit × tone bundles | Theme commerce | Cosmetic-only entitlement, clear ownership, no dark pattern, no licensed trade dress. | Commerce, regional law, refund policy | COUNSEL |

## Explicit No-Go backlog

| Item | Decision | Reason |
|---|---|---|
| Full every-turn multi-panel comic | NO-GO | Cost, latency, continuity, and repetitive composition risk. |
| Continuity-Warden second LLM critic | NO-GO | Contradicts shipped deterministic/classifier architecture. |
| Living-artist or living-author style LoRA/prompt bank | NO-GO | Rights, consent, and product-policy risk. |
| Tone-driven combat or economy changes | NO-GO | Violates rendering firewall. |
| RAG as authority for tone memory | NO-GO | Retrieved prose can conflict with current canon and import protected expression. |
| Folk accent-mockery | NO-GO | Accessibility, dignity, and stereotype risk. |
| Integration cyan as a universal aesthetic | NO-GO | Breaks gothic false-friend separation and material-kit identity. |

## Definition of done

A board item is done only when its machine-readable asset validates, the authority hash remains stable across tone swaps, Kid Mode has an explicit delta, a human reviewer has checked the rendered copy, and the evidence status is not overstated.

## References

[10]: https://vitest.dev/guide/learn/writing-tests.html "Writing Tests — Vitest"
[11]: https://vitest.dev/guide/snapshot "Snapshot — Vitest"
[12]: https://www.nngroup.com/articles/error-message-guidelines/ "Error-Message Guidelines — Nielsen Norman Group"
[13]: https://www.nngroup.com/articles/error-messages-scoring-rubric/ "An Error Messages Scoring Rubric — Nielsen Norman Group"
