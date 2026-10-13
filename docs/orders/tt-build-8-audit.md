# tt-build 8 audit: every setting, button, tab, panel and system

Status is what I found before this step. Fix is what this step did, or `NEXT` with a reason.
Modes: T = tabletop (`dnd`), L = LitRPG, R = story RPG (`rpg`), P = PYOA, all = every mode.
"Reader" means the engine or the writer packet reads the value. The live writer prompt is `masterPrompt.buildMasterPrompt` (gm-turn `buildSystemPrompt`); the old `systemPrompt.buildSystemPrompt` is legacy and counts as no reader.

## Settings

| Item | Mode | Status | File | Fix |
|---|---|---|---|---|
| Tabletop house rules (`tt*`: rests, crits, flanking, encumbrance, HP method, …) | T | connected | `rules/houseRules.ts:withHouseRules` / `houseRulesOf` | none |
| Pillars, Session Zero lines/veils | T | connected (prompt) | `SessionZeroPanel.tsx`, `masterPrompt` | none; lines/veils stay prompt-only (see NEXT) |
| Kid Mode / content mode | all | connected | `maturity.ts`, `childSafe*` | none (out of scope) |
| Perspective, reading level, prefer full reply, fast setup chips | all | connected | `perspectiveWarden`, `completedEventPacket.readerFlags`, `useGame` | none |
| TTS voice, rate, autoplay | all | connected | `useVoice.ts` | none |
| Map trigger mode | all | connected | gm-turn prompt + `structuralEvents` map tags | none |
| Cosmetics (theme, dice skin, font, frame) | all | connected | `uiTheme.ts`, `DicePreview.tsx` | none |
| Romance subplots / harem | L R T | dead (only the legacy prompt read them) | `maturity.ts:formatMaturityRules` | ROMANCE line now in the live writer rules (off / player-steered + one or several interests) |
| Swearing / violence detail levels | all | partial (only on/off reached the writer; mild and none were lost) | `completedEventPacket.ts:readerFlags` / `formatReaderLine` | reader line has three levels: mild swearing; violence "none" = say who won and the cost, never the blow |
| Duplicate Swearing / Violence checkboxes in Content Mode | all | partial (two controls, one key) | `SettingsModal.tsx` | removed; points to Narrative & Tone |
| GM Strictness | T L R | partial (tabletop-only control; global setting and campaign value fought, TTS/menu saves overwrote it) | `useGame.ts:setCampaignStrictness`, `SettingsModal.tsx` | one source: the campaign value, set only by its own callback; shown in every mode but PYOA |
| Strict Encumbrance | T L R | partial (tabletop had two sources: house rule and toggle) | `rules/houseRules.ts:carryLimitOn`, `useGame`, `fateAutoplay` | tabletop reads its stamped Encumbrance rule; other modes read the toggle; label drops "& Ammo Tracking" (no ammo reader) |
| Auto Fight + combat pacing | T P | dead/wrong (button fought the round engine in tabletop; no fights in PYOA) | `rules/modeProfile.ts:autoFight`, `useGame.autoFight`, `CenterPanel`, `App`, `SettingsModal` | `modeProfile.autoFight` false for T and P; button, tip and pacing section hidden there |
| GM voice list | L R P T | dead after New Game (voice stamped on the save) | `gmVoiceProfile.ts:voiceIsStamped`, `SettingsModal` | list replaced by a note when the save has a stamped narrator |
| Stat Verbosity | all | partial (STATUS panel only; book view ignored it) | `systemLog.ts:statusLinesForVerbosity`, `CenterPanel`, `NarrativeView` | one filter for both views; core keeps HP / gold / item lines |
| Fog of war copy | all | partial (copy promised street fog) | `SettingsModal` | label says dungeon maps; options "Linked rooms" / "Your room only" |
| Inline panel frequency | classic | dead outside comic | `SettingsModal` | shown only in comic visual mode |
| Background opacity copy | all | partial (copy said default 60%, code 40%) | `SettingsModal` | "Default 40%" |
| Comic engine overlays | all | dead (no reader) | `SettingsModal` | hidden |
| Speech-to-text toggle | all | dead (no reader; stored false for everyone) | `SettingsModal` | removed; wiring it would hide the mic for every player |
| Test Lab tier label | staff | partial (hard-coded model names) | `SettingsModal` | reads `SUBSCRIPTION_TIERS[tier].writerOpenRouterId` |
| Mojibake in three labels | all | broken text | `SettingsModal` | fixed |
| `requireTurnConfirm`, `statDisplayMode`, `statFrequency`, `statScreensEnabled`, `dndMode`, `textSpeed`, `autoSaveInterval`, `video*`, `imageBaseUrl/EndpointType/Model`, `aiProvider`, `imageApiKey` | all | dead keys (no UI or no reader) | `types.ts`, `defaults.ts`, `gmProxy.ts`, legacy `systemPrompt.ts` | NEXT: removing them touches `types` (synced to edge), old-save loading and the legacy prompt; no player effect |
| Menu Settings engine mode | menu | partial (always shows LitRPG sections) | `App.tsx` (menu SettingsModal) | NEXT: no save is loaded on the menu; the right fix is a per-section "applies to" label |
| Premade strictness | all | partial (premade New Game always "standard") | `NewGameModal.beginPremade` | NEXT: product call on whether premades take the global default |

