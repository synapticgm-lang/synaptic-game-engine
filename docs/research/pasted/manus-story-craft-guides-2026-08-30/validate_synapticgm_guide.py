from pathlib import Path
import csv
import re

md_path = Path('/home/ubuntu/SynapticGM_story_craft_guides_2026-08-30.md')
csv_path = Path('/home/ubuntu/SynapticGM_story_craft_guides_2026-08-30_backlog.csv')
text = md_path.read_text(encoding='utf-8')

checks = []
def check(name, ok, detail=''):
    checks.append((name, bool(ok), detail))

for d in range(1, 11):
    check(f'D{d} present', f'D{d}.' in text, '')

for mode in ['`litrpg`', '`dnd`', '`rpg`', '`pyoa`']:
    check(f'{mode} mode present', mode in text, '')

# Per-mode DO/DON'T counts in D2.
mode_heads = [
    ('litrpg', '### `litrpg`'),
    ('dnd', '### `dnd`'),
    ('rpg', '### `rpg`'),
    ('pyoa', '### `pyoa`'),
]
for i, (mode, head) in enumerate(mode_heads):
    start = text.index(head, text.index('## D2.'))
    end = text.find('### `', start + len(head))
    if end == -1 or end > text.index('## D3.'):
        end = text.index('## D3.')
    section = text[start:end]
    do_match = re.search(r'#### DO\n\n(.*?)\n\n#### DON[’\']T', section, re.S)
    dont_match = re.search(r'#### DON[’\']T\n\n(.*?)\n\n#### Worked example', section, re.S)
    do_count = len(re.findall(r'^\d+\. ', do_match.group(1), re.M)) if do_match else 0
    dont_count = len(re.findall(r'^\d+\. ', dont_match.group(1), re.M)) if dont_match else 0
    check(f'{mode} DO count 8-12', 8 <= do_count <= 12, str(do_count))
    check(f'{mode} DONT count 8-12', 8 <= dont_count <= 12, str(dont_count))
    exact_rule = 'Do not recycle a prior beat, location essay, crisis line, or choice pad unless the player asked to repeat or restate.'
    check(f'{mode} shared hard rule exact', exact_rule in section, '')
    check(f'{mode} worked before/after', '**Before' in section and '**After' in section, '')
    if '#### AUTHORITY candidates (≤240 characters)' in section:
        auth_block = section.split('#### AUTHORITY candidates (≤240 characters)', 1)[1]
        lines = re.findall(r'^\d+\. (.+)$', auth_block, re.M)
    else:
        lines = []
    check(f'{mode} exactly 3 authority candidates', len(lines) == 3, str(len(lines)))
    for n, line in enumerate(lines, 1):
        plain = re.sub(r'\*\*', '', line).strip()
        check(f'{mode} authority {n} <=240 chars', len(plain) <= 240, str(len(plain)))

# D1 source rows per mode.
d1 = text[text.index('## D1.'):text.index('## D2.')]
source_sections = [
    ('pyoa_sources', '### PYOA / Gamebook / Choice-Based Fiction', '### Tabletop Fantasy'),
    ('dnd_sources', '### Tabletop Fantasy', '### Story RPG / Narrative RPG'),
    ('rpg_sources', '### Story RPG / Narrative RPG', '### LitRPG / Progression'),
    ('litrpg_sources', '### LitRPG / Progression', '## D2.'),
]
for name, a, b in source_sections:
    start = text.index(a)
    end = text.index(b, start) if b in text[start:] else len(text)
    sec = text[start:end]
    rows = [ln for ln in sec.splitlines() if ln.startswith('| [')]
    check(f'{name} count 8-15', 8 <= len(rows) <= 15, str(len(rows)))

check('D6 has 15 ranked rows', len(re.findall(r'^\| \d+ \|', text[text.index('## D6.'):text.index('## D7.')], re.M)) == 15, '')
check('D7 maps 80 rules', len(re.findall(r'^\| [LDRP]-(?:DO|DONT)-\d{2}\b', text[text.index('## D7.'):text.index('## D8.')], re.M)) == 80, '')
check('D9 has 12 gates', len(re.findall(r'^\| \d+ \|', text[text.index('## D9.'):text.index('## Final Wiring Recommendation')], re.M)) == 12, '')

with csv_path.open(newline='', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))
check('CSV required columns', list(rows[0].keys()) == ['id','mode','priority','owner','effort','depends-on','acceptance test'], str(list(rows[0].keys())))
check('CSV has backlog items', len(rows) >= 10, str(len(rows)))
check('CSV priorities valid', all(r['priority'] in {'P0','P1','P2'} for r in rows), '')
check('CSV owners valid', all(r['owner'] in {'prompt','ledger','eval'} for r in rows), '')

refs = set(re.findall(r'^\[(\d+)\]:', text, re.M))
cites = set(re.findall(r'\[(\d+)\](?!:)', text))
check('All citations defined', cites <= refs, f'missing={sorted(cites-refs)}')
check('At least 20 references', len(refs) >= 20, str(len(refs)))

report = ['# Validation Report', '']
for name, ok, detail in checks:
    report.append(f"- {'PASS' if ok else 'FAIL'} — {name}" + (f' ({detail})' if detail else ''))
report += ['', f'**Summary:** {sum(ok for _, ok, _ in checks)}/{len(checks)} checks passed.']
Path('/home/ubuntu/SynapticGM_story_craft_guides_2026-08-30_validation.md').write_text('\n'.join(report) + '\n', encoding='utf-8')

failed = [c for c in checks if not c[1]]
print(f'{len(checks)-len(failed)}/{len(checks)} checks passed')
for item in failed:
    print('FAIL:', item)
raise SystemExit(1 if failed else 0)
