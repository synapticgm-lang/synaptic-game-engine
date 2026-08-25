from __future__ import annotations

import csv
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path('/home/ubuntu/SynapticGM_snapshot_eval_pack_2026-08-25')
SCENARIO_COLUMNS = ['id','class','setup_snapshot_json','last_gm_story','player_input','expect_hard_gate','expect_warden_scrub','expect_facts_unchanged','fail_symptom','automated_assert','notes']
GOOD_COLUMNS = ['id','prose','snapshot_json','must_keep_phrases','must_not_invent','notes']
ADV_COLUMNS = ['id','sentence','why_naive_regex_fails','correct_expect','notes']
REQUIRED_SNAPSHOT = {'location','crowd','crowdSize','indoor','timeOfDay','tension','exits','props','present','companions','inventory','openingCover','aloneArrival'}
PATTERNS = {
    'PW_LAST_CONTAINER_UNGROUNDED','PW_CROWD_SIZE_OVERSTATE','PW_CROWD_ABSENCE_CONTRADICTION','PW_CROWD_PRESENCE_INVENTION',
    'PW_STEP_OUTSIDE_WHILE_INDOOR','PW_ENTER_BUILDING_WHILE_OUTDOOR','PW_UNTRACKED_TIME_SKIP','PW_EVENT_OVER_RETCON',
    'PW_UNGROUNDED_PAST_RETCON','PW_TENSION_DROP_CONTRADICTION','PW_LOCATION_AS_SPEAKER','PW_EXIT_WHITELIST_VIOLATION',
    'PW_INVENTORY_FACT_CONTRADICTION','PW_LEDGER_NUMBER_CONTRADICTION','PW_PRESENCE_ROSTER_CONTRADICTION',
    'PW_LOCATION_FACT_CONTRADICTION','PW_WEATHER_FACT_CONTRADICTION','PW_QUEST_FACT_CONTRADICTION'
}
PREFIX_CLASS = {'A':'A-turn','B':'B-opening','C':'C-quest','D':'D-prose','E':'E-chrome'}


def read_csv(name: str) -> tuple[list[str], list[dict[str,str]]]:
    with (ROOT/name).open('r',encoding='utf-8-sig',newline='') as f:
        r=csv.DictReader(f)
        return list(r.fieldnames or []), list(r)


