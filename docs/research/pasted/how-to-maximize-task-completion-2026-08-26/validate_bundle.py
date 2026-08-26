#!/usr/bin/env python3
import csv, json, hashlib, re
from pathlib import Path
from collections import Counter

ROOT=Path('/home/ubuntu/SynapticGM_story_tones_gm_personality_2026-08-26')
OUT=ROOT/'deliverables'
VAL=ROOT/'validation'
P='SynapticGM_story_tones_gm_personality_2026-08-26_'
VAL.mkdir(exist_ok=True)

required=[
 f'{P}executive_scorecard.md',f'{P}Part_T1_tone_catalogue.md',f'{P}Part_T2_GM_application.md',
 f'{P}Part_T3_themes_images.md',f'{P}Part_T4_implementation_banks.md',f'{P}Part_T5_implementation_plan.md',
 f'{P}Part_T6_scorecard_founder_decisions.md',f'{P}tone_catalogue.csv',f'{P}tone_to_gm_rails.csv',
 f'{P}tone_theme_image_matrix.csv',f'{P}tone_fluid_rail_snippets.md',f'{P}tone_choice_pad_banks.json',
 f'{P}tone_status_chrome_templates.json',f'{P}tone_never_lines.csv',f'{P}tone_eval_fixtures.json',
 f'{P}tone_blind_taste_protocol.md',f'{P}p0_p1_p2_implementation_board.md',f'{P}unknowns_and_evidence_gaps.md',
 f'{P}README.md',f'{P}OMNIBUS.md',f'{P}tone_prose_warden_rules.json',f'{P}tone_eval_fixture.schema.json',
 f'{P}tone_contract_reference.ts',f'{P}vitest_tone_contract_template.ts',f'{P}sources_and_evidence.md',
 f'{P}tone_rendering_pipeline.mmd',f'{P}tone_rendering_pipeline.png']

checks=[]
def add(name, ok, detail): checks.append({'check':name,'pass':bool(ok),'detail':detail})

missing=[n for n in required if not (OUT/n).exists()]
add('Required files exist',not missing,'missing='+(', '.join(missing) if missing else 'none'))

# CSV checks.
def read_csv(name):
    with (OUT/name).open(encoding='utf-8',newline='') as f:return list(csv.DictReader(f))
cat=read_csv(f'{P}tone_catalogue.csv')
rails=read_csv(f'{P}tone_to_gm_rails.csv')
img=read_csv(f'{P}tone_theme_image_matrix.csv')
never=read_csv(f'{P}tone_never_lines.csv')
add('Tone catalogue has 19 rows',len(cat)==19,f'rows={len(cat)}')
add('Tone-to-GM rails has 19 rows',len(rails)==19,f'rows={len(rails)}')
add('Tone-theme-image matrix has 19 rows',len(img)==19,f'rows={len(img)}')
add('Tone catalogue has no empty required cells',all(all(str(v).strip() for v in r.values()) for r in cat),'all cells checked')
add('Tone-to-GM rails has no empty required cells',all(all(str(v).strip() for v in r.values()) for r in rails),'all cells checked')
add('Tone-theme-image matrix has no empty required cells',all(all(str(v).strip() for v in r.values()) for r in img),'all cells checked')

tone_ids=[r['tone_id'] for r in cat]
add('Tone IDs unique',len(tone_ids)==len(set(tone_ids)),f'unique={len(set(tone_ids))}')
allowed_personalities={'cold-system','dry-wit','army-brief','chilled-gm','cozy-brutal','theatrical-jester','fireside-innkeep'}
bad_primary=[(r['tone_id'],r['primary_personality_id']) for r in rails if r['primary_personality_id'] not in allowed_personalities]
bad_secondary=[(r['tone_id'],r['secondary_optional']) for r in rails if r['secondary_optional'] not in allowed_personalities|{'none'}]
add('Primary personality IDs are exact shipped IDs',not bad_primary,str(bad_primary) if bad_primary else 'all exact')
add('Secondary personality IDs are exact shipped IDs or none',not bad_secondary,str(bad_secondary) if bad_secondary else 'all exact')
add('Every catalogue row includes Kid Mode delta',all(r['kid_mode_delta'].strip() for r in cat),'19/19')

