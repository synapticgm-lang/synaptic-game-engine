#!/usr/bin/env python3
"""Generates original, IP-fenced WOF Gloamwild v1 data. No external data or names."""
import csv, json
from pathlib import Path

out = Path('/home/ubuntu/wof_gloamwild_data')
out.mkdir(exist_ok=True)

types = ['Ember','Tide','Gale','Root','Stone','Veil','Spark','Gloom','Gleam','Bloom']
advantages = {
 'Ember':['Bloom','Root'], 'Tide':['Ember','Stone'], 'Gale':['Tide','Bloom'], 'Root':['Tide','Stone'],
 'Stone':['Spark','Gloom'], 'Veil':['Root','Gale'], 'Spark':['Tide','Veil'], 'Gloom':['Gleam','Bloom'],
 'Gleam':['Gloom','Veil'], 'Bloom':['Stone','Ember']}
resists = {t:[a for a, targets in advantages.items() if t in targets] for t in types}
statuses = [
 {'id':'scorch','effect':'-10% DEF for 2 turns; refreshes, does not stack.'},
 {'id':'soak','effect':'Tide damage taken +15% for 2 turns.'},
 {'id':'gusted','effect':'SPD -12% for 2 turns.'},
 {'id':'rooted','effect':'Cannot swap voluntarily for 1 turn.'},
 {'id':'cracked','effect':'DEF -15% for 2 turns.'},
 {'id':'veiled','effect':'Next hostile move accuracy -20%.'},
 {'id':'charged','effect':'Next Spark strike gains +12 power, then clears.'},
 {'id':'fogblind','effect':'Accuracy -15% for 2 turns.'},
 {'id':'glimmered','effect':'FOC +12% for 2 turns.'},
 {'id':'spored','effect':'Heal received -20% for 2 turns.'}]

moves=[]
for ti,t in enumerate(types):
    roots = {'Ember':['Coal','Cinder','Hearth','Flare','Sear','Kiln','Ash'], 'Tide':['Rill','Current','Brine','Wash','Undertow','Swell','Spray'], 'Gale':['Draft','Whirl','Kite','Shear','Lift','Gust','Skirl'], 'Root':['Briar','Vine','Bark','Sprout','Thorn','Moss','Tangle'], 'Stone':['Shard','Cairn','Flint','Gravel','Pillar','Ridge','Slate'], 'Veil':['Hush','Fold','Wisp','Mirror','Curtain','Loom','Shade'], 'Spark':['Arc','Static','Pulse','Coil','Relay','Flicker','Volt'], 'Gloom':['Dusk','Murk','Sable','Eclipse','Nettle','Umber','Hollow'], 'Gleam':['Dawn','Prism','Halo','Beacon','Luster','Ray','Pearl'], 'Bloom':['Pollen','Petal','Nectar','Bud','Meadow','Crown','Breeze']}[t]
    for j,root in enumerate(roots):
        cat = ['strike','guard','support'][j%3]
        power = 36 + (j%4)*16 if cat=='strike' else 0
        acc = 94 - (j%3)*4 if cat=='strike' else 100
        effect = statuses[(ti+j)%len(statuses)]['id'] if cat=='strike' else ('guard +18% DEF for 1 turn' if cat=='guard' else 'restore 14% HP or clear one matching status')
        moves.append({'id':f'move.{t.lower()}.{j+1}','name':f'{root} '+(['Tap','Ward','Turn','Lance','Step','Shell','Call'][j]),'type':t,'category':cat,'power':power,'accuracy':acc,'effects':effect,'learnLevels':f'{1+j*5}+'})

# Ten signature moves complete the 80-move v1 library.
for ti,t in enumerate(types):
    moves.append({'id':f'move.{t.lower()}.signature','name':f'{t} Accord','type':t,'category':'support','power':0,'accuracy':100,'effects':f'grant {statuses[ti]["id"]} resistance and restore 8% HP','learnLevels':'22+'})

