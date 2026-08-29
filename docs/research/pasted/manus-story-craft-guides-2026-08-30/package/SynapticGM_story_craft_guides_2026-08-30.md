# SynapticGM Story-Craft Constitution

**Mode writing guides for `litrpg`, `dnd`, `rpg`, and `pyoa`**

**Author:** Manus AI  
**Date:** 2026-08-30  
**Status:** Final research constitution; no game-code changes

> **Core craft rule:** Write one consequential beat, make its change legible, then hand the next meaningful decision back to the player. Code owns facts; prose dramatizes only committed outcomes.

This final document supplies the missing **how-to-write** layer for SynapticGM. It does not replace the existing quality constitution, continuity ledgers, clone detectors, inventory authority, `ArcDirector`, `BeatContract`, or `ChoiceCompiler`. Its job is narrower: define the grammar of a good turn in each live engine mode and reduce that guidance to prompt lines short enough for Gemini 2.5 Flash Lite.

## Deliverable Map

| Deliverable | Location |
|---|---|
| D1 Source inventory | Public Source Inventory |
| D2 Per-mode do / don’t constitution | Per-Mode Do / Don’t Constitution |
| D3 Choice grammar | Choice Grammar |
| D4 Turn shape | Turn Shape: One Beat |
| D5 Anti-repetition craft | Anti-Repetition Craft: Write the Delta |
| D6 Ranked anti-patterns | Ranked Writing-Only Anti-Patterns |
| D7 Thinning map | Thinning Map: Prompt, Ledger, or Research-Only |
| D8 Implementation backlog | Implementation Backlog plus standalone CSV |
| D9 Eval / critic addendum | Evaluation / Critic Addendum |
| D10 Executive summary | Executive Summary and standalone one-page file |

## D10. Executive Summary

Public interactive-fiction and tabletop craft converges on a small set of durable ideas. Choices need not create permanently separate plots, but they must create **different immediate outcomes, durable state, or different later tests**. A tabletop GM prepares and portrays a situation rather than dictating a plot. Narrative-RPG pressure should arise from established relationships and leave the player in control of the protagonist’s decisions. LitRPG mechanics must participate in causality rather than decorate the prose. Across every mode, revisiting a room, NPC, crisis, or menu should either reveal a new fact, change the situation, or close honestly; it should not print the previous turn again.[1] [2] [7] [8] [12] [14] [20] [24] [25]

| Ship this week | Keep outside the live prompt | Why |
|---|---|---|
| Add **one mode-specific AUTHORITY sentence per mode**. | Keep the full do/don’t rules in this guide and in evaluator documentation. | Flash Lite is more likely to follow four crisp discriminators than a large mandate pile. |
| Add a ledger gate for **PYOA branch lock + crisis delta**. | Keep branching-pattern terminology and source commentary in research docs. | A prompt can request commitment; a ledger can remember which route closed and what changed. |
| Add an **NPC topic/tactic progression** field or equivalent deterministic state. | Keep dialogue theory and examples outside the prompt. | This prevents first-speech replay while allowing an explicit player-requested recap. |
| Add a **known-inspection disposition**: new fact, concise reminder, or honest exhaustion. | Keep “inspect-once” rationale in this guide. | It removes the repeated room/entity essay without forbidding legitimate follow-up investigation. |
| Preserve the existing global clone and choice-diversity enforcement. | Do not add another LLM critic path or enable the Mid writer. | The requested gap is craft guidance, not another detector stack. |

The best four-line prompt diet is:

> **`litrpg`:** Resolve the story beat first; then report only earned, ledger-backed System changes, and make repeat inspection yield a new fact, a brief reminder, or honest exhaustion—never the same essay.
>
> **`dnd`:** Portray the changed situation, honor the declared action and fair ruling, let success stand with fiction-led consequences, share spotlight, then ask what the player does.
>
> **`rpg`:** Advance one relationship through leverage, loyalty, or moral cost; change the NPC’s tactic, preserve the player’s interiority, and leave at least two socially distinct futures.
>
> **`pyoa`:** Resolve the chosen fork, lock what it closed, change the page-local crisis, then offer 2–4 choices that lead to distinct futures—never four phrasings of the same delay.

The score ceiling below is a **design estimate, not an empirical benchmark**. Thin AUTHORITY alone should materially improve mode separation but remains vulnerable whenever the model forgets branch, topic, or inspection history. Four lines alone plausibly move the craft layer to roughly **6–7/10**. Four lines plus the three small ledger items above plausibly reaches **8–9/10**, because the prompt tells the writer what good looks like while deterministic state prevents the most common regressions.

## D1. Public Source Inventory

The inventory favors primary documentation, open SRDs, and public practitioner essays. **“Cite-only; paraphrase”** means ordinary copyright applies and the guide should summarize the lesson rather than reproduce prose. **“Open”** means the source states an explicit reusable license; attribution and any share-alike obligations still apply.

### PYOA / Gamebook / Choice-Based Fiction

| Source | Author / year | Craft lesson for SynapticGM | License / citation note |
|---|---:|---|---|
| [Standard Patterns in Choice-Based Games][1] | Sam Kabo Ashwell, 2015 | Branch-and-bottleneck needs state so rejoining does not erase choice; gauntlets and loops create distinct expectations. | Cite-only; paraphrase. |
| [By the Numbers][2] | Dan Fabulich, 2011 | Delayed branching makes an early choice matter in a later test without infinite branch growth. | Cite-only; paraphrase. |
| [Introduction to ChoiceScript][3] | Choice of Games, n.d. | Choices can branch, rejoin, set variables, and reach explicit endings; prior state should alter later text. | Public documentation; cite-only unless repository terms are separately verified. |
| [Important ChoiceScript Commands and Techniques][4] | Choice of Games, n.d. | Distinguishes `*choice` from `*fake_choice`; conditional and hide/disable-reuse options model branch access and topic exhaustion. | Public documentation; cite-only unless repository terms are separately verified. |
| [Making Interactive Fiction: Branching Choices][5] | Bruno Dias, 2018 | The offered option set defines perceived agency; choice wording should consistently express action, tone, and character range. | Cite-only; paraphrase. |
| [Small-Scale Structures in CYOA][6] | Emily Short, 2016 | Confirmation, track-switching, scored choice, gated conversation, opening divergence, and endgame payoff solve different local design problems. | Cite-only; paraphrase. |
| [Plotting for Interactivity: The Set-Piece or Crisis][7] | Emily Short, 2011 | A crisis uses known affordances, fewer expressive choices, little exposition, forward momentum, and clear ending conditions. | Cite-only; paraphrase. |
| [Conversation][8] | Emily Short, n.d. | Repeat queries should be summarized, varied, contextualized, or acknowledged by the NPC while essential information remains recoverable. | Cite-only; paraphrase. |
| [Twine Cookbook][9] | IFTech Foundation contributors, 2021 | Variables, conditional text, visit counts, links, and storylets provide public implementation patterns for persistent consequence. | Open: CC BY-SA 4.0. |
| [How I Wrote a Gamebook: The Basics][10] | J. D. Mitchell, 2022 | Keep rules plain, entries concise, momentum visible, and restart-heavy failure judicious. | Cite-only; paraphrase. |
| [Gamebook Mechanics: Meaningful Choices][11] | Lloyd of Gamebooks, 2017 | A meaningful option gives enough information for judgment without becoming a trivial answer or an arbitrary door pick. | Cite-only; paraphrase. |

**ChooseCo-style omission.** The public Choose Your Own Adventure site describes a second-person reader-as-hero product format, but the research did not find a substantial official, freely licensed ChooseCo writing manual. Direct ChooseCo craft rules are therefore omitted. The functional requirement is covered by Choice of Games, Ashwell, Dias, Short, Twine, and public gamebook commentary. SynapticGM should use **PYOA**, **choice-based fiction**, or **gamebook** rather than treating a trademarked series name as a generic house style.

### Tabletop Fantasy

