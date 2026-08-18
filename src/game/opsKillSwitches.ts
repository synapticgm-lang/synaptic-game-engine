/**
 * Ops kill switches — deploy-time env + optional local override for drills.
 * Never trust the client alone for entitlements; these are emergency brakes.
 *
 * Env (Vite):
 *   VITE_OPS_ADS_OFF=true
 *   VITE_OPS_IMAGES_OFF=true
 *   VITE_OPS_FORCE_FREE_MODEL=true
 *   VITE_OPS_PAUSE_SIGNUPS=true
 *   VITE_OPS_CONTINUITY_STRICT=true  (manifest invents → continuity break)
 */

export interface OpsKillSwitches {
  adsOff: boolean;
  imagesOff: boolean;
  forceFreeModel: boolean;
  pauseSignups: boolean;
  continuityStrict: boolean;
}

const STORAGE_KEY = 'synapticgm-ops-kill-switches';

function envFlag(name: string): boolean {
  try {
    return import.meta.env[name] === 'true';
  } catch {
    return false;
  }
}

function readLocalOverride(): Partial<OpsKillSwitches> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<OpsKillSwitches>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** Merge env (authoritative when true) with local drill overrides. */
export function getOpsKillSwitches(): OpsKillSwitches {
  const local = readLocalOverride();
  return {
    adsOff: envFlag('VITE_OPS_ADS_OFF') || !!local.adsOff,
    imagesOff: envFlag('VITE_OPS_IMAGES_OFF') || !!local.imagesOff,
    forceFreeModel: envFlag('VITE_OPS_FORCE_FREE_MODEL') || !!local.forceFreeModel,
    pauseSignups: envFlag('VITE_OPS_PAUSE_SIGNUPS') || !!local.pauseSignups,
    continuityStrict: envFlag('VITE_OPS_CONTINUITY_STRICT') || local.continuityStrict !== false,
  };
}

/** Staff/dev drill only — does not clear env flags. */
export function setOpsKillSwitchOverride(partial: Partial<OpsKillSwitches>): OpsKillSwitches {
  const next = { ...readLocalOverride(), ...partial };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return getOpsKillSwitches();
}

export function clearOpsKillSwitchOverrides(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function adsKilled(): boolean {
  return getOpsKillSwitches().adsOff;
}

export function imagesKilled(): boolean {
  return getOpsKillSwitches().imagesOff;
}

export function forceFreeModel(): boolean {
  return getOpsKillSwitches().forceFreeModel;
}

export function signupsPaused(): boolean {
  return getOpsKillSwitches().pauseSignups;
}

export function continuityStrict(): boolean {
  return getOpsKillSwitches().continuityStrict;
}
