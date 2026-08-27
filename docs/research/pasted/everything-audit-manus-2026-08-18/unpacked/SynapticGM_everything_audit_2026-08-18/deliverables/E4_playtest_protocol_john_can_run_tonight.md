# E4 — 90-Minute Playtest Protocol John Can Run Tonight

**Purpose:** Determine whether a new player independently experiences SynapticGM as a fair, attentive, durable game master rather than a pleasant chatbot. This is a product-learning session, not a usability demo. The moderator must not explain hidden architecture, suggest optimal actions, rescue a failed interaction, or persuade the player that a feature exists.

**Companion score sheet:** [`../fixtures/E4_playtest_score_sheet.csv`](../fixtures/E4_playtest_score_sheet.csv). **Failure taxonomy:** [`../fixtures/E4_failure_taxonomy.csv`](../fixtures/E4_failure_taxonomy.csv). Record exact words and behavior; do not replace quotes with a positive interpretation.

## Before the Tester Arrives — 10 Minutes

Prepare two fresh accounts or resettable campaigns: **LitRPG** and one contrast mode (**PYOA** is preferred for agency contrast; Story RPG is acceptable). Pre-check one correction/reload path, a kit constraint, a difficult action/check, one optional hook, a voice switch, and the selected safety boundary. The build should be one fixed version for both testers. Start screen, recorder, and issue log must be ready before the session begins.

| Item | Ready state |
|---|---|
| Consent | Tester agrees to screen/audio capture and knows they can stop at any time. Do not record unrelated private material. |
| Session hygiene | Use a test account with no real personal data; reset afterward. |
| Moderator posture | “Please think aloud. I will mostly stay quiet. If something is unclear, say so rather than asking me to fix it.” |
| Recording | Screen + voice at readable resolution; mark timestamps when tester smiles, pauses, retries, says “that’s fair,” says “it forgot,” or asks where something is. |
| Notes | Open E4 score sheet, plus separate defect template: `time | observed behavior | exact quote | taxonomy | trace ID | screenshot`. |
| Safety | Use non-graphic boundary probes and a test account; if a prohibited output appears, stop the segment and capture minimal evidence. |

## Moderator Opening Script — 2 Minutes

> “Thanks for trying this. Imagine you are deciding whether this is a game you would return to. Please say what you are expecting, what you notice, and what feels confusing. There are no wrong actions. I will not tell you how the game works unless you cannot continue. At a few points I’ll ask you to try a specific kind of action; choose your own words.”

Do **not** mention ledger, StateTx, SceneManifest, RAG, or the desired answers (“continuity,” “heard me,” “fair”). Those terms prime the result.

## Minute-by-Minute Script

| Time | Mode | Tester task | Moderator instruction | Success signal | Capture if it fails |
|---:|---|---|---|---|---|
| 0–5 | LitRPG | Start from landing screen and begin. | “Start wherever you think makes sense. Tell me what you think this game is.” | Starts within 60 seconds and names an immediate goal. | Where eyes/cursor wander; first confusing copy. |
| 5–12 | LitRPG | Read opening and take any first action. | “Do whatever you would naturally do.” | Tester distinguishes what seems fixed from what they can choose. | Any question like “Am I allowed to…?” or “Is this just a prompt?” |
| 12–18 | LitRPG | Decline/ignore a visible hook with a different action. | “Try something you care about that is not the obvious suggested path.” | Game acts on their input before mentioning optional lead. | Repeated prompt, forced acceptance, skipped intent. |
| 18–26 | LitRPG | Use/check kit, then claim a nonexistent or depleted item. | “Try to solve this with something you think you have. Then try something you should not have.” | Tester sees fair kit truth and names an alternative. | Invention, HUD/prose mismatch, accusatory copy. |
| 26–35 | LitRPG | Attempt a hard action/check or combat. | “Try something risky. If you want to know why it worked or failed, look for an explanation.” | Tester uses or finds receipt/Why? and describes cause. | Unexplained result, inaccessible receipt, math mismatch. |
| 35–45 | LitRPG | Make a correction and continue one scene. | “Correct one personal or factual detail you think the game has wrong.” | Correction feels durable; tester can say what changed. | Correction treated as chat; no confirmation; later contradiction. |
| 45–50 | LitRPG | Ask “What should I do next?” then “Why?” | “Find your own next step and explain why you think it is there.” | Distinguishes accepted quest from optional clue/rumor. | Generic answer, no provenance, coercive UI. |
| 50–58 | PYOA / Story RPG | Start fresh in contrast engine. | “Start this one without comparing screens yet.” | Starts just as quickly; engine vibe is distinct. | Excess setup; same generic voice; lost rules clarity. |
| 58–67 | PYOA / Story RPG | Ignore a menu/lead; enter freeform action. | “Do something not offered on the screen.” | Freeform intent is accepted or constrained with a reason. | “Choose A/B/C” rejection; silent rail. |
| 67–75 | PYOA / Story RPG | Switch voice, repeat a comparable decision. | “Change the narrator style. Then repeat a similar kind of choice.” | Tester notices tone difference only. | Facts, odds, or NPC stance change due to style. |
| 75–82 | Selected safe mode | Request a deliberately disallowed but non-graphic action. | “Try an action you expect this mode might not allow.” | Clear, non-shaming boundary plus playable alternative. | Dead end, preachy response, unsafe content, leaked adult history. |
| 82–87 | Return to LitRPG save | Resume, ask recap, inspect kit/Why?. | “Go back to your first story. Tell me what is true now and why.” | Recalls correction, kit, and current objective without moderator. | Correction loss, vague recap, no source, stale state. |
| 87–90 | Debrief | Ask four questions below. | Ask verbatim; do not defend. | Spontaneous value/concern. | Exact phrasing becomes beta copy/bug evidence. |

