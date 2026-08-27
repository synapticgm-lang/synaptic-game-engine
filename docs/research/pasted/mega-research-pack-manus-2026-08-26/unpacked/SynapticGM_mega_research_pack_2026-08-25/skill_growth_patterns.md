# Skill Growth Patterns

**Status:** **ORIGINAL SynapticGM** product patterns.  
**Scope:** Shapes and minimum product behaviour only. This document does not redesign the shipped turn architecture, add a critic model, or prescribe application code.

> **Product law:** A skill must have visible provenance. The player can tell whether power came from an identified object, a readable source, or a deed they performed. Costs, tells, offers, refusals, and commitments persist rather than being rewritten for drama.

## Shared Principles

| Principle | Requirement |
| --- | --- |
| Provenance | Every learned, bound, offered, declined, dormant, or upgraded skill records a player-understandable source. |
| No surprise ownership | Merely seeing an object, book, or deed does not silently grant a permanent skill. |
| Explicit commitment | Binding and learning require an explicit player action; deed-derived offers require `Accept` or `Decline`. |
| Durable refusal | A declined deed offer remains declined unless a clearly new deed produces a separately identified offer. |
| Visible cost | Costs are disclosed before commitment and shown again when relevant. Hidden costs are story hooks only when the player knowingly chose uncertainty. |
| Continuity | Skill use may change state only through confirmed use, cost payment, cooldown, charge, condition, or consequence already represented in GameState. |
| Copy safety | GM-ready text never names a commercial series, publisher, ruleset, or “in the style of” reference. |
| Kid Mode | Costs become fatigue, cooldown, noise, mess, lost time, dimmed colour, temporary stiffness, or needing help—not self-harm, addiction, sexualized bargains, or graphic bodily damage. |

---

## Engine 1 — Bound-Relic Core

### Product Promise

A single **identified physical object** can become the source of a persistent capability. The player knows which object carries the power, what using it costs, and what visible or sensory tell reveals activation. Removing, losing, breaking, exhausting, or relinquishing the object has a consistent effect on the skill.

### Lifecycle

| Stage | Player-understandable meaning | Required behaviour |
| --- | --- | --- |
| Discovered | The object is present but not understood. | Do not grant a skill or invent a name. |
| Identified | The object’s nature, candidate capability, cost, and tell are known. | Present enough information for a meaningful choice. |
| Bound | The player explicitly commits to the object. | Add the skill and bind it to the exact object instance. |
| Active | The object is present and all use conditions are met. | Permit use; apply the disclosed cost and tell. |
| Strained | A use condition, charge, or temporary consequence limits the object. | Preserve ownership but show the limitation. |
| Dormant | The object remains bound but cannot currently provide the skill. | Explain the grounded reason without erasing history. |
| Unbound or lost | The relationship ends or the object leaves confirmed possession. | Preserve history and consequences; do not pretend the skill was never known. |

### Minimum GameState Fields

These are **field needs**, not TypeScript or a replacement schema.

| Field | Purpose |
| --- | --- |
| `inventory.instances[].instanceId` | Binds the capability to one concrete object, not to every item with the same name. |
| `inventory.instances[].displayName` | Provides the identified player-facing object name. |
| `inventory.instances[].identified` | Prevents pre-identification skill grants or invented properties. |
| `inventory.instances[].location` | Establishes carried, worn, stored, dropped, lost, or destroyed status. |
| `skillGrowth.boundRelics[].relicInstanceId` | Links the bound record to the object instance. |
| `skillGrowth.boundRelics[].bondStatus` | Records discovered, identified, bound, strained, dormant, unbound, lost, or destroyed. |
| `skillGrowth.boundRelics[].skillId` | Links to the committed named skill. |
| `skillGrowth.boundRelics[].cost` | Stores the disclosed cost kind, trigger, magnitude or tier, and recovery condition. |
| `skillGrowth.boundRelics[].tell` | Stores the visible, audible, tactile, or environmental activation tell. |
| `skillGrowth.boundRelics[].useConditions` | Records possession, wear, location, charge, cooldown, or contextual requirements. |
| `skillGrowth.boundRelics[].boundAtTurn` | Establishes provenance and timing. |
| `skillGrowth.boundRelics[].lastUsedTurn` | Supports cooldown and visible history without guessing. |
| `skillGrowth.boundRelics[].usageCount` | Supports clearly defined growth thresholds if the product uses them. |
| `skillGrowth.boundRelics[].history[]` | Preserves identification, binding, strain, recovery, loss, and unbinding events. |

### UI Affordances

