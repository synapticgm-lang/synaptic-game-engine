import json
from pathlib import Path
from urllib.request import urlopen

source = Path('/home/ubuntu/generate_wof_world_packs.json')
out_dir = Path('/home/ubuntu/WOF_Content_Packs')
out_dir.mkdir(exist_ok=True)
data = json.loads(source.read_text())
for item in data['results']:
    result = item['output']
    world_id = result['world_id']
    url = result['world_pack']
    target = out_dir / f'WOF_{world_id}_Pack.md'
    content = urlopen(url, timeout=60).read()
    target.write_bytes(content)
    print(f'{world_id}: {len(content)} bytes')
