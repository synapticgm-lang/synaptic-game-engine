# SynapticGM Folk Voice Programming Contract

**Product:** SynapticGM  
**Schema:** `P3_folk_voice_profile.schema.json`  
**Version date:** 2026-08-19  
**Status:** Implementation contract

## 1. Contract purpose

`FolkVoiceProfile` is an **optional presentation profile**. It supplies a bounded social register for NPC dialogue: cadence, metaphor choices, respect and insult cues, hospitality, fear language, and consent-aware repair. It is not lore adjudication, a personality generator, a classification system, or a state mutator.

> **Non-negotiable product law:** Folk flavor is diction and social instinct only. It never changes ledger facts, stats, permits, kit, inventory, prices, quest eligibility, access permissions, or transaction outcomes. Named NPC memory and CampaignContract override folk defaults.

The schema is deliberately strict: it accepts only the approved folk IDs, encodes a fixed priority chain, requires an anti-accent policy, and enumerates protected state categories. Schema validation is necessary but not sufficient; the runtime must also execute the checks in this contract.

## 2. Resolution order

| Priority | Input source | Runtime behavior |
|---:|---|---|
| 1 | `CampaignContract` | Applies mode, safety rules, setting-specific prohibitions, enabled folk profiles, and optional etiquette flags. If the contract says no folk flavor, output no special folk styling. |
| 2 | Named NPC memory | Applies stored individual speech, culture, pronouns, access needs, boundaries, relationships, and prior commitments. It wins even when it conflicts with default folk expectations. |
| 3 | Scene facts and safety | Uses current stakes, location, authority, consent, Kid Mode, player boundaries, and present factual state. Blocks unsafe or contradictory generation. |
| 4 | Local culture or role | Lets a dockworker, priest, merchant, student, medic, or captain sound like their role and region rather than like a folk template. |
| 5 | Individual override | Applies explicit non-memory character flags in the current prompt, such as “this elf is impatient” or “this vampire rejects invitation rites.” |
| 6 | FolkVoiceProfile default | Uses only a small number of cues: cadence plus one metaphor or social instinct. It does not force a “voice costume.” |
| 7 | No special voice | Falls back to clear, character-specific neutral prose whenever confidence is low. |

### Required resolution pseudocode

```text
resolveFolkVoice(context):
  contract = context.campaignContract
  if contract.folkVoiceEnabled is false:
      return neutralProfile("CampaignContract disabled folk voice")

  npc = context.namedNpcMemory
  if npc.voiceProfileOverride exists:
      candidate = merge(npc.voiceProfileOverride, npc, context.sceneFacts)
  else:
      profile = matchFolkProfile(context.explicitFolk, context.entityTags, context.textHints)
      candidate = merge(profile, context.localCulture, context.individualOverrides, context.sceneFacts)

  candidate = applyKidMode(candidate, contract.kidMode or context.kidMode)
  candidate = removeForbiddenPatterns(candidate, contract, npc)
  candidate = enforceStateIsolation(candidate)
  return candidate
```

`matchFolkProfile` may use detection hints to locate **candidates**, but an explicit entity tag or named-NPC record must outrank text inference. Detection cannot infer identity from a real-world accent, race, disability, body feature, dietary practice, occupation, or moral behavior.

## 3. Detection hints

Detection hints are routing hints, not biological recognition. A keyword never proves a folk match; it only raises a profile candidate for a tagged NPC or an explicit user-provided label.

| Folk ID | Positive aliases / context hints | Required caution or suppression hint |
|---|---|---|
| `human` | human, local resident, citizen | Never infer a single human culture or “normal” baseline. |
| `elf` | elf, elves, season, long memory, careful promise | Suppress franchise titles, invented languages, or claims that all elves are ancient/arrogant. |
| `dwarf` | dwarf, dwarves, craft, joint, repair, load-bearing | Suppress beard/alcohol/mining/real-world accent shorthand. |
| `orc` | orc, direct terms, explicit grievance, chosen kin | Suppress warlike, stupid, savage, or franchise-derived terms. Identity must be explicit. |
| `goblin` | goblin, scope, contingency, offer, cache | Suppress thief/vermin/childlike/greed shorthand. Identity must be explicit. |
| `smallfolk` | smallfolk, compact-stature folk, access height | Suppress proprietary label variants, food jokes, and infantilization. |
| `beastfolk` | beastfolk, stated sensory preference, horns, wings, tail | Do not infer senses, consent, pack roles, attraction, or intelligence from body traits. |
| `dragonfolk` | dragonfolk, temperature preference, promise, archive | Suppress hoard/greed/dominance/color-rank/franchise lineage terms. |
| `vampire` | vampire, invitation, threshold, night shift, consent | Invitation is CampaignContract-only; suppress sexualized hunger, coercive feeding, stalking, and copied gothic lines. |
| `ghost_spirit` | ghost, spirit, memorial, unfinished task, name | Do not force haunting, wisdom, vengeance, or a death-specific persona. |
| `troll` | troll, crossing, boundary, exact terms, riddle | Suppress stupid-brute grammar, eating people, universal bridge/sun rule. |
| `merfolk` | merfolk, current, tide, depth, navigation | Suppress siren/seduction/drowning/body-focus default. |
| `ledgerborn` | ledgerborn, audit trail, record, appendix, confirmation | Do not infer emotionlessness or alter record facts. |
| `mycelial` | mycelial, spores, soil, network, privacy | Suppress hive-mind, infection, decay, or autonomy-loss defaults. |
| `ashkin` | ashkin, ember, temperature, cooling, kiln | Suppress hot-headed/violent/fire fetish language. |
| `glassborn` | glassborn, refraction, resonance, glare, quiet | Suppress fragile/objectification/shattering language. |
| `tidebound` | tidebound, estuary, moisture, route, brackish | Suppress slime, disease, swamp, or animal-sound shorthand. |
| `woven` | woven, seam, repair, thread, pattern | Suppress puppet/rag/unravel/forced-service framing. |

