# Part T2 — Applying Tones Through Existing SynapticGM GM Levers

**Author:** Manus AI  
**Architecture decision:** Extend `gmVoiceProfile`, `fluidProseRails`, `folkVoiceExpectations`, `choiceTierRules`, opener pointers, status/repair copy, `proseWarden`, and perspective rendering. Do not add a parallel personality engine.

> **Authority pipeline:** player correction → pinned canon → StateTx → SceneManifest → evidence → invention. The renderer receives the permitted outcome; personality never participates in deciding it.

## Tone-to-lever matrix

| Tone ID | Modes | Primary | Secondary | Additive rail summary | Choice bank | Status template | Hard gates |
|---|---|---|---|---|---|---|---|
| `grimdark_bleak_consequence` | rpg|dnd|litrpg | `cold-system` | `army-brief` | Lead with the irreversible observed consequence; Use one concrete ruin image, then stop; Offer agency without promising rescue; End on an earned hard choice | `choice_grimdark_bleak_consequence_v1` | `status_grimdark_bleak_consequence_v1` | GATE_NO_GORE_KID; GATE_NO_JOKE_ON_LOSS; GATE_METAPHOR_FACT_CHECK |
| `cozy_low_stakes_comfort` | rpg|dnd|pyoa | `fireside-innkeep` | `chilled-gm` | Lead with the practical need; Spend one beat on warmth or craft; Keep conflict local in prose, not in math; Offer cooperative or restorative choices when permitted | `choice_cozy_low_stakes_comfort_v1` | `status_cozy_low_stakes_comfort_v1` | GATE_NO_FALSE_SAFETY; GATE_NO_UNEARNED_HEALING; GATE_CONSEQUENCE_PLAIN |
| `cozy_brutal` | litrpg|rpg|dnd | `cozy-brutal` | `chilled-gm` | Open on the clean result; Alternate one visceral beat with one human comfort beat; Keep Status numerically plain; Do not joke about wounds or player failure | `choice_cozy_brutal_v1` | `status_cozy_brutal_v1` | GATE_GORE_BY_RATING; GATE_NO_CASUALTY_JOKE; GATE_STATUS_LITERAL |
| `pulp_kinetic_adventure` | pyoa|rpg|dnd|litrpg | `army-brief` | `theatrical-jester` | Start in motion; Use active verbs and one vivid hazard; Name spatial options clearly; End at the next real decision, not a fabricated cliffhanger | `choice_pulp_kinetic_adventure_v1` | `status_pulp_kinetic_adventure_v1` | GATE_NO_ACTION_INVENTION; GATE_COUNT_PRESERVATION; GATE_CLIFFHANGER_EARNED |
| `gothic_moonlit_dread` | rpg|dnd | `fireside-innkeep` | `chilled-gm` | State the result before atmosphere; Let architecture or weather carry dread; Never turn metaphor into an entity; Close on a precise, permitted choice | `choice_gothic_moonlit_dread_v1` | `status_gothic_moonlit_dread_v1` | GATE_NO_HIDDEN_ENTITY; GATE_NO_FALSE_OMEN; GATE_KID_SPOOKY_ONLY |
| `litrpg_system_registrar` | litrpg | `cold-system` | `dry-wit` | Emit approved StateTx fields exactly; Use registrar verbs only around chrome; Keep prose physical and concise; Never create a stat, reward, or penalty | `choice_litrpg_system_registrar_v1` | `status_litrpg_system_registrar_v1` | GATE_STATUS_SCHEMA; GATE_NUMBER_ECHO; GATE_NO_SYSTEM_TAUNT |
| `military_procedural` | litrpg|dnd|rpg | `army-brief` | `cold-system` | Situation first; Constraints second; Options third; Use coordinates and counts only from SNAPSHOT | `choice_military_procedural_v1` | `status_military_procedural_v1` | GATE_GEAR_COUNT; GATE_POSITION_AUTHORITY; GATE_NO_DRILL_ABUSE |
| `dry_wit_deadpan` | litrpg|dnd|rpg|pyoa | `dry-wit` | `chilled-gm` | Give the fact straight; Allow one understatement after comprehension; Never target the player; Remove jokes from loss, repair, consent, and safety | `choice_dry_wit_deadpan_v1` | `status_dry_wit_deadpan_v1` | GATE_HUMOR_SAFE_CONTEXT; GATE_NO_PLAYER_TARGET; GATE_STATUS_LITERAL |
| `warm_chronicle` | rpg|dnd|pyoa | `fireside-innkeep` | `chilled-gm` | Answer first; Add one remembered human detail only if pinned; Use reflective cadence after facts; Hand agency back gently and explicitly | `choice_warm_chronicle_v1` | `status_warm_chronicle_v1` | GATE_NO_FALSE_MEMORY; GATE_NO_OUTCOME_SOFTEN; GATE_NPC_MEMORY_PRIORITY |
| `clinical_auditor` | litrpg|dnd|rpg | `cold-system` | `army-brief` | Separate observation, evidence, and inference; Use calibrated certainty; Never invent measurements; Close with auditable options | `choice_clinical_auditor_v1` | `status_clinical_auditor_v1` | GATE_EVIDENCE_ONLY; GATE_NO_MEDICAL_GORE_KID; GATE_NO_FAKE_PRECISION |
| `mythic_portent` | rpg|dnd | `fireside-innkeep` | `theatrical-jester` | State what happened plainly; Add one omen-shaped metaphor labeled as atmosphere; Limit epithets to one per entity; Keep choices concrete and present-tense | `choice_mythic_portent_v1` | `status_mythic_portent_v1` | GATE_NO_PROPHECY_FACT; GATE_EPITHET_CAP; GATE_METAPHOR_FACT_CHECK |
| `street_balladeer` | rpg|dnd|pyoa | `theatrical-jester` | `dry-wit` | Open with the action’s consequence; Use one oral cadence or refrain at most; Keep dialect lexical, never phonetic; End with verbs the player can take | `choice_street_balladeer_v1` | `status_street_balladeer_v1` | GATE_NO_ACCENT_SPELLING; GATE_NO_RHYME_PRESSURE; GATE_NPC_MEMORY_PRIORITY |
| `ashen_archivist` | rpg|dnd|litrpg | `cold-system` | `fireside-innkeep` | Record the result; Add one material trace of age; Distinguish archive inference from ledger fact; Offer the next action without fatalism | `choice_ashen_archivist_v1` | `status_ashen_archivist_v1` | GATE_NO_FALSE_HISTORY; GATE_RECORD_VS_LEDGER; GATE_KID_DUST_NOT_DEATH |
| `bright_field_guide` | rpg|dnd|pyoa | `chilled-gm` | `fireside-innkeep` | Identify the observable feature; Explain one useful implication; Express curiosity without asserting taxonomy; Offer explore, test, or withdraw only when permitted | `choice_bright_field_guide_v1` | `status_bright_field_guide_v1` | GATE_OBSERVABLE_ONLY; GATE_NO_TAXONOMY_INVENTION; GATE_SAFE_DISCOVERY |
| `noir_case_file` | rpg|dnd|pyoa | `dry-wit` | `army-brief` | Lead with the clue or consequence; Use one hard image; Separate suspicion from evidence; Never make the player the punchline | `choice_noir_case_file_v1` | `status_noir_case_file_v1` | GATE_CLUE_AUTHORITY; GATE_NO_SEXUALIZED_CHROME; GATE_NO_PLAYER_CYNICISM |
| `fae_uncanny_tale` | rpg|dnd|pyoa | `theatrical-jester` | `fireside-innkeep` | State the literal result; Render wonder through pattern and sensory contrast; Make costs and promises explicit; Never conceal a rule behind whimsy | `choice_fae_uncanny_tale_v1` | `status_fae_uncanny_tale_v1` | GATE_PACT_EXPLICIT; GATE_NO_HIDDEN_COST; GATE_KID_MISCHIEF_ONLY |
| `hard_sf_terminal` | litrpg|pyoa|rpg | `cold-system` | `army-brief` | Report state first; Use units only when supplied; Label inference and uncertainty; Offer executable actions, not decorative commands | `choice_hard_sf_terminal_v1` | `status_hard_sf_terminal_v1` | GATE_TELEMETRY_SOURCE; GATE_UNIT_PRESERVATION; GATE_NO_TECHNOBABBLE_FACT |
| `pyoa_branching_crisis` | pyoa|rpg | `army-brief` | `chilled-gm` | Address the player directly; Name the immediate hazard; Keep each option physically legible; Do not invent timers, exits, or tools | `choice_pyoa_branching_crisis_v1` | `status_pyoa_branching_crisis_v1` | GATE_CHOICE_CAUSALITY; GATE_NO_FALSE_TIMER; GATE_NO_SANDBOX_HUB_INVENT |
| `kid_plain_stakes` | litrpg|dnd|rpg|pyoa | `chilled-gm` | `fireside-innkeep` | Use common words and short sentences; Say what changed and what stayed the same; Give one safe next step; Never pressure, shame, or conceal cost | `choice_kid_plain_stakes_v1` | `status_kid_plain_stakes_v1` | GATE_KID_ALWAYS; GATE_PLAIN_LANGUAGE; GATE_NO_PRESSURE; GATE_SAFE_CONFIRMATION |

