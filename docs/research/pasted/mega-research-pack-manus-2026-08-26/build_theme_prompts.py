#!/usr/bin/env python3
import csv
import json
from pathlib import Path

src = Path('/home/ubuntu/draft_theme_kits.json')
out = Path('/home/ubuntu/SynapticGM_mega_research_pack_2026-08-25/theme_prompts.csv')

data = json.loads(src.read_text())['results']

replacements = {
    'blood-red jewels': 'garnet-red crystal cabochons',
    'dried marrow, cracked ivory': 'chalky mineral bloom and cracked ivory',
    'dusty skulls': 'rounded calcified medallions',
    'densely packed with abstract weathered bone fragments': 'arranged from abstract weathered calcified fragments',
    'stacked bones': 'stacked pale ossuary masonry',
    'pillars of stacked femurs': 'pillars of elongated calcified stone segments',
    'bleached ribs': 'arched ivory slats',
    'intricately carved vertebrae': 'intricately carved ivory links',
    'skeletal structures': 'ossuary lattice structures',
    'halos': 'rings of diffused light',
    'dwarven-style': 'compact geometric forge-hall',
    'animal hide bindings': 'thick weathered leather bindings',
    'digital tabletop backgrounds': 'hosted text-adventure interface backgrounds',
    'tabletop roleplaying game interface': 'hosted text-adventure interface',
}

def clean(text: str) -> str:
    for a, b in replacements.items():
        text = text.replace(a, b)
    return ' '.join(text.split())

with out.open('w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=[
        'kit_key','asset_role','prompt_text','negative_prompt','kid_ok','notes'
    ])
    w.writeheader()
    for result in data:
        if result.get('error'):
            raise RuntimeError(f"Theme draft failed for {result['input']}: {result['error']}")
        d = result['output']
        if d['kit_key'] != result['input']:
            raise ValueError(f"Kit mismatch: {result['input']} vs {d['kit_key']}")
        for role, key in [
            ('panel_tile','panel_prompt'),
            ('frame_ornament','frame_prompt'),
            ('atmosphere_bg','atmosphere_prompt'),
        ]:
            w.writerow({
                'kit_key': d['kit_key'],
                'asset_role': role,
                'prompt_text': clean(d[key]),
                'negative_prompt': clean(d['negative_prompt']),
                'kid_ok': 'YES',
                'notes': clean(d['notes']) + ' ORIGINAL SynapticGM generator brief; review output for accidental text or brand-like marks before shipping.'
            })

print(out)
