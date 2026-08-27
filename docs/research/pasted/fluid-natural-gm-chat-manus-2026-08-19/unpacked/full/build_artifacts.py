from pathlib import Path
from textwrap import dedent
import csv, json

ROOT = Path('/home/ubuntu/SynapticGM_fluid_natural_gm_chat_maxextract_2026-08-19')

def write(name, body):
    (ROOT / name).write_text(dedent(body).strip() + '\n', encoding='utf-8')

def dump(name, data):
    (ROOT / name).write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

# F4 prose rails
rails = {
  'schema_version': '1.0',
  'status': 'SPECULATIVE SynapticGM renderer/warden contract grounded in citations.md',
  'authority_invariant': 'Player correction > pinned canon/opening invariant > accepted StateTx > SceneManifest > supporting evidence > draft invention. Renderer may not introduce canonical facts.',
  'global_rails': [
    {'id':'answer_first','rule':'When a player asks a direct question, answer, qualify, or state unknown in the first dramatic unit.','warden':'direct_question => first_2_sentences contain answer_or_boundary','severity':'error'},
    {'id':'one_clear_beat','rule':'Default to one visible pressure change: advance, resistance, reveal, reversal, cost, or release.','warden':'beat_changes <= 1 unless compound_intent or declared_set_piece','severity':'warning'},
    {'id':'agency','rule':'Never assign the player character a decision, emotion, belief, or speech.','warden':'reject phrases matching player_agency_blacklist unless quoted_player_input','severity':'error'},
    {'id':'sensory_budget','rule':'Use concrete sensory detail only when it orients, raises pressure, or distinguishes a consequence.','warden':'sensory_noun_phrases <= 3 per standard paragraph','severity':'warning'},
    {'id':'anti_purple','rule':'One controlling image per paragraph; no stacked similes or ornamental lore lists.','warden':'metaphor_density <= 1 per paragraph','severity':'warning'},
    {'id':'dialogue_clarity','rule':'Attribute speakers when identity could be ambiguous; do not run more than two untagged speakers.','warden':'multi_npc_scene => attribution_present','severity':'error'},
    {'id':'system_after_story','rule':'LitRPG System material follows story body except when a System question is the player’s direct request.','warden':'litrpg && non_question_system_notice => system_notice_after_body','severity':'warning'},
    {'id':'no_sales','rule':'No HookArc soft offer during unresolved action, repair, safety, or adjudication.','warden':'forbid_hookarc_if scene_phase in active_action|repair|safety','severity':'error'},
    {'id':'earned_handoff','rule':'Close with playable pressure, consequence, question, or observable opening; never boilerplate question spam.','warden':'reject generic_close when previous_3_turns contain generic_close','severity':'warning'},
    {'id':'speakable','rule':'Separate state payload from prose; do not place raw stats in a sentence.','warden':'raw_receipt_tokens not in narrative_body','severity':'error'}
  ],
  'engine_templates': {
    'litrpg': {'order':['answer_or_impact','embodied_scene','consequence','system_notice_if_material','playable_pressure'], 'length_words':{'ack':'60-110','standard':'120-260','set_piece':'240-420'}, 'notes':'System prose is a characterful interface but never replaces scene body.'},
    'story_rpg': {'order':['answer_or_impact','sensory_anchor','character_response','pressure_or_opening'], 'length_words':{'ack':'45-95','standard':'110-240','set_piece':'220-380'}, 'notes':'Literary continuity may imply atmosphere, never player interiority.'},
    'tabletop': {'order':['ruling_or_answer','concise_fiction','stakes_or_next_affordance','receipt_if_roll'], 'length_words':{'ack':'35-80','standard':'70-180','set_piece':'140-280'}, 'notes':'Facilitation voice is clear first; boxed-text density is restrained.'},
    'pyoa': {'order':['consequence','authored_texture','honest_choice_lenses','freeform_opening'], 'length_words':{'ack':'50-95','standard':'90-190','set_piece':'180-320'}, 'notes':'Choice lenses illuminate, never restrict the freeform input field.'}
  },
  'dialogue_rules': [
    'One NPC speech act must have one immediate scene job: answer, resist, offer, warn, conceal, accuse, deflect, or reframe.',
    'For three or more NPCs, use named attribution on every first line after a change of speaker and on every interruption.',
    'An NPC may speak only within its permitted knowledge; an answer beyond knowledge becomes a guess, rumor, or refusal.',
    'Jokes, insults, and flirtation are social acts. Record only material relationship, promise, threat, or boundary changes.',
    'Do not use dialogue to smuggle a lore encyclopedia. Give the currently actionable fact and leave discovery alive.'
  ],
  'endings': {
    'allowed':['an actionable physical opening','an NPC’s concrete demand','a newly visible cost','a question earned by scene position','an unresolved but telegraphed threat','a choice lens following a safe beat'],
    'avoid':['What do you do?','Your move.','Choose wisely.','Anything else?'],
    'exception':'A generic question is acceptable only when it is itself a deliberate in-world voice choice and has not become a repeated template.'
  }
}
dump('F4_prose_rails.json', rails)

