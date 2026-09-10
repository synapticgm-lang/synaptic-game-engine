# 2026-09-10i — Cathedral name+why telegram

Session `f6733703-2d3b-40f6-abca-495beae25bdb` · device `0d4efcbc-ad46-4ddc-917a-b9ef095b6f68` · HUD `2026-09-10h` · Android Chrome 384×693.

## Thumbs

John: “not getting a response or error.” Screenshot shows T1 who/where answered, then the name+why player bubble, then an idle box. Event log: 0 errors. `recentTurns` already has GM lines for turns 2–4.

## What landed

- T0 page 1 cathedral (Jax already on the System plate). Chips: Ask what they want / Check Status / Wait and watch.
- T1 `Who are you? Where am I?` → stitch place + CAST + **“They have not given you a name back.”** (Jax already locked).
- T2–T4 same typed line: `My name is Jax I dont know of this Sevenfold Circle why have you brought me here?`
- Each send returned **“They have the name Jax.”** in ~40ms (local stitch). T3/T4 player bubbles collapsed as duplicate send. No toast.

## Owners

- `stitchOpeningContinue` treated `my name is` as the whole job. `hallTalkAsksWant` misses `why have you brought me here`. `playerAskedWhyPulled` already matches and was unused.
- `dont know of this` was not `hallTalkAsksWhere`.
- `openingWhoAskLine` always said they have not given a name back.
- `resolveOfferedChoices` left cover-pad lock when Usual Self already locked the name, then padded to 3 (Check Status / Wait).
- `hasRealGmStory` required 24 characters. “They have the name Jax.” is 23, so classic `LogRow` returned null. Resend saw the player bubble as last visible line and wrote the same hidden GM again.

## Not a hang

The send succeeded. The reply was a four-word receipt that looked like no response, especially on resend.
