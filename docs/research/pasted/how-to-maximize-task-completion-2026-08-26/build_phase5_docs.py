#!/usr/bin/env python3
import json, csv
from pathlib import Path

ROOT=Path('/home/ubuntu/SynapticGM_story_tones_gm_personality_2026-08-26')
OUT=ROOT/'deliverables'
PREFIX='SynapticGM_story_tones_gm_personality_2026-08-26_'

# Blind taste + continuity protocol
blind=f'''# Tone Blind-Taste and Continuity Regression Protocol

**Author:** Manus AI  
**Purpose:** Determine whether players can distinguish intended tone without sacrificing comprehension, respect, agency, or canonical accuracy.

> **Order of operations:** A sample is eligible for taste testing only after it passes render-equivalence, hard-gate, and Kid Mode checks. A charming sample that changes a fact is a failed sample.

## 1. Test questions

The protocol answers four questions. First, does each renderer produce a perceptibly distinct tone while preserving the same authority payload? Second, can players identify the intended target words without seeing the tone label? Third, does the rendering remain trustworthy, respectful, and easy to act on? Fourth, do results hold across engine mode, perspective, severity, and Kid Mode?

NN/g’s tone research supports evaluating content along formal–casual, serious–funny, respectful–irreverent, and matter-of-fact–enthusiastic dimensions and testing interpretation with representative users rather than relying on internal judgment.[1] [2] [3]

## 2. Stimulus construction

| Control | Requirement |
|---|---|
| Canonical input | Use one `authority_input` from `tone_eval_fixtures.json`; do not edit the payload between tone variants. |
| Surface parity | Keep names, numbers, event order, paragraph count band, and choice affordances stable enough that content—not plot novelty—drives preference. |
| Blind label | Show `Sample A/B/C`, never the internal tone ID, personality ID, theme name, or intended adjective. |
| Visual isolation | First round is text-only. A second optional round adds a constant neutral theme. Theme-specific testing is separate. |
| Randomization | Randomize variant order per participant and rotate which tone receives each letter. |
| Perspective | Test second- and third-person cells separately; do not mix perspective inside one comparison. |
| Kid testing | Run only with appropriately recruited participants and guardian/organizational safeguards. **COUNSEL / RESEARCH OPS** defines consent and age requirements. |

## 3. Stage A — deterministic preflight

Every variant must pass these checks before human exposure:

| Gate | Pass condition |
|---|---|
| Canonical hash | `canonicalHash(authorityProjection(render)) === fixture.canonical_sha256`. |
| Number fidelity | All game-state numbers are exact; no unsupported number appears as a timer, probability, distance, damage, or price. |
| Entity and exit subset | Rendered entities and exits are subsets of SceneManifest/SNAPSHOT, except non-entity atmosphere tokens approved by schema. |
| Choice legality | Every displayed action binds to a current `choiceTierRules` permit. Labels do not promise success. |
| Prose warden | All blocking deterministic rules pass; no second LLM critic runs. |
| Kid gate | If tagged, plain-language, no-pressure, no-adult-chrome, non-graphic, and safe-confirmation checks pass. |
| Art independence | The sample remains complete if art is missing or delayed. |

Use Vitest parameterized tests for the repeated fixture matrix and snapshots for reviewed presentation output.[10] [11]

## 4. Stage B — blind participant evaluation

Participants read three renderings of the same scene. They first answer comprehension questions with objective answers, then rate each sample on five-point semantic differentials.

| Measure | Prompt | Success target |
|---|---|---|
| Fact recall | “Where are you, who is present, what changed, and what options remain?” | 100% on critical state facts; investigate any lower result. |
| Formality | Formal 1–5 Casual | Median within one point of target profile. |
| Humor | Serious 1–5 Funny | Median within one point, with forbidden-context jokes scored as automatic failures. |
| Respect | Respectful 1–5 Irreverent | No sample may be perceived as blaming or humiliating the player by more than a small isolated minority; qualitative review required. |
| Energy | Matter-of-fact 1–5 Enthusiastic | Median within one point of target profile. |
| Target words | Select up to five adjectives from a randomized controlled list. | At least two intended words among the top choices and no critical anti-tone word among the top three. |
| Agency | “I understand what I can do next.” | Median ≥4/5. |
| Trust | “I trust the status and consequence information.” | Median ≥4/5. |
| Distinctness | “A, B, and C feel meaningfully different.” | Median ≥4/5 for intended contrast sets. |
| Preference | Forced rank plus free-text reason. | Descriptive, not a universal winner metric. |

The proposed thresholds are **SPECULATIVE product gates**, not published norms. Pilot with a small internal cohort, inspect qualitative failure modes, then commission a power analysis from observed variance before claiming population-level significance.

## 5. Contrast sets

| Set | Tones | Why |
|---|---|---|
| Precision | `litrpg_system_registrar`, `clinical_auditor`, `military_procedural` | Tests whether three factual voices remain distinguishable without jargon inflation. |
| Warmth | `cozy_low_stakes_comfort`, `warm_chronicle`, `bright_field_guide` | Separates comfort, memory, and curiosity. |
| Dark | `grimdark_bleak_consequence`, `gothic_moonlit_dread`, `ashen_archivist` | Separates consequence, atmosphere, and history while holding severity constant. |
| Energy | `pulp_kinetic_adventure`, `street_balladeer`, `pyoa_branching_crisis` | Separates camera motion, oral cadence, and immediate agency. |
| Wit | `dry_wit_deadpan`, `noir_case_file`, `cozy_brutal` | Detects sarcasm drift and player-targeted humor. |
| Wonder | `mythic_portent`, `fae_uncanny_tale`, `kid_plain_stakes` | Tests grandeur, uncanniness, and plain safety without implied new facts. |

## 6. Theme and image pairing test

After text-only tone validity passes, test theme suggestions separately. Ask whether the kit fits the tone and whether participants infer nonexistent story facts from the visual. Any image that causes a majority to report an absent entity, location, faction, reward, or clue fails even if attractive. Do not test baked lettering because it is prohibited by product law.

## 7. Regression cadence and stop rules

Run the deterministic suite on every bank, rail, template, warden, and prompt change. Run a focused blind taste when a tone’s dimensions shift by more than one scale point, a Simple picker label changes, a new high-severity theme pairing is introduced, or a Kid Mode gate changes. Stop rollout on any ledger mismatch, consent ambiguity, hidden cost, recurring player-blame phrase, or false visual fact. Snapshot updates require reviewer approval; CI must not auto-accept changed snapshots.[11]

## 8. Analysis template

Report medians and distributions for ordinal scales, factual error counts, gate failure counts, and the themes from open comments. Do not compress comprehension, trust, and preference into one score. A preferred tone that reduces fact recall does not ship. Segment exploratory results by engine mode, perspective, Kid Mode, and familiarity with RPG conventions; mark small cells as directional.

## References

[1]: https://www.nngroup.com/articles/tone-of-voice-dimensions/ "The Four Dimensions of Tone of Voice — Nielsen Norman Group"
[2]: https://www.nngroup.com/articles/tone-voice-users/ "The Impact of Tone of Voice on Users’ Brand Perception — Nielsen Norman Group"
[3]: https://www.nngroup.com/articles/tone-voice-words/ "Tone-of-Voice Words — Nielsen Norman Group"
[10]: https://vitest.dev/guide/learn/writing-tests.html "Writing Tests — Vitest"
[11]: https://vitest.dev/guide/snapshot "Snapshot — Vitest"
'''
(OUT/f'{PREFIX}tone_blind_taste_protocol.md').write_text(blind,encoding='utf-8')