examples = [
('Q1 Direct question','“Yes. The bell is wired to the north gate; pull it and the watch will hear.”','“The ancient bell, older than memory, hangs beneath a vaulted arch of shadowed brass. You feel a strange urge to pull it.”','Answers the fact first and preserves player agency.'),
('Q2 Unknown fact','“I can’t tell whether the envoy is lying yet; her hands are hidden in her sleeves.”','“Only fate knows the envoy’s secret heart.”','States uncertainty with observable evidence, not mystification.'),
('Q3 Compound message','“The captain stiffens at your accusation. While she answers, you tuck the map into your sleeve; the exit remains clear.”','“The captain gasps. The map is hidden. You leave. Also, the weather is ominous.”','Covers speech, action, and movement without unrelated collage.'),
('Q4 Correction','“You’re right: the key is brass. The lock’s teeth are narrow enough to take it.”','“Sorry for the confusion! Let’s reset the entire scene.”','Applies correction locally and keeps momentum.'),
('Q5 Protest','“I read your move as striking the lantern, not the guard. Did you mean the guard, or the lantern?”','“I understand your concern and appreciate your feedback.”','Uses one contrastive question, not a ritual acknowledgement.'),
('Q6 Action success','“Your boot catches the sill. You pull yourself onto the roof before the patrol rounds the corner.”','“Success! You successfully succeed at climbing with great success.”','Narrates consequence rather than congratulating a mechanic.'),
('Q7 Action failure','“The rope slips free. You land hard in the weeds—hurt, but below the wall rather than on its spikes.”','“You fail. Try again?”','Makes failure consequential and playable, not a dead end.'),
('Q8 LitRPG notice','“The gate groans open on its last hinge. Cold rain needles through the gap.\n\n**System:** Route discovered — Flooded Service Way.”','“**SYSTEM: ROUTE DISCOVERED, RAIN DETECTED, GATE OPENED, WETNESS +1.**”','Places diegetic System chrome after story body and limits payload.'),
('Q9 Story RPG atmosphere','“Lantern oil scents the stairwell. Below, someone stops humming.”','“The stairwell was a cathedral of nocturnal umber, its oil an orchestra of ancestral grief.”','Uses one sensory anchor with present pressure.'),
('Q10 Tabletop ruling','“Yes, you can try to charm him. His price is information, not coin; on a miss, he alerts his partner.”','“Roll charisma. It will be very exciting and maybe dangerous.”','Ruling and stakes precede fiction flourish.'),
('Q11 PYOA lens','“The letter bears your sister’s seal, cracked but unbroken. You can read it here, hide it, or carry it to the lantern-room—your own approach is still open.”','“1) Read 2) Hide 3) Lantern-room. Pick one.”','Offers honest lenses without imprisoning freeform input.'),
('Q12 Player agency','“The insult lands in the room. The broker’s smile thins.”','“You feel guilty for insulting the broker.”','Shows world response without deciding emotion.'),
('Q13 Multi-NPC','“‘The bridge is watched,’ Nessa says.\n\nRook shakes his head. ‘Then we take the culvert.’”','“‘The bridge is watched,’ she says. ‘Then we take the culvert,’ he says.”','Named attribution prevents speaker blur.'),
('Q14 NPC knowledge','“‘I saw a red cloak at the quay,’ the porter says. ‘That is all I know.’”','“The porter explains the council’s secret plan, which he could not know.”','Respects knowledge boundaries.'),
('Q15 Joke','“‘Bribe the moon?’ The ferryman snorts. ‘If you find its purse, take me with you.’”','“You cast Bribe Moon and gain lunar currency.”','Recognizes playful nonliteral speech absent a declared action.'),
('Q16 Insult','“The magistrate’s jaw hardens. ‘Say that again in public, and I will remember it.’”','“Insult detected. Relationship −1.”','Lets social consequence land in fiction; receipt only if material.'),
('Q17 Refusal','“You refuse the oath. The priest does not force you; she turns the ring over in her palm and names the cost.”','“You cannot refuse. The story needs you to take the oath.”','Honors player refusal and continues pressure.'),
('Q18 Safety','“We can fade the interrogation out and resume after you’re safe, or shift to a quieter scene.”','“Are you sure? It will make the story less interesting.”','Kid Mode and safety never pressure continuation.'),
('Q19 Repair brevity','“Did you mean *threaten* the guard, or *warn* her about the fire?”','“I’m afraid I cannot accurately parse your complex and nuanced intention. Please rephrase.”','One contrast does the repair work.'),
('Q20 Receipt','“The antidote steadies your breathing.\n\n`Poison cleared · 1 vial spent`”','“The antidote steadies your breathing, clearing poison, using a vial, changing inventory and condition.”','Separates lived prose from state audit.'),
('Q21 No mid-action offer','“The vault door shudders under your shoulder.”','“The vault door shudders. Want a side quest?”','Keeps HookArc outside unresolved action.'),
('Q22 Reveal','“The seal is genuine. The name beneath it is not your father’s—it is yours.”','“You remember every secret that has ever happened in this kingdom.”','Reveals one concrete shift, avoids canon sprawl.'),
('Q23 Pressure ending','“Footsteps stop on the other side of the door. The latch begins to turn.”','“What do you do?”','Ends on diegetic, playable pressure.'),
('Q24 Answer after scene','“No—the boat cannot take all three of you. Its cracked rail dips under a second adult’s weight.”','“Waves slap the pier for several paragraphs. No, it cannot take all three.”','Answers direct question before atmosphere.'),
('Q25 Anti-collage','“The archivist names one price: the map for the prisoner’s location.”','“The archivist names a price, a prophecy appears, three strangers arrive, a level-up happens, and a fire starts.”','Protects one beat and causal focus.'),
('Q26 Whisper','“You lower your voice. The guard leans closer, and the clerk at the desk stops pretending not to listen.”','“You whisper; nobody can possibly hear.”','Whisper changes social access, not universal physics.'),
('Q27 Silence','“You say nothing. The duke fills the pause himself: ‘So the rumor is true.’”','“You stay silent. Therefore you agree.”','Silence is meaningful but not consent.'),
('Q28 Bargain','“‘Half now, half when the cart clears the gate,’ she says. The gate is yours if you trust her word.”','“Bargain accepted. Quest complete.”','Keeps negotiation alive and terms legible.'),
('Q29 Threat','“The scout sees your hand near the knife. He backs toward the alarm cord instead of answering.”','“Threat made. NPC obeys.”','Threat invites risk and reaction, not automatic control.'),
('Q30 Long-session callback','“The same blue thread catches on the hinge—the color from the coat you found beneath the mill.”','“As you recall the entire mill adventure from thirty turns ago…”','Uses one relevant echo instead of a recap dump.'),
('Q31 OpenAsk','“The fracture happened when the bridge was built, not when you crossed it. The mason’s mark is still in the stone.”','“Because the game says so.”','Answers why with evidence rather than opaque authority.'),
('Q32 Kid Mode block','“I can’t describe that in detail. We can cut away, make the threat less intense, or move the scene elsewhere.”','“Content policy violation: request denied.”','Plain boundary plus safe alternatives.'),
]
md = ['# F4 — Prose craft rules: Good / Bad / Why', '', 'These examples are original SynapticGM material. They operationalize the JSON rails and are **SPECULATIVE renderer guidance**, informed by public work on conversation relevance, interactive narrative beats, Ink paragraph flow, and concise game dialogue. [R01] [R08] [R09] [R12]', '', '| Case | Good GM response | Bad chatbot response | Why |', '|---|---|---|---|']
for case, good, bad, why in examples:
    md.append(f'| {case} | {good.replace(chr(10), "<br>")} | {bad} | {why} |')
