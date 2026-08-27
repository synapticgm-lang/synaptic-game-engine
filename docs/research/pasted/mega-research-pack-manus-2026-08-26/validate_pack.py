#!/usr/bin/env python3
import csv
import re
import sys
from collections import Counter, defaultdict
from decimal import Decimal
from pathlib import Path

root = Path('/home/ubuntu/SynapticGM_mega_research_pack_2026-08-25')
passes = []
failures = []


def check(condition, label, detail=''):
    if condition:
        passes.append((label, detail))
    else:
        failures.append((label, detail))


def read_csv(name):
    path = root / name
    check(path.exists(), f'file exists: {name}')
    if not path.exists():
        return []
    try:
        with path.open(newline='', encoding='utf-8') as f:
            rows = list(csv.DictReader(f))
        check(bool(rows), f'CSV has rows: {name}', f'{len(rows)} rows')
        return rows
    except Exception as exc:
        failures.append((f'CSV parses: {name}', repr(exc)))
        return []


required_files = [
    'README.md','research_manifest.md','asset_index.csv','intake_checklist.md','DO_NOT_USE.md',
    'share_alike_counsel_risk.csv','theme_prompts.csv','item_icon_prompts.csv',
    'memorable_plate_style_guide.md','map_chrome_prompts.md','claim_pattern_bank.csv',
    'adversarial_almost_false.csv','visible_moat_copy.csv','player_facing_cap_copy.csv',
    'opener_pointer_examples.md','skill_growth_patterns.md','free_cost_envelope.csv',
    'cost_methodology.md','cost_levers.csv','p0_trust_list.md','counsel_outline.md',
    'public_claim_register.csv','screenshot_audit_playbook.md','audit_tracker.csv',
    'model_price_reference.csv','hook_plus_8_sensitivity.csv'
]
for name in required_files:
    check((root / name).is_file(), f'required deliverable exists: {name}')

# Asset licensing gate.
assets = read_csv('asset_index.csv')
check(len(assets) == 31, 'asset index row count', f'expected 31, got {len(assets)}')
for i, row in enumerate(assets, 2):
    check(row.get('commercial_use') == 'YES', f'asset commercial use YES row {i}', row.get('asset_name',''))
    check(row.get('share_alike') == 'NO', f'asset share-alike NO row {i}', row.get('asset_name',''))
    check(bool(row.get('page_url','').startswith('http')), f'asset source page URL row {i}', row.get('asset_name',''))
    check(bool(row.get('direct_file_url','').startswith('http')), f'asset direct URL row {i}', row.get('asset_name',''))
    check(bool(row.get('license_spdx_or_name')), f'asset licence named row {i}', row.get('asset_name',''))
    check(bool(row.get('retrieved_date')), f'asset retrieval date row {i}', row.get('asset_name',''))
    if row.get('license_spdx_or_name') == 'MIT':
        check(row.get('attribution_required') == 'YES', f'MIT attribution required row {i}', row.get('asset_name',''))
        check(bool(row.get('attribution_text')), f'MIT attribution text present row {i}', row.get('asset_name',''))

risk = read_csv('share_alike_counsel_risk.csv')
check(len(risk) >= 1, 'share-alike risk register populated', f'{len(risk)} rows')

# Visual prompt counts and coverage.
themes = read_csv('theme_prompts.csv')
check(len(themes) == 66, 'theme prompt row count', f'expected 66, got {len(themes)}')
by_theme = defaultdict(list)
for row in themes:
    by_theme[row.get('kit_key','')].append(row)
check(len(by_theme) == 22, 'theme prompt theme count', f'expected 22, got {len(by_theme)}')
for key, rows in by_theme.items():
    check(len(rows) == 3, f'theme {key} has three assets', str([r.get('asset_role') for r in rows]))
    check({r.get('asset_role') for r in rows} == {'panel_tile','frame_ornament','atmosphere_bg'}, f'theme {key} asset roles exact')
    check(all(r.get('kid_ok') == 'YES' for r in rows), f'theme {key} kid_ok YES')

