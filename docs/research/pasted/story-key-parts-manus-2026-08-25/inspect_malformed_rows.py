import csv
import json
from pathlib import Path

root = Path('/home/ubuntu/synapticgm_catalogue/fragments/csv')
report = {}
for family_id in ['fam-isekai-summon', 'fam-pyoa-mystery']:
    path = root / f'{family_id}.csv'
    with path.open(encoding='utf-8-sig', newline='') as handle:
        rows = list(csv.reader(handle))
    malformed = []
    for line_no, row in enumerate(rows[1:], start=2):
        if len(row) != len(rows[0]):
            malformed.append({'line': line_no, 'columns': len(row), 'cells': row})
    report[family_id] = {
        'header_columns': len(rows[0]),
        'malformed_count': len(malformed),
        'malformed_rows': malformed,
    }

Path('/home/ubuntu/synapticgm_catalogue/malformed_rows.json').write_text(
    json.dumps(report, indent=2), encoding='utf-8'
)
print(json.dumps({key: value['malformed_count'] for key, value in report.items()}, indent=2))
