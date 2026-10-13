/**
 * mode-gap step 1: the LitRPG / story RPG Progress tab reads the save, never sample data.
 * LitRPG tapes: summoned-pact fl151 (tt8), s76 (leftover pocket), s78 (worn device, skills off).
 * Story RPG tape: salt-road-heist ds150 (mode4). A part with no data, or one the housing hides, is empty.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';
import { progressPanel } from '../../game/progressPanel';
import { CHECK_SKILLS, skillRanksOf } from '../../game/skillRanks';
import type { GameState } from '../../game/types';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const FL151 = '2026-10-11T16-58-00-139Z_summoned-pact_cold-system_s151';
const S76 = '2026-10-07T16-15-12-290Z_summoned-pact_cold-system_s76';
const S78 = '2026-10-10T22-29-55-148Z_summoned-pact_cold-system_s78';
const RPG_DS150 = '2026-10-13T14-15-18-792Z_salt-road-heist_chilled-gm_s150';

let L: Replay;
let P: Replay;
let W: Replay;
let R: Replay;
beforeAll(async () => {
  [L, P, W, R] = [
    new Replay(await replayWhole(FL151)),
    new Replay(await replayWhole(S76)),
    new Replay(await replayWhole(S78)),
    new Replay(await replayWhole(RPG_DS150)),
  ];
}, 900_000);

const last = (r: Replay): GameState => r.after(r.turns()[r.turns().length - 1]);

/** Every number on the panel is the save's own number. */
function expectFromSave(s: GameState) {
  const p = progressPanel(s);
  for (const a of p.attributes) expect(a.value).toBe(s.character.attributes[a.key]);
  const ranks = skillRanksOf(s.character);
  for (const k of p.skills) {
    expect(CHECK_SKILLS as readonly string[]).toContain(k.key);
    expect(k.rank).toBe(ranks[k.key as keyof typeof ranks]);
    expect(k.rank).toBeGreaterThan(0);
  }
  expect(p.items.map((i) => i.id).sort()).toEqual((s.inventory ?? []).map((i) => i.id).sort());
  return p;
}

describe('replay bank mode-gap 1 (Progress tab reads the save)', () => {
  it('[litrpg fl151 last turn | mode-gap 1] attributes, skills and inventory are the save\'s own', () => {
    const s = last(L);
    expect(s.engineMode).toBe('litrpg');
    const p = expectFromSave(s);
    expect(p.items.length, 'the tape carries kit').toBeGreaterThan(0);
  });

  it('[litrpg s76 T2 | mode-gap 1] a leftover pocket prints no level, XP or skills, though the engine still holds them', () => {
    const s = P.before(2);
    expect(s.systemHousing?.housing).toBe('leftover_pocket');
    expect(s.character.level).toBeGreaterThan(0);
    const p = expectFromSave(s);
    expect(p.level).toBeNull();
    expect(p.xp).toBeNull();
    expect(p.skills).toEqual([]);
  });

  it('[litrpg s78 last turn | mode-gap 1] a worn device shows level and XP but no skills (skills are off in this housing)', () => {
    const s = last(W);
    expect(s.systemHousing?.housing).toBe('worn_device');
    const p = expectFromSave(s);
    expect(p.level).toBe(s.character.level);
    expect(p.xp).toEqual({ xp: s.character.xp, toNext: s.character.xpToNext });
    expect(p.skills).toEqual([]);
  });

  it('[rpg ds150 last turn | mode-gap 1] story RPG has no housing, so level, XP and inventory all show', () => {
    const s = last(R);
    expect(s.engineMode).toBe('rpg');
    expect(s.systemHousing ?? null).toBeNull();
    const p = expectFromSave(s);
    expect(p.level).toBe(s.character.level);
    expect(p.xp).toEqual({ xp: s.character.xp, toNext: s.character.xpToNext });
  });

  it('[litrpg fl151 + rpg ds150 | mode-gap 1] the inventory list is rarity-ordered and an empty save shows no parts', () => {
    const order = ['Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'];
    for (const s of [last(L), last(R)]) {
      const idx = progressPanel(s).items.map((i) => order.indexOf(i.rarity));
      expect(idx).toEqual([...idx].sort((a, b) => a - b));
    }
    const bare = { ...last(R), inventory: [], character: { ...last(R).character, attributes: {} as GameState['character']['attributes'], skills: {}, level: 1 } };
    const p = progressPanel(bare as GameState);
    expect(p.attributes).toEqual([]);
    expect(p.items).toEqual([]);
    expect(p.skills).toEqual([]);
  });

  it('[source | mode-gap 1] no module imports the old sample data', () => {
    const src = join(__dirname, '..', '..');
    expect(existsSync(join(src, 'data', 'mockGameData.ts'))).toBe(false);
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) { if (name !== '__tests__') walk(p); continue; }
        if (/\.(tsx?|mjs)$/.test(name) && /mockGameData|mockSkills|mockLoot/.test(readFileSync(p, 'utf8'))) hits.push(p);
      }
    };
    walk(src);
    expect(hits).toEqual([]);
  });
});