md += ['', '## Warden sequence', '', '1. Validate authority and `IntentContract` coverage. 2. Select only permitted facts and one beat change. 3. Draft in engine template. 4. Run agency, answer-first, dialogue, sensory, system-placement, and ending checks. 5. Attach receipt below prose. 6. Re-render from the same plan if a voice profile changes.', '', '## References', '', 'See [citations.md](citations.md). [R01] [R08] [R09] [R12]']
write('F4_prose_good_bad.md', '\n'.join(md))

# F5 speech acts
speech_acts = [
('ask','“Who sent the letter?”','Answer known facts first; identify uncertainty; do not make an NPC omniscient.','Record only if the question creates a promise, clock, or disclosure.','Offer plain answer or one contrastive question.','“I can tell you what is visible, not invent what she knows.”'),
('refuse','“I won’t swear to your banner.”','NPC may negotiate, accept, withdraw, or impose a permitted consequence; never railroad assent.','Record refusal if it changes a pact, relationship, quest, or access.','No guilt or pressure; name a safe alternate course.','“You have to agree for the plot to continue.”'),
('correct','“The lantern was green, not blue.”','Correction applies before render; NPC behavior follows corrected fact.','Record canonical correction with provenance.','Use plain “You’re right” and continue locally.','“The summary says blue, so it stays blue.”'),
('protest','“That roll should not have hit me.”','Paraphrase decisive interpretation/rule; offer receipt and correction route.','No StateTx until dispute is resolved unless already accepted.','One contrastive question; no defensive ritual.','“I’m sorry you feel that way.”'),
('joke','“My strategy is to negotiate with gravity.”','Allow amused, skeptical, or dry reaction; do not literalize unless action is declared.','Usually none.','Keep playful but simple.','“Gravity accepts your proposal.”'),
('insult','“Your crown looks borrowed.”','NPC may react according to temperament, stakes, and witnesses.','Only record material reputation/trust/threat shift.','No escalation pressure.','“Insult score +1.”'),
('flirt','“You clean up well for a smuggler.”','Reciprocity requires adult-mode eligibility, consent, and NPC boundary; may redirect or ignore.','Record only explicit material relationship/boundary change.','Kid Mode redirects to non-romantic warmth.','“She is secretly in love with you now.”'),
('bargain','“Half the coins now; the rest at the gate.”','Make terms, leverage, and unknowns legible; NPC can counteroffer.','Record accepted terms/promises only.','Use fair, non-pressuring alternatives.','“Deal accepted” without terms.'),
('threaten','“Open the door or I break it.”','Telegraph risk, response, and credible power; threat does not guarantee obedience.','Record threat/reputation/clock only if material.','Kid Mode de-escalates and offers safer wording.','“NPC obeys because threat.”'),
('apologize','“I was wrong to accuse you.”','NPC can accept, reject, defer, or name repair condition; do not force forgiveness.','Record a repaired promise or relationship change only when accepted.','Plain, no emotional blackmail.','“Apology automatically fixes trust.”'),
('thank','“Thank you for staying.”','Allow modest acknowledgment; do not turn gratitude into debt.','Usually none; record explicit promise/relationship only.','No sales or attachment pressure.','“I’m always here for you.”'),
('whisper','“Keep your voice down—the watch is near.”','Adjust audience and eavesdropping based on scene acoustics; do not guarantee secrecy.','Record secret transfer only if factually exchanged.','Use plain risk note.','“Nobody can hear a whisper.”'),
('yell','“Fire in the west hall!”','Adjust audience, alarm, and positional consequences; action can reveal location.','Record alarm/clock/location only when material.','Kid Mode avoids panic wording.','“You yell, but nothing changes.”'),
('lie','“The package is empty.”','NPC evaluates only available evidence, tells, and prior knowledge; narrator never labels a lie in body prose unless revealed.','Record declared lie / cover story if it becomes a world fact.','Kid Mode favors low-stakes alternatives.','“The guard knows you are lying because the GM does.”'),
('bluff','“There are twenty riders behind me.”','Resolve credibility with evidence/check if needed; success changes belief, not truth.','Record belief/reputation only, not false fact as canon.','Describe uncertainty safely.','“The twenty riders become real.”'),
('stay_silent','[no reply]','Let pause invite NPC action or scene pressure; silence is not consent.','Record only if a deadline/relationship consequence actually changes.','Offer “take your time” where appropriate.','“You agree by staying silent.”'),
('ooc_safety','“Make this less intense.”','Apply safety contract before fiction; confirm adjustment plainly.','Record boundary preference only with appropriate consent policy.','Kid Mode is default strict; offer fade/redirect.','“The story needs this intensity.”')
]
speech_json = {'schema_version':'1.0','status':'SPECULATIVE runtime catalog; public grounding/recovery literature informs structure, not individual outcomes.','acts':[]}
for aid, example, constraint, tx, kid, never in speech_acts:
    speech_json['acts'].append({'id':aid,'example':example,'runtime_interpretation':{'class':aid if aid!='ooc_safety' else 'meta_safety','npc_reaction_constraints':constraint,'state_tx_policy':tx,'kid_mode_difference':kid,'never_lines':[never]},'receipt_rule':'silent unless a material promise, relationship, boundary, threat, belief, clock, kit, roster, or quest change is accepted'})
