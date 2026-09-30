Order 29z5. Wire the prose-thumb rubric below into the tester so it is the contract no matter which model marks the turns (SGM_THUMBS_MODEL can change; the rubric must not).

Do not change game prose. Do not run a playtest. Do not call the judge API. Do not test PYOA. Tabletop, RPG and LitRPG only if you touch mode names.

The rubric (this is the standard, not a checklist every beat must tick):
The vote is "would I teach the next turn from this beat?", not "did I enjoy the plot."
Up: no prose crime, plus one thing worth copying (a sharp physical detail, a real cost, an NPC with a spine, or a short honest empty). Pretty-and-empty is not an up.
Down: one prose crime is enough. Crimes: welcome or destiny or "here is the narrative"; an invented name, "someone here", or leftover smash; the same smell or light essay as last turn; a look/speak/move checklist; raw markup or an instruction leak; the wrong mode voice; talking as a slot label or a dead last kill.
Do not down a fair fail, a short honest empty, or a dice result you dislike. Code owns those.
Not every check applies every turn. A physical first line matters on openings and scene changes; a reply can start with speech. One new concrete thing applies every turn, and "searched and found nothing" counts when it is short and honest. Only-named-people matters only when someone is in the scene. Mode voice is easiest on a hit, a refusal, or a locked door; a plain walk can be unmarked. Ending pressure matters when the player needs a next move; a combat result or a short honest empty can just stop.
Unmarked: fine but not a teacher. Most turns should be unmarked. Do not force a thumb.
A comment names one concrete thing: the crime, or the thing worth copying.

Wiring:
- Put that rubric in one place the notes pass always sends, so swapping the model does not swap the standard.
- A new place, XP, a fight, or loot must stay in the progress section. They must not become a prose thumbs-up.
- If the model returns no mark for a turn, that turn stays unmarked. Do not fill it with the local progress thumb.
- The status line must say how many turns the model actually marked. A run where most turns were never marked is not ok.

Keep the existing local P0 checks (broken wording, ignored action) as their own flags. Do not delete them. They are not a substitute for this rubric.

Add or adjust a small test that the notes prompt contains this standard and that a reply which marks only one turn does not count as a full ok and does not invent thumbs for the rest. No API call. Leave the known tsc and vitest baselines alone apart from that test. Commit and push if those checks stay at the current baseline. Write docs/orders/SUMMARY-29z5.md with what changed and the commit. Stop after one fix if a check fails twice.
