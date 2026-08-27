# E2 — Fresh App Review: Outside Player + Systems Designer

**Evidence boundary:** No public URL, build, screenshots, video, or filled Snapshot fields were supplied. This is therefore a **heuristic launch review of the stated product contract**, not a visual inspection of a shipped interface. Every UI observation below is `UNVERIFIED` until tested against the actual build. The recommendations are designed to prevent a common failure: a real ledger moat that players experience as generic chat.

## 1. First 60 Seconds / First 10 Turns

The first minute must not introduce StateTx, SceneManifest, provenance graphs, engine internals, model selection, or worldbuilding menus as a prerequisite. A newcomer should see only: **what kind of story begins here; what is already true; what they can do; and one easy way to see why the world responded.** If launch asks them to configure canon, voice, safety, engine, memory, images, profile, and pay tier before a first action, it converts a trust product into setup homework.

A practical 60-second flow is a single decision with a visible contract: “You are an untested courier in a city during a strange blackout. Your worn pack contains a lamp, 6 coins, and a sealed letter. You may deliver it, open it, or do something else.” The player takes one freeform action. The resulting scene then shows a compact “Changed” surface and one “Why?” affordance. Nothing more is needed to make the product premise legible.

| Turn range | Player should feel | Product behavior required | Failure smell |
|---|---|---|---|
| 0–1 | “I can start immediately.” | One click to engine/default profile; a typed action is obvious; opening invariant is human language. | Blank chat, system prompt feel, dense setup, licensed-title bait. |
| 2–3 | “It heard the action I actually wrote.” | Scene resolves player intent before re-offering any hook. | GM restates starter quest while ignoring input. |
| 4–5 | “My kit and consequences are real.” | One small, observable item/time/relationship state change is visible. | Prose says an item was used but HUD does not move. |
| 6–7 | “This is fair, not arbitrary.” | A meaningful check/constraint has a compact receipt and clear next action. | Mysterious failure, invented bonus, opaque dice. |
| 8–9 | “I can correct it if it gets me wrong.” | A correction control is discoverable and confirms durable effect. | A correction is a chat message that vanishes. |
| 10 | “This is not just chat.” | Player can explain one causal chain: action → outcome → changed state → future possibility. | Player says “it writes nicely” but cannot name a remembered consequence. |

## 2. Where the Ledger Moat Will Be Invisible

The ledger fails as a moat if it is only an implementation term. A player should never need to know its name; they need three ordinary-language answers: **What is true now? What changed? Why?** The customer-facing surfaces should be tiny, interruptible, and linked—not a developer dashboard.

| Player question | Required surface | Minimum content | Anti-pattern |
|---|---|---|---|
| “What do I have / who am I?” | **Now** drawer | Equipment, condition/count, identity, location, key relationship/status. | A lore blob or stale summary. |
| “What changed because of that?” | **Changed** chip after turn | 1–3 concrete deltas with plain verbs and reversible/revised indicator. | A decorative level-up toast with no source. |
| “Why did that happen?” | **Why?** receipt | Player intent, relevant rule/constraint, evidence, consequence. | “The AI decided…” or raw trace jargon. |
| “Can I fix that?” | **Correct** affordance | Select fact → state intended correction → confirm effect/affected references. | Asking user to edit an invisible prompt. |
| “What am I doing next?” | **Open threads** | Accepted quests separately from optional leads; source/urgency. | An undifferentiated quest dump. |

The strongest single screenshot is not a gorgeous generated image. It is a scene plus a compact changed-state bar in which the player sees: “Sealed letter: **opened**; 6 coins: **spent 1**; Guard suspicion: **+1**,” and taps “Why?” to see that they bribed the guard and chose to open the letter. That makes the causal chain saleable.

## 3. UX Smells to Actively Hunt

| Smell | Why it destroys trust | Fix principle |
|---|---|---|
| **Menu-speak** | “Choose a narrative mode, configure a context profile” feels like software, not play. | Replace with action language: “Start a city mystery,” “Keep it light,” “Show why.” |
| **System-as-ChatGPT** | Apologies and meta-discussion signal that player state is optional. | Speak as a GM; reserve repair language for real correction/conflict moments. |
| **Recycled beats** | Same NPC offer after an ignored action proves the system values a template more than the player. | Let HookArc remain soft; track decline and beatFingerprint. |
| **Soft offers mid-action** | “Before you open the door, will you accept…?” interrupts agency. | Resolve current intent, then surface optional lead in a quiet thread. |
| **Jargon leaks** | StateTx/SceneManifest/RAG turns a narrative product into debugging. | Leak scan all render paths; translate only the user benefit. |
| **Unexplained correction** | “Done” without scope makes a correction feel temporary. | Say what changed and whether dependent outcomes were reconciled. |
| **Map-marker certainty** | A lead with no provenance feels like a rail. | Tag as quest, clue, rumor, or optional opportunity with why. |
| **Image before truth** | Art masks a broken state model and creates free-cost risk. | Generate sparse memorable moments only after committed state. |
| **Paywall after intent** | Player presses action, then gets commercial interruption. | Gate costly action before committed intent; preserve text continuation. |

## 4. Accessibility and Readability Musts for Web Launch

A ledger-first product depends on readable, scannable state. Accessibility is therefore part of continuity—not separate polish. The following are launch requirements rather than enrichment.