icons = read_csv('item_icon_prompts.csv')
check(len(icons) == 40, 'icon prompt row count', f'expected 40, got {len(icons)}')
check(Counter(r.get('category') for r in icons) == Counter({'fantasy':16,'sci-fi':12,'urban':12}), 'icon category counts', str(Counter(r.get('category') for r in icons)))
check(len({r.get('item_key') for r in icons}) == 40, 'icon keys unique')
for row in icons:
    prompt = row.get('prompt_text','').lower()
    check('128' in prompt, f"icon {row.get('item_key')} specifies 128")
    check('transparent' in prompt, f"icon {row.get('item_key')} specifies transparency")
    check(row.get('kid_ok') == 'YES', f"icon {row.get('item_key')} kid_ok YES")

plate_text = (root/'memorable_plate_style_guide.md').read_text(encoding='utf-8')
check(len(re.findall(r'^### Template \d{2}', plate_text, flags=re.M)) == 20, 'memorable plate template count')
map_text = (root/'map_chrome_prompts.md').read_text(encoding='utf-8')
check(len(re.findall(r'^### [PTCD]\d{2}', map_text, flags=re.M)) == 24, 'map chrome prompt count')

# Forbidden terminology in live/GM-ready/generation materials.
forbidden = [
    'Solo Leveling','Shield Hero','The Wandering Inn','My Vampire System','Sword Art Online',
    'Dungeon Crawler Carl','Omniscient Reader','Tower of God','Dungeons & Dragons','WotC',
    'Marvel','DC Comics','Disney','Ghibli','Fable','Albion',
    'Ash Compact','Tide Covenant','Hearthborn','Lanternfolk','Saltkin','Stonevein',
    'Reedfen','Lampwood','Brinewatch','Granite Stair'
]
scan_files = [
    'theme_prompts.csv','item_icon_prompts.csv','memorable_plate_style_guide.md',
    'map_chrome_prompts.md','claim_pattern_bank.csv','adversarial_almost_false.csv',
    'visible_moat_copy.csv','player_facing_cap_copy.csv','opener_pointer_examples.md',
    'skill_growth_patterns.md'
]
for name in scan_files:
    text = (root/name).read_text(encoding='utf-8')
    hits = [term for term in forbidden if re.search(re.escape(term), text, flags=re.I)]
    check(not hits, f'forbidden licensed/retired terms absent: {name}', ', '.join(hits))

visual_files = ['theme_prompts.csv','item_icon_prompts.csv','memorable_plate_style_guide.md','map_chrome_prompts.md']
for name in visual_files:
    text = (root/name).read_text(encoding='utf-8')
    check(not re.search(r'\bin the style of\b', text, flags=re.I), f'no named-style request phrase: {name}')

# Claim and copy banks.
claims = read_csv('claim_pattern_bank.csv')
expected_claims = {
    'object_in_hand','last_remaining_item','crowd_size','named_speaker_absent','exit_used',
    'time_skip','weather_change','indoor_outdoor_shift','tension_drop','companion_present',
    'location_as_speaker','invented_title_or_rank'
}
check(len(claims) == 12, 'claim-pattern row count')
check({r.get('claim_type') for r in claims} == expected_claims, 'claim-pattern types exact')
adv = read_csv('adversarial_almost_false.csv')
check(len(adv) == 40, 'adversarial near-miss row count')
check(len({r.get('test_id') for r in adv}) == 40, 'adversarial IDs unique')

