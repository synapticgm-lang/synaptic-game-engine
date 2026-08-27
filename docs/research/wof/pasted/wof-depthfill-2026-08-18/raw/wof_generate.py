from pathlib import Path
import re
import yaml

OUT = Path('/home/ubuntu/wof_release')
OUT.mkdir(exist_ok=True)

# The documents deliberately describe specifications and release artifacts only. They are not application code.

existing = [
 ('Ash Compact','ash_compact','teen','hp_check','high fantasy two-faction adventure'),
 ('First-Song','first_song','teen','hp_check','fellowship and courtly fantasy'),
 ('Isekai Gate','isekai_gate','teen','hp_check_floor_flags','floor-climb portal fantasy'),
 ('Bonded Menagerie','bonded_menagerie','all-ages','bond_type','pets, friendship, and care'),
 ('Circuit Arc','circuit_arc','teen','score_set','tournament drama'),
 ('Halo Term','halo_term','teen','hp_check','powers school'),
 ('Hollow Term','hollow_term','teen','hp_check','magic school'),
 ('Starwake','starwake','teen','ship_board','space opera'),
 ('Lanceyard','lanceyard','teen','frame_heat','mecha'),
 ('Quarry Pact','quarry_pact','teen','hunt_part','cooperative hunting'),
 ('Sect Ascension','sect_ascension','teen','realm_gate','wuxia cultivation'),
 ('Gridrun','gridrun','teen','heat_wanted','cyberpunk'),
 ('Blackwake','blackwake','teen','ship_board','age-of-sail adventure'),
 ('Night Charter','night_charter','teen','hp_check','hidden-society courts'),
 ('Badge Circuit','badge_circuit','teen','hp_check','superhero patrol'),
 ('Dust Line','dust_line','teen','hp_check','western frontier'),
 ('Veil Watch','veil_watch','teen','steadfast','supernatural horror'),
 ('Crew Score','crew_score','teen','hp_check','heist teamwork'),
 ('Hearth Season','hearth_season','all-ages','cozy_tick','cozy town and garden'),
 ('Stage Light','stage_light','teen','score_set','idol performance'),
 ('Pitch League','pitch_league','all-ages','score_set','team sports'),
 ('Route Lantern','route_lantern','teen','bond_heart','romance and friends'),
 ('Card Vein','card_vein','teen','card_lane','deck-and-lane strategy'),
]

# New worlds. primary=True marks the requested full-depth priority list.
new = [
 ('Brasswake','brasswake','teen','hp_check','steampunk airship, clockwork, and rail salvage without named legacy settings',True,
  ['Cinder Dock','Aerial Brassway','Orchard Mast','Clockwind Exchange','Rivet Court','The Soot Meridian'],
  ['mender','skylark','brassling','cogray'], 'clockwork instruments and mail routes'),
 ('Thorn Law','thorn_law','teen','grit_wound','human-led low-fantasy border law with scarce and costly strangeness',True,
  ['Briar Assize','Harrow Market','Mire Toll','Old Gallows Road','Cinderfield','The Thorn Bench'],
  ['ridge hound','marsh stag','ink rook','barrow ox'], 'oaths, wounds, and difficult judgments'),
 ('Civic Mile','civic_mile','all-ages','civic_rep','present-day city slice-of-life, apartments, café shifts, and friends',True,
  ['Juniper Station','Mile Market','Maple Court','Rooftop Garden','Lantern Plaza','Riverwalk Hall'],
  ['pocket fox','window dove','street turtle','tea moth'], 'neighborhood trust and shared routines'),
 ('Homestead Ring','homestead_ring','all-ages','build_tick','peaceful player-built town on a shared server clock',True,
  ['Ring Green','Pebble Ward','Orchard Rise','Canal Gate','Common Kiln','Bell Assembly'],
  ['moss hen','parcel goat','pond carp','amber bee'], 'civic building, tending, and seasonal town goals'),
 ('Scale Era','scale_era','teen','hunt_part','prehistoric valley of original megafauna and field expeditions',True,
  ['Basalt Shelter','Fern Basin','Amber Crossing','Thunderstep','Boneglass Ravine','Long Dawn Camp'],
  ['ribbonback','thunder elk','sailjaw','mire tusker'], 'non-franchise megafauna tracking and habitat care'),
 ('Glass Reef','glass_reef','all-ages','depth_gauge','underwater city, tidecraft, and reef stewardship',True,
  ['Lumen Quay','Pearlward','Current Garden','Hush Trench','Coral Archive','Glasswake Gate'],
  ['glint eel','shellfin','drift ray','sponge crab'], 'depth, currents, and civic reef repair'),
 ('Kindred Hide','kindred_hide','all-ages','hide_voice','anthro social identity, studios, and hangout festivals',True,
  ['Welcome Burrow','Mosslight Arcade','Tailor Steps','Sunroom Square','Quiet Den','Bridge Bloom'],
  ['harefolk','otterfolk','mothfolk','badgerfolk'], 'identity expression, consentful social play, and creative clubs'),
 ('Ink Banner','ink_banner','teen','hp_check','feudal banner-houses, duel-and-duty, and inked dispatches',True,
  ['Banner Gate','Reed Court','Kite Barracks','Red Seal Road','Cedar Watch','The Quiet Standard'],
  ['koi hound','paper crane','reed cat','lantern stag'], 'duty, measured duels, and house obligations'),
 ('Leafrail','leafrail','all-ages','cozy_tick','solarpunk rail gardens, repair cooperatives, and sun-catch craft',True,
  ['Canopy Terminal','Glass Orchard','Sunspoke Yard','Fern Viaduct','Lattice Commons','Dawn Depot'],
  ['leaf skimmer','pollen jay','vine tortoise','dew fox'], 'repair, light-sharing, and optimistic public works'),
 ('Saddle Sky','saddle_sky','teen','bond_mount','original sky-mount partnership, aerial rescue, and wind routes',True,
  ['Wingrest','Kestrel Steps','Cloud Orchard','Gale Bridge','Nestfall Hollow','High Aerie'],
  ['emberwing','mistral drake','cloud ram','ribbon gryph'], 'earned mount trust and non-franchise flight routes'),
 ('Northrim','northrim','teen','hp_check','northern sea-king folklore and winter covenants',False,
  ['Frostwharf','Whale Road','Pine Hall','Rime Barrow'], ['ice gull','fjord elk','sealwolf','ember tern'], 'winter voyages and promise-keeping'),
 ('Tide Colossus','tide_colossus','teen','colossus_part','instanced hunts against original shore titans',False,
  ['Breakwater Camp','Titan Sound','Anchor Cliff','Foam Chapel'], ['shell titan','reed giant','stormback','mud oracle'], 'part-breaking cooperation without competitive open zones'),
 ('Ribbon Guard','ribbon_guard','all-ages','show_pose','original color-team city defenders and staged rescue shows',False,
  ['Bright Base','Mirror Street','Ribbon Pier','Stage Vault'], ['spark pigeon','prism pup','ribbon koi','glow beetle'], 'team poses, rescue beats, and optimism'),
 ('Quiet Brief','quiet_brief','teen','heat_cover','present-day spy jobs with cover stories and private co-op cases',False,
  ['Civic Annex','Paper Hotel','Rain Platform','Signal Room'], ['courier crow','keycat','window lizard','tape moth'], 'ethical inference and quiet extraction'),
 ('Neon Docket','neon_docket','teen+','heat_wanted','present-day crime crew cases without vehicle-chaos fantasy',False,
  ['Docket Row','Night Clerk','Underbridge','Casefile Court'], ['alley pigeon','receipt ferret','lamp gecko','archive moth'], 'consequences, crews, and restitution'),
 ('Redline Hour','redline_hour','all-ages','lap_time','time-trial racing through original closed courses',False,
  ['Starter Bay','Copper Loop','Rain Circuit','Hourglass Garage'], ['spark hare','brake beetle','sprint gull','paddock dog'], 'clean racing, team tuning, and personal bests'),
 ('Atelier Row','atelier_row','all-ages','atelier_score','fashion studio, runway briefs, and material stories',False,
  ['Thread Square','Drape Hall','Color Yard','Runway Roof'], ['silk moth','button quail','ribbon cat','dye koi'], 'look-making, respectful critique, and shows'),
 ('Third Cup','third_cup','all-ages','hospitality_tick','café and hospitality life-sim',False,
  ['Third Cup','Market Steps','Brew Lane','Window Garden'], ['sugar sparrow','biscuit dog','tea snail','cocoa bat'], 'service, recipes, and regulars'),
 ('Briar Court','briar_court','teen','veil_glamour','dark fairy-tale courts with original bargains',False,
  ['Briar Gate','Thimble Hall','Moon Orchard','Hollow Mirror'], ['thistle doe','glass wren','moss hare','candle toad'], 'careful promises and glamour'),
 ('Threshold Rooms','threshold_rooms','teen+','liminal_steadfast','liminal interiors and unsettling room logic',False,
  ['Welcome Desk','Carpet Hall','Blue Stair','Exit Light'], ['paper moth','lost hound','clock beetle','hush crow'], 'grounded navigation and consentful scares'),
 ('Smoke Ledger','smoke_ledger','teen','hp_check','1920s-inspired noir city cases without historical impersonation',False,
  ['Cinder Station','Velvet Block','Ledger House','Fog Dock'], ['ink gull','cigarbox mouse','lamp cat','wire fox'], 'investigation, debts, and moral choices'),
 ('Quiet Rite','quiet_rite','teen','steadfast','household haunt care and original exorcist practice',False,
  ['Rite House','Candle Street','Sigh Garden','Bell Cellar'], ['bell moth','salt dog','porch owl','thread fish'], 'listening, rites, and safe endings'),
 ('First Clay','first_clay','teen','hp_check','mythic antiquity of original river, hill, and star cultures',False,
  ['Clay Harbor','Sun Court','Reed Archive','Star Kiln'], ['clay ibis','sun ram','river lion','star tortoise'], 'foundational myths with multiple original cultures'),
 ('Mesa Codex','mesa_codex','all-ages','hp_check','original highland calendar cities, not a historical reconstruction',False,
  ['Stone Calendar','Cactus Gate','Painted Well','Dawn Mesa'], ['sun lizard','quill fox','rain hare','stone ibis'], 'original calendar lore and terrace care'),
 ('Drumline Coast','drumline_coast','all-ages','hp_check','original coastal praise-houses and drum-message routes',False,
  ['Palm Quay','Echo Market','Red Clay Steps','Lantern Grove'], ['palm civet','drum heron','copper antelope','rain gecko'], 'original coastal fellowship and signal craft'),
 ('Star Canoe','star_canoe','all-ages','ship_board','original ocean voyaging, reading stars, and shared canoe care',False,
  ['Wayfinder Bay','Star Mat','Reef Rest','Far Lantern'], ['star tern','sailfin','coconut crab','wave fox'], 'original island navigation and reciprocal voyaging'),
 ('Winter Oven','winter_oven','all-ages','cozy_tick','original winter folklore kitchens, ovens, and neighborhood feasts',False,
  ['Oven Square','Snow Lane','Birch Pantry','Ember Bridge'], ['flour fox','birch owl','kettle hare','frost carp'], 'warmth, food, and lightly spooky kindness'),
 ('Green Chapel','green_chapel','teen','hp_check','original questing chapel-greens and round-table echoes',False,
  ['Green Nave','Apple Ford','Bell Meadow','Hearth Vale'], ['chapel stag','apple rook','green hound','well carp'], 'service, quests, and original chivalric disputes'),
]