| Source | Author / year | Craft lesson for SynapticGM | License / citation note |
|---|---:|---|---|
| [Don’t Prep Plots][12] | Justin Alexander, 2009 | A situation supplies circumstances; player actions determine the event sequence. Predetermined plots create railroad pressure. | Cite-only; paraphrase. |
| [Three Clue Rule][13] | Justin Alexander, 2008 | Avoid investigation chokepoints; provide redundant routes and reward unanticipated valid approaches. | Cite-only; paraphrase. |
| [Blades SRD: The Basics][14] | John Harper / One Seven Design, n.d. | The GM presents a dynamic world and opportunities, then follows the chain of action and consequence rather than owning the story. | Open SRD: CC BY 3.0 with attribution.[19] |
| [Setting Position & Effect][15] | John Harper / One Seven Design, n.d. | Separate risk from result size; different fictional approaches create different positions and effects. | Open SRD: CC BY 3.0 with attribution.[19] |
| [Consequences & Harm][16] | John Harper / One Seven Design, n.d. | Consequences follow the fiction; a complication must not erase a successful result; retry normally needs a new approach or changed circumstance. | Open SRD: CC BY 3.0 with attribution.[19] |
| [Progress Clocks][17] | John Harper / One Seven Design, n.d. | Track complex obstacles or impending trouble, not a mandated method; clocks report fictional progress rather than dictate it. | Open SRD: CC BY 3.0 with attribution.[19] |
| [Gathering Information][18] | John Harper / One Seven Design, n.d. | Answer common knowledge directly, answer honestly, scale detail to effect, and make repeated investigation consume time or require opportunity. | Open SRD: CC BY 3.0 with attribution.[19] |
| [Blades in the Dark Licensing][19] | One Seven Design, n.d. | Confirms CC BY 3.0 for SRD text and excludes proprietary setting, NPC, map, and art content. | Open: CC BY 3.0; attribution required. |
| [Powered by the Apocalypse, Part 1][20] | Vincent Baker, 2019 | Mechanics exist to keep fictional action moving; the core loop is conversation, consequence, and renewed player action. | Cite-only; paraphrase. |
| [Invoking & Compelling Aspects][21] | Fate Core authors / Evil Hat, n.d. | Complications should grow from established aspects and be negotiated; the player remains responsible for what the PC says and does. | Open: CC BY 3.0 with attribution. |

### Story RPG / Narrative RPG

| Source | Author / year | Craft lesson for SynapticGM | License / citation note |
|---|---:|---|---|
| [Powered by the Apocalypse, Part 1][20] | Vincent Baker, 2019 | Fictional and mechanical causes must change each other; systems that enter play should change the future. | Cite-only; paraphrase. |
| [Blades SRD: The Basics][14] | John Harper / One Seven Design, n.d. | Give NPCs concrete desires and methods; follow consequence instead of prewriting the story. | Open SRD: CC BY 3.0 with attribution.[19] |
| [Progress Clocks][17] | John Harper / One Seven Design, n.d. | Make relationship, suspicion, obligation, and danger pressures legible over time. | Open SRD: CC BY 3.0 with attribution.[19] |
| [Gathering Information][18] | John Harper / One Seven Design, n.d. | Social inquiry can reveal intent, feeling, trust routes, and leverage without defaulting to violence. | Open SRD: CC BY 3.0 with attribution.[19] |
| [Invoking & Compelling Aspects][21] | Fate Core authors / Evil Hat, n.d. | Offer a character-linked complication, negotiate it, and never force a decision the player rejects as untrue to the PC. | Open: CC BY 3.0 with attribution. |
| [PbtA 201][22] | Aaron Marks, 2018 | Debts and Strings represent obligations or social capital that can be cashed into future pressure. | Cite-only; paraphrase. |
| [Best in Class Social Moves][23] | Paul Beakley, 2017 | Good social systems create reciprocal decisions, offers, costs, or changed influence instead of a one-roll mind-control result. | Cite-only; paraphrase. |
| [Conversation][8] | Emily Short, n.d. | Conversation state should change what an NPC says, wants, and permits; repeated topics should not restart the encounter. | Cite-only; paraphrase. |
| [Plotting for Interactivity: The Set-Piece or Crisis][7] | Emily Short, 2011 | In high-pressure dialogue, narrow to expressive choices and keep every exchange attached to the active stake. | Cite-only; paraphrase. |

### LitRPG / Progression

| Source | Author / year | Craft lesson for SynapticGM | License / citation note |
|---|---:|---|---|
| [Writing Progression Fantasy][24] | Andrew Rowe, 2019 | Advancement should feel earned through effort, risk, ingenuity, survival, or prepared catharsis; arbitrary growth weakens belief. | Cite-only; paraphrase. |
| [LitRPG: A Genre Spotlight][25] | Lucas Flint / Novelists, Inc., 2026 | Mechanics must affect decisions, conflict, worldbuilding, and plot; visible progression is causal, not decorative. | Cite-only; paraphrase. |
| [LitRPG Guide: What Makes a Good LitRPG][26] | Royal Road community thread, 2020 | Community criticism targets stats that never affect plot, power creep that destroys challenge, and leveling used in place of character growth. | Cite-only; community source; paraphrase cautiously. |
| [Guide: How to Make a LitRPG System][27] | Bluelightning42, 2022 | A System needs an in-world purpose; rewards should follow the behavior it is designed to encourage. | Cite-only; community source; paraphrase cautiously. |
| [By the Numbers][2] | Dan Fabulich, 2011 | Numerical state is useful when it changes later possibilities; a number with no later effect is not meaningful consequence. | Cite-only; cross-mode application. |
| [Important ChoiceScript Commands and Techniques][4] | Choice of Games, n.d. | Reused interactions can be hidden, disabled, or conditionally rewritten; a known inspection need not reopen unchanged. | Public documentation; cite-only. |
| [Powered by the Apocalypse, Part 1][20] | Vincent Baker, 2019 | Rules and fiction should alter one another; interface events should add momentum rather than interrupt it. | Cite-only; cross-mode application. |
| [Setting Position & Effect][15] | John Harper / One Seven Design, n.d. | Honest risk and outcome scale provide a model for rewards proportional to the established fictional approach. | Open SRD: CC BY 3.0 with attribution.[19] |
| [Consequences & Harm][16] | John Harper / One Seven Design, n.d. | Preserve successful results, attach coherent complications, and require a new approach after a lost opportunity. | Open SRD: CC BY 3.0 with attribution.[19] |
| [Progress Clocks][17] | John Harper / One Seven Design, n.d. | Progress display should reflect a complex fictional process and should be omitted when one action can resolve the matter. | Open SRD: CC BY 3.0 with attribution.[19] |

A 2026 IlorisNovel article on cutting LitRPG system messages appeared relevant in search but was blocked by a security checkpoint during verification. It is **not used for decisive claims**. A Level Up Publishing page was publicly visible but did not expose enough body text to the extractor; it is likewise omitted from the core evidence base.

## D2. Per-Mode Do / Don’t Constitution

### `litrpg` — Story Causes the System

A LitRPG turn should make the player feel the causal chain **action → changed world → earned receipt → next pressure**. The System confirms what happened; it does not replace the happening. Public LitRPG commentary consistently treats mechanics as meaningful only when they alter decisions or outcomes, while progression craft emphasizes earned rather than arbitrary growth.[24] [25] [27]

#### DO

1. **Resolve the action in prose first.** Put the visible consequence in the first two sentences; place XP, HP, skill, quest, or status receipts afterward.
2. **Advance one concrete beat.** Change position, access, opposition, knowledge, relationship, danger, or objective rather than paraphrasing the current room.
3. **Report only committed System changes.** Use code-owned values and exact deltas; if nothing changed, do not manufacture chrome.
4. **Make rewards answer “because of what?”** Tie every gain to an action, cost, risk, discovery, or completed objective the turn actually dramatized.
5. **Keep progression legible.** State the relevant delta and resulting total once; reserve full sheets for explicit requests or meaningful milestones.
6. **Use inspect-once behavior.** A repeated inspection yields a new angle, a short reminder, or an honest “nothing else here”—never the original essay.
7. **Offer approaches, not duplicate verbs.** Direct, diplomatic, and solitary choices must create different risks, witnesses, allies, or routes.
8. **Escalate by changing the obstacle.** Reinforcement, depletion, exposure, a new property, or a closing window creates novelty without inventing a map pin.
9. **Let progression change tactics.** A new ability should open or improve a future approach, not merely raise a number.
10. **End on actionable pressure.** The player should understand what changed and what materially different actions remain.

#### DON’T

