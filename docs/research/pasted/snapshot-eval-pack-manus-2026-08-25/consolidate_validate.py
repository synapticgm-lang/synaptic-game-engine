from __future__ import annotations

import csv
import json
import re
from collections import Counter, defaultdict
from pathlib import Path
from urllib.request import urlopen

ROOT = Path('/home/ubuntu/SynapticGM_snapshot_eval_pack_2026-08-25')
MANIFEST = Path('/home/ubuntu/draft_synapticgm_fixture_batches.json')
FRAGMENTS = ROOT / '_fragments'
FRAGMENTS.mkdir(parents=True, exist_ok=True)

SCENARIO_COLUMNS = [
    'id', 'class', 'setup_snapshot_json', 'last_gm_story', 'player_input',
    'expect_hard_gate', 'expect_warden_scrub', 'expect_facts_unchanged',
    'fail_symptom', 'automated_assert', 'notes'
]
GOOD_COLUMNS = ['id', 'prose', 'snapshot_json', 'must_keep_phrases', 'must_not_invent', 'notes']
ADV_COLUMNS = ['id', 'sentence', 'why_naive_regex_fails', 'correct_expect', 'notes']
REQUIRED_SNAPSHOT = {
    'location', 'crowd', 'crowdSize', 'indoor', 'timeOfDay', 'tension',
    'exits', 'props', 'present', 'companions', 'inventory', 'openingCover',
    'aloneArrival'
}
CLASS_ENUM = {'A-turn', 'B-opening', 'C-quest', 'D-prose', 'E-chrome'}
GATE_ENUM = {'block', 'allow', 'skip'}
FACTS_ENUM = {'yes', 'no'}
ADV_ENUM = {'allow', 'scrub', 'skip'}
PATTERNS = {
    'PW_LAST_CONTAINER_UNGROUNDED', 'PW_CROWD_SIZE_OVERSTATE',
    'PW_CROWD_ABSENCE_CONTRADICTION', 'PW_CROWD_PRESENCE_INVENTION',
    'PW_STEP_OUTSIDE_WHILE_INDOOR', 'PW_ENTER_BUILDING_WHILE_OUTDOOR',
    'PW_UNTRACKED_TIME_SKIP', 'PW_EVENT_OVER_RETCON',
    'PW_UNGROUNDED_PAST_RETCON', 'PW_TENSION_DROP_CONTRADICTION',
    'PW_LOCATION_AS_SPEAKER', 'PW_EXIT_WHITELIST_VIOLATION',
    'PW_INVENTORY_FACT_CONTRADICTION', 'PW_LEDGER_NUMBER_CONTRADICTION',
    'PW_PRESENCE_ROSTER_CONTRADICTION', 'PW_LOCATION_FACT_CONTRADICTION',
    'PW_WEATHER_FACT_CONTRADICTION', 'PW_QUEST_FACT_CONTRADICTION'
}


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open('r', encoding='utf-8-sig', newline='') as handle:
        reader = csv.DictReader(handle)
        return list(reader.fieldnames or []), list(reader)


def write_csv(path: Path, columns: list[str], rows: list[dict[str, str]]) -> None:
    with path.open('w', encoding='utf-8', newline='') as handle:
        writer = csv.DictWriter(handle, fieldnames=columns, extrasaction='ignore', lineterminator='\n')
        writer.writeheader()
        writer.writerows(rows)


def download(url: str, path: Path) -> None:
    with urlopen(url, timeout=60) as response:
        path.write_bytes(response.read())


def classify(assignment: str) -> tuple[str, Path, list[str]]:
    if assignment.startswith('SCENARIO FRAGMENT A'):
        return 'scenario_a', FRAGMENTS / 'scenario_a.csv', SCENARIO_COLUMNS
    if assignment.startswith('SCENARIO FRAGMENT B'):
        return 'scenario_b', FRAGMENTS / 'scenario_b.csv', SCENARIO_COLUMNS
    if assignment.startswith('SCENARIO FRAGMENT C'):
        return 'scenario_c', FRAGMENTS / 'scenario_c.csv', SCENARIO_COLUMNS
    if assignment.startswith('SCENARIO FRAGMENT D'):
        return 'scenario_d', FRAGMENTS / 'scenario_d.csv', SCENARIO_COLUMNS
    if assignment.startswith('SCENARIO FRAGMENT E'):
        return 'scenario_e', FRAGMENTS / 'scenario_e.csv', SCENARIO_COLUMNS
    if assignment.startswith('GOOD PROSE BATCH'):
        return 'good', ROOT / 'good_prose.csv', GOOD_COLUMNS
    if assignment.startswith('ADVERSARIAL BATCH'):
        return 'adversarial', ROOT / 'adversarial_almost_false.csv', ADV_COLUMNS
    raise ValueError(f'Unknown assignment: {assignment[:80]}')


