# Screenshot Audit Playbook

**Status:** **INPUT REQUIRED / NOT RUN.** No live URL, build, seed environment, or account access was supplied. This playbook and `audit_tracker.csv` define the evidence run; they do **not** claim screenshots were captured.

**Required viewports:** desktop `1440×900` and mobile `390×844`, browser zoom `100%`.

> **Release rule:** A feature is not visually evidenced until the expected screenshot exists, the matching tracker row is marked `PASS` or `FAIL`, the environment and build are recorded, and any supporting state/network evidence is linked.

## 1. Audit Objectives

The audit should prove the visible trust moat rather than merely proving that pages render. It tests continuity repairs, provenance, player agency, Kid Mode, honest caps, optional ads, media defaults, responsive surfaces, and the absence of retired or licensed-world vocabulary in live text.

| Objective | What the screenshot can prove | What requires supporting evidence |
| --- | --- | --- |
| Visual correctness | Text, labels, hierarchy, wrapping, clipping, affordances, banners, panels, responsive layout. | Underlying state truth and network behaviour. |
| Continuity behaviour | Repair copy and before/after visible facts. | Snapshot fixture, GameState diff, repair ledger entry. |
| Cap fairness | Counter before/after, refund confirmation, bonus confirmation. | Authoritative cap ledger and idempotency logs. |
| Kid Mode | Adult rows and ad entry points are absent from visible surfaces. | Network evidence that ad/media SDKs never load or call; prompt-routing test. |
| Media safety | Plate composition and visible exclusions. | Generation prompt, provider metadata, safety review, source-state fixture. |
| Licensing workflow | Source/licence fields appear in internal intake. | Exact downloaded file, licence record, retrieval date, hash, notices, counsel review. |

## 2. Required Evidence Folder

Create this structure beside the tracker during the run:

```text
audit_run_YYYY-MM-DD_build-<id>/
├── run_manifest.md
├── audit_tracker_completed.csv
├── screenshots/
│   ├── desktop/
│   └── mobile/
├── fixtures/
├── state_diffs/
├── network/
├── console/
└── defects/
```

The completed tracker should be a copy, not an overwrite of the master `audit_tracker.csv`.

## 3. Run Manifest

Record all fields before taking the first screenshot.

| Field | Required value |
| --- | --- |
| Product/build | Commit, release candidate, or immutable build ID. |
| Environment | Test/staging URL and data region; never use production player content for fixture screenshots. |
| Run date/time | ISO date/time and time zone. |
| Auditor | Name or role. |
| Browser | Browser name and exact version. |
| OS | OS and version. |
| Zoom | `100%`. |
| Desktop viewport | `1440×900`. |
| Mobile viewport | `390×844`. |
| Device pixel ratio | Record actual value; do not silently compare captures with different DPR. |
| Theme | Theme key and whether official/custom/default. |
| Account class | Free/Mid/High and standard/Kid mode. |
| Locale | Language, region, and time zone. |
| Seed package | Fixture version/hash. |
| Known limitations | Any blocked provider, media stub, payment stub, or test-only route. |

## 4. Deterministic Fixture Requirements

| Fixture property | Rule |
| --- | --- |
| Synthetic identity | Use invented names and email aliases. Never expose a real player, payment method, support ticket, or child record. |
| Fixed clock | Freeze or record time for reset, weather, and elapsed-time tests. |
| Fixed random source | Seed random theme, writer, or generation paths where supported. Record the seed. |
| Exact inventory | Each continuity case starts from an explicit item-instance list and location. |
| Exact cast | Record present, absent, remote, and historical people separately. |
| Exact location | Include indoor/outdoor state, known exits, used exit, time, and weather. |
| Exact provenance | Rumour, soft offer, accepted quest, bound relic, readable source, deed, and skill-offer records must have known source turn IDs. |
| Cap ledger | Record opening setup, daily base, one-time +8 flag, successful turns, failed turns, refunded turns, and ad overflow separately. |
| Media | Use approved synthetic prompts and no real face, brand, logo, licensed character, or copyrighted-world reference. |
| Failure injection | Use a deterministic test hook or stub. Do not induce failures by attacking the service or sending unsafe production traffic. |

## 5. Tracker Workflow

1. Copy `audit_tracker.csv` into the run folder as `audit_tracker_completed.csv`.
2. Filter by `priority=P0` and run those rows first.
3. For each base case, prepare the named `seed_or_fixture` once, then capture desktop and mobile from the same logical state.
4. Save the file with the exact `expected_filename` from the tracker.
5. Record `PASS`, `FAIL`, `BLOCKED`, or `N/A` in `status`.
6. Fill `owner`, `evidence_path`, and `notes` immediately. Do not batch these fields from memory at the end.
7. Link state diff, network log, console extract, or licence record when the screenshot alone cannot prove the requirement.
8. If a capture reveals a P0 defect, stop the affected flow, create a defect record, and preserve the failing evidence before attempting a fix.

