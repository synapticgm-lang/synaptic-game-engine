import csv
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path('/home/ubuntu/synapticgm_catalogue')
PROFILES = json.loads((ROOT / 'family_profiles.json').read_text(encoding='utf-8'))

COLUMNS = [
    'family_id','axis_id','variant_id','title_short','pointer_location',
    'pointer_faction','pointer_intent','pointer_offer','pointer_beats',
    'pointer_fallback','never_lines','first_proof','kid_ok','kid_transform',
    'nsfw','inject_ok','founder_shape_cousin'
]
AXES = [
    'arrival','name_ask','kit_reveal','power_source','growth','system_voice',
    'hub','opposition','first_proof','crowd','offer','companion','identity_lock',
    'ending_logic'
]

AXIS_TITLES = {
    'arrival': [
        'Crowd Before the Answer','Alone After the Impact','Crisis Already Moving',
        'Witnesses in the Wrong Room','Rival Reaches It First','Quiet Aftermath Discovery',
        'Threshold Refuses Easy Passage','Familiar Place Turns Strange'
    ],
    'name_ask': [
        'Official Requests the Name','Companion Asks Without Pressure','A Register Holds Blank',
        'Rival Demands an Alias','A Witness Repeats It','Name Given Under Oath',
        'No One Asks Yet','Player Chooses a Public Title'
    ],
    'kit_reveal': [
        'Offered Across the Table','Need Makes It Real','Returned by an Honest Witness',
        'Assembled While Trouble Closes','Withheld Until Terms Set','Mismatch Reveals the Limit',
        'Borrowed Under Clear Conditions','Consequence Confirms True Ownership'
    ],
    'power_source': [
        'Public Law Shapes Power','Place Itself Answers Action','Old Compact Still Operates',
        'Craft Makes Agency Possible','Threshold Grants One Exception','Witnesses Make Change Binding',
        'Past Scar Feeds Power','Anomaly Resists Clean Explanation'
    ],
    'growth': [
        'Practice Leaves Visible Change','Costly Success Teaches Limits','Teaching Deepens Both Sides',
        'Failure Becomes New Method','Trust Opens Better Options','Resources Fund Lasting Capacity',
        'Public Trial Changes Standing','Irreversible Choice Defines Mastery'
    ],
    'system_voice': [
        'The Inked Clerk','The Municipal Bell','The Patient Assessor','The Weathered Surveyor',
        'The Witness Ledger','The Quiet Custodian','The Formal Appeal Desk','No Voice Only Consequence'
    ],
    'hub': [
        'Kitchen Where Rumors Cross','Workshop With Open Benches','Bathhouse After the Risk',
        'Archive Alcove for Quiet Truths','Market Shelter Between Factions','Night Watch Shared Camp',
        'Threshold Shrine Without Ownership','Moving Rest Stop on Wheels'
    ],
    'opposition': [
        'Institution Claims the Choice','Environment Tightens the Clock','Rival Wants the Same Proof',
        'Scarcity Splits Good People','Helpful Figure Misreads the Need','Old Debt Returns With Terms',
        'Pressure Spreads Beyond One Room','Truth Endangers the Easy Solution'
    ],
    'first_proof': [
        'Object Keeps the Change','Pain Outlasts the Scene','Crowd Reacts Without Prompting',
        'Spent Resource Stays Spent','Map Records a New Route','Promise Enforces Its Cost',
        'Closed Route Forces Adaptation','Saved Person Changes Later Events'
    ],
    'crowd': [
        'Busy Crowd With Conflicting Needs','Small Crew Under Shared Pressure','One Witness Controls the Story',
        'Alone With No Immediate Handler','Rival Arrived Moments Earlier','Separated Groups Need a Bridge',
        'Aftermath Draws People Slowly','Temporary Truce Fills the Room'
    ],
    'offer': [
        'Terms Stated Before Acceptance','Trial First Commitment Later','Both Sides Post Collateral',
        'Witnessed Promise With Deadline','Reversible Test Before the Risk','Rescue Now Payment Later',
        'Two Costs Neither Hidden','Refusal Opens a Third Path'
    ],
    'companion': [
        'Equal Walker With Own Goal','Reluctant Expert Sets Boundaries','Rival Accepts Brief Ceasefire',
        'Dependent Traveler Still Contributes','Companions Rotate by Need','Guide Leaves at Known Threshold',
        'Distant Contact Never Joins','No Companion by Deliberate Choice'
    ],
    'identity_lock': [
        'Origin Fixed Before Escalation','Chosen Name Becomes Binding','Allegiance Remains an Open Question',
        'Personal Boundary Cannot Be Bargained','Responsibility Receives a Clear Holder','Relationship Defined Without Assumption',
        'Evidence Custody Locks Perspective','One Blank Stays Intentionally Open'
    ],
    'ending_logic': [
        'Lives Saved Define Success','Proof Survives Public Scrutiny','Institution Changes or Endures',
        'Promise Fulfilled or Revised','Relationship Ends by Mutual Choice','Resource Future Becomes Sustainable',
        'Return Route Reflects the Journey','Meaningful Refusal Counts as Victory'
    ]
}