def main() -> None:
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
    scenario_rows: list[dict[str, str]] = []
    errors: list[str] = []
    batch_counts: dict[str, int] = {}

    for result in manifest['results']:
        if result.get('error'):
            errors.append(f"Batch error: {result['error']}")
            continue
        key, path, expected_columns = classify(result['input'])
        download(result['output']['csv_file'], path)
        columns, rows = read_csv(path)
        batch_counts[key] = len(rows)
        if columns != expected_columns:
            errors.append(f'{key}: columns {columns!r} != {expected_columns!r}')
        if key.startswith('scenario_'):
            scenario_rows.extend(rows)

    scenario_rows.sort(key=lambda row: row['id'])
    write_csv(ROOT / 'scenarios.csv', SCENARIO_COLUMNS, scenario_rows)

    scenario_columns, scenarios = read_csv(ROOT / 'scenarios.csv')
    good_columns, good = read_csv(ROOT / 'good_prose.csv')
    adv_columns, adversarial = read_csv(ROOT / 'adversarial_almost_false.csv')

    if scenario_columns != SCENARIO_COLUMNS:
        errors.append('scenarios.csv exact header mismatch')
    if good_columns != GOOD_COLUMNS:
        errors.append('good_prose.csv exact header mismatch')
    if adv_columns != ADV_COLUMNS:
        errors.append('adversarial_almost_false.csv exact header mismatch')

    expected_counts = {'scenarios': 100, 'good': 30, 'adversarial': 50}
    actual_counts = {'scenarios': len(scenarios), 'good': len(good), 'adversarial': len(adversarial)}
    for name, minimum in expected_counts.items():
        if actual_counts[name] < minimum:
            errors.append(f'{name}: {actual_counts[name]} below {minimum}')

    ids = [row['id'] for row in scenarios]
    if len(ids) != len(set(ids)):
        errors.append('scenarios.csv contains duplicate IDs')

    pattern_counts: Counter[str] = Counter()
    class_counts: Counter[str] = Counter()
    gate_counts: Counter[str] = Counter()
    fact_counts: Counter[str] = Counter()
    snapshot_errors: list[str] = []
    label_errors: list[str] = []

    for row in scenarios:
        rid = row['id']
        if row['class'] not in CLASS_ENUM:
            errors.append(f'{rid}: invalid class {row["class"]!r}')
        if row['expect_hard_gate'] not in GATE_ENUM:
            errors.append(f'{rid}: invalid hard-gate enum {row["expect_hard_gate"]!r}')
        scrub = row['expect_warden_scrub']
        if scrub != 'none' and scrub not in PATTERNS:
            errors.append(f'{rid}: invalid pattern {scrub!r}')
        if row['expect_facts_unchanged'] not in FACTS_ENUM:
            errors.append(f'{rid}: invalid facts enum {row["expect_facts_unchanged"]!r}')
        if not row['automated_assert'].strip():
            errors.append(f'{rid}: empty automated_assert')
        if not row['fail_symptom'].strip():
            errors.append(f'{rid}: empty fail_symptom')
        if not re.search(r'\b(EVIDENCED|SPECULATIVE)\b', row['notes']):
            label_errors.append(f'{rid}: notes lack evidence label')
        try:
            snapshot = json.loads(row['setup_snapshot_json'])
        except json.JSONDecodeError as exc:
            snapshot_errors.append(f'{rid}: invalid JSON: {exc}')
            continue
        missing = REQUIRED_SNAPSHOT - set(snapshot)
        if missing:
            snapshot_errors.append(f'{rid}: missing keys {sorted(missing)}')
        if snapshot.get('crowd') not in {'present', 'none', 'unknown'}:
            snapshot_errors.append(f'{rid}: invalid crowd enum')
        if snapshot.get('timeOfDay') not in {'morning', 'afternoon', 'evening', 'night', 'unknown'}:
            snapshot_errors.append(f'{rid}: invalid timeOfDay enum')
        if snapshot.get('tension') not in {'calm', 'tense', 'danger', 'combat', 'unknown'}:
            snapshot_errors.append(f'{rid}: invalid tension enum')
        if not isinstance(snapshot.get('crowdSize'), int) or snapshot.get('crowdSize', -1) < 0:
            snapshot_errors.append(f'{rid}: crowdSize must be a nonnegative integer')
        class_counts[row['class']] += 1
        gate_counts[row['expect_hard_gate']] += 1
        fact_counts[row['expect_facts_unchanged']] += 1
        if scrub != 'none':
            pattern_counts[scrub] += 1

    good_ids = [row['id'] for row in good]
    if len(good_ids) != len(set(good_ids)):
        errors.append('good_prose.csv contains duplicate IDs')
    for row in good:
        rid = row['id']
        if not re.search(r'\b(EVIDENCED|SPECULATIVE)\b', row['notes']):
            label_errors.append(f'{rid}: notes lack evidence label')
        try:
            snapshot = json.loads(row['snapshot_json'])
        except json.JSONDecodeError as exc:
            snapshot_errors.append(f'{rid}: invalid JSON: {exc}')
            continue
        missing = REQUIRED_SNAPSHOT - set(snapshot)
        if missing:
            snapshot_errors.append(f'{rid}: missing keys {sorted(missing)}')
        if not row['must_keep_phrases'].strip():
            errors.append(f'{rid}: empty must_keep_phrases')
        if not row['must_not_invent'].strip():
            errors.append(f'{rid}: empty must_not_invent')

    adv_ids = [row['id'] for row in adversarial]
    if len(adv_ids) != len(set(adv_ids)):
        errors.append('adversarial_almost_false.csv contains duplicate IDs')
    adv_counts: Counter[str] = Counter()
    for row in adversarial:
        rid = row['id']
        if row['correct_expect'] not in ADV_ENUM:
            errors.append(f'{rid}: invalid correct_expect {row["correct_expect"]!r}')
        if not re.search(r'\b(EVIDENCED|SPECULATIVE)\b', row['notes']):
            label_errors.append(f'{rid}: notes lack evidence label')
        adv_counts[row['correct_expect']] += 1

    missing_patterns = sorted(PATTERNS - set(pattern_counts))
    if missing_patterns:
        errors.append(f'Missing scenario coverage for patterns: {missing_patterns}')
    errors.extend(snapshot_errors)
    errors.extend(label_errors)

    required_phrases = {
        'last-box player claim': (r'last (box|crate|chest)', 'block'),
        'look-around skip': (r'look around|examine (the )?room', 'skip'),
        'layout skip': (r'doors? or windows?|windows? or doors?', 'skip'),
        'info-option skip': (r'info or option|options? panel|info panel', 'skip'),
    }
    coverage_hits: dict[str, list[str]] = defaultdict(list)
    for row in scenarios:
        text = f"{row['last_gm_story']} {row['player_input']}".lower()
        for label, (regex, outcome) in required_phrases.items():
            if re.search(regex, text) and row['expect_hard_gate'] == outcome:
                coverage_hits[label].append(row['id'])
    for label in required_phrases:
        if not coverage_hits[label]:
            errors.append(f'No coverage hit for {label}')

    report = {
        'status': 'PASS' if not errors else 'FAIL',
        'counts': actual_counts,
        'batch_counts': batch_counts,
        'class_counts': dict(sorted(class_counts.items())),
        'hard_gate_counts': dict(sorted(gate_counts.items())),
        'facts_unchanged_counts': dict(sorted(fact_counts.items())),
        'pattern_counts': dict(sorted(pattern_counts.items())),
        'adversarial_expect_counts': dict(sorted(adv_counts.items())),
        'coverage_hits': dict(sorted(coverage_hits.items())),
        'errors': errors,
    }
    (ROOT / 'validation_report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
