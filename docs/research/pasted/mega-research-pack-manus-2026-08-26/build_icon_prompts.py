#!/usr/bin/env python3
import csv
import json
from pathlib import Path

src = Path('/home/ubuntu/draft_inventory_icons.json')
out = Path('/home/ubuntu/SynapticGM_mega_research_pack_2026-08-25/item_icon_prompts.csv')
results = json.loads(src.read_text())['results']

brand_replacements = {
    'apple': 'specific fruit-shaped device mark',
    'iphone': 'specific phone model',
    'samsung': 'specific electronics brand',
    'android': 'specific mobile operating-system branding',
    'real-company': 'corporate',
}

# Founder-requested final split: 16 fantasy / 12 sci-fi / 12 urban.
category_overrides = {
    'pocket-compass': 'fantasy',
    'folded-trail-map': 'fantasy',
    'travel-sewing-kit': 'fantasy',
    'generic-smartphone': 'sci-fi',
    'signal-flare-tube': 'sci-fi',
}

def clean(text: str) -> str:
    for old, new in brand_replacements.items():
        text = text.replace(old, new).replace(old.title(), new)
    return ' '.join(text.split())

with out.open('w', newline='', encoding='utf-8') as f:
    fields = ['item_key','category','prompt_text','negative_prompt','kid_ok','notes']
    w = csv.DictWriter(f, fieldnames=fields)
    w.writeheader()
    seen = set()
    for r in results:
        if r.get('error'):
            raise RuntimeError(f"Draft failed for {r['input']}: {r['error']}")
        d = r['output']
        expected_key, expected_category = r['input'].split('|', 1)
        if d['item_key'] != expected_key or d['category'] != expected_category:
            raise ValueError(f"Input mismatch for {r['input']}: {d}")
        if d['item_key'] in seen:
            raise ValueError(f"Duplicate item key: {d['item_key']}")
        seen.add(d['item_key'])
        w.writerow({
            'item_key': d['item_key'],
            'category': category_overrides.get(d['item_key'], d['category']),
            'prompt_text': clean(d['prompt_text']) + ' Output as a single centered 128×128 pixel icon on a fully transparent alpha background.',
            'negative_prompt': clean(d['negative_prompt']),
            'kid_ok': 'YES',
            'notes': clean(d['notes']) + ' ORIGINAL SynapticGM asset brief; verify transparent alpha, silhouette, and accidental marks before shipping.'
        })

if len(seen) != 40:
    raise ValueError(f"Expected 40 items, got {len(seen)}")

with out.open(newline='', encoding='utf-8') as f:
    final_rows = list(csv.DictReader(f))
counts = {category: sum(1 for row in final_rows if row['category'] == category) for category in ('fantasy','sci-fi','urban')}
if counts != {'fantasy': 16, 'sci-fi': 12, 'urban': 12}:
    raise ValueError(f"Unexpected category counts: {counts}")
print(out)