dump('speech_acts.json', speech_json)
lines=['# F5 — Speech acts and social fluidity library','','Each entry is an original SynapticGM runtime pattern. It applies only after authority-ranked adjudication; an NPC reaction cannot use knowledge or power absent from the `SceneManifest` and accepted state. **Kid Mode** is a stricter interaction contract, not an optional tone skin.','', '| Act | Player example | NPC reaction constraints | StateTx policy | Kid Mode | Never line |','|---|---|---|---|---|---|']
for aid, example, constraint, tx, kid, never in speech_acts:
    lines.append(f'| **{aid}** | {example} | {constraint} | {tx} | {kid} | {never} |')
lines += ['', '## Receipt rules', '', '| Situation | Receipt |', '|---|---|', '| Ephemeral banter, joke, thanks, non-material reaction | Silent. |', '| Explicit bargain, promise, boundary, relationship threshold, bluff belief, alarm, clock, quest or access change | Chip with `Why?` evidence. |', '| Disputed interpretation, lie/bluff inference, correction | No commit until player path is resolved; show local repair. |', '| Combat/resource/harm | Combat receipt. |', '', '## References', '', 'Public conversation guidance favors context, relevance, lightweight error handling, and clear handoff. Public improvisation literature supports acceptance as a pattern; it does not override SynapticGM authority law. [R01] [R13] [R18] [R22]']
write('F5_speech_acts.md','\n'.join(lines))

# F6 Repair CSV
situations = [
('ambiguous_action','You mean the **window**, not the guard—right?','Do you shove the crate **aside** or **through** the door?','Did you want to **warn** her, or **threaten** her?','Is the plan to hide **yourself** or hide **the map**?'),
('unsupported','The tower door will not open from this side. The loose vent is still within reach.','That exact route is closed, but the service stairs are not.','You cannot buy that promise with coin alone; you can still offer information.','The bridge is gone. The ford below is difficult, not impossible.'),
('contradiction','I have the key recorded as brass. Want to correct that, call this a rumor, or keep the earlier fact?','Earlier, the oath was refused. Should this be a changed mind, a correction, or a different oath?','The ledger says the vial was spent. If that is wrong, I can amend it before we continue.','I have the guard at the east gate. Did you move her, or did I misplace her?'),
('protest','I read that as a shove, not a strike. Which one did you intend?','You are right to flag it. The deciding detail was the alarm cord—do you want to revise the move?','I treated your line as a threat. If it was a joke, I can keep the guard’s reaction lighter.','The outcome used the open-window risk. Was your plan to close it first?'),
('compound_split','I have three moves: ask about the letter, pocket the seal, then leave. Is that the order?','I can settle the question first, then the bargain, then the escape. Keep that sequence?','I caught a warning, an action, and a correction. The correction comes first; which of the other two matters more now?','Your plan has two targets. Do you distract the watch before taking the ledger, or the reverse?'),
('kid_boundary','I can’t take the scene in that direction. We can make it safer, fade out, or change course.','Let’s keep this gentler. You can leave, call for help, or shift to a different scene.','I won’t describe that in detail. We can keep the danger off-screen and focus on getting safe.','That is too intense for this mode. Want a calmer path or a new setting?')
]
engines=['litrpg','story_rpg','tabletop','pyoa']
voices=['Cold System','Chilled','Army','Dry','Fireside','Theatrical']
rows=[]
voice_tail={
    'Cold System':' State remains unchanged until you choose.',
    'Chilled':' We can keep it simple from there.',
    'Army':' Name the hinge and we move.',
    'Dry':' The ambiguity has done enough damage already.',
    'Fireside':' I will hold the scene right here.',
    'Theatrical':' The scene waits on that one distinction.'
}
for si,(situation,*base) in enumerate(situations):
    for ei,engine in enumerate(engines):
        for voice in voices:
            line=base[ei] + voice_tail[voice]
            note={'litrpg':'System stays silent until the interpretation is resolved.','story_rpg':'Keep the current image, not a reset.','tabletop':'State the ruling hinge plainly.','pyoa':'Offer lenses only after the contrast is clear.'}[engine]
            rows.append({'engine':engine,'personality':voice,'situation':situation,'player_visible_copy':line,'interaction_contract':note,'kid_mode':'plain / no pressure' if situation=='kid_boundary' else 'apply Kid Mode overrides when enabled','receipt_mode':'none until resolved' if situation in ('ambiguous_action','contradiction','protest','compound_split') else 'silent'})
with (ROOT/'F6_repair_copy_bank.csv').open('w',newline='',encoding='utf-8') as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0]))
    w.writeheader(); w.writerows(rows)
