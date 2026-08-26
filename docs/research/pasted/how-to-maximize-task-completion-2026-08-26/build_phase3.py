#!/usr/bin/env python3
import csv
import json
from pathlib import Path

ROOT = Path('/home/ubuntu/SynapticGM_story_tones_gm_personality_2026-08-26')
SRC = ROOT / 'sources'
OUT = ROOT / 'deliverables'
PREFIX = 'SynapticGM_story_tones_gm_personality_2026-08-26_'

with (SRC / 'draft_tone_catalogue_and_rails.json').open(encoding='utf-8') as f:
    draft = json.load(f)
records = {r['output']['tone_id']: r['output'] for r in draft['results'] if not r.get('error')}

order = [
    'grimdark_bleak_consequence','cozy_low_stakes_comfort','cozy_brutal','pulp_kinetic_adventure',
    'gothic_moonlit_dread','litrpg_system_registrar','military_procedural','dry_wit_deadpan',
    'warm_chronicle','clinical_auditor','mythic_portent','street_balladeer','ashen_archivist',
    'bright_field_guide','noir_case_file','fae_uncanny_tale','hard_sf_terminal','pyoa_branching_crisis',
    'kid_plain_stakes'
]

names = {
    'grimdark_bleak_consequence':'Bleak Consequence',
    'cozy_low_stakes_comfort':'Hearthside Comfort',
    'cozy_brutal':'Cozy Brutal',
    'pulp_kinetic_adventure':'Kinetic Adventure',
    'gothic_moonlit_dread':'Moonlit Dread',
    'litrpg_system_registrar':'System Registrar',
    'military_procedural':'Field Procedural',
    'dry_wit_deadpan':'Dry Deadpan',
    'warm_chronicle':'Warm Chronicle',
    'clinical_auditor':'Clinical Auditor',
    'mythic_portent':'Mythic Portent',
    'street_balladeer':'Street Balladeer',
    'ashen_archivist':'Ashen Archivist',
    'bright_field_guide':'Bright Field Guide',
    'noir_case_file':'Noir Case File',
    'fae_uncanny_tale':'Fae Uncanny Tale',
    'hard_sf_terminal':'Hard-SF Terminal',
    'pyoa_branching_crisis':'Branching Crisis',
    'kid_plain_stakes':'Kid Plain Stakes'
}

dimensions = {
    'grimdark_bleak_consequence':(-1,-2,-1,-1),
    'cozy_low_stakes_comfort':(1,0,-2,1),
    'cozy_brutal':(1,-1,-1,1),
    'pulp_kinetic_adventure':(1,1,0,2),
    'gothic_moonlit_dread':(-1,-2,-1,-1),
    'litrpg_system_registrar':(-1,-1,-1,-2),
    'military_procedural':(-2,-2,-2,-2),
    'dry_wit_deadpan':(1,1,1,-2),
    'warm_chronicle':(1,0,-2,1),
    'clinical_auditor':(-2,-2,-1,-2),
    'mythic_portent':(-2,-2,-2,1),
    'street_balladeer':(2,1,1,2),
    'ashen_archivist':(-2,-2,-1,-2),
    'bright_field_guide':(1,1,-2,2),
    'noir_case_file':(1,1,0,-1),
    'fae_uncanny_tale':(-1,1,0,1),
    'hard_sf_terminal':(-2,-2,-1,-2),
    'pyoa_branching_crisis':(1,-1,-2,1),
    'kid_plain_stakes':(1,0,-2,1),
}

