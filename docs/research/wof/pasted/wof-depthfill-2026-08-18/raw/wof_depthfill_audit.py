from pathlib import Path
from collections import Counter
import re
import yaml

root=Path('/home/ubuntu/wof_depthfill')
report=[]
def check(label,ok,detail): report.append((label,'PASS' if ok else 'FAIL',detail))
def md_table(headers,rows):
    out='| '+' | '.join(headers)+' |\n| '+' | '.join(['---']*len(headers))+' |\n'
    return out+''.join('| '+' | '.join(map(str,r))+' |\n' for r in rows)

files=sorted(root.glob('WOF_*'))
yamls=sorted(root.glob('WOF_*.yaml'))
packs=sorted(root.glob('WOF_*_Pack.md'))
bills=sorted(root.glob('WOF_*_PressBill.md'))
arts=sorted(root.glob('WOF_*_ArtBriefs.md'))
check('file_count',len(files)==119,f'expected 119, found {len(files)}')
check('world_artifact_counts',len(packs)==len(bills)==len(arts)==28,f'packs={len(packs)} bills={len(bills)} arts={len(arts)}')
required_arrays=['places','npcs','kits','quests','species','items','dropTables','vendors','dungeons','talkTrees','choiceButtons','interactables','interiors','talents','evalProbes']
all_kits=[]; world_rows=[]; total_probes=0
for yp in sorted(root.glob('WOF_*_data.yaml')):
    try: data=yaml.safe_load(yp.read_text())
    except Exception as e: check(f'yaml_parse:{yp.name}',False,repr(e)); continue
    wid=data.get('worldId','')
    check(f'yaml_parse:{wid}',isinstance(data,dict),yp.name)
    check(f'schema:{wid}',data.get('packFormatVersion')==1 and all(k in data and isinstance(data[k],list) for k in required_arrays),'version and all mandatory arrays')
    ids=[]
    def walk(o):
        if isinstance(o,dict):
            if 'id' in o: ids.append(o['id'])
            for x in o.values(): walk(x)
        elif isinstance(o,list):
            for x in o: walk(x)
    walk(data)
    check(f'unique_ids:{wid}',len(ids)==len(set(ids)),f'ids={len(ids)} duplicates={len(ids)-len(set(ids))}')
    qok=all(isinstance(q.get('rewardGold'),int) and isinstance(q.get('rewardXp'),int) and q.get('objectives') for q in data['quests'])
    enum={'visit_place','ledger_kill','ledger_bond','deliver_item','talk_to_npc','collect_item','interact','score_beat','build_tick','hospitality_tick','lap_finish'}
    eok=all(o.get('kind') in enum and isinstance(o.get('count'),int) for q in data['quests'] for o in q['objectives'])
    counts=(len(data['places']),len(data['npcs']),len(data['kits']),len(data['quests']),len(data['species']),len(data['items']),len(data['dropTables']),len(data['choiceButtons']),len(data['talents']),len(data['evalProbes']))
    check(f'counts:{wid}',counts[0]>=8 and counts[1]>=8 and counts[2]==4 and counts[3]>=25 and counts[4]>=16 and counts[5]>=20 and counts[6]>=12 and counts[7]>=80 and counts[8]>=16 and counts[9]>=15,str(counts))
    check(f'quests:{wid}',qok and eok,'numeric rewards and typed code-completable objectives')
    check(f'instance:{wid}',len(data['dungeons'])==1 and len(data['dungeons'][0]['rooms'])==5 and any(r['checkpoint'] for r in data['dungeons'][0]['rooms']) and any(r['bossSpeciesId'] for r in data['dungeons'][0]['rooms']),'five rooms, checkpoint, boss')
    check(f'npc_talk:{wid}',len(data['talkTrees'])==10 and all(len(t.get('gossip',[]))==3 and all(k in t for k in ['greet','quest_offer','quest_progress','quest_turnin','refusal','player_rude']) for t in data['talkTrees']),'10 authored tree records with 3 gossips')
    check(f'wallets:{wid}',data['wallets']['goldName']!=data['wallets']['cosmeticTokenName'] and data['wallets']['noConversion'] is True,'separate named wallets')
    all_kits.extend(k['publicName'] for k in data['kits']); total_probes+=len(data['evalProbes'])
    world_rows.append((wid,*counts))
