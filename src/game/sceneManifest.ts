/**
 * Scene Manifest — reserved high-priority authority for the current scene.
 * Compiled from existing sheets (sceneFacts, location, encounter, kit, companions).
 * Draft prose may not invent named people/places outside this + IntroductionPermit paths.
 */

import type { GameState, Item } from './types';
import { playerFacingLocation } from './locationName';
import { resolveDangerTier, resolveMapScale, dangerTierLabel, mapScaleLabel } from './placeAuthority';
import { introductionPermitForName } from './introductionPermit';

export interface SceneManifest {
  revision: number;
  turn: number;
  place: string;
  mapScale: string;
  danger: string;
  roster: string[];
  visibleKit: string[];
  exits: string[];
  threats: string[];
  props: string[];
  activeTalk: string[];
  crowd: string;
  noise: string;
  lastBeat: string;
}

function equippedNames(state: GameState): string[] {
  const items = state.inventory ?? [];
  const worn = items.filter((i) => i.equipped || i.slot);
  const names = (worn.length ? worn : items.slice(0, 8)).map((i: Item) => i.name).filter(Boolean);
  return Array.from(new Set(names)).slice(0, 12);
}

/** Compile the live scene contract from structured state. */
export function compileSceneManifest(state: GameState): SceneManifest {
  const place = playerFacingLocation(state) || state.locationSheet?.name || state.currentLocation || 'unspecified';
  const scale = mapScaleLabel(resolveMapScale(state));
  const danger = dangerTierLabel(resolveDangerTier(state)) || 'none (street/outdoors)';

  const roster = new Set<string>();
  roster.add(state.character?.name?.trim() || 'Player');
  for (const who of state.sceneFacts?.present ?? []) {
    if (who.trim()) roster.add(who.trim());
  }
  for (const c of state.companions ?? []) {
    if (c.name?.trim()) roster.add(c.name.trim());
  }
  for (const m of (state.npcMemories ?? []).slice(0, 6)) {
    if (m.npcName?.trim() && (state.turn - (m.lastSeenTurn ?? 0)) <= 8) {
      roster.add(m.npcName.trim());
    }
  }

  const threats: string[] = [];
  if (state.activeEncounter) {
    const e = state.activeEncounter;
    threats.push(`${e.name} HP ${e.hp}/${e.maxHp}`);
    roster.add(e.name);
  }

  const exits = (state.locationSheet?.exits ?? []).map((x) => x.label).filter(Boolean);
  const props = [
    ...(state.sceneFacts?.props ?? []),
    ...(state.locationSheet?.interactables ?? [])
      .filter((i) => i.state !== 'gone' && i.state !== 'taken')
      .map((i) => i.name),
  ];

  const activeTalk: string[] = [];
  for (const t of state.campaignMemory?.consequences ?? []) {
    if (t.unresolved && t.text?.trim()) activeTalk.push(t.text.trim());
  }
  for (const p of state.campaignMemory?.pins ?? []) {
    if (p.archived) continue;
    if (/ask|speech|silenced|promise|open/i.test(`${p.kind} ${p.label} ${p.text}`)) {
      activeTalk.push(p.label || p.text);
    }
  }

  return {
    revision: state.ledgerRevision ?? 0,
    turn: state.turn,
    place,
    mapScale: scale,
    danger,
    roster: Array.from(roster).slice(0, 16),
    visibleKit: equippedNames(state),
    exits: exits.slice(0, 10),
    threats: threats.slice(0, 6),
    props: Array.from(new Set(props)).slice(0, 14),
    activeTalk: activeTalk.slice(0, 6),
    crowd: state.sceneFacts?.crowd ?? 'unknown',
    noise: state.sceneFacts?.noise ?? 'unknown',
    lastBeat: state.sceneFacts?.lastBeat ?? '',
  };
}

/** Reserved prompt slot — higher authority than supporting memory / summaries. */
export function formatSceneManifestForPrompt(state: GameState): string {
  const m = compileSceneManifest(state);
  return `=== SCENE MANIFEST (AUTHORITY — reserved; do not invent outside this list) ===
Revision: ${m.revision} | Turn: ${m.turn}
Place: ${m.place}
Map scale: ${m.mapScale} | Danger: ${m.danger}
Roster (who may be named as present): ${m.roster.join(', ') || 'player only'}
Visible kit (player): ${m.visibleKit.join(', ') || 'none listed'}
Exits: ${m.exits.join(', ') || 'none established'}
Threats: ${m.threats.join(', ') || 'none'}
Props / interactables: ${m.props.join(', ') || 'none listed'}
Active talk / open asks: ${m.activeTalk.join('; ') || 'none'}
Crowd: ${m.crowd} | Noise: ${m.noise}
Last beat: ${m.lastBeat || '—'}
RULES: Do not introduce a new named person, place, faction, or major item unless the player named it this turn, the campaign bible/opening allows it, or an Introduction Permit applies. Atmosphere and unnamed roles ("a clerk", "someone in the crowd") are fine. Do not empty a present crowd without narrating time passing. Inventory/HP/quest truth comes from the ledger — do not contradict it.`;
}

/**
 * Soft check: Title-Case multi-word names in prose that are not on the manifest roster/place/props.
 * Used by the warden when continuityStrict is on.
 * Names the player typed this turn (or bible-seeded) get an Introduction Permit and are not invents.
 */
export function findManifestInventions(
  narrative: string,
  state: GameState,
  playerText = ''
): string[] {
  const m = compileSceneManifest(state);
  const allowed = new Set<string>();
  const add = (s: string) => {
    const t = s.trim().toLowerCase();
    if (t) allowed.add(t);
    for (const part of t.split(/\s+/)) {
      if (part.length > 2) allowed.add(part);
    }
  };
  for (const x of m.roster) add(x);
  for (const x of m.visibleKit) add(x);
  for (const x of m.exits) add(x);
  for (const x of m.props) add(x);
  for (const x of m.threats) add(x.split(/\s+HP\b/i)[0] ?? x);
  add(m.place);
  add(state.character?.name ?? '');
  add(state.storyName ?? '');

  const bibleBlob = [
    state.storyName ?? '',
    state.character?.name ?? '',
    state.character?.bio ?? '',
    state.character?.appearance ?? '',
    ...(state.npcMemories ?? []).map((n) => n.npcName),
  ].join(' ');

  const text = narrative
    .replace(/<[^>]+>/g, ' ')
    .replace(/"[^"]*"/g, ' ');
  const hits = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\b/g) ?? [];
  const invents: string[] = [];
  const stop = /^(The|A|An|This|That|Your|His|Her|Their|And|But|With|From|Into|After|Before|When|While|Then|System|Guide|Book)$/;
  for (const hit of hits) {
    if (stop.test(hit.split(/\s+/)[0] ?? '')) continue;
    const lower = hit.toLowerCase();
    if (allowed.has(lower)) continue;
    const parts = lower.split(/\s+/);
    if (parts.every((p) => allowed.has(p))) continue;
    // Single common role phrases are ok if not proper-looking enough — require 2+ tokens
    if (parts.length < 2) continue;
    const permit = introductionPermitForName(hit, {
      playerText,
      manifestRoster: m.roster,
      bibleBlob,
    });
    if (permit.allowed) continue;
    if (!invents.includes(hit)) invents.push(hit);
  }
  return invents.slice(0, 8);
}
