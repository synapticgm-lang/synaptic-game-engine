/**
 * Code-first fact gate. No model calls. The checker and repair hooks are stubs.
 */
import { describe, expect, it } from 'vitest';
import { applyFactGate, estimateFactCheckTokens, formatFactCheckRequest, isFactCheckEnabled, isUnsureFactCheckEnabled, parseFactCheckReply } from './factGate';
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
      'The hearth smelled of ash.',
      'Her sleeve was damp.',
      'A moth circled the lamp.',
      'The boards creaked underfoot.',
      'Shadow pooled in the corner.',
      'The air was warm.',
      'He closed his eyes.',
      'Nothing in the room stirred.',
      'The story he told was only a story.',
      'Wax pooled at the candle foot.',
    ];
    expect(scenery).toHaveLength(32);
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

  it('drops a rejected span in the middle, at the start, or at the end without reprinting it', async () => {
    const mid = await applyFactGate({
      prose: 'Mira stays by the furnace and she hands you the sunblade and the bathhouse waits.',
      sheet: sheet(),
      pcName: 'Jax',
    });
    expect(mid.prose).not.toMatch(/sunblade/i);
    expect(mid.prose).toMatch(/furnace/);
    expect(mid.prose).toMatch(/The bathhouse waits/);
    expect(mid.prose).not.toMatch(/\. the bathhouse/);

    const first = await applyFactGate({
      prose: 'She hands you the sunblade and the bathhouse waits.',
      sheet: sheet(),
      pcName: 'Jax',
    });
    expect(first.prose).not.toMatch(/sunblade/i);
    expect(first.prose).toMatch(/bathhouse waits/);

    const last = await applyFactGate({
      prose: 'The bathhouse waits and she hands you the sunblade.',
      sheet: sheet(),
      pcName: 'Jax',
    });
    expect(last.prose).not.toMatch(/sunblade/i);
    expect(last.prose).toMatch(/bathhouse waits/);
  });

  it('keeps an and-clause exactly as written', async () => {
    const line = 'The crowd smelled of rain and iron.';
    const out = await applyFactGate({ prose: line, sheet: sheet() });
    expect(out.prose).toBe(line);
  });

  it('keeps an NPC quote that only tells a story', async () => {
    const line = 'Mara Vell said, "The rite misfired into an inn, not a cathedral. They need a name before the close hears you arrived in a taproom. Stay as a guest and they will issue a room-key and a traveler\'s cloak."';
    let speech = false;
    const out = await applyFactGate({
      prose: line,
      sheet: sheet({ present: [{ name: 'Mira' }, { name: 'Mara Vell' }] }),
      pcName: 'Jax',
      thirdPerson: true,
      factCheckEnabled: true,
      factCheck: async ({ lines }) => {
        speech = lines.length > 0 && lines.every((entry) => entry.speech);
        return lines.map((entry) => ({ n: entry.n, verdict: 'keep' as const }));
      },
    });
    expect(speech).toBe(true);
    expect(out.prose).toBe(line);
    expect(out.spans.every((s) => s.route === 'candidate' && s.speech)).toBe(true);
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

    const deadSheet = sheet({
      beat: { verb: 'fought', outcome: 'won', engineResult: 'Sera is dead.', steps: [] },
    });
    const smiled = await applyFactGate({ prose: 'Sera smiled at the furnace.', sheet: deadSheet });
    expect(smiled.prose).not.toMatch(/Sera/i);
    const still = await applyFactGate({ prose: 'Sera lies still.', sheet: deadSheet });
    expect(still.prose).toMatch(/lies still/);

    for (const line of ['Mara did as she was told.', 'Mara nodded and agreed.', 'Mara obeyed.']) {
      const out = await applyFactGate({
        prose: line,
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
      expect(out.prose, line).toBe('');
      expect(out.spans.some((s) => s.verdict === 'new/wrong'), line).toBe(true);
    }

    const named = await applyFactGate({
      prose: 'A stranger named pell stood by the furnace. Mira stays quiet.',
      sheet: sheet(),
    });
    expect(named.prose).not.toMatch(/\bpell\b/i);
    expect(named.prose).toMatch(/Mira stays quiet/);
  });

  it('catches the adversarial fact lines and does not call them colour', async () => {
    const quiet = sheet({
      beat: { verb: 'looked', outcome: 'looked', engineResult: 'Mira stayed.', steps: [] },
    });
    const dead = sheet({
      beat: { verb: 'fought', outcome: 'won', engineResult: 'Sera is dead.', steps: [] },
    });
    const no = sheet({
      present: [{ name: 'Mira' }, { name: 'Mara' }],
      beat: {
        verb: 'ordered',
        outcome: 'refused',
        engineResult: 'Mara disagrees and will not go along quietly.',
        steps: [{ outcome: 'disagree', detail: 'Mara disagrees and will not go along quietly.' }],
      },
    });
    const lines: Array<{ prose: string; sheet: FactSheet; banned: RegExp }> = [
      { prose: 'captain bramble nods once.', sheet: quiet, banned: /bramble/i },
      { prose: 'A woman named pell stood nearby.', sheet: quiet, banned: /\bpell\b/i },
      { prose: 'They called him vex.', sheet: quiet, banned: /\bvex\b/i },
      { prose: 'lord harness smiled.', sheet: quiet, banned: /harness/i },
      { prose: 'Sera smiled at the lamp.', sheet: dead, banned: /Sera/i },
      { prose: 'Sera sang one note.', sheet: dead, banned: /Sera/i },
      { prose: 'Sera pushed the door.', sheet: dead, banned: /Sera/i },
      { prose: 'Mara did as she was told.', sheet: no, banned: /told/i },
      { prose: 'Mara nodded and agreed.', sheet: no, banned: /agreed/i },
      { prose: 'Mara obeyed.', sheet: no, banned: /obeyed/i },
      { prose: 'Mara went along quietly.', sheet: no, banned: /went along/i },
      { prose: 'Mira slipped out toward the spice quay.', sheet: quiet, banned: /quay/i },
      { prose: 'Jax walked past the spice market.', sheet: quiet, banned: /market/i },
      { prose: 'Mira went beside the old mill.', sheet: quiet, banned: /mill/i },
      { prose: 'Jax stepped around the chapel.', sheet: quiet, banned: /chapel/i },
      { prose: 'Jax ran over the bridge.', sheet: quiet, banned: /bridge/i },
      { prose: 'Mira moved under the arch.', sheet: quiet, banned: /arch/i },
      { prose: 'Jax crept along the river road.', sheet: quiet, banned: /river/i },
      { prose: 'You pocket the key.', sheet: quiet, banned: /key/i },
      { prose: 'She hands you the sunblade.', sheet: quiet, banned: /sunblade/i },
      { prose: 'Jax found a health tonic.', sheet: quiet, banned: /tonic/i },
      { prose: 'Jax picked up the treasure.', sheet: quiet, banned: /treasure/i },
      { prose: 'Jax grabbed the ring.', sheet: quiet, banned: /ring/i },
      { prose: 'Jax dropped the letter.', sheet: quiet, banned: /letter/i },
      { prose: 'Jax lost the potion.', sheet: quiet, banned: /potion/i },
      { prose: 'Jax received a dagger.', sheet: quiet, banned: /dagger/i },
      { prose: 'The knife feels reassuring in Jax\'s grip.', sheet: quiet, banned: /knife/i },
      { prose: 'Mira offers you a potion.', sheet: quiet, banned: /potion/i },
      { prose: 'Jax took the coin from the table.', sheet: quiet, banned: /coin/i },
      { prose: 'Jax headed across the salt marsh.', sheet: quiet, banned: /marsh/i },
    ];
    expect(lines).toHaveLength(30);
    let misses = 0;
    for (const line of lines) {
      const out = await applyFactGate({ prose: line.prose, sheet: line.sheet, pcName: 'Jax' });
      const published = line.banned.test(out.prose);
      const colour = out.spans.every((s) => s.verdict === 'colour' || s.verdict === 'allowed');
      if (published || colour) misses += 1;
      expect(published, line.prose).toBe(false);
      expect(colour, line.prose).toBe(false);
    }
    expect(misses).toBe(0);
  });

  it('sends fact-like spans in one batch and fails closed per span', async () => {
    let calls = 0;
    const out = await applyFactGate({
      prose: 'Steam curls off the cold plunge. Jax considered the quiet. Mira stays by the furnace.',
      sheet: sheet(),
      pcName: 'Jax',
      factCheckEnabled: true,
      factCheck: async ({ lines }) => {
        calls += 1;
        expect(lines.map((line) => line.n)).toEqual([1, 2]);
        expect(lines[0]?.text).toMatch(/Jax considered/);
        return [{ n: 1, verdict: 'keep' }];
      },
    });
    expect(calls).toBe(1);
    expect(out.prose).toMatch(/Steam curls/);
    expect(out.prose).toMatch(/Jax considered/);
    expect(out.prose).not.toMatch(/Mira stays/);
    expect(out.withheld).toBe(false);

    let exploded = 0;
    const blown = await applyFactGate({
      prose: 'Steam curls off the cold plunge. Jax considered the quiet.',
      sheet: sheet(),
      pcName: 'Jax',
      factCheckEnabled: true,
      factCheck: async () => {
        exploded += 1;
        throw new Error('checker down');
      },
    });
    expect(exploded).toBe(1);
    expect(blown.prose).toMatch(/Steam curls/);
    expect(blown.prose).not.toMatch(/considered/);

    const quiet = await applyFactGate({
      prose: 'Steam curls off the cold plunge.',
      sheet: sheet(),
      factCheckEnabled: true,
      factCheck: async () => {
        throw new Error('should not be called');
      },
    });
    expect(quiet.prose).toMatch(/Steam curls/);
  });

  it('repairs a candidate once when the checker asks, and leaves it out when the flag is off', async () => {
    const repaired = await applyFactGate({
      prose: 'Jax quietly came to hold the cellar key.',
      sheet: sheet(),
      pcName: 'Jax',
      factCheckEnabled: true,
      factCheck: async () => [{ n: 1, verdict: 'repair-once', text: 'Steam curls off the furnace.' }],
    });
    expect(repaired.prose).toMatch(/Steam curls/);
    expect(repaired.prose).not.toMatch(/cellar key/i);

    const previous = process.env.SGM_FACT_CHECK;
    process.env.SGM_FACT_CHECK = 'off';
    let calls = 0;
    try {
      const off = await applyFactGate({
        prose: 'Jax quietly came to hold the cellar key.',
        sheet: sheet(),
        pcName: 'Jax',
        factCheck: async () => {
          calls += 1;
          return [{ n: 1, verdict: 'remove' }];
        },
      });
      expect(isFactCheckEnabled()).toBe(false);
      expect(calls).toBe(0);
      expect(off.prose).toMatch(/cellar key/i);
      expect(off.spans.some((s) => s.route === 'candidate')).toBe(true);
    } finally {
      if (previous === undefined) delete process.env.SGM_FACT_CHECK;
      else process.env.SGM_FACT_CHECK = previous;
    }
  });

  it('reads a numbered checker reply and estimates the extra call', () => {
    expect(parseFactCheckReply('note [{"n":1,"verdict":"keep"},{"n":2,"verdict":"repair-once","text":"Steam."}]')).toEqual([
      { n: 1, verdict: 'keep', text: undefined },
      { n: 2, verdict: 'repair-once', text: 'Steam.' },
    ]);
    expect(parseFactCheckReply('not json')).toEqual([]);
    const estimate = estimateFactCheckTokens(sheet(), ['Jax considered the quiet.']);
    expect(estimate.input).toBeGreaterThan(0);
    expect(estimate.output).toBeGreaterThan(0);
  });

  it('keeps the scenery battery, and counts how many lines need a check', async () => {
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
      'The hearth smelled of ash.',
      'Her sleeve was damp.',
      'A moth circled the lamp.',
      'The boards creaked underfoot.',
      'Shadow pooled in the corner.',
      'The air was warm.',
      'He closed his eyes.',
      'Nothing in the room stirred.',
      'The story he told was only a story.',
      'Wax pooled at the candle foot.',
      'The air smelled of wet stone.',
      'Light sat in a thin band.',
      'A hinge ticked as it cooled.',
      'The window fogged at the edges.',
      'Warmth pooled near the floor.',
      'A drip counted itself somewhere.',
      'The boards held their quiet.',
      'Soot marked the stone.',
      'The lamp burned low and even.',
      'Cloth shifted in a draft.',
      'The room kept its hush.',
      'Glass held a dull shine.',
      'A crack ran through the plaster.',
      'The corner stayed dim.',
      'Water beaded on the tile.',
      'The scent of soap lingered.',
      'A rope of steam rose.',
      'The latch sat where it always sat.',
      'Night pressed on the glass.',
      'The ceiling was low and dark.',
      'Embers settled without a sound.',
      'A pale mark crossed the wall.',
      'The floor was cool underfoot.',
      'Silence filled the pause.',
      'The curtain hung in a fold.',
      'A faint ring marked the table.',
      'The air did not stir.',
      'Wood grain showed in the light.',
      'The doorway was only a doorway.',
      'Heat lived in the stones.',
      'A dull gleam sat on the brass.',
      'The hour felt late.',
    ];
    expect(scenery).toHaveLength(64);
    let candidates = 0;
    let removed = 0;
    const candidateLines: string[] = [];
    for (const line of scenery) {
      const out = await applyFactGate({
        prose: line,
        sheet: sheet(),
        pcName: 'Jax',
        factCheckEnabled: true,
        factCheck: async ({ lines }) => lines.map((entry) => ({ n: entry.n, verdict: 'keep' as const })),
      });
      if (out.prose !== line) removed += 1;
      const hit = out.spans.filter((s) => s.route === 'candidate');
      if (hit.length) candidateLines.push(hit.map((s) => s.text).join(' | '));
      candidates += hit.length;
    }
    expect(removed).toBe(0);
    // 61 of 64 lines are uncertain. A coordinated noun list stays one span, so the span count is 62.
    expect(candidateLines).toHaveLength(61);
    expect(candidates).toBe(62);
  });

  it('routes paraphrased facts to the checker instead of calling them colour', async () => {
    const lines = Array.from({ length: 55 }, (_, i) => {
      const n = i + 1;
      const forms = [
        `Jax quietly came to hold mark${n}.`,
        `Mira let mark${n} pass without agreeing.`,
        `Jax was already beside mark${n} before the beat.`,
        `The mark${n} token rested in Jax's keeping.`,
        `Mira treated mark${n} as already done.`,
      ];
      return forms[i % 5]!;
    });
    expect(lines).toHaveLength(55);
    let misses = 0;
    let calls = 0;
    for (const line of lines) {
      const out = await applyFactGate({
        prose: line,
        sheet: sheet(),
        pcName: 'Jax',
        factCheckEnabled: true,
        factCheck: async ({ lines: numbered }) => {
          calls += 1;
          return numbered.map((entry) => ({ n: entry.n, verdict: 'remove' as const }));
        },
      });
      const routed = out.spans.some((s) => s.route === 'candidate');
      if (!routed || new RegExp(`mark\\d+`).test(out.prose)) misses += 1;
      expect(routed, line).toBe(true);
      expect(out.prose, line).not.toMatch(/mark\d+/);
    }
    expect(misses).toBe(0);
    expect(calls).toBe(55);
  });

  it('sends uncertain names, objects, obedience, and action quotes to the checker', async () => {
    const review = [
      'A ruby the size of a thumb sat in the ash.',
      'She nodded and did as she was told.',
      'old nan taps the tub.',
      'A clerk called brim waited by the stair.',
      'harrow nodded from the steam.',
      'then bramble cleared his throat.',
      'mistress yelna pours from the kettle.',
      'Mira said, "Jax pocketed the cellar key and left for the quay."',
    ];
    const fresh = [
      'brim waited under the stair.',
      'yelna poured without a word.',
      'harrow coughed once from the steam.',
      'the ash hid a ruby.',
      'nan tapped the tub twice.',
      'a clerk stood where brim had been.',
      'the kettle was yelna\'s.',
      'bramble looked up from the steam.',
      'mistress yelna kept the spare in the kettle.',
      'Mira said, "Jax walked out toward the quay with the key."',
    ];
    const lines = [...review, ...fresh];
    let misses = 0;
    for (const line of lines) {
      let speech = false;
      const out = await applyFactGate({
        prose: line,
        sheet: sheet(),
        pcName: 'Jax',
        factCheckEnabled: true,
        factCheck: async ({ lines: numbered }) => {
          speech = numbered.some((entry) => entry.speech);
          return numbered.map((entry) => ({ n: entry.n, verdict: 'remove' as const }));
        },
      });
      const routed = out.spans.some((s) => s.route === 'candidate');
      if (!routed) misses += 1;
      expect(routed, line).toBe(true);
      expect(out.prose, line).not.toMatch(/ruby|nan|brim|harrow|bramble|yelna|quay|told|kettle|tub/i);
      if (line.includes('"')) expect(speech, line).toBe(true);
    }
    expect(misses).toBe(0);
  });

  it('fails a span closed when the same number gets two verdicts', async () => {
    const clash = await applyFactGate({
      prose: 'Steam curls off the cold plunge. A ruby the size of a thumb sat in the ash.',
      sheet: sheet(),
      factCheckEnabled: true,
      factCheck: async () => [
        { n: 1, verdict: 'keep' },
        { n: 1, verdict: 'remove' },
      ],
    });
    expect(clash.prose).toMatch(/Steam curls/);
    expect(clash.prose).not.toMatch(/ruby/i);

    const agreed = await applyFactGate({
      prose: 'Steam curls off the cold plunge. A ruby the size of a thumb sat in the ash.',
      sheet: sheet(),
      factCheckEnabled: true,
      factCheck: async () => [
        { n: 1, verdict: 'keep' },
        { n: 1, verdict: 'keep' },
      ],
    });
    expect(agreed.prose).toMatch(/ruby/i);
  });

  it('tells the checker that speech is talk and that objects in other hands are scenery', () => {
    const prompt = formatFactCheckRequest({
      sheet: sheet(),
      lines: [
        { n: 1, text: 'Jax pocketed the cellar key.', speech: true },
        { n: 2, text: 'Steam curls off the cold plunge.' },
      ],
    });
    expect(prompt).toMatch(/\[speech\]/);
    expect(prompt).toMatch(/\[narration\]/);
    expect(prompt).toMatch(/opinion/i);
    expect(prompt).toMatch(/rumour|rumor/i);
    expect(prompt).toMatch(/legend/i);
    expect(prompt).toMatch(/commands/i);
    expect(prompt).toMatch(/offers/i);
    expect(prompt).toMatch(/refusals/i);
    expect(prompt).toMatch(/lies/i);
    expect(prompt).toMatch(/past events/i);
    expect(prompt).toMatch(/backstory/i);
    expect(prompt).toMatch(/speaker/i);
    expect(prompt).toMatch(/now holds/i);
    expect(prompt).toMatch(/now somewhere else/i);
    expect(prompt).toMatch(/contradict/i);
    expect(prompt).toMatch(/other(?:s)?'? hands|someone else's hands/i);
    expect(prompt).toMatch(/scenery/i);
  });

  it('sends every quoted span to the checker as speech', async () => {
    const lines = [
      'Mira said, "Pocket the cellar key, and take the quay."',
      'Pike said, "Hold the tin cup. I am not handing you the rifle."',
      'Mira said, "Folks say a dragon sleeps under the bathhouse."',
      'Mira said, "Legend says the quay was built on a whale."',
      'Mira said, "Guard the door and do not follow me."',
      'Mira said, "I can sell you a sunblade if you want one."',
      'Mira said, "No. I will not go with you."',
      'Mira said, "Last winter you killed the king with a spoon."',
      'Mira said, "You are holding the cellar key right now."',
      'Pike said, "Take the tin cup. The rifle stays with me."',
    ];
    expect(lines).toHaveLength(10);
    let misses = 0;
    for (const line of lines) {
      let marked = false;
      const out = await applyFactGate({
        prose: line,
        sheet: sheet({ present: [{ name: 'Mira' }, { name: 'Pike' }] }),
        pcName: 'Jax',
        factCheckEnabled: true,
        factCheck: async ({ lines: numbered }) => {
          marked = numbered.length > 0 && numbered.every((entry) => entry.speech === true);
          return numbered.map((entry) => ({ n: entry.n, verdict: 'keep' as const }));
        },
      });
      const routed = out.spans.some((s) => s.route === 'candidate' && s.speech);
      if (!routed || !marked) misses += 1;
      expect(routed, line).toBe(true);
      expect(marked, line).toBe(true);
      expect(out.prose, line).toBe(line);
    }
    expect(misses).toBe(0);
  });

  it('keeps single quotes, curly quotes, and em-dash speech as one span', async () => {
    const quoted = [
      "Mira said, 'Pocket the cellar key and take the quay.'",
      'Mira said, \u2018Pocket the cellar key and take the quay.\u2019',
      "Mira said, 'Hold the tin cup. Take the quay.'",
      'Mira \u2014 the soup is too salty and the quay is shut.',
    ];
    for (const line of quoted) {
      let seen = '';
      const out = await applyFactGate({
        prose: line,
        sheet: sheet(),
        pcName: 'Jax',
        factCheckEnabled: true,
        factCheck: async ({ lines }) => {
          expect(lines, line).toHaveLength(1);
          expect(lines[0]?.speech, line).toBe(true);
          seen = lines[0]?.text ?? '';
          return [{ n: 1, verdict: 'keep' as const }];
        },
      });
      expect(seen, line).toBe(line);
      expect(out.prose, line).toBe(line);
      expect(out.spans.some((s) => s.verdict === 'new/wrong'), line).toBe(false);
    }

    const mixed = "Mira said, 'Pocket the cellar key and take the quay.' The bathhouse waits.";
    const dropped = await applyFactGate({
      prose: mixed,
      sheet: sheet(),
      pcName: 'Jax',
      factCheckEnabled: true,
      factCheck: async ({ lines }) => lines.map((entry) => ({ n: entry.n, verdict: entry.speech ? 'remove' as const : 'keep' as const })),
    });
    expect(dropped.prose).toMatch(/The bathhouse waits/);
    expect(dropped.prose).not.toMatch(/Pocket|quay/);
    expect(dropped.prose).not.toMatch(/'|"/);
  });

  it('does not treat apostrophes in narration as quotation marks', async () => {
    const line = 'The men\u2019s cloak didn\u2019t fit at four o\u2019clock, and the furnace stayed warm.';
    let speech = 0;
    const out = await applyFactGate({
      prose: line,
      sheet: sheet(),
      pcName: 'Jax',
      factCheckEnabled: true,
      factCheck: async ({ lines }) => {
        speech = lines.filter((entry) => entry.speech).length;
        return lines.map((entry) => ({ n: entry.n, verdict: 'keep' as const }));
      },
    });
    expect(speech).toBe(0);
    expect(out.prose).toBe(line);
    expect(out.spans.some((s) => s.speech)).toBe(false);
  });

  it('keeps a second dash-speech sentence for the checker and does not delete it in code', async () => {
    const line = 'Mira — the soup is too salty. You left for the quay.';
    const out = await applyFactGate({
      prose: line,
      sheet: sheet(),
      pcName: 'Jax',
      thirdPerson: true,
      factCheckEnabled: true,
      factCheck: async ({ lines }) => {
        expect(lines).toHaveLength(1);
        expect(lines[0]?.speech).toBe(true);
        expect(lines[0]?.text).toMatch(/quay/);
        expect(lines[0]?.text).toMatch(/soup/);
        return [{ n: 1, verdict: 'keep' as const }];
      },
    });
    expect(out.prose).toBe(line);
    expect(out.spans.some((s) => s.verdict === 'new/wrong')).toBe(false);

    const split = 'Mira — the soup is too salty.\n\nThe bathhouse waits.';
    const parked = await applyFactGate({
      prose: split,
      sheet: sheet(),
      pcName: 'Jax',
      factCheckEnabled: true,
      factCheck: async ({ lines }) => lines.map((entry) => ({
        n: entry.n,
        verdict: entry.speech ? 'remove' as const : 'keep' as const,
      })),
    });
    expect(parked.prose).toMatch(/The bathhouse waits/);
    expect(parked.prose).not.toMatch(/soup/);
  });

  it('does not let an unclosed quote swallow the following narration', async () => {
    const line = 'Mira said, "The soup is salty. The bathhouse waits.';
    const out = await applyFactGate({
      prose: line,
      sheet: sheet(),
      pcName: 'Jax',
      factCheckEnabled: true,
      factCheck: async ({ lines }) => {
        expect(lines.some((entry) => entry.speech && /bathhouse/i.test(entry.text))).toBe(false);
        return lines.map((entry) => ({ n: entry.n, verdict: entry.speech ? 'remove' as const : 'keep' as const }));
      },
    });
    expect(out.prose).toMatch(/The bathhouse waits/);
  });

  it('sends a scare quote as narration with the quoted words inline', async () => {
    const line = 'He set the so-called "key" on the furnace.';
    const out = await applyFactGate({
      prose: line,
      sheet: sheet(),
      pcName: 'Jax',
      factCheckEnabled: true,
      factCheck: async ({ lines }) => {
        expect(lines.every((entry) => entry.speech !== true)).toBe(true);
        expect(lines.map((entry) => entry.text).join(' ')).toMatch(/\[speech\].*key/);
        return lines.map((entry) => ({ n: entry.n, verdict: 'keep' as const }));
      },
    });
    expect(out.prose).toBe(line);
    expect(out.spans.some((s) => s.verdict === 'new/wrong')).toBe(false);
  });

  it('sends a gain to the checker when any item noun is off the sheet', async () => {
    const out = await applyFactGate({
      prose: 'Jax received a bag of treasure.',
      sheet: sheet(),
      pcName: 'Jax',
      factCheckEnabled: true,
      factCheck: async ({ lines }) => {
        expect(lines.some((entry) => /treasure/i.test(entry.text))).toBe(true);
        expect(lines.every((entry) => entry.speech !== true)).toBe(true);
        return lines.map((entry) => ({ n: entry.n, verdict: 'remove' as const }));
      },
    });
    expect(out.prose).not.toMatch(/treasure/i);
    expect(out.spans.some((s) => s.route === 'candidate')).toBe(true);
  });

  it('keeps an opinion about where someone is', async () => {
    const line = 'I think Mira is down on the quay.';
    const out = await applyFactGate({
      prose: line,
      sheet: sheet(),
      pcName: 'Jax',
      factCheckEnabled: true,
      factCheck: async ({ lines }) => lines.map((entry) => ({ n: entry.n, verdict: 'keep' as const })),
    });
    expect(out.prose).toBe(line);
    expect(out.spans.some((s) => s.verdict === 'new/wrong')).toBe(false);
  });

  it('keeps a coordinated object list on its gain verb', async () => {
    const line = 'Jax pocketed the cloak and the key.';
    const out = await applyFactGate({
      prose: line,
      sheet: sheet(),
      pcName: 'Jax',
      factCheckEnabled: true,
      factCheck: async ({ lines }) => {
        expect(lines).toHaveLength(1);
        expect(lines[0]?.text).toMatch(/cloak/i);
        expect(lines[0]?.text).toMatch(/key/i);
        return [{ n: 1, verdict: 'remove' as const }];
      },
    });
    expect(out.spans).toHaveLength(1);
    expect(out.spans[0]?.route).toBe('candidate');
    expect(out.prose).not.toMatch(/cloak|key/i);
  });

  it('ends dash speech when narration starts with a known name or a pronoun verb', async () => {
    const named = 'Mira — The soup is too salty. Jax pocketed the cellar key.';
    const namedOut = await applyFactGate({
      prose: named,
      sheet: sheet(),
      pcName: 'Jax',
      factCheckEnabled: true,
      factCheck: async ({ lines }) => {
        expect(lines.some((entry) => entry.speech && /pocketed/i.test(entry.text))).toBe(false);
        expect(lines.some((entry) => entry.speech && /soup/i.test(entry.text))).toBe(true);
        return lines.map((entry) => ({ n: entry.n, verdict: entry.speech ? 'keep' as const : 'remove' as const }));
      },
    });
    expect(namedOut.prose).toMatch(/soup/i);
    expect(namedOut.prose).not.toMatch(/pocketed|cellar key/i);

    const pronoun = 'Mira — The soup is too salty. She set the bowl down.';
    const pronounOut = await applyFactGate({
      prose: pronoun,
      sheet: sheet(),
      pcName: 'Jax',
      factCheckEnabled: true,
      factCheck: async ({ lines }) => {
        expect(lines.some((entry) => entry.speech && /set the bowl/i.test(entry.text))).toBe(false);
        return lines.map((entry) => ({ n: entry.n, verdict: 'keep' as const }));
      },
    });
    expect(pronounOut.prose).toMatch(/soup/i);
    expect(pronounOut.prose).toMatch(/set the bowl/i);
    expect(pronounOut.spans.some((s) => s.speech && /set the bowl/i.test(s.text))).toBe(false);
  });

  it('sends a notice as written text so the words do not become a fact', async () => {
    const line = 'The notice read "Jax pocketed the cellar key."';
    const out = await applyFactGate({
      prose: line,
      sheet: sheet(),
      pcName: 'Jax',
      factCheckEnabled: true,
      factCheck: async ({ lines }) => {
        expect(lines).toHaveLength(1);
        expect(lines[0]?.speech).not.toBe(true);
        expect(lines[0]?.writing).toBe(true);
        expect(lines[0]?.text).toMatch(/cellar key/i);
        return [{ n: 1, verdict: 'remove' as const }];
      },
    });
    expect(out.prose).not.toMatch(/cellar key/i);
    expect(out.spans[0]?.route).toBe('candidate');
    expect(out.spans[0]?.speech).not.toBe(true);
  });

  it('ends dash speech at a single newline before narration, including CRLF', async () => {
    for (const nl of ['\n', '\r\n']) {
      const named = `Mira — The soup is too salty.${nl}Jax pocketed the cellar key.`;
      const namedOut = await applyFactGate({
        prose: named,
        sheet: sheet(),
        pcName: 'Jax',
        factCheckEnabled: true,
        factCheck: async ({ lines }) => {
          expect(lines.some((entry) => entry.speech && /pocketed/i.test(entry.text)), nl).toBe(false);
          expect(lines.some((entry) => entry.speech && /soup/i.test(entry.text)), nl).toBe(true);
          return lines.map((entry) => ({ n: entry.n, verdict: entry.speech ? 'keep' as const : 'remove' as const }));
        },
      });
      expect(namedOut.prose, nl).toMatch(/soup/i);
      expect(namedOut.prose, nl).not.toMatch(/pocketed/i);

      const pronoun = `Mira — The soup is too salty.${nl}He set the bowl down.`;
      const pronounOut = await applyFactGate({
        prose: pronoun,
        sheet: sheet(),
        pcName: 'Jax',
        factCheckEnabled: true,
        factCheck: async ({ lines }) => lines.map((entry) => ({ n: entry.n, verdict: 'keep' as const })),
      });
      expect(pronounOut.spans.some((s) => s.speech && /set the bowl/i.test(s.text)), nl).toBe(false);
      expect(pronounOut.spans.some((s) => s.speech && /soup/i.test(s.text)), nl).toBe(true);
      expect(pronounOut.prose, nl).toMatch(/soup/i);
      expect(pronounOut.prose, nl).toMatch(/set the bowl/i);
    }
  });

  it('treats a lowercase line after a finished dash sentence as narration, including CRLF', async () => {
    for (const nl of ['\n', '\r\n']) {
      const pocket = `Mira — The soup is too salty.${nl}jax pocketed the cellar key.`;
      const pocketOut = await applyFactGate({
        prose: pocket,
        sheet: sheet(),
        pcName: 'Jax',
        factCheckEnabled: true,
        factCheck: async ({ lines }) => {
          expect(lines.some((entry) => entry.speech && /pocketed/i.test(entry.text)), nl).toBe(false);
          expect(lines.some((entry) => entry.speech && /soup/i.test(entry.text)), nl).toBe(true);
          return lines.map((entry) => ({ n: entry.n, verdict: 'keep' as const }));
        },
      });
      const pocketSpan = pocketOut.spans.find((s) => /pocketed/i.test(s.text));
      expect(pocketSpan?.speech, nl).not.toBe(true);
      expect(pocketSpan?.text, nl).not.toMatch(/soup/i);
      expect(pocketSpan?.verdict, nl).toBe('new/wrong');
      expect(pocketSpan?.reason, nl).toMatch(/unlisted item/i);
      expect(pocketOut.prose, nl).toMatch(/soup/i);
      expect(pocketOut.prose, nl).not.toMatch(/pocketed|cellar key/i);

      const hand = `Mira — The soup is too salty.${nl}the key went into his hand.`;
      const handOut = await applyFactGate({
        prose: hand,
        sheet: sheet(),
        pcName: 'Jax',
        factCheckEnabled: true,
        factCheck: async ({ lines }) => {
          expect(lines.some((entry) => /went into his hand/i.test(entry.text) && entry.speech), nl).toBe(false);
          expect(lines.some((entry) => /went into his hand/i.test(entry.text) && !entry.speech && !entry.writing), nl).toBe(true);
          return lines.map((entry) => ({ n: entry.n, verdict: entry.speech ? 'keep' as const : 'remove' as const }));
        },
      });
      const handSpan = handOut.spans.find((s) => /went into his hand/i.test(s.text));
      expect(handSpan?.speech, nl).not.toBe(true);
      expect(handSpan?.text, nl).not.toMatch(/soup/i);
      expect(handOut.prose, nl).toMatch(/soup/i);
      expect(handOut.prose, nl).not.toMatch(/went into his hand/i);

      const wrap = `Mira — the soup is${nl}too salty.`;
      const wrapOut = await applyFactGate({
        prose: wrap,
        sheet: sheet(),
        pcName: 'Jax',
        factCheckEnabled: true,
        factCheck: async ({ lines }) => {
          expect(lines, nl).toHaveLength(1);
          expect(lines[0]?.speech, nl).toBe(true);
          expect(lines[0]?.text, nl).toMatch(/too salty/i);
          return [{ n: 1, verdict: 'keep' as const }];
        },
      });
      expect(wrapOut.spans.filter((s) => /salty/i.test(s.text)), nl).toHaveLength(1);
      expect(wrapOut.spans[0]?.speech, nl).toBe(true);
      expect(wrapOut.prose, nl).toMatch(/too salty/i);
    }
  });

  it('ends a kept clause with the sentence stop when a later and-clause is removed', async () => {
    const out = await applyFactGate({
      prose: 'Jax pocketed the cloak and then walked toward the alley.',
      sheet: sheet(),
      pcName: 'Jax',
    });
    expect(out.prose).toBe('Jax pocketed the cloak.');
    expect(out.prose).not.toMatch(/alley/i);
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
