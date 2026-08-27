#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from pathlib import Path

ROOT = Path('/home/ubuntu/SynapticGM_everything_audit_2026-08-18')
required = [ROOT / 'deliverables' / '00_executive_win_conditions_memo.md']
required += [ROOT / 'deliverables' / f'E{i}_{name}.md' for i, name in [
    (1, 'current_vs_competition_scorecard'),
    (2, 'fresh_app_review'),
    (3, 'continuity_red_team_simulations'),
    (4, 'playtest_protocol_john_can_run_tonight'),
    (5, 'monetization_and_cost_stress_test'),
    (6, 'launch_trust_legal_shaped_checklist'),
    (7, 'content_and_vibe_banks'),
    (8, 'eval_harness_design'),
    (9, 'competitive_teardown_deep_dives'),
    (10, 'what_manus_still_cannot_know'),
    (11, 'master_build_backlog_merge'),
    (12, 'founder_action_board'),
]]
required += [
    ROOT / 'appendices' / 'competitor_citation_appendix.md',
    ROOT / 'appendices' / 'anti_hallucination_and_product_law_note.md',
    ROOT / 'fixtures' / 'E3_continuity_red_team_scenarios.csv',
    ROOT / 'fixtures' / 'E4_playtest_score_sheet.csv',
    ROOT / 'fixtures' / 'E4_failure_taxonomy.csv',
    ROOT / 'fixtures' / 'E5_unit_economics_inputs_and_formulas.csv',
    ROOT / 'fixtures' / 'E8_eval_harness_release_gates.json',
]

problems: list[str] = []
for path in required:
    if not path.is_file() or path.stat().st_size == 0:
        problems.append(f'Missing or empty: {path.relative_to(ROOT)}')

for path in ROOT.glob('fixtures/*.csv'):
    with path.open(newline='', encoding='utf-8') as handle:
        rows = list(csv.reader(handle))
    if not rows:
        problems.append(f'Empty CSV: {path.name}')
        continue
    width = len(rows[0])
    bad_rows = [index + 1 for index, row in enumerate(rows) if len(row) != width]
    if bad_rows:
        problems.append(f'CSV schema mismatch {path.name}: header={width}; bad rows={bad_rows[:10]}')

with (ROOT / 'fixtures' / 'E8_eval_harness_release_gates.json').open(encoding='utf-8') as handle:
    payload = json.load(handle)
for key in ('product_law', 'global_invariants', 'golden_traces', 'warden_shadow_labels', 'screenshot_release_checklist'):
    if key not in payload:
        problems.append(f'Missing JSON key: {key}')

scenario_path = ROOT / 'fixtures' / 'E3_continuity_red_team_scenarios.csv'
with scenario_path.open(newline='', encoding='utf-8') as handle:
    scenario_rows = list(csv.DictReader(handle))
if len(scenario_rows) < 50:
    problems.append(f'E3 must contain at least 50 scenarios; found {len(scenario_rows)}')

required_categories = {'invention', 'correction', 'open_ask', 'kit_contradiction', 'retry_novelty', 'stale_revision', 'rag_poison', 'kid_mode', 'personality'}
found_categories = {row['category'] for row in scenario_rows}
missing_categories = sorted(required_categories - found_categories)
if missing_categories:
    problems.append(f'E3 missing required categories: {missing_categories}')

for path in ROOT.glob('deliverables/*.md'):
    text = path.read_text(encoding='utf-8')
    if len(text.strip()) < 500:
        problems.append(f'Deliverable suspiciously short: {path.name}')

scope_terms = ('WOF', 'hybrid climate', 'patent', 'MMO networking redesign')
for term in scope_terms:
    matches = []
    for path in ROOT.glob('deliverables/*.md'):
        for number, line in enumerate(path.read_text(encoding='utf-8').splitlines(), 1):
            if term.lower() in line.lower() and not re.search(r'no |not |excluded|out of scope|do not |without ', line, re.I):
                matches.append(f'{path.name}:{number}')
    if matches:
        problems.append(f'Potential in-scope violation for {term}: {matches[:5]}')

print(f'Required files checked: {len(required)}')
print(f'E3 scenarios: {len(scenario_rows)}')
print('E3 categories: ' + ', '.join(sorted(found_categories)))
print('JSON: valid and required keys present')
print('CSV: parsed with uniform schema')
if problems:
    print('VALIDATION: FAIL')
    for item in problems:
        print(' - ' + item)
    raise SystemExit(1)
print('VALIDATION: PASS')
