#!/usr/bin/env python3
from pathlib import Path

root = Path(__file__).resolve().parent

patches = {
    'build_theme_prompts.py': [
        ("src = Path('/home/ubuntu/draft_theme_kits.json')\nout = Path('/home/ubuntu/SynapticGM_mega_research_pack_2026-08-25/theme_prompts.csv')",
         "root = Path(__file__).resolve().parent\nsrc = root / 'source_drafts/draft_theme_kits.json'\nout = root / 'theme_prompts.csv'")
    ],
    'build_icon_prompts.py': [
        ("src = Path('/home/ubuntu/draft_inventory_icons.json')\nout = Path('/home/ubuntu/SynapticGM_mega_research_pack_2026-08-25/item_icon_prompts.csv')",
         "root = Path(__file__).resolve().parent\nsrc = root / 'source_drafts/draft_inventory_icons.json'\nout = root / 'item_icon_prompts.csv'")
    ],
    'build_claim_banks.py': [
        ("root = Path('/home/ubuntu/SynapticGM_mega_research_pack_2026-08-25')\n\nclaim_data = json.loads(Path('/home/ubuntu/draft_claim_patterns.json').read_text())['results']\nadv_data = json.loads(Path('/home/ubuntu/draft_adversarial_sentences.json').read_text())['results']",
         "root = Path(__file__).resolve().parent\n\nclaim_data = json.loads((root / 'source_drafts/draft_claim_patterns.json').read_text())['results']\nadv_data = json.loads((root / 'source_drafts/draft_adversarial_sentences.json').read_text())['results']")
    ],
    'build_opener_examples.py': [
        ("src = Path('/home/ubuntu/draft_opener_families.json')\nout = Path('/home/ubuntu/SynapticGM_mega_research_pack_2026-08-25/opener_pointer_examples.md')",
         "root = Path(__file__).resolve().parent\nsrc = root / 'source_drafts/draft_opener_families.json'\nout = root / 'opener_pointer_examples.md'")
    ],
    'build_visible_moat_copy.py': [
        ("out = Path('/home/ubuntu/SynapticGM_mega_research_pack_2026-08-25/visible_moat_copy.csv')",
         "root = Path(__file__).resolve().parent\nout = root / 'visible_moat_copy.csv'")
    ],
    'build_cost_envelope.py': [
        ("root = Path('/home/ubuntu/SynapticGM_mega_research_pack_2026-08-25')",
         "root = Path(__file__).resolve().parent")
    ],
    'build_hook_sensitivity.py': [
        ("root = Path('/home/ubuntu/SynapticGM_mega_research_pack_2026-08-25')",
         "root = Path(__file__).resolve().parent")
    ],
    'build_audit_tracker.py': [
        ("root = Path('/home/ubuntu/SynapticGM_mega_research_pack_2026-08-25')",
         "root = Path(__file__).resolve().parent")
    ],
    'validate_pack.py': [
        ("root = Path('/home/ubuntu/SynapticGM_mega_research_pack_2026-08-25')",
         "root = Path(__file__).resolve().parent")
    ],
}

for filename, replacements in patches.items():
    path = root / filename
    text = path.read_text(encoding='utf-8')
    for old, new in replacements:
        if old not in text:
            raise RuntimeError(f'Expected text not found in {filename}: {old[:80]}')
        text = text.replace(old, new, 1)
    path.write_text(text, encoding='utf-8')
    print(f'patched {filename}')
