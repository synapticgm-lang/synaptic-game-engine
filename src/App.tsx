import { shouldUseComicGrid } from '@/game/comicImagePrompt';
import { visibleJournalQuests } from '@/game/questPlay';
import { useGame } from '@/game/useGame';
import { useBgImage } from '@/game/useBgImage';
import { applySettingsCosmetics } from '@/game/uiTheme';
import { ensureTestCosmeticUnlock } from '@/game/cosmeticEntitlements';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Hud } from '@/components/Hud';
import { LeftDrawer } from '@/components/LeftDrawer';
import { RightDrawer } from '@/components/RightDrawer';
import { CenterPanel } from '@/components/CenterPanel';
import { WelcomeModal } from '@/components/WelcomeModal';
import { ToastStack } from '@/components/ToastStack';
import { MainMenu } from '@/components/MainMenu';
import { SetupScreen } from '@/components/SetupScreen';
import { LoadingOverlay, ErrorModal } from '@/components/EngineOverlay';
import { BootSplash, AuthOverlay, WelcomeSplash } from '@/components/BootScreens';
import { AutoSaveIndicator } from '@/components/AutoSaveIndicator';
import { AutoFightWarningModal } from '@/components/AutoFightWarningModal';
import { AutoFightTipModal, isAutoFightTipDismissed } from '@/components/AutoFightTipModal';
import { DiceTrayToolbar } from '@/components/qol/DiceTrayToolbar';

const SettingsModal = lazy(() => import('@/components/SettingsModal').then(m => ({ default: m.SettingsModal })));
const ApiSetupModal = lazy(() => import('@/components/ApiSetupModal').then(m => ({ default: m.ApiSetupModal })));
const NewGameModal = lazy(() => import('@/components/NewGameModal').then(m => ({ default: m.NewGameModal })));
const QuestLogModal = lazy(() => import('@/components/QuestLogModal').then(m => ({ default: m.QuestLogModal })));
const DungeonMapModal = lazy(() => import('@/components/DungeonMapModal').then(m => ({ default: m.DungeonMapModal })));
const DebugModal = lazy(() => import('@/components/DebugModal').then(m => ({ default: m.DebugModal })));
const GMLibrary = lazy(() => import('@/components/GMLibrary').then(m => ({ default: m.GMLibrary })));
const CharacterWindow = lazy(() => import('@/components/CharacterWindow').then(m => ({ default: m.CharacterWindow })));
const MerchantWindow = lazy(() => import('@/components/MerchantWindow').then(m => ({ default: m.MerchantWindow })));
const QuestUnlockModal = lazy(() => import('@/components/QuestUnlockModal').then(m => ({ default: m.QuestUnlockModal })));

