import json
from pathlib import Path
from urllib.request import urlopen

source = Path('/home/ubuntu/generate_wof_gap_fill_files.json')
out_dir = Path('/home/ubuntu/WOF_GapFill_Library')
out_dir.mkdir(exist_ok=True)
data = json.loads(source.read_text())
for item in data['results']:
    output = item['output']
    filename = output['filename']
    url = output['deliverable']
    content = urlopen(url, timeout=90).read()
    (out_dir / filename).write_bytes(content)
    print(f'{filename}: {len(content)} bytes')