## New Game Simple picks and Expert matrix

| Surface | Four Simple picks | Compatibility treatment |
|---|---|---|
| Narrator | `chilled-gm` Friendly Guide; `dry-wit` Dry Wit; `army-brief` Mission Lead; `fireside-innkeep` Fireside Chronicler | `theatrical-jester` remains shipped and available under Expert/More styles; old saves render unchanged. |
| System chrome | `cold-system` Cold Registrar; `dry-wit` Sarcastic Patch; `army-brief` Army Quartermaster; `chilled-gm` Friendly System | `cozy-brutal` remains shipped and appears as a Featured Tone shortcut plus Expert; `theatrical-jester` remains valid on old saves but is not promoted in the primary LitRPG list. |

This presentation does **not** remove shipped IDs. It reduces first-run choice overload while preserving save compatibility and discoverability. A tone selection writes the existing personality field plus an additive `tone_id`; if schema change is unavailable, store only the shipped ID and apply the tone as a deterministic preset expansion at render time.

## Prior-vibe preset reconciliation

| Research preset | Shipped ID | Disposition |
|---|---|---|
| Cold Registrar | `cold-system` | direct shipped mapping |
| Sarcastic Patch | `dry-wit` | direct shipped mapping; no player-targeted sarcasm |
| Army Brief | `army-brief` | direct shipped mapping |
| Chilled GM | `chilled-gm` | direct shipped mapping |
| Dry Wit | `dry-wit` | direct shipped mapping |
| Warm Chronicle | `fireside-innkeep` | Expert additive warm_chronicle rail |
| Clinical Auditor | `cold-system` | Expert additive clinical_auditor rail |
| Jester | `theatrical-jester` | direct shipped mapping; hard humor gates |
| Velvet Oracle | `fireside-innkeep` | Expert additive mythic_portent rail; deferred as standalone ID |
| Street Balladeer | `theatrical-jester` | Expert additive street_balladeer rail; deferred as standalone ID |
| Ashen Archivist | `cold-system` | Expert additive ashen_archivist rail; deferred as standalone ID |
| Bright Field Guide | `chilled-gm` | Expert additive bright_field_guide rail; deferred as standalone ID |

