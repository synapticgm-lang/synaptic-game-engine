# Gemini Pro copy-paste brief — AI-player tester + SP T10 (2026-09-18)

Paste the block below into **Gemini Pro** chat (`google/gemini-2.5-pro`). Do not use Flash. This is a review brief, not a request to write game prose.

---

You are reviewing SynapticGM's watched browser AI-player and the live game pipeline it drives. Answer as a senior narrative-systems critic. Be concrete. Do not re-litigate the locks at the bottom. Do not write code unless a tiny interface sketch is the only way to make a recommendation clear.

## What the tester is

The tester is a **browser AI player**, not a headless writer harness.

- Stack: `scripts/ai-player-browser/` (`run.mjs`, `gameTab.mjs`, `humanJudge.mjs`, `openRouterPlayer.mjs`). **puppeteer-core** attaches to a visible Chrome via CDP `:9222`. Isolated profile only: `chrome-debug-gemini`. Never close John's main Chrome.
- It plays **https://www.synapticgm.com/** **or** localhost Vite (`AI_PLAYER_HOST`, often `http://127.0.0.1:5173`) with hosted **`gm-turn`**. Same React `sendAction` a human hits. **Not** `fateAutoplay.callGm`.
- Account: `ai-player@synapticgm.com` (founder email login, `play_access=tester`). Commands: `npm run ai-player-ensure-tester` · `npm run ai-player-smoke` · `npm run ai-player-t10`.
- Mix **chips + typed text**. Umbra (`umbra-protocol`) is chips-only. Auto Fight if the toolbar button `title="Auto-resolve combat"` is live.
- **Pro is the player so moves stay human.** John: the 18b T10 felt like a set script (six Inspect the panel). That was us, not Pro being “bad at writing.” The old system prompt said **prefer a live chip**, temperature was **0.3**, and the packet said **forget prior turns** — so Pro mashed the only leftover Inspect. We are changing that: chips are optional shortcuts; type a short in-scene line when the bar is junk or a repeat inspect; remember the last actions; temperature ~0.85. Do **not** recommend going back to “prefer chip.”
- Existing thumbs on `GmResponseFeedback` (up/down + comment). Tester notes: nonsense options, future-leak.
- Sidecar per bible: `turns.jsonl` + `transcript.md` under `scripts/ai-player-browser/runs/<stamp>/`.

## Two AIs (do not confuse them)

1. **Player / judge** = OpenRouter **`google/gemini-2.5-pro`**. Flash was a failed cost-cut. Flash is **never** the judge. Quality T10 must stay on Pro.
2. **Game writer** = hosted **Free / DeepSeek-class** via `gm-turn`. Token Prose **14a** asks JSON `{ refs, lines }`. Code paints names/epithets from the ledger. Bind / capital / unbound-animate fail **lines**, not the whole beat. **Stitch / last-resort is fallback, not the novel.** After page 1, success is `callGm` + Token Prose. Empty/timeout/unparseable can still paint a last-resort line so the book is not blank.

## Goal

The **pipeline** must work with any writer: **code owns facts; AI paints the committed beat**. Game prose should be **interesting + simple, not wordy** (about **4–6 short sentences**). The tester plays like a human and thumbs like a fiction reader.

Cheap loop = **one Summoned Pact T10**, then fix + push. **Not** 4×T10 every cycle.

**New harness law (shipping in the tester):** if the game repeats itself after a couple of times — **2 consecutive** same GM story, **or** the tester / hard floor flags **loop / identical / last-resort reprint** on two consecutive beats — the T10 **STOPS**, writes `REVIEW.md` (what repeated, turns, pads, lastGm), leaves Chrome open, and **does not** start another T10. We review before starting again.

## What went wrong (honest tape)

- **Flash rubber-stamped trash** (38 ups). Fake tester ups were wiped (68 deleted).
- First “T10 loop” was a **harness bug**: wait watched `.sgm-prose-face`, so **player chips counted as GM**. The save was still turn 2.
- Then wait-for-GM-only: T2 **Ask what they want**, hosted Free **timeout**, live `callGmDurable` **threw**, so last-resort never painted and there was **no GM row**. **18b:** exhausted timeout/empty/network returns empty `GmResult` like Fate; `bookBodyAfterWriterMiss` always commits a **visible new** GM row — Token Prose on writer success, last-resort on miss that is **not** a reprint of the previous GM / name telegram / room-waited leftover.
- Tester scraped the **SYSTEM plate** as the book. Fixed: `lastGm` = story prose only. Chrome is not the book.
- **18b T10** (`2026-09-18T18-46-33`, host localhost Vite): every turn got a GM bubble, but **T2–T7 mashed Inspect the panel**. Two faults: (1) **pad** — after Jax, 18b hid Want (correct) and also hid Who because the want beat starts with the same CAST “answers you” prefix; cover chips never refill Look around while any leftover pad remains; Inspect the panel never starves. (2) **tester** — prompt said prefer the live chip, so Pro walked that one-chip bar instead of typing like a human. Hosted Free still fails Token Prose, so **last-resort is the book**. Pro downed T2–T10 as loops. T1 name-lock was HERE + spoken want. CAST-phrase glue: `Pellane scouts on one bank and Ash pickets on the other answers you`. T8 typed Wait. T9 Auto-Fight vs West Wall Levy. T10 loot. Also leftover: Vite **localhost vs 127.0.0.1**.

