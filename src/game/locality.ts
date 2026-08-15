import type { GameState } from './types';

export type FirearmsNorm =
  | 'no_civilian_carry'
  | 'licensed_rural_long_guns'
  | 'concealed_carry_common'
  | 'unknown';

export interface LocalityToken {
  country: string;
  firearmsNorm: FirearmsNorm;
  currencySymbol: string;
  emergencyNumber: string;
  pavementWord: string;
  drivingSide: 'left' | 'right';
}

const UK_HINT =
  /\b(uk|u\.k\.|united kingdom|britain|british|england|scotland|wales|northern ireland|london|manchester|birmingham|leeds|glasgow|edinburgh|cardiff|belfast|peterborough|nottingham|sheffield|liverpool|bristol|newcastle|leicester|coventry|ireland|dublin|cork)\b/i;
const AU_HINT = /\b(australia|sydney|melbourne|brisbane|perth|adelaide|nz|new zealand|auckland)\b/i;
const JP_HINT = /\b(japan|tokyo|osaka|kyoto|yokohama)\b/i;
const US_HINT =
  /\b(usa|u\.s\.a\.|united states|america|american|\bny\b|new york|los angeles|chicago|texas|california|florida)\b/i;

export function deriveLocalityToken(place: string | undefined): LocalityToken {
  const p = place ?? '';
  if (UK_HINT.test(p) || (!US_HINT.test(p) && !AU_HINT.test(p) && !JP_HINT.test(p) && /\b(high street|pavement|tesco|co-op|sainsbury)\b/i.test(p))) {
    return {
      country: 'GB',
      firearmsNorm: 'no_civilian_carry',
      currencySymbol: '£',
      emergencyNumber: '999',
      pavementWord: 'pavement',
      drivingSide: 'left',
    };
  }
  if (AU_HINT.test(p)) {
    return {
      country: 'AU',
      firearmsNorm: 'no_civilian_carry',
      currencySymbol: 'A$',
      emergencyNumber: '000',
      pavementWord: 'footpath',
      drivingSide: 'left',
    };
  }
  if (JP_HINT.test(p)) {
    return {
      country: 'JP',
      firearmsNorm: 'no_civilian_carry',
      currencySymbol: '¥',
      emergencyNumber: '110',
      pavementWord: 'pavement',
      drivingSide: 'left',
    };
  }
  if (US_HINT.test(p)) {
    return {
      country: 'US',
      firearmsNorm: 'concealed_carry_common',
      currencySymbol: '$',
      emergencyNumber: '911',
      pavementWord: 'sidewalk',
      drivingSide: 'right',
    };
  }
  return {
    country: 'unknown',
    firearmsNorm: 'unknown',
    currencySymbol: '',
    emergencyNumber: '',
    pavementWord: 'street',
    drivingSide: 'right',
  };
}

export function formatLocalityForPrompt(state: Pick<GameState, 'currentLocation' | 'engineMode'>): string {
  if (state.engineMode === 'dnd') return '';
  const token = deriveLocalityToken(state.currentLocation);
  const gun =
    token.firearmsNorm === 'no_civilian_carry'
      ? 'NO civilian handguns on the street. A rifle or shotgun only on a farm, at a police station, or at barracks — or if the ledger already has that item. Do not US-default this street.'
      : token.firearmsNorm === 'unknown'
        ? 'Do not invent civilian firearms. Only show a gun if the ledger already has one or the scene is a farm / police station / barracks.'
        : 'Civilian firearms are possible here. Do not narrate a mass-shooting. Do not invent a gun the ledger does not have.';
  const words = [
    token.pavementWord && `Use "${token.pavementWord}" not the wrong-country footpath word.`,
    token.currencySymbol && `Prices in ${token.currencySymbol}.`,
    token.emergencyNumber && `Emergency number ${token.emergencyNumber}.`,
  ].filter(Boolean);
  return `LOCALITY CONTRACT (CODE — BINDING):
Place: ${state.currentLocation || 'unspecified'}. Country hint: ${token.country}.
${gun}
${words.join(' ')}
Do not invent branded chains the player did not name.`.trim();
}

/** Soft locality pass — never a second writer. */
export function applyLocalityWarden(text: string, location?: string, hasFirearmInLedger = false): string {
  const token = deriveLocalityToken(location);
  if (token.country === 'GB') {
    let next = text.replace(/\bsidewalks?\b/gi, 'pavement').replace(/\bcurbs?\b/gi, 'kerb');
    if (token.firearmsNorm === 'no_civilian_carry' && !hasFirearmInLedger) {
      next = next
        .replace(/\bas (?:her|his|their) pistol jams mid-reload\b/gi, 'as they fumble a phone')
        .replace(/\b(open[- ]carry|holstered (?:pistol|handgun))\b/gi, 'empty hands');
    }
    return next;
  }
  if (token.country === 'AU') {
    return text.replace(/\bsidewalks?\b/gi, 'footpath');
  }
  return text;
}
