from __future__ import annotations

import csv
import json
import re
from pathlib import Path

ROOT=Path('/home/ubuntu/SynapticGM_snapshot_eval_pack_2026-08-25')
REQUIRED=['README.md','scenarios.csv','good_prose.csv','coverage.md','pattern_ids.md','wiring_note.md','adversarial_almost_false.csv']
PATTERNS={
'PW_LAST_CONTAINER_UNGROUNDED','PW_CROWD_SIZE_OVERSTATE','PW_CROWD_ABSENCE_CONTRADICTION','PW_CROWD_PRESENCE_INVENTION',
'PW_STEP_OUTSIDE_WHILE_INDOOR','PW_ENTER_BUILDING_WHILE_OUTDOOR','PW_UNTRACKED_TIME_SKIP','PW_EVENT_OVER_RETCON',
'PW_UNGROUNDED_PAST_RETCON','PW_TENSION_DROP_CONTRADICTION','PW_LOCATION_AS_SPEAKER','PW_EXIT_WHITELIST_VIOLATION',
'PW_INVENTORY_FACT_CONTRADICTION','PW_LEDGER_NUMBER_CONTRADICTION','PW_PRESENCE_ROSTER_CONTRADICTION',
'PW_LOCATION_FACT_CONTRADICTION','PW_WEATHER_FACT_CONTRADICTION','PW_QUEST_FACT_CONTRADICTION'}

def main():
    errors=[]
    for name in REQUIRED:
        p=ROOT/name
        if not p.exists(): errors.append(f'missing required file: {name}')
        elif p.stat().st_size==0: errors.append(f'empty required file: {name}')
    with (ROOT/'scenarios.csv').open(encoding='utf-8',newline='') as f:
        scenarios=list(csv.DictReader(f))
    ids={r['id'] for r in scenarios}
    used={r['expect_warden_scrub'] for r in scenarios if r['expect_warden_scrub']!='none'}
    readme=(ROOT/'README.md').read_text(encoding='utf-8')
    coverage=(ROOT/'coverage.md').read_text(encoding='utf-8')
    patterns=(ROOT/'pattern_ids.md').read_text(encoding='utf-8')
    wiring=(ROOT/'wiring_note.md').read_text(encoding='utf-8')
    documented=set(re.findall(r'`(PW_[A-Z_]+)`',patterns))
    readme_patterns=set(re.findall(r'`(PW_[A-Z_]+)`',readme))
    coverage_patterns=set(re.findall(r'`(PW_[A-Z_]+)`',coverage))
    if used!=PATTERNS: errors.append(f'scenario pattern set mismatch: missing={sorted(PATTERNS-used)} extra={sorted(used-PATTERNS)}')
    if not PATTERNS<=documented: errors.append(f'pattern_ids.md missing {sorted(PATTERNS-documented)}')
    if not PATTERNS<=readme_patterns: errors.append(f'README missing {sorted(PATTERNS-readme_patterns)}')
    if not PATTERNS<=coverage_patterns: errors.append(f'coverage missing {sorted(PATTERNS-coverage_patterns)}')
    cited_ids=set(re.findall(r'`([A-EG][0-9]{3})`',coverage))
    invalid_scenario={x for x in cited_ids if x[0] in 'ABCDE' and x not in ids}
    if invalid_scenario: errors.append(f'coverage cites invalid scenario IDs {sorted(invalid_scenario)}')
    for name in ['actionValidation.test.ts','proseWarden.test.ts']:
        if name not in readme or name not in wiring: errors.append(f'missing test-file mapping: {name}')
    required_wiring=['poetry','NPC','lie','joke','metaphor','quotation','hypothetical','Cancel','no text-turn spend']
    for term in required_wiring:
        if term.lower() not in wiring.lower(): errors.append(f'wiring_note missing caution/contract term: {term}')
    checklist_terms=['last box','hundred people','all-alone','doors or windows','festival-over','hall answers','gold or stat-number','flair-only']
    for term in checklist_terms:
        if term.lower() not in coverage.lower(): errors.append(f'coverage checklist term missing: {term}')
    if 'References' not in readme or 'References' not in coverage or 'References' not in patterns or 'References' not in wiring:
        errors.append('one or more markdown deliverables lack References section')
    report_path=ROOT/'validation_report.json'
    report=json.loads(report_path.read_text(encoding='utf-8'))
    report['documentation_validation']={
        'status':'PASS' if not errors else 'FAIL',
        'required_files':REQUIRED,
        'scenario_ids_cited_in_coverage':len({x for x in cited_ids if x[0] in 'ABCDE'}),
        'scenario_pattern_ids_used':len(used),
        'pattern_ids_documented':len(PATTERNS & documented),
        'readme_pattern_ids_listed':len(PATTERNS & readme_patterns),
        'coverage_pattern_ids_listed':len(PATTERNS & coverage_patterns),
        'errors':errors,
    }
    if errors: report['status']='FAIL'
    report_path.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report['documentation_validation'],indent=2))
    raise SystemExit(1 if errors else 0)
if __name__=='__main__': main()
