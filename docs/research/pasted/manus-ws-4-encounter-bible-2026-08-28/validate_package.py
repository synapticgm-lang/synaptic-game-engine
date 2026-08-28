from __future__ import annotations

import csv
import json
import re
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

ROOT = Path('/home/ubuntu/ws4_encounter_bible')
ERRORS: list[str] = []
WARNINGS: list[str] = []
CHECKS: list[tuple[str, bool, str]] = []


def check(name: str, condition: bool, detail: str) -> None:
    CHECKS.append((name, condition, detail))
    if not condition:
        ERRORS.append(f'{name}: {detail}')


def load_json(name: str) -> Any:
    path = ROOT / name
    try:
        return json.loads(path.read_text(encoding='utf-8'))
    except Exception as exc:
        ERRORS.append(f'JSON parse {name}: {exc}')
        return None


schema = load_json('schemas/encounter-template.schema.json')
json_names = [
    'D2_litrpg_encounter_library.json',
    'D3_dnd_encounter_library.json',
    'D4_rpg_encounter_library.json',
    'D5_pyoa_crisis_library.json',
    'D6_telegraph_catalog.json',
    'D7_stakes_templates.json',
    'D9_loot_tables.json',
    'D12_eval_gates.json',
]
json_docs = {name: load_json(name) for name in json_names}
check('JSON files parse', all(doc is not None for doc in json_docs.values()), f'{len(json_docs)} required documents inspected')

try:
    import jsonschema  # type: ignore
    validator = jsonschema.Draft202012Validator(schema)
except Exception as exc:
    validator = None
    WARNINGS.append(f'jsonschema unavailable; structural validation only: {exc}')

libraries = {
    'D2': json_docs['D2_litrpg_encounter_library.json'],
    'D3': json_docs['D3_dnd_encounter_library.json'],
    'D4': json_docs['D4_rpg_encounter_library.json'],
    'D5': json_docs['D5_pyoa_crisis_library.json'],
}
expected_counts = {'D2': 8, 'D3': 8, 'D4': 8, 'D5': 24}
all_templates: list[dict[str, Any]] = []
for key, library in libraries.items():
    count = len(library.get('templates', [])) if library else 0
    check(f'{key} template count', count == expected_counts[key], f'expected {expected_counts[key]}, found {count}')
    all_templates.extend(library.get('templates', []) if library else [])

ids = [template.get('id') for template in all_templates]
check('Unique template IDs', len(ids) == len(set(ids)), f'{len(ids)} total IDs, {len(set(ids))} unique')

schema_error_count = 0
if validator:
    for template in all_templates:
        for error in validator.iter_errors(template):
            schema_error_count += 1
            ERRORS.append(f"Schema {template.get('id')}: {'/'.join(map(str, error.absolute_path))}: {error.message}")
check('JSON Schema conformance', schema_error_count == 0, f'{schema_error_count} schema errors across {len(all_templates)} templates')

allowed_terminal = {'victory', 'defeat', 'fled', 'negotiated', 'partial', 'crisisEnding'}
telegraphed = 0
for template in all_templates:
    tid = template['id']
    telegraph = template['telegraph']
    if telegraph.get('cues') and telegraph.get('channels'):
        telegraphed += 1
    check(f'{tid} bounded', 1 <= template['resolution']['maxTurns'] <= 30, f"maxTurns={template['resolution']['maxTurns']}")
    forced = template['resolution']['forcedTerminal']
    check(f'{tid} forced terminal', forced.get('terminal') is True and forced.get('terminalState') in allowed_terminal and bool(forced.get('stateChanges')), str(forced))
    check(f'{tid} action count', len(template['stakes']['approaches']) >= 2, f"approaches={len(template['stakes']['approaches'])}")
    for action in template['stakes']['approaches']:
        honest = bool(action.get('onSuccess', {}).get('stateChanges')) and bool(action.get('onFailure', {}).get('stateChanges')) and bool(action.get('lockout'))
        check(f"{tid}/{action.get('id')} action honesty", honest, 'success/failure deltas and lockout required')
    receipt_types = {mutation['type'] for rows in template['aftermath']['byTerminal'].values() for mutation in rows}
    check(f'{tid} receipt diversity', len(receipt_types) >= template['aftermath']['minimumReceiptTypes'] >= 2, f"types={sorted(receipt_types)} minimum={template['aftermath']['minimumReceiptTypes']}")
    check(f'{tid} biome allow', bool(template['biomeFilter']['allow']), str(template['biomeFilter']))
    if template['role'] == 'boss':
        check(f'{tid} boss channels', len(set(telegraph['channels'])) >= 3, f"channels={telegraph['channels']}")
    if template['role'] == 'elite':
        check(f'{tid} elite channels', len(set(telegraph['channels'])) >= 2, f"channels={telegraph['channels']}")

