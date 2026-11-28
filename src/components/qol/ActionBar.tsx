import { Sparkles, Dices } from 'lucide-react';
import { visibleActionChips } from '../../game/fourSlotPads';
import type { EngineMode, GameState } from '@/game/types';
import { isOpeningEstablishmentPending } from '@/game/openingEstablishment';
import { resolveOfferedChoices } from '@/game/playTranscript';
import { actionBarSceneActions, fatePickPool, pickFateChoice } from '@/game/fatePick';
import { isStorytellerRetryPage } from '@/game/openingWriterNotes';
import { classOfferPad } from '@/game/rules/characterClass';
import { systemPromptPad } from '@/game/rules/abilityPoints';
import { partyHeading, recruitPad } from '@/game/rules/companions';
import { romanceAllowed, romancePad, rpgEndingChip, storyRpgContactPad } from '@/game/storyRpgProgress';
import { originPad } from '@/game/rules/rpgOrigin';
import { creationChips, tabletopCreationPending } from '@/game/tabletop/creationFlow';
import { loadSettings } from '@/game/db';

const ROW_CHIP =
  'sgm-choice-btn flex min-h-[40px] w-full items-center rounded-lg border bg-slate-900/90 px-3 py-1.5 text-left text-xs font-medium transition-all hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-[32px] sm:w-auto sm:rounded-full sm:px-2.5';

