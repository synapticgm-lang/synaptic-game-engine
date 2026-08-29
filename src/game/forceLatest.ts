/**
 * Force testers onto the deployed client. Stale tabs / SW / Vite chunk cache
 * (Josie stayed on HUD 2026-08-30S after origin moved on). One-shot reload
 * like 26f safeLazy — never loop. Does not wipe saves, login, or settings.
 */

import { CHUNK_RELOAD_KEY } from '@/utils/safeLazy';

export const FORCE_LATEST_RELOAD_KEY = 'sgm-force-latest-reload';
export const UPDATING_COPY = 'Updating to the latest game…';
const FETCH_BUDGET_MS = 2500;

export function normalizeStamp(stamp: string): string {
  return (stamp ?? '').trim().toLowerCase();
}

export function compareStamps(a: string, b: string): number {
  const left = normalizeStamp(a);
  const right = normalizeStamp(b);
  if (!left || !right) return 0;
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

/** True when the running client is older than the deployed page. */
export function shouldReload(running: string, deployed: string): boolean {
  if (!normalizeStamp(running) || !normalizeStamp(deployed)) return false;
  return compareStamps(running, deployed) < 0;
}

export function shouldReloadClient(opts: {
  runningHud: string;
  runningBuild: string;
  deployedHud?: string | null;
  deployedBuild?: string | null;
}): boolean {
  if (opts.deployedHud && shouldReload(opts.runningHud, opts.deployedHud)) return true;
  if (opts.deployedBuild && shouldReload(opts.runningBuild, opts.deployedBuild)) return true;
  return false;
}

export function parseDeployedStampFromHtml(html: string): string | null {
  const named = html.match(/<meta\s+name=["']sgm-build["']\s+content=["']([^"']+)["']/i);
  if (named?.[1]) return named[1].trim();
  const reversed = html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']sgm-build["']/i);
  return reversed?.[1]?.trim() || null;
}

export function parseVersionJson(raw: unknown): { hud?: string; build?: string } {
  if (!raw || typeof raw !== 'object') return {};
  const o = raw as Record<string, unknown>;
  const hud =
    typeof o.hud === 'string' ? o.hud
    : typeof o.stamp === 'string' ? o.stamp
    : undefined;
  const build = typeof o.build === 'string' ? o.build : undefined;
  return { hud, build };
}

export function parseDeployedPayload(text: string): { hud?: string; build?: string } {
  const trimmed = (text ?? '').trim();
  if (trimmed.startsWith('{')) {
    try {
      return parseVersionJson(JSON.parse(trimmed) as unknown);
    } catch {
      /* fall through to HTML */
    }
  }
  const hud = parseDeployedStampFromHtml(trimmed);
  return hud ? { hud } : {};
}

export function deployedKey(deployed: { hud?: string; build?: string }): string {
  return `${deployed.hud ?? ''}|${deployed.build ?? ''}`;
}

/** SW + Cache Storage + Vite one-shot key. Never touches localStorage saves/auth/settings. */
export async function clearStaleClientBits(): Promise<void> {
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
  } catch {
    /* ignore */
  }
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch {
    /* ignore */
  }
  try {
    if (typeof caches !== 'undefined') {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    /* ignore */
  }
}

export function showUpdatingOverlay(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById('sgm-force-latest')) return;
  const el = document.createElement('div');
  el.id = 'sgm-force-latest';
  el.setAttribute('role', 'status');
  el.style.cssText =
    'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:#0b0b0e;color:#e8e4dc;font:16px/1.45 system-ui,sans-serif;letter-spacing:0.01em;';
  el.textContent = UPDATING_COPY;
  document.body.appendChild(el);
}

async function fetchText(url: string): Promise<string | null> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.text();
}

export async function fetchDeployedStamps(): Promise<{ hud?: string; build?: string } | null> {
  const bust = `_=${Date.now()}`;
  for (const url of [`/version.json?${bust}`, `/?${bust}`, `/index.html?${bust}`]) {
    try {
      const text = await fetchText(url);
      if (!text) continue;
      const parsed = parseDeployedPayload(text);
      if (parsed.hud || parsed.build) return parsed;
    } catch {
      /* try next */
    }
  }
  return null;
}

function alreadyReloadedFor(key: string): boolean {
  try {
    return sessionStorage.getItem(FORCE_LATEST_RELOAD_KEY) === key;
  } catch {
    return true;
  }
}

function markReloaded(key: string): void {
  try {
    sessionStorage.setItem(FORCE_LATEST_RELOAD_KEY, key);
  } catch {
    /* ignore */
  }
}

function clearReloadMark(): void {
  try {
    sessionStorage.removeItem(FORCE_LATEST_RELOAD_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * If running JS is older than the deployed page, clear leftover bits and
 * hard-reload once. Returns true when a reload was started (caller should stop).
 */
export async function runForceLatestGate(running: {
  hud: string;
  build: string;
}): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const deployed = await Promise.race([
    fetchDeployedStamps(),
    new Promise<null>((resolve) => {
      window.setTimeout(() => resolve(null), FETCH_BUDGET_MS);
    }),
  ]);
  if (!deployed) return false;
  if (
    !shouldReloadClient({
      runningHud: running.hud,
      runningBuild: running.build,
      deployedHud: deployed.hud,
      deployedBuild: deployed.build,
    })
  ) {
    clearReloadMark();
    return false;
  }
  const key = deployedKey(deployed);
  if (alreadyReloadedFor(key)) return false;
  markReloaded(key);
  showUpdatingOverlay();
  await clearStaleClientBits();
  window.location.reload();
  return true;
}

export function bindForceLatestOnReturn(running: { hud: string; build: string }): void {
  if (typeof document === 'undefined') return;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    void runForceLatestGate(running);
  });
}
