/**
 * The public reload stamps must be the same release identity as the JS bundle.
 * forceLatest compares the running HUD to version.json and index.html.
 * A page that advertises an older stamp will not reload a stale tab onto this build.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseDeployedPayload, shouldReloadClient } from './forceLatest';
import { publicStampIdentityHolds, readPublicStampIdentity } from './publicStampFiles';
import { BUILD_STAMP } from './runManifest';

const root = resolve(__dirname, '../..');

function publicStamps(): { htmlComment: string; htmlMeta: string; versionHud: string; versionBuild: string } {
  const html = readFileSync(resolve(root, 'index.html'), 'utf8');
  const version = JSON.parse(readFileSync(resolve(root, 'public/version.json'), 'utf8')) as {
    hud?: string;
    build?: string;
  };
  const comment = html.match(/<!--\s*sgm-build\s+([^>]+?)\s*-->/)?.[1] ?? '';
  const meta = html.match(/<meta\s+name=["']sgm-build["']\s+content=["']([^"']+)["']/i)?.[1] ?? '';
  return {
    htmlComment: comment.trim(),
    htmlMeta: meta.trim(),
    versionHud: version.hud ?? '',
    versionBuild: version.build ?? '',
  };
}

describe('public stamp identity', () => {
  it('index.html and version.json match the JS BUILD_STAMP and the HUD stamp', () => {
    const stamps = readPublicStampIdentity();
    expect(stamps.build.length).toBeGreaterThan(0);
    expect(stamps).toEqual({
      hud: BUILD_STAMP,
      build: BUILD_STAMP,
      htmlComment: BUILD_STAMP,
      htmlMeta: BUILD_STAMP,
      versionHud: BUILD_STAMP,
      versionBuild: BUILD_STAMP,
    });
    expect(publicStamps()).toEqual({
      htmlComment: stamps.htmlComment,
      htmlMeta: stamps.htmlMeta,
      versionHud: stamps.versionHud,
      versionBuild: stamps.versionBuild,
    });
    expect(publicStampIdentityHolds(stamps)).toBe(true);
    expect(publicStampIdentityHolds({ ...stamps, htmlMeta: '' })).toBe(false);
    expect(publicStampIdentityHolds({ ...stamps, htmlComment: 'other' })).toBe(false);
    expect(publicStampIdentityHolds({ ...stamps, versionHud: 'other' })).toBe(false);
    expect(publicStampIdentityHolds({ ...stamps, versionBuild: 'other' })).toBe(false);
    expect(publicStampIdentityHolds({ ...stamps, hud: 'other' })).toBe(false);
    expect(publicStampIdentityHolds({ ...stamps, build: '' })).toBe(false);
    expect(publicStampIdentityHolds({ ...stamps, build: '   ' })).toBe(false);
  });

  it('a tab still advertising 2026-11-01a reloads when the page stamp is this build', () => {
    const html = readFileSync(resolve(root, 'index.html'), 'utf8');
    const version = readFileSync(resolve(root, 'public/version.json'), 'utf8');
    const fromHtml = parseDeployedPayload(html);
    const fromJson = parseDeployedPayload(version);
    expect(fromHtml.hud).toBe(BUILD_STAMP);
    expect(fromJson).toEqual({ hud: BUILD_STAMP, build: BUILD_STAMP });
    expect(
      shouldReloadClient({
        runningHud: '2026-11-01a',
        runningBuild: '2026-11-01a',
        deployedHud: fromJson.hud,
        deployedBuild: fromJson.build,
      })
    ).toBe(true);
    expect(
      shouldReloadClient({
        runningHud: BUILD_STAMP,
        runningBuild: BUILD_STAMP,
        deployedHud: fromJson.hud,
        deployedBuild: fromJson.build,
      })
    ).toBe(false);
  });
});