export default function App() {
  const game = useGame();
  const bgImage = useBgImage(game.state, game.settings);
  const [elapsed, setElapsed] = useState(0);
  const [forceApiSetup, setForceApiSetup] = useState(false);
  const [userInGame, setUserInGame] = useState(false);
  const [showQuestLog, setShowQuestLog] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showGMLibrary, setShowGMLibrary] = useState(false);
  const [showAutoFightTip, setShowAutoFightTip] = useState(false);

  useEffect(() => {
    if (!game.showLoadingOverlay) { setElapsed(0); return; }
    const start = Date.now();
    const interval = setInterval(() => setElapsed(Date.now() - start), 100);
    return () => clearInterval(interval);
  }, [game.showLoadingOverlay]);

  useEffect(() => {
    ensureTestCosmeticUnlock();
  }, []);

  useEffect(() => {
    applySettingsCosmetics(game.settings);
  }, [game.settings.uiThemeId, game.settings.fontPackId, game.settings.diceCosmeticId, game.settings.turnFrameCosmeticId]);

  // Tip once per device when any engine mode session is on screen.
  useEffect(() => {
    if (!userInGame || !game.state) return;
    if (isAutoFightTipDismissed()) return;
    const t = window.setTimeout(() => setShowAutoFightTip(true), 600);
    return () => window.clearTimeout(t);
  }, [userInGame, game.state?.saveId, game.state?.engineMode]);

  const hasSave = !!game.localSlot || !!game.cloudSlot;
  const shouldAutoResume = game.settings.postLoginBehavior === 'AUTO_RESUME' && hasSave;
  const saveManagement = {
    localSlot: game.localSlot,
    cloudSlots: game.cloudSlots,
    currentSaveId: game.state?.saveId ?? game.localSlot?.saveId ?? null,
    onDeleteSave: game.deleteSavedGame,
    onDeleteExtraSaves: game.deleteExtraSaves,
    onDeleteAllSaves: game.deleteAllSaves,
    onExport: game.handleExport,
    onImport: game.handleImport,
  };

  // Auto-resume logic
  useEffect(() => {
    if (shouldAutoResume && !userInGame && game.bootPhase === 'hub') {
      setUserInGame(true);
      if (!game.state) game.continueGame();
    }
  }, [shouldAutoResume, userInGame, game.bootPhase, game.state, game]);

  if (game.bootPhase === 'welcome') {
    return (
      <>
        <WelcomeSplash onTap={game.handleWelcomeTap} />
        <ToastStack toasts={game.toasts} onDismiss={game.dismissToast} />
      </>
    );
  }

  if (game.bootPhase === 'auth') {
    return (
      <>
        <BootSplash phase="syncing" />
        <AuthOverlay onSignIn={game.handleBootSignIn} onGuest={game.handleGuestSignIn} />
        <ToastStack toasts={game.toasts} onDismiss={game.dismissToast} />
      </>
    );
  }

  if (game.bootPhase === 'setup') {
    return (
      <>
        <SetupScreen
          initialContentMode={game.settings.contentMode}
          initialApiKey={game.settings.geminiApiKey || localStorage.getItem('user_gemini_api_key') || ''}
          onComplete={game.handleSetupComplete}
        />
        <ToastStack toasts={game.toasts} onDismiss={game.dismissToast} />
      </>
    );
  }

  // If set to Main Menu, stay on MainMenu until explicit user action
  if (!userInGame && !shouldAutoResume) {
    return (
      <>
        <MainMenu
          hasSave={hasSave}
          localSlot={game.localSlot}
          cloudSlot={game.cloudSlot}
          googleSignedIn={!!game.googleUser && !game.googleUser.isGuest}
          googleEmail={game.googleUser?.email ?? undefined}
          isGuest={!!game.googleUser?.isGuest}
          settings={game.settings}
          onContinue={() => {
            setUserInGame(true);
            game.continueGame();
          }}
          onNewGame={() => game.setShowNewGame(true)}
          onSettings={() => game.setShowSettings(true)}
          onOpenLibrary={() => setShowGMLibrary(true)}
          onSaveCosmetics={(patch) => game.updateSettings({ ...game.settings, ...patch })}
        />
        {game.showSettings && (
          <Suspense fallback={null}>
            <SettingsModal
              settings={game.settings}
              storyName={game.localSlot?.storyName ?? ''}
              engineMode={'litrpg'}
              onSave={game.updateSettings}
              onStoryNameChange={game.updateStoryName}
              onSetContentMode={game.setContentMode}
              onVerifyPin={game.verifyContentPin}
              {...saveManagement}
              onClose={() => game.setShowSettings(false)}
            />
          </Suspense>
        )}
        {game.showNewGame && (
          <Suspense fallback={null}>
            <NewGameModal
              contentMode={game.settings.contentMode}
              onStart={(...args) => {
                setUserInGame(true);
                game.startNewGame(...args);
              }}
              onClose={() => game.setShowNewGame(false)}
            />
          </Suspense>
        )}
        <Suspense fallback={null}>
          <GMLibrary
            open={showGMLibrary}
            contentMode={game.settings.contentMode}
            onClose={() => setShowGMLibrary(false)}
            onSelectCampaign={(_archetype, _engineMode, bibleId) => {
              if (bibleId) game.applyCampaignBible(bibleId);
              setShowGMLibrary(false);
            }}
          />
        </Suspense>
        <ToastStack toasts={game.toasts} onDismiss={game.dismissToast} />
      </>
    );
  }

  if (game.bootPhase === 'syncing') {
    return (
      <>
        <BootSplash phase={game.bootPhase} />
        <ToastStack toasts={game.toasts} onDismiss={game.dismissToast} />
      </>
    );
  }

  const state = game.state;
  const isComicView = shouldUseComicGrid(
    game.settings,
    game.comicMode,
    game.narrativeMode
  );

  if (!state) {
    return (
      <>
        <MainMenu
          hasSave={hasSave}
          localSlot={game.localSlot}
          cloudSlot={game.cloudSlot}
          googleSignedIn={!!game.googleUser && !game.googleUser.isGuest}
          googleEmail={game.googleUser?.email ?? undefined}
          isGuest={!!game.googleUser?.isGuest}
          settings={game.settings}
          onContinue={() => {
            setUserInGame(true);
            game.continueGame();
          }}
          onNewGame={() => game.setShowNewGame(true)}
          onSettings={() => game.setShowSettings(true)}
          onOpenLibrary={() => setShowGMLibrary(true)}
          onSaveCosmetics={(patch) => game.updateSettings({ ...game.settings, ...patch })}
        />
        {game.showSettings && (
          <Suspense fallback={null}>
            <SettingsModal
              settings={game.settings}
              storyName={game.localSlot?.storyName ?? ''}
              engineMode={'litrpg'}
              onSave={game.updateSettings}
              onStoryNameChange={game.updateStoryName}
              onSetContentMode={game.setContentMode}
              onVerifyPin={game.verifyContentPin}
              {...saveManagement}
              onClose={() => game.setShowSettings(false)}
            />
          </Suspense>
        )}
        {game.showNewGame && (
          <Suspense fallback={null}>
            <NewGameModal
              contentMode={game.settings.contentMode}
              onStart={(...args) => {
                setUserInGame(true);
                game.startNewGame(...args);
              }}
              onClose={() => game.setShowNewGame(false)}
            />
          </Suspense>
        )}
        <Suspense fallback={null}>
          <GMLibrary
            open={showGMLibrary}
            contentMode={game.settings.contentMode}
            onClose={() => setShowGMLibrary(false)}
            onSelectCampaign={(_archetype, _engineMode, bibleId) => {
              if (bibleId) game.applyCampaignBible(bibleId);
              setShowGMLibrary(false);
            }}
          />
        </Suspense>
        <ToastStack toasts={game.toasts} onDismiss={game.dismissToast} />
      </>
    );
  }

  return (
    <div className="relative flex w-full max-w-full h-[100dvh] overflow-x-hidden flex-col bg-transparent text-slate-100">
      <Hud
        state={state}
        googleUser={game.googleUser}
        settings={game.settings}
        onSignIn={game.handleGoogleSignIn}
        onSignOut={game.googleUser?.isGuest ? game.handleGuestSignOut : game.handleGoogleSignOut}
        onSync={game.handleCloudSync}
        onSettings={() => game.setShowSettings(true)}
        onApiSettings={() => game.setShowApiSetup(true)}
        onToggleLeft={() => game.setLeftOpen(true)}
        onToggleRight={() => game.setRightOpen(true)}
        onOpenQuestLog={() => {
          setShowQuestLog(true);
        }}
        onOpenCharacter={() => game.setShowCharacterWindow(true)}
        onOpenMerchant={() => {
          if (state.engineMode === 'dnd') return;
          game.setShowMerchantWindow(true);
        }}
        onOpenMap={() => {
          game.hydratePlayFromLog?.();
          setShowMapModal(true);
        }}
        onOpenDebug={() => setShowDebug(true)}
        syncPhase={game.syncPhase}
        lastSavedTurn={game.lastSavedTurn}
      />

      <div className="flex flex-1 overflow-hidden">
        <LeftDrawer state={state} open={game.leftOpen} onClose={() => game.setLeftOpen(false)} engineMode={state.engineMode} />

        <main className="flex-1 overflow-hidden">
          <CenterPanel
            state={state}
            busy={game.busy}
            error={game.error}
            errorKind={game.errorKind}
            currentImage={game.currentImage}
            bgImage={bgImage.url}
            bgOpacity={bgImage.opacity}
            showRolls={game.showRolls}
            engineMode={state.engineMode}
            diceAnimation={game.settings.diceAnimation}
            statVerbosity={game.settings.statVerbosity}
            voice={game.voice}
            comicMode={isComicView}
            narrativeMode={game.narrativeMode}
            artStylePreset={game.settings.artStylePreset}
            comicLayout={game.settings.comicLayout}
            comicReadingDirection={game.settings.comicReadingDirection}
            imagesGenerating={game.imagesGenerating}
            canRewind={game.canRewind}
            onRetryPanelImage={game.retryPanelImage}
            onUpdatePanelOverlay={game.updatePanelOverlay}
            onSend={game.sendAction}
            restoreDraft={game.restoreDraft}
            onRestoreDraftConsumed={game.clearRestoreDraft}
            onToggleRolls={() => game.setShowRolls(!game.showRolls)}
            onStartListening={game.voice.startListening}
            onStopListening={game.voice.stopListening}
            onStopSpeaking={game.voice.stopSpeaking}
            onRetry={game.retryAction}
            onOpenApiSettings={() => { game.clearError(); setForceApiSetup(true); }}
            onRewind={game.rewindOneTurn}
            onAcceptPendingTurn={game.acceptPendingTurn}
            onDiscardPendingTurn={game.discardPendingTurn}
            onRerollPendingTurn={game.rerollPendingTurn}
            onEditPendingNarrative={game.editPendingNarrative}
            sessionPresentationLocked={
              !!state && (state.turn > 0 || (state.log?.length ?? 0) > 1)
            }
            onToggleComicMode={() => {
              // Session presentation is locked once a campaign is underway —
              // visualMode / art style are chosen at New Game only.
              const locked = !!state && (state.turn > 0 || (state.log?.length ?? 0) > 1);
              if (locked) return;
              if (game.narrativeMode) {
                game.setNarrativeMode(false);
                game.setComicMode(false);
              } else if (game.comicMode) {
                game.setComicMode(false);
                game.setNarrativeMode(true);
              } else {
                game.setComicMode(true);
                game.setNarrativeMode(false);
              }
            }}
            onAutoFight={() => game.autoFight()}
            onOpenCharacter={() => game.setShowCharacterWindow(true)}
          />
        </main>

        <RightDrawer state={state} open={game.rightOpen} onClose={() => game.setRightOpen(false)} onUpdateLorebook={game.updateLorebook} />
      </div>

      {game.showSettings && (
        <Suspense fallback={null}>
          <SettingsModal
            settings={game.settings}
            storyName={state.storyName}
            engineMode={state.engineMode}
            gameState={state}
            onSave={game.updateSettings}
            onStoryNameChange={game.updateStoryName}
            onSetContentMode={game.setContentMode}
            onVerifyPin={game.verifyContentPin}
            {...saveManagement}
            onClose={() => game.setShowSettings(false)}
            currentBgUrl={bgImage.url}
          />
        </Suspense>
      )}
      {game.showApiSetup && (
        <Suspense fallback={null}>
          <ApiSetupModal
            settings={game.settings}
            onSave={game.updateSettings}
            onSetContentMode={game.setContentMode}
            onClose={() => game.setShowApiSetup(false)}
          />
        </Suspense>
      )}
      {game.showNewGame && (
        <Suspense fallback={null}>
            <NewGameModal
            contentMode={game.settings.contentMode}
            onStart={game.startNewGame}
            onClose={() => game.setShowNewGame(false)}
          />
        </Suspense>
      )}
      {game.showWelcome && (
        <WelcomeModal
          onSignIn={game.handleGoogleSignIn}
        />
      )}

      {/* Quest Journal Modal */}
      <Suspense fallback={null}>
        <QuestLogModal
          isOpen={showQuestLog}
          onClose={() => setShowQuestLog(false)}
          quests={state ? visibleJournalQuests(state) : []}
        />
      </Suspense>

      {/* Dungeon Fog of War Map Modal */}
      <Suspense fallback={null}>
        <DungeonMapModal
          isOpen={showMapModal}
          onClose={() => setShowMapModal(false)}
          activeDungeon={state.activeDungeon ?? null}
          currentLocation={state.currentLocation}
          currentCoordinates={state.currentCoordinates}
          onEnsureLocalMap={game.hydratePlayFromLog}
          onLoadDungeon={(blueprintId, dungeonName, isProcedural, tier, nodeCount) => {
            if (game.loadDungeon) {
              const mapTier = ([1, 2, 3, 4] as const).includes(tier as 1 | 2 | 3 | 4)
                ? (tier as 1 | 2 | 3 | 4)
                : 4;
              game.loadDungeon(blueprintId, dungeonName, isProcedural, mapTier, nodeCount);
            }
          }}
          onMoveNode={(nodeId) => {
            if (game.moveDungeonNode) {
              game.moveDungeonNode(nodeId);
            }
          }}
          onExitDungeon={() => {
            const local = state.activeDungeon?.blueprintId === 'local-area';
            if (!local && game.exitDungeon) {
              game.exitDungeon();
            }
            setShowMapModal(false);
          }}
        />
      </Suspense>

      <LoadingOverlay visible={game.showLoadingOverlay} elapsed={elapsed} theme={state.turnFrameTheme} retryStatus={game.retryStatus} onCancel={game.cancelTurn} />
      <ErrorModal
        visible={!!game.errorKind && game.errorKind !== 'rate-limit'}
        errorKind={game.errorKind}
        errorMessage={game.error ?? ''}
        onRetry={game.retryAction}
        onOpenApiSettings={() => { game.clearError(); setForceApiSetup(true); }}
        onDismiss={game.clearError}
        theme={state.turnFrameTheme}
      />
      {forceApiSetup && (
        <Suspense fallback={null}>
          <ApiSetupModal
            settings={game.settings}
            onSave={(s) => { game.updateSettings(s); setForceApiSetup(false); }}
            onSetContentMode={game.setContentMode}
            onClose={() => setForceApiSetup(false)}
          />
        </Suspense>
      )}

      {showDebug && (
        <Suspense fallback={null}>
          <DebugModal
            state={state}
            settings={game.settings}
            onClose={() => setShowDebug(false)}
            addToast={game.addToast}
          />
        </Suspense>
      )}

      <Suspense fallback={null}>
        <GMLibrary
          open={showGMLibrary}
          contentMode={game.settings.contentMode}
          onClose={() => setShowGMLibrary(false)}
          onSelectCampaign={(_archetype, _engineMode, bibleId) => {
            if (bibleId) game.applyCampaignBible(bibleId);
            setShowGMLibrary(false);
          }}
        />
      </Suspense>

      {game.showCharacterWindow && (
        <Suspense fallback={null}>
          <CharacterWindow
            isOpen={game.showCharacterWindow}
            onClose={() => game.setShowCharacterWindow(false)}
            state={state}
            settings={game.settings}
            initialTab="character"
            onGenerateArt={game.generateInventoryArt}
            onCommitArt={game.commitInventoryArt}
          />
        </Suspense>
      )}

      {game.showMerchantWindow && (
        <Suspense fallback={null}>
          <MerchantWindow
            isOpen={game.showMerchantWindow}
            onClose={() => game.setShowMerchantWindow(false)}
            state={state}
            onStateChange={(newState) => game.updateGameState(newState)}
            onToast={game.addToast}
          />
        </Suspense>
      )}

      {game.unlockedQuests.length > 0 && (
        <Suspense fallback={null}>
          <QuestUnlockModal
            quests={game.unlockedQuests}
            onClose={game.dismissUnlockedQuests}
            onOpenJournal={() => {
              game.dismissUnlockedQuests();
              setShowQuestLog(true);
            }}
          />
        </Suspense>
      )}

      <ToastStack toasts={game.toasts} onDismiss={game.dismissToast} />
      {/* Dice tray is D&D-only — never cover the action input in LitRPG / RPG / classic text. */}
      {state.engineMode === 'dnd' && !isComicView && (
        <DiceTrayToolbar diceAnimation={game.settings.diceAnimation ?? 'normal'} />
      )}
      <AutoSaveIndicator status={game.saveStatus || 'idle'} />

      {game.autoFightWarning && (
        <AutoFightWarningModal
          enemyName={game.autoFightWarning.enemy.name}
          enemyLevel={game.autoFightWarning.enemy.level}
          playerLevel={state.character.level}
          onProceed={() => game.autoFightWarning.resolve(true)}
          onCancel={() => game.autoFightWarning.resolve(false)}
        />
      )}

      {showAutoFightTip && !game.autoFightWarning && (
        <AutoFightTipModal
          combatResolveMode={game.settings.combatResolveMode ?? 'full'}
          onEnableAuto={() => {
            game.updateSettings({
              ...game.settings,
              combatResolveMode: 'auto',
            });
          }}
          onDismiss={() => setShowAutoFightTip(false)}
        />
      )}
    </div>
  );
}