1. **Do not recycle a prior beat, location essay, crisis line, or choice pad unless the player asked to repeat or restate.**
2. Do not lead with a status panel before the story consequence.
3. Do not award fake XP, HP, loot, quests, titles, or skills that the ledger did not commit.
4. Do not turn each attack into a per-hit combat log when one vivid exchange and one receipt will do.
5. Do not reprint the entire character sheet for a one-point change.
6. Do not explain the same cell, corridor, enemy, or item again because the player typed “inspect” twice.
7. Do not offer four versions of “inspect the same thing.”
8. Do not substitute “numbers went up” for changed capability, strategy, or character stakes.
9. Do not let the System editorialize over the emotional beat or narrate facts before the scene establishes them.
10. Do not recap the whole session when the turn needs to resolve one action.

#### Worked example

**Before — repetitive System-first turn**

> **SYSTEM:** You are in the Vesper-Glass cell. The walls are black glass. The door is sealed.  
> You inspect the walls again. They are black glass and cold. A pale rune flickers.  
> **Inspect the walls / Inspect the door / Inspect the cot / Keep searching**

**After — new evidence, honest receipt, distinct approaches**

> The cot’s iron foot leaves a silver scratch where the “glass” flakes away, exposing salt-packed brick beneath. The ward on the door brightens in answer: damaging the wall is feeding it.  
> **INSIGHT CONFIRMED:** Salt-brick lining; no XP or HP change.  
> **Direct:** Break through before the ward peaks. **Diplomatic:** Call the pact-keeper and trade the discovery. **Solitary:** Jam the cot pin into the ward and test whether it can be grounded.

#### AUTHORITY candidates (≤240 characters)

1. **Recommended:** Resolve the story beat first; then report only earned, ledger-backed System changes, and make repeat inspection yield a new fact, a brief reminder, or honest exhaustion—never the same essay.
2. Story causes System: dramatize the committed outcome, show only relevant deltas, and let every gain change a later option, tactic, or cost.
3. Give one new concrete consequence per turn; do not lead with stat chrome, fake rewards, full-sheet recaps, or multiple Inspect choices aimed at the same unchanged target.

### `dnd` — Fair Situation, Consequence, Spotlight

Tabletop prose is not a chapter of a novel. It is the GM’s next contribution to a conversation. The turn portrays the current situation, honors the declared action and ruling, applies a consequence that follows from the fiction, and gives control back. Situation-based prep and open SRD guidance both reject predetermined event chains in favor of opportunities and consequences shaped by player action.[12] [14] [16] [20]

#### DO

1. **State the changed situation immediately.** Put the action’s result, new danger, or revealed opportunity in the first two sentences.
2. **Honor the declared approach.** Investigation, positioning, negotiation, retreat, and force should produce different information, risk, and effect.
3. **Let success stand.** A complication may add cost or danger, but it must not quietly cancel the successful result.[16]
4. **Fail forward when repetition would stall play.** Reveal partial information, impose time, worsen position, consume a resource, or open a harder route.
5. **Make rulings legible and proportionate.** Connect outcome severity to established risk, opposition, leverage, and effect.
6. **Give robust information.** Answer common knowledge directly and allow multiple valid routes around investigation chokepoints.[13] [18]
7. **Share spotlight.** Address the character who acted, then surface another PC’s immediate opening when group context exists.
8. **Give NPCs a desire and a method.** Their next line or move pursues something; it is not filler lore.
9. **Offer distinct tactical futures.** Investigate, position, talk, and disengage must change different parts of the situation.
10. **Return the floor quickly.** After the consequence and essential receipt, ask what the player does.

#### DON’T

1. **Do not recycle a prior beat, location essay, crisis line, or choice pad unless the player asked to repeat or restate.**
2. Do not write boxed-text paragraphs after the player has already entered and understood the place.
3. Do not narrate the PC’s unchosen speech, thoughts, plan, fear, or loyalty.
4. Do not bend every action back to a prewritten scene or “correct” route.
5. Do not hide the only necessary clue behind one roll, one noun, or one exact command.
6. Do not negate a successful roll with a complication that produces the same state as failure.
7. Do not answer creative noncombat play with an automatic combat encounter.
8. Do not allow identical retries in an unchanged situation; require a new approach or change the circumstances.
9. Do not let an NPC lecture when one motive-bearing sentence and an action would move play.
10. Do not import named settings, monsters, lore, or characters from licensed worlds.

#### Worked example

**Before — boxed text and railroad**

> You enter the Cursed Keep. Ancient stones rise around you, covered in moss. The grand hall is dark and foreboding. Captain Sera tells you the keep is cursed and that you must go to the west tower. What do you do?

**After — ruling, consequence, and several viable avenues**

> Your wedge holds the portcullis high enough for everyone to crawl under, but its iron teeth crush the lantern; the hall beyond is now dark, and bootsteps have stopped behind the west door. Captain Sera points to chalk dust under that door while Orren spots a servant stair climbing above it.  
> You can **investigate** the chalk, **position** above the door, **talk** through it, or **disengage** before whoever heard the gate arrives. What do you do?

#### AUTHORITY candidates (≤240 characters)

1. **Recommended:** Portray the changed situation, honor the declared action and fair ruling, let success stand with fiction-led consequences, share spotlight, then ask what the player does.
2. Run a game, not a novel: present circumstances and honest stakes, follow player action wherever it leads, and make retries require a new approach or changed situation.
3. Each tabletop turn resolves one ruling, changes risk or opportunity, gives needed information without a single-clue choke, and returns the floor before boxed text takes over.

### `rpg` — Leverage Changes Relationships

Story RPG turns use external pressure—debts, promises, loyalties, secrets, status, and incompatible needs—to make relationships move. Relationship state is useful when it changes what someone can ask, refuse, risk, or forgive. Fate’s open rules explicitly preserve the player’s authority over the PC’s decisions, while public PbtA commentary treats Strings, Debts, and Influence as spendable social pressure rather than permission for the GM to dictate inner life.[21] [22] [23]

#### DO

1. **Lead with a relational consequence.** Show whose trust, obligation, fear, loyalty, or standing changed because of the player’s last action.
2. **Use established leverage.** Bring back a promise, debt, secret, witness, shared loss, or conflicting allegiance already present in play.
3. **Change the NPC’s tactic.** Let them bargain, withdraw, expose, flatter, threaten, recruit, or concede instead of repeating their opening speech.
4. **Create moral pressure from incompatible goods.** Protecting one person should risk another value, bond, or future—not merely add “bad points.”
5. **Make social choices produce different futures.** Leverage, mercy, honesty, and distance should alter relationships or access in distinct ways.
6. **Preserve player interiority.** Describe what the PC perceives and what others demand; ask how the PC feels or responds.
7. **Give noncombat actions full consequence.** A concession, public refusal, confidence, or revealed secret can end or transform a scene.
8. **Let prior choices accumulate.** Relationships should remember patterns, not reset to neutral at each encounter.
9. **Use questions surgically.** Ask for a commitment, interpretation, boundary, or priority the prose cannot own.
10. **End with pressure, not commentary.** Put the next relationship-changing decision in the player’s hands.

#### DON’T

1. **Do not recycle a prior beat, location essay, crisis line, or choice pad unless the player asked to repeat or restate.**
2. Do not state what the PC thinks, feels, forgives, fears, wants, or decides.
3. Do not default a tense conversation to combat when leverage or refusal can change the future.
4. Do not turn morality into a visible karma meter or label one option “good” and another “evil.”
5. Do not repeat an NPC’s first speech; advance their tactic, summarize on request, or close the topic.
6. Do not offer “agree / disagree / ask for more information” when each returns to the same relationship state.
7. Do not make social success equal mind control; the NPC may concede with a price, boundary, or later consequence.
8. Do not pause an urgent exchange for a stranger’s biography or setting lecture.
9. Do not invent leverage the player never earned or erase leverage the ledger records.
10. Do not resolve the PC’s moral dilemma on the player’s behalf.

#### Worked example

**Before — lecture, repeated topic, stolen feeling**

> Mara of Thornferry again explains that the Salt Road council abandoned her village. You feel ashamed because she is right. She asks again whether you will help.  
> **Agree / Refuse / Ask why the council did it**

**After — leverage, changed tactic, player-owned choice**

> Mara stops asking for sympathy and lays your sealed council pass on the table. “Get the medicine cart through tonight, and I keep quiet about who opened the Cape District gate.” Outside, the council bell calls your younger brother’s watch to inspection.  
> Do you **spend the pass and owe your brother an explanation**, **trade Mara the patrol route for her silence**, or **refuse and let her take the secret public**?