## Surprise-me pairing policy

| Pair class | Rule | Examples |
|---|---|---|
| Safe default | Same-severity or complementary cadence; System chrome remains literal. | Warm Chronicle + Friendly System; Kinetic Adventure + Army Quartermaster; Bright Field Guide + Friendly System. |
| Allowed with gate | Contrast is acceptable only if humor and threat gates pass. | Moonlit Dread + Dry Wit with humor disabled at harm; Cozy Brutal + Cold Registrar; Fae Uncanny + Army Brief for explicit pact costs. |
| Banned | Pairing would trivialize peril, pressure a child, or obscure ledger truth. | Theatrical Jester + grimdark in Kid Mode; Dry Wit on death/consent/repair; Mythic Portent with invented prophecy; Fae Uncanny with hidden mechanical prices; any theme-token choice treated as semantic authority. |

## Semantic render-equivalence rule

For a fixed authority payload, changing `tone_id`, `gmPersonality`, `systemPersonality`, perspective, theme, or art eligibility must preserve the canonical projection: `location_id`, `present_entity_ids`, `exit_ids`, `inventory`, `hp`, `resource_deltas`, `quest_flags`, `permits`, `rolls`, `outcome_code`, `time_delta`, and evidence citations. A recommended fixture computes `canonicalHash(authorityProjection(output))` for every tone and requires equality before snapshotting prose. Tone-specific metaphor is then scanned for claims that could be parsed as additional entities, exits, possessions, rewards, damage, or timers. Parameterized and snapshot testing are supported directly by Vitest.[10] [11]