# 20 original evolution lines: 3x3 starter lines + 17x2 lines.
lines=[
 ('ember','Cindlet','Brazel','Kilmane','Ember','Cinder warrens'),('tide','Rillip','Sluicefin','Estuarion','Tide','Tidelane pools'),('root','Budmote','Bramblem','Canoprowl','Root','Moss orchard'),
 ('gale','Pipwing','Kestrelume',None,'Gale','Wind steps'),('stone','Pebbit','Cairnox',None,'Stone','Granite Stair'),('veil','Murmurkin','Curtainel',None,'Veil','Lampwood'),
 ('spark','Twitchcoil','Arcloom',None,'Spark','Storm relay'),('gloom','Mirepup','Duskmaw',None,'Gloom','Reedfen dusk'),('gleam','Glimbit','Auricant',None,'Gleam','Dawn terraces'),
 ('bloom','Nectlet','Crowncap',None,'Bloom','Hearth meadows'),('ember','Sootib','Kilncrest',None,'Ember','Ash kiln'),('tide','Bristleek','Brinehart',None,'Tide','Brinewatch'),
 ('gale','Flitsail','Cloudrake',None,'Gale','High passes'),('root','Tendrill','Barkhollow',None,'Root','Old hedge'),('stone','Flintle','Ridgebacket',None,'Stone','Quarry lanes'),
 ('veil','Gleamoth','Foldmoth',None,'Veil','Night lanterns'),('spark','Nodlet','Relayram',None,'Spark','Copper fields'),('gloom','Pallpup','Hollowmane',None,'Gloom','Fog bog'),
 ('gleam','Pearlkin','Beaconjaw',None,'Gleam','White shoals'),('bloom','Mossip','Orchardhorn',None,'Bloom','Hearth rows')]

creatures=[]
def stats(stage, idx):
    base={'juvenile':(38,32,30,38,34),'adult':(62,56,52,55,51),'apex':(88,79,76,72,74)}[stage]
    return dict(zip(['HP','ATK','DEF','SPD','FOC'], [x+((idx*7+i*3)%12) for i,x in enumerate(base)]))

def add_creature(name, family, stage, typ, habitat, rarity, idx, evo=None, tags=''):
    typ = typ.title()
    mm=[m for m in moves if m['type']==typ]
    selected=[mm[(idx+i*2)%len(mm)]['id'] for i in range(4)]
    creatures.append({'id':'creature.'+name.lower().replace(' ','-'),'name':name,'speciesFamily':family,'stage':stage,'types':[typ], 'stats':stats(stage,idx),'moves':selected,'abilities':[f'ability.{typ.lower()}.pulse',f'ability.{typ.lower()}.ward'], 'habitat':habitat,'rarity':rarity,'bindDifficulty':{'C':18,'U':32,'R':48,'SR':66,'UR':84}[rarity], 'evolutionPath':evo or 'single-stage', 'lootMaterials':[f'{typ.lower()}-trace', 'soft-husk'] if stage!='apex' else [f'{typ.lower()}-core','apex-fiber'], 'kidSafe':True,'tags':tags,'description':f'A {stage} {typ.lower()}-aligned {family.lower()} known for its distinct trail and temper.'})

idx=0
for typ,a,b,c,_,hab in lines:
    names=[a,b]+([c] if c else [])
    for n,st in zip(names,['juvenile','adult']+(['apex'] if c else [])):
        evo=' > '.join(names)
        add_creature(n, a+' line', st, typ, hab, 'C' if st=='juvenile' else ('U' if st=='adult' else 'R'), idx, evo, 'evolution-line')
        idx+=1