board=f'''# P0–P2 Implementation Board

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
'''
(OUT/f'{PREFIX}p0_p1_p2_implementation_board.md').write_text(board,encoding='utf-8')

# Executive scorecard
status_rows=[
('grimdark_bleak_consequence','Later; exclude from Kid Surprise-me','Launch as Expert text; art gated by rating','High severity and metaphor risk require strong gates.'),
('cozy_low_stakes_comfort','Launch through `chilled-gm`/`fireside-innkeep` rails','Launch','Low implementation risk; strong broad accessibility.'),
('cozy_brutal','Launch; shipped ID','Launch','Existing ID; validate violence-to-comfort balance.'),
('pulp_kinetic_adventure','Later as Expert; text can pilot','Launch','Choice and scene geometry must stay factual.'),
('gothic_moonlit_dread','Later; no Kid Surprise-me','Launch as Expert','Flagship visual opportunity; highest false-friend risk.'),
('litrpg_system_registrar','Launch; shipped ID','Launch','Clear fit with existing systemPersonality.'),
('military_procedural','Launch; shipped ID','Launch','Low ambiguity if counts and positions are authority-bound.'),
('dry_wit_deadpan','Launch; shipped ID with hard humor gates','Launch','Humor requires context suppression.'),
('warm_chronicle','Launch through `fireside-innkeep`','Launch','High warmth; memory claims need pinned-canon check.'),
('clinical_auditor','Later as Expert rail','Launch','Useful for trust but can become jargon-heavy.'),
('mythic_portent','Later as Expert; no Kid dark variant','Launch','Metaphor must not become prophecy or item property.'),
('street_balladeer','Later as Expert rail','Launch','Requires anti-accent and anti-rhyme-distortion gates.'),
('ashen_archivist','Later as Expert rail','Launch','History claims and ossuary imagery need controls.'),
('bright_field_guide','Launch through `chilled-gm`','Launch','Strong discovery fit and Kid compatibility.'),
('noir_case_file','Later; Kid mystery rewrite only','Launch as Expert','Clue and guilt inference are the main continuity hazards.'),
('fae_uncanny_tale','Later; no hidden bargains','Launch as Expert after validation','Contract clarity and Kid rewrite are prerequisites.'),
('hard_sf_terminal','Later as Expert','Launch as Expert','Telemetry must be evidence-bound and readable.'),
('pyoa_branching_crisis','Launch for `pyoa`','Launch','Directly aligned to existing Mode DNA.'),
('kid_plain_stakes','Launch as mandatory layer, not genre picker','Launch as mandatory layer','Cross-cutting constraint; never monetized as a safety upgrade.')]
score=['# Executive Scorecard — Story Tones × GM Personality\n','**Author:** Manus AI  ','**Decision posture:** Launch deterministic text rails first; treat art frequency and template IDs as unverified until missing pack inputs arrive.\n','| Tone | Free | Mid/High | Rationale |','|---|---|---|---|']
for r in status_rows: score.append('| '+ ' | '.join(r) +' |')
score += ['\n## Portfolio decision\n','The strongest immediate release set is **System Registrar, Field Procedural, Dry Deadpan, Cozy Brutal, Hearthside Comfort, Warm Chronicle, Bright Field Guide, Branching Crisis, plus the Kid Plain Stakes layer**. Dark, uncanny, archival, noir, mythic, balladeer, clinical, and hard-SF profiles should enter as Expert rails after invariant and blind-taste validation. The tone itself is inexpensive compared with generated art; Free-tier restrictions should therefore target **art frequency**, not prose identity.\n','The art program remains asynchronous. The Free proposal follows the provided summary’s sparse approximately-20%-of-eligible-beats direction and uses Klein 4B; Mid/High may use FLUX.2 Pro for memorable plates. Public endpoint records on 2026-08-26 showed $0.014/MP for Klein 4B and $0.03/MP for Pro, but internal cost scenarios are **INPUT REQUIRED** and pricing must be discovered at runtime.[6]\n','## Hard gates\n','No tone ships if it changes the canonical projection, turns inference into evidence, exposes hidden costs, mocks the player, weakens Kid Mode, or requires a second LLM critic. No art tier ships if it blocks the GM turn, treats pixels as ledger truth, or bakes lettering into the image.\n','## References\n','[6]: https://openrouter.ai/docs/guides/overview/multimodal/image-generation "Image Generation — OpenRouter Documentation"\n']
(OUT/f'{PREFIX}executive_scorecard.md').write_text('\n'.join(score),encoding='utf-8')