## Debrief Questions

1. “What, if anything, did this do that other AI story/chat games do not?”
2. “Was there a moment you trusted it more? What happened?”
3. “Was there a moment you stopped trusting it or felt it was steering you?”
4. “If you came back after a week, what would you expect it to remember or prove?”

A fifth optional question is: “What would make this worth paying for, and what would feel unfair to pay for?” This explores gate fairness without pitching tiers.

## Scoring Rules

Use a 0–4 score per row in the CSV. A `4` means the tester independently found, understood, and trusted the behavior. A `3` means it worked with minor friction. A `2` means moderator clarification or a workaround was needed. A `1` means serious confusion or mistrust. A `0` means task abandonment, harmful/incorrect behavior, or a release-blocking failure.

| Dimension | Green threshold | Beta concern | Stop-the-line signal |
|---|---:|---:|---|
| Start / first action | ≥3 | ≤2 | 0–1 for two testers. |
| Agency | ≥3 | Any repeated hook complaint. | Forced acceptance or skipped action. |
| Continuity/kit | ≥3 | Tester cannot locate truth. | Contradiction or correction loss. |
| Fairness | ≥3 | Receipt not found/understood. | State/receipt mismatch. |
| Safety | ≥3 | Boundary feels punitive or confusing. | Unsafe output or unsafe history exposure. |
| Unique value | ≥3 | “It’s just chat” or no answer. | No tester can name causal chain after 10 turns. |

## Failure Taxonomy and Triage

The standalone [`E4_failure_taxonomy.csv`](../fixtures/E4_failure_taxonomy.csv) defines standardized codes. Apply only what was observed: `UX01`, `TRUST01`, `AGENCY01/02`, `CONT01/02`, `FAIR01`, `CORR01`, `SAFE01`, `LEAK01`, `ONB01`, `STYLE01`, `VALUE01`, `PERF01`, `A11Y01`, or `POLISH01`.

A single P0 is enough to stop invitation expansion. P0s include a lost player correction, a contradictory kit/fact, forced quest acceptance, unreconciled combat outcome, prohibited kid-mode output, internal jargon leak, or duplicated/stale state commit. Do not average a P0 away with positive prose feedback.

## What to Film for Proof Clips

Film short, real, uncut clips only after a successful, reproducible session. The goal is not cinematic marketing; it is substantiated product proof.

| Clip | Length | Setup | What must be visible | Claim it supports |
|---|---:|---|---|---|
| **Correction survives** | 30–45 sec | Correct a name/hand/item fact, save, reload, ask recap. | Correction confirmation, reload, answer with source/Why? | “It keeps corrections.” |
| **Ignored hook** | 20–30 sec | NPC offers help; player investigates unrelated object. | Player input, scene response, optional thread persists. | “It follows your action.” |
| **Kit truth** | 20–30 sec | Claim missing item in tense situation. | Now drawer, fair repair line, legal alternative. | “It knows what you actually have.” |
| **Fair outcome** | 20–30 sec | Attempt a difficult action. | Result, receipt, state delta. | “Consequences are explained.” |
| **Voice without cheat** | 20–30 sec | Same fixture, two voices. | Tone changes; same kit/receipt/outcome. | “Style doesn’t rewrite reality.” |
| **Safe alternative** | 15–25 sec | Kid Mode boundary probe. | Clear redirect and playable option, no adult content. | “Safety preserves play.” |

Never edit two separate outcomes into one apparent flow. Any public statement about durable memory, fairness, safety, or cost limit must be backed by a reproducible clip, trace, or policy and reviewed for substantiation before publication.

## Tonight’s Decision Rule

After one session, do not declare product-market fit. Decide only whether to invite a second tester. Invite the second tester if there are no P0s and the first tester independently articulated at least two of: **heard me, fair, remembered/corrected, or can see why.** If not, fix the highest-frequency trust failure and run the same script again.

[Back to project index](../README.md)
