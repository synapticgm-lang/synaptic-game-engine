from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path('/home/ubuntu/SynapticGM_snapshot_eval_pack_2026-08-25')
SCENARIO_COLUMNS = [
    'id', 'class', 'setup_snapshot_json', 'last_gm_story', 'player_input',
    'expect_hard_gate', 'expect_warden_scrub', 'expect_facts_unchanged',
    'fail_symptom', 'automated_assert', 'notes'
]
GOOD_COLUMNS = ['id', 'prose', 'snapshot_json', 'must_keep_phrases', 'must_not_invent', 'notes']
ADV_COLUMNS = ['id', 'sentence', 'why_naive_regex_fails', 'correct_expect', 'notes']


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open('r', encoding='utf-8-sig', newline='') as handle:
        return list(csv.DictReader(handle))


def write_csv(path: Path, columns: list[str], rows: list[dict[str, str]]) -> None:
    with path.open('w', encoding='utf-8', newline='') as handle:
        writer = csv.DictWriter(handle, fieldnames=columns, lineterminator='\n')
        writer.writeheader()
        writer.writerows(rows)


def compact(obj: dict) -> str:
    return json.dumps(obj, ensure_ascii=False, separators=(',', ':'))


def base_snapshot(
    location: str,
    *,
    crowd: str = 'none',
    crowd_size: int = 0,
    indoor: bool = True,
    time: str = 'afternoon',
    tension: str = 'calm',
    exits: list[str] | None = None,
    props: list[str] | None = None,
    present: list[str] | None = None,
    companions: list[str] | None = None,
    inventory: list[str] | None = None,
    opening_cover: bool = False,
    alone_arrival: bool = False,
    **extra,
) -> dict:
    snapshot = {
        'location': location,
        'crowd': crowd,
        'crowdSize': crowd_size,
        'indoor': indoor,
        'timeOfDay': time,
        'tension': tension,
        'exits': exits or [],
        'props': props or [],
        'present': present or [],
        'companions': companions or [],
        'inventory': inventory or [],
        'openingCover': opening_cover,
        'aloneArrival': alone_arrival,
    }
    snapshot.update(extra)
    return snapshot


def update_row(rows_by_id: dict[str, dict[str, str]], rid: str, **changes: str) -> None:
    rows_by_id[rid].update(changes)


