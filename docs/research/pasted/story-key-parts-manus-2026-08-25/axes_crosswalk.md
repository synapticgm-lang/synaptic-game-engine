# SynapticGM — Axis Crosswalk

**Author:** Manus AI

This crosswalk treats each selected row as an **ingredient card**. Compatibility is determined by causal fit: the selected camera, social density, identity facts, power rule, bargain, and proof must all describe one coherent opening rather than fourteen independent surprises.

> **Recommended pick order:** Lock identity first; choose arrival, crowd, and name behavior together; connect power, kit, offer, and growth; then select first proof; finally choose hub, opposition, companion, and ending logic.

## Co-pick groups

| Pick group | Axes to co-pick | Compatibility test | Reject when |
|---|---|---|---|
| Opening camera | `arrival` + `crowd` | Both cards describe who is physically present on page one. | An `alone` crowd card is paired with an arrival that requires an in-room handler or public witness. |
| First address | `crowd` + `name_ask` | A named speaker must exist in the selected social frame. | `name_ask=NPC/official` is selected while `crowd=alone`, unless the request is explicitly delayed or remote. |
| Identity continuity | `arrival` + `identity_lock` | The camera must respect origin, existing life, body, role, and custody pins. | A late-awakening resident is summoned, a dungeon core receives a separate body, or a Blank Canvas card asserts unapproved canon. |
| Power causality | `power_source` + `first_proof` | The proof must show the chosen source changing an observable outcome. | The proof demonstrates a different magic or rules engine than the selected source. |
| Progress loop | `growth` + `first_proof` | The first proof may foreshadow growth but cannot grant mastery without play. | A single action produces unexplained permanent advancement contrary to the growth card. |
| Equipment contract | `kit_reveal` + `offer` | Ownership, loan, custody, and refusal must agree. | An offered or borrowed kit is simultaneously described as automatically owned or compulsory. |
| Voice discipline | `system_voice` + `power_source` | Voice changes diction only; it never changes facts or powers. | A voice card invents a new rule, reward, interface, or outcome. |
| No-System discipline | `system_voice=none` + all mechanical axes | Facts must arrive through diegetic evidence, people, records, or consequence. | Blue panels, experience windows, disembodied registrars, or unexplained menus appear in a no-System family. |
| Social route | `companion` + `crowd` | Recruitment posture must be possible within the opening population. | A permanent companion is assumed in a deliberate-solo opening without a later recruitment beat. |
| Bargain speaker | `offer` + `crowd` + `companion` | The offering party must be present, reachable, or explicitly remote. | An offer depends on a speaker who is absent and has no channel to communicate. |
| Recovery loop | `hub` + `opposition` | A hub softens pressure without erasing it. | The selected hub nullifies the family’s defining scarcity, danger, law, or pursuit. |
| Campaign vector | `opposition` + `ending_logic` | The ending key must be capable of resolving or transforming the campaign pressure. | The close rewards an unrelated objective while the defining pressure remains narratively ignored. |
| Mystery integrity | `first_proof` + `ending_logic` | Early evidence must remain compatible with a causally complete solution. | The ending contradicts preserved evidence or changes a fixed culprit for convenience. |
| Romance agency | `offer` + `companion` + `ending_logic` | Consent, boundaries, and independent goals remain valid at every stage. | Possession, humiliation, jealousy, or coercion is treated as automatic proof of love. |
| Custom-family restraint | `identity_lock` + every other axis | Every concrete setting element remains a proposal until approved. | A proposal silently becomes a kingdom, faction, ancestry, cosmology, or history in canon. |

## Global illegal combinations

