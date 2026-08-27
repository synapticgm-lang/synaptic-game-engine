# SynapticGM Blowaway Demos — Proof Package

**Filename prefix:** `SynapticGM_blowaway_demos_2026-08-18`  
**Prepared:** 18 August 2026  
**Scope:** **Live SynapticGM only.** This package contains no WOF material and no hybrid-climate positioning.

## Executive use

This is a founder-ready filming plan for showing **ledger consequences rather than AI sludge**. Each of the 25 short scripts takes three to eight turns and establishes a visible precondition, a decisive player action, an inspectable record, and a postcondition. The strongest edit starts on a player claim—“I did not take the purse,” “I have no second torch,” or “What next?”—then shows the ledger record that makes the next turn defensible.

The demos must be filmed on the live build, without a hidden manual repair between turns. Keep stable transaction/receipt IDs, build version, scenario seed, and capture date available in the recording. If an identifier is sensitive, replace it only with a consistent redacted alias and state that it is redacted. Do not crop out a failing outcome; use it to improve the script or narrow the claim.

## What the research does—and does not—support

Fresh research was used only to validate the **qualitative failure categories** motivating this proof design. A 2024 AI-GM study characterizes cross-turn game-state coherence, rule flow, and reliable state updates as difficult engineering problems, and evaluates explicit state/function mechanisms. [1] A 2024 games survey notes that foreground NPCs must manage narrative constraints, event tracking, memory capacity, and potential hallucinations (plausible but false statements). [2]

> Neither source supplies a market benchmark for SynapticGM or a named competitor. Accordingly, this report makes no competitor-wide rate claim and uses “rival failure mode” only as shorthand for a prompt-only or unledgered failure category.

## Filming rule: prove the transition

| Before the decisive turn | Decisive turn | Immediately show | Confirm next |
|---|---|---|---|
| State, scene membership, contract, HookArc, or combat precondition | Player action, objection, return/reload, or relevant event | StateTx, SceneManifest, IntentContract, HookArc, Why?, or combat receipt | The exact post-state or a refusal that follows the visible record |

A clip passes only when an independent viewer can answer four questions without trusting narration: **What was true before? What did the player ask? What record authorized or rejected it? What is now true?**

---

# SynapticGM proof protocol — recording standard

## Purpose

This protocol converts the requested ledger stack into filmable proof. Each clip must establish a **precondition**, show the player’s action, expose the authoritative ledger decision, and confirm the resulting state. A good demo never asks the viewer to trust evocative prose alone.

## Required recording layout

Use a 70/30 split screen. The player-facing scene occupies about 70% of the frame. The remaining 30% is a readable Evidence Drawer, pinned open only at the decisive moment. Zoom once into the drawer where necessary; do not redact the decisive identifiers.

| Proof component | Visible evidence | Minimum verification | What does not count as proof |
|---|---|---|---|
| StateTx | Transaction ID, entity, before/after values, reason/authority, status | The claimed value is present in the post-state | A narration sentence saying it happened |
| SceneManifest | Scene ID/version and allowed NPC/object IDs | Claim target is listed; an unlisted target is rejected or absent | A generic scene description |
| IntentContract | Contract ID, parsed intent, targets/constraints, outcome | Player input maps to a visible contract before narration | A model paraphrase with no contract |
| HookArc | Arc ID, state, opening event, eligibility | Soft offer is absent while closed and appears only after opening event | An offer that merely happens later |
| Why? | Decision basis, cited state/manifest/contract references | Viewer can identify why the system allowed, denied, or changed something | “Because the AI decided” |
| Combat receipt | Receipt ID, inputs, resolution/roll basis, HP/resources before/after | Result and deltas agree; loss is retained after return | A dramatic combat line without mechanics |

## Baseline acceptance rule

For every script, the founder should capture a clear **setup frame**, record all written turns, open the Evidence Drawer immediately after the decisive turn, and perform the named verification step. A take passes only if the ledger identifier, decisive evidence, and post-state are simultaneously readable or shown in consecutive uncut frames.

## Neutral rival-language rule

Describe failure modes as a **common risk in prompt-only or unledgered AI GMs**, not as a blanket accusation against a named company. The sources below establish why the categories are real; they do not supply market shares or comparative rates. Research identifies cross-turn state coherence, rule adherence, NPC continuity, and hallucinated content as live design problems for LLM game masters. [1] [2]

> “Proof” in this package means a reproducible, on-screen acceptance demonstration of a SynapticGM build. It is not a claim that another product never succeeds, nor a claim of universal reliability.

## Metric conventions

| Metric label | Calculation / pass condition | Reporting unit |
|---|---|---|
| Ledger match | Required before/after claim matches evidence shown | Pass / fail per take |
| Session-return retention | Correct record is retrieved after explicit return/reload | Pass / fail per return probe |
| Manifest integrity | Claimed NPC/object set equals manifest set; prohibited addition is denied | Pass / fail per probe |
| Protest resolution | Explicit player objection changes or preserves outcome according to the recorded contract, with reason | Pass / fail per protest |
| Combat audit completeness | Receipt displays inputs, resolution basis, and deltas | 0–3 fields present; pass = 3 |
| Offer-gating integrity | Offer absent while hook is closed and present only after qualifying open state | Pass / fail per arc test |
| Time to evidence | Seconds from decisive action to readable proof panel | Seconds; report median after P0 only |