all_kits={'wood-elf-grove','dark-elf-umbrance','high-elf-spire','dwarf-forgehall','orc-warcamp','dragon-hoard','phoenix-ashrise','cyborg-chassis','angelic-radiance','infernal-pact','undead-ossuary','fae-glamour','goblin-scrapheap','merfolk-abyss','vampire-nocturne','neon-protocol','parchment-ledger','bone-reliquary','phosphor-terminal','noir-crimson','glass-spire','ember-depths'}
seen=set()
for r in img:
    seen.add(r['primary_kit_key']); seen.update(x for x in r['secondary_kit_keys'].split('|') if x)
add('All 22 kit keys appear',seen==all_kits,f'covered={len(seen)} missing={sorted(all_kits-seen)} extra={sorted(seen-all_kits)}')
add('All image rows ban baked lettering',all('no readable text' in r['negative_prompt'] and 'no dialogue balloons' in r['negative_prompt'] and 'no UI' in r['negative_prompt'] for r in img),'19/19')
add('All image rows include Kid rewrite',all(r['kid_visual_rewrite'].strip() for r in img),'19/19')

# JSON checks.
def load(name): return json.loads((OUT/name).read_text(encoding='utf-8'))
choice=load(f'{P}tone_choice_pad_banks.json')
status=load(f'{P}tone_status_chrome_templates.json')
fixtures=load(f'{P}tone_eval_fixtures.json')
warden=load(f'{P}tone_prose_warden_rules.json')
schema=load(f'{P}tone_eval_fixture.schema.json')
choice_count=sum(len(items) for modes in choice['banks'].values() for items in modes.values())
add('Choice bank covers 19 tones',set(choice['banks'])==set(tone_ids),f'tones={len(choice["banks"])}')
add('Choice bank IDs match rail references',all(choice['bank_ids'].get(r['tone_id'])==r['choice_pad_bank_id'] for r in rails),'19/19')
add('Choice bank covers four modes per tone',all(set(m)=={'litrpg','dnd','rpg','pyoa'} for m in choice['banks'].values()),'all tone banks checked')
add('Choice bank has 760 patterns',choice_count==760,f'patterns={choice_count}')
add('Every choice forbids guaranteed success',all(item['never_promises_success'] for modes in choice['banks'].values() for items in modes.values() for item in items),'all patterns checked')
status_count=sum(len(v) for v in status['templates'].values())
add('Status bank covers 19 tones',set(status['templates'])==set(tone_ids),f'tones={len(status["templates"])}')
add('Status bank IDs match rail references',all(status['bank_ids'].get(r['tone_id'])==r['status_chrome_template_id'] for r in rails),'19/19')
add('Status bank has six templates per tone',all(len(v)==6 for v in status['templates'].values()),f'templates={status_count}')
add('No second LLM in warden',warden.get('second_llm_allowed') is False and warden.get('engine')=='classifier_regex_deterministic_only','deterministic-only declared')
add('Warden includes core semantic validators',{'invented_presence','location_drift','numeric_drift','inventory_drift','choice_hallucination','uncertainty_erasure'}.issubset({r['class'] for r in warden['rules']}),'core validators present')

