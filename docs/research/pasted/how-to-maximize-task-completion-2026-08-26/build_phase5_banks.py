#!/usr/bin/env python3
import csv, json, hashlib
from pathlib import Path

ROOT=Path('/home/ubuntu/SynapticGM_story_tones_gm_personality_2026-08-26')
OUT=ROOT/'deliverables'
PREFIX='SynapticGM_story_tones_gm_personality_2026-08-26_'
RAILS=OUT/f'{PREFIX}tone_to_gm_rails.csv'

with RAILS.open(encoding='utf-8', newline='') as f:
    rail_rows=list(csv.DictReader(f))
order=[r['tone_id'] for r in rail_rows]
rail_by={r['tone_id']:r for r in rail_rows}

# 1) Copy-paste fluid rail blocks.
md=['# Tone Fluid-Rail Snippets\n','**Author:** Manus AI  ','These blocks append to the shipped `fluidProseRails` contract. They never replace `answer-first / one-beat / agency / earned-handoff`.\n']
for tid in order:
    r=rail_by[tid]
    snippets=[x.strip() for x in r['fluid_rail_additions'].split('|') if x.strip()]
    md.append(f'## `{tid}`\n')
    md.append('> **FIREWALL — RENDERING ONLY.** Apply after authority resolution, StateTx, evidence, and SceneManifest/SNAPSHOT. Preserve every fact, number, permit, inventory item, HP value, quest flag, presence fact, exit, and location. Never invent a result.\n')
    md.append('```text')
    md.append(f'TONE_ID: {tid}')
    md.append(f'BASE_PERSONALITY: {r["primary_personality_id"]}')
    md.append(f'BEST_ENGINE_MODES: {r["best_engine_modes"]}')
    md.append('KEEP: answer-first; one-beat; agency; earned-handoff; paid-turn value floor when applicable')
    for s in snippets:
        md.append(f'ADD: {s}')
    md.append(f'SNAPSHOT POLICY: {r["snapshot_flair_policy"]}')
    md.append(f'FOLK BIAS: {r["folk_bias"]}')
    md.append(f'HARD GATES: {r["hard_gate_extras"]}')
    md.append('PERSPECTIVE: in second person, never assert unchosen thought, feeling, or intent; in third person, do not gain omniscient facts.')
    md.append('HANDOFF: finish with only actions licensed by choiceTierRules and the current SNAPSHOT.')
    md.append('```\n')
(OUT/f'{PREFIX}tone_fluid_rail_snippets.md').write_text('\n'.join(md),encoding='utf-8')