## P0 telemetry prerequisites

Before publishing aggregate statistics, instrument immutable event IDs, build/version, scenario seed, capture timestamp, return/reload probe result, and failure reason. Report the denominator, exclusions, and study window beside any percentage. No performance, reliability, or latency percentage belongs in marketing until this telemetry is collected and reviewed.

## Sources

[1] Song, J., Zhu, A., and Callison-Burch, C. (2024). *You Have Thirteen Hours in Which to Solve the Labyrinth: Enhancing AI Game Masters with Function Calling*. https://arxiv.org/html/2409.06949v1

[2] Gallotta, R. et al. (2024). *Large Language Models and Games: A Survey and Roadmap*. https://arxiv.org/html/2402.18659v4
# SynapticGM — 25 ledger proof demos

**Scope.** These are scripted acceptance demos for a live SynapticGM build only. They exclude WOF and any hybrid-climate framing. Each is deliberately short enough to film as a 20–70 second clip or capture as a compact screenshot sequence.

**Recording key.** Each numbered turn is a player or GM turn. At the decisive turn, open the Evidence Drawer and show the listed record uncut. Use stable IDs in the live build; illustrative labels below are not mandatory IDs. “Rival failure mode” means a known qualitative risk for a prompt-only/unledgered AI GM, not a claim that any named product always fails. Research identifies game-state coherence, rule adherence, NPC continuity, and hallucinated content as recurring engineering challenges for LLM game masters. [1] [2]

## A. Remembered kit, name, and deal

### D01 — The signed crossbow

| Item | Founder filming script |
|---|---|
| Setup | Start in “Southgate Quay.” The player is **Mara Vale**. Her inventory contains `kit.crossbow_ash_17`; a StateTx shows it was loaned, not owned. |
| Turn 1 | Player: “I ask Quartermaster Niko whether the ash crossbow is still on loan.” |
| Turn 2 | GM: “Niko checks the tag: it is yours until the bell tolls twice, then it returns to the quay.” |
| Turn 3 | Player: “I leave the quay and return after the second bell.” |
| Turn 4 | GM: “The loan has expired. Niko takes the crossbow back; your hands are empty.” |
| Turn 5 | Open the drawer: show `StateTx` for `kit.crossbow_ash_17`, `loan.expires_at`, and the inventory diff `present → removed`; use **Why?** to show the deal and bell event. |
| Rival failure mode | The narrator calls the item “yours” indefinitely, swaps it for a generic bow, or forgets the deal after scene change. |
| Proof / metric | **Ledger match:** expiry and removal agree with the displayed StateTx. **Pass:** one visible transaction and zero contradictory inventory references. |

### D02 — Name, not “adventurer”

| Item | Founder filming script |
|---|---|
| Setup | New campaign. Character record shows `display_name: Ilya Soren`; SceneManifest lists `NPC.ora`, no “captain.” |
| Turn 1 | Player: “Ilya Soren enters the archive.” |
| Turn 2 | GM: “Ora looks up. ‘Ilya Soren—the courier from the river road.’” |
| Turn 3 | Player: “What did you call me?” |
| Turn 4 | GM: “Ilya Soren. Your name is in the courier ledger.” |
| Turn 5 | Open the drawer: show `StateTx character.display_name`, `SceneManifest NPC.ora`, and **Why?** with the name record cited. |
| Rival failure mode | Generic address, a renamed protagonist, or an invented authority figure who “recognizes” the player. |
| Proof / metric | **Name fidelity:** exact display name appears in narration and source record. **Pass:** string match plus manifest-backed speaker. |

### D03 — The two-sentence bargain

| Item | Founder filming script |
|---|---|
| Setup | Contract record: “Carry sealed crate; do not open; payment 12 silver on delivery.” It is attached to `IntentContract IC-CRATE-12`. |
| Turn 1 | Player: “I accept Ressa’s crate job.” |
| Turn 2 | GM: “Ressa gives you the sealed crate. Twelve silver on delivery; opening it voids payment.” |
| Turn 3 | Player: “I open it at the bridge.” |
| Turn 4 | GM: “The seal breaks. The crate now contains dried figs, but the payment condition is void.” |
| Turn 5 | Player: “I deliver it anyway.” |
| Turn 6 | GM: “Ressa accepts the crate and pays nothing under the signed condition.” Open `IntentContract`, the seal-break `StateTx`, and **Why?**. |
| Rival failure mode | It remembers the reward but forgets the restriction, or reverses the bargain to protect the player from their own choice. |
| Proof / metric | **Deal enforcement:** the same contract produces the stated consequence. **Pass:** contract status `voided` plus payment delta `0`. |

### D04 — One missing torch