check('all_sidecars',len(world_rows)==28,f'valid sidecars={len(world_rows)}')
check('unique_kits',len(all_kits)==112 and len(set(all_kits))==112 and not set(all_kits)&{'Courier','Maker','Scout','Warden'},f'kit_count={len(all_kits)} unique={len(set(all_kits))}')
check('total_world_probes',total_probes==420,f'probes={total_probes}')
# Special world requirements
brass=yaml.safe_load((root/'WOF_brasswake_data.yaml').read_text())
sky=[p for p in brass['places'] if p.get('airshipExits')]
check('brasswake_sky_routes',len(sky)>=2 and all(p['airshipExits'] for p in sky),f'sky_pois={len(sky)}')
home=yaml.safe_load((root/'WOF_homestead_ring_data.yaml').read_text())
check('homestead_plot_data','plotData' in home and [p['plotCount'] for p in home['plotData']['pools']]==[48,64],str(home.get('plotData')))
for wid in ['civic_mile','third_cup']:
    data=yaml.safe_load((root/f'WOF_{wid}_data.yaml').read_text())
    check(f'{wid}_interior',len(data['interiors'][0]['rooms'])>=4,f"rooms={len(data['interiors'][0]['rooms'])}")
# Module contract
modules=yaml.safe_load((root/'WOF_Rules_Modules_NEW.yaml').read_text())
check('modules_parse',modules.get('packFormatVersion')==1 and len(modules['newModules'])==14,f"newModules={len(modules.get('newModules',{}))}")
for mid,m in modules['newModules'].items():
    check(f'module:{mid}',len(m['ledgerFields'])>=8 and len(m['statuses'])==12 and len(m['verbs'])==16 and len(m['chromeTemplates'])==8 and len(m['evalProbes'])==15,f"fields={len(m['ledgerFields'])} statuses={len(m['statuses'])} verbs={len(m['verbs'])} chrome={len(m['chromeTemplates'])} probes={len(m['evalProbes'])}")
# Markdown artifacts
for wrow in world_rows:
    wid=wrow[0]
    pack=(root/f'WOF_{wid}_Pack.md').read_text(); bill=(root/f'WOF_{wid}_PressBill.md').read_text(); art=(root/f'WOF_{wid}_ArtBriefs.md').read_text()
    pack_sections=['## 0. Header','## 1. Rules in this skin','## 2. Identity kits','## 3. Map and places — full graph','## 4. Durable NPCs and premade talk trees','## 5. Premade choices and first hour','## 6. Quests — code-completeable DAGs','## 7. Species, opponents, and collectibles','## 8. Loot and economy','## 9. Instances','## 10. Progression','## 11. Housing and objects','## 12. Theme Kit','## 13. Failures and defaults']
    check(f'pack_sections:{wid}',all(s in pack for s in pack_sections),'all 14 required pack sections')
    click=len(re.findall(rf'\b{wid}_click_\d{{2}}\b',bill)); ci=bill.count('|')
    check(f'press:{wid}',click==25 and 'Not ready / still CODE' in bill and 'FAQ' in bill,f'clicks={click}; press sections present')
    parts=re.split(r'^## `',art,flags=re.M)[1:]
    good=sum(1 for p in parts if len(re.findall(r"\b[\w’-]+\b",p))>=80)
    check(f'art:{wid}',len(parts)>=23 and good>=23,f'briefs={len(parts)} >=80words={good}')
# Use explicit banned terms as audit data, excluding these audit results from deliverables.
creative='\n'.join(p.read_text() for p in list(root.glob('WOF_*_Pack.md'))+list(root.glob('WOF_*_PressBill.md')))
for t in ['live SynapticGM','production app code','src/','Gloam Court Siege','Cinder-Court','Lantern Court Breach','saltwind_keeper']:
    check(f'absence:{t}',t not in creative,f'occurrences={creative.count(t)}')
# Create non-WOF audit output so the release set itself remains precisely 119 WOF files.
passed=sum(1 for r in report if r[1]=='PASS')
out='# WOF Depth-Fill Audit Results\n\n'+md_table(['Check','Result','Detail'],report)+f'\n**Outcome:** {passed}/{len(report)} checks passed.\n'
Path('/home/ubuntu/wof_depthfill_audit_results.md').write_text(out)
print(f'checks={len(report)} passed={passed} failed={len(report)-passed}')
for r in report:
    if r[1]=='FAIL': print('FAIL',r)
raise SystemExit(0 if passed==len(report) else 1)