coverage = telegraphed / len(all_templates) if all_templates else 0
check('Authored telegraph coverage', coverage >= 0.80, f'{telegraphed}/{len(all_templates)} = {coverage:.1%}')

pyoa = libraries['D5']['templates']
pyoa_counts = Counter(item['bibleId'] for item in pyoa)
check('PYOA bible count', len(pyoa_counts) == 4, str(dict(pyoa_counts)))
for bible, count_value in sorted(pyoa_counts.items()):
    check(f'PYOA {bible} depth', 5 <= count_value <= 8, f'{count_value} crises')
for template in pyoa:
    for action in template['stakes']['approaches']:
        changes = action['onSuccess']['stateChanges']
        required_prefixes = ['fact:', 'callback:', 'ending:', 'convergence:']
        check(
            f"{template['id']}/{action['id']} branch memory",
            all(any(change.startswith(prefix) for change in changes) for prefix in required_prefixes),
            'exclusive fact, callback, ending, and convergence state required',
        )

with (ROOT / 'D10_biome_spawn_matrix.csv').open(encoding='utf-8', newline='') as handle:
    matrix_rows = list(csv.DictReader(handle))
check('Biome matrix rows', len(matrix_rows) >= 20, f'{len(matrix_rows)} rows')
check('Biome matrix modes', {row['Mode'] for row in matrix_rows} == {'litrpg', 'dnd', 'rpg', 'pyoa'}, str(sorted({row['Mode'] for row in matrix_rows})))
check('Biome matrix drought fallback', all(row['Drought_Fallback'].strip() for row in matrix_rows), 'every row must provide a legal fallback')
check('Biome matrix exclusions', all(row['Excluded_Actors'].strip() for row in matrix_rows), 'every row must provide exclusions')

with (ROOT / 'D12_implementation_backlog.csv').open(encoding='utf-8', newline='') as handle:
    backlog_rows = list(csv.DictReader(handle))
check('Backlog task count', 30 <= len(backlog_rows) <= 40, f'{len(backlog_rows)} tasks')
check('Backlog IDs unique', len({row['ID'] for row in backlog_rows}) == len(backlog_rows), f'{len(backlog_rows)} rows')
check('Backlog columns', list(backlog_rows[0].keys()) == ['ID', 'Priority', 'Task', 'Complexity', 'Integration', 'Notes'], str(list(backlog_rows[0].keys())))
priority_counts = Counter(row['Priority'] for row in backlog_rows)
check('Backlog priority set', set(priority_counts) == {'P0', 'P1', 'P2'}, str(dict(priority_counts)))

gates = json_docs['D12_eval_gates.json']['gates']
check('Five eval gates', [gate['id'] for gate in gates] == ['G1', 'G2', 'G3', 'G4', 'G5'], str([gate['id'] for gate in gates]))
check('Gate criteria complete', all(gate.get('criteria') and gate.get('measurementMethod') and gate.get('passThreshold') for gate in gates), 'criteria, measurement, and thresholds required')

