from pathlib import Path

path = Path('/home/ubuntu/wof_depthfill_generate.py')
text = path.read_text(encoding='utf-8')
old_place = """        place={'id':pid,'publicName':n,'zoneId':f\"{w['id']}_zone_{1+i//3:02d}\",'role':role,'mapScale':scale,'dangerTier':'safe' if i<3 else ('medium' if i in [5,6] else 'low'),'outdoor':scale=='street','exits':list(dict.fromkeys(exits)),'npcIds':[],'dungeonId':f\"{w['id']}_dungeon_01\" if i==5 else None,'interactableIds':[], 'problem':problem}\\n        if w['id']=='brasswake' and i in [6,7]:\\n            place['airshipExits']=[{'id':f\"brasswake_air_{i+1:02d}\",'vehicle':'packet skiff','destinationPlaceId':'brasswake_place_08' if i==6 else 'brasswake_place_07','requires':'brasswake_kit_01 or brasswake_kit_03'}]\\n        places.append(place)"""
new_place = """        place={'id':pid,'publicName':n,'zoneId':f\"{w['id']}_zone_{1+i//3:02d}\",'role':role,'mapScale':scale,'dangerTier':'safe' if i<3 else ('medium' if i in [5,6] else 'low'),'outdoor':scale=='street','exits':list(dict.fromkeys(exits)),'npcIds':[],'dungeonId':f\"{w['id']}_dungeon_01\" if i==5 else None,'interactableIds':[], 'problem':problem}
        if w['id']=='brasswake' and i in [6,7]:
            place['airshipExits']=[{'id':f\"brasswake_air_{i+1:02d}\",'vehicle':'packet skiff','destinationPlaceId':'brasswake_place_08' if i==6 else 'brasswake_place_07','requires':'brasswake_kit_01 or brasswake_kit_03'}]
        places.append(place)"""
old_home = """    if w['id']=='homestead_ring':\\n        data['plotData']={'pools':[{'placeId':'homestead_ring_place_01','plotCount':48,'communityReserve':8,'upkeepGoldPerWeek':6},{'placeId':'homestead_ring_place_02','plotCount':64,'communityReserve':10,'upkeepGoldPerWeek':7}], 'deedTableFile':'WOF_Homestead_Ring_Deed_Tables.yaml', 'seizeAfterMissedWeeks':6, 'guestChestSteal':False}\\n    return data,places\\n\\ndef module_yaml():"""
new_home = """    if w['id']=='homestead_ring':
        data['plotData']={'pools':[{'placeId':'homestead_ring_place_01','plotCount':48,'communityReserve':8,'upkeepGoldPerWeek':6},{'placeId':'homestead_ring_place_02','plotCount':64,'communityReserve':10,'upkeepGoldPerWeek':7}], 'deedTableFile':'WOF_Homestead_Ring_Deed_Tables.yaml', 'seizeAfterMissedWeeks':6, 'guestChestSteal':False}
    return data,places

def module_yaml():"""
if old_place not in text:
    raise RuntimeError('Expected malformed place fragment not found')
if old_home not in text:
    raise RuntimeError('Expected malformed Homestead fragment not found')
text = text.replace(old_place, new_place, 1).replace(old_home, new_home, 1)
path.write_text(text, encoding='utf-8')
print('Repaired literal newline escapes in depth-fill generator.')