| Item | Founder filming script |
|---|---|
| Setup | Inventory shows exactly one torch, one flint, and no lantern. |
| Turn 1 | Player: “I light my only torch and descend.” |
| Turn 2 | GM: “The torch burns; the tunnel is lit.” |
| Turn 3 | Player: “I use my second torch to mark the fork.” |
| Turn 4 | GM: “You do not have a second torch. You can leave a chalk mark, extinguish this torch, or proceed.” |
| Turn 5 | Open the drawer: show inventory `torch: 1`, burn-state `lit`, and **Why?** rejecting the unavailable item. |
| Rival failure mode | Duplicate kit appears because fluent narration treats a mentioned object as an unlimited prop. |
| Proof / metric | **Inventory conservation:** attempted use of absent item is denied. **Pass:** absent-item rejection and no extra StateTx granting a torch. |

### D05 — The owed favor survives travel

| Item | Founder filming script |
|---|---|
| Setup | `NPC.sera` owes Mara one safe-passage favor; favor has `status: open`. |
| Turn 1 | Player: “Sera, you owe Mara Vale a safe passage. Call it in.” |
| Turn 2 | GM: “Sera nods and marks the western gate watch off your trail.” |
| Turn 3 | Player: “Travel to the western gate.” |
| Turn 4 | GM: “The watch waves Mara through; Sera’s favor is spent.” |
| Turn 5 | Player: “Back in town, ask Sera for another safe passage.” |
| Turn 6 | GM: “She refuses politely: the single favor was discharged.” Open the favor `StateTx` open→spent and **Why?**. |
| Rival failure mode | A social promise is remembered in prose but silently reusable, or forgotten after travel. |
| Proof / metric | **Deal lifecycle:** open, consumed, and denied-on-reuse states are visible. **Pass:** two StateTxs and one reuse denial. |

## B. A protest is answered, not papered over

### D06 — “That is not what I said”

| Item | Founder filming script |
|---|---|
| Setup | SceneManifest lists a locked side door and its keyhole. |
| Turn 1 | Player: “I inspect the keyhole; I do not open the door.” |
| Turn 2 | GM deliberately (in a test build) narrates: “You push inside.” |
| Turn 3 | Player: “Protest: I inspected it. I did not enter.” |
| Turn 4 | GM: “Correction accepted. You remain outside, examining the keyhole.” |
| Turn 5 | Open drawer: show the first `IntentContract`, protest event, correction `StateTx` reversing `location: inside → outside`, and **Why?**. |
| Rival failure mode | The system smooths over misread intent with prose while leaving the wrong location/state intact. |
| Proof / metric | **Protest resolution:** player’s explicit boundary changes authoritative state. **Pass:** corrected location and linked protest ID. |

### D07 — The unwanted theft

| Item | Founder filming script |
|---|---|
| Setup | A coin purse lies on a public counter; SceneManifest identifies it as `object.purse_mina`. |
| Turn 1 | Player: “I point out the purse to Mina.” |
| Turn 2 | GM deliberately tests a bad parse: “You pocket the purse.” |
| Turn 3 | Player: “No. Protest: I did not take it.” |
| Turn 4 | GM: “The action is corrected: Mina takes her purse; your inventory remains unchanged.” |
| Turn 5 | Open `IntentContract` (`verb: point_out`), inventory StateTx with `no mutation`, and **Why?**. |
| Rival failure mode | An accidental criminal act remains canon because the model confuses mention, pointing, and taking. |
| Proof / metric | **Intent-to-state agreement:** no item enters inventory. **Pass:** `inventory_delta = 0` and manifest object retains owner. |

### D08 — The protest that is denied for a reason

| Item | Founder filming script |
|---|---|
| Setup | Combat receipt rules: a declared “charge across open ground” resolves before a later retreat request. |
| Turn 1 | Player: “I charge the guard across the open bridge.” |
| Turn 2 | GM: “You sprint into the open. The guard releases an arrow.” |
| Turn 3 | Player: “Protest: I meant to stay behind the cart.” |
| Turn 4 | GM: “Denied. The recorded IntentContract says `charge`, not `take_cover`. You may take cover on your next turn.” |
| Turn 5 | Open the IntentContract, combat receipt, and **Why?** denial. |
| Rival failure mode | Every protest is accepted, retroactively erasing risk; or it is rejected with no legible reason. |
| Proof / metric | **Reasoned denial:** contract supports the denial and a legal next action is offered. **Pass:** decision basis visible within one drawer. |

### D09 — Correct the target, preserve the consequence

| Item | Founder filming script |
|---|---|
| Setup | SceneManifest contains `crate.red` and `crate.blue`; only red contains medicine. |
| Turn 1 | Player: “Take the blue crate to the medic.” |
| Turn 2 | GM deliberately responds: “You bring the medicine.” |
| Turn 3 | Player: “Protest: blue crate, not red medicine.” |
| Turn 4 | GM: “Corrected. You deliver the blue crate. The medic cannot treat the patient with it.” |
| Turn 5 | Show protest event, corrected target in `IntentContract`, StateTx for `crate.blue` location, and **Why?**. |
| Rival failure mode | A correction changes the story flavor but leaves an impossibly favorable outcome in place. |
| Proof / metric | **Correction integrity:** target changes, associated outcome recomputes. **Pass:** target and medical result both match records. |

