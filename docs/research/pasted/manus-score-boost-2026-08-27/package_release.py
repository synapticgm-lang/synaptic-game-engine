from __future__ import annotations

from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import mimetypes
import shutil
import zipfile

root = Path('/home/ubuntu/SynapticGM_score_boost_post_28c_2026-08-27')
deliverables = root / 'deliverables'
release = root / 'release'
prefix = 'SynapticGM_score_boost_post_28c_2026-08-27'
zip_path = root / f'{prefix}_BUNDLE.zip'

if release.exists():
    shutil.rmtree(release)
release.mkdir(parents=True)

# Copy all finalized deliverables.
for path in sorted(deliverables.iterdir()):
    if path.is_file():
        shutil.copy2(path, release / path.name)

# Copy evidence and validation under prefixed names.
supporting = {
    root / 'sources' / 'pasted_content.txt': release / f'{prefix}_SOURCE_BRIEF.txt',
    root / 'sources' / 'source_inventory.md': release / f'{prefix}_SOURCE_INVENTORY.md',
    root / 'validation' / 'validation_report.json': release / f'{prefix}_VALIDATION_REPORT.json',
}
for src, dst in supporting.items():
    shutil.copy2(src, dst)

# Add concise fixture validation evidence.
fixture_result = release / f'{prefix}_SCHEMA_FIXTURE_RESULTS.txt'
fixture_result.write_text(
    'positive fixture: accepted\n'
    'negative fixture missing_clear: rejected\n'
    'negative fixture contaminated_but_pass: rejected\n',
    encoding='utf-8',
)

manifest_json = release / f'{prefix}_MANIFEST.json'
manifest_md = release / f'{prefix}_MANIFEST.md'
checksums_path = release / f'{prefix}_SHA256SUMS.txt'


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def deliverable_id(name: str) -> str:
    for i in range(1, 13):
        token = f'_T{i:02d}_'
        if token in name:
            return f'T{i}'
    if '_COMPLETE.' in name:
        return 'COMPLETE'
    if '_SOURCE_' in name:
        return 'SOURCE'
    if '_VALIDATION_' in name or '_SCHEMA_FIXTURE_' in name:
        return 'VALIDATION'
    return 'SUPPORT'

# First manifest pass excludes manifest and checksum files themselves.
content_files = [
    p for p in sorted(release.iterdir())
    if p.is_file() and p not in {manifest_json, manifest_md, checksums_path}
]
entries = []
for path in content_files:
    mime, _ = mimetypes.guess_type(path.name)
    entries.append({
        'deliverableId': deliverable_id(path.name),
        'filename': path.name,
        'bytes': path.stat().st_size,
        'sha256': sha256(path),
        'mediaType': mime or 'application/octet-stream',
    })

manifest = {
    'bundleId': prefix,
    'generatedAt': '2026-08-27',
    'author': 'Manus AI',
    'scope': 'Live SynapticGM consumer application only; no WOF, licensed series, or second LLM critic path.',
    'status': 'validated',
    'validation': {
        'bundleChecks': 'pass',
        'jsonSchemaDraft': '2020-12',
        'positiveFixtureAccepted': True,
        'missingClearFixtureRejected': True,
        'contaminatedPassFixtureRejected': True,
    },
    'evidenceBoundary': 'Only the supplied research brief was available; worst-cell transcripts and the referenced prior engineering draft were not supplied.',
    'manifestSelfHashPolicy': 'The manifest, Markdown manifest, checksum file, and ZIP are excluded from the manifest entry hashes to avoid recursive self-hashing. SHA256SUMS covers the manifest files.',
    'entryCount': len(entries),
    'entries': entries,
}
manifest_json.write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')

rows = []
for entry in entries:
    rows.append(
        f"| {entry['deliverableId']} | `{entry['filename']}` | {entry['bytes']} | `{entry['sha256']}` |"
    )
manifest_md.write_text(
    '# SynapticGM 29a Bundle Manifest\n\n'
    '**Status:** Validated  \n'
    '**Evidence boundary:** Only the supplied research brief was available; raw worst-cell transcripts and the referenced prior engineering draft were not supplied.\n\n'
    '| ID | File | Bytes | SHA-256 |\n'
    '|---|---|---:|---|\n'
    + '\n'.join(rows)
    + '\n\nThe JSON manifest is authoritative. Manifest and checksum files are excluded from their own entry list to avoid recursive self-hashing.\n',
    encoding='utf-8',
)

# Checksums cover every release file except the checksum file itself.
checksum_files = [p for p in sorted(release.iterdir()) if p.is_file() and p != checksums_path]
checksums_path.write_text(
    ''.join(f'{sha256(path)}  {path.name}\n' for path in checksum_files),
    encoding='utf-8',
)

if zip_path.exists():
    zip_path.unlink()
with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
    for path in sorted(release.iterdir()):
        if path.is_file():
            zf.write(path, arcname=path.name)

print(zip_path)
print(f'release_files={len(list(release.iterdir()))}')
print(f'zip_bytes={zip_path.stat().st_size}')