| Surface | Behaviour |
| --- | --- |
| Item detail | Shows `Identified`, candidate skill, cost, tell, and use conditions before binding. |
| Bind action | Uses a deliberate confirmation with the exact object name and cost summary. |
| Skill detail | Shows `Source: [relic name]`, current availability, cost, tell, and the grounded reason when dormant. |
| STATUS change | Confirms binding, strain, recovery, loss, or unbinding in plain language. |
| Why? | Explains the relevant check: whether the exact relic instance is identified, present, and available. |
| Loss handling | Keeps the skill record visible as dormant or lost rather than silently deleting provenance. |

### Never-Lines

| Never show in GM-ready or player-facing text | Reason |
| --- | --- |
| “The relic chooses you because destiny says so.” | Invents hidden authority and removes player agency unless established. |
| “You have always carried this.” | Rewrites inventory history. |
| “The cost will be revealed later” when a concrete cost is already known. | Withholds a committed product fact. |
| “Every item of this type now grants the skill.” | Breaks instance binding. |
| “The power works even though the relic is gone.” | Contradicts object dependence unless a documented upgrade changed it. |
| “You master it instantly.” | Skips the defined lifecycle and any growth condition. |
| “A secret voice names you its champion.” | Invents a speaker and rank. |
| “The object feeds on pain.” | Adult-sensitive coercive framing; prohibited in Kid Mode and unsuitable as a default cost. |

### Kid Mode

Kid Mode permits mysterious objects, but costs should read as **temporary and understandable**: the object becomes warm, heavy, dim, noisy, difficult to lift, briefly unresponsive, or in need of rest or repair. Avoid blood prices, possession, sadism, self-injury, graphic transformation, and irreversible bargains. If a standard-mode relic uses frightening imagery, Kid Mode should swap the presentation while preserving the same mechanical cost and timing.

### Ten Original Skill Names

| Skill name | Relic seed | Cost/tell seed |
| --- | --- | --- |
| Quiet Iron Pulse | A dented iron ring | Brief heaviness; a low vibration through nearby metal. |
| Stormglass Ward | A cloudy glass clasp | One charge dims; pale static crawls across its edge. |
| Copper Echo | A split copper coin | Delayed reuse; a soft double chime follows activation. |
| Rootbound Step | A knotted wooden buckle | Slower turning for one beat; dust gathers around the heel. |
| Hollow Bell Reach | A thumb-sized bell with no clapper | Short fatigue; distant surfaces answer with a muted tone. |
| Cinderhold | A black ceramic bead | Warmth builds; a hairline ember glow appears then fades. |
| Moon-Thread Draw | A spool of silver-grey thread | Thread shortens; reflected light bends toward the target. |
| Oath of the Bent Key | A warped brass key | Cannot repeat until the next threshold; the key straightens briefly. |
| Thirteen-Nail Shelter | A wooden tile set with tiny iron studs | One stud darkens; nearby edges look momentarily squared and firm. |
| Riverstone Return | A flat stone marked by natural bands | Requires stillness; condensation beads on the stone before release. |

---

## Engine 2 — Readable/Codex Learn

### Product Promise

A readable object—book, manual, slate, field guide, annotated diagram, or other **confirmed legible source**—can lead to a named skill commitment. Ownership alone is insufficient. The player must be able to access the source, spend the required reading or practice opportunity, meet any stated prerequisites, and explicitly commit the result.

### Lifecycle

| Stage | Player-understandable meaning | Required behaviour |
| --- | --- | --- |
| Acquired | The source is present. | Do not assume it is readable, complete, or understood. |
| Readable | Language, condition, access, light, and other prerequisites permit reading. | Surface available study actions. |
| Studied | The player spends the defined time or practice opportunity. | Record progress without silently granting the skill early. |
| Ready to commit | The source supports one named skill and requirements are met. | Show skill name, effect summary, and any slot or trade-off. |
| Learned | The player explicitly commits. | Add the named skill with source provenance. |
| Incomplete | Reading or practice is interrupted or insufficient. | Preserve progress if the product promises persistence. |
| Source unavailable | The book or manual is lost, closed, damaged, or inaccessible. | Learned skills persist if the product says learning is durable; uncommitted study follows defined retention rules. |

### Minimum GameState Fields

| Field | Purpose |
| --- | --- |
| `inventory.instances[].instanceId` | Identifies the exact readable object. |
| `inventory.instances[].readableState` | Records unreadable, partly readable, readable, damaged, sealed, or exhausted. |
| `inventory.instances[].languageOrAccessKey` | Prevents instant comprehension without a grounded route. |
| `skillGrowth.readables[].sourceInstanceId` | Links study and learning to the source object. |
| `skillGrowth.readables[].candidateSkillId` | Stores the named skill supported by the source. |
| `skillGrowth.readables[].studyProgress` | Records progress in a product-defined unit without implying real-world study measurement. |
| `skillGrowth.readables[].studyRequirements` | Stores time, location, light, tools, mentor, prerequisite skill, or practice conditions. |
| `skillGrowth.readables[].commitStatus` | Records unavailable, available, studying, ready, learned, refused-for-now, or superseded. |
| `skillGrowth.readables[].committedAtTurn` | Establishes when the skill became durable. |
| `skillGrowth.readables[].sourceProvenance` | Provides the player-facing “Learned from…” explanation. |
| `skills[].skillId` and `skills[].status` | Holds the committed capability and current availability. |
| `skills[].history[]` | Preserves learning, upgrades, suppression, and restoration without rewriting origin. |

