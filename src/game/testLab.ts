/**
 * Test Lab — founder / QA unlock.
 * Tester cohort — signed-in Google players who are not founders.
 *
 * Testers (silent playtest):
 * - Unlimited text turns
 * - Hosted Free writer only
 * - No comic / memorable / portrait / item-icon generation
 * - No Test Lab UI (they should not know they are in a special cohort)
 *
 * Founder Test Lab (Settings → Test Lab, VITE_TEST_ACCOUNT_EMAILS, or DEV + toggle):
 * - Unlimited text + art
 * - Switchable Free / Mid / High
 *
 * Mark a founder account: Settings → Test Lab, or VITE_TEST_ACCOUNT_EMAILS.
 */

import type { SubscriptionTierId } from './subscriptionTiers';

export type HostedAiTier = 'free' | 'mid' | 'high';

/** Server role from profiles.play_access (Admin Users dropdown). */
export type PlayAccess = 'tester' | 'player' | 'staff' | 'admin';

export interface TestLabConfig {
  enabled: boolean;
  /** Hosted AI quality to exercise (writer + Flux tier map). */
  aiPreviewTier: HostedAiTier;
  /** Emails marked as test accounts on this device. */
  markedEmails: string[];
}

export interface PlayAccountContext {
  signedIn: boolean;
  email: string | null;
  userId: string | null;
}

const STORAGE_KEY = 'synapticgm-test-lab';

const DEFAULT: TestLabConfig = {
  enabled: false,
  aiPreviewTier: 'free',
  markedEmails: [],
};

const EMPTY_ACCOUNT: PlayAccountContext = {
  signedIn: false,
  email: null,
  userId: null,
};

let playAccount: PlayAccountContext = { ...EMPTY_ACCOUNT };
let serverPlayAccess: PlayAccess | null = null;

function envEmailAllowlist(): string[] {
  const raw = (import.meta.env.VITE_TEST_ACCOUNT_EMAILS as string | undefined) ?? '';
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeEmail(email?: string | null): string | null {
  const e = email?.trim().toLowerCase();
  return e || null;
}

export function loadTestLab(): TestLabConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT, markedEmails: [] };
    const parsed = JSON.parse(raw) as Partial<TestLabConfig>;
    const tier = parsed.aiPreviewTier;
    return {
      enabled: !!parsed.enabled,
      aiPreviewTier: tier === 'mid' || tier === 'high' || tier === 'free' ? tier : 'free',
      markedEmails: Array.isArray(parsed.markedEmails)
        ? parsed.markedEmails.map((e) => String(e).toLowerCase()).filter(Boolean)
        : [],
    };
  } catch {
    return { ...DEFAULT, markedEmails: [] };
  }
}

