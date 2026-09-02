import { describe, expect, it } from 'vitest';
import { enforcePerspective } from './perspectiveWarden';
import {
  applyProseWarden,
  scrubLocationTautology,
  scrubSpokenQuoteStart,
} from './proseWarden';

describe('scrubLocationTautology — nearby is not here', () => {
  it('strips "a nearby building" used as the current room when already in the court', () => {
    const raw =
      'You are within the court, within the hallowed halls of a nearby building, in the kingdom of Pellane.';
    const cleaned = applyProseWarden(raw, {
      currentLocation: 'The Sevenfold Circle under Valespire Cathedral',
    });
    expect(cleaned.toLowerCase()).not.toMatch(/nearby building/);
    expect(cleaned).toMatch(/within the court/i);
    expect(cleaned).toMatch(/hallowed halls/i);
    expect(cleaned).toMatch(/Pellane/);
    expect(cleaned).toBe(
      'You are within the court, within the hallowed halls, in the kingdom of Pellane.'
    );
  });

  it('strips "of a nearby hall" when currentLocation is the cathedral', () => {
    const raw = 'Stone under you. You stand in the hush of a nearby hall.';
    const cleaned = scrubLocationTautology(raw, 'Valespire Cathedral');
    expect(cleaned.toLowerCase()).not.toMatch(/nearby hall/);
    expect(cleaned).toMatch(/hush/i);
  });

  it('rewrites "you are in a nearby building" even without another place name', () => {
    const cleaned = scrubLocationTautology('You are in a nearby building. Robes rustle.');
    expect(cleaned.toLowerCase()).not.toMatch(/nearby building/);
    expect(cleaned).toMatch(/You are inside/i);
  });

  it('keeps nearby for things that are not the current room', () => {
    const raw = 'You are within the court. A nearby stall sells bread. Someone nearby shouts.';
    const cleaned = applyProseWarden(raw, { currentLocation: 'Valespire Cathedral' });
    expect(cleaned).toMatch(/A nearby stall sells bread/);
    expect(cleaned).toMatch(/the stranger shouts/i);
  });

  it('alone: strips speaker leak from window furniture + System name', () => {
    const raw =
      'To your left, a shattered window gapes open the speaker, letting in light.\n<system>— the speaker —\nName: the speaker: [Pactborn]\n</system>';
    const cleaned = applyProseWarden(raw, { aloneArrival: true });
    expect(cleaned.toLowerCase()).not.toMatch(/the speaker/);
    expect(cleaned).toMatch(/gapes open/i);
  });
});

describe('spoken-line quote start + hood', () => {
  it('capitalizes a new sentence after a closing quote', () => {
    expect(scrubSpokenQuoteStart('"Stay." your eyes catch the vault.')).toBe(
      '"Stay." Your eyes catch the vault.'
    );
  });

  it('rewrites leftover his hood after perspective, then capitalizes', () => {
    const afterPov = enforcePerspective('"Stay." your eyes catch his hood.', {
      perspective: 'second-person',
    });
    expect(afterPov).toMatch(/your hood/i);
    const cleaned = applyProseWarden(afterPov);
    expect(cleaned).toBe('"Stay." Your eyes catch your hood.');
  });
});

describe('perspective — NPC body parts stay third-person', () => {
  it('does not rewrite NPC his shoulders / his hands into your', () => {
    const shrugs = enforcePerspective(
      'He shrugs, the motion barely moving his shoulders.',
      { perspective: 'second-person' },
      'Jax'
    );
    expect(shrugs).toMatch(/his shoulders/i);
    expect(shrugs).not.toMatch(/your shoulders/i);

    const wipe = enforcePerspective(
      'The handler wipes his hands on his thighs.',
      { perspective: 'second-person' },
      'Jax'
    );
    expect(wipe).toMatch(/his hands/i);
    expect(wipe).not.toMatch(/your hands/i);
  });

  it('still fixes player-referent his phone after watches him → you', () => {
    const fixed = enforcePerspective('She watches him pick up his phone.', {
      perspective: 'second-person',
    });
    expect(fixed.toLowerCase()).toMatch(/watches you pick up your phone/);
  });
});