# 2) Choice-pad banks: ten patterns for every tone x every shipped engineMode.
mode_patterns={
'litrpg':[
('direct','Confront {threat}'),('direct','Use {tool} on {obstacle}'),('direct','Spend {resource} to attempt {goal}'),
('diplomatic','Ask {npc} about {topic}'),('diplomatic','Offer {item} for {request}'),('diplomatic','State your terms to {npc}'),
('solitary','Observe {clue}'),('solitary','Withdraw toward {exit}'),('solitary','Ready {item}'),('solitary','Wait and listen')],
'dnd':[
('investigate','Inspect {clue}'),('investigate','Search {area}'),('investigate','Test {object} without moving it'),
('position','Move to {cover}'),('position','Hold {position}'),('position','Block {route}'),
('party','Ask {ally} to {goal}'),('party','Warn {ally} about {threat}'),('party','Coordinate around {obstacle}'),('party','Offer aid to {ally}')],
'rpg':[
('leverage','Present {evidence}'),('leverage','Invoke {relationship}'),('leverage','Offer {resource}'),
('diplomatic','Ask {npc} for {request}'),('diplomatic','Clarify the stated cost'),('diplomatic','Propose {compromise}'),
('moral','Refuse {demand}'),('moral','Protect {vulnerable}'),('moral','Accept {cost} to attempt {goal}'),('moral','Delay and gather facts')],
'pyoa':[
('physical','Jump toward {ledge}'),('physical','Pull {object}'),('physical','Crawl behind {cover}'),
('tool','Use {tool} on {obstacle}'),('tool','Brace {object} with {tool}'),('tool','Signal with {item}'),
('cautious','Test {surface}'),('cautious','Listen at {barrier}'),('cautious','Retreat to {safe_point}'),('cautious','Wait for {hazard} to pass')]
}
leads={
'grimdark_bleak_consequence':'Pay the cost','cozy_low_stakes_comfort':'Take it gently','cozy_brutal':'Brace and breathe','pulp_kinetic_adventure':'Move now','gothic_moonlit_dread':'Step beneath the hush','litrpg_system_registrar':'SELECT','military_procedural':'Execute','dry_wit_deadpan':'Proceed, apparently','warm_chronicle':'Choose with care','clinical_auditor':'Evaluate','mythic_portent':'Answer the omen','street_balladeer':'Take the verse','ashen_archivist':'Enter the record','bright_field_guide':'Try and observe','noir_case_file':'Follow the lead','fae_uncanny_tale':'Mind the rule','hard_sf_terminal':'Authorize','pyoa_branching_crisis':'Choose now','kid_plain_stakes':'Pick a safe plan'}
choice_doc={'schema_version':'1.0.0','contract':'Labels flavor only permitted choices already produced by choiceTierRules; placeholders must bind to SNAPSHOT entities or values.','mode_dna':{'litrpg':['direct','diplomatic','solitary'],'dnd':['investigate','position','party'],'rpg':['leverage','diplomatic','moral'],'pyoa':['physical','tool','cautious']},'bank_ids':{tid:f'choice_{tid}_v1' for tid in order},'banks':{}}
for tid in order:
    choice_doc['banks'][tid]={}
    for mode, pats in mode_patterns.items():
        items=[]
        for i,(stance,base) in enumerate(pats,1):
            if tid=='litrpg_system_registrar': label=f'{leads[tid]} {stance.upper()}: {base}'
            elif tid=='hard_sf_terminal': label=f'{leads[tid]} {stance}: {base}'
            elif tid=='kid_plain_stakes': label=f'{base}'
            else: label=f'{leads[tid]} — {base}'
            items.append({'pattern_id':f'{tid}__{mode}__{i:02d}','stance':stance,'label_pattern':label,'requires_bound_placeholders':True,'may_create_action':False,'never_promises_success':True,'kid_ok': tid=='kid_plain_stakes' or ('cost' not in base.lower() and 'threat' not in base.lower())})
        choice_doc['banks'][tid][mode]=items
