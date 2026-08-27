# Draft G — Phased build board

> File names below are limited to modules named in the supplied live-state brief. Repository paths should be confirmed during ticket creation; this document does not invent paths or provide implementation patches.

## G) Phased build board — P0 this month → P1 → P2

### G.1 P0 product decision

**Ship this month:** an opt-in **comic-lite thin wedge** consisting of one hosted Klein scene-art plate on selected committed beats, always paired with existing overlay lettering, plus comic chrome around existing Memorable plates. This is more delightful than chrome alone, but it does not promise every-turn art or multi-panel webtoon. Director remains hard-disabled. Deterministic BeatSpec selection and the current valid GM `<panel>` tags, under strict validation, feed the one-panel path.

The month is successful if players experience reliable illustrated moments without waiting for them, Classic remains unchanged, Kid filtering occurs before spend, and the service can turn generation off without affecting story play.

### G.2 P0 build board — this month

| Sequence | Work item | Owner file/module(s) | Dependency | Main risk | Kill criterion / fallback |
|---:|---|---|---|---|---|
| 1 | **Freeze the one-panel P0 contract**: one focal beat, one current revision, one pure-art prompt, one overlay receipt, one capacity record | `comicScript` types, `comicScriptAdapter`, `useGame` | Existing accepted turn/ledger shape | Scope expands into full Director or strip planning | If contract needs free-form invented prose, reduce to Memorable-only chrome |
| 2 | **Keep Director disabled and add deterministic source precedence**: valid tags first only when ledger-safe; otherwise BeatSpec template | `useGame`, `parsePanels`, `comicScriptAdapter` | Roster/place/kit binding | Tags smuggle unknown entities/outcomes; two sources race | Reject art plan, not story; default to deterministic one-panel template or skip |
| 3 | **Implement eligibility and duplicate suppression policy** for salient committed beats | `panelBudget`, `useGame`, `memorableMoments` | Tier/settings/capacity state | Free spends on thin or repeated turns | Remotely drop eligible rate to zero and retain chrome/composite |
| 4 | **Make prompt compilation ledger-bound and pure-art-only** with original technique bundles and five-anchor negative-space intent | `comicImagePrompt`, `visualConsistency` | PanelSpec and style token allowlist | Text/franchise leak, wrong kit/place, prompt dilution | Disable offending technique bundle or generation class; show plate/chrome fallback |
| 5 | **Add Kid rewrite/skip before capacity reservation/provider call** | Kid pre-spend gate in `useGame`/`generateComicImage`, `comicImagePrompt` | Existing Kid policy inputs | Unsafe framing reaches provider or renders | Zero tolerance: stop Kid generation and use text/chrome until repaired |
| 6 | **Make image jobs atomic, idempotent, non-blocking, and revision-scoped** | `generateComicImage`, edge `generate-image`, `useGame` | Post-commit queue and capacity ledger | Double debit, late stale attach, input wait | Any confirmed double debit/stale attach/input block stops generation globally |
| 7 | **Render pending/success/fail as one replaceable tile**; never blank, never story-blocking | `ComicGrid`, `useZoomGesture`, `useGame` | Job status contract | Layout shift, focus trap, unresolved promise | Collapse to chrome/plate state; keep text and choices active |
| 8 | **Bind overlays to accepted utterance/caption IDs**, not prompt or image metadata | `SpeechBubble`, `NarrativeText`, `ActionOverlay`, `ComicGrid` | Accepted text store and five anchors | Wrong speaker or unreadable bubble | Fail closed to caption rail/approved fallback anchor with contrast scrim |
| 9 | **Wrap Memorable plates in shared comic chrome without mounting ComicGrid in Classic** | `memorableMoments`, Classic renderer, overlay components, `useZoomGesture` | Existing Memorable plate provenance | Classic becomes comic mode; stale plate reused | Disable shared chrome per mode; preserve original Classic rendering |
| 10 | **Expose remote kill switches and conservative caps** for model, tier, Kid, and frequency | Settings, `panelBudget`, edge `generate-image` | Operational configuration | Provider or budget incident requires client release | Global off means text/Classic/Memorable/composite continue normally |
| 11 | **Instrument receipts and release metrics**: eligible/skip reason, model, panel count, attempts, paid retry, latency, attach state, repair, capacity | `generateComicImage`, edge `generate-image`, `ComicGrid`, `memorableMoments` | Stable event IDs | Telemetry records sensitive prompts or cannot join attempts | Store structured reason codes and hashes/IDs; pause widening until accounting reconciles |
| 12 | **Run fixture gate and limited opt-in rollout** with Free comic-lite default for comic users | All P0 owners; fixture pack F | Items 1–11 | Delight is low or errors are concentrated | Roll back generation frequency while retaining Memorable chrome and overlays |

