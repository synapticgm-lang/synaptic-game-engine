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
    expect(cleaned).toMatch(/the official shouts/i);
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