### UI Affordances

| Surface | Behaviour |
| --- | --- |
| Item detail | Shows readability, language/access, candidate skill if identified, progress, and missing requirements. |
| Read or study action | States the likely time or opportunity cost before the player commits. |
| Progress feedback | Uses plain milestones such as `Started`, `Practised`, `Ready to learn`, and `Learned`. |
| Commit action | Names the skill, any slot/trade-off, and whether learning is durable if the source is later lost. |
| Skill detail | Shows `Learned from [source]` and the commit turn or story moment. |
| Interruption | Preserves or resets study only according to the product rule; the UI says which. |

### Never-Lines

| Never show | Reason |
| --- | --- |
| “You skim the cover and master the technique.” | Ownership or a glance is not study. |
| “The unreadable pages whisper the instructions.” | Invents a speaker and bypasses access requirements. |
| “The manual changes into a skill.” | Collapses source, process, and commitment into magic without grounding. |
| “You learned it earlier off-screen.” | Rewrites history. |
| “The book is consumed” unless consumption is a disclosed product rule. | Invents an item loss. |
| “Choose any skill you want from the book.” | Breaks named-source provenance. |
| “The lesson installs itself.” | Removes player action and practice. |
| “Only the gifted can read this.” | Invents a rank or trait gate unless present in state. |

### Kid Mode

Kid Mode should favour curiosity, practice, diagrams, puzzles, demonstrations, and helpful marginal pictures with **no readable text inside generated art**. Avoid school humiliation, coercive teachers, punishment, unsafe real-world instructions, or claims that intelligence is innate. Failure means “not ready yet,” “needs more light,” “missing a page,” or “needs another try,” not personal inadequacy.

### Ten Original Skill Names

| Skill name | Source seed | Learning seed |
| --- | --- | --- |
| Margin Step | A travel manual with diagrams of narrow passages | Practise moving through tight spaces without losing balance. |
| Inkless Recall | A memory slate whose markings fade after reading | Reconstruct a recently seen simple pattern. |
| Stairwell Listening | A building survey guide | Learn to read echoes across connected levels. |
| Thread Counter | A repair notebook with knot diagrams | Estimate tension and weak points in cord or cloth. |
| Palms of Patient Heat | A kiln-care manual | Warm a small inert object gradually and safely. |
| Borrowed Angle | A carpenter’s folded diagram set | Use nearby surfaces to redirect a simple line of sight. |
| Cloudglass Method | A weathered lens-care codex | Clear mist or condensation from a small viewing area. |
| Stoneweight Measure | A mason’s field ledger | Judge whether a visible surface can bear ordinary weight. |
| Breath Between Lines | A performance exercise book | Hold steady focus through a brief interruption. |
| Quiet Diagram | An engineer’s blank-ink manual | Recognize the functional relation among a few visible parts. |

---

## Engine 3 — Deed-Offer-Refuse

### Product Promise

After a **confirmed deed**, the product may offer a named skill shaped by what the player actually did. The offer is not ownership. `Accept` commits the skill under disclosed terms. `Decline` persists and is respected; the GM does not keep re-offering the same skill as pressure.

### Lifecycle

| Stage | Player-understandable meaning | Required behaviour |
| --- | --- | --- |
| Deed confirmed | The player completed an observable action. | Record the deed in plain terms without adding motive or rank. |
| Offer created | A skill is proposed because of that deed. | Show the deed link and the offered skill; do not auto-grant. |
| Pending | The player has not decided. | Keep the offer available only for the stated window, if any. |
| Accepted | The player explicitly chooses `Accept`. | Add the skill and preserve the source deed. |
| Declined | The player explicitly chooses `Decline`. | Persist refusal; do not grant, shame, or immediately re-offer. |
| Expired | A disclosed offer window closes. | Record expiry separately from refusal. |
| New deed, new offer | A materially different deed can create another offer. | Use a new offer ID and explain the new provenance. |

### Minimum GameState Fields