# Eight founder decisions / Part T6
founder=[
('D1','Storage model','Store `tone_id` as an additive rendering preset beside existing `systemPersonality` / `gmPersonality`; do not create a new authority-bearing engine.','A separate personality engine may look cleaner but creates migration, precedence, and continuity risk.','RECOMMEND'),
('D2','New Game simplicity','Show four narrator picks and four System picks; move the full catalogue and `theatrical-jester` to Expert/More styles while preserving old saves.','Fewer first-run choices improve clarity but reduce visible novelty.','RECOMMEND'),
('D3','Expert tone breadth','Ship Expert tones only after shared invariant fixtures pass; start with text rails before themed art.','A large catalogue is attractive, but simultaneous prose and art rollout makes failures hard to diagnose.','RECOMMEND'),
('D4','Surprise-me','Use an allowlist conditioned on engineMode, rating, Kid Mode, and scene severity; never randomize banned pairings.','True randomness feels surprising but can produce disrespectful or inaccessible combinations.','RECOMMEND'),
('D5','Art frequency','Keep art asynchronous and sparse; interpret “20%” as a target among already-eligible Free beats, not all turns.','Higher frequency increases perceived value but magnifies cost, repetition, and fact-invention pressure.','RECOMMEND'),
('D6','Template IDs','Do not assign memorable Templates 01–20 until the missing style guide is ingested; ship recipe IDs and semantic layout classes now.','Guessing IDs would look complete but create false implementation confidence.','RECOMMEND'),
('D7','Quality gate','Require canonical-hash equality before tone distinctness and preference testing.','Strict gating can reject attractive prose, but factual trust is the product moat.','RECOMMEND'),
('D8','Commerce and rights','Treat seasonal kit×tone bundles and audio likeness as P2 **COUNSEL** items; never sell safety or Kid protections.','Commerce can fund premium presentation, but rights, refunds, age treatment, and dark patterns need explicit review.','RECOMMEND')]
t6=['# Part T6 — Scorecard and Founder Decisions\n','**Author:** Manus AI\n','The executive scorecard is provided separately as a one-page decision surface. This section records the decisions that preserve product law while maximizing expressive range.\n','| ID | Decision | Recommendation | Tradeoff | Verdict |','|---|---|---|---|---|']
for row in founder:t6.append('| '+' | '.join(row)+' |')
t6 += ['\n## Cross-check rule\n','Every recommendation in this pack carries one of four statuses: **VERIFIED** by a public source or live endpoint; **PROVIDED SUMMARY** from the attached task brief; **SPECULATIVE** product design requiring testing; or **COUNSEL** requiring legal/commercial review. Details dependent on absent internal attachments are **INPUT REQUIRED**.\n','## Final founder call\n','Approve P0 deterministic rails, status templates, never-lines, and fixtures. Approve P1 design work but block template-ID and COGS commitments until the missing packs are supplied. Keep P2 comic strips, audio, and commerce outside the launch critical path.\n']
(OUT/f'{PREFIX}Part_T6_scorecard_founder_decisions.md').write_text('\n'.join(t6),encoding='utf-8')

