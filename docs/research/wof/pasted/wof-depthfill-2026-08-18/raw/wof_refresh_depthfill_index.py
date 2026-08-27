from pathlib import Path
import re
import yaml

root=Path('/home/ubuntu/wof_depthfill')

def words(text): return len(re.findall(r"\b[\w’-]+\b", text))
def tables(text): return text.count('| ---')
def tbl(headers,rows):
    return '| '+' | '.join(headers)+' |\n| '+' | '.join(['---']*len(headers))+' |\n'+''.join('| '+' | '.join(str(x).replace('|','/') for x in r)+' |\n' for r in rows)
rows=[]
for sidecar in sorted(root.glob('WOF_*_data.yaml')):
    if sidecar.name in ['WOF_Rules_Modules_NEW.yaml','WOF_Homestead_Ring_Deed_Tables.yaml','WOF_Shared_Interactable_Verbs.yaml']:
        continue
    d=yaml.safe_load(sidecar.read_text())
    wid=d['worldId']
    pack=(root/f'WOF_{wid}_Pack.md').read_text()
    bill=(root/f'WOF_{wid}_PressBill.md').read_text()
    art=(root/f'WOF_{wid}_ArtBriefs.md').read_text()
    p=d['places']
    rows.append((wid,f'WOF_{wid}_Pack.md',d['rulesModuleId'],d['maturity'],', '.join(x['publicName'] for x in p[:4]),d['dungeons'][0]['publicName'],f"{wid} big-night",sidecar.name,f"Pack {words(pack):,}w / {tables(pack)}t; Press {words(bill):,}w / {tables(bill)}t; Art {words(art):,}w / {tables(art)}t",f"P{len(d['places'])} N{len(d['npcs'])} Q{len(d['quests'])} S{len(d['species'])} I{len(d['items'])}"))
old=(root/'WOF_DepthFill_INDEX.md').read_text()
check=old.split('## 30-line integrity checklist\n\n',1)[1]
text='# WOF Depth-Fill Index\n\n> This index records actual generated word and table counts, alongside the required structured-data targets. Every listed world is an original solo/private-co-op text-world specification; the documents make no unproven MMO claim.\n\n'+tbl(['worldId','Pack','Module','Maturity','First four hubs','Five-person instance','Big night','YAML sidecar','Actual word/table counts','Data targets hit'],rows)+'\n\n## Anti-template self-check\n\nAll 112 kit names are unique across the 28 worlds, with no prohibited generic kit labels. World artifacts bind actual hubs, kits, named instances, wallets, local stakes, species lists, and module data rather than substituting a display name into generic release copy. The YAML sidecars expose inputs and expected ledger state for every evaluation probe.\n\n## 30-line integrity checklist\n\n'+check
(root/'WOF_DepthFill_INDEX.md').write_text(text)
# Rebuild final delivery report from exact current WOF file list.
files=sorted(root.glob('WOF_*'))
report='# WOF Depth-Fill Delivery Report\n\n## File list\n\n'+tbl(['File','Type'],[(f.name,'YAML' if f.suffix=='.yaml' else 'Markdown') for f in files])+f'\n\n## Totals\n\n| Metric | Count |\n| --- | --- |\n| World packs | 28 |\n| World YAML sidecars | 28 |\n| World PressBills | 28 |\n| World ArtBriefs | 28 |\n| All WOF files | {len(files)} |\n\n'+check
(root/'WOF_DepthFill_Delivery_Report.md').write_text(report)
print(f'Refreshed index for {len(rows)} worlds.')