# 77 single-stage entries = 120 total. Includes 6 regional legendary and 15 dungeon-only.
singles=[
 ('Marlip','Tide','Brinewatch tidepools','C','coast'),('Salthush','Veil','Brinewatch flats','U','coast'),('Kelpaddle','Root','Brinewatch reeds','C','coast'),('Shoalspike','Stone','Brinewatch shelves','R','coast'),('Driftdot','Gale','Brinewatch spray','C','coast'),('Coralurk','Gloom','Brinewatch caves','R','coast'),
 ('Grittern','Stone','Granite Stair scree','C','mountain'),('Pineclink','Spark','Granite Stair cables','U','mountain'),('Snowmoss','Bloom','Granite Stair ledges','C','mountain'),('Ridgeveil','Veil','Granite Stair fogline','R','mountain'),('Craggleam','Gleam','Granite Stair sun faces','U','mountain'),('Fumehorn','Ember','Granite Stair vents','R','mountain'),
 ('Lampet','Gleam','Lampwood night road','C','night'),('Wickwyrm','Ember','Lampwood night road','U','night'),('Hushhare','Veil','Lampwood thickets','C','night'),('Nightsilt','Gloom','Lampwood ditches','U','night'),('Mothroot','Root','Lampwood groves','R','night'),('Chimegale','Gale','Lampwood arches','R','night'),
 ('Vaultmidge','Spark','Understep vaults','U','dungeon'),('Basaltick','Stone','Understep vaults','C','dungeon'),('Charspore','Ember','Understep vaults','U','dungeon'),('Blindbloom','Bloom','Understep vaults','R','dungeon'),('Sluicewraith','Tide','Understep cisterns','R','dungeon'),('Hollowgale','Gale','Understep shafts','R','dungeon'),('Veilclast','Veil','Understep mirrors','SR','dungeon'),('Gloomskein','Gloom','Understep galleries','SR','dungeon'),('Prismknuckle','Gleam','Understep reliquary','SR','dungeon'),('Briarbulk','Root','Understep roots','R','dungeon'),('Coilshard','Spark','Understep relays','R','dungeon'),('Cairnjaw','Stone','Understep quarry','SR','dungeon'),('Ashmolt','Ember','Understep kiln','R','dungeon'),('Necterra','Bloom','Understep garden','SR','dungeon'),('Rillvault','Tide','Understep reservoir','R','dungeon'),
 ('Grainpuff','Bloom','Hearth fields','C','hearth'),('Sootfinch','Ember','Hearth chimneys','C','hearth'),('Buttonhoof','Stone','Hearth lanes','U','hearth'),('Flickerpup','Spark','Hearth sheds','C','hearth'),('Dewcurl','Tide','Hearth wells','C','hearth'),('Hedgeloom','Veil','Hearth hedges','U','hearth'),
 ('Reedglider','Gale','Reedfen','C','fen'),('Bogbell','Gloom','Reedfen','U','fen'),('Mirecrown','Bloom','Reedfen','R','fen'),('Sedgejaw','Root','Reedfen','U','fen'),('Fenflash','Spark','Reedfen storms','R','fen'),('Siltlamp','Gleam','Reedfen pools','U','fen'),
 ('Dawnmantle','Gleam','Dawn terraces','R','legend'),('Cinderstag','Ember','Ash Compact border','SR','legend'),('Tidevault','Tide','Brinewatch deeps','SR','legend'),('Granite Oracle','Stone','Granite Stair summit','UR','legend'),('Lantern Comet','Veil','Lampwood sky-road','UR','legend'),('Rooted Crown','Root','Hearthborn grove','UR','legend'),
 ('Whistlecap','Gale','Open road','C','route'),('Tinderloom','Ember','Ash roadside','U','route'),('Puddleknit','Tide','Wayside ditch','C','route'),('Shadepurl','Gloom','Abandoned inns','U','route'),('Glowgrub','Gleam','Mile stones','C','route'),('Thornmerry','Bloom','Orchard path','U','route'),('Rookbark','Root','Border woods','R','route'),('Coldcoil','Spark','Storm flats','R','route'),('Pebblewish','Stone','Old road','C','route'),('Foldfawn','Veil','Hollow lanes','R','route'),
 ('Mossbarge','Root','River market','U','market'),('Chalksail','Gale','River market','U','market'),('Bellscale','Gleam','River market','R','market'),('Caskmole','Stone','Cellars','C','market'),('Vinebrisk','Bloom','Vineyards','R','market'),('Duskpocket','Gloom','Alley shade','U','market'),('Rillbraid','Tide','Canal locks','U','market'),('Ashsnout','Ember','Kiln ward','R','market'),('Relaymite','Spark','Signal towers','R','market'),('Silkfold','Veil','Archive stacks','R','market'),('Cinderclove','Ember','Cinder orchards','U','route'),('Moonrill','Tide','Moonlit sluices','U','route'),('Kitebloom','Gale','High garden','R','route'),('Thornlatch','Root','Old gates','U','route'),('Duskgem','Gloom','Black glass hills','R','route'),('Beaconbud','Gleam','Beacon fields','R','route')]