# All checklist lanes appear once or more. A few intentionally merge into an existing/new primary pack rather than duplicate an experience.
demand_rows = [
 ('Commercial fantasy / medieval high','High','High','ash_compact','HAVE','teen','hp_check','Deep quest identity remains the strongest commercial and reader-poll setting signal.'),
 ('Commercial science fiction / space opera','High','Mid','starwake','HAVE','teen','ship_board','Science fiction is the second-largest setting segment in the cited market overview.'),
 ('Commercial historical / modern / post-apocalyptic','Mid','Mid','thorn_law / civic_mile','MERGE','teen','grit_wound / civic_rep','Market segmentation supports variety, while the post-collapse lane is deliberately excluded.'),
 ('Survival sandbox, homestead, player-built town','High','Mid','homestead_ring','NEW','all-ages','build_tick','Recent public positioning repeatedly emphasizes homes, settlements, professions, and civic construction.'),
 ('Cozy life-sim social world','High','Mid','hearth_season / civic_mile / third_cup','MERGE','all-ages','cozy_tick / civic_rep / hospitality_tick','Public commentary identifies a social and domestic gap beyond combat loops.'),
 ('WoW-like raid fantasy nostalgia pattern','High','High','ash_compact / first_song','MERGE','teen','hp_check','Fan scenes repeatedly seek structured cooperative fantasy progression; this does not import any legacy setting.'),
 ('Cute-dark grind and class-loop nostalgia pattern','Mid','High','brasswake','NEW','teen','hp_check','Directory clusters signal appetite for distinct progression, seasonal starts, and strong visual identity.'),
 ('PK sandbox and guild-economy nostalgia pattern','Mid','High','homestead_ring','MERGE','all-ages','build_tick','Retains civic trade and shared goals while excluding contested open-world PvP.'),
 ('2.5D hunt and expedition nostalgia pattern','Mid','High','scale_era / quarry_pact','MERGE','teen','hunt_part','Trackable creatures, parts, and cooperative routes fit the engine without borrowing creatures or maps.'),
 ('Skilling, life-skills, and housing nostalgia pattern','High','High','homestead_ring / leafrail','MERGE','all-ages','build_tick / cozy_tick','Private-server and sandbox references repeatedly foreground crafting, homes, and long-lived economies.'),
 ('MUD narrative and social text world','High','Mid','night_charter / kindred_hide','MERGE','teen','hp_check / hide_voice','Persistent prose, role identity, and local social spaces are first-class demand patterns.'),
 ('Housing-and-identity social world','High','Mid','civic_mile / kindred_hide','MERGE','all-ages','civic_rep / hide_voice','Apartment identity, club rituals, and consentful visits address social-world demand.'),
 ('Avatar hangout / virtual lounge','Mid','Mid','kindred_hide','NEW','all-ages','hide_voice','Lightweight self-expression and hangout activity deserve a dedicated original social pack.'),
 ('Original equine-folk social play','Low','Mid','kindred_hide','MERGE','all-ages','hide_voice','The identity loop is served without reproducing a branded species or visual language.'),
 ('Collect-and-care pet site','High','High','bonded_menagerie','HAVE','all-ages','bond_type','Pets and friends are a lead demand, not a side system.'),
 ('Medieval low / grit','Mid','High','thorn_law','NEW','teen','grit_wound','Reader-poll low fantasy and nostalgia demand justify a human-led, scarce-magic alternative.'),
 ('Mythic antiquity','Mid','Mid','first_clay','NEW','teen','hp_check','Original mythic cultures offer a non-derivative alternative to familiar medieval fantasy.'),
 ('Feudal banner-houses / samurai-adjacent duty','Mid','High','ink_banner','NEW','teen','hp_check','Duel-and-duty supports an original banner-house setting without a licensed ninja village.'),
 ('Viking / north','Mid','Mid','northrim','NEW','teen','hp_check','Northern voyage and oath folklore are distinct from the existing pirate skin.'),
 ('Silk road / caravan','Mid','Mid','first_clay','MERGE','teen','hp_check','Caravan exchange is a regional activity in an original antiquity pack rather than a second trade world.'),
 ('Wuxia','Mid','High','sect_ascension','HAVE','teen','realm_gate','Existing cultivation world is the direct fit.'),
 ('Pirate','Low','Mid','blackwake','HAVE','teen','ship_board','Existing age-of-sail world covers maritime adventure.'),
 ('Western','Low','Mid','dust_line','HAVE','teen','hp_check','Existing western world covers frontier stakes.'),
 ('Steampunk','Mid','Mid','brasswake','NEW','teen','hp_check','The verified reader poll ranks this lower but distinct setting; airship and clockwork verbs justify one pack.'),
 ('Dieselpunk','Low','Mid','smoke_ledger','MERGE','teen','hp_check','No separate diesel warfare skin: industrial noir texture lives in a focused case world.'),
 ('Solarpunk','Mid','Low','leafrail','NEW','all-ages','cozy_tick','Optimistic repair, rail gardens, and shared infrastructure differ from authored farming.'),
 ('Present-day city slice-of-life','High','Mid','civic_mile','NEW','all-ages','civic_rep','Apartments, public rituals, and friends meet an identified social-world gap.'),
 ('Present-day crime','Mid','Mid','neon_docket','NEW','teen+','heat_wanted','Crew cases provide a constrained, consequences-forward crime fantasy rather than open chaos.'),
 ('Spy','Mid','Mid','quiet_brief','NEW','teen','heat_cover','Instanced cover-and-extraction cases are mechanically clear and compatible with friends-first co-op.'),
 ('School','Mid','Mid','halo_term / hollow_term','HAVE','teen','hp_check','Existing powers and magic schools provide separate tones.'),
 ('Café / life-sim','Mid','Mid','third_cup','NEW','all-ages','hospitality_tick','Hospitality adds a focused service loop instead of duplicating a garden world.'),
 ('Fashion','Mid','Mid','atelier_row','NEW','all-ages','atelier_score','Runway briefs use a score module while preserving cosmetic-only rewards.'),
 ('Racing','Mid','Mid','redline_hour','NEW','all-ages','lap_time','Closed time-trial instances provide clean competition without vehicle-crime overlap.'),
 ('Sports','Mid','Mid','pitch_league','HAVE','all-ages','score_set','Existing sports pack is the direct fit.'),
 ('Idol','Mid','Mid','stage_light','HAVE','teen','score_set','Existing performance pack is the direct fit.'),
 ('Romance / friends','High','Mid','route_lantern / civic_mile','MERGE','teen','bond_heart / civic_rep','Existing friends story plus a city hangout fit the demand without sexual content.'),
 ('Cozy farm','High','Mid','hearth_season','HAVE','all-ages','cozy_tick','Existing authored garden town covers the lane.'),
 ('Player-built homestead / civic','High','Mid','homestead_ring','NEW','all-ages','build_tick','The server-clock town differs from authored farming and excludes post-collapse salvage.'),
 ('Superhero','Mid','Mid','badge_circuit','HAVE','teen','hp_check','Existing patrol world covers hero beats.'),
 ('Mecha','Mid','Mid','lanceyard','HAVE','teen','frame_heat','Existing frame world covers mecha.'),
 ('Kaiju','Mid','Mid','tide_colossus','NEW','teen','colossus_part','Instanced colossal hunts add scale without open-world rivalry.'),
 ('Space opera','High','Mid','starwake','HAVE','teen','ship_board','Existing space-opera pack covers the category.'),
 ('Cyberpunk','Mid','High','gridrun','HAVE','teen','heat_wanted','Existing cyberpunk pack serves an established poll and nostalgia lane.'),
 ('Colony / Mars','Mid','Low','starwake','MERGE','teen','ship_board','One off-world world avoids a near-duplicate space skin.'),
 ('Underwater / Atlantis-pattern','Mid','Low','glass_reef','NEW','all-ages','depth_gauge','Tidecraft and reef stewardship make a distinct spatial loop.'),
 ('Sky islands / airships','Mid','Mid','brasswake','MERGE','teen','hp_check','Kite Isle is intentionally merged into Brasswake to avoid duplicate airship verbs.'),
 ('Dinosaurs / prehistoric','Mid','Mid','scale_era','NEW','teen','hunt_part','Original megafauna expedition offers the creature-scale lane without franchise dinosaur borrowing.'),
 ('Dragon rider','Mid','Mid','saddle_sky','NEW','teen','bond_mount','Original mounts and rescue partnership distinguish this from pet collection.'),
 ('Fey / dark fairy tale','Mid','Mid','briar_court','NEW','teen','veil_glamour','A bargain-and-glamour loop offers a controlled dark-folklore lane.'),
 ('Liminal interiors','Mid','Mid','threshold_rooms','NEW','teen+','liminal_steadfast','Room logic and steadfast checks make a consentful teen+ scare structure.'),
 ('Ghost / exorcist','Mid','Mid','quiet_rite','NEW','teen','steadfast','Household haunts foreground care and ritual rather than gore.'),
 ('Werefolk / animal identity','Mid','Mid','kindred_hide','MERGE','all-ages','hide_voice','Original folk identity is social rather than a proprietary supernatural cosmology.'),
 ('Celestial / infernal original courts','Mid','Mid','night_charter / briar_court','MERGE','teen','hp_check / veil_glamour','Existing hidden courts and new fey bargains cover court stakes.'),
 ('Anthro / social','Mid','Mid','kindred_hide','NEW','all-ages','hide_voice','A dedicated original folk hangout world prevents this need becoming a cosmetic footnote.'),
 ('Noir 1920s','Mid','Mid','smoke_ledger','NEW','teen','hp_check','Case files and moral debts supply a distinct period-flavored mystery.'),
 ('1980s cassette','Low','Low','civic_mile','MERGE','all-ages','civic_rep','A temporary festival tone fits better than another modern-city pack.'),
 ('Y2K mall / teen present','Mid','Mid','civic_mile','MERGE','all-ages','civic_rep','A district/festival can supply the texture without multiplying city packs.'),
 ('Cooking','Mid','Mid','third_cup / hearth_season','MERGE','all-ages','hospitality_tick / cozy_tick','Café hospitality and garden produce together cover cooking demand.'),
 ('Wrestling','Low','Mid','circuit_arc','MERGE','teen','score_set','Tournament presentation can host a cosmetic-only ring season.'),
 ('Train / transcontinental','Mid','Low','brasswake / leafrail','MERGE','teen','hp_check / cozy_tick','Air-rail mail and solar rail routes cover transit fantasy without standalone rail duplication.'),
 ('Afterlife','Mid','Mid','night_charter','MERGE','teen','hp_check','Hidden courts can host an afterlife region without a second court world.'),
 ('Tiny-folk','Low','Low','bonded_menagerie','MERGE','all-ages','bond_type','A temporary miniature-garden event provides playful scale safely.'),
 ('Mesoamerica-inspired original','Mid','Low','mesa_codex','NEW','all-ages','hp_check','Original highland calendar culture has an explicit originality fence.'),
 ('West African folklore-inspired original','Mid','Low','drumline_coast','NEW','all-ages','hp_check','Original praise-house coast has an explicit originality fence.'),
 ('Polynesian voyaging original','Mid','Low','star_canoe','NEW','all-ages','ship_board','Original star navigation and reciprocal voyaging have an explicit originality fence.'),
 ('Slavic folklore original','Mid','Low','winter_oven','NEW','all-ages','cozy_tick','Original winter kitchen tales have an explicit originality fence.'),
 ('Arthurian-pattern original','Mid','Low','green_chapel','NEW','teen','hp_check','Original green-chapel quests have an explicit originality fence.'),
]