copy = read_csv('visible_moat_copy.csv')
check(len(copy) == 120, 'visible moat copy row count')
expected_groups = Counter({'status_chip':30,'why_line':20,'repair_banner':40,'correction_confirmation':10,'quest_provenance':12,'never_line':8})
check(Counter(r.get('group') for r in copy) == expected_groups, 'visible copy group counts', str(Counter(r.get('group') for r in copy)))
for row in copy:
    if row.get('group') == 'status_chip':
        actual = len(row.get('text','').replace('—',' ').split())
        check(actual <= 8, f"status chip <=8 words: {row.get('variant')}", str(actual))
    if row.get('group') == 'never_line':
        check(row.get('allowed') == 'NO', f"never-line blocked: {row.get('subtype')}")
    else:
        check(row.get('allowed') == 'YES', f"production copy allowed YES: {row.get('group')}/{row.get('subtype')}/{row.get('variant')}")

cap_copy = read_csv('player_facing_cap_copy.csv')
check(len(cap_copy) == 33, 'cap copy row count')
for row in cap_copy:
    if row.get('context') == 'optional_ad_overflow':
        check(row.get('kid_mode') == 'STANDARD_ONLY', f"ad copy excluded from Kid Mode: {row.get('variant')}")

openers = (root/'opener_pointer_examples.md').read_text(encoding='utf-8')
check(len(re.findall(r'^### ', openers, flags=re.M)) == 72, 'opener example count')
for family in ['Isekai','Late','System','Tower','Academy','Dungeon','Void','PYOA','Haunted']:
    check(family.lower() in openers.lower(), f'opener family present: {family}')

skills = (root/'skill_growth_patterns.md').read_text(encoding='utf-8')
check(skills.count('### Ten Original Skill Names') == 3, 'three skill-name tables')
skill_names = [
    'Quiet Iron Pulse','Stormglass Ward','Copper Echo','Rootbound Step','Hollow Bell Reach','Cinderhold',
    'Moon-Thread Draw','Oath of the Bent Key','Thirteen-Nail Shelter','Riverstone Return',
    'Margin Step','Inkless Recall','Stairwell Listening','Thread Counter','Palms of Patient Heat',
    'Borrowed Angle','Cloudglass Method','Stoneweight Measure','Breath Between Lines','Quiet Diagram',
    'Brace Before Break','Rainpath Balance','Quiet Witness','Last Spark Recovery','Crowdline Read',
    'Door-Between Instinct','Patient Hand','Shared Load','Echo Pause','Second Knot'
]
check(sum(1 for name in skill_names if f'| {name} |' in skills) == 30, '30 original skill names present')

# Cost model.
cost = read_csv('free_cost_envelope.csv')
check(len(cost) == 27, 'free cost envelope row count')
check({r.get('token_scenario') for r in cost} == {'lean_context','planning_base','long_context'}, 'cost token scenarios exact')
check({int(r.get('free_mau','0')) for r in cost} == {100,1000,10000}, 'cost MAU set exact')
check({int(r.get('player_turns_per_mau','0')) for r in cost} == {20,40,80}, 'cost turns set exact')
for row in cost:
    try:
        prorata = Decimal(row['total_usd_prorata_fee_ex_tax'])
        one = Decimal(row['total_usd_one_purchase_ex_tax'])
        gbp = Decimal(row['total_gbp_one_purchase_ex_tax'])
        check(prorata >= 0 and one >= prorata and gbp >= 0, f"cost arithmetic nonnegative/minimum fee: {row['token_scenario']}/{row['free_mau']}/{row['player_turns_per_mau']}")
    except Exception as exc:
        failures.append(('cost arithmetic parses', repr(exc)))
prices = read_csv('model_price_reference.csv')
check(len(prices) == 3, 'model price reference row count')
check({r.get('model_id') for r in prices} == {
    'deepseek/deepseek-v4-flash-0731','anthropic/claude-haiku-4.5','anthropic/claude-sonnet-4.6'
}, 'model IDs exact')
hook = read_csv('hook_plus_8_sensitivity.csv')
check(len(hook) == 3, 'hook +8 sensitivity row count')
levers = read_csv('cost_levers.csv')
check(len(levers) >= 10, 'cost levers sufficiently ranked', f'{len(levers)} rows')

