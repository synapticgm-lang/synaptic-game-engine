/**
 * Batch 12d — 11f grain-ship talk leftover + honest catalog seeds.
 * Hall line must stay spoke / stitch, never Silent settle at "this room".
 * No new FSM. No SNAPSHOT/CRAFT. Mid writer OFF.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import {
  hallTalkAsksStayLeave,
  isHallTalkPlayerLine,
  playerAskedWhyPulled,
  shouldStitchOpeningContinue,
} from './openingEstablishment';
import {
  isSilentReceiptAction,
  shouldUseSilentMudTurn,
} from './freeMudPresentation';
import {
  assemblePacketStitch,
  buildCompletedEventPacket,
  classifyVerb,
} from './completedEventPacket';
import { stitchOpeningContinue } from './openingStitch';
import {
  allCatalogEncounters,
  DND_ENCOUNTERS,
  LITRPG_ENCOUNTERS,
  PYOA_ENCOUNTERS,
  RPG_ENCOUNTERS,
} from '@/data/encounters';
import type { GameState } from './types';

const GRAIN =
  'You summoned me to get luck for your cargo run? Laugh out loud. Can I ever get back home? To earth?';

const GRAIN_WHERE = 'a harbor circle in the hold of a Valespire grain-ship';
const GRAIN_HOOK = [
  'Location: a harbor circle in the hold of a Valespire grain-ship',
  'Who is here / who summoned: Smugglers who stole a Scale rite and panicked when it worked',
  'Why this happened: They wanted luck for a cargo run. They pulled an Earth soul. The Crown does not know yet.',
  'Opening offer: Keep their secret and they will kit you as crew (knife, oilskin, a bunk). Shout for the Crown and you keep Earth kit — and they may dump you at the quay.',
].join('\n');

const GRAIN_PAGE1 =
  'Timber, tar, and bilge. You are on your back in a chalk circle in the hold of a Valespire grain-ship; the deck is already moving. A blue panel hangs over stacked sacks. Three sailors stare as if they stole a rite and it worked.';

function grainShip(over: Partial<GameState> = {}): GameState {
  const base = createInitialState('The Summoned Pact', 'litrpg');
  return {
    ...base,
    campaignBibleId: 'summoned-pact',
    seed: 'grain-ship-12d',
    currentLocation: '',
    character: { ...base.character, name: 'Jax' },
    turn: 3,
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax', where: GRAIN_WHERE },
      complete: true,
      sceneWritten: true,
      mode: 'weave',
      aloneArrival: false,
      pickedHook: GRAIN_HOOK,
      pickedHookFallback: GRAIN_PAGE1,
    },
    sceneFacts: emptySceneFacts(3),
    log: [
      {
        id: 't0',
        turn: 0,
        role: 'gm',
        content: GRAIN_PAGE1,
        timestamp: 1,
      },
    ],
    ...over,
  };
}

describe('playtest12d — grain-ship talk + catalog seeds', () => {
  it('HUD/BUILD are 12d, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toMatch(/^2026-09-12/);
    expect(BUILD_STAMP).toMatch(/^2026-09-12/);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('grain-ship home/earth line is hall talk spoke, not Silent acted', () => {
    expect(playerAskedWhyPulled(GRAIN)).toBe(true);
    expect(hallTalkAsksStayLeave(GRAIN)).toBe(true);
    expect(isHallTalkPlayerLine(GRAIN)).toBe(true);
    expect(classifyVerb(GRAIN)).toBe('spoke');
    expect(isSilentReceiptAction(GRAIN)).toBe(false);
    expect(shouldStitchOpeningContinue(grainShip(), GRAIN)).toBe(true);
    expect(
      shouldUseSilentMudTurn({
        subscriptionTier: 'free',
        openingComplete: true,
        playerInput: GRAIN,
      })
    ).toBe(false);
  });

  it('empty HERE still names the grain-ship; stitch is not settle this room', () => {
    const packet = buildCompletedEventPacket(grainShip(), GRAIN);
    expect(packet.verb).toBe('spoke');
    expect(packet.location).toMatch(/grain-ship|harbor|Valespire/i);
    expect(packet.location).not.toMatch(/^this room$/i);
    const stitch = assemblePacketStitch(packet);
    expect(stitch).not.toMatch(/finished the beat at this room/i);
    expect(stitch).not.toMatch(/The room waited without a speech/i);
    expect(stitch).toMatch(/cargo run|Earth|stay|leave|quay|crew/i);
  });

  it('opening continue answers cargo-run want and home/earth, not a telegram', () => {
    const text = stitchOpeningContinue(grainShip(), GRAIN);
    expect(text).toMatch(/cargo run|Earth soul|Crown/i);
    expect(text.length).toBeGreaterThan(40);
    expect(text).not.toMatch(/finished the beat at this room/i);
  });

  it('honest extra catalog seeds — unique ids, named foes, not 60-per-hub', () => {
    expect(LITRPG_ENCOUNTERS.length).toBeGreaterThanOrEqual(26);
    expect(DND_ENCOUNTERS.length).toBeGreaterThanOrEqual(20);
    expect(RPG_ENCOUNTERS.length).toBeGreaterThanOrEqual(20);
    expect(PYOA_ENCOUNTERS.length).toBeGreaterThanOrEqual(10);
    const all = allCatalogEncounters();
    const ids = all.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(all.every((s) => s.foeName && s.premise)).toBe(true);
    expect(LITRPG_ENCOUNTERS.some((s) => s.id === 'LITRPG-TRASH-009')).toBe(true);
    expect(LITRPG_ENCOUNTERS.some((s) => s.hubId === 'sp-hub-west-wall')).toBe(true);
  });

  it('edge hall-talk stub keeps grain-ship regex without a full client sync', () => {
    const stub = readFileSync(
      resolve(__dirname, '../../supabase/functions/_shared/gm/openingEstablishment.ts'),
      'utf8'
    );
    expect(stub).toMatch(/you summoned me/);
    expect(stub).toMatch(/get back home/);
    expect(stub).toMatch(/to earth/);
    expect(stub).toMatch(/cargo run/);
    expect(stub).toMatch(/hallTalkAsksStayLeave/);
    expect(stub).toMatch(/openingStayLeaveLine/);
  });
});