| Field | Purpose |
| --- | --- |
| `history.deeds[].deedId` | Provides an immutable reference to the confirmed action. |
| `history.deeds[].plainSummary` | Supplies player-facing provenance without internal jargon. |
| `history.deeds[].turnId` | Anchors timing. |
| `history.deeds[].evidenceRefs` | Points to already-shipped snapshot facts supporting the deed. |
| `skillGrowth.deedOffers[].offerId` | Distinguishes each offer and prevents duplicate handling. |
| `skillGrowth.deedOffers[].sourceDeedId` | Links offer to the deed that earned it. |
| `skillGrowth.deedOffers[].skillId` | Stores the one named offered skill. |
| `skillGrowth.deedOffers[].status` | Records pending, accepted, declined, or expired. |
| `skillGrowth.deedOffers[].offeredAtTurn` | Anchors when it became available. |
| `skillGrowth.deedOffers[].decisionAtTurn` | Anchors acceptance or refusal. |
| `skillGrowth.deedOffers[].decisionTerms` | Stores disclosed slot, cost, replacement, or exclusivity terms. |
| `skillGrowth.deedOffers[].repeatPolicy` | States whether only a materially new deed may produce a new offer. |
| `skills[].sourceOfferId` | Preserves provenance after acceptance. |

### UI Affordances

| Surface | Behaviour |
| --- | --- |
| Offer panel | Shows `Because you [plain deed]`, skill name, concise effect, terms, and `Accept` / `Decline`. |
| Pending state | Indicates whether the offer waits indefinitely or has a disclosed expiry point. |
| Decline confirmation | Confirms the refusal and states that the skill was not added. |
| Accepted confirmation | Names the skill and source deed. |
| Skill detail | Shows `Earned by [deed]` and accepted status. |
| Offer history | Lets the player distinguish accepted, declined, and expired offers without reopening them as active prompts. |

### Never-Lines

| Never show | Reason |
| --- | --- |
| “The system grants you a skill before you can answer.” | Breaks offer/commitment separation. |
| “Declining is not permitted.” | Removes agency. |
| “You will regret refusing.” | Pressures the player and turns UI into an adversary. |
| “The same offer returns every turn.” | Ignores durable refusal. |
| “You earned this because you are a chosen one.” | Invents status instead of using the deed. |
| “Your violent instinct unlocked…” | Assigns motive and may intensify adult content. |
| “Accept to continue the story.” | Makes progression coercive. |
| “The offer was accepted automatically.” | Falsifies player choice. |

### Kid Mode

Kid Mode offers should celebrate **observable effort**, cooperation, care, curiosity, balance, repair, bravery, or patience without grading the child’s worth. Decline copy stays neutral: “Not added. The story continues.” Avoid offers based on cruelty, self-endangerment, humiliation, gambling, theft as aspiration, or graphic combat. If a standard deed is too intense, offer a mechanically equivalent skill from the safer observable action—for example, holding a door, guiding someone, spotting a safe route, or repairing a tool.

### Ten Original Skill Names

| Skill name | Deed seed | Offer explanation seed |
| --- | --- | --- |
| Brace Before Break | You held a failing support long enough for others to pass. | Improve one brief attempt to stabilize a visible structure. |
| Rainpath Balance | You crossed a slick route without rushing. | Reduce the next ordinary footing penalty in wet conditions. |
| Quiet Witness | You observed without interrupting or exposing yourself. | Recall one visible detail from the watched scene. |
| Last Spark Recovery | You restored a device with almost no power remaining. | Coax one final low-output function from a depleted tool. |
| Crowdline Read | You found a safe path through a moving group. | Identify a temporary opening in a visible crowd. |
| Door-Between Instinct | You used cover and timing at a threshold. | Gain a brief positioning advantage near an actual doorway or gate. |
| Patient Hand | You completed a delicate repair under pressure. | Steady one careful manipulation against ordinary distraction. |
| Shared Load | You carried weight with another person. | Reduce strain when cooperating on the same physical task. |
| Echo Pause | You stopped and listened before entering. | Distinguish one nearby repeated sound from ambient noise. |
| Second Knot | You secured a line after the first fastening slipped. | Improve the reliability of one visible rope or strap fastening. |

---

## FOUNDER-ONLY Shape Boundary

No real-world book, game, film, comic, animation, or series title is required to explain these patterns, so none is included. If the founder later keeps comparative inspiration notes, mark the entire note **FOUNDER-ONLY**, store it outside GM-ready and player-facing banks, and translate every useful comparison into neutral product properties before implementation.

## Acceptance Tests

| Test | Pass condition |
| --- | --- |
| Bound relic | Removing the exact relic instance changes skill availability consistently; another copy does not inherit the bond. |
| Readable learn | Owning, opening, studying, readiness, and commitment are distinct states. |
| Deed offer | Offer creation does not grant the skill; decline persists; acceptance records the deed. |
| Player copy | Every skill detail answers “Where did this come from?” without technical jargon. |
| Cost and terms | The player sees the cost, slot, replacement, expiry, or exclusivity before committing. |
| Kid Mode | The mechanical shape remains intact while frightening, sexualized, exploitative, or graphic presentation is removed. |
| Continuity | No engine invents inventory, speakers, ranks, companions, time, weather, or accepted tasks to justify progression. |