humor_severity = {
    'grimdark_bleak_consequence':(5,95,'death confirmation; safety; player loss; repair'),
    'cozy_low_stakes_comfort':(45,20,'consent; safety; ledger loss; player distress'),
    'cozy_brutal':(25,75,'injury confirmation; death; player failure; Kid peril'),
    'pulp_kinetic_adventure':(35,65,'death; safety; irreversible loss; repair'),
    'gothic_moonlit_dread':(5,90,'consent; grief; death; Kid Mode'),
    'litrpg_system_registrar':(10,75,'repair; purchase; consent; irreversible state'),
    'military_procedural':(5,85,'casualties; failure report; safety; Kid Mode'),
    'dry_wit_deadpan':(55,45,'player failure; death; consent; account; safety; repeat error'),
    'warm_chronicle':(25,40,'grief; player correction; repair; safety'),
    'clinical_auditor':(5,90,'injury; death; consent; error; Kid Mode'),
    'mythic_portent':(5,90,'death; grief; safety; player correction'),
    'street_balladeer':(35,55,'player failure; death; consent; stereotype-sensitive scenes'),
    'ashen_archivist':(5,90,'death; grief; player correction; Kid Mode'),
    'bright_field_guide':(30,30,'injury; safety; repair; player confusion'),
    'noir_case_file':(25,75,'player failure; grief; consent; Kid Mode'),
    'fae_uncanny_tale':(25,70,'consent; hidden cost; player correction; Kid Mode'),
    'hard_sf_terminal':(5,90,'life-support; injury; consent; repair'),
    'pyoa_branching_crisis':(10,85,'time-critical safety; irreversible loss; Kid peril'),
    'kid_plain_stakes':(30,25,'fear; injury; failure; consent; correction'),
}

mapping = {
    'grimdark_bleak_consequence':('rpg|dnd|litrpg','cold-system','army-brief','expert'),
    'cozy_low_stakes_comfort':('rpg|dnd|pyoa','fireside-innkeep','chilled-gm','expert'),
    'cozy_brutal':('litrpg|rpg|dnd','cozy-brutal','chilled-gm','shipped'),
    'pulp_kinetic_adventure':('pyoa|rpg|dnd|litrpg','army-brief','theatrical-jester','expert'),
    'gothic_moonlit_dread':('rpg|dnd','fireside-innkeep','chilled-gm','expert'),
    'litrpg_system_registrar':('litrpg','cold-system','dry-wit','shipped'),
    'military_procedural':('litrpg|dnd|rpg','army-brief','cold-system','shipped'),
    'dry_wit_deadpan':('litrpg|dnd|rpg|pyoa','dry-wit','chilled-gm','shipped'),
    'warm_chronicle':('rpg|dnd|pyoa','fireside-innkeep','chilled-gm','expert'),
    'clinical_auditor':('litrpg|dnd|rpg','cold-system','army-brief','expert'),
    'mythic_portent':('rpg|dnd','fireside-innkeep','theatrical-jester','expert'),
    'street_balladeer':('rpg|dnd|pyoa','theatrical-jester','dry-wit','expert'),
    'ashen_archivist':('rpg|dnd|litrpg','cold-system','fireside-innkeep','expert'),
    'bright_field_guide':('rpg|dnd|pyoa','chilled-gm','fireside-innkeep','expert'),
    'noir_case_file':('rpg|dnd|pyoa','dry-wit','army-brief','expert'),
    'fae_uncanny_tale':('rpg|dnd|pyoa','theatrical-jester','fireside-innkeep','expert'),
    'hard_sf_terminal':('litrpg|pyoa|rpg','cold-system','army-brief','expert'),
    'pyoa_branching_crisis':('pyoa|rpg','army-brief','chilled-gm','expert'),
    'kid_plain_stakes':('litrpg|dnd|rpg|pyoa','chilled-gm','fireside-innkeep','cross-cutting'),
}