| ID | Illegal combination | Why it fails | Compatible repair |
|---|---|---|---|
| G-01 | `crowd=alone` + `name_ask=NPC handler now` | The speaker does not exist in the camera. | Use `name_ask=never/delayed/register/remote`, or select a populated crowd card. |
| G-02 | `kit_reveal=offered` + `pointer_offer=none` + fallback stating ownership | It collapses offer and acceptance. | State visible terms and leave inspection, acceptance, negotiation, and refusal separate. |
| G-03 | `kit_reveal=loaned` + later prose calling the item permanent property | Custody becomes contradictory. | Preserve lender, return condition, damage state, and any lawful transfer. |
| G-04 | `system_voice=none` + unexplained interface narration | It imports a System into a consequence-first family. | Convey the fact through a witness, tool, record, test, or environmental reaction. |
| G-05 | `system_voice` that changes a roll, fact, class, or reward | Voice is diction, not mechanics. | Keep the outcome identical and vary only phrasing, rhythm, and metaphor. |
| G-06 | `first_proof` with no persistent consequence | It does not prove causality. | Preserve a changed object, spent resource, altered route, witnessed reaction, or later human decision. |
| G-07 | `growth=practice` + immediate mastery from one opening action | It skips the selected loop. | Show a repeatable first improvement and preserve the need for later practice. |
| G-08 | `hub=perfect sanctuary` + defining opposition cannot reach, cost, or influence it | Campaign pressure disappears. | Keep bounded safety while rumors, shortages, law, time, or relationships continue to matter. |
| G-09 | `companion=optional` + fallback forcing recruitment | Optionality becomes false. | Let the companion decline, leave, travel in parallel, or remain a contact. |
| G-10 | `offer=refusable` + refusal ends all meaningful play | The choice is coercive in practice. | Make refusal alter relationships and open a third path, harder route, or independent plan. |
| G-11 | `identity_lock` contradicted by a later camera | The opening rewrites player-established canon. | Re-pick the camera or make the apparent contradiction an in-world error that the story corrects. |
| G-12 | `ending_logic` based only on defeating an opponent when the selected key is proof, consent, sustainability, or reform | It ignores the chosen close. | Make the confrontation one input; resolve the actual key in the final decision and epilogue. |
| G-13 | Adult `nsfw=true` row + `kid_ok=true` | Flags become unsafe and ambiguous. | Mark `kid_ok=false` and provide a nonsexual, noncoercive transformation. |
| G-14 | `founder_shape_cousin` text without the required prefix | Founder-only material could leak into a live prompt. | Prefix exactly or leave the field empty; this release leaves it empty. |
| G-15 | Any live row naming or imitating a licensed modern property | It violates the product law. | Replace with original craft language or a public-domain folklore motif. |
| G-16 | Any row introducing reserved World of Fantasy names | It contaminates a separate project. | Use only the supplied family canon and newly invented generic wording. |

## Family-specific hard guards