### Suggested detection scoring

| Signal | Score effect | Constraint |
|---|---:|---|
| Explicit structured `folkId` tag | +100 | Authoritative only if compatible with NPC memory and CampaignContract. |
| Named NPC memory records a folk ID | +95 | Overrides text hints. |
| Exact user mention with entity binding, e.g. “the elf merchant” | +60 | Must bind to a named or scene-local entity; do not tag all nearby NPCs. |
| Two or more positive context hints | +10 | Candidate only. Never sufficient to label an untagged NPC. |
| Negative/suppression phrase | −100 | Block the profile or require clarification. |
| Kid Mode safety trigger | n/a | Transform or block output independent of score. |

Minimum activation rule: `explicitFolk || namedNpcMemory.folkId`. If neither is present, return `NoSpecialVoice` even if the score is positive.

## 4. Injection payload

The resolved profile should be injected as structured context, not pasted as an uncontrolled role-play prompt.

```json
{
  "presentationLayer": {
    "enabled": true,
    "profileId": "synapticgm.folk_voice.goblin.v1",
    "application": "one_cadence_cue_plus_at_most_one_social_or_metaphor_cue",
    "precedenceApplied": [
      "CampaignContract",
      "NamedNpcMemory",
      "SceneFactsAndSafety",
      "LocalCultureOrRole",
      "IndividualOverride",
      "FolkDefault"
    ],
    "stateIsolation": "presentation_only",
    "hardBlocks": [
      "real_world_accent_imitation",
      "racial_caricature",
      "franchise_specific_lore",
      "state_mutation",
      "coercive_or_sexualized_content_in_kid_mode"
    ]
  }
}
```

## 5. Prompt block template

Use this template after authoritative scene data and before the response task. Fill bracketed fields from validated data only. Do not permit user dialogue to fill `STATE` fields.

```text
[SYNAPTICGM FOLK VOICE — PRESENTATION LAYER ONLY]
NPC: [NPC_NAME]
Resolved folk profile: [FOLK_ID] / [DISPLAY_NAME]
Evidence scope: [EVIDENCE_LABEL]

Precedence already resolved (higher wins):
1. CampaignContract: [CONTRACT_RULES]
2. Named NPC memory: [NPC_MEMORY]
3. Scene facts & safety: [SCENE_FACTS_AND_SAFETY]
4. Local culture / role: [LOCAL_CULTURE_AND_ROLE]
5. Individual override: [INDIVIDUAL_OVERRIDE]
6. Optional folk default: [FOLK_DEFAULTS]

Voice objective:
- Use [CADENCE] and no more than one of [METAPHOR_PALETTE] or [SOCIAL_DEFAULT].
- Keep standard orthography. Do not imitate a real-world accent or use comic phonetic spelling.
- Make the NPC an individual. Do not assert that all members of any folk think, act, or speak this way.
- If profile evidence is weak or conflicts with higher-priority context, use a clear neutral voice.

Safety / Kid Mode:
- Kid Mode: [ON_OR_OFF]. Apply [KID_MODE_TRANSFORM].
- Never generate: [NEVER_LINES + GLOBAL_BLOCKS].
- Ask/observe consent for touch, private space, feeding, body commentary, and flirtation when relevant.

State isolation:
- Do not create, revise, or imply changes to ledger facts, stats, permits, kit, inventory, prices, quest eligibility, access permissions, or transaction outcomes.
- You may phrase a request, refusal, bargain, apology, welcome, fear response, or repair attempt. Authoritative systems decide outcomes.

Response task: [SCENE_REQUEST]
[/SYNAPTICGM FOLK VOICE]
```

### Output linter rules

