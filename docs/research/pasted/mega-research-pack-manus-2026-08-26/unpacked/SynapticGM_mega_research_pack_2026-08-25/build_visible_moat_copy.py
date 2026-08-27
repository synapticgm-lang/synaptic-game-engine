#!/usr/bin/env python3
import csv
from pathlib import Path

root = Path(__file__).resolve().parent
out = root / 'visible_moat_copy.csv'
rows = []

def add(group, subtype, variant, kid_mode, text, allowed='YES', notes=''):
    rows.append({
        'group': group,
        'subtype': subtype,
        'variant': variant,
        'kid_mode': kid_mode,
        'allowed': allowed,
        'text': text,
        'word_count': len(text.replace('—',' ').split()),
        'notes': notes,
    })

changed = [
    'Found the brass key', 'Used the north stair', 'Rain began outside',
    'Lantern light faded', 'Mara joined you', 'Left the market hall',
    'Time moved to dusk', 'Last vial was spent', 'Tension eased, not ended',
    'Rumor noted, not accepted', 'Quest accepted', 'Offer remains open',
    'Door is now unlocked', 'Companion stepped away', 'Map route revealed',
    'Relic bond deepened', 'Codex skill learned', 'Skill offer declined',
    'Skill offer accepted', 'Returned to the courtyard', 'Weather cleared',
    'Moved indoors', 'Moved outside', 'Speaker entered the scene',
    'Inventory count corrected', 'Scene restored', 'Unsupported title removed',
    'Exit choice confirmed', 'Nearby crowd thinned', 'Your hands are empty',
]
for i, text in enumerate(changed, 1):
    add('status_chip', 'changed', f'{i:02d}', 'BOTH', text, notes='Display after a confirmed change; eight words maximum.')

why_lines = [
    'We checked whether that item was actually with you.',
    'We checked who was present before the reply.',
    'We checked which exit your last action used.',
    'We checked whether time had really moved forward.',
    'We checked the active weather before changing it.',
    'We checked whether you were inside or outside.',
    'We checked whether the danger had truly eased.',
    'We checked that your companion was still nearby.',
    'We checked who could reasonably speak here.',
    'We checked whether that title had been established.',
    'We checked the quantity before calling it the last one.',
    'We checked the crowd before giving it a number.',
    'We checked your carried gear before describing your hands.',
    'We checked the route before moving the scene.',
    'We checked the accepted task before calling it a quest.',
    'We checked whether the offer was accepted or still open.',
    'We checked the speaker’s location before continuing.',
    'We checked what changed and left the rest alone.',
    'We checked your last confirmed choice before restoring.',
    'We checked the scene facts, then kept the flourish.',
]
for i, text in enumerate(why_lines, 1):
    add('why_line', 'fair_check', f'{i:02d}', 'BOTH', text, notes='Shown only when the player opens Why? after a check.')

repair = {
    'invented_item': [
        'That item was never in your pack, so we removed it.',
        'Your hands are restored to what you actually carried.',
        'The scene added an item you did not have. It is gone.',
        'We rolled back the unearned item and kept the rest.',
        'We removed the extra item without changing your choice.',
    ],
    'absent_companion': [
        'That companion was not here, so we restored the scene.',
        'We removed the absent companion and kept your action.',
        'The scene brought someone in without cause. That is fixed.',
        'Your companion stays where the story last left them.',
        'We restored the scene without the person who was away.',
    ],
    'ungrounded_talk': [
        'Nobody present could have said that, so we repaired the exchange.',
        'We removed the unsupported reply and kept the surrounding scene.',
        'The scene gave a voice to the wrong source. It is fixed.',
        'Only present speakers may answer here; the exchange is restored.',
        'We repaired the line without changing what you chose to do.',
    ],
    'cancel_restore': [
        'Cancelled. You are back before that action.',
        'Action cancelled. The prior scene is restored.',
        'Nothing from the cancelled action was kept.',
        'Cancelled cleanly. Your earlier position and items are restored.',
        'You stepped back from that action; the scene is unchanged.',
    ],
}
kid_rewrites = {
    'invented_item': [
        'That item was not in your bag, so we tidied the scene.',
        'Your hands now match what you were really carrying.',
        'An extra item slipped into the story. We removed it.',
        'We put the surprise item away and kept your choice.',
        'The added item is gone; everything else stays the same.',
    ],
    'absent_companion': [
        'That friend was elsewhere, so we put the scene right.',
        'We kept your action and removed the person who was away.',
        'Someone arrived too soon in the story. We fixed it.',
        'Your friend stays where the story last left them.',
        'The scene is restored without the person who was away.',
    ],
    'ungrounded_talk': [
        'That reply had no speaker here, so we fixed the scene.',
        'We removed the stray reply and kept the rest.',
        'The wrong thing seemed to speak. The scene is fixed.',
        'Only someone present can answer here; we restored the exchange.',
        'We repaired the line and kept your choice exactly as made.',
    ],
    'cancel_restore': [
        'Cancelled. You are safely back before that action.',
        'Action cancelled. The earlier scene is back.',
        'Nothing from the cancelled action was kept.',
        'Cancelled cleanly. Your place and items are restored.',
        'You chose not to do that; the scene stays the same.',
    ],
}
for subtype, texts in repair.items():
    for i, text in enumerate(texts, 1):
        add('repair_banner', subtype, f'standard_{i:02d}', 'STANDARD', text, notes='Standard repair wording; no implementation jargon.')
    for i, text in enumerate(kid_rewrites[subtype], 1):
        add('repair_banner', subtype, f'kid_{i:02d}', 'KID', text, notes='Softened Kid Mode wording; no blame or frightening detail.')