Earlier hosted tapes: `2026-09-18T12-13-11` reprinted the same name-lock paragraph after every action (T2 Ask-want timeout / no new bubble on `16-36-54`). 17i: after Jax lock, last-resort reprinted `The name Jax already stood. The room waited…` for T2–T8.

## Hard rubric already in the tester

MUST vote **DOWN** (code floor + Pro prompt) for:

- telegram / ledger-speak (`They have the name Jax.`, `The room waited.`)
- looping stitch / same paragraph as last GM
- STATUS-only chrome
- wordy essay
- dull filler
- combat resolving inside a talk beat
- already-told reprint

Starve **Who / Want** after the player already logged that topic. Ignore dead chips; **type** if pads are junk. Auto Fight when the button is live.

## Ask you

How do we improve **(1) the tester**, **(2) the pad compiler**, and **(3) the last-resort / writer handoff** so a Summoned Pact T10 gets **varied human play** (typed speech, new verbs — the reason we pay for Pro) and **real Token Prose more often**?

Respect the **stop-after-2-repeats review loop**. Tell us **what to change next vs later**. Prefer owners we already have (`choiceCompiler` / `graphChoices`, `openingEstablishment`, `completedEventPacket` / `bookBodyAfterWriterMiss`, `useGame`, `tokenProse`, `scripts/ai-player-browser/`). Do not invent a second director, a Continuity-Warden LLM, or SNAPSHOT/CRAFT piles.

Give:

1. A short verdict (what is tester-bug vs game-bug vs process).
2. Next batch only — 3 to 6 concrete changes, each with owner + why it helps SP T10.
3. Later / parked — things that can wait.
4. What a passing cheap SP T10 looks like (play variety, thumbs, Token Prose vs last-resort).

## LOCKS — we will not change these. Do not re-argue them.

Last Gemini review (John pasted 2026-09-18) we **agreed** on: Flash is a failed judge; must-DOWN telegram/loop/chrome-only; starve dead Who/Want; name-lock must be HERE + spoken want; chrome is not the book; do not 4×T10 on Flash.

We **disagreed / will not do**:

1. **Not John's fault / not Gemini 1.5.** The process switched the player to **2.5 Flash** after John asked for cheaper automation. Revert judge is **`google/gemini-2.5-pro`**, not 1.5 Pro. Do **not** write “downgrade to 1.5 Flash was John's fault.”
2. **No Mid writer ON by default.** Cost / product lock. Free hosted writer stays. Last-resort must not be blank.
3. **No SNAPSHOT/CRAFT prompt piles.** Path A inversion. More rails made Gemini scores worse (08a stitch-as-writer).
4. **No Continuity-Warden LLM.** Classifier / repairs only (`applyErrorRepairs` / OpeningContract / pad starve).
5. **No stitch / Silent as the success-path book.** After page 1, `callGm` + Token Prose. Stitch is last-resort only and must be a **NEW** line.
6. **Tester stays in the real browser** (`sendAction` / `gm-turn`). Do not replace it with headless `fateAutoplay` as the quality gate.
7. **Do not starve the pad universe down to one Inspect-the-panel chip.** 18b Who/Want starve was correct; leaving a single mashable inspect is worse. After one panel inspect, that chip should die. Keep Look / Wait / travel / talk-to-cast / type.
8. **Do not keep running a T10 through a known loop** to “collect 10 turns.” John: **2 repeats → stop and review.**
9. **Do not grow deny-lists** of pretty words or named NPCs. Ledger / bind only.
10. **WOF / extra PYOA spines stay out of live `src/`.** Umbra is compiled chips-only. Thornferry stays the 12-node AI spine.
11. **Do not close John's main Chrome.** Isolated `chrome-debug-gemini` only.
12. **Do not make the tester write the novel.** It only picks, types, and thumbs.
13. **Do not put back “prefer a live chip.”** That is why Pro felt scripted. The extra cost is for **natural human play** (typed speech, new verbs, leave a dead Inspect). Keep the hard thumbs-down floor.

## Honest leftovers (do not pretend they are closed)

- Last-resort **inspect loops** when Free Token Prose fails.
- **CAST-phrase glue** (`scouts … and … pickets … answers you`).
- Vite **localhost vs 127.0.0.1**.
- Hosted Free still often empty **Token Prose**; last-resort is then the book (must be a new interesting-simple line, not a reprint).

Error-fix classes if you name owners: **A** turn/proxy (`callGmDurable` / empty like Fate); **B** opening contract (name-lock, Who/Want starve); **C** quest coherence; **D** continuity prose (Token Prose / last-resort); **E** chrome/HUD (SYSTEM is not the book); **H** harness/ops (CDP tester). Do not invent a Continuity-Warden LLM path.

End with a one-screen “do this next” list. No essays.