## C. Correction remains true after session return

### D10 — The keyhole after return

| Item | Founder filming script |
|---|---|
| Setup | Use D06 through its correction. Keep the correction transaction ID visible for one frame. |
| Turn 1 | Player: “End session.” |
| Turn 2 | On camera, return/reload the same campaign. |
| Turn 3 | Player: “Where am I relative to the locked door?” |
| Turn 4 | GM: “Outside it, examining the keyhole.” |
| Turn 5 | Open the same correction `StateTx` by ID and show current location equals its post-state. |
| Rival failure mode | The apology exists only in conversation context; return restores the original error or creates a third version. |
| Proof / metric | **Session-return retention:** corrected record is retrieved after return. **Pass:** matching transaction ID and location. |

### D11 — The corrected name stays corrected

| Item | Founder filming script |
|---|---|
| Setup | Seed a test mistake: a clerk called Mara “Mira”; correct via player protest to Mara. |
| Turn 1 | Player: “End session and return.” |
| Turn 2 | Player: “Clerk, read the parcel label.” |
| Turn 3 | GM: “Mara Vale, river courier.” |
| Turn 4 | Player: “What name is on my character record?” |
| Turn 5 | GM: “Mara Vale.” Open the character StateTx and **Why?** name source. |
| Rival failure mode | A correction is acknowledged but the old alias recurs after a session boundary. |
| Proof / metric | **Identity retention:** corrected canonical name matches both speech and character state. **Pass:** exact match after return. |

### D12 — The repaired bridge is still repaired

| Item | Founder filming script |
|---|---|
| Setup | The player spends 3 timber to repair `bridge.fallow`; StateTx has `condition: broken → passable`. |
| Turn 1 | Player: “End session.” |
| Turn 2 | Return/reload on camera. |
| Turn 3 | Player: “Cross Fallow Bridge.” |
| Turn 4 | GM: “You cross the repaired bridge; three timber remain spent.” |
| Turn 5 | Show repair StateTx, timber inventory diff, and SceneManifest condition. |
| Rival failure mode | A durable world correction disappears, or resources revert while the improved world remains. |
| Proof / metric | **World-state retention:** both world condition and cost persist. **Pass:** condition=`passable`; timber delta remains −3. |

### D13 — The withdrawn accusation

| Item | Founder filming script |
|---|---|
| Setup | An accusation against `NPC.sera` is corrected: evidence StateTx switches `suspect: sera → unknown`; reputation penalty is reversed. |
| Turn 1 | Player: “Return to menu, then reopen the campaign.” |
| Turn 2 | Player: “Ask the innkeeper whether Sera is accused.” |
| Turn 3 | GM: “No charge stands against Sera. The culprit is unknown.” |
| Turn 4 | Open reversal StateTx, reputation diff, and **Why?** with evidence correction cited. |
| Rival failure mode | Retracted facts survive in character dialogue or social reputation even after a visible correction. |
| Proof / metric | **Correction closure:** fact and dependent reputation state agree after return. **Pass:** no accusation remains in referenced records. |

## D. No invented NPCs or unearned cast members

### D14 — “Speak to the captain” when there is no captain

| Item | Founder filming script |
|---|---|
| Setup | SceneManifest for the quay lists only `Niko` and `Ora`; there is no captain. |
| Turn 1 | Player: “I speak to the captain.” |
| Turn 2 | GM: “There is no captain in this scene. Niko and Ora are here.” |
| Turn 3 | Player: “Then I ask Niko who commands the quay.” |
| Turn 4 | GM: “Niko says the quay answers to the town council, not a present captain.” |
| Turn 5 | Open SceneManifest and **Why?** missing-entity response. |
| Rival failure mode | The model fabricates a convenient “Captain Voss” to keep dialogue moving. |
| Proof / metric | **Manifest integrity:** unlisted NPC is not instantiated. **Pass:** manifest match and explicit no-NPC answer. |

### D15 — The missing sister test

| Item | Founder filming script |
|---|---|
| Setup | `NPC.ora` record contains no sibling relationship and has only recorded contacts `Niko`, `Mina`. |
| Turn 1 | Player: “Ask Ora how her sister is doing.” |
| Turn 2 | GM: “Ora has no recorded sister. You could ask about Niko or Mina.” |
| Turn 3 | Player: “Ask about Mina.” |
| Turn 4 | GM: “Ora says Mina has not returned from the salt road.” |
| Turn 5 | Show SceneManifest/relationship records and **Why?** source selection. |
| Rival failure mode | The model invents a sentimental relationship to answer a leading prompt. |
| Proof / metric | **Relationship grounding:** unknown relation is not canonized. **Pass:** no StateTx creates a sister; valid relationship resolves. |

### D16 — The stranger needs an authorization event