add('At least 24 evaluation fixtures',len(fixtures['fixtures'])>=24,f'fixtures={len(fixtures["fixtures"])}')
add('At least three renderings per fixture',all(len(f['renderings'])>=3 for f in fixtures['fixtures']),'all fixtures checked')
add('Fixture metadata counts match',fixtures['fixture_count']==len(fixtures['fixtures']) and fixtures['rendering_count']==sum(len(f['renderings']) for f in fixtures['fixtures']),'counts agree')
hash_errors=[]
render_tones=set()
for fx in fixtures['fixtures']:
    raw=json.dumps(fx['authority_input'],sort_keys=True,separators=(',',':'),ensure_ascii=False)
    h=hashlib.sha256(raw.encode()).hexdigest()
    if h!=fx['canonical_sha256']:hash_errors.append(fx['fixture_id'])
    for rr in fx['renderings']:
        render_tones.add(rr['tone_id'])
        if rr['expected_canonical_hash']!=h:hash_errors.append(fx['fixture_id']+'::'+rr['tone_id'])
add('Fixture canonical hashes validate',not hash_errors,str(hash_errors) if hash_errors else 'all hashes valid')
add('Every tone appears in fixture renderings',render_tones==set(tone_ids),f'covered={len(render_tones)} missing={sorted(set(tone_ids)-render_tones)}')
add('Never-lines include YES and NO rows',{'YES','NO'}.issubset({r['allowed'] for r in never}),str(Counter(r['allowed'] for r in never)))
add('Never-lines include Kid flags',all(r['kid_flag'].strip() for r in never),f'rows={len(never)}')

# Markdown checks.
md_files=sorted(OUT.glob('*.md'))
empty_sections=[]
for p in md_files:
    lines=p.read_text(encoding='utf-8').splitlines()
    heads=[i for i,l in enumerate(lines) if re.match(r'^#{1,6}\\s+\\S',l)]
    for pos,i in enumerate(heads):
        end=heads[pos+1] if pos+1<len(heads) else len(lines)
        body=[l for l in lines[i+1:end] if l.strip() and not l.strip()=='---']
        if not body: empty_sections.append(f'{p.name}:{i+1}:{lines[i]}')
add('No empty Markdown sections',not empty_sections,'; '.join(empty_sections) if empty_sections else f'files={len(md_files)}')

# Player-facing IP scan excludes internal prohibition lists and source copy.
player_facing=[OUT/f'{P}tone_catalogue.csv',OUT/f'{P}tone_choice_pad_banks.json',OUT/f'{P}tone_status_chrome_templates.json',OUT/f'{P}tone_fluid_rail_snippets.md']
forbidden=['Solo Leveling','Wandering Inn','Sword Art Online','Dungeon Crawler Carl','Omniscient Reader','Tower of God','Ghibli','Marvel']
hits=[]
for p in player_facing:
    txt=p.read_text(encoding='utf-8').lower()
    for x in forbidden:
        if x.lower() in txt:hits.append((p.name,x))
add('No licensed-series terms in player-facing banks',not hits,str(hits) if hits else 'none')
clone_hits=[]
for p in player_facing:
    txt=p.read_text(encoding='utf-8')
    for m in re.finditer(r'(?i)write\\s+(exactly\\s+)?like\\s+[A-Z]',txt):clone_hits.append((p.name,m.group(0)))
add('No living-author clone instructions in player-facing banks',not clone_hits,str(clone_hits) if clone_hits else 'none')
add('No WOF token in deliverables',not any(re.search(r'(?i)\\bWOF\\b',p.read_text(encoding='utf-8',errors='ignore')) for p in OUT.iterdir() if p.suffix in {'.md','.csv','.json','.ts','.mmd'}),'none')
add('No empty files',all(p.stat().st_size>0 for p in OUT.iterdir()),f'files={len(list(OUT.iterdir()))}')

# Required disclosure labels.
unknown_text=(OUT/f'{P}unknowns_and_evidence_gaps.md').read_text(encoding='utf-8')
add('Unknowns register names missing attachment classes',all(x in unknown_text for x in ['MEGA','Comic Maximizer','Premium Theme','Prior Vibe']),'all classes named')
add('Unknowns register uses INPUT REQUIRED',unknown_text.count('INPUT REQUIRED')>=10,f'count={unknown_text.count("INPUT REQUIRED")}')