corrections = [
    'Corrected. Your scene now matches what happened.',
    'Fixed. Your items and position are restored.',
    'Corrected without changing your chosen action.',
    'The unsupported detail is gone; the scene continues.',
    'Restored. Everyone is where the story left them.',
    'Corrected. The right speaker now holds the line.',
    'Restored to the moment before the mismatch.',
    'The scene is grounded again. Continue when ready.',
    'Correction complete. Your accepted tasks are unchanged.',
    'Fixed. Only the mistaken detail was removed.',
]
for i, text in enumerate(corrections, 1):
    add('correction_confirmation', 'confirmed', f'{i:02d}', 'BOTH', text, notes='Short confirmation after a repair succeeds.')

quest = {
    'accepted': [
        'Accepted: you agreed to carry the sealed parcel.',
        'Accepted: you promised to inspect the flooded cellar.',
        'Accepted: you took the watch at the east gate.',
        'Accepted: you agreed to find the missing survey kit.',
    ],
    'rumor': [
        'Rumor: lights were seen beneath the old reservoir.',
        'Rumor: someone heard bells beyond the sealed arch.',
        'Rumor: a locked room may still contain supplies.',
        'Rumor: the night ferry sometimes returns empty.',
    ],
    'soft_offer': [
        'Open offer: the archivist could use a careful courier.',
        'Open offer: the workshop needs one safe power cell.',
        'Open offer: a guide may trade directions for help.',
        'Open offer: the watch captain is still seeking volunteers.',
    ],
}
for subtype, texts in quest.items():
    for i, text in enumerate(texts, 1):
        add('quest_provenance', subtype, f'{i:02d}', 'BOTH', text, notes='States provenance without upgrading rumor or offer into acceptance.')

never_lines = [
    ('as_an_ai', 'As an AI, I cannot continue that story.'),
    ('chatbot_apology', 'I am sorry, but I made a mistake in my previous response.'),
    ('menu_speak', 'Select option 1 to proceed to the next scenario.'),
    ('developer_speak', 'The system prompt prevents me from doing that.'),
    ('state_jargon', 'Your state transaction failed validation and was rolled back.'),
    ('retrieval_jargon', 'The retrieval context did not contain that companion.'),
    ('model_jargon', 'The language model hallucinated an item.'),
    ('fake_certainty', 'Do not worry; I remember everything forever.'),
]
for i, (subtype, text) in enumerate(never_lines, 1):
    add('never_line', subtype, f'{i:02d}', 'BOTH', text, allowed='NO', notes='Forbidden player-facing phrasing; preserve only as a negative test fixture.')

# Validation
assert len(changed) == 30
assert all(len(t.replace('—',' ').split()) <= 8 for t in changed)
assert len(why_lines) == 20
assert sum(len(v) for v in repair.values()) == 20
assert sum(len(v) for v in kid_rewrites.values()) == 20
assert len(corrections) == 10
assert sum(len(v) for v in quest.values()) == 12
assert len(never_lines) == 8
assert len(rows) == 120, len(rows)

with out.open('w', newline='', encoding='utf-8') as f:
    fields = ['group','subtype','variant','kid_mode','allowed','text','word_count','notes']
    w = csv.DictWriter(f, fieldnames=fields)
    w.writeheader()
    w.writerows(rows)
print(out)