#### AUTHORITY candidates (≤240 characters)

1. **Recommended:** Advance one relationship through leverage, loyalty, or moral cost; change the NPC’s tactic, preserve the player’s interiority, and leave at least two socially distinct futures.
2. Put pressure on promises, debts, secrets, and loyalties—not on a karma meter; describe demands and consequences, but let the player decide what the PC feels and does.
3. Every social turn must change trust, obligation, access, or exposure; an NPC who stays must pursue a new tactic rather than repeat the first speech.

### `pyoa` — Resolve, Lock, Fork

PYOA is page-local: the selected option resolves, the branch records what it opened and closed, the immediate crisis changes, and a small set of distinct futures appears. Branches may rejoin, but prior state must alter later text, access, difficulty, relationships, or endings; otherwise the rejoin erases the choice.[1] [2] [4] [6]

#### DO

1. **Resolve the selected option first.** The opening sentence should show what happened because the player chose it.
2. **Lock the branch honestly.** Name or dramatize what route, alliance, resource, timing window, or ending condition just closed.
3. **Change the page-local crisis.** Each turn advances danger, knowledge, position, relationship, or commitment.
4. **Offer two to four distinct futures.** Each option should differ in objective, method, cost, ally, risk, or moral posture.
5. **Use parallel choice grammar.** Write all labels as comparable actions, lines of speech, or stances; do not mix spoilers, vague emotions, and commands.
6. **Signal the intended action, not the guaranteed result.** Give enough information for judgment while preserving uncertainty.[5] [11]
7. **Carry delayed consequence.** Let an earlier choice alter a later test, available option, reaction, cost, or ending.[2]
8. **Narrow during crises.** Use fewer, more expressive options tied to the active stake; postpone optional lore and exhaustive exploration.[7]
9. **Know the ending condition.** A locked crisis must move toward success, failure, transformation, or a new chapter—not indefinite postponement.
10. **Make continuation new.** “Keep searching” reveals a new concrete detail, incurs cost, changes danger, or reports honest exhaustion.

#### DON’T

1. **Do not recycle a prior beat, location essay, crisis line, or choice pad unless the player asked to repeat or restate.**
2. Do not offer four paraphrases of the same path.
3. Do not let the player immediately reopen the route the previous choice locked.
4. Do not run a Wait-Wait-Wait sequence in which each “choice” merely delays the unchanged crisis.
5. Do not reprint the crisis paragraph before every fork.
6. Do not use “inspect / examine / look closer / keep searching” as four options aimed at one unchanged target.
7. Do not merge branches into identical prose without a state-sensitive callback, cost, access change, or later payoff.
8. Do not add a “buy time” pad after the player has made the decisive commitment; deliver the consequence.
9. Do not hide all relevant risk behind trick wording or arbitrary door choices.
10. Do not postpone endings forever; close the branch when its central question has been answered.

#### Worked example

**Before — Wait-Wait-Wait crisis loop**

> The Vesper-Glass bridge is collapsing. You wait as another crack races under your feet. The bridge is still collapsing.  
> **Wait for the guard / Call for help / Watch the crack / Buy time**

**After — resolved fork, locked route, new crisis**

> You cut the pack loose; it vanishes into the gulf, but the lighter span jerks high enough for you to reach the Thornferry side. The bridge route is gone behind you, and the guard who could identify you is stranded across the gap.  
> **Run to the bell tower before he signals.** **Hide among the salt carts and lose time.** **Call across and bargain for his silence.**

#### AUTHORITY candidates (≤240 characters)

1. **Recommended:** Resolve the chosen fork, lock what it closed, change the page-local crisis, then offer 2–4 choices that lead to distinct futures—never four phrasings of the same delay.
2. Each PYOA turn pays off the last choice, carries one delayed consequence, and ends on a real fork distinguished by objective, method, cost, ally, or moral stance.
3. No Wait-Wait-Wait: after commitment, deliver consequence; if branches rejoin, preserve the choice through changed text, access, difficulty, relationship, resource, or ending.

## D3. Choice Grammar

A **real fork** does not require permanently separate content. It requires a difference the player can later feel. Branch-and-bottleneck is valid when state preserves the effect of earlier decisions; delayed branching is valid when an earlier choice changes a later test; a fake choice is a presentation difference with no consequential difference.[1] [2]

| Pattern | Definition | Acceptable use | Reject when | SynapticGM example |
|---|---|---|---|---|
| **Real fork** | Options produce different immediate outcomes or durable state. | Paths may later rejoin if text, access, cost, relationship, risk, or ending remains different. | The next turn is identical and no stored consequence can matter. | **Warn Thornferry** preserves trust but alerts the smuggler; **shadow the smuggler** preserves surprise but risks the village. |
| **Delayed consequence** | Options share a near-term chapter but alter a later test or payoff. | Use to control branch growth while honoring earlier expression. | The stored choice never changes later prose, options, difficulty, relationships, or outcomes. | Sparing a Salt Road scout later opens a safe ford; humiliating him makes the ford an ambush. |
| **Reflective choice** | The event is fixed, but the player controls stance, interpretation, or relationship response. | Use sparingly for player-authored characterization. | Every option produces the same stance and nobody remembers it. | After the Keep falls: **mourn the cost / claim the victory / refuse the council’s praise**. |
| **Fake choice** | Different labels lead to the same outcome with no meaningful state difference. | Only as an explicitly cosmetic expression beat whose expression is later acknowledged. | Presented as tactical or moral agency but immediately erased. | **Charge left / charge right / charge shouting / charge silently**, followed by the same paragraph. |
| **Delay-the-same-crisis** | Options consume a turn but neither resolve nor transform the active threat. | Almost never; one deliberate breath may be valid if it creates a concrete preparation or cost. | The same danger sentence and same option pad return. | **Wait / watch / listen / buy time** while the same bridge keeps collapsing. |
| **Branch lock** | A commitment closes a route, alliance, resource, timing window, or ending family. | State the closure through consequence, not a meta lecture. | A later generic pad silently offers the closed route again. | Cutting the pack saves the hero but permanently loses the Vesper-Glass key. |
| **Exhaustible inquiry** | A topic or object has a finite set of meaningful revelations. | After exhaustion, summarize known facts or say no more is available. | Repeated inspection replays the first description. | First search finds salt dust; second angle finds the draft; third reports no further clue without tools. |

### Mode-specific option sets

| Mode | Grammar of a strong option set | Weak pad | Strong pad |
|---|---|---|---|
| `pyoa` | Distinct futures separated by **objective, cost, allegiance, or ending direction**. | Wait / keep waiting / watch / buy time. | Cut the pack and jump / retreat into the Keep / bargain with the far guard. |
| `dnd` | Distinct procedures with different **risk, information, position, or exposure**. | Check the door / inspect the door / look closer / listen more. | Study the chalk / take the high stair / parley through the door / withdraw before patrol. |
| `rpg` | Distinct social futures through **leverage, moral cost, or relationship stance**. | Agree / disagree / ask again. | Spend the favor / tell the painful truth / protect the rival / let the secret go public. |
| `litrpg` | Distinct play styles: **Direct, Diplomatic, Solitary** or equivalent, each using different assets and creating different receipts. | Inspect wall / inspect rune / inspect cot / keep searching. | Break through and feed the ward / trade the clue to the pact-keeper / ground the ward alone. |

Choice labels should use parallel syntax. If one label is an imperative action, all should be actions. If one quotes exact speech, the rest should be comparable spoken lines. Labels should describe what the player is choosing, not promise a hidden result. During a crisis, narrow the menu to the active stake and make the consequences of inaction part of the scene rather than a reusable “wait” button.[5] [7]

## D4. Turn Shape: One Beat

The **value floor** is not a word count. It is the minimum change that makes the turn worth existing: one committed outcome, one new concrete consequence, and one actionable next state. “Do not novelize” means remove recaps, redundant atmosphere, internal monologue assigned to the PC, and unearned exposition—not remove the detail needed to understand stakes.