| family_id | Illegal combination or injection | Required repair |
|---|---|---|
| `fam-isekai-summon` | Non-Earth origin; identified blessing; automatically issued kit; logout. | Keep Earth clothes, the blessing unidentified, equipment offered, and no logout. |
| `fam-null-pyoa-isekai` | Printed experience points; ERROR treated only as comedy; successful clean summon. | Keep the failed summon and let ERROR persist as a causal story object. |
| `fam-sys-apocalypse` | Off-Earth setting; reversible death; optional instead of assigned class; local-only registration. | Preserve Earth, global registration, assigned class, waves, and permadeath. |
| `fam-gate-city` | Famous-hunter analogue; effortless elite license; gates as consequence-free loot rooms. | Preserve district inequality, licensing friction, and public-safety stakes. |
| `fam-late-awaken` | Summoning camera; erased prior life; public access to the private ledger. | Open inside the player’s existing life and preserve private ledger versus public grades. |
| `fam-tower-climb` | Floor Law ignored; unrestricted ascent; wardens reduced to generic monsters. | Keep permits, rankings, floor-specific rules, and wardens as rule-bearing actors. |
| `fam-dungeon-drop` | Easy upward exit; decorative hunger, thirst, or light; safe room with infinite supplies. | Preserve downward-only pressure, survival accounting, and bounded refuge. |
| `fam-academy` | Generic interface replaces living ink; house assigned without consequence; exams solved only by force. | Make living ink, house relations, examinations, and the Class Codex causally active. |
| `fam-dungeon-core` | Player is a keeper with a separate core; spawning is free; all denizens obey absolutely. | The player is the core; expansion, ecology, spawning, and bargains carry costs. |
| `fam-void-bargain` | Hidden flaw; costless boon; forced rebirth without consent. | Pair every Boon with a named Flaw and preserve an appeal, amendment, or refusal path. |
| `fam-village-soft` | Blue panels; combat ladder; neighbors as quest dispensers. | Keep consequence-first village play, craft, care, memory, and relationships. |
| `fam-litrpg-custom` | Unapproved kingdom, faction, ancestry, interface, or cosmology asserted as fact. | Label each concrete element as an optional proposal and defer to the Player Codex. |
| `fam-pyoa-road` | Experience windows on Thornferry Road; charter replaced by a different relic; Wren forced into the party. | Preserve the charter, the road crisis, and Wren’s optional independent posture. |
| `fam-pyoa-occult` | Cylinder becomes a book or weapon; flooded archives dry without cost; one lucky guess solves the cipher. | Preserve cylinder custody, rising water, cumulative decoding, and multiple endings. |
| `fam-pyoa-space` | Nav-drive becomes fantasy magic; vacuum is harmless; the swarm copies a named creature. | Keep engineering, airlocks, pressure, oxygen, nav-drive custody, and an original swarm. |
| `fam-pyoa-romance-gala` | Dossier becomes a weapon; humiliation or coercion proves love; pairing is compulsory. | Keep dossier evidence, consent, independent goals, and a valid refusal ending. |
| `fam-pyoa-mystery` | Hidden culprit changes randomly; supernatural answer replaces physical proof; backward watch is discarded. | Vary camera and proof, not culprit identity; preserve causal reconstruction and watch custody. |
| `fam-pyoa-underwater` | Syringe becomes a spell; pressure injuries vanish; adaptation is permanent and free. | Preserve dosage, pressure, flooded-city logistics, and contested medical custody. |
| `fam-pyoa-assassin` | Ledger changes object class; killing becomes the only branch; collateral harm is rewarded. | Preserve the ledger and allow exposure, protection, interception, refusal, and lawful confrontation. |
| `fam-pyoa-vampire` | Modern franchise imitation; invitation and dawn folklore ignored; ampoule becomes jewelry. | Use public-domain vampire constraints and preserve ampoule custody and faction complexity. |
| `fam-pyoa-dark-romance` | Minor characters sexualized; mate bond forced; exit clause removed; coercion treated as desire. | Keep all romantic participants adult, boundaries explicit, refusal safe, and kid transforms nonsexual. |
| `fam-rpg-heist` | Violence is the only plan; salt economy disappears; disguises are perfect. | Preserve convoy logistics, manifests, social engineering, contingency, and who benefits. |
| `fam-rpg-letters` | Every letter is truthful; seals are broken without consequence; one delivery solves all relationships. | Preserve ambiguity, privacy, timing, and independent recipient choices. |
| `fam-rpg-court` | Birth alone settles legitimacy; oath wording stays hidden; debate becomes generic magic combat. | Preserve witnessed clauses, precedent, ceremony, service networks, and public burden. |
| `fam-rpg-noir` | Intuition alone solves the case; atmosphere substitutes for evidence; abuse is romanticized. | Require verifiable leads, causal reconstruction, protected sources, and counted compromises. |
| `fam-rpg-isolation` | Static supplies perfect answers; every secret is criminal; power limits vanish. | Use controlled tests, incomplete signals, finite power, and proportionate secrets. |
| `fam-rpg-crew` | One hero runs the whole vessel; engine repairs instantly; watches and crew labor disappear. | Preserve interdependent stations, repair steps, command liability, and crew agency. |
| `fam-rpg-wasteland` | Infinite fuel or water; vulnerable passengers become disposable cargo. | Keep resource accounting, repair, route politics, and collective survival choices. |
| `fam-rpg-inn-romance` | Romance is forced; jealousy proves devotion; staff labor vanishes. | Keep mutual choice, respected boundaries, practical work, and sustainable business stakes. |
| `fam-rpg-western` | Land is treated as empty; gunfight is the only resolution; water is limitless. | Preserve prior residents, testimony, surveying, labor, water governance, and nonviolent leverage. |
| `fam-rpg-street-heroes` | Publisher hero or team analogue; powers erase collateral consequences. | Use original people and abilities, community consent, limits, repair, and public accountability. |
| `fam-rpg-travelogue` | Cultures become collectible scenery; private places are mapped without consent. | Center reciprocal hospitality, translation, omission, correction, and return of knowledge. |
| `fam-rpg-teashop` | Tea is a universal cure; customers become quest tokens; overwork is romanticized. | Keep craft limits, listening, recipe custody, rent pressure, and community agency. |
| `fam-rpg-custom` | Unapproved setting, romance, profession, supernatural fact, or history asserted as canon. | Keep every such element an explicit proposal until accepted. |
| `fam-tt-haunted` | Branded adventure structure; every ghost is evil; combat alone resolves the haunting. | Keep Greyhollow, oath-bound dead, investigation, memorial duty, and multiple responses. |
| `fam-tt-caravan` | Branded setting; wagons and animals ignored; every toll claimant is a bandit. | Preserve road logistics, mixed households, charter duties, and negotiated passage. |
| `fam-tt-keep-war` | One battle settles every claim; civilians disappear; banner allegiance is forced. | Keep siege logistics, civilians, legitimacy, divided loyalties, and negotiated authority. |
| `fam-tt-blight` | All wild growth is evil; fire or one miracle cure solves the ecology. | Preserve field knowledge, tested remedies, hunger, stewardship, and remedy control. |
| `fam-tt-veil` | Memory loss is a joke; surrender is forced; one roll opens every path. | Preserve anchors, consent, threshold custom, repeated crossings, and meaningful restoration. |
| `fam-tt-city-guilds` | Famous-port analogue; five guilds collapse into good and evil teams; residents vanish. | Keep Saltmar original, guild interests plural, and recovery accountable to neighborhoods. |
| `fam-tt-custom` | Branded rule term or unapproved setting fact becomes canon. | Use generic d20 language and table-approved proposals only. |
| `fam-vrmmo-trap` | Licensed MMO named; logout works anywhere; death is trivial; real-world ties disappear. | Keep safe-zone logout, physical stakes, access politics, and real-world urgency. |
| `fam-regression` | Foreknowledge is infallible; timeline resets after every error; butterfly effects are erased. | Let each intervention degrade certainty and produce new evidence and costs. |
| `fam-creature-rebirth` | Player becomes a dungeon core; evolution is cosmetic; predation is the only path. | Keep a creature body, permanent adaptation tradeoffs, retained selfhood, and multiple survival strategies. |
| `fam-cyber-neural` | Heat is decorative; upgrades are unlimited; body access ignores consent. | Preserve hardware/software limits, overheat, repair, permissions, debt, and ownership claims. |

