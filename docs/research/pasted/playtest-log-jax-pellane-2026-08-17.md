# Playtest event log — Jax / Pellane court (2026-08-17)

Source: player export from synapticgm.com (Android Chrome).
Session: `7b4a0a2d-6665-4268-9a2a-c176a297d341`
Exported: 2026-08-17T08:12:01.275Z

## Settings snapshot
- Free tier, adult/pg13, classic + memorable images on
- Perspective: second-person
- No BYOK keys in client

## Confirmed from recentTurns
1. Name-slot leak: `someone nearby` as actor/speaker (turns 3, 14).
2. Almost every talk line triggers a Social check (DC 12); SUCCESS/FAILURE spam in System.
3. Ask ignored / repeat: turn 10 currency ask → turn 11 repeats turn 10 prose + Social FAILURE; turn 12 “awaits Your response” after asking how to prove worth.
4. System jargon: `CODE ENFORCED`, `Action Resolved: Talk`, `Action failed: Social check against Warden's expectation…`, bare `XP: 0/300` / HP dumps.
5. Player turns 2–14 in log ≈ 13 sends → Free 12/day explains out-of-turns (retries may add more).

## Confirmed from eventLog
- `Unresolved or empty action narrative — resolution retry` on talk turns (often empty: true).
- `Refusing System-only turn — no story body` then thin/repeat beats.
- Memorable art: `No OpenRouter API key configured for image generation` / panel failed (hosted Free).
- Telemetry schema drift: missing `public.ai_traffic`, `telemetry_logs.action_target`, `profiles.total_playtime_minutes`.
- Choice regeneration failed (non-blocking).

Full JSON kept in conversation; re-paste if needed for the update batch.