describe('Free English slips', () => {
  it('fixes half an moments', () => {
    const cleaned = applyProseWarden('Half an moments later, the door opens.');
    expect(cleaned.toLowerCase()).toMatch(/half a moment later/);
    expect(cleaned.toLowerCase()).not.toMatch(/half an moments/);
  });
});

describe('Batch X+1: Flee-fail false-arrival scrubbing', () => {
  it('strips arrival narration when flee attempt failed (Turn 17 case)', () => {
    const raw = 'You reach Greyhollow Inn. The door is locked. The hunter closes in behind you.';
    const cleaned = applyProseWarden(raw, {
      currentLocation: 'Keep Gate',
      fleeFailed: true,
    });
    expect(cleaned).not.toMatch(/You reach Greyhollow Inn/i);
    expect(cleaned).toMatch(/The door is locked/);
    expect(cleaned).toMatch(/The hunter closes in/);
  });

  it('strips "You arrive at" when flee failed', () => {
    const raw = 'You arrive at the sanctuary. But the enemy grabs you.';
    const cleaned = applyProseWarden(raw, {
      currentLocation: 'Dark Alley',
      fleeFailed: true,
    });
    expect(cleaned).not.toMatch(/You arrive at the sanctuary/i);
    expect(cleaned).toMatch(/the enemy grabs you/i);
  });

  it('strips "You enter" when flee failed', () => {
    const raw = 'You enter the tavern. The bouncer blocks your path.';
    const cleaned = applyProseWarden(raw, {
      currentLocation: 'Street Corner',
      fleeFailed: true,
    });
    expect(cleaned).not.toMatch(/You enter the tavern/i);
    expect(cleaned).toMatch(/The bouncer blocks your path/i);
  });

  it('strips "You leave X and reach Y" when flee failed', () => {
    const raw = 'You leave the courtyard behind and reach the stables. The guards catch you.';
    const cleaned = applyProseWarden(raw, {
      currentLocation: 'Courtyard',
      fleeFailed: true,
    });
    expect(cleaned).not.toMatch(/You leave the courtyard/i);
    expect(cleaned).not.toMatch(/reach the stables/i);
    expect(cleaned).toMatch(/The guards catch you/i);
  });

  it('still strips same-location arrival even when fleeFailed = false (location amnesia)', () => {
    const raw = 'You reach the sanctuary. You are safe for now.';
    const cleaned = applyProseWarden(raw, {
      currentLocation: 'Sanctuary',
      fleeFailed: false,
    });
    // Should strip because currentLocation = Sanctuary (same-location false-arrival)
    expect(cleaned).not.toMatch(/You reach the sanctuary/i);
    expect(cleaned).toMatch(/You are safe for now/i);
  });

  it('strips arrival to same location when priorLocation matches (Turn 8 case)', () => {
    const raw = 'You reach Keep Gate. The sergeant eyes you warily.';
    const cleaned = applyProseWarden(raw, {
      currentLocation: 'Keep Gate',
      priorLocation: 'Keep Gate',
      fleeFailed: false,
    });
    expect(cleaned).not.toMatch(/You reach Keep Gate/i);
    expect(cleaned).toMatch(/The sergeant eyes you warily/i);
  });

  it('strips arrival patterns with "Reaching" gerund form', () => {
    const raw = 'Reaching the Keep Gate, you pause. The wall looms.';
    const cleaned = applyProseWarden(raw, {
      currentLocation: 'Keep Gate',
      fleeFailed: false,
    });
    expect(cleaned).not.toMatch(/Reaching the Keep Gate/i);
    expect(cleaned).toMatch(/you pause/i);
    expect(cleaned).toMatch(/The wall looms/i);
  });
});