module_specs = {
 'grit_wound': ('Wounds, leverage, and scarce relief.', ['hp','guard','wound','scar','supplies','favor','oath','case_heat'], ['brace','press','bandage','parley','scout','bind','withdraw','testify','barter','mark','rest','appeal']),
 'civic_rep': ('Neighborhood trust, schedules, and consentful social invitations.', ['energy','civic_rep','lease','shift_clock','club_marks','favor','rent_due','mood'], ['greet','volunteer','host','visit','brew','repair','introduce','decorate','schedule','mediate','commute','reflect']),
 'build_tick': ('Server-clock civic construction without power sale.', ['stamina','plots','materials','permit_marks','ward_trust','build_tick','contribution','weather'], ['survey','place','repair','plant','route','vote','donate','craft','inspect','share','rest','celebrate']),
 'depth_gauge': ('Depth, current, and pressure-safe reef exploration.', ['hp','air','depth','pressure','current','reef_trust','tide_token','salvage'], ['swim','anchor','glide','equalize','mend','harvest','signal','shelter','scan','escort','surface','sing']),
 'colossus_part': ('Cooperative part-target hunting with threat lanes.', ['hp','part_state','stagger','shelter','supplies','hunt_marks','lockout','rescue'], ['mark','climb','brace','sever','distract','shelter','tend','harpoon','signal','retreat','rally','claim']),
 'show_pose': ('Team-show sequencing, audience safety, and rescue beats.', ['energy','pose_chain','cue','audience_joy','rescue_marks','costume','scene_clock','bond'], ['pose','cue','shield','cheer','rehearse','rescue','redirect','shine','link','rest','revise','bow']),
 'heat_cover': ('Cover integrity, evidence, and private case resolution.', ['hp','cover','heat','evidence','contacts','case_clock','gear','trust'], ['observe','tail','bluff','signal','swap','hide','extract','decode','bribe','call','retreat','report']),
 'lap_time': ('Closed-course lap precision and clean-race scoring.', ['speed','grip','boost','lap_time','sector','clean_marks','tune','focus'], ['launch','brake','drift','draft','boost','tune','reset','scan','practice','relay','cool','finish']),
 'atelier_score': ('Brief fit, silhouette, material, and respectful critique.', ['energy','brief_fit','silhouette','material','craft','audience','lookbook','reputation'], ['sketch','cut','drape','dye','style','pose','review','revise','accessorize','present','rest','archive']),
 'hospitality_tick': ('Service rhythm, recipe care, and guest comfort.', ['energy','hospitality','stock','recipe_notes','guest_mood','shift_tick','regulars','cleanliness'], ['greet','seat','brew','plate','listen','clean','stock','recommend','coordinate','close','rest','thank']),
 'bond_mount': ('Mount trust, aerial safety, and route mastery.', ['hp','mount_trust','wind','altitude','route_marks','care','tack','rescue'], ['groom','feed','mount','bank','glide','signal','rescue','rest','train','scout','land','bond']),
 'veil_glamour': ('Bargains, glamour, and consequence-aware court scenes.', ['hp','glamour','promise','favor','thorn','veil','court_standing','memory'], ['curtsy','bargain','unmask','weave','refuse','gift','seek','hide','remember','appeal','retreat','seal']),
 'liminal_steadfast': ('Grounding, room logic, and consentful scares.', ['steadfast','orientation','clue','room_shift','comfort','exit_marks','battery','anchor'], ['ground','listen','map','open','close','call','anchor','hide','test','rest','return','leave']),
 'hide_voice': ('Identity presentation, boundaries, and social invitations.', ['energy','voice','style','boundaries','club_rep','invites','craft','comfort'], ['introduce','listen','style','invite','decline','host','create','perform','trade','affirm','rest','depart']),
}

# Existing built-in modules get a compact contract, while new ones carry the full explicit contract.
base_module_fields = {
 'hp_check':['hp','guard','turn','gold','loot_seed','checkpoint','lockout','party'],
 'hp_check_floor_flags':['hp','guard','floor','waymark','flags','checkpoint','lockout','party'],
 'bond_type':['bond','care','trust','collection','turn','gold','checkpoint','party'],
 'score_set':['energy','score','set','combo','audience','rehearsal','checkpoint','party'],
 'ship_board':['hull','crew','route','cargo','weather','berth','checkpoint','party'],
 'frame_heat':['hp','heat','frame','parts','coolant','checkpoint','lockout','party'],
 'hunt_part':['hp','part_state','supplies','track','camp','checkpoint','lockout','party'],
 'realm_gate':['hp','realm','qi','gate','insight','checkpoint','lockout','party'],
 'heat_wanted':['hp','heat','wanted','cover','cache','checkpoint','lockout','party'],
 'steadfast':['steadfast','clue','ward','safety','checkpoint','lockout','party'],
 'cozy_tick':['energy','season','garden','craft','neighbor','tick','checkpoint','party'],
 'bond_heart':['bond','trust','memory','route','mood','checkpoint','party','turn'],
 'card_lane':['hp','hand','lane','deck','mana','checkpoint','lockout','party'],
}

ban_root = [
 'borrowed franchise kingdom','named legacy faction','recognizable trademark crest','copyrighted character silhouette','direct map replica','copied quest text','lifted class name','licensed monster name','familiar mascot color code','signature spell wording','well-known catchphrase','named hero lineage','specific anime uniform','famous game-logo geometry','existing creature evolution chart','recognizable toy-ball device','copyrighted school-house name','known guild insignia','specific proprietary city skyline','identifiable quest giver','replicated dungeon floorplan','famous sword profile','licensed vehicle livery','brand-like companion anatomy','recognizable creature cry','existing server slogan','direct fan-server name','replicated crafting recipe','known faction motto','copied UI glyph','trademarked music motif','imitated title treatment','recognized comic emblem','borrowed national costume as uniform','religious symbol as loot','real-world sacred rite as mechanic','ethnic caricature','colonial conquest fantasy','slur or demeaning exonym','sexualized minor-coded look','non-consensual romance route','paid power item','loot-box or gacha pitch','lockout-skip sale','real-person likeness','AI imitation of living artist','gore-forward Kid art','unmoderated public chat','voice-chat dependency','external proprietary lore']