AXIS_NEVER = {
    'arrival':'Do not turn the opening camera into a full scripted first chapter.',
    'name_ask':'Do not force the player to reveal a true name before consent or consequence.',
    'kit_reveal':'Do not make ownership automatic when the family requires an offer, test, or proposal.',
    'power_source':'Do not introduce a second genre engine that contradicts the family premise.',
    'growth':'Do not reduce growth to unexplained numerical increase without causal play.',
    'system_voice':'Do not let diction change facts, outcomes, or established rules.',
    'hub':'Do not make the hub perfectly safe, omniscient, or detached from campaign pressure.',
    'opposition':'Do not flatten every opposing person into an evil caricature.',
    'first_proof':'Do not claim proof without a persistent, observable consequence.',
    'crowd':'Do not populate an alone opening with an unchosen handler.',
    'offer':'Do not hide decisive terms that the player would reasonably perceive.',
    'companion':'Do not remove the companion’s independent goals or right to leave.',
    'identity_lock':'Do not overwrite a locked identity fact later for convenience.',
    'ending_logic':'Do not declare a satisfying close without paying off the selected key.'
}

SYSTEM_FAMILIES = {
    'fam-isekai-summon','fam-null-pyoa-isekai','fam-sys-apocalypse','fam-gate-city',
    'fam-late-awaken','fam-tower-climb','fam-dungeon-drop','fam-academy',
    'fam-dungeon-core','fam-void-bargain','fam-vrmmo-trap','fam-regression',
    'fam-creature-rebirth','fam-cyber-neural','fam-litrpg-custom'
}

NO_SYSTEM_TITLES = [
    'No Voice Physical Consequence','No Voice Witness Testimony',
    'No Voice Human Records','No Voice Environmental Signs',
    'No Voice Craft Feedback','No Voice Social Custom',
    'No Voice Remembered Promise','No Interface Consequence First'
]


def loc(p, suffix):
    return f"{p['home']}; {suffix}"


def sentence(text):
    text = text.strip()
    if text:
        text = text[0].upper() + text[1:]
    return text if text.endswith(('.', '!', '?')) else text + '.'


def fallback(setting, change, choice):
    return f"{sentence(setting)} {sentence(change)} {sentence(choice)}"


