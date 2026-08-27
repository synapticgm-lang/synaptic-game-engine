import json
from pathlib import Path
from urllib.request import urlopen

source = Path('/home/ubuntu/generate_wof_optional_companions.json')
out_dir = Path('/home/ubuntu/WOF_GapFill_Library')
data = json.loads(source.read_text())
for item in data['results']:
    output = item['output']
    filename = output['filename']
    content = urlopen(output['deliverable'], timeout=90).read()
    (out_dir / filename).write_bytes(content)
    print(f'{filename}: {len(content)} bytes')
