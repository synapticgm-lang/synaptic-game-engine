import csv
from pathlib import Path

root = Path('/home/ubuntu/synapticgm_catalogue')
with (root / 'tropes.csv').open(encoding='utf-8-sig', newline='') as handle:
    rows = list(csv.DictReader(handle))

wanted = [
    ('fam-pyoa-dark-romance','offer','01'),
    ('fam-pyoa-dark-romance','offer','08'),
    ('fam-village-soft','system_voice','01'),
    ('fam-rpg-custom','identity_lock','08'),
    ('fam-pyoa-mystery','first_proof','05'),
    ('fam-isekai-summon','kit_reveal','01'),
]

lines = ['# Focused QA Samples','']
for family_id, axis_id, number in wanted:
    suffix = f'-{number}'
    row = next(r for r in rows if r['family_id'] == family_id and r['axis_id'] == axis_id and r['variant_id'].endswith(suffix))
    lines.extend([
        f"## `{row['variant_id']}`",
        '',
        f"- **Title:** {row['title_short']}",
        f"- **Beats:** {row['pointer_beats']}",
        f"- **Fallback:** {row['pointer_fallback']}",
        f"- **First proof:** {row['first_proof']}",
        f"- **Flags:** kid_ok={row['kid_ok']}; nsfw={row['nsfw']}; inject_ok={row['inject_ok']}",
        f"- **Kid transform:** {row['kid_transform']}",
        ''
    ])
(root / 'qa_samples.md').write_text('\n'.join(lines).rstrip() + '\n', encoding='utf-8')
print(root / 'qa_samples.md')
