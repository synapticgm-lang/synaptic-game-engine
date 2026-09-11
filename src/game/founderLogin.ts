/**
 * Founder-only email/password login (Cursor / staff).
 * Public builds stay Google-only unless the Vite allowlist is set at build time.
 */

export type FounderLoginEnv = {
  VITE_ENABLE_FOUNDER_EMAIL_LOGIN?: string;
  VITE_FOUNDER_LOGIN_EMAILS?: string;
  VITE_TEST_ACCOUNT_EMAILS?: string;
};

export const FOUNDER_EMAIL_DENIED = 'Email sign-in is not available for this account.';

function envString(key: keyof FounderLoginEnv, override?: FounderLoginEnv): string {
  if (override && Object.prototype.hasOwnProperty.call(override, key)) {
    return String(override[key] ?? '');
  }
  const raw = (import.meta.env as Record<string, string | undefined>)[key];
  return typeof raw === 'string' ? raw : '';
}

function splitEmails(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** Comma-list from VITE_FOUNDER_LOGIN_EMAILS, else VITE_TEST_ACCOUNT_EMAILS. */
export function founderLoginAllowlist(env?: FounderLoginEnv): string[] {
  const founder = splitEmails(envString('VITE_FOUNDER_LOGIN_EMAILS', env));
  if (founder.length > 0) return founder;
  return splitEmails(envString('VITE_TEST_ACCOUNT_EMAILS', env));
}

/** True only when the build flag is on and at least one allowlisted email exists. */
export function founderEmailLoginEnabled(env?: FounderLoginEnv): boolean {
  if (envString('VITE_ENABLE_FOUNDER_EMAIL_LOGIN', env) !== 'true') return false;
  return founderLoginAllowlist(env).length > 0;
}

/** Case-insensitive allowlist match. Fail-closed when the flag is off or the list is empty. */
export function isFounderLoginEmail(email?: string | null, env?: FounderLoginEnv): boolean {
  if (!founderEmailLoginEnabled(env)) return false;
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return false;
  return founderLoginAllowlist(env).includes(normalized);
}