### Status Meanings

| Status | Meaning |
| --- | --- |
| `NOT RUN` | No current-build evidence exists. This is the master default. |
| `PASS` | Every pass cue is evidenced; no fail cue is observed; supporting evidence is linked where required. |
| `FAIL` | A required cue is absent, a fail cue is present, or the visible state contradicts the fixture. |
| `BLOCKED` | Environment, fixture, provider, permission, or reproducibility issue prevents a valid result. Name the blocker and owner. |
| `N/A` | The feature is intentionally absent from this build and the release owner approves the exclusion. Do not use `N/A` to hide an unimplemented P0 promise. |

## 6. Capture Standard

| Capture detail | Requirement |
| --- | --- |
| Dimensions | Set viewport exactly to the tracker width and height. Do not resize by eye. |
| Zoom | Keep browser zoom at `100%`. Do not shrink to make overflow disappear. |
| Crop | Capture the full viewport. A tighter supplemental crop may be attached, but never replace the full evidence frame. |
| Pointer | Move the cursor away from copy unless hover state is the test. |
| Focus | For modal, form, or keyboard cases, include a separate capture of focus state if not visible in the main frame. |
| Scroll | Capture the required state at natural scroll position. If the evidence spans multiple screens, suffix `_part1`, `_part2`, and link all files in one tracker row. |
| Dynamic content | Wait for the final settled state. Record any animation/loading defect separately. |
| Redaction | Redact only sensitive identifiers. Never redact the feature text, counter, state cue, or defect being audited. Save the unredacted original only in an access-controlled evidence store if policy allows. |
| File format | PNG preferred for UI text. Do not use lossy recompression that obscures small type. |
| Filename | Use the exact tracker value, for example `a09_mobile_390x844.png`. |

## 7. Desktop and Mobile Pass Gates

### Desktop `1440×900`

The page must have no unintended horizontal document overflow. Main actions, close controls, `Accept`, `Decline`, `Cancel`, `Why?`, and cap details must be visible or naturally reachable. Fixed elements must not cover narrative results, status chips, repair banners, or action controls.

### Mobile `390×844`

Text must wrap without clipping. Banners and status chips must not push the primary action off-screen without an obvious path. Dialog close/decline controls must remain reachable. No two-column assumption may make source, cost, tell, provenance, or cap data unreadable. A mobile pass is not inferred from the desktop pass.

### Responsive Failure Cues

| Failure | Evidence |
| --- | --- |
| Horizontal page scroll | Capture left and right extremes or devtools measurement. |
| Clipped copy | Full frame plus tight crop. |
| Obscured action | Full frame showing the fixed element and hidden control. |
| Unreachable decline/cancel | Screenshot and short keyboard/tab sequence note. |
| Banner collision | Frame showing overlap with narrative or composer. |
| Incorrect reflow | Desktop/mobile pair from identical fixture. |

## 8. Feature-Specific Evidence

### Continuity Repairs

For A09–A14, preserve the pre-turn fixture, raw proposed output if policy permits in the controlled test store, the protected snapshot fields, the corrected output, and the GameState diff. The pass is narrow: the unsupported detail disappears while valid player action and unrelated facts remain.

### Quest Provenance

For A06–A08, capture accepted, rumour, and soft-offer records from distinct fixtures. A visual difference is required; colour alone is insufficient. The supporting ledger must point to the source turn or act.

### Skill Growth

For A16–A22, capture source provenance, explicit commitment, cost/terms, and durable refusal. The screenshot should show the player-understandable explanation; the state evidence should show the exact relic instance, readable source, deed ID, offer ID, and status transitions.

### Caps and Failures

For A23–A26, record before/after cap-ledger exports. The player counter, opening setup, one-time +8 grant, failed-turn refund, and any optional overflow must remain distinct. A player cap refund does not prove a provider refund and the UI must not say otherwise.

### Ads and Kid Mode

A28 requires a UI screenshot **and** a network capture. The pass condition is not merely a hidden button: the optional ad SDK, consent request, identifier call, reward endpoint, and ad placeholder must not load or call in Kid Mode. Never use a real child account.

### Memorable Media

A29–A32 require the source-state fixture, prompt, negative prompt, mode, and review result. The Free default remains OFF, weekly entitlement is zero, and no automatic request fires. Adult viewpoint is default unless the fixture biography explicitly establishes a child. Kid-safe plates require separate review, not simple reuse.

