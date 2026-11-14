/**
 * Fixed per-race name banks for the player's random-name button and "Random designation".
 *
 * Copyright-free by construction: every entry is a real historical / folk name
 * (medieval English, Old Norse, Welsh/Cornish/Irish, Tudor English, German/Swiss/Dutch,
 * Roman, Akkadian/Old Persian, Basque) or a plain English word compound / generic coinage.
 * Nothing is taken from D&D books, Tolkien, Forgotten Realms or any other trademarked setting.
 *
 * This is a fixed data table. Do not grow it from play; the picker only reads it.
 * `match` holds the race words that select a bank from the player's species answer or sheet.
 */
export type RaceNameKey =
  | 'modern' | 'human' | 'dwarf' | 'elf' | 'halfling' | 'gnome' | 'orc'
  | 'tiefling' | 'dragonborn' | 'goliath' | 'goblin' | 'beastfolk';

export interface RaceNameBank {
  /** Lower-case race words that pick this bank (whole words in the species text). */
  match: string[];
  given: string[];
  surnames: string[];
}

export const RACE_NAME_BANKS: Record<RaceNameKey, RaceNameBank> = {
  // Contemporary first names and surnames (Earth-origin: system apocalypse, isekai, VRMMO).
  modern: {
    match: [],
    given: [
      'Jax', 'Ren', 'Sam', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery', 'Jordan', 'Blake',
      'Alex', 'Charlie', 'Jamie', 'Taylor', 'Robin', 'Kai', 'Max', 'Leah', 'Priya', 'Omar',
      'Zara', 'Ellis', 'Noor', 'Tom', 'Hannah', 'Dev', 'Chloe', 'Ben', 'Aisha', 'Luca',
      'Maya', 'Theo', 'Nadia', 'Owen', 'Isla', 'Femi',
    ],
    surnames: [
      'Doyle', 'Patel', 'Okafor', 'Hughes', 'Carter', 'Khan', 'Walsh', 'Nguyen', 'Brennan',
      'Murphy', 'Shaw', 'Ahmed', 'Price', 'Kowalski', 'Reid', 'Fletcher', 'Lowe', 'Santos',
    ],
  },
  // Medieval English given names; English trade and place surnames.
  human: {
    match: ['human', 'man', 'woman', 'person'],
    given: [
      'Aldous', 'Agnes', 'Bartholomew', 'Beatrice', 'Cuthbert', 'Cecily', 'Edmund', 'Edith',
      'Geoffrey', 'Isabel', 'Hugh', 'Joan', 'Walter', 'Margery', 'Roger', 'Alys', 'Gilbert',
      'Matilda', 'Osbert', 'Rose', 'Simon', 'Emma', 'Ralph', 'Juliana', 'Piers', 'Avice',
      'Hamon', 'Sybil', 'Godfrey', 'Elinor', 'Ranulf', 'Maud', 'Warin', 'Christiana',
    ],
    surnames: [
      'Ashdown', 'Bramley', 'Cooper', 'Dyer', 'Fairweather', 'Fowler', 'Greenwood', 'Hayward',
      'Marsh', 'Miller', 'Parker', 'Ridley', 'Sawyer', 'Thatcher', 'Turner', 'Wainwright',
      'Webb', 'Yeoman',
    ],
  },
  // Old Norse given names; Norse patronymics and plain craft clan names.
  dwarf: {
    match: ['dwarf', 'dwarven', 'dwarvish'],
    given: [
      'Thorgeir', 'Asgerd', 'Bjarni', 'Bergljot', 'Eyvind', 'Dagny', 'Grimkel', 'Gudrun',
      'Hallvard', 'Hildigunn', 'Ingolf', 'Jorunn', 'Ketil', 'Ragnhild', 'Orm', 'Sigrid',
      'Steinar', 'Thora', 'Ulf', 'Vigdis', 'Halldor', 'Asa', 'Thorvald', 'Gunnhild',
      'Kolbein', 'Helga', 'Skeggi', 'Herdis', 'Sverri', 'Yngvild', 'Brand', 'Ingunn',
      'Haki', 'Thordis',
    ],
    surnames: [
      'Bjarnason', 'Eyvindsson', 'Hallsson', 'Ulfsson', 'Kolbeinsson', 'Steinsdottir',
      'Grimsdottir', 'Ragnsdottir', 'Stonehand', 'Ironvein', 'Coalbrand', 'Deepdelve',
      'Copperhelm', 'Flintmantle', 'Graveldeep', 'Ashanvil', 'Slagmere', 'Tinderhearth',
    ],
  },
  // Welsh, Cornish and Irish given names; plain nature house names.
  elf: {
    match: ['elf', 'elven', 'elvish', 'half-elf', 'halfelf'],
    given: [
      'Aneira', 'Bedwyr', 'Branwen', 'Gwenith', 'Dafydd', 'Eluned', 'Emrys', 'Ffion', 'Gwion',
      'Heledd', 'Idris', 'Lowenna', 'Meraud', 'Morwenna', 'Kerensa', 'Peran', 'Jowan', 'Aoife',
      'Cian', 'Niamh', 'Oisin', 'Orla', 'Ronan', 'Siobhan', 'Tadhg', 'Ciara', 'Eimear',
      'Fiachra', 'Gwenllian', 'Rhodri', 'Tegwen', 'Iolo', 'Nesta', 'Caradog',
    ],
    surnames: [
      'Ashgrove', 'Birchwater', 'Dawnmere', 'Fernhollow', 'Hazelbrook', 'Larkspur', 'Mosswell',
      'Mistvale', 'Nightbloom', 'Oakmere', 'Rainleaf', 'Silverbirch', 'Starwell', 'Thornwood',
      'Willowmere', 'Brightwater', 'Elmshade', 'Swiftwind',
    ],
  },
  // Tudor/Puritan English country names; English field and farm surnames.
  halfling: {
    match: ['halfling'],
    given: [
      'Tobias', 'Hester', 'Josiah', 'Prudence', 'Jethro', 'Patience', 'Barnaby', 'Tabitha',
      'Ezekiel', 'Mercy', 'Jasper', 'Dorcas', 'Ambrose', 'Lettice', 'Gideon', 'Bridget',
      'Nathaniel', 'Temperance', 'Silas', 'Joyce', 'Humphrey', 'Grace', 'Abel', 'Damaris',
      'Rufus', 'Honor', 'Obadiah', 'Philippa', 'Enoch', 'Thomasina', 'Cyprian', 'Kezia',
      'Elias', 'Winifred',
    ],
    surnames: [
      'Applegarth', 'Barleycorn', 'Bramblecote', 'Cobley', 'Dimmock', 'Furrow', 'Hedgecock',
      'Honeysett', 'Littlecott', 'Meadowes', 'Pennyfeather', 'Ramsbottom', 'Sidebottom',
      'Tuckwell', 'Whitlock', 'Wheatley', 'Yarrow', 'Oddie',
    ],
  },
  // German, Swiss and Dutch given names; German craft surnames.
  gnome: {
    match: ['gnome', 'gnomish'],
    given: [
      'Anselm', 'Adelheid', 'Balthasar', 'Gottfried', 'Gertrud', 'Kaspar', 'Liesl', 'Leopold',
      'Margarethe', 'Ulrich', 'Ottilie', 'Wendelin', 'Hedwig', 'Florian', 'Walburga', 'Joost',
      'Femke', 'Pieter', 'Anneke', 'Maarten', 'Griet', 'Cornelis', 'Geertje', 'Ruedi', 'Vreni',
      'Urs', 'Seraina', 'Wim', 'Ignaz', 'Kunigunde', 'Theobald', 'Ilse', 'Benedikt', 'Hilde',
    ],
    surnames: [
      'Uhrmacher', 'Zimmermann', 'Kesselring', 'Glaser', 'Drechsler', 'Schlosser', 'Spengler',
      'Bergmann', 'Federspiel', 'Kupferschmied', 'Brenner', 'Messner', 'Rademacher', 'Hufnagel',
      'Kleinschmidt', 'Spindler', 'Zwirn', 'Kettler',
    ],
  },
  // Generic coined names; plain English epithet surnames.
  orc: {
    match: ['orc', 'orcish', 'half-orc', 'halforc'],
    given: [
      'Gorvak', 'Druzha', 'Brakka', 'Varuk', 'Oshka', 'Rugar', 'Tazgha', 'Borzo', 'Ulvra',
      'Dakmar', 'Kezrak', 'Morva', 'Zurak', 'Haskra', 'Torvug', 'Yazga', 'Brug', 'Shazka',
      'Ozrek', 'Krulda', 'Vashk', 'Ruzvek', 'Rakhul', 'Gurza', 'Mokta', 'Drevak', 'Uzra',
      'Skarn', 'Vorka', 'Harrak', 'Zhurga', 'Kovrek', 'Tulka', 'Graznek',
    ],
    surnames: [
      'Ironjaw', 'Redtusk', 'Stonefist', 'Ashmaw', 'Bonebreaker', 'Longtooth', 'Scarbrow',
      'Wolfbane', 'Grimhide', 'Brokenspear', 'Thunderfoot', 'Coldiron', 'Rustfang', 'Halfear',
      'Splitlip', 'Mudwallow', 'Thornback', 'Gravelgut',
    ],
  },
  // Roman and late-antique given names; Latin cognomina.
  tiefling: {
    match: ['tiefling'],
    given: [
      'Aurelia', 'Cassian', 'Lucilla', 'Aemilius', 'Livia', 'Octavian', 'Flavia', 'Decimus',
      'Valeria', 'Marcellus', 'Junia', 'Tiberius', 'Cornelia', 'Quintus', 'Faustina', 'Lucan',
      'Drusilla', 'Valens', 'Galla', 'Aetius', 'Honoria', 'Maximus', 'Placidia', 'Ambrosius',
      'Domitia', 'Varro', 'Septima', 'Corvus', 'Antonia', 'Gaius', 'Serena', 'Felix',
      'Calpurnia', 'Vitus',
    ],
    surnames: [
      'Ahenobarbus', 'Caecus', 'Crassus', 'Furvus', 'Lentulus', 'Naso', 'Rufus', 'Scaevola',
      'Varus', 'Vespillo', 'Calvus', 'Corvinus', 'Cotta', 'Dolabella', 'Flaccus', 'Metellus',
      'Piso', 'Strabo',
    ],
  },
  // Akkadian and Old Persian historical names; plain English clutch names.
  dragonborn: {
    match: ['dragonborn', 'draconic', 'dragonkin'],
    given: [
      'Arshama', 'Ariaramna', 'Artystone', 'Atossa', 'Bardiya', 'Gaumata', 'Hydarnes', 'Otanes',
      'Parysatis', 'Roxana', 'Stateira', 'Mardonius', 'Megabyzus', 'Belit', 'Kubatum',
      'Enheduanna', 'Ishme', 'Naramsin', 'Sargon', 'Shamshi', 'Zimrilim', 'Puzur', 'Ilushuma',
      'Ashurnasir', 'Iltani', 'Tabni', 'Abisare', 'Shiptu', 'Amytis', 'Damaspia', 'Irdabama',
      'Artaynte', 'Pharnaces', 'Datis',
    ],
    surnames: [
      'Emberclutch', 'Ashscale', 'Bronzeclaw', 'Cinderwing', 'Flamecrest', 'Goldhorn',
      'Stormscale', 'Ironscale', 'Copperspine', 'Brasshorn', 'Sunscale', 'Tidewing',
      'Thundercrest', 'Obsidianclaw', 'Rubyeye', 'Glowscale',
    ],
  },
  // Basque given names; plain English mountain clan names.
  goliath: {
    match: ['goliath'],
    given: [
      'Andoni', 'Aitor', 'Ainhoa', 'Amaia', 'Arantza', 'Eneko', 'Garazi', 'Gorka', 'Haizea',
      'Iker', 'Idoia', 'Josu', 'Koldo', 'Leire', 'Maialen', 'Mikel', 'Nerea', 'Oier', 'Olatz',
      'Unai', 'Uxue', 'Xabier', 'Edurne', 'Asier', 'Itziar', 'Irati', 'Ander', 'Maite',
      'Ekaitz', 'Nahia', 'Urko', 'Alaitz', 'Iratxe', 'Txomin',
    ],
    surnames: [
      'Highcrag', 'Stonepeak', 'Cloudreach', 'Snowridge', 'Skywatcher', 'Crestfall',
      'Longstride', 'Ridgeborn', 'Thunderpeak', 'Coldsummit', 'Boulderback', 'Eaglecliff',
      'Windscar', 'Greyfell', 'Talusborn', 'Screeside',
    ],
  },
  // Generic coined names; plain English warren epithets.
  goblin: {
    match: ['goblin', 'hobgoblin'],
    given: [
      'Skitter', 'Nib', 'Grizzle', 'Snik', 'Pockle', 'Nubbin', 'Krabble', 'Ratchet', 'Fizzik',
      'Mott', 'Quibb', 'Snaggle', 'Grub', 'Zib', 'Nettle', 'Scrag', 'Bodge', 'Wick', 'Rizz',
      'Tink', 'Gobbet', 'Snitch', 'Crumb', 'Natter', 'Scuttle', 'Jitter', 'Fidget', 'Smudge',
      'Sprocket', 'Kink', 'Drip', 'Muckle', 'Cogwhistle', 'Splint',
    ],
    surnames: [
      'Rustpocket', 'Mudfoot', 'Ratcatcher', 'Sootnose', 'Copperbit', 'Lampsnuff', 'Gutterborn',
      'Dripcandle', 'Pothole', 'Nailbiter', 'Bottlecap', 'Wirewhisker', 'Tinkettle',
      'Tallowfinger', 'Ditchwater', 'Mousetrap',
    ],
  },
  // English plant, colour and animal words; "of the …" home names.
  beastfolk: {
    match: ['beastfolk', 'beastkin', 'beast', 'catfolk', 'wolfkin', 'furred'],
    given: [
      'Brindle', 'Thistle', 'Burr', 'Sorrel', 'Fennel', 'Tansy', 'Bracken', 'Russet', 'Dapple',
      'Briar', 'Heath', 'Moss', 'Sedge', 'Tawny', 'Rook', 'Kestrel', 'Clover', 'Teasel', 'Rush',
      'Flax', 'Marten', 'Dusk', 'Ember', 'Ochre', 'Sloe', 'Gorse', 'Furze', 'Linden',
      'Pebble', 'Vetch', 'Bramble', 'Tarn', 'Larch', 'Quill',
    ],
    surnames: [
      'of the Long Grass', 'of the Red Hollow', 'of the Birch Den', 'of the High Moor',
      'of the Fen', 'of the Stone Burrow', 'of the Deep Wood', 'of the Running Brook',
      'of the Bracken Hill', 'of the Pine Den', 'of the Salt Marsh', 'of the Fox Earth',
      'of the Grey Crag', 'of the Ash Hollow', 'of the Wide Meadow', 'of the Willow Bank',
    ],
  },
};