source_refs = {
    'grimdark_bleak_consequence':'[4] Beowulf; [4] Poe, The Pit and the Pendulum',
    'cozy_low_stakes_comfort':'[4] The Wind in the Willows; [4] Anne of Green Gables',
    'cozy_brutal':'[4] Beowulf; [4] Grimm fairy-tale forms',
    'pulp_kinetic_adventure':'[4] A Princess of Mars; [4] King Solomon’s Mines; [4] The Lost World',
    'gothic_moonlit_dread':'[4] Dracula; [4] Frankenstein; [4] The Fall of the House of Usher',
    'litrpg_system_registrar':'[1] four-dimensional tone model; modern progression/status-intercalation technique family (no imitation)',
    'military_procedural':'[4] Caesar’s Commentaries; [4] The Art of War',
    'dry_wit_deadpan':'[4] Pride and Prejudice; [4] Mark Twain short-fiction forms; [4] The Importance of Being Earnest',
    'warm_chronicle':'[4] The Wonderful Wizard of Oz; [4] The Wind in the Willows',
    'clinical_auditor':'[4] The Murders in the Rue Morgue; [4] The Adventures of Sherlock Holmes',
    'mythic_portent':'[4] The Odyssey; [4] Beowulf',
    'street_balladeer':'[5] public-domain ballad and oral-story forms',
    'ashen_archivist':'[4] Dracula’s documentary frame; [4] Poe’s ruin imagery',
    'bright_field_guide':'[4] The Voyage of the Beagle; early public-domain field-guide forms',
    'noir_case_file':'[4] The Murders in the Rue Morgue; [4] The Adventures of Sherlock Holmes',
    'fae_uncanny_tale':'[4] Grimm fairy-tale forms; [4] A Midsummer Night’s Dream; [4] Alice’s Adventures in Wonderland',
    'hard_sf_terminal':'[4] The Machine Stops; [4] The War of the Worlds',
    'pyoa_branching_crisis':'[4] The Pit and the Pendulum; interactive-fiction second-person technique family',
    'kid_plain_stakes':'[7][8][9] plain-language and cognitive-accessibility guidance; [4] The Wonderful Wizard of Oz'
}

never_common = 'alter ledger facts or math; invent absent entities or exits; hide consequences; imitate living authors or licensed franchises; bake text, logos, UI, captions, dialogue, or SFX into images; stereotype-lock folkVoice'

gates = {
    'grimdark_bleak_consequence':'GATE_NO_GORE_KID|GATE_NO_JOKE_ON_LOSS|GATE_METAPHOR_FACT_CHECK',
    'cozy_low_stakes_comfort':'GATE_NO_FALSE_SAFETY|GATE_NO_UNEARNED_HEALING|GATE_CONSEQUENCE_PLAIN',
    'cozy_brutal':'GATE_GORE_BY_RATING|GATE_NO_CASUALTY_JOKE|GATE_STATUS_LITERAL',
    'pulp_kinetic_adventure':'GATE_NO_ACTION_INVENTION|GATE_COUNT_PRESERVATION|GATE_CLIFFHANGER_EARNED',
    'gothic_moonlit_dread':'GATE_NO_HIDDEN_ENTITY|GATE_NO_FALSE_OMEN|GATE_KID_SPOOKY_ONLY',
    'litrpg_system_registrar':'GATE_STATUS_SCHEMA|GATE_NUMBER_ECHO|GATE_NO_SYSTEM_TAUNT',
    'military_procedural':'GATE_GEAR_COUNT|GATE_POSITION_AUTHORITY|GATE_NO_DRILL_ABUSE',
    'dry_wit_deadpan':'GATE_HUMOR_SAFE_CONTEXT|GATE_NO_PLAYER_TARGET|GATE_STATUS_LITERAL',
    'warm_chronicle':'GATE_NO_FALSE_MEMORY|GATE_NO_OUTCOME_SOFTEN|GATE_NPC_MEMORY_PRIORITY',
    'clinical_auditor':'GATE_EVIDENCE_ONLY|GATE_NO_MEDICAL_GORE_KID|GATE_NO_FAKE_PRECISION',
    'mythic_portent':'GATE_NO_PROPHECY_FACT|GATE_EPITHET_CAP|GATE_METAPHOR_FACT_CHECK',
    'street_balladeer':'GATE_NO_ACCENT_SPELLING|GATE_NO_RHYME_PRESSURE|GATE_NPC_MEMORY_PRIORITY',
    'ashen_archivist':'GATE_NO_FALSE_HISTORY|GATE_RECORD_VS_LEDGER|GATE_KID_DUST_NOT_DEATH',
    'bright_field_guide':'GATE_OBSERVABLE_ONLY|GATE_NO_TAXONOMY_INVENTION|GATE_SAFE_DISCOVERY',
    'noir_case_file':'GATE_CLUE_AUTHORITY|GATE_NO_SEXUALIZED_CHROME|GATE_NO_PLAYER_CYNICISM',
    'fae_uncanny_tale':'GATE_PACT_EXPLICIT|GATE_NO_HIDDEN_COST|GATE_KID_MISCHIEF_ONLY',
    'hard_sf_terminal':'GATE_TELEMETRY_SOURCE|GATE_UNIT_PRESERVATION|GATE_NO_TECHNOBABBLE_FACT',
    'pyoa_branching_crisis':'GATE_CHOICE_CAUSALITY|GATE_NO_FALSE_TIMER|GATE_NO_SANDBOX_HUB_INVENT',
    'kid_plain_stakes':'GATE_KID_ALWAYS|GATE_PLAIN_LANGUAGE|GATE_NO_PRESSURE|GATE_SAFE_CONFIRMATION',
}