def main() -> None:
    errors=[]
    warnings=[]
    scon,scenarios=read_csv('scenarios.csv')
    gcon,good=read_csv('good_prose.csv')
    acon,adv=read_csv('adversarial_almost_false.csv')
    if scon!=SCENARIO_COLUMNS: errors.append('scenarios header mismatch')
    if gcon!=GOOD_COLUMNS: errors.append('good_prose header mismatch')
    if acon!=ADV_COLUMNS: errors.append('adversarial header mismatch')
    if len(scenarios)<80: errors.append(f'scenarios count {len(scenarios)} < 80')
    if len(good)<20: errors.append(f'good count {len(good)} < 20')
    if len(adv)<40: errors.append(f'adversarial count {len(adv)} < 40')

    ids=[r['id'] for r in scenarios]
    if len(ids)!=len(set(ids)): errors.append('duplicate scenario IDs')
    expected_ids=[f'{p}{i:03d}' for p,n in [('A',22),('B',18),('C',16),('D',28),('E',16)] for i in range(1,n+1)]
    if ids!=expected_ids: errors.append('scenario ID sequence differs from A001-A022/B001-B018/C001-C016/D001-D028/E001-E016')

    class_counts=Counter(); gate_counts=Counter(); pattern_counts=Counter(); location_counts=Counter(); system_counts=Counter()
    coverage=defaultdict(list)
    for r in scenarios:
        rid=r['id']; prefix=rid[0]
        if r['class']!=PREFIX_CLASS[prefix]: errors.append(f'{rid}: class does not match prefix')
        if r['expect_hard_gate'] not in {'block','allow','skip'}: errors.append(f'{rid}: bad gate enum')
        if r['expect_facts_unchanged'] not in {'yes','no'}: errors.append(f'{rid}: bad facts enum')
        scrub=r['expect_warden_scrub']
        if scrub!='none' and scrub not in PATTERNS: errors.append(f'{rid}: bad scrub pattern')
        if not r['player_input'].strip() and prefix!='D': errors.append(f'{rid}: empty player_input outside D-prose')
        if r['expect_hard_gate']=='block' and len(r['player_input'].split())<3: errors.append(f'{rid}: implausibly short BLOCK input')
        if not r['fail_symptom'].strip(): errors.append(f'{rid}: empty fail_symptom')
        if not r['automated_assert'].strip(): errors.append(f'{rid}: empty automated_assert')
        if 'gate=' not in r['automated_assert'] or 'facts_unchanged=' not in r['automated_assert']: errors.append(f'{rid}: assertion DSL missing gate/facts keys')
        if not re.search(r'\b(EVIDENCED|SPECULATIVE)\b',r['notes']): errors.append(f'{rid}: notes missing evidence label')
        try: s=json.loads(r['setup_snapshot_json'])
        except json.JSONDecodeError as exc:
            errors.append(f'{rid}: invalid snapshot JSON {exc}'); continue
        missing=REQUIRED_SNAPSHOT-set(s)
        if missing: errors.append(f'{rid}: missing snapshot keys {sorted(missing)}')
        if s.get('crowd') not in {'present','none','unknown'}: errors.append(f'{rid}: bad crowd enum')
        if s.get('timeOfDay') not in {'morning','afternoon','evening','night','unknown'}: errors.append(f'{rid}: bad time enum')
        if s.get('tension') not in {'calm','tense','danger','combat','unknown'}: errors.append(f'{rid}: bad tension enum')
        if not isinstance(s.get('crowdSize'),int) or s.get('crowdSize')<0: errors.append(f'{rid}: bad crowdSize')
        for key in ['exits','props','present','companions','inventory']:
            if not isinstance(s.get(key),list): errors.append(f'{rid}: {key} is not a list')
        if s.get('crowd')=='none' and s.get('crowdSize')!=0: errors.append(f'{rid}: crowd none with nonzero size')
        if s.get('crowd')=='present' and s.get('crowdSize')<1: errors.append(f'{rid}: crowd present with size < 1')
        if r['expect_hard_gate']=='block' and 'api_calls=0' not in r['automated_assert']: errors.append(f'{rid}: BLOCK assertion lacks zero API call check')
        if prefix=='D' and scrub!='none' and 'offending_clause_absent=true' not in r['automated_assert']: errors.append(f'{rid}: scrub assertion lacks offending clause check')
        if prefix=='D' and scrub=='none' and 'prose_exactly_preserved=true' not in r['automated_assert']: errors.append(f'{rid}: no-scrub control lacks exact preservation check')
        if prefix=='E' and r['expect_hard_gate']=='block':
            for token in ['repair_banner=visible','draft_restored=exact','options_include=Look around|Check what you carry','cancel=enabled','text_turn_delta=0']:
                if token not in r['automated_assert']: errors.append(f'{rid}: chrome assertion lacks {token}')
        class_counts[r['class']]+=1; gate_counts[r['expect_hard_gate']]+=1; location_counts[s.get('location','')]+=1
        if scrub!='none': pattern_counts[scrub]+=1
        if 'LitRPG' in r['notes']: system_counts['LitRPG']+=1
        if 'story RPG' in r['notes']: system_counts['story RPG']+=1

        text=(r['last_gm_story']+' '+r['player_input']).lower()
        if r['expect_hard_gate']=='block' and re.search(r'last (box|crate|chest)',text) and not s.get('props') and not s.get('inventory'): coverage['last-box empty BLOCK'].append(rid)
        if r['expect_warden_scrub']=='PW_LAST_CONTAINER_UNGROUNDED' and re.search(r'last (box|crate|chest)|remaining crate|final chest',text): coverage['last-box prose scrub'].append(rid)
        if r['expect_hard_gate']=='allow' and re.search(r'box|crate|chest',text) and any(re.search(r'box|crate|chest',p,re.I) for p in s.get('props',[])): coverage['grounded box allow'].append(rid)
        if r['expect_hard_gate']=='allow' and re.search(r'\b[A-Z][a-z]+\b',r['player_input']) and not s.get('present') and r['last_gm_story']: coverage['last-story name allow'].append(rid)
        if r['expect_hard_gate']=='block' and re.search(r'companion|dog|knight|fox',r['player_input'],re.I): coverage['invent companion BLOCK'].append(rid)
        if r['expect_hard_gate']=='block' and re.search(r'\b(use|draw|wield)\b.*\b(sword|axe|dagger|spear|hook)\b',r['player_input'],re.I): coverage['missing weapon BLOCK'].append(rid)
        if r['expect_hard_gate']=='skip' and re.search(r'look around|examine the room|examine room',r['player_input'],re.I): coverage['look-around SKIP'].append(rid)
        if r['expect_hard_gate']=='skip' and s.get('openingCover'): coverage['opening cover SKIP'].append(rid)
        if r['expect_hard_gate']=='skip' and re.search(r'doors?.*windows?|windows?.*doors?',r['player_input'],re.I): coverage['layout SKIP'].append(rid)
        if r['expect_hard_gate']=='skip' and re.search(r'options?|panel|quest again',r['player_input'],re.I): coverage['info-option SKIP'].append(rid)

    if len(location_counts)<25: warnings.append(f'only {len(location_counts)} distinct scenario locations')
    if system_counts['LitRPG']==0 or system_counts['story RPG']==0: errors.append('system variation labels missing')
    missing_patterns=sorted(PATTERNS-set(pattern_counts))
    if missing_patterns: errors.append(f'missing patterns {missing_patterns}')

    for r in good:
        rid=r['id']
        try:s=json.loads(r['snapshot_json'])
        except json.JSONDecodeError as exc: errors.append(f'{rid}: invalid JSON {exc}'); continue
        if REQUIRED_SNAPSHOT-set(s): errors.append(f'{rid}: missing snapshot keys')
        if not r['must_keep_phrases'].strip(): errors.append(f'{rid}: empty must_keep_phrases')
        if not r['must_not_invent'].strip(): errors.append(f'{rid}: empty must_not_invent')
        if r['must_not_invent'].startswith('PW_'): errors.append(f'{rid}: must_not_invent is pattern ID, not concrete fact')
        if not re.search(r'\b(EVIDENCED|SPECULATIVE)\b',r['notes']): errors.append(f'{rid}: notes missing label')
        for phrase in [p.strip() for p in r['must_keep_phrases'].split('||')]:
            if phrase.lower() not in r['prose'].lower(): errors.append(f'{rid}: keep phrase not found verbatim: {phrase}')

    adv_counts=Counter()
    for r in adv:
        if r['correct_expect'] not in {'allow','scrub','skip'}: errors.append(f"{r['id']}: bad adversarial enum")
        if not re.search(r'\b(EVIDENCED|SPECULATIVE)\b',r['notes']): errors.append(f"{r['id']}: notes missing label")
        adv_counts[r['correct_expect']]+=1
    if adv_counts['allow']<=adv_counts['scrub']+adv_counts['skip']: errors.append('adversarial corpus is not mostly allow controls')

    required_coverage=['last-box empty BLOCK','last-box prose scrub','grounded box allow','last-story name allow','invent companion BLOCK','missing weapon BLOCK','look-around SKIP','opening cover SKIP','layout SKIP','info-option SKIP']
    for key in required_coverage:
        if not coverage[key]: errors.append(f'missing required coverage: {key}')

    report={
        'status':'PASS' if not errors else 'FAIL',
        'counts':{'scenarios':len(scenarios),'good_prose':len(good),'adversarial_almost_false':len(adv)},
        'class_counts':dict(sorted(class_counts.items())),
        'hard_gate_counts':dict(sorted(gate_counts.items())),
        'distinct_locations':len(location_counts),
        'system_note_counts':dict(sorted(system_counts.items())),
        'pattern_counts':dict(sorted(pattern_counts.items())),
        'adversarial_expect_counts':dict(sorted(adv_counts.items())),
        'coverage_hits':dict(sorted(coverage.items())),
        'warnings':warnings,
        'errors':errors,
    }
    (ROOT/'validation_report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report,indent=2))
    raise SystemExit(0 if not errors else 1)

if __name__=='__main__':
    main()