## Opening hook deck: camera, never facts

| Hook family | Fixed facts | Tone-adjustable camera | Prohibition |
|---|---|---|---|
| System Arrival | The existing deck record supplies the location, visible arrival event, available exits, and any Status notice. | Registrar foregrounds registration; Gothic foregrounds light and architecture; Pulp foregrounds motion; Warm Chronicle foregrounds a human-scale object. | Do not add a summoned being, reward, timer, witness, or exit. |
| Debt Under Glass | The existing deck record supplies the debt fact, glass object or setting fact, parties present, and available responses. | Noir foregrounds clue order; Clinical Auditor separates evidence from inference; Fae Uncanny foregrounds the literal wording of a pact; Kid Mode explains the obligation plainly. | Do not change the debt amount, creditor, deadline, ownership, or consent state. |
| Other opener-pointer families | **INPUT REQUIRED:** `opener_pointer_examples.md` was not attached. | Apply the same camera-only transformation after ingest. | No invented deck names or facts. |

## Perspective interaction

| Setting | Contract | Tone implication |
|---|---|---|
| Second person | Use “you” only for confirmed perception, position, bodily response, and chosen action. Never assert unchosen thought, emotion, or intent. | Best for PYOA and kinetic tones; strictest anti-puppeteering gate. |
| Third person limited | Use the player-character name or pronoun and report only observable facts plus permitted internal state. | Adds chronicle or noir distance without omniscient invention. |
| Third person external | No interior claims. Camera can select detail but cannot infer motive. | Best for Clinical, Military, Hard-SF, and audit fixtures. |

## Visible moat and deterministic repair copy

Tone may vary the wrapper around **status / why / repair**, but each template must retain the same three slots: `STATUS` names the machine fact, `WHY` cites the authority source or gate, and `REPAIR` offers a permitted next step without changing state. Error copy should be precise, constructive, non-blaming, and humor-free where recovery is the user’s priority.[12] [13]

## Anti-list

| No-Go idea | Why it fails | Deterministic alternative |
|---|---|---|
| Second LLM tone critic or Continuity-Warden critic | Adds cost, latency, nondeterminism, and a rival semantic authority. | Regex/classifier scrub classes, invariant hashes, and snapshot fixtures. |
| Tone-specific state mutation | Violates the rendering firewall and makes switching voices unsafe. | Apply tone after StateTx and SceneManifest. |
| Full every-turn comic generation | Burns Free COGS and increases timeout risk. | Sparse comic-lite eligibility plus memorable asynchronous plates. |
| Theme semantics as truth | A cosmetic palette can imply unsupported facts. | Themes affect tokens and presentation only. |
| Hidden fae bargains or noir clues | Turns atmosphere into undisclosed mechanics. | Explicit pact/clue fields sourced from authority. |
| Accent spelling by folk | Creates stereotype lock and accessibility failures. | Lexical and social-instinct cues; named-NPC memory wins. |
| RAG as tone memory truth | Retrieved prose may override current state or import IP. | Store tone ID, compact rails, and deterministic banks. |
| Baked dialogue or UI in generated art | Text becomes stale, unreadable, and unauditable. | HTML/SVG overlay lettering only. |

## References

[1]: https://www.nngroup.com/articles/tone-of-voice-dimensions/ "The Four Dimensions of Tone of Voice — Nielsen Norman Group"
[2]: https://www.nngroup.com/articles/tone-voice-users/ "The Impact of Tone of Voice on Users’ Brand Perception — Nielsen Norman Group"
[10]: https://vitest.dev/guide/learn/writing-tests.html "Writing Tests — Vitest"
[11]: https://vitest.dev/guide/snapshot "Snapshot — Vitest"
[12]: https://www.nngroup.com/articles/error-message-guidelines/ "Error-Message Guidelines — Nielsen Norman Group"
[13]: https://www.nngroup.com/articles/error-messages-scoring-rubric/ "An Error Messages Scoring Rubric — Nielsen Norman Group"
