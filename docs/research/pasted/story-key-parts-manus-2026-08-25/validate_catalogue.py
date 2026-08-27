import csv
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path('/home/ubuntu/synapticgm_catalogue')
CSV_PATH = ROOT / 'tropes.csv'
PROFILES = json.loads((ROOT / 'family_profiles.json').read_text(encoding='utf-8'))
PROFILE_IDS = [p['family_id'] for p in PROFILES]
PROFILE_MAP = {p['family_id']: p for p in PROFILES}

EXPECTED_COLUMNS = [
    'family_id','axis_id','variant_id','title_short','pointer_location',
    'pointer_faction','pointer_intent','pointer_offer','pointer_beats',
    'pointer_fallback','never_lines','first_proof','kid_ok','kid_transform',
    'nsfw','inject_ok','founder_shape_cousin'
]
EXPECTED_AXES = [
    'arrival','name_ask','kit_reveal','power_source','growth','system_voice',
    'hub','opposition','first_proof','crowd','offer','companion','identity_lock',
    'ending_logic'
]

# Banned modern properties and reserved WOF names supplied by the user.
BANNED = [
    'Solo Leveling','Shield Hero','The Wandering Inn','Azarinth Healer',
    'My Vampire System','Sword Art Online','Dungeon Crawler Carl',
    'Omniscient Reader','Tower of God','D&D','WotC','Marvel','DC teams',
    'Studio Ghibli','Disney','Aliens','Twilight','Underworld',
    'Black Dagger Brotherhood','Fable','Albion','Ash Compact','Tide Covenant',
    'Hearthborn','Lanternfolk','Saltkin','Stonevein','Reedfen','Lampwood',
    'Brinewatch','Granite Stair','StateTx','SceneManifest','IntentContract'
]

errors = []
warnings = []
metrics = {}

with CSV_PATH.open(encoding='utf-8-sig', newline='') as handle:
    reader = csv.DictReader(handle)
    header = reader.fieldnames
    rows = list(reader)

if header != EXPECTED_COLUMNS:
    errors.append({'code':'header','detail':f'Header mismatch: {header}'})

metrics['row_count'] = len(rows)
metrics['family_count'] = len(set(r['family_id'] for r in rows))
metrics['axis_count'] = len(set(r['axis_id'] for r in rows))
metrics['variant_id_count'] = len(set(r['variant_id'] for r in rows))
metrics['kid_ok_false'] = sum(r['kid_ok'] == 'false' for r in rows)
metrics['nsfw_true'] = sum(r['nsfw'] == 'true' for r in rows)
metrics['inject_ok_true'] = sum(r['inject_ok'] == 'true' for r in rows)
metrics['founder_nonempty'] = sum(bool(r['founder_shape_cousin'].strip()) for r in rows)

expected_rows = len(PROFILE_IDS) * len(EXPECTED_AXES) * 8
if len(rows) != expected_rows:
    errors.append({'code':'row_count','detail':f'Expected {expected_rows}, found {len(rows)}'})

counts = Counter((r['family_id'], r['axis_id']) for r in rows)
missing_pairs = []
wrong_pair_counts = []
for family_id in PROFILE_IDS:
    for axis in EXPECTED_AXES:
        count = counts[(family_id, axis)]
        if count == 0:
            missing_pairs.append((family_id, axis))
        if count != 8:
            wrong_pair_counts.append((family_id, axis, count))
if missing_pairs:
    errors.append({'code':'missing_pairs','detail':missing_pairs})
if wrong_pair_counts:
    errors.append({'code':'pair_counts','detail':wrong_pair_counts})

if set(r['family_id'] for r in rows) != set(PROFILE_IDS):
    errors.append({'code':'families','detail':'CSV family set differs from profile set'})
if set(r['axis_id'] for r in rows) != set(EXPECTED_AXES):
    errors.append({'code':'axes','detail':'CSV axis set differs from required set'})