## Runtime compatibility procedure

| Step | Runtime action | Failure behavior |
|---:|---|---|
| 1 | Select one `identity_lock` row and apply all family pins. | Reject any row that contradicts a locked premise; do not reinterpret the pin. |
| 2 | Select `arrival`, then filter `crowd` and `name_ask` by physically possible speakers. | Prefer a `never`, `register`, `remote`, or delayed name beat over inventing an NPC. |
| 3 | Select `power_source`; filter `system_voice` to diction-compatible or `none`. | If the family is consequence-first, suppress interface language entirely. |
| 4 | Select `kit_reveal` and `offer` as one custody package. | If ownership states conflict, retain the stricter nonownership state and repick. |
| 5 | Select `growth`; choose a `first_proof` that demonstrates the same causal engine without granting mastery. | Repick the proof rather than adding a second engine. |
| 6 | Select `hub`, `opposition`, and `companion`; verify the hub softens but does not cancel pressure. | Reduce hub safety or choose a pressure that can operate socially, legally, or through scarcity. |
| 7 | Select `ending_logic` and test whether the campaign pressure can be transformed through that key. | Repick the ending key or rewrite the pressure objective before play begins. |
| 8 | Run the prohibited-name, kid-mode, NSFW, and founder-only filters. | Block injection on any failure; never silently sanitize founder-only text into a live prompt. |

## Interpretation note

A row can be mechanically compatible yet tonally poor. The live picker should therefore avoid stacking more than two high-pressure cards in the opening package. If `arrival`, `crowd`, `opposition`, and `offer` all create immediate coercion, soften one axis with solitude, bounded procedure, an honest witness, or a refusal path so the player retains meaningful initiative.