# Part T4 manifest and implementation fuel guidance
part4=f'''# Part T4 — Implementation Banks and File Contracts

**Author:** Manus AI

| Required bank | Format | Cardinality | Primary consumer | Validation |
|---|---|---:|---|---|
| `tone_catalogue.csv` | CSV | 19 tone rows | Expert picker, documentation | Required T1 fields non-empty; exact IDs; Kid delta. |
| `tone_to_gm_rails.csv` | CSV | 19 tone rows | Renderer configuration | Existing lever names only; shipped primary IDs. |
| `tone_theme_image_matrix.csv` | CSV | 19 tone rows | Theme suggestion and prompt builder | All 22 kits covered; negative prompt; Kid rewrite. |
| `tone_fluid_rail_snippets.md` | Markdown | 19 blocks | Prompt assembly | Firewall header on every tone. |
| `tone_choice_pad_banks.json` | JSON | 19 × 4 × 10 patterns | `choiceTierRules` presentation | Bound placeholders; no promised success. |
| `tone_status_chrome_templates.json` | JSON | 19 × 6 templates | Status/why/repair renderer | Exact source values; humor disabled in critical contexts. |
| `tone_never_lines.csv` | CSV | 14 rules per tone | Deterministic warden and QA | Allowed YES/NO and Kid flag present. |
| `tone_eval_fixtures.json` | JSON | 24 fixtures × 3 renders | Vitest and review harness | Same canonical hash across tones. |
| `tone_blind_taste_protocol.md` | Markdown | One protocol | UX research | Deterministic preflight precedes preference. |
| `p0_p1_p2_implementation_board.md` | Markdown | One board | Product/engineering | Dependencies and acceptance criteria. |
| `unknowns_and_evidence_gaps.md` | Markdown | One register | Founder/research | Missing sources and safe default. |

## Import behavior

CSV and JSON files use UTF-8 and stable snake-case identifiers. Pipe-separated values inside CSV cells are arrays for import convenience; normalize them to arrays in the application layer. JSON banks include a `schema_version`. Placeholder values in choice and status templates are declarative and must bind only to pre-authorized values. Unknown placeholders cause the choice or message to be suppressed, not guessed.

## Source priority

The task brief is the only attached source. Its product-law statements are treated as binding **PROVIDED SUMMARY**. Public sources verify tone dimensions, plain-language principles, regression-test mechanisms, error-copy principles, public-domain caveats, and current OpenRouter image endpoints. Missing internal files remain **INPUT REQUIRED**.
'''
(OUT/f'{PREFIX}Part_T4_implementation_banks.md').write_text(part4,encoding='utf-8')

# Part T5 points to implementation board.
part5=f'''# Part T5 — Implementation Plan

**Author:** Manus AI

The detailed backlog is in `{PREFIX}p0_p1_p2_implementation_board.md`. P0 contains deterministic mappings, rail snippets, status templates, warden rules, theme suggestions, and invariant tests. P1 expands the Expert catalogue, Mode-DNA choice banks, memorable-plate deltas, opener cameras, and blind-taste validation. P2 contains comic-lite mood expansion, optional strips, audio-lite, and commerce, all outside the critical path.

> **Release invariant:** No P1 or P2 presentation feature may bypass the P0 authority hash, deterministic scrub, Kid gate, or asynchronous-art boundary.
'''
(OUT/f'{PREFIX}Part_T5_implementation_plan.md').write_text(part5,encoding='utf-8')