# Counsel and public claims.
public_claims = read_csv('public_claim_register.csv')
check(len(public_claims) == 35, 'public claim register row count')
remember_rows = [r for r in public_claims if r.get('exact_claim') == 'Remembers everything.']
check(len(remember_rows) == 1, 'remembers everything claim appears once')
check(bool(remember_rows) and remember_rows[0].get('status') == 'NO', 'remembers everything marked NO')
counsel = (root/'counsel_outline.md').read_text(encoding='utf-8')
check('Lawful basis placeholder' in counsel and 'Retention placeholder' in counsel, 'counsel data table contains required placeholders')
check('## References' in counsel, 'counsel references section present')
method = (root/'cost_methodology.md').read_text(encoding='utf-8')
check('## References' in method, 'cost methodology references section present')
readme = (root/'README.md').read_text(encoding='utf-8')
check('## References' in readme, 'README references section present')

# Screenshot audit honesty and coverage.
audit = read_csv('audit_tracker.csv')
check(len(audit) == 72, 'audit tracker row count')
check(Counter((r.get('viewport'),r.get('width'),r.get('height')) for r in audit) == Counter({('desktop','1440','900'):36,('mobile','390','844'):36}), 'audit viewport coverage exact')
check(all(r.get('status') == 'NOT RUN' for r in audit), 'audit tracker does not fabricate completed screenshots')
check(all(r.get('expected_filename','').endswith('.png') for r in audit), 'audit filenames are PNG')
by_base = defaultdict(set)
for row in audit:
    by_base[row.get('audit_id','').split('-')[0]].add(row.get('viewport'))
check(len(by_base) == 36 and all(v == {'desktop','mobile'} for v in by_base.values()), 'each audit case has desktop and mobile pair')
playbook = (root/'screenshot_audit_playbook.md').read_text(encoding='utf-8')
check('NOT RUN' in playbook and 'No live URL' in playbook, 'screenshot playbook discloses no live audit run')

# Write report.
report = [
    '# Validation Report',
    '',
    '**Generated by:** `validate_pack.py`  ',
    '**Scope:** Required deliverables, CSV integrity, target counts, forbidden terms in live/generation material, cost arithmetic, claim controls, and screenshot-audit honesty.',
    '',
    f'**Result:** {"PASS" if not failures else "FAIL"}  ',
    f'**Checks passed:** {len(passes)}  ',
    f'**Checks failed:** {len(failures)}',
    '',
    '## Failures',
    ''
]
if failures:
    report.extend([f'| Check | Detail |', '| --- | --- |'])
    for label, detail in failures:
        report.append(f'| {label.replace("|","/")} | {str(detail).replace("|","/")} |')
else:
    report.append('No validation failures were detected.')
report.extend(['', '## Coverage Summary', '', '| Area | Validated |', '| --- | --- |',
               '| Packaging | Required files exist. |',
               '| Licensing | Default asset index is commercial-use `YES`, share-alike `NO`, with source/direct URLs and licence fields. |',
               '| Visual prompts | Required theme/icon/template counts and banned-term/style-request scans. |',
               '| Building fuel | Claim, adversarial, copy, opener, and skill counts. |',
               '| Cost | Scenario matrix, exact model IDs, nonnegative arithmetic, and separate hook sensitivity. |',
               '| Counsel | Required placeholders, claim register, and prohibited absolute claim. |',
               '| Audit | Dual viewport pairs, filenames, and all master statuses remain `NOT RUN`. |',
               '',
               '## Interpretation', '',
               'A PASS confirms internal package consistency; it does not constitute legal approval, asset-title clearance, provider-contract approval, production telemetry, application QA, or completed screenshot evidence. Those remain subject to the explicit counsel, intake, telemetry, and audit workflows in the pack.', ''])
(root/'qa_report.md').write_text('\n'.join(report), encoding='utf-8')

print(f'passes={len(passes)} failures={len(failures)} report={root / "qa_report.md"}')
if failures:
    for label, detail in failures:
        print(f'FAIL: {label} :: {detail}')
    sys.exit(1)
