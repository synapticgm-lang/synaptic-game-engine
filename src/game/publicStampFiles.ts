/**
 * The one public reload identity: HUD, BUILD_STAMP, index.html, and version.json.
 * A batch test that only compares the HUD alias to BUILD_STAMP does not read the page.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { parseDeployedStampFromHtml } from './forceLatest';
import { BUILD_STAMP } from './runManifest';

export type PublicStampIdentity = {
  hud: string;
  build: string;
  htmlComment: string;
  htmlMeta: string;
  versionHud: string;
  versionBuild: string;
};

export function readPublicStampIdentity(): PublicStampIdentity {
  const root = resolve(__dirname, '../..');
  const html = readFileSync(resolve(root, 'index.html'), 'utf8');
  const version = JSON.parse(readFileSync(resolve(root, 'public/version.json'), 'utf8')) as {
    hud?: string;
    build?: string;
  };
  const comment = html.match(/<!--\s*sgm-build\s+([^>]+?)\s*-->/)?.[1]?.trim() ?? '';
  return {
    hud: HUD_BUILD_STAMP,
    build: BUILD_STAMP,
    htmlComment: comment,
    htmlMeta: parseDeployedStampFromHtml(html) ?? '',
    versionHud: typeof version.hud === 'string' ? version.hud : '',
    versionBuild: typeof version.build === 'string' ? version.build : '',
  };
}

/** True only when every public face is the same nonempty hand-edited stamp. */
export function publicStampIdentityHolds(id: PublicStampIdentity = readPublicStampIdentity()): boolean {
  const build = id.build.trim();
  if (!build) return false;
  return (
    id.hud === build
    && id.htmlComment === build
    && id.htmlMeta === build
    && id.versionHud === build
    && id.versionBuild === build
  );
}
