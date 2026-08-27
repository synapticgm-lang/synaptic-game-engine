from pathlib import Path
import json
import requests

index_path = Path('/home/ubuntu/synthesize_29a_architecture_packets.json')
out_dir = Path('/home/ubuntu/SynapticGM_score_boost_post_28c_2026-08-27/sources/packets')
out_dir.mkdir(parents=True, exist_ok=True)

names = [
    '01_encounter_terminal_fsm.md',
    '02_entity_and_status_firewall.md',
    '03_encounter_choice_compiler.md',
    '04_topic_and_pyoa_branch.md',
    '05_free_t12_and_score_ceiling.md',
    '06_backlog_and_eval_gates.md',
]

data = json.loads(index_path.read_text(encoding='utf-8'))
for name, row in zip(names, data['results'], strict=True):
    url = row['output']['draft_file']
    response = requests.get(url, timeout=60)
    response.raise_for_status()
    (out_dir / name).write_bytes(response.content)
    print(f'{name}\t{len(response.content)}')
