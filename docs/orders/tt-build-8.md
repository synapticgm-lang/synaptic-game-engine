# tt-build 8 — whole-app audit

Ship: commit `16d41921` on `main`, pushed. `gm-turn` deployed (three edge files changed). https://www.synapticgm.com/version.json showed `{"hud":"2026-10-13z","build":"2026-10-13z"}` at 22:36, about 80 seconds after the push.

Full table: `docs/orders/tt-build-8-audit.md`. It covers about 80 items in three groups: settings, buttons/tabs/panels, and systems/data.

## What landed (file:function)

### Settings (shared engine + mode presenter)
- `rules/houseRules.ts:carryLimitOn` decides whether the carry limit applies. Tabletop reads its stamped Encumbrance house rule. LitRPG and RPG read the Strict Encumbrance toggle. `useGame` and `fateAutoplay` both call it.
- `rules/modeProfile.ts:autoFight` is false for tabletop (the round engine owns fights) and for PYOA (no fights). `useGame.autoFight`, `CenterPanel`, `App` and `SettingsModal` read it.
- `completedEventPacket.ts:readerFlags` / `formatReaderLine` give the writer three levels:
  - swearing: off / mild / full;
  - violence: none / mild / full. "None" means the writer says who won and the cost, never the blow.
  Before this, only on/off reached the writer.
- `maturity.ts:formatMaturityRules` adds a ROMANCE line to the live writer rules. Romance is off, or player-steered with one or several interests. Before this, only the legacy prompt read it.
- `gmVoiceProfile.ts:voiceIsStamped`: when the save has a stamped narrator, Settings shows a note instead of a voice list that did nothing.
- `systemLog.ts:statusLinesForVerbosity` is one filter for the STATUS panel (`CenterPanel`) and the book view (`NarrativeView`). The core level keeps HP, gold and item lines.
- `useGame.ts:setCampaignStrictness` makes the campaign value the single source for GM Strictness. TTS and menu saves no longer overwrite it.
- `SettingsModal.tsx` copy and controls:
  - the duplicate swearing/violence boxes are removed;
  - the Fog of War labels now match dungeon maps;
  - the background opacity copy now says 40%;
  - comic-only and unwired controls are hidden, and the speech-to-text toggle is removed;
  - the Test Lab tier reads `SUBSCRIPTION_TIERS`;
  - mojibake is fixed.
- `CampaignSettings.tsx`: the Strictness and Encumbrance labels now match what the engine reads.

### Buttons, tabs, panels (presenter)
- `Hud.tsx`:
  - World and Adventurer drawer buttons on phones; the toggles existed but were never shown.
  - HP and MP bars only when a character exists, with no 24/24 or 12/12 fallbacks.
  - Stamp `2026-10-13z`.
- `CharacterSheetView.tsx`: tabletop shows Ready-made (real pregens and saved sheets). Other modes show Status from the save only.
- `CharacterProgression.tsx` follows the save's mode:
  - tabletop shows real slots, attunement and class;
  - other modes show real attributes, skills and level/XP.
- `CharacterWindow.tsx`: the mock Combat, Spells, Professions, Pets and Portrait-scan tabs are removed.
- Deleted `CombatEncounter.tsx`, `UploadImport.tsx` and `data/mockGameData.ts`.
- `CenterPanel.tsx`: the scene-image X now hides the picture. The busy die is always a d20.
- `qol/DiceFormulaBuilder.tsx`: advantage follows SRD 5.2.1. It rolls two d20s on one d20 Test, keeps one, and reads crit/fumble from the kept die.
- `qol/DiceTrayToolbar.tsx:computeOutcome`:
  - no invented DC;
  - only natural 20 or natural 1 on the kept die gives a verdict;
  - +1/+2 apply after advantage or disadvantage.
- `RightDrawer.tsx`:
  - MP and SP show only when the sheet has them;
  - Shoulders slot added;
  - the materials bar is hidden when a container holds them without limit;
  - the Codex editor has a Type select, a Keywords input and a Delete button.
- `GMLibrary.tsx`:
  - the dead Map Templates tab is removed;
  - Locations shows each bible's starting place;
  - tag search is lowercased and keys are unique.
- `CapacityPackShop.tsx`: the "Coming soon" illustrated packs section is hidden.
- `EngineOverlay.tsx` + `App.tsx`: the error box button is now "Settings" and opens Settings. Before this, it opened the Kid/Adult picker. The dead forced-picker state is removed.
- `LeftDrawer.tsx`, `SetupScreen.tsx`: dead props removed.