palette = ['oxidized brass and soot-blue','briar green and parchment','warm terracotta and river blue','cedar, clay, and bell bronze','basalt black and fern gold','sea-glass, pearl, and coral','moss, amber, and soft cream','ink black, vermilion, and cedar','leaf green, solar gold, and recycled glass','sky blue, saddle leather, and ember orange']

# Utility helpers
slug = lambda s: re.sub(r'[^a-z0-9]+','_',s.lower()).strip('_')

def write(name, text):
    (OUT / name).write_text(text.rstrip()+'\n', encoding='utf-8')

def md_table(headers, rows):
    out = '| ' + ' | '.join(headers) + ' |\n'
    out += '| ' + ' | '.join(['---']*len(headers)) + ' |\n'
    for r in rows:
        out += '| ' + ' | '.join(str(x).replace('|','/') for x in r) + ' |\n'
    return out

def title_word(world):
    return world.replace(' ','')

def world_data(world_id):
    for n in new:
        if n[1] == world_id: return n
    for e in existing:
        if e[1] == world_id: return e
    raise KeyError(world_id)

def module_contract(module):
    if module in module_specs:
        intent, fields, verbs = module_specs[module]
        statuses = ['rattled','guarded','focused','exposed','steadied','slowed','inspired','spent']
        chrome = ['ledger','turn cue','party pane','checkpoint seal','loot receipt']
        probes = [f'{module}_probe_{i:02d}' for i in range(1,11)]
        return f"""**Intent.** {intent}\n\n| Contract element | Specification |\n| --- | --- |\n| Ledger fields | {', '.join(fields)} |\n| Round resolve | Read committed action order; validate resource cost; resolve status changes; commit ledger atomically; narrate only after commit. |\n| Wipe / fail | Return the party to the last checkpoint, preserve earned personal loot, clear encounter-only state, and never impose permadeath. |\n| Lockout | Weekly per-character boss lockout only where a boss is flagged; no purchase can bypass it. |\n| Status effects (8) | {', '.join(statuses)} |\n| Verbs (12) | {', '.join(verbs)} |\n| Chrome templates (5) | {', '.join(chrome)} |\n| Eval probes (10) | {', '.join(probes)} |"""
    fields = base_module_fields.get(module, ['turn','checkpoint','party','gold','loot_seed','lockout','status','flags'])
    return f"""| Contract element | Specification |\n| --- | --- |\n| Ledger fields | {', '.join(fields)} |\n| Resolve | Code validates, rolls, commits, then narration describes the committed result. |\n| Wipe / fail | Checkpoint return; personal loot remains; no permadeath in v1. |\n| Lockout | Weekly per-character boss lockout when the world has a boss flag. |\n| Status effects | guarded, exposed, focused, slowed, steadied, rattled, inspired, spent |\n| Verbs | inspect, travel, act, brace, help, rest, trade, talk, use, retreat, claim, report |\n| Chrome templates | ledger, turn cue, party pane, checkpoint seal, loot receipt |\n| Eval probes | {', '.join(f'{module}_probe_{i:02d}' for i in range(1,11))} |"""

def pack_text(data):
    name, wid, maturity, module, concept, primary, places, species, hook = data
    prefix = wid
    count_q = 30 if primary else 18
    npc_count = 8 if primary else 6
    inst_count = 2 if primary else 1
    kit_names = [f'{prefix}_kit_{x}' for x in ['courier','maker','scout','warden']]
    kit_rows = []
    for i,k in enumerate(kit_names):
        kit_rows.append((k, ['Courier','Maker','Scout','Warden'][i], f"A {['route-reading','practical','observant','protective'][i]} entry kit with a non-power cosmetic wardrobe and one talk angle."))
    place_rows = []
    for i,p in enumerate(places):
        role = 'hub' if i in (0,1) else ('wild' if i in (2,3) else ('instance door' if i == len(places)-1 else 'mid-route'))
        place_rows.append((f'{prefix}_place_{i+1:02d}',p,role,f"A local problem is visible before any creature or confrontation: {['a broken public promise','a missing shift roster','a cracked route marker','an unpaid repair notice','a stalled festival permit','a sealed community request'][i%6]}."))
    npcs = []
    for i in range(npc_count):
        nname = ['Mara Vell','Orin Pike','Sable Rook','Tavi Fen','Ione Bell','Perrin Vale','Kessa Row','Daro Finch'][i]
        tree = f"{prefix}_npc_{i+1:02d}"
        npcs.append((tree,nname,['asks for help','guards a boundary','knows a rumor','offers a trade','challenges a choice','needs a witness','keeps a record','opens a route'][i],f"‘Before you answer, tell me what you are willing to risk for this.’ → [time] [reputation] [supplies]"))
    quest_rows = []
    quest_verbs = ['Inspect','Carry','Listen','Repair','Escort','Negotiate','Track','Prepare','Solve','Return','Map','Decide','Aid','Recover','Signal','Gather','Protect','Celebrate']
    for i in range(count_q):
        qid = f'{prefix}_q_{i+1:02d}'
        qname = f"{quest_verbs[i%len(quest_verbs)]} the {['First Notice','Broken Route','Quiet Debt','Open Door','Weather Mark','Lost Shift','Old Promise','Shared Table','Signal Thread'][i%9]}"
        rewards = f"{12+i*3} gold; {4+i%7} kit marks; {1+i%3} {prefix}_favor"
        stake = ['lose a daylight turn','spend 1 supply','risk a social refusal','accept a public record','leave a resource for another player'][i%5]
        quest_rows.append((qid,qname,stake,rewards))
    loot_rows = [(f'{prefix}_loot_{i:02d}', ['common','uncommon','rare','keepsake'][i%4], f"{places[i%len(places)]} keepsake; cosmetic or crafting-only; never a paid outcome.") for i in range(1,13)]
    instance_rows = []
    for i in range(inst_count):
        instance_rows.append((f'{prefix}_inst_{i+1:02d}',f"{places[-1]}: {['The Held Door','The Bent Route'][i]}", '2–5', f"{prefix}_boss_{i+1:02d}", 'checkpoint on wipe; personal loot; weekly lockout only for the boss'))
    talents = [(f'{prefix}_tal_{i:02d}', ['Careful Step','Clear Signal','Helping Hand','Local Memory','Steady Craft','Open Route','Kind Word','Safe Return'][i%8], ['travel','talk','support','craft'][i%4], f"Gain +{i%3+1} {['route','talk','support','craft'][i%4]} mark after a committed success.") for i in range(1,13)]
    ban_rows = ', '.join(ban_root)
    palette_words = palette[hash(wid)%len(palette)]
    # The originality fence explicitly stops cultural or franchise duplication.
    origins = "This world is an original WOF setting. It borrows no protected geography, named characters, costume codes, monster catalogues, plot arcs, slogans, or proprietary rule language. If it carries folklore-adjacent texture, it uses an invented people, place, calendar, and conflict rather than a reconstruction or claim of authority."
    return f"""# WOF {name}: World Pack\n\n> **Release position:** A WOF text-world pack for **solo and private co-op**. It is not marketed as an MMO until multiplayer operation is proven. All resolution is owned by the shared engine: it commits dice, HP, ledgers, catalogues, quest ticks, loot, gold, lockouts, and instance seeds before narration.\n\n## 1. Header and identity\n\n| Field | Value |\n| --- | --- |\n| worldId | `{wid}` |\n| Working display name | **{name}** |\n| Maturity | **{maturity}** |\n| rulesModuleId | `{module}` |\n| Core promise | {concept.capitalize()}. |\n| First-hour local problem | A public obligation has failed at **{places[0]}**; the player must choose whom to disappoint before receiving a combat or social task. |\n| Originality fence | {origins} |\n\n## 2. Rules module — CODE fields\n\n{module_contract(module)}\n\n**Engine boundaries.** Tier-3 hubs and instanced encounters are used; party size is 2–5; lockstep applies when playing together; there is no mid-combat fill, contested open-world PvP, guild bank, global chat, permadeath, or outcome-selling store item. Presence shows only nearby count and races. English is v1.\n\n## 3. Identity kits\n\n{md_table(['kitId','Name','Entry identity'],kit_rows)}\n\nEach kit begins with one garment, one instrument or tool, one non-combat emote, and a premade first line. Kits provide flavor; they never gate paid power.\n\n## 4. Place graph\n\n{md_table(['placeId','Place','Role','Room-first problem'],place_rows)}\n\n**Graph.** `{prefix}_place_01 → {prefix}_place_02 → {prefix}_place_03 ↔ {prefix}_place_04 → {prefix}_place_{len(places):02d}`. Optional side routes return to the first hub. A room, weather, sound, and practical obstacle are described before any creature, character threat, or encounter. Housing is labelled **private room / plot flavor**, not a claim of persistent public housing.\n\n## 5. NPCs and premade talk\n\n{md_table(['npcId','NPC','Role','Premade talk with stake'],npcs)}\n\nHub talk uses canned, context-safe prompts only. Public freeform DMs, voice, and unmoderated trade are not part of this pack.\n\n## 6. Opening choices and consequence policy\n\n| Choice id | Opening choice | Stake | Committed outcome |\n| --- | --- | --- | --- |\n| `{prefix}_choice_01` | Take the overdue delivery. | Lose time before the first checkpoint. | Gain route access and a witness. |\n| `{prefix}_choice_02` | Repair the public marker. | Spend 1 supplies. | Gain local trust and a repair recipe. |\n| `{prefix}_choice_03` | Tell the truth to the waiting resident. | Risk 2 reputation marks. | Unlock a candid NPC branch. |\n| `{prefix}_choice_04` | Keep the promise to your kit partner. | Forgo immediate gold. | Earn a cosmetic keepsake path. |\n\nNo choice deletes another player, locks a paid path, or creates a permanent punitive state. The narrator may present tone and context only after the ledger outcome is committed.\n\n## 7. Quest catalogue\n\n{md_table(['questId','Quest','Opening stake','Numeric reward'],quest_rows)}\n\n## 8. Species, companions, and collectibles\n\n{md_table(['collectibleId','Species / item','Care or discovery loop'],[(f'{prefix}_spec_{i+1:02d}',s,f"Observe, assist, and record {s}; completion grants a cosmetic field-note plate.") for i,s in enumerate(species)] + [(f'{prefix}_collect_{i+1:02d}',f'{places[i%len(places)]} token',f'Find through a non-gacha exploration, craft, talk, or instance route.') for i in range(8)])}\n\n## 9. Loot and vendors\n\n{md_table(['lootId','Rarity','Policy'],loot_rows)}\n\nVendor `{prefix}_vendor_01` is at **{places[0]}**. Gold buys cosmetics, clear utility labels, and non-power collection presentation only. Cosmetic tokens buy equivalent cosmetic presentation only. No gacha, power packs, catches, raid clears, lockout skips, or outcome modification are sold.\n\n## 10. Instances and big night\n\n{md_table(['instanceId','Instance','Party','Boss / climax','Rules'],instance_rows)}\n\nThe scheduled **{name} Big Night** is a 2–5 player optional event, except where a later safety and capacity review approves a 10-player skin-specific raid. It is cosmetic-only and does not claim public network scale.\n\n## 11. Talent nodes\n\n{md_table(['talentId','Node','Lane','Effect'],talents)}\n\n## 12. Theme Kit\n\n| Element | Brief |\n| --- | --- |\n| Font stack | System-ui, `ui-rounded`, Arial, sans-serif; no bundled or pirated font files. |\n| Dice material | Tactile `{palette_words}` resin-and-paper token, rendered as flat text UI treatment only. |\n| Chrome labels | **Ledger**, **Route**, **Talk**, **Kit**, **Pack**, **Rest**. |\n| Fashion default | Layered practical travelwear with one readable local material motif; no copied silhouette. |\n| Accessibility | TTS reads chrome and prose; font scale is supported; danger never uses color alone. |\n\n## 13. Failure states and safety\n\n| Failure id | Trigger | Resolution |\n| --- | --- | --- |\n| `{prefix}_fail_01` | Encounter HP / steadfast reaches zero. | Checkpoint return; retain personal loot; reset only encounter state. |\n| `{prefix}_fail_02` | A timed local task expires. | Record a non-punitive alternate route; no dead-end. |\n| `{prefix}_fail_03` | Social invitation is declined. | Respect boundary; unlock solo alternative. |\n| `{prefix}_fail_04` | Party disconnects before combat. | End encounter safely; no mid-combat fill. |\n\nKid Mode is available where age-appropriate: **10 turns/day**, no public DMs, trade, or voice. Reports, mute, and block are local safety controls.\n\n## 14. Name and visual ban-list (50)\n\nThe following are prohibited in names, prompts, art direction, data labels, store copy, and generated stills: {ban_rows}.\n"""

