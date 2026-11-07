/**
 * The edge opening stub names a person and does not name a group.
 * Group attribution stays on the card label; it is not a cast identity.
 */
import { describe, expect, it } from 'vitest';
import { openingCastNames as edgeCastNames } from '../../supabase/functions/_shared/gm/openingEstablishment';
import { slotNamesOnePerson } from './openingEstablishment';

const FORD = 'Who is here / who summoned: Pellane scouts on one bank and Ash pickets on the other';

describe('edge opening cast names a person and not a group', () => {
  it('keeps a known person and drops a plural group', () => {
    expect(slotNamesOnePerson('Archivist Lene Quill')).toBe(true);
    expect(slotNamesOnePerson('the innkeep')).toBe(true);
    expect(slotNamesOnePerson('the field chirurgeons')).toBe(false);
    expect(slotNamesOnePerson('Pellane scouts on one bank')).toBe(false);
    expect(edgeCastNames({ sceneFacts: { present: ['Archivist Lene Quill', 'the field chirurgeons'] } }))
      .toEqual(['Archivist Lene Quill']);
    expect(edgeCastNames({ openingEstablishment: { pickedHook: FORD } })).toEqual([]);
    expect(edgeCastNames({
      openingEstablishment: { pickedHook: 'Who is here: Archivist Lene Quill and the field chirurgeons' },
    })).toEqual(['Archivist Lene Quill']);
  });
});
