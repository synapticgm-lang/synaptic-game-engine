import csv
import json
from pathlib import Path

root = Path('/home/ubuntu/SynapticGM_game_vibe_maxextract_2026-08-18')
required = [
    'README.md', '00_executive_vibe_scorecard.md',
    'V1_vibe_constitution_and_matrix.md', 'V2_it_heard_me_dialogue_and_repair.md',
    'V3_personality_system.md', 'V4_first_hour_hookarc.md',
    'V5_diegesis_system_tabletop_pyoa.md', 'V6_combat_quest_inventory_map_feel.md',
    'V7_themes_typography_audio_lite.md', 'V8_outside_game_patterns.md',
    'V9_ranked_vibe_differentiators.md', 'V10_build_backlog_and_anti_list.md',
    'V11_research_complete_checklist.md', 'synapticgm_vibe_spec.json',
    'synapticgm_vibe_backlog.csv', 'fresh_research_tracks.json',
    'fresh_research_tracks.csv', 'direct_research_validation.md'
]
missing = [name for name in required if not (root / name).is_file()]
if missing:
    raise SystemExit(f'Missing files: {missing}')

spec = json.loads((root / 'synapticgm_vibe_spec.json').read_text())
expected_authority = ['player_correction', 'pinned_canon', 'state_tx', 'scene_manifest', 'evidence', 'invention']
assert spec['authority_order'] == expected_authority, 'Authority order mismatch'
assert len(spec['personality_matrix']['profiles']) >= 12, 'Expected 12 profiles'
assert set(spec['never_lines_per_engine']) == {'lit_rpg', 'story_rpg', 'tabletop_fantasy', 'pyoa'}, 'Engine coverage mismatch'
assert set(spec['first_hour_beat_sheets']) == {'threshold_event', 'awakening_under_pressure'}, 'Beat sheets missing'
for sheet in spec['first_hour_beat_sheets'].values():
    assert len(sheet) == 10, 'Each beat sheet must contain 10 turns'

with (root / 'synapticgm_vibe_backlog.csv').open(newline='') as f:
    backlog = list(csv.DictReader(f))
assert len(backlog) >= 15, 'Backlog should contain at least 15 items'
assert {'priority', 'item', 'done_when_vibe_test'}.issubset(backlog[0]), 'Backlog column mismatch'

combined = '\n'.join(p.read_text() for p in root.glob('*.md'))
required_phrases = [
    'player correction', 'pinned canon', 'StateTx', 'SceneManifest',
    'SPECULATIVE', 'COUNSEL', 'No RAG-as-truth'
]
missing_phrases = [phrase for phrase in required_phrases if phrase not in combined]
if missing_phrases:
    raise SystemExit(f'Missing required concepts: {missing_phrases}')

print('PASS')
print(f'files={len(required)}')
print(f'profiles={len(spec["personality_matrix"]["profiles"])}')
print(f'backlog_items={len(backlog)}')
print('authority_order=verified')
print('beat_sheets=verified')
