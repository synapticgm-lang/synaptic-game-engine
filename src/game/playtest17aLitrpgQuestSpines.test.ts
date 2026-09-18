/**
 * 17a — LitRPG main-quest spines match the opening family.
 * Extra pack completes 4-per-bible. Mid OFF. No SNAPSHOT/CRAFT. No new combat FSM.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { summonedPact } from '@/data/campaigns/summonedPact';
import { heroAwakening } from '@/data/campaigns/heroAwakening';
import { systemIntegration } from '@/data/campaigns/systemIntegration';
import { fabledLegacy } from '@/data/campaigns/fabledLegacy';
import { voidAudience } from '@/data/campaigns/voidAudience';
import { dungeonTransport } from '@/data/campaigns/dungeonTransport';
import {
  ascendingSpire,
  gatebreakWard,
  hollowCore,
  inkboundAcademy,
} from '@/data/campaigns/premades';
import {
  LITRPG_MAIN_SPINES,
  matchLitRpgMainSpine,
  pickSpineStampAlt,
  resolveLitRpgFolkStamp,
  spineQuestId,
  withMatchedLitRpgSpine,
} from '@/data/quests/litrpgMainSpines';
import { litrpgOpeningSystemPing } from './openingEstablishment';
import { createInitialState } from './defaults';
import { revealLocalStarterQuest } from './questPlay';
import type { GameState } from './types';

const CATHEDRAL_HOOK =
  'Location: The Sevenfold Circle under Valespire Cathedral\nWho is here / who summoned: Robed figures and a chanter\nWhy this happened: They paid for a Pactborn champion.';

const ALONE_RUIN_HOOK =
  'Location: alone in a ruined bathhouse off the Valespire roads\nWho is here: nobody — the circle is dead\nWhy this happened: A recorded echo wants the vault key.';

const ACADEMY_HOOK =
  'Location: Academy training yard\nInstructor Kael posts a remedial combat exam. Expulsion and the dormitory are on the line.';

const UNKNOWN_HOOK = 'A quiet plaza with pigeons and a baker.';

function revealFor(
  bibleId: string,
  seeds: typeof summonedPact.starterQuests,
  hook: string,
  location: string,
  alone = false
) {
  const ctx = { bibleId, hookBlob: hook, seed: '17a-test', location };
  return revealLocalStarterQuest([], withMatchedLitRpgSpine(seeds, ctx), alone);
}

describe('playtest17a — LitRPG quest spines', () => {
  it('HUD/BUILD are 17a, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-09-17h');
    expect(BUILD_STAMP).toBe('2026-09-17h');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('SP cathedral hook reveals Crown’s Meat Shield, not Pellane Circle’s Price', () => {
    const spine = matchLitRpgMainSpine('summoned-pact', CATHEDRAL_HOOK, 'The Sevenfold Circle under Valespire Cathedral');
    expect(spine?.spineId).toBe('cathedral-royal-vanguard');
    expect(spine?.title).toMatch(/Crown.?s Meat Shield/i);
    const quests = revealFor(
      'summoned-pact',
      summonedPact.starterQuests,
      CATHEDRAL_HOOK,
      'The Sevenfold Circle under Valespire Cathedral'
    );
    const visible = quests.filter((q) => q.revealed && q.status === 'active');
    expect(visible[0]?.id).toBe('sp-spine-cathedral-royal-vanguard');
    expect(visible[0]?.name).toMatch(/Crown.?s Meat Shield/i);
    expect(visible[0]?.location).toBe('Consecrated Sanctuary');
    expect(visible[0]?.description).not.toMatch(/Pellane|Circle.?s Price/i);
    expect(quests.some((q) => q.id === 'sp-quest-1')).toBe(false);
    const seeded = withMatchedLitRpgSpine(summonedPact.starterQuests, {
      bibleId: 'summoned-pact',
      hookBlob: CATHEDRAL_HOOK,
      location: 'The Sevenfold Circle under Valespire Cathedral',
    });
    expect(seeded.some((s) => s.id === 'sp-quest-1')).toBe(true);
    expect(seeded.some((s) => s.id === 'sp-spine-cathedral-royal-vanguard')).toBe(true);
  });

  it('SP alone-ruin hook reveals Echoes of a Dead Summoner', () => {
    const spine = matchLitRpgMainSpine('summoned-pact', ALONE_RUIN_HOOK, 'alone in a ruined bathhouse');
    expect(spine?.spineId).toBe('alone-ruin-tether');
    const quests = revealFor(
      'summoned-pact',
      summonedPact.starterQuests,
      ALONE_RUIN_HOOK,
      'alone in a ruined bathhouse',
      true
    );
    const visible = quests.filter((q) => q.revealed && q.status === 'active');
    expect(visible[0]?.id).toBe('sp-spine-alone-ruin-tether');
    expect(visible[0]?.name).toMatch(/Echoes of a Dead Summoner/i);
    expect(visible[0]?.location).toBe('Collapsed Mage Tower');
    expect(visible[0]?.description).not.toMatch(/Pellane|Circle.?s Price/i);
  });

  it('HA academy hook reveals Prove Your Class', () => {
    const spine = matchLitRpgMainSpine('hero-awakening', ACADEMY_HOOK, 'Academy training yard');
    expect(spine?.title).toBe('Prove Your Class');
    const quests = revealFor(
      'hero-awakening',
      heroAwakening.starterQuests,
      ACADEMY_HOOK,
      'Academy training yard'
    );
    const visible = quests.filter((q) => q.revealed && q.status === 'active');
    expect(visible[0]?.id).toBe('ha-spine-academy-flunk-out');
    expect(visible[0]?.name).toBe('Prove Your Class');
    expect(visible[0]?.location).toBe('Training Yard Beta');
  });

  it('unknown family falls back to the current starter', () => {
    expect(matchLitRpgMainSpine('summoned-pact', UNKNOWN_HOOK, 'a quiet plaza')).toBeNull();
    const sp = revealFor('summoned-pact', summonedPact.starterQuests, UNKNOWN_HOOK, 'a quiet plaza');
    const spVisible = sp.filter((q) => q.revealed && q.status === 'active');
    expect(spVisible[0]?.id).toBe('sp-quest-1');
    expect(spVisible[0]?.name).toMatch(/Circle.?s Price/i);

    expect(matchLitRpgMainSpine('hero-awakening', UNKNOWN_HOOK, 'a quiet plaza')).toBeNull();
    const ha = revealFor('hero-awakening', heroAwakening.starterQuests, UNKNOWN_HOOK, 'a quiet plaza');
    const haVisible = ha.filter((q) => q.revealed && q.status === 'active');
    expect(haVisible[0]?.id).toBe('ha-quest-1');
    expect(haVisible[0]?.name).toMatch(/Walk Out Breathing/i);
  });

  it('stamp alt is one of the chosen spine list, seed-stable, not the whole dump', () => {
    const spine = LITRPG_MAIN_SPINES.find((s) => s.spineId === 'cathedral-royal-vanguard')!;
    const a = pickSpineStampAlt(spine, '17a-a');
    const b = pickSpineStampAlt(spine, '17a-a');
    expect(spine.stampAlts).toContain(a);
    expect(a).toBe(b);
    const state = {
      ...createInitialState('The Summoned Pact', 'litrpg'),
      campaignBibleId: 'summoned-pact',
      seed: '17a-stamp',
      currentLocation: 'The Sevenfold Circle under Valespire Cathedral',
      openingEstablishment: {
        pending: [],
        answers: {},
        complete: true,
        pickedHook: CATHEDRAL_HOOK,
      },
    } as GameState;
    const stamp = resolveLitRpgFolkStamp(state);
    expect(spine.stampAlts).toContain(stamp);
    const ping = litrpgOpeningSystemPing(state).join(' | ');
    expect(ping).toMatch(new RegExp(`Stamp: ${stamp}`));
    const others = spine.stampAlts.filter((s) => s !== stamp);
    expect(others.every((s) => !ping.includes(s))).toBe(true);
  });

  it('war-camp spine uses Commander Rusk, not Vane', () => {
    const war = LITRPG_MAIN_SPINES.find((s) => s.spineId === 'war-camp-mercenary')!;
    expect(war.whoWantsWhat).toMatch(/Commander Rusk/);
    expect(war.whoWantsWhat).not.toMatch(/\bVane\b/);
    expect(war.threeBeats.join(' ')).not.toMatch(/\bVane\b/);
    expect(spineQuestId(war)).toBe('sp-spine-war-camp-mercenary');
  });

  it('extra pack has no Vane and keeps Plug the Hole', () => {
    const dump = JSON.stringify(LITRPG_MAIN_SPINES);
    expect(dump).not.toMatch(/\bVane\b/);
    expect(LITRPG_MAIN_SPINES.some((s) => s.spineId === 'border-fort-breach' && s.title === 'Plug the Hole')).toBe(true);
    expect(LITRPG_MAIN_SPINES.filter((s) => s.bibleId === 'gatebreak-ward')).toHaveLength(4);
  });

  it('GW rooftop hook reveals The Black Market Ward', () => {
    const hook = 'Location: a Ward 9 rooftop lookout\nGates bloom. Hold the stair. Tenement rooftops and a ward-crystal.';
    const spine = matchLitRpgMainSpine('gatebreak-ward', hook, 'a Ward 9 rooftop lookout');
    expect(spine?.spineId).toBe('quarantine-zone-smuggler');
    const quests = revealFor('gatebreak-ward', gatebreakWard.starterQuests, hook, 'a Ward 9 rooftop lookout');
    const visible = quests.filter((q) => q.revealed && q.status === 'active');
    expect(visible[0]?.id).toBe('gw-spine-quarantine-zone-smuggler');
    expect(visible[0]?.name).toBe('The Black Market Ward');
    expect(visible[0]?.location).toBe('Quarantined Tenement Block');
  });

  it('AS climber-camp hook reveals Breaking the Bronze Toll', () => {
    const hook = 'Location: a climber camp at the Spire base\nTents, ration bricks, Ranking Board rumors.';
    const spine = matchLitRpgMainSpine('ascending-spire', hook, 'a climber camp at the Spire base');
    expect(spine?.spineId).toBe('slums-toll-gate');
    const quests = revealFor('ascending-spire', ascendingSpire.starterQuests, hook, 'a climber camp at the Spire base');
    const visible = quests.filter((q) => q.revealed && q.status === 'active');
    expect(visible[0]?.id).toBe('as-spine-slums-toll-gate');
    expect(visible[0]?.name).toBe('Breaking the Bronze Toll');
  });

  it('FL Mossford village hook reveals Whispers in the Dirt', () => {
    const hook = 'Location: The village of Mossford\nDawn. Brennan looks at you. The lorekeeper already knows.';
    const spine = matchLitRpgMainSpine('fabled-legacy', hook, 'The village of Mossford');
    expect(spine?.spineId).toBe('camp-prophecy-stone');
    const quests = revealFor('fabled-legacy', fabledLegacy.starterQuests, hook, 'The village of Mossford');
    const visible = quests.filter((q) => q.revealed && q.status === 'active');
    expect(visible[0]?.id).toBe('fl-spine-camp-prophecy-stone');
    expect(visible[0]?.name).toBe('Whispers in the Dirt');
    const seeded = withMatchedLitRpgSpine(fabledLegacy.starterQuests, {
      bibleId: 'fabled-legacy',
      hookBlob: hook,
      location: 'The village of Mossford',
    });
    expect(seeded.some((s) => s.id === 'fl-quest-1')).toBe(true);
  });

  it('IA library hook reveals The Biting Bestiary', () => {
    const hook = 'Location: the Inkbound library stacks\nThe Restricted Stack is already rearranging.';
    const spine = matchLitRpgMainSpine('inkbound-academy', hook, 'the Inkbound library stacks');
    expect(spine?.spineId).toBe('library-rogue-grimoire');
    const quests = revealFor('inkbound-academy', inkboundAcademy.starterQuests, hook, 'the Inkbound library stacks');
    const visible = quests.filter((q) => q.revealed && q.status === 'active');
    expect(visible[0]?.id).toBe('ia-spine-library-rogue-grimoire');
    expect(visible[0]?.name).toBe('The Biting Bestiary');
  });

  it('HC cave hook reveals Condensing the First Drop', () => {
    const hook = 'Location: a half-collapsed cave around a newborn Core\nYou awaken as a Core crystal.';
    const spine = matchLitRpgMainSpine('hollow-core', hook, 'a half-collapsed cave around a newborn Core');
    expect(spine?.spineId).toBe('ruin-meditation-cave');
    const quests = revealFor('hollow-core', hollowCore.starterQuests, hook, 'a half-collapsed cave around a newborn Core');
    const visible = quests.filter((q) => q.revealed && q.status === 'active');
    expect(visible[0]?.id).toBe('hc-spine-ruin-meditation-cave');
    expect(visible[0]?.name).toBe('Condensing the First Drop');
  });

  it('DT mimic vault hook reveals Unearth the Vault', () => {
    const hook = 'A trapped Mimic yells from a collapsed treasure vault. Rusted pickaxe nearby.';
    const spine = matchLitRpgMainSpine('dungeon-transport', hook, 'Collapsed Treasure Vault');
    expect(spine?.spineId).toBe('ruin-trapped-mimic');
    const quests = revealFor('dungeon-transport', dungeonTransport.starterQuests, hook, 'Collapsed Treasure Vault');
    const visible = quests.filter((q) => q.revealed && q.status === 'active');
    expect(visible[0]?.id).toBe('dt-spine-ruin-trapped-mimic');
    expect(visible[0]?.name).toBe('Unearth the Vault');
  });

  it('unknown family still falls back on extra bibles', () => {
    expect(matchLitRpgMainSpine('void-audience', UNKNOWN_HOOK, 'a quiet plaza')).toBeNull();
    const va = revealFor('void-audience', voidAudience.starterQuests, UNKNOWN_HOOK, 'a quiet plaza');
    const vaVisible = va.filter((q) => q.revealed && q.status === 'active');
    expect(vaVisible[0]?.id).toBe('va-quest-1');
    expect(vaVisible[0]?.name).toMatch(/Void Negotiation/i);

    expect(matchLitRpgMainSpine('gatebreak-ward', UNKNOWN_HOOK, 'a quiet plaza')).toBeNull();
    const gw = revealFor('gatebreak-ward', gatebreakWard.starterQuests, UNKNOWN_HOOK, 'a quiet plaza');
    const gwVisible = gw.filter((q) => q.revealed && q.status === 'active');
    expect(gwVisible[0]?.id).toBe('gatebreak-ward-quest-1');
    expect(gwVisible[0]?.name).toMatch(/Hold Ward 9/i);

    expect(matchLitRpgMainSpine('system-integration', UNKNOWN_HOOK, 'a quiet plaza')).toBeNull();
    const si = revealFor('system-integration', systemIntegration.starterQuests, UNKNOWN_HOOK, 'a quiet plaza');
    const siVisible = si.filter((q) => q.revealed && q.status === 'active');
    expect(siVisible[0]?.id).toBe('si-quest-1');
  });
});
