/**
 * Batch 12e — high-contrast floor-plan + street map chrome.
 * Visual only. No fog/floor/door logic change. No SNAPSHOT/CRAFT. Mid writer OFF.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';

const modalSrc = readFileSync(resolve(__dirname, '../components/DungeonMapModal.tsx'), 'utf8');

describe('playtest12e — map contrast chrome', () => {
  it('HUD/BUILD are 12e, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toMatch(/^2026-09-12/);
    expect(BUILD_STAMP).toMatch(/^2026-09-12/);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('interior rooms keep outlines; fog sits inside unvisited boxes', () => {
    expect(modalSrc).toContain("fill={isCurrent ? '#4a5a3a' : isVisited ? '#2a3428' : isSecret ? '#0a0c0e' : '#0e1214'}");
    expect(modalSrc).toContain("strokeDasharray={isSecret ? '4 4' : undefined}");
    expect(modalSrc).toContain('{!isVisited && !isSecret && (');
    expect(modalSrc).toContain('x={box.x + 2}');
    expect(modalSrc).toContain('fill="rgba(8, 10, 12, 0.92)"');
    expect(modalSrc).toContain('text-[18px] text-stone-400 font-bold tracking-wider');
    expect(modalSrc).toContain('fill="#0e1012"');
    expect(modalSrc).toContain('resolveInteriorEdgeKind');
    expect(modalSrc).toContain('interiorRoomFillKind');
    expect(modalSrc).toContain('isInteriorSecretUnlocked');
    expect(modalSrc).toContain('listInteriorZLevels');
  });

  it('street paths stay brighter; unvisited fog uses visitedNodeIds', () => {
    expect(modalSrc).toContain('stroke="#7a8a7a"');
    expect(modalSrc).toContain('strokeWidth={16}');
    expect(modalSrc).toContain('fill="#0a0e0c"');
    expect(modalSrc).toContain('dungeon.visitedNodeIds.includes(node.id)');
    expect(modalSrc).toContain('bg-black/50 pointer-events-none');
    expect(modalSrc).toContain('polygon points="5,1 9,5 5,9 1,5"');
    expect(modalSrc).not.toMatch(/Warcraft|Blizzard|Capcom|Resident Evil/i);
    expect(modalSrc).toContain('YouAreHereMarker');
    expect(modalSrc).toContain('MapCompass');
  });
});