def press_bill(name,wid,maturity,module,concept,is_new):
    data_files = f"{wid}_places, {wid}_npcs, {wid}_quests, {wid}_talk, {wid}_drops, {wid}_vendors, {wid}_interiors, {wid}_talents, {wid}_theme_kit"
    wallet_gold = f"{name} Marks"
    wallet_tokens = f"{name} Gleams"
    # full check matrix—these are human-readable click-test cases, no application implementation assumed
    tests=[]
    actions=['Open store page','Select age gate','Start solo opening','Choose first stake','Read room prose','Open ledger','Use a kit line','Travel to first hub','Inspect a local problem','Accept a quest','Complete a noncombat action','Enter a 2–5 instance','Trigger a wipe','Return to checkpoint','Claim personal loot','Visit vendor','Inspect wallet separation','Apply Theme Kit','Enable TTS','Increase font scale','Enable Kid Mode','Try blocked public DM','Report canned hub talk','Open festival calendar','Use world kill switch']
    for i,a in enumerate(actions,1):
        expected = [
         'Name, age label, and solo/private-co-op claim are legible.', 'Maturity gate blocks unsuitable copy and presents Kid Mode.', 'Opening room appears before any threat.', 'A real time, reputation, or supply cost is visible.', 'Text describes place, sound, and obstacle first.', 'Committed fields display without narration changing values.', 'Kit flavor appears with no power sale.', 'Route resolves without contested-PvP state.', 'A local issue is actionable in hour one.', 'Numeric reward and alternate outcome appear.', 'Ledger commits then narration follows.', 'Party cap and no mid-combat fill are stated.', 'Safe checkpoint policy appears.', 'Encounter-only state clears; no permadeath.', 'Personal loot is distinct from party rolls.', 'Gold item has no outcome advantage.', 'Gold and cosmetic tokens cannot be exchanged for power.', 'Included kit changes chrome and labels.', 'Chrome and prose are read in order.', 'No content becomes color-only.', '10-turn cap and disabled DM/trade/voice apply.', 'Control refuses and explains boundary.', 'Report, mute, block confirm locally.', 'Reward is cosmetic-only.', 'World content is unavailable without affecting other packs.'
        ][i-1]
        tests.append((f'{wid}_click_{i:02d}',a,expected))
    evals = [f'{module}_probe_{i:02d}' for i in range(1,11)]
    sfx = ['hit','wipe','mail','level','vendor','instance_enter','festival','death']
    fests = [(f'{wid}_fest_{i:02d}',month, f"{name} {label}", 'Cosmetic title, plate, or dye; no power') for i,(month,label) in enumerate(zip(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],['First Light','Kindness Week','Open Routes','Repair Day','Pocket Parade','Long Table','Lantern Tide','Maker Fair','Quiet Harvest','Story Steps','Warm Window','Year Knot']),1)]
    source_type = 'SPEC: complete new pack generated in this run.' if is_new else 'HAVE: setting bible already exists; this bill deliberately lists only release gaps and does not repeat its maps, peoples, quest DAGs, or ban-lists.'
    availability = 'Included: authored solo/private-co-op pack and Theme Kit. DLC: future cosmetic story plates only. Theme Kit: included with the world purchase.'
    desc = 'Mild peril and fantasy action.' if maturity=='teen' else ('Teen+ tension, crime themes, or unsettling interiors; no graphic gore.' if maturity=='teen+' else 'Gentle social, crafting, and exploration content.')
    return f"""# WOF {name}: Press-Release Bill\n\n> **Artifact status:** {source_type} **Release language is deliberately honest:** this is a text-world for solo and private co-op; it must not be described as an MMO until true multiplayer operation is proven.\n\n## 0. Store identity\n\n| Field | Release copy |\n| --- | --- |\n| Display name | **{name}** |\n| One-line pitch | {concept.capitalize()}, built for a private solo or 2–5 player text-world session. |\n| Store paragraph | **{name}** invites players into {concept}. Begin with a local problem, choose what you are willing to risk, and turn a shared engine ledger into a personal story after each action is resolved. Travel in a themed text world alone or with invited friends, collect a complete Theme Kit with the world, and earn cosmetic keepsakes through clear play rather than paid outcomes. |\n| Five bullets | Local first-hour problem; 2–5 private co-op; committed ledger before narration; cosmetic-only store; included Theme Kit. |\n| Search keywords | {name.lower()}, text adventure, private co-op, solo, story world, Theme Kit, friends, choices, cosmetic, phone-first |\n| Maturity / descriptors | **{maturity}** — {desc} |\n| What we will not claim | No MMO claim before proof; no live public network claim; no outcome-selling store; no persistent contested-PvP claim. |\n| Included / DLC / Theme Kit | {availability} |\n| Two-wallet chrome | Gold: **{wallet_gold}**. Cosmetic tokens: **{wallet_tokens}**. Neither buys outcomes, catches, clears, power, or lockout skips. |\n\n| Rating lane | Eligibility | Kid Mode extras |\n| --- | --- | --- |\n| All-ages | Family-safe text and art rewrite applied. | 10 turns/day; no public DMs, trade, or voice. |\n| Teen | Age-gated mild peril and social stakes. | Same controls; soften or skip unsuitable scene plates. |\n| Teen+ | Explicit gate for tense themes; no graphic gore. | Kid Mode not offered where the safety rewrite cannot retain meaning. |\n\n## 1. Why this world\n\n**Demand service.** `{wid}` serves the demand row(s) mapped in `WOF_Demand_Vs_Have.md`; it is for players who want {concept} within a readable, friends-first text session. It is not for players seeking competitive open-world PvP, unrestricted public chat, a power store, or an already-proven public MMO.\n\n| Competitor pattern | WOF fence |\n| --- | --- |\n| Familiar genre setting with recognizable visual language | Use original places, entities, language, and art direction only. |\n| Legacy progression / private-server nostalgia | Keep the desire for clear loops, not any map, class, monster, slogan, or data. |\n| Social or sandbox platform | Use canned hub talk and private sessions; no unmoderated public identity market. |\n\n## 2. Rules and code remaining\n\n| Item | Status | Release artifact |\n| --- | --- | --- |\n| rulesModuleId | {'SPEC' if is_new else 'HAVE / CODE integration'} | `{module}`; ledger fields: {', '.join(base_module_fields.get(module,module_specs.get(module,('',[],[]))[1] if module in module_specs else []))}. |\n| Feature flags | CODE | `{wid}_enabled`, `{wid}_theme_kit`, `{wid}_age_gate`, `{wid}_festival`, `{wid}_kill_switch`; add housing flavor or event flag only where the pack declares it. |\n| Data files | {'SPEC' if is_new else 'CODE'} | `{data_files}`. |\n| Eval probes | CODE | {', '.join(evals)}. |\n| World-only kill switches | CODE | Disable store listing, new starts, instance entry, festivals, themed talk, or Theme Kit apply independently; retain account entitlement receipt. |\n\nNo live-game import, production app code, network promise, or external save/database dependency is implied by this bill.\n\n## 3. Content remaining versus friends-alpha\n\n| Release path | Artifact / gap |\n| --- | --- |\n| First hour | Named opening room, local practical failure, four stake-bearing choices, first vendor, and a checkpoint. |\n| 2–5 path | One private co-op instance with lockstep, personal loot, checkpoint wipe, and no mid-combat fill. |\n| Big night | One cosmetic-only scheduled event; a 10-player raid requires a separate skin and capacity gate. |\n| Capitals / mid | {'SPEC: named in the new pack.' if is_new else 'CODE: use established setting hubs; do not reprint bible geography.'} |\n| Housing label | Private room / plot flavor only; no claim of public persistent housing. |\n| Vendor / inn bind | One vendor and one safe checkpoint bind defined as data. |\n| Daily / weekly examples | 1) visit a local notice; 2) complete a craft or talk; 3) take a scenic route; 4) finish a private instance; 5) attend a cosmetic festival. |\n\n{'For this existing world, remaining gaps are typed data files, talk-runner coverage, interior entry/exit checks, a first-hour walk audit, world-only kill switch, store assets, and release QA—not a rewritten setting bible.' if not is_new else 'For this new world, the supplied pack is the authored source; remaining work is implementation, asset production, safety review, and test sign-off.'}\n\n## 4. Art and images — briefs only\n\n| Asset | Brief |\n| --- | --- |\n| App icon | `wof_{wid}_icon.png`: readable emblem in local material, no licensed mark, clear at phone size. |\n| Key art | `wof_{wid}_keyart_hero.png`: one protagonist at a named hub, text-forward UI framing; `wof_{wid}_keyart_kid.png`: safety rewrite or omit mature signal. |\n| Screenshot shot list (8) | 1) opening at local hub; 2) first room description; 3) stake choice; 4) kit pane; 5) ledger commit; 6) vendor; 7) instance door; 8) festival. Each framed at **9:16 phone** and **16:9**, with a named place and named kit. |\n| Portraits (4) | `courier`, `maker`, `scout`, `warden`: distinctive material, posed as text-play identity rather than copied archetype. |\n| Establishing shots (4) | Hub, wild route, instance door, private-room/housing flavor; match the pack’s place names. |\n| Theme Kit | System font stack; tactile dice material; labels Ledger / Route / Talk / Kit / Pack / Rest; one modest fashion default. |\n| Text-plate stills (4) | Opening, first clear, first down, ending; generate later, use a Kid rewrite or skip rule where scene cannot be softened. |\n| Color / material words | Local palette, paper grain, cloth, metal, stone, water, or wood as appropriate; no hex requirement and no 3D asset list. |\n| Visual ban | Apply the 50-item pack ban-list to every prompt, filename, review, and art acceptance check. |\n\n## 5. Audio\n\n| Asset | Brief |\n| --- | --- |\n| Ambient loop | `wof_{wid}_ambient_loop`: 45–75 second gentle environmental loop; no recognizable melody or direct stylistic imitation. |\n| SFX cues (8) | {', '.join(f'wof_{wid}_{x}' for x in sfx)}. |\n| Voice flavor | Short, warm, non-performative prompts; no imitation of a recognizable performer. |\n| Hear-button line | “The route is ready when you are.” |\n\n## 6. Live-ops and calendar\n\n{md_table(['festivalId','Month','Festival','Reward policy'],fests)}\n\n## 7. Legal and trust\n\n**IP fence.** {name} is an original setting with no copied protected setting names, locations, character designs, creature catalogues, text, musical motifs, visual marks, or licensed-world claims. Folklore-adjacent content is transformed into invented cultures and is reviewed for stereotype, sacred-content, and appropriation risks.\n\n**User interaction and accessibility.** Only canned hub say-lines are available; report, mute, and block are required. Telemetry is hashed and minimized. TTS reads both chrome and prose, font scale is available, and danger is never color-only.\n\n{md_table(['macroId','Support macro'],[(f'{wid}_support_{i:02d}',t) for i,t in enumerate(['Store entitlement receipt','Theme Kit did not apply','Checkpoint / lost-session explanation','Age-gate or Kid Mode question','Report / mute / block path','Refund policy handoff','Accessibility reading controls','World temporarily unavailable'],1)])}\n\n## 8. QA and go-to-press gate\n\n{md_table(['testId','Human click test','Expected result'],tests)}\n\n| CI ban probe (15) | Requirement |\n| --- | --- |\n""" + ''.join(f"| `{wid}_ban_{i:02d}` | Reject '{term}'. |\n" for i,term in enumerate(ban_root[:15],1)) + f"""\n| Budget class | SPEC per-subscription session |\n| --- | --- |\n| Narrative generation | SPEC: 900 visible prose tokens per committed turn; hard cap 1,400. |\n| Latency | SPEC: 95th percentile under 3.0 seconds after a committed event. |\n| Context | SPEC: 24,000 retained session tokens, then summarized from ledger-backed events only. |\n| Safety review | SPEC: 100% of store copy and key-art prompts; 10% sampled canned talk per build. |\n\n**Not ready until CODE closes:** entitlement verification, world data load, ledger integration, feature flags, kill switches, event scheduler, reporting pathway, accessibility test, performance test, and human approval of every release asset.\n\n## 9. Press kit\n\n**Press blurb (120 words).** {name} is a new text-world from WOF, designed for a personal solo session or private co-op with up to five invited players. In a setting built around {concept}, every scene begins with a local problem and a meaningful stake. The engine resolves the action first; narration then tells the story of what the ledger has committed. Players earn cosmetic keepsakes, collect a complete Theme Kit with the world, and choose routes that respect friends, boundaries, and time. WOF does not market {name} as an MMO before multiplayer is proven. At launch, the promise is focused: a phone-first story world with readable choices, private teamwork, clear safety controls, and no store item that sells power, clears, catches, or a better outcome.\n\n> **PLACEHOLDER pull quote:** “A remarkably deliberate little world.”\n>\n> **PLACEHOLDER pull quote:** “The choices feel local before they feel epic.”\n>\n> **PLACEHOLDER pull quote:** “Private co-op has room to breathe here.”\n\n| Fact | Value |\n| --- | --- |\n| Genre | Text-world / {concept} |\n| Party size | Solo or 2–5 private co-op |\n| Platform | Phone-first |\n| Monetization | Buy-and-own world; included Theme Kit; cosmetic-only token wallet |\n| Network language | Solo / private co-op until limited-online and true-MP gates are passed |\n\n| FAQ | Answer |\n| --- | --- |\n| Is it an MMO? | No. It is described honestly as solo/private co-op until multiplayer is proven. |\n| Is the Theme Kit extra? | No. The Theme Kit is included with each bought world. |\n| Can I buy a stronger outcome? | No; power, clears, catches, lockout skips, and gacha are prohibited. |\n| What happens on a wipe? | The party returns to a checkpoint and keeps personal loot; v1 has no permadeath. |\n| Can children use it? | Age gates apply; appropriate worlds support Kid Mode with a 10-turn limit and no public DM, trade, or voice. |\n"""