# Unknowns and evidence gaps.
unknowns=f'''# Unknowns and Evidence Gaps

**Author:** Manus AI  
**Rule:** Missing evidence is not filled with confident detail.

| Gap | Status | Blocked claim or action | Safe interim behavior |
|---|---|---|---|
| MEGA README and nested pack | INPUT REQUIRED | Cannot verify pack version, canonical terminology, or file relationships. | Treat task brief as summary only. |
| `theme_prompts.csv` | INPUT REQUIRED | Cannot quote or diff the 22 kits’ exact prompt text. | Use exact kit keys and original append-only deltas; do not overwrite source prompts. |
| `memorable_plate_style_guide.md` | INPUT REQUIRED | Cannot map Templates 01–20 or reproduce the Master Suffix. | Emit recipe IDs and mark every template mapping unresolved. |
| `item_icon_prompts.csv` | INPUT REQUIRED | Cannot integrate exact icon prompt grammar. | Keep icons out of this implementation scope beyond model eligibility. |
| `map_chrome_prompts.md` | INPUT REQUIRED | Cannot reconcile map-specific chrome. | Preserve map chrome unchanged. |
| `visible_moat_copy.csv` | INPUT REQUIRED | Cannot claim exact prior wording or IDs. | Use the summarized `status / why / repair` pattern and original templates. |
| `opener_pointer_examples.md` | INPUT REQUIRED | Only System Arrival and Debt Under Glass are named in the brief. | Do not invent additional opener families. |
| `DO_NOT_USE.md` | INPUT REQUIRED | Cannot guarantee every project-specific forbidden motif or term is covered. | Enforce task-brief prohibitions and add a merge gate when supplied. |
| `claim_pattern_bank.csv` and `adversarial_almost_false.csv` | INPUT REQUIRED | Cannot align exact claim-class IDs or adversarial cases. | Provide an original deterministic warden bank; diff rather than replace later. |
| Comic Maximizer source and drafts | INPUT REQUIRED | Cannot verify BeatSpec/PanelSpec field names, eligibility thresholds, or Director design. | Keep P0 Director off; use semantic mood tokens only. |
| `cost_model_tier_scenarios.csv` | INPUT REQUIRED | Cannot verify monthly COGS, queue capacity, user-turn distribution, or approved frequency. | Use runtime price discovery and conservative sparse eligibility; make no monthly cost promise. |
| Premium Theme Constitution and T5/T6/T9/T14 files | INPUT REQUIRED | Cannot verify exact `--sgm-*` tokens, fonts, dice names beyond the brief, false-friend test cases, or backlog IDs. | Preserve stated constitution and Vampire summary; mark all added material provisional. |
| Prior Vibe V3 and scorecard | INPUT REQUIRED | Cannot prove old preset scores, blind-taste thresholds, or exact prior recommendation rationales. | Reconcile names to shipped IDs from the task brief and label synthesis. |
| Live codebase and schemas | INPUT REQUIRED | Cannot guarantee drop-in field names, import paths, or save migration behavior. | Provide data contracts and a reference adapter, not a patch. |
| Live UI | UNKNOWN | No screenshots were supplied and none were invented. | Validate labels in a staging build. |
| Regional content ratings and child-consent rules | COUNSEL | Cannot define age gates or release treatment globally. | Keep Kid Mode conservative and involve counsel/research operations. |
| Worldwide public-domain status | COUNSEL | U.S. public-domain availability does not prove global clearance.[14] [16] | Use technique summaries and original banks; review target jurisdictions. |
| Seasonal commerce | COUNSEL | Bundle pricing, refunds, entitlements, and dark-pattern exposure are unknown. | Keep P2 and never sell safety protections. |
| Audio/TTS identity and consent | COUNSEL | Voice likeness and vendor terms are unknown. | Keep audio-lite flavor abstract and defer named-voice work. |

## Known verified boundaries

OpenRouter’s public image API and current model discovery were checked on 2026-08-26, but those endpoint capabilities and prices can change and do not substitute for SynapticGM’s internal validation or commercial policy.[6] NN/g, W3C, Digital.gov, and Vitest guidance informs the test and copy disciplines in this pack.[1] [7] [10] [12]

## References

[1]: https://www.nngroup.com/articles/tone-of-voice-dimensions/ "The Four Dimensions of Tone of Voice — Nielsen Norman Group"
[6]: https://openrouter.ai/docs/guides/overview/multimodal/image-generation "Image Generation — OpenRouter Documentation"
[7]: https://www.w3.org/WAI/WCAG2/supplemental/objectives/o3-clear-content/ "Use Clear and Understandable Content — W3C WAI"
[10]: https://vitest.dev/guide/learn/writing-tests.html "Writing Tests — Vitest"
[12]: https://www.nngroup.com/articles/error-message-guidelines/ "Error-Message Guidelines — Nielsen Norman Group"
[14]: https://www.copyright.gov/help/faq/faq-duration.html "How Long Does Copyright Protection Last? — U.S. Copyright Office"
[16]: https://www.gutenberg.org/policy/license.html "The Project Gutenberg License"
'''
(OUT/f'{PREFIX}unknowns_and_evidence_gaps.md').write_text(unknowns,encoding='utf-8')