def details(axis, i, p):
    a = p['faction_a']
    b = p['faction_b']
    obj = p['macguffin']
    default_kits = {
        'LitRPG': 'a practical starter kit whose limits remain visible',
        'PYOA': 'a portable crisis kit suited to the immediate hazard',
        'Story RPG': 'a role-specific working kit assembled from local tools',
        'Tabletop Fantasy': 'an unbranded adventuring kit with finite supplies',
        'Optional extra': 'a survival kit adapted to the current body or interface'
    }
    kit = p.get('kit', default_kits[p['category']])
    if p['family_id'] == 'fam-isekai-summon':
        kit = 'a bundled travel pack containing a plain defensive tool and a sealed utility roll'
    home = p['home']
    offer = p['offer']
    power = p['power']
    growth = p['growth']
    hub = p['hub']
    opposition = p['opposition']
    companion = p['companion']
    identity = p['identity']
    ending = p['ending']

    if axis == 'arrival':
        rows = [
            (home, f'{a} and {b}', 'Begin amid competing needs', 'none',
             f'crowd blocks the clean view; {obj} is already disputed; one consequence demands action',
             f'The player reaches {home} while {a} and {b} argue over {obj}', 'The dispute changes direction when the player is noticed', 'Choose whom to address before the crowd decides what the arrival means',
             f'A public reaction to the player changes access to {obj}.'),
            (loc(p,'an overlooked edge beyond the main light'), 'none nearby', 'Begin with self-directed observation', 'none',
             f'no handler is present; a trace points toward {obj}; the environment imposes a small cost',
             f'The player is alone at {home}, outside anyone’s immediate attention', f'A physical trace links the place to {obj}', 'Act on the trace or preserve distance before anyone arrives',
             'A physical cost remains after the player tests the environment.'),
            (loc(p,'the route through it'), a, 'Start after the emergency has begun', 'none',
             f'an urgent task is already failing; {a} cannot pause to explain; {obj} matters to the next minute',
             f'Trouble is already moving through {home}', f'A representative of {a} needs help connected to {obj} before explanations are possible', 'Intervene, observe, or protect someone first',
             'The crisis responds immediately and differently to the player’s intervention.'),
            (loc(p,'a side room not meant for arrivals'), b, 'Create a wrong-room discovery', 'none',
             f'the player appears among unintended witnesses; someone among {b} hides an assumption; a door closes elsewhere',
             f'The opening places the player in the wrong room at {home}', f'A witness among {b} sees the arrival and immediately reconsiders {obj}', 'Decide whether to correct the mistake or use the brief advantage',
             'A witness changes a concrete plan because the player arrived in the wrong place.'),
            (loc(p,'the contested approach'), b, 'Put a rival one beat ahead', 'none',
             f'a rival already touched {obj}; evidence of the first move remains; the player still controls the response',
             f'At {home}, a rival from {b} reaches {obj} moments before the player', 'The rival’s first move creates a new obstacle rather than ending the contest', 'Respond through pursuit, negotiation, or a different route',
             'The rival’s action produces a persistent obstacle the player must now address.'),
            (loc(p,'the quiet space after an incident'), 'late witnesses', 'Open on aftermath rather than impact', 'none',
             f'the immediate danger has passed; one detail involving {obj} does not fit; witnesses arrive with incompatible accounts',
             f'The player enters {home} after the loudest moment has ended', f'A surviving detail around {obj} contradicts the easiest explanation', 'Preserve evidence, help the affected, or question a witness',
             'A preserved detail later contradicts a witness who expected it to vanish.'),
            (loc(p,'a marked threshold'), a, 'Make permission the first problem', offer,
             f'the threshold reacts before a guard does; {a} can explain only part of the rule; crossing would alter custody of {obj}',
             f'A threshold at {home} refuses ordinary passage', f'A representative of {a} offers a lawful but costly way to cross without surrendering {obj}', 'Accept the condition, seek an exception, or remain outside',
             'The threshold changes state only after a real condition is met.'),
            (loc(p,'a familiar-looking corner'), 'familiar faces acting differently', 'Make continuity itself uncanny', 'none',
             f'the place resembles a remembered routine; one familiar detail now serves {opposition}; {obj} appears where it should not',
             f'The player recognizes the shape of {home}, but its use has changed', f'A familiar routine now reveals pressure from {opposition}', 'Trust memory, test the difference, or ask who changed the rule',
             'A remembered action produces a new result that everyone else treats as normal.')
        ]
    elif axis == 'name_ask':
        rows = [
            (loc(p,'the official desk'), a, 'Record a name with visible stakes', offer,
             f'an official leaves the line blank; the consequence of naming is explained; {obj} remains outside the exchange',
             f'At {home}, a representative of {a} asks what name may be recorded', 'The request is formal but does not seize the player’s identity', 'Give a name, an alias, or a reason to leave the line blank',
             'The chosen entry changes who may lawfully address or admit the player.'),
            (loc(p,'a quieter walking route'), companion, 'Let trust precede naming', 'none',
             'the companion states their own name first; silence is accepted; a later introduction remains possible',
             f'While leaving {home}, {companion} asks what the player wants to be called', 'The question is personal rather than administrative', 'Answer now, defer, or ask for the companion’s preferred form first',
             'The companion consistently uses the chosen form and corrects another speaker later.'),
            (loc(p,'a public register'), 'a silent clerk or object', 'Make absence on a record visible', 'none',
             f'a blank line waits beside {obj}; no voice demands an answer; others notice whether the line stays empty',
             f'A register at {home} presents an empty line beside {obj}', 'The player controls whether any name is entered', 'Write a name, make a mark, or close the book',
             'The register later admits or rejects a claim according to the player’s mark.'),
            (loc(p,'a contested checkpoint'), b, 'Use naming as leverage', 'none',
             'a rival asks for an alias; the demand is not lawful; witnesses measure the response',
             f'At {home}, a rival from {b} demands a name before allowing the conversation to continue', 'The rival wants leverage, not courtesy', 'Give an alias, challenge the authority, or redirect the question',
             'The rival acts on the supplied name or visibly loses standing when refused.'),
            (loc(p,'a witness circle'), 'a neutral witness', 'Echo the player’s chosen identity', 'none',
             'the witness repeats the heard name; the room waits for correction; pronunciation becomes part of respect',
             f'A neutral witness at {home} repeats the player’s name as they understood it', 'The repetition offers a chance to correct without confrontation', 'Confirm, correct, or replace the name before it spreads',
             'Later witnesses use the corrected form, proving the choice propagated.'),
            (loc(p,'a place of witnessed promises'), a, 'Bind a public name to one promise', offer,
             'the oath wording names only the promised role; a true name is unnecessary; witnesses record consent',
             f'At {home}, a representative of {a} asks what name should stand beside a limited promise', 'The oath cannot claim more identity than the player offers', 'Choose a public name, narrow the promise, or refuse the oath',
             'Only the named promise becomes enforceable, and broader claims fail.'),
            (loc(p,'the first uninterrupted path'), 'none', 'Preserve an unnamed opening', 'none',
             'no one asks; the player can observe without social capture; identity remains self-authored',
             f'No one at {home} asks the player’s name', 'The absence creates space rather than erasure', 'Act anonymously now and decide later when a name would matter',
             'A later introduction refers back to what the unnamed player actually did.'),
            (loc(p,'a gathering using public titles'), f'{a} and {b}', 'Let the player choose a role-name', 'none',
             'others use earned titles; no lineage is assumed; the title can be retired later',
             f'At {home}, the gathering asks how the player should be announced', 'A public title can describe purpose without exposing private identity', 'Choose a title, use a simple name, or decline announcement',
             'The announcement changes how the crowd approaches the player during the next decision.')
        ]
    elif axis == 'kit_reveal':
        rows = [
            (loc(p,'a table with room to refuse'), a, 'Separate gear from obligation', offer,
             f'{kit} is placed in view; every condition is stated; taking it remains separate from accepting the larger cause',
             f'At {home}, a representative of {a} places {kit} where the player can inspect it', 'Nothing becomes the player’s property until acceptance is clear', 'Inspect, negotiate, accept, or leave the offer untouched',
             'The offered item responds only after a clear acceptance and remains inert if refused.'),
            (loc(p,'the first practical obstacle'), 'none', 'Reveal usefulness through need', 'none',
             f'an ordinary problem exposes a hidden function; {kit} solves only part of it; the limitation is immediately visible',
             f'A practical need at {home} makes the function of {kit} undeniable', 'The reveal solves one problem while exposing a limit', 'Use it, conserve it, or find a non-kit solution',
             'The solved obstacle stays solved, while the revealed limitation constrains the next use.'),
            (loc(p,'a place of returned property'), 'an honest witness', 'Establish provenance before ownership', 'none',
             f'a witness returns {kit}; the chain of custody is stated; one missing piece prevents easy certainty',
             f'An honest witness at {home} returns {kit} to the player', 'The witness explains where it was found without claiming what it means', 'Accept custody, request verification, or leave it sealed',
             'A later claimant recognizes the same custody mark described by the witness.'),
            (loc(p,'a work surface under pressure'), f'{a} and the player', 'Make preparation an active scene', 'shared labor',
             'components arrive separately; one piece must be chosen; assembly changes what can be attempted next',
             f'At {home}, the player and {a} assemble the needed kit while pressure closes in', 'The final configuration reflects a real choice rather than a preset loadout', 'Choose speed, safety, or adaptability before the next beat',
             'The selected configuration produces a distinct advantage and a matching constraint.'),
            (loc(p,'a secure holding place'), a, 'Let terms precede release', offer,
             f'the kit remains visible but withheld; the custodian explains the narrow condition; refusal preserves another route',
             f'At {home}, a custodian from {a} keeps the relevant kit secured until the terms are understood', 'The withholding is procedural rather than arbitrary', 'Meet the condition, negotiate a substitute, or proceed without it',
             'The kit is released only when the stated condition is actually satisfied.'),
            (loc(p,'a test area'), 'a neutral tester', 'Reveal limits through mismatch', 'none',
             f'the first tool does not fit; the failure causes no humiliation; {kit} points toward a more suitable option',
             f'A routine test at {home} shows that the expected kit does not fit the player’s actual need', 'The mismatch reveals a limit without defining the player as defective', 'Adapt the tool, choose another, or decline the category',
             'A second test succeeds only after the mismatch is meaningfully addressed.'),
            (loc(p,'a lending counter'), b, 'Create temporary use without false ownership', 'return it intact or report the loss',
             f'{kit} is loaned for one task; return terms are written plainly; damage has a social rather than automatic lethal cost',
             f'At {home}, a lender from {b} offers temporary custody of {kit}', 'The loan grants capability without pretending permanent ownership', 'Borrow it, offer collateral, or solve the task another way',
             'The lender later responds to the exact condition in which the borrowed item returns.'),
            (loc(p,'the scene of a lasting consequence'), f'{a} and {b}', 'Let responsibility prove ownership', 'none',
             f'{kit} preserves the result of the player’s choice; witnesses recognize the responsibility; ownership brings an obligation',
             f'At {home}, the consequences of using {kit} make the player’s relationship to it real', 'The reveal is social and causal, not merely visual', 'Accept responsibility, transfer custody lawfully, or contest the claim',
             'A later decision treats the player as custodian because of the preserved consequence.')
        ]
    elif axis == 'power_source':
        causes = [
            ('a public rule everyone can test','the rule applies equally to an ally and a rival','test the rule, seek an exception, or refuse its benefit'),
            ('the place reacting to meaningful action','the environment answers behavior rather than ancestry','act carefully, compare outcomes, or leave the area unchanged'),
            ('an old compact with surviving obligations','the benefit appears only beside its matching duty','honor, amend, or lawfully end the compact'),
            ('crafted tools and maintained networks','someone’s labor remains visible in every use','repair, share, or decline access'),
            ('a threshold condition that grants one exception','crossing changes what the player may do and what may follow','cross, negotiate, or remain outside'),
            ('collective witness making a change binding','the same act done unwitnessed has a different effect','gather witnesses, protect privacy, or accept a weaker result'),
            ('a past scar that stores consequence','the scar empowers and limits the same action','use the history, heal it, or stop drawing from it'),
            ('an anomaly that resists final explanation','reliable effects exist even while the cause remains uncertain','record evidence, use cautiously, or prioritize containment')
        ]
        label, change, choice = causes[i]
        rows = [(loc(p,'the first place the rule can be tested'), f'{a} and {b}', 'Make power causal and observable', 'none',
                 f'{power}; source appears as {label}; a limit is observed before escalation',
                 f'At {home}, the player discovers that agency comes from {power}', change.capitalize(), choice.capitalize(),
                 f'A repeated test confirms that {label} changes the same class of outcome.') for _ in range(8)]
    elif axis == 'growth':
        modes = [
            ('deliberate practice','a previously difficult action becomes repeatable','practice again, teach it, or apply it under pressure'),
            ('a success that exposes its cost','greater capability arrives with a concrete limit','accept the cost, redesign the method, or stop'),
            ('teaching another person','explaining the method reveals a hidden assumption','teach openly, keep a boundary, or learn from the student'),
            ('correcting a failure','the failed attempt becomes evidence rather than shame','revise, seek help, or choose another route'),
            ('earned social trust','access opens because people remember conduct','use the access responsibly, share it, or decline privilege'),
            ('investing scarce resources','capacity grows while another use becomes unavailable','invest now, save resources, or pool them'),
            ('a public trial','standing changes according to witnessed performance and fairness','take the trial, challenge its terms, or offer another proof'),
            ('an irreversible choice','mastery becomes defined by what the player will no longer do','commit, delay, or choose a different mastery')
        ]
        mode, change, choice = modes[i]
        rows = [(loc(p,'a place where progress can be witnessed'), a, 'Turn advancement into a scene', 'none',
                 f'{growth}; progress comes through {mode}; the new capacity changes a later option',
                 f'At {home}, growth occurs through {growth}', change.capitalize(), choice.capitalize(),
                 f'A later obstacle can be handled differently because of {mode}.') for _ in range(8)]
    elif axis == 'system_voice':
        if p['family_id'] not in SYSTEM_FAMILIES or p['family_id'] == 'fam-village-soft':
            modes = [
                ('no interface or disembodied voice','physical consequence carries every fact'),
                ('no interface, with facts conveyed by witnesses','different observers may disagree'),
                ('no interface, with records written by people','records can be incomplete without becoming magical'),
                ('no interface, with environmental signs','the player learns by testing place and pattern'),
                ('no interface, with craft feedback','tools show limits through use'),
                ('no interface, with social custom','rules are explained by those who live under them'),
                ('no interface, with remembered promises','obligations surface when invoked'),
                ('no interface of any kind','the narrative remains fully consequence-first')
            ]
            mode, change = modes[i]
            rows = [(loc(p,'the scene where a fact becomes knowable'), 'diegetic witnesses only', 'Preserve a no-System family', 'none',
                     f'{mode}; {change}; no chrome diction is injected',
                     f'At {home}, there is {mode}', change.capitalize(), 'The player learns through action, observation, and conversation',
                     'A concrete consequence confirms the fact without any System message.') for _ in range(8)]
        else:
            voices = [
                ('an inked clerk','brief docket lines and appeal windows'),
                ('a municipal bell','public notices timed to shared events'),
                ('a patient assessor','calm observations that distinguish fact from advice'),
                ('a weathered surveyor','route, distance, and hazard language'),
                ('a witness ledger','statements tied to who observed the cause'),
                ('a quiet custodian','maintenance language focused on limits and repair'),
                ('a formal appeal desk','rulings followed by a narrow path to contest them'),
                ('no audible voice','facts appearing only in approved records and consequence')
            ]
            voice, diction = voices[i]
            rows = [(loc(p,'the moment a rule needs wording'), 'the established rule engine', 'Provide diction without changing facts', 'none',
                     f'{voice} register; {diction}; identical outcomes under every voice',
                     f'At {home}, the established rules are phrased by {voice}', f'The diction uses {diction} without adding powers or changing outcomes', 'The player may heed, question, or ignore advice while facts remain fixed',
                     'A repeated action produces the same result even when the voice phrases it differently.') for _ in range(8)]
    elif axis == 'hub':
        forms = [
            ('a working kitchen','food preparation makes rank briefly porous','listen, help with a task, or request a private table'),
            ('an open-bench workshop','repairs reveal who depends on whom','trade labor, commission work, or compare damage'),
            ('a recovery bathhouse','people lower their guard after risk without becoming helpless','rest, exchange rumors, or keep a respectful distance'),
            ('a quiet archive alcove','records allow slow verification','research, leave a note, or challenge an annotation'),
            ('a covered market shelter','rival groups must share weather protection','barter, mediate, or watch who avoids whom'),
            ('a night-watch camp','rumor moves through assigned watches','take a watch, sleep, or share one concern'),
            ('an unowned threshold shrine','hospitality applies only while weapons stay lowered','accept truce, make an offering, or remain outside'),
            ('a moving rest stop','the hub travels and can be lost','board, resupply, or let it pass')
        ]
        form, change, choice = forms[i]
        rows = [(hub, f'{a}, {b}, and ordinary workers', 'Create rest, rumor, and bounded safety', 'none',
                 f'hub takes the form of {form}; {change}; outside pressure remains audible',
                 f'The party reaches {hub}, using {form} as the social center', change.capitalize(), choice.capitalize(),
                 'Information learned in the hub changes a later route or relationship.') for _ in range(8)]
    elif axis == 'opposition':
        pressures = [
            ('an institution claiming authority over the player’s choice','its claim has a real procedure and a contestable weakness','comply, appeal, or build public support'),
            ('the environment tightening the clock','delay consumes a visible resource','act quickly, reduce the hazard, or accept a loss'),
            ('a rival seeking the same proof','the rival can be reasoned with but will not yield for free','race, bargain, or pursue a different proof'),
            ('scarcity splitting people with legitimate needs','allocation helps one group before another','share, ration, or find a substitute'),
            ('a helpful figure misunderstanding the actual need','good intentions create a harmful plan','correct them, accept limited help, or take responsibility'),
            ('an old debt returning with documented terms','the debt is valid but its enforcement may be unjust','pay, renegotiate, or challenge enforcement'),
            ('pressure spreading beyond the first room','inaction changes another location','contain, warn others, or retreat strategically'),
            ('truth threatening the easiest solution','the convenient plan depends on a false account','expose, verify, or seek a less damaging truth')
        ]
        pressure, change, choice = pressures[i]
        rows = [(loc(p,'the point where pressure becomes visible'), b, 'Create campaign pressure with agency', 'none',
                 f'{opposition}; immediate form is {pressure}; no opponent controls every option',
                 f'At {home}, opposition emerges through {opposition}', change.capitalize(), choice.capitalize(),
                 f'The world changes persistently when the player addresses {pressure}.') for _ in range(8)]
    elif axis == 'first_proof':
        proofs = [
            (f'{obj} keeps a mark made by the player','the mark remains after attention moves elsewhere','repeat the test, preserve the object, or show a witness'),
            ('a minor strain or fatigue persists','rest helps but does not retroactively erase exertion','adapt, seek care, or stop the risky action'),
            ('a crowd reacts independently','different people respond from their own interests','ask what they saw, use the opening, or withdraw'),
            ('a consumed resource remains gone','the missing resource closes one easy option','replace it, ration, or accept the tradeoff'),
            ('a map or route record updates','the new route can now be followed by someone else','share, conceal, or verify the route'),
            ('a promise enforces its stated cost','only the stated clause activates','fulfill, appeal, or accept breach consequences'),
            ('a route closes because of the action','the closure protects one path and endangers another','reroute, reopen, or warn others'),
            ('a person saved earlier acts later','their independent decision changes the next scene','accept help, disagree, or release them from obligation')
        ]
        proof, change, choice = proofs[i]
        rows = [(loc(p,'the place of the first causal test'), 'the world and any present witnesses', 'Prove consequence without exposition', 'none',
                 f'action occurs; {proof}; a second observer or later scene confirms persistence',
                 f'At {home}, the player takes a small action connected to {obj}', change.capitalize(), choice.capitalize(),
                 f'The consequence remains observable after the scene advances because {proof}.') for _ in range(8)]
    elif axis == 'crowd':
        social = [
            ('a busy crowd with incompatible needs',f'{a} and {b}','the player must choose where attention goes first','address one need, call for order, or leave the center'),
            ('a small crew sharing immediate risk',a,'everyone has a task but no one has the whole answer','take a role, coordinate, or challenge the plan'),
            ('one witness controlling the first account','a single witness','the witness may be sincere without being complete','listen, test the account, or seek physical evidence'),
            ('complete solitude','none','no handler frames the premise for the player','observe, act, or wait for consequences'),
            ('a rival who arrived first',b,'the rival controls the opening narrative but not the evidence','interrupt, shadow them, or take another route'),
            ('two separated groups needing a bridge',f'{a} and {b}','neither side can hear the other accurately','mediate, carry a message, or refuse the role'),
            ('an aftermath that draws people gradually','late arrivals','each newcomer changes the available account','stabilize the scene, interview, or move on'),
            ('a temporary mixed-faction truce',f'{a} and {b}','the room is crowded but violence is bounded by shared need','use the truce, reinforce it, or prepare for its end')
        ]
        social_form, faction, change, choice = social[i]
        rows = [(loc(p,'the opening social frame'), faction, 'Set page-one social density', 'none',
                 f'social frame is {social_form}; {change}; the player retains initiative',
                 f'At {home}, the opening places the player amid {social_form}', change.capitalize(), choice.capitalize(),
                 'The selected social frame determines who can react to the player’s first action.') for _ in range(8)]
    elif axis == 'offer':
        structures = [
            ('all material terms stated before acceptance','nothing transfers until consent','accept, counter, or refuse'),
            ('a bounded trial before long commitment','the trial has an end condition and no hidden renewal','attempt, revise, or decline the trial'),
            ('mutual collateral held by a neutral party','both sides risk something proportionate','post collateral, propose another guarantee, or walk away'),
            ('a witnessed promise with a deadline','witnesses record only the stated duty','promise, narrow the terms, or refuse'),
            ('a reversible test before irreversible risk','the player can stop after the test','test, inspect the result, or choose another route'),
            ('urgent rescue with payment deferred','aid is not withheld while terms are discussed','accept help, record a fair debt, or offer another repayment'),
            ('two visible costs with neither disguised','the player may search for a third option','choose, delay, or challenge the framing'),
            ('a refusal that creates a different opportunity','saying no changes relationships but does not end play','refuse, explain, or propose a new compact')
        ]
        structure, change, choice = structures[i]
        rows = [(loc(p,'a place where terms can be heard'), a, 'Make bargain structure playable', offer,
                 f'offer uses {structure}; {change}; consequences of refusal remain specific',
                 f'At {home}, a representative of {a} presents an offer concerning {obj}', change.capitalize(), choice.capitalize(),
                 'The next scene records whether the player accepted, altered, or refused the proposed terms.') for _ in range(8)]
    elif axis == 'companion':
        patterns = [
            (companion,'an equal walker with an independent destination','neither character becomes the other’s handler','coordinate, split briefly, or continue separately'),
            (companion,'a reluctant expert who names boundaries','expertise does not imply obedience','respect the limit, negotiate, or seek another guide'),
            (f'a member of {b}','a rival accepting a brief ceasefire','the rivalry survives the shared task','cooperate narrowly, test trust, or end the truce'),
            (companion,'a traveler who needs help and still contributes','dependence is specific rather than total','share burdens, exchange skills, or part safely'),
            (f'people from {a} and {b}','companions rotating according to need','no permanent party is assumed','choose the next specialist, travel alone, or invite both'),
            (companion,'a guide who leaves at a known threshold','the departure is stated before attachment becomes obligation','cross together, prepare for departure, or turn back'),
            ('a distant correspondent','a contact who never joins the walk','support arrives through messages or prepared resources','reply, request one favor, or preserve distance'),
            ('none','deliberate solo travel','the absence of a companion remains valid','continue alone, invite someone later, or use public help without a party')
        ]
        faction, pattern, change, choice = patterns[i]
        rows = [(loc(p,'the route where company matters'), faction, 'Define walking-together posture', 'none',
                 f'pattern is {pattern}; {change}; separation remains possible',
                 f'Leaving {home}, the player encounters {pattern}', change.capitalize(), choice.capitalize(),
                 'A later route or decision changes because the companion stayed, left, or was never recruited.') for _ in range(8)]
    elif axis == 'identity_lock':
        locks = [
            ('origin and continuity',identity,'state what is already true, then leave interpretation open'),
            ('chosen name','the form of address the player authorizes','record it and propagate corrections'),
            ('allegiance','which groups may claim support and which may not','keep uncertain allegiance open until a consequential choice'),
            ('personal boundary','what the player will not trade, reveal, or permit','make the boundary actionable and respected by the engine'),
            ('responsibility','who currently holds custody or duty for the immediate problem','show transfer only through explicit action'),
            ('relationship','what has and has not been consented between characters','avoid assuming intimacy, loyalty, or permanence'),
            ('evidence custody',f'who holds {obj} and who witnessed the transfer','preserve the chain across scenes'),
            ('intentional blank','one world or identity fact the player has not chosen','offer proposals without making any one proposal canon')
        ]
        lock_name, value, action = locks[i]
        rows = [(loc(p,'the moment before escalation'), 'the player and any lawful witness', 'Freeze one identity fact without overreach', 'none',
                 f'lock concerns {lock_name}; current value is {value}; later scenes must honor the lock',
                 f'At {home}, the opening pauses long enough to establish the {lock_name}', action.capitalize(), 'Confirm, refine, or explicitly leave the allowed blank open',
                 f'A later character or rule recognizes the established {lock_name} without rewriting it.') for _ in range(8)]
    elif axis == 'ending_logic':
        keys = [
            ('lives tangibly saved','survival must be visible beyond the final confrontation','protect, evacuate, or accept a narrower rescue'),
            ('proof surviving public scrutiny','the explanation must account for physical cause and contrary testimony','present, preserve, or delay publication'),
            ('an institution changing or deliberately enduring','the final choice must alter procedure, access, or legitimacy','reform, replace, or defend a justified rule'),
            ('a promise fulfilled, amended, or released','the ending must count both duty and consent','fulfill, renegotiate, or accept breach honestly'),
            ('a relationship ending by mutual choice','no bond is awarded for possession or pressure','continue, redefine, or part with agency intact'),
            ('a resource future becoming sustainable','the ending must show who can use, maintain, or restore it','share, steward, ration, or relinquish control'),
            ('a return or exit reflecting the journey','departure must preserve at least one consequence of play','return, remain, or open passage for others'),
            ('a meaningful refusal','saying no must prevent one harm or establish one value','refuse, expose the coercive frame, or build a third path')
        ]
        key, change, choice = keys[i]
        rows = [(loc(p,'the final decision space'), f'{a}, {b}, and affected people', 'Key a satisfying close to earned consequences', 'none',
                 f'family close concerns {ending}; selected key is {key}; epilogue shows the durable result',
                 f'The campaign closes at {home} by resolving {ending}', change.capitalize(), choice.capitalize(),
                 f'The epilogue demonstrates {key} through a changed person, rule, route, or resource.') for _ in range(8)]
    else:
        raise KeyError(axis)

    return rows[i]