for name,typ,hab,rar,tags in singles:
    add_creature(name,name+' family','adult',typ,hab,rar,idx,None,tags)
    idx+=1
assert len(creatures)==120, len(creatures)

biomes=['Brinewatch Tidepools','Granite Stair','Lampwood Night Road','Understep Vaults','Hearth Fields','Reedfen','Ash Border','Dawn Terraces']
encounters=[]
for b_i,b in enumerate(biomes):
    pool=[c for c in creatures if (b.lower().split()[0] in c['habitat'].lower() or (b_i==3 and 'dungeon' in c['tags']) or (b_i==2 and 'night' in c['tags']))]
    if len(pool)<8: pool=creatures[b_i*15:(b_i+1)*15]
    for period in ['day','night']:
        choices=pool[:8]
        weights=[30,22,16,12,8,6,4,2] if period=='day' else [20,18,16,14,12,10,6,4]
        encounters.append({'biome':b,'period':period,'entries':[{'creatureId':c['id'],'weight':w} for c,w in zip(choices,weights)]})

rival_names=['Aven Silt','Mira Quill','Orlo Pike','Tessa Vane','Bram Coil','Nia Hearth','Corin Rook','Jessa Mire','Venn Lark','Perrin Slate','Sola Braid','Kade Fen','Iri Moth','Daro Bell','Uma Flint','Rook Vale','Lena Current','Moss Dain','Pia Glow','Tarn Wisp']
rivals=[]
for i,n in enumerate(rival_names):
    theme=types[i%10]
    rivals.append({'id':f'rival.{i+1}','name':n,'partyTheme':theme,'agendaSeed':f'Seeks a {theme.lower()} accord map while protecting a personal promise.', 'startingParty':[creatures[(i*5+j)%120]['id'] for j in range(3)]})

world={'worldId':'wof.gloamwild','worldName':'Gloamwild','collectionRules':{'meet':'Observe a creature in its habitat or encounter it through a region event.','bind':'Offer a prepared accord token after its Resolve is lowered or its trust condition is met.','refused':'A refusal grants a field note and temporarily raises local wariness; it is not a failed capture animation.','release':'Release returns the creature to a compatible recorded habitat and may yield a non-exclusive field material.','partyLimit':4,'reserveLimit':48,'bondRanks':['New Accord','Steady','Trusted','Kindred'],'fatigue':'0–100; high fatigue lowers FOC and blocks risky expeditions until rest.','wildBondedRival':'Wild follows habitat rules; bonded follows owner record; rival-bonded cannot be bound.','breeding':'Not in v1.','trading':'Not in single-player v1.'}, 'types':types,'advantages':advantages,'resists':resists,'statuses':statuses,'stats':['HP','ATK','DEF','SPD','FOC'],'progression':{'rankCap':30,'bondSoftCap':4,'ultraRarePity':'No hard pity for power. Use rotating field-research milestones that reveal one eligible habitat clue after repeated valid exploration.','fairness':'No paid bind boosts; rarity is authored/seeded and auditably logged.'}}

(out/'wof_gloamwild_v1.json').write_text(json.dumps(world,indent=2))
(out/'wof_gloamwild_bestiary.json').write_text(json.dumps(creatures,indent=2))
(out/'wof_gloamwild_moves.json').write_text(json.dumps(moves,indent=2))
(out/'wof_gloamwild_encounters.json').write_text(json.dumps(encounters,indent=2))
(out/'wof_gloamwild_rivals.json').write_text(json.dumps(rivals,indent=2))
with (out/'wof_gloamwild_bestiary.csv').open('w',newline='') as f:
    cols=['id','name','speciesFamily','stage','types','stats','moves','abilities','habitat','rarity','bindDifficulty','evolutionPath','lootMaterials','kidSafe','tags','description']
    w=csv.DictWriter(f,fieldnames=cols); w.writeheader()
    for c in creatures:
        row={k:json.dumps(c[k]) if isinstance(c[k],(list,dict)) else c[k] for k in cols}; w.writerow(row)
print(f'Generated {len(creatures)} creatures, {len(moves)} moves, {len(encounters)} encounter tables, {len(rivals)} rivals')