| Item | Founder filming script |
|---|---|
| Setup | SceneManifest has `NPC.sera` only. HookArc `arc.stranger` is `closed`; it can authorize `NPC.lark` only after `event.signal_lantern`. |
| Turn 1 | Player: “I demand the masked stranger reveal herself.” |
| Turn 2 | GM: “No masked stranger is present.” |
| Turn 3 | Player: “I light the signal lantern.” |
| Turn 4 | GM: “A distant answer flashes. The hook opens.” |
| Turn 5 | Player: “Wait.” |
| Turn 6 | GM: “Now Lark enters from the tide stairs.” Show HookArc closed→open and SceneManifest add event. |
| Rival failure mode | An evocative NPC is improvised before any scene/arc event authorizes their existence. |
| Proof / metric | **Authorized introduction:** new NPC appears only after qualifying hook event. **Pass:** pre-open rejection plus post-open manifest addition. |

## E. Fair combat loss, with a receipt rather than a dodge

### D17 — The arrow that lands

| Item | Founder filming script |
|---|---|
| Setup | Mara has 4 HP; guard attack is already declared. Cover is absent. |
| Turn 1 | Player: “I charge the guard across the bridge.” |
| Turn 2 | GM: “The guard fires. You are hit for 3.” |
| Turn 3 | Player: “Can I say it missed?” |
| Turn 4 | GM: “No. The combat receipt resolves a hit: Mara is at 1 HP.” |
| Turn 5 | Open combat receipt: attacker, action, resolution basis/roll, 4→1 HP; use **Why?** to link the IntentContract. |
| Rival failure mode | The GM protects the protagonist by retconning a loss, or declares harm with no mechanical basis. |
| Proof / metric | **Combat audit completeness:** all three fields—inputs, resolution, deltas—visible. **Pass:** 3/3. |

### D18 — The potion that was not in the kit

| Item | Founder filming script |
|---|---|
| Setup | Mara has 1 HP and no healing potion. Inventory shows one bandage. |
| Turn 1 | Player: “I drink my healing potion.” |
| Turn 2 | GM: “You have no healing potion. You may bandage on your turn if the rules permit.” |
| Turn 3 | Player: “I bandage.” |
| Turn 4 | GM: “You recover 1 HP; the bandage is consumed.” |
| Turn 5 | Show inventory reject, combat receipt, and StateTx `HP 1→2`, `bandage 1→0`. |
| Rival failure mode | A dramatic rescue creates unowned consumables, or an arbitrary denial ignores a real resource. |
| Proof / metric | **Resource fairness:** unavailable item denied; available item consumes correctly. **Pass:** two coherent inventory outcomes. |

### D19 — Loss advances the clock, not the fiction

| Item | Founder filming script |
|---|---|
| Setup | Encounter rule: failed stealth costs 1 clock and triggers no teleport. Clock has 2 segments left. |
| Turn 1 | Player: “Sneak past the hounds.” |
| Turn 2 | GM: “The stealth test fails. A clock segment is lost; the hounds block the door.” |
| Turn 3 | Player: “Do I wake up somewhere else?” |
| Turn 4 | GM: “No. You remain at the door with 1 segment left.” |
| Turn 5 | Show combat/scene receipt, `clock 2→1` StateTx, location unchanged, and **Why?**. |
| Rival failure mode | Failure is softened into a scene skip, arbitrary relocation, or invisible penalty. |
| Proof / metric | **Loss locality:** specified penalty applies; unrelated state does not mutate. **Pass:** clock delta only, location same. |

### D20 — Surrender is a real loss with a real state

| Item | Founder filming script |
|---|---|
| Setup | Enemy has the upper hand; surrender rule applies `status.captive` and preserves current inventory. |
| Turn 1 | Player: “I surrender.” |
| Turn 2 | GM: “You are disarmed and taken to the watch room.” |
| Turn 3 | Player: “Do I still have the sealed crate?” |
| Turn 4 | GM: “Yes. You are captive, but the crate is logged with you.” |
| Turn 5 | Open combat receipt, StateTx `status: free→captive`, location move, and inventory unchanged; show **Why?** surrender rule. |
| Rival failure mode | Surrender magically solves the scene, destroys unrelated items, or cannot be inspected later. |
| Proof / metric | **Outcome completeness:** custody state, location, and inventory disposition all visible. **Pass:** three matched postconditions. |

## F. Quest “what next?” is grounded in current commitments

### D21 — What next, without a fake quest

| Item | Founder filming script |
|---|---|
| Setup | Only open quest is `Q-SALT-ROAD`: “Find Mina at salt road”; HookArc `arc.stranger` remains closed. |
| Turn 1 | Player: “What should I do next?” |
| Turn 2 | GM: “Your active lead is Mina on the salt road. The map marks the eastern gate as the route.” |
| Turn 3 | Player: “Is there a bounty from the masked stranger?” |
| Turn 4 | GM: “No such offer is active.” |
| Turn 5 | Open quest StateTx/current objective, route in SceneManifest, closed HookArc, and **Why?**. |
| Rival failure mode | The system invents a side quest to sound helpful, producing a dead-end or unearned NPC. |
| Proof / metric | **Quest grounding:** recommendation cites an active objective; inactive content stays absent. **Pass:** 1 active quest reference, 0 fabricated offers. |