rail_overrides = {
    'grimdark_bleak_consequence':'Lead with the irreversible observed consequence|Use one concrete ruin image, then stop|Offer agency without promising rescue|End on an earned hard choice',
    'cozy_low_stakes_comfort':'Lead with the practical need|Spend one beat on warmth or craft|Keep conflict local in prose, not in math|Offer cooperative or restorative choices when permitted',
    'cozy_brutal':'Open on the clean result|Alternate one visceral beat with one human comfort beat|Keep Status numerically plain|Do not joke about wounds or player failure',
    'pulp_kinetic_adventure':'Start in motion|Use active verbs and one vivid hazard|Name spatial options clearly|End at the next real decision, not a fabricated cliffhanger',
    'gothic_moonlit_dread':'State the result before atmosphere|Let architecture or weather carry dread|Never turn metaphor into an entity|Close on a precise, permitted choice',
    'litrpg_system_registrar':'Emit approved StateTx fields exactly|Use registrar verbs only around chrome|Keep prose physical and concise|Never create a stat, reward, or penalty',
    'military_procedural':'Situation first|Constraints second|Options third|Use coordinates and counts only from SNAPSHOT',
    'dry_wit_deadpan':'Give the fact straight|Allow one understatement after comprehension|Never target the player|Remove jokes from loss, repair, consent, and safety',
    'warm_chronicle':'Answer first|Add one remembered human detail only if pinned|Use reflective cadence after facts|Hand agency back gently and explicitly',
    'clinical_auditor':'Separate observation, evidence, and inference|Use calibrated certainty|Never invent measurements|Close with auditable options',
    'mythic_portent':'State what happened plainly|Add one omen-shaped metaphor labeled as atmosphere|Limit epithets to one per entity|Keep choices concrete and present-tense',
    'street_balladeer':'Open with the action’s consequence|Use one oral cadence or refrain at most|Keep dialect lexical, never phonetic|End with verbs the player can take',
    'ashen_archivist':'Record the result|Add one material trace of age|Distinguish archive inference from ledger fact|Offer the next action without fatalism',
    'bright_field_guide':'Identify the observable feature|Explain one useful implication|Express curiosity without asserting taxonomy|Offer explore, test, or withdraw only when permitted',
    'noir_case_file':'Lead with the clue or consequence|Use one hard image|Separate suspicion from evidence|Never make the player the punchline',
    'fae_uncanny_tale':'State the literal result|Render wonder through pattern and sensory contrast|Make costs and promises explicit|Never conceal a rule behind whimsy',
    'hard_sf_terminal':'Report state first|Use units only when supplied|Label inference and uncertainty|Offer executable actions, not decorative commands',
    'pyoa_branching_crisis':'Address the player directly|Name the immediate hazard|Keep each option physically legible|Do not invent timers, exits, or tools',
    'kid_plain_stakes':'Use common words and short sentences|Say what changed and what stayed the same|Give one safe next step|Never pressure, shame, or conceal cost',
}