# JSON schema for fixtures.
schema={
'$schema':'https://json-schema.org/draft/2020-12/schema','$id':'https://synapticgm.example/schemas/tone-eval-fixtures.schema.json','title':'SynapticGM Tone Evaluation Fixtures','type':'object','required':['schema_version','fixture_count','rendering_count','contract','fixtures'],'properties':{
'schema_version':{'type':'string'},'fixture_count':{'type':'integer','minimum':24},'rendering_count':{'type':'integer','minimum':72},'contract':{'type':'string'},'fixtures':{'type':'array','minItems':24,'items':{'type':'object','required':['fixture_id','kid_mode','authority_input','canonical_sha256','renderings','pass_criteria'],'properties':{'fixture_id':{'type':'string','pattern':'^fx[0-9]{2}_'},'kid_mode':{'type':'boolean'},'authority_input':{'type':'object'},'canonical_sha256':{'type':'string','pattern':'^[a-f0-9]{64}$'},'renderings':{'type':'array','minItems':3,'items':{'type':'object','required':['tone_id','text','expected_canonical_hash','tone_signals_required','kid_safe_required']}},'pass_criteria':{'type':'object'}}}}}}
(OUT/f'{PREFIX}tone_eval_fixture.schema.json').write_text(json.dumps(schema,indent=2)+'\n',encoding='utf-8')

# TypeScript reference contracts.
ts='''export type EngineMode = 'litrpg' | 'dnd' | 'rpg' | 'pyoa';
export type SystemPersonality = 'cold-system' | 'dry-wit' | 'army-brief' | 'chilled-gm' | 'cozy-brutal';
export type GmPersonality = 'chilled-gm' | 'dry-wit' | 'theatrical-jester' | 'army-brief' | 'fireside-innkeep';
export type EvidenceStatus = 'VERIFIED' | 'PROVIDED SUMMARY' | 'SPECULATIVE' | 'INPUT REQUIRED' | 'COUNSEL' | 'UNKNOWN';

export interface AuthorityProjection {
  location_id: string;
  present_entity_ids: string[];
  exit_ids: string[];
  inventory: Record<string, number>;
  hp: number;
  resource_deltas: Record<string, number>;
  quest_flags: Record<string, boolean | string>;
  permits: string[];
  rolls: Array<{ id: string; total: number; outcome: string }>;
  outcome_code: string;
  time_delta: number;
  evidence_ids: string[];
}

export interface ToneRenderRequest {
  authority: AuthorityProjection;
  sceneManifest: unknown;
  engineMode: EngineMode;
  toneId: string;
  systemPersonality?: SystemPersonality;
  gmPersonality?: GmPersonality;
  perspective: 'second' | 'third_limited' | 'third_external';
  kidMode: boolean;
}

export interface ToneRenderResult {
  prose: string;
  chrome: { status: string; why: string; repair: string }[];
  choiceLabels: Array<{ choiceId: string; label: string }>;
  authorityProjection: AuthorityProjection;
  diagnostics: string[];
}

export interface ArtEligibility {
  eligible: boolean;
  reason: 'memorable_beat' | 'thin_turn' | 'insufficient_anchors' | 'kid_skip' | 'cooldown' | 'tier' | 'budget' | 'capacity' | 'duplicate' | 'safety';
  modelAlias?: 'klein_4b' | 'flux_pro';
}

/** Reference order only: authority is resolved before this function is called. */
export function renderWithTone(req: ToneRenderRequest): ToneRenderResult {
  const before = canonicalHash(req.authority);
  const draft = applyExistingVoiceAndFluidRails(req);
  const scrubbed = deterministicProseWarden(draft, req.authority, req.kidMode);
  if (canonicalHash(scrubbed.authorityProjection) !== before) {
    throw new Error('TONE_RENDER_EQUIVALENCE_VIOLATION');
  }
  return scrubbed;
}

export function evaluateArtEligibility(input: {
  kidSkip: boolean; stableVisualAnchors: number; memorableBeat: boolean;
  duplicateBeat: boolean; cooldownOpen: boolean; tierAllows: boolean;
  budgetAllows: boolean; capacityAllows: boolean; safetyAllows: boolean;
}): ArtEligibility {
  if (input.kidSkip) return { eligible: false, reason: 'kid_skip' };
  if (!input.memorableBeat) return { eligible: false, reason: 'thin_turn' };
  if (input.stableVisualAnchors < 2) return { eligible: false, reason: 'insufficient_anchors' };
  if (input.duplicateBeat) return { eligible: false, reason: 'duplicate' };
  if (!input.cooldownOpen) return { eligible: false, reason: 'cooldown' };
  if (!input.tierAllows) return { eligible: false, reason: 'tier' };
  if (!input.budgetAllows) return { eligible: false, reason: 'budget' };
  if (!input.capacityAllows) return { eligible: false, reason: 'capacity' };
  if (!input.safetyAllows) return { eligible: false, reason: 'safety' };
  return { eligible: true, reason: 'memorable_beat' };
}

declare function canonicalHash(value: AuthorityProjection): string;
declare function applyExistingVoiceAndFluidRails(req: ToneRenderRequest): ToneRenderResult;
declare function deterministicProseWarden(draft: ToneRenderResult, authority: AuthorityProjection, kidMode: boolean): ToneRenderResult;
'''
(OUT/f'{PREFIX}tone_contract_reference.ts').write_text(ts,encoding='utf-8')