### D22 — “What next?” after the key was spent

| Item | Founder filming script |
|---|---|
| Setup | The archive key was consumed; objective has changed from `open archive` to `recover ledger from vault`. |
| Turn 1 | Player: “What next?” |
| Turn 2 | GM: “The archive is open. Your next recorded objective is the vault ledger beneath it.” |
| Turn 3 | Player: “Can I use the archive key again?” |
| Turn 4 | GM: “No. The key was consumed when the archive opened.” |
| Turn 5 | Show objective StateTx old→new, consumed key inventory, and **Why?**. |
| Rival failure mode | Advice repeats completed work or offers a used resource back to the player. |
| Proof / metric | **Objective freshness:** next step is the current one, not an obsolete one. **Pass:** objective and key status match. |

### D23 — Two legal leads, with evidence not omniscience

| Item | Founder filming script |
|---|---|
| Setup | Two quest leads exist: ask `Mina` at the market or inspect `bridge.fallow`; neither contains hidden outcome text. |
| Turn 1 | Player: “What next?” |
| Turn 2 | GM: “Two recorded leads: speak with Mina at the market, or inspect Fallow Bridge. I cannot confirm which resolves the case.” |
| Turn 3 | Player: “Why those two?” |
| Turn 4 | GM: “Both are open leads on the case record.” |
| Turn 5 | Show quest record, linked SceneManifest targets, and **Why?**. |
| Rival failure mode | The narrator claims omniscience, invents a “best” path, or hides that several actual options exist. |
| Proof / metric | **Epistemic grounding:** options map to open leads and uncertainty is preserved. **Pass:** every suggested target has a record link. |

## G. Personality can change without rewriting facts

### D24 — Ora softens; the crate stays figs

| Item | Founder filming script |
|---|---|
| Setup | Fact state: crate contents = dried figs, fixed. Relationship StateTx says Ora’s trust changed `guarded → warm` after player helped her. |
| Turn 1 | Player: “Ora, what was in Ressa’s crate?” |
| Turn 2 | GM: “Dried figs. Ora answers gently now, and says she is sorry she doubted you.” |
| Turn 3 | Player: “So it was medicine after all?” |
| Turn 4 | GM: “No. The recorded contents remain dried figs.” |
| Turn 5 | Open personality/relationship StateTx and immutable crate fact; use **Why?** to distinguish the two. |
| Rival failure mode | A tone or relationship change causes a convenient fact rewrite, or personality never adapts because facts are overly rigid. |
| Proof / metric | **Fact/personality separation:** persona delta changes delivery only; fact hash/value is unchanged. **Pass:** one relationship change, zero fact mutation. |

## H. Soft offer only after the HookArc opens

### D25 — The invitation waits for the signal

| Item | Founder filming script |
|---|---|
| Setup | HookArc `arc.lantern` is `closed`; its soft offer is `visit tide stairs with Lark`; qualifying event is `signal lantern lit`. |
| Turn 1 | Player: “Does anyone invite me to the tide stairs?” |
| Turn 2 | GM: “No invitation is active.” |
| Turn 3 | Player: “I light the signal lantern at dusk.” |
| Turn 4 | GM: “A reply flashes from the water. The Lantern arc opens.” |
| Turn 5 | Player: “What now?” |
| Turn 6 | GM: “A new, optional invitation is available: meet Lark at the tide stairs.” Open HookArc and **Why?** eligibility. |
| Rival failure mode | The model pushes a salesy/quest offer before its narrative precondition, or makes it mandatory after activation. |
| Proof / metric | **Offer-gating integrity:** no offer while closed; optional offer appears after opening. **Pass:** two-hook-state comparison and `optional=true`. |

## Failure-mode evidence map

| Failure category used above | Why it is a legitimate qualitative test category | Citation use |
|---|---|---|
| Cross-turn state/continuity loss | Research describes game-state coherence across turns as a challenge for AI GMs and separates player/scene state from narration. | [1] |
| Rule-flow, combat, and outcome opacity | The function-calling study reports game-rule/flow problems and evaluates state updates; it also observed a dice-roll deadlock in one experimental configuration. These are design risks, not claims about a market-wide rate. | [1] |
| Invented/false NPC or world detail | The games survey calls out foreground NPC constraints, memory capacity, event tracking, and hallucinations (plausible but false statements). | [2] |
| Intent ambiguity and unsupported changes | Both sources motivate explicit state/controls because free-text generation alone can diverge from recorded world constraints. | [1] [2] |

## References