| Mode | Five-line maximum reply skeleton |
|---|---|
| `litrpg` | 1. **Sentence 1:** Resolve the player’s action in sensory, causal prose.  2. **Sentence 2:** State the changed obstacle, opportunity, or stake.  3. Add only the relevant **System/STATUS receipt** from committed facts.  4. Surface one fresh pressure or earned capability.  5. Ask for action or present distinct approach choices. |
| `dnd` | 1. **Sentence 1:** Give the ruling and visible outcome.  2. **Sentence 2:** Give the fiction-led cost, complication, clue, or opening.  3. Add a short dice/rule receipt only if needed.  4. Surface another character’s opening or the opposition’s next motion.  5. “What do you do?” |
| `rpg` | 1. **Sentence 1:** Show how the last choice changed trust, obligation, access, or exposure.  2. **Sentence 2:** Show the NPC’s new tactic or the moral cost now due.  3. Add a ledger-backed relationship/clock receipt only if the mode exposes it.  4. Present at least two socially distinct futures.  5. Ask what the PC says or does; never answer how they feel. |
| `pyoa` | 1. **Sentence 1:** Pay off the selected option.  2. **Sentence 2:** Lock the closed route and transform the local crisis.  3. Add one brief consequence callback or ending signal.  4. Offer 2–4 parallel, distinct choices.  5. Omit a generic “continue” if the page already contains a real fork. |

**Placement rule:** story consequence belongs in the first two sentences. System chrome, STATUS, and dice receipts belong **after** the reader understands what physically or socially happened. The one exception is an explicitly requested status-only query, where the player has asked for the receipt itself.

## D5. Anti-Repetition Craft: Write the Delta

The writer should not treat anti-repetition as a synonym ban. Replacing “cold corridor” with “chilly passage” while replaying the same beat is still repetition. The governing question is: **What is true now that was not true at the end of the previous turn?** A valid turn supplies a delta in action, knowledge, position, cost, relationship, threat, access, or closure.

Emily Short’s conversation guidance supports concise reminders and context-sensitive reactions when players revisit information. ChoiceScript’s reuse controls supply a technical analogue: a used option can disappear, disable, or expose conditional content rather than remain an endlessly renewable first encounter.[4] [8]

| Player situation | Correct writer move | Incorrect move | Minimal acceptable output |
|---|---|---|---|
| Player says, “Say that again,” “Recap,” or asks what an NPC said. | Restate faithfully, preferably shorter; preserve essential wording when precision matters. | Invent a different answer to avoid surface similarity. | “Mara’s warning, in brief: the council cart leaves at dusk, and the east seal is false.” |
| Player repeats the same question without explicitly requesting a recap. | Let the NPC recognize the repeat, summarize the known answer, and change tactic or close the topic. | Reprint the first speech as if the conversation reset. | “Mara taps the seal. ‘That is still the answer.’ She now asks what you will offer for the route.” |
| Player keeps searching the same room. | Reveal a genuinely new angle if one remains; otherwise state honest exhaustion and the condition needed for more. | Redress the original room description with synonyms or drip one obvious noun per turn. | “You find no second exit. Without moving the salt-brick or bringing light, this room has yielded what it can.” |
| Player keeps walking through the same mapped area. | Advance time, exposure, fatigue, sound, weather, pursuit, or a local landmark without inventing a new map pin. | Describe the same road and horizon again. | “The road does not fork, but cart ruts vanish under fresh ash; someone passed after the rain.” |
| Player remains in one location after a resolved beat. | Change the location’s **state**, not its identity: light fails, guards arrive, water rises, witnesses leave, access closes. | Reintroduce the location from scratch. | “The Cape District gate is still shut; now the queue has heard your name, and the clerk lowers the speaking grille.” |
| Player continues an NPC encounter. | Advance the NPC’s **tactic**: explain → bargain → warn → expose → withdraw, according to motive and prior response. | Repeat biography, grievance, or greeting. | “When apology fails, Sera stops arguing and offers the key in exchange for your public testimony.” |
| PYOA crisis remains active. | Resolve or transform the last choice, advance the danger, close a route, and offer a smaller, sharper fork. | Reprint the crisis and append “What do you do?” | “The west cable snaps; retreat is gone. Jump to the cart or cut the east brace and drop with the span.” |
| LitRPG inspection targets a known object. | Give a new property, a concise known-fact reminder, or honest exhaustion; show a receipt only if state changed. | Print the same item card, lore paragraph, or full status screen. | “Known: warded iron, keyed to salt. New: the hinge has no ward. **No stat change.**” |

### When restatement is correct

Restatement is correct when the player **asks for restatement**, when accessibility or memory support requires recovery of essential information, when exact terms are needed for a decision, or when a recap is the player’s requested action. The writer should not punish the player for failing to take notes. A recap may be shorter than the original and should be labeled naturally as remembered or summarized information. It must not pretend the world advanced.

### When continuation must still be new

“Keep searching,” “keep walking,” “continue talking,” and “wait a little longer” are requests to continue an activity, not requests to receive the previous response again. The next turn therefore needs one of four honest outcomes: **new discovery, changed cost, changed external situation, or exhaustion**. If none is supported, say so concisely and ask for a different approach. This is compatible with fair tabletop retry logic: after a lost opportunity, another attempt normally requires a new method or changed circumstance.[16]

### Advancing a location without a new map pin

A location advances through **state**, not only through geography. Change who is present, what can be heard, what is open, what is threatened, how much time remains, what has been consumed, what evidence has become visible, or how an NPC now interprets the player. A corridor can support several turns if each turn changes a real variable; it becomes repetitive when the prose keeps repainting the corridor instead.

### Keeping an NPC without repeating the first speech

Give every recurring NPC a current **goal**, **tactic**, and **threshold**. The first speech may explain; the next should bargain, test, warn, recruit, expose, concede, or leave. If the player requests the old information, summarize it and then return to the NPC’s current tactic. Relationship pressure is strongest when an established debt, secret, or loyalty changes what the NPC can credibly demand.[8] [14] [22]

### Keeping a PYOA crisis hot

A hot crisis is not a paragraph repeated at higher volume. It is a sequence of shrinking or changing affordances. Each turn should remove one safe assumption, close one route, reveal one cost, or force one commitment. Use familiar actions, few expressive options, and a known ending condition; do not introduce a tutorial, lore dump, or neutral “buy time” option after the branch is locked.[7]

## D6. Ranked Writing-Only Anti-Patterns

The ranking reflects product evidence in the commission, likely impact on player agency, and the ease with which a lightweight writer can fall into a locally fluent but structurally unchanged response. It is a craft triage list, not an engineering detector specification.

| Rank | Anti-pattern | Human-editor rejection criterion | Required repair |
|---:|---|---|---|
| 1 | **Prior-beat replay** | The turn restates the same action, outcome, and situation with no new delta, absent an explicit recap request. | Resolve a new consequence, add a supported discovery, change state, or report exhaustion. |
| 2 | **Crisis reprint** | The opening reproduces the same danger and stakes while the crisis remains unchanged. | Begin with the result of the last choice and transform the danger or available routes. |
| 3 | **Choice-pad paraphrase** | Two or more options share the same objective, method, cost, and likely future. | Separate choices by objective, tactic, ally, risk, cost, or moral stance. |
| 4 | **Inspect drip** | An obvious description is split across repeated inspections, or each inspection reprints the known object. | Front-load decision-relevant facts; follow with a new angle, condition, or honest exhaustion. |
| 5 | **Wait-Wait-Wait** | A turn consumes player input but merely delays the same event, then returns the same pad. | Make time purchase a concrete preparation at a cost, or deliver the crisis consequence. |
| 6 | **NPC first-speech loop** | A returning NPC repeats their greeting, grievance, lore, or offer as though prior dialogue never occurred. | Summarize known information and advance goal, tactic, relationship, or threshold. |
| 7 | **Stranger lecture** | A new NPC delivers biography or setting lore before pursuing an immediate desire. | Give one motive-bearing line and an action; move optional history outside the urgent beat. |
| 8 | **System-chrome takeover** | LitRPG status, XP, or skill text appears before the fictional outcome or occupies more attention than the changed story. | Put prose first; show only relevant, committed deltas afterward. |
| 9 | **Unearned or fake progression** | A reward lacks a committed ledger value or has no causal basis in action, risk, cost, or objective. | Remove it or tie the exact receipt to a resolved, eligible accomplishment. |
| 10 | **Branch amnesia** | A closed PYOA route, spent resource, broken alliance, or prior choice silently returns unchanged. | Lock the branch deterministically and make the reopened option conditional on a new event. |
| 11 | **Success negation** | A purported success plus complication leaves the player in the same or worse state as outright failure and erases the achieved goal. | Preserve the success; attach a separate cost, danger, reduced effect, or new threat.[16] |
| 12 | **Stolen PC interiority** | The prose declares the PC’s feelings, beliefs, intentions, speech, forgiveness, or moral conclusion without player input. | Describe perception and pressure; ask the player for the PC’s response. |
| 13 | **Combat-default resolution** | A social, investigative, or traversal problem becomes combat despite viable leverage, information, positioning, or retreat. | Present at least one mode-valid noncombat future with real consequence. |
| 14 | **Decorative choice/state** | A choice, stat, relationship, or clock changes cosmetically but never alters text, access, risk, cost, or outcome. | Give the state a later test or remove it from the foreground.[2] [17] [25] |
| 15 | **Ending avoidance** | A PYOA branch repeatedly adds hooks or delay pads after its central question is resolved. | Deliver an ending, transformation, or explicit transition to a new chapter-level question. |