# Source register.
sources='''# Sources and Evidence Register

**Author:** Manus AI

| Ref | Source | Used for | Status |
|---:|---|---|---|
| 1 | [NN/g — Four Dimensions of Tone of Voice](https://www.nngroup.com/articles/tone-of-voice-dimensions/) | Formality, humor, respect, enthusiasm axes; situation-sensitive tone. | VERIFIED |
| 2 | [NN/g — Impact of Tone of Voice](https://www.nngroup.com/articles/tone-voice-users/) | Trust, friendliness, preference; humor risk; matched-message testing. | VERIFIED |
| 3 | [NN/g — Tone-of-Voice Words](https://www.nngroup.com/articles/tone-voice-words/) | Target and anti-tone word method. | VERIFIED |
| 4 | [Project Gutenberg](https://www.gutenberg.org/) | Public-domain/U.S.-expired-copyright corpus and classic exemplars. | VERIFIED with jurisdiction caveat |
| 5 | [Standard Ebooks](https://standardebooks.org/ebooks) | Public-domain genre corpus and genre taxonomy. | VERIFIED |
| 6 | [OpenRouter — Image Generation](https://openrouter.ai/docs/guides/overview/multimodal/image-generation) | API, discovery, endpoint capabilities, billing model. | VERIFIED 2026-08-26 |
| 7 | [W3C — Clear and Understandable Content](https://www.w3.org/WAI/WCAG2/supplemental/objectives/o3-clear-content/) | Short sentences, easy words, simple tense, unambiguous content. | VERIFIED |
| 8 | [W3C — COGA Usable](https://www.w3.org/TR/coga-usable/) | Cognitive accessibility, mistake prevention, support, user testing. | VERIFIED |
| 9 | [Digital.gov — Plain Language](https://digital.gov/guides/plain-language) | Audience-specific plain-language design and testing. | VERIFIED |
| 10 | [Vitest — Writing Tests](https://vitest.dev/guide/learn/writing-tests.html) | Parameterized tests. | VERIFIED |
| 11 | [Vitest — Snapshot](https://vitest.dev/guide/snapshot) | Snapshot review and CI behavior. | VERIFIED |
| 12 | [NN/g — Error-Message Guidelines](https://www.nngroup.com/articles/error-message-guidelines/) | Precise, constructive, non-blaming repair copy. | VERIFIED |
| 13 | [NN/g — Error Messages Scoring Rubric](https://www.nngroup.com/articles/error-messages-scoring-rubric/) | Visibility, communication, and efficiency review. | VERIFIED |
| 14 | [U.S. Copyright Office — Duration FAQ](https://www.copyright.gov/help/faq/faq-duration.html) | Copyright-duration caveats. | VERIFIED |
| 15 | [U.S. Copyright Office — Lifecycle of Copyright](https://www.copyright.gov/history/copyright-exhibit/lifecycle/) | Public-domain and unprotected idea/fact/procedure distinctions. | VERIFIED |
| 16 | [Project Gutenberg License](https://www.gutenberg.org/policy/license.html) | U.S.-specific and trademark/license caveats. | VERIFIED |
| A | User-provided master task specification | Product law, shipped IDs, kit keys, summarized pack findings, required outputs. | PROVIDED SUMMARY |
| B | Listed MEGA / Comic / Premium / Prior Vibe attachments | Exact prompt text, templates, costs, IDs, and prior tests. | INPUT REQUIRED |
'''
(OUT/f'{PREFIX}sources_and_evidence.md').write_text(sources,encoding='utf-8')