def make_row(p, axis, i):
    location, faction, intent, offer, beats, f1, f2, f3, proof = details(axis, i, p)
    title = AXIS_TITLES[axis][i]
    if axis == 'system_voice' and (p['family_id'] not in SYSTEM_FAMILIES or p['family_id'] == 'fam-village-soft'):
        title = NO_SYSTEM_TITLES[i]
    kid_ok = True
    kid_transform = 'none needed'
    nsfw = False
    if p['family_id'] == 'fam-pyoa-dark-romance':
        kid_ok = False
        kid_transform = 'Move the scene to a moonlit treaty hall, replace adult courtship pressure with rival-clan friendship, and keep every bond optional.'
        nsfw = i < 4
        if not nsfw and axis in {'offer','companion','ending_logic'}:
            beats = beats + '; any adult intimacy fades to black'
            f3 = f3.rstrip()
            if not f3.endswith(('.', '!', '?')):
                f3 += '.'
            f3 += ' Any later intimacy remains off-page.'
    return {
        'family_id': p['family_id'],
        'axis_id': axis,
        'variant_id': f"{p['family_id']}-{axis}-{i+1:02d}",
        'title_short': title,
        'pointer_location': location,
        'pointer_faction': faction,
        'pointer_intent': intent,
        'pointer_offer': offer,
        'pointer_beats': beats,
        'pointer_fallback': fallback(f1, f2, f3),
        'never_lines': f"{p['never']} {AXIS_NEVER[axis]}",
        'first_proof': sentence(proof),
        'kid_ok': str(kid_ok).lower(),
        'kid_transform': kid_transform,
        'nsfw': str(nsfw).lower(),
        'inject_ok': 'true',
        'founder_shape_cousin': ''
    }