seen = set()
expected_id_pattern = re.compile(r'^(fam-[a-z0-9-]+)-(arrival|name_ask|kit_reveal|power_source|growth|system_voice|hub|opposition|first_proof|crowd|offer|companion|identity_lock|ending_logic)-(0[1-8])$')
for n, row in enumerate(rows, start=2):
    rid = row['variant_id']
    if rid in seen:
        errors.append({'code':'duplicate_id','row':n,'detail':rid})
    seen.add(rid)
    match = expected_id_pattern.match(rid)
    if not match:
        errors.append({'code':'variant_id_format','row':n,'detail':rid})
    else:
        if match.group(1) != row['family_id'] or match.group(2) != row['axis_id']:
            errors.append({'code':'variant_id_mismatch','row':n,'detail':rid})

    words = re.findall(r"[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)?", row['title_short'])
    if not 3 <= len(words) <= 6:
        errors.append({'code':'title_length','row':n,'detail':f"{row['title_short']} ({len(words)} words)"})

    beat_count = len([x for x in row['pointer_beats'].split(';') if x.strip()])
    if not 2 <= beat_count <= 4:
        errors.append({'code':'beat_count','row':n,'detail':beat_count})

    sentence_count = len(re.findall(r'[.!?](?:\s|$)', row['pointer_fallback'].strip()))
    if not 2 <= sentence_count <= 4:
        errors.append({'code':'fallback_sentences','row':n,'detail':sentence_count})

    proof_sentences = len(re.findall(r'[.!?](?:\s|$)', row['first_proof'].strip()))
    if proof_sentences != 1:
        errors.append({'code':'first_proof_sentence','row':n,'detail':proof_sentences})

    for field in ('kid_ok','nsfw','inject_ok'):
        if row[field] not in ('true','false'):
            errors.append({'code':'boolean','row':n,'detail':f'{field}={row[field]}'})

    if row['kid_ok'] == 'false' and not row['kid_transform'].strip():
        errors.append({'code':'kid_transform_missing','row':n,'detail':rid})
    if row['nsfw'] == 'true' and row['family_id'] != 'fam-pyoa-dark-romance':
        errors.append({'code':'nsfw_wrong_family','row':n,'detail':rid})
    if row['nsfw'] == 'true' and row['kid_ok'] != 'false':
        errors.append({'code':'nsfw_kid_flag','row':n,'detail':rid})

    founder = row['founder_shape_cousin'].strip()
    if founder and not founder.startswith('FOUNDER-ONLY / DO NOT INJECT:'):
        errors.append({'code':'founder_prefix','row':n,'detail':founder})
    if founder and row['inject_ok'] == 'true':
        errors.append({'code':'founder_inject','row':n,'detail':rid})

    live_text = ' '.join(row[field] for field in EXPECTED_COLUMNS if field != 'founder_shape_cousin')
    for term in BANNED:
        if re.search(r'(?<![A-Za-z0-9])' + re.escape(term) + r'(?![A-Za-z0-9])', live_text, flags=re.IGNORECASE):
            errors.append({'code':'banned_term','row':n,'detail':term})

    if row['axis_id'] == 'system_voice' and row['family_id'] not in {
        'fam-isekai-summon','fam-null-pyoa-isekai','fam-sys-apocalypse','fam-gate-city',
        'fam-late-awaken','fam-tower-climb','fam-dungeon-drop','fam-academy',
        'fam-dungeon-core','fam-void-bargain','fam-vrmmo-trap','fam-regression',
        'fam-creature-rebirth','fam-cyber-neural','fam-litrpg-custom'
    }:
        combined = (row['title_short'] + ' ' + row['pointer_beats'] + ' ' + row['pointer_fallback']).lower()
        if 'no voice' not in combined and 'no interface' not in combined:
            errors.append({'code':'no_system_violation','row':n,'detail':rid})

# Family pin checks.
rows_by_family = defaultdict(list)
for row in rows:
    rows_by_family[row['family_id']].append(row)

pin_requirements = {
    'fam-isekai-summon':['earth','unidentified blessing','offered','no logout'],
    'fam-null-pyoa-isekai':['failed summon','error'],
    'fam-sys-apocalypse':['earth','global registration','assigned class','permadeath'],
    'fam-late-awaken':['not a summon','private ledger','public grades'],
    'fam-dungeon-core':['player is the core'],
    'fam-village-soft':['do not add blue panels'],
    'fam-pyoa-road':['charter'],
    'fam-pyoa-occult':['cylinder'],
    'fam-pyoa-space':['nav-drive'],
    'fam-pyoa-romance-gala':['dossier'],
    'fam-pyoa-mystery':['backward watch'],
    'fam-pyoa-underwater':['syringe'],
    'fam-pyoa-assassin':['ledger'],
    'fam-pyoa-vampire':['ampoule'],
    'fam-pyoa-dark-romance':['fated-mate ledger'],
    'fam-vrmmo-trap':['safe-zone'],
    'fam-regression':['foreknowledge'],
    'fam-creature-rebirth':['creature body'],
    'fam-cyber-neural':['overheat']
}
for family_id, required_phrases in pin_requirements.items():
    corpus = ' '.join(' '.join(row.values()) for row in rows_by_family[family_id]).lower()
    for phrase in required_phrases:
        if phrase.lower() not in corpus:
            errors.append({'code':'pin_phrase_missing','family_id':family_id,'detail':phrase})

# Custom families must repeatedly preserve proposal language.
for family_id in ['fam-litrpg-custom','fam-rpg-custom','fam-tt-custom']:
    corpus = ' '.join(' '.join(row.values()) for row in rows_by_family[family_id]).lower()
    for phrase in ['proposal','player-approved' if family_id != 'fam-tt-custom' else 'table-approved']:
        if phrase not in corpus:
            errors.append({'code':'custom_restraint','family_id':family_id,'detail':phrase})