# Normalize per-tone records.
for tid in order:
    r = records[tid]
    r['tone_id'] = tid
    r['readable_name'] = names[tid]
    a,b,c,d = dimensions[tid]
    r['dimensions'] = f'formal_casual={a}; serious_funny={b}; respectful_irreverent={c}; matter_of_fact_enthusiastic={d}; scale=-2 first pole to +2 second pole'
    h,s,ban = humor_severity[tid]
    r['humor_dark_ratio'] = f'humor={h}; severity={s}; forbidden_when={ban}'
    modes, primary, secondary, status = mapping[tid]
    r['best_engine_modes'] = modes
    r['primary_personality_id'] = primary
    r['secondary_optional'] = secondary
    r['shipped_personality_overlap'] = f'primary={primary}; secondary={secondary}; availability={status}'
    r['fluid_rail_additions'] = rail_overrides[tid]
    r['choice_pad_bank_id'] = f'choice_{tid}_v1'
    r['status_chrome_template_id'] = f'status_{tid}_v1'
    r['hard_gate_extras'] = gates[tid]
    r['eval_fixture_ids'] = f'fx_common_bridge::{tid}|fx_common_locked_door::{tid}|fx_common_failed_bargain::{tid}'
    r['living_work_technique_note'] = 'Modern technique family may inform pacing or intercalation; DO NOT imitate any living author, title, franchise, series, or studio.'
    r['never_do'] = never_common + '; ' + r.get('never_do','')
    r['evidence_status'] = 'VERIFIED technique references; SPECULATIVE SynapticGM rail synthesis pending product test'
    r['source_refs'] = source_refs[tid]

catalogue_fields = [
    'tone_id','readable_name','one_line_thesis','dimensions','diction','rhythm','humor_dark_ratio',
    'system_vs_prose_split','npc_voice_cues','choice_pad_flavor','memorable_visual_mood',
    'public_domain_technique_refs','living_work_technique_note','never_do','kid_mode_delta',
    'shipped_personality_overlap','evidence_status','source_refs'
]
rails_fields = [
    'tone_id','best_engine_modes','primary_personality_id','secondary_optional','fluid_rail_additions',
    'snapshot_flair_policy','choice_pad_bank_id','status_chrome_template_id','folk_bias','hard_gate_extras',
    'eval_fixture_ids','evidence_status'
]

OUT.mkdir(parents=True, exist_ok=True)
with (OUT / f'{PREFIX}tone_catalogue.csv').open('w', encoding='utf-8', newline='') as f:
    w = csv.DictWriter(f, fieldnames=catalogue_fields)
    w.writeheader()
    for tid in order:
        w.writerow({k: records[tid].get(k,'') for k in catalogue_fields})

with (OUT / f'{PREFIX}tone_to_gm_rails.csv').open('w', encoding='utf-8', newline='') as f:
    w = csv.DictWriter(f, fieldnames=rails_fields)
    w.writeheader()
    for tid in order:
        w.writerow({k: records[tid].get(k,'') for k in rails_fields})

refs = """[1]: https://www.nngroup.com/articles/tone-of-voice-dimensions/ \"The Four Dimensions of Tone of Voice — Nielsen Norman Group\"\n[2]: https://www.nngroup.com/articles/tone-voice-users/ \"The Impact of Tone of Voice on Users' Brand Perception — Nielsen Norman Group\"\n[3]: https://www.nngroup.com/articles/tone-voice-words/ \"Tone-of-Voice Words — Nielsen Norman Group\"\n[4]: https://www.gutenberg.org/ \"Project Gutenberg — Free eBooks\"\n[5]: https://standardebooks.org/ebooks \"Browse Standard Ebooks\"\n[7]: https://www.w3.org/WAI/WCAG2/supplemental/objectives/o3-clear-content/ \"Use Clear and Understandable Content — W3C WAI\"\n[8]: https://www.w3.org/TR/coga-usable/ \"Making Content Usable for People with Cognitive and Learning Disabilities — W3C\"\n[9]: https://digital.gov/guides/plain-language \"Plain Language Guide Series — Digital.gov\"\n"""

md = []
md.append('# Part T1 — Tone and Narrative-Personality Catalogue\n')
md.append('**Author:** Manus AI  \n**Scope:** Live SynapticGM consumer app only.  \n**Status:** Implementation-ready synthesis; absent internal packs are not represented as directly ingested.\n')
md.append('> **Rendering-contract rule:** Tone controls diction, cadence, table manner, system-chrome templates, and presentation suggestions. It never changes the authority-resolved outcome, StateTx, SceneManifest, evidence, numbers, inventory, HP, permits, quest state, NPC presence, or location.\n')
md.append('The four dimension scores use **−2 for the first pole** and **+2 for the second pole**: formal↔casual, serious↔funny, respectful↔irreverent, and matter-of-fact↔enthusiastic. This operationalization adapts NN/g’s four tone dimensions; it is an internal design scale, not a psychometric instrument.[1] Tone variations should be tested with users because humor, trust, and perceived friendliness vary by context.[2] [3]\n')
md.append('## Catalogue index\n')
md.append('| Tone ID | Player label | Core role | Primary shipped ID | Availability |\n|---|---|---|---|---|')
for tid in order:
    r=records[tid]
    md.append(f"| `{tid}` | {r['readable_name']} | {r['one_line_thesis']} | `{r['primary_personality_id']}` | {mapping[tid][3]} |")

