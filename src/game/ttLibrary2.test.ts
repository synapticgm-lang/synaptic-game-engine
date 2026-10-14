/**
 * tt-library-2 — libraries that replace hand-written code.
 * Item 1: the Token Prose wire contract is a zod schema (strict per-turn json_schema + the reply reader).
 * Item 2: SRD 5.2.1 (CC-BY-4.0) JSON is the source of the rules numbers it covers.
 */
import { describe, expect, it } from 'vitest';
import type { LedgerRef } from './completedEventPacket';
import { openRouterChatBody } from './openRouterChat';
import { readWireBeat, tokenBeatJsonSchema } from './tokenBeatSchema';
import { parseTokenBeat } from './tokenProse';
import { SRD_MONSTERS } from './rules/srdMonsters';
import { SPELLS } from './rules/spells';
import { MAGIC_ITEMS } from './rules/magicItems';
import SRD from '../data/srd/srd521.json';

const ENUM = [
  { tok: 't1', id: 'npc:mira', display: 'Mira', klass: 'person' },
  { tok: 't2', id: 'place:greyhollow-inn', display: 'Greyhollow Inn', klass: 'place' },
] as LedgerRef[];

type Obj = Record<string, any>;

describe('tt-library-2 item 1 — strict per-turn schema', () => {
  const schema = tokenBeatJsonSchema(ENUM) as Obj;
  const refItems = schema.properties.refs.items as Obj;
  const lineItem = schema.properties.lines.items as Obj;

  it('binds each declared ref to one REF ENUM row (token and id together)', () => {
    const pairs = (refItems.anyOf as Obj[]).map((o) => [o.properties.tok.const, o.properties.id.const]);
    expect(pairs).toEqual([
      ['t1', 'npc:mira'],
      ['t2', 'place:greyhollow-inn'],
    ]);
  });

  it('is valid for strict mode: every property required, no extras, no $schema', () => {
    expect(schema.$schema).toBeUndefined();
    expect(schema.additionalProperties).toBe(false);
    expect(lineItem.additionalProperties).toBe(false);
    expect([...lineItem.required].sort()).toEqual(['fn', 'speaker_tok', 'text']);
    const speaker = JSON.stringify(lineItem.properties.speaker_tok);
    expect(speaker).toContain('"null"');
    expect(speaker).toContain('t1');
  });

  it('a turn with an empty enum still gets a schema (free token strings)', () => {
    const empty = tokenBeatJsonSchema([]) as Obj;
    expect(empty.properties.refs.items.properties.tok.type).toBe('string');
  });
});

describe('tt-library-2 item 1 — request body', () => {
  it('a schema request routes only to providers that honour it and sends no temperature', () => {
    const body = openRouterChatBody('openai/gpt-5-mini', 's', 'p', 100, { tokenProse: true }) as Obj;
    expect(body.provider.require_parameters).toBe(true);
    expect(body.temperature).toBeUndefined();
    const lines = body.response_format.json_schema.schema.properties.lines.items;
    expect(lines.required).toContain('speaker_tok');
  });

  it('forwards the per-turn schema; a plain request is unchanged', () => {
    const schema = tokenBeatJsonSchema(ENUM);
    const body = openRouterChatBody('m', 's', 'p', 100, { tokenProse: true, schema }) as Obj;
    expect(body.response_format.json_schema.schema).toBe(schema);
    const plain = openRouterChatBody('m', 's', 'p', 100) as Obj;
    expect(plain.temperature).toBe(0.9);
    expect(plain.provider.require_parameters).toBeUndefined();
    expect(plain.response_format).toBeUndefined();
  });
});

