from pathlib import Path
import re
import requests

path = Path('/home/ubuntu/SynapticGM_story_craft_guides_2026-08-30.md')
text = path.read_text(encoding='utf-8')
refs = re.findall(r'^\[(\d+)\]:\s+(https?://\S+)', text, re.M)
rows = []
headers = {'User-Agent': 'Mozilla/5.0 citation-link-check'}
for num, url in refs:
    try:
        r = requests.get(url, headers=headers, timeout=20, allow_redirects=True, stream=True)
        status = r.status_code
        final = r.url
        ok = status < 400 or status in {401, 403, 429}
        note = 'reachable' if status < 400 else ('access-controlled but exists' if ok else 'broken')
    except Exception as exc:
        status = 'ERR'
        final = url
        ok = False
        note = type(exc).__name__
    rows.append((int(num), url, status, final, ok, note))

out = ['# Reference Link Check', '', '| Ref | Status | Result | URL |', '|---:|---:|---|---|']
for num, url, status, final, ok, note in sorted(rows):
    target = final if final != url else url
    out.append(f'| {num} | {status} | {"PASS" if ok else "FAIL"}: {note} | {target} |')
failed = [r for r in rows if not r[4]]
out += ['', f'**Summary:** {len(rows)-len(failed)}/{len(rows)} links reachable or access-controlled.']
Path('/home/ubuntu/SynapticGM_story_craft_guides_2026-08-30_link_check.md').write_text('\n'.join(out) + '\n', encoding='utf-8')
print(f'{len(rows)-len(failed)}/{len(rows)} links reachable or access-controlled')
for r in failed:
    print('FAIL', r[0], r[1], r[2], r[5])
raise SystemExit(1 if failed else 0)