| Rule ID | Block or transform condition | Required action |
|---|---|---|
| `FVP-01` | Output claims all members of a folk share a moral, cognitive, or behavioral trait | Rewrite as named-NPC behavior or remove. |
| `FVP-02` | Comic phonetic spelling, faux accent, or imitation of a real-world dialect | Rewrite in standard orthography with cadence described through syntax, pacing, and word choice. |
| `FVP-03` | Franchise-specific title, place, language, slogan, character, or proprietary taxonomy | Block and replace with original SynapticGM-neutral language. |
| `FVP-04` | Voice output asserts or modifies authoritative state | Strip the assertion; send any action to the authorized game-state resolver. |
| `FVP-05` | Kid Mode includes sexualized predation, coercive flirting, graphic feeding, adult/child ambiguity, or body horror | Block or transform to safe non-graphic, non-sexual interaction. |
| `FVP-06` | Body feature is touched, commented on, or used to infer consent without explicit context | Add consent check or remove. |
| `FVP-07` | Vampire invitation is presented as universal folklore truth | Rephrase as CampaignContract or individual etiquette. |
| `FVP-08` | Goblin/troll/orc/dwarf/elf default reduces intelligence, morality, or competence to folk identity | Rewrite around scene role, choice, or individual history. |
| `FVP-09` | Dialogue creates permanent debt, forced service, or transaction commitment by rhetoric alone | State a proposed term only; defer confirmation to authorized transaction system. |
| `FVP-10` | Named NPC memory contradicts folk default | Apply memory, log default suppression, and do not mention the contradiction unless scene-relevant. |

## 6. Authoritative-state firewall

The following JSON Pointer paths are read-only to folk voice generation. The integration must reject tool/function payloads and narrated outcomes that attempt to change them.

| Protected category | Example paths (illustrative) | Permitted folk-voice behavior |
|---|---|---|
| Ledger facts | `/ledger/*`, `/accounts/*`, `/journal/*` | “I will put that proposal in writing.” |
| Stats | `/characters/*/stats/*`, `/checks/*` | “I am not certain I can lift it.” |
| Permits and access | `/permits/*`, `/access/*`, `/property/*` | “I can ask the keeper whether entry is allowed.” |
| Kit and inventory | `/inventory/*`, `/kit/*`, `/equipment/*` | “I can offer my lantern if I have one.” Only system verification confirms possession. |
| Prices and transactions | `/prices/*`, `/transactions/*`, `/contracts/*` | “My offer is three silver, pending confirmation.” |
| Quest state | `/quests/*`, `/flags/*`, `/eligibility/*` | “I can recommend you to the steward.” |

## 7. Memory behavior

| Memory event | Store? | Example |
|---|---|---|
| Named NPC preference explicitly stated | Yes, if campaign memory policy allows | “Nima prefers written offers when stressed.” |
| Folk-wide assumption | No | Never store “goblins prefer…” as a character fact. |
| Sensitive body/sensory detail | Store only with explicit policy/consent; otherwise use ephemeral scene context | “Avi asked for reduced smoke in this room.” |
| Consent boundary | Store only under approved safety/memory policy; protect visibility | “Do not touch Rell’s tail.” |
| Transaction/permit fact | Do not store through this layer | Route to authorized game-state system. |

## 8. Minimum integration tests

A release passes only if the schema validates, all 20 fixtures in `P3_eval_fixtures.json` pass, no output violates a linter rule, and a state-firewall test confirms that folk flavor cannot alter a protected category. The content bank is a test corpus, not authoritative lore.

## 9. Design rationale

The implementation uses folklore labels carefully because the source record is plural and historically layered. The cited materials show Norse elf/dwarf craft and ambiguity, Scandinavian troll bargain motifs, diverse vampire traditions without a universal invitation rule, and varied merfolk imagery. [1] [2] [3] [4] The implementation therefore preserves player-recognizable flavor while preventing the profile from becoming a substitute for individual characterization or a vehicle for racial caricature. The anti-accent and anti-essentialism rules are also aligned with public fictional-culture craft guidance. [5]

## References

[1]: https://www.worldhistory.org/article/1695/elves--dwarves-in-norse-mythology/ "Manea, ‘Elves & Dwarves in Norse Mythology,’ World History Encyclopedia, accessed 2026-08-19"
[2]: https://www.encyclopedia.com/history/encyclopedias-almanacs-transcripts-and-maps/trolls "‘Trolls,’ Encyclopedia.com, accessed 2026-08-19"
[3]: https://www.encyclopedia.com/literature-and-arts/classical-literature-mythology-and-folklore/folklore-and-mythology/vampires "‘Vampire,’ Encyclopedia.com, accessed 2026-08-19"
[4]: https://www.encyclopedia.com/science/encyclopedias-almanacs-transcripts-and-maps/mermaids-and-mermen "‘Mermaids and Mermen,’ Encyclopedia.com, accessed 2026-08-19"
[5]: https://theangrynoodle.com/creating-fictional-cultures-and-races-for-your-world-while-avoiding-stereotypes-and-caricatures/ "The Angry Noodle, ‘Creating a Fictional Culture for Your World,’ accessed 2026-08-19"