### G.3 P0 month cadence

| Week | Deliverable | Exit condition |
|---|---|---|
| **Week 1 — contract and safety** | PanelSpec/source precedence, deterministic eligible-beat templates, Kid preflight, pure-art compiler, kill-switch design | Golden contract fixtures pass; no provider call occurs for skip/Kid reject/over-budget/tag contradiction |
| **Week 2 — reliable async path** | Idempotent debit/job/attempt records, revision guard, pending/fail tile, overlay binding | Mocked provider tests prove input never blocks, duplicate POST does not double debit, and stale result never attaches |
| **Week 3 — chrome and live canary** | Memorable chrome in comic mode, Classic regression protection, one-panel Klein canary, telemetry dashboards | Internal sessions complete with canonical text always available and all hard invariants intact |
| **Week 4 — limited opt-in** | 5% → 20% comic-user rollout with remote frequency control | Metrics below meet gates for seven consecutive days or rollout holds/rolls back |

### G.4 P0 done-when metrics

| Metric | P0 done-when | Why it is hard |
|---|---:|---|
| Story/input availability while art pending or failed | **100%** of tested and sampled turns | Art is decoration, never a transaction dependency |
| Double debit | **0 confirmed** | Accounting trust is non-negotiable |
| Stale art attached after correction | **0** | Revision mismatch corrupts player trust |
| Kid unsafe render | **0** | Rewrite/skip must occur before spend and display |
| Classic mounts `ComicGrid` or queues comic panels | **0 regressions** | Classic users cannot be harmed |
| Overlay speaker/text mismatch | **0 deterministic fixture failures** | Accepted text is authoritative |
| Correct roster + place + major equipped item in sampled simple plates | **≥95%** | Below this, generated art is not trustworthy enough |
| Billable retry rate | **≤10% target; hard warning at 12%** | Retries dominate per-panel COGS |
| P95 committed-turn → tile replacement for Klein | **≤15 s** end-to-end target | The UI is non-blocking, but delight decays when art arrives too late |
| Free raw image COGS / 100 turns | **≤$0.31 model / ≤$0.39 with reserve** under launch assumptions | Validates the comic-lite envelope |
| Player hide/repair on displayed P0 plates | **≤15%** | High repair indicates low delight/adherence even if transport succeeds |
| P0 crash/error regression from comic components | **No material increase** versus Classic control | Thin wedge must not destabilise play |

### G.5 P1 — validated strips, layout banks, better references, repair UX

| Work item | Owner file/module(s) | Dependency | Main risk | Kill criterion / fallback |
|---|---|---|---|---|
| Add original two- and three-panel card IDs and explicit order/gutter/anchor fields | `comicScript` types, `comicScriptAdapter`, `ComicGrid`, `panelBudget` | P0 one-panel stability | Layout order ambiguity or mobile crowding | Keep only `V2-ACTION-REACTION` and conservative LTR cards; fall back to one splash |
| Permit webtoon two-panel action/reaction and paged two-panel dialogue/reaction | `ComicGrid`, layout bank, `panelBudget` | Correct boundary-state BeatSpec | Art implies uncommitted outcome | Disable card/beat pairing; use single approved boundary state |
| Add selective paged three-panel experiments | layout bank, `panelBudget`, `generateComicImage` | Two-panel gates, Mid/High capacity | Latency and spend multiply; weak middle panels | Clamp back to two or one panel |
| Send one rights-cleared focal reference through capability-checked Klein path | `visualConsistency`, `comicImagePrompt`, `generateComicImage`, edge `generate-image` | Reference registry/provenance | Identity gain is weak; kit/place conflict; payload cost | Remove reference and return to prompt-only; retain approved portrait for composite |
| Add explicit **retry / simplify / portrait scene / hide** controls | `ComicGrid`, `generateComicImage`, overlay components | Failure reason taxonomy, capacity receipt | Reroll addiction and hidden spend | Cap attempts; default to simplify/composite rather than reroll |
| Add deterministic portrait/background composite | `memorableMoments` or shared plate layer, `ComicGrid`, overlay components | Rights-cleared portrait/background/kit assets | Stale attributes or asset combinatorics | Omit uncertain layers; use single approved portrait plus neutral backdrop |
| Add mobile viewport and accessibility matrix for every live card | `ComicGrid`, overlays, `useZoomGesture` | Stable card IDs | Text blocks faces/action; zoom traps focus | Remove card/anchor pair from allowlist |
| Evaluate optional light planner on Mid/High only | optional Director/planner adapter, `comicScriptAdapter` | Deterministic baseline and schema | Planner invents facts or adds latency without uplift | Keep disabled if it does not beat templates on preference, adherence, repair, latency, and COGS |

