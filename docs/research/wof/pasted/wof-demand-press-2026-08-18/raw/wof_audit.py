from pathlib import Path
import re
import yaml

root = Path('/home/ubuntu/wof_release')
files = [p for p in root.glob('WOF_*') if p.name != 'WOF_Audit.md']
packs = sorted(root.glob('WOF_*_Pack.md'))
bills = sorted(root.glob('WOF_*_PressBill.md'))
report = []

def check(label, ok, detail):
    report.append((label, 'PASS' if ok else 'FAIL', detail))

check('total_files', len(files)==85, f'Expected 85, found {len(files)}')
check('new_packs', len(packs)==28, f'Expected 28, found {len(packs)}')
check('press_bills', len(bills)==51, f'Expected 51, found {len(bills)}')
spine_path = root/'WOF_Shared_Release_Spine.yaml'
try:
    spine = yaml.safe_load(spine_path.read_text())
    check('yaml_valid', isinstance(spine,dict), 'YAML parsed as mapping')
    check('yaml_version', spine.get('packFormatVersion')==1, f"packFormatVersion={spine.get('packFormatVersion')}")
    check('spine_unlocks', len(spine.get('worldUnlocks',[]))==51, f"worldUnlocks={len(spine.get('worldUnlocks',[]))}")
except Exception as e:
    check('yaml_valid', False, repr(e))
for p in packs:
    t=p.read_text()
    qs=len(re.findall(r'\b[a-z0-9_]+_q_\d{2}\b',t))
    nps=len(re.findall(r'\b[a-z0-9_]+_npc_\d{2}\b',t))
    bans=t.count('borrowed franchise kingdom')
    sections=['## 1. Header and identity','## 2. Rules module — CODE fields','## 3. Identity kits','## 4. Place graph','## 5. NPCs and premade talk','## 6. Opening choices and consequence policy','## 7. Quest catalogue','## 8. Species, companions, and collectibles','## 9. Loot and vendors','## 10. Instances and big night','## 11. Talent nodes','## 12. Theme Kit','## 13. Failure states and safety','## 14. Name and visual ban-list (50)']
    check(f'pack_sections:{p.stem}', all(s in t for s in sections), 'all 14 required pack sections')
    check(f'pack_counts:{p.stem}', qs>=18 and nps>=6 and bans==1, f'quests={qs}, npcs={nps}, 50-ban-section={bans}')
for p in bills:
    t=p.read_text()
    click=len(re.findall(r'\b[a-z0-9_]+_click_\d{2}\b',t))
    fest=len(re.findall(r'\b[a-z0-9_]+_fest_\d{2}\b',t))
    section_ok=all(s in t for s in ['## 0. Store identity','## 1. Why this world','## 2. Rules and code remaining','## 3. Content remaining versus friends-alpha','## 4. Art and images — briefs only','## 5. Audio','## 6. Live-ops and calendar','## 7. Legal and trust','## 8. QA and go-to-press gate','## 9. Press kit'])
    check(f'bill_sections:{p.stem}',section_ok,'all 10 mandatory press-bill sections')
    check(f'bill_counts:{p.stem}',click==25 and fest==12,f'click_tests={click}, festivals={fest}')
combined='\n'.join(p.read_text() for p in files if p.suffix in ('.md','.yaml'))
for term in ['live SynapticGM','Ember Crown','Hearth Ruin','Void Reach','Sky Frame','TBD']:
    check(f'forbidden:{term}',term not in combined,f"occurrences={combined.count(term)}")
# Required locked strings and bans of disallowed renames. Bills may not repeat setting bibles, but must never use bad names.
check('isekai_module','hp_check_floor_flags' in (root/'WOF_isekai_gate_PressBill.md').read_text(),'Isekai bill preserves locked module')
first=(root/'WOF_first_song_PressBill.md').read_text()
check('first_song_bad_names', all(x not in first for x in ['Gloam Court Siege','Cinder-Court','Lantern Court Breach']),'disallowed First-Song names absent')
bond=(root/'WOF_bonded_menagerie_PressBill.md').read_text()
check('bonded_bad_name','saltwind_keeper' not in bond,'disallowed Bonded name absent')
check('demand_rows', (root/'WOF_Demand_Vs_Have.md').read_text().count('|') >= 8*67, 'demand mapping table written')
check('art_catalog_rows', (root/'WOF_Art_Audio_Store_Catalog.md').read_text().count('.png') + (root/'WOF_Art_Audio_Store_Catalog.md').read_text().count('.ogg') >= 1632, 'asset catalog has expected filename inventory')

out=['# WOF Release Audit','', '| Check | Result | Detail |','| --- | --- | --- |']
out += [f'| {a} | **{b}** | {c} |' for a,b,c in report]
passes=sum(x[1]=='PASS' for x in report)
out += ['',f'**Audit outcome:** {passes}/{len(report)} checks passed.']
Path('/home/ubuntu/wof_audit_results.md').write_text('\n'.join(out)+'\n')
print(f'checks={len(report)} passed={passes} failed={len(report)-passes}')
for r in report:
    if r[1]=='FAIL': print('FAIL',r)
raise SystemExit(0 if passes==len(report) else 1)