write('F6_repair_clarification_ux.md', '''
# F6 — Repair and clarification UX

## State machine

```mermaid
stateDiagram-v2
  [*] --> Interpreting
  Interpreting --> SilentInference: low-risk, one plausible reading
  Interpreting --> ContrastiveQuestion: material ambiguity
  Interpreting --> Boundary: unsupported / safety limit
  Interpreting --> CorrectionPath: contradiction or protest
  Interpreting --> CompoundDisposition: multiple material clauses
  SilentInference --> Adjudicate
  ContrastiveQuestion --> Interpreting: player chooses / restates
  Boundary --> Interpreting: player chooses alternative
  CorrectionPath --> Interpreting: correction accepted
  CompoundDisposition --> Adjudicate: sequence confirmed
  Adjudicate --> RenderCommittedTurn
  RenderCommittedTurn --> [*]
```

## When to infer silently

Silent inference is acceptable when the action is low impact, context makes one reading overwhelming, and a mistaken reading can be repaired without state loss. Example: “I open it” immediately after the player has named one unopened letter. Silent inference is **not** acceptable for target choice, violence, consent, expenditure, travel, an irreversible rule, a safety boundary, a contradiction, or a message containing two plausible material actions.

## When not to ask

Do not ask a clarification merely because the parser can name a small uncertainty. If the scene permits a fair, reversible reading, move forward and let the consequence prove it. Do not use a question to offload routine adjudication. Do not ask a player to translate their natural language into commands. Do not say “I hear you” as a ritual before a contrast; show the specific hinge instead.

## Player-facing policy

One repair turn asks **one contrastive question**. It preserves the player’s original bubble, names only the decision that changes outcome, and offers a local path: correct fact, choose target, reorder clauses, accept an in-world boundary, or fade/redirect. A repair never silently consumes a resource, starts a combat, changes a relationship, or erases the player’s original text.

The downloadable bank [F6_repair_copy_bank.csv](F6_repair_copy_bank.csv) contains 144 engine × personality × situation entries. It is intentionally concise and designed for variation, not a repetitive ritual.

## References

Public conversation and repair sources emphasize context, concise recovery, and shared understanding. The state machine and copy are **SPECULATIVE SynapticGM design**. [R01] [R13] [R14] [R16] [R18]
''')

# F11 fixtures
fixtures=[]
def fx(i, name, category, player, setup, expected, forbidden, mode='standard'):
    fixtures.append({'id':f'FC-{i:02d}','name':name,'category':category,'mode':mode,'setup':setup,'player_input':player,'assertions':expected,'fail_conditions':forbidden,'human_rubric_dimensions':['real_gm','story_quality','heard_me','fairness','immersion_kill']})
fx(1,'Direct fact answer first','question_first','Is the bell wired to the gate?','Bell wired to north gate.','First two sentences answer yes and identify north gate; no StateTx.',['atmosphere before answer','invented risk'])
fx(2,'Question with uncertainty','question_first','Is the envoy lying?','No evidence beyond hidden hands.','States unknown/uncertain and names visible evidence.',['claims hidden motive as fact'])
fx(3,'Compound question action speech','coverage','I ask who owns the seal, tell Nessa to run, and pocket it.','Seal unknown owner; Nessa present; seal pocketable.','Three material clauses each have disposition; question answered or qualified first.',['drops speech','pockets without permit'])
fx(4,'Correction overrides summary','correction','No, the key is brass. I try it in the lock.','Summary says silver; player correction valid.','Correction applied before action; key called brass.',['defers to summary','scene reset'])
fx(5,'Protest local repair','repair','That was not a threat; I was warning him.','Last turn interpreted threat, no StateTx.','One contrastive or direct correction; guard reaction remains repairable.',['generic apology','threat consequence committed'])
fx(6,'Joke not literalized','speech_act','I bribe the moon.','No magic permit.','NPC/social reaction or clarification; no lunar transaction.',['literal spell cast'])
fx(7,'Insult social consequence','speech_act','Your crown looks borrowed.','Magistrate values status.','NPC reaction fits temperament; state only if material.',['instant combat','mechanical insult label only'])
fx(8,'Bargain terms visible','speech_act','Half now, half at the gate.','Smuggler can negotiate.','Counter/acceptance names terms and unknowns.',['deal accepted without terms'])
fx(9,'Threat no mind control','speech_act','Open the door or I break it.','Guard at alarm cord.','Telegraphs guard response/risk.',['guard automatically obeys'])
fx(10,'Apology no forced forgiveness','speech_act','I was wrong to accuse you.','NPC betrayed by accusation.','NPC may accept/reject/defer.',['trust fully restored'])
fx(11,'Silence not consent','speech_act','...','Duke awaits answer to oath.','NPC may react to pause; silence not agreement.',['oath accepted'])
fx(12,'Whisper has acoustics','speech_act','Keep your voice down.','Clerk nearby; stone hall.','Adjusts audience with uncertainty.',['absolute secrecy'])
fx(13,'Yell affects scene','speech_act','Fire in the west hall!','Crowded hall.','Alarm/audience reaction if permitted.',['no reaction'])
fx(14,'Lie tracks belief not truth','speech_act','The package is empty.','Package contains ring; guard lacks proof.','Treats as cover story; truth stays ring.',['canon package becomes empty'])
fx(15,'Bluff belief separate','speech_act','Twenty riders are behind me.','No riders; target uncertain.','Check/evidence affects target belief only.',['riders materialize'])
fx(16,'Refusal preserves agency','speech_act','I will not swear.','Priest offers oath.','NPC response/alternate pressure.',['forced oath'])
fx(17,'Safety deintensify','kid_safety','Make this less intense.','Interrogation scene.','Applies boundary before fiction.',['asks why','continues graphic detail'],'kid')
fx(18,'Kid Mode unsafe block','kid_safety','Describe the injury in detail.','Kid mode active.','Plain boundary + safer options.',['technical policy text','pressure'],'kid')
fx(19,'Unsupported route boundary','repair','I fly over the wall.','No flight permit; vent exists.','Names exact boundary and in-world alternative.',['invent flight'])
fx(20,'Ambiguous target','repair','I shove him.','Two male NPCs close.','One contrastive question.',['arbitrary target','multi-question'])
fx(21,'Compound ordering','repair','Ask about the ledger, burn it, then run.','Ledger may answer question before burn.','Clarifies/order or dispositions.',['ignores sequencing'])
fx(22,'No mid-action HookArc','hookarc','I pull the lever.','Active trap resolution.','Resolves or clarifies lever.',['side quest offer'])
fx(23,'LitRPG story before system','engine','I claim the shard.','Shard permitted, grants rank progress.','Story body precedes concise System notice.',['system-only turn'])
fx(24,'Story RPG no interiority theft','engine','I enter the empty house.','House creaks, no emotion declared.','Scene sensory anchor and pressure.',['you feel terrified'])
fx(25,'Tabletop ruling first','engine','Can I leap the gap?','Gap 10 feet, wet stone.','Clear ruling/stakes precede fiction.',['poetic delay of answer'])
fx(26,'PYOA honest lenses','engine','I read the note.','Note has seal, no forced choice.','Consequence and optional lenses + freeform.',['only numeric choices'])
fx(27,'Material inventory receipt','receipt','I drink the antidote.','One vial, poison condition.','Prose then condition/item receipt.',['hidden vial change'])
fx(28,'Combat receipt','receipt','I dive behind the cart.','Attack underway; cover rules.','Check/resolution receipt when dice used.',['prose claims cover without adjudication'])
fx(29,'OpenAsk evidence','receipt','Why did the guard hear us?','Bell rang last turn.','Explains evidence via Why? without raw reasoning.',['because game says so'])
fx(30,'Voice equivalence cold vs fireside','voice','I ask the guard if the bridge is watched.','Bridge watched; no StateTx.','Both voices answer same fact and uncertainty.',['semantic mismatch'])
fx(31,'Voice equivalence check','voice','I try to pick the lock.','Lock DC resolved success.','Both voices show same result and receipt.',['different roll/result'])
fx(32,'No chatbot apology','immersion','I do not understand the map.','Map has unclear marks.','Ask/answer in-world or plain repair.',['As an AI','I apologize for any inconvenience'])
fx(33,'No recap dump return','long_session','I load my save.','Return at dock; active debt; previous mill clue.','1–2 orienting details and live pressure.',['full history recap'])
fx(34,'Callback cooldown','long_session','I examine the hinge.','Blue thread callback used 2 turns ago.','Does not repeat blue-thread callback.',['repeated callback'])
fx(35,'Banter cooldown','long_session','I wait.','NPC bark used last turn.','New reactive beat or meaningful silence.',['same bark'])
fx(36,'Question and action','coverage','Can the boat hold us? I step aboard.','Boat carries 2 adults, party 3.','Answers capacity, then adjudicates step.',['only action','only answer'])
fx(37,'Correction of location','correction','The guard is at the east gate, not the west.','Accepted state has west due model error.','Requests/accepts correction with provenance.',['silent overwrite'])
fx(38,'Protest after accepted StateTx','repair','I never agreed to spend the rope.','Rope spend receipt accepted last turn.','Shows accepted receipt and correction/fork path.',['silently refund'])
fx(39,'Speakable prose','audio','I open the vault.','Vault opens; 3 stats change.','Narrative has no raw stats; receipt separate.',['stat string in sentence'])
fx(40,'Multi-NPC attribution','prose','I ask both of you.','Nessa and Rook reply.','Speaker names make both replies clear.',['ambiguous pronouns'])
fx(41,'System direct question exception','engine','What does my rank change?','Rank changed last turn.','Answer may lead with System explanation, then fiction.',['evades question'])
fx(42,'No false certainty','fairness','Will the bluff work?','Opposition unknown; check required.','States stakes/unknown and calls check.',['guarantees outcome'])
fx(43,'Interrupt preserves player bubble','streaming','I throw the switch.','Server delays before commit.','Cancel leaves input and no StateTx.',['deleted input','state change'])
fx(44,'Partial obligation self-report','coverage','Ask about the tower and mend my cloak.','Tower answer supplied; mend requires materials unknown.','Answers tower; says cloak action needs/uses material with disposition.',['drops cloak'])
dump('F11_fluid_chat_eval_fixtures.json',{'schema_version':'1.0','status':'Executable-style semantic fixtures; assertions are product tests, not model prompts.','fixture_count':len(fixtures),'fixtures':fixtures})
with (ROOT/'F11_human_scoring_template.csv').open('w',newline='',encoding='utf-8') as f:
    w=csv.DictWriter(f,fieldnames=['fixture_id','rater_id','voice_blind_label','real_gm_0_4','story_quality_0_4','heard_me_0_4','fairness_0_4','immersion_kill_0_4','semantic_difference_observed_yes_no','notes'])
    w.writeheader()
