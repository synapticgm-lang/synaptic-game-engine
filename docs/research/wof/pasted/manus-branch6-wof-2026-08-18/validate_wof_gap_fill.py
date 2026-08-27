from pathlib import Path
import sys
try:
    import yaml
except ImportError:
    print('PyYAML unavailable')
    sys.exit(2)

root = Path('/home/ubuntu/WOF_GapFill_Library')
required = {
    'WOF_GapFill_INDEX.md','WOF_Rename_Table.md','WOF_Engine_Schemas.yaml',
    'WOF_Rules_Modules.yaml','WOF_Interactables_Buildings_Housing.yaml',
    'WOF_Vendors_Crafting_Gathering.yaml','WOF_AshCompact_LockedIds_Typed.yaml',
    'WOF_Badge_Circuit_Fill.md','WOF_Social_Mail_Moderation.md',
    'WOF_Combat_Instance_Net.md','WOF_Copy_Mail_UI_Errors.md',
    'WOF_Ops_Telemetry_Flags.md','WOF_PerWorld_Skin_Deltas.md',
    'WOF_Progression_LiveOps.yaml','WOF_Character_Alts_Safety.yaml',
    'WOF_Lore_Readables.yaml','WOF_Travel_Taxi_Ferry.yaml',
    'WOF_Memorable_Text_Plates.md','WOF_Audio_Cue_List.md'
}
missing = required - {p.name for p in root.iterdir() if p.is_file()}
if missing:
    print('MISSING:', ', '.join(sorted(missing)))
    sys.exit(1)
for path in sorted(root.glob('*.yaml')):
    try:
        yaml.safe_load(path.read_text())
    except Exception as exc:
        print(f'INVALID YAML {path.name}: {exc}')
        sys.exit(1)
locked = ['poi_reedfen_square','poi_millcross','poi_reedfen_marsh','poi_reedfen_hall','poi_reedfen_pier','poi_reedfen_mill','poi_reedfen_crossroads','poi_reedfen_marsh_edge','poi_lampwood_gate','poi_wickhaven','poi_lampwood_path','poi_wickhaven_loft','poi_ember_cut','poi_watch_lantern','poi_unlit_bend','poi_hollow_mouth','poi_brinewatch_dock','poi_coil_pier','poi_tidal_flats','poi_covenant_hall','poi_drying_racks','poi_stilt_walk','poi_flood_store','poi_anvil_gate','poi_granite_stair','poi_oath_hall','poi_ore_siding','poi_cut_face','poi_slag_run','poi_hollow_stair','poi_ash_seat','poi_tidehold']
ash = (root/'WOF_AshCompact_LockedIds_Typed.yaml').read_text()
absent = [x for x in locked if x not in ash]
if absent:
    print('MISSING LOCKED IDS:', ', '.join(absent))
    sys.exit(1)
for bad in ['Ember Crown','Pactbeasts of the Lanternwild','Hearth Ruin','Void Reach','Sky Frame']:
    if bad in ash:
        print('DUMP TITLE FOUND IN ASH DATA:', bad)
        sys.exit(1)
print(f'VALID: {len(required)} files, {len(list(root.glob("*.yaml")))} YAML files, {len(locked)} locked places retained')
