# SUMMARY 29q — settlement quest cards

Stamp `2026-09-29q1`.

## What shipped
- New `src/game/settlementQuestCards.ts`: 20-card library (4 per place type: harbour, forest, desert, city, farm). Each card has a template id, a one-line label, and plain `who` / `what` / `where` slots. The header lists the flavour lines a later writer pass should fill. No story prose, and no Summoned Pact / Cursed Keep / Salt Road names.
- Seeding: `seedWorldMapPlaces` now stamps two cards on each village, town, city or shore (harbour) place when it is created, then sets `questCardsSeeded`. Running it again adds nothing. Place type comes from the outline settlement's kind and biome, and every card also has to pass `questFitsSettlement`. `questFitsSettlement` gained `forest` and `desert` tags, so a desert card can't land on a coast and a fishing card can't land in a desert. Authored hub `linkedQuestIds` on the matching settlement count toward the two (`hubLinkedQuestCount`). New Game in both `useGame` and `fateAutoplay` passes the save seed and that count.
- Chips: `padChoicesToCount` adds one open card label for the place you're at. This is the shared pad for live play and autoplay. No chips appear during opening covers, dungeons or fights.
- Talk trigger: `openTalkQuestCard` runs only on quoted NPC lines in the committed prose. It does not use `QUEST_REVEAL_TRIGGERS`. A line needs a stake (missing person or animal, theft, debt, threat, or a dangerous or unpaid job) plus find / bring / stop / deliver. Greetings, weather and prices add nothing. It opens at most one library card per turn and picks the parameters from the line. Caps: one talk card per place while both seeded cards are still open, never a repeat template at a place, and at most 3 open talk-opened cards in the save. `completeSettlementQuestCard` marks a card done, which frees a slot. Wired into `useGame` (skipped on the authored book) and `fateAutoplay`.

## Gates
- tsc (`tsconfig.app.json`): 601 errors, the same set as before this change.
- vitest: 128 failed / 1909. No new failure names. `playtest29qSettlementQuestCards` has 8 tests, all passing.
- build: exit 0.
- No Supabase edge file touched, so no deploy.

## Notes
- "Open side cards" in the save-wide cap of three means talk-opened cards. Seeded cards are stamped on every settlement at New Game, so counting them too would stop the talk trigger from ever firing.
- Nothing calls `completeSettlementQuestCard` from play yet. The order didn't say what counts as finishing a card.

ALL DONE
