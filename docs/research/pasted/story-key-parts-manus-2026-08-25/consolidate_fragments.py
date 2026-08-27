import csv
import io
import json
import os
import re
import shutil
import urllib.request
from pathlib import Path

ROOT = Path('/home/ubuntu/synapticgm_catalogue')
MANIFEST = Path('/home/ubuntu/generate_synapticgm_family_catalogues.json')
CSV_DIR = ROOT / 'fragments' / 'csv'
IDX_DIR = ROOT / 'fragments' / 'index'
CSV_DIR.mkdir(parents=True, exist_ok=True)
IDX_DIR.mkdir(parents=True, exist_ok=True)

EXPECTED_HEADER = [
    'family_id','axis_id','variant_id','title_short','pointer_location',
    'pointer_faction','pointer_intent','pointer_offer','pointer_beats',
    'pointer_fallback','never_lines','first_proof','kid_ok','kid_transform',
    'nsfw','inject_ok','founder_shape_cousin'
]

# The user's specification enumerates 17 fields although it describes them as an exact list.
EXPECTED_AXES = [
    'arrival','name_ask','kit_reveal','power_source','growth','system_voice',
    'hub','opposition','first_proof','crowd','offer','companion','identity_lock',
    'ending_logic'
]


def family_id_from_input(value: str) -> str:
    parts = [p.strip() for p in value.split('|')]
    if len(parts) < 2 or not parts[1].startswith('fam-'):
        raise ValueError(f'Cannot parse family_id from {value!r}')
    return parts[1]


def fetch_file(source: str, destination: Path) -> None:
    if source.startswith('http://') or source.startswith('https://'):
        request = urllib.request.Request(source, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(request, timeout=120) as response:
            destination.write_bytes(response.read())
    else:
        source_path = Path(source)
        if not source_path.exists():
            raise FileNotFoundError(source)
        shutil.copyfile(source_path, destination)


data = json.loads(MANIFEST.read_text(encoding='utf-8'))
results = data.get('results', [])
status = []

for item in results:
    family_id = family_id_from_input(item['input'])
    output = item.get('output') or {}
    error = item.get('error') or ''
    row = {'family_id': family_id, 'csv': 'missing', 'index': 'missing', 'map_issue': output.get('issues', ''), 'error': error}
    for key, dest_dir, suffix in [('csv_file', CSV_DIR, '.csv'), ('index_file', IDX_DIR, '.md')]:
        source = output.get(key)
        if not source:
            row['csv' if key == 'csv_file' else 'index'] = 'missing-source'
            continue
        destination = dest_dir / f'{family_id}{suffix}'
        try:
            fetch_file(source, destination)
            row['csv' if key == 'csv_file' else 'index'] = 'downloaded'
        except Exception as exc:
            row['csv' if key == 'csv_file' else 'index'] = f'error: {type(exc).__name__}: {exc}'
    status.append(row)

(ROOT / 'download_status.json').write_text(json.dumps(status, indent=2), encoding='utf-8')

# Merge CSV fragments while tolerating accidental duplicate headers.
all_rows = []
fragment_diagnostics = []
for path in sorted(CSV_DIR.glob('fam-*.csv')):
    family_id = path.stem
    text = path.read_text(encoding='utf-8-sig')
    reader = csv.reader(io.StringIO(text))
    records = list(reader)
    if not records:
        fragment_diagnostics.append({'family_id': family_id, 'error': 'empty fragment'})
        continue
    header = [cell.strip() for cell in records[0]]
    fragment_rows = records[1:]
    fragment_diagnostics.append({
        'family_id': family_id,
        'header_columns': len(header),
        'header': header,
        'data_rows': len(fragment_rows),
        'row_column_counts': sorted(set(len(r) for r in fragment_rows)),
    })
    if header != EXPECTED_HEADER:
        continue
    all_rows.extend(fragment_rows)

with (ROOT / 'tropes.csv').open('w', encoding='utf-8', newline='') as handle:
    writer = csv.writer(handle)
    writer.writerow(EXPECTED_HEADER)
    writer.writerows(all_rows)

(ROOT / 'fragment_diagnostics.json').write_text(json.dumps(fragment_diagnostics, indent=2), encoding='utf-8')

# Assemble index fragments beneath an executive preface.
index_parts = [
    '# SynapticGM Trope Catalogue Index',
    '',
    '**Author:** Manus AI',
    '',
    'This index records the pinned and free axes for every specified family, together with family-specific never-lines. The live catalogue remains an ingredient bank: each row is a pointer card for a writer, not a script to reproduce verbatim.',
    ''
]
for path in sorted(IDX_DIR.glob('fam-*.md')):
    index_parts.append(path.read_text(encoding='utf-8-sig').strip())
    index_parts.append('')
    index_parts.append('---')
    index_parts.append('')
(ROOT / 'catalogue_index.md').write_text('\n'.join(index_parts).rstrip() + '\n', encoding='utf-8')

print(json.dumps({
    'results_in_manifest': len(results),
    'csv_fragments_downloaded': len(list(CSV_DIR.glob('fam-*.csv'))),
    'index_fragments_downloaded': len(list(IDX_DIR.glob('fam-*.md'))),
    'merged_rows': len(all_rows),
    'status_file': str(ROOT / 'download_status.json'),
    'diagnostics_file': str(ROOT / 'fragment_diagnostics.json'),
}, indent=2))
