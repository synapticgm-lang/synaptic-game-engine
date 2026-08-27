# V2 — “It Heard Me”: Chat Recognition, Dialogue, and Repair

## Product contract

Conversation must advance normally without a ceremonial acknowledgement after every line. Interaction research describes ordinary dialogue as **progressive** until trouble becomes visible; repair then clarifies misunderstanding or non-understanding. [1] SynapticGM should therefore show the smallest adequate proof: invisible acceptance when the result is self-evident, a compact receipt when a material fact changes, and one narrow question only when two interpretations would produce materially different play.

## Obligation UX

| Player move | Runtime interpretation | Player-visible proof | Ledger effect |
|---|---|---|---|
| **Ask**: “What changed when the gate fell?” | OpenAsk against active StateTx/SceneManifest. | Direct answer first; expandable evidence trail. | None unless the player issues an action or correction. |
| **Refuse**: “No. I will not hand it over.” | Intentional refusal; evaluate NPC/world response. | Fictional response plus an optional short receipt if stakes changed. | Record commitment / relationship / scene pressure when resolved. |
| **Correct**: “No, Mira is at the south watch.” | Authoritative factual correction. | “Mira’s location corrected: south watch.” Highlight affected current claim. | Append correction; supersede lower-tier conflict. |
| **Protest**: “That was not what I said.” | Challenge of interpretation. | Local paraphrase: “You meant to distract, not surrender?” | Hold StateTx until confirmed, or repair a reversible resolved turn. |
| **Joke / insult / flourish** | Speech act with social target and scene relevance. | Character/NPC response calibrated to disposition; no sterile search stub. | Only record if it changes social state or becomes a memorable commitment. |
| **Bargain**: “I will do it for safe passage.” | Conditional proposal. | Counteroffer or explicit acceptance/rejection. | Record conditional obligation only upon acceptance. |
| **Challenge**: “Prove the captain lied.” | Evidence-seeking escalation. | Show what is known, unknown, and actionable. | Add an investigatory hook only when allowed by existing evidence. |

A completed action needs acknowledgement unless its result is plainly visible; implicit confirmation is often better than an explicit “are you sure?” for ordinary parameters. Explicit confirmation is best reserved for high-cost or hard-to-undo actions. [2] [3]

## Repair state machine

```text
INTENT → {clear / ambiguous / unsupported / contradiction / correction}
clear + permitted → resolve → StateTx → receipt if material
ambiguous → locally infer from authority/context → if unresolved, ask one contrastive question
unsupported → in-world boundary → preserve scene → relevant continuation only at a safe beat
contradiction → identify claim/source → request player correction or apply authoritative correction
correction → append correction → recompute affected scene facts → confirm scope
```

The resolver consults the active turn, pinned canon, current StateTx, SceneManifest, and available evidence before asking. It never fills a gap by preferring a summary or retrieved phrase over an explicit correction. Error messages must be plain-language, specific, and constructive; recovery should not force a scene restart. [3]

## Paraphrase and receipt rules

**Paraphrase echo only when:** an intent is ambiguous; a player disputes the interpretation; the action is costly; or a consequence needs to bind a precise commitment. Use the player’s own semantic center, not a stylistic rewrite. Good: “You offer information in exchange for safe passage.” Bad: “I hear that you want to be morally complicated.”

**Receipt chip grammar:** `<verb> <object> <scope> [· source]`. Examples: `Corrected · Mira’s location · south watch`; `Recorded · safe-passage bargain · pending acceptance`; `Changed · dock access · closed`. Clicking source reveals only the relevant StateTx/correction and evidence, not an indiscriminate transcript.

**OpenAsk discharge:** display an `Answered` marker only when the reply includes a direct answer, the answer’s basis, and a next relevant action when one exists. A question that cannot be answered should become `Unknown` or `Not yet observable`, with the reason stated in-world and no invented certainty.

## Anti-recycle policy

| Risk | Guardrail |
|---|---|
| Repeated generic acknowledgement | Suppress acknowledgements without new state or clarification need. |
| Same NPC callback repeated | Store callback fingerprint, payoff type, last-used turn, and reuse budget. |
| Same offer restated | Hash offer intent and scene; after first presentation, surface only changed terms. |
| Long “memory recap” | Convert to short consequence or omit; never use summary text as authority. |
| Every correction creates a scene reset | Recompute only affected downstream facts; preserve unresolved intent and momentum. |

A callback earns reuse only if it changes access, relationship, framing, cost, evidence, or action. It must not exist merely to demonstrate that the system remembers.

## Twelve-line demonstration suite

| # | Player line | Expected vibe outcome |
|---:|---|---|
| 1 | “I ask the guard why her hands are shaking.” | Guard answers in character; no menu prompt; a material clue is labelled as observed or uncertain. |
| 2 | “No, I never promised the baron that.” | Correction receipt; prior claim visibly superseded; scene continues. |
| 3 | “I laugh. ‘That is your threat?’” | Social reaction tailored to target; only records hostility if it actually changes. |
| 4 | “I refuse the oath.” | World respects refusal; stakes and next pressure are clear. |
| 5 | “What did I miss while unconscious?” | Direct time-indexed answer; no state mutation. |
| 6 | “I mean the blue gate, not the river gate.” | One-step parameter correction; current action resumes. |
| 7 | “I offer the map for safe passage.” | Conditional bargain; exact terms shown only if accepted/countered. |
| 8 | “That roll felt impossible.” | Check card explains visible difficulty/modifiers/outcome; it does not fabricate a reroll. |
| 9 | “Can I just talk to the beast?” | The game permits dialogue if plausible, or explains the present constraint in-world. |
| 10 | “I am joking. Do not burn the tavern.” | De-escalates literal action; characters react appropriately to the joke. |
| 11 | “Who knows I took the seal?” | Distinguishes confirmed witnesses, suspicion, and unknowns. |
| 12 | “Stop. Make this less intense.” | Safety/tone control applies at the immediate safe boundary; no mid-action sales prompt. |

**SPECULATIVE:** Confidence thresholds, receipt duration, and which social gestures are durable should be calibrated in playtests. Track correction-to-ledger latency, repeated-failure rate, repair turns, false receipt rate, and “it answered me” ratings.  
**COUNSEL:** Interpretive boundaries for player speech, age-specific content, and controls such as “make this less intense” should be reviewed in safety policy.

## References

[1]: https://pmc.ncbi.nlm.nih.gov/articles/PMC6849777/ "Repair: The Interface Between Interaction and Cognition"
[2]: https://developers.google.com/assistant/conversation-design/confirmations "Google Conversation Design — Confirmations"
[3]: https://www.nngroup.com/articles/ten-usability-heuristics/ "NN/g — 10 Usability Heuristics"
[4]: https://dl.acm.org/doi/fullHtml/10.1145/3640794.3665558 "System and User Strategies to Repair Conversational Breakdowns"
