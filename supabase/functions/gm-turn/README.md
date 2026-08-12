# GM Turn Proxy (Supabase Edge Function)

Assembles system/context prompts server-side and calls the model.
Returns only `{ text }` — never prompts, keys, or pipeline diagnostics.

## Deploy

```bash
# From repo root — keep edge copies in sync with src/game prompt modules
npm run sync:gm-edge

supabase functions deploy gm-turn

# Server-side provider keys (preferred for hosted play; BYOK still supported via request body)
supabase secrets set OPENROUTER_API_KEY=sk-or-v1-...
# optional:
# supabase secrets set GEMINI_API_KEY=AIza...
```

## Client env (Vercel / Vite)

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_REQUIRE_GM_PROXY=true
```

Do **not** set `VITE_OPENROUTER_API_KEY` / `VITE_GEMINI_API_KEY` — those embed secrets in the JS bundle.

Local DIY without the proxy: omit `VITE_REQUIRE_GM_PROXY` and use `npm run dev` (client assembly allowed in DEV only), or set `VITE_ALLOW_CLIENT_GM=true` for a production build that intentionally ships prompts (not recommended).