describe('tt-library-2 item 2 — SRD 5.2.1 data is the rules source', () => {
  const block = (id: string) => SRD_MONSTERS.find((m) => m.id === id)!;

  it('the data is the 2024 SRD under CC-BY-4.0', () => {
    expect(SRD.source.license).toMatch(/^CC-BY-4\.0/);
    expect(SRD.source.data).toContain('src/2024/en');
  });

  it('monster numbers are the 2024 stat blocks (the hand table held 2014 values)', () => {
    expect(block('giant-rat')).toMatchObject({ passivePerception: 12, scores: { DEX: 16 }, attack: { toHit: 5, damage: '1d4+3' } });
    expect(block('skeleton').ac).toBe(14);
    expect(block('shadow')).toMatchObject({ hp: 27, hpDice: '5d8+5' });
    expect(block('giant-spider').attack.extra).toEqual({ dice: '2d6', type: 'poison' });
  });

  it('a die that lands only on Advantage is not an extra on every hit', () => {
    expect(block('goblin-warrior').attack).toEqual({ name: 'Scimitar', toHit: 4, damage: '1d6+2', type: 'slashing' });
  });

  it('the engine overlay keeps what the SRD writes in words', () => {
    expect(block('ghoul').attack.rider?.condition).toBe('Paralyzed');
    expect(block('wolf').attack.inflicts).toBe('Prone');
    expect(block('zombie').undeadFortitude).toBe(true);
    expect(block('goblin-warrior').kind).toBe('humanoid');
  });

  it('spell level, classes and Concentration come from the data', () => {
    expect(SPELLS["Hunter's Mark"]).toMatchObject({ level: 1, classes: ['ranger'], concentration: true });
    expect(SPELLS['Fire Bolt']).toMatchObject({ level: 0, classes: ['sorcerer', 'wizard'] });
    expect(SPELLS['Fire Bolt'].concentration).toBeUndefined();
    expect(Object.values(SPELLS).every((s) => s.classes.length > 0)).toBe(true);
  });

  it('magic item rarity and attunement come from the data; potions keep the engine values', () => {
    expect(MAGIC_ITEMS['Cloak of Protection']).toMatchObject({ srdRarity: 'Uncommon', attunement: true });
    expect(MAGIC_ITEMS['Bracers of Defense']).toMatchObject({ srdRarity: 'Rare', attunement: true });
    expect(MAGIC_ITEMS['Potion of Healing']).toMatchObject({ srdRarity: 'Common', attunement: false, heal: '2d4+2' });
  });
});

describe('tt-library-2 item 1 — reply reader', () => {
  it('collapses a ref the strict writer repeats', () => {
    const ref = { tok: 't1', id: 'npc:mira', use: 'speaker' };
    const wire = readWireBeat({ refs: Array(13).fill(ref), lines: [{ fn: 'speech', text: 'Go.', speaker_tok: 't1' }] });
    expect(wire?.refs).toEqual([ref]);
  });

  it('reads a free writer’s shortened use word and drops a bad line, not the beat', () => {
    const wire = readWireBeat({
      refs: [{ tok: '@t2', id: 'place:greyhollow-inn', use: 'location' }],
      lines: [{ fn: 'aside', text: 'x' }, { fn: 'place', text: 'Smoke hung low.', speaker_tok: null }],
    });
    expect(wire?.refs).toEqual([{ tok: 't2', id: 'place:greyhollow-inn', use: 'place' }]);
    expect(wire?.lines).toEqual([{ fn: 'place', text: 'Smoke hung low.', speaker_tok: '' }]);
  });

  it('a ref with no token, or a candidates list, is not a beat', () => {
    expect(readWireBeat({ refs: [{ id: 'npc:mira', use: 'actor' }], lines: [] })).toBeNull();
    expect(readWireBeat({ candidates: [{}], refs: [], lines: [] })).toBeNull();
  });

  it('parseTokenBeat reads a strict reply (null speaker on a narration line)', () => {
    const beat = parseTokenBeat(
      JSON.stringify({
        refs: [{ tok: 't1', id: 'npc:mira', use: 'speaker' }],
        lines: [
          { fn: 'place', text: 'The fire popped.', speaker_tok: null },
          { fn: 'speech', text: 'The road is clear.', speaker_tok: 't1' },
        ],
      })
    );
    expect(beat?.lines[0]).toEqual({ fn: 'place', text: 'The fire popped.' });
    expect(beat?.lines[1]?.speaker_tok).toBe('t1');
  });
});