def refine_scenarios() -> None:
    rows = read_csv(ROOT / 'scenarios.csv')
    by_id = {row['id']: row for row in rows}

    # Prefix/class consistency.
    update_row(by_id, 'A019', **{'class': 'A-turn'})

    # Diversify A-turn snapshots without altering the intended gate result.
    a_snapshots = {
        'A001': base_snapshot('Rainmarket Lane', crowd='present', crowd_size=6, indoor=False, exits=['north alley'], props=['canvas awning'], present=['Thorn'], inventory=['iron dagger', 'map']),
        'A002': base_snapshot('Broken Bell Tower', indoor=True, tension='tense', exits=['spiral stair'], props=['frayed bell rope'], present=['Ivo'], inventory=['chalk', 'travel bag']),
        'A003': base_snapshot('Moss Gate Ruin', indoor=False, tension='danger', exits=['east breach'], props=['fallen lintel'], present=['Mara'], inventory=['short spear', 'canteen']),
        'A004': base_snapshot('Copper Kettle Inn', crowd='present', crowd_size=8, indoor=True, exits=['taproom door'], props=['round table'], present=['Nera'], inventory=['coin purse', 'sealed note']),
        'A005': base_snapshot('Quiet Canal Walk', indoor=False, exits=['stone steps'], props=['mooring post'], inventory=['map'], alone_arrival=True),
        'A006': base_snapshot('Windcut Ridge', indoor=False, tension='tense', exits=['south trail'], props=['signal cairn'], companions=['hawk'], inventory=['whistle', 'cloak']),
        'A007': base_snapshot('Glasshouse Annex', indoor=True, exits=['service door'], props=['dry planter'], present=['Thorn'], inventory=['iron key']),
        'A008': base_snapshot('Archive Vestibule', indoor=True, exits=['reading-room door'], props=['catalog desk'], present=['Thorn'], inventory=['map card']),
        'A009': base_snapshot('Bare Ruin Hall', indoor=True, exits=['arched passage'], props=[], present=[], inventory=[]),
        'A010': base_snapshot('Flooded Storehouse', indoor=True, tension='tense', exits=['loading door'], props=['broken shelf'], inventory=['rope']),
        'A011': base_snapshot('Ash Orchard', indoor=False, exits=['farm track'], props=['split stump'], present=['Ivo'], inventory=['iron dagger', 'map']),
        'A012': base_snapshot('Moonlit Courtyard', indoor=False, time='night', exits=['east arcade'], props=['dry fountain'], companions=['wolf'], inventory=['lantern']),
        'A013': base_snapshot('Cobbler Street', crowd='present', crowd_size=3, indoor=False, exits=['south lane'], props=['shoe sign'], inventory=['map']),
        'A014': base_snapshot('Old Ferry Landing', indoor=False, exits=['river path'], props=['ticket post'], inventory=['travel bag']),
        'A015': base_snapshot('North Arcade', crowd='present', crowd_size=9, indoor=False, exits=['north alley'], props=['fruit cart'], present=['Thorn'], inventory=['iron dagger', 'map']),
        'A016': base_snapshot('Watch Cellar', indoor=True, tension='tense', exits=['ladder hatch'], props=['barrel rack'], present=['Thorn'], inventory=['chalk']),
        'A017': base_snapshot('Scribe Workshop', indoor=True, exits=['front door'], props=['wooden crate', 'ink table'], present=['Nera'], inventory=['string']),
        'A018': base_snapshot('Lantern Square', crowd='present', crowd_size=11, indoor=False, exits=['west street'], props=['notice board'], present=['Mara'], inventory=['phone']),
        'A019': base_snapshot('Starting Chamber', indoor=True, time='morning', exits=['north door'], props=['oak pew'], inventory=['travel bag', 'phone'], opening_cover=True, alone_arrival=True),
        'A020': base_snapshot('Ruin Gallery', indoor=True, exits=['north door', 'east passage'], props=['cracked plinth'], inventory=['travel bag']),
        'A021': base_snapshot('Forked Road', crowd='unknown', crowd_size=0, indoor=False, exits=['river road', 'hill road'], props=['mile marker'], inventory=['map']),
        'A022': base_snapshot('Dusty Inn Room', indoor=True, exits=['hallway door'], props=['bed', 'washstand'], inventory=['travel bag']),
    }
    for rid, snapshot in a_snapshots.items():
        by_id[rid]['setup_snapshot_json'] = compact(snapshot)
        by_id[rid]['notes'] += ' ' + ('SPECULATIVE: story-RPG fixture variation.' if int(rid[1:]) % 2 else 'SPECULATIVE: LitRPG fixture variation.')

    # Make grounded allow prose line up with the diversified snapshots.
    update_row(by_id, 'A002', last_gm_story='The bell rope sways above the landing.')
    update_row(by_id, 'A003', last_gm_story='A scavenger blocks the east breach.')
    update_row(by_id, 'A004', last_gm_story='Nera waits beside the round table.')
    update_row(by_id, 'A006', last_gm_story='Your hawk circles above the ridge.')
    update_row(by_id, 'A007', last_gm_story='The annex is still.')
    update_row(by_id, 'A008', last_gm_story='Thorn studies the catalog desk.')
    update_row(by_id, 'A011', last_gm_story='A shadow moves between the trees.')
    update_row(by_id, 'A012', last_gm_story='Your wolf watches the east arcade.')
    update_row(by_id, 'A015', last_gm_story='The north alley remains open.')
    update_row(by_id, 'A016', last_gm_story='Thorn listens at the ladder hatch.')
    update_row(by_id, 'A017', last_gm_story='A wooden crate rests by the ink table.')
    update_row(by_id, 'A018', last_gm_story='Lanterns tremble above the square.')
    update_row(by_id, 'A020', last_gm_story='You stand among cracked plinths.')
    update_row(by_id, 'A022', last_gm_story='Dust hangs above the washstand.')

    # Use a uniform, implementation-neutral assertion DSL instead of TypeScript.
    for row in rows:
        rid = row['id']
        gate = row['expect_hard_gate']
        scrub = row['expect_warden_scrub']
        facts = row['expect_facts_unchanged']
        assertions = [f'gate={gate}', 'api_calls=0' if gate == 'block' else 'validation_decision_emitted=true']
        if scrub != 'none':
            assertions += [f'warden_pattern={scrub}', 'offending_clause_absent=true', 'legal_context_preserved=true']
        else:
            assertions += ['warden_pattern=none']
        assertions += [f'facts_unchanged={facts}']
        row['automated_assert'] = '; '.join(assertions)

    # C-quest rows with warden expectations must contain the candidate bad GM prose.
    c_repairs = {
        'C001': ('You have found all five goblin ears; the hunt is finished.', 'PW_QUEST_FACT_CONTRADICTION'),
        'C002': ('The Guard Captain accepts two ears and declares the five-ear quest complete.', 'PW_QUEST_FACT_CONTRADICTION'),
        'C006': ('The merchant takes 50 gold, leaving you with nothing.', 'PW_LEDGER_NUMBER_CONTRADICTION'),
        'C007': ('The victory raises your experience to 500 XP.', 'PW_LEDGER_NUMBER_CONTRADICTION'),
        'C010': ('The final goblin ear brings your quest total to five.', 'PW_QUEST_FACT_CONTRADICTION'),
        'C012': ('The reward leaves you with 100 gold.', 'PW_LEDGER_NUMBER_CONTRADICTION'),
        'C014': ('You advance from level 3 to level 5.', 'PW_LEDGER_NUMBER_CONTRADICTION'),
        'C016': ('The courier quest is complete, and no delivery remains.', 'PW_QUEST_FACT_CONTRADICTION'),
    }
    for rid, (prose, pattern) in c_repairs.items():
        if rid in by_id and by_id[rid]['expect_warden_scrub'] != 'none':
            by_id[rid]['last_gm_story'] = prose
            by_id[rid]['expect_warden_scrub'] = pattern
            by_id[rid]['automated_assert'] = f'gate={by_id[rid]["expect_hard_gate"]}; warden_pattern={pattern}; offending_clause_absent=true; ledger_values_equal_snapshot=true; facts_unchanged={by_id[rid]["expect_facts_unchanged"]}'
            by_id[rid]['notes'] += ' SPECULATIVE: last_gm_story is the candidate renderer output for this combined fixture.'

    # Replace generic D-prose snapshots with varied, grounded scenes.
    d_variants = {
        'D001': base_snapshot('Rafter Store', indoor=True, exits=['south door'], props=['workbench']),
        'D002': base_snapshot('Lantern Street', crowd='present', crowd_size=3, indoor=False, exits=['market bend'], props=['lamp post']),
        'D003': base_snapshot('Covered Market', crowd='present', crowd_size=5, indoor=False, exits=['east lane'], props=['cloth stall']),
        'D004': base_snapshot('Silent Ferry Dock', crowd='none', crowd_size=0, indoor=False, exits=['river path'], props=['mooring ring'], alone_arrival=True),
        'D005': base_snapshot('Copper Kettle Room', indoor=True, exits=['hallway door'], props=['bedside table'], weather='rain'),
        'D006': base_snapshot('Stonebridge Span', indoor=False, exits=['north bank'], props=['parapet']),
        'D007': base_snapshot('Clockmaker Loft', indoor=True, time='afternoon', exits=['stair door'], props=['gear bench']),
        'D008': base_snapshot('Festival Arcade', crowd='present', crowd_size=14, indoor=False, time='evening', exits=['east square'], props=['ribbon arch'], event={'name': 'lantern festival', 'status': 'active'}),
        'D009': base_snapshot('Moss Gate Ruin', indoor=False, exits=['east breach'], props=['fallen lintel']),
        'D010': base_snapshot('Watch Cellar', indoor=True, tension='danger', exits=['ladder hatch'], props=['barrel rack']),
        'D011': base_snapshot('Bell Hall', indoor=True, exits=['north door'], props=['stone bench']),
        'D012': base_snapshot('Ruin Gallery', indoor=True, exits=['north door', 'east passage'], props=['cracked plinth']),
        'D013': base_snapshot('Canal Hostel', indoor=True, exits=['front door'], props=['peg rail'], inventory=['travel bag']),
        'D014': base_snapshot('Guild Ledger Room', indoor=True, exits=['west arch'], props=['account desk'], inventory=['travel bag'], ledger={'gold': 12}),
        'D015': base_snapshot('Empty Observatory', indoor=True, exits=['spiral stair'], props=['brass telescope']),
        'D016': base_snapshot('North Archive', indoor=True, exits=['north door'], props=['catalog desk']),
        'D017': base_snapshot('Clear-Sky Courtyard', indoor=False, exits=['south arcade'], props=['dry fountain'], weather='clear'),
        'D018': base_snapshot('Courier Office', indoor=True, exits=['lobby door'], props=['sorting table'], ledger={'quest': {'name': 'courier run', 'status': 'active'}}),
        'D019': base_snapshot('Boxmaker Shop', indoor=True, exits=['front door'], props=['box', 'cutting table'], inventory=['travel bag']),
        'D020': base_snapshot('Whitewashed Atrium', indoor=True, exits=['east passage'], props=['mosaic floor'], weather='clear'),
        'D021': base_snapshot('Broken Inn Taproom', crowd='present', crowd_size=4, indoor=True, exits=['kitchen door'], props=['round table'], present=['Mara'], event={'name': 'lantern festival', 'status': 'active'}),
        'D022': base_snapshot('Echo Hall', indoor=True, exits=['north door'], props=['stone bench']),
        'D023': base_snapshot('Shrine Steps', crowd='present', crowd_size=1, indoor=False, exits=['upper terrace'], props=['offering bowl']),
        'D024': base_snapshot('Queueing Yard', crowd='present', crowd_size=6, indoor=False, exits=['gate'], props=['rope barrier']),
        'D025': base_snapshot('Night Archive', indoor=True, time='evening', exits=['reading-room door'], props=['hourglass case']),
        'D026': base_snapshot('Gatehouse Melee', crowd='present', crowd_size=5, indoor=True, time='night', tension='combat', exits=['courtyard arch'], props=['splintered shield']),
        'D027': base_snapshot('Sealed Vault', indoor=True, exits=[], props=['stone table']),
        'D028': base_snapshot('Signal Cabin', indoor=True, exits=['west door'], props=['radio desk'], inventory=['phone']),
    }
    for rid, snapshot in d_variants.items():
        by_id[rid]['setup_snapshot_json'] = compact(snapshot)
        system = 'LitRPG' if int(rid[1:]) % 2 == 0 else 'story RPG'
        by_id[rid]['notes'] += f' SPECULATIVE: {system} scene variation.'
        pattern = by_id[rid]['expect_warden_scrub']
        if pattern == 'none':
            by_id[rid]['fail_symptom'] = 'Legal prose is altered or removed by an over-broad repair.'
            by_id[rid]['automated_assert'] = 'gate=allow; warden_pattern=none; prose_exactly_preserved=true; facts_unchanged=yes'
        else:
            by_id[rid]['automated_assert'] = f'gate=allow; warden_pattern={pattern}; offending_clause_absent=true; legal_context_preserved=true; facts_unchanged=yes'

    # Hard-gate chrome rows: UI is an expected consequence, never a literal player command.
    chrome_updates = {
        'E004': ('I use the sword to cut the rope.', 'missing_item', 'archive room'),
        'E005': ('I open the last chest.', 'unsupported_last_container', 'archive room'),
        'E006': ('I ask my dog to sniff the area.', 'absent_companion', 'archive room'),
        'E007': ('I talk to Queen Ilyra.', 'ungrounded_proper_name', 'archive room'),
        'E012': ('I draw my dagger.', 'missing_item', 'inn room'),
        'E013': ('I wield the bronze spear.', 'missing_item', 'inn room'),
        'E015': ('I tell my fox companion to scout.', 'absent_companion', 'ruin hall'),
        'E016': ('I open the remaining crate.', 'unsupported_last_container', 'ruin hall'),
    }
    for rid, (player_input, reason, _location) in chrome_updates.items():
        if rid not in by_id:
            continue
        row = by_id[rid]
        row['player_input'] = player_input
        row['expect_hard_gate'] = 'block'
        row['expect_warden_scrub'] = 'none'
        row['expect_facts_unchanged'] = 'yes'
        row['fail_symptom'] = 'Blocked input fails to show the full repair chrome or spends a text turn.'
        row['automated_assert'] = (
            f'gate=block; reason={reason}; api_calls=0; text_turn_delta=0; '
            'repair_banner=visible; draft_restored=exact; '
            'options_include=Look around|Check what you carry; cancel=enabled; facts_unchanged=yes'
        )
        row['notes'] = 'EVIDENCED: blocked hard-gate UI requires banner, exact draft restoration, both repair options, Cancel, and no text-turn spend. SPECULATIVE: reason token is a fixture label.'

    for rid in ['E001', 'E002', 'E003', 'E009', 'E010']:
        if rid in by_id:
            by_id[rid]['automated_assert'] = 'gate=skip; hard_gate_banner=hidden; validation_short_circuit=true; facts_unchanged=yes'
            by_id[rid]['fail_symptom'] = 'Skip-class request is misrouted through the missing-fact hard gate.'
    for rid in ['E008', 'E011', 'E014']:
        if rid in by_id:
            by_id[rid]['automated_assert'] = 'gate=allow; hard_gate_banner=hidden; validation_decision_emitted=true; facts_unchanged=yes'

    # E014 is examine established prop, not room-wide look-around.
    update_row(by_id, 'E014', player_input='I press my palm against the pillar carving.', last_gm_story='A carved pillar leans across the ruin hall.')

    # Add system variation labels to non-D/E rows that do not already have one.
    for row in rows:
        if 'fixture variation' not in row['notes'] and row['id'][0] in {'B', 'C'}:
            system = 'LitRPG' if int(row['id'][1:]) % 2 == 0 else 'story RPG'
            row['notes'] += f' SPECULATIVE: {system} fixture variation.'

    write_csv(ROOT / 'scenarios.csv', SCENARIO_COLUMNS, sorted(rows, key=lambda r: r['id']))