rows = []
for p in PROFILES:
    for axis in AXES:
        for i in range(8):
            rows.append(make_row(p, axis, i))

with (ROOT / 'tropes.csv').open('w', encoding='utf-8', newline='') as handle:
    writer = csv.DictWriter(handle, fieldnames=COLUMNS)
    writer.writeheader()
    writer.writerows(rows)

# Unified index: one family matrix plus family-specific never-lines.
index = [
    '# SynapticGM — Key Parts Trope Catalogue Index',
    '',
    '**Author:** Manus AI',
    '',
    'This catalogue is a bank of **pointer cards**. A live GM may seed-pick one compatible variant per axis, but the writer remains responsible for original prose and must not reproduce a fallback as the whole opening.',
    '',
    '> **Injection rule:** Only rows with `inject_ok=true` may enter a live prompt. The `founder_shape_cousin` column is intentionally empty throughout this release.',
    '',
    '## Family × axis status',
    '',
    '| Category | family_id | Family | Pinned axes | Free or texture-selectable axes |',
    '|---|---|---|---|---|'
]
for p in PROFILES:
    pinned = ', '.join(f'`{x}`' for x in p['pinned']) if p['pinned'] else 'None'
    free = ', '.join(f'`{x}`' for x in AXES if x not in p['pinned'])
    index.append(f"| {p['category']} | `{p['family_id']}` | {p['title']} | {pinned} | {free} |")