> **Editorial reject rule:** If deleting the player’s last input would leave the reply substantially unchanged, reject the turn unless the player explicitly requested a recap or status-only response.

## D7. Thinning Map: Prompt, Ledger, or Research-Only

**Disposition meanings:** **AUTHORITY (folded)** means the rule is represented inside the single recommended sentence for that mode, not added as another sentence. **LEDGER / EVAL** means deterministic state or offline evaluation should carry the rule. **DROP FROM LIVE PROMPT** means the rule remains in this human guide but should not consume live prompt budget, often because current rails already own it or it is derivable from the mode sentence.

### `litrpg` thinning map

| Rule | Disposition | Why |
|---|---|---|
| L-DO-01 Resolve action in prose first. | **AUTHORITY (folded)** | Primary mode discriminator: “Resolve the story beat first.” |
| L-DO-02 Advance one concrete beat. | **EVAL** | Judge the turn delta across transcripts; do not add a second prompt sentence. |
| L-DO-03 Report only committed System changes. | **AUTHORITY + existing ledger** | “Ledger-backed” belongs in the one line; code supplies the values. |
| L-DO-04 Tie rewards to action, cost, or risk. | **LEDGER / EVAL** | Eligibility and causal receipt should be deterministic and tested. |
| L-DO-05 State only relevant deltas once. | **DROP FROM LIVE PROMPT** | Covered by “report only … changes” and existing prose rails. |
| L-DO-06 Inspect once; then new fact, reminder, or exhaustion. | **AUTHORITY + ledger** | Core repetition failure; the one line names all three valid dispositions. |
| L-DO-07 Offer distinct approaches. | **LEDGER / EVAL** | `ChoiceCompiler` and option-diversity systems already own structure. |
| L-DO-08 Escalate by changing the obstacle. | **DROP FROM LIVE PROMPT** | Human craft explanation of “new fact / changed beat.” |
| L-DO-09 Let progression change tactics. | **EVAL** | Long-horizon quality gate, not reliable as a per-turn mandate. |
| L-DO-10 End on actionable pressure. | **DROP FROM LIVE PROMPT** | Existing one-beat and reply rails cover handoff. |
| L-DONT-01 Never recycle unless asked. | **AUTHORITY (folded)** | Expressed by “never the same essay”; global rail remains authoritative. |
| L-DONT-02 Do not lead with status. | **AUTHORITY (folded)** | Direct inverse of “story beat first.” |
| L-DONT-03 Do not invent rewards or values. | **Existing ledger** | Code already owns XP, HP, quests, inventory, and facts. |
| L-DONT-04 Do not spam per-hit logs. | **EVAL** | Style failure best measured offline. |
| L-DONT-05 Do not reprint full sheet for a delta. | **EVAL** | Transcript-level chrome ratio. |
| L-DONT-06 Do not repeat inspections. | **AUTHORITY + ledger** | Main LitRPG failure and recommended deterministic addition. |
| L-DONT-07 Do not offer duplicate Inspect options. | **Existing ledger / eval** | Choice diversity and exhaustion already partly enforced. |
| L-DONT-08 Numbers are not character or tactical growth. | **DROP FROM LIVE PROMPT** | Research rationale; too abstract for Flash Lite. |
| L-DONT-09 System does not overrule the scene. | **DROP FROM LIVE PROMPT** | Implied by story-first causal order. |
| L-DONT-10 Do not recap the session. | **Existing prose rail / eval** | General brevity and no-recycle policy already cover it. |

### `dnd` thinning map

| Rule | Disposition | Why |
|---|---|---|
| D-DO-01 State the changed situation immediately. | **AUTHORITY (folded)** | “Portray the changed situation” is the mode-line opening. |
| D-DO-02 Honor the declared approach. | **AUTHORITY (folded)** | Essential tabletop agency signal. |
| D-DO-03 Let success stand. | **AUTHORITY (folded)** | High-value fail-forward discriminator. |
| D-DO-04 Fail forward rather than stall. | **EVAL** | Best assessed against action/result pairs and repeated checks. |
| D-DO-05 Make rulings proportionate. | **AUTHORITY (folded)** | Encoded by “fair ruling” and fiction-led consequence. |
| D-DO-06 Give robust information. | **LEDGER / EVAL** | Track revealed clues; evaluate chokepoints offline. |
| D-DO-07 Share spotlight. | **AUTHORITY (folded)** | Explicitly requested flagship feel. |
| D-DO-08 Give NPCs desire and method. | **NPC ledger** | Persist motive and current tactic rather than reprompt it every turn. |
| D-DO-09 Offer investigate/position/talk/disengage futures. | **Choice ledger / eval** | Structural diversity belongs with `ChoiceCompiler`. |
| D-DO-10 Return the floor quickly. | **AUTHORITY (folded)** | “Then ask what the player does.” |
| D-DONT-01 Never recycle unless asked. | **Existing global AUTHORITY / eval** | Already shipped globally; do not duplicate long wording. |
| D-DONT-02 Do not write boxed-text dumps. | **EVAL** | Measure turn length and whether text precedes actionable change. |
| D-DONT-03 Do not steal PC speech or interiority. | **DROP FROM LIVE PROMPT** | Important shared guide rule; add only if current voice rails lack it. |
| D-DONT-04 Do not railroad to a prewritten route. | **DROP FROM LIVE PROMPT** | Derivable from honoring action and fair consequences. |
| D-DONT-05 No single-clue chokepoint. | **Clue ledger / eval** | Requires scenario-level state, not per-turn prose burden. |
| D-DONT-06 Do not negate success with complication. | **AUTHORITY (folded)** | Encoded by “let success stand.” |
| D-DONT-07 Do not default to combat. | **EVAL** | Transcript-level mode-correctness gate. |
| D-DONT-08 Do not permit unchanged identical retries. | **LEDGER / eval** | Requires action fingerprint and changed-circumstance state. |
| D-DONT-09 Do not let NPCs lecture. | **NPC ledger / eval** | Tactic progression plus editor gate is more reliable. |
| D-DONT-10 Do not import licensed setting IP. | **Existing global rail** | Product-wide safety/setting authority, not new craft prompt. |

### `rpg` thinning map