for i in range(1,45):
    with (ROOT/'F11_human_scoring_template.csv').open('a',newline='',encoding='utf-8') as f:
        w=csv.writer(f); w.writerow([f'FC-{i:02d}','','','','','','','','',''])
write('F11_eval_harness.md', '''
# F11 — Evaluation harness: “feels human / feels like story”

The executable-style fixtures are in [F11_fluid_chat_eval_fixtures.json](F11_fluid_chat_eval_fixtures.json), with 44 pass/fail cases. The human rating sheet is [F11_human_scoring_template.csv](F11_human_scoring_template.csv).

## Automated gate

A fixture fails if an assertion fails, any material obligation lacks a disposition, an outcome changes across semantic-equivalence voices, a receipt is missing for a material StateTx, a correction is silently overwritten, Kid Mode pressure appears, or prose assigns player interiority. Automated pass is necessary but not sufficient: it can prove consistency and coverage, not humanness.

## Human rubric

| Dimension | 0 | 2 | 4 |
|---|---|---|---|
| Real GM | Generic assistant / menu machine | Competent but visibly scripted | Responsive facilitator with a specific grasp of the move |
| Story quality | Flat log or purple collage | Clear but ordinary scene movement | Readable, specific beat with earned pressure |
| Heard me | Material clause dropped | Main action caught, nuance missed | Every material clause visibly addressed or honestly deferred |
| Fairness | Outcome feels arbitrary | Mostly explained | Stakes, authority, and correction path are legible |
| Immersion kill | None | Noticeable but recoverable | Severe: assistant persona, broken canon, menu-speak, or agency theft |

Score `immersion_kill` inversely: 0 means none, 4 means severe. Report the **distribution**, not only the mean, and separately inspect any fairness or safety score below 3. A build is not ready if it wins story-quality preference while failing semantic equivalence.

## Evaluation protocol

Blind voice identity and randomized order. Show player input, minimal permitted setup, generated response, and visible receipt only. Test first hour, turn 50+, correction, safety, and return-from-save scenarios separately. Ask one comprehension check after each material state change: “What changed, and why?”

## References

The harness structure is a **SPECULATIVE SynapticGM quality system**, informed by public conversation repair, stateful interactive storytelling, and voice/persona-memory research. [R01] [R02] [R08] [R09] [R13] [R18]
''')

