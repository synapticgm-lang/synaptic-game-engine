/**
 * 2026-09-11a — founder-only email/password login.
 * Public stays Google-only unless the build allowlist is set.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import {
  founderEmailLoginEnabled,
  founderLoginAllowlist,
  isFounderLoginEmail,
  type FounderLoginEnv,
} from './founderLogin';

const ON: FounderLoginEnv = {
  VITE_ENABLE_FOUNDER_EMAIL_LOGIN: 'true',
  VITE_FOUNDER_LOGIN_EMAILS: 'Founder@Example.com, staff@example.com',
};

describe('playtest11a — founder email login', () => {
  it('HUD/BUILD stay on the 11 line, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toMatch(/^2026-09-1/);
    expect(BUILD_STAMP).toMatch(/^2026-09-1/);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('fail-closed when the flag is off', () => {
    const env: FounderLoginEnv = {
      VITE_ENABLE_FOUNDER_EMAIL_LOGIN: 'false',
      VITE_FOUNDER_LOGIN_EMAILS: 'founder@example.com',
    };
    expect(founderEmailLoginEnabled(env)).toBe(false);
    expect(isFounderLoginEmail('founder@example.com', env)).toBe(false);
  });

  it('fail-closed when the flag is missing', () => {
    const env: FounderLoginEnv = {
      VITE_ENABLE_FOUNDER_EMAIL_LOGIN: '',
      VITE_FOUNDER_LOGIN_EMAILS: 'founder@example.com',
    };
    expect(founderEmailLoginEnabled(env)).toBe(false);
    expect(isFounderLoginEmail('founder@example.com', env)).toBe(false);
  });

  it('fail-closed when the allowlist is empty', () => {
    const env: FounderLoginEnv = {
      VITE_ENABLE_FOUNDER_EMAIL_LOGIN: 'true',
      VITE_FOUNDER_LOGIN_EMAILS: '  ,  ',
      VITE_TEST_ACCOUNT_EMAILS: '',
    };
    expect(founderLoginAllowlist(env)).toEqual([]);
    expect(founderEmailLoginEnabled(env)).toBe(false);
    expect(isFounderLoginEmail('anyone@example.com', env)).toBe(false);
  });

  it('flag on with listed email matches case-insensitively', () => {
    expect(founderEmailLoginEnabled(ON)).toBe(true);
    expect(isFounderLoginEmail('founder@example.com', ON)).toBe(true);
    expect(isFounderLoginEmail('  STAFF@EXAMPLE.COM  ', ON)).toBe(true);
    expect(isFounderLoginEmail('other@example.com', ON)).toBe(false);
    expect(isFounderLoginEmail('', ON)).toBe(false);
  });

  it('falls back to VITE_TEST_ACCOUNT_EMAILS when founder list is empty', () => {
    const env: FounderLoginEnv = {
      VITE_ENABLE_FOUNDER_EMAIL_LOGIN: 'true',
      VITE_FOUNDER_LOGIN_EMAILS: '',
      VITE_TEST_ACCOUNT_EMAILS: 'qa@example.com',
    };
    expect(founderEmailLoginEnabled(env)).toBe(true);
    expect(isFounderLoginEmail('qa@example.com', env)).toBe(true);
    expect(isFounderLoginEmail('founder@example.com', env)).toBe(false);
  });
});
