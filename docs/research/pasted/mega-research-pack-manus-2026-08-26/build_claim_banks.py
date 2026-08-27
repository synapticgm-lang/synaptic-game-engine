#!/usr/bin/env python3
import csv
import json
from pathlib import Path

root = Path('/home/ubuntu/SynapticGM_mega_research_pack_2026-08-25')

claim_data = json.loads(Path('/home/ubuntu/draft_claim_patterns.json').read_text())['results']
adv_data = json.loads(Path('/home/ubuntu/draft_adversarial_sentences.json').read_text())['results']

claim_fields = [
    'claim_type','fail_examples','leave_flair_examples','regex_or_token_cues',
    'rewrite_template_plain_english','snapshot_fields_required'
]
with (root / 'claim_pattern_bank.csv').open('w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=claim_fields)
    w.writeheader()
    seen = set()
    for r in claim_data:
        if r.get('error'):
            raise RuntimeError(f"Claim draft failed: {r}")
        d = r['output']
        if d['claim_type'] != r['input']:
            raise ValueError(f"Claim mismatch: {r['input']} vs {d['claim_type']}")
        if d['claim_type'] in seen:
            raise ValueError(f"Duplicate claim type: {d['claim_type']}")
        seen.add(d['claim_type'])
        w.writerow({k: ' '.join(d[k].split()) for k in claim_fields})
if len(seen) != 12:
    raise ValueError(f"Expected 12 claim types, got {len(seen)}")

adv_fields = ['test_id','claim_type','sentence','why_naive_regex_breaks','safe_handling']
with (root / 'adversarial_almost_false.csv').open('w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=adv_fields)
    w.writeheader()
    seen = set()
    for r in adv_data:
        if r.get('error'):
            raise RuntimeError(f"Adversarial draft failed: {r}")
        d = r['output']
        if d['test_id'] != r['input']:
            raise ValueError(f"Test mismatch: {r['input']} vs {d['test_id']}")
        if d['test_id'] in seen:
            raise ValueError(f"Duplicate test ID: {d['test_id']}")
        seen.add(d['test_id'])
        w.writerow({k: ' '.join(d[k].split()) for k in adv_fields})
if len(seen) != 40:
    raise ValueError(f"Expected 40 adversarial tests, got {len(seen)}")

print(root / 'claim_pattern_bank.csv')
print(root / 'adversarial_almost_false.csv')
