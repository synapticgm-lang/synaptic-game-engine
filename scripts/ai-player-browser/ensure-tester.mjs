/**
 * Create (or confirm) the dedicated AI-player Auth user.
 * Password is written only to .env.local. Never printed.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in the environment or .env.local
 * (not VITE_ — never ship this to the client).
 */
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { loadProjectEnv, upsertEnvLocal } from './loadEnv.mjs';

const EMAIL = 'ai-player@synapticgm.com';

function randomPassword() {
  return `Aip1-${crypto.randomBytes(18).toString('base64url')}`;
}

loadProjectEnv();

const email = (process.env.AI_PLAYER_EMAIL || EMAIL).trim().toLowerCase();
let password = process.env.AI_PLAYER_PASSWORD || '';
if (!password) {
  password = randomPassword();
}

const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, '');
const service = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || '';

upsertEnvLocal({
  VITE_ENABLE_FOUNDER_EMAIL_LOGIN: 'true',
  VITE_FOUNDER_LOGIN_EMAILS: email,
  AI_PLAYER_EMAIL: email,
  AI_PLAYER_PASSWORD: password,
  AI_PLAYER_HOST: process.env.AI_PLAYER_HOST || 'http://127.0.0.1:5173',
  AI_PLAYER_CDP: process.env.AI_PLAYER_CDP || 'http://127.0.0.1:9222',
});

if (!url || !service) {
  console.log(JSON.stringify({
    ok: false,
    blocked: 'missing_service_role',
    email,
    passwordWritten: true,
    dashboard: [
      'Supabase Dashboard → project synapticgm (wzgsrpwhmgffcyohvtko)',
      'Authentication → Providers → Email: enable Email. Invite-only is OK if you create the user as Admin.',
      'Authentication → Users → Add user',
      `Email: ${email}`,
      'Auto Confirm User: ON',
      'Password: the value already written to .env.local as AI_PLAYER_PASSWORD (do not paste it into git/chat)',
      'Table Editor → profiles → that user → play_access = tester (default on new rows)',
      'Optional: copy service_role into .env.local as SUPABASE_SERVICE_ROLE_KEY and re-run this script',
    ],
  }, null, 2));
  process.exit(2);
}

const admin = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: existingProf } = await admin
  .from('profiles')
  .select('id')
  .eq('email', email)
  .maybeSingle();

let userId = existingProf?.id || null;
let created = false;

if (!userId) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { provider: 'email', providers: ['email'], play_role: 'tester' },
    user_metadata: { full_name: 'AI Player' },
  });
  if (error) {
    console.log(JSON.stringify({ ok: false, blocked: 'create_user_failed', message: error.message }));
    process.exit(1);
  }
  userId = data.user?.id || null;
  created = true;
} else {
  const { error } = await admin.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
  });
  if (error) {
    console.log(JSON.stringify({ ok: false, blocked: 'update_password_failed', message: error.message }));
    process.exit(1);
  }
}

if (!userId) {
  console.log(JSON.stringify({ ok: false, blocked: 'no_user_id' }));
  process.exit(1);
}

const { error: profErr } = await admin
  .from('profiles')
  .update({ play_access: 'tester', email })
  .eq('id', userId);

console.log(JSON.stringify({
  ok: true,
  email,
  userId,
  created,
  passwordWritten: true,
  playAccess: profErr ? `profile_update_failed:${profErr.message}` : 'tester',
}, null, 2));