index.extend(['', '## Family-specific never-lines', ''])
for p in PROFILES:
    never_lines = [
        p['never'],
        f"Do not replace {p['macguffin']} with a different object class during generation.",
        f"Do not make {p['faction_a']} automatically correct in every dispute.",
        f"Do not make {p['faction_b']} automatically malicious in every dispute.",
        f"Do not erase the campaign pressure: {p['opposition']}.",
        f"Do not turn the hub into a consequence-free sanctuary; preserve its connection to {p['hub']}.",
        f"Do not turn the companion pattern into ownership or obedience; preserve: {p['companion']}.",
        f"Do not reveal a power cause that contradicts the established source: {p['power']}.",
        f"Do not grant growth without play that reflects {p['growth']}.",
        f"Do not settle identity before honoring the lock: {p['identity']}.",
        f"Do not hide decisive bargain terms from the player; preserve the structure: {p['offer']}.",
        f"Do not close the story without paying off: {p['ending']}.",
        'Do not name, quote, imitate, or compare the run to a licensed modern property.',
        'Do not use any reserved World of Fantasy race, place, faction, or setting name.',
        'Do not expose internal orchestration jargon in player-facing prose.'
    ]
    index.extend([
        f"### `{p['family_id']}` — {p['title']}",
        '',
        '| # | Never-line | Reason |',
        '|---:|---|---|'
    ])
    for n, line in enumerate(never_lines, start=1):
        reason = 'Preserves family canon, player agency, originality, or live-prompt safety.'
        safe_line = line.replace('|', '\\|')
        index.append(f'| {n} | {safe_line} | {reason} |')
    index.extend(['', '**Honest limitations:** None; all fourteen axes have eight texture-valid variants.', ''])

(ROOT / 'catalogue_index.md').write_text('\n'.join(index).rstrip() + '\n', encoding='utf-8')

print(json.dumps({
    'families': len(PROFILES),
    'axes': len(AXES),
    'rows': len(rows),
    'expected_rows': len(PROFILES) * len(AXES) * 8,
    'output_csv': str(ROOT / 'tropes.csv'),
    'output_index': str(ROOT / 'catalogue_index.md')
}, indent=2))
