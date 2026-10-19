import { describe, expect, it } from 'vitest';
import '../data/campaigns';
import { lineHasOutOfWorldThing } from './tokenProse';
import { offSettingWords, recordsEstablishCrossing } from './settingVocabulary';
import { registerWriterIntroductions, stampCrossedOrigin } from './writerIntroductions';
import type { GameState } from './types';

const rifle = 'Jax found a rifle under the bench.';
const gun = 'Jax found a gun under the bench.';
const scene = { crowd: 'empty', noise: 'quiet', present: [], props: [], lastBeat: '' };
const medieval = { campaignBibleId: 'cursed-keep', worldAtlas: null, engineMode: 'dnd', inventory: [], npcMemories: [], sceneFacts: scene, turn: 1, currentLocation: 'Keep' } as unknown as GameState;
const refused = (s: GameState, line: string, handed = '') => lineHasOutOfWorldThing(line, handed, offSettingWords(s));

describe('P-5e what the setting allows (one rule)', () => {
  it('no premise, medieval: a rifle is still refused', () => {
    expect(recordsEstablishCrossing(medieval)).toBe(false);
    expect(refused(medieval, rifle)).toBe(true);
  });

  it('summoned from Earth: the premise establishes an origin elsewhere, so a rifle may have crossed', () => {
    const summoned = { ...medieval, campaignBibleId: 'summoned-pact', engineMode: 'litrpg' } as GameState;
    expect(recordsEstablishCrossing(summoned)).toBe(true);
    expect(refused(summoned, rifle)).toBe(false);
    const created = stampCrossedOrigin(summoned, 'rifle', 'Earth');
    expect(created.inventory.find((i) => i.name === 'rifle')?.provenance).toBe('crossed over from Earth');
    expect(created.entityRecords?.['item:rifle']?.notes).toContain('crossed over from Earth');
    expect(registerWriterIntroductions(created, rifle)).toBe(created);
  });

  it('a portal or time-travel story: once the engine hands a rifle, it and its origin stay allowed', () => {
    // The engine states it this turn ("a portal tore open; a soldier dropped a rifle"), so the line passes.
    expect(refused(medieval, rifle, 'engine result: a portal tore open and a soldier dropped a rifle')).toBe(false);
    const after = stampCrossedOrigin(medieval, 'rifle', 'a portal');
    expect(after.inventory.find((i) => i.name === 'rifle')?.provenance).toBe('crossed over from a portal');
    expect(registerWriterIntroductions(medieval, rifle)).toBe(medieval);
    // From then on, the records establish the crossing: another thing from that origin passes unhanded.
    expect(refused(after, gun)).toBe(false);
  });

  it('the player kit counts as a record', () => {
    const kitted = { ...medieval, inventory: [{ name: 'Rifle' }] } as unknown as GameState;
    expect(refused(kitted, gun)).toBe(false);
  });
});