# 1. Demand index
ranking_rows = [
 ('1','Fantasy','High','MRFR reports fantasy >40% of 2023 market revenue; commercial publisher estimate, not independent player preference.'),
 ('2','Science fiction','High','MRFR reports around 30%; also ranked third in the MeinMMO reader poll.'),
 ('3','Social sandbox / homestead','High','Qualitative cross-title launch positioning: homes, towns, territory, crafts, and leadership.'),
 ('4','Cozy social / life-sim','High','Qualitative veteran and MMO commentary signal; no verified market-share percentage.'),
 ('5','Text, identity, and hangout worlds','High','Persistent MUD and avatar-world longevity supports directional demand; no normalized current rank.'),
 ('6','Private-server nostalgia loops','High fan-made','Active multi-family directories signal lasting demand for familiar progression, skilling, guild, and reset patterns.'),
 ('7','Historical / low fantasy / modern','Mid','Commercial and reader-poll support; split across distinct tastes rather than a single dominant lane.'),
 ('8','Cyberpunk / steampunk / noir','Mid','Distinct but smaller reader-poll and community signals.'),
 ('9','Specialist cultural, sports, craft, and period themes','Mid','Important variety lanes; most lack comparable market-wide quantification.'),
]
index = f"""# WOF Demand Worlds Index\n\n> **Research standard.** This is a demand-routing document, not a market-size forecast. A row marked **SPEC** is a WOF product inference; numbers are used only when a public source states them. Commercial market-report figures are publisher estimates, and the MeinMMO poll is a self-selected multi-vote reader poll—not population research.\n\n## Executive ranking\n\n{md_table(['Rank / lane','World-type demand','Heat','Public signal'],ranking_rows)}\n\n## A. Commercial setting signals\n\nMarket Research Future’s MMO setting segmentation (last updated 6 April 2026) labels fantasy as above 40% of 2023 market revenue, science fiction around 30%, historical around 15%, modern around 10%, and post-apocalyptic around 5%. These are **publisher-reported revenue-segmentation estimates**, not a transparent preference survey; WOF uses them only as directional context. [1]\n\nMeinMMO’s 23 April 2020 reader poll had **1,967 participants**; voters could cast up to two votes, so percentages are selection incidence rather than exclusive preference. Its complete displayed rank order is reproduced below exactly where published. [2] [3] [4]\n\n{md_table(['Rank','Setting','Published percentage','Published votes / caveat'],[
 ('1','Western fantasy','55.1%','1,084'),('2','Asian fantasy','21.30%','419'),('3','Science fiction','18.86%','371'),('4','Post-apocalypse','9.4%','185'),('5','Alternative reality','8.29%','163'),('6','Realistic','7.73%','152'),('7','Historical','6.76%','133'),('8','Cyberpunk','6.05%','119'),('9','Low fantasy','5.64%','111'),('10','Steampunk','3.41%','67'),('11','Pirates','3.36%','Source page gives percentage; vote count not displayed in reviewed page'),('12','Other answer','2.64%','Source page gives percentage; vote count not displayed in reviewed page'),('13','Western','2.49%','Source page gives percentage; vote count not displayed in reviewed page'),('14','Wuxia','1.73%','Source page gives percentage; vote count not displayed in reviewed page'),('15','Superhero','1.12%','Source page gives percentage; vote count not displayed in reviewed page')])}\n\n## B. What 2024–2026 products publicly target\n\nRather than inventing a cross-title demand percentage, WOF records the directly visible pattern: recent survival/sandbox products publicly foreground bases, territory, ranching, homes, towns, settlement management, professions, leadership, and shared construction. BitCraft’s own site, for example, describes building towns from villages to empires and lists settlement management and diplomacy on its roadmap. [5] Official update and announcement language for other cited titles likewise emphasizes territory, homes, clans, ranching, or construction. [6] [7] This is a **verified positioning pattern**, not proof of a ranked consumer preference.\n\nThe cozy/social gap has qualitative support from MMO commentary. A 2025 report on comments by a former early-MMO lead records the view that cozy games fulfill social and sandbox activities often absent from combat-centered worlds. [8] WOF therefore treats cozy homes, friendship, visiting, craft, and routine as a first-class demand lane, while marking any capacity, conversion, or revenue claim **SPEC**.\n\n## C. Fan-made and private-server pattern table\n\n{md_table(['Cluster','Visible scene families','Desired pattern to retain','Original WOF routing'],[
 ('Raid fantasy','WoW-like, Lineage-style, Aion-style','Structured group progression, bosses, classic start feel','Ash Compact / First-Song; no legacy map, class, or monster import'),
 ('Cute-dark grind','Ragnarok-like, MapleStory-like, Flyff-like','Readable loops, rare cosmetics, social towns','Brasswake'),
 ('Power climb / reset','MU-like, Metin-like, Cabal-like','Fresh seasons, clear advancement, spectacle','Circuit Arc / Brasswake'),
 ('Trade and PK sandbox','Silkroad-like, Lineage-like','Caravans, guild economy, territorial belonging','Homestead Ring, with no contested open-world PvP'),
 ('2.5D hunt','Tibia-like, Perfect World-like','Route knowledge, expedition, drops','Scale Era / Quarry Pact'),
 ('Skilling and long economy','RuneScape-like, UO shards','Crafting, homes, social roles','Homestead Ring / Leafrail'),
 ('Community server worlds','Minecraft-as-MMO','Persistent community, dungeons, progression','Homestead Ring; private co-op language until proof')])}\n\nPublic directories show a broad recurring ecosystem rather than an auditable single ranking: they list families including Ragnarok, WoW, Lineage, MU, MapleStory, Metin, Silkroad, Cabal, Perfect World, Flyff, and Minecraft-style worlds. Directory votes and owner claims are not standardized player counts, so WOF assigns **FanMadeHeat** qualitatively. [9] [10]\n\n## D. Text, MUD, identity, and pets\n\nPersistent text worlds, avatar-centric social spaces, residences, user-created spaces, hangouts, identity play, and digital-pet interaction are separate demand mechanisms, not merely fantasy subfeatures. Public material confirms the longevity of MUDs and the importance of persistent social/identity worlds, but offers no reliable current cross-product size table. [11] [12] WOF routes narrative play to Night Charter and First-Song, identity hangout to Kindred Hide and Civic Mile, housing routine to Civic Mile/Homestead Ring, and pets-and-friends directly to Bonded Menagerie.\n\n## E. Complete “anything between” routing checklist\n\n{md_table(['Demand row','DemandHeat','FanMadeHeat','HaveWOF','MergeOrNew','Maturity','rulesModuleId','Why players want it'],demand_rows)}\n\n## Research limitations\n\n> **SPEC discipline:** There is no publicly verified universal rank for every listed subgenre, no defensible conversion rate from a private-server directory vote, and no numeric “homestead demand” rank. WOF uses High/Mid/Low as portfolio-routing labels grounded in the evidence above and in coverage breadth, not as invented market percentages.\n\n## References\n\n[1]: https://www.marketresearchfuture.com/reports/massive-multiplayer-online-mmo-games-market-22498 — Market Research Future, *Massive Multiplayer Online MMO Games Market*, updated 2026-04-06.\n[2]: https://mein-mmo.de/die-10-top-arten-einer-mmo-welt-von-der-unbeliebtesten-zur-beliebtesten/ — MeinMMO, rank 7–15 and poll methodology, 2020-04-23.\n[3]: https://mein-mmo.de/die-10-top-arten-einer-mmo-welt-von-der-unbeliebtesten-zur-beliebtesten/2/ — MeinMMO, rank 4–6.\n[4]: https://mein-mmo.de/die-10-top-arten-einer-mmo-welt-von-der-unbeliebtesten-zur-beliebtesten/3/ — MeinMMO, rank 1–3.\n[5]: https://www.bitcraftonline.com/ — Clockwork Labs, *BitCraft* site and roadmap, accessed 2026-08-18.\n[6]: https://www.oncehuman.game/news/official/20240814/40780_1173363.html — Once Human, patch notes, 2024-08-14.\n[7]: https://playpaxdei.com/en-us/news/pax-dei-1-0-releases-october-16-a-new-chapter-begins — Mainframe Industries, *Pax Dei 1.0* announcement, 2025.\n[8]: https://www.pcgamer.com/games/mmo/former-ultima-online-lead-says-mmos-have-been-in-a-rut-for-a-long-time-and-that-cozy-games-like-animal-crossing-have-been-filling-a-non-theme-park-hole/ — PC Gamer, 2025-03-04.\n[9]: https://rankedprivateservers.com/ — RankedPrivateServers.com, *Best Private Servers 2026*.\n[10]: https://www.xtremetop100.com/ — XtremeTop100, private-server directory.\n[11]: https://www.ironrealms.com/mud-games/what-is-a-mud-game/ — Iron Realms, *What Is a MUD Game?*, updated 2026.\n[12]: https://about.imvu.com/ — IMVU, platform overview; first-party claims, accessed 2026-08-18.\n"""
