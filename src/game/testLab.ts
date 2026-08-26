/**
 * Test Lab — founder / QA unlock.
 *
 * When enabled on a marked account (or this device):
 * - Capacity is unlimited (text, memorable, illustrated)
 * - Writer + image catalog follow Free / Mid / High (hosted), switchable in Settings
 * - Cosmetics remain fully unlocked via cosmeticEntitlements TEST_UNLOCK_ALL
 *
 * Mark an account: Settings → Test Lab, or VITE_TEST_ACCOUNT_EMAILS.
 */

import type { SubscriptionTierId } from './subscriptionTiers';

export type HostedAiTier = 'free' | 'mid' | 'high';

export interface TestLabConfig {
  enabled: boolean;
  /** Hosted AI quality to exercise (writer + Flux tier map). */
  aiPreviewTier: HostedAiTier;
  /** Emails marked as test accounts on this device. */
  markedEmails: string[];
}

const STORAGE_KEY = 'synapticgm-test-lab';

const DEFAULT: TestLabConfig = {
  enabled: false,
  aiPreviewTier: 'free',
  markedEmails: [],
};

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

/** Show Test Lab controls (DEV, env flag, already enabled, marked email, or admin tier). */
export function canShowTestLabUi(opts: {
  email?: string | null;
  subscriptionTier?: string | null;
}): boolean {
  if (import.meta.env.DEV) return true;
  if (import.meta.env.VITE_ENABLE_TEST_LAB === 'true') return true;
  if (isTestLabEnabled()) return true;
  if (isEmailTestAccount(opts.email)) return true;
  if (opts.subscriptionTier === 'admin') return true;
  return false;
}

/**
 * Effective hosted Free/Mid/High for writer + image catalog.
 * Test Lab forces the preview tier (never Admin BYOK custom model for this path).
 */
export function effectiveHostedAiTier(
  settingsTier: SubscriptionTierId | string | null | undefined
): HostedAiTier {
  if (isTestLabEnabled()) return getTestLabAiTier();
  if (settingsTier === 'mid' || settingsTier === 'high' || settingsTier === 'free') {
    return settingsTier;
  }
  return 'free';
}

/** Tier id passed to resolveWriterModel / Flux when Test Lab is on. */
export function effectiveWriterTier(
  settingsTier: SubscriptionTierId | string | null | undefined
): SubscriptionTierId {
  if (isTestLabEnabled()) return getTestLabAiTier();
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