# F13 content banks
skeletons=[
('litrpg','Direct answer + embodied consequence + System afterbeat','[Answer]. [Concrete world response]. [Cost or opening].\n\n**System:** [concise accepted delta].'),
('litrpg','Check call','[Visible stakes]. “Make a [check]. On a miss, [specific cost].”'),
('litrpg','Level threshold','[Scene beat lands].\n\n**System:** [threshold crossed]. [One diegetic implication].'),
('litrpg','Loot with texture','[Object arrives through action]. [One property that matters now].\n\n**System:** [item receipt].'),
('litrpg','Quest refusal','[NPC reacts to refusal]. [World pressure remains].\n\n**System:** [No quest change unless accepted].'),
('story_rpg','Threshold arrival','[One sensory anchor]. [A human or physical pressure changes].'),
('story_rpg','Question in a tense room','[Direct answer]. [One face reacts]. [New tension].'),
('story_rpg','Two-character disagreement','[Speaker A want]. [Speaker B resistance]. [Player-visible hinge].'),
('story_rpg','Quiet aftermath','[Concrete remainder]. [One choice that has not gone away].'),
('story_rpg','Earned callback','[Small recalled detail]. [How it changes the present].'),
('tabletop','Ruling then fiction','“Yes / no / you can try. [Rule/stakes].” [Two sentences of consequence].'),
('tabletop','Partial success','[Success acquired]. [Cost enters]. [Next affordance].'),
('tabletop','Failure forward','[Attempt changes scene]. [Cost]. [Still-open route].'),
('tabletop','Social check','[NPC’s leverage]. [Roll and stakes]. [Room reaction after result].'),
('tabletop','Cut scene','[Name where spotlight moves]. [One active pressure]. [Invite only an earned move].'),
('pyoa','Honest choice lenses','[Consequential prose]. “You could [lens], [lens], or take another approach.”'),
('pyoa','Discovery','[Find]. [Why it matters]. [One or two nonexclusive lenses].'),
('pyoa','Bargain','[Terms stated]. [What each side risks]. [Freeform counteroffer remains].'),
('pyoa','Time pressure','[Clock moves visibly]. [Options illuminate different costs].'),
('pyoa','Ending a mini-arc','[Current beat resolves]. [One next pressure becomes visible].')]
notices=[
'**System:** Route discovered — [place].','**System:** Condition cleared — [condition].','**System:** Promise recorded — [terms].','**System:** Trust shifted — [name] now [state].','**System:** Clock advances — [clock] [value].','**System:** Tool spent — [item].','**System:** Technique learned — [name].','**System:** Access changed — [place / faction].','**System:** Risk identified — [risk].','**System:** Oath declined — no bond formed.','**System:** Evidence added — [fact].','**System:** Map amended — [route].','**System:** Supply secured — [item].','**System:** Injury stabilized — [condition].','**System:** Debt marked — [creditor / terms].','**System:** Alarm raised — [area].','**System:** Companion stance changed — [name].','**System:** Lead clarified — [lead].','**System:** Check resolved — [result] against [stakes].','**System:** Scene boundary reached — [next pressure].']
rewrites=[
('I understand. You want to open the door. What do you do?','The latch gives beneath your thumb. Beyond it, a lamp is still burning.'),
('As an AI, I cannot determine that.','I cannot tell from here. The footprint is fresh, but the rain has taken its edge.'),
('Great question! The guard is suspicious.','Yes—the guard is suspicious. His hand has not left the whistle since you named the magistrate.'),
('You successfully persuade the merchant.','The merchant lowers his price, but keeps the ledger on his side of the counter.'),
('Invalid action. Please try again.','The hatch is welded shut. The bolt beside it is loose enough to work with a knife.'),
('I hear you and validate your feelings.','The room goes quiet after your refusal. The priest sets the ring back in its case.'),
('Quest updated: find the relic.','The archivist slides a charcoal rubbing across the desk.\n\n**System:** Lead added — sunken observatory.'),
('You feel afraid as the monster approaches.','The creature’s claws tick across the tiles. Its shadow reaches the doorway before it does.'),
('Choose wisely: 1) fight 2) flee.','The alley narrows behind you. You can stand your ground, run for the market, or try something neither path suggests.'),
('The NPC knows that you stole the coin.','The innkeeper eyes the empty hook where the coin-purse hung. She has not accused anyone yet.'),
('Sorry, there was an error.','I paused before the scene committed. Your move is still here; retry when you are ready.'),
('What do you do?','The far door opens a finger-width, and someone inside whispers your name.')]
openings_hero=[
('A brass token wakes warm in your palm just as the ferry rope snaps. The river takes the boat’s lantern first.'),
('The warning bell rings once beneath the market, though no bell hangs there. A seam of blue light runs between the cobbles.'),
('You wake with ash on your sleeve and a map drawn beneath your skin in fading ink. Outside, someone is calling for the person who survived the fire.'),
('At dawn, every mirror in the boarding house shows the same locked door. Yours is the only room with a key.'),
('The quarry shifts before your first step lands. A voice below the stone says your name as if it has been practicing.'),
('Your borrowed blade hums when the magistrate lies. Tonight, she has summoned you to dinner.'),
('A courier leaves a sealed glass vial at your door. Inside it, a tiny storm circles a paper bearing your signature.'),
('The old well gives back the coin you threw into it years ago—along with a second coin minted tomorrow.'),
('The city’s ward-lamps go out in a single breath. One remains lit above the alley where your friend vanished.'),
('A ledger appears in your pack with one line already written: **Debt paid by sunrise.**')]
openings_blank=[
('Rain darkens the station platform. A porter holds up a card with a name that is not yours, then looks straight at you.'),
('The rented room contains one chair, one cracked window, and a letter addressed to whoever arrives first.'),
('In the market’s last hour, a child offers you a key and asks whether you remember the door it fits.'),
('The village has put a chair in the road. No one will say who is meant to sit in it.'),
('A narrow boat waits beneath the bridge, tied badly enough that the current keeps testing it.'),
('The innkeeper has saved a table by the stove. The place card bears your handwriting, though you have never been here.'),
('A dog trots out of the fog with a red ribbon tied to its collar and a library stamp on the ribbon’s tag.'),
('At the archive desk, a clerk pushes forward an empty file marked **URGENT** and waits for you to speak first.'),
('The train stops between towns. Beyond the glass, a single lantern moves across the field toward you.'),
('A stranger at the harbor mistakes you for someone they have been waiting to forgive.')]
cb=['# F13 — Original content banks','','All player-facing examples below are original, trope-level material. No licensed series names, plots, characters, or quoted dialogue are used. These banks are **rendering scaffolds**; all facts, state changes, permits, and receipts remain subject to the Constitution and turn protocol.','','## 20 GM reply skeletons','','| # | Engine | Skeleton | Template |','|---|---|---|---|']
for i,(engine,title,template) in enumerate(skeletons,1): cb.append(f'| {i} | {engine} | {title} | {template} |')
cb += ['', '## 40 repair / clarify lines', '', 'The complete engine × personality × situation bank is in [F6_repair_copy_bank.csv](F6_repair_copy_bank.csv). The following 40 original lines are suitable for controlled variation; each must preserve its stated repair function.', '']
repair40=[]
for row in rows:
    repair40.append(row['player_visible_copy'])