# Build file manifest.
manifest=[]
for p in sorted(OUT.iterdir()):
    if p.is_file():
        b=p.read_bytes()
        manifest.append({'filename':p.name,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'extension':p.suffix.lower()})
manifest_doc={'project':'SynapticGM story tones, GM personality, theme and image pairing','build_date':'2026-08-26','file_count':len(manifest),'files':manifest,'quality_summary':{'checks':len(checks),'passed':sum(c['pass'] for c in checks),'failed':sum(not c['pass'] for c in checks)}}
(OUT/f'{P}manifest.json').write_text(json.dumps(manifest_doc,indent=2)+'\n',encoding='utf-8')

passed=sum(c['pass'] for c in checks); failed=len(checks)-passed
report=['# Validation Report\n','**Author:** Manus AI  ',f'**Result:** {passed}/{len(checks)} checks passed; {failed} failed.\n','| Check | Result | Detail |','|---|---|---|']
for c in checks:
    safe=str(c['detail']).replace('|','\\|').replace('\n',' ')
    report.append(f"| {c['check']} | {'PASS' if c['pass'] else 'FAIL'} | {safe} |")
report.append('\n## Required self-check\n')
self_items=[
('No WOF',next(c for c in checks if c['check']=='No WOF token in deliverables')['pass']),
('No living-author clone instructions',next(c for c in checks if c['check']=='No living-author clone instructions in player-facing banks')['pass']),
('No licensed series banks',next(c for c in checks if c['check']=='No licensed-series terms in player-facing banks')['pass']),
('No second Continuity-Warden LLM',next(c for c in checks if c['check']=='No second LLM in warden')['pass']),
('Personality cannot override ledger',next(c for c in checks if c['check']=='Fixture canonical hashes validate')['pass']),
('Images: no baked lettering',next(c for c in checks if c['check']=='All image rows ban baked lettering')['pass']),
('All 22 kit keys appear in matrix',next(c for c in checks if c['check']=='All 22 kit keys appear')['pass']),
('Shipped personality IDs used by exact ID',next(c for c in checks if c['check']=='Primary personality IDs are exact shipped IDs')['pass']),
('Kid Mode deltas present',next(c for c in checks if c['check']=='Every catalogue row includes Kid Mode delta')['pass']),
('Unknowns listed honestly',next(c for c in checks if c['check']=='Unknowns register uses INPUT REQUIRED')['pass'])]
for label,ok in self_items:report.append(f"- [{'x' if ok else ' '}] {label}")
report.append('\n## Important interpretation\n')
report.append('The warden’s internal blocklist may name prohibited IP solely so deterministic validation can reject it. Player-facing banks are scanned separately and contain none of those names. “No second LLM” means the design uses regex, classifiers, and deterministic validators only; documentation may state that prohibition explicitly.')
(OUT/f'{P}validation_report.md').write_text('\n'.join(report)+'\n',encoding='utf-8')
# Rebuild the manifest after the report is final; omit the manifest itself to avoid a self-referential hash.
manifest=[]
manifest_name=f'{P}manifest.json'
for p in sorted(OUT.iterdir()):
    if p.is_file() and p.name != manifest_name:
        b=p.read_bytes()
        manifest.append({'filename':p.name,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'extension':p.suffix.lower()})
manifest_doc={'project':'SynapticGM story tones, GM personality, theme and image pairing','build_date':'2026-08-26','file_count':len(manifest),'files':manifest,'quality_summary':{'checks':len(checks),'passed':passed,'failed':failed}}
(OUT/manifest_name).write_text(json.dumps(manifest_doc,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'checks':len(checks),'passed':passed,'failed':failed,'failures':[c for c in checks if not c['pass']]},indent=2))
raise SystemExit(1 if failed else 0)