export function saveTestLab(config: TestLabConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/**
 * Process-local override for headless Fate autoplay / QA scripts.
 * Does NOT write localStorage and does NOT affect normal players.
 * Cleared when the Node process exits (or via disableAutoplayTestLab).
 */
let autoplayUnlimitedSession = false;
let autoplayAiTier: HostedAiTier = 'free';

/** Enable unlimited capacity for this process only (scripts/fate-autoplay). */
export function enableAutoplayTestLab(aiTier: HostedAiTier = 'free'): void {
  autoplayUnlimitedSession = true;
  autoplayAiTier = aiTier === 'mid' || aiTier === 'high' ? aiTier : 'free';
}

export function disableAutoplayTestLab(): void {
  autoplayUnlimitedSession = false;
  autoplayAiTier = 'free';
}

export function isAutoplayTestLabSession(): boolean {
  return autoplayUnlimitedSession;
}

export function setPlayAccountContext(next: PlayAccountContext | null): void {
  playAccount = next
    ? {
        signedIn: !!next.signedIn,
        email: normalizeEmail(next.email),
        userId: next.userId?.trim() || null,
      }
    : { ...EMPTY_ACCOUNT };
  if (!next) serverPlayAccess = null;
}

export function setServerPlayAccess(access: PlayAccess | string | null | undefined): void {
  const v = String(access ?? '').trim().toLowerCase();
  if (v === 'tester' || v === 'player' || v === 'staff' || v === 'admin') {
    serverPlayAccess = v;
    return;
  }
  serverPlayAccess = null;
}

export function getServerPlayAccess(): PlayAccess | null {
  return serverPlayAccess;
}

export function parsePlayAccess(raw: unknown): PlayAccess | null {
  const v = String(raw ?? '').trim().toLowerCase();
  if (v === 'tester' || v === 'player' || v === 'staff' || v === 'admin') return v;
  return null;
}

export function getPlayAccountContext(): PlayAccountContext {
  return { ...playAccount };
}

/** @internal vitest */
export function __resetPlayAccountForTests(): void {
  playAccount = { ...EMPTY_ACCOUNT };
  serverPlayAccess = null;
}

export function isTestLabEnabled(): boolean {
  if (autoplayUnlimitedSession) return true;
  return loadTestLab().enabled;
}

export function getTestLabAiTier(): HostedAiTier {
  if (autoplayUnlimitedSession) return autoplayAiTier;
  return loadTestLab().aiPreviewTier;
}

export function setTestLabEnabled(enabled: boolean): TestLabConfig {
  const next = { ...loadTestLab(), enabled };
  saveTestLab(next);
  return next;
}

export function setTestLabAiTier(tier: HostedAiTier): TestLabConfig {
  const next = { ...loadTestLab(), aiPreviewTier: tier };
  saveTestLab(next);
  return next;
}

export function markTestAccountEmail(email?: string | null): TestLabConfig {
  const e = normalizeEmail(email);
  const cur = loadTestLab();
  if (!e) return cur;
  if (cur.markedEmails.includes(e)) return cur;
  const next = { ...cur, markedEmails: [...cur.markedEmails, e] };
  saveTestLab(next);
  return next;
}

export function isEmailTestAccount(email?: string | null): boolean {
  const e = normalizeEmail(email);
  if (!e) return false;
  if (envEmailAllowlist().includes(e)) return true;
  return loadTestLab().markedEmails.includes(e);
}

function isEnvFounderEmail(email?: string | null): boolean {
  const e = normalizeEmail(email);
  if (!e) return false;
  return envEmailAllowlist().includes(e);
}

/**
 * Founder play account — production uses VITE_TEST_ACCOUNT_EMAILS only.
 * Device `markedEmails` is ignored in prod so testers cannot self-promote
 * via localStorage. DEV still honors the Test Lab toggle.
 */
export function isFounderPlayAccount(email?: string | null): boolean {
  if (autoplayUnlimitedSession) return true;
  if (serverPlayAccess === 'staff' || serverPlayAccess === 'admin') return true;
  const resolved = normalizeEmail(email) ?? playAccount.email;
  if (isEnvFounderEmail(resolved)) return true;
  // DEV only: Settings → Test Lab marks the signed-in email. `enabled` alone is not enough.
  if (import.meta.env.DEV && loadTestLab().enabled && isEmailTestAccount(resolved)) return true;
  return false;
}

/**
 * Signed-in Google player in the silent tester cohort.
 * Server play_access wins when present; otherwise unmarked Google users are testers.
 */
export function isTesterCohort(): boolean {
  if (autoplayUnlimitedSession) return false;
  if (!playAccount.signedIn) return false;
  if (serverPlayAccess === 'tester') return true;
  if (serverPlayAccess === 'player' || serverPlayAccess === 'staff' || serverPlayAccess === 'admin') {
    return false;
  }
  return !isFounderPlayAccount();
}

/** Unlimited text turns (testers + founder Test Lab + autoplay). */
export function hasUnlimitedTextCapacity(): boolean {
  if (autoplayUnlimitedSession) return true;
  if (isTesterCohort()) return true;
  if (isFounderPlayAccount()) return true;
  return isTestLabEnabled() && isFounderPlayAccount();
}

/**
 * Hosted images / comic / memorable / portraits may be requested.
 * Testers are hard-off. Everyone else follows the normal ledger / Test Lab.
 */
export function hostedImagesAllowed(): boolean {
  if (autoplayUnlimitedSession) return true;
  return !isTesterCohort();
}

/** Founder Test Lab / autoplay: image spend is a no-op. Testers never qualify. */
export function hasUnlimitedImageCapacity(): boolean {
  if (autoplayUnlimitedSession) return true;
  if (isTesterCohort()) return false;
  if (isFounderPlayAccount()) return true;
  return isTestLabEnabled() && isFounderPlayAccount();
}

/** Show Test Lab controls — never for an unmarked signed-in tester. */
export function canShowTestLabUi(opts: {
  email?: string | null;
  subscriptionTier?: string | null;
}): boolean {
  void opts.subscriptionTier;
  if (import.meta.env.DEV) return true;
  if (import.meta.env.VITE_ENABLE_TEST_LAB === 'true') return true;
  if (serverPlayAccess === 'staff' || serverPlayAccess === 'admin') return true;
  if (isEmailTestAccount(opts.email)) return true;
  return false;
}

/**
 * Effective hosted Free/Mid/High for writer + image catalog.
 * Testers are locked to Free. Founder Test Lab uses the preview tier.
 */
export function effectiveHostedAiTier(
  settingsTier: SubscriptionTierId | string | null | undefined
): HostedAiTier {
  if (autoplayUnlimitedSession) return autoplayAiTier;
  if (isTesterCohort()) return 'free';
  if (isTestLabEnabled() && isFounderPlayAccount()) return getTestLabAiTier();
  if (settingsTier === 'mid' || settingsTier === 'high' || settingsTier === 'free') {
    return settingsTier;
  }
  return 'free';
}

/** Tier id passed to resolveWriterModel / Flux. Testers never leave Free. */
export function effectiveWriterTier(
  settingsTier: SubscriptionTierId | string | null | undefined
): SubscriptionTierId {
  if (autoplayUnlimitedSession) return autoplayAiTier;
  if (isTesterCohort()) return 'free';
  if (isTestLabEnabled() && isFounderPlayAccount()) return getTestLabAiTier();
  if (
    settingsTier === 'mid'
    || settingsTier === 'high'
    || settingsTier === 'free'
    || settingsTier === 'admin'
  ) {
    return settingsTier;
  }
  return 'free';
}