## Buttons, tabs and panels

| Item | Mode | Status | File | Fix |
|---|---|---|---|---|
| Phone drawers (World / Adventurer) | all | dead on phones (HUD got the toggles, never rendered them) | `Hud.tsx` | World and Adventurer buttons in the phone tray and below `lg` on desktop |
| HUD HP / MP fallbacks | all | fake (24/24 and NRG 12/12 when missing) | `Hud.tsx` | bars only with a character; second bar only when the sheet has MP or SP |
| HUD "Why?" | all | connected (`explainWhy`) | `Hud.tsx` | none (uses `window.alert`; cosmetic, NEXT) |
| Character → Sheet tab | all | fake outside tabletop (invented presets, dead Select, made-up weight and spellbook, stats default 10) | `CharacterSheetView.tsx` | tabletop: "Ready-made" (real pregens + saved sheets); other modes: "Status" from the save only |
| Character → Progress tab | all | fake (sample skill tree, sample loot, sample spell slots, mode toggle) | `CharacterProgression.tsx` | follows the save's mode; tabletop: real slots, attunement, class; others: real attributes, skills, level/XP |
| Character → Combat tab | L R | fake (mock initiative tracker, viewport with no handlers) | `CombatEncounter.tsx` | removed (fights live on the play screen) |
| Character → Spells / Professions / Pets | all | dead (always empty) | `CharacterWindow.tsx` | removed |
| Character → Portrait (upload scan) | L R | fake (fake scan, no import) | `UploadImport.tsx` | removed |
| Mock data module | all | fake | `src/data/mockGameData.ts` | deleted (no other reader) |
| Scene image close (X) | all | dead (no-op) | `CenterPanel.tsx` | hides that picture |
| Busy "rolling" die | T | partial (random die type while the engine rolls a d20) | `CenterPanel.tsx` | always the d20 (animation only) |
| Formula builder Advantage | T | wrong (2 dice multiplied by count; crit read the discarded die) | `qol/DiceFormulaBuilder.tsx` | SRD: two d20s on one d20 Test, keep one; crit/fumble from the kept die |
| Dice tray Success / Failure | all | wrong (invented a DC of 10 / 70%) | `qol/DiceTrayToolbar.tsx:computeOutcome` | no verdict without a DC; only natural 20 / 1 on the kept die; +1/+2 apply with Adv/Dis |
| Adventurer panel stats | all | fake ("SP undefined", NaN bars) | `RightDrawer.tsx` | MP / SP only when the sheet has them |
| Adventurer panel equipped list | all | partial (no Shoulders slot) | `RightDrawer.tsx` | Shoulders added (the slot `wornGear` already knows) |
| Materials bar | L R | fake (fixed 15% with a magical container) | `RightDrawer.tsx:MaterialsTab` | bar hidden when materials stack without limit |
| Codex editor | all | partial (type and keywords had no inputs; Delete never shown) | `RightDrawer.tsx:LoreCardEditor` | type select, keyword input, Delete button |
| GM Library → Map Templates | menu | dead (no caller passed `onSelectMap`) | `GMLibrary.tsx` | tab and templates removed |
| GM Library → Locations | menu | dead (always empty) | `GMLibrary.tsx:bibleToInfoCards` | one card per bible starting place |
| GM Library search / keys | menu | partial (tags not lower-cased; carousel and tag keys could collide) | `GMLibrary.tsx` | fixed |
| Quest log counts | all | connected (counts revealed quests only) | `QuestLogModal.tsx` | none |
| Shop → Illustrated packs | all | unfinished ("Coming soon", no product) | `CapacityPackShop.tsx` | section hidden |
| Error box "API Settings" | all | wrong (opened the Kid / Adult picker) | `EngineOverlay.tsx`, `App.tsx` | "Settings", opens Settings; dead forced-picker state removed |
| Error box rate-limit branch | all | dead (modal is never shown for rate-limit) | `EngineOverlay.tsx` | NEXT: harmless; rate-limit has its own path |
| Resume main | all | connected (empty `if` left over) | `App.tsx` | cleaned up |
| Left drawer `engineMode` prop | all | dead prop | `LeftDrawer.tsx` | removed |
| Dungeon map fallback | all | unfinished (hard-coded fallback grid) | `DungeonMapModal.tsx` | NEXT: also an open playtest note (no underground builder in the fallback) |