### Data
- `cloudSync.ts:runRowName`: each save gets its own `characters` run row, named `run:<saveId>`, which is deleted with its save. Before this, two campaigns with the same hero name overwrote each other's row.
- `useGame.ts`: the `tactical-litrpg-local-updated` key was written and never read; it is removed. `App.tsx`: the `user_gemini_api_key` key was read and never written; it is removed.

### Edge
- Synced `supabase/functions/_shared/gm/completedEventPacket.ts`, `gmVoiceProfile.ts` and `maturity.ts` (`sync-gm-edge-shared --check` matches). `gm-turn` deployed.

## What the player sees
- On a phone, the HUD has World and Adventurer buttons, so both side panels open.
- The sheet and Progress tabs show only what is in the save. There are no sample skill trees, sample loot or made-up stats. Tabletop players get the real ready-made characters.
- The mock tabs (Combat, Spells, Professions, Pets, Portrait scan) are gone.
- Tabletop has no Auto Fight button, and the Strict Encumbrance toggle follows the tabletop Encumbrance house rule.
- These settings now change what the story writes:
  - mild swearing;
  - violence set to none;
  - romance on or off.
- The Stat Verbosity setting now affects the book view too.
- The dice tray no longer invents Success or Failure. Advantage keeps one of two d20s.
- The X on a scene picture closes it. The error box's Settings button opens Settings.
- The Codex can set a card's type and keywords and can delete a card.
- Two campaigns with the same hero name no longer overwrite each other in the cloud.

## Tests
- New `src/__tests__/replayBank/tt8.bank.ts`: 8 cases built from real tapes (cursed-keep s151 tabletop, summoned-pact s151 LitRPG). It covers:
  - the carry limit in tabletop and in LitRPG;
  - Auto Fight per mode;
  - the reader line;
  - the romance line;
  - the stat verbosity filter;
  - the stamped voice;
  - the run row name.
  All 8 pass.
- Whole replay bank: 97 files, 519 passed, 28 skipped. No LitRPG or RPG case broke.
- writer-quality: the same 12 known failures (s78–s84), none new.
- vitest: 76 failing, the same as the baseline (76–77), none new. playtest30iFogOfWar and seed94InfestationClear fail only in the parallel run and pass alone. The stamp tests are updated to `2026-10-13z`.
- tsc (`-p tsconfig.app.json`): 568, down from 572 (limit 601).
- Build: green.
- OpenRouter spend: 0 USD.

## Smoke
Not run (NO TEST LAPS): no autoplay, multi, mode-order lap or 6-run test.

## NEXT
- **Payments:** Shop "Buy (soon)", `stripeCheckout` / `create-checkout`, and `package_receipts`. These need a product decision and the live Stripe secrets.
- **Rewarded ads:** the stub grants turns without showing an ad. It needs an ad provider.
- **`situationPacket.ts`:** orphaned, so it never reaches the writer. Wiring it changes the writer packet, so it needs its own step with a writer-quality gate.
- **Dead-module sweep:** `pyoaEndingGates`, `socialStakes`, `folkVoiceExpectations`, `leverageMechanics`, `encounterStakes`, `fullProseGate`, `speechActRails`, `claimGrounding`, about 250 dead exports, and the qualityGovernance fields that are written but never read. Several are synced to edge and named in old tests.
- **Dead settings keys:** `requireTurnConfirm`, `stat*`, `dndMode`, `textSpeed`, `video*`, `image*`, `aiProvider`, and others. Removing them touches `types` (synced to edge), old-save loading and the legacy prompt. No player effect.
- **Dead save data:** `oracleLog`, `campaignDivergences`, `replayHashes`. Decide whether to keep them for debugging or drop them with a save repair.
- **Settings opened from the menu:** shows LitRPG sections because no save is loaded. It needs an "applies to" label per section.
- **Premade strictness:** premade games always start as "standard". This is a product call.
- **Dungeon map fallback:** the fallback grid is hard-coded. This is also an open playtest note (no underground builder).
- **`game_sessions` table:** has no migration in the repo. Add one from the live schema.
- **Legal docs:** the support email is a TODO. John needs to confirm the address.
- **LitRPG bounty "stub pay":** needs a reward rule.
- **Dice sound pack:** needs audio assets.
- **`pyoaDelayedConsequences` placeholders:** PYOA is out of scope.
- **`evalHarness` stubs:** dev-only.
- **Error box rate-limit branch:** dead but harmless. HUD "Why?" uses `window.alert`, which is cosmetic.

TT_DONE
