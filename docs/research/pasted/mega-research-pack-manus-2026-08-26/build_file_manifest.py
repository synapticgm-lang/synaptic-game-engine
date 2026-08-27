#!/usr/bin/env python3
import csv
import hashlib
from pathlib import Path

root = Path(__file__).resolve().parent
out = root / 'file_manifest.csv'

primary = {
    'README.md','research_manifest.md','asset_index.csv','intake_checklist.md','DO_NOT_USE.md',
    'share_alike_counsel_risk.csv','theme_prompts.csv','item_icon_prompts.csv',
    'memorable_plate_style_guide.md','map_chrome_prompts.md','claim_pattern_bank.csv',
    'adversarial_almost_false.csv','visible_moat_copy.csv','player_facing_cap_copy.csv',
    'opener_pointer_examples.md','skill_growth_patterns.md','free_cost_envelope.csv',
    'cost_methodology.md','cost_levers.csv','p0_trust_list.md','counsel_outline.md',
    'public_claim_register.csv','screenshot_audit_playbook.md','audit_tracker.csv',
    'model_price_reference.csv','hook_plus_8_sensitivity.csv','qa_report.md'
}

descriptions = {
    'README.md': 'Founder-facing pack map, import order, evidence labels, constraints, and next actions.',
    'research_manifest.md': 'Original research plan and artefact schema.',
    'asset_index.csv': 'Strict commercial-use CC0/MIT asset-source index with direct official downloads and provenance.',
    'intake_checklist.md': 'Third-party asset intake, licence, provenance, security, and release checklist.',
    'DO_NOT_USE.md': 'Release-blocking source, licence, and imitation exclusions.',
    'share_alike_counsel_risk.csv': 'Share-alike material isolated for counsel review.',
    'theme_prompts.csv': 'Twenty-two theme kits with three original generator roles each.',
    'item_icon_prompts.csv': 'Forty transparent 128×128 inventory icon prompts.',
    'memorable_plate_style_guide.md': 'Original ink-and-watercolour plate rules and twenty scene templates.',
    'map_chrome_prompts.md': 'Original map surface, topo, compass, and floor-fill prompts.',
    'claim_pattern_bank.csv': 'Twelve snapshot-backed claim-pattern rows.',
    'adversarial_almost_false.csv': 'Forty near-miss sentences protecting valid prose from naïve regex rewrites.',
    'visible_moat_copy.csv': 'One hundred twenty exact trust, repair, provenance, Kid, and negative-test strings.',
    'player_facing_cap_copy.csv': 'Honest Free-cap, refund, bonus, media, and optional-ad copy.',
    'opener_pointer_examples.md': 'Seventy-two page-one GM writer-training examples.',
    'skill_growth_patterns.md': 'Three original progression engines with fields, UI, guardrails, Kid rules, and thirty skills.',
    'free_cost_envelope.csv': 'Twenty-seven Free writer cost scenarios.',
    'cost_methodology.md': 'Dated model-price, fee, FX, token, formula, sensitivity, and exclusion methodology.',
    'cost_levers.csv': 'Ranked trust-preserving operating-cost levers.',
    'p0_trust_list.md': 'Trust guarantees that cost controls must not cut.',
    'counsel_outline.md': 'Solicitor question list and data-class governance table.',
    'public_claim_register.csv': 'Public claim substantiation gate; remembers-everything claim marked NO.',
    'screenshot_audit_playbook.md': 'Reproducible release-evidence method for desktop and mobile.',
    'audit_tracker.csv': 'Seventy-two dual-viewport audit rows, all honestly NOT RUN.',
    'model_price_reference.csv': 'Dated model ID and price reference for Free/Mid/High.',
    'hook_plus_8_sensitivity.csv': 'Incremental one-time New Game +8-turn sensitivity.',
    'qa_report.md': 'End-to-end package validation result and coverage statement.',
}


def classify(rel):
    name = rel.name
    rel_s = rel.as_posix()
    if rel_s in primary:
        return 'primary_deliverable', 'PRIMARY', descriptions.get(rel_s, '')
    if rel_s.startswith('source_drafts/'):
        return 'reviewed_source_draft', 'SUPPORT', 'Reviewed structured source used by a deterministic builder.'
    if name.startswith('build_') and name.endswith('.py'):
        return 'reproducibility_script', 'SUPPORT', 'Pack-authored portable deterministic builder.'
    if name == 'validate_pack.py':
        return 'validation_script', 'SUPPORT', 'Pack-authored end-to-end validator.'
    if name.startswith('research_notes_') or name == 'research_log_2026-08-25.md':
        return 'research_evidence', 'SUPPORT', 'Primary-source research note or evidence log.'
    if name.startswith('ambientcg_') or name.startswith('polyhaven_') or name.endswith('.tsv'):
        return 'raw_public_metadata', 'SUPPORT', 'Public catalog metadata or extracted evidence used for reproducibility.'
    if name == 'cost_summary_base.csv':
        return 'analysis_summary', 'SUPPORT', 'Compact extract of planning-base cost outcomes.'
    return 'supporting_file', 'SUPPORT', 'Supporting pack artefact.'

rows=[]
for path in sorted(root.rglob('*')):
    if not path.is_file() or path == out or path.name.endswith('.zip'):
        continue
    rel = path.relative_to(root)
    data = path.read_bytes()
    category, importance, description = classify(rel)
    rows.append({
        'path': rel.as_posix(),
        'category': category,
        'importance': importance,
        'size_bytes': len(data),
        'sha256': hashlib.sha256(data).hexdigest(),
        'description': description,
    })

with out.open('w', newline='', encoding='utf-8') as f:
    w=csv.DictWriter(f, fieldnames=['path','category','importance','size_bytes','sha256','description'])
    w.writeheader(); w.writerows(rows)
print(f'{out} rows={len(rows)} primary={sum(r["importance"]=="PRIMARY" for r in rows)} support={sum(r["importance"]=="SUPPORT" for r in rows)}')
