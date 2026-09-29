# SUMMARY 29s

Stamp `2026-09-29s1` (HUD, BUILD, `index.html`, `public/version.json`, stamp tests).

## Town quests

- Picking a card's chip now only stamps `takenTurn` on the card (`takeSettlementQuestCard`). The card stays open and pays nothing.
- `finishSettlementQuestCard` refuses a card whose chip was never picked.
- New `settlementCardResolvedBy` finds the taken card whose stake this turn resolves, at its own place. All of these must hold:
  - the chip was picked on an earlier turn;
  - this line is not the chip label again, and not a look-around;
  - the line carries find / bring / stop / deliver, or a verb for the card's own stake (for example return for missing, recover for theft, mend / clear / cut for a job, drive off / seal for a threat, collect for a debt);
  - the turn's code check did not fail (`checkSucceeded`, from `runPlayerCheck` in `useGame`; headless Fate runs no check, so it passes nothing and only the other rules apply).
- Finishing pays once through the existing `milestoneXp` path and one grade-1 item, under award key `settlement-card:<id>`. A second finish pays nothing.

## Respect

- `applyWitnessedDeed` in `npcRelationships.ts` routes every shift through `applyRelationshipEvent`. Results go on the NPC's stored record in `arcDirector.npcRelationships`, keyed by name, so they follow the NPC to other places. There is no town-wide number.
- When a town quest finishes, each NPC present gets respect +3, trust +2, familiarity +1 (scene presence plus present memories, minus the live foe). An NPC who already saw one of the player's good deeds gets respect +1, trust +1 instead. No `favor_granted` milestone is added, so one deed cannot reach friendly.
- Witnessed harm gives trust -2 and fear +1, so one bad deed cannot reach hostile. Harm means a hard act (`detectStanceTreatment`) at a settlement place that either attacks a present local by name (`parsePlayerIntent` returns attack) or steals / robs.
- Each deed applies once per NPC (`witnessedDeeds`). NPCs who were not present do not change. The writer sets no numbers.
- Callers: `useGame` merges the result into `arcDirector` at commit, and `fateAutoplay` merges it into `arcState.arcDirector`.

## Tests

- tsc (`tsconfig.app.json`): 601, the same set. After stripping line numbers and the two new optional fields from the printed types, the only difference is one message where TypeScript shortens a type differently.
- Vitest: 1928 tests, 128 failed. Every failure name was already failing in the baseline, so there are no new failure names.
- New `playtest29sTownDeeds` passes all 8 tests. It checks that:
  - picking the chip does not finish or pay;
  - a repeat, a failed check, a look, or the same turn does not finish the card;
  - resolving the stake pays once;
  - an NPC present for the help keeps the higher respect at a different place;
  - a later witnessed deed adds the smaller bump;
  - one deed is not friendly;
  - one harm is not hostile.
- `playtest29rPlaceTemplatesXp` was updated to the new rule: its helper takes the card first, and the chip test now expects no payment.
- Build exit 0.
- No edge file changed, so no gm-turn deploy.

ALL DONE