## Systems and data

| Item | Mode | Status | File | Fix |
|---|---|---|---|---|
| `characters` table run snapshot | all | partial (upserted on user + hero name: two campaigns with one hero name overwrote each other; never read in game) | `cloudSync.ts:syncGameToCloud` | keyed by save (`run:<saveId>`, like `sheet:` rows); deleted with its save; staff still read it |
| `characters` `sheet:` rows | T | connected (library sync) | `cloudSync.ts` | none |
| `tactical-litrpg-local-updated` localStorage | all | dead (written every save, never read) | `useGame.ts` | removed |
| `user_gemini_api_key` localStorage | all | dead (read, never written; prop unused) | `App.tsx`, `SetupScreen.tsx` | removed |
| Shop "Buy (soon)" | all | unfinished (grants packs with no payment) | `CapacityPackShop.tsx`, `subscriptionTiers.shopLive` | NEXT: payments are a product and Stripe-secrets job |
| Rewarded ads | all | unfinished (stub grants turns, no ad) | `game/rewardedAds.ts` | NEXT: needs an ad provider |
| `stripeCheckout` / `create-checkout` | all | dead (unreachable) | `game/stripeCheckout.ts`, edge fn | NEXT: same payments job |
| `package_receipts` table | all | dead | Supabase | NEXT: same payments job |
| `situationPacket.ts` (SNAPSHOT, recoveryMandate, progressGovernor, pressureClock, powerScaling) | all | dead (orphaned; never reaches the writer) | `situationPacket.ts` | NEXT: wiring it changes the writer packet; needs its own step and writer-quality gate |
| Dead modules: `pyoaEndingGates`, `socialStakes`, `folkVoiceExpectations`, `leverageMechanics`, `encounterStakes`, `fullProseGate`, `speechActRails`, `claimGrounding` (+ ~250 dead exports) | all | dead | `src/game/*` | NEXT: deletion sweep; several are synced to edge and named in old tests |
| `pyoaDelayedConsequences` placeholders | P | unfinished | `pyoaDelayedConsequences.ts` | NEXT: PYOA is out of scope for testing |
| `game_sessions` table | all | partial (written; no migration in repo) | `cloudSync.ts` | NEXT: add the migration from the live schema |
| Support email in legal docs | all | unfinished (TODO) | `legal/legalDocs.ts` | NEXT: John to confirm the address |
| LitRPG bounty "stub pay" | L | unfinished | `tagTrigger.ts` | NEXT: needs a reward rule |
| `oracleLog` (no UI), `campaignDivergences`, `replayHashes` (never read) | all | dead data | `types.ts`, `useGame.ts` | NEXT: decide keep (debug) or drop with a save repair |
| qualityGovernance fields `turnsSinceLastEncounter`, `recentXpAwards`, `lastHubLocation`, `craftSignals` | all | written, not read | `qualityGovernance.ts` | NEXT: part of the dead-module sweep |
| Dice sound pack | all | unfinished (`sgm:dice-roll` has no listener) | `rules/rollView.ts:emitDiceRoll` | NEXT: needs audio assets |
| `evalHarness` stubs | dev | unfinished | `evalHarness.ts` | NEXT: dev-only |