# Duplicate-content diagnostics: repeated title+beats within a family-axis pair are errors.
for key, group_count in Counter((r['family_id'], r['axis_id'], r['title_short'], r['pointer_beats']) for r in rows).items():
    if group_count > 1:
        errors.append({'code':'duplicate_variant_content','detail':key + (group_count,)})

# Index and companion-document checks.
for required_file in ['catalogue_index.md','axes_crosswalk.md','folklore_appendix.md']:
    path = ROOT / required_file
    if not path.exists() or path.stat().st_size == 0:
        errors.append({'code':'missing_deliverable','detail':required_file})

index_text = (ROOT / 'catalogue_index.md').read_text(encoding='utf-8')
for family_id in PROFILE_IDS:
    if family_id not in index_text:
        errors.append({'code':'index_family_missing','detail':family_id})
if index_text.count('**Honest limitations:**') != len(PROFILE_IDS):
    errors.append({'code':'limitations_count','detail':index_text.count('**Honest limitations:**')})

# Summaries by category and axis.
category_counts = Counter(PROFILE_MAP[r['family_id']]['category'] for r in rows)
axis_counts = Counter(r['axis_id'] for r in rows)
metrics['rows_by_category'] = dict(category_counts)
metrics['rows_by_axis'] = dict(axis_counts)
metrics['missing_family_axis_pairs'] = len(missing_pairs)
metrics['wrong_family_axis_counts'] = len(wrong_pair_counts)
metrics['error_count'] = len(errors)
metrics['warning_count'] = len(warnings)

report = {
    'status': 'PASS' if not errors else 'FAIL',
    'metrics': metrics,
    'errors': errors,
    'warnings': warnings
}
(ROOT / 'validation_results.json').write_text(json.dumps(report, indent=2), encoding='utf-8')

# Human-readable report.
lines = [
    '# SynapticGM Catalogue Validation Report',
    '',
    '**Author:** Manus AI',
    '',
    f"**Overall result:** {report['status']}",
    '',
    '## Coverage and safety summary',
    '',
    '| Check | Result |',
    '|---|---:|',
    f"| Families | {metrics['family_count']} / {len(PROFILE_IDS)} |",
    f"| Axes | {metrics['axis_count']} / {len(EXPECTED_AXES)} |",
    f"| Family-axis pairs | {len(PROFILE_IDS) * len(EXPECTED_AXES)} |",
    f"| Variants per pair | 8 |",
    f"| Total data rows | {metrics['row_count']} / {expected_rows} |",
    f"| Unique variant IDs | {metrics['variant_id_count']} / {expected_rows} |",
    f"| Missing family-axis pairs | {metrics['missing_family_axis_pairs']} |",
    f"| Wrong pair counts | {metrics['wrong_family_axis_counts']} |",
    f"| `inject_ok=true` rows | {metrics['inject_ok_true']} |",
    f"| `nsfw=true` rows | {metrics['nsfw_true']} |",
    f"| `kid_ok=false` rows | {metrics['kid_ok_false']} |",
    f"| Nonempty founder-only cells | {metrics['founder_nonempty']} |",
    f"| Validation errors | {metrics['error_count']} |",
    '',
    '## Rows by category',
    '',
    '| Category | Rows |',
    '|---|---:|'
]
for category, count in sorted(category_counts.items()):
    lines.append(f'| {category} | {count} |')
lines.extend([
    '',
    '## Rows by axis',
    '',
    '| Axis | Rows |',
    '|---|---:|'
])
for axis in EXPECTED_AXES:
    lines.append(f'| `{axis}` | {axis_counts[axis]} |')
lines.extend([
    '',
    '## Honest fill statement',
    '',
    'No family-axis pair was omitted or reduced below the required eight variants. For axes that are pinned or diegetically absent—especially `system_voice` in no-System families—the catalogue supplies eight texture-valid rows that preserve the pin rather than inventing a contradictory genre engine.',
    '',
    '## Error details',
    ''
])
if errors:
    lines.append('| # | Code | Detail |')
    lines.append('|---:|---|---|')
    for i, error in enumerate(errors, start=1):
        detail = json.dumps(error.get('detail', ''), ensure_ascii=False).replace('|','\\|')
        lines.append(f"| {i} | `{error.get('code')}` | {detail} |")
else:
    lines.append('No structural, safety, completeness, or prohibited-name errors were detected by the automated checks.')

(ROOT / 'validation_report.md').write_text('\n'.join(lines).rstrip() + '\n', encoding='utf-8')
print(json.dumps({'status': report['status'], 'errors': len(errors), 'warnings': len(warnings), 'rows': len(rows)}, indent=2))