### Asset Intake

A34–A35 are founder/admin evidence, not player-facing screens. Link the source page, licence text, retrieval date, exact file, hash, attribution/notice obligation, and risk status. Share-alike entries stay out of the default shipping path.

## 9. Copy and Vocabulary Scan During Capture

While each screen is open, inspect all visible strings—not only the intended focal element.

| Reject category | Examples of what to reject |
| --- | --- |
| Licensed-world shortcuts | Series, franchise, studio, creator, publisher, or “write like” references in live/GM-ready/player-facing text. |
| Retired world vocabulary | Any value from the founder’s retired-world list. |
| Implementation jargon | LLM, model hallucination, system prompt, regex, retrieval, transaction, validator, state machine, stack trace. |
| False absolutes | “Remembers everything,” “never forgets,” “no hallucinations,” or unqualified “safe.” |
| Unsupported state | Invented item, companion, rank, exit, time jump, weather change, location shift, crowd size, quest acceptance, or last-item claim. |
| Kid Mode leakage | Adult prompt row, ad entry point, graphic/sexualized copy, frightening repair wording, or unsupported real-person likeness. |

## 10. Accessibility Companion Checks

Screenshots cannot prove keyboard order, screen-reader names, live-region behaviour, contrast ratios, reduced motion, or target size. Add these companion checks to the run manifest:

| Check | Minimum evidence |
| --- | --- |
| Keyboard | Tab order for New Game, repair, skill offer, cap, ad refusal, and dialogs; no keyboard trap. |
| Focus | Visible focus on all actions; focus returns correctly after closing a dialog. |
| Screen reader | Accessible names and state for status chips, accepted/rumour/offer, cap meter, `Accept`/`Decline`, Kid Mode, and errors. |
| Live announcements | Repair, failed-turn refund, skill acceptance/decline, and cap changes announced without repeating the whole page. |
| Contrast | Automated result plus manual check for theme variants and disabled states. |
| Motion | Reduced-motion setting removes nonessential animation without hiding state. |
| Colour independence | Quest provenance and pass/fail meaning use text/icon/structure, not colour alone. |

## 11. Defect Record Template

```markdown
# <audit_id> — <short defect title>

- Build:
- Environment:
- Viewport:
- Fixture:
- Severity: P0 / P1 / P2
- Expected:
- Actual:
- Reproduction steps:
- Screenshot:
- State diff:
- Network/console evidence:
- Privacy redaction performed:
- Owner:
- Fix build:
- Re-test evidence:
```

### Severity

| Severity | Meaning |
| --- | --- |
| `P0` | Violates continuity, agency, Kid safety, cap fairness, ad boundary, licence gate, privacy/security promise, or blocks a primary action. Release blocker. |
| `P1` | Material UX, provenance, responsive, accessibility, or trust-copy defect with a workaround. Fix before broad launch unless formally accepted. |
| `P2` | Cosmetic issue that does not obscure meaning or action. Track and schedule. |

## 12. Suggested Run Order

| Session | Cases | Purpose |
| ---: | --- | --- |
| 1 | A01–A05 | New Game, themes, Kid filtering, and grounded opening. |
| 2 | A06–A08 | Quest provenance. |
| 3 | A09–A15 | Continuity repair, Why?, confirmation, and status. |
| 4 | A16–A18 | Bound relic. |
| 5 | A19–A20 | Readable/codex learning. |
| 6 | A21–A22 | Deed offer and durable refusal. |
| 7 | A23–A26 | Free counter, cap, refund, and +8 grant. |
| 8 | A27–A29 | Optional ads, Kid prohibition, and memorable default. |
| 9 | A30–A32 | Map and memorable plates. |
| 10 | A33–A36 | Jargon, asset intake, share-alike exclusion, and combined responsive stress. |
| 11 | Accessibility companion checks | Keyboard, assistive technology, contrast, and motion. |
| 12 | Re-test failures | Same fixtures, same viewports, fixed build, new evidence filenames. |

## 13. Release Sign-Off

A release candidate passes the screenshot gate only when every P0 desktop and mobile row is `PASS`, every linked P0 defect has passed re-test, no `BLOCKED` row remains without written release-owner acceptance, Kid Mode A03/A28/A32 have both UI and supporting evidence, cap cases have ledger evidence, and no forbidden licensed/retired/implementation wording appears in the capture set.

The final sign-off should name the build, tracker checksum, screenshot folder, unresolved P1/P2 defects, legal or privacy exceptions, and approvers. Never reuse evidence from a prior build as current-build proof without a documented equivalence review.