for tid in order:
    r=records[tid]
    md.append(f"\n## `{tid}` — {r['readable_name']}\n")
    md.append(f"**Thesis.** {r['one_line_thesis']}\n")
    md.append('| Field | Implementation contract |\n|---|---|')
    for label,key in [
        ('NN/g-style dimensions','dimensions'),('Diction','diction'),('Rhythm','rhythm'),('Humor/severity','humor_dark_ratio'),
        ('System vs prose','system_vs_prose_split'),('NPC voice cues','npc_voice_cues'),('Choice-pad flavour','choice_pad_flavor'),
        ('Memorable visual mood','memorable_visual_mood'),('Public-domain technique references','public_domain_technique_refs'),
        ('Modern-work boundary','living_work_technique_note'),('Never do','never_do'),('Kid Mode delta','kid_mode_delta'),
        ('Shipped overlap','shipped_personality_overlap'),('Evidence','evidence_status')]:
        val=str(r.get(key,'')).replace('\n',' ').replace('|','\\|')
        md.append(f'| {label} | {val} |')
    md.append(f"\n**Source trail:** {r['source_refs']}. Public-domain catalogues support technique analysis, but release outside the United States remains subject to jurisdiction-specific review.[14] [16]\n")

md.append('## Cross-cutting observations\n')
md.append('The catalogue deliberately separates **tone identity** from **moment suitability**. A dry-wit profile may remain selected while humor is temporarily gated off for repair, death, consent, purchase, or safety messages. Likewise, Gothic or mythic atmosphere may raise metaphor density without creating a hidden creature, prophecy, exit, or causal fact. The tone survives by changing sentence shape and sensory selection, not by smuggling state through implication.\n')
md.append('`kid_plain_stakes` is a constraint layer. It can combine with every other tone after the adult-only, pressure, gore, ambiguous-consent, and dense-metaphor gates run. W3C guidance supports short sentences, familiar words, unambiguous instructions, and explicit help for error recovery.[7] [8]\n')
md.append('## References\n\n'+refs+'[14]: https://www.copyright.gov/help/faq/faq-duration.html "How Long Does Copyright Protection Last? — U.S. Copyright Office"\n[16]: https://www.gutenberg.org/policy/license.html "The Project Gutenberg License"\n')
(OUT / f'{PREFIX}Part_T1_tone_catalogue.md').write_text('\n'.join(md), encoding='utf-8')

prior = [
('Cold Registrar','cold-system','direct shipped mapping'),('Sarcastic Patch','dry-wit','direct shipped mapping; no player-targeted sarcasm'),
('Army Brief','army-brief','direct shipped mapping'),('Chilled GM','chilled-gm','direct shipped mapping'),
('Dry Wit','dry-wit','direct shipped mapping'),('Warm Chronicle','fireside-innkeep','Expert additive warm_chronicle rail'),
('Clinical Auditor','cold-system','Expert additive clinical_auditor rail'),('Jester','theatrical-jester','direct shipped mapping; hard humor gates'),
('Velvet Oracle','fireside-innkeep','Expert additive mythic_portent rail; deferred as standalone ID'),
('Street Balladeer','theatrical-jester','Expert additive street_balladeer rail; deferred as standalone ID'),
('Ashen Archivist','cold-system','Expert additive ashen_archivist rail; deferred as standalone ID'),
('Bright Field Guide','chilled-gm','Expert additive bright_field_guide rail; deferred as standalone ID')]

