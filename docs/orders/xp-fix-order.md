# XP fix order (John approved 14 Oct)
Do the "Cursor fix prompt" section in docs/design/litrpg-xp-review.md, all 8 items. Extra rules:
- Run tests in the shell (npx vitest run, or the project's usual command). Pass back only failures. Do at most ONE fix run after the first test run. If the same failure comes back twice, or nothing improves, write XP_STOP with the failures and do not ship.
- If the tests are clean, ship the usual way: bump the stamp to 2026-10-14a (index.html and public/version.json, as earlier steps did), commit, including docs/design/litrpg-xp-review.md, and push. Deploy the Supabase gm-turn function only if its shared code changed (npm run sync script / supabase functions deploy gm-turn, as earlier steps did). Vercel builds from git.
- On any login or usage-limit error, stop and write XP_STOP. Do not retry.
- Do NOT start mode-gap 5-8 or any test laps or autoplay runs.
- Write docs/orders/xp-fix.md: for each leak (1-8), what changed and the file:line; the test result; the commit hash; the stamp. The last line is XP_DONE or XP_STOP.