**P1 gate:** Do not widen from one panel until the two-panel fixture set holds ≥95% roster/place/major-kit correctness, P95 tile completion stays within the chosen live budget, paid retries remain under threshold, and opt-in players prefer the strip over the same beat as one splash. Three-panel work begins only after two-panel evidence.

### G.6 P2 — recap, advanced consistency, and gated full comic

| Work item | Owner file/module(s) | Dependency | Main risk | Kill criterion / fallback |
|---|---|---|---|---|
| End-of-chapter async recap using four/six-panel cards and validated asset reuse | `memorableMoments`, recap selector, `comicPageCompositor`, `ComicGrid` for live viewing | P1 card/provenance/repair data | Six fresh jobs recreate every-turn economics | Build recaps primarily from existing plates; limit new hero panel count |
| Export-quality overlay bake after the fact | `comicPageCompositor` | Canonical overlay receipt and asset provenance | Live path starts depending on baked text | Keep compositor export-only; no baked result re-enters live turn rendering |
| Pro reference bundles for hero/reveal/repair panels | `generateComicImage`, edge `generate-image`, `visualConsistency` | Proven P1 reference uplift and High capacity | Trait swapping, cost, slow completion | Pro remains selective/async; downgrade to Klein or composite |
| Optional LoRA/fine-tune experiment | Future model registry plus existing prompt/reference path | Rights-complete original dataset, deletion/versioning/safety | Rights ambiguity, overfit, storage and routing burden | Stop if uplift over Pro references is not material or governance is incomplete |
| Full comic mode behind explicit gates | Settings, `panelBudget`, all pipeline owners | Recap and strip metrics sustained | Every-turn spend/latency/continuity damage | Keep thin wedge/strip/recap as permanent modes; full comic is not an entitlement |

### G.7 Explicit near-term No-Go list

| No-Go | Reason | Reconsider only when |
|---|---|---|
| Every-turn six-panel webtoon or full page | Violates current budget, webtoon cap, and latency envelope | Thin wedge → two-panel strip → recap gates all hold with sustainable COGS |
| Re-enable Director as P0 dependency | Adds nondeterminism and a second failure surface before render path is stable | Optional planner beats deterministic baseline under strict schema and ledger binding |
| Continuity-Warden or second LLM image critic | Prohibited; adds spend/latency and could mistake art for truth | **Do not reconsider under this brief** |
| Bake bubbles/captions/SFX into live images | Conflicts with product law and model-card text limitations | **Do not reconsider for live turns** |
| LoRA in P0/P1 Free path | Rights, storage, training, versioning, and operations exceed thin-wedge need | P2+ rights-complete High/Admin experiment with measured uplift |
| More than two required characters in generated live panel by default | Identity/kit binding risk rises sharply | Fixed fixtures prove reliable multi-reference binding across cameras |
| Four/six fresh generated panels in a live turn | Linear paid jobs and failure surfaces | Recap-only evidence and a new approved panel budget |
| Player BYOK or consumer SaaS as the primary art path | Violates hosted-path requirement and is operationally inconsistent | Outside this brief's primary player path |
| Licensed franchise/living-artist style targets | Rights and product-law violation | **Never**; use original technique bundles |
| Art-derived ledger updates | Art is noncanonical and may hallucinate | **Never**; text/ledger remain truth |
| Kid Mode ad gate for required visuals | Product-law violation | **Never** |

### G.8 Recommended board order

The sequence is deliberately **thin wedge → strip → recap → gated full comic**. If full comic never clears its economics or trust gates, the first three stages are still complete products: sparse illustrated play, validated paired beats, and chapter-level visual reward.