markdown_names = [
    'D1_encounter_bible_constitution.md',
    'D2_litrpg_encounter_library.md',
    'D3_dnd_encounter_library.md',
    'D4_rpg_encounter_library.md',
    'D5_pyoa_crisis_library.md',
    'D6_telegraph_catalog.md',
    'D7_stakes_templates.md',
    'D8_resolution_mechanics.md',
    'D9_loot_tables.md',
    'D10_biome_spawn_matrix.md',
    'D11_density_targets.md',
    'D12_implementation_and_eval.md',
]
for name in markdown_names:
    text = (ROOT / name).read_text(encoding='utf-8')
    check(f'{name} nontrivial', len(text) >= 1000, f'{len(text)} characters')
    check(f'{name} has headings', text.startswith('# '), 'must start with H1')

roles_expected = {
    'D2': {'ambush', 'trash', 'elite', 'boss', 'duel', 'raid', 'patrol'},
    'D3': {'trash', 'hazard', 'skill', 'duel', 'puzzle', 'boss', 'random'},
    'D4': {'social', 'crisis', 'ambush'},
}
for key, required in roles_expected.items():
    actual = {template['role'] for template in libraries[key]['templates']}
    check(f'{key} role coverage', required.issubset(actual), f'required={sorted(required)} actual={sorted(actual)}')

results = {
    'status': 'PASS' if not ERRORS else 'FAIL',
    'summary': {
        'checks': len(CHECKS),
        'passed': sum(1 for _, passed, _ in CHECKS if passed),
        'failed': sum(1 for _, passed, _ in CHECKS if not passed),
        'warnings': len(WARNINGS),
        'templates': len(all_templates),
        'telegraphCoverage': coverage,
        'matrixRows': len(matrix_rows),
        'backlogTasks': len(backlog_rows),
        'priorityCounts': dict(priority_counts),
        'pyoaCounts': dict(pyoa_counts),
    },
    'checks': [{'name': name, 'passed': passed, 'detail': detail} for name, passed, detail in CHECKS],
    'errors': ERRORS,
    'warnings': WARNINGS,
}
(ROOT / 'validation_results.json').write_text(json.dumps(results, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

lines = [
    '# WS-4 Validation Report',
    '',
    f"**Status:** {results['status']}",
    '',
    '| Metric | Result |',
    '| --- | ---: |',
    f"| Checks passed | {results['summary']['passed']} / {results['summary']['checks']} |",
    f"| Encounter/crisis templates | {results['summary']['templates']} |",
    f"| Authored telegraph coverage | {coverage:.1%} |",
    f"| Biome matrix rows | {results['summary']['matrixRows']} |",
    f"| Backlog tasks | {results['summary']['backlogTasks']} |",
    f"| PYOA crises | {sum(pyoa_counts.values())} across {len(pyoa_counts)} bibles |",
    '',
    '## Library Coverage',
    '',
    '| Deliverable | Templates | Result |',
    '| --- | ---: | --- |',
]
for key in ['D2', 'D3', 'D4', 'D5']:
    found = len(libraries[key]['templates'])
    lines.append(f"| {key} | {found} | {'PASS' if found == expected_counts[key] else 'FAIL'} |")
lines.extend(['', '## PYOA Coverage', '', '| Bible | Crises | Result |', '| --- | ---: | --- |'])
for bible, count_value in sorted(pyoa_counts.items()):
    lines.append(f"| {bible} | {count_value} | {'PASS' if 5 <= count_value <= 8 else 'FAIL'} |")
lines.extend(['', '## Failed Checks', ''])
if ERRORS:
    lines.extend(f'- {error}' for error in ERRORS)
else:
    lines.append('No failed checks.')
lines.extend(['', '## Warnings', ''])
if WARNINGS:
    lines.extend(f'- {warning}' for warning in WARNINGS)
else:
    lines.append('No warnings.')
lines.extend(['', '## Validation Scope', '', 'The validator parsed all required JSON and CSV artifacts; checked every template against the shared JSON Schema when the validator library was available; verified counts, IDs, lifecycle bounds, forced terminals, action deltas, receipt diversity, biome fields, elite/boss telegraph depth, PYOA branch memory, backlog shape, gate completeness, and Markdown presence. TypeScript compilation is reported separately in the package README.'])
(ROOT / 'VALIDATION_REPORT.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')

print(json.dumps(results['summary'], indent=2))
if ERRORS:
    raise SystemExit(1)