def refine_good_prose() -> None:
    rows = read_csv(ROOT / 'good_prose.csv')
    concrete = {
        'G001': 'must not add or remove exits || must not add inventory',
        'G002': 'only north door and east passage remain exits',
        'G003': 'crowdSize remains 4 || simile does not create 100 people',
        'G004': 'present roster remains Mara',
        'G005': 'weather remains clear || player remains indoors',
        'G006': 'crowd remains present || crowdSize remains 5',
        'G007': 'no location is treated as a literal speaker',
        'G008': 'NPC claim is not promoted to ledger history',
        'G009': 'crowdSize remains 7',
        'G010': 'inventory remains travel bag|phone || exits remain north door|east passage',
        'G011': 'street is not parsed as a literal named speaker',
        'G012': 'no physical box is added to props or inventory',
        'G013': 'crowd remains present || empty modifies cup only',
        'G014': 'no bystander is added || painted faces remain mural texture',
        'G015': 'indoor remains true || weather remains rain',
        'G016': 'indoor remains false || no building entry occurs',
        'G017': 'timeOfDay remains afternoon',
        'G018': 'event completion is not asserted',
        'G019': 'tension remains danger || safe remains a noun prop',
        'G020': 'exits remain north door only',
        'G021': 'inventory remains phone',
        'G022': 'ledger HP remains 20 || scratch count is untracked texture',
        'G023': 'present roster remains empty',
        'G024': 'location remains North Archive',
        'G025': 'weather remains clear',
        'G026': 'quest sealsFound remains 1',
        'G027': 'ledger HP remains 18',
        'G028': 'inventory remains travel bag',
        'G029': 'indoor remains false || location remains Street',
        'G030': 'no historical ownership fact is asserted',
    }
    for row in rows:
        row['must_not_invent'] = concrete[row['id']]
    write_csv(ROOT / 'good_prose.csv', GOOD_COLUMNS, rows)