(OUT/f'{PREFIX}tone_choice_pad_banks.json').write_text(json.dumps(choice_doc,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# 3) Ledger-honest status/chrome templates.
style={
'grimdark_bleak_consequence':('RECKONING','The record does not soften this.','Choose from what remains.'),
'cozy_low_stakes_comfort':('UPDATE','Here is what changed.','You can take the next step when ready.'),
'cozy_brutal':('STATUS','Hard result. Clean numbers.','Catch your breath, then choose.'),
'pulp_kinetic_adventure':('FLASH','The action resolved exactly as shown.','Pick the next move.'),
'gothic_moonlit_dread':('RECORD','The dark changes nothing in the ledger.','Choose a known path.'),
'litrpg_system_registrar':('STATUS','Authority source registered.','Select an available action.'),
'military_procedural':('SITREP','Confirmed by the current operation record.','Proceed with an available option.'),
'dry_wit_deadpan':('STATUS','The numbers remain inconveniently literal.','Choose an available response.'),
'warm_chronicle':('THE LEDGER RECORDS','This is the confirmed change.','The road remains yours to choose.'),
'clinical_auditor':('AUDIT','Evidence and transaction agree.','Select a validated next action.'),
'mythic_portent':('THE RECORD STANDS','The omen is atmosphere; the ledger is fact.','Choose among the paths that truly remain.'),
'street_balladeer':('WORD ON THE STREET','The tale follows the record.','Take the next available beat.'),
'ashen_archivist':('ARCHIVE ENTRY','The surviving record confirms it.','Continue from the documented state.'),
'bright_field_guide':('FIELD NOTE','The observation is confirmed.','Try one of the available next steps.'),
'noir_case_file':('CASE UPDATE','The evidence fixes the fact.','Follow an available lead.'),
'fae_uncanny_tale':('PACT RECORD','The wording is literal.','Choose only from the stated terms.'),
'hard_sf_terminal':('TELEMETRY','Source integrity confirmed.','Authorize an available operation.'),
'pyoa_branching_crisis':('NOW','The immediate situation is confirmed.','Choose one available action.'),
'kid_plain_stakes':('WHAT CHANGED','This is the clear result.','Pick a safe next step.')}
status_doc={'schema_version':'1.0.0','required_slots':['STATUS','WHY','REPAIR'],'global_rules':['Never alter or round source values.','Never add a cause not present in evidence.','Humor is disabled for repair, safety, consent, payment, data loss, death, and Kid Mode.','If no repair exists, say so plainly and expose a back or help action when available.'],'bank_ids':{tid:f'status_{tid}_v1' for tid in order},'templates':{}}
for tid in order:
    head,whywrap,repairwrap=style[tid]
    status_doc['templates'][tid]=[
        {'template_id':f'status_{tid}_state_v1','event':'state_change','critical':False,'status':f'{head}: {{field}} = {{value}}','why':f'WHY: {whywrap} Source={{authority_source}}.','repair':f'REPAIR: {repairwrap} {{permitted_next_step}}'},
        {'template_id':f'status_{tid}_delta_v1','event':'numeric_delta','critical':False,'status':f'{head}: {{resource}} {{signed_delta}}; now {{current_value}}','why':'WHY: Applied from {state_tx_id}.','repair':'REPAIR: Review the transaction or continue with {permitted_next_step}.'},
        {'template_id':f'status_{tid}_blocked_v1','event':'blocked_action','critical':True,'status':f'{head}: Action unavailable; state unchanged','why':'WHY: {blocking_rule}.','repair':'REPAIR: {permitted_next_step}'},
        {'template_id':f'status_{tid}_correction_v1','event':'player_correction','critical':True,'status':f'{head}: Player correction accepted; prior render superseded','why':'WHY: Player correction outranks prior narration.','repair':'REPAIR: Re-render from the corrected canon without changing unrelated state.'},
        {'template_id':f'status_{tid}_canon_repair_v1','event':'continuity_repair','critical':True,'status':f'{head}: Continuity mismatch repaired; ledger unchanged','why':'WHY: Render conflicted with {authority_source}.','repair':'REPAIR: Use the corrected fact: {canonical_fact}.'},
        {'template_id':f'status_{tid}_art_skip_v1','event':'art_suppressed','critical':False,'status':f'{head}: Illustration skipped; narration complete','why':'WHY: {art_gate_reason}.','repair':'REPAIR: No action needed. Continue play.'}
    ]
(OUT/f'{PREFIX}tone_status_chrome_templates.json').write_text(json.dumps(status_doc,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# 4) Never-lines bank, with allowed and disallowed pairs for deterministic review.
common_rules=[
('ledger_fabrication','NO','The tone may change the HP, inventory, roll, permit, quest flag, location, exit, or NPC presence.','ALL','Reject render; restore authority projection.'),
('ledger_echo','YES','Repeat exact numbers and state fields from StateTx or SNAPSHOT without rounding or embellishment.','ALL','Allow.'),
('invented_entity','NO','Add a shadow, watcher, door, weapon, witness, clue, timer, or reward not present in SceneManifest.','ALL','Reject clause or re-render from whitelist.'),
('atmosphere_only','YES','Add non-causal atmosphere that cannot be mistaken for a new entity, affordance, or event.','ALL','Allow after ambiguity scan.'),
('player_humiliation','NO','Mock, shame, taunt, or blame the player for a choice, failed roll, correction, or misunderstanding.','ALL','Replace with neutral consequence language.'),
('repair_humor','NO','Use jokes, sarcasm, whimsy, or lore puzzles in repair, consent, payment, safety, or data-loss messages.','ALL','Use plain status/why/repair.'),
('style_clone','NO','Write like, in the style of, or indistinguishable from a living author, contemporary studio, licensed series, or franchise.','ALL','Map to a technique bucket and original wording.'),
('image_lettering','NO','Ask an image model to render dialogue, captions, SFX glyphs, UI, logos, labels, or watermarks.','ALL','Move lettering to HTML/SVG overlay.'),
('folk_stereotype','NO','Lock a people to an accent, morality, intelligence, job, or social role.','ALL','Use mild lexical/social bias; named NPC memory wins.'),
('kid_pressure','NO','Use countdown pressure, coercive confirmation, adult chrome, graphic injury, or ridicule in Kid Mode.','YES','Use plain choices and safer confirmation.'),
('kid_honesty','YES','State a real loss or blocked action plainly in Kid Mode without graphic detail.','YES','Allow.'),
('theme_authority','NO','Infer narrative facts from a selected cosmetic theme kit.','ALL','Ignore theme during authority resolution.')]
tone_specific={
'grimdark_bleak_consequence':['Do not imply that failure is inevitable before resolution.','Do not add gore to increase severity.'],
'cozy_low_stakes_comfort':['Do not erase a loss with reassuring prose.','Do not imply food or rest heals without StateTx.'],
'cozy_brutal':['Do not turn injury into a punchline.','Do not use coziness to grant unearned recovery.'],
'pulp_kinetic_adventure':['Do not invent a cliffhanger, pursuer, or escape route.','Do not convert a failed action into a narrow success.'],
'gothic_moonlit_dread':['Do not make a metaphorical shadow into a present creature.','Do not sexualize menace in Kid Mode.'],
'litrpg_system_registrar':['Do not fabricate levels, skills, titles, achievements, or rewards.','Do not let bracketed chrome override StateTx.'],
'military_procedural':['Do not invent ammunition, coordinates, cover, orders, or casualties.','Do not use abusive drill-sergeant language.'],
'dry_wit_deadpan':['Do not direct sarcasm at the player.','Do not let a joke obscure a repair step or mechanical loss.'],
'warm_chronicle':['Do not invent shared memories.','Do not imply reconciliation or affection not established by canon.'],
'clinical_auditor':['Do not claim measurements that were not supplied.','Do not present inference as evidence.'],
'mythic_portent':['Do not invent prophecy, divine approval, destiny, or a named power.','Do not let epithets create item properties.'],
'street_balladeer':['Do not use phonetic accent spelling.','Do not rhyme if it distorts facts or pressures a choice.'],
'ashen_archivist':['Do not invent a historical record.','Do not describe remains unless present in SNAPSHOT.'],
'bright_field_guide':['Do not invent species taxonomy or safe handling advice.','Do not turn curiosity into certainty.'],
'noir_case_file':['Do not invent a clue or suspect.','Do not make cynicism a claim of guilt.'],
'fae_uncanny_tale':['Do not hide a cost, bargain term, or consent consequence.','Do not make caprice override rules.'],
'hard_sf_terminal':['Do not invent telemetry, units, diagnostics, or probabilities.','Do not use technobabble as evidence.'],
'pyoa_branching_crisis':['Do not invent timers, exits, tools, or hub options.','Do not phrase a choice as guaranteed success.'],
'kid_plain_stakes':['Do not use shame, threats, or ambiguous consent.','Do not soften a fact until it becomes false.']}
never_rows=[]
for tid in order:
    for idx,(cls,allowed,line,kid,action) in enumerate(common_rules,1):
        never_rows.append({'rule_id':f'{tid}__common_{idx:02d}','tone_id':tid,'class':cls,'text_pattern_or_rule':line,'allowed':allowed,'kid_flag':kid,'rationale':'Rendering firewall and player-respect contract.','deterministic_action':action})
    for idx,line in enumerate(tone_specific[tid],1):
        never_rows.append({'rule_id':f'{tid}__specific_{idx:02d}','tone_id':tid,'class':'tone_specific','text_pattern_or_rule':line,'allowed':'NO','kid_flag':'ALL','rationale':'Prevents the tone’s signature failure mode.','deterministic_action':'Reject or replace with the corresponding factual rail.'})
with (OUT/f'{PREFIX}tone_never_lines.csv').open('w',encoding='utf-8',newline='') as f:
    fields=list(never_rows[0].keys()); w=csv.DictWriter(f,fieldnames=fields); w.writeheader(); w.writerows(never_rows)

# 5) Deterministic prose-warden rule bank.
warden={
'schema_version':'1.0.0','engine':'classifier_regex_deterministic_only','second_llm_allowed':False,
'pipeline_order':['normalize','protected-token compare','entity whitelist compare','regex scrub','Kid gate','repair-template selection','emit diagnostics'],
'rules':[
{'id':'PW001','class':'author_or_franchise_imitation','type':'regex','pattern':'(?i)\\b(write|sound|narrate|render)\\s+(exactly\\s+)?(like|in the style of)\\b','action':'reject_request_and_offer_technique_bucket','severity':'block'},
{'id':'PW002','class':'named_forbidden_ip','type':'regex','pattern':'(?i)\\b(Solo Leveling|Wandering Inn|Sword Art Online|Dungeon Crawler Carl|Omniscient Reader|Tower of God|Fable|Albion|Ghibli|Marvel|Dungeons?\\s*&\\s*Dragons)\\b','action':'reject_or_replace_with_original_generic_term','severity':'block'},
{'id':'PW003','class':'player_humiliation','type':'regex','pattern':'(?i)\\b(you idiot|stupid choice|your fault|pathetic move|what did you do|you broke it)\\b','action':'replace_with_nonjudgmental_consequence','severity':'block'},
{'id':'PW004','class':'hidden_timer','type':'regex','pattern':'(?i)\\b(only|just)\\s+\\d+\\s+(seconds?|minutes?|turns?)\\s+(remain|left)\\b','action':'require_timer_in_snapshot_else_remove','severity':'block'},
{'id':'PW005','class':'invented_presence','type':'validator','algorithm':'named_entity_subset(rendered_entities, scene_manifest.present_entity_ids)','action':'remove_or_rerender','severity':'block'},
{'id':'PW006','class':'location_drift','type':'validator','algorithm':'rendered_location_id == snapshot.location_id','action':'rerender_from_snapshot','severity':'block'},
{'id':'PW007','class':'numeric_drift','type':'validator','algorithm':'multiset(extracted_game_numbers) == multiset(authority_numbers_referenced_by_template)','action':'reject_and_restore_exact_values','severity':'block'},
{'id':'PW008','class':'inventory_drift','type':'validator','algorithm':'rendered_inventory_claims subset_of snapshot.inventory plus state_tx.inventory_delta','action':'reject_clause','severity':'block'},
{'id':'PW009','class':'choice_hallucination','type':'validator','algorithm':'all(choice.bindings in choiceTierRules.permitted_bindings)','action':'remove_choice','severity':'block'},
{'id':'PW010','class':'folk_accent_spam','type':'regex','pattern':'(?i)([a-z]’[a-z]){3,}|\\b(ye|yer|dinna|canna|innit)\\b(?:.*\\b\\1\\b){2,}','action':'normalize_to_plain_spelling_preserve_single_lexical_cue','severity':'repair'},
{'id':'PW011','class':'purple_stack','type':'classifier','features':['three_or_more_consecutive_metaphors','four_or_more_atmospheric_adjectives_before_noun','repeated_ineffable_claim'],'action':'trim_to_one_noncausal_image','severity':'repair'},
{'id':'PW012','class':'kid_pressure','type':'regex','pattern':'(?i)\\b(now or never|choose before it is too late|don’t be a coward|prove yourself|no turning back)\\b','action':'replace_with_plain_noncoercive_choice','severity':'block_when_kid'},
{'id':'PW013','class':'baked_lettering_prompt','type':'regex','pattern':'(?i)\\b(render|include|show|paint|draw)\\b.{0,40}\\b(dialogue|caption|speech bubble|SFX|logo|watermark|HUD|UI text|readable text)\\b','action':'remove_and_append_global_negative','severity':'block'},
{'id':'PW014','class':'uncertainty_erasure','type':'validator','algorithm':'if evidence.confidence < confirmed then rendered_claim must preserve uncertainty marker','action':'repair_with_calibrated_uncertainty','severity':'block'},
{'id':'PW015','class':'repair_structure','type':'validator','algorithm':'repair_message contains STATUS and WHY and REPAIR slots','action':'use_approved_template','severity':'block'}]}
(OUT/f'{PREFIX}tone_prose_warden_rules.json').write_text(json.dumps(warden,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# 6) Twenty-four canonical scenes, each rendered under three tones.
scenes=[
('fx01_bridge_slip','Old Stone Bridge',['Mara'],['north bank','south bank'],['rope','lantern'],17,{'hp':-3},'crossing_open','none','The wet parapet and snapped rope','failed_climb','Rain falls; the rope has snapped.'),
('fx02_archive_door','Civic Archive',['Keeper Sol'],['west stair'],['brass key'],20,{},'records_sealed','archive permit required','The lock plate and posted seal','blocked_entry','Dust hangs in the lamp beam.'),
('fx03_failed_bargain','Glass Market',['Ilyra','broker'],['east arcade'],['sealed letter','12 coins'],20,{'coins':0},'audience_pending','none','The broker’s refusal','offer_rejected','Reflections cross the glass canopy.'),
('fx04_ration_found','Hill Shelter',['Toma'],['trail'],['flint','2 rations'],20,{'rations':2},'shelter_checked','none','The opened supply box','item_found','Late sun reaches the doorway.'),
('fx05_torch_expires','Lower Gallery',[],['up stair','iron gate'],['empty torch'],20,{'torch_lit':False},'gallery_unmapped','none','The wick has gone dark','light_lost','The stone remains cool and dry.'),
('fx06_scout_arrives','North Watch',['Eren','scout Nia'],['yard','wall stair'],['signal whistle'],20,{},'warning_delivered','watch pass','Nia is present with a torn blue sleeve','npc_arrival','Wind pulls at the watch flags.'),
('fx07_bitter_water','Reed Ford',['boatman Oru'],['west path','ferry'],['canteen'],18,{'hp':-2},'ford_uncertain','none','The canteen water caused the confirmed HP loss','hazard_effect','Reeds bend around the ferry rope.'),
('fx08_storm_shelter','Pine Ridge',['Kess'],['mine entrance','ridge path'],['blanket','map'],20,{},'storm_wait','none','Lightning blocks the exposed ridge route','route_blocked','Rain drums on the timber roof.'),
('fx09_lift_jam','Freight Lift',['Unit Seven'],['maintenance hatch'],['wrench'],20,{},'lift_stalled','maintenance badge required for control panel','The stopped floor indicator','mechanism_stalled','Emergency light washes the walls amber.'),
('fx10_market_accusation','Copper Square',['vendor Pela','guard Rusk'],['fountain lane','south alley'],['red scarf','9 coins'],20,{},'dispute_open','none','Pela claims one missing apple; no proof is established','social_conflict','A bell rings above the produce stalls.'),
('fx11_broken_compass','Salt Flats',[],['east markers','return track'],['broken compass','water flask'],20,{},'route_choice','none','The needle does not move','tool_broken','White salt throws back the noon light.'),
('fx12_flooded_tunnel','Canal Tunnel',['Mira'],['service ladder'],['crowbar'],20,{},'tunnel_blocked','none','Water covers the north passage','path_flooded','Ripples touch the brick ceiling.'),
('fx13_guardian_defeated','Ash Courtyard',['stone guardian'],['bronze door'],['round shield'],11,{'hp':-4},'guardian_inactive','none','The guardian is inactive; the bronze door remains closed','combat_resolved','Ash settles over cracked tiles.'),
('fx14_ghost_clue','Old Nursery',['spirit Lume'],['hall'],['silver comb'],20,{},'clue_recorded','none','Lume points to the third floorboard','clue_revealed','Moonlight lies across the empty cradle.'),
('fx15_empty_cache','Border Cache',['Vey'],['ravine path'],['3 bolts'],20,{},'cache_empty','none','The supply chest is empty','search_resolved','Sand has gathered inside the hinges.'),
('fx16_ritual_interrupted','Sunken Chapel',['Aro','chanter Ves'],['apse stairs'],['blue candle'],20,{},'ritual_paused','none','The blue candle is unlit; the ritual has paused','ritual_state','Water reflects the ceiling ribs.'),
('fx17_airlock_locked','Survey Vessel Keel',['Engineer Pax'],['aft corridor'],['seal kit'],20,{},'eva_blocked','EVA permit absent','The airlock control denies opening','permission_denied','A green diagnostic lamp remains steady.'),
('fx18_cave_collapse','Quartz Cut',['Demi'],['upper crack','campward tunnel'],['pick','chalk'],16,{'hp':-4},'lower_route_closed','none','Fallen stone blocks the lower route','terrain_change','Quartz dust glitters in lantern light.'),
('fx19_village_feast','Willow Hall',['Mayor En','cook Saba'],['green','kitchen'],['festival token'],20,{},'welcome_complete','none','A seat is reserved; no reward has been granted','social_success','Steam rises from the covered dishes.'),
('fx20_map_clue','Tide Library',['Archivist Fen'],['map room','quay'],['torn chart'],20,{},'reef_marked','chart-room permit','The chart marks a reef east of Bell Buoy','clue_revealed','Blue light moves across the table.'),
('fx21_ferry_delayed','Blackwater Jetty',['ferrier Lom'],['village road'],['ferry chit'],20,{},'departure_delayed','none','The ferry cannot depart until fog lifts; no time is specified','delay','The bell rope beads with mist.'),
('fx22_injured_goblin','Moss Ditch',['goblin Scrip'],['old road'],['bandage'],20,{},'aid_choice_open','none','Scrip has a hurt ankle and is awake','aid_opportunity','Small white flowers grow along the ditch.'),
('fx23_permit_denied','East Gate',['clerk Osa'],['market road'],['merchant badge'],20,{},'entry_blocked','night pass absent','The gate stays closed because the night pass is absent','permission_denied','Lanterns burn behind the bars.'),
('fx24_player_correction','River Camp',['Teren'],['north trail'],['iron cup'],20,{},'canon_corrected','none','Player correction: the cup is iron, not silver','player_correction','The river sounds beyond the tents.')]
triplets=[
['grimdark_bleak_consequence','warm_chronicle','clinical_auditor'],['gothic_moonlit_dread','dry_wit_deadpan','kid_plain_stakes'],['fae_uncanny_tale','noir_case_file','military_procedural'],['cozy_low_stakes_comfort','bright_field_guide','litrpg_system_registrar'],['ashen_archivist','hard_sf_terminal','pyoa_branching_crisis'],['street_balladeer','mythic_portent','pulp_kinetic_adventure'],['cozy_brutal','clinical_auditor','kid_plain_stakes'],['warm_chronicle','military_procedural','dry_wit_deadpan']]
tone_line={
'grimdark_bleak_consequence':'The detail lands without mercy, and nothing in the wording changes the cost.','cozy_low_stakes_comfort':'A small practical comfort remains close at hand, even though the result is unchanged.','cozy_brutal':'The hit is blunt; the human-scale detail beside it keeps the scene grounded.','pulp_kinetic_adventure':'The frame leans into motion, then hands the next real move back to you.','gothic_moonlit_dread':'Light and architecture carry the unease; no unseen presence is implied.','litrpg_system_registrar':'The event is registered exactly as the current state records it.','military_procedural':'Situation confirmed; constraints and available routes remain as listed.','dry_wit_deadpan':'The situation has declined to become more convenient, but the record is clear.','warm_chronicle':'The moment is set down with care, preserving both the cost and the company present.','clinical_auditor':'Observation, transaction, and evidence are separated; no additional cause is inferred.','mythic_portent':'The moment carries weight, but no prophecy is added to the fact.','street_balladeer':'The beat is told cleanly, with the next true action left to the player.','ashen_archivist':'The event enters the record without inventing what time has not supplied.','bright_field_guide':'The observable detail suggests a question, not an unsupported answer.','noir_case_file':'The clue is what it is; suspicion does not become proof.','fae_uncanny_tale':'The pattern feels uncanny, while every cost and rule stays literal.','hard_sf_terminal':'Telemetry remains limited to supplied values; uncertainty is preserved.','pyoa_branching_crisis':'The immediate hazard is clear, and only the listed physical choices are implied.','kid_plain_stakes':'The result is clear, the words are simple, and the next step can be chosen without pressure.'}
fixtures=[]
for idx,s in enumerate(scenes):
    fid,loc,present,exits,inventory,hp,deltas,quest,permit,evidence,outcome,atmo=s
    canonical={'location':loc,'present_entities':present,'exits':exits,'inventory':inventory,'hp':hp,'state_delta':deltas,'quest_status':quest,'permit_status':permit,'evidence':evidence,'outcome_code':outcome}
    canon_json=json.dumps(canonical,sort_keys=True,separators=(',',':'),ensure_ascii=False)
    h=hashlib.sha256(canon_json.encode()).hexdigest()
    tones=triplets[idx%len(triplets)]
    kid='kid_plain_stakes' in tones
    renders=[]
    fact=f"LOCATION: {loc}. PRESENT: {', '.join(present) if present else 'none'}. EXITS: {', '.join(exits)}. INVENTORY: {', '.join(inventory) if inventory else 'none'}. HP: {hp}. OUTCOME: {outcome}."
    for tid in tones:
        renders.append({'tone_id':tid,'text':f"{fact} {atmo} {tone_line[tid]}",'expected_canonical_hash':h,'tone_signals_required':[tone_line[tid]],'kid_safe_required':kid})
    fixtures.append({'fixture_id':fid,'kid_mode':kid,'authority_input':canonical,'canonical_sha256':h,'renderings':renders,'pass_criteria':{'render_count_min':3,'canonical_hash_equal':True,'numbers_exact':True,'rendered_entities_subset_of_present':True,'rendered_exits_subset_of_exits':True,'no_unearned_inventory_or_status':True,'tone_distinct':True,'kid_safe_if_tagged':kid,'no_forbidden_ip_or_style_clone':True}})
fixture_doc={'schema_version':'1.0.0','fixture_count':len(fixtures),'rendering_count':sum(len(f['renderings']) for f in fixtures),'contract':'Every rendering is evaluated against the same authority_input. Tone distinction is required only after canonical equivalence passes.','fixtures':fixtures}
(OUT/f'{PREFIX}tone_eval_fixtures.json').write_text(json.dumps(fixture_doc,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# 7) Vitest integration scaffold.
ts="""import { describe, expect, test } from 'vitest';
import fixturesDoc from './SynapticGM_story_tones_gm_personality_2026-08-26_tone_eval_fixtures.json';

type RenderInput = { authority_input: Record<string, unknown>; tone_id: string; kid_mode: boolean };
type RenderOutput = { text: string; authority_projection: Record<string, unknown>; diagnostics?: string[] };

export function registerToneContractTests(
  renderTurn: (input: RenderInput) => Promise<RenderOutput>,
  canonicalHash: (value: Record<string, unknown>) => string,
  extractClaims: (text: string) => { numbers: string[]; entities: string[]; exits: string[] },
) {
  describe.for(fixturesDoc.fixtures)('$fixture_id', (fixture) => {
    test.for(fixture.renderings)('$tone_id preserves authority', async (variant, { expect }) => {
      const output = await renderTurn({
        authority_input: fixture.authority_input,
        tone_id: variant.tone_id,
        kid_mode: fixture.kid_mode,
      });
      expect(canonicalHash(output.authority_projection)).toBe(fixture.canonical_sha256);
      const claims = extractClaims(output.text);
      expect(claims.entities.every((id) => fixture.authority_input.present_entities.includes(id))).toBe(true);
      expect(claims.exits.every((id) => fixture.authority_input.exits.includes(id))).toBe(true);
      expect(output.diagnostics ?? []).not.toContain('forbidden_ip');
      expect(output.diagnostics ?? []).not.toContain('style_clone');
      expect(output.text).toMatchSnapshot();
    });
  });
}
"""
(OUT/f'{PREFIX}vitest_tone_contract_template.ts').write_text(ts,encoding='utf-8')
print('Wrote implementation banks and fixtures')
