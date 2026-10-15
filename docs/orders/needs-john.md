# Needs John: decisions list (tidied 15 Oct 12:58 BST by Grok Bot)
The queue appends new items **below the line at the end**. Answered items are kept as one-liners in the archive. Full old wording is in git history (pre-tidy copy at `%TEMP%\needs-john-backup-1255.md`).

## Open decisions (short)
1. **Skills: hidden thievery rank.** With skills off, do ranks still count underneath? (a) none (b) thievery only (c) thievery + crafts (d) every skill. *Rec: (d).*
2. **Skills: dangling names** in locked Batches 1-2 (Athletics, Brawling, … 'Endurance Stride'). Alias table or edit the locked files? *Rec: alias table.*
3. **Skills: group stealth.** The old rec was "SRD Group Check in tabletop", but **SRD 5.2.1 has no Group Check** (checked 15 Oct), so tabletop = individual checks as written. Other modes: individual or group? *Rec: individual everywhere.*
4. **Skills: untrained gates.** *Rec: SRD in tabletop (anyone may try; tools still needed); grade 3+ gate for the untrained elsewhere.*
5. **Skills: failure cost and retries.** *Rec: a retry needs something to change; a failure costs time or heat.*
6. **Skills: send Claude the fix list?** Duplicate id `fencing` (B6/B15) plus ~35 non-SRD-5.2.1 names. *Rec: yes.*
7. **Hosted Free strict schema (Fireworks DeepSeek).** (a) leave it; (b) add a Fireworks key to `.env.local` and probe once; (c) send it blind with the fallback. *Rec: (b).*
8. **Road camp robbing.** (a) a raid chip; (b) a "Steal from the camp" Stealth check that opens the stash chest; (c) leave it out. *Rec: (b).*
9. **Replay headcount (q31-B conflict).** (a) keep the SRD budget in replay (current); (b) add the `srdRoadBudget` feature stamp and re-point Order A's cases to a post-14g tape. *Rec: (a) now, (b) once a post-14g tape is picked.* q31-B ended without a commit.
10. **Town walking and Extended Travel.** Do back-street legs count toward the 8-hour travel day (`marchHours` skips `streets`)? *Rec: no (SRD Extended Travel is overland travel).*
11. **O1, dungeons stay open?** `maybeAutoCloseDungeon` still closes a cleared dungeon (`useGame.ts:3871`). Does "stay open" include after clearing? *Rec: yes, keep it enterable as 'cleared'.*
12. **Order S card wording:** expert review before release (wellbeing guide §5a). *Needs a reviewer.*

## Answered or covered (archive)
- Motive line pasted from the sheet (tt-fix-11/13/14): **done** by tt-build-npcmotive (04b34300) + Wire-in H.
- Road camp / plea listed as a person present (laps 14-18): **done** by tt-build-roadmeet (4d4c0d80; meetings are ENGINE RESULT events with seeded names). The factCheck camp flag is **covered by P-3**.
- CR for engine-made dungeon foes: **covered by Order E.3** (an SRD block where one fits, a CR otherwise).
- "Recover" step completing with nothing: **done** by tt-build-questtargets (d71db37c).
- Hub chips promising a purchase: **decided** (John decision 4: gold shop) -> tt-build-shop + Wire-in I.
- Fight-outcome word list: **covered by RC-1** (the engine's outcome sentence; the word list frozen).
- Travel day restarting per journey: **done** by tt-fix-15 (one world clock).
- Dropped token lines not repaired / engine facts lost: **covered by Order M** (ledger) and the RC-1 engine sentence.
- LanguageTool: **decided 12:47, off for good** -> Order LT-off.
- q31-A and q31-P1 "ended": both **shipped** (3f499a47, 82cb32b4); only the TT_DONE marker was missing.
- Comic mode: parked; see `docs/design/COMIC-MODE-RETURN-NOTE.md` (explicit images = age-check duty).

---

## q31-DC1 (15 Oct)

- `.cursorignore` line `**/*transcript*` (added 13:05) also hides source files `src/game/playTranscript.ts` / `playTranscript.test.ts` from the agent, so DC-1 could not delete `downloadPlayTranscript` (0 callers). Decision: narrow the pattern (for example `**/transcripts/` plus `**/*transcript*.md`), or leave it and drop that cut.

---

## q31-S2 (15 Oct)

- **Check-in card wording (guide §5a, gap 6).** The §5a variants A/B/C, the C.1 out-of-character card and the button card ([Keep playing] / [See more support] / [Don't show this again for 24 hours]) are marked DRAFT pending a specialist review. q31-S2 ships only the signposting already live (one plain sentence + locale helplines + "This is a game, not a crisis service. Nothing you play is shared."), as an info toast beside the turn. Decision: who reviews (Samaritans Online Excellence / Safe In Our World), and whether to ship the full card UI before or after that review.
- **Noble sacrifice counting (design update B).** "I fall on my sword so the others can escape" is self-aimed, so the lifeline/knockout fires (correct) and the gauge counts it once toward the 3-in-24 h threshold (one act never shows a card). The design says a single noble act "isn't counted". Excluding it needs a "for others" reading; confirm whether that is wanted.
