from __future__ import annotations

from pathlib import Path
import csv
import json
import re
import sys

root = Path('/home/ubuntu/SynapticGM_score_boost_post_28c_2026-08-27')
d = root / 'deliverables'
prefix = 'SynapticGM_score_boost_post_28c_2026-08-27'
errors: list[str] = []
warnings: list[str] = []
checks: list[str] = []

expected = [
    f'{prefix}_COMPLETE.md',
    f'{prefix}_T01_executive_summary.md',
    f'{prefix}_T02_encounter_terminal_fsm.md',
    f'{prefix}_T02_encounter_terminal_fsm.mmd',
    f'{prefix}_T02_encounter_terminal_fsm.png',
    f'{prefix}_T03_entity_scrub_constitution.md',
    f'{prefix}_T04_choice_compiler_encounter_lock.md',
    f'{prefix}_T04_choice_compiler_edge_matrix.csv',
    f'{prefix}_T05_status_leak_firewall.md',
    f'{prefix}_T06_topic_and_pyoa_branch_enforcement.md',
    f'{prefix}_T07_free_t12_hook_contract.md',
    f'{prefix}_T08_ranked_implementation_backlog.csv',
    f'{prefix}_T08_ranked_implementation_backlog.md',
    f'{prefix}_T09_score_ceiling_model.md',
    f'{prefix}_T10_eval_harness_gates.schema.json',
    f'{prefix}_T11_unknowns_and_evidence_requests.md',
    f'{prefix}_T12_what_not_to_do.md',
]

for name in expected:
    path = d / name
    if not path.exists():
        errors.append(f'missing required file: {name}')
    elif path.stat().st_size == 0:
        errors.append(f'empty required file: {name}')
checks.append(f'expected files checked: {len(expected)}')

for path in d.iterdir():
    if path.is_file() and not path.name.startswith(prefix):
        errors.append(f'filename does not use required prefix: {path.name}')

# Empty Markdown section detection and reference check.
md_files = [d / name for name in expected if name.endswith('.md') and (d / name).exists()]
heading_re = re.compile(r'^(#{1,6})\s+(.+?)\s*$', re.MULTILINE)
for path in md_files:
    text = path.read_text(encoding='utf-8')
    headings = list(heading_re.finditer(text))
    if not headings:
        errors.append(f'no Markdown heading: {path.name}')
        continue
    for i, match in enumerate(headings):
        end = headings[i + 1].start() if i + 1 < len(headings) else len(text)
        body = text[match.end():end]
        body = re.sub(r'<!--.*?-->', '', body, flags=re.S).strip()
        # A heading is nonempty if it has prose, table, code, image, reference definition, or blockquote.
        if not body:
            errors.append(f'empty Markdown section in {path.name}: {match.group(2)}')
    if path.name != f'{prefix}_COMPLETE.md' and '## References' not in text:
        errors.append(f'missing References section: {path.name}')
checks.append(f'Markdown files checked: {len(md_files)}')

# CSV structure.
csv_requirements = {
    f'{prefix}_T04_choice_compiler_edge_matrix.csv': {
        'mode_id', 'encounter_kind', 'fsm_phase', 'allowed_families',
        'forbidden_families', 'registry_edge_requirement', 'fallback_order'
    },
    f'{prefix}_T08_ranked_implementation_backlog.csv': {
        'rank', 'id', 'priority', 'workstream', 'logical_owner_surface',
        'implementation_contract', 'depends_on', 'primary_test_names',
        'observability', 'rollout_gate', 'rollback_rule'
    },
}
for name, required_columns in csv_requirements.items():
    path = d / name
    if not path.exists():
        continue
    with path.open(newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    missing_columns = required_columns - set(reader.fieldnames or [])
    if missing_columns:
        errors.append(f'{name} missing columns: {sorted(missing_columns)}')
    if not rows:
        errors.append(f'{name} has no data rows')
    for idx, row in enumerate(rows, 2):
        if name.endswith('implementation_backlog.csv'):
            for key in ('id', 'priority', 'implementation_contract', 'primary_test_names'):
                if not (row.get(key) or '').strip():
                    errors.append(f'{name}:{idx} empty {key}')
checks.append('CSV files parsed and required columns checked')

# JSON Schema parse and metaschema validation.
schema_path = d / f'{prefix}_T10_eval_harness_gates.schema.json'
if schema_path.exists():
    try:
        schema = json.loads(schema_path.read_text(encoding='utf-8'))
    except Exception as exc:
        errors.append(f'JSON parse error: {exc}')
        schema = None
    if schema is not None:
        try:
            from jsonschema import Draft202012Validator
            Draft202012Validator.check_schema(schema)
            checks.append('JSON Schema Draft 2020-12 metaschema validation passed')
        except ImportError:
            warnings.append('jsonschema package unavailable; only JSON parse was validated')
        except Exception as exc:
            errors.append(f'JSON Schema metaschema validation failed: {exc}')

# Key cross-deliverable contract checks.
corpus = '\n'.join(p.read_text(encoding='utf-8') for p in md_files)
required_terms = [
    'encounterCleared', 'branchLocked', 'parleyResolved', 'T50', 'T30', 'T12', 'T15',
    'ArcDirector', 'ChoiceCompiler', 'typedEntityValidator', 'proseWarden',
    'Millstone Charter', 'Cape District', 'Aldous', 'Oskar', 'Pact-Hunter', 'Keep Wraith',
    'cross-run bleed', 'replay hash', 'sealed manifest fallback'
]
for term in required_terms:
    if term.lower() not in corpus.lower():
        errors.append(f'required contract/evidence term absent from Markdown corpus: {term}')

terminal_outcomes = ['escape', 'victory', 'defeat', 'capture', 'parleyResolved']
t2 = (d / f'{prefix}_T02_encounter_terminal_fsm.md').read_text(encoding='utf-8')
for outcome in terminal_outcomes:
    if outcome not in t2:
        errors.append(f'T2 missing terminal outcome: {outcome}')

# All structured deliverables must use the filename prefix.
structured = list(d.glob('*.csv')) + list(d.glob('*.json')) + list(d.glob('*.mmd'))
for path in structured:
    if not path.name.startswith(prefix):
        errors.append(f'structured deliverable lacks prefix: {path.name}')
checks.append('key cross-deliverable terms and outcome enums checked')

# Report.
report = {
    'status': 'pass' if not errors else 'fail',
    'checks': checks,
    'warnings': warnings,
    'errors': errors,
    'fileCount': len([p for p in d.iterdir() if p.is_file()]),
}
report_path = root / 'validation' / 'validation_report.json'
report_path.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(json.dumps(report, indent=2))
sys.exit(1 if errors else 0)