function ChipRow({ testId, heading, chips, tone, busy, onAction }: {
  testId: string;
  heading: string;
  chips: string[];
  tone: string;
  busy: boolean;
  onAction: (action: string) => void;
}) {
  return (
    <div className={`sgm-info-panel rounded-lg border bg-slate-950/90 px-3 py-2 ${tone}`} data-testid={testId}>
      <div className="mb-1.5 text-[11px] font-medium">{heading}</div>
      <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap">
        {chips.map((label) => (
          <button key={label} disabled={busy} onClick={() => onAction(label)} className={`${ROW_CHIP} ${tone}`}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface ActionBarProps {
  state: GameState;
  busy: boolean;
  onAction: (action: string) => void;
  engineMode?: EngineMode;
  /** When true, choice buttons are collapsed (mobile screen space). */
  hidden?: boolean;
}

export function ActionBar({ state, busy, onAction, engineMode, hidden = false }: ActionBarProps) {
  // Free typing has its own box: no "Say something… / Do something else…" buttons.
  const actions = visibleActionChips(resolveOfferedChoices(state));
  // Miss page owns the bar alone (same idea as LitRPG System / #74) — no scene mix.
  const pageOwnsAlone = isStorytellerRetryPage(state);
  const systemPrompt = pageOwnsAlone ? null : systemPromptPad(state, classOfferPad(state));
  const party = pageOwnsAlone ? null : partyHeading(state);
  const recruits = pageOwnsAlone ? [] : (recruitPad(state) ?? []);
  const endingChip = pageOwnsAlone ? null : rpgEndingChip(state);
  const origins = pageOwnsAlone ? null : originPad(state);
  const creating = !pageOwnsAlone && tabletopCreationPending(state);
  const creation = creating ? creationChips(state) : [];
  // q42-OPT1m: contact favour chips come from sceneAffordances (engine offered list), not a parallel builder.
  const contactPad = pageOwnsAlone ? null : storyRpgContactPad(state);
  const romance = pageOwnsAlone ? null : romancePad(state, romanceAllowed(loadSettings()));
  const isDnd = engineMode === 'dnd' || state.engineMode === 'dnd';
  const openingCover = isOpeningEstablishmentPending(state);
  // Setup / System / origin / creation rows own their chips. Scene row is resolveOfferedChoices only (finalOptions).
  const systemChips = [...(systemPrompt?.chips ?? [])];
  const originChips = [...(origins ?? [])];
  const creationRow = [...creation];
  const offeredSet = new Set<string>();
  for (const c of actions) offeredSet.add(c.trim().toLowerCase());
  const contacts: string[] = [];
  for (const c of contactPad ?? []) if (offeredSet.has(c.trim().toLowerCase())) contacts.push(c);
  const promptSet = new Set<string>();
  for (const c of [...systemChips, ...originChips, ...creationRow, ...recruits, ...(endingChip ? [endingChip] : []), ...contacts, ...(romance ?? [])]) {
    promptSet.add(c.trim().toLowerCase());
  }
  // Session-zero creation / LitRPG System / miss page: that step owns the bar (no padded scene beside it).
  const mainActions = actionBarSceneActions(
    actions,
    systemPrompt?.chips,
    creating,
    promptSet,
    pageOwnsAlone
  );

  const handleFatesPick = () => {
    onAction(pickFateChoice(fatePickPool(
      actions,
      systemPrompt?.chips ?? (creationRow.length ? creationRow : null),
      pageOwnsAlone
    )));
  };

  if (hidden || (actions.length === 0 && !systemPrompt && !party && !recruits.length && !origins && !creationRow.length && !contacts.length && !romance)) return null;

  return (
    <div className="flex flex-col gap-1.5 pb-2">
      {creationRow.length > 0 && (
        <ChipRow testId="tabletop-creation-row" heading="Who are you on the road?" chips={creationRow} tone="border-violet-500/40 text-violet-100" busy={busy} onAction={onAction} />
      )}
      {originChips.length > 0 && (
        <ChipRow testId="origin-row" heading="Where do you come from?" chips={originChips} tone="border-violet-500/40 text-violet-100" busy={busy} onAction={onAction} />
      )}
      {contacts.length > 0 && (
        <ChipRow testId="contact-row" heading="Another way through — someone here could see to it (it costs their goodwill)" chips={contacts} tone="border-teal-500/40 text-teal-100" busy={busy} onAction={onAction} />
      )}
      {romance && (
        <ChipRow testId="romance-row" heading="Someone close to you" chips={romance} tone="border-rose-500/40 text-rose-100" busy={busy} onAction={onAction} />
      )}
      {(party || recruits.length > 0) && (
        <div className="sgm-info-panel rounded-lg border border-emerald-500/40 bg-slate-950/90 px-3 py-2" data-testid="party-row">
          <div className="text-[11px] font-medium text-emerald-200">{party ?? (state.engineMode === 'litrpg' ? 'System — party' : 'Companions')}</div>
          {recruits.length > 0 && (
            <div className="mt-1.5 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap">
              {recruits.map((label) => (
                <button
                  key={label}
                  disabled={busy}
                  onClick={() => onAction(label)}
                  className="sgm-choice-btn flex min-h-[40px] w-full items-center rounded-lg border border-emerald-500/50 bg-slate-900/90 px-3 py-1.5 text-left text-xs font-medium text-emerald-100 transition-all hover:bg-emerald-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-[32px] sm:w-auto sm:rounded-full sm:px-2.5"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {endingChip && (
        <div className="sgm-info-panel rounded-lg border border-amber-500/40 bg-slate-950/90 px-3 py-2" data-testid="ending-row">
          <div className="mb-1.5 text-[11px] font-medium text-amber-200">Your main quest is done. Keep playing, or end the story.</div>
          <button
            disabled={busy}
            onClick={() => onAction(endingChip)}
            className="sgm-choice-btn flex min-h-[40px] w-full items-center rounded-lg border border-amber-500/50 bg-slate-900/90 px-3 py-1.5 text-left text-xs font-medium text-amber-100 transition-all hover:bg-amber-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-[32px] sm:w-auto sm:rounded-full sm:px-2.5"
          >
            {endingChip}
          </button>
        </div>
      )}
      {systemPrompt && systemChips.length > 0 && (
        <div className="sgm-info-panel rounded-lg border border-sky-500/50 bg-slate-950/90 px-3 py-2" data-testid="system-prompt">
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-sky-300">{systemPrompt.heading}</div>
          <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap">
            {systemChips.map((label) => (
              <button
                key={label}
                disabled={busy}
                onClick={() => onAction(label)}
                className="sgm-choice-btn flex min-h-[40px] w-full items-center rounded-lg border border-sky-500/50 bg-slate-900/90 px-3 py-1.5 text-left text-xs font-medium text-sky-100 transition-all hover:bg-sky-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-[32px] sm:w-auto sm:rounded-full sm:px-2.5"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
      {mainActions.length > 0 && (
      <div className="flex flex-col gap-1.5 sm:flex-wrap sm:flex-row sm:items-stretch">
      {mainActions.map((action, idx) => (
        <button
          key={idx}
          disabled={busy}
          onClick={() => onAction(action)}
          className="sgm-choice-btn flex min-h-[44px] w-full items-center gap-1 rounded-lg border border-amber-500/50 bg-slate-900/90 px-3 py-2 text-left text-xs font-medium text-slate-100 backdrop-blur-md transition-all hover:bg-amber-600 hover:text-white hover:border-amber-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-slate-900/90 disabled:hover:text-slate-100 sm:min-h-[36px] sm:w-auto sm:rounded-full sm:px-2.5 sm:py-1.5"
        >
          {action}
        </button>
      ))}
      {openingCover ? null : (
      <button
        disabled={busy || actions.length === 0}
        onClick={handleFatesPick}
        title="Fate's Pick — randomly selects one of the offered actions"
        className="sgm-choice-btn flex min-h-[40px] w-full items-center justify-center gap-1 rounded-lg border border-amber-500/50 bg-black/85 px-2.5 py-1.5 text-xs font-medium text-slate-100 backdrop-blur-md transition-all hover:bg-amber-600 hover:text-white hover:border-amber-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black/85 disabled:hover:text-slate-100 sm:w-auto sm:rounded-full"
      >
        {isDnd ? <Dices size={11} /> : <Sparkles size={11} className="text-amber-400" />}
        Fate's Pick
      </button>
      )}
      </div>
      )}
    </div>
  );
}
