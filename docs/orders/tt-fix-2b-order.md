# tt-fix-2 finish order (John decided 14 Oct, 9:28 AM)
1. Read docs/orders/tt-fix-2.md. Its work is in the tree, uncommitted.
2. openingCardCompile: apply the proposed fix in placeNames.ts:137. The indoor-hub room rule shortens only when the description does not name the place again in a trailing clause.
3. questFalsePay "a long objective is labelled whole": find out why no quest-step XP was paid in the full run (probably test-order state leakage). Fix it only if the cause is clear. Otherwise mark it as flaky with a note in the test and in the report.
4. Run the full vitest in the shell and pass back only failures. Do at most ONE fix run. If the same failure repeats, or on any login or usage error, write TT_STOP. Do not retry. The bar is: no worse than 75 failures plus the known flakes (seed94InfestationClear, playtest29uTravelGap, playtest30iFogOfWar, playtest27aRepair1, plus questFalsePay if marked flaky).
5. If clean, ship as 2026-10-14g. Commit only tt-fix-2 files and this fix, not humanJudge.mjs or other unrelated edits. Push. Run the edge sync, then npx supabase functions deploy gm-turn. Poll https://www.synapticgm.com/version.json until it shows 2026-10-14g.
6. No laps. Append "## Finish (9:28)" to docs/orders/tt-fix-2.md covering the cause, the fix, the tests, the commit, the deploy, and the stamp. The last line is exactly TT_DONE or TT_STOP.