| Rule | Disposition | Why |
|---|---|---|
| R-DO-01 Lead with relational consequence. | **AUTHORITY (folded)** | “Advance one relationship” defines the mode. |
| R-DO-02 Use established leverage. | **AUTHORITY + relationship ledger** | The mode line names leverage; ledger proves it exists. |
| R-DO-03 Change the NPC’s tactic. | **AUTHORITY + NPC ledger** | Direct answer to repeated dialogue. |
| R-DO-04 Build moral pressure from incompatible goods. | **AUTHORITY (folded)** | “Loyalty or moral cost” keeps pressure non-numeric. |
| R-DO-05 Offer socially distinct futures. | **AUTHORITY + choice eval** | The line sets the target; evaluator checks distinction. |
| R-DO-06 Preserve player interiority. | **AUTHORITY (folded)** | Critical agency boundary. |
| R-DO-07 Give noncombat actions full consequence. | **EVAL** | Transcript-level comparison of social and combat outcomes. |
| R-DO-08 Let prior choices accumulate. | **Relationship ledger** | Persistence is deterministic state, not repeated prose instruction. |
| R-DO-09 Ask a surgical commitment question. | **DROP FROM LIVE PROMPT** | Craft implementation of preserved interiority and handoff. |
| R-DO-10 End with pressure. | **DROP FROM LIVE PROMPT** | Existing one-beat rail plus distinct futures covers it. |
| R-DONT-01 Never recycle unless asked. | **Existing global AUTHORITY / eval** | Keep one shared hard rule; do not restack it. |
| R-DONT-02 Do not state PC thoughts or feelings. | **AUTHORITY (folded)** | Expressed as “preserve the player’s interiority.” |
| R-DONT-03 Do not default tension to combat. | **EVAL** | Mode-level behavior across the transcript. |
| R-DONT-04 Do not use a karma meter. | **Existing mode config / eval** | Prohibit as a feature/state choice, not live prose clutter. |
| R-DONT-05 Do not repeat the NPC’s first speech. | **AUTHORITY + NPC ledger** | Current tactic is the deterministic prevention. |
| R-DONT-06 Do not offer same-state social options. | **Choice eval** | Outcome-distance test belongs with choice compilation/evaluation. |
| R-DONT-07 Social success is not mind control. | **EVAL** | Judge NPC boundary, cost, and credible reaction. |
| R-DONT-08 Do not pause for biography. | **EVAL** | Human/critic style gate. |
| R-DONT-09 Do not invent or erase leverage. | **Relationship ledger** | Code-owned fact. |
| R-DONT-10 Do not resolve the moral dilemma. | **AUTHORITY (folded)** | Follows preservation of player interiority. |

### `pyoa` thinning map

| Rule | Disposition | Why |
|---|---|---|
| P-DO-01 Resolve the selected option first. | **AUTHORITY (folded)** | Opens the recommended mode line. |
| P-DO-02 Lock what the choice closed. | **AUTHORITY + branch ledger** | The prompt requests it; deterministic state preserves it. |
| P-DO-03 Change the page-local crisis. | **AUTHORITY + crisis-delta ledger** | Direct fix for Wait-Wait-Wait. |
| P-DO-04 Offer two to four distinct futures. | **AUTHORITY + choice eval** | Concise and measurable. |
| P-DO-05 Use parallel choice grammar. | **Choice compiler / eval** | Structural formatting belongs outside live prose authority. |
| P-DO-06 Signal action, not guaranteed result. | **DROP FROM LIVE PROMPT** | Human craft nuance; evaluate choice-text quality offline. |
| P-DO-07 Carry delayed consequence. | **Branch/state ledger** | Persistence requirement, not per-turn reminder. |
| P-DO-08 Narrow during crises. | **Choice compiler / eval** | Page-local choice count and topicality are measurable. |
| P-DO-09 Know the ending condition. | **Branch ledger / eval** | Store branch question/state; check closure across turns. |
| P-DO-10 Make continuation new. | **Crisis/inspection ledger** | New delta or exhaustion must be tracked. |
| P-DONT-01 Never recycle unless asked. | **Existing global AUTHORITY / eval** | Keep global hard rule; mode line adds specific anti-delay wording. |
| P-DONT-02 Do not offer four paraphrases. | **AUTHORITY + choice eval** | Expressed by “distinct futures—never four phrasings.” |
| P-DONT-03 Do not reopen a locked route. | **Branch ledger** | Deterministic branch state. |
| P-DONT-04 No Wait-Wait-Wait. | **AUTHORITY + crisis-delta ledger** | Primary PYOA defect. |
| P-DONT-05 Do not reprint the crisis paragraph. | **Existing clone detector / eval** | Already partly enforced; keep as evaluation criterion. |
| P-DONT-06 No four-way inspect loop. | **Choice compiler / exhaustion ledger** | Existing diversity plus known-inspection disposition. |
| P-DONT-07 Do not merge without preserved state. | **Branch ledger / eval** | Rejoin is valid only when state remains consequential. |
| P-DONT-08 No buy-time pad after lock. | **AUTHORITY (folded) / eval** | Covered by resolving and changing the crisis. |
| P-DONT-09 Do not use arbitrary/trick choices. | **EVAL** | Requires human/critic judgment about decision information. |
| P-DONT-10 Do not postpone endings forever. | **Branch ledger / eval** | Track central question and closure threshold. |

### Prompt-diet decision

The thinning exercise does **not** yield eighty live rules. It yields exactly **four new mode sentences**, with existing global anti-recycle authority left in place. The rest belongs in code-owned state, the evaluator, or this human-facing guide. That is the core lesson from the prior mandate-pile failure: **prompt prose defines the mode’s decision grammar; ledgers preserve facts and exhaustion; evaluation catches style drift.**

## D8. Implementation Backlog

The standalone CSV is delivered as `SynapticGM_story_craft_guides_2026-08-30_backlog.csv`. The table below mirrors it for research review.

| ID | Mode | Priority | Owner | Effort | Depends on | Acceptance test |
|---|---|---|---|---|---|---|
| SC-001 | all | P0 | prompt | S | Existing AUTHORITY assembly | Exactly one new sentence is injected for each saved mode key; four total; no WOF or Mid-writer changes. |
| SC-002 | `pyoa` | P0 | ledger | M | `ChoiceCompiler` | After a decisive fork closes a route, it stays absent for five turns unless a new ledger event explicitly reopens it. |
| SC-003 | `pyoa` | P0 | ledger | M | `BeatContract` | Every crisis turn records a delta in danger, access, position, cost, knowledge, or commitment; unchanged crisis cannot emit another wait pad. |
| SC-004 | `litrpg` | P0 | ledger | M | Existing inspect exhaustion | Repeat inspection selects one disposition: new supported fact, concise reminder, or honest exhaustion; never the initial full description. |
| SC-005 | `rpg` | P0 | ledger | M | NPC role memory | Continuing NPC topic stores goal, tactic, and threshold; second exchange cannot reuse the first speech unless recap intent is true. |
| SC-006 | all | P0 | eval | M | Existing option diversity | Every option pair differs in objective, method, ally, risk, cost, relationship, or ending direction. |
| SC-007 | `litrpg` | P0 | eval | S | SC-001 | On action turns with System output, the first two sentences describe the fictional result; receipts follow. |
| SC-008 | `dnd` | P1 | eval | S | Existing outcome receipts | A successful action keeps its success; complication adds cost, danger, reduced effect, or new threat. |
| SC-009 | `dnd` | P1 | ledger | M | Scenario clue state | Required conclusions have multiple routes or proactive recovery; one failed check cannot permanently stall play. |
| SC-010 | `dnd` | P1 | eval | M | Presence authority | Across ten group turns, no present PC is ignored when a spotlight opening exists; no action is invented for them. |
| SC-011 | `rpg` | P1 | eval | S | SC-005 | At least two social futures change trust, obligation, access, exposure, or allegiance differently; combat is not the sole consequential option. |
| SC-012 | `litrpg` | P1 | ledger | M | Reward authority | Every displayed reward has a causal event ID and exact committed delta; ineligible rewards are suppressed. |
| SC-013 | `litrpg` | P1 | prompt | S | SC-001 | A one-value change shows only relevant delta and total; full sheets appear only on request or milestone. |
| SC-014 | `pyoa` | P1 | ledger | M | SC-002 | Each major branch stores its central question and ending state; once answered, output ends or transitions instead of delaying. |
| SC-015 | all | P0 | ledger | S | Intent classification | Near-exact restatement is allowed only when `repeat_or_restate` is true; continuation still requires novelty or exhaustion. |
| SC-016 | all | P0 | eval | M | SC-001–SC-005 | A fixed 20–50-turn regression set for all modes passes all D9 gates; failures include turn IDs and responsible owner. |
| SC-017 | all | P2 | eval | S | SC-016 | Human labels for the D6 top fifteen show adequate agreement with the critic before any gate blocks production. |
| SC-018 | all | P2 | prompt | S | SC-001 | Live diff contains no source exposition, new critic call, Mid writer, WOF work, or extra mandate pile. |

### Recommended sequence

Wire **SC-001, SC-002, SC-003, SC-004, SC-005, SC-007, SC-015, and SC-016** first. This is one small prompt change plus three high-value state families—branch/crisis, inspection, and NPC tactic—and a regression harness. Add clue robustness, spotlight, reward causality, and explicit ending state once the P0 tests prove that the thin constitution survives real 20–50-turn transcripts.

