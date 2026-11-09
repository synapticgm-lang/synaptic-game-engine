/**
 * Code-first fact gate. No model calls. The checker and repair hooks are stubs.
 */
import { describe, expect, it } from 'vitest';
import { applyFactGate, isUnsureFactCheckEnabled } from './factGate';
import type { FactSheet } from './factSheet';

function sheet(partial?: Partial<FactSheet>): FactSheet {
  return {
    turn: 3,
    place: { name: 'Valespire Bathhouse', exits: ['street'], features: ['cold plunge', 'furnace', 'cloak'] },
    present: [{ name: 'Mira' }],
    openLedger: [],
    gear: { worn: [], carrying: ['Bag'], inHand: 'nothing' },
    beat: {
      verb: 'spoke',
      outcome: 'spoke',
      engineResult: 'Mira answered.',
      steps: [{ outcome: 'moved', detail: 'No move this turn: at the bathhouse. Do not narrate leaving.' }],
    },
    player: { typed: 'hello Mira', claimsNotTrue: [] },
    quests: [],
    recent: [],
    settingsSlot: null,
    ...partial,
  };
}

describe('fact gate', () => {
  it('removes an invented vault sentence and keeps the checked one', async () => {
    const out = await applyFactGate({
      prose: 'Mira answers you. UNCHECKED_SENTENCE_9f3c opens the vault.',
      sheet: sheet(),
    });
    expect(out.withheld).toBe(false);
    expect(out.prose).toContain('Mira answers you');
    expect(out.prose).not.toContain('UNCHECKED_SENTENCE_9f3c');
    expect(out.prose).not.toMatch(/vault/i);
  });

  it('removes a key the player pockets and a sunblade handed to the player', async () => {
    const pocket = await applyFactGate({
      prose: 'You pocket the key. Mira stays by the furnace.',
      sheet: sheet(),
      pcName: 'Jax',
    });
    expect(pocket.prose).not.toMatch(/key/i);
    expect(pocket.prose).toMatch(/furnace/i);
    const handed = await applyFactGate({
      prose: 'She hands you the sunblade. Mira stays by the furnace.',
      sheet: sheet(),
      pcName: 'Jax',
    });
    expect(handed.prose).not.toMatch(/sunblade/i);
    expect(handed.prose).toMatch(/furnace/i);
  });

  it('keeps an item the sheet already names when the player receives it', async () => {
    const held = await applyFactGate({
      prose: 'You pocket the cloak.',
      sheet: sheet(),
      pcName: 'Jax',
    });
    expect(held.prose).toMatch(/cloak/i);
    expect(held.spans.filter((s) => s.verdict === 'new/wrong')).toEqual([]);
  });

  it('drops a dragon and keeps the bathhouse', async () => {
    const out = await applyFactGate({
      prose: 'A dragon lands on the furnace. The bathhouse waits.',
      sheet: sheet(),
    });
    expect(out.prose).not.toMatch(/dragon/i);
    expect(out.prose).toMatch(/bathhouse waits/i);
    expect(out.withheld).toBe(false);
  });

  it('does not let a true cloak cover a vault key in the same sentence', async () => {
    const out = await applyFactGate({
      prose: 'The cloak is on the peg and Mara hands you the vault key.',
      sheet: sheet({ present: [{ name: 'Mira' }, { name: 'Mara' }] }),
    });
    expect(out.prose).toMatch(/cloak/i);
    expect(out.prose).not.toMatch(/vault key/i);
  });

  it('keeps a colour sentence and does not call a checker or a repair', async () => {
    let checks = 0;
    let repairs = 0;
    const out = await applyFactGate({
      prose: 'Steam curls off the cold plunge.',
      sheet: sheet(),
      unsureCheck: async () => {
        checks += 1;
        return [];
      },
      repair: async () => {
        repairs += 1;
        return 'nope';
      },
    });
    expect(out.prose).toMatch(/Steam curls/i);
    expect(checks).toBe(0);
    expect(repairs).toBe(0);
    expect(isUnsureFactCheckEnabled()).toBe(false);
  });

  it('removes an unsure span when the flag is off', async () => {
    let checks = 0;
    const out = await applyFactGate({
      prose: 'Mira stays by the door. Folks there trade in things they should not.',
      sheet: sheet(),
      unsureCheck: async () => {
        checks += 1;
        return [];
      },
    });
    expect(checks).toBe(0);
    expect(out.prose).toContain('Mira stays by the door');
    expect(out.prose).not.toMatch(/trade/i);
    expect(out.spans.some((s) => s.verdict === 'UNSURE')).toBe(true);
  });

  it('sends only unsure spans to the checker when the flag is on', async () => {
    const seen: string[] = [];
    const out = await applyFactGate({
      prose: 'Mira stays by the door. Folks there trade in things they should not.',
      sheet: sheet(),
      unsureCheckEnabled: true,
      unsureCheck: async (spans) => {
        seen.push(...spans.map((s) => s.text));
        return spans.map((s) => ({ id: s.id, verdict: 'allowed' as const }));
      },
    });
    expect(seen).toEqual(['Folks there trade in things they should not.']);
    expect(out.prose).toMatch(/trade/i);
    expect(out.prose).toContain('Mira stays by the door');
  });

  it('drops one exact repeated sentence and keeps the other', async () => {
    const line = 'The bathhouse waits.';
    const out = await applyFactGate({
      prose: `${line} Mira looks at the furnace.`,
      sheet: sheet(),
      recentProse: [line],
    });
    expect(out.prose).not.toContain(line);
    expect(out.prose).toMatch(/furnace/i);
  });

  it('uses the engine page path only when nothing remains', async () => {
    const out = await applyFactGate({
      prose: 'UNCHECKED_SENTENCE_9f3c opens the vault.',
      sheet: sheet(),
    });
    expect(out.prose).toBe('');
    expect(out.withheld).toBe(true);
  });

  it('repairs a new/wrong span once, then drops it if the repair is still wrong', async () => {
    let repairs = 0;
    const once = await applyFactGate({
      prose: 'A dragon lands on the furnace. The bathhouse waits.',
      sheet: sheet(),
      repair: async () => {
        repairs += 1;
        return 'Steam curls off the furnace.';
      },
    });
    expect(repairs).toBe(1);
    expect(once.prose).toMatch(/Steam curls/i);
    expect(once.prose).not.toMatch(/dragon/i);
    expect(once.prose).toMatch(/bathhouse waits/i);

    const still = await applyFactGate({
      prose: 'A dragon lands on the furnace.',
      sheet: sheet(),
      repair: async () => 'A second dragon lands on the furnace.',
    });
    expect(still.prose).toBe('');
    expect(still.withheld).toBe(true);
  });

  it('removes a dead foe who acts and an arrival the beat did not grant', async () => {
    const dead = await applyFactGate({
      prose: 'Sera walked to the furnace. Mira stays quiet.',
      sheet: sheet({
        beat: {
          verb: 'fought',
          outcome: 'won',
          engineResult: 'Sera is dead.',
          steps: [],
        },
      }),
    });
    expect(dead.prose).not.toMatch(/Sera/i);
    expect(dead.prose).toMatch(/Mira stays/i);

    const arrived = await applyFactGate({
      prose: 'Jax arrived at the palace.',
      sheet: sheet(),
      pcName: 'Jax',
    });
    expect(arrived.prose).toBe('');
    expect(arrived.withheld).toBe(true);
  });

  it('keeps scenery items and only flags a transfer to the player', async () => {
    const scenery = [
      'An old sword rusted above the hearth.',
      'She has a coin in her palm.',
      'A chest of treasure waited in the story he told.',
      'A blade of grass clung to his boot.',
      'Steam curled off the cold plunge.',
      'The crowd smelled of rain and iron.',
      'Mira watched the door and said nothing.',
      'A gray cloak hung on the peg.',
      'Lamplight moved across the floor.',
      'Someone laughed in the next room.',
      'The bathhouse waited.',
      'Dust lay along the windowsill.',
      'Her hands were still.',
      'The fire popped once.',
      'Rain ticked on the glass.',
      'He looked at the floor.',
      'A chair scraped back an inch.',
      'The room did not change.',
      'Smoke hung under the beams.',
      'Her cup sat between them.',
      'The night was quiet.',
      'Footsteps faded down the hall.',
    ];
    expect(scenery).toHaveLength(22);
    for (const line of scenery) {
      const out = await applyFactGate({ prose: line, sheet: sheet(), pcName: 'Jax' });
      expect(out.prose, line).toBe(line);
      expect(out.spans.filter((s) => s.verdict === 'new/wrong' || s.verdict === 'UNSURE'), line).toEqual([]);
    }
  });

  it('flags a lowercase title and name, and a destination that is not an exit', async () => {
    const named = await applyFactGate({
      prose: 'captain bramble nods once. Mira stays by the furnace.',
      sheet: sheet(),
    });
    expect(named.prose).not.toMatch(/bramble/i);
    expect(named.prose).toMatch(/furnace/i);
    const known = await applyFactGate({
      prose: 'Mira nods once.',
      sheet: sheet(),
    });
    expect(known.prose).toMatch(/Mira nods once/);

    const quay = await applyFactGate({
      prose: 'Mira slipped out toward the spice quay. Mira stays by the furnace.',
      sheet: sheet(),
    });
    expect(quay.prose).not.toMatch(/spice quay/i);
    expect(quay.prose).toMatch(/furnace/i);
    const inside = await applyFactGate({
      prose: 'Mira walked toward the furnace.',
      sheet: sheet({
        beat: { verb: 'looked', outcome: 'looked', engineResult: 'Mira stayed.', steps: [] },
      }),
    });
    expect(inside.prose).toBe('Mira walked toward the furnace.');
  });

  it('keeps an and-clause exactly as written', async () => {
    const line = 'The crowd smelled of rain and iron.';
    const out = await applyFactGate({ prose: line, sheet: sheet() });
    expect(out.prose).toBe(line);
  });

  it('does not treat Whatever, They, or Roads inside a quote as new names', async () => {
    const out = await applyFactGate({
      prose: 'Mara said, "Whatever. They waited. Roads bend past the bathhouse."',
      sheet: sheet({ present: [{ name: 'Mira' }, { name: 'Mara' }] }),
    });
    expect(out.prose).toMatch(/Whatever/);
    expect(out.prose).toMatch(/They waited/);
    expect(out.prose).toMatch(/Roads bend/);
    expect(out.spans.filter((s) => s.verdict === 'new/wrong')).toEqual([]);
  });

  it('removes narrator you in third person, a lowercase false exit, and going along when the beat disagrees', async () => {
    const you = await applyFactGate({
      prose: 'You look at the furnace. Mira stays quiet.',
      sheet: sheet(),
      thirdPerson: true,
    });
    expect(you.prose).not.toMatch(/\bYou look\b/);
    expect(you.prose).toMatch(/Mira stays quiet/);

    const quoted = await applyFactGate({
      prose: 'Mira said, "You should stay."',
      sheet: sheet(),
      thirdPerson: true,
    });
    expect(quoted.prose).toMatch(/You should stay/);

    const alley = await applyFactGate({
      prose: 'Mira slipped out the alley. Mira stays by the furnace.',
      sheet: sheet(),
    });
    expect(alley.prose).not.toMatch(/alley/i);
    expect(alley.prose).toMatch(/furnace/i);
    const street = await applyFactGate({
      prose: 'Mira slipped out the street.',
      sheet: sheet(),
    });
    expect(street.prose).toMatch(/street/i);

    const obeys = await applyFactGate({
      prose: 'Mara went along quietly. Mira stays by the furnace.',
      sheet: sheet({
        present: [{ name: 'Mira' }, { name: 'Mara' }],
        beat: {
          verb: 'ordered',
          outcome: 'refused',
          engineResult: 'Mara disagrees and will not go along quietly.',
          steps: [{ outcome: 'disagree', detail: 'Mara disagrees and will not go along quietly.' }],
        },
      }),
    });
    expect(obeys.prose).not.toMatch(/went along/i);
    expect(obeys.prose).toMatch(/furnace/i);
  });

  it('removes a departure when the beat says there was no move', async () => {
    const out = await applyFactGate({
      prose: 'Jax set out for the street. Mira stays by the furnace.',
      sheet: sheet(),
      pcName: 'Jax',
    });
    expect(out.prose).not.toMatch(/set out/i);
    expect(out.prose).toMatch(/furnace/i);
  });
});