md2=[]
md2.append('# Part T2 — Applying Tones Through Existing SynapticGM GM Levers\n')
md2.append('**Author:** Manus AI  \n**Architecture decision:** Extend `gmVoiceProfile`, `fluidProseRails`, `folkVoiceExpectations`, `choiceTierRules`, opener pointers, status/repair copy, `proseWarden`, and perspective rendering. Do not add a parallel personality engine.\n')
md2.append('> **Authority pipeline:** player correction → pinned canon → StateTx → SceneManifest → evidence → invention. The renderer receives the permitted outcome; personality never participates in deciding it.\n')
md2.append('## Tone-to-lever matrix\n')
md2.append('| Tone ID | Modes | Primary | Secondary | Additive rail summary | Choice bank | Status template | Hard gates |\n|---|---|---|---|---|---|---|---|')
for tid in order:
    r=records[tid]
    rail=r['fluid_rail_additions'].replace('|','; ')
    gatestr=r['hard_gate_extras'].replace('|','; ')
    md2.append(f"| `{tid}` | {r['best_engine_modes']} | `{r['primary_personality_id']}` | `{r['secondary_optional']}` | {rail} | `{r['choice_pad_bank_id']}` | `{r['status_chrome_template_id']}` | {gatestr} |")

md2.append('\n## New Game Simple picks and Expert matrix\n')
md2.append('| Surface | Four Simple picks | Compatibility treatment |\n|---|---|---|\n| Narrator | `chilled-gm` Friendly Guide; `dry-wit` Dry Wit; `army-brief` Mission Lead; `fireside-innkeep` Fireside Chronicler | `theatrical-jester` remains shipped and available under Expert/More styles; old saves render unchanged. |\n| System chrome | `cold-system` Cold Registrar; `dry-wit` Sarcastic Patch; `army-brief` Army Quartermaster; `chilled-gm` Friendly System | `cozy-brutal` remains shipped and appears as a Featured Tone shortcut plus Expert; `theatrical-jester` remains valid on old saves but is not promoted in the primary LitRPG list. |')
md2.append('\nThis presentation does **not** remove shipped IDs. It reduces first-run choice overload while preserving save compatibility and discoverability. A tone selection writes the existing personality field plus an additive `tone_id`; if schema change is unavailable, store only the shipped ID and apply the tone as a deterministic preset expansion at render time.\n')

md2.append('## Prior-vibe preset reconciliation\n')
md2.append('| Research preset | Shipped ID | Disposition |\n|---|---|---|')
for p,s,d in prior:
    md2.append(f'| {p} | `{s}` | {d} |')

md2.append('\n## Surprise-me pairing policy\n')
md2.append('| Pair class | Rule | Examples |\n|---|---|---|\n| Safe default | Same-severity or complementary cadence; System chrome remains literal. | Warm Chronicle + Friendly System; Kinetic Adventure + Army Quartermaster; Bright Field Guide + Friendly System. |\n| Allowed with gate | Contrast is acceptable only if humor and threat gates pass. | Moonlit Dread + Dry Wit with humor disabled at harm; Cozy Brutal + Cold Registrar; Fae Uncanny + Army Brief for explicit pact costs. |\n| Banned | Pairing would trivialize peril, pressure a child, or obscure ledger truth. | Theatrical Jester + grimdark in Kid Mode; Dry Wit on death/consent/repair; Mythic Portent with invented prophecy; Fae Uncanny with hidden mechanical prices; any theme-token choice treated as semantic authority. |')

md2.append('\n## Semantic render-equivalence rule\n')
md2.append('For a fixed authority payload, changing `tone_id`, `gmPersonality`, `systemPersonality`, perspective, theme, or art eligibility must preserve the canonical projection: `location_id`, `present_entity_ids`, `exit_ids`, `inventory`, `hp`, `resource_deltas`, `quest_flags`, `permits`, `rolls`, `outcome_code`, `time_delta`, and evidence citations. A recommended fixture computes `canonicalHash(authorityProjection(output))` for every tone and requires equality before snapshotting prose. Tone-specific metaphor is then scanned for claims that could be parsed as additional entities, exits, possessions, rewards, damage, or timers. Parameterized and snapshot testing are supported directly by Vitest.[10] [11]\n')