## D9. Evaluation / Critic Addendum

The critic receives the saved mode key and a 20–50-turn transcript. It must use only facts in that transcript and existing metadata. It must not invent a setting, named IP, missing ledger event, hypothetical branch, or player intention. For each gate, return **YES** or **NO**, cite the relevant turn IDs, and give one sentence of evidence. A gate passes when the specified failure is absent; a mode-specific gate passes automatically only when the transcript is from another mode and no equivalent failure occurs.

| # | Yes/no gate | YES criterion |
|---:|---|---|
| 1 | **No unrequested recycle** | No beat, location essay, crisis line, NPC speech, or choice pad is repeated unless the player explicitly asked to repeat or restate it. |
| 2 | **Turn delta exists** | Every substantive GM turn changes action, knowledge, position, cost, relationship, threat, access, or closure, or honestly reports exhaustion. |
| 3 | **Mode-correct turn shape** | The first two sentences follow D4 for the saved mode, and receipts or status appear only in their proper later position. |
| 4 | **Distinct choice outcomes** | Each offered option set contains materially different futures rather than paraphrases distinguished only by tone or wording. |
| 5 | **Player agency and interiority** | The GM does not invent the PC’s unchosen speech, action, feeling, belief, forgiveness, plan, or moral conclusion. |
| 6 | **Continuation creates novelty** | “Keep searching/walking/talking/waiting” produces a new fact, cost, external change, or honest exhaustion rather than the prior reply again. |
| 7 | **PYOA lock and momentum** | In `pyoa`, chosen forks close what they promise, the crisis changes each turn, and no neutral buy-time pad postpones an ending; otherwise no PYOA-style lock is contradicted. |
| 8 | **LitRPG story-before-System honesty** | In `litrpg`, prose establishes the outcome before chrome, and every XP/HP/skill/quest/status delta is committed and causally earned; otherwise no System-first or fake-reward behavior appears. |
| 9 | **Tabletop fair ruling** | In `dnd`, declared approaches produce fiction-led risk/effect, successful results stand, failed checks do not create permanent chokepoints, and unchanged retries are not looped. |
| 10 | **Story-RPG relational consequence** | In `rpg`, major turns change trust, obligation, access, exposure, allegiance, or moral pressure; social success is not mind control and combat is not the default. |
| 11 | **NPC tactic progression** | A recurring NPC pursues a current goal with a changed or escalated tactic; known topics are summarized or closed rather than replayed. |
| 12 | **No unsupported setting or feature invention** | The transcript introduces no licensed setting IP and no SynapticGM subsystem, item, exit, presence, reward, or fact that contradicts code-owned authority. |

### Suggested critic output shape

```json
{
  "mode": "pyoa",
  "gates": [
    {"id": 1, "answer": "YES", "turns": ["G12", "G18"], "evidence": "Repeated bridge imagery marks a changed state rather than replaying the same beat."},
    {"id": 7, "answer": "NO", "turns": ["G21", "G22"], "evidence": "The bridge route closed at G21 but reappeared unchanged in the next option pad."}
  ],
  "pass": false
}
```

The evaluator should judge **outcome identity**, not mere phrase overlap. Conversely, fresh wording does not excuse a recycled beat. A human editor should be able to reproduce each NO from the cited turns without consulting hidden lore or guessing what the writer intended.

## Final Wiring Recommendation

Add the four recommended AUTHORITY sentences and no more. Preserve the existing shared hard rule against unrequested recycling. Back those lines with branch/crisis state, inspection disposition, and NPC tactic/topic state. Keep the detailed rules, examples, source inventory, and anti-pattern ranking in documentation and evaluation, not in the live writer prompt.

This approach respects Path A authority inversion: **code commits facts and permissible state; prose renders the committed consequence; evaluator checks whether the turn’s craft matches the selected mode.** It does not add a Continuity-Warden LLM, does not enable the Mid writer, does not touch WOF, and does not duplicate the existing T1 quality constitution.

## References

[1]: https://heterogenoustasks.wordpress.com/2015/01/26/standard-patterns-in-choice-based-games/ "Sam Kabo Ashwell, Standard Patterns in Choice-Based Games"
[2]: https://www.choiceofgames.com/2011/07/by-the-numbers-how-to-write-a-long-interactive-novel-that-doesnt-suck/ "Dan Fabulich, By the Numbers: How to Write a Long Interactive Novel That Doesn’t Suck"
[3]: https://www.choiceofgames.com/make-your-own-games/choicescript-intro/ "Choice of Games, Introduction to ChoiceScript"
[4]: https://www.choiceofgames.com/make-your-own-games/important-choicescript-commands-and-techniques/ "Choice of Games, Important ChoiceScript Commands and Techniques"
[5]: https://sub-q.com/making-interactive-fiction-branching-choices/ "Bruno Dias, Making Interactive Fiction: Branching Choices"
[6]: https://emshort.blog/2016/11/05/small-scale-structures-in-cyoa/ "Emily Short, Small-Scale Structures in CYOA"
[7]: https://emshort.blog/2011/07/14/plotting-for-interactivity-the-set-piece-or-crisis/ "Emily Short, Plotting for Interactivity: The Set-Piece or Crisis"
[8]: https://emshort.blog/how-to-play/writing-if/my-articles/conversation/ "Emily Short, Conversation"
[9]: https://twinery.org/cookbook/ "Twine Cookbook"
[10]: https://jdmitchellwriter.com/2022/04/11/how-i-wrote-a-gamebook-the-basics/ "J. D. Mitchell, How I Wrote a Gamebook: The Basics"
[11]: https://www.lloydofgamebooks.com/2017/11/gamebook-mechanics-meaningful-choices_9.html "Lloyd of Gamebooks, Gamebook Mechanics: Meaningful Choices"
[12]: https://thealexandrian.net/wordpress/4147/roleplaying-games/dont-prep-plots "Justin Alexander, Don’t Prep Plots"
[13]: https://thealexandrian.net/wordpress/1118/roleplaying-games/three-clue-rule "Justin Alexander, Three Clue Rule"
[14]: https://bladesinthedark.com/basics "Blades in the Dark SRD, The Basics"
[15]: https://bladesinthedark.com/setting-position-effect "Blades in the Dark SRD, Setting Position & Effect"
[16]: https://bladesinthedark.com/consequences-harm "Blades in the Dark SRD, Consequences & Harm"
[17]: https://bladesinthedark.com/progress-clocks "Blades in the Dark SRD, Progress Clocks"
[18]: https://bladesinthedark.com/gathering-information "Blades in the Dark SRD, Gathering Information"
[19]: https://bladesinthedark.com/licensing "Blades in the Dark SRD, Licensing"
[20]: https://lumpley.games/2019/12/30/powered-by-the-apocalypse-part-1/ "Vincent Baker, Powered by the Apocalypse, Part 1"
[21]: https://fate-srd.com/fate-core/invoking-compelling-aspects "Fate Core SRD, Invoking & Compelling Aspects"
[22]: https://cannibalhalflinggaming.com/2018/11/21/level-one-wonk-pbta-201/ "Aaron Marks, Powered by the Apocalypse 201"
[23]: https://indiegamereadingclub.com/indie-game-reading-club/best-in-class-social-moves/ "Paul Beakley, Best in Class Social Moves"
[24]: https://andrewkrowe.wordpress.com/2019/03/02/writing-progression-fantasy/ "Andrew Rowe, Writing Progression Fantasy"
[25]: https://ninc.com/litrpg-a-genre-spotlight/ "Lucas Flint, LitRPG: A Genre Spotlight"
[26]: https://www.royalroad.com/forums/thread/97990 "Royal Road, LitRPG Guide: What Makes a Good LitRPG"
[27]: https://www.royalroad.com/forums/thread/120806 "Bluelightning42, Guide: How to Make a LitRPG System"

### Open-license attribution note

This guide paraphrases most sources. Where the public **Blades in the Dark SRD** is used as an open rules source, it is available under CC BY 3.0 and requires attribution as specified on its licensing page.[19] The **Fate Core SRD** page states CC BY 3.0 attribution terms.[21] The **Twine Cookbook** states CC BY-SA 4.0; copying or adapting its text beyond citation and paraphrase requires attribution and ShareAlike compliance.[9]