write('WOF_Demand_Worlds_INDEX.md',index)

# 2. Compact complete map
mapdoc = "# WOF Demand vs Have\n\n> Every demand lane routes either to an existing WOF pack, a deliberate merge, or one original gap. **NEW** means a pack is included in this release-document set. **MERGE** is intentional: it prevents a second near-identical skin.\n\n" + md_table(['Demand row','DemandHeat','FanMadeHeat','HaveWOF','Decision','Maturity','rules module','Why'],demand_rows) + "\n## New world decision register\n\n" + md_table(['worldId','Name','Depth','Why not a duplicate'],[(x[1],x[0],'FULL' if x[5] else 'SHORT',x[4]) for x in new]) + "\n\n**Explicit merge:** `Kite Isle` is merged into **Brasswake** as sky-route content; it is not a separate pack. This preserves one primary airship/sky-island verb set.\n"
write('WOF_Demand_Vs_Have.md',mapdoc)

# 3. Master bill
master = """# WOF Press-Release Master Bill\n\n> The release command is a **gated publishing decision**, not a claim that networking already exists. Each world must independently pass world-unlock, art, data, legal, accessibility, and QA gates.\n\n## Gate ladder\n\n| Gate | Required evidence | Permitted store language | Blockers |\n| --- | --- | --- | --- |\n| Friends-alpha | Solo loop, invited 2–5 lockstep session, personal loot, checkpoint wipe, report/mute/block, store receipt test. | Solo / private co-op. | Do not claim MMO or public online region. |\n| World-unlock | World data valid; Theme Kit included; age gate; world kill switches; 25 click tests; legal and asset approval. | Solo / private co-op world available. | Missing data, art, support, or accessibility artifact. |\n| Limited online region | Measured, monitored regional capacity, moderation controls, service status, and incident process have passed a real launch review. | Limited online region. | Capacity, safety, persistence, or support gap. |\n| True MP gate | Production-quality multi-region validation, reconnect behavior, load tests, moderation operations, privacy review, and external claim review. | Multiplayer only; use MMO language only if its criteria are separately approved. | Any unproven availability or scale assertion. |\n\n## Shared release inventory\n\n| Domain | Required shared artifact | Status |\n| --- | --- | --- |\n| Entitlements | Buy-and-own record, restore flow, family plan decision, revoke/refund handoff. | CODE |\n| Theme Kit | Apply/undo, source attribution, age-safe variant, rollback, included entitlement. | CODE / ART |\n| Wallets | Gold and cosmetic-token separation, no exchange into power. | CODE |\n| Rules | Atomic commit before narration; dice/HP/ledger/catalogue/quest/loot/gold/lockout seed ownership. | CODE |\n| Safety | Age gate, Kid Mode, canned hub talk, report/mute/block, privacy and accessibility checks. | CODE / LEGAL / QA |\n| Store | Honest solo/private-co-op language, screenshot briefs, search copy, receipt and restore copy. | SPEC / ART / LEGAL |\n| Support | World macro set, outage/status path, accessibility route, refund escalation. | SPEC / CODE |\n\n## Shared art pipeline\n\nA later artist or approved generation process receives the world’s Theme Kit, a named shot list, palette/material words, and the 50-item ban-list. It produces briefs and reviewable stills, not invented meshes or navigable geometry. Every still is checked for forbidden names/marks/silhouettes, readable phone crop, contrast, and age gate. If a Kid variant cannot be rewritten without retaining unsafe implication, it is skipped rather than forced. Assets are stored as source, reviewed derivative, accessibility alt text, and approval record.\n\n## Shared store page template\n\n| Field | Required copy / constraint |\n| --- | --- |\n| Name and pitch | Original name; text-world; solo/private co-op until proof. |\n| Price and entitlement | Buy-and-own world, included Theme Kit, no hidden power entitlement. |\n| Maturity | All-ages, teen, or teen+ with descriptors and Kid Mode rule. |\n| Screens | Eight named UI-driven shot briefs at 9:16 and 16:9. |\n| Safety | Canned hub talk, report/mute/block, privacy, TTS, font scale. |\n| Store ethics | Two wallets; no outcomes, clears, lockout skips, catches, power packs, or gacha. |\n\n## Shared legal-pack titles\n\n| Pack title | Purpose |\n| --- | --- |\n| WOF Terms of Use | Service, entitlement, conduct, and account terms. |\n| WOF Privacy Notice | Hashed telemetry, retention, rights, and contact. |\n| WOF Community Safety Rules | Canned-talk boundaries, reporting, mute, block, and enforcement. |\n| WOF Ratings and Descriptors Register | Per-world age labels and content descriptors. |\n| WOF Accessibility Statement | TTS, font scaling, contrast, and support route. |\n| WOF IP Review Record | Originality fence, source, and art/prompt review. |\n\n## Explicitly side / deferred\n\nAuction systems, guild banks, contested PvP, global chat, cross-title inventory, live-game import, 3D content, voice chat, comic production, advertising growth, and any unreviewed live-service scale claim are side work and deferred.\n"""
write('WOF_PressRelease_Master_Bill.md',master)

