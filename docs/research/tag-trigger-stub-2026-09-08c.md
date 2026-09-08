# Tag & Trigger stub (2026-09-08c)

**Status:** Thin live pattern for Free MUD-modern (Option 2). Not a full bible matrix.

## Shipped

| Piece | Behavior |
|---|---|
| Tag write | Summoned Pact combat clear → `sceneFacts.worldTags` += `sgm.sp.skirmishClearBounty` |
| Trigger pad | At Lowmarket (or other SP outdoor hub) with tag → pad `Claim Lowmarket bounty` (or Ask about the bounty board) |
| Consume | Picking the claim pad drops the tag + STATUS `BOUNTY: claimed…` |

Code: `src/game/tagTrigger.ts` · wired via `choiceCompiler` + Free/Fate commit.

## Stub / later

- Full JSON matrices: tag × hub × pad × reward for every premade
- Real gold / faction standing / quest stage pay
- Multi-step bounty FSM
- Admin UI for worldTags

Keep inventing pads in Free writer OFF — only code/compiler pads.