md2.append('## Opening hook deck: camera, never facts\n')
md2.append('| Hook family | Fixed facts | Tone-adjustable camera | Prohibition |\n|---|---|---|---|\n| System Arrival | The existing deck record supplies the location, visible arrival event, available exits, and any Status notice. | Registrar foregrounds registration; Gothic foregrounds light and architecture; Pulp foregrounds motion; Warm Chronicle foregrounds a human-scale object. | Do not add a summoned being, reward, timer, witness, or exit. |\n| Debt Under Glass | The existing deck record supplies the debt fact, glass object or setting fact, parties present, and available responses. | Noir foregrounds clue order; Clinical Auditor separates evidence from inference; Fae Uncanny foregrounds the literal wording of a pact; Kid Mode explains the obligation plainly. | Do not change the debt amount, creditor, deadline, ownership, or consent state. |\n| Other opener-pointer families | **INPUT REQUIRED:** `opener_pointer_examples.md` was not attached. | Apply the same camera-only transformation after ingest. | No invented deck names or facts. |')

md2.append('\n## Perspective interaction\n')
md2.append('| Setting | Contract | Tone implication |\n|---|---|---|\n| Second person | Use “you” only for confirmed perception, position, bodily response, and chosen action. Never assert unchosen thought, emotion, or intent. | Best for PYOA and kinetic tones; strictest anti-puppeteering gate. |\n| Third person limited | Use the player-character name or pronoun and report only observable facts plus permitted internal state. | Adds chronicle or noir distance without omniscient invention. |\n| Third person external | No interior claims. Camera can select detail but cannot infer motive. | Best for Clinical, Military, Hard-SF, and audit fixtures. |')

md2.append('\n## Visible moat and deterministic repair copy\n')
md2.append('Tone may vary the wrapper around **status / why / repair**, but each template must retain the same three slots: `STATUS` names the machine fact, `WHY` cites the authority source or gate, and `REPAIR` offers a permitted next step without changing state. Error copy should be precise, constructive, non-blaming, and humor-free where recovery is the user’s priority.[12] [13]\n')

md2.append('## Anti-list\n')
md2.append('| No-Go idea | Why it fails | Deterministic alternative |\n|---|---|---|\n| Second LLM tone critic or Continuity-Warden critic | Adds cost, latency, nondeterminism, and a rival semantic authority. | Regex/classifier scrub classes, invariant hashes, and snapshot fixtures. |\n| Tone-specific state mutation | Violates the rendering firewall and makes switching voices unsafe. | Apply tone after StateTx and SceneManifest. |\n| Full every-turn comic generation | Burns Free COGS and increases timeout risk. | Sparse comic-lite eligibility plus memorable asynchronous plates. |\n| Theme semantics as truth | A cosmetic palette can imply unsupported facts. | Themes affect tokens and presentation only. |\n| Hidden fae bargains or noir clues | Turns atmosphere into undisclosed mechanics. | Explicit pact/clue fields sourced from authority. |\n| Accent spelling by folk | Creates stereotype lock and accessibility failures. | Lexical and social-instinct cues; named-NPC memory wins. |\n| RAG as tone memory truth | Retrieved prose may override current state or import IP. | Store tone ID, compact rails, and deterministic banks. |\n| Baked dialogue or UI in generated art | Text becomes stale, unreadable, and unauditable. | HTML/SVG overlay lettering only. |')

md2.append('\n## References\n\n[1]: https://www.nngroup.com/articles/tone-of-voice-dimensions/ "The Four Dimensions of Tone of Voice — Nielsen Norman Group"\n[2]: https://www.nngroup.com/articles/tone-voice-users/ "The Impact of Tone of Voice on Users’ Brand Perception — Nielsen Norman Group"\n[10]: https://vitest.dev/guide/learn/writing-tests.html "Writing Tests — Vitest"\n[11]: https://vitest.dev/guide/snapshot "Snapshot — Vitest"\n[12]: https://www.nngroup.com/articles/error-message-guidelines/ "Error-Message Guidelines — Nielsen Norman Group"\n[13]: https://www.nngroup.com/articles/error-messages-scoring-rubric/ "An Error Messages Scoring Rubric — Nielsen Norman Group"\n')
(OUT / f'{PREFIX}Part_T2_GM_application.md').write_text('\n'.join(md2), encoding='utf-8')

print('Wrote phase 3 deliverables')