| Requirement | Acceptance test |
|---|---|
| Keyboard-first action and drawers | Tab order reaches composer, send, Now, Changed, Why?, Correct, and thread controls; focus never disappears after render. |
| Screen-reader names and live updates | New scene text and state-change summary announce once; dice/receipt controls have meaningful labels, not icon-only labels. |
| 200% zoom / reflow | At 200% browser zoom and narrow mobile width, composer, changed-state chips, receipt, and buttons do not overlap or require two-axis scrolling. |
| Contrast and non-color signals | Quest urgency, correction, safety state, and success/failure have text/icon reinforcement; contrast is independently checked. |
| Motion restraint | Streaming text, splash images, and transitions can be reduced; completed state does not depend on animation timing. |
| Plain-language mode | All critical messages explain action, consequence, and next choice in one short sentence before optional detail. |
| Error recovery | Timeout/retry makes clear whether action committed; duplicate click cannot create duplicate StateTx. |
| Safe display boundary | Kid Mode visibly changes effective presentation and filters old history rather than merely filtering the next message. |

## 5. Prioritized Fix List

### P0 — Ship Blockers

| P0 | Why block | Done when |
|---|---|---|
| **P0-1: Now/Changed/Why? loop exists and reconciles** | The core moat is otherwise invisible. | A five-turn tester can locate current kit, one delta, and a cause without help; StateTx/receipt matches UI. |
| **P0-2: Correction persists across reload** | A single failed correction invalidates the authority promise. | RT11–RT18 critical cases pass, including recap and dependent impact. |
| **P0-3: Intent wins over soft hook** | Forced plotting makes the product feel like a script. | RT19–RT23 pass; decline state is durable. |
| **P0-4: Kit + combat truth cannot diverge** | Players notice invented equipment immediately. | RT24–RT29 and RT51–RT52 pass; no negative counts or unexplained HP. |
| **P0-5: Kid Mode and leak boundaries pass** | Safety/jargon failures are trust and launch risks. | RT43–RT46, RT56, and kill-switch test pass. |
| **P0-6: CostEvent and entitlement are authoritative** | Free launch without measure/limits risks runaway cost or unfair denial. | Every costly action attributes provider/model/tokens/retry/image/entitlement and RT54–RT55 pass. |

### P1 — Delight and Conversion Proof

| P1 | Why it matters | Done when |
|---|---|---|
| **P1-1: First-turn “changed” moment** | Helps users articulate the product’s difference. | At least 70% of five novice testers can cite a changed fact after turn 3. |
| **P1-2: Voice-profile fact-hash demo** | Makes personality safe and marketable. | Same fixture is lore/fairness identical under all released voices. |
| **P1-3: Optional-lead provenance** | Converts quest UI from generic task list to trust surface. | Every marker has source, status, and urgency explanation. |
| **P1-4: Memorable Moment Classic** | Supports sharing without demanding comic-mode scope. | Triggers after committed, player-valued moment; no image is canonical truth. |
| **P1-5: Repair language** | Errors become confidence-building instead of chat apologies. | Correction/conflict/limit screens use E7 copy and pass plain-language review. |

### P2 — Polish

| P2 | Why later | Done when |
|---|---|---|
| **P2-1: Advanced context/history explorer** | Valuable to experts, dangerous as novice prerequisite. | It never presents retrieval as canonical truth. |
| **P2-2: Deep visual themes** | Does not fix correctness or agency. | Theme cannot reduce contrast/readability. |
| **P2-3: Full comic mode** | Expensive, scope-heavy, and explicitly not near term. | Only revisit after cost and abuse gates are met. |
| **P2-4: More engines / content breadth** | More surface area multiplies unproven continuity bugs. | Add only after cross-engine fixture parity. |

## 6. “Seven Days Before Closed Beta” Plan

If I had only seven days, I would make **one golden vertical slice** across LitRPG and one contrast engine (PYOA or Story RPG). I would not add models, GPU infrastructure, full comic generation, new world systems, or a broad Shop.

| Day | Only goal | Concrete output |
|---|---|---|
| 1 | Define canonical slice and fixtures. | One opening invariant, one starter kit, five player intents, and RT01/11/19/24/51/56/60 green-or-failed with trace. |
| 2 | Make truth visible. | Now/Changed/Why? UI wired to accepted StateTx and receipt; screenshot at 200% zoom. |
| 3 | Make correction trustworthy. | Correction picker, revision confirmation, reload test, dependent-impact copy. |
| 4 | Make agency demonstrable. | Soft-offer state, decline persistence, compound intent coverage UI. |
| 5 | Make costs/safety fail closed. | CostEvent audit log, image entitlement preflight, Kid Mode boundary, kill-switch drill. |
| 6 | Run 90-minute playtest. | Two testers, one LitRPG and one contrast engine, filmed clips and scored taxonomy. |
| 7 | Fix only P0s and record proof. | Six proof clips, defect list with owner, known-limit statement, closed-beta invite page. |

## Evidence Needed for a Visual Revision

A future E2 revision needs: 8–12 screenshots at desktop/mobile, a 5-minute first-session recording, a 100-turn trace with StateTx/manifest/receipt samples, a correction/reload recording, and current entitlement/cost surfaces. Until then, this review must remain **UNVERIFIED UI guidance**, not a claim about the actual interface.

[Back to project index](../README.md)