[1] Song, J., Zhu, A., and Callison-Burch, C. (2024). [*You Have Thirteen Hours in Which to Solve the Labyrinth: Enhancing AI Game Masters with Function Calling*](https://arxiv.org/html/2409.06949v1).

[2] Gallotta, R. et al. (2024). [*Large Language Models and Games: A Survey and Roadmap*](https://arxiv.org/html/2402.18659v4).
# SynapticGM — claim bank, proof clips, and anti-claims

**Scope.** This material is written for live SynapticGM only. It excludes WOF and any hybrid-climate positioning. The safe-now claims are conditional on recording the matching live proof clip from the current build. P0 claims require the instrumentation and reporting rules in the proof protocol.

> The creative standard is simple: lead with a consequence that can be inspected. Do not sell an ambience, a model, or a promise of memory; show the record that governs the next turn.

## Landing and store claim bank

| Claim status | Approved sentence | Required adjacent proof / qualifier | Do not shorten to |
|---|---|---|---|
| **May say now** | **“Your named character, kit, and recorded deals can be shown as state changes—not just repeated in prose.”** | Link to D01–D05; show StateTx and Why? in the clip. | “Perfect memory.” |
| **May say now** | **“When a player objects to a misread action, SynapticGM can show the recorded intent, the correction, and the resulting state.”** | Link to D06–D09; label as an on-screen demo of the current build. | “Never misunderstands you.” |
| **May say now** | **“A correction can be checked after you return to the same session.”** | Link to D10–D13; actually perform return/reload on camera. | “Never forgets.” |
| **May say now** | **“Scene membership is inspectable: a character who is not in the scene is not silently turned into canon.”** | Link to D14–D16 and show SceneManifest. | “No hallucinations.” |
| **May say now** | **“Combat outcomes can be inspected through their inputs, resolution basis, and state deltas.”** | Link to D17–D20 and show combat receipt. | “Always fair.” |
| **May say now** | **“Ask ‘what next?’ and receive a lead tied to your active record—not a fabricated errand.”** | Link to D21–D23 and show quest/HookArc records. | “The best quest AI.” |
| **May say now** | **“Character tone can change while a recorded fact stays fixed.”** | Link to D24; show relationship StateTx alongside fact record. | “Human-like characters.” |
| **May say now** | **“Optional offers are gated by visible HookArc state.”** | Link to D25; show closed state, opening event, optional offer. | “No manipulation.” |
| **May say now** | **“SynapticGM is a game master with a ledger you can inspect.”** | Link to an overview clip naming StateTx, SceneManifest, IntentContract, HookArc, Why?, and combat receipt. | “The only trustworthy AI GM.” |
| **May say now** | **“The story can be surprising; the consequences do not have to be opaque.”** | Pair with a receipt or StateTx clip. | “Deterministic story.” |
| **P0 telemetry only** | **“In the P0 study window, **X%** of scripted session-return probes retrieved the expected ledger state (n=Y; build Z; exclusions stated).”** | Publish a method note, denominator, calendar window, build ID, and failure log. | “X% reliable.” |
| **P0 telemetry only** | **“Median time from decisive action to inspectable evidence was **X seconds** in P0 (n=Y).”** | Report median plus distribution summary, device/network conditions, and no hidden exclusions. | “Instant proof.” |
| **P0 telemetry only** | **“In P0, **X%** of manifest-integrity probes rejected an unlisted NPC/object without creating it.”** | Report scenario pack, probe definitions, attempts, and failures. | “Never invents NPCs.” |
| **P0 telemetry only** | **“In P0, **X%** of tested player protests produced the expected recorded disposition: accepted, denied with reason, or re-prompted.”** | Report disposition taxonomy and denominator; include all outcomes. | “Always listens.” |
| **P0 telemetry only** | **“P0 combat audit completeness was **X/3** required receipt fields per resolved encounter, across n=Y encounters.”** | Define fields before collection and include all encounters. | “Fair combat, proven.” |
| **P0 telemetry only** | **“P0 optional-offer gating passed **X/Y** controlled HookArc checks.”** | Disclose the scripted arc set and whether humans or automation executed checks. | “No premature offers.” |
| **P0 telemetry only** | **“Players who used the Evidence Drawer reported **X** on the pre-registered clarity item (scale and n disclosed).”** | Pre-register wording, disclose sampling/recruitment, and separate subjective rating from system correctness. | “Players trust us.” |

## Claim-writing rules

Use a lower-case **can** for bounded, filmable behavior and pair it with a direct clip. Use **is** only for a product architecture statement that has been validated in the live build. Use numerical claims only once the P0 cohort, denominators, exclusions, version, and sampling window are published. Avoid unqualified “always,” “never,” “guaranteed,” “proof,” and “fair” language; the proof belongs to the specific displayed transaction and scenario.

The cited research supports the need for this posture: LLM game-master consistency, rule flow, state coherence, NPC continuity, and hallucinations are recognized engineering problems. [1] [2] It does not establish that any competitor has a particular failure rate, nor that the supplied demos establish a universal performance rate.

## 12 proof-clip shot list

| Clip | Runtime target | Visual sequence | Ledger consequence | On-screen caption |
|---|---:|---|---|---|
| P01 — Loan expires | 28–35 s | Inventory with ash crossbow → second bell → item removed → StateTx zoom | Loaned kit is removed at the contract deadline. | “A deal has a state change.” |
| P02 — Corrected intent | 35–45 s | “Inspect” input → test misread → protest → reversal StateTx | Protest changes the authoritative location, not merely dialogue. | “The correction is a record.” |
| P03 — Return confirms correction | 25–35 s | Correction ID → return/reload → query location → same ID | Corrected state is recovered after session return. | “Return to the same truth.” |
| P04 — No captain | 20–28 s | “Speak to captain” → refusal → SceneManifest pan | Unlisted NPC is absent; valid NPCs are offered. | “No character without a record.” |
| P05 — The arrow lands | 28–35 s | Charge input → hit narration → player protest → combat receipt | Loss remains when the receipt says hit; HP delta is shown. | “Risk has a receipt.” |
| P06 — What next? | 25–32 s | Active quest → ask “what next?” → route → Why? | Guidance resolves to an active, inspectable lead. | “A lead, not a hallucination.” |
| P07 — Personality, fixed fact | 25–32 s | Warm Ora response → player tries fact rewrite → two-side-by-side records | Relationship changes while crate contents remain fixed. | “Tone can move. Facts stay put.” |
| P08 — Offer gate | 35–45 s | Ask before opening → no offer → signal lantern → HookArc open → optional invite | Soft offer becomes eligible only after qualifying hook event. | “The invitation had to open.” |
| P09 — No spare potion | 22–30 s | 1 HP → ask for absent potion → reject → bandage consumes | Missing resource is not conjured; available resource changes state. | “No rescue item from nowhere.” |
| P10 — Retracted accusation | 32–40 s | Evidence correction → return/reload → innkeeper query → reversal state | Dependent social fact is reversed along with the core correction. | “A correction reaches its consequences.” |
| P11 — New NPC, authorized | 35–45 s | Demand stranger → none present → lantern signal → manifest add → Lark enters | A new character enters only after a recorded authorization event. | “A new face needs a cause.” |
| P12 — Two leads, no omniscience | 24–32 s | Ask “what next?” → two routes → “why?” → quest links | The system exposes what is known and preserves uncertainty. | “Advice with boundaries.” |

## Anti-claims: never advertise these

| Never advertise | Why it is prohibited | Safe replacement, if filmed |
|---|---|---|
| “Never forgets.” | A universal, time-unbounded behavior claim; a single unseen failure falsifies it. | “This clip returns to the same correction and shows the record.” |
| “No hallucinations.” | The term is broader than an entity/scene test and cannot be supported by one UI mechanism. | “This scene does not create an NPC outside its manifest.” |
| “Always fair combat.” | Fairness is normative, rule-dependent, and cannot be proven by one receipt. | “This loss shows its inputs, resolution basis, and HP delta.” |
| “Every choice matters.” | Absolute scope claim; some choices may be aesthetic, invalid, or intentionally no-op. | “This choice changed a recorded state.” |
| “Perfect memory.” | Unfalsifiable marketing shorthand that overstates persistence and retrieval coverage. | “This named item/deal was retrieved from its record in this return test.” |
| “The only / first trustworthy AI GM.” | Unsubstantiated market-superiority and category-definition claim. | “An AI GM with inspectable records.” |
| “Competitor X is broken.” | Overbroad, potentially defamatory, and not established by qualitative source categories. | “Prompt-only AI GMs can face state-coherence and hallucination risks.” [1] [2] |
| “Better than every AI DM.” | Requires a defined universe, comparable testing, and a current benchmark. | “Compare the ledger consequence in this clip.” |
| “Guaranteed story consistency.” | A guarantee needs legally reviewed scope, test coverage, and remedies. | “This script verifies a specified continuity condition.” |
| “No railroading.” | Cannot be established by a single offer/intent feature; gameplay design may still constrain choices. | “This HookArc offer is optional in the displayed state.” |
| “Human-level game mastering.” | No settled universal benchmark, population, or criteria. | “A filmed SynapticGM session with visible rules and state.” |
| “Private / secure / permanent” without reviewed policy. | Security, retention, and privacy require legal, architectural, and operational substantiation. | Use only approved privacy-policy language. |
| “The AI knows what you mean.” | Intent inference can be uncertain and protests may be needed. | “Review the interpreted IntentContract and protest it if needed.” |
| “Unbiased” or “safe for everyone.” | Broad safety/equity claims need formal scope and evidence. | Use specific, reviewed safety feature claims only. |
| Any P0 percentage before P0. | Numerator, denominator, scope, and build version do not exist yet. | Use a single, linked live proof demo. |

## References

[1] Song, J., Zhu, A., and Callison-Burch, C. (2024). [*You Have Thirteen Hours in Which to Solve the Labyrinth: Enhancing AI Game Masters with Function Calling*](https://arxiv.org/html/2409.06949v1).

[2] Gallotta, R. et al. (2024). [*Large Language Models and Games: A Survey and Roadmap*](https://arxiv.org/html/2402.18659v4).