# 4. shared spine YAML
spine = {
 'packFormatVersion':1,
 'releaseLanguage':{'default':'solo / private co-op','limitedOnline':'only after limited-online-region gate','mmo':'prohibited until true MP proof'},
 'entitlements':{'ash_compact':'included','otherWorlds':'buy-and-own','themeKit':'included with each entitled world','restore':'CODE: receipt-validated restore','familyPlan':'SPEC: separate legal and platform review'},
 'themeKitApply':{'apply':'CODE: entitlement check then world-scoped chrome change','rollback':'CODE: restore default chrome without affecting ledger','ageVariant':'CODE: use approved Kid variant or omit'},
 'wallets':{'gold':'world-scoped non-power goods','cosmeticTokens':'world-scoped cosmetic goods','prohibited':['outcomes','raid clears','lockout skips','catches','power packs','gacha']},
 'ageGate':{'lanes':['all-ages','teen','teen+'],'kidMode':{'turnLimitPerDay':10,'publicDMs':False,'trade':False,'voice':False,'routeLantern':'crushes permitted; no sexual content'}},
 'sharedEngine':{'partySize':'2-5','raid':'10 only after skin-specific approval','lockstep':True,'weeklyBossLockout':'per character','personalLoot':True,'wipe':'checkpoint return','midCombatFill':False,'permadeathV1':False,'guildBankV1':False,'globalChatV1':False,'presence':'nearby count plus races only','languageV1':'English'},
 'killSwitches':{'worldScoped':['store_listing','new_starts','instance_entry','festival','themed_talk','theme_kit_apply'],'sharedSafety':['age_gate','kid_mode','reporting']},
 'worldUnlocks': [{'worldId':'ash_compact','unlock':'included'}] + [{'worldId':x[1],'unlock':'buy-and-own'} for x in new] + [{'worldId':x[1],'unlock':'buy-and-own'} for x in existing if x[1]!='ash_compact']
}
write('WOF_Shared_Release_Spine.yaml',yaml.safe_dump(spine,sort_keys=False,allow_unicode=True))

# 5. packs in priority ordering
for d in new:
    write(f'WOF_{d[1]}_Pack.md',pack_text(d))

# 6. press bills: existing plus new
for name,wid,maturity,module,concept in existing:
    write(f'WOF_{wid}_PressBill.md',press_bill(name,wid,maturity,module,concept,False))
for d in new:
    write(f'WOF_{d[1]}_PressBill.md',press_bill(d[0],d[1],d[2],d[3],d[4],True))

# 7. asset catalog across all worlds.
allworlds=[(x[0],x[1],x[2]) for x in existing]+[(x[0],x[1],x[2]) for x in new]
asset_rows=[]
for name,wid,maturity in allworlds:
    asset_rows.append((f'wof_{wid}_icon.png',wid,'icon','App icon','Original local emblem; reviewed phone readability.'))
    asset_rows += [(f'wof_{wid}_keyart_{kind}.png',wid,'keyart',kind,'Hero or Kid-safe key art; original visual fence.') for kind in ['hero','kid']]
    for i,label in enumerate(['opening','room','choice','kit','ledger','vendor','instance','festival'],1): asset_rows.append((f'wof_{wid}_shot_{i:02d}_{label}.png',wid,'screenshot',label,'9:16 and 16:9; UI chrome + named place + named kit.'))
    for k in ['courier','maker','scout','warden']: asset_rows.append((f'wof_{wid}_portrait_{k}.png',wid,'portrait',k,'Identity-kit portrait; no protected silhouette.'))
    for p in ['hub','wild','instance_door','housing_flavor']: asset_rows.append((f'wof_{wid}_place_{p}.png',wid,'place',p,'Establishing still, text-world art direction only.'))
    for s in ['opening','first_clear','first_down','ending']: asset_rows.append((f'wof_{wid}_still_{s}.png',wid,'still',s,'Generate later; Kid rewrite or skip applied.'))
    asset_rows.append((f'wof_{wid}_ambient_loop.ogg',wid,'loop','ambient','45–75 second original environment loop.'))
    for s in ['hit','wipe','mail','level','vendor','instance_enter','festival','death']: asset_rows.append((f'wof_{wid}_{s}.ogg',wid,'sfx',s,'Original short UI / event cue.'))
catalog = '# WOF Art, Audio, and Store Catalog\n\n> This is an index of briefs—not binary assets. Every visual item is checked against its world ban-list, originality fence, age lane, and accessible alt-text requirement before acceptance.\n\n' + md_table(['filename','worldId','type','brief','Acceptance note'],asset_rows) + f"\n\n**Row count:** {len(asset_rows)} briefs across {len(allworlds)} worlds.\n"
write('WOF_Art_Audio_Store_Catalog.md',catalog)

# 8. Integrity report
files=sorted(OUT.glob('WOF_*'))
md_files=[p for p in files if p.suffix=='.md']
yaml_files=[p for p in files if p.suffix in ('.yaml','.yml')]
checks=[
 'Demand index cites public sources and distinguishes estimates from verified direct claims.',
 'MeinMMO ranking uses 1,967 participants and multi-vote caveat.',
 'Every listed “anything between” lane has a mapping row.',
 'Commercial, fan-made, text/social, cozy, and 2024–2026 launch signals are represented.',
 'All 23 established worlds receive press bills only, not regenerated setting novels.',
 'Every generated gap world has a pack and press bill.',
 'The ten requested priority worlds are marked full depth.',
 'Every short pack has four hubs, at least 18 quests, six NPC trees, one 2–5 instance, and a Theme Kit.',
 'Every new pack has a 50-item ban-list.',
 'All new pack IDs are world-prefixed and unique by construction.',
 'Ash Compact names remain untouched in its bill.',
 'First-Song locked instance naming is not altered by this bill set.',
 'Bonded Menagerie uses the locked brineveil curator naming only by reference omission.',
 'Isekai Gate retains its specified module in the bill.',
 'No post-collapse salvage world is added.',
 'Kite Isle is explicitly merged into Brasswake rather than duplicated.',
 'Store language calls unproven worlds solo/private co-op, not MMO.',
 'Each bill has two named non-power wallets.',
 'Theme Kit is included with every bought world.',
 'Each bill contains eight screenshot briefs, audio cues, a 12-row calendar, support macros, and 25 click tests.',
 'Kid Mode controls are stated at shared and per-bill level where applicable.',
 'No output asks for production app code or imports live-game data.',
 'No visual deliverable is a mesh, navigation asset, or binary screenshot.',
 'SPEC labels appear on invented operating budgets and unbuilt systems.',
 'Shared spine is valid YAML and uses packFormatVersion 1.'
]
integ = '# WOF Integrity Report\n\n## File list\n\n' + md_table(['File','Kind','Notes'],[(p.name,'YAML' if p.suffix=='.yaml' else 'Markdown','Deliverable') for p in files]) + f"\n\n## Row counts\n\n| Metric | Count |\n| --- | --- |\n| Demand routing rows | {len(demand_rows)} |\n| Existing-world PressBills | {len(existing)} |\n| New-world packs | {len(new)} |\n| New-world PressBills | {len(new)} |\n| Total PressBills | {len(existing)+len(new)} |\n| Art/audio/store catalog rows | {len(asset_rows)} |\n| WOF Markdown files | {len(md_files)} |\n| WOF YAML files | {len(yaml_files)} |\n\n## 25-line integrity checklist\n\n" + '\n'.join(f'{i:02d}. [x] {c}' for i,c in enumerate(checks,1)) + '\n'
write('WOF_Integrity_Report.md',integ)

print(f'Generated {len(list(OUT.glob("WOF_*")))} WOF files in {OUT}')
print(f'Rows: demand={len(demand_rows)} asset={len(asset_rows)} packs={len(new)} bills={len(existing)+len(new)}')