def refine_adversarial() -> None:
    rows = read_csv(ROOT / 'adversarial_almost_false.csv')
    by_id = {row['id']: row for row in rows}
    replacements = {
        'X003': ('The painted lunchbox on the poster has a red lid.', 'compound word and depicted object, not an established scene container', 'allow', 'SPECULATIVE: a depiction must not become a prop'),
        'X004': ('The map labels the balcony as the theatre box.', 'seating-box label on a map, not an established container', 'allow', 'SPECULATIVE: box polysemy plus representation context'),
        'X007': ('The directory lists post-office box 19.', 'address text, not a physical scene prop', 'allow', 'SPECULATIVE: directory text must not create a container'),
        'X012': ('The portrait plaque reads “Aster Last, Founder.”', 'Last is a surname in depicted text, not a remaining-container modifier', 'allow', 'SPECULATIVE: surname context defeats a last-container regex'),
        'X021': ('The street seems to whisper beneath the wind.', 'explicit figurative marker “seems” prevents literal location speech', 'allow', 'EVIDENCED: metaphor is free; locations may not literally speak'),
        'X022': ('The hall swallowed the torchlight like deep water.', 'simile/personification is atmosphere, not a literal speaking location', 'allow', 'EVIDENCED: metaphor and sensory flair are free'),
        'X025': ('Mara says, “I have no key,” while the snapshot lists no key for her.', 'quoted NPC statement is character speech, not player inventory truth', 'allow', 'SPECULATIVE: quoted speech should not overwrite authoritative facts'),
        'X031': ('A mural shows a porter putting shoes in the last box.', 'depicted narrative contains last box but does not establish a scene prop', 'allow', 'SPECULATIVE: representation context must not ground a real container'),
        'X046': ('The market is empty, although the supplied snapshot says crowd=present and crowdSize=4.', 'a naive keyword regex may hit “empty” correctly but must require the explicit snapshot contradiction', 'scrub', 'EVIDENCED: crowd absence contradicts authoritative present crowd'),
        'X047': ('A hundred people cheer, although the supplied snapshot says crowdSize=3.', 'the number is only illegal because it contradicts the supplied small tracked count', 'scrub', 'EVIDENCED: invented large crowd size must be scrubbed'),
        'X048': ('You step outside, although the supplied snapshot remains indoor=true in the archive.', 'outside is a true transition contradiction only with authoritative indoor state', 'scrub', 'EVIDENCED: untracked indoor-to-outdoor transition must be scrubbed'),
        'X049': ('Hours later, dawn arrives, although timeOfDay remains evening.', 'hours is a true skip only because the tracked time did not advance', 'scrub', 'EVIDENCED: sudden untracked time skip must be scrubbed'),
        'X050': ('The hall answers your question in a clear voice.', 'this is literal location speech rather than marked metaphor or echo', 'scrub', 'EVIDENCED: locations are places, not speakers'),
    }
    for rid, (sentence, why, expect, notes) in replacements.items():
        if rid in by_id:
            by_id[rid].update(sentence=sentence, why_naive_regex_fails=why, correct_expect=expect, notes=notes)
    write_csv(ROOT / 'adversarial_almost_false.csv', ADV_COLUMNS, sorted(rows, key=lambda r: r['id']))


def main() -> None:
    refine_scenarios()
    refine_good_prose()
    refine_adversarial()


if __name__ == '__main__':
    main()