# Top-level README and import order.
readme=f'''# SynapticGM Story Tones × GM Personality × Theme and Image Pairing

**Author:** Manus AI  
**Build date:** 2026-08-26  
**Scope:** Live SynapticGM consumer app only.

## What this bundle contains

This omnibus defines nineteen tone records, maps each tone to the shipped GM/System personality IDs and existing rendering levers, pairs tones with all twenty-two existing theme-kit keys, provides append-only image-prompt deltas, and supplies deterministic implementation banks and regression fixtures. It does **not** introduce a parallel personality engine, second LLM critic, theme-derived authority, or every-turn comic mode.

> **Non-negotiable authority order:** player correction → pinned canon → StateTx → SceneManifest → evidence → invention. Tone starts only after the permitted result exists.

## Cursor import order

| Order | File | Purpose |
|---:|---|---|
| 1 | `{PREFIX}README.md` | Scope, evidence labels, and navigation. |
| 2 | `{PREFIX}tone_contract_reference.ts` | Reference types, render firewall, and art-gate order. |
| 3 | `{PREFIX}tone_catalogue.csv` | Canonical tone definitions and shipped-overlap map. |
| 4 | `{PREFIX}tone_to_gm_rails.csv` | Existing-lever configuration. |
| 5 | `{PREFIX}tone_fluid_rail_snippets.md` | Copy-paste additive rails. |
| 6 | `{PREFIX}tone_choice_pad_banks.json` | Mode-DNA label patterns. |
| 7 | `{PREFIX}tone_status_chrome_templates.json` | Ledger-honest status/why/repair copy. |
| 8 | `{PREFIX}tone_never_lines.csv` and `{PREFIX}tone_prose_warden_rules.json` | Deterministic prohibitions and validators. |
| 9 | `{PREFIX}tone_eval_fixtures.json` and schema | Authority-equivalence corpus. |
| 10 | `{PREFIX}vitest_tone_contract_template.ts` | Adapter scaffold for the live renderer. |
| 11 | `{PREFIX}tone_theme_image_matrix.csv` | Cosmetic kit suggestions and image deltas. |
| 12 | `{PREFIX}Part_T3_themes_images.md` | False friends, prompt assembly, and cost gates. |
| 13 | `{PREFIX}tone_blind_taste_protocol.md` | UX validation after deterministic checks. |
| 14 | `{PREFIX}p0_p1_p2_implementation_board.md` | Sequenced delivery backlog. |
| 15 | `{PREFIX}unknowns_and_evidence_gaps.md` | Missing inputs and safe defaults. |

## Evidence labels

| Label | Meaning |
|---|---|
| VERIFIED | Checked against a public source or live public endpoint. |
| PROVIDED SUMMARY | Stated in the attached master brief but underlying source file absent. |
| SPECULATIVE | Product recommendation requiring test or integration validation. |
| INPUT REQUIRED | A named attachment or live schema is missing. |
| COUNSEL | Legal, commercial, age, or rights review is required. |
| UNKNOWN | Evidence was not available and no safe inference was made. |

## Pack map

The narrative explanation is split into `Part_T1_tone_catalogue.md`, `Part_T2_GM_application.md`, `Part_T3_themes_images.md`, `Part_T4_implementation_banks.md`, `Part_T5_implementation_plan.md`, and `Part_T6_scorecard_founder_decisions.md`. The one-page founder view is `executive_scorecard.md`. Machine-readable assets use CSV or JSON and are summarized in `manifest.json` after validation.

## Critical limitations

Only `pasted_content.txt` was attached. The named MEGA, Comic Maximizer, Premium Themes, and Prior Vibe files were not present. This bundle therefore does not claim to quote or fully ingest them. Template 01–20 assignments, exact master suffixes, prior score thresholds, internal model aliases, and internal COGS remain blocked. See the unknowns register.

## Public-source method

The bundle uses NN/g for tone dimensions and testing, W3C and Digital.gov for plain-language/accessibility, Vitest for parameterized and snapshot-test mechanisms, the U.S. Copyright Office and Project Gutenberg for rights caveats, and OpenRouter documentation plus live endpoint discovery for current image API facts.[1] [6] [7] [10] [14]

## References

[1]: https://www.nngroup.com/articles/tone-of-voice-dimensions/ "The Four Dimensions of Tone of Voice — Nielsen Norman Group"
[6]: https://openrouter.ai/docs/guides/overview/multimodal/image-generation "Image Generation — OpenRouter Documentation"
[7]: https://www.w3.org/WAI/WCAG2/supplemental/objectives/o3-clear-content/ "Use Clear and Understandable Content — W3C WAI"
[10]: https://vitest.dev/guide/learn/writing-tests.html "Writing Tests — Vitest"
[14]: https://www.copyright.gov/help/faq/faq-duration.html "How Long Does Copyright Protection Last? — U.S. Copyright Office"
'''
(OUT/f'{PREFIX}README.md').write_text(readme,encoding='utf-8')
print('Wrote remaining phase 5 documents')