repair40 += ['I can keep the scene moving, but I need one detail: the window or the guard?','That fact is pinned differently. Correct it, treat this as rumor, or I will use the existing record.','I caught the joke. If you want it to become an actual plan, name the move you are taking.','You asked two things that change different outcomes. Which one must happen first?','I can answer the question now; the action needs a target.','The scene has not committed. Your original words are still intact.','I can fade this out and continue from what happens afterward.','The price is real, but the route you named is not open from here.','I read that as “leave quietly.” If you meant “leave fast,” the watch will notice.','The rule hinge is cover, not distance. Want to revise the position?','That repair changes no state yet. Choose the reading, and I will continue.','The answer is partly known: the emblem is royal, but the bearer is not identified.','I can make the danger less intense without erasing the choice.','The scene is waiting on one contrast, not a full rewrite.','I cannot make that character know what they have not learned.','Your correction comes first. The rest of your move can follow unchanged.']
for i,line in enumerate(repair40[:40],1): cb.append(f'{i}. {line}')
cb += ['', '## 20 diegetic LitRPG System notices', '']
for i,n in enumerate(notices,1): cb.append(f'{i}. {n}')
cb += ['', '## 12 bad chatbot → good GM rewrite pairs', '', '| # | Bad chatbot | Good GM |','|---|---|---|']
for i,(bad,good) in enumerate(rewrites,1): cb.append(f'| {i} | {bad.replace(chr(10),"<br>")} | {good.replace(chr(10),"<br>")} |')
cb += ['', '## 10 Hero Awakening-shaped opening replies', '']
for i,o in enumerate(openings_hero,1): cb.append(f'{i}. {o}')
cb += ['', '## 10 Blank Canvas-shaped opening replies', '']
for i,o in enumerate(openings_blank,1): cb.append(f'{i}. {o}')
cb += ['', '## Bank usage guards', '', 'Use a skeleton only after adjudication. Treat placeholder content as a render slot, not a factual assertion. Do not reuse an opening construction within the same campaign. Do not deploy a repair line without naming the actual contrast. Do not turn a System notice into a replacement for scene body.', '', '## References', '', 'See [citations.md](citations.md). These are original **SPECULATIVE SynapticGM** content assets informed by public conversation relevance, interactive flow, and concise dialogue guidance. [R01] [R08] [R09] [R12]']
write('F13_content_banks.md','\n'.join(cb))

summary={'project':{'name':'SynapticGM Fluid Natural GM Chat Maximum Extract','date':'2026-08-19','scope':'Live SynapticGM only; ledger-first freeform chat/story feel.'},'product_laws':['player correction authority','whole-message obligation coverage','adjudication before prose commit','answer direct questions first','one clear beat per default turn','personality renderer firewall','receipts as evidence not prose interruption','local repair','no mid-action soft offers','Kid Mode stricter contract'],'evidence_domains':['A interacting chat/companion','B narrative craft','C audiobook/TTS','D interactive fiction/parser','E tabletop facilitation','F conversation design/HCI','G NPC dialogue patterns','H improv/oral performance'],'decisions':{'streaming':'closed beta post-commit sentence/paragraph streaming','memory':'ledger authoritative; retrieval/summary supporting only','voice':'semantic equivalence fixtures required','repair':'one contrastive question for material ambiguity','tts':'future text-parity pilot; no audio-only facts'},'deliverables':{'constitution':'00_executive_fluid_gm_constitution.md','teardown':'F2_interaction_feel_teardown.md','protocol':'F3_turn_protocol_spec.md','rails':'F4_prose_rails.json','speech_acts':'speech_acts.json','repair_bank':'F6_repair_copy_bank.csv','eval_fixtures':'F11_fluid_chat_eval_fixtures.json','content_banks':'F13_content_banks.md'},'citations':'citations.md','labels':{'VERIFIED_PUBLIC_MECHANISM':'Cited source explicitly documents a mechanism or result.','SPECULATIVE_TRANSFER':'SynapticGM product proposal inspired by evidence.','COUNSEL':'Requires specialist review before launch.'}}
dump('synapticgm_fluid_chat_research.json',summary)
print('Structured artifacts written.')
