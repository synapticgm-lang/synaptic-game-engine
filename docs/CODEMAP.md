# Code map

Generated 2026-09-28T15:30:08.077Z · commit `f007ad0` · stamp `2026-09-28j`
724 files · 212413 lines · 8378264 bytes. Regenerate: `npm run codemap`.

## src/App.tsx
28860 B · 702 lines
- exports: App
- functions: App:42

## src/__tests__/flashLiteInputSanitization.test.ts
12540 B · 392 lines
- functions: mockGameState:18

## src/components/ApiSetupModal.tsx
3465 B · 83 lines
- exports: ApiSetupModal
- functions: ApiSetupModal:17

## src/components/AutoFightTipModal.tsx
4124 B · 106 lines
- exports: isAutoFightTipDismissed, setAutoFightTipDismissed, AutoFightTipModal
- functions: isAutoFightTipDismissed:6, setAutoFightTipDismissed:14, AutoFightTipModal:33

## src/components/AutoFightWarningModal.tsx
3543 B · 91 lines
- exports: isAutoFightWarningDismissed, setAutoFightWarningDismissed, AutoFightWarningModal
- functions: isAutoFightWarningDismissed:7, setAutoFightWarningDismissed:18, AutoFightWarningModal:30

## src/components/AutoSaveIndicator.tsx
1186 B · 30 lines
- exports: AutoSaveIndicatorProps, AutoSaveIndicator
- functions: AutoSaveIndicator:7

## src/components/BeautyMomentOffer.tsx
1742 B · 52 lines
- exports: BeautyMomentOfferLink
- functions: BeautyMomentOfferLink:14

## src/components/BootScreens.tsx
11918 B · 248 lines
- exports: AuthToast, WelcomeSplash, BootSplash, AuthOverlay, FounderEmailSignIn
- functions: WelcomeSplash:11, BootSplash:73, AuthOverlay:105, FounderEmailSignIn:164, GoogleG:238

## src/components/BubbleSpeakControl.tsx
1551 B · 53 lines
- exports: BubbleSpeakControl
- functions: BubbleSpeakControl:18

## src/components/CampaignSettings.tsx
8903 B · 252 lines
- exports: CampaignSettings
- functions: CampaignSettings:14, PillarsSection:47, PillarSlider:115, HouseRulesSection:166, HouseRuleToggle:209, ToggleSwitch:240

## src/components/CapacityPackShop.tsx
17579 B · 446 lines
- exports: CapacityPackShop
- functions: packBalances:24, CapacityPackShop:32, CapacityPackCard:243, PackArtFace:303, PackGlyph:341

## src/components/CenterPanel.tsx
35919 B · 799 lines
- exports: CenterPanel
- functions: readBoolPref:38, writeBoolPref:48, readClearedForSave:56, writeClearedForSave:64, CenterPanel:122, LogRow:588, TurnAskLine:721, RepairBanner:727, SystemLogPanel:774

## src/components/CharacterProgression.tsx
11716 B · 280 lines
- exports: CharacterProgression
- functions: CharacterProgression:23, DndMode:54, LitRpgMode:154, SkillNodeCard:241, LootCard:263

## src/components/CharacterSheetView.tsx
17078 B · 396 lines
- exports: CharacterSheetView
- functions: MODIFIER:27, FMT_MOD:28, CharacterSheetView:30, LayoutToggle:45, DndDashboard:72, LitRpgStatus:160, HoloBar:248, MiniStat:276, buildCards:296, PreMadeCards:317

## src/components/CharacterWindow.tsx
29452 B · 645 lines
- exports: CharacterWindow
- functions: LegsIcon:29, getEquippedItem:70, StatBar:74, EquipSlot:92, ItemInspectCard:135, AttributeGrid:186, SidePanel:210, EmptyTabContent:265, StoryPlatesTab:271, DndSheet:297, InventoryPanel:341, PaperDoll:423, CharacterWindow:471

## src/components/CombatEncounter.tsx
15254 B · 342 lines
- exports: CombatEncounter
- functions: CombatEncounter:32, DungeonViewport:166, InitiativeCard:264

## src/components/CreditsPage.tsx
4098 B · 91 lines
- exports: CreditsPage
- functions: CreditsPage:6

## src/components/CustomTabletopRulesField.tsx
3811 B · 104 lines
- exports: CustomTabletopRulesField
- functions: CustomTabletopRulesField:16

## src/components/DebugModal.tsx
12922 B · 308 lines
- exports: DebugModal
- functions: DebugModal:15, LogRow:274

## src/components/DicePreview.tsx
18908 B · 493 lines
- exports: DieSides, liveDiceItem, DicePreview
- functions: liveDiceItem:28, hexToRgb:98, rgbToHex:104, mix:109, shade:115, paletteFor:162, MaterialFill:173, DicePreview:372

## src/components/DungeonMapModal.tsx
32993 B · 787 lines
- exports: DungeonMapModal
- functions: YouAreHereMarker:43, MapCompass:58, DungeonMapModal:72, InteriorFloorPlan:329, streetPx:629, pathBetween:636, StreetMapCanvas:647

## src/components/EnemyTargetFrame.tsx
1521 B · 36 lines
- exports: EnemyTargetFrame
- functions: EnemyTargetFrame:8

## src/components/EngineOverlay.tsx
10379 B · 221 lines
- exports: LoadingOverlay, ErrorModal
- functions: accentRgb:22, LoadingOverlay:44, ErrorModal:116

## src/components/ErrorBoundary.tsx
2072 B · 55 lines
- exports: ErrorBoundary

## src/components/ExpertCustomPanel.tsx
18334 B · 468 lines
- exports: ExpertCustomPanel
- functions: SectionHeader:17, ExpertCustomPanel:59

## src/components/FeedbackPanel.tsx
3764 B · 109 lines
- exports: FeedbackPanel
- functions: FeedbackPanel:24

## src/components/FormattedText.tsx
8230 B · 230 lines
- exports: FormattedText
- functions: FormattedText:12, parseBlocks:28, renderRarityTags:90, InlineTextWithBadges:102, LoreBadge:140, escapeRegex:178, ProseBlock:182, CodeBlock:203, RollBlock:211, PromptBlock:222

## src/components/GMLibrary.tsx
26626 B · 716 lines
- exports: GMLibrary
- functions: bibleToStarter:144, bibleToInfoCards:161, GMLibrary:254, TabButton:385, CampaignCarousel:402, MapGallery:516, InfoViewer:568

## src/components/GmResponseFeedback.tsx
7872 B · 237 lines
- exports: GmResponseFeedback
- functions: GmResponseFeedback:26

## src/components/Hud.tsx
14144 B · 278 lines
- exports: HUD_BUILD_STAMP, Hud
- functions: Hud:35

## src/components/LeftDrawer.tsx
9606 B · 218 lines
- exports: LeftDrawer
- functions: LeftDrawer:14, WorldSection:38, SquadSection:113, QuestsSection:136, ShrinesSection:198

## src/components/LegalLinks.tsx
990 B · 29 lines
- exports: LegalLinks
- functions: LegalLinks:5

## src/components/LegalPage.tsx
3325 B · 89 lines
- exports: LegalPage
- functions: LegalPage:10

## src/components/LitrpgSystemWindow.tsx
1581 B · 31 lines
- exports: LitrpgSystemWindowPanel
- functions: LitrpgSystemWindowPanel:5

## src/components/MainMenu.tsx
47042 B · 1391 lines
- exports: MainMenu
- functions: MainMenu:62, PlayTab:179, jumpToSection:261, useSectionSpy:265, HubJumpNav:289, ThemesTab:321, ThemePreviewBar:545, ShopTab:621, SetStatusPill:810, FeaturedSetBanner:848, ShopCard:899, storyFontFamily:971, FontDescriptionBox:975, ThemeChip:988, FrameChip:1010, VoiceFlavour:1021, HearButton:1032, CustomizeSlot:1045, SetCard:1074, Section:1263, SelectCard:1285, BackgroundFx:1343, MenuButton:1359

## src/components/MerchantWindow.tsx
12845 B · 239 lines
- exports: MerchantWindow
- functions: MerchantWindow:19

## src/components/NarrativeView.tsx
26492 B · 584 lines
- exports: NarrativeView
- functions: extractActions:61, NarrativeView:89, NarrativeEntry:149, DmNarration:194, PlayerBubble:317, NpcDialogue:350, ThoughtBlock:379, SystemMessage:395, InlineSystemTag:427, ActionStream:444, parseSegments:536, splitRegistrarHeaders:562

## src/components/NewGameModal.tsx
56291 B · 1162 lines
- exports: NewGameModal
- functions: NewGameModal:115

## src/components/OpenRouterModelPicker.tsx
7001 B · 194 lines
- exports: OpenRouterModelPicker
- functions: OpenRouterModelPicker:18

## src/components/OutOfMemorableAdOffer.tsx
3016 B · 77 lines
- exports: OutOfMemorableAdOffer
- functions: OutOfMemorableAdOffer:17

## src/components/OutOfTurnsAdOffer.tsx
3545 B · 97 lines
- exports: OutOfTurnsAdOffer
- functions: OutOfTurnsAdOffer:20

## src/components/ParentPurchaseGate.tsx
4284 B · 134 lines
- exports: ParentPurchaseGate, requestParentPurchaseApproval
- functions: ParentPurchaseGate:23, requestParentPurchaseApproval:118

## src/components/PlayerProfilePanel.tsx
7020 B · 166 lines
- exports: PlayerProfilePanel
- functions: formatWhen:13, PlayerProfilePanel:22

## src/components/QuestFailModal.tsx
2010 B · 54 lines
- exports: QuestFailModal
- functions: QuestFailModal:9

## src/components/QuestLogModal.tsx
9555 B · 224 lines
- exports: QuestLogModal
- functions: isKnownQuest:12, QuestLogModal:16

## src/components/QuestUnlockModal.tsx
2494 B · 68 lines
- exports: QuestUnlockModal
- functions: QuestUnlockModal:9

## src/components/RightDrawer.tsx
22137 B · 443 lines
- exports: RightDrawer
- functions: RightDrawer:19, ItemCard:221, CapacityBar:243, MaterialsTab:268, CodexTab:313, LoreCardEditor:396

## src/components/SettingsModal.tsx
86973 B · 1653 lines
- exports: SettingsModal
- functions: SettingsModal:79, mergeSaveSlots:1282, SaveSlotsManager:1300, Section:1443, ChoiceCard:1456, PinDialog:1468, KeyStatusBadge:1529, TtsVoicePicker:1536, ToggleRow:1593, BackgroundsSection:1608

## src/components/SetupScreen.tsx
5880 B · 144 lines
- exports: SetupScreen
- functions: SetupScreen:19, ProfileCard:104, BackgroundFx:136

## src/components/SupportAccountPanel.tsx
5981 B · 162 lines
- exports: SupportAccountPanel
- functions: SupportAccountPanel:17

## src/components/ToastStack.tsx
1806 B · 53 lines
- exports: Toast, ToastStack
- functions: ToastStack:15, ToastItem:25

## src/components/UploadImport.tsx
10491 B · 266 lines
- exports: UploadImport
- functions: UploadImport:12, IdleState:152, ScanningState:190, CompleteState:233, CornerBrackets:255

## src/components/WelcomeModal.tsx
3199 B · 68 lines
- exports: WelcomeModal
- functions: WelcomeModal:10, GoogleG:58

## src/components/admin/GmFeedbackReview.tsx
10369 B · 291 lines
- exports: GmFeedbackReview
- functions: GmFeedbackReview:22, FeedbackCard:169

## src/components/comic/ActionOverlay.tsx
1307 B · 50 lines
- exports: ActionEffect, ActionOverlay, DiceRollOverlay
- functions: ActionOverlay:11, DiceRollOverlay:40

## src/components/comic/ComicGrid.tsx
37306 B · 1048 lines
- exports: ComicGrid
- functions: ComicGrid:34, normalizeImages:213, getPanelGridPlacement:218, resolvePanelStatus:238, LogEntryRenderer:244, PanelImageSlot:415, PanelPlaceholder:497, TextPanel:548, MilestonePanel:578, LootVideoPanel:619, OverlayChip:683, defaultChipNormPos:736, applySegmentEdit:754, EditableOverlayChip:759, ComicPanelCell:893

## src/components/comic/MemorablePlateChrome.tsx
4011 B · 122 lines
- exports: MemorablePlateStatus, MemorablePlateChromeProps, MemorablePlateChrome
- functions: MemorablePlateChrome:29

## src/components/comic/NarrativeText.tsx
5617 B · 139 lines
- exports: NarrativeSegment, parseNarrativeSegments, NarrativeSegmentBlock, NarrativeText
- functions: splitSpeaker:20, parseNarrativeSegments:27, splitRegistrarHeaders:59, NarrativeSegmentBlock:87, NarrativeText:121

## src/components/comic/SpeechBubble.tsx
4722 B · 135 lines
- exports: SpeechBubbleData, SpeechBubble
- functions: SpeechBubble:29

## src/components/comic/useZoomGesture.ts
4094 B · 95 lines
- exports: useZoomGesture
- functions: clampScale:8, useZoomGesture:26

## src/components/playerFacingCopy.test.ts
1212 B · 35 lines

## src/components/qol/ActionBar.tsx
2462 B · 53 lines
- exports: ActionBar
- functions: ActionBar:16

## src/components/qol/DiceFormulaBuilder.tsx
18192 B · 424 lines
- exports: DiceFormulaBuilder, RollResult
- functions: dieShape:48, rollDie:59, uid:63, DiceFormulaBuilder:75, ResultPanel:341

## src/components/qol/DiceTrayToolbar.tsx
13329 B · 315 lines
- exports: DiceTrayToolbar
- functions: rollDie:46, computeOutcome:50, activeDiceMaterial:69, excitedFxClass:77, DiceTrayToolbar:82

## src/components/qol/EpitaphBar.tsx
1331 B · 41 lines
- exports: EpitaphBar
- functions: EpitaphBar:9

## src/components/qol/LooseItemsBar.tsx
1195 B · 36 lines
- exports: LooseItemsBar
- functions: LooseItemsBar:11

## src/components/qol/RewindBar.tsx
697 B · 23 lines
- exports: RewindBar
- functions: RewindBar:9

## src/components/qol/TurnConfirmBar.tsx
4059 B · 121 lines
- exports: TurnConfirmBar
- functions: TurnConfirmBar:17

## src/config/comicStyles.ts
986 B · 29 lines
- exports: ComicStyle, COMIC_STYLES

## src/data/campaigns/crimsonNocturne.ts
10675 B · 189 lines
- exports: crimsonNocturne

## src/data/campaigns/cursedKeep.ts
25979 B · 311 lines
- exports: cursedKeep

## src/data/campaigns/dungeonTransport.ts
21435 B · 277 lines
- exports: dungeonTransport

## src/data/campaigns/erebusNine.ts
10315 B · 187 lines
- exports: erebusNine

## src/data/campaigns/fabledLegacy.ts
23147 B · 279 lines
- exports: fabledLegacy

## src/data/campaigns/giltwoodEstate.ts
14190 B · 276 lines
- exports: giltwoodEstate

## src/data/campaigns/heroAwakening.ts
21565 B · 412 lines
- exports: heroAwakening

## src/data/campaigns/index.ts
6353 B · 235 lines
- exports: ALL_CAMPAIGN_BIBLES, getCampaignBibleById, getCampaignBlurb, formatCampaignStoryName, isNsfwCampaign, isKidRestrictedCampaign, campaignAgeChip, filterBiblesForContentMode, getCampaignBiblesByEngineMode, listCampaignCatalog, CampaignBible, LoreSnippet, KeyNPC, StarterQuest, StarterItem, Difficulty, OpeningPrompt, OpeningHookCard, MysteryCulprit, systemIntegration, voidAudience, dungeonTransport, fabledLegacy, shatteredCoast, cursedKeep, summonedPact, heroAwakening, thornferryRoad, vesperGlassCipher, erebusNine, roseGoldUltimatum, giltwoodEstate, nullParameterProtocol, resinSonata, umbraProtocol, crimsonNocturne, onyxBloodCovenant, ascendingSpire, inkboundAcademy, hollowCore, millstoneRoad, brokenCrownKeep, verdantBlight, stillrootVeil, gatebreakWard, blankCanvas, blankCanvasDnd, saltRoadHeist, glassHarborLetters, embercourtOath, rainglassCase, staticHouse, driftwakeCrew, ashlineConvoy, twinLanterns, redmesaClaim, capeDistrictVigil, wayfarersMap, hearthwickTeas, blankCanvasRpg
- functions: getCampaignBibleById:142, getCampaignBlurb:147, formatCampaignStoryName:155, isNsfwCampaign:165, isKidRestrictedCampaign:170, campaignAgeChip:178, filterBiblesForContentMode:190, getCampaignBiblesByEngineMode:204, listCampaignCatalog:220

## src/data/campaigns/makeBible.ts
2597 B · 79 lines
- exports: makeBible
- functions: makeBible:6

## src/data/campaigns/manusHonestRoster.ts
9270 B · 88 lines
- exports: MANUS_SP_NPCS, MANUS_SP_QUESTS, MANUS_CK_NPCS, MANUS_CK_QUESTS, MANUS_TF_NPCS, MANUS_TF_QUESTS, MANUS_SR_NPCS, MANUS_SR_QUESTS, MANUS_SC_NPCS, MANUS_SC_QUESTS, withManusHonestRoster
- functions: withManusHonestRoster:74

## src/data/campaigns/nullParameterProtocol.ts
10665 B · 190 lines
- exports: nullParameterProtocol

## src/data/campaigns/onyxBloodCovenant.ts
11675 B · 195 lines
- exports: onyxBloodCovenant

## src/data/campaigns/openingHookDecks.ts
61201 B · 1121 lines
- exports: OPENING_HOOK_DECKS

## src/data/campaigns/premades.ts
49627 B · 1270 lines
- exports: ascendingSpire, inkboundAcademy, hollowCore, millstoneRoad, brokenCrownKeep, verdantBlight, stillrootVeil, gatebreakWard, blankCanvas, blankCanvasDnd, saltRoadHeist, glassHarborLetters, embercourtOath, rainglassCase, staticHouse, driftwakeCrew, ashlineConvoy, twinLanterns, redmesaClaim, capeDistrictVigil, wayfarersMap, hearthwickTeas, blankCanvasRpg

## src/data/campaigns/resinSonata.ts
10902 B · 189 lines
- exports: resinSonata

## src/data/campaigns/roseGoldUltimatum.ts
10515 B · 195 lines
- exports: roseGoldUltimatum

## src/data/campaigns/shatteredCoast.ts
24342 B · 281 lines
- exports: shatteredCoast

## src/data/campaigns/summonedPact.ts
63035 B · 707 lines
- exports: summonedPact

## src/data/campaigns/summonedPactPhase4Hooks.ts
29170 B · 410 lines
- exports: SUMMONED_PACT_PHASE4_HOOKS

## src/data/campaigns/systemIntegration.ts
22403 B · 340 lines
- exports: systemIntegration

## src/data/campaigns/thornferryRoad.ts
9172 B · 173 lines
- exports: thornferryRoad

## src/data/campaigns/types.ts
6788 B · 188 lines
- exports: Difficulty, LoreSnippet, KeyNPC, MysteryCulprit, StarterQuest, OpeningPromptKind, OpeningVoice, OpeningAskStyle, OpeningMode, OpeningBeatCard, OpeningHookCard, OpeningRegistrar, OpeningPrompt, StarterItem, CampaignBible

## src/data/campaigns/umbraProtocol.ts
11043 B · 190 lines
- exports: umbraProtocol

## src/data/campaigns/vesperGlassCipher.ts
10541 B · 197 lines
- exports: vesperGlassCipher

## src/data/campaigns/voidAudience.ts
21713 B · 272 lines
- exports: voidAudience

## src/data/dungeonBiomes.ts
6243 B · 158 lines
- exports: BiomeFamily, BIOME_FAMILIES, BIOME_ALIASES, HUB_TEXT_BIOMES, ThreatModifier, THREAT_MODIFIERS, biomeKey
- functions: biomeKey:151

## src/data/encounters/dnd.ts
4500 B · 33 lines
- exports: DND_ENCOUNTERS

## src/data/encounters/index.ts
1577 B · 44 lines
- exports: encountersForMode, allCatalogEncounters, findCatalogEncounter, catalogFoeNames, isCatalogFoeName, EncounterSeed, EncounterTier, LITRPG_ENCOUNTERS, DND_ENCOUNTERS, RPG_ENCOUNTERS, PYOA_ENCOUNTERS
- functions: encountersForMode:21, allCatalogEncounters:26, findCatalogEncounter:30, catalogFoeNames:34, isCatalogFoeName:38

## src/data/encounters/litrpg.ts
6772 B · 39 lines
- exports: LITRPG_ENCOUNTERS

## src/data/encounters/manusHonestExtras.ts
7004 B · 51 lines
- exports: MANUS_LITRPG_EXTRAS, MANUS_DND_EXTRAS, MANUS_RPG_EXTRAS, MANUS_PYOA_EXTRAS

## src/data/encounters/pyoa.ts
2416 B · 18 lines
- exports: PYOA_ENCOUNTERS

## src/data/encounters/rpg.ts
4519 B · 33 lines
- exports: RPG_ENCOUNTERS

## src/data/encounters/types.ts
612 B · 20 lines
- exports: EncounterTier, EncounterSeed

## src/data/mockGameData.ts
4957 B · 44 lines
- exports: mockSkills, mockLoot, mockEnemies, ALL_CAMPAIGN_BIBLES, getCampaignBibleById, getCampaignBiblesByEngineMode, CampaignBible

## src/data/quests/litrpgMainSpines.ts
54287 B · 1121 lines
- exports: LitRpgSpineBibleId, OpeningFamilyTag, LitRpgMainSpine, SpineMatchCtx, LITRPG_MAIN_SPINES, isLitRpgSpineBibleId, isLitRpgSpineQuestId, spineQuestId, spinesForBible, hookCtxFromState, matchLitRpgMainSpine, matchLitRpgMainSpineFromCtx, spineToStarterQuest, withMatchedLitRpgSpine, pickSpineStampAlt, resolveLitRpgFolkStamp
- functions: isLitRpgSpineBibleId:986, isLitRpgSpineQuestId:990, spineQuestId:994, spinesForBible:998, familyScore:1003, hookCtxFromState:1011, matchLitRpgMainSpine:1032, matchLitRpgMainSpineFromCtx:1053, spineToStarterQuest:1057, withMatchedLitRpgSpine:1070, hashSeed:1083, pickSpineStampAlt:1093, resolveLitRpgFolkStamp:1100

## src/data/quests/storyRpgMainSpines.ts
41599 B · 730 lines
- exports: StoryRpgMatchCtx, StoryRpgSpineBibleId, StoryRpgFamilyTag, StoryRpgMainSpine, STORY_RPG_MAIN_SPINES, STORY_RPG_SPINE_QUEST_ID, isStoryRpgSpineBibleId, isStoryRpgSpineQuestId, spinesForStoryRpgBible, matchStoryRpgMainSpine, matchStoryRpgMainSpineFromCtx, storyRpgSpineToStarterQuest, withMatchedStoryRpgSpine, pickStoryRpgStampAlt
- functions: isStoryRpgSpineBibleId:646, isStoryRpgSpineQuestId:650, spinesForStoryRpgBible:654, familyScore:659, matchStoryRpgMainSpine:667, matchStoryRpgMainSpineFromCtx:688, storyRpgSpineToStarterQuest:692, withMatchedStoryRpgSpine:704, hashSeed:715, pickStoryRpgStampAlt:724

## src/data/quests/tabletopMainSpines.ts
29451 B · 637 lines
- exports: TabletopMatchCtx, TabletopSpineBibleId, TabletopFamilyTag, TabletopMainSpine, TABLETOP_MAIN_SPINES, TABLETOP_SPINE_QUEST_ID, isTabletopSpineBibleId, isTabletopSpineQuestId, spinesForTabletopBible, matchTabletopMainSpine, matchTabletopMainSpineFromCtx, tabletopSpineToStarterQuest, withMatchedTabletopSpine, pickTabletopStampAlt
- functions: isTabletopSpineBibleId:553, isTabletopSpineQuestId:557, spinesForTabletopBible:561, familyScore:566, matchTabletopMainSpine:574, matchTabletopMainSpineFromCtx:595, tabletopSpineToStarterQuest:599, withMatchedTabletopSpine:611, hashSeed:622, pickTabletopStampAlt:631

## src/data/worldOutlines.ts
15349 B · 180 lines
- exports: WorldOutlineRegion, WorldOutlineSettlement, WorldOutlineDef, WORLD_OUTLINES, getWorldOutlineById, pickWorldOutline
- functions: getWorldOutlineById:158, pickWorldOutline:162

## src/game/__tests__/contentDensityWS6.test.ts
23238 B · 736 lines

## src/game/__tests__/waveA.test.ts
20360 B · 670 lines
- functions: createTestState:75

## src/game/__tests__/waveB.test.ts
21554 B · 729 lines
- functions: createMockGameState:71, createMockLifecycle:95

## src/game/__tests__/waveC.test.ts
17477 B · 576 lines
- functions: createMockGameState:58, createMockMemory:80, createMockLedger:94, createMockTemplate:102

## src/game/__tests__/waveD.test.ts
18993 B · 654 lines

## src/game/__tests__/ws2-wave-b-memory.test.ts
17815 B · 498 lines

## src/game/__tests__/ws2-wave-c-turnover.test.ts
15750 B · 461 lines

## src/game/__tests__/ws2-wave-d-cross-integration.test.ts
19773 B · 570 lines

## src/game/__tests__/ws4-complete.test.ts
29591 B · 940 lines

## src/game/__tests__/ws7Complete.test.ts
32494 B · 1099 lines
- functions: createMockGameState:80, createMockRelationship:124

## src/game/act3Sandbox.test.ts
11362 B · 279 lines

## src/game/act4Sandbox.test.ts
7589 B · 179 lines

## src/game/act5Sandbox.test.ts
5770 B · 121 lines

## src/game/actionResolution.ts
21698 B · 394 lines
- exports: isGenericBridgeNarrative, unresolvedActionReason, isUnresolvedActionNarrative, proseStatesEngineFact, buildThinStoryExpandBlock, buildResolutionRetryBlock, isPlayerQuestion, gmBeatAnswersPlayerAsk, actionFocusPhrase, isWorldSituationQuestion, isHealQuestion, buildResolutionUserPayload, playerFacingLocation, isOfferOnlyUnansweredBeat
- functions: proseOnly:29, isGenericBridgeNarrative:37, unresolvedActionReason:61, isUnresolvedActionNarrative:108, proseStatesEngineFact:123, buildThinStoryExpandBlock:131, buildResolutionRetryBlock:146, isPlayerQuestion:170, hasQuotedAnswer:178, gmBeatAnswersPlayerAsk:183, askKeywordTokens:193, proseAnswersPlayerAsk:203, isRecycledTalkBeat:232, actionFocusPhrase:246, isPanelOnlyAction:255, asksIfEveryoneGotGear:269, proseAnswersEveryoneGear:275, isCreatureWithoutRoom:281, isRecycledLookAround:297, isGeneralLookAround:316, isWorldSituationQuestion:328, proseResolvesTalk:334, proseResolvesSpeech:341, isHealQuestion:351, proseAnswersHeal:357, isGearOriginQuestion:363, proseTracksPremise:369, proseExplainsGear:373, buildResolutionUserPayload:379

## src/game/actionValidation.test.ts
11527 B · 337 lines
- functions: item:18, baseState:22

## src/game/actionValidation.ts
9257 B · 260 lines
- exports: ValidationResult, HardViolation, shouldSkipHardGate, validateActionHard, validateActionSoft, validateAction
- functions: openingCoversPending:47, nameAppearedInLastStory:54, knownNameSet:62, knownObjectNames:80, hasContainerType:93, shouldSkipHardGate:100, validateActionHard:119, validateActionSoft:201, validateAction:242

## src/game/aiService.direct.ts
14710 B · 365 lines
- exports: callGmDirect, callGmAutoFightDirect
- functions: fetchWithTimeout:25, logRequest:45, logResponse:49, logError:59, normalizeProvider:67, callGoogle:89, callOpenRouter:133, callAnthropic:188, callOpenAICompatible:231, dispatchLlm:289, assembleSystemPrompt:325, callGmDirect:339, callGmAutoFightDirect:353

## src/game/aiService.ts
8316 B · 235 lines
- exports: callGm, callOpeningGm, callGmAutoFight, GmResult, RateLimitError, withRetry
- functions: rejectHanGmResult:26, callGm:39, callOpeningGm:116, callGmAutoFight:164

## src/game/aiServiceShared.ts
4638 B · 127 lines
- exports: GmResult, RateLimitError, withRetry, processGmCompletion
- functions: withRetry:30, extractImagePrompt:67, stripImageBlock:83, extractSystemLog:90, stripSystemLog:96, processGmCompletion:101

## src/game/apiValidation.ts
5610 B · 153 lines
- exports: ValidationResult, detectProviderFromKey, getDefaultModels, validateApiKey, fetchModelsForProvider, OpenRouterCatalogModel, fetchOpenRouterModelCatalog
- functions: detectProviderFromKey:8, getDefaultModels:34, validateApiKey:38, fetchModelsForProvider:87, fetchOpenRouterModelCatalog:127

## src/game/arcDirector.ts
43145 B · 1150 lines
- exports: ArcDirectorState, ArcDirectorResult, droughtSkirmishTable, shouldSpawnCombat, selectCombatBeat, selectQuestStageBeat, forceLivenessBeat, formatArcStatusReceipts, runArcDirectorBeforeGm, buildArcDirectorSnapshotLines, applyArcDirectorCommit, formatArcDirectorMandateBlock, preserveArcQuestProgress
- functions: committedSet:199, droughtSkirmishTable:204, playerIsTravelingAway:232, shouldSpawnCombat:238, selectCombatBeat:258, selectQuestStageBeat:285, resolveCombatContract:296, hubSkirmishEncounter:308, completeQuestObjective:346, hasCombatReceipt:360, hasCrisisReceipt:367, hasLeverageReceipt:373, softThreatOverdue:380, forceLivenessBeat:387, shouldCommitBeat:437, applyBeatEffects:485, formatArcStatusReceipts:602, runArcDirectorBeforeGm:631, applyExitAuthorityOnFlee:1037, buildArcDirectorSnapshotLines:1066, applyArcDirectorCommit:1096, formatArcDirectorMandateBlock:1121, preserveArcQuestProgress:1127

## src/game/archetypes.ts
21785 B · 269 lines
- exports: LitRpgArchetype, DndOpening, CampaignArchetype, ArchetypeOption, LITRPG_ARCHETYPES, DND_OPENINGS, RPG_OPENINGS, getArchetypeOptions, getDefaultArchetype, buildArchetypeRules, buildArchetypeIntro
- functions: getArchetypeOptions:74, getDefaultArchetype:80, buildArchetypeRules:202, buildArchetypeIntro:228

## src/game/autoImproveAllowlist.ts
670 B · 21 lines
- exports: AUTO_IMPROVE_PATCH_ALLOWLIST, AutoImprovePatchPath

## src/game/autoImprovePatch.ts
3130 B · 90 lines
- exports: SearchReplaceBlock, normalizeNewlines, detectNewline, toFileNewlines, isIncompleteSearchReplace, parseSearchReplaceBlocks, applySearchReplaceOnce, isPlaceholderTicket, filterRealTickets
- functions: normalizeNewlines:8, detectNewline:12, toFileNewlines:16, isIncompleteSearchReplace:22, parseSearchReplaceBlocks:31, applySearchReplaceOnce:48, isPlaceholderTicket:68, filterRealTickets:85

## src/game/autoplayWriter.ts
5275 B · 168 lines
- exports: AutoplayWriterKind, AutoplayWriterOverride, AutoplayCriticConfig, FLASH_LITE_OPENROUTER_MODEL, OPENROUTER_BASE, AUTOPLAY_HARNESS_DEFAULT_WRITER, CURRICULUM_FLAGSHIP_PREMADES, getAutoplayWriterOverride, clearAutoplayWriterOverride, setAutoplayWriterOverride, isClientAutoplayWriter, parseAutoplayWriterKind, resolveOpenRouterApiKey, resolveFlashLiteAutoplayWriter, resolveAutoplayWriter, enableAutoplayWriter, resolveFlashLiteCritic, resolveAutoplayCritic
- functions: env:50, firstEnv:61, getAutoplayWriterOverride:69, clearAutoplayWriterOverride:73, setAutoplayWriterOverride:77, isClientAutoplayWriter:82, parseAutoplayWriterKind:90, resolveOpenRouterApiKey:100, resolveFlashLiteAutoplayWriter:108, resolveAutoplayWriter:128, enableAutoplayWriter:133, resolveFlashLiteCritic:144, resolveAutoplayCritic:164

## src/game/beatCommit.ts
3115 B · 114 lines
- exports: BeatType, BeatCommit, validateProseAgainstBeat, beatCommitFromReceipts
- functions: validateProseAgainstBeat:43, beatCommitFromReceipts:90

## src/game/beatCommitGate.ts
25915 B · 570 lines
- exports: CommitGateReason, CommitGateResult, missingPointerCardSlot, classifyBeatCommit, isFactClosedViolation, codedSceneMove, stitchCommitDelta, isStitchBankFingerprint, isEntropyShapeSalad, isTokenSaladLeak, isVerbatimStallStub, isWriterMonologueLeak, isDirectorChromeLeak, isHudCombatChromeLeak, isEngineChromeOnlyBeat, isExactPriorGmBody, isBlockedPaint, scrubDirectorChrome, repairRejectedBeat
- functions: distinctiveTokens:56, slotMentioned:64, missingPointerCardSlot:71, classifyBeatCommit:83, isFactClosedViolation:180, codedSceneMove:214, stitchCommitDelta:255, isStitchBankFingerprint:260, isEntropyShapeSalad:289, isTokenSaladLeak:302, isVerbatimStallStub:327, isWriterMonologueLeak:350, isDirectorChromeLeak:404, isHudCombatChromeLeak:424, isEngineChromeOnlyBeat:435, normalizeCommittedBeat:451, isExactPriorGmBody:456, isBlockedPaint:463, scrubDirectorChrome:474, repairRejectedBeat:482

## src/game/beatContract.ts
21213 B · 581 lines
- exports: BeatKind, BeatContract, resolveBiblePrefix, contractsForState, contractById, resolveTurnJob, selectDueBeat, forcedEncounterBeat, engineAllowsCombat, SealedBeatVerb, SealedBeatCard, WRITER_RHYTHM_WINDOW, WRITER_RHYTHM_CHAR_CAP, classifySealedVerb, sealedCastNames, sealedClosedFacts, legalTravelDestinations, isLegalTravelDestination, buildSealedBeatCard, formatSealedBeatCard, formatWriterFacingPacket, inventedCastNamesInProse, isInventedCastViolation, isWrongHereViolation, isSealedCardViolation
- functions: resolveBiblePrefix:206, contractsForState:236, contractById:242, resolveTurnJob:249, selectDueBeat:284, forcedEncounterBeat:298, engineAllowsCombat:327, classifySealedVerb:347, lastPlayerAction:362, openingPinsLockedOut:372, sealedCastNames:382, sealedClosedFacts:402, legalTravelDestinations:420, isLegalTravelDestination:435, sealedTone:444, buildSealedBeatCard:458, formatSealedBeatCard:476, formatWriterFacingPacket:492, pcName:503, inventedCastNamesInProse:508, isInventedCastViolation:538, isWrongHereViolation:545, isSealedCardViolation:570

## src/game/beatFingerprint.ts
8096 B · 214 lines
- exports: normalizeProseTokens, tokenJaccard, beatFingerprint, beatSimilarity, isSameBeat, maxBeatSimilarity, isNearClone, buildBeatNoveltyRetryBlock, normalizePlayerIntentKey, loiterFamilyKey, coerceLogContent, IntentStreak, countLoiterFamilyStreak, countPlayerIntentStreak
- functions: normalizeProseTokens:6, tokenJaccard:18, beatFingerprint:28, sketchSet:49, beatSimilarity:55, isSameBeat:68, maxBeatSimilarity:78, isNearClone:90, buildBeatNoveltyRetryBlock:98, normalizePlayerIntentKey:109, loiterFamilyKey:137, coerceLogContent:155, countLoiterFamilyStreak:168, countPlayerIntentStreak:193

## src/game/beatRegistry.ts
7895 B · 224 lines
- exports: RegistryBeatKind, BeatTemplate, COMBAT_BEATS, QUEST_BEATS, TRAVEL_BEATS, getBeatTemplate, xpFromTemplate, buildBeatContractFromTemplate
- functions: getBeatTemplate:182, mapKind:187, xpFromTemplate:195, buildBeatContractFromTemplate:201

## src/game/bgCache.ts
3373 B · 112 lines
- exports: BgEntry, bgGet, bgPut, bgList, bgDelete, generateBgWithOpenRouter, generateBgWithCustom
- functions: openDb:18, bgGet:29, bgPut:39, bgList:49, bgDelete:59, modeFromSettings:69, generateBgWithOpenRouter:75, generateBgWithCustom:106

## src/game/bindingConstraints.ts
14772 B · 416 lines
- exports: BindingConstraint, buildBindingConstraints, formatBindingConstraintsForPrompt, detectConstraintViolations, repairConstraintViolations
- functions: capList:24, collectLooseLabels:29, buildBindingConstraints:38, buildExitConstraints:82, buildPropItemConstraints:110, buildPresenceConstraints:139, buildSceneConstraints:169, buildInventoryConstraints:246, formatBindingConstraintsForPrompt:290, detectConstraintViolations:326, repairConstraintViolations:372

## src/game/bookManifest.ts
3023 B · 92 lines
- exports: BookPageKind, BookPage, buildBookManifest
- functions: buildBookManifest:29

## src/game/campaignBibleTypes.ts
77 B · 2 lines
- exports: CampaignBible, MysteryCulprit

## src/game/campaignContract.ts
5276 B · 156 lines
- exports: CampaignContract, CampaignDivergence, freezeCampaignContract, ensureCampaignContract, detectCampaignDivergences, mergeCampaignDivergences, formatCampaignContractForPrompt
- functions: freezeCampaignContract:38, ensureCampaignContract:74, detectCampaignDivergences:90, mergeCampaignDivergences:128, formatCampaignContractForPrompt:142

## src/game/campaignMemory.ts
32689 B · 967 lines
- exports: emptyCampaignMemory, ensureCampaignMemory, extractLosslessFacts, pinOpenPlayerAsk, extractPromisesFromProse, extractSilencedSpeechFromProse, resolveConsequences, maybeAppendTurnSummary, maybeRefreshCampaignSummary, derivePersonalitySummary, upsertNpcRelationshipSummary, autoPin, addPlayerPin, addConsequence, retrieveMemorySnippets, retrieveMemoriesSmartly, formatCampaignMemoryForPrompt, advanceCampaignMemory, scoreMemoryImportance, scoreAllMemoryImportance, selectImportantMemories, createChapterSummary, maybeCreateChapterSummary, createArcSummary, maybeCreateArcSummary, calculateMemoryBudget
- functions: emptyCampaignMemory:26, ensureCampaignMemory:41, compressLine:45, extractLosslessFacts:53, pinOpenPlayerAsk:107, extractPromisesFromProse:146, extractSilencedSpeechFromProse:176, resolveConsequences:204, escapeReg:255, maybeAppendTurnSummary:260, maybeRefreshCampaignSummary:292, derivePersonalitySummary:325, upsertNpcRelationshipSummary:335, autoPin:350, addPlayerPin:378, addConsequence:403, retrieveMemorySnippets:421, retrieveMemoriesSmartly:459, formatCampaignMemoryForPrompt:497, advanceCampaignMemory:586, scoreMemoryImportance:693, scoreAllMemoryImportance:740, selectImportantMemories:754, createChapterSummary:778, maybeCreateChapterSummary:846, createArcSummary:873, maybeCreateArcSummary:923, calculateMemoryBudget:952

## src/game/campaignNsfw.ts
428 B · 11 lines
- exports: campaignIsNsfw
- functions: campaignIsNsfw:4

## src/game/campaignSeed.ts
12197 B · 303 lines
- exports: findBibleForArchetype, seedStateFromCampaignBible, resolveActiveCampaignBible, applyCampaignCharacter, reconcileCampaignLoadout, seedStateFromArchetype
- functions: snippetType:13, findBibleForArchetype:21, seedStateFromCampaignBible:49, resolveActiveCampaignBible:125, inferStartingLocation:139, isGenericFantasyStarter:148, isGenericFantasyContainer:157, inventoryHasGenericFantasyKit:161, isModernEarthPremise:168, applyCampaignCharacter:174, starterToItem:186, formatKitRail:204, buildCampaignLoadout:217, reconcileCampaignLoadout:276, seedStateFromArchetype:294

## src/game/capacityLedger.ts
18165 B · 534 lines
- exports: CapacityLedger, emptyCapacityLedger, loadCapacityLedger, saveCapacityLedger, applyStaffDailyReset, textTurnsRemaining, memorableRemaining, memorablePlatesAvailable, memorableToggleEnabled, memorableWeeklyCapLabel, illustratedRemaining, CapacitySpendKind, canSpend, spendCapacity, refundCapacity, grantAdReward, grantAdBonusTurns, MAX_MEMORABLE_ADS_PER_DAY, MAX_MEMORABLE_ADS_PER_WEEK, memorableWeeklySubRemaining, memorableAdExtrasRemaining, grantAdMemorableBonus, grantTurnPack, capacityStatusMessage, COMIC_KLEIN_CAPS, getComicKleinSessionSpent, __resetComicKleinSessionForTests, canSpendComicKleinUnit, spendComicKleinUnit, storyStartTextTurnsForTier, textTurnsRemainingWithStoryStart
- functions: dayUtc:59, weekUtc:63, emptyCapacityLedger:72, migrateLedger:96, loadCapacityLedger:115, saveCapacityLedger:153, applyStaffDailyReset:161, textSubRemainingToday:182, illustratedSubRemainingToday:187, textTurnsRemaining:195, memorableSubRemaining:199, memorableRemaining:207, memorablePlatesAvailable:212, memorableToggleEnabled:222, memorableWeeklyCapLabel:226, illustratedRemaining:237, canSpend:243, spendCapacity:258, refundCapacity:339, grantAdReward:377, grantAdBonusTurns:387, memorableWeeklySubRemaining:404, memorableAdExtrasRemaining:409, grantAdMemorableBonus:422, grantTurnPack:434, capacityStatusMessage:448, getComicKleinSessionSpent:475, __resetComicKleinSessionForTests:480, canSpendComicKleinUnit:484, spendComicKleinUnit:497, storyStartTextTurnsForTier:521, textTurnsRemainingWithStoryStart:528

## src/game/characterXp.ts
1519 B · 56 lines
- exports: CharacterXpApplyResult, applyCharacterXpGain
- functions: applyCharacterXpGain:16

## src/game/checkMath.ts
11321 B · 360 lines
- exports: CheckSkill, CheckContext, PlayerCheckResult, isContestedSocialAction, resolveCheckContext, runPlayerCheck
- functions: isContestedSocialAction:71, attrScore:82, attrMod:90, gearMod:94, skillBonus:103, professionBonus:115, dcForStrictness:127, resolveCheckContext:137, runPlayerCheck:249

## src/game/checkRules.ts
10476 B · 264 lines
- exports: AdvState, CheckMod, CheckResultRecord, proficiencyBonus, DispositionSocialRow, DISPOSITION_SOCIAL, storedDisposition, socialTarget, requestSize, WeaponCategory, weaponCategory, FamiliarityTier, familiarityTier, familiarityToHit, weaponFamiliarityScore, growWeaponFamiliarity, rollD20WithAdv, combineAdv, resolveCheckRecord, formatCheckRecord, dispositionCue, familiarityCue
- functions: proficiencyBonus:39, storedDisposition:75, socialTarget:90, requestSize:106, weaponCategory:116, familiarityTier:130, familiarityToHit:136, weaponFamiliarityScore:148, growWeaponFamiliarity:162, rollD20WithAdv:173, combineAdv:181, resolveCheckRecord:188, signed:229, formatCheckRecord:234, dispositionCue:252, familiarityCue:259

## src/game/choiceCompiler.ts
53849 B · 1352 lines
- exports: PlayerIntentFamily, LastPlayerIntent, classifyPlayerIntent, namedPropPadsFromBeat, ChoiceFingerprintFamily, ChoiceFingerprintRecord, GateDisposition, HubGateType, HubBeatRecord, updateChoiceFingerprints, CompileChoicesResult, classifyHubGate, isHubBeatCapped, recordHubBeat, shouldForceLitrpgHubExit, checkGateDisposition, recordGateRejection, compileChoices, playerInputGateBlock
- functions: classifyPlayerIntent:82, lastPlayerLine:94, leftoverCoverOrOpeningChip:103, isLookOrExamineRoomPad:112, isGenericInspectPad:118, isFirstSpeechLecturePad:125, isIdentityIntroPad:132, intentSupplements:138, namedPropPadsFromBeat:151, inspectTargetExhausted:169, isEncounterForbiddenPad:213, hasLiveStakes:239, isAbstractGenericPad:248, countRecentAbstractPadUses:255, filterPadsByFsmState:274, classifyChoiceFamily:420, isStallFamily:434, fingerprintUsage:444, familyOnCooldown:454, updateChoiceFingerprints:469, gateTravelTarget:495, classifyHubGate:504, isHubBeatCapped:515, recordHubBeat:528, shouldForceLitrpgHubExit:560, checkGateDisposition:585, recordGateRejection:631, hubBeatExhausted:646, compileChoices:661, playerInputGateBlock:1343

## src/game/choiceEdge.ts
9703 B · 281 lines
- exports: ChoiceEdgeKind, ChoiceEdge, enumerateLegalEdges, edgesToChoiceLabels, findEdgeForChoice
- functions: hubBeatCount:43, closeEdgeUniverse:47, enumerateLegalEdges:53, getSpineNodeMajor:259, dedupeEdges:263, edgesToChoiceLabels:273, findEdgeForChoice:277

## src/game/choicePipeline.ts
45212 B · 1049 lines
- exports: normalizeStoryCorpus, stripChoiceDecorators, sanitizeChoiceLabel, isBrokenChoiceLabel, isAloneOrEmptyScene, isUIExaminationContext, inventsPresenceOnEmptyScene, environmentalEventViolations, threatChoiceWithoutSetup, fightChoiceAfterEnemyDead, lootChoiceAfterHarvest, exploreStubInCombat, observeThreatWithoutSetup, priorEstablishedProse, isChoiceGroundedInTurn, isLegalEnginePad, extractChoiceObjectPhrases, choiceNamesUnnarratedObject, isLookAroundChoice, filterChoicesToTurnFacts, callSmallModel, sceneSafeFallbacks, padChoicesToCount, ChoicePipelineResult, resolvePipelineChoices, CHOICE_TIER_PROMPT_RULES, formatChoiceTierModeDna
- functions: normalizeStoryCorpus:100, stripChoiceDecorators:116, sanitizeChoiceLabel:121, isBrokenChoiceLabel:137, isAloneOrEmptyScene:154, isUIExaminationContext:169, inventsPresenceOnEmptyScene:188, loreCorpus:201, environmentalEventViolations:208, threatChoiceWithoutSetup:222, enemyIsDead:237, fightChoiceAfterEnemyDead:245, lootChoiceAfterHarvest:256, exploreStubInCombat:263, observeThreatWithoutSetup:271, priorEstablishedProse:290, isChoiceGroundedInTurn:314, isLegalEnginePad:366, extractChoiceObjectPhrases:392, choiceNamesUnnarratedObject:408, isLookAroundChoice:456, filterChoicesToTurnFacts:461, restoreHarvestedOffers:509, buildTierContext:522, callSmallModel:591, regenerateChoices:666, sceneSafeFallbacks:689, deduplicateChoicesAcrossRecentTurns:825, padChoicesToCount:857, resolvePipelineChoices:971

## src/game/choiceRanking.ts
9191 B · 202 lines
- exports: actionFamily, recordCirclingTurn, turnsWithoutProgress, nudgeIfStuck, storyChip, rankChoices, CirclingMemory
- functions: actionFamily:20, placeKey:34, recordCirclingTurn:39, turnsWithoutProgress:65, nudgeIfStuck:72, travelDest:114, storyChip:120, rankChoices:139

## src/game/choiceTierRules.ts
5453 B · 58 lines
- exports: CHOICE_TIER_PROMPT_RULES, formatChoiceTierModeDna
- functions: formatChoiceTierModeDna:55

## src/game/choiceTracking.ts
437 B · 16 lines
- exports: trackRecentChoices
- functions: trackRecentChoices:7

## src/game/choiceWarden.test.ts
6148 B · 204 lines

## src/game/choiceWarden.ts
8594 B · 251 lines
- exports: isBarePcNameChoice, choiceInventsContext, filterInventedContextChoices, explainFilteredChoice
- functions: isBarePcNameChoice:67, lastGmStory:74, lastPlayerAction:85, choiceInventsContext:99, filterInventedContextChoices:134, explainFilteredChoice:238

## src/game/chromeAuthority.ts
20022 B · 426 lines
- exports: normalizeChromeToken, isCoverSlotLabel, isUiChromeNoun, isChromePersonToken, isUnresolvedDeixisToken, isPolityFactionOrPlaceToken, isRoleAdjectivePersonSlot, isRoleContactLabel, isHubRoleCompoundToken, detectHubRoleMadlib, isChoicePadPersonToken, isDialogueVerbPersonToken, isPlannerUiPersonToken, isNonPersonNameToken, isFactionOrOrgToken, filterChromeFromPresent, realPresentPeople, isAggregatePersonToken, chromeSpeechAnchor, isChromeTalkChoice, formatCoverChromeBindingLine, rewriteChromeSpeakerTags, rewriteChromePersonClauses
- functions: normalizeChromeToken:29, isCoverSlotLabel:36, isUiChromeNoun:40, isChromePersonToken:47, isUnresolvedDeixisToken:79, isPolityFactionOrPlaceToken:87, isRoleAdjectivePersonSlot:110, isRoleContactLabel:125, isHubRoleCompoundToken:138, detectHubRoleMadlib:148, isChoicePadPersonToken:168, isDialogueVerbPersonToken:188, isPlannerUiPersonToken:209, isNonPersonNameToken:230, isFactionOrOrgToken:245, filterChromeFromPresent:251, realPresentPeople:261, isAggregatePersonToken:278, chromeSpeechAnchor:289, isChromeTalkChoice:297, formatCoverChromeBindingLine:305, tidyChromeClauses:309, rewriteChromeSpeakerTags:328, rewriteChromePersonClauses:368

## src/game/claimGrounding.ts
1326 B · 15 lines
- exports: formatClaimGroundingDirective
- functions: formatClaimGroundingDirective:8

## src/game/closedFactLedger.ts
4682 B · 121 lines
- exports: harvestGivenAwayFromProse, harvestResolvedCrisisFromProse, applyClosedFactHarvest, isGivenItemReopened, isResolvedCrisisRewound, isClosedLedgerViolation
- functions: escapeRe:9, knownItemNeedles:25, mentionedItems:39, harvestGivenAwayFromProse:51, harvestResolvedCrisisFromProse:68, applyClosedFactHarvest:74, isGivenItemReopened:103, isResolvedCrisisRewound:112, isClosedLedgerViolation:118

## src/game/closedScenePerson.ts
9576 B · 256 lines
- exports: listedAnonymousRoles, isThornferryClerkSite, sceneHasRoleOccupancy, sceneAllowsRoleIntroduction, isInventedNamedIdentity, isInventedClosedScenePerson, isClosedScenePersonPad, filterClosedScenePersonPads, harvestRoleOccupancy, trimAnonymousRolesOnLocationChange
- functions: lastPlayerLine:30, normalizeRole:38, listedAnonymousRoles:42, presentMentionsRole:46, hubContactAllowsRole:66, isThornferryClerkSite:75, sceneHasRoleOccupancy:79, sceneAllowsRoleIntroduction:88, occupancyHasName:106, isInventedNamedIdentity:125, roleActorHits:148, isInventedClosedScenePerson:172, isClosedScenePersonPad:190, filterClosedScenePersonPads:203, harvestRoleOccupancy:208, trimAnonymousRolesOnLocationChange:249

## src/game/cloudSync.ts
9672 B · 289 lines
- exports: CloudSaveBundle, gameStateToLocalSlot, fetchLatestCloudSave, fetchSupabaseSaveSlot, fetchAllCloudSaveSlots, deleteCloudSave, deleteCloudSavesExcept, syncGameToCloud
- functions: lastPlayerLine:8, slotFromState:26, gameStateToLocalSlot:39, fetchLatestCloudSave:47, fetchSupabaseSaveSlot:79, slotFromCloudRow:84, fetchAllCloudSaveSlots:106, deleteCloudSave:126, deleteCloudSavesExcept:153, syncGameToCloud:187

## src/game/combat.ts
8088 B · 221 lines
- exports: EnemyStats, CombatRound, CombatResult, simulateCombat, buildAutoFightPrompt
- functions: rollD20:53, rollDamage:57, rollLoot:61, simulateCombat:77, buildAutoFightPrompt:185

## src/game/combatAuthority.ts
19297 B · 489 lines
- exports: canAttachLiveFight, LastKill, isHumanoidEnemyName, enemyBodyAuthorityLine, scrubBeastifiedHumanoid, scrubDeniedKill, formatLastKillSnapshotLine, isLastKillTalkPad, matchesLastKillName, sentenceMentionsLastKill, isDeadFoeCorpseOk, shouldRewriteDeadFoeSentence, isDeadFoeReopenedAsLiving, isClosedKillRecycle, attachLastKill, lastGmMentionsEnemy, proseMentionsEnemy, foeVisibleInScene, autoFightSpawnPreface, scrubCombatSpawnLog, hasCombatSpawnLogInBody, scrubDroughtSpawnInvent, markPendingSpawnPreface, ensureEncounterSpawnPreface, commitAutoFightLedger, narrateAutoFightTemplate, lastKillFromAutoFightLog
- functions: sceneFactsBase:9, canAttachLiveFight:21, isHumanoidEnemyName:44, enemyBodyAuthorityLine:51, scrubBeastifiedHumanoid:58, scrubDeniedKill:73, formatLastKillSnapshotLine:92, isLastKillTalkPad:105, matchesLastKillName:124, lastKillMentionRe:158, sentenceMentionsLastKill:164, isDeadFoeCorpseOk:175, shouldRewriteDeadFoeSentence:179, isDeadFoeReopenedAsLiving:187, isClosedKillRecycle:198, attachLastKill:208, lastGmMentionsEnemy:229, proseMentionsEnemy:234, foeVisibleInScene:241, autoFightSpawnPreface:256, scrubCombatSpawnLog:268, hasCombatSpawnLogInBody:283, scrubDroughtSpawnInvent:295, markPendingSpawnPreface:334, ensureEncounterSpawnPreface:358, commitAutoFightLedger:430, narrateAutoFightTemplate:456, lastKillFromAutoFightLog:471

## src/game/combatReceipt.ts
1631 B · 38 lines
- exports: formatCombatReceipt, formatFleeReceipt, formatCombatTelegraph
- functions: formatCombatReceipt:9, formatFleeReceipt:26, formatCombatTelegraph:35

## src/game/combatResolution.ts
9232 B · 322 lines
- exports: CombatOutcome, rollCombatOutcome, applyCombatOutcome, formatCombatOutcomeForPrompt
- functions: rollD20:29, calculateDamage:47, calculateCounterattack:71, rollCombatOutcome:95, applyCombatOutcome:229, formatCombatOutcomeForPrompt:264

## src/game/comicBeatSpec.ts
10150 B · 298 lines
- exports: BeatRole, PanelPlanSource, P0_CARD_ID, ComicBeatSpec, ComicPanelPlan, ledgerRosterNames, ledgerPlaceId, validateGmPanels, inferBeatRole, buildDeterministicOnePanel, resolveComicPanelPlan, resolveP0PanelCeiling, isValidOverlayAnchor
- functions: extractNamedSuspects:52, ledgerRosterNames:73, ledgerPlaceId:90, validateGmPanels:98, inferBeatRole:148, buildDeterministicOnePanel:159, resolveComicPanelPlan:228, resolveP0PanelCeiling:287, isValidOverlayAnchor:294

## src/game/comicEligibility.ts
6492 B · 180 lines
- exports: ComicSkipReason, ComicEligibilityInput, ComicEligibilityResult, comicLiteTargetRate, hashUnitInterval, buildComicBeatDedupeKey, kidComicPreflight, evaluateComicEligibility
- functions: comicLiteTargetRate:57, hashUnitInterval:76, buildComicBeatDedupeKey:85, hasFocalSubject:93, kidComicPreflight:105, evaluateComicEligibility:119

## src/game/comicImagePrompt.test.ts
2598 B · 63 lines

## src/game/comicImagePrompt.ts
13094 B · 289 lines
- exports: ImagePromptKind, ImagePromptContext, PURE_ART_DIRECTIVE, scrubFranchiseStyleLeak, WORLD_GENRE_PRESERVATION_DIRECTIVE, NEGATIVE_ART_PROMPT, CLASSIC_ILLUSTRATION_DIRECTIVE, MILESTONE_ILLUSTRATION_DIRECTIVE, viewpointLooksMinor, subjectAgeDirective, characterLookForArt, isClassicBookPreset, isComicVisualMode, allowsImageGeneration, shouldUseComicGrid, getEffectiveComicPreset, artStyleForImageKind, buildComicPanelImagePrompt, buildClassicIllustrationPrompt, buildMilestoneIllustrationPrompt, buildImagePromptForKind
- functions: scrubFranchiseStyleLeak:47, viewpointLooksMinor:76, subjectAgeDirective:80, characterLookForArt:88, isClassicBookPreset:106, isComicVisualMode:110, allowsImageGeneration:122, shouldUseComicGrid:136, getEffectiveComicPreset:146, artStyleForImageKind:152, contentTone:160, withDeterministicContext:171, buildComicPanelImagePrompt:203, buildClassicIllustrationPrompt:217, buildMilestoneIllustrationPrompt:233, buildImagePromptForKind:255

## src/game/comicJobKeys.ts
2617 B · 90 lines
- exports: ComicAttemptClass, ComicJobIdentity, buildComicJobKey, parseComicJobKey, shouldAttachComicResult, reserveComicJobKey, markComicJobSpent, releaseComicJobKey, isComicJobSpent, __resetComicJobReservationsForTests
- functions: buildComicJobKey:16, parseComicJobKey:26, shouldAttachComicResult:50, reserveComicJobKey:60, markComicJobSpent:69, releaseComicJobKey:78, isComicJobSpent:82, __resetComicJobReservationsForTests:87

## src/game/comicMaximizer.test.ts
10933 B · 302 lines
- functions: baseState:38

## src/game/comicOverlayBind.ts
2588 B · 80 lines
- exports: AcceptedUtterance, bindOverlayUtterance, fallbackOverlayAnchor, isFiveAnchorVocabulary
- functions: bindOverlayUtterance:15, fallbackOverlayAnchor:58, isFiveAnchorVocabulary:72

## src/game/comicScriptAdapter.ts
2688 B · 57 lines
- exports: comicPanelScriptToPanel, buildComicSpeechQueue
- functions: comicPanelScriptToPanel:15, buildComicSpeechQueue:42

## src/game/completedEventPacket.ts
84789 B · 2151 lines
- exports: EventOutcome, CompletedEventPacket, LedgerRefClass, TokenUse, LedgerRef, TokenUseRef, classifyVerb, PacketBuildExtras, NounAllowlistOpts, compileNounAllowlist, tokenUseMatchesClass, compileRefEnum, formatRefEnumForWriter, LoiterStreakFamily, classifyLoiterFamily, nextLoiterStreaks, collapseLoiterWriterBeats, buildCompletedEventPacket, ledgerActionStitch, attachCompletedEvent, formatWriterFacingEvent, mentionAllowlistHas, inventedTitleCaseNotOnAllowlist, proseViolatesEventPacket, PACKET_STITCH_FINGERPRINTS, RETIRED_DROUGHT_STUB, isDroughtStubProse, isUnaskedCombatClose, isLastGmReprint, lastResortStoryBody, bookBodyAfterWriterMiss, isPacketStitchProse, assemblePacketStitch, prepareRetrospectiveWriterInput
- functions: lastPlayerAction:154, classifyVerb:164, isIntentRemainderNoun:207, livingLedgerPeople:216, matchLedgerNoun:221, extractTarget:246, liveEncounterHp:281, isGenericHereLabel:289, locationLabel:293, pushUnique:310, castMentionNames:337, compileNounAllowlist:343, slugRefId:401, tokenUseMatchesClass:419, compileRefEnum:427, formatRefEnumForWriter:483, isCombatVerb:491, resolveOutcome:495, rhythmBeats:534, classifyLoiterFamily:544, hereKey:551, nextLoiterStreaks:559, ledgerFocusNoun:592, collapseLoiterWriterBeats:608, buildCompletedEventPacket:618, hubDescriptor:708, ledgerPlaceFacts:718, sceneAnswerWho:741, listNames:748, capFirst:753, descriptorSentence:757, onceSaid:763, peopleHereSentence:773, exitsSentence:778, stayedPreposition:783, isExitsAsk:787, isLookAroundAct:791, ledgerActionStitch:799, attachCompletedEvent:868, formatWriterFacingEvent:892, mentionAllowlistHas:946, allowlistHas:957, inventedTitleCaseNotOnAllowlist:961, isInstructionVoice:982, hasChoiceListLeak:995, prematureLoot:1003, aliveVsDeadContradiction:1014, wrongHereOnPacket:1029, proseViolatesEventPacket:1043, lookFocus:1068, lookTail:1072, beVerbFor:1081, isDroughtStubProse:1536, lastGoodGmBody:1542, cardPageParagraph:1556, isUnaskedCombatClose:1567, lastCommittedGmBody:1572, sameBeat:1577, isLastGmReprint:1584, destFromAct:1595, herePhrase:1605, castHead:1613, pickAdvanceVariant:1621, topicAdvancePool:1633, topicAdvanceStitch:1801, ledgerAdvanceBeat:1816, lastResortUsable:1820, lastResortStoryBody:1840, bookBodyAfterWriterMiss:1893, isPacketStitchProse:1916, corpseRemains:1923, stitchBankKey:1928, ledgerStitchSlots:1964, pickStitchTemplate:1998, renderHallTalkAnswer:2013, clipSpoken:2055, renderSpokenTalkFallback:2062, assemblePacketStitch:2081, prepareRetrospectiveWriterInput:2127

## src/game/contentDensity.ts
12041 B · 469 lines
- exports: NoveltyClass, getNoveltyCredit, MaterialDimension, MaterialDelta, isRefreshed, isStale, SemanticFamilyId, TemplateId, InstanceId, generateSemanticFamilyId, serializeSemanticId, parseSemanticId, HubProperties, isQualifiedHub, validateHubProperties, DensityTargets, getDensityTargets, isDensityTargetMet, DepthComponents, calculateDepthIndex, passesDepthWedge, hasCriticallyLowComponent, FamilyUsage, isFamilyOverused, calculateFamilyConcentration, BeatType, isContentBearing, getBeatFamily
- functions: getNoveltyCredit:43, isRefreshed:100, isStale:108, generateSemanticFamilyId:145, serializeSemanticId:158, parseSemanticId:165, isQualifiedHub:201, validateHubProperties:209, isGenericLocation:228, getDensityTargets:272, isDensityTargetMet:321, calculateDepthIndex:354, passesDepthWedge:368, hasCriticallyLowComponent:375, isFamilyOverused:396, calculateFamilyConcentration:416, isContentBearing:448, getBeatFamily:463

## src/game/contentFilterProfile.ts
7384 B · 178 lines
- exports: ContentFilterProfileId, ImageSafetyMode, ContentFilterProfile, BYOK_DISCLAIMER_TEXT, resolveContentFilterProfile, hasByokKeysConfigured, isByokProfile, profileAllowsNsfwCatalog, profileAllowsExplicitIntimateProse
- functions: resolveContentFilterProfile:91, hasByokKeysConfigured:160, isByokProfile:167, profileAllowsNsfwCatalog:171, profileAllowsExplicitIntimateProse:175

## src/game/contentModeRules.ts
2557 B · 29 lines
- exports: KID_MODE_RULES, ADULT_MODE_RULES, NSFW_CAMPAIGN_RULES, CORE_HARD_RAILS, STORE_HARD_RAILS, WEB_HARD_RAILS, UNIVERSAL_HARD_RAILS, resolveHardRailsPrompt

## src/game/contentPostFilter.ts
1590 B · 53 lines
- exports: postFilterGmOutput
- functions: postFilterGmOutput:21

## src/game/cosmeticCatalog.ts
36890 B · 1160 lines
- exports: DiceMaterial, ThemeTexture, CosmeticSlot, ShopItem, SHOP_CATALOG, THEME_ITEMS, SLOT_LABELS, shopItemById, themeTextureOf, themeKitItems, isRaceKitPart, RACE_THEME_ITEMS, OTHER_THEME_ITEMS
- functions: attachRaceThemeKits:1041, shopItemById:1126, themeTextureOf:1130, themeKitItems:1134, isRaceKitPart:1154

## src/game/cosmeticEntitlements.ts
1505 B · 54 lines
- exports: allCatalogIds, loadOwnedCosmetics, isOwned, unlockCosmetic, ensureTestCosmeticUnlock
- functions: allCatalogIds:11, loadOwnedCosmetics:15, isOwned:31, unlockCosmetic:36, ensureTestCosmeticUnlock:50

## src/game/craftBookCompiler.ts
25232 B · 763 lines
- exports: CraftWhen, CraftSignal, CraftRule, CraftLedger, CraftCompileResult, noteThumbsDownFeedback, consumeThumbsDownSignal, CRAFT_RULES, classifyCraftWhen, compileCraftRules, formatCraftSnapshotLines, CraftProgressionPolicy, craftProgressionPolicy, isCraftStarvedPad, applyCraftLearning, craftRulesForMode, assertCraftAuthorityBudget, stampCraftApplied, proseIgnoresCraft
- functions: noteThumbsDownFeedback:47, consumeThumbsDownSignal:51, lastPlayerText:446, lastGmText:457, classifyCraftWhen:465, lastBeatLooksAtmosphere:491, detectDrought:499, scoreRule:524, compileCraftRules:540, formatCraftSnapshotLines:577, craftProgressionPolicy:593, isCraftStarvedPad:626, applyCraftLearning:645, craftRulesForMode:671, assertCraftAuthorityBudget:675, stampCraftApplied:679, proseIgnoresCraft:695

## src/game/craftKeepers.ts
2376 B · 75 lines
- exports: CraftKeeper, resetCraftKeepers, listCraftKeepers, noteThumbsUpKeeper, formatLikedKeeperForPrompt
- functions: asMode:21, excerpt:26, resetCraftKeepers:34, listCraftKeepers:38, noteThumbsUpKeeper:43, formatLikedKeeperForPrompt:66

## src/game/criticDualReview.ts
7255 B · 147 lines
- exports: CriticLens, buildStoryStandaloneCriticPrompt, buildGameVibePaceCriticPrompt
- functions: buildStoryStandaloneCriticPrompt:43, buildGameVibePaceCriticPrompt:86

## src/game/crowdAuthority.ts
20645 B · 530 lines
- exports: CrowdBucket, CrowdHeadcount, CROWD_ENTER, CROWD_LEAVE, crowdBucket, canonicalCrowdPhrase, isNonPersonToken, isAggregateToken, isOccupancyToken, isPersonToken, isNamedPersonToken, countPersonTokens, crowdFluxInText, resolveCrowdHeadcount, calculateCrowdSize, crowdSizeForWarden, formatCrowdSnapshotLine, formatCrowdBindingLine, formatPresenceForSnapshot, syncPresentToCount, CrowdMention, detectCrowdMention, listCrowdMentions, normalizeCrowdRewriteArtifacts, scrubInventedCrowdSize, harvestCrowdIntoSceneFacts
- functions: crowdBucket:87, canonicalCrowdPhrase:96, isNonPersonToken:113, isAggregateToken:118, isOccupancyToken:122, isPersonToken:126, isNamedPersonToken:133, countPersonTokens:140, crowdFluxInText:144, extrasBeyondPresent:149, resolveCrowdHeadcount:165, calculateCrowdSize:205, crowdSizeForWarden:215, formatCrowdSnapshotLine:225, formatCrowdBindingLine:239, formatPresenceForSnapshot:251, syncPresentToCount:259, parseNumberWord:267, mention:282, detectCrowdMention:287, listCrowdMentions:327, applyCase:359, normalizeCrowdRewriteArtifacts:368, spansCanonicalPhrase:405, scrubInventedCrowdSize:421, harvestCrowdIntoSceneFacts:477

## src/game/customBlank.ts
1054 B · 30 lines
- exports: blankBibleIdForMode, resolveCustomBlankBible, archetypePrefersBlankCanvas
- functions: blankBibleIdForMode:6, resolveCustomBlankBible:12, archetypePrefersBlankCanvas:22

## src/game/customExpertDraft.ts
17252 B · 508 lines
- exports: LoreCategory, NpcDisposition, ExpertLoreDraft, ExpertNpcDraft, ExpertQuestDraft, ExpertCustomDraft, emptyExpertDraft, ExpertSectionId, randomizeExpertSection, randomizePcFields, randomizeSimplePitch, buildPlayerCampaignBible, expertDraftReady
- functions: emptyExpertDraft:55, pick:76, randomizeExpertSection:269, randomizePcFields:329, randomizeSimplePitch:345, buildPlayerCampaignBible:353, expertDraftReady:492

## src/game/customTabletopRules.ts
2258 B · 59 lines
- exports: CUSTOM_TABLETOP_RULES_MAX_CHARS, clipCustomTabletopRules, hasCustomTabletopRules, formatCustomTabletopRulesForPrompt
- functions: clipCustomTabletopRules:11, hasCustomTabletopRules:26, formatCustomTabletopRulesForPrompt:34

## src/game/dailyMilestoneLedger.ts
2036 B · 55 lines
- exports: DAILY_QUEST_MILESTONE_XP, applyDailyQuestMilestone
- functions: utcDayKey:11, hasAward:15, applyDailyQuestMilestone:23

## src/game/db.ts
6834 B · 203 lines
- exports: loadGame, saveGame, deleteGame, loadSettings, saveSettings, exportSave, importSave
- functions: openDb:13, loadGame:27, saveGame:59, deleteGame:69, migrateDiceAnimation:82, loadSettings:89, saveSettings:137, exportSave:146, importSave:172

## src/game/debugLogger.ts
18013 B · 539 lines
- exports: DebugLogEntry, DebugSessionStats, debugLogger
- functions: generateUUID:13, getOrCreateDeviceId:46, readSessionId:56, readSessionStartedAt:66, collectTelemetry:76, estimateEntryBytes:104, isPriority:112

## src/game/defaults.ts
7247 B · 229 lines
- exports: CURRENT_SAVE_VERSION, isPlayableSave, createInitialState, createDefaultSettings
- functions: isPlayableSave:10, createInitialState:14, createDefaultSettings:152

## src/game/densityValidation.ts
14538 B · 502 lines
- exports: GateResult, validateDensityGate, validateExhaustionGate, validateMilestoneGate, validateDepthWedge, validateLitRPGPacing, validateAllGates, formatGateResult
- functions: validateDensityGate:60, validateExhaustionGate:132, validateMilestoneGate:196, validateDepthWedge:266, validateLitRPGPacing:323, validateAllGates:416, formatGateResult:477

## src/game/diegeticFallbacks.ts
9192 B · 276 lines
- exports: getDiegeticFallback, isMetaRecoveryString, scrubMetaRecoveryStrings
- functions: getDiegeticFallback:23, getCombatStuckFallback:62, getTravelBlockedFallback:83, getInspectExhaustedFallback:125, getNoProgressFallback:153, getOpeningFallback:168, getGenericFallback:196, pickRandom:215, isMetaRecoveryString:225, scrubMetaRecoveryStrings:253

## src/game/difficultyRules.ts
2354 B · 75 lines
- exports: Difficulty, DifficultyRow, DIFFICULTY_TABLE, difficultyFromStrictness, difficultyRow
- functions: difficultyFromStrictness:66, difficultyRow:72

## src/game/discoveryXpLedger.ts
13396 B · 471 lines
- exports: DiscoveryKey, DiscoveryType, DiscoveryRecord, XpAward, buildDiscoveryKey, isDiscoveryExhausted, hasDiscoveryBeenAwarded, recordDiscovery, calculateDiscoveryXp, calculateResolutionXp, calculateRiskXp, updateDiscoveryLedger, calculateInspectXpShare, checkLevelingPace, DiscoveryXpTelemetry, trackDiscoveryXpMetrics
- functions: buildDiscoveryKey:62, isDiscoveryExhausted:71, hasDiscoveryBeenAwarded:89, recordDiscovery:108, calculateDiscoveryXp:146, calculateResolutionXp:272, calculateRiskXp:300, updateDiscoveryLedger:326, calculateInspectXpShare:355, checkLevelingPace:385, trackDiscoveryXpMetrics:442

## src/game/distributionChannel.ts
4455 B · 132 lines
- exports: DistributionChannel, getDistributionChannel, isStoreDistribution, isWebDistribution, distributionLabel, allowsNsfwCatalog, allowsExplicitIntimateProse, allowsByokMode, canConfigurePlayerAiKeys, isByokTierWithoutHostedKeys, shouldUseHostedImageProxy, BYOK_TEXT_KEY_REQUIRED, BYOK_IMAGE_KEY_REQUIRED, resolveClientTextApiKey, resolveClientImageApiKey, resolveByokImageSpendKey
- functions: getDistributionChannel:15, isStoreDistribution:27, isWebDistribution:31, distributionLabel:36, allowsNsfwCatalog:43, allowsExplicitIntimateProse:51, allowsByokMode:56, canConfigurePlayerAiKeys:64, isByokTierWithoutHostedKeys:76, shouldUseHostedImageProxy:89, resolveClientTextApiKey:108, resolveClientImageApiKey:116, resolveByokImageSpendKey:124

## src/game/drive.ts
9230 B · 282 lines
- exports: CloudSave, setAccessToken, hasAccessToken, tryRestoreToken, buildCloudSave, syncToDrive, fetchCloudSave, cloudSaveToLocal, fetchCloudTimestamp, fetchUserBirthDate, calculateAge, fetchCloudSaveSlot
- functions: setAccessToken:58, hasAccessToken:68, tryRestoreToken:72, authHeaders:90, findSaveFileId:95, buildCloudSave:103, syncToDrive:133, updateManifest:163, fetchCloudSave:192, cloudSaveToLocal:205, fetchCloudTimestamp:228, fetchUserBirthDate:238, calculateAge:254, fetchCloudSaveSlot:264

## src/game/dungeonCard.ts
34179 B · 763 lines
- exports: DUNGEON_CARD_BLUEPRINT, isDungeonCard, DungeonBiomeContext, dungeonBiomeContext, buildDungeonCard, openDungeonCard, parkDungeonCard, dungeonRoomFacts, dungeonCardChoices, advanceDungeonCard
- functions: isDungeonCard:109, siteHub:113, themeFor:117, biomeFromText:128, modifiersIn:132, dungeonBiomeContext:140, pick:179, foePool:183, findPlace:191, buildDungeonCard:200, hereLabel:375, openDungeonCard:381, parkDungeonCard:408, currentNode:428, withNode:432, mod:436, rollLine:441, payDungeonXp:448, nearestUnexploredStep:460, liveFoe:482, spawnFoe:486, dungeonRoomFacts:516, dungeonCardChoices:538, advanceDungeonCard:566

## src/game/dungeonLifecycle.ts
5257 B · 156 lines
- exports: placeAllowsDungeon, openDungeonAtSite, closeDungeon, shouldAutoCloseDungeon, maybeAutoCloseDungeon, buildInteriorFloorPlan
- functions: placeAllowsDungeon:13, openDungeonAtSite:30, markPlaceDungeonRef:67, closeDungeon:95, shouldAutoCloseDungeon:131, maybeAutoCloseDungeon:148

## src/game/dungeonMobLedger.test.ts
4109 B · 148 lines
- functions: testDungeon:12

## src/game/dungeonMobLedger.ts
7142 B · 202 lines
- exports: CURRENT_SAVE_REPAIR_REVISION, NodeMob, LooseNodeItem, DUNGEON_NEUTRALIZED_MILESTONE, isCombatLocked, mobCountsAsRemaining, normalizeDungeonMobLedger, restoreParkedEncounter, parkMobHpAtCurrentNode, markDefeatedMobAtCurrentNode, countRemainingMobsOnDungeon
- functions: isCombatLocked:17, mobCountsAsRemaining:21, normalizeMob:28, normalizeHidden:52, normalizeDungeonNodes:76, normalizeDungeonMobLedger:93, restoreParkedEncounter:106, parkMobHpAtCurrentNode:136, markDefeatedMobAtCurrentNode:162, countRemainingMobsOnDungeon:191

## src/game/dungeonPresence.ts
1135 B · 31 lines
- exports: remainingDungeonMobs
- functions: remainingDungeonMobs:5

## src/game/dungeonSeed.ts
18651 B · 549 lines
- exports: MobRole, HiddenLoot, CHEST_GRADE_LABELS, PITY_THRESHOLDS, rollLootRarity, rollLootRarityWithPity, seedDungeonState, currentDungeonNode, interactablesFromNode, mergeSheetWithNode, formatHiddenRoomLedger, openLootableInDungeon, LootSource, ResolveLootOptions, resolveSeededRarity, markLootablesOpenedOnGain, NodeHidden
- functions: isEpicPlus:42, rollLootRarity:47, rollLootRarityWithPity:58, nodeTags:95, isBossNode:99, buildHiddenForNode:104, seedDungeonState:207, currentDungeonNode:236, interactablesFromNode:242, mergeSheetWithNode:277, formatHiddenRoomLedger:292, openLootableInDungeon:354, rarityRank:377, maxRarity:381, bumpBand:385, runFloorRarity:390, resolveSeededRarity:409, markLootablesOpenedOnGain:528

## src/game/encounterAftermath.ts
13484 B · 526 lines
- exports: EncounterReceiptType, EncounterReceipt, QuestUpdate, NpcConsequence, DungeonProgress, LedgerReconciliation, generateEncounterReceipt, createIdempotencyKey, hasReceiptBeenApplied, markReceiptApplied, applyEncounterReceipt, reconcileReceiptAgainstLedgers
- functions: generateEncounterReceipt:81, createIdempotencyKey:142, hasReceiptBeenApplied:155, markReceiptApplied:166, applyEncounterReceipt:195, reconcileReceiptAgainstLedgers:264, calculateEncounterXp:313, determineLoot:346, buildResourceDeltas:374, buildRelationshipDeltas:420, buildQuestUpdates:433, buildNpcConsequences:449, buildDungeonProgress:468, applyQuestUpdate:484, applyDungeonProgress:510

## src/game/encounterBible.ts
5067 B · 116 lines
- exports: selectCatalogEncounter, catalogDroughtNames, isCatalogFoeTalkForbidden, livingCatalogTalkTargets, EncounterSeed, allCatalogEncounters, catalogFoeNames, encountersForMode, findCatalogEncounter, isCatalogFoeName
- functions: inferCatalogTier:27, hereHubId:43, seedLegal:58, scoreSeed:65, selectCatalogEncounter:78, catalogDroughtNames:94, isCatalogFoeTalkForbidden:104, livingCatalogTalkTargets:112

## src/game/encounterBiomeMatrix.ts
13774 B · 481 lines
- exports: BiomeMatrixEntry, BiomeMatrix, loadBiomeMatrix, clearBiomeMatrixCache, filterByBiome, isTemplateLegalForBiome, getDroughtFallback, validateWrongBiblePrevention, detectBiome, isWrongBibleEncounter, validateEncounterBiome
- functions: loadBiomeMatrix:44, parseBiomeMatrixCsv:83, parseCsvLine:125, clearBiomeMatrixCache:154, filterByBiome:166, isTemplateLegalForBiome:249, getDroughtFallback:302, validateWrongBiblePrevention:319, detectBiome:386, isWrongBibleEncounter:427, validateEncounterBiome:458

## src/game/encounterDensity.ts
13027 B · 517 lines
- exports: DensityProfile, DensityState, EncounterHistory, DroughtCheck, SaturationCheck, VarietyScore, getDensityProfile, getDensityState, updateDensityState, checkDrought, checkSaturation, hasRoleQuota, getAvailableRoles, scoreTemplateVariety, rankByVariety, selectEncounterWithDensity, shouldSpawnEncounter
- functions: getDensityProfile:78, getDensityState:138, updateDensityState:163, checkDrought:191, checkSaturation:220, hasRoleQuota:255, getAvailableRoles:275, scoreTemplateVariety:303, rankByVariety:336, selectEncounterWithDensity:359, shouldSpawnEncounter:449

## src/game/encounterResolution.ts
13680 B · 449 lines
- exports: EncounterSpec, EncounterType, EncounterTrigger, EncounterResponse, EncounterPhase, EncounterOutcome, ResourceChange, RelationshipChange, shouldTriggerEncounter, buildEncounterSpec, formatEncounterInitiation, validateEncounterResolution, formatEncounterAftermath, EncounterTelemetry, trackEncounterMetrics
- functions: shouldTriggerEncounter:109, buildEncounterSpec:171, formatEncounterInitiation:263, validateEncounterResolution:323, formatEncounterAftermath:375, trackEncounterMetrics:430

## src/game/encounterResolutionMechanics.ts
14933 B · 580 lines
- exports: SeededRng, HpLedgerSnapshot, CombatResolution, DamageRoll, CombatTerminal, FleeAttempt, FleeProgress, ParleyThreshold, ParleyResolution, D20Roll, ProgressClock, DangerClock, RacingClocks, createSeededRng, nextRandom, rollD20, rollDamage, captureHpSnapshot, validateHpChanges, shouldForceTerminal, forceTerminalResolution, initFleeProgress, attemptFlee, initParley, attemptParley, resolveD20Check, evaluateRacingClocks, advanceRacingClocks
- functions: createSeededRng:135, nextRandom:145, hashSeed:160, rollD20:173, rollDamage:182, captureHpSnapshot:205, validateHpChanges:235, shouldForceTerminal:273, forceTerminalResolution:299, initFleeProgress:358, attemptFlee:372, initParley:425, attemptParley:439, resolveD20Check:474, evaluateRacingClocks:530, advanceRacingClocks:556

## src/game/encounterStakes.ts
7919 B · 265 lines
- exports: MaterializedStake, MaterializedApproach, materializeStakes, isApproachLegal, getLegalApproaches, validateActionHonesty
- functions: materializeStakes:38, evaluateRequirements:74, evaluateRequirement:98, evaluateConditions:169, isApproachLegal:187, getLegalApproaches:222, validateActionHonesty:233

## src/game/encounterTelegraph.ts
6750 B · 228 lines
- exports: TelegraphCatalogEntry, TelegraphCatalog, loadTelegraphCatalog, clearTelegraphCache, selectTelegraphCues, buildTelegraphContext, isSurpriseEligible
- functions: loadTelegraphCatalog:54, clearTelegraphCache:107, selectTelegraphCues:118, buildTelegraphContext:190, isSurpriseEligible:212

## src/game/encounterTemplateLoader.ts
8810 B · 331 lines
- exports: initializeEncounterTemplates, getEncounterRegistry, EncounterSelection, selectEncounterTemplate
- functions: normalizeTemplate:147, loadLibrary:225, initializeEncounterTemplates:244, getEncounterRegistry:265, selectEncounterTemplate:281

## src/game/encounterTerminalFsm.ts
16838 B · 488 lines
- exports: EncounterPhase, TerminalOutcome, EncounterClearedReceipt, EncounterCaps, encounterCapsForMode, initEncounterTerminal, isEncounterIdleIntent, fleeAvailable, parleyAvailable, TickEncounterResult, ENCOUNTER_REENGAGE_COOLDOWN, tickEncounterTerminal, detectParleySuccessInProse, settleParleyAfterProse, isEncounterOnCooldown, formatEncounterClearedStatus, forceClearIfStale, isEncounterEngaged, encounterBlocksTravel, canTravelInFsmState, canInspectInFsmState, canShopInFsmState, getAllowedCombatActions
- functions: encounterCapsForMode:33, initEncounterTerminal:41, isFleeIntent:66, isParleyIntent:70, isAttackIntent:74, isEncounterIdleIntent:79, fleeAvailable:91, parleyAvailable:97, resolveForcedOutcome:102, tickEncounterTerminal:134, detectParleySuccessInProse:215, settleParleyAfterProse:233, attachLastKillOnVictory:269, commitClear:301, isEncounterOnCooldown:348, formatEncounterClearedStatus:354, forceClearIfStale:369, isEncounterEngaged:380, encounterBlocksTravel:386, canTravelInFsmState:399, canInspectInFsmState:418, canShopInFsmState:431, getAllowedCombatActions:444

## src/game/engineFight.ts
8206 B · 167 lines
- exports: EngineFightResult, resolveEngineFight
- functions: nameKey:30, encounterKind:34, payEncounterXp:42, resolveEngineFight:70

## src/game/enterInterior.ts
6831 B · 167 lines
- exports: playerEntersInterior, alreadyInSeededDungeon, buildConvenienceStoreDungeon, maybeAdvanceDungeonRoom, maybeEnterInteriorDungeon
- functions: playerEntersInterior:15, alreadyInSeededDungeon:21, storeNodes:25, buildConvenienceStoreDungeon:54, maybeAdvanceDungeonRoom:108, maybeEnterInteriorDungeon:131

## src/game/entitlementSync.ts
6684 B · 211 lines
- exports: EntitlementSyncResult, syncEntitlementsFromServer
- functions: parsePlanId:29, planIdFromSubscriptionRow:39, emitSettings:52, syncEntitlementsFromServer:65

## src/game/entityCast.ts
10639 B · 377 lines
- exports: CastMember, AnonymousGroup, ThreatEntity, Cast, buildEntityCast, getCastSummary
- functions: buildEntityCast:55, extractNamedCharacters:72, extractHubArrivalContact:145, extractAnonymousEntities:168, extractActiveThreats:220, determineThreatState:239, generateConstraints:251, formatCastBlock:283, findFirstSeenTurn:335, isProperName:350, getCastSummary:357

## src/game/entityRegistry.ts
16799 B · 414 lines
- exports: isCommonRoleNpc, isBareHonorificTitle, isTitlePlusGiven, isHubContactProperName, canHarvestAsNamedPerson, isRegisteredNpc, isRegisteredLocation, isRegisteredEntity, getRegisteredNpcs, getRegisteredLocations
- functions: isCommonRoleNpc:236, isBareHonorificTitle:244, isTitlePlusGiven:252, isRegistryProperName:258, isHubContactProperName:294, canHarvestAsNamedPerson:321, isRegisteredNpc:348, isRegisteredLocation:360, isRegisteredEntity:389, getRegisteredNpcs:404, getRegisteredLocations:411

## src/game/errorRepairWarden.test.ts
5466 B · 137 lines

## src/game/errorRepairWarden.ts
21919 B · 560 lines
- exports: CURRENT_ERROR_REPAIR_REVISION, FailureClass, TurnFailKind, ErrorRepairNote, ErrorRepairResult, GM_PROXY_TIMEOUT_DEFAULT_MS, GM_PROXY_TIMEOUT_FREE_DEFAULT_MS, GM_PROXY_TIMEOUT_EARLY_MS, GM_PROXY_TIMEOUT_FIRST_POST_OPEN_MS, TURN_TRANSPORT_MAX_AUTO_RETRIES, TURN_TRANSPORT_RETRY_BACKOFF_MS, TURN_TRANSPORT_RATE_LIMIT_BACKOFF_MS, TURN_TRANSPORT_DNS_PAUSE_MS, gmProxyTimeoutMsForState, classifyTurnFailure, turnFailPlayerMessage, turnFailExhaustedMessage, turnTransportRetryMessage, shouldAutoRetryTurn, transportRetryBackoffMs, isDnsResolutionFailure, applyErrorRepairs, FAILURE_CLASS_OWNERS
- functions: gmProxyTimeoutMsForState:87, classifyTurnFailure:103, turnFailPlayerMessage:144, turnFailExhaustedMessage:164, turnTransportRetryMessage:177, shouldAutoRetryTurn:185, transportRetryBackoffMs:197, isDnsResolutionFailure:208, repairLockedNameCover:213, stampAloneArrival:226, repairAloneStarterQuest:261, repairCircleBlessingSlot:306, repairOrphanCircleBlessing:328, repairChromePresent:348, repairUnregisteredEntities:380, repairAtmosphereMapRooms:410, repairLastKillFromLog:428, repairDeniedPcName:440, repairHookLock:462, applyErrorRepairs:478

## src/game/evalHarness.ts
21360 B · 689 lines
- exports: EvalResult, EvalSuite, evalNpcExitLatency, evalNpcDuplicateReveals, evalNpcMemoryRetrieval, evalNpcObligations, evalNpcTurnoverDeterminism, evalEncounterResolution, evalEncounterTelegraph, evalEncounterBiome, evalEncounterDensity, evalEncounterAftermath, evalPyoaCrisisRepetition, evalPyoaSiblingLocks, evalPyoaEndings, evalPyoaDelayedPayoffs, evalPyoaMutex, evalRegressionCombatPurgatory, evalRegressionPassiveGm, evalRegressionPadLoop, evalRegressionTheaterBranching, runEvaluationSuite, ReceiptLivenessGates, checkReceiptLivenessGates, validateEvalRun
- functions: isNpcLifecyclePhase:37, getNpcTurnoverAction:41, retrieveMemoriesForNpc:47, checkDensityViolations:55, validateExclusiveFacts:60, evalNpcExitLatency:94, evalNpcDuplicateReveals:127, evalNpcMemoryRetrieval:160, evalNpcObligations:200, evalNpcTurnoverDeterminism:237, evalEncounterResolution:273, evalEncounterTelegraph:303, evalEncounterBiome:327, evalEncounterDensity:352, evalEncounterAftermath:368, evalPyoaCrisisRepetition:398, evalPyoaSiblingLocks:424, evalPyoaEndings:440, evalPyoaDelayedPayoffs:460, evalPyoaMutex:484, evalRegressionCombatPurgatory:495, evalRegressionPassiveGm:502, evalRegressionPadLoop:521, evalRegressionTheaterBranching:549, runEvaluationSuite:560, checkReceiptLivenessGates:618, validateEvalRun:646

## src/game/exclusiveFactsRegistry.ts
9354 B · 301 lines
- exports: SHARED_FACT_GROUPS, FactConflictError, assertExclusiveFacts, getFactGroups, isExclusiveFact, getGroupOwner, validateRegistry
- functions: assertExclusiveFacts:169, getFactGroups:227, isExclusiveFact:234, getGroupOwner:241, validateRegistry:258

## src/game/exhaustionCurve.ts
13981 B · 537 lines
- exports: DensityEvent, createDensityEvent, classifyNovelty, RollingMetrics, calculateRollingMetrics, calculateExhaustionIndex, ExhaustionState, getExhaustionState, getDirectorAction, ContentDensityState, initContentDensityState, recordDensityEvent, markTerminalNode, isFamilySuppressed, checkDurableDeltaTiming, hasRepeatDominance, hasTerminalLoop, formatExhaustionSummary
- functions: createDensityEvent:56, classifyNovelty:94, calculateRollingMetrics:146, calculateExhaustionIndex:260, getExhaustionState:287, getDirectorAction:297, initContentDensityState:342, recordDensityEvent:359, markTerminalNode:410, isFamilySuppressed:426, checkDurableDeltaTiming:440, hasRepeatDominance:487, hasTerminalLoop:511, formatExhaustionSummary:518

## src/game/factLocks.ts
7491 B · 191 lines
- exports: FactLockKind, FactLockViolation, detectFactLockViolations, applyFactLocks, buildFactLockRetryBlock
- functions: clockAllowsSkip:43, playerAskedKit:49, crowdIsLoud:53, detectFactLockViolations:59, splitSentences:114, lockSentence:119, sanitizeSystemBlock:147, applyFactLocks:160, buildFactLockRetryBlock:180

## src/game/factionStandings.ts
29848 B · 585 lines
- exports: standingFromInfluence, SUMMONED_PACT_FACTIONS, HERO_AWAKENING_FACTIONS, FactionContact, FACTION_CONTACTS, matchFactionContact, StanceTreatment, detectStanceTreatment, SYSTEM_INTEGRATION_FACTIONS, GATEBREAK_WARD_FACTIONS, ASCENDING_SPIRE_FACTIONS, FABLED_LEGACY_FACTIONS, INKBOUND_ACADEMY_FACTIONS, VOID_AUDIENCE_FACTIONS, HOLLOW_CORE_FACTIONS, DUNGEON_TRANSPORT_FACTIONS, CURSED_KEEP_FACTIONS, SALT_ROAD_FACTIONS, seedFactionStandingsForBible, seedWorldLedgerFactions, mutateFactionOnStance, QuestFactionEvent, mutateFactionOnQuestEvent
- functions: standingFromInfluence:10, clampInfluence:18, withStanding:22, matchFactionContact:162, detectStanceTreatment:214, resolveTargetFactionId:230, contactWeight:240, factionIdFromLore:322, seedFactionsFromLore:335, seedFactionStandingsForBible:348, seedWorldLedgerFactions:363, mutateFactionOnStance:382, mutateFactionOnQuestEvent:562

## src/game/fateAutoplay.ts
95566 B · 2452 lines
- exports: AiAgentMode, FateMode, FateAutoplayCliOpts, MatrixCombo, TurnTelemetry, RunSummary, isBlankCanvasBible, enumerateLaunchMatrix, enumeratePremadesOnce, buildBalancedMatrix40, matrixBudgetLines, buildNewGameState, stampOpening, headlessFateTurn, runFateAutoplay, parseFateArgs, EngineMode, disableAutoplayTestLab, enableAutoplayTestLab
- functions: goalSteerPick:240, uid:411, percentile:415, latencyStats:421, isBlankCanvasBible:428, enumerateLaunchMatrix:433, enumeratePremadesOnce:463, buildBalancedMatrix40:493, matrixBudgetLines:551, resolvePersonalities:575, buildNewGameState:595, stampOpening:718, extractQuestUnlocksFromTurn:751, extractEquippedItems:760, extractUsedItems:771, detectLoopFlags:791, pickGoalOrientedChoice:805, saveWriterPrompt:884, callGmWithRetries:902, headlessFateTurn:962, safeJsonLine:2041, runFateAutoplay:2063, parseFateArgs:2388

## src/game/fatePick.ts
855 B · 29 lines
- exports: Rng, mulberry32, pickFateChoice
- functions: mulberry32:9, pickFateChoice:20

## src/game/fixtures/snapshotEvalPack.subset.ts
19850 B · 809 lines
- exports: SnapshotEvalSuite, SnapshotEvalExpect, SnapshotEvalSnap, SnapshotEvalRow, SNAPSHOT_EVAL_SUBSET
- functions: snap:40

## src/game/fluidChatEval.test.ts
7929 B · 222 lines

## src/game/fluidProseRails.ts
10569 B · 101 lines
- exports: MODE_STORY_AUTHORITY, formatModeStoryAuthorityLine, MODE_GOLD_SHAPE, formatGoldShapeForPrompt, formatFluidProseRailsForPrompt
- functions: formatModeStoryAuthorityLine:24, formatGoldShapeForPrompt:92, formatFluidProseRailsForPrompt:97

## src/game/folkVoiceExpectations.ts
18470 B · 355 lines
- exports: FolkVoiceProfile, FolkVoiceFormatOptions, FOLK_VOICE_PROFILES, detectActiveFolkIds, formatFolkVoiceForPrompt
- functions: collectFolkSearchText:269, textHasLabel:291, detectActiveFolkIds:301, formatCrossFolkCues:312, formatFolkVoiceForPrompt:320

## src/game/forceLatest.ts
6209 B · 203 lines
- exports: FORCE_LATEST_RELOAD_KEY, UPDATING_COPY, normalizeStamp, compareStamps, shouldReload, shouldReloadClient, parseDeployedStampFromHtml, parseVersionJson, parseDeployedPayload, deployedKey, clearStaleClientBits, showUpdatingOverlay, fetchDeployedStamps, runForceLatestGate, bindForceLatestOnReturn
- functions: normalizeStamp:13, compareStamps:17, shouldReload:27, shouldReloadClient:32, parseDeployedStampFromHtml:43, parseVersionJson:50, parseDeployedPayload:61, deployedKey:74, clearStaleClientBits:79, showUpdatingOverlay:103, fetchText:115, fetchDeployedStamps:121, alreadyReloadedFor:136, markReloaded:144, clearReloadMark:152, runForceLatestGate:164, bindForceLatestOnReturn:196

## src/game/forwardProgressGovernor.ts
15863 B · 525 lines
- exports: ProgressDeltaKind, ProgressDelta, ProgressGovernorState, detectProgressDeltas, checkProgressGovernor, updateProgressGovernor, initProgressGovernor, hasActiveObjectives
- functions: detectProgressDeltas:45, detectQuestDeltas:83, detectDiscoveryDeltas:144, detectAccessDeltas:170, detectRelationshipDeltas:215, detectThreatDeltas:287, detectResourceDeltas:328, detectCharacterDeltas:379, checkProgressGovernor:413, updateProgressGovernor:462, initProgressGovernor:492, hasActiveObjectives:503

## src/game/founderLogin.ts
1923 B · 49 lines
- exports: FounderLoginEnv, FOUNDER_EMAIL_DENIED, founderLoginAllowlist, founderEmailLoginEnabled, isFounderLoginEmail
- functions: envString:14, splitEmails:22, founderLoginAllowlist:30, founderEmailLoginEnabled:37, isFounderLoginEmail:43

## src/game/freeMudPresentation.ts
10939 B · 291 lines
- exports: FREE_MUD_PRESENTATION_ENABLED, SILENT_ENGINE, MudPresentationKind, FreeMudTurn, shouldUseFreeMudPresentation, shouldSkipMicroFlavor, isSilentReceiptAction, shouldUseSilentMudTurn, buildFactualReceipt, formatMicroFlavorPrompt, gateMicroFlavorQuote, composeFreeMudTurn, mudDisplayBody
- functions: shouldUseFreeMudPresentation:44, shouldSkipMicroFlavor:52, isSilentReceiptAction:60, shouldUseSilentMudTurn:87, buildFactualReceipt:97, formatMicroFlavorPrompt:154, titleCaseTokens:177, allowlistCovers:188, gateMicroFlavorQuote:210, composeFreeMudTurn:251, mudDisplayBody:286

## src/game/freeT12Hook.ts
4933 B · 143 lines
- exports: hasDurableDeltaByT12, durableDeltaReason, recordT12HookReceipt, forceFreeT12DurableDelta
- functions: hasDurableDeltaByT12:10, durableDeltaReason:22, recordT12HookReceipt:42, forceFreeT12DurableDelta:81

## src/game/fullProseGate.ts
1797 B · 55 lines
- exports: MIN_PROSE_WORDS, MIN_PROSE_SENTENCES, MIN_TOKEN_PROSE_LINES, countProseWords, countProseSentences, isFullProseNarration
- functions: countProseWords:10, countProseSentences:14, isFullProseNarration:24

## src/game/gameEngine.ts
2333 B · 59 lines
- exports: RollOutcome, evaluateRoll, simulateMerchantTurn
- functions: evaluateRoll:15, simulateMerchantTurn:35

## src/game/geminiCriticPrompt.ts
15624 B · 306 lines
- exports: GeminiCriticSessionMeta, buildPlayerCapacityContext, buildGeminiCriticPrompt
- functions: personalityLabel:32, agentExplain:49, buildPlayerCapacityContext:66, engineModeLabel:119, buildGeminiCriticPrompt:151

## src/game/gmProxy.ts
12963 B · 347 lines
- exports: GmProxyMode, isGmProxyRequired, isClientGmAllowed, isGmProxyAvailable, gmProxyHost, hostedBackendDiagnostics, invokeGmProxy, invokeImageProxy
- functions: isGmProxyRequired:23, isClientGmAllowed:28, isGmProxyAvailable:32, gmProxyUrl:36, gmProxyHost:42, hostedBackendDiagnostics:51, pickClientApiKey:65, invokeGmProxy:71, imageProxyUrl:243, invokeImageProxy:252

## src/game/gmVoiceProfile.test.ts
8697 B · 200 lines

## src/game/gmVoiceProfile.ts
21806 B · 447 lines
- exports: GmVoiceProfileId, GmPersonalityId, SystemPersonalityId, GmVoiceProfile, GM_VOICE_FIREWALL, GM_VOICE_PROFILES, DEFAULT_TABLETOP_GM_PERSONALITY, DEFAULT_RPG_GM_PERSONALITY, DEFAULT_PYOA_GM_PERSONALITY, DEFAULT_LITRPG_SYSTEM_PERSONALITY, TABLETOP_GM_PERSONALITIES, TABLETOP_GM_PERSONALITIES_MORE, TABLETOP_GM_PERSONALITIES_ALL, LAUNCH_LITRPG_SYSTEM_PERSONALITY_IDS, LAUNCH_GM_PERSONALITY_IDS, LITRPG_SYSTEM_PERSONALITIES, LITRPG_FEATURED_SYSTEM_PERSONALITIES, LITRPG_SYSTEM_PERSONALITIES_SHOP, isGmPersonalityId, isSystemPersonalityId, isGmVoiceProfileId, resolveGmVoiceProfile, resolveTabletopGmPersonality, resolveRpgGmPersonality, resolvePyoaGmPersonality, resolveLitrpgSystemPersonality, suggestedThemeForVoice, resolveVoiceIdForState, formatGmVoiceForPrompt
- functions: isGmPersonalityId:308, isSystemPersonalityId:312, isGmVoiceProfileId:316, resolveGmVoiceProfile:320, resolveTabletopGmPersonality:324, resolveRpgGmPersonality:328, resolvePyoaGmPersonality:332, resolveLitrpgSystemPersonality:336, suggestedThemeForVoice:340, resolveVoiceIdForState:345, formatGmVoiceForPrompt:374

## src/game/grammarCheck.ts
3282 B · 119 lines
- exports: GrammarMatch, GrammarCheckResult, checkGrammar, applyGrammarFixes, quickGrammarCheck, fullGrammarCheck
- functions: getLanguageTool:30, checkGrammar:45, applyGrammarFixes:71, quickGrammarCheck:107, fullGrammarCheck:116

## src/game/graphChoices.ts
9458 B · 264 lines
- exports: EdgeType, StateEdge, ChoiceHistoryEntry, classifyEdgeType, enumerateLegalEdges, applySemanticCooldown, edgesToChoiceLabels, historyFromRecentChoices, compileGraphChoiceLabels, inferEdgeIntent
- functions: isOutdoorScene:42, extraHubs:53, classifyEdgeType:58, enumerateLegalEdges:74, applySemanticCooldown:204, edgesToChoiceLabels:219, historyFromRecentChoices:223, compileGraphChoiceLabels:234, inferEdgeIntent:261

## src/game/hookArc.ts
3585 B · 113 lines
- exports: HookArcStage, HookArcState, emptyHookArc, deriveHookArc, withUpdatedHookArc, SoftOfferContext, canSoftOffer, formatHookArcStatus
- functions: emptyHookArc:26, hasIdentity:36, hasFirstChoice:47, hasConsequence:52, deriveHookArc:59, withUpdatedHookArc:78, canSoftOffer:93, formatHookArcStatus:109

## src/game/hookLock.ts
13626 B · 377 lines
- exports: HookNature, HookLockSource, HookLock, HookMention, listHookMentions, detectHookNature, classifyHookNature, lockHookFromText, seedHookLockFromPickedHook, resolveHookLock, hookLockForWarden, formatHookBindingLine, hookManifestFact, hookForbiddenReversal, detectHookContradiction, naturesConflict, talkContradictsLockedWhy, factionNoteForHook, alignFactionNotesToHook, playerMayReviseHook, reviseHookLock, scrubBoughtHereSlip, scrubHookReversals, harvestHookIntoSceneFacts, attachHookLock, backfillHookLockFromSave
- functions: applyCase:68, mention:76, collect:86, listHookMentions:95, naturePriority:107, detectHookNature:120, classifyHookNature:131, lockHookFromText:135, seedHookLockFromPickedHook:150, resolveHookLock:159, hookLockForWarden:167, formatHookBindingLine:174, hookManifestFact:182, hookForbiddenReversal:186, detectHookContradiction:191, naturesConflict:199, talkContradictsLockedWhy:210, factionNoteForHook:227, alignFactionNotesToHook:239, playerMayReviseHook:250, reviseHookLock:258, scrubBoughtHereSlip:275, opposingNatures:280, scrubHookReversals:290, harvestHookIntoSceneFacts:313, attachHookLock:346, backfillHookLockFromSave:362

## src/game/hostedImageModel.test.ts
682 B · 19 lines

## src/game/hostedImageModel.ts
966 B · 25 lines
- exports: HOSTED_SCHNELL_MODEL, HOSTED_HERO_MODEL, HOSTED_IMAGE_FALLBACKS, resolveHostedImageModel
- functions: resolveHostedImageModel:21

## src/game/hubEncounters.ts
54394 B · 605 lines
- exports: HubBeatKind, HubArrivalBeat, pickHubArrivalBeat, hubVisitCount, resolveHubArrival, atMappedHubAfterOpening, formatHubArrivalForPrompt, hubArrivalChoicePads, hubBeatAwardKey
- functions: banksForBible:485, filterByTier:490, pickHubArrivalBeat:502, hubVisitCount:514, resolveHubArrival:519, atMappedHubAfterOpening:534, formatHubArrivalForPrompt:539, hubArrivalChoicePads:576, hubBeatAwardKey:602

## src/game/imageGen.ts
3354 B · 81 lines
- exports: generateImage, softenPrompt, ImageModerationError
- functions: buildFinalPrompt:12, modeFromSettings:16, generateImage:20, softenPrompt:73

## src/game/imagePromptModifier.ts
2016 B · 24 lines
- exports: buildImagePromptModifier
- functions: buildImagePromptModifier:4

## src/game/inputMediation.ts
6270 B · 168 lines
- exports: MediationAction, MediationResult, mediatePlayerInput
- functions: mediatePlayerInput:55

## src/game/intentContract.ts
15038 B · 426 lines
- exports: ObligationKind, Obligation, IntentContract, ObligationCoverage, buildIntentContract, checkUnresolvedObligations, formatIntentContractForPrompt, checkObligationCoverage, buildObligationRetryBlock, introductionPermitForName, IntroductionPermit, IntroductionPermitSource
- functions: isPlayerQuestion:17, uid:61, openAskThreads:65, silencedThreads:73, buildIntentContract:88, checkUnresolvedObligations:212, formatIntentContractForPrompt:242, proseOnly:257, checkObligationCoverage:269, buildObligationRetryBlock:408

## src/game/intentEnums.ts
11936 B · 363 lines
- exports: PlayerIntent, INTENT_DISPLAY_LABELS, inferIntent, getIntentLabel, isCombatIntent, isTravelIntent, isInspectIntent, isSocialIntent
- functions: inferIntent:155, getIntentLabel:296, isCombatIntent:303, isTravelIntent:317, isInspectIntent:335, isSocialIntent:352

## src/game/intentParser.ts
13607 B · 336 lines
- exports: CANNED_SAFER_SCENE_LINE, isSaferSceneLeak, IntentKind, PlayerIntent, GroundedPlayerAction, playerVisibleActionText, resolvePlayerActionLines, gmFacingPlayerAction, playerTypedDialogue, isAskNearbyPerson, isRoomLayoutExploreAsk, isSpeechOrProtest, primaryActionClause, parsePlayerIntent, groundPlayerAction
- functions: isSaferSceneLeak:17, playerVisibleActionText:61, resolvePlayerActionLines:72, gmFacingPlayerAction:91, playerTypedDialogue:100, isAskNearbyPerson:128, isRoomLayoutExploreAsk:150, isSpeechOrProtest:167, primaryActionClause:194, parsePlayerIntent:217, sceneSpeaker:249, groundPlayerAction:265

## src/game/interiorFloorPlan.test.ts
8917 B · 199 lines

## src/game/interiorGenerator.ts
15429 B · 335 lines
- exports: InteriorKind, RoomRole, InteriorTemplate, MULTI_FLOOR_WORDS, interiorTemplates, GeneratedRoom, GeneratedInterior, GenerateInteriorOptions, generateInterior
- functions: fromBuildingLayout:53, fromBlueprint:69, interiorTemplates:89, pick:134, distances:138, farthest:153, generateInterior:159

## src/game/introductionPermit.ts
1417 B · 44 lines
- exports: IntroductionPermitSource, IntroductionPermit, introductionPermitForName
- functions: introductionPermitForName:18, escapeRe:41

## src/game/inventory.ts
7744 B · 230 lines
- exports: InventoryCapacity, getEquippedContainers, getPrimaryGeneralContainer, getItemsInContainer, getContainerUsed, syncContainerOccupancy, computeInventoryCapacity, canAddItem, canAddMaterials, addMaterials, removeItem, addItem, getItemValue
- functions: getEquippedContainers:22, getPrimaryGeneralContainer:26, isGeneralStorage:35, getItemsInContainer:44, getContainerUsed:86, findContainerWithSpace:90, syncContainerOccupancy:105, computeInventoryCapacity:131, canAddItem:162, canAddMaterials:171, addMaterials:193, removeItem:208, addItem:215, getItemValue:226

## src/game/inventoryArt.test.ts
2355 B · 66 lines
- functions: worn:11

## src/game/inventoryArt.ts
2964 B · 85 lines
- exports: InventoryArtPatch, CharacterLikeness, characterLikeness, portraitCacheKey, hasPortraitSeed, equippedItemsNeedingIcons, needsPortraitRefresh, itemIconPrompt, paperDollPrompt
- functions: equippedGearLine:17, characterLikeness:27, portraitCacheKey:46, hasPortraitSeed:50, equippedItemsNeedingIcons:56, needsPortraitRefresh:60, itemIconPrompt:67, paperDollPrompt:73

## src/game/inventoryConservation.ts
15006 B · 484 lines
- exports: ItemStateTransition, TransitionKind, ConservationViolation, InventoryAuthority, buildInventoryAuthority, detectInventoryTransitions, checkInventoryConservation, validateInventoryChanges, buildInventoryConservationRetryBlock, snapshotInventory, restoreInventoryFromSnapshot, InventoryTelemetry, trackInventoryMetrics, calculateBagStability
- functions: buildInventoryAuthority:65, detectInventoryTransitions:97, checkInventoryConservation:182, validateInventoryChanges:303, buildInventoryConservationRetryBlock:355, snapshotInventory:399, restoreInventoryFromSnapshot:406, trackInventoryMetrics:429, calculateBagStability:455

## src/game/kidModeSafety.ts
8420 B · 193 lines
- exports: isKidMode, kidSafeArtDirective, stripKidUnsafeImageLexicon, isUnsalvageableKidImagePrompt, prepareKidSafeImagePrompt, filterKidModeText, filterKidModeVisible, filterKidModeVisibleList, skipKidUnsafeInstructionBlocks
- functions: isKidMode:18, kidSafeArtDirective:22, stripKidUnsafeImageLexicon:71, isUnsalvageableKidImagePrompt:86, prepareKidSafeImagePrompt:101, filterKidModeText:135, filterKidModeVisible:146, filterKidModeVisibleList:154, matchesUnsafe:162, skipKidUnsafeInstructionBlocks:171

## src/game/leakScanner.ts
1420 B · 41 lines
- exports: LeakScanResult, scanAndScrubLeaks
- functions: scanAndScrubLeaks:17

## src/game/ledgerCombat.ts
6480 B · 196 lines
- exports: LedgerFleeRound, LedgerCombatRound, equippedWeaponName, spawnRoomEncounter, resolveLedgerFlee, resolveLedgerCombat, itemLooksLikeWeapon, remainingDungeonMobs
- functions: equippedWeaponName:34, spawnRoomEncounter:46, resolveLedgerFlee:91, resolveLedgerCombat:144, itemLooksLikeWeapon:193

## src/game/ledgerFlee.test.ts
2981 B · 96 lines
- functions: combatState:8

## src/game/ledgerNounObey.ts
5395 B · 156 lines
- exports: inventedPersonNamesNotOnAllowlist, obeyLedgerNouns, acceptObeyedStoryBody
- functions: splitSentences:30, tidy:34, inventedPersonNamesNotOnAllowlist:43, scrubCastAsPermit:63, dropOrRewriteInvented:86, obeyLedgerNouns:98, acceptObeyedStoryBody:139

## src/game/ledgerRevision.ts
2110 B · 72 lines
- exports: currentLedgerRevision, nextLedgerRevision, withBumpedLedgerRevision, appendSpeculativeTake, RevisionAcceptResult, acceptProposedState
- functions: currentLedgerRevision:11, nextLedgerRevision:16, withBumpedLedgerRevision:20, appendSpeculativeTake:27, acceptProposedState:51

## src/game/ledgerSlice345.test.ts
6701 B · 176 lines
- functions: trapDungeonState:17

## src/game/ledgerTrap.ts
3043 B · 103 lines
- exports: LedgerTrapRound, resolveLedgerTrap, formatTrapReceipt, armedTrapOnNode
- functions: markTrapOnNode:16, resolveLedgerTrap:41, formatTrapReceipt:94, armedTrapOnNode:99

## src/game/leverageMechanics.ts
8273 B · 295 lines
- exports: registerLeverageAsset, exhaustLeverageAsset, isLeverageExhausted, getPressureProfile, resolveLeverage, getLeverageTypeName, getLeverageTypeDescription
- functions: registerLeverageAsset:25, exhaustLeverageAsset:71, isLeverageExhausted:92, getPressureProfile:111, inferNpcRole:135, inferFears:159, inferWants:168, inferDuties:177, inferTaboos:186, npcKey:195, resolveLeverage:209, getLeverageTypeName:265, getLeverageTypeDescription:279

## src/game/litrpgSystemWindow.ts
4357 B · 127 lines
- exports: LitrpgSystemWindow, storyMentionsSystemPanel, playerAskedAboutSystemPanel, playerLockedNameThisLine, isOpeningSystemPingLine, shouldAttachLitrpgSystemWindow, buildLitrpgSystemWindow, ledgerSheetLine, withLitrpgSystemWindow
- functions: storyMentionsSystemPanel:17, playerAskedAboutSystemPanel:23, playerLockedNameThisLine:27, isOpeningSystemPingLine:31, lockedSystemName:35, priorGmCount:49, shouldAttachLitrpgSystemWindow:53, buildLitrpgSystemWindow:67, ledgerSheetLine:93, withLitrpgSystemWindow:104

## src/game/liveDrive.ts
17818 B · 497 lines
- exports: LiveDriveFlag, LiveDriveTurnRecord, reopenCoversForLiveDrive, LiveDriveScriptId, liveDriveAltHumanLines, liveDriveScriptedLines, pickLiveDriveLine, criticLiveDriveTurn, headlessOpeningContinueTurn, liveDriveGeminiBrief, formatLiveDriveTurnForGemini
- functions: uid:57, reopenCoversForLiveDrive:61, inspectLine:95, liveDriveAltHumanLines:108, liveDriveScriptedLines:166, pickLiveDriveLine:194, lockedName:204, titleTokens:212, padGrounded:225, criticLiveDriveTurn:233, headlessOpeningContinueTurn:350, liveDriveGeminiBrief:435, formatLiveDriveTurnForGemini:457

## src/game/locality.ts
4285 B · 115 lines
- exports: FirearmsNorm, LocalityToken, deriveLocalityToken, formatLocalityForPrompt, applyLocalityWarden
- functions: deriveLocalityToken:25, formatLocalityForPrompt:77, applyLocalityWarden:99

## src/game/locationDiscovery.ts
6307 B · 231 lines
- exports: isLocationDiscovered, discoverLocation, discoverLocations, detectAndDiscoverLocations, getDiscoveredSettlements, filterDiscoveredFactions
- functions: isLocationDiscovered:20, discoverLocation:59, discoverLocations:106, detectAndDiscoverLocations:120, getDiscoveredSettlements:191, filterDiscoveredFactions:204, escapeRegex:228

## src/game/locationMemory.ts
1744 B · 54 lines
- exports: advanceLocationMemory
- functions: cloneSheet:4, samePlace:13, advanceLocationMemory:24

## src/game/locationName.ts
3180 B · 85 lines
- exports: cleanPlaceLabel, playerFacingLocation, encounterOriginPlace
- functions: cleanPlaceLabel:8, playerFacingLocation:16, encounterOriginPlace:47, isCityScaleOrigin:67, stripTimeClause:77

## src/game/logger.ts
5544 B · 181 lines
- exports: LogLevel, LogEntry, logger
- functions: pushEntry:33, formatArg:156, handleGlobalError:166, handleGlobalRejection:175

## src/game/loiterDeltaDirective.ts
4853 B · 177 lines
- exports: injectLoiterDelta, buildLoiterDeltaDirective, needsLoiterDelta
- functions: injectLoiterDelta:17, isLoiterFamily:64, calculateTimeJump:84, generateDeltaDirective:94, buildLoiterDeltaDirective:136, needsLoiterDelta:158

## src/game/looseItems.ts
2428 B · 69 lines
- exports: parkInventoryOnNode, parseLooseItemPickup, pickUpLooseItem
- functions: updateNodeLooseItems:6, newId:21, parkInventoryOnNode:26, parseLooseItemPickup:39, pickUpLooseItem:45

## src/game/lootTableRegistry.ts
25002 B · 689 lines
- exports: LootEntry, LootTable, ModeLootTables, LootCatalog, LootReceipt, generateLoot, getLootPreview, validateLootCommit, convertDuplicateUniques, applyBossBuildGuarantee, LootProfile, LootProfileRow, LOOT_PROFILES, chestProfileForGrade, profileForEncounter, LootItemCategory, LEGENDARY_POOL, CLASS_FIT_SHARE, classFitCategories, SGM_COIN_PURSE, SGM_TREASURE_CACHE, sgmItemRarity, LootRollResult, rollLoot
- functions: seededRandom:91, parseQuantity:105, selectLootEntries:118, generateLoot:196, getLootPreview:254, validateLootCommit:270, convertDuplicateUniques:292, applyBossBuildGuarantee:320, chestProfileForGrade:387, profileForEncounter:392, rarityIdx:403, classFitCategories:445, pickFrom:462, rollDie:466, rollDice:470, crNumber:476, crBand:488, sgmItemRarity:512, makeItem:536, rollLoot:578

## src/game/manusTopicBanks.ts
5609 B · 163 lines
- exports: AuthoredTopicLine, MERCHANT_STOCK_FACT, authoredTopicsFor, merchantStockFactFor, roleVoiceFactFor, pickAuthoredTopicLine, authoredTopicForState
- functions: norm:121, bankKey:125, authoredTopicsFor:132, merchantStockFactFor:136, roleVoiceFactFor:143, pickAuthoredTopicLine:148, authoredTopicForState:159

## src/game/mapEngine.ts
66608 B · 1653 lines
- exports: MobRole, NodeHiddenLoot, NodeHidden, InteriorEdgeKind, MapNode, MapBlueprint, ActiveDungeonState, CORE_BLUEPRINTS, generateProceduralBlueprint, initializeDungeon, isInteriorSecretUnlocked, moveToNode, exitDungeon, buildLocalAreaMap, lookLikeEntrance, presentLocalAreaMap, addLandmarkToLocalMap, shortRoomLabel, shortBuildingTitle, InteriorFillKind, interiorRoomFillKind, InteriorBuildingScale, interiorBuildingScale, interiorFloorLabel, listInteriorZLevels, nodesOnInteriorFloor, roomHasVerticalLink, InteriorRoomSpec, SHED_LAYOUTS, RUIN_LAYOUTS, GRAND_LAYOUTS, resolveInteriorEdgeKind, interiorExitNoun, InteriorRoomBox, interiorDoorAnchor, interiorFootprintsAreVaried, listInteriorExitsFromHere, isCameraRelativePad, formatGraphExitToken, graphExitPads, matchGraphExitPad, dungeonHereLabel, applyGraphExitTravel, formatInteriorExitAuthority, formatInteriorExploreAuthority, revealInteriorSecret, buildInteriorFloorPlan, presentInteriorMap, addRoomToInteriorMap, resolvePlayAreaMap
- functions: generateProceduralBlueprint:160, initializeDungeon:253, isInteriorSecretUnlocked:293, moveToNode:306, exitDungeon:328, uniqueNames:332, usableStreetLabel:346, nextStreetSlot:365, buildLocalAreaMap:375, lookLikeEntrance:436, presentLocalAreaMap:443, addLandmarkToLocalMap:489, usableInteriorHere:517, usableInteriorRoom:524, shortRoomLabel:583, shortBuildingTitle:607, interiorRoomFillKind:640, isAuthoredInterior:649, interiorBuildingScale:656, interiorFloorLabel:668, listInteriorZLevels:673, nodesOnInteriorFloor:678, roomHasVerticalLink:682, needsAuthoredInteriorRebuild:690, nextInteriorSlot:724, pickInteriorLayout:974, resolveInteriorEdgeKind:991, interiorExitNoun:1001, interiorDoorAnchor:1017, interiorFootprintsAreVaried:1048, listInteriorExitsFromHere:1059, exitFacingLabel:1076, isCameraRelativePad:1091, formatGraphExitToken:1098, graphExitPadLabel:1110, graphExitPads:1123, matchGraphExitPad:1138, dungeonHereLabel:1173, applyGraphExitTravel:1182, formatInteriorExitAuthority:1198, formatInteriorExploreAuthority:1219, buildEdgeKindsForSpec:1239, applyHarvestedRoomNames:1261, unlockInteriorSecretOnNodes:1311, revealInteriorSecret:1345, buildInteriorFloorPlan:1361, presentInteriorMap:1425, addRoomToInteriorMap:1493, sameAreaMap:1549, resolvePlayAreaMap:1573

## src/game/mapPlaces.test.ts
4308 B · 96 lines
- functions: scaleState:22

## src/game/masterPrompt.ts
27593 B · 527 lines
- exports: buildMasterPrompt, buildSystemPrompt, buildContextPrompt
- functions: buildMasterPrompt:458

## src/game/maturity.ts
6183 B · 159 lines
- exports: MaturityTier, DarkThemesLevel, MaturityToggles, defaultMaturityToggles, resolveMaturity, formatMaturityRules, SoftRewrite, maybeRatingRewrite
- functions: defaultMaturityToggles:15, resolveMaturity:24, formatMaturityRules:43, maybeRatingRewrite:98

## src/game/memorableMoments.test.ts
4812 B · 120 lines
- functions: openingInput:14

## src/game/memorableMoments.ts
40662 B · 1140 lines
- exports: MEMORABLE_COOLDOWN_TURNS, FIRST_SESSION_HARD_CAP, FIRST_SESSION_SOFT_CAP, FIRST_SESSION_TURN_HORIZON, SESSION_HARD_CAP, SESSION_SOFT_CAP, PYOA_ENDING_MIN_TURN, SITTING_STALE_MS, MemorableBeatKind, ResolveMemorableInput, DetectedBeautyOffer, MemorableDecision, isClassicMemorableEnabled, emptyMemorableState, plateCopyForBeat, splashPlateLabel, splashUnavailableLine, resolveSitting, sittingHardCap, isSittingHardBlocked, detectPlayerDeath, pinOpeningHereScene, synthesizeMemorablePrompt, FIRST_DUNGEON_BLUEPRINT_ID, firstDungeonBossAlreadyConsumed, isCampaignFirstDungeonGraph, detectDungeonFinalBossDefeat, detectRulerAudience, detectNoteworthyBeauty, detectPyoaCampaignEnding, resolveMemorableMoment, memorableBypassesWeeklyCap, openingSplashStillDue, decideClassicMemorable, memorableLogFields, applyAcceptedBeautyOffer, applyDismissedBeautyOffer
- functions: isClassicMemorableEnabled:79, emptyMemorableState:85, plateCopyForBeat:90, splashPlateLabel:126, splashUnavailableLine:135, priorStoryBody:143, onCooldown:147, resolveSitting:153, sittingHardCap:164, isSittingHardBlocked:168, offerBlocked:173, detectPlayerDeath:185, isLegendaryRarity:197, kidModeOn:201, pinOpeningHereScene:215, synthesizeMemorablePrompt:245, excerptForImage:325, pickPrompt:337, nextSplashStamp:342, appendStoryPlate:352, stamp:365, stampOffer:389, uniqueKeys:406, fire:412, offerDecision:442, isDesignatedBossNode:460, normalizeMobLabel:469, dungeonHasCorruptedStockboy:473, pinFirstDungeonGraph:482, firstDungeonBossAlreadyConsumed:491, isCampaignFirstDungeonGraph:502, detectDungeonFinalBossDefeat:520, lookFromInput:546, detectOpening:551, normalizePersonKey:599, titleCaseLabel:603, isGenericRulerKey:611, detectRulerAudience:615, escapeRegExp:687, isPlayerSubject:694, isPersonLabel:701, detectNoteworthyBeauty:706, detectPyoaCampaignEnding:766, resolveMemorableMoment:789, memorableBypassesWeeklyCap:1002, openingSplashStillDue:1006, decideClassicMemorable:1010, memorableLogFields:1055, applyAcceptedBeautyOffer:1081, applyDismissedBeautyOffer:1126

## src/game/merchant.ts
2183 B · 76 lines
- exports: getSellPrice, getMaterialSellPrice, SellResult, sellItem, sellMaterial
- functions: getSellPrice:12, getMaterialSellPrice:18, sellItem:36, sellMaterial:54

## src/game/metaInputRecovery.ts
15720 B · 512 lines
- exports: MetaComplaintType, MetaComplaint, RecoveryAction, NarrativeNoveltyBudget, detectMetaComplaint, buildRecoveryAction, initNoveltyBudget, checkParagraphNovelty, checkSentenceNovelty, updateNoveltyBudget, banExpositionTopic, isTopicBanned, buildNoveltyRetryBlock, MetaRecoveryTelemetry, trackMetaRecoveryMetrics
- functions: detectMetaComplaint:56, buildRecoveryAction:147, initNoveltyBudget:313, checkParagraphNovelty:324, checkSentenceNovelty:357, updateNoveltyBudget:381, banExpositionTopic:426, isTopicBanned:439, buildNoveltyRetryBlock:457, trackMetaRecoveryMetrics:496

## src/game/mysteryCulprit.ts
4686 B · 118 lines
- exports: pickMysteryCulprit, resolveMysteryCulprit, stampMysteryCulprit, applyAccusationFromInput, formatHiddenCulpritRail
- functions: hashSeed:4, pickFromPool:13, pickMysteryCulprit:18, resolveMysteryCulprit:25, stampMysteryCulprit:36, applyAccusationFromInput:66, formatHiddenCulpritRail:92

## src/game/narrativeHarvest.ts
10615 B · 278 lines
- exports: harvestNarrativeIntoLedger, scrubInventedGeography
- functions: extractRegisteredNpcs:41, extractProperNamesFromProse:76, ensureNpcMemory:97, ensureNpcLore:102, harvestNarrativeIntoLedger:130, scrubInventedGeography:259

## src/game/narrativeSanitize.ts
7507 B · 196 lines
- exports: extractSystemRollBlocks, sanitizeNarrativeMechanics, trimAbruptCutoff, stripResidualMechanicTags, narrativeMentionsPlayerHarm, ensureTurnProse, ensureDamageNarration, ensureEncounterNarration, ensureXpNarration, stripUnearnedXpProse
- functions: extractSystemRollBlocks:18, sanitizeNarrativeMechanics:30, trimAbruptCutoff:75, stripResidualMechanicTags:102, narrativeMentionsPlayerHarm:110, ensureTurnProse:118, ensureDamageNarration:140, ensureEncounterNarration:154, isPositiveXpLogLine:166, ensureXpNarration:172, stripUnearnedXpProse:186

## src/game/narrativeScrub.ts
16254 B · 409 lines
- exports: scrubInventedProperNouns, buildProtectedEntityNames, scrubSomeoneNearbyActor, scrubOfficialPlaceholder, withProtectedChromeBlocks, scrubPolityBleedInChrome, scrubSpeakerLeak
- functions: groundedPresentNames:13, scrubInventedProperNouns:43, atNamedInterior:86, personSlotFromScene:96, buildProtectedEntityNames:120, isProtectedName:149, guessGenericReplacement:158, scrubSomeoneNearbyActor:211, dropPlaceholderActorClauses:226, scrubOfficialPlaceholder:242, withProtectedChromeBlocks:285, scrubPolityBleedInChrome:304, scrubSpeakerLeak:323, replaceUngroundedName:349, escapeReg:357, buildLooseGroundSet:361

## src/game/narrativeTranslator.ts
10570 B · 387 lines
- exports: translateStateToNarrative, isUiLabel, choiceContainsUngroundedReferences
- functions: translateStateToNarrative:28, translateLocation:77, translatePresence:99, translateTension:163, translateExits:181, naturalizeExitLabel:205, translateObjectives:239, translateInventory:259, isUiLabel:280, isNamedNpc:301, isProperName:309, translateUiToken:317, choiceContainsUngroundedReferences:338, isGenericTerm:376

## src/game/narratorProvider.ts
3014 B · 101 lines
- exports: NarratorTier, NarratorRequest, NarratorResponse, NarratorProvider, createFreeNarratorProvider, resolveNarratorProvider
- functions: toResponse:37, createFreeNarratorProvider:55, resolveNarratorProvider:95

## src/game/neverCast.ts
5412 B · 137 lines
- exports: ledgerConceptTitles, ledgerNeverCastTitles, isNeverCastTitle, isPlaceTitlePersonSubject, isPlaceTitleTalkPad, matchesRegisteredLocationNeedle
- functions: escapeRe:17, pushUnique:21, ledgerConceptTitles:28, ledgerNeverCastTitles:56, isNeverCastTitle:81, isPlaceTitlePersonSubject:99, isPlaceTitleTalkPad:110, matchesRegisteredLocationNeedle:124

## src/game/newGameTestState.ts
2242 B · 56 lines
- exports: seedPickingCast, newGameState, rosterRecord
- functions: seedPickingCast:13, newGameState:22, rosterRecord:48

## src/game/npcCrossIntegration.ts
13543 B · 510 lines
- exports: propagateKnowledge, isFactionDenied, filterKnowledgeByFaction, RelationshipAspect, DirectionalRelationship, updateRelationship, getRelationshipValue, NpcTrait, getNpcTraits, hasNpcTrait, modulateRelationshipDelta, NpcConversation, recordNpcConversation, getConversationsForNpc, getConversationsBetween, buildCrossNpcSituationSection
- functions: propagateKnowledge:36, isFactionDenied:83, filterKnowledgeByFaction:96, updateRelationship:152, getRelationshipValue:251, getNpcTraits:288, hasNpcTrait:298, modulateRelationshipDelta:311, recordNpcConversation:377, getConversationsForNpc:431, getConversationsBetween:442, buildCrossNpcSituationSection:466

## src/game/npcLifecycleFsm.ts
16140 B · 615 lines
- exports: NpcLifecycleState, NpcLifecycle, EXIT_WINDOW_TURNS, GRACE_PERIOD_TURNS, initNpcLifecycle, getOrCreateLifecycle, TurnoverCheck, checkLifecycleTurnover, advanceLifecycleState, updateNpcLifecycle, transformNpcRole, forceNpcExit, updateAllNpcLifecycles, getActiveLifecycles, getExitWindowLifecycles, getApproachingDeadlines, shouldNpcExit, getLifecycle, buildLifecycleSituationSection, formatLifecycleMandates
- functions: initNpcLifecycle:86, getOrCreateLifecycle:106, checkLifecycleTurnover:136, advanceLifecycleState:219, updateNpcLifecycle:276, transformNpcRole:390, forceNpcExit:411, updateAllNpcLifecycles:433, getActiveLifecycles:491, getExitWindowLifecycles:500, getApproachingDeadlines:509, shouldNpcExit:535, getLifecycle:545, buildLifecycleSituationSection:560, formatLifecycleMandates:610

## src/game/npcMemory.ts
23575 B · 650 lines
- exports: mergeNpcMemoriesFromTurn, recordNpcTreatmentFromAction, findNpcMemory, hasMetBefore, getCompletedTopics, sentenceLooksLikeSelfIntro, scrubNpcIntroRepeat, rememberPlayerName, upsertHarvestedNpcMemory, seedBibleNpcRoster, isMerchantMemory, isQuestGiverMemory, npcShouldExit, hasPurchasedFrom, isBuyPlayerAction, recordMerchantPurchases, markQuestGiverExit, applyNpcExitToPresent, isKindSocialPad, isHardSocialPad, isRepeatPurchasePad, dispositionBlocksPad, applySocialLedgerTurn, formatNpcMemoriesForPrompt
- functions: normalizeName:12, mergeNpcMemoriesFromTurn:19, treatmentLabel:90, findTargetNpc:98, recordNpcTreatmentFromAction:119, uniqueTopics:166, memoryMatchesNpc:170, findNpcMemory:180, hasMetBefore:188, getCompletedTopics:198, escapeRe:205, sentenceLooksLikeSelfIntro:209, scrubNpcIntroRepeat:224, rememberPlayerName:248, upsertHarvestedNpcMemory:271, rosterDisplayName:339, roleFromBibleNpc:343, bibleDisp:368, seedBibleNpcRoster:378, roleHay:415, isMerchantMemory:419, isQuestGiverMemory:423, npcShouldExit:428, hasPurchasedFrom:432, isBuyPlayerAction:443, presentNamedPeople:447, findPresentMerchant:451, findPresentQuestGiver:461, uniquePurchases:471, recordMerchantPurchases:485, questNewlyLive:512, markQuestGiverExit:529, applyNpcExitToPresent:549, isKindSocialPad:563, isHardSocialPad:569, isRepeatPurchasePad:576, dispositionBlocksPad:588, applySocialLedgerTurn:616

## src/game/npcMemoryLedger.ts
25664 B · 954 lines
- exports: NpcMemoryLedger, KeyMomentCategory, KnowledgeChannel, VisibilityScope, RetentionClass, createKeyMoment, appendKeyMoment, broadcastKeyMoment, broadcastToFaction, spreadHubGossip, getKeyMoments, getRecentKeyMoments, getKeyMomentsByCategory, hasKeyMoment, retrieveRankedMemories, cleanupOldMemories, buildMemorySituationSection, formatMemoryReference, recordFirstMeet, recordBetrayal, recordDeal, recordQuestDisposition
- functions: createDedupeKey:96, createKeyMoment:118, getDefaultRetention:161, getDefaultVisibility:189, appendKeyMoment:215, broadcastKeyMoment:282, isEligibleWitness:325, broadcastToFaction:353, spreadHubGossip:405, getKeyMoments:462, getRecentKeyMoments:473, getKeyMomentsByCategory:486, hasKeyMoment:497, retrieveRankedMemories:521, cleanupOldMemories:641, buildMemorySituationSection:703, formatKeyMomentSummary:760, formatMemoryReference:802, recordFirstMeet:840, recordBetrayal:871, recordDeal:900, recordQuestDisposition:930

## src/game/npcMemoryRetrieval.ts
10223 B · 387 lines
- exports: MemoryRelevanceScore, MemorySelection, MemoryGroundingCheck, scoreMemoryRelevance, selectMemoriesForPacket, verifyMemoryGrounding, buildNpcPacket, formatNpcPacketSection
- functions: scoreMemoryRelevance:56, stableTieBreak:124, selectMemoriesForPacket:140, verifyMemoryGrounding:218, buildNpcPacket:277, formatNpcPacketSection:346

## src/game/npcRecords.ts
5927 B · 163 lines
- exports: formatNpcMemoriesForPrompt, resolveNpcRecord, splitCompoundCastEntry, canonicalNpcName, npcRecordNames, recordsForEntries, presentNpcRecords, npcNamesAt, seedOpeningCastLocations, stampNpcLocationsOnMove, openingCastRecords, isMetNpc, syncNpcPresence
- functions: formatNpcMemoriesForPrompt:3, namesOf:19, exactRecord:23, resolveNpcRecord:29, splitCompoundCastEntry:44, canonicalNpcName:57, npcRecordNames:61, recordsForEntries:65, samePlace:79, companionRecords:85, presentNpcRecords:98, npcNamesAt:117, seedOpeningCastLocations:122, stampNpcLocationsOnMove:135, openingCastRecords:147, isMetNpc:155, syncNpcPresence:159

## src/game/npcRelationships.ts
12701 B · 391 lines
- exports: Disposition, RelationshipMilestoneType, KnowledgeChannel, RelationshipMilestone, PromiseRecord, NpcKnowledgeFact, RelationshipBoundary, NpcRelationship, RelationshipEvent, TRUST_BANDS, deriveDisposition, applyRelationshipEvent, deriveUnlocks, applyLongAbsence, relationshipUiView, getOrCreateRelationship, updateRelationship
- functions: clamp:155, hasMilestone:159, hasUnrepairedBetrayal:163, meetsBand:170, deriveDisposition:182, applyRelationshipEvent:199, upsertPromise:223, upsertKnowledge:228, deriveUnlocks:242, applyLongAbsence:260, relationshipUiView:280, getOrCreateRelationship:308, updateRelationship:362

## src/game/npcRoleRegistry.ts
42488 B · 1767 lines
- exports: NpcRole, NpcGenre, DeadlineKind, RoleDeadline, RoleObligationContract, NPC_ROLE_REGISTRY, getNpcRole, assertRoleRegistryComplete, getRoleGenreVariant, getRolesByEntranceCondition, getTransformableRoles, ROLE_OBLIGATIONS, inferNpcRole, calculateRoleDeadline, isRoleSatisfied, formatRoleObligation, formatExitMandate
- functions: getNpcRole:1544, assertRoleRegistryComplete:1551, getRoleGenreVariant:1584, getRolesByEntranceCondition:1595, getTransformableRoles:1604, inferNpcRole:1631, calculateRoleDeadline:1662, isRoleSatisfied:1703, formatRoleObligation:1743, formatExitMandate:1757

## src/game/npcTopicFsm.ts
16689 B · 504 lines
- exports: NpcTopicFsmState, TopicVersion, TopicCooldownLedger, NpcRole, NpcRoleObligation, presentNpcForPads, isTopicExhausted, recordNpcTopic, formatNpcTopicMandate, shouldForceNpcStageAdvance, advanceNpcTopicExhaustion, inferNpcRole, trackNpcRoleObligation, checkNpcRoleDeadlines, formatNpcExitMandate, reviveTopicVersion, isTopicOnCooldown, getTopicVersion, formatCooldownMandate
- functions: npcKey:43, extractNpcFromInput:47, presentNpcForPads:78, topicKey:95, isTopicExhausted:105, recordNpcTopic:114, formatNpcTopicMandate:145, shouldForceNpcStageAdvance:155, countNpcPressStreak:163, advanceNpcTopicExhaustion:181, inferNpcRole:240, trackNpcRoleObligation:278, checkNpcRoleDeadlines:321, formatNpcExitMandate:387, reviveTopicVersion:402, isTopicOnCooldown:453, getTopicVersion:473, formatCooldownMandate:490

## src/game/npcTurnover.ts
16614 B · 590 lines
- exports: TurnoverAction, TurnoverTrigger, TurnoverDecision, TurnoverReceipt, FallbackRule, decideTurnover, selectFallback, spawnSuccessor, createTurnoverReceipt
- functions: decideTurnover:96, selectFallback:283, spawnSuccessor:360, createTurnoverReceipt:389, getRoleCompletionAction:428, getTransformationPath:461, selectRelocationTarget:484, canNpcRelocate:490, getRoleFallbackRules:505, findCredibleActor:542, generateSuccessorId:548, generateSuccessorName:553, determineNewState:570

## src/game/offerOnlyAsk.ts
943 B · 25 lines
- exports: isOfferOnlyUnansweredBeat
- functions: proseOnly:4, isOfferOnlyUnansweredBeat:16

## src/game/oneCameraFight.ts
3975 B · 118 lines
- exports: isLiveFightCamera, shouldSkipTravelArrivalPrepend, isLeaveReachFightBleed, proseHasFightBleed, stampTravelArrivalIfSafe, isOneCameraFightViolation, scrubOneCameraFight, scrubLeaveReachDuringFight
- functions: isLiveFightCamera:19, shouldSkipTravelArrivalPrepend:27, isLeaveReachFightBleed:31, proseHasFightBleed:37, stampTravelArrivalIfSafe:45, isOneCameraFightViolation:59, stripLeaveReach:78, dropFightBleedSentences:82, scrubOneCameraFight:92, scrubLeaveReachDuringFight:114

## src/game/openRouterChat.test.ts
3075 B · 82 lines

## src/game/openRouterChat.ts
6613 B · 193 lines
- exports: FIREWORKS_INFERENCE_BASE, FREE_WRITER_FIREWORKS_MODEL, isFireworksWriterModel, normalizeFireworksWriterModel, hostedWriterProvider, fireworksChatHeaders, fireworksChatBody, hasHanScript, extractChatCompletionText, extractChatCompletionTexts, packGmCandidateTexts, openRouterChatHeaders, openRouterChatBody
- functions: isFireworksWriterModel:15, normalizeFireworksWriterModel:21, hostedWriterProvider:28, fireworksChatHeaders:32, fireworksChatBody:39, hasHanScript:56, extractOneChoice:60, extractChatCompletionText:80, extractChatCompletionTexts:87, packGmCandidateTexts:97, flattenChatContent:103, openRouterChatHeaders:117, openRouterChatBody:126

## src/game/openingEstablishment.test.ts
11810 B · 289 lines
- functions: summonedNameCover:32

## src/game/openingEstablishment.ts
128440 B · 3220 lines
- exports: tryHandleQuickResponseButton, characterNameIsGeneric, isRandomPlaceRequest, isOpeningSetupChipLabel, openingAnswerDisplay, playerGivesOrRefusesName, isPlayDemand, playerEngagesOpeningCover, isNameOriginKitCoverChoice, isLocationishOpeningUtterance, pickEarthPlace, pickPlaceForCampaign, openingFastSetupChipsEnabled, establishmentChoices, resolveOpeningRegistrar, formatRegistrarLine, resolveOpeningMode, normalizeOpeningHookCard, openingHookDeck, resolveOpeningHookCard, resolveOpeningHookPick, resolveOpeningHook, OpeningHookPreview, firstOpeningLine, previewOpeningHook, freshOpenerSeed, openingHayHasOccupancy, isAloneArrivalPick, isAloneArrivalOpening, styleCoversForAloneArrival, resolveOpeningPrompts, isEarthOriginPrompt, harvestEarthOriginFromProse, applyHarvestedOpeningCovers, litrpgOpeningSystemPing, seedCoverAnswers, resolveLockedOpeningPlace, pendingRequiredCovers, filterOpeningPrompts, ensureSealedOpeningBag, sealKitOpeningCovers, mergePreferredProfileIntoOpening, applySystemRename, isOpeningEstablishmentPending, isOpeningCoverTurn, lastPlayerLine, hallTalkAsksWhere, hallTalkAsksWho, isAcceptOfferLine, isOpeningNameGiveLine, hallTalkAsksWant, hallTalkAsksStayLeave, hallTalkAsksRefuse, hallTalkAsksPanel, isKitOrCarryInspect, isCoverShapedPlayerLine, playerGaveNameAndAskedMore, isHallTalkPlayerLine, isOpeningCardActLine, asksOpeningCardNoun, lineNamesOtherNpc, shouldStitchOpeningContinue, storyBeatWriterPath, isOpeningHallTalkTurn, openingCastNames, cardSceneMentionTokens, cardRoleStandIn, openingCastLabel, shortCardWant, shortCardCost, shortCardOffer, shortCardStayLeave, openingSpokenIdentityQuote, castSpeakVerb, openingWhoAskLineFromLabel, openingWhoAskLine, openingSpokenWant, openingRefuseLine, openingSpokenRefuse, openingStayLeaveLine, openingSpokenStayLeave, openingAlreadyToldLine, openingWantLine, openingCardActLine, playerAskedWhyPulled, coverContinuePads, formatPlayerCanon, buildEstablishmentIntro, extractGivenName, openingNameIsUnlocked, lockedOpeningPcName, isLitrpgSystemPanelMode, hallTalkAsksSystemPanel, proseAsksForPcName, stripLockedNameAsk, sanitizeLockedNameBeat, isOpeningIdentityCover, isCombatFamilyPad, shouldStarveCombatPadsOnCover, HallTalkTopic, hallTalkTopic, isNameTelegramProse, gmBodiesAfterFirstHallAsk, gmSpokeHallTopic, hallTopicAlreadyAnswered, shouldStarveHallTopicPad, openingNameLockSpokenBeat, countSameHallTopicRepeats, dropLockedNameCovers, applyLedgerDeficit, extractLocation, extractAppearance, extractSpecies, extractKit, stripPlayerVoice, isPowerGameClaim, sanitizeOpeningAnswer, applyOpeningAnswer, formatSetupComplete, hasSystemVoice, ensureSystemReceipt, buildOpeningSceneMandate, sanitizeOpeningNarration
- functions: tryHandleQuickResponseButton:32, characterNameIsGeneric:100, pickRandom:122, isRandomPlaceRequest:132, isOpeningSetupChipLabel:137, openingAnswerDisplay:142, appendOpeningPlayerBubble:151, playerGivesOrRefusesName:171, isPlayDemand:188, playerEngagesOpeningCover:198, isNameOriginKitCoverChoice:216, isLocationishOpeningUtterance:222, pickEarthPlace:233, originCoverIsEarth:237, pickPlaceForCampaign:249, isUnusablePlace:259, openingFastSetupChipsEnabled:282, establishmentChoices:292, resolveOpeningRegistrar:447, formatRegistrarLine:481, resolveOpeningMode:496, hashOpenerSeed:507, isWriterNoteBeat:519, normalizeOpeningHookCard:524, openingHookDeck:574, resolveOpeningHookCard:583, resolveOpeningHookPick:593, resolveOpeningHook:602, firstOpeningLine:614, previewOpeningHook:621, freshOpenerSeed:637, openingHayHasOccupancy:673, openingPickHay:680, isAloneArrivalPick:699, isAloneArrivalOpening:714, styleCoversForAloneArrival:727, inworldizePrompt:753, resolveOpeningPrompts:762, isEarthOriginPrompt:785, harvestEarthOriginFromProse:791, applyHarvestedOpeningCovers:806, litrpgOpeningSystemPing:825, seedCoverAnswers:839, resolveLockedOpeningPlace:871, pendingRequiredCovers:901, filterOpeningPrompts:910, ensureSealedOpeningBag:941, sealKitOpeningCovers:956, mergePreferredProfileIntoOpening:983, applySystemRename:1024, isOpeningEstablishmentPending:1038, isOpeningCoverTurn:1044, lastPlayerLine:1055, hallTalkAsksWhere:1066, hallTalkAsksWho:1075, isAcceptOfferLine:1086, isOpeningNameGiveLine:1099, hallTalkAsksWant:1110, hallTalkAsksStayLeave:1134, hallTalkAsksRefuse:1152, hallTalkAsksPanel:1163, isKitOrCarryInspect:1175, isCoverShapedPlayerLine:1184, playerGaveNameAndAskedMore:1207, isHallTalkPlayerLine:1222, isOpeningCardActLine:1253, inferOpeningCardNoun:1263, asksOpeningCardNoun:1271, isFirstAlreadyToldHallStitch:1291, lineNamesOtherNpc:1298, shouldStitchOpeningContinue:1311, storyBeatWriterPath:1371, isOpeningHallTalkTurn:1383, openingSceneHay:1401, openingCastNames:1415, cardSceneMentionTokens:1466, cardRoleStandIn:1484, openingCastLabel:1503, wantFromPickedHookBlob:1540, offerFromPickedHookBlob:1545, costFromPickedHookBlob:1550, clipCardClause:1555, shortCardWant:1562, shortCardCost:1571, rawCardOffer:1582, shortCardOffer:1590, shortCardStayLeave:1597, openingSpokenIdentityQuote:1609, castSpeakVerb:1623, openingWhoAskLineFromLabel:1633, openingWhoAskLine:1661, openingSpokenWant:1685, openingRefuseLine:1698, openingSpokenRefuse:1704, openingStayLeaveLine:1715, openingSpokenStayLeave:1720, pickAlreadyToldVariant:1731, openingAlreadyToldLine:1746, openingWantLine:1821, recentGmHay:1827, openingCardActLine:1838, playerAskedWhyPulled:1860, coverContinuePads:1882, formatPlayerCanon:1913, buildEstablishmentIntro:1934, softenAssumedPlace:1963, stripChoicePrefix:1970, isNameRefusalUtterance:1990, titleName:2002, titlePlace:2010, acceptHarvestedNameToken:2018, extractGivenName:2028, openingNameIsUnlocked:2050, lockedOpeningPcName:2060, isLitrpgSystemPanelMode:2071, hallTalkAsksSystemPanel:2075, proseAsksForPcName:2082, stripLockedNameAsk:2090, sanitizeLockedNameBeat:2101, isOpeningIdentityCover:2108, isCombatFamilyPad:2115, shouldStarveCombatPadsOnCover:2122, hallTalkTopic:2132, incomingAlreadyOnOpenLog:2145, isNameTelegramProse:2159, gmBodiesAfterFirstHallAsk:2171, gmSpokeHallTopic:2189, hallTopicAlreadyAnswered:2223, shouldStarveHallTopicPad:2236, openingNameLockSpokenBeat:2243, liveCoverPads:2254, countSameHallTopicRepeats:2269, dropLockedNameCovers:2293, openingSpeciesIsUnlocked:2308, applyLedgerDeficit:2316, extractLocation:2362, stripConfusion:2378, isMetaOnly:2389, extractAppearance:2395, extractSpecies:2420, extractKit:2427, stripPlayerVoice:2444, harvestUtterance:2455, fieldForKind:2477, acceptCurrentField:2487, isPowerGameClaim:2528, sanitizeOpeningAnswer:2533, grantMundaneStartingItems:2585, applyKindToState:2604, mundaneBagNamesFromKit:2655, registrarAside:2661, applyOpeningAnswer:2740, formatSetupComplete:3150, hasSystemVoice:3175, ensureSystemReceipt:3179, buildOpeningSceneMandate:3183, sanitizeOpeningNarration:3212

## src/game/openingHookDecks.test.ts
3870 B · 83 lines

## src/game/openingPin.ts
4986 B · 127 lines
- exports: extractNamesFromHookText, openingNpcFromBible, resolveOpeningPinnedNames, ensureOpeningNpcPinned, formatOpeningPinMandate
- functions: extractNamesFromHookText:14, openingNpcFromBible:41, resolveOpeningPinnedNames:52, ensureOpeningNpcPinned:76, formatOpeningPinMandate:120

## src/game/openingPointerCard.ts
16685 B · 438 lines
- exports: PointerWhoBand, PointerCardSlots, SnapshotGist, inferWhoCountFromHook, compilePointerCardSlots, formatPointerCardSlotBlock, formatPointerCardForSnapshot, formatOpeningCardChrome, buildOpeningGmPlayerInput, seedCrowdCountFromCard, openingInventBudgetZero, pointerCardAllowlist, hasOpeningInventSmashLeak, stripOpeningInventQuota, classifyOpeningContinue, buildSnapshotGist, compactTrafficGist, persistSnapshotGist, formatLastSnapshotGistLine, applyCardCrowdToFacts, compileLitrpgCoreIdentity
- functions: stripProseChrome:49, isSentenceInitial:58, lineAfter:65, slugId:70, inferWhoCountFromHook:75, compilePointerCardSlots:91, formatPointerCardSlotBlock:136, formatPointerCardForSnapshot:151, formatOpeningCardChrome:162, buildOpeningGmPlayerInput:178, seedCrowdCountFromCard:193, openingInventBudgetZero:199, pointerCardAllowlist:208, considerInventedName:234, inventedTitleNames:241, hasOpeningInventSmashLeak:261, openingCollidesEarthStreet:266, stripOpeningInventQuota:275, classifyOpeningContinue:287, buildSnapshotGist:341, compactTrafficGist:361, persistSnapshotGist:365, formatLastSnapshotGistLine:382, applyCardCrowdToFacts:388, compileLitrpgCoreIdentity:423

## src/game/openingStitch.test.ts
7513 B · 186 lines

## src/game/openingStitch.ts
15967 B · 408 lines
- exports: defaultStarterLook, applyOpeningContract, ensureStarterLookCharacter, stitchOpeningScene, synthesizeOpeningScene, stitchOpeningContinue, openingPolishAllowed, OpeningAskKind, cleanPlaceLabel
- functions: hashSeed:49, pickBank:58, defaultStarterLook:99, applyOpeningContract:104, ensureStarterLookCharacter:142, looksLikePointerDump:148, baseSceneFromCard:152, bodyAlreadyAsksCover:179, dropCoverNameAsk:186, lastGmBodies:190, clauseAlreadySpoken:201, stitchOpeningScene:221, synthesizeOpeningScene:240, lockedCoverName:244, continueIsAlone:248, inPlacePhrase:254, stitchOpeningContinue:262, finalizeContinue:393, openingPolishAllowed:402

## src/game/opsKillSwitches.ts
3850 B · 129 lines
- exports: OpsKillSwitches, getOpsKillSwitches, setOpsKillSwitchOverride, clearOpsKillSwitchOverrides, adsKilled, imagesKilled, forceFreeModel, signupsPaused, continuityStrict, comicGenKilled, comicEligibleRate
- functions: envFlag:32, envRate:40, readLocalOverride:52, getOpsKillSwitches:64, setOpsKillSwitchOverride:83, clearOpsKillSwitchOverrides:93, adsKilled:101, imagesKilled:105, forceFreeModel:109, signupsPaused:113, continuityStrict:117, comicGenKilled:121, comicEligibleRate:126

## src/game/optionDiversityContract.ts
15019 B · 483 lines
- exports: ChoiceProfile, ChoiceRole, OutcomeType, DiversityContract, OptionCooldown, DiversityViolation, classifyChoiceRole, predictOutcomeType, buildChoiceProfiles, getDiversityContract, checkDiversityContract, canonicalizeOption, isOnCooldown, updateCooldowns, filterCooldownChoices, buildDiversityRetryBlock, DiversityTelemetry, trackDiversityMetrics
- functions: classifyChoiceRole:76, predictOutcomeType:128, buildChoiceProfiles:147, getDiversityContract:165, checkDiversityContract:208, canonicalizeOption:267, isOnCooldown:275, updateCooldowns:302, getBaseCooldown:347, filterCooldownChoices:367, buildDiversityRetryBlock:396, trackDiversityMetrics:454

## src/game/outcomeToken.ts
4960 B · 119 lines
- exports: OutcomeToken, buildOutcomeToken, formatOutcomeTokenForPrompt
- functions: buildOutcomeToken:33, formatOutcomeTokenForPrompt:91

## src/game/outdoorHubs.ts
42116 B · 645 lines
- exports: OutdoorHub, SUMMONED_PACT_HUBS, HERO_AWAKENING_HUBS, SYSTEM_INTEGRATION_HUBS, GATEBREAK_WARD_HUBS, ASCENDING_SPIRE_HUBS, FABLED_LEGACY_HUBS, INKBOUND_ACADEMY_HUBS, VOID_AUDIENCE_HUBS, HOLLOW_CORE_HUBS, DUNGEON_TRANSPORT_HUBS, CURSED_KEEP_HUBS, SALT_ROAD_HUBS, SHATTERED_COAST_HUBS, hubsForBibleId, hubsForBible, seedOutdoorHubPlaces, hubLandmarkNames, visitedHubLandmarkNames, mergeHubLandmarks, matchHub, formatOutdoorHubsForPrompt, outdoorHubTravelChoices, isThornferryCluster, parseTravelDestination, applyNamedHubTravel, isLeaveSceneAction, resolveLeaveSceneDestination, ensureTravelArrivalProse, buildPlaceCard, ensurePlaceCard, placeCardFor
- functions: hubsForBibleId:204, hubsForBible:209, hubToPlace:213, seedOutdoorHubPlaces:242, hubLandmarkNames:281, visitedHubLandmarkNames:294, mergeHubLandmarks:313, matchHub:333, formatOutdoorHubsForPrompt:349, outdoorHubTravelChoices:368, isThornferryCluster:421, parseTravelDestination:430, applyNamedHubTravel:460, isLeaveSceneAction:473, resolveLeaveSceneDestination:486, ensureTravelArrivalProse:516, buildPlaceCard:575, ensurePlaceCard:618, placeCardFor:637

## src/game/packageCoordination.ts
14856 B · 442 lines
- exports: preGmCommitSequence, commitReceipt, validatePackageIntegration
- functions: preGmCommitSequence:48, deliverDueConsequences:101, checkNpcLifecycles:146, maybeSpawnEncounter:215, maybeSpawnCrisis:266, checkPyoaEndingGates:308, rebuildProjections:337, commitReceipt:366, getCurrentFacts:385, extractFactWrites:394, validatePackageIntegration:421

## src/game/padUniverse.ts
10485 B · 288 lines
- exports: ExcludedPadFamily, isTravelPad, isLeaveFamilyPad, isNamedTalkPad, isUseCharterPad, shouldStarveTalkPads, shouldStarveUsePads, shouldStarveAskPads, countRecentTravelPicks, countRecentLeavePicks, countRecentTravelOrWalkPicks, shouldStarveTravelPads, shouldStarveLeavePads, excludedPadFamilies, isExcludedPadLabel, isExcludedEdge, filterPadsByUniverse, closedUniverseFallbacks, ensureClosedUniversePad, sealPadUniverse, isExcludedPadProgress
- functions: isTalkQaLoopStarved:25, isTravelPad:36, isLeaveFamilyPad:46, isNamedTalkPad:50, isUseCharterPad:56, shouldStarveTalkPads:60, shouldStarveUsePads:66, shouldStarveAskPads:71, countRecentMatchingPicks:88, countRecentTravelPicks:105, countRecentLeavePicks:109, countRecentTravelOrWalkPicks:113, hasLiveStakes:121, shouldStarveTravelPads:130, shouldStarveLeavePads:138, excludedPadFamilies:146, isExcludedPadLabel:165, isExcludedEdge:178, filterPadsByUniverse:192, closedUniverseFallbacks:206, ensureClosedUniversePad:242, sealPadUniverse:253, isExcludedPadProgress:265

## src/game/panelBudget.ts
1357 B · 30 lines
- exports: PANEL_BUDGET_BY_FREQUENCY, resolvePanelBudget, MAX_MILESTONE_IMAGES_PER_TURN, MAX_LOOT_VIDEOS_PER_TURN
- functions: resolvePanelBudget:18

## src/game/parentPurchaseGate.ts
1904 B · 57 lines
- exports: KID_MODE_PIN_DISCLAIMER, needsParentPurchaseGate, hasParentPurchaseGrace, grantParentPurchaseGrace, clearParentPurchaseGrace, canSkipParentPurchasePrompt
- functions: needsParentPurchaseGate:14, hasParentPurchaseGrace:18, grantParentPurchaseGrace:33, clearParentPurchaseGrace:41, canSkipParentPurchasePrompt:53

## src/game/parser.ts
38678 B · 1036 lines
- exports: GameEvent, looksLikeChoiceOffer, stripChoiceList, hasNumberedChoiceLeak, hasQuestTrackerLeak, extractChoiceLines, extractUpdates, extractNewItems, parseActionTags, stripActionTags, parsePanels, parseTurnFrame, eventsToEncounterUpdate, isLoreRevealed, matchLoreCards, eventsToLoreCards, MilestoneRequest, eventsToMilestone, LootVideoRequest, eventsToLootVideo, isRadicalFormChange, VisualUpdateRequest, eventsToVisualUpdate, eventsToQuestUpdates, stripTurnCloser, isTurnCloserLine, shouldShowTurnAsk, TURN_ASK, storyHasBody, storyWordCount, isStoryTooThin, STORY_VALUE_FLOOR_WORDS
- functions: cleanChoiceText:102, looksLikeChoiceOffer:113, harvestSystemChoiceOffers:121, pushChoice:132, stripHarvestedChoiceOffers:144, stripChoiceList:182, hasNumberedChoiceLeak:291, hasQuestTrackerLeak:302, extractChoiceLines:319, extractUpdates:368, extractNewItems:409, parseActionTags:734, stripActionTags:746, parsePanels:784, parseTurnFrame:802, eventsToEncounterUpdate:813, isLoreRevealed:859, matchLoreCards:863, eventsToLoreCards:886, eventsToMilestone:906, eventsToLootVideo:918, isRadicalFormChange:942, eventsToVisualUpdate:954, eventsToQuestUpdates:961

## src/game/pcNameAuthority.ts
2539 B · 108 lines
- exports: UNNAMED_ADVENTURER, isDeniedPcName, isLockablePcName, sanitizePcName, displayAdventurerName
- functions: normalizeNameKey:73, isDeniedPcName:82, isLockablePcName:91, sanitizePcName:99, displayAdventurerName:105

## src/game/pendingTurn.ts
3999 B · 131 lines
- exports: buildPendingProposal, getProposedState, withEditedNarrative, ensureLocationSheet, touchLocationSheet
- functions: summarizeDeltas:10, buildPendingProposal:33, getProposedState:84, withEditedNarrative:90, ensureLocationSheet:108, touchLocationSheet:120

## src/game/perspectiveWarden.ts
5951 B · 124 lines
- exports: rewritePlayerBodyPossessives, enforcePerspective, rewriteNpcSubjectPcBody
- functions: clauseIsNpcSubject:18, rewritePlayerBodyPossessives:60, enforcePerspective:83, rewriteNpcSubjectPcBody:113

## src/game/placeAuthority.ts
5946 B · 137 lines
- exports: STREET_MAP_BLUEPRINT, INTERIOR_MAP_BLUEPRINT, isStreetMap, isInteriorMap, isExplorableDungeon, isInteriorPlace, resolveDangerTier, resolveThreatTier, resolveMapScale, mapScaleLabel, dangerTierLabel, normalizeSheetAuthority
- functions: isStreetMap:18, isInteriorMap:22, isExplorableDungeon:27, isInteriorPlace:34, resolveDangerTier:44, resolveThreatTier:60, resolveMapScale:83, mapScaleLabel:97, dangerTierLabel:112, normalizeSheetAuthority:118

## src/game/placeUtils.ts
401 B · 17 lines
- exports: placeIdFromName
- functions: slugify:6, placeIdFromName:14

## src/game/places.ts
5382 B · 168 lines
- exports: ensurePlaces, upsertPlaceFromSheet, touchPlaceVisit, closePlaceArc, resolvePlace, formatPlacesForPrompt, sheetFromPlace, placeIdFromName
- functions: ensurePlaces:8, upsertPlaceFromSheet:16, touchPlaceVisit:66, closePlaceArc:105, resolvePlace:124, formatPlacesForPrompt:140, sheetFromPlace:158

## src/game/playPhase.ts
1194 B · 37 lines
- exports: isPlayInputLocked, applyPlayPhaseAfterHp, deathQuestReceipt
- functions: isPlayInputLocked:5, applyPlayPhaseAfterHp:10, deathQuestReceipt:32

## src/game/playTranscript.test.ts
7490 B · 225 lines

## src/game/playTranscript.ts
24618 B · 664 lines
- exports: resolveOfferedChoices, withOfferedChoices, playTranscriptFilename, buildPlayTranscript, buildStoryReviewExport, buildNarrationOnlyStoryExport, collapseEngineFallbackNarration, narrationOnlyFromTranscriptMarkdown, downloadPlayTranscript, playDumpFilename, buildPlayTurnsJsonl, buildPlayDump, downloadPlayDump, downloadPlayDumpStaff
- functions: lastGmStoryProse:29, lastGmOfferedChoices:42, lastPlayerActionFromLog:59, resolveOfferedChoices:69, withOfferedChoices:111, slugFilenamePart:117, playTranscriptFilename:127, playMetaLines:141, buildPlayTranscript:164, buildStoryReviewExport:229, buildNarrationOnlyStoryExport:368, collapseEngineFallbackNarration:413, narrationOnlyFromTranscriptMarkdown:461, downloadPlayTranscript:495, downloadTextFile:499, playDumpFilename:509, pairPlayTurns:513, buildPlayTurnsJsonl:550, buildLoopReview:577, buildPlayDump:610, downloadPlayDump:630, downloadPlayDumpStaff:635

## src/game/playerProfile.ts
13043 B · 416 lines
- exports: PLAYER_PROFILE_EVENT, GENDER_PRESETS, PlateEvent, MetaBadge, PlateTallyRow, PlayerProfile, normalizePlayerProfile, loadPlayerProfile, hasPersonaPrefs, pronounsForGender, tallyPlateEvents, mergePlayerProfiles, pullPlayerProfileFromCloud, savePlayerProfile, recordStoryStarted, ingestCampaignPlates, ingestCampaignPlatesMany, applyUsualSelfToCharacter
- functions: emit:78, sanitizePlateEvent:86, sanitizeBadge:103, normalizePlayerProfile:117, loadPlayerProfile:147, writeLocal:157, hasPersonaPrefs:168, pronounsForGender:172, tallyPlateEvents:180, beatCount:208, withMetaBadges:269, mergePlayerProfiles:280, pushCloud:304, pullPlayerProfileFromCloud:322, savePlayerProfile:345, recordStoryStarted:358, ingestCampaignPlates:368, ingestCampaignPlatesMany:372, applyUsualSelfToCharacter:406

## src/game/playerUtterance.ts
12636 B · 309 lines
- exports: SetupAnswers, InterpretedUtterance, hasNamedClothes, isSetupRefusal, isJunkSetupValue, extractSystemRename, utteranceIsQuestionOnly, utteranceIsMessy, stripSpeechFiller, interpretPlayerUtterance
- functions: hasNamedClothes:72, isSetupRefusal:76, isJunkSetupValue:90, extractSystemRename:108, utteranceIsQuestionOnly:124, utteranceIsMessy:133, stripSpeechFiller:147, collectQuestions:158, intentFromKind:169, parseKind:175, localInterpret:202, mergeAnswers:220, interpretPlayerUtterance:230

## src/game/playtest02aResidualFixes.test.ts
10328 B · 265 lines

## src/game/playtest02aaBatch02aa.test.ts
11339 B · 252 lines
- functions: litrpgState:30, roadState:65

## src/game/playtest02acSystemsFirst.test.ts
10082 B · 269 lines
- functions: systemsState:39

## src/game/playtest02dHangDebug.test.ts
6293 B · 161 lines
- functions: findCycles:22, hubCastState:38

## src/game/playtest02fBatch02f.test.ts
19380 B · 506 lines

## src/game/playtest02gBatch02g.test.ts
4782 B · 108 lines

## src/game/playtest02hBatch02h.test.ts
7940 B · 167 lines

## src/game/playtest02iBatch02i.test.ts
7213 B · 196 lines
- functions: travelYoYoState:19, leaveLoopState:39, stubEncounter:58, assertClosedPad:73

## src/game/playtest02jBatch02j.test.ts
7904 B · 210 lines

## src/game/playtest02kBatch02k.test.ts
3014 B · 79 lines

## src/game/playtest02lBatch02l.test.ts
4856 B · 115 lines

## src/game/playtest02mBatch02m.test.ts
3051 B · 71 lines

## src/game/playtest02nBatch02n.test.ts
4148 B · 109 lines
- functions: dietState:20

## src/game/playtest02oBatch02o.test.ts
2100 B · 44 lines

## src/game/playtest02pBatch02p.test.ts
4555 B · 114 lines
- functions: pyoaAt:20

## src/game/playtest02qBatch02q.test.ts
3594 B · 100 lines
- functions: fightState:29

## src/game/playtest02rBatch02r.test.ts
6572 B · 164 lines
- functions: line:21, streetAfterVault:25

## src/game/playtest02sBatch02s.test.ts
3172 B · 79 lines
- functions: roadState:29

## src/game/playtest02tBatch02t.test.ts
3670 B · 90 lines
- functions: roadState:35

## src/game/playtest02uBatch02u.test.ts
2322 B · 52 lines

## src/game/playtest02vBatch02v.test.ts
6571 B · 161 lines
- functions: roadState:52

## src/game/playtest02wBatch02w.test.ts
7751 B · 199 lines
- functions: travelYoYoState:19, leaveLoopState:40, firstDepartureState:59, talkRecycleStarvedState:72, assertClosedPad:83

## src/game/playtest02xBatch02x.test.ts
14549 B · 328 lines
- functions: litrpgState:51, roadState:70

## src/game/playtest02yBatch02y.test.ts
13105 B · 308 lines
- functions: litrpgState:37, roadState:56

## src/game/playtest02zBatch02z.test.ts
14613 B · 341 lines
- functions: litrpgState:51, roadState:70

## src/game/playtest08aRetrospectiveNarrator.test.ts
8438 B · 199 lines
- functions: litrpgState:28, liveSkirmish:47

## src/game/playtest08bStitchGate.test.ts
7146 B · 185 lines
- functions: litrpgState:23, liveSkirmish:42

## src/game/playtest08cFreeMud.test.ts
5740 B · 159 lines
- functions: baseState:31

## src/game/playtest08dSilentEngine.test.ts
7016 B · 182 lines
- functions: baseState:31

## src/game/playtest09aFireworksFree.test.ts
2604 B · 52 lines

## src/game/playtest09bOpeningStitch.test.ts
9011 B · 184 lines
- functions: stitchCard:25

## src/game/playtest09cCoverContinue.test.ts
6970 B · 177 lines
- functions: aloneRuin:22

## src/game/playtest09cLiveDrive.test.ts
3918 B · 97 lines

## src/game/playtest10aLiveDriveSource.test.ts
6326 B · 149 lines
- functions: summoned:23

## src/game/playtest10bCoverAnswer.test.ts
5560 B · 130 lines
- functions: warCamp:20

## src/game/playtest10cCraftProgression.test.ts
3900 B · 103 lines
- functions: playing:12, withLog:19

## src/game/playtest10cLoiterStitch.test.ts
5602 B · 143 lines
- functions: ruin:23

## src/game/playtest10dAshHallSilent.test.ts
7792 B · 200 lines
- functions: ashHall:39, namedJax:76

## src/game/playtest10eLitrpgSystemWindow.test.ts
5349 B · 140 lines
- functions: summoned:26, gm:50

## src/game/playtest10fTreatyHallTalk.test.ts
7744 B · 190 lines
- functions: treaty:44, namedJax:82

## src/game/playtest10hWatchtowerStart.test.ts
3864 B · 99 lines
- functions: watchtower:26

## src/game/playtest10iCathedralNameWhy.test.ts
5161 B · 131 lines
- functions: cathedral:30

## src/game/playtest10jWestWallNpcVoice.test.ts
5371 B · 126 lines
- functions: westWall:25

## src/game/playtest11aFounderLogin.test.ts
2896 B · 76 lines

## src/game/playtest11bCoverTalk.test.ts
18734 B · 445 lines
- functions: withNewGameCast:32, cathedral:47, greyhollow:69, saltHire:91, thornferry:113

## src/game/playtest11fLedgerDeficit.test.ts
7552 B · 187 lines
- functions: saltDoneUnnamed:22, cathedralNamed:43, greyhollowNamed:65, millNamed:86

## src/game/playtest12aNpcMemory.test.ts
6017 B · 154 lines
- functions: greyhollow:23, metAldous:47

## src/game/playtest12bManusPhase23.test.ts
9207 B · 209 lines
- functions: openedPact:48

## src/game/playtest12bOrHingeKill.test.ts
5760 B · 150 lines
- functions: emptyState:18

## src/game/playtest12cManusPhase4.test.ts
5260 B · 114 lines
- functions: uniqueLocations:22

## src/game/playtest12cSocialLeftover.test.ts
6676 B · 198 lines
- functions: openedPact:22, liveQuest:42

## src/game/playtest12dGrainShipTalk.test.ts
6008 B · 153 lines
- functions: grainShip:53

## src/game/playtest12eMapOverhaul.test.ts
2313 B · 47 lines

## src/game/playtest12fTalkEnvelope.test.ts
5128 B · 135 lines
- functions: grainDone:34

## src/game/playtest12gNaturalProse.test.ts
11113 B · 265 lines
- functions: ruin:37, greyTavern:55

## src/game/playtest13aCrownArchive.test.ts
7366 B · 159 lines
- functions: crown:42

## src/game/playtest13bWriterAlways.test.ts
5423 B · 133 lines
- functions: crown:41

## src/game/playtest13cWriterObeysLedger.test.ts
6761 B · 166 lines
- functions: crown:44

## src/game/playtest14aTokenProse.test.ts
7545 B · 204 lines
- functions: crown:44

## src/game/playtest15aPyoaChipsOnly.test.ts
2077 B · 53 lines
- functions: pyoaState:14

## src/game/playtest15aUmbraCompile.test.ts
4554 B · 125 lines
- functions: umbraState:29

## src/game/playtest17aLitrpgQuestSpines.test.ts
13209 B · 261 lines
- functions: revealFor:45

## src/game/playtest17aStoryRpgQuestSpines.test.ts
4534 B · 120 lines

## src/game/playtest17aTabletopQuestSpines.test.ts
5369 B · 132 lines

## src/game/playtest17cManusHonestPack.test.ts
7716 B · 152 lines
- functions: openedPact:33

## src/game/playtest17fOpeningPadLocks.test.ts
10165 B · 255 lines
- functions: litrpgNamed:34, saltHire:60, nameCover:90

## src/game/playtest17gWriterAlwaysTokenProse.test.ts
7585 B · 193 lines
- functions: namedAfterPage1:37, nameLockedCoverContinue:63, saltAfterFirstWant:77

## src/game/playtest17hOptimisticHallCount.test.ts
4845 B · 115 lines
- functions: namedAfterPage1:25

## src/game/playtest17iLastResortTopic.test.ts
3886 B · 94 lines
- functions: namedAlone:20

## src/game/playtest18aGeminiTesterVerdict.test.ts
9153 B · 225 lines
- functions: namedWatchtower:34, saltFenReed:62

## src/game/playtest18bLastResortPaints.test.ts
5380 B · 137 lines
- functions: namedWatchtower:34, afterNameLock:62

## src/game/playtest18cPadsCastGlue.test.ts
23085 B · 498 lines
- functions: namedWatchtower:37

## src/game/playtest20lConsistency.test.ts
10464 B · 267 lines

## src/game/playtest20rExploreAuthority.test.ts
6847 B · 170 lines

## src/game/playtest26oMapXp.test.ts
7759 B · 222 lines

## src/game/playtest26pSearchDagger.test.ts
3192 B · 89 lines
- functions: baseFacts:13

## src/game/playtest26rQualityRepair.test.ts
3629 B · 105 lines
- functions: baseState:9

## src/game/playtest26tXpProgression.test.ts
3965 B · 111 lines

## src/game/playtest26uQualityGates.test.ts
7583 B · 192 lines

## src/game/playtest27aRepair1.test.ts
8143 B · 190 lines
- functions: newGameBase:23, gm:30, pactState:34

## src/game/playtest27dInfoLayerNpcRecords.test.ts
11753 B · 286 lines
- functions: spState:20, recordCount:40

## src/game/playtest27wQualityGovernance.test.ts
2350 B · 72 lines

## src/game/playtest28aArcDirector.test.ts
3611 B · 97 lines

## src/game/playtest28aXpMilestone.test.ts
4875 B · 141 lines
- functions: quest:12

## src/game/playtest28bManusSlice.test.ts
6702 B · 198 lines

## src/game/playtest28cCheckModifiers.test.ts
5064 B · 120 lines
- functions: withNpc:23

## src/game/playtest28cManusComplete.test.ts
9976 B · 255 lines

## src/game/playtest28dLoot.test.ts
7295 B · 143 lines
- functions: rank:22, st:24, many:29

## src/game/playtest29aScoreBoost.test.ts
10407 B · 275 lines

## src/game/playtest29bOptimise.test.ts
8950 B · 240 lines

## src/game/playtest29cFreeHook.test.ts
7872 B · 183 lines

## src/game/playtest29dGeminiCalibrated.test.ts
5233 B · 117 lines

## src/game/playtest29eWorldMapOverhaul.test.ts
8402 B · 201 lines

## src/game/playtest29fHideOpener.test.ts
1554 B · 42 lines

## src/game/playtest29gHideChrome.test.ts
1297 B · 27 lines

## src/game/playtest29hTurnFail.test.ts
3327 B · 71 lines

## src/game/playtest30aWave2.test.ts
11015 B · 338 lines
- functions: initGameState:28

## src/game/playtest30bWave1.test.ts
14127 B · 490 lines

## src/game/playtest30bWave3.test.ts
10718 B · 300 lines

## src/game/playtest30eTesterGate.test.ts
4518 B · 139 lines
- functions: installMemoryStorage:27, signedInTester:48, signedInFounder:56

## src/game/playtest30hGmFeedback.test.ts
10935 B · 297 lines

## src/game/playtest30iFogOfWar.test.ts
9358 B · 229 lines

## src/game/playtest30rAntiRepeat.test.ts
6392 B · 169 lines

## src/game/playtest30sStoryCraft.test.ts
2883 B · 68 lines

## src/game/playtest30uHomeScroll.test.ts
1904 B · 43 lines

## src/game/playtest30vHudScroll.test.ts
2609 B · 56 lines

## src/game/playtest30wPlateRewrite.test.ts
6402 B · 156 lines
- functions: quietState:24

## src/game/playtest30xCrowdAuthority.test.ts
7579 B · 184 lines
- functions: withCrowd:24, countPeople:181

## src/game/playtest30yChromePerson.test.ts
7592 B · 191 lines
- functions: withPresent:29

## src/game/playtest30zCollagePrefix.test.ts
5368 B · 119 lines
- functions: gm:29, stateWithPriorBeats:33

## src/game/playtest31aCoordination.test.ts
12256 B · 416 lines

## src/game/playtest31aHookLock.test.ts
7132 B · 175 lines
- functions: withLock:32

## src/game/playtest31aWave1Social.test.ts
12049 B · 429 lines

## src/game/playtest31bWave1Encounter.test.ts
14847 B · 510 lines
- functions: createTestTemplate:45, createTestState:169

## src/game/playtest31cJosieAuthority.test.ts
8764 B · 243 lines
- functions: summonedNameCover:25

## src/game/playtest31dForceLatest.test.ts
4268 B · 114 lines

## src/game/playtest31eNameAtmosphere.test.ts
6506 B · 126 lines
- functions: summonedNameCover:28, gm:45

## src/game/playtest31fMapAutofight.test.ts
8236 B · 227 lines

## src/game/playtest31gCraftBook.test.ts
6467 B · 165 lines
- functions: playing:23, withPlayer:30, countCraftLines:41

## src/game/playtest31hGapClose.test.ts
11703 B · 316 lines
- functions: summoned:31

## src/game/playtest31iCriticBatchAB.test.ts
10106 B · 253 lines
- functions: stubEncounter:42

## src/game/playtest31jCriticBatchCD.test.ts
11223 B · 316 lines

## src/game/playtest31lOpeningAuthority.test.ts
12258 B · 275 lines
- functions: summonedState:34

## src/game/playtest31mNextBatch.test.ts
9494 B · 243 lines
- functions: summoned:36

## src/game/playtest31nMemoryWiden.test.ts
4461 B · 112 lines
- functions: line:20, stateWithLog:24

## src/game/playtest31oAutoImprovePatch.test.ts
2519 B · 71 lines

## src/game/playtest31pBatchE.test.ts
8292 B · 204 lines

## src/game/playtest31qBatchF.test.ts
8400 B · 231 lines

## src/game/playtest31rBatchG.test.ts
9386 B · 234 lines
- functions: engagedState:37

## src/game/playtest31rPyoaSpine.test.ts
5041 B · 122 lines
- functions: thornferryState:24

## src/game/playtest31sGeminiT50P0.test.ts
10489 B · 254 lines

## src/game/playtest31tBatchT.test.ts
10320 B · 265 lines

## src/game/playtest31uBatchU.test.ts
8885 B · 235 lines

## src/game/playtest31vBatchV.test.ts
11902 B · 301 lines

## src/game/playtest31wBatchW.test.ts
11059 B · 291 lines

## src/game/playtest31xBatchX.test.ts
10746 B · 297 lines

## src/game/playtestAutoImprove.test.ts
5022 B · 122 lines

## src/game/playtestDay1Checklist.test.ts
6172 B · 150 lines
- functions: crown:33

## src/game/playtestGeminiReview.test.ts
12908 B · 288 lines

## src/game/playtestZ1FsmFilter.test.ts
3967 B · 135 lines

## src/game/playtime.ts
2908 B · 93 lines
- exports: markPlaytimeBeat, takePlaytimeDeltaMinutes, startPlaytimeTracking, flushPlaytimeToProfile
- functions: storageGet:8, storageSet:17, markPlaytimeBeat:27, takePlaytimeDeltaMinutes:35, startPlaytimeTracking:53, flushPlaytimeToProfile:63

## src/game/povRails.ts
5418 B · 160 lines
- exports: buildPovRails, getPovViolationPatterns, hasPovViolations, scrubBodyPartPossession, formatPovRailsForPrompt
- functions: buildPovRails:16, getPovViolationPatterns:88, hasPovViolations:108, scrubBodyPartPossession:134, formatPovRailsForPrompt:157

## src/game/presentAuthority.ts
3680 B · 100 lines
- exports: locationsEquivalentForPresence, trimPresentOnLocationChange, applyPresentTrimOnTravel
- functions: thornferryClusterCore:11, locationsEquivalentForPresence:15, trimPresentOnLocationChange:24, applyPresentTrimOnTravel:43

## src/game/pressureClock.ts
1561 B · 51 lines
- exports: PressureClockState, initPressureClock, formatPressureClockSnippet, tickPressureClock
- functions: initPressureClock:15, formatPressureClockSnippet:19, tickPressureClock:32

## src/game/proseWarden.test.ts
7462 B · 182 lines

## src/game/proseWarden.ts
74388 B · 1740 lines
- exports: collectSceneObjectNames, ProseWardenContext, beatIsAtNamedPlace, scrubFalseArrivalWhenHere, scrubChoicePadPersonNames, scrubDialogueVerbAsNoun, scrubUnearnedPocketLoot, scrubUnresolvedDeixisNouns, scrubFactionAsLootOrTarget, scrubStitchBankLeaks, scrubEntityMadLibs, scrubBodyStatusDumps, scrubRoleAdjectivePersonSlot, scrubLocationTautology, scrubSpokenQuoteStart, scrubFreeEnglishSlips, scrubAwakeSpeakerAsSleeper, scrubArticleCollisions, scrubFigurePlaceholder, scrubUiQuestVerbs, scrubSomeoneNearbyPlaceholder, scrubSpeakerPlaceholder, scrubStrangerArtifact, scrubUnearnedVictory, scrubPlaceholderNouns, scrubPronounSubjectSlips, scrubPossessiveDeterminerSlips, scrubPrematureSecrets, scrubInventedAlonePresence, scrubInteriorOneRoomLie, scrubAnthropomorphizedLocation, scrubInventedTimeSkip, scrubInventedLocationChange, scrubDualLocationOpenings, scrubExtraPlayerActions, scrubInventedTensionChange, scrubInventedContainers, scrubDestroyedPyoaItems, scrubNamedCastAsObject, scrubDeadFoeReengage, scrubSaferSceneMeta, scrubFalseSpokenAction, scrubChromeAsPerson, applyProseWarden, applyProseWardenAsync, calculateCrowdSize, crowdSizeForWarden, scrubInventedCrowdSize
- functions: collectSceneObjectNames:33, beatIsAtNamedPlace:123, tidyClauses:133, scrubFalseArrivalWhenHere:152, scrubChoicePadPersonNames:324, scrubDialogueVerbAsNoun:349, scrubUnearnedPocketLoot:399, scrubUnresolvedDeixisNouns:434, scrubFactionAsLootOrTarget:494, scrubStitchBankLeaks:522, scrubEntityMadLibs:555, scrubBodyStatusDumps:690, scrubRoleAdjectivePersonSlot:714, scrubLocationTautology:737, scrubSpokenQuoteStart:763, scrubFreeEnglishSlips:777, scrubAwakeSpeakerAsSleeper:791, scrubArticleCollisions:818, scrubFigurePlaceholder:841, scrubUiQuestVerbs:857, scrubSomeoneNearbyPlaceholder:875, scrubSpeakerPlaceholder:886, scrubStrangerArtifact:906, scrubUnearnedVictory:940, scrubPlaceholderNouns:963, scrubPronounSubjectSlips:1011, scrubPossessiveDeterminerSlips:1048, scrubPrematureSecrets:1078, splitSentences:1091, scrubInventedAlonePresence:1103, scrubInteriorOneRoomLie:1119, scrubAnthropomorphizedLocation:1145, scrubInventedTimeSkip:1185, scrubInventedLocationChange:1210, scrubDualLocationOpenings:1240, scrubExtraPlayerActions:1327, scrubInventedTensionChange:1366, collectContainerTypes:1390, scrubInventedContainers:1412, scrubDestroyedPyoaItems:1452, scrubNamedCastAsObject:1525, scrubDeadFoeReengage:1559, scrubSaferSceneMeta:1570, scrubFalseSpokenAction:1592, scrubChromeAsPerson:1616, applyProseWarden:1625, applyProseWardenAsync:1723

## src/game/pyoaBranchLedger.ts
18575 B · 490 lines
- exports: PyoaBranchId, PyoaBranchLedger, initPyoaBranchLedger, isPyoaItemDestroyed, isPyoaCharterProseBurn, applyPyoaCharterProseBurn, isPyoaCharterClosed, isPyoaBranchExhausted, recordPyoaBranchChoice, formatPyoaBranchMandate, PyoaLockedBranchId, lockPyoaBranchOnCrisis, exhaustDelayPads, isPyoaBranchLocked, eligiblePyoaPadsAfterLock, detectBranchConvergence, recordBranchConvergence, cleanupBranchMemoryAtConvergence, formatConvergenceMandate
- functions: initPyoaBranchLedger:26, isPyoaItemDestroyed:38, isPyoaCharterProseBurn:56, applyPyoaCharterProseBurn:70, isPyoaCharterClosed:93, isPyoaBranchExhausted:114, recordPyoaBranchChoice:124, formatPyoaBranchMandate:205, lockPyoaBranchOnCrisis:226, exhaustDelayPads:262, isPyoaBranchLocked:285, eligiblePyoaPadsAfterLock:292, computeBranchStateHash:327, detectBranchConvergence:349, recordBranchConvergence:412, cleanupBranchMemoryAtConvergence:442, formatConvergenceMandate:483

## src/game/pyoaBranchLedgerV2.ts
13973 B · 507 lines
- exports: initPyoaBranchLedger, commitCrisisFork, rebuildLedgerFromReceipts, canSpawnCrisis, getLegalForkIds, isForkLocked, getEligibleCrises, getCrisisReceipt
- functions: initPyoaBranchLedger:40, computeCrisisIdempotencyKey:66, checkExclusiveFactConflict:73, assertExclusiveFacts:112, checkForkPrerequisites:134, evaluatePredicate:164, checkResourceCosts:195, commitCrisisFork:222, rebuildLedgerFromReceipts:342, canSpawnCrisis:430, getLegalForkIds:445, isForkLocked:462, getEligibleCrises:474, getCrisisReceipt:498

## src/game/pyoaCatalogLoader.ts
7691 B · 297 lines
- exports: PyoaCrisis, PyoaForkTree, PyoaEnding, PyoaCatalog, initializePyoaCatalogs, getPyoaRegistry
- functions: initializePyoaCatalogs:272, getPyoaRegistry:290

## src/game/pyoaChoiceLock.ts
830 B · 25 lines
- exports: isPyoaChipsOnly, pyoaRejectsFreeText
- functions: isPyoaChipsOnly:5, norm:9, pyoaRejectsFreeText:17

## src/game/pyoaConvergence.ts
14938 B · 558 lines
- exports: THORNFERRY_CONVERGENCES, BranchState, extractBranchState, compareBranchStates, ConvergenceCheck, isConvergenceEligible, checkConvergence, getEligibleConvergencePoints, MergeValidation, validateMerge, commitConvergence, validateConvergenceCatalog, buildConvergenceSituationSection, buildFogOfWarJournalSection, getConvergenceTelemetry
- functions: extractBranchState:107, compareBranchStates:139, isConvergenceEligible:189, checkConvergence:220, getEligibleConvergencePoints:246, validateMerge:274, commitConvergence:325, validateConvergenceCatalog:406, buildConvergenceSituationSection:450, buildFogOfWarJournalSection:471, getConvergenceTelemetry:520, simpleHash:549

## src/game/pyoaCrisisRegistry.ts
9539 B · 373 lines
- exports: PYOACrisis, PYOACrisisFork, THORNFERRY_ROAD_CRISES, PYOACrisisRegistry, PYOA_CRISIS_REGISTRY, isCrisisEligible, getEligibleCrises, pickCrisis
- functions: isCrisisEligible:306, getEligibleCrises:349, pickCrisis:361

## src/game/pyoaDelayedConsequences.ts
15780 B · 601 lines
- exports: scheduleDelayedConsequence, getDueConsequences, getPendingConsequences, markConsequenceDelivered, cancelConsequence, deliverConsequence, createEchoConsequence, createReturnConsequence, createReckoningConsequence, buildDelayedConsequencesSituationSection, buildJournalConsequenceHints, EndingGate, EndingRequirement, deliverEnhancedConsequence, enforceT150Deadline, checkEndingEligibility, getEligibleEndings, buildFogOfWarEntry
- functions: scheduleDelayedConsequence:18, getDueConsequences:55, getPendingConsequences:66, markConsequenceDelivered:76, cancelConsequence:100, deliverConsequence:130, buildConsequenceMandate:197, createEchoConsequence:215, createReturnConsequence:242, createReckoningConsequence:269, buildDelayedConsequencesSituationSection:302, buildJournalConsequenceHints:333, deliverEnhancedConsequence:368, enforceT150Deadline:429, checkEndingEligibility:454, getEligibleEndings:482, buildFogOfWarEntry:494, applyResourceDelta:528, applyRelationshipDelta:540, getEndingRequirements:545, checkRequirement:566, getCampaignEndings:584

## src/game/pyoaDelayedConsequencesV2.ts
5951 B · 227 lines
- exports: deliverDueConsequences, getOverdueConsequences, isConsequenceDeliverable, cancelConsequence, getPendingConsequencesByWindow, getConsequenceTimingBand
- functions: deliverDueConsequences:31, deliverConsequence:69, computeConsequenceIdempotencyKey:138, getOverdueConsequences:147, isConsequenceDeliverable:159, cancelConsequence:177, getPendingConsequencesByWindow:201, getConsequenceTimingBand:217

## src/game/pyoaEndingGates.ts
16348 B · 597 lines
- exports: THORNFERRY_ENDINGS, EndingEligibilityCheck, isEndingEligible, getEligibleEndings, selectBestEnding, DeadlineEnforcement, enforceT150Deadline, getFailureEnding, commitEnding, getEndingsForBible, validateEndingCatalog, buildEndingGatesSituationSection, EndingProgress, getEndingProgress
- functions: isEndingEligible:231, getEligibleEndings:290, selectBestEnding:306, enforceT150Deadline:327, getFailureEnding:378, commitEnding:390, getEndingsForBible:468, validateEndingCatalog:480, buildEndingGatesSituationSection:537, getEndingProgress:581

## src/game/pyoaExclusiveFacts.test.ts
9445 B · 321 lines

## src/game/pyoaExclusiveFacts.ts
13105 B · 479 lines
- exports: THORNFERRY_EXCLUSIVE_GROUPS, ExclusiveFactRegistry, EXCLUSIVE_FACT_REGISTRY, FactConflict, checkFactConflict, validateFactWrites, validateExactlyOneRequirement, evaluatePredicate, evaluatePredicateGroup, extractFactsFromGameState, commitFactWrite, buildExclusiveFactsSituationSection, validateExclusiveFactInvariants
- functions: checkFactConflict:138, validateFactWrites:183, validateExactlyOneRequirement:231, evaluatePredicate:274, evaluatePredicateGroup:301, extractFactsFromGameState:336, commitFactWrite:379, buildExclusiveFactsSituationSection:415, validateExclusiveFactInvariants:439

## src/game/pyoaReplay.ts
14552 B · 585 lines
- exports: PyoaReplayState, initReplayState, SeededRandom, selectCrisisDeterministic, recordCrisisSelection, recordForkChoice, recordEndingReached, EndingStatistics, getEndingStatistics, SpeedrunConfig, enableSpeedrunMode, checkSpeedrunTarget, ReplayValidation, validateReplay, ReplayTrace, buildReplayTrace, importReplayTrace, getReplayState, updateReplayState, buildReplaySituationSection, deriveChildSeed, deriveCrisisSeed, deriveForkSeed, ReplayStatistics, calculateReplayStatistics
- functions: initReplayState:48, selectCrisisDeterministic:135, recordCrisisSelection:152, recordForkChoice:167, recordEndingReached:185, getEndingStatistics:213, enableSpeedrunMode:254, checkSpeedrunTarget:267, validateReplay:304, buildReplayTrace:374, importReplayTrace:400, getReplayState:420, updateReplayState:436, buildReplaySituationSection:449, deriveChildSeed:478, deriveCrisisSeed:488, deriveForkSeed:498, calculateReplayStatistics:521

## src/game/pyoaSpine.ts
16400 B · 479 lines
- exports: PyoaSpineNodeId, PyoaSpineExit, PyoaSpineNode, PyoaSpineBibleId, PyoaSpineState, THORNFERRY_SPINE, spineBibleSupported, isAuthoredPyoaBook, getSpineNode, initThornferrySpine, initUmbraSpine, initPyoaSpine, authoredPageText, authoredStartPage, ensurePyoaSpine, currentSpineNode, legalSpineExits, isSpineDelayPad, advancePyoaSpine, evaluateSpineEndingGate, formatPyoaSpineSnapshotLines, formatPyoaSpineTurnJob, spineChoiceLabels, spineForceEdgeAfterDelay
- functions: spineBibleSupported:199, isAuthoredPyoaBook:203, getSpineNode:207, initThornferrySpine:212, initUmbraSpine:223, initPyoaSpine:234, authoredPageText:238, authoredStartPage:244, ensurePyoaSpine:248, currentSpineNode:255, legalSpineExits:261, resolveEndingLeaf:278, isSpineDelayPad:288, advancePyoaSpine:299, fuzzyExitMatch:352, applyExit:377, evaluateSpineEndingGate:400, formatPyoaSpineSnapshotLines:440, formatPyoaSpineTurnJob:463, spineChoiceLabels:472, spineForceEdgeAfterDelay:476

## src/game/pyoaTypes.ts
9352 B · 315 lines
- exports: BibleId, CrisisId, ForkId, FactId, EndingId, ConsequenceId, ConvergenceId, ReceiptId, RunId, Turn, TurnWindow, ResourceDelta, RelationshipDelta, FactWrite, FactPredicate, PredicateGroup, ExclusiveFactGroup, ForkSpec, CrisisSpec, ConsequenceType, DelayedConsequenceTemplate, DelayedConsequence, BranchLock, FactRecord, CrisisReceipt, ConsequenceReceipt, ConvergenceSpec, ConvergenceReceipt, EndingGateSpec, EndingReceipt, BranchReceipt, PyoaBranchLedger, CommitContext, CommitResult, BranchInvariantError, PyoaBibleCatalog

## src/game/pyoaWaves.test.ts
14193 B · 442 lines

## src/game/qualityGovernance.ts
26100 B · 719 lines
- exports: QualityGovernanceState, buildGovernanceSnapshotLines, processMetaInput, applyGovernanceToProse, collectCraftSignals, filterGovernanceChoices, GovernanceCommitResult, applyGovernanceCommit
- functions: qg:139, cooldownMap:143, ledgerMap:147, noveltyFromState:151, noveltyToRecord:161, resolveVoicePersonality:169, buildGovernanceSnapshotLines:188, processMetaInput:288, applyGovernanceToProse:315, collectCraftSignals:479, filterGovernanceChoices:526, applyGovernanceCommit:584

## src/game/questCompletionSchema.ts
13696 B · 484 lines
- exports: QuestCompletionSchema, ProgressSignal, TerminalState, QuestReward, QuestCost, buildQuestSchema, needsQuestOption, formatQuestPressureMandate, checkQuestTerminalState, buildQuestCompletion, formatQuestCompletionNarrative, buildCrisisFork, CrisisBranch, QuestTelemetry, trackQuestMetrics
- functions: buildQuestSchema:69, needsQuestOption:170, formatQuestPressureMandate:227, checkQuestTerminalState:246, buildQuestCompletion:293, formatQuestCompletionNarrative:341, buildCrisisFork:380, trackQuestMetrics:438

## src/game/questGuards.ts
3469 B · 107 lines
- exports: canActivateQuest, canCompleteQuest, markQuestRevealed, applyQuestCompleteGuard, applyQuestFailGuard, failRunScopedQuests
- functions: canActivateQuest:6, canCompleteQuest:15, markQuestRevealed:31, applyQuestCompleteGuard:41, applyQuestFailGuard:63, failRunScopedQuests:93

## src/game/questHooks.ts
1198 B · 41 lines
- exports: applyQuestHooksFromLedger
- functions: applyQuestHooksFromLedger:5

## src/game/questJournalEnrich.ts
1544 B · 41 lines
- exports: GENERIC_QUEST_PROVENANCE, isGenericQuestProvenance, enrichQuestJournalFields, enrichQuests
- functions: isGenericQuestProvenance:14, enrichQuestJournalFields:20, enrichQuests:38

## src/game/questPlay.ts
33107 B · 945 lines
- exports: StarterQuestSeed, adaptStarterQuestsForArrival, isAtmospherePlaceName, extractNamedPlaces, harvestPlayText, questsLockedDuringOpening, clampLeakedOpeningQuests, isJournalQuest, visibleJournalQuests, activeDrawerQuests, syncQuestsFromPlay, revealQuestsFromBanks, revealQuestsFromHubLinks, isDummyStreetNodeName, isGenericMapPlace, isInteriorRoomName, newlyRevealedQuests, mainSpineQuest, nextMainObjective, mainQuestPlacePin, resumeMainQuestFocus, resumeMainTravelChoice, seedLocalStarterQuest, revealLocalStarterQuest, mapAnchorName, applyBiomeSaneQuestSites
- functions: adaptStarterQuestsForArrival:424, slug:432, tokens:436, overlap:442, titleCasePlace:469, clipPlace:476, isAtmospherePlaceName:488, isIncompletePlacePhrase:495, looksLikePlaceName:510, pushPlace:514, extractNamedPlaces:523, harvestPlayText:548, labelFromLogLine:557, questsLockedDuringOpening:566, hideSeededQuests:577, clampLeakedOpeningQuests:588, isJournalQuest:595, visibleJournalQuests:601, activeDrawerQuests:606, syncQuestsFromPlay:614, revealQuestsFromBanks:679, revealQuestsFromHubLinks:702, isDummyStreetNodeName:724, isGenericMapPlace:728, isInteriorRoomName:740, newlyRevealedQuests:748, seededQuestType:755, asSeededQuest:762, mainSpineQuest:783, nextMainObjective:809, mainQuestPlacePin:818, atPlacePin:824, resumeMainQuestFocus:832, resumeMainTravelChoice:864, seedLocalStarterQuest:873, revealLocalStarterQuest:885, mapAnchorName:919, applyBiomeSaneQuestSites:929

## src/game/quickResponseButtons.ts
12444 B · 343 lines
- exports: pickQuickResponseButtons, generateQuickResponse, supportsQuickResponseButtons
- functions: detectSettingContext:156, selectKitBank:180, selectLookBank:190, selectLocationBank:200, pickQuickResponseButtons:222, generateQuickResponse:287, supportsQuickResponseButtons:340

## src/game/readabilityGate.ts
5769 B · 160 lines
- exports: ReadabilityViolationKind, ReadabilityViolation, scanReadabilityViolations, readabilityGatePass
- functions: gmEntries:37, normBody:43, scanEntityMadlib:53, clipQuote:57, scanReadabilityViolations:63, readabilityGatePass:145

## src/game/receiptLedger.ts
8829 B · 307 lines
- exports: appendReceipt, appendReceipts, getReceipts, getReceiptByKey, hasReceipt, getMostRecentReceipt, countReceiptsByPackage, getReceiptTimeline, loadReceipts, persistReceipts, clearAllReceipts, getStoreStats
- functions: appendReceipt:39, appendReceipts:75, getReceipts:99, getReceiptByKey:143, hasReceipt:153, getMostRecentReceipt:168, countReceiptsByPackage:182, getReceiptTimeline:202, loadReceipts:235, persistReceipts:256, clearAllReceipts:273, getStoreStats:282

## src/game/receiptTelemetry.ts
1352 B · 46 lines
- exports: ReceiptCounts, countTurnReceipts, countRunReceipts
- functions: countTurnReceipts:16, countRunReceipts:32

## src/game/recoveryRules.ts
3282 B · 66 lines
- exports: RecoveryRow, RECOVERY_TABLE, recoveryRow, isSafeHubRest, applyRestHeal, hpAfterFight, earlyEnemyAttack
- functions: recoveryRow:26, isSafeHubRest:33, applyRestHeal:40, hpAfterFight:50, earlyEnemyAttack:59

## src/game/repairCopyBank.ts
37453 B · 230 lines
- exports: RepairCopyRow, REPAIR_COPY_ROWS, lookupRepairCopyRow
- functions: parseCsvLine:163, parseRepairCopyCsv:193, lookupRepairCopyRow:217

## src/game/repairEngine.ts
6941 B · 209 lines
- exports: RepairSituation, mapEngineModeToCsv, mapVoiceIdToPersonality, stripRepairMarkdown, extractRepairOptions, detectRepairSituation, isInformationalOrAsk, isExploreOrLayoutAsk, pickRepairCopy, matchRepairOption, buildClarifiedInput, resolveRepairVoiceId
- functions: mapEngineModeToCsv:33, mapVoiceIdToPersonality:37, stripRepairMarkdown:43, extractRepairOptions:48, detectRepairSituation:79, isInformationalOrAsk:99, isExploreOrLayoutAsk:123, pickRepairCopy:153, matchRepairOption:178, buildClarifiedInput:202, resolveRepairVoiceId:206

## src/game/replayHash.ts
2434 B · 77 lines
- exports: ReplayHashRecord, hashCanonicalState, recordReplayHash, verifyReplayChain, verifyFinalReplayHash
- functions: canonicalSlice:13, hashCanonicalState:38, recordReplayHash:48, verifyReplayChain:58, verifyFinalReplayHash:73

## src/game/rewardedAds.ts
7045 B · 230 lines
- exports: RewardedAdProfile, RewardedAdProviderId, ADULT_MAX_REWARDED_ADS_PER_DAY, resolveRewardedAdProfile, preferredRewardedProvider, rewardedTurnsPerAd, canOfferRewardedTurns, adultAdsRemainingToday, rewardedAdsRemainingToday, canWatchRewardedAdNow, WatchRewardedResult, watchRewardedAdForTurns, WatchMemorableAdResult, canOfferRewardedMemorable, watchRewardedAdForMemorable
- functions: resolveRewardedAdProfile:36, preferredRewardedProvider:40, rewardedTurnsPerAd:48, canOfferRewardedTurns:59, adultAdsRemainingToday:68, rewardedAdsRemainingToday:72, canWatchRewardedAdNow:82, watchRewardedAdForTurns:99, canOfferRewardedMemorable:154, watchRewardedAdForMemorable:158, playRewardedProvider:215

## src/game/runManifest.ts
1490 B · 53 lines
- exports: BUILD_STAMP, RunManifest, initRunManifest, ensureRunManifest, nextEventSeq
- functions: initRunManifest:20, ensureRunManifest:33, nextEventSeq:42

## src/game/salvage.ts
6669 B · 202 lines
- exports: inferItemType, getSalvageRequirement, getAvailableProfessions, checkSalvageRequirement, generateSalvageYield, SalvageResult, salvageItem
- functions: inferItemType:10, getSalvageRequirement:20, getAvailableProfessions:66, checkSalvageRequirement:95, generateSalvageYield:137, salvageItem:175

## src/game/sandboxXp.ts
10615 B · 242 lines
- exports: SANDBOX_XP, SandboxXpResult, isBearingsStyleObjective, isLookAroundAction, applySandboxXpAwards
- functions: hasAward:35, normalizeActionText:46, isBearingsStyleObjective:53, isLookAroundAction:63, normalizeNpcKey:85, isSignificantNpc:90, encounterKind:95, applySandboxXpAwards:106

## src/game/saveMigration.test.ts
2724 B · 84 lines
- functions: dungeonWithMobs:7

## src/game/saveMigration.ts
6878 B · 222 lines
- exports: SaveRepairSeverity, SaveRepairResult, repairSaveSchema, SAVE_REPAIR_TOAST, repairOpeningPlayGate, applySaveRepair
- functions: defaultPlayPhase:24, repairNpcRecords:31, repairSaveSchema:87, repairOpeningPlayGate:170, applySaveRepair:189

## src/game/sceneArtLock.ts
3547 B · 104 lines
- exports: SceneArtStance, SceneArtFactsInput, inferSceneStance, inferSceneFloor, formatSceneArtLock
- functions: stripTags:37, inferSceneStance:44, inferSceneFloor:51, formatSceneArtLock:60

## src/game/sceneContextTail.ts
9217 B · 253 lines
- exports: SCENE_CONTEXT_TAIL_WINDOW, SCENE_CONTEXT_RECENT_TURNS, placesDiffer, mentionsPlace, isLeaveBehindMention, hereLocation, priorLocation, locationChangedRecently, encounterClearedRecently, selectRecentLogForContext, isStaleLocationBleed, isStaleFightBleed, leftBehindNames, isLeftBehindActingHere, isStaleContextBleed, openingPinNames, isLeaveBehindFarewell, isOpeningOccupancyReset
- functions: escapeRe:39, normalizePlace:43, placeWords:47, placesDiffer:55, mentionsPlace:63, isLeaveBehindMention:78, hereLocation:83, priorLocation:87, locationChangedRecently:93, encounterClearedRecently:110, keepLogLine:122, selectRecentLogForContext:146, isStaleLocationBleed:155, isStaleFightBleed:167, leftBehindNames:181, isLeftBehindActingHere:190, isStaleContextBleed:201, openingPinNames:212, isLeaveBehindFarewell:222, openingPinActsHere:226, isOpeningOccupancyReset:243

## src/game/sceneFacts.ts
17212 B · 395 lines
- exports: emptySceneFacts, extractSceneFacts, mergeSceneFacts, seedOpeningSceneFacts, formatSceneFactsForPrompt, detectSceneContradiction, rewriteContinuityBreak, applyCommittedNarrative
- functions: emptySceneFacts:51, extractSceneFacts:66, mergeSceneFacts:158, seedOpeningSceneFacts:205, formatSceneFactsForPrompt:258, detectSceneContradiction:277, rewriteContinuityBreak:293, applyCommittedNarrative:308

## src/game/sceneFocus.ts
10536 B · 218 lines
- exports: extractQuestFocusKeywords, playerEngagesFocus, TurnMandate, buildTurnMandate, HijackReport, detectSceneHijack, stripHijackSentences, filterHijackChoices, isQuestRevealed, withQuestReveal, maybeRevealQuestsFromPlayerAction
- functions: extractQuestFocusKeywords:22, playerEngagesFocus:47, buildTurnMandate:66, detectSceneHijack:129, stripHijackSentences:174, filterHijackChoices:188, isQuestRevealed:199, withQuestReveal:203, maybeRevealQuestsFromPlayerAction:208

## src/game/sceneManifest.ts
8112 B · 209 lines
- exports: SceneManifest, compileSceneManifest, formatSceneManifestForPrompt, findManifestInventions
- functions: isAloneScene:14, equippedNames:35, compileSceneManifest:43, formatSceneManifestForPrompt:124, findManifestInventions:154

## src/game/sealedManifest.ts
16097 B · 441 lines
- exports: SceneManifest, RenderFallbackReason, hashBeatEffects, buildSealedManifest, attachSealedManifest, formatSealedManifestBlock, ManifestValidationResult, validateProseAgainstManifest, isBannedFallbackStub, isEngineRecoveryProse, consecutiveRecoveryExceeded, markEngineRecoveryCommit, clearEngineRecoveryStreak, renderDeterministicFallback, applyRenderFallback, canUseFallback
- functions: fnv1a:35, hashBeatEffects:45, buildSealedManifest:65, attachSealedManifest:153, formatSealedManifestBlock:160, validateProseAgainstManifest:178, isBannedFallbackStub:287, isEngineRecoveryProse:293, consecutiveRecoveryExceeded:300, markEngineRecoveryCommit:304, clearEngineRecoveryStreak:322, fallbackPlace:334, lastBeatIsStory:342, renderDeterministicFallback:356, applyRenderFallback:396, canUseFallback:438

## src/game/searchContinuity.ts
13722 B · 311 lines
- exports: normalizeSearchTarget, isOpenContainerAction, isSearchAction, claimsSearchEmpty, hasNewSearchCircumstance, listEmptySearchTargets, isSearchTargetEmpty, recordEmptySearch, clearEmptySearchOnCircumstance, applySearchContinuityToFacts, exhaustOpenedContainer, shouldBlockContainerItemGain, scrubInventedEmptySearchLoot, groundedWeaponNames, isWeaponGrounded, scrubInventedWeapons, weaponAuthorityLine, emptySearchAuthorityLine
- functions: normalizeSearchTarget:26, isOpenContainerAction:47, isSearchAction:52, claimsSearchEmpty:56, hasNewSearchCircumstance:60, listEmptySearchTargets:64, isSearchTargetEmpty:68, recordEmptySearch:79, clearEmptySearchOnCircumstance:110, applySearchContinuityToFacts:126, exhaustOpenedContainer:148, shouldBlockContainerItemGain:161, scrubInventedEmptySearchLoot:176, groundedWeaponNames:206, isWeaponGrounded:229, scrubInventedWeapons:244, weaponAuthorityLine:297, emptySearchAuthorityLine:306

## src/game/seededRng.ts
472 B · 12 lines
- exports: createHashRng
- functions: createHashRng:2

## src/game/semanticLoopDetector.ts
35102 B · 967 lines
- exports: SemanticIntent, LoopDetectionResult, EscalationResponse, canonicalizeIntent, intentSimilarity, detectSemanticLoop, buildEscalationResponse, calculateChoiceDiversity, formatEscalationMandate, LoopDetectionTelemetry, trackLoopMetrics, playerAsksRepeat, playerAsksContinuation, lastOfferedChoiceSets, isStallPadChoice, filterRecycledStallChoices, LeadingCollageHit, splitStorySentences, isSubstantialSentence, recentGmBeatTexts, detectLeadingCollage, stripRecycledPrefix, shouldRetryUnaskedCollage, atmosphereSignature, isAtmosphereOnlyBeat, detectAtmosphereReprint, isSameRoomLoiterIntent, isDialogueTalkIntent, detectDialogueTreadmillHard, detectTalkUltimatumRecycle, isTalkUltimatumExhausted, hasTalkQaShape, isTalkQaLoopStarved, detectTalkQaShapeLoop, ambientStubFingerprint, isAmbientStubRecycle, detectCombatPurgatoryHard, hasBeatDeltaCue, detectSameRoomEssayHard
- functions: canonicalizeIntent:59, intentSimilarity:153, detectSemanticLoop:171, buildEscalationResponse:234, calculateChoiceDiversity:338, formatEscalationMandate:399, trackLoopMetrics:420, playerAsksRepeat:438, playerAsksContinuation:455, optionFamilyKey:467, lastOfferedChoiceSets:472, isStallPadChoice:487, filterRecycledStallChoices:507, wordCount:563, splitStorySentences:568, isSubstantialSentence:575, sentenceMatches:580, bestSourceBeat:592, tailHasConcreteContent:609, recentGmBeatTexts:619, detectLeadingCollage:637, stripRecycledPrefix:694, shouldRetryUnaskedCollage:702, atmosphereSignature:719, isAtmosphereOnlyBeat:729, signatureJaccard:739, detectAtmosphereReprint:747, isSameRoomLoiterIntent:759, isDialogueTalkIntent:774, detectDialogueTreadmillHard:789, detectTalkUltimatumRecycle:823, isTalkUltimatumExhausted:843, hasTalkQaShape:858, isTalkQaLoopStarved:862, detectTalkQaShapeLoop:871, ambientStubFingerprint:883, isAmbientStubRecycle:892, isCombatAttackIntent:905, detectCombatPurgatoryHard:914, hasBeatDeltaCue:932, detectSameRoomEssayHard:940

## src/game/semanticMemory.ts
6524 B · 239 lines
- exports: initEmbeddings, embedText, cosineSimilarity, embedTurnSummary, embedAllTurnSummaries, semanticSearchMemories, hybridSearchMemories, areEmbeddingsAvailable, areEmbeddingsInitializing
- functions: initEmbeddings:22, embedText:74, cosineSimilarity:98, embedTurnSummary:120, embedAllTurnSummaries:144, semanticSearchMemories:160, hybridSearchMemories:192, areEmbeddingsAvailable:229, areEmbeddingsInitializing:236

## src/game/simulationistSandbox.test.ts
7161 B · 203 lines
- functions: baseState:14

## src/game/situationPacket.ts
27980 B · 592 lines
- exports: effectivePowerScaling, buildSituationPacket, formatSceneSnapshotForPrompt, formatSituationForPrompt, formatCampaignRails, formatFullMemoryBlock
- functions: effectivePowerScaling:74, formatFactionMatrix:78, formatSimulationistBlocks:92, buildSituationPacket:109, formatSceneSnapshotForPrompt:212, formatSituationForPrompt:428, formatWorldLedgerBlock:521, formatCampaignRails:562, formatFullMemoryBlock:588

## src/game/slotGlue.ts
10859 B · 267 lines
- exports: isPlotObjectName, ledgerSlotPeople, isCompanionObjectGlue, placeTitleNeedles, ledgerPlaceTitles, isPlaceTitleObjectGlue, isSlotGlueViolation, isPlaceTitleAsPersonSubject, isObjectPersonPad, isPlaceTitleTalkPad, isNobodyInflectionSalad, scrubNobodyInflection, scrubSlotGlue
- functions: escapeRe:29, isPlotObjectName:33, ledgerSlotPeople:39, isCompanionObjectGlue:59, placeTitleNeedles:72, ledgerPlaceTitles:94, isPlaceTitleObjectGlue:126, isSlotGlueViolation:144, isPlaceTitleAsPersonSubject:168, isObjectPersonPad:182, isPlaceTitleTalkPad:192, isNobodyInflectionSalad:205, scrubNobodyInflection:211, scrubSlotGlue:222

## src/game/snapshotEvalPack.test.ts
5706 B · 167 lines
- functions: item:25, companion:29, stateFromSnapshot:43, hardGateDecision:75, wardenCtx:82, parseSubsetCsv:99

## src/game/socialCrisis.ts
8982 B · 343 lines
- exports: CRISIS_CATALOG, isCrisisEligible, selectEligibleCrisis, materializeStakes, validateCrisisCatalog
- functions: isCrisisEligible:150, getLastCrisisSpawn:209, selectEligibleCrisis:230, getLastAnyCrisisSpawn:255, materializeStakes:272, validateCrisisCatalog:305

## src/game/socialCrisisTypes.ts
8866 B · 343 lines
- exports: CrisisPattern, SocialStakes, SocialCrisis, LeverageType, LeverageAsset, LeveragePressureProfile, LeverageResolution, SocialSkill, OutcomeBand, SocialSkillCheck, ResolutionTier, resolveResolutionTier, SocialResolution, getLeverageTrustDelta, calculateLeverageModifier, generatePropositionFingerprint
- functions: resolveResolutionTier:234, getLeverageTrustDelta:286, calculateLeverageModifier:300, generatePropositionFingerprint:335

## src/game/socialMilestoneLedger.ts
2713 B · 84 lines
- exports: SocialMilestoneKind, SocialMilestoneAward, detectSocialMilestone, applySocialMilestone
- functions: milestoneKey:17, nodeKey:22, detectSocialMilestone:26, applySocialMilestone:67

## src/game/socialProgression.ts
14575 B · 465 lines
- exports: XpSource, SocialXpEvent, SocialProgressionState, SkillTreeNode, SOCIAL_SKILL_TREE, RelationshipGate, RELATIONSHIP_GATES, FactionGate, FACTION_GATES, XpAwardInput, calculateSocialXp, RouteParitySample, ParityReport, evaluateParity, SOCIAL_XP_INVARIANTS, awardSocialXp, hasNoveltyKey, unlockSkillNode
- functions: clamp:240, calculateSocialXp:244, median:313, evaluateParity:321, awardSocialXp:359, hasNoveltyKey:403, unlockSkillNode:415

## src/game/socialSkills.ts
8063 B · 286 lines
- exports: generatePropositionFingerprint, hasPropositionBeenTried, recordPropositionFingerprint, SocialModifiers, calculateSocialModifiers, calculateTotalModifier, resolveSocialSkillCheck, getOutcomeDescription, getOutcomeXpMultiplier
- functions: generatePropositionFingerprint:25, hasPropositionBeenTried:39, recordPropositionFingerprint:50, calculateSocialModifiers:97, calculateTotalModifier:161, resolveSocialSkillCheck:183, rollD20:246, getOutcomeDescription:259, getOutcomeXpMultiplier:277

## src/game/socialStakes.ts
18436 B · 405 lines
- exports: Mode, OutcomeKind, StakesTemplate, OutcomeMutation, ResolutionOutcome, STAKES_TEMPLATES, OUTCOME_CATALOG, templatesForMode, validateOutcome, applyOutcomeMutations, getLeverageCooldown, enforceLeverageCooldown
- functions: templatesForMode:336, validateOutcome:340, applyOutcomeMutations:351, getLeverageCooldown:382, enforceLeverageCooldown:397

## src/game/speechActRails.ts
1559 B · 22 lines
- exports: formatSpeechActRailsForPrompt
- functions: formatSpeechActRailsForPrompt:4

## src/game/spineMapRegistry.ts
11561 B · 393 lines
- exports: NoveltyPolicy, ModeTargets, Profile, Milestone, Quantities, SpineBand, ModeSpineMap, SpineMapData, loadSpineMaps, getSpineMapForMode, getBandForTurn, getNoveltyPolicy, getDueMilestones, getNextMilestone, isMilestoneOverdue, getModeTargets, getProfileForBible, validateSpineMap, getSpineMapHash, formatMilestoneMandate
- functions: loadSpineMaps:169, getSpineMapForMode:185, getBandForTurn:202, getNoveltyPolicy:212, getDueMilestones:223, getNextMilestone:246, isMilestoneOverdue:268, getModeTargets:278, getProfileForBible:286, validateSpineMap:308, getSpineMapHash:381, formatMilestoneMandate:389

## src/game/stanceDensity.ts
15260 B · 374 lines
- exports: StanceBucket, PathBucket, classifyStance, classifyPath, isCombatLockedTurn, isOpeningCoverTurn, namedPeopleForTest, isConversationBeat, applyPathDensity, applyStanceDensity
- functions: stripDecorators:14, isLookAround:18, classifyStance:47, classifyPath:61, isCombatLockedTurn:71, isOpeningCoverTurn:76, namedPeople:83, someonePresent:96, isAloneScene:104, lastPlayerLine:117, isConversationBeat:127, canWalkAway:145, stanceFallbacks:153, doorwayDirectFallback:164, firstCarriedTool:177, pathFallbacks:185, applyPathDensity:261, applyStanceDensity:303

## src/game/stateTx.ts
8538 B · 332 lines
- exports: StateTxKind, BeatStateTxExtras, StateTx, emptyStateTxLog, appendStateTxDiff, pushBeatStateTx, recentStateTxReceipts, explainWhy
- functions: emptyStateTxLog:52, uid:56, pushTx:60, itemKey:67, questSig:71, appendStateTxDiff:78, pushBeatStateTx:261, recentStateTxReceipts:303, explainWhy:311

## src/game/statusFirewall.ts
3382 B · 98 lines
- exports: StatusFirewallResult, scrubStatusLeakLine, applyStatusFirewall, scrubProseControlTags, hasStatusLeak
- functions: scrubStatusLeakLine:38, applyStatusFirewall:63, scrubProseControlTags:78, hasStatusLeak:90

## src/game/stockInventoryArt.test.ts
1675 B · 35 lines
- functions: item:6

## src/game/stockInventoryArt.ts
10473 B · 163 lines
- exports: StockItemGlyphId, svgDataUri, pickStockItemGlyph, stockItemIconSrc, stockPortraitSrc
- functions: tile:34, svgDataUri:70, pickStockItemGlyph:74, stockItemIconSrc:114, portraitSvg:118, stockPortraitSrc:146

## src/game/streamReveal.test.ts
1444 B · 41 lines

## src/game/streamReveal.ts
3772 B · 130 lines
- exports: TurnPhase, StreamingRevealState, stripXmlForReveal, splitIntoRevealChunks, revealDelayMs, buildRevealVisibleText, turnPhaseStatusMessage, resolveRevealContent, isTurnUiBlocked
- functions: stripXmlForReveal:11, isQuoteOpen:23, isQuoteClose:27, splitSentences:31, splitIntoRevealChunks:65, revealDelayMs:87, buildRevealVisibleText:95, turnPhaseStatusMessage:101, resolveRevealContent:107, isTurnUiBlocked:118

## src/game/stripeCheckout.ts
1468 B · 46 lines
- exports: CheckoutSku, CheckoutSessionResult, createCheckoutSession, redirectToCheckout
- functions: createCheckoutSession:20, redirectToCheckout:43

## src/game/structuralEvents.ts
10322 B · 293 lines
- exports: applyStructuralEvents
- functions: uid:20, isLeaveOrTravelPad:24, shouldBlockUnearnedOfferGain:31, applyStructuralEvents:49

## src/game/subscriptionTiers.test.ts
1634 B · 33 lines

## src/game/subscriptionTiers.ts
12742 B · 427 lines
- exports: SubscriptionTierId, TurnPackId, CapacityPackKind, TurnPackArtId, TurnPackDefinition, TURN_PACKS, liveShopPacks, allShopPacks, textShopPacks, illustratedShopPacks, memorableShopPacks, FluxEndpointId, TierDefinition, SUBSCRIPTION_TIERS, getActiveSubscriptionTier, isAdminSubscriptionTier, setActiveSubscriptionTier, getTierDefinition, resolveWriterModel, resolveFluxEndpoint, fluxEndpointToOpenRouterId, resolveFluxImageModel
- functions: liveShopPacks:221, allShopPacks:226, textShopPacks:230, illustratedShopPacks:234, memorableShopPacks:238, getActiveSubscriptionTier:349, isAdminSubscriptionTier:359, setActiveSubscriptionTier:363, getTierDefinition:367, resolveWriterModel:375, resolveFluxEndpoint:388, fluxEndpointToOpenRouterId:398, resolveFluxImageModel:416

## src/game/suggestionValidation.ts
14517 B · 318 lines
- exports: buildGroundingCorpus, inventoryHasItem, findUnsupportedItemClaims, findHardItemUseClaims, findUngroundedNamedClaims, referencesAbsentCompanion, isSuggestionValidForState, isLockedProgressionChoice, fallbackSuggestionForState
- functions: normalize:71, addNameTokens:75, buildGroundingCorpus:88, knownEntityNames:117, inventoryCatalog:125, inventoryHasItem:133, collectUnsupportedClaims:164, collectNamedWeaponClaims:178, findUnsupportedItemClaims:194, findHardItemUseClaims:206, isTokenGrounded:215, findUngroundedNamedClaims:234, referencesAbsentCompanion:253, isSuggestionValidForState:262, isLockedProgressionChoice:296, fallbackSuggestionForState:309

## src/game/systemLog.ts
8608 B · 210 lines
- exports: isDiceMechanicsLine, scrubLocationDangerTier, isNoOpCheckSuccessLine, isEmptyStatusNoiseLine, isMudReceiptLine, isNoisySystemLogLine, dedupeQuestStatusEcho, suppressNoOpStatusEcho, isXpGainedLine, isReasonedXpLine, reconcileXpStatusLines, filterSystemLogForEngine, isLitrpgChromeLine
- functions: isDiceMechanicsLine:5, scrubLocationDangerTier:10, isInventedStreetDangerLine:22, isNoOpCheckSuccessLine:28, isEmptyStatusNoiseLine:41, isMudReceiptLine:55, isNoisySystemLogLine:61, dedupeQuestStatusEcho:92, normStatusValue:128, suppressNoOpStatusEcho:136, isXpGainedLine:152, isReasonedXpLine:159, reconcileXpStatusLines:167, filterSystemLogForEngine:185, isLitrpgChromeLine:207

## src/game/systemPrompt.ts
50074 B · 520 lines
- exports: WORLD_STATE_INTEGRITY_RULES, buildSystemPrompt, RECENT_LOG_WINDOW, RECENT_LOG_CHAR_CAP, buildContextPrompt, KID_MODE_RULES, buildImagePromptModifier
- functions: buildStatRules:267, buildNarrativePreferenceRules:278, engineModeRules:326, buildSystemPrompt:334, buildMultiPanelInstructions:425, buildPublishingEngineInstructions:477, buildContextPrompt:512

## src/game/tagTrigger.ts
4658 B · 134 lines
- exports: TAG_SKIRMISH_BOUNTY, CLAIM_BOUNTY_PAD, hasWorldTag, withWorldTag, withoutWorldTag, applyCombatClearTag, tagTriggerPads, isClaimBountyPad, consumeTagTriggerOnInput
- functions: bibleId:26, tagsOf:30, hasWorldTag:35, withWorldTag:39, withoutWorldTag:57, applyCombatClearTag:76, atSummonedPactHub:91, tagTriggerPads:103, isClaimBountyPad:115, consumeTagTriggerOnInput:122

## src/game/talkEnvelope.ts
9647 B · 249 lines
- exports: ResponsePath, WriterOutcome, addressedCastName, legalAddresseeFact, classifyResponsePath, buildTalkEnvelope, spokenTalkFallback, formatTalkWriterFacing, tallyResponsePaths
- functions: clip:33, livingCast:39, addressedCastName:48, identityHay:59, legalAddresseeFact:70, classifyResponsePath:88, buildTalkEnvelope:115, openingCastIsHere:136, priorGmBodies:143, spokenTalkFallback:153, spokenTalkFallbackInner:168, formatTalkWriterFacing:205, tallyResponsePaths:216

## src/game/testLab.ts
9584 B · 299 lines
- exports: HostedAiTier, PlayAccess, TestLabConfig, PlayAccountContext, loadTestLab, saveTestLab, enableAutoplayTestLab, disableAutoplayTestLab, isAutoplayTestLabSession, setPlayAccountContext, setServerPlayAccess, getServerPlayAccess, parsePlayAccess, getPlayAccountContext, __resetPlayAccountForTests, isTestLabEnabled, getTestLabAiTier, setTestLabEnabled, setTestLabAiTier, markTestAccountEmail, isEmailTestAccount, isFounderPlayAccount, isTesterCohort, hasUnlimitedTextCapacity, hostedImagesAllowed, hasUnlimitedImageCapacity, canShowTestLabUi, effectiveHostedAiTier, effectiveWriterTier
- functions: envEmailAllowlist:56, normalizeEmail:64, loadTestLab:69, saveTestLab:87, enableAutoplayTestLab:100, disableAutoplayTestLab:105, isAutoplayTestLabSession:110, setPlayAccountContext:114, setServerPlayAccess:125, getServerPlayAccess:134, parsePlayAccess:138, getPlayAccountContext:144, __resetPlayAccountForTests:149, isTestLabEnabled:154, getTestLabAiTier:159, setTestLabEnabled:164, setTestLabAiTier:170, markTestAccountEmail:176, isEmailTestAccount:186, isEnvFounderEmail:193, isFounderPlayAccount:204, isTesterCohort:218, hasUnlimitedTextCapacity:229, hostedImagesAllowed:240, hasUnlimitedImageCapacity:246, canShowTestLabUi:254, effectiveHostedAiTier:270, effectiveWriterTier:283

## src/game/timeline.ts
4813 B · 155 lines
- exports: collectTurnTimelineFacts, mergeTimeline, formatTimelineForPrompt
- functions: uid:7, pushFact:11, collectTurnTimelineFacts:28, mergeTimeline:147

## src/game/timelineFormat.ts
399 B · 12 lines
- exports: formatTimelineForPrompt
- functions: formatTimelineForPrompt:4

## src/game/tokenD.ts
2371 B · 69 lines
- exports: TokenDResult, classifyRemoteThrow, resolveAmbientTrapBypass, resolveInventoryTrapThrow
- functions: classifyRemoteThrow:14, escapeRegExp:36, resolveAmbientTrapBypass:41, resolveInventoryTrapThrow:61

## src/game/tokenProse.ts
15870 B · 465 lines
- exports: LineFn, TokenLine, TokenBeat, TokenAcceptPath, TOKEN_PROSE_JSON_SCHEMA, looksLikeTokenJson, parseTokenBeat, extractTokenCandidates, lineHasMidSentenceCapital, lineHasUnboundAnimate, refEnumOf, LineVerdict, tokenLineVerdicts, classifyTokenLine, bindCheckFails, renderTokenBeat, knownProperNames, formatTokenRepairFacing, acceptTokenOrLedgerStory
- functions: tidy:88, looksLikeTokenJson:96, extractJsonObject:101, balanceJson:128, parseTokenBeat:150, extractTokenCandidates:190, lineHasMidSentenceCapital:205, lineHasUnboundAnimate:223, toksInText:227, refEnumOf:237, findEnum:243, tokenLineVerdicts:257, classifyTokenLine:269, bindCheckFails:302, renderTokenBeat:320, isFullyClean:335, keepCleanLines:340, knownProperNames:345, missingFns:354, formatTokenRepairFacing:359, acceptTokenOrLedgerStory:373

## src/game/travelAuthority.ts
7338 B · 209 lines
- exports: CameraScale, CameraLock, playerCommittedTravel, playerCommittedArrivalTravel, detectCameraScale, resolveCameraLock, formatCameraBindingLine, harvestCameraIntoSceneFacts, enforceCameraOnState, enforceCameraOnProse, cameraAllowsInteriorMap, cameraPrefersStreetMap, honestLocationName
- functions: playerCommittedTravel:33, playerCommittedArrivalTravel:40, detectCameraScale:48, resolveCameraLock:56, formatCameraBindingLine:60, harvestCameraIntoSceneFacts:68, enforceCameraOnState:127, enforceCameraOnProse:157, cameraAllowsInteriorMap:184, cameraPrefersStreetMap:191, honestLocationName:197

## src/game/turnAsk.ts
4865 B · 129 lines
- exports: TURN_ASK, isTurnCloserLine, stripTurnCloser, gmStoryText, hasRealGmStory, shouldSkipDuplicatePlayerBubble, storyHasBody, storyWordCount, STORY_VALUE_FLOOR_WORDS, isStoryTooThin, shouldShowTurnAsk
- functions: isTurnCloserLine:13, stripTurnCloser:18, gmStoryText:30, hasRealGmStory:39, isHiddenGmRow:54, shouldSkipDuplicatePlayerBubble:65, storyHasBody:82, storyWordCount:91, isStoryTooThin:107, shouldShowTurnAsk:117

## src/game/tutorialBeats.ts
7164 B · 193 lines
- exports: TutorialBeatId, emptyTutorialProgress, ensureTutorialProgress, advanceTutorialBeats, formatTutorialBeatMandate, ensureTutorialQuest
- functions: emptyTutorialProgress:15, ensureTutorialProgress:24, mark:28, advanceTutorialBeats:41, formatTutorialBeatMandate:124, ensureTutorialQuest:167

## src/game/typedEntityValidator.ts
16963 B · 467 lines
- exports: FORBIDDEN_SCRUB_REPLACEMENTS, EntityReference, InvalidReferenceReport, TypedEntityContext, extractEntityContext, validateEntityReferences, validateChoiceReference, rewriteInvalidReferences, assertProtectedEntitiesSurvived, buildEntityRetryBlock, EntityValidationTelemetry, trackValidationMetrics, calculateValidationScore
- functions: extractEntityContext:78, validateEntityReferences:132, validateChoiceReference:215, speakerPreferred:260, isKitLikeName:269, rewriteInvalidReferences:292, assertProtectedEntitiesSurvived:341, buildEntityRetryBlock:359, trackValidationMetrics:416, calculateValidationScore:438

## src/game/types.ts
51457 B · 1419 lines
- exports: Rarity, Item, ItemType, StorageType, ContainerKind, CraftingMaterial, AttributeKey, Attributes, EntityKind, SummonEntity, RelationshipStatus, Relationship, Character, Companion, Container, PlayPhase, QuestStatus, QuestType, QuestUrgency, QuestObjective, Quest, ShrineEntry, BestiaryEntry, RollRecord, MapTier, HexCoordinates, Location3D, TradeCaravan, WorkEthic, DealRisk, HoldingKind, HoldingOrder, WorldClock, WorldDeal, WorldHolding, WorldHostile, WorldActor, FactionStandingLevel, FactionStanding, PowerScaling, WorldLedger, ActiveEncounter, OpeningEstablishment, GameState, RepairSituation, PendingRepair, BeautyOfferStatus, MemorableOfferKind, StoryPlate, BeautyMomentOffer, MemorableMomentState, WorldAtlasRegionState, WorldAtlasSettlement, WorldAtlasState, SaveSlotInfo, PanelImageStatus, MediaKind, LogEntryKind, ComicOverlayEdit, ComicPanel, LogEntry, EngineMode, isFictionEngine, DiceAnimationMode, ContentMode, GmStrictness, StatDisplayMode, StatVerbosity, StatFrequency, NarrativePerspective, ViolenceLevel, CursingLevel, MapTriggerMode, FogRevealThreshold, AiProvider, TurnFrameTheme, KeyStatus, ErrorKind, LoreCardType, LoreCard, TimelineFactKind, CrowdPresence, SceneNoise, TimeOfDay, Weather, TensionLevel, SceneFacts, TimelineFact, SituationPacket, NpcMood, NpcMemory, MapScale, LocationInteractable, LocationExit, LocationSheet, LootPityState, CirclingMemory, PlaceRecord, TutorialProgress, TurnSummary, MemoryPin, ConsequenceThread, CampaignMemoryState, ChapterSummary, ArcSummary, SpeculativeTake, PendingTurnProposal, PostLoginBehavior, BgMode, ArtStylePreset, ColorVariant, PanelFrequency, PanelBorderIntensity, ComicLayoutMode, ComicReadingDirection, ART_STYLE_PRESETS, Settings, DEFAULT_TURN_FRAME, GoogleUser, RARITY_COLORS, ProfessionType, ProfessionSkill, SalvageRequirement
- functions: isFictionEngine:774

## src/game/types/crossPackageContracts.ts
12683 B · 521 lines
- exports: BaseReceipt, FactWrite, ResourceDelta, RelationshipDelta, NpcTurnoverReceipt, NpcKeyMoment, EncounterReceipt, EncounterNpcEffect, CrisisReceipt, DelayedConsequence, ConvergenceReceipt, EndingReceipt, Receipt, NpcEncounterTrigger, NpcCrisisTrigger, PredicateGroup, Predicate, ExclusiveFactGroup, PackageId, buildIdempotencyKey, parseIdempotencyKey
- functions: buildIdempotencyKey:495, parseIdempotencyKey:507

## src/game/uiTheme.test.ts
11078 B · 245 lines

## src/game/uiTheme.ts
12736 B · 322 lines
- exports: INTEGRATION_COSMETIC_DEFAULTS, ensureGoogleFonts, ensureCatalogPreviewFonts, themeBySettingsId, equippedSetName, equippedSetLabel, resolveThemeKitExtras, MATERIAL_THEME_KEYS, MaterialThemeKey, isMaterialThemeKey, themeCoinColor, themePanelTextureUrl, themeAtmosphereUrl, themeFrameFiligreeUrl, PLAY_PROSE_FONT_STACK, readablePlayStoryStack, applyUiThemeToDocument, applySettingsCosmetics
- functions: fontNamesFromStack:29, ensureGoogleFonts:40, ensureCatalogPreviewFonts:59, themeBySettingsId:68, equippedSetName:74, equippedSetLabel:78, resolveThemeKitExtras:86, panelFileForTheme:151, isMaterialThemeKey:155, themeCoinColor:189, themePanelTextureUrl:197, themeAtmosphereUrl:206, themeFrameFiligreeUrl:215, readablePlayStoryStack:226, applyUiThemeToDocument:232, applySettingsCosmetics:314

## src/game/umbraOffline.ts
1296 B · 39 lines
- exports: isUmbraCampaign, umbraAllowsLiveAiTurn, assertNoLiveAiTurnForUmbra
- functions: isUmbraCampaign:9, umbraAllowsLiveAiTurn:23, assertNoLiveAiTurnForUmbra:29

## src/game/unansweredAsk.test.ts
4361 B · 104 lines

## src/game/universalHardRails.ts
4958 B · 83 lines
- exports: CORE_HARD_RAILS, STORE_HARD_RAILS, WEB_HARD_RAILS, UNIVERSAL_HARD_RAILS, resolveHardRailsPrompt, hasRevivePath, HardRailContext, distributionLabel
- functions: resolveHardRailsPrompt:43, hasRevivePath:56

## src/game/useBgImage.ts
6773 B · 180 lines
- exports: Orientation, BgImageState, useBgImage
- functions: detectOrientation:9, getArtStyleKeywords:14, buildAdaptivePrompt:19, buildSceneKey:26, useBgImage:42

## src/game/useCallbackRef.ts
491 B · 17 lines
- exports: useCallbackRef
- functions: useCallbackRef:9

## src/game/useGame.ts
267176 B · 6462 lines
- exports: SETTINGS_EVENT_NAME, extractChoicesFromText, SyncPhase, BootPhase, useGame
- functions: uid:429, loadHabits:440, saveHabit:449, getContentMode:477, yieldToMainThread:481, settleOrphanedImageJobs:529, getLearnedChoices:557, extractChoicesFromText:586, useGame:614

## src/game/useVoice.test.ts
3120 B · 90 lines

## src/game/useVoice.ts
14199 B · 445 lines
- exports: SpeakOpts, VoiceState, SpeechVoicePick, pickSpeechVoice, sortSpeechVoices, proseForSpeech, primeTts, stopAllSpeech, speakTtsNow, useVoice, previewVoiceLine
- functions: normLang:54, pickSpeechVoice:59, sortSpeechVoices:80, resolveTts:89, proseForSpeech:104, hasSpeechSynthesis:120, primeTts:128, stopAllSpeech:143, speakTtsNow:153, speakNow:179, useVoice:194, previewVoiceLine:428

## src/game/vignetteLock.ts
11601 B · 308 lines
- exports: VignetteKind, OpenVignette, isOpenVignette, formatVignetteBindingLine, formatVignetteSnapshotLine, openVignetteFromHubBeat, harvestVignetteIntoSceneFacts, clearVignetteOnHubLeave, applyVignettePresence, vignetteBlocksNewSocialCast, filterPadsAgainstOpenVignette
- functions: uniqNames:40, extractPropMentions:57, extractCastFromProse:70, isOpenVignette:99, formatVignetteBindingLine:103, formatVignetteSnapshotLine:112, openVignetteFromHubBeat:119, harvestVignetteIntoSceneFacts:158, clearVignetteOnHubLeave:229, applyVignettePresence:258, vignetteBlocksNewSocialCast:275, filterPadsAgainstOpenVignette:280

## src/game/visualCanon.test.ts
1306 B · 32 lines

## src/game/visualCanon.ts
7157 B · 157 lines
- exports: WorldEra, WorldCanonState, worldEraForEngine, worldEraForState, formatWorldCanonForPrompt, ImageFailureReason, classifyImageGenFailure, playerFacingImageFailLine, diegeticImageFailureMessage, kidSafeArtDirective, stripKidUnsafeImageLexicon, isUnsalvageableKidImagePrompt, prepareKidSafeImagePrompt
- functions: worldEraForEngine:14, worldEraForState:21, formatWorldCanonForPrompt:54, classifyImageGenFailure:106, playerFacingImageFailLine:126, diegeticImageFailureMessage:149

## src/game/visualConsistency.ts
5118 B · 110 lines
- exports: VisualConsistencyOptions, buildVisualConsistencyBlock
- functions: buildVisualConsistencyBlock:39

## src/game/voiceCadenceSystem.ts
19656 B · 527 lines
- exports: VoicePersonality, VoiceCadence, DictionPattern, VoiceAsideTrigger, ToneSuppression, buildVoiceCadence, buildVoiceAsides, shouldSuppressTone, isPatternOnCooldown, getVoiceAside, updateDictionCooldowns, updateAsideCooldowns, resolveVoicePersonalityFromState, pickStatusVoiceLine, buildAuthorityVoiceHint, formatVoiceCadenceDirective, VoiceTelemetry, trackVoiceMetrics
- functions: buildVoiceCadence:74, buildVoiceAsides:207, shouldSuppressTone:273, isPatternOnCooldown:327, getVoiceAside:338, updateDictionCooldowns:360, updateAsideCooldowns:376, resolveVoicePersonalityFromState:392, pickStatusVoiceLine:418, buildAuthorityVoiceHint:437, formatVoiceCadenceDirective:461, trackVoiceMetrics:510

## src/game/warden.ts
15432 B · 405 lines
- exports: WardenResult, runWarden, sanitizeExtractedCharacterUpdates
- functions: hasCombatContext:49, runWarden:66, sanitizeExtractedCharacterUpdates:386

## src/game/worldAtlas.ts
4475 B · 125 lines
- exports: instantiateWorldAtlas, seedWorldAtlas, revealWorldRegion, maybeRevealFromLocation, formatWorldAtlasBlock, defaultAtlasForMode
- functions: instantiateWorldAtlas:6, seedWorldAtlas:28, revealWorldRegion:44, maybeRevealFromLocation:69, formatWorldAtlasBlock:95, defaultAtlasForMode:121

## src/game/worldMapAuthority.ts
8218 B · 215 lines
- exports: normalizeLocationName, settlementBiomeTags, questFitsSettlement, inferQuestTagsFromText, settlementsFromAtlas, findSettlement, isLegalMapPlace, looksLikeGeographyInvent, seedWorldMapPlaces, pickQuestSiteForTags, formatWorldMapAuthorityBlock, attachSettlementsToAtlas
- functions: normalizeLocationName:11, settlementBiomeTags:27, questFitsSettlement:32, inferQuestTagsFromText:40, settlementsFromAtlas:53, findSettlement:57, isLegalMapPlace:72, looksLikeGeographyInvent:106, seedWorldMapPlaces:113, pickQuestSiteForTags:157, formatWorldMapAuthorityBlock:178, attachSettlementsToAtlas:206

## src/game/worldSim.ts
19446 B · 581 lines
- exports: emptyWorldLedger, normalizeWorldLedger, daysForPlayerAction, WorldTickResult, tickWorld, applyWorldEvents, reportsForVisit, formatWorldLedgerForPrompt, formatTickForGm, clockLabel
- functions: emptyWorldLedger:18, normalizeWorldLedger:31, ethicMult:49, parseEthic:55, parseRisk:62, parseOrder:69, parseHoldingKind:79, slugId:87, weekRng:93, daysForPlayerAction:108, resolveDealWeek:131, resolveHoldingWeek:186, resolveHostileWeek:247, resolveActorWeek:266, resolveOneWeek:281, tickWorld:331, applyWorldEvents:362, reportsForVisit:500, formatWorldLedgerForPrompt:532, formatTickForGm:561, clockLabel:576

## src/game/wornGear.ts
7795 B · 211 lines
- exports: DisplayEquipSlot, normalizeEquipSlot, findEquippedInSlot, parseWornPieces, materializeWornClothes, dropInsultGear
- functions: normalizeEquipSlot:20, findEquippedInSlot:25, hasCombatStats:29, isReplaceableOutfit:33, titleGarment:50, chunkUtterance:62, phraseInChunks:69, parseWornPieces:89, makeWornItem:128, materializeWornClothes:148, dropInsultGear:202

## src/game/writerInfoLayer.ts
7324 B · 172 lines
- exports: WRITER_INFO_LAYER_CHAR_CAP, buildGroundTruthLedger, buildLoreContext, formatWriterInfoLayer
- functions: buildGroundTruthLedger:11, buildLoreContext:83, pickLoreCards:88, formatWriterInfoLayer:114

## src/game/writerPolicy.ts
1847 B · 51 lines
- exports: STAGNATION_MID_WRITER_ENABLED, FREE_WRITER_FAILOVER_OPENROUTER, resolveFreeWriterFailover, resolveWriterTierForTurn
- functions: resolveFreeWriterFailover:24, resolveWriterTierForTurn:40

## src/game/xpPolicy.ts
3079 B · 107 lines
- exports: FAST_XP_AWARDS, FAST_XP_CURVE, CombatXpTier, QuestXpStage, combatXpAmount, questXpAmount, xpRequiredForLevel, awardCombatXp, awardQuestXp, checkLevelUp
- functions: combatXpAmount:32, questXpAmount:38, xpRequiredForLevel:45, awardCombatXp:56, awardQuestXp:69, checkLevelUp:82

## src/game/xpRules.ts
6166 B · 142 lines
- exports: MilestoneKind, DND_XP_BY_CR, DND_LEVEL_THRESHOLDS, DND_XP_BUDGET_PER_CHARACTER, LITRPG_MILESTONE_XP, DND_DEFAULT_CR, normalizeCr, crToXp, dndXpToNext, MilestoneXpResult, milestoneXp
- functions: normalizeCr:72, crToXp:81, dndXpToNext:86, milestoneXp:99, milestoneXpBase:114

## src/legal/credits.ts
8740 B · 274 lines
- exports: CREDITS_PATH, CREDITS_LAST_UPDATED, CreditRow, CreditSection, CREDIT_SECTIONS

## src/legal/legalDocs.ts
11792 B · 212 lines
- exports: LEGAL_SUPPORT_EMAIL, LEGAL_LAST_UPDATED, LegalDocId, LegalSection, LegalDoc, TERMS_DOC, PRIVACY_DOC, getLegalDoc, legalPathToId, isCreditsPath
- functions: getLegalDoc:197, legalPathToId:201, isCreditsPath:208

## src/lib/supabase.ts
2021 B · 68 lines
- exports: isSupabaseConfigured, supabase, signInWithGoogleOAuth, signInWithPassword, signOutSupabase
- functions: signInWithGoogleOAuth:26, signInWithPassword:45, signOutSupabase:64

## src/main.tsx
1782 B · 50 lines
- functions: mountApp:24

## src/services/cbzExportService.ts
4014 B · 160 lines
- exports: exportSessionToCbz, downloadCbz
- functions: crc32:7, u16:18, u32:24, concat:30, buildZip:41, fetchImageBytes:105, collectPanelUrls:115, exportSessionToCbz:129, downloadCbz:152

## src/services/feedbackService.ts
3631 B · 126 lines
- exports: FeedbackType, SubmitFeedbackInput, feedbackRemainingToday, submitPlayerFeedback
- functions: dayUtc:26, feedbackRemainingToday:30, bumpFeedbackRate:42, submitPlayerFeedback:57, defaultSubject:114

## src/services/fluxDirect.ts
2816 B · 100 lines
- exports: FluxGenerateOptions, generateFluxImage
- functions: generateFluxImage:23, sleep:83

## src/services/gmFeedbackService.ts
7108 B · 278 lines
- exports: GmFeedbackType, GmFeedbackRecord, SubmitGmFeedbackInput, GmFeedbackResult, SIGNED_OUT_FEEDBACK_COPY, resolvePlayAuthUser, submitGmFeedback, getGmFeedback, deleteGmFeedback, ListGmFeedbackOptions, ListGmFeedbackResult, listAllGmFeedback, exportGmFeedbackToCsv
- functions: resolvePlayAuthUser:52, submitGmFeedback:61, getGmFeedback:114, deleteGmFeedback:146, listAllGmFeedback:194, exportGmFeedbackToCsv:243

## src/services/hostedImagePath.test.ts
9652 B · 276 lines

## src/services/llmDirectorService.ts
16379 B · 348 lines
- exports: DirectorRequestError, DirectorParseError, GeneratePanelScriptOptions, generatePanelScript
- functions: buildDirectorSystemPrompt:81, buildDirectorUserPrompt:92, stripCodeFences:118, normalizePanel:126, parseComicScriptContent:168, applyKidModeToDirectorScript:203, generatePanelScript:246

## src/services/mailService.ts
2227 B · 74 lines
- exports: PlayerMailStatus, PlayerMailMessage, resolveSupportUserId, listMyMail, markMailRead, unreadMailCount
- functions: resolveSupportUserId:19, listMyMail:29, markMailRead:62, unreadMailCount:71

## src/services/openRouterService.ts
32867 B · 853 lines
- exports: PRIMARY_IMAGE_MODEL, HERO_IMAGE_MODEL, ImageGenerationError, ImageModerationError, fetchComicPanel, GenerateComicImageOptions, generateComicImage, VideoProviderNotConfiguredError, generateVideo
- functions: withPureArtDirective:40, isModerationRefusal:98, fetchComicPanel:125, withAbortTimeout:383, toDataUri:402, fetchOpenAIImage:410, fetchAutomatic1111Image:458, fetchComfyUIImage:507, generateComicImage:607, generateVideo:810

## src/services/pdfExportService.ts
30982 B · 815 lines
- exports: exportSessionToPdf, downloadPdf
- functions: parseCssColor:52, mapFontFamily:83, pxToInClamped:91, layoutGrid:100, loadHtmlImage:138, compositeImageAtDpi:151, resolvePanelArtwork:202, resolvePanelsPerPage:220, packPagesForPrint:234, drawWrappedText:320, drawSegmentChip:340, drawPanelOverlay:384, drawPanelBorder:403, drawPlaceholderArt:410, resolveBakedPanelArtwork:424, renderStoryPageGrid:450, renderFullBleedFeaturePage:503, renderTextOnlyPage:537, renderCoverPage:565, renderStatsPage:594, renderEpiloguePage:653, exportSessionToPdf:711, downloadPdf:805

## src/services/sessionImageCache.ts
6025 B · 195 lines
- exports: SessionImageCacheEntry, hashImageCacheParts, bindSessionImageCache, getActiveSessionImageCacheId, getSessionCachedImage, putSessionCachedImage, clearSessionImageCache
- functions: openDb:27, hashImageCacheParts:47, compoundKey:57, assertBoundSaveId:61, remember:71, bindSessionImageCache:85, getActiveSessionImageCacheId:93, getSessionCachedImage:97, putSessionCachedImage:129, clearSessionImageCache:164

## src/services/telemetryService.ts
11865 B · 327 lines
- exports: TelemetryLogInsert, AiTrafficInsert, setTelemetryContext, logTelemetryEvent, logAiTraffic, logPlayerAction, logRollResults, logApiLatency, logErrorStack, installTelemetryDebugBridge
- functions: setTelemetryContext:46, baseMeta:58, mapStatus:66, mapProvider:82, mapEngineMode:91, logTelemetryEvent:100, logAiTraffic:135, logPlayerAction:183, logRollResults:193, logApiLatency:211, logErrorStack:247, installTelemetryDebugBridge:262

## src/styles/styleSpecs.ts
18522 B · 386 lines
- exports: UiOverlayTheme, StyleSpec, STYLE_SPECS, getStyleSpec, getColorVariantDirective, KID_MODE_NEGATIVE_PROMPT, KID_MODE_STYLE_DIRECTIVE, getEffectiveNegativePrompt
- functions: getStyleSpec:332, getColorVariantDirective:341, getEffectiveNegativePrompt:380

## src/types/comicScript.ts
3741 B · 101 lines
- exports: CAMERA_ANGLE_EXAMPLES, ComicDialogueLine, ComicTextAnchor, COMIC_TEXT_ANCHORS, normalizeTextAnchor, ComicPanelScript, ComicScriptResponse
- functions: normalizeTextAnchor:52

## src/types/index.ts
2303 B · 117 lines
- exports: ProgressionMode, SpellSlot, AttunementSlot, SkillNode, StatTracker, Combatant, EnemyTemplate, MockSkill, MockLoot, MockEnemy, Rarity, Item, ItemType, AttributeKey, Attributes, Character, GameState, LogEntry, Quest, QuestStatus, QuestType, RollRecord, EngineMode, Settings, ActiveEncounter, Companion, Container, CraftingMaterial, SummonEntity, LoreCard, LoreCardType, MapNode, MapBlueprint, ActiveDungeonState, ComicPanelScript, ComicDialogueLine, ComicScriptResponse, ComicTextAnchor, CAMERA_ANGLE_EXAMPLES, COMIC_TEXT_ANCHORS, normalizeTextAnchor, PrintFormat, PrintFormatSpec, PanelsPerPageMode, PdfExportOptions, BookPagePanel, PdfBookPage, PRINT_FORMATS

## src/types/pdfExport.ts
4706 B · 99 lines
- exports: PrintFormat, PrintFormatSpec, PRINT_FORMATS, PanelsPerPageMode, PdfExportOptions, BookPagePanel, BookPage

## src/utils/comicPageCompositor.ts
13954 B · 435 lines
- exports: BakePanelSnapshotOptions, anchorOriginPx, bakeComicPanelSnapshot, bakeComicPageSnapshot
- functions: loadHtmlImage:31, parseCssColor:41, colorCss:71, anchorOriginPx:76, wrapText:97, drawCoverArt:115, applyEdits:141, layoutChips:156, drawRoundedRect:205, drawChip:223, bakeComicPanelSnapshot:302, bakeComicPageSnapshot:362

## src/utils/filterLogic.ts
5586 B · 148 lines
- exports: applyKidFriendlySwears, sanitizeInput
- functions: charClass:96, termPattern:102, pickAlt:114, matchCase:120, applyKidFriendlySwears:135, sanitizeInput:144

## src/utils/safeLazy.tsx
2336 B · 81 lines
- exports: CHUNK_RELOAD_KEY, isChunkLoadError, safeLazy, LazyChunkBoundary
- functions: isChunkLoadError:9, safeLazy:19

## src/utils/smartPlacement.ts
5466 B · 143 lines
- exports: QuietQuadrant, findQuietQuadrant
- functions: scheduleOffMainTurn:12, getCanvasSafeImage:30, analyzeQuietQuadrant:64, findQuietQuadrant:135

## supabase/functions/_shared/gm/archetypes.ts
21788 B · 269 lines
- exports: LitRpgArchetype, DndOpening, CampaignArchetype, ArchetypeOption, LITRPG_ARCHETYPES, DND_OPENINGS, RPG_OPENINGS, getArchetypeOptions, getDefaultArchetype, buildArchetypeRules, buildArchetypeIntro
- functions: getArchetypeOptions:74, getDefaultArchetype:80, buildArchetypeRules:202, buildArchetypeIntro:228

## supabase/functions/_shared/gm/beatContract.ts
21246 B · 581 lines
- exports: BeatKind, BeatContract, resolveBiblePrefix, contractsForState, contractById, resolveTurnJob, selectDueBeat, forcedEncounterBeat, engineAllowsCombat, SealedBeatVerb, SealedBeatCard, WRITER_RHYTHM_WINDOW, WRITER_RHYTHM_CHAR_CAP, classifySealedVerb, sealedCastNames, sealedClosedFacts, legalTravelDestinations, isLegalTravelDestination, buildSealedBeatCard, formatSealedBeatCard, formatWriterFacingPacket, inventedCastNamesInProse, isInventedCastViolation, isWrongHereViolation, isSealedCardViolation
- functions: resolveBiblePrefix:206, contractsForState:236, contractById:242, resolveTurnJob:249, selectDueBeat:284, forcedEncounterBeat:298, engineAllowsCombat:327, classifySealedVerb:347, lastPlayerAction:362, openingPinsLockedOut:372, sealedCastNames:382, sealedClosedFacts:402, legalTravelDestinations:420, isLegalTravelDestination:435, sealedTone:444, buildSealedBeatCard:458, formatSealedBeatCard:476, formatWriterFacingPacket:492, pcName:503, inventedCastNamesInProse:508, isInventedCastViolation:538, isWrongHereViolation:545, isSealedCardViolation:570

## supabase/functions/_shared/gm/beatFingerprint.ts
8096 B · 214 lines
- exports: normalizeProseTokens, tokenJaccard, beatFingerprint, beatSimilarity, isSameBeat, maxBeatSimilarity, isNearClone, buildBeatNoveltyRetryBlock, normalizePlayerIntentKey, loiterFamilyKey, coerceLogContent, IntentStreak, countLoiterFamilyStreak, countPlayerIntentStreak
- functions: normalizeProseTokens:6, tokenJaccard:18, beatFingerprint:28, sketchSet:49, beatSimilarity:55, isSameBeat:68, maxBeatSimilarity:78, isNearClone:90, buildBeatNoveltyRetryBlock:98, normalizePlayerIntentKey:109, loiterFamilyKey:137, coerceLogContent:155, countLoiterFamilyStreak:168, countPlayerIntentStreak:193

## supabase/functions/_shared/gm/bindingConstraints.ts
14796 B · 416 lines
- exports: BindingConstraint, buildBindingConstraints, formatBindingConstraintsForPrompt, detectConstraintViolations, repairConstraintViolations
- functions: capList:24, collectLooseLabels:29, buildBindingConstraints:38, buildExitConstraints:82, buildPropItemConstraints:110, buildPresenceConstraints:139, buildSceneConstraints:169, buildInventoryConstraints:246, formatBindingConstraintsForPrompt:290, detectConstraintViolations:326, repairConstraintViolations:372

## supabase/functions/_shared/gm/campaignBibleTypes.ts
6782 B · 188 lines
- exports: Difficulty, LoreSnippet, KeyNPC, MysteryCulprit, StarterQuest, OpeningPromptKind, OpeningVoice, OpeningAskStyle, OpeningMode, OpeningBeatCard, OpeningHookCard, OpeningRegistrar, OpeningPrompt, StarterItem, CampaignBible

## supabase/functions/_shared/gm/campaignContract.ts
5285 B · 156 lines
- exports: CampaignContract, CampaignDivergence, freezeCampaignContract, ensureCampaignContract, detectCampaignDivergences, mergeCampaignDivergences, formatCampaignContractForPrompt
- functions: freezeCampaignContract:38, ensureCampaignContract:74, detectCampaignDivergences:90, mergeCampaignDivergences:128, formatCampaignContractForPrompt:142

## supabase/functions/_shared/gm/campaignMemory.ts
32695 B · 967 lines
- exports: emptyCampaignMemory, ensureCampaignMemory, extractLosslessFacts, pinOpenPlayerAsk, extractPromisesFromProse, extractSilencedSpeechFromProse, resolveConsequences, maybeAppendTurnSummary, maybeRefreshCampaignSummary, derivePersonalitySummary, upsertNpcRelationshipSummary, autoPin, addPlayerPin, addConsequence, retrieveMemorySnippets, retrieveMemoriesSmartly, formatCampaignMemoryForPrompt, advanceCampaignMemory, scoreMemoryImportance, scoreAllMemoryImportance, selectImportantMemories, createChapterSummary, maybeCreateChapterSummary, createArcSummary, maybeCreateArcSummary, calculateMemoryBudget
- functions: emptyCampaignMemory:26, ensureCampaignMemory:41, compressLine:45, extractLosslessFacts:53, pinOpenPlayerAsk:107, extractPromisesFromProse:146, extractSilencedSpeechFromProse:176, resolveConsequences:204, escapeReg:255, maybeAppendTurnSummary:260, maybeRefreshCampaignSummary:292, derivePersonalitySummary:325, upsertNpcRelationshipSummary:335, autoPin:350, addPlayerPin:378, addConsequence:403, retrieveMemorySnippets:421, retrieveMemoriesSmartly:459, formatCampaignMemoryForPrompt:497, advanceCampaignMemory:586, scoreMemoryImportance:693, scoreAllMemoryImportance:740, selectImportantMemories:754, createChapterSummary:778, maybeCreateChapterSummary:846, createArcSummary:873, maybeCreateArcSummary:923, calculateMemoryBudget:952

## supabase/functions/_shared/gm/campaignNsfw.ts
428 B · 11 lines
- exports: campaignIsNsfw
- functions: campaignIsNsfw:4

## supabase/functions/_shared/gm/choiceTierRules.ts
5456 B · 58 lines
- exports: CHOICE_TIER_PROMPT_RULES, formatChoiceTierModeDna
- functions: formatChoiceTierModeDna:55

## supabase/functions/_shared/gm/chromeAuthority.ts
20022 B · 426 lines
- exports: normalizeChromeToken, isCoverSlotLabel, isUiChromeNoun, isChromePersonToken, isUnresolvedDeixisToken, isPolityFactionOrPlaceToken, isRoleAdjectivePersonSlot, isRoleContactLabel, isHubRoleCompoundToken, detectHubRoleMadlib, isChoicePadPersonToken, isDialogueVerbPersonToken, isPlannerUiPersonToken, isNonPersonNameToken, isFactionOrOrgToken, filterChromeFromPresent, realPresentPeople, isAggregatePersonToken, chromeSpeechAnchor, isChromeTalkChoice, formatCoverChromeBindingLine, rewriteChromeSpeakerTags, rewriteChromePersonClauses
- functions: normalizeChromeToken:29, isCoverSlotLabel:36, isUiChromeNoun:40, isChromePersonToken:47, isUnresolvedDeixisToken:79, isPolityFactionOrPlaceToken:87, isRoleAdjectivePersonSlot:110, isRoleContactLabel:125, isHubRoleCompoundToken:138, detectHubRoleMadlib:148, isChoicePadPersonToken:168, isDialogueVerbPersonToken:188, isPlannerUiPersonToken:209, isNonPersonNameToken:230, isFactionOrOrgToken:245, filterChromeFromPresent:251, realPresentPeople:261, isAggregatePersonToken:278, chromeSpeechAnchor:289, isChromeTalkChoice:297, formatCoverChromeBindingLine:305, tidyChromeClauses:309, rewriteChromeSpeakerTags:328, rewriteChromePersonClauses:368

## supabase/functions/_shared/gm/claimGrounding.ts
1326 B · 15 lines
- exports: formatClaimGroundingDirective
- functions: formatClaimGroundingDirective:8

## supabase/functions/_shared/gm/closedFactLedger.ts
4685 B · 121 lines
- exports: harvestGivenAwayFromProse, harvestResolvedCrisisFromProse, applyClosedFactHarvest, isGivenItemReopened, isResolvedCrisisRewound, isClosedLedgerViolation
- functions: escapeRe:9, knownItemNeedles:25, mentionedItems:39, harvestGivenAwayFromProse:51, harvestResolvedCrisisFromProse:68, applyClosedFactHarvest:74, isGivenItemReopened:103, isResolvedCrisisRewound:112, isClosedLedgerViolation:118

## supabase/functions/_shared/gm/closedScenePerson.ts
9594 B · 256 lines
- exports: listedAnonymousRoles, isThornferryClerkSite, sceneHasRoleOccupancy, sceneAllowsRoleIntroduction, isInventedNamedIdentity, isInventedClosedScenePerson, isClosedScenePersonPad, filterClosedScenePersonPads, harvestRoleOccupancy, trimAnonymousRolesOnLocationChange
- functions: lastPlayerLine:30, normalizeRole:38, listedAnonymousRoles:42, presentMentionsRole:46, hubContactAllowsRole:66, isThornferryClerkSite:75, sceneHasRoleOccupancy:79, sceneAllowsRoleIntroduction:88, occupancyHasName:106, isInventedNamedIdentity:125, roleActorHits:148, isInventedClosedScenePerson:172, isClosedScenePersonPad:190, filterClosedScenePersonPads:203, harvestRoleOccupancy:208, trimAnonymousRolesOnLocationChange:249

## supabase/functions/_shared/gm/combatAuthority.ts
19303 B · 489 lines
- exports: canAttachLiveFight, LastKill, isHumanoidEnemyName, enemyBodyAuthorityLine, scrubBeastifiedHumanoid, scrubDeniedKill, formatLastKillSnapshotLine, isLastKillTalkPad, matchesLastKillName, sentenceMentionsLastKill, isDeadFoeCorpseOk, shouldRewriteDeadFoeSentence, isDeadFoeReopenedAsLiving, isClosedKillRecycle, attachLastKill, lastGmMentionsEnemy, proseMentionsEnemy, foeVisibleInScene, autoFightSpawnPreface, scrubCombatSpawnLog, hasCombatSpawnLogInBody, scrubDroughtSpawnInvent, markPendingSpawnPreface, ensureEncounterSpawnPreface, commitAutoFightLedger, narrateAutoFightTemplate, lastKillFromAutoFightLog
- functions: sceneFactsBase:9, canAttachLiveFight:21, isHumanoidEnemyName:44, enemyBodyAuthorityLine:51, scrubBeastifiedHumanoid:58, scrubDeniedKill:73, formatLastKillSnapshotLine:92, isLastKillTalkPad:105, matchesLastKillName:124, lastKillMentionRe:158, sentenceMentionsLastKill:164, isDeadFoeCorpseOk:175, shouldRewriteDeadFoeSentence:179, isDeadFoeReopenedAsLiving:187, isClosedKillRecycle:198, attachLastKill:208, lastGmMentionsEnemy:229, proseMentionsEnemy:234, foeVisibleInScene:241, autoFightSpawnPreface:256, scrubCombatSpawnLog:268, hasCombatSpawnLogInBody:283, scrubDroughtSpawnInvent:295, markPendingSpawnPreface:334, ensureEncounterSpawnPreface:358, commitAutoFightLedger:430, narrateAutoFightTemplate:456, lastKillFromAutoFightLog:471

## supabase/functions/_shared/gm/comicScript.ts
3741 B · 101 lines
- exports: CAMERA_ANGLE_EXAMPLES, ComicDialogueLine, ComicTextAnchor, COMIC_TEXT_ANCHORS, normalizeTextAnchor, ComicPanelScript, ComicScriptResponse
- functions: normalizeTextAnchor:52

## supabase/functions/_shared/gm/completedEventPacket.ts
84834 B · 2151 lines
- exports: EventOutcome, CompletedEventPacket, LedgerRefClass, TokenUse, LedgerRef, TokenUseRef, classifyVerb, PacketBuildExtras, NounAllowlistOpts, compileNounAllowlist, tokenUseMatchesClass, compileRefEnum, formatRefEnumForWriter, LoiterStreakFamily, classifyLoiterFamily, nextLoiterStreaks, collapseLoiterWriterBeats, buildCompletedEventPacket, ledgerActionStitch, attachCompletedEvent, formatWriterFacingEvent, mentionAllowlistHas, inventedTitleCaseNotOnAllowlist, proseViolatesEventPacket, PACKET_STITCH_FINGERPRINTS, RETIRED_DROUGHT_STUB, isDroughtStubProse, isUnaskedCombatClose, isLastGmReprint, lastResortStoryBody, bookBodyAfterWriterMiss, isPacketStitchProse, assemblePacketStitch, prepareRetrospectiveWriterInput
- functions: lastPlayerAction:154, classifyVerb:164, isIntentRemainderNoun:207, livingLedgerPeople:216, matchLedgerNoun:221, extractTarget:246, liveEncounterHp:281, isGenericHereLabel:289, locationLabel:293, pushUnique:310, castMentionNames:337, compileNounAllowlist:343, slugRefId:401, tokenUseMatchesClass:419, compileRefEnum:427, formatRefEnumForWriter:483, isCombatVerb:491, resolveOutcome:495, rhythmBeats:534, classifyLoiterFamily:544, hereKey:551, nextLoiterStreaks:559, ledgerFocusNoun:592, collapseLoiterWriterBeats:608, buildCompletedEventPacket:618, hubDescriptor:708, ledgerPlaceFacts:718, sceneAnswerWho:741, listNames:748, capFirst:753, descriptorSentence:757, onceSaid:763, peopleHereSentence:773, exitsSentence:778, stayedPreposition:783, isExitsAsk:787, isLookAroundAct:791, ledgerActionStitch:799, attachCompletedEvent:868, formatWriterFacingEvent:892, mentionAllowlistHas:946, allowlistHas:957, inventedTitleCaseNotOnAllowlist:961, isInstructionVoice:982, hasChoiceListLeak:995, prematureLoot:1003, aliveVsDeadContradiction:1014, wrongHereOnPacket:1029, proseViolatesEventPacket:1043, lookFocus:1068, lookTail:1072, beVerbFor:1081, isDroughtStubProse:1536, lastGoodGmBody:1542, cardPageParagraph:1556, isUnaskedCombatClose:1567, lastCommittedGmBody:1572, sameBeat:1577, isLastGmReprint:1584, destFromAct:1595, herePhrase:1605, castHead:1613, pickAdvanceVariant:1621, topicAdvancePool:1633, topicAdvanceStitch:1801, ledgerAdvanceBeat:1816, lastResortUsable:1820, lastResortStoryBody:1840, bookBodyAfterWriterMiss:1893, isPacketStitchProse:1916, corpseRemains:1923, stitchBankKey:1928, ledgerStitchSlots:1964, pickStitchTemplate:1998, renderHallTalkAnswer:2013, clipSpoken:2055, renderSpokenTalkFallback:2062, assemblePacketStitch:2081, prepareRetrospectiveWriterInput:2127

## supabase/functions/_shared/gm/contentFilterProfile.ts
7393 B · 178 lines
- exports: ContentFilterProfileId, ImageSafetyMode, ContentFilterProfile, BYOK_DISCLAIMER_TEXT, resolveContentFilterProfile, hasByokKeysConfigured, isByokProfile, profileAllowsNsfwCatalog, profileAllowsExplicitIntimateProse
- functions: resolveContentFilterProfile:91, hasByokKeysConfigured:160, isByokProfile:167, profileAllowsNsfwCatalog:171, profileAllowsExplicitIntimateProse:175

## supabase/functions/_shared/gm/contentModeRules.ts
2560 B · 29 lines
- exports: KID_MODE_RULES, ADULT_MODE_RULES, NSFW_CAMPAIGN_RULES, CORE_HARD_RAILS, STORE_HARD_RAILS, WEB_HARD_RAILS, UNIVERSAL_HARD_RAILS, resolveHardRailsPrompt

## supabase/functions/_shared/gm/craftBookCompiler.ts
25238 B · 763 lines
- exports: CraftWhen, CraftSignal, CraftRule, CraftLedger, CraftCompileResult, noteThumbsDownFeedback, consumeThumbsDownSignal, CRAFT_RULES, classifyCraftWhen, compileCraftRules, formatCraftSnapshotLines, CraftProgressionPolicy, craftProgressionPolicy, isCraftStarvedPad, applyCraftLearning, craftRulesForMode, assertCraftAuthorityBudget, stampCraftApplied, proseIgnoresCraft
- functions: noteThumbsDownFeedback:47, consumeThumbsDownSignal:51, lastPlayerText:446, lastGmText:457, classifyCraftWhen:465, lastBeatLooksAtmosphere:491, detectDrought:499, scoreRule:524, compileCraftRules:540, formatCraftSnapshotLines:577, craftProgressionPolicy:593, isCraftStarvedPad:626, applyCraftLearning:645, craftRulesForMode:671, assertCraftAuthorityBudget:675, stampCraftApplied:679, proseIgnoresCraft:695

## supabase/functions/_shared/gm/craftKeepers.ts
2379 B · 75 lines
- exports: CraftKeeper, resetCraftKeepers, listCraftKeepers, noteThumbsUpKeeper, formatLikedKeeperForPrompt
- functions: asMode:21, excerpt:26, resetCraftKeepers:34, listCraftKeepers:38, noteThumbsUpKeeper:43, formatLikedKeeperForPrompt:66

## supabase/functions/_shared/gm/crowdAuthority.ts
20651 B · 530 lines
- exports: CrowdBucket, CrowdHeadcount, CROWD_ENTER, CROWD_LEAVE, crowdBucket, canonicalCrowdPhrase, isNonPersonToken, isAggregateToken, isOccupancyToken, isPersonToken, isNamedPersonToken, countPersonTokens, crowdFluxInText, resolveCrowdHeadcount, calculateCrowdSize, crowdSizeForWarden, formatCrowdSnapshotLine, formatCrowdBindingLine, formatPresenceForSnapshot, syncPresentToCount, CrowdMention, detectCrowdMention, listCrowdMentions, normalizeCrowdRewriteArtifacts, scrubInventedCrowdSize, harvestCrowdIntoSceneFacts
- functions: crowdBucket:87, canonicalCrowdPhrase:96, isNonPersonToken:113, isAggregateToken:118, isOccupancyToken:122, isPersonToken:126, isNamedPersonToken:133, countPersonTokens:140, crowdFluxInText:144, extrasBeyondPresent:149, resolveCrowdHeadcount:165, calculateCrowdSize:205, crowdSizeForWarden:215, formatCrowdSnapshotLine:225, formatCrowdBindingLine:239, formatPresenceForSnapshot:251, syncPresentToCount:259, parseNumberWord:267, mention:282, detectCrowdMention:287, listCrowdMentions:327, applyCase:359, normalizeCrowdRewriteArtifacts:368, spansCanonicalPhrase:405, scrubInventedCrowdSize:421, harvestCrowdIntoSceneFacts:477

## supabase/functions/_shared/gm/customTabletopRules.ts
2261 B · 59 lines
- exports: CUSTOM_TABLETOP_RULES_MAX_CHARS, clipCustomTabletopRules, hasCustomTabletopRules, formatCustomTabletopRulesForPrompt
- functions: clipCustomTabletopRules:11, hasCustomTabletopRules:26, formatCustomTabletopRulesForPrompt:34

## supabase/functions/_shared/gm/distributionChannel.ts
4455 B · 132 lines
- exports: DistributionChannel, getDistributionChannel, isStoreDistribution, isWebDistribution, distributionLabel, allowsNsfwCatalog, allowsExplicitIntimateProse, allowsByokMode, canConfigurePlayerAiKeys, isByokTierWithoutHostedKeys, shouldUseHostedImageProxy, BYOK_TEXT_KEY_REQUIRED, BYOK_IMAGE_KEY_REQUIRED, resolveClientTextApiKey, resolveClientImageApiKey, resolveByokImageSpendKey
- functions: getDistributionChannel:15, isStoreDistribution:27, isWebDistribution:31, distributionLabel:36, allowsNsfwCatalog:43, allowsExplicitIntimateProse:51, allowsByokMode:56, canConfigurePlayerAiKeys:64, isByokTierWithoutHostedKeys:76, shouldUseHostedImageProxy:89, resolveClientTextApiKey:108, resolveClientImageApiKey:116, resolveByokImageSpendKey:124

## supabase/functions/_shared/gm/dungeonLifecycle.ts
5275 B · 156 lines
- exports: placeAllowsDungeon, openDungeonAtSite, closeDungeon, shouldAutoCloseDungeon, maybeAutoCloseDungeon, buildInteriorFloorPlan
- functions: placeAllowsDungeon:13, openDungeonAtSite:30, markPlaceDungeonRef:67, closeDungeon:95, shouldAutoCloseDungeon:131, maybeAutoCloseDungeon:148

## supabase/functions/_shared/gm/dungeonMobLedger.ts
7154 B · 202 lines
- exports: CURRENT_SAVE_REPAIR_REVISION, NodeMob, LooseNodeItem, DUNGEON_NEUTRALIZED_MILESTONE, isCombatLocked, mobCountsAsRemaining, normalizeDungeonMobLedger, restoreParkedEncounter, parkMobHpAtCurrentNode, markDefeatedMobAtCurrentNode, countRemainingMobsOnDungeon
- functions: isCombatLocked:17, mobCountsAsRemaining:21, normalizeMob:28, normalizeHidden:52, normalizeDungeonNodes:76, normalizeDungeonMobLedger:93, restoreParkedEncounter:106, parkMobHpAtCurrentNode:136, markDefeatedMobAtCurrentNode:162, countRemainingMobsOnDungeon:191

## supabase/functions/_shared/gm/dungeonPresence.ts
1144 B · 31 lines
- exports: remainingDungeonMobs
- functions: remainingDungeonMobs:5

## supabase/functions/_shared/gm/dungeonSeed.ts
18663 B · 549 lines
- exports: MobRole, HiddenLoot, CHEST_GRADE_LABELS, PITY_THRESHOLDS, rollLootRarity, rollLootRarityWithPity, seedDungeonState, currentDungeonNode, interactablesFromNode, mergeSheetWithNode, formatHiddenRoomLedger, openLootableInDungeon, LootSource, ResolveLootOptions, resolveSeededRarity, markLootablesOpenedOnGain, NodeHidden
- functions: isEpicPlus:42, rollLootRarity:47, rollLootRarityWithPity:58, nodeTags:95, isBossNode:99, buildHiddenForNode:104, seedDungeonState:207, currentDungeonNode:236, interactablesFromNode:242, mergeSheetWithNode:277, formatHiddenRoomLedger:292, openLootableInDungeon:354, rarityRank:377, maxRarity:381, bumpBand:385, runFloorRarity:390, resolveSeededRarity:409, markLootablesOpenedOnGain:528

## supabase/functions/_shared/gm/encounterTerminalFsm.ts
16841 B · 488 lines
- exports: EncounterPhase, TerminalOutcome, EncounterClearedReceipt, EncounterCaps, encounterCapsForMode, initEncounterTerminal, isEncounterIdleIntent, fleeAvailable, parleyAvailable, TickEncounterResult, ENCOUNTER_REENGAGE_COOLDOWN, tickEncounterTerminal, detectParleySuccessInProse, settleParleyAfterProse, isEncounterOnCooldown, formatEncounterClearedStatus, forceClearIfStale, isEncounterEngaged, encounterBlocksTravel, canTravelInFsmState, canInspectInFsmState, canShopInFsmState, getAllowedCombatActions
- functions: encounterCapsForMode:33, initEncounterTerminal:41, isFleeIntent:66, isParleyIntent:70, isAttackIntent:74, isEncounterIdleIntent:79, fleeAvailable:91, parleyAvailable:97, resolveForcedOutcome:102, tickEncounterTerminal:134, detectParleySuccessInProse:215, settleParleyAfterProse:233, attachLastKillOnVictory:269, commitClear:301, isEncounterOnCooldown:348, formatEncounterClearedStatus:354, forceClearIfStale:369, isEncounterEngaged:380, encounterBlocksTravel:386, canTravelInFsmState:399, canInspectInFsmState:418, canShopInFsmState:431, getAllowedCombatActions:444

## supabase/functions/_shared/gm/entityCast.ts
10660 B · 377 lines
- exports: CastMember, AnonymousGroup, ThreatEntity, Cast, buildEntityCast, getCastSummary
- functions: buildEntityCast:55, extractNamedCharacters:72, extractHubArrivalContact:145, extractAnonymousEntities:168, extractActiveThreats:220, determineThreatState:239, generateConstraints:251, formatCastBlock:283, findFirstSeenTurn:335, isProperName:350, getCastSummary:357

## supabase/functions/_shared/gm/entityRegistry.ts
16803 B · 414 lines
- exports: isCommonRoleNpc, isBareHonorificTitle, isTitlePlusGiven, isHubContactProperName, canHarvestAsNamedPerson, isRegisteredNpc, isRegisteredLocation, isRegisteredEntity, getRegisteredNpcs, getRegisteredLocations
- functions: isCommonRoleNpc:236, isBareHonorificTitle:244, isTitlePlusGiven:252, isRegistryProperName:258, isHubContactProperName:294, canHarvestAsNamedPerson:321, isRegisteredNpc:348, isRegisteredLocation:360, isRegisteredEntity:389, getRegisteredNpcs:404, getRegisteredLocations:411

## supabase/functions/_shared/gm/exhaustionCurve.ts
216 B · 6 lines
- exports: ContentDensityState, formatExhaustionSummary
- functions: formatExhaustionSummary:3

## supabase/functions/_shared/gm/factLocks.ts
7497 B · 191 lines
- exports: FactLockKind, FactLockViolation, detectFactLockViolations, applyFactLocks, buildFactLockRetryBlock
- functions: clockAllowsSkip:43, playerAskedKit:49, crowdIsLoud:53, detectFactLockViolations:59, splitSentences:114, lockSentence:119, sanitizeSystemBlock:147, applyFactLocks:160, buildFactLockRetryBlock:180

## supabase/functions/_shared/gm/filterLogic.ts
5586 B · 148 lines
- exports: applyKidFriendlySwears, sanitizeInput
- functions: charClass:96, termPattern:102, pickAlt:114, matchCase:120, applyKidFriendlySwears:135, sanitizeInput:144

## supabase/functions/_shared/gm/fluidProseRails.ts
10572 B · 101 lines
- exports: MODE_STORY_AUTHORITY, formatModeStoryAuthorityLine, MODE_GOLD_SHAPE, formatGoldShapeForPrompt, formatFluidProseRailsForPrompt
- functions: formatModeStoryAuthorityLine:24, formatGoldShapeForPrompt:92, formatFluidProseRailsForPrompt:97

## supabase/functions/_shared/gm/folkVoiceExpectations.ts
18473 B · 355 lines
- exports: FolkVoiceProfile, FolkVoiceFormatOptions, FOLK_VOICE_PROFILES, detectActiveFolkIds, formatFolkVoiceForPrompt
- functions: collectFolkSearchText:269, textHasLabel:291, detectActiveFolkIds:301, formatCrossFolkCues:312, formatFolkVoiceForPrompt:320

## supabase/functions/_shared/gm/forwardProgressGovernor.ts
2023 B · 76 lines
- exports: ProgressDeltaKind, ProgressDelta, ProgressGovernorState, initProgressGovernor, hasActiveObjectives, checkProgressGovernor
- functions: initProgressGovernor:30, hasActiveObjectives:38, checkProgressGovernor:53

## supabase/functions/_shared/gm/gmVoiceProfile.ts
21806 B · 447 lines
- exports: GmVoiceProfileId, GmPersonalityId, SystemPersonalityId, GmVoiceProfile, GM_VOICE_FIREWALL, GM_VOICE_PROFILES, DEFAULT_TABLETOP_GM_PERSONALITY, DEFAULT_RPG_GM_PERSONALITY, DEFAULT_PYOA_GM_PERSONALITY, DEFAULT_LITRPG_SYSTEM_PERSONALITY, TABLETOP_GM_PERSONALITIES, TABLETOP_GM_PERSONALITIES_MORE, TABLETOP_GM_PERSONALITIES_ALL, LAUNCH_LITRPG_SYSTEM_PERSONALITY_IDS, LAUNCH_GM_PERSONALITY_IDS, LITRPG_SYSTEM_PERSONALITIES, LITRPG_FEATURED_SYSTEM_PERSONALITIES, LITRPG_SYSTEM_PERSONALITIES_SHOP, isGmPersonalityId, isSystemPersonalityId, isGmVoiceProfileId, resolveGmVoiceProfile, resolveTabletopGmPersonality, resolveRpgGmPersonality, resolvePyoaGmPersonality, resolveLitrpgSystemPersonality, suggestedThemeForVoice, resolveVoiceIdForState, formatGmVoiceForPrompt
- functions: isGmPersonalityId:308, isSystemPersonalityId:312, isGmVoiceProfileId:316, resolveGmVoiceProfile:320, resolveTabletopGmPersonality:324, resolveRpgGmPersonality:328, resolvePyoaGmPersonality:332, resolveLitrpgSystemPersonality:336, suggestedThemeForVoice:340, resolveVoiceIdForState:345, formatGmVoiceForPrompt:374

## supabase/functions/_shared/gm/hookArc.ts
327 B · 17 lines
- exports: HookArcStage, HookArcState

## supabase/functions/_shared/gm/hookLock.ts
13629 B · 377 lines
- exports: HookNature, HookLockSource, HookLock, HookMention, listHookMentions, detectHookNature, classifyHookNature, lockHookFromText, seedHookLockFromPickedHook, resolveHookLock, hookLockForWarden, formatHookBindingLine, hookManifestFact, hookForbiddenReversal, detectHookContradiction, naturesConflict, talkContradictsLockedWhy, factionNoteForHook, alignFactionNotesToHook, playerMayReviseHook, reviseHookLock, scrubBoughtHereSlip, scrubHookReversals, harvestHookIntoSceneFacts, attachHookLock, backfillHookLockFromSave
- functions: applyCase:68, mention:76, collect:86, listHookMentions:95, naturePriority:107, detectHookNature:120, classifyHookNature:131, lockHookFromText:135, seedHookLockFromPickedHook:150, resolveHookLock:159, hookLockForWarden:167, formatHookBindingLine:174, hookManifestFact:182, hookForbiddenReversal:186, detectHookContradiction:191, naturesConflict:199, talkContradictsLockedWhy:210, factionNoteForHook:227, alignFactionNotesToHook:239, playerMayReviseHook:250, reviseHookLock:258, scrubBoughtHereSlip:275, opposingNatures:280, scrubHookReversals:290, harvestHookIntoSceneFacts:313, attachHookLock:346, backfillHookLockFromSave:362

## supabase/functions/_shared/gm/hubEncounters.ts
54406 B · 605 lines
- exports: HubBeatKind, HubArrivalBeat, pickHubArrivalBeat, hubVisitCount, resolveHubArrival, atMappedHubAfterOpening, formatHubArrivalForPrompt, hubArrivalChoicePads, hubBeatAwardKey
- functions: banksForBible:485, filterByTier:490, pickHubArrivalBeat:502, hubVisitCount:514, resolveHubArrival:519, atMappedHubAfterOpening:534, formatHubArrivalForPrompt:539, hubArrivalChoicePads:576, hubBeatAwardKey:602

## supabase/functions/_shared/gm/intentEnums.ts
11936 B · 363 lines
- exports: PlayerIntent, INTENT_DISPLAY_LABELS, inferIntent, getIntentLabel, isCombatIntent, isTravelIntent, isInspectIntent, isSocialIntent
- functions: inferIntent:155, getIntentLabel:296, isCombatIntent:303, isTravelIntent:317, isInspectIntent:335, isSocialIntent:352

## supabase/functions/_shared/gm/introductionPermit.ts
1417 B · 44 lines
- exports: IntroductionPermitSource, IntroductionPermit, introductionPermitForName
- functions: introductionPermitForName:18, escapeRe:41

## supabase/functions/_shared/gm/inventory.ts
7747 B · 230 lines
- exports: InventoryCapacity, getEquippedContainers, getPrimaryGeneralContainer, getItemsInContainer, getContainerUsed, syncContainerOccupancy, computeInventoryCapacity, canAddItem, canAddMaterials, addMaterials, removeItem, addItem, getItemValue
- functions: getEquippedContainers:22, getPrimaryGeneralContainer:26, isGeneralStorage:35, getItemsInContainer:44, getContainerUsed:86, findContainerWithSpace:90, syncContainerOccupancy:105, computeInventoryCapacity:131, canAddItem:162, canAddMaterials:171, addMaterials:193, removeItem:208, addItem:215, getItemValue:226

## supabase/functions/_shared/gm/kidModeSafety.ts
8417 B · 193 lines
- exports: isKidMode, kidSafeArtDirective, stripKidUnsafeImageLexicon, isUnsalvageableKidImagePrompt, prepareKidSafeImagePrompt, filterKidModeText, filterKidModeVisible, filterKidModeVisibleList, skipKidUnsafeInstructionBlocks
- functions: isKidMode:18, kidSafeArtDirective:22, stripKidUnsafeImageLexicon:71, isUnsalvageableKidImagePrompt:86, prepareKidSafeImagePrompt:101, filterKidModeText:135, filterKidModeVisible:146, filterKidModeVisibleList:154, matchesUnsafe:162, skipKidUnsafeInstructionBlocks:171

## supabase/functions/_shared/gm/ledgerNounObey.ts
5407 B · 156 lines
- exports: inventedPersonNamesNotOnAllowlist, obeyLedgerNouns, acceptObeyedStoryBody
- functions: splitSentences:30, tidy:34, inventedPersonNamesNotOnAllowlist:43, scrubCastAsPermit:63, dropOrRewriteInvented:86, obeyLedgerNouns:98, acceptObeyedStoryBody:139

## supabase/functions/_shared/gm/litrpgSystemWindow.ts
211 B · 5 lines
- exports: ledgerSheetLine
- functions: ledgerSheetLine:2

## supabase/functions/_shared/gm/locality.ts
4288 B · 115 lines
- exports: FirearmsNorm, LocalityToken, deriveLocalityToken, formatLocalityForPrompt, applyLocalityWarden
- functions: deriveLocalityToken:25, formatLocalityForPrompt:77, applyLocalityWarden:99

## supabase/functions/_shared/gm/locationName.ts
3183 B · 85 lines
- exports: cleanPlaceLabel, playerFacingLocation, encounterOriginPlace
- functions: cleanPlaceLabel:8, playerFacingLocation:16, encounterOriginPlace:47, isCityScaleOrigin:67, stripTimeClause:77

## supabase/functions/_shared/gm/loiterDeltaDirective.ts
4859 B · 177 lines
- exports: injectLoiterDelta, buildLoiterDeltaDirective, needsLoiterDelta
- functions: injectLoiterDelta:17, isLoiterFamily:64, calculateTimeJump:84, generateDeltaDirective:94, buildLoiterDeltaDirective:136, needsLoiterDelta:158

## supabase/functions/_shared/gm/mapEngine.ts
66620 B · 1653 lines
- exports: MobRole, NodeHiddenLoot, NodeHidden, InteriorEdgeKind, MapNode, MapBlueprint, ActiveDungeonState, CORE_BLUEPRINTS, generateProceduralBlueprint, initializeDungeon, isInteriorSecretUnlocked, moveToNode, exitDungeon, buildLocalAreaMap, lookLikeEntrance, presentLocalAreaMap, addLandmarkToLocalMap, shortRoomLabel, shortBuildingTitle, InteriorFillKind, interiorRoomFillKind, InteriorBuildingScale, interiorBuildingScale, interiorFloorLabel, listInteriorZLevels, nodesOnInteriorFloor, roomHasVerticalLink, InteriorRoomSpec, SHED_LAYOUTS, RUIN_LAYOUTS, GRAND_LAYOUTS, resolveInteriorEdgeKind, interiorExitNoun, InteriorRoomBox, interiorDoorAnchor, interiorFootprintsAreVaried, listInteriorExitsFromHere, isCameraRelativePad, formatGraphExitToken, graphExitPads, matchGraphExitPad, dungeonHereLabel, applyGraphExitTravel, formatInteriorExitAuthority, formatInteriorExploreAuthority, revealInteriorSecret, buildInteriorFloorPlan, presentInteriorMap, addRoomToInteriorMap, resolvePlayAreaMap
- functions: generateProceduralBlueprint:160, initializeDungeon:253, isInteriorSecretUnlocked:293, moveToNode:306, exitDungeon:328, uniqueNames:332, usableStreetLabel:346, nextStreetSlot:365, buildLocalAreaMap:375, lookLikeEntrance:436, presentLocalAreaMap:443, addLandmarkToLocalMap:489, usableInteriorHere:517, usableInteriorRoom:524, shortRoomLabel:583, shortBuildingTitle:607, interiorRoomFillKind:640, isAuthoredInterior:649, interiorBuildingScale:656, interiorFloorLabel:668, listInteriorZLevels:673, nodesOnInteriorFloor:678, roomHasVerticalLink:682, needsAuthoredInteriorRebuild:690, nextInteriorSlot:724, pickInteriorLayout:974, resolveInteriorEdgeKind:991, interiorExitNoun:1001, interiorDoorAnchor:1017, interiorFootprintsAreVaried:1048, listInteriorExitsFromHere:1059, exitFacingLabel:1076, isCameraRelativePad:1091, formatGraphExitToken:1098, graphExitPadLabel:1110, graphExitPads:1123, matchGraphExitPad:1138, dungeonHereLabel:1173, applyGraphExitTravel:1182, formatInteriorExitAuthority:1198, formatInteriorExploreAuthority:1219, buildEdgeKindsForSpec:1239, applyHarvestedRoomNames:1261, unlockInteriorSecretOnNodes:1311, revealInteriorSecret:1345, buildInteriorFloorPlan:1361, presentInteriorMap:1425, addRoomToInteriorMap:1493, sameAreaMap:1549, resolvePlayAreaMap:1573

## supabase/functions/_shared/gm/masterPrompt.ts
27626 B · 527 lines
- exports: buildMasterPrompt, buildSystemPrompt, buildContextPrompt
- functions: buildMasterPrompt:458

## supabase/functions/_shared/gm/maturity.ts
6192 B · 159 lines
- exports: MaturityTier, DarkThemesLevel, MaturityToggles, defaultMaturityToggles, resolveMaturity, formatMaturityRules, SoftRewrite, maybeRatingRewrite
- functions: defaultMaturityToggles:15, resolveMaturity:24, formatMaturityRules:43, maybeRatingRewrite:98

## supabase/functions/_shared/gm/mysteryCulprit.ts
4692 B · 118 lines
- exports: pickMysteryCulprit, resolveMysteryCulprit, stampMysteryCulprit, applyAccusationFromInput, formatHiddenCulpritRail
- functions: hashSeed:4, pickFromPool:13, pickMysteryCulprit:18, resolveMysteryCulprit:25, stampMysteryCulprit:36, applyAccusationFromInput:66, formatHiddenCulpritRail:92

## supabase/functions/_shared/gm/narrativeHarvest.ts
10666 B · 278 lines
- exports: harvestNarrativeIntoLedger, scrubInventedGeography
- functions: extractRegisteredNpcs:41, extractProperNamesFromProse:76, ensureNpcMemory:97, ensureNpcLore:102, harvestNarrativeIntoLedger:130, scrubInventedGeography:259

## supabase/functions/_shared/gm/narrativeTranslator.ts
10590 B · 387 lines
- exports: translateStateToNarrative, isUiLabel, choiceContainsUngroundedReferences
- functions: translateStateToNarrative:28, translateLocation:77, translatePresence:99, translateTension:163, translateExits:181, naturalizeExitLabel:205, translateObjectives:239, translateInventory:259, isUiLabel:280, isNamedNpc:301, isProperName:309, translateUiToken:317, choiceContainsUngroundedReferences:338, isGenericTerm:376

## supabase/functions/_shared/gm/neverCast.ts
5418 B · 137 lines
- exports: ledgerConceptTitles, ledgerNeverCastTitles, isNeverCastTitle, isPlaceTitlePersonSubject, isPlaceTitleTalkPad, matchesRegisteredLocationNeedle
- functions: escapeRe:17, pushUnique:21, ledgerConceptTitles:28, ledgerNeverCastTitles:56, isNeverCastTitle:81, isPlaceTitlePersonSubject:99, isPlaceTitleTalkPad:110, matchesRegisteredLocationNeedle:124

## supabase/functions/_shared/gm/npcMemoryRetrieval.ts
219 B · 8 lines
- exports: buildNpcPacket, formatNpcPacketSection
- functions: buildNpcPacket:2, formatNpcPacketSection:5

## supabase/functions/_shared/gm/npcRecords.ts
5930 B · 163 lines
- exports: formatNpcMemoriesForPrompt, resolveNpcRecord, splitCompoundCastEntry, canonicalNpcName, npcRecordNames, recordsForEntries, presentNpcRecords, npcNamesAt, seedOpeningCastLocations, stampNpcLocationsOnMove, openingCastRecords, isMetNpc, syncNpcPresence
- functions: formatNpcMemoriesForPrompt:3, namesOf:19, exactRecord:23, resolveNpcRecord:29, splitCompoundCastEntry:44, canonicalNpcName:57, npcRecordNames:61, recordsForEntries:65, samePlace:79, companionRecords:85, presentNpcRecords:98, npcNamesAt:117, seedOpeningCastLocations:122, stampNpcLocationsOnMove:135, openingCastRecords:147, isMetNpc:155, syncNpcPresence:159

## supabase/functions/_shared/gm/offerOnlyAsk.ts
943 B · 25 lines
- exports: isOfferOnlyUnansweredBeat
- functions: proseOnly:4, isOfferOnlyUnansweredBeat:16

## supabase/functions/_shared/gm/oneCameraFight.ts
3987 B · 118 lines
- exports: isLiveFightCamera, shouldSkipTravelArrivalPrepend, isLeaveReachFightBleed, proseHasFightBleed, stampTravelArrivalIfSafe, isOneCameraFightViolation, scrubOneCameraFight, scrubLeaveReachDuringFight
- functions: isLiveFightCamera:19, shouldSkipTravelArrivalPrepend:27, isLeaveReachFightBleed:31, proseHasFightBleed:37, stampTravelArrivalIfSafe:45, isOneCameraFightViolation:59, stripLeaveReach:78, dropFightBleedSentences:82, scrubOneCameraFight:92, scrubLeaveReachDuringFight:114

## supabase/functions/_shared/gm/openRouterChat.ts
6613 B · 193 lines
- exports: FIREWORKS_INFERENCE_BASE, FREE_WRITER_FIREWORKS_MODEL, isFireworksWriterModel, normalizeFireworksWriterModel, hostedWriterProvider, fireworksChatHeaders, fireworksChatBody, hasHanScript, extractChatCompletionText, extractChatCompletionTexts, packGmCandidateTexts, openRouterChatHeaders, openRouterChatBody
- functions: isFireworksWriterModel:15, normalizeFireworksWriterModel:21, hostedWriterProvider:28, fireworksChatHeaders:32, fireworksChatBody:39, hasHanScript:56, extractOneChoice:60, extractChatCompletionText:80, extractChatCompletionTexts:87, packGmCandidateTexts:97, flattenChatContent:103, openRouterChatHeaders:117, openRouterChatBody:126

## supabase/functions/_shared/gm/openingEstablishment.ts
12208 B · 340 lines
- exports: hallTalkAsksWhere, hallTalkAsksWho, hallTalkAsksWant, hallTalkAsksRefuse, hallTalkAsksPanel, hallTalkAsksStayLeave, playerAskedWhyPulled, isHallTalkPlayerLine, openingStayLeaveLine, openingCastLabel, shortCardWant, openingWantLine, openingSpokenIdentityQuote, openingWhoAskLineFromLabel, isOpeningCardActLine, openingCastNames, cardSceneMentionTokens, cardRoleStandIn, shortCardOffer, lockedOpeningPcName, proseAsksForPcName, stripLockedNameAsk, sanitizeLockedNameBeat, isNameTelegramProse, openingSpokenWant, openingWhoAskLine, hallTopicAlreadyAnswered, openingNameLockSpokenBeat, HallTalkTopic, hallTalkTopic, isAcceptOfferLine, isOpeningNameGiveLine, castSpeakVerb, openingSpokenRefuse, isCombatFamilyPad, shouldStarveCombatPadsOnCover, lineNamesOtherNpc
- functions: hallTalkAsksWhere:6, hallTalkAsksWho:15, hallTalkAsksWant:19, hallTalkAsksRefuse:33, hallTalkAsksPanel:44, hallTalkAsksStayLeave:55, playerAskedWhyPulled:70, isHallTalkPlayerLine:80, openingStayLeaveLine:107, openingCastLabel:111, shortCardWant:115, openingWantLine:119, openingSpokenIdentityQuote:123, openingWhoAskLineFromLabel:136, isOpeningCardActLine:164, openingCastNames:168, cardSceneMentionTokens:180, cardRoleStandIn:186, shortCardOffer:190, lockedOpeningPcName:194, proseAsksForPcName:204, stripLockedNameAsk:208, sanitizeLockedNameBeat:215, isNameTelegramProse:227, openingSpokenWant:235, openingWhoAskLine:239, hallTopicAlreadyAnswered:249, openingNameLockSpokenBeat:264, hallTalkTopic:281, isAcceptOfferLine:293, isOpeningNameGiveLine:306, castSpeakVerb:310, openingSpokenRefuse:321, isCombatFamilyPad:325, shouldStarveCombatPadsOnCover:332, lineNamesOtherNpc:337

## supabase/functions/_shared/gm/openingPointerCard.ts
16700 B · 438 lines
- exports: PointerWhoBand, PointerCardSlots, SnapshotGist, inferWhoCountFromHook, compilePointerCardSlots, formatPointerCardSlotBlock, formatPointerCardForSnapshot, formatOpeningCardChrome, buildOpeningGmPlayerInput, seedCrowdCountFromCard, openingInventBudgetZero, pointerCardAllowlist, hasOpeningInventSmashLeak, stripOpeningInventQuota, classifyOpeningContinue, buildSnapshotGist, compactTrafficGist, persistSnapshotGist, formatLastSnapshotGistLine, applyCardCrowdToFacts, compileLitrpgCoreIdentity
- functions: stripProseChrome:49, isSentenceInitial:58, lineAfter:65, slugId:70, inferWhoCountFromHook:75, compilePointerCardSlots:91, formatPointerCardSlotBlock:136, formatPointerCardForSnapshot:151, formatOpeningCardChrome:162, buildOpeningGmPlayerInput:178, seedCrowdCountFromCard:193, openingInventBudgetZero:199, pointerCardAllowlist:208, considerInventedName:234, inventedTitleNames:241, hasOpeningInventSmashLeak:261, openingCollidesEarthStreet:266, stripOpeningInventQuota:275, classifyOpeningContinue:287, buildSnapshotGist:341, compactTrafficGist:361, persistSnapshotGist:365, formatLastSnapshotGistLine:382, applyCardCrowdToFacts:388, compileLitrpgCoreIdentity:423

## supabase/functions/_shared/gm/outdoorHubs.ts
42126 B · 645 lines
- exports: OutdoorHub, SUMMONED_PACT_HUBS, HERO_AWAKENING_HUBS, SYSTEM_INTEGRATION_HUBS, GATEBREAK_WARD_HUBS, ASCENDING_SPIRE_HUBS, FABLED_LEGACY_HUBS, INKBOUND_ACADEMY_HUBS, VOID_AUDIENCE_HUBS, HOLLOW_CORE_HUBS, DUNGEON_TRANSPORT_HUBS, CURSED_KEEP_HUBS, SALT_ROAD_HUBS, SHATTERED_COAST_HUBS, hubsForBibleId, hubsForBible, seedOutdoorHubPlaces, hubLandmarkNames, visitedHubLandmarkNames, mergeHubLandmarks, matchHub, formatOutdoorHubsForPrompt, outdoorHubTravelChoices, isThornferryCluster, parseTravelDestination, applyNamedHubTravel, isLeaveSceneAction, resolveLeaveSceneDestination, ensureTravelArrivalProse, buildPlaceCard, ensurePlaceCard, placeCardFor
- functions: hubsForBibleId:204, hubsForBible:209, hubToPlace:213, seedOutdoorHubPlaces:242, hubLandmarkNames:281, visitedHubLandmarkNames:294, mergeHubLandmarks:313, matchHub:333, formatOutdoorHubsForPrompt:349, outdoorHubTravelChoices:368, isThornferryCluster:421, parseTravelDestination:430, applyNamedHubTravel:460, isLeaveSceneAction:473, resolveLeaveSceneDestination:486, ensureTravelArrivalProse:516, buildPlaceCard:575, ensurePlaceCard:618, placeCardFor:637

## supabase/functions/_shared/gm/padUniverse.ts
10515 B · 288 lines
- exports: ExcludedPadFamily, isTravelPad, isLeaveFamilyPad, isNamedTalkPad, isUseCharterPad, shouldStarveTalkPads, shouldStarveUsePads, shouldStarveAskPads, countRecentTravelPicks, countRecentLeavePicks, countRecentTravelOrWalkPicks, shouldStarveTravelPads, shouldStarveLeavePads, excludedPadFamilies, isExcludedPadLabel, isExcludedEdge, filterPadsByUniverse, closedUniverseFallbacks, ensureClosedUniversePad, sealPadUniverse, isExcludedPadProgress
- functions: isTalkQaLoopStarved:25, isTravelPad:36, isLeaveFamilyPad:46, isNamedTalkPad:50, isUseCharterPad:56, shouldStarveTalkPads:60, shouldStarveUsePads:66, shouldStarveAskPads:71, countRecentMatchingPicks:88, countRecentTravelPicks:105, countRecentLeavePicks:109, countRecentTravelOrWalkPicks:113, hasLiveStakes:121, shouldStarveTravelPads:130, shouldStarveLeavePads:138, excludedPadFamilies:146, isExcludedPadLabel:165, isExcludedEdge:178, filterPadsByUniverse:192, closedUniverseFallbacks:206, ensureClosedUniversePad:242, sealPadUniverse:253, isExcludedPadProgress:265

## supabase/functions/_shared/gm/panelBudget.ts
1360 B · 30 lines
- exports: PANEL_BUDGET_BY_FREQUENCY, resolvePanelBudget, MAX_MILESTONE_IMAGES_PER_TURN, MAX_LOOT_VIDEOS_PER_TURN
- functions: resolvePanelBudget:18

## supabase/functions/_shared/gm/pcNameAuthority.ts
2539 B · 108 lines
- exports: UNNAMED_ADVENTURER, isDeniedPcName, isLockablePcName, sanitizePcName, displayAdventurerName
- functions: normalizeNameKey:73, isDeniedPcName:82, isLockablePcName:91, sanitizePcName:99, displayAdventurerName:105

## supabase/functions/_shared/gm/placeAuthority.ts
5952 B · 137 lines
- exports: STREET_MAP_BLUEPRINT, INTERIOR_MAP_BLUEPRINT, isStreetMap, isInteriorMap, isExplorableDungeon, isInteriorPlace, resolveDangerTier, resolveThreatTier, resolveMapScale, mapScaleLabel, dangerTierLabel, normalizeSheetAuthority
- functions: isStreetMap:18, isInteriorMap:22, isExplorableDungeon:27, isInteriorPlace:34, resolveDangerTier:44, resolveThreatTier:60, resolveMapScale:83, mapScaleLabel:97, dangerTierLabel:112, normalizeSheetAuthority:118

## supabase/functions/_shared/gm/placeUtils.ts
401 B · 17 lines
- exports: placeIdFromName
- functions: slugify:6, placeIdFromName:14

## supabase/functions/_shared/gm/places.ts
5391 B · 168 lines
- exports: ensurePlaces, upsertPlaceFromSheet, touchPlaceVisit, closePlaceArc, resolvePlace, formatPlacesForPrompt, sheetFromPlace, placeIdFromName
- functions: ensurePlaces:8, upsertPlaceFromSheet:16, touchPlaceVisit:66, closePlaceArc:105, resolvePlace:124, formatPlacesForPrompt:140, sheetFromPlace:158

## supabase/functions/_shared/gm/povRails.ts
5421 B · 160 lines
- exports: buildPovRails, getPovViolationPatterns, hasPovViolations, scrubBodyPartPossession, formatPovRailsForPrompt
- functions: buildPovRails:16, getPovViolationPatterns:88, hasPovViolations:108, scrubBodyPartPossession:134, formatPovRailsForPrompt:157

## supabase/functions/_shared/gm/presentAuthority.ts
3692 B · 100 lines
- exports: locationsEquivalentForPresence, trimPresentOnLocationChange, applyPresentTrimOnTravel
- functions: thornferryClusterCore:11, locationsEquivalentForPresence:15, trimPresentOnLocationChange:24, applyPresentTrimOnTravel:43

## supabase/functions/_shared/gm/proseWarden.ts
74427 B · 1740 lines
- exports: collectSceneObjectNames, ProseWardenContext, beatIsAtNamedPlace, scrubFalseArrivalWhenHere, scrubChoicePadPersonNames, scrubDialogueVerbAsNoun, scrubUnearnedPocketLoot, scrubUnresolvedDeixisNouns, scrubFactionAsLootOrTarget, scrubStitchBankLeaks, scrubEntityMadLibs, scrubBodyStatusDumps, scrubRoleAdjectivePersonSlot, scrubLocationTautology, scrubSpokenQuoteStart, scrubFreeEnglishSlips, scrubAwakeSpeakerAsSleeper, scrubArticleCollisions, scrubFigurePlaceholder, scrubUiQuestVerbs, scrubSomeoneNearbyPlaceholder, scrubSpeakerPlaceholder, scrubStrangerArtifact, scrubUnearnedVictory, scrubPlaceholderNouns, scrubPronounSubjectSlips, scrubPossessiveDeterminerSlips, scrubPrematureSecrets, scrubInventedAlonePresence, scrubInteriorOneRoomLie, scrubAnthropomorphizedLocation, scrubInventedTimeSkip, scrubInventedLocationChange, scrubDualLocationOpenings, scrubExtraPlayerActions, scrubInventedTensionChange, scrubInventedContainers, scrubDestroyedPyoaItems, scrubNamedCastAsObject, scrubDeadFoeReengage, scrubSaferSceneMeta, scrubFalseSpokenAction, scrubChromeAsPerson, applyProseWarden, applyProseWardenAsync, calculateCrowdSize, crowdSizeForWarden, scrubInventedCrowdSize
- functions: collectSceneObjectNames:33, beatIsAtNamedPlace:123, tidyClauses:133, scrubFalseArrivalWhenHere:152, scrubChoicePadPersonNames:324, scrubDialogueVerbAsNoun:349, scrubUnearnedPocketLoot:399, scrubUnresolvedDeixisNouns:434, scrubFactionAsLootOrTarget:494, scrubStitchBankLeaks:522, scrubEntityMadLibs:555, scrubBodyStatusDumps:690, scrubRoleAdjectivePersonSlot:714, scrubLocationTautology:737, scrubSpokenQuoteStart:763, scrubFreeEnglishSlips:777, scrubAwakeSpeakerAsSleeper:791, scrubArticleCollisions:818, scrubFigurePlaceholder:841, scrubUiQuestVerbs:857, scrubSomeoneNearbyPlaceholder:875, scrubSpeakerPlaceholder:886, scrubStrangerArtifact:906, scrubUnearnedVictory:940, scrubPlaceholderNouns:963, scrubPronounSubjectSlips:1011, scrubPossessiveDeterminerSlips:1048, scrubPrematureSecrets:1078, splitSentences:1091, scrubInventedAlonePresence:1103, scrubInteriorOneRoomLie:1119, scrubAnthropomorphizedLocation:1145, scrubInventedTimeSkip:1185, scrubInventedLocationChange:1210, scrubDualLocationOpenings:1240, scrubExtraPlayerActions:1327, scrubInventedTensionChange:1366, collectContainerTypes:1390, scrubInventedContainers:1412, scrubDestroyedPyoaItems:1452, scrubNamedCastAsObject:1525, scrubDeadFoeReengage:1559, scrubSaferSceneMeta:1570, scrubFalseSpokenAction:1592, scrubChromeAsPerson:1616, applyProseWarden:1625, applyProseWardenAsync:1723

## supabase/functions/_shared/gm/pyoaBranchLedger.ts
18578 B · 490 lines
- exports: PyoaBranchId, PyoaBranchLedger, initPyoaBranchLedger, isPyoaItemDestroyed, isPyoaCharterProseBurn, applyPyoaCharterProseBurn, isPyoaCharterClosed, isPyoaBranchExhausted, recordPyoaBranchChoice, formatPyoaBranchMandate, PyoaLockedBranchId, lockPyoaBranchOnCrisis, exhaustDelayPads, isPyoaBranchLocked, eligiblePyoaPadsAfterLock, detectBranchConvergence, recordBranchConvergence, cleanupBranchMemoryAtConvergence, formatConvergenceMandate
- functions: initPyoaBranchLedger:26, isPyoaItemDestroyed:38, isPyoaCharterProseBurn:56, applyPyoaCharterProseBurn:70, isPyoaCharterClosed:93, isPyoaBranchExhausted:114, recordPyoaBranchChoice:124, formatPyoaBranchMandate:205, lockPyoaBranchOnCrisis:226, exhaustDelayPads:262, isPyoaBranchLocked:285, eligiblePyoaPadsAfterLock:292, computeBranchStateHash:327, detectBranchConvergence:349, recordBranchConvergence:412, cleanupBranchMemoryAtConvergence:442, formatConvergenceMandate:483

## supabase/functions/_shared/gm/pyoaDelayedConsequences.ts
221 B · 8 lines
- exports: buildDelayedConsequencesSituationSection, buildJournalConsequenceHints
- functions: buildDelayedConsequencesSituationSection:2, buildJournalConsequenceHints:5

## supabase/functions/_shared/gm/pyoaSpine.ts
16409 B · 479 lines
- exports: PyoaSpineNodeId, PyoaSpineExit, PyoaSpineNode, PyoaSpineBibleId, PyoaSpineState, THORNFERRY_SPINE, spineBibleSupported, isAuthoredPyoaBook, getSpineNode, initThornferrySpine, initUmbraSpine, initPyoaSpine, authoredPageText, authoredStartPage, ensurePyoaSpine, currentSpineNode, legalSpineExits, isSpineDelayPad, advancePyoaSpine, evaluateSpineEndingGate, formatPyoaSpineSnapshotLines, formatPyoaSpineTurnJob, spineChoiceLabels, spineForceEdgeAfterDelay
- functions: spineBibleSupported:199, isAuthoredPyoaBook:203, getSpineNode:207, initThornferrySpine:212, initUmbraSpine:223, initPyoaSpine:234, authoredPageText:238, authoredStartPage:244, ensurePyoaSpine:248, currentSpineNode:255, legalSpineExits:261, resolveEndingLeaf:278, isSpineDelayPad:288, advancePyoaSpine:299, fuzzyExitMatch:352, applyExit:377, evaluateSpineEndingGate:400, formatPyoaSpineSnapshotLines:440, formatPyoaSpineTurnJob:463, spineChoiceLabels:472, spineForceEdgeAfterDelay:476

## supabase/functions/_shared/gm/qualityGovernance.ts
804 B · 22 lines
- exports: QualityGovernanceState, buildGovernanceSnapshotLines
- functions: buildGovernanceSnapshotLines:8

## supabase/functions/_shared/gm/questPlay.ts
33113 B · 945 lines
- exports: StarterQuestSeed, adaptStarterQuestsForArrival, isAtmospherePlaceName, extractNamedPlaces, harvestPlayText, questsLockedDuringOpening, clampLeakedOpeningQuests, isJournalQuest, visibleJournalQuests, activeDrawerQuests, syncQuestsFromPlay, revealQuestsFromBanks, revealQuestsFromHubLinks, isDummyStreetNodeName, isGenericMapPlace, isInteriorRoomName, newlyRevealedQuests, mainSpineQuest, nextMainObjective, mainQuestPlacePin, resumeMainQuestFocus, resumeMainTravelChoice, seedLocalStarterQuest, revealLocalStarterQuest, mapAnchorName, applyBiomeSaneQuestSites
- functions: adaptStarterQuestsForArrival:424, slug:432, tokens:436, overlap:442, titleCasePlace:469, clipPlace:476, isAtmospherePlaceName:488, isIncompletePlacePhrase:495, looksLikePlaceName:510, pushPlace:514, extractNamedPlaces:523, harvestPlayText:548, labelFromLogLine:557, questsLockedDuringOpening:566, hideSeededQuests:577, clampLeakedOpeningQuests:588, isJournalQuest:595, visibleJournalQuests:601, activeDrawerQuests:606, syncQuestsFromPlay:614, revealQuestsFromBanks:679, revealQuestsFromHubLinks:702, isDummyStreetNodeName:724, isGenericMapPlace:728, isInteriorRoomName:740, newlyRevealedQuests:748, seededQuestType:755, asSeededQuest:762, mainSpineQuest:783, nextMainObjective:809, mainQuestPlacePin:818, atPlacePin:824, resumeMainQuestFocus:832, resumeMainTravelChoice:864, seedLocalStarterQuest:873, revealLocalStarterQuest:885, mapAnchorName:919, applyBiomeSaneQuestSites:929

## supabase/functions/_shared/gm/repairEngine.ts
203 B · 10 lines
- exports: RepairSituation

## supabase/functions/_shared/gm/sceneContextTail.ts
9223 B · 253 lines
- exports: SCENE_CONTEXT_TAIL_WINDOW, SCENE_CONTEXT_RECENT_TURNS, placesDiffer, mentionsPlace, isLeaveBehindMention, hereLocation, priorLocation, locationChangedRecently, encounterClearedRecently, selectRecentLogForContext, isStaleLocationBleed, isStaleFightBleed, leftBehindNames, isLeftBehindActingHere, isStaleContextBleed, openingPinNames, isLeaveBehindFarewell, isOpeningOccupancyReset
- functions: escapeRe:39, normalizePlace:43, placeWords:47, placesDiffer:55, mentionsPlace:63, isLeaveBehindMention:78, hereLocation:83, priorLocation:87, locationChangedRecently:93, encounterClearedRecently:110, keepLogLine:122, selectRecentLogForContext:146, isStaleLocationBleed:155, isStaleFightBleed:167, leftBehindNames:181, isLeftBehindActingHere:190, isStaleContextBleed:201, openingPinNames:212, isLeaveBehindFarewell:222, openingPinActsHere:226, isOpeningOccupancyReset:243

## supabase/functions/_shared/gm/sceneFacts.ts
17242 B · 395 lines
- exports: emptySceneFacts, extractSceneFacts, mergeSceneFacts, seedOpeningSceneFacts, formatSceneFactsForPrompt, detectSceneContradiction, rewriteContinuityBreak, applyCommittedNarrative
- functions: emptySceneFacts:51, extractSceneFacts:66, mergeSceneFacts:158, seedOpeningSceneFacts:205, formatSceneFactsForPrompt:258, detectSceneContradiction:277, rewriteContinuityBreak:293, applyCommittedNarrative:308

## supabase/functions/_shared/gm/sceneManifest.ts
8130 B · 209 lines
- exports: SceneManifest, compileSceneManifest, formatSceneManifestForPrompt, findManifestInventions
- functions: isAloneScene:14, equippedNames:35, compileSceneManifest:43, formatSceneManifestForPrompt:124, findManifestInventions:154

## supabase/functions/_shared/gm/searchContinuity.ts
471 B · 14 lines
- exports: emptySearchAuthorityLine, weaponAuthorityLine, applySearchContinuityToFacts
- functions: emptySearchAuthorityLine:2, weaponAuthorityLine:6, applySearchContinuityToFacts:11

## supabase/functions/_shared/gm/seededRng.ts
472 B · 12 lines
- exports: createHashRng
- functions: createHashRng:2

## supabase/functions/_shared/gm/semanticLoopDetector.ts
35108 B · 967 lines
- exports: SemanticIntent, LoopDetectionResult, EscalationResponse, canonicalizeIntent, intentSimilarity, detectSemanticLoop, buildEscalationResponse, calculateChoiceDiversity, formatEscalationMandate, LoopDetectionTelemetry, trackLoopMetrics, playerAsksRepeat, playerAsksContinuation, lastOfferedChoiceSets, isStallPadChoice, filterRecycledStallChoices, LeadingCollageHit, splitStorySentences, isSubstantialSentence, recentGmBeatTexts, detectLeadingCollage, stripRecycledPrefix, shouldRetryUnaskedCollage, atmosphereSignature, isAtmosphereOnlyBeat, detectAtmosphereReprint, isSameRoomLoiterIntent, isDialogueTalkIntent, detectDialogueTreadmillHard, detectTalkUltimatumRecycle, isTalkUltimatumExhausted, hasTalkQaShape, isTalkQaLoopStarved, detectTalkQaShapeLoop, ambientStubFingerprint, isAmbientStubRecycle, detectCombatPurgatoryHard, hasBeatDeltaCue, detectSameRoomEssayHard
- functions: canonicalizeIntent:59, intentSimilarity:153, detectSemanticLoop:171, buildEscalationResponse:234, calculateChoiceDiversity:338, formatEscalationMandate:399, trackLoopMetrics:420, playerAsksRepeat:438, playerAsksContinuation:455, optionFamilyKey:467, lastOfferedChoiceSets:472, isStallPadChoice:487, filterRecycledStallChoices:507, wordCount:563, splitStorySentences:568, isSubstantialSentence:575, sentenceMatches:580, bestSourceBeat:592, tailHasConcreteContent:609, recentGmBeatTexts:619, detectLeadingCollage:637, stripRecycledPrefix:694, shouldRetryUnaskedCollage:702, atmosphereSignature:719, isAtmosphereOnlyBeat:729, signatureJaccard:739, detectAtmosphereReprint:747, isSameRoomLoiterIntent:759, isDialogueTalkIntent:774, detectDialogueTreadmillHard:789, detectTalkUltimatumRecycle:823, isTalkUltimatumExhausted:843, hasTalkQaShape:858, isTalkQaLoopStarved:862, detectTalkQaShapeLoop:871, ambientStubFingerprint:883, isAmbientStubRecycle:892, isCombatAttackIntent:905, detectCombatPurgatoryHard:914, hasBeatDeltaCue:932, detectSameRoomEssayHard:940

## supabase/functions/_shared/gm/semanticMemory.ts
1069 B · 50 lines
- exports: areEmbeddingsAvailable, areEmbeddingsInitializing, embedText, embedTurnSummary, embedAllTurnSummaries, semanticSearchMemories, hybridSearchMemories, cosineSimilarity
- functions: areEmbeddingsAvailable:11, areEmbeddingsInitializing:15, embedText:19, embedTurnSummary:23, embedAllTurnSummaries:27, semanticSearchMemories:31, hybridSearchMemories:39, cosineSimilarity:47

## supabase/functions/_shared/gm/situationPacket.ts
28054 B · 591 lines
- exports: effectivePowerScaling, buildSituationPacket, formatSceneSnapshotForPrompt, formatSituationForPrompt, formatCampaignRails, formatFullMemoryBlock
- functions: effectivePowerScaling:73, formatFactionMatrix:77, formatSimulationistBlocks:91, buildSituationPacket:108, formatSceneSnapshotForPrompt:211, formatSituationForPrompt:427, formatWorldLedgerBlock:520, formatCampaignRails:561, formatFullMemoryBlock:587

## supabase/functions/_shared/gm/slotGlue.ts
10865 B · 267 lines
- exports: isPlotObjectName, ledgerSlotPeople, isCompanionObjectGlue, placeTitleNeedles, ledgerPlaceTitles, isPlaceTitleObjectGlue, isSlotGlueViolation, isPlaceTitleAsPersonSubject, isObjectPersonPad, isPlaceTitleTalkPad, isNobodyInflectionSalad, scrubNobodyInflection, scrubSlotGlue
- functions: escapeRe:29, isPlotObjectName:33, ledgerSlotPeople:39, isCompanionObjectGlue:59, placeTitleNeedles:72, ledgerPlaceTitles:94, isPlaceTitleObjectGlue:126, isSlotGlueViolation:144, isPlaceTitleAsPersonSubject:168, isObjectPersonPad:182, isPlaceTitleTalkPad:192, isNobodyInflectionSalad:205, scrubNobodyInflection:211, scrubSlotGlue:222

## supabase/functions/_shared/gm/speechActRails.ts
1559 B · 22 lines
- exports: formatSpeechActRailsForPrompt
- functions: formatSpeechActRailsForPrompt:4

## supabase/functions/_shared/gm/stateTx.ts
552 B · 33 lines
- exports: StateTxKind, StateTx

## supabase/functions/_shared/gm/systemPrompt.ts
49983 B · 518 lines
- exports: WORLD_STATE_INTEGRITY_RULES, buildSystemPrompt, RECENT_LOG_WINDOW, RECENT_LOG_CHAR_CAP, buildContextPrompt
- functions: buildStatRules:265, buildNarrativePreferenceRules:276, engineModeRules:324, buildSystemPrompt:332, buildMultiPanelInstructions:423, buildPublishingEngineInstructions:475, buildContextPrompt:510

## supabase/functions/_shared/gm/talkEnvelope.ts
234 B · 5 lines
- exports: spokenTalkFallback
- functions: spokenTalkFallback:2

## supabase/functions/_shared/gm/timelineFormat.ts
402 B · 12 lines
- exports: formatTimelineForPrompt
- functions: formatTimelineForPrompt:4

## supabase/functions/_shared/gm/travelAuthority.ts
7347 B · 209 lines
- exports: CameraScale, CameraLock, playerCommittedTravel, playerCommittedArrivalTravel, detectCameraScale, resolveCameraLock, formatCameraBindingLine, harvestCameraIntoSceneFacts, enforceCameraOnState, enforceCameraOnProse, cameraAllowsInteriorMap, cameraPrefersStreetMap, honestLocationName
- functions: playerCommittedTravel:33, playerCommittedArrivalTravel:40, detectCameraScale:48, resolveCameraLock:56, formatCameraBindingLine:60, harvestCameraIntoSceneFacts:68, enforceCameraOnState:127, enforceCameraOnProse:157, cameraAllowsInteriorMap:184, cameraPrefersStreetMap:191, honestLocationName:197

## supabase/functions/_shared/gm/tutorialBeats.ts
7170 B · 193 lines
- exports: TutorialBeatId, emptyTutorialProgress, ensureTutorialProgress, advanceTutorialBeats, formatTutorialBeatMandate, ensureTutorialQuest
- functions: emptyTutorialProgress:15, ensureTutorialProgress:24, mark:28, advanceTutorialBeats:41, formatTutorialBeatMandate:124, ensureTutorialQuest:167

## supabase/functions/_shared/gm/types.ts
51459 B · 1419 lines
- exports: Rarity, Item, ItemType, StorageType, ContainerKind, CraftingMaterial, AttributeKey, Attributes, EntityKind, SummonEntity, RelationshipStatus, Relationship, Character, Companion, Container, PlayPhase, QuestStatus, QuestType, QuestUrgency, QuestObjective, Quest, ShrineEntry, BestiaryEntry, RollRecord, MapTier, HexCoordinates, Location3D, TradeCaravan, WorkEthic, DealRisk, HoldingKind, HoldingOrder, WorldClock, WorldDeal, WorldHolding, WorldHostile, WorldActor, FactionStandingLevel, FactionStanding, PowerScaling, WorldLedger, ActiveEncounter, OpeningEstablishment, GameState, RepairSituation, PendingRepair, BeautyOfferStatus, MemorableOfferKind, StoryPlate, BeautyMomentOffer, MemorableMomentState, WorldAtlasRegionState, WorldAtlasSettlement, WorldAtlasState, SaveSlotInfo, PanelImageStatus, MediaKind, LogEntryKind, ComicOverlayEdit, ComicPanel, LogEntry, EngineMode, isFictionEngine, DiceAnimationMode, ContentMode, GmStrictness, StatDisplayMode, StatVerbosity, StatFrequency, NarrativePerspective, ViolenceLevel, CursingLevel, MapTriggerMode, FogRevealThreshold, AiProvider, TurnFrameTheme, KeyStatus, ErrorKind, LoreCardType, LoreCard, TimelineFactKind, CrowdPresence, SceneNoise, TimeOfDay, Weather, TensionLevel, SceneFacts, TimelineFact, SituationPacket, NpcMood, NpcMemory, MapScale, LocationInteractable, LocationExit, LocationSheet, LootPityState, CirclingMemory, PlaceRecord, TutorialProgress, TurnSummary, MemoryPin, ConsequenceThread, CampaignMemoryState, ChapterSummary, ArcSummary, SpeculativeTake, PendingTurnProposal, PostLoginBehavior, BgMode, ArtStylePreset, ColorVariant, PanelFrequency, PanelBorderIntensity, ComicLayoutMode, ComicReadingDirection, ART_STYLE_PRESETS, Settings, DEFAULT_TURN_FRAME, GoogleUser, RARITY_COLORS, ProfessionType, ProfessionSkill, SalvageRequirement
- functions: isFictionEngine:774

## supabase/functions/_shared/gm/universalHardRails.ts
4967 B · 83 lines
- exports: CORE_HARD_RAILS, STORE_HARD_RAILS, WEB_HARD_RAILS, UNIVERSAL_HARD_RAILS, resolveHardRailsPrompt, hasRevivePath, HardRailContext, distributionLabel
- functions: resolveHardRailsPrompt:43, hasRevivePath:56

## supabase/functions/_shared/gm/vignetteLock.ts
11607 B · 308 lines
- exports: VignetteKind, OpenVignette, isOpenVignette, formatVignetteBindingLine, formatVignetteSnapshotLine, openVignetteFromHubBeat, harvestVignetteIntoSceneFacts, clearVignetteOnHubLeave, applyVignettePresence, vignetteBlocksNewSocialCast, filterPadsAgainstOpenVignette
- functions: uniqNames:40, extractPropMentions:57, extractCastFromProse:70, isOpenVignette:99, formatVignetteBindingLine:103, formatVignetteSnapshotLine:112, openVignetteFromHubBeat:119, harvestVignetteIntoSceneFacts:158, clearVignetteOnHubLeave:229, applyVignettePresence:258, vignetteBlocksNewSocialCast:275, filterPadsAgainstOpenVignette:280

## supabase/functions/_shared/gm/worldAtlas.ts
4480 B · 125 lines
- exports: instantiateWorldAtlas, seedWorldAtlas, revealWorldRegion, maybeRevealFromLocation, formatWorldAtlasBlock, defaultAtlasForMode
- functions: instantiateWorldAtlas:6, seedWorldAtlas:28, revealWorldRegion:44, maybeRevealFromLocation:69, formatWorldAtlasBlock:95, defaultAtlasForMode:121

## supabase/functions/_shared/gm/worldMapAuthority.ts
8222 B · 215 lines
- exports: normalizeLocationName, settlementBiomeTags, questFitsSettlement, inferQuestTagsFromText, settlementsFromAtlas, findSettlement, isLegalMapPlace, looksLikeGeographyInvent, seedWorldMapPlaces, pickQuestSiteForTags, formatWorldMapAuthorityBlock, attachSettlementsToAtlas
- functions: normalizeLocationName:11, settlementBiomeTags:27, questFitsSettlement:32, inferQuestTagsFromText:40, settlementsFromAtlas:53, findSettlement:57, isLegalMapPlace:72, looksLikeGeographyInvent:106, seedWorldMapPlaces:113, pickQuestSiteForTags:157, formatWorldMapAuthorityBlock:178, attachSettlementsToAtlas:206

## supabase/functions/_shared/gm/worldOutlines.ts
15347 B · 180 lines
- exports: WorldOutlineRegion, WorldOutlineSettlement, WorldOutlineDef, WORLD_OUTLINES, getWorldOutlineById, pickWorldOutline
- functions: getWorldOutlineById:158, pickWorldOutline:162

## supabase/functions/_shared/gm/writerInfoLayer.ts
7345 B · 172 lines
- exports: WRITER_INFO_LAYER_CHAR_CAP, buildGroundTruthLedger, buildLoreContext, formatWriterInfoLayer
- functions: buildGroundTruthLedger:11, buildLoreContext:83, pickLoreCards:88, formatWriterInfoLayer:114

## supabase/functions/_shared/playPrivileges.ts
2792 B · 83 lines
- exports: isPrivilegedPlayRequest, freeWriterModelId
- functions: founderEmailAllowlist:9, bearerToken:17, isAnonJwt:23, verifiedUserEmail:29, isStaffEmail:48, isPrivilegedPlayRequest:72, freeWriterModelId:80

## supabase/functions/create-checkout/index.ts
2809 B · 76 lines
- functions: json:70

## supabase/functions/generate-image/index.ts
7571 B · 199 lines
- functions: isAllowedOrigin:28, corsHeaders:40, resolveModel:69, modelQueue:74, extractImageUrl:79, requestImage:104, jsonResponse:149

## supabase/functions/gm-turn/index.ts
14747 B · 397 lines
- functions: jsonResponse:35, assembleSystemPrompt:46, resolveCredentials:69, callGoogle:137, callOpenAICompat:162, callAnthropic:224

## supabase/functions/stripe-webhook/index.ts
5569 B · 178 lines
- functions: handleEvent:75, grantSku:115, upsertSubscription:153
