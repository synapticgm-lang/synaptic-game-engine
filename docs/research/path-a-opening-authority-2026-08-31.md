# Path A — Opening authority (2026-08-31l)

**Stamp:** HUD `2026-08-31l` / BUILD `2026-08-31e`  
**Mid writer:** OFF  
**John:** “put all these into place” — outside-the-box list from the engine-audit chat.

## What landed

Page 1 is a **committed scene**, not a blank `(opening)` invent.

| ID | Owner | What shipped |
|---|---|---|
| A1 | `useGame` New Game + `stitchOpeningScene` | Stitch first (paint + lock facts). `callOpeningGm` **continues** that scene. Empty/timeout keeps stitch. |
| A2 | `openingPointerCard` + `buildOpeningSceneMandate` | Slots: WHERE / WHO_COUNT / WHY / FIRST_PRESSURE / FORBID. No “ordinary street first” lecture. `pickedHookId` on establishment + campaign contract. |
| A3 | Opening GM `systemLog` | Player-visible `Chapter One — {place}. {who}. {why}.` |
| A4 | `callOpeningGm` / `buildOpeningGmPlayerInput` | “Establish/continue this card” + slots (+ locked stitch). Internal `'(opening)'` sentinel only if empty. |
| B5 | `sceneFacts.lastSnapshotGist` | Persist gist on every `applyCommittedNarrative`. Next SNAPSHOT is a delta. |
| B6 | `scrubOfficialPlaceholder` | Allowlist-only: official/King/figure → **real present person**. Never blue panel. No person → drop the clause. |
| B7 | `seedOpeningSceneFacts` | `crowdCount` from the card (0/1/2/few). No “People are present” with empty `present[]`. |
| B8 | `compileLitrpgCoreIdentity` | Summoned Pact / isekai ≠ Modern Integration Earth. SI keeps Earth. Wake Ledger is in-world. |
| C9 | `fluidProseRails` VALUE FLOOR | One new concrete (fact / tactic / cost / exit / honest empty). Soft length only. |
| C10–11 | Invent budget + quota | Budget 0 until harvest/travel. First GM-continue strips extra invented names. Classifier rejects Earth-street / why invent. |
| D12 | `narrateAutoFightTemplate` | Auto Fight button = ledger + template (body type + lastKill). No second LLM novelist. |
| D13 | `graphExitPads` | Floor-plan pads: named door / north doorway. Camera left/right dropped when a graph exists. |
| E15 | Classifier commit gate | Invent/recycle fail → retry once or strip/keep stitch. No new critic LLM. |
| E17 | `thumbs_down` CRAFT | `noteThumbsDownFeedback` from thumbs-down; boosts collage/atmosphere rules next turn. |
| E18 | Mid writer | Still OFF. |

## Files

- New: `src/game/openingPointerCard.ts`, `src/game/playtest31lOpeningAuthority.test.ts`
- Wired: `useGame`, `aiService`, `openingEstablishment`, `sceneFacts`, `situationPacket`, `campaignContract`, `narrativeScrub`, `masterPrompt` (client + edge), `fluidProseRails`, `combatAuthority`, `choiceCompiler`, `choicePipeline`, `mapEngine`, `craftBookCompiler`, `qualityGovernance`, `fateAutoplay`, `GmResponseFeedback`
- Edge: `openingPointerCard.ts` added to `sync-gm-edge-shared`

## Residuals

- Flash Lite can still ignore two CRAFT lines.
- Map L/R is graph-edge pads + facing when coordinates exist — thin if a floor plan has no `coordinates`.
- Free MiniMax Gateway throttle unchanged.
- Admin Feedback still unmounted.
- XP audit / registration-as-stage still Waiting.

## Honest ceiling

Same as the audit: one owner-close batch **4.5–6.5/10** readable play. Do not claim 8/10.

*Mid writer remains OFF. No commit/push from this batch unless John asks.*
