#!/usr/bin/env node
/**
 * Builds src/data/srd/srd521.json from the 5e-bits/5e-database 2024 data at a pinned commit.
 * That data is the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC,
 * https://www.dndbeyond.com/srd, licensed under CC-BY-4.0. Only the fields the rules engine reads are kept.
 *
 * Usage: node scripts/srdExtract.mjs [--from <dir with 5e-SRD-*.json>]
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const COMMIT = 'a6212beb4b278917c2cff41c2b04c4ef4f3e0d6f';
const BASE = `https://raw.githubusercontent.com/5e-bits/5e-database/${COMMIT}/src/2024/en`;
/** The creatures the encounter engine fights with (src/game/rules/srdMonsters.ts overlays them). */
const ENGINE_MONSTERS = 'goblin-warrior bandit cultist wolf giant-rat skeleton zombie shadow ghoul giant-spider'.split(' ');
const OUT = resolve('src/data/srd/srd521.json');

const fromDir = process.argv.includes('--from') ? process.argv[process.argv.indexOf('--from') + 1] : '';

async function load(name) {
  if (fromDir) return JSON.parse(readFileSync(join(fromDir, `5e-SRD-${name}.json`), 'utf8'));
  const res = await fetch(`${BASE}/5e-SRD-${name}.json`);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  return res.json();
}

const feet = (s) => (s ? Number.parseInt(String(s), 10) : undefined);
const cr = (n) => ({ 0.125: '1/8', 0.25: '1/4', 0.5: '1/2' })[n] ?? String(n);
const dice = (s) => String(s ?? '').replace(/\s+/g, '');

function attack(a) {
  const [hit, more] = a.damage ?? [];
  // A second die that lands only under a condition ("if the attack roll had Advantage") is not an extra on every hit.
  const extra = more && !/\bif\b/i.test(a.desc) ? { dice: dice(more.damage_dice), type: more.damage_type.index } : undefined;
  return {
    name: a.name,
    toHit: a.attack_bonus,
    damage: dice(hit.damage_dice),
    type: hit.damage_type.index,
    ...(/^Ranged/i.test(a.desc) ? { ranged: true } : {}),
    ...(extra ? { extra } : {}),
  };
}

function monster(m) {
  return {
    name: m.name,
    cr: cr(m.challenge_rating),
    ac: m.armor_class[0].value,
    hp: m.hit_points,
    hpDice: dice(m.hit_points_roll),
    speed: feet(m.speed.walk),
    scores: { STR: m.strength, DEX: m.dexterity, CON: m.constitution, INT: m.intelligence, WIS: m.wisdom, CHA: m.charisma },
    passivePerception: m.senses.passive_perception,
    languages: (m.languages ?? '').trim(),
    ...(m.senses.darkvision ? { darkvision: feet(m.senses.darkvision) } : {}),
    ...(m.gear ? { gear: m.gear.split(/,\s*/) } : {}),
    ...(m.damage_vulnerabilities?.length ? { vulnerable: m.damage_vulnerabilities } : {}),
    attacks: (m.actions ?? []).filter((a) => a.attack_bonus != null && a.damage?.length).map(attack),
  };
}

const [monsters, spells, items] = await Promise.all([load('Monsters'), load('Spells'), load('Magic-Items')]);
const byIndex = new Map(monsters.map((m) => [m.index, m]));
const missing = ENGINE_MONSTERS.filter((i) => !byIndex.has(i));
if (missing.length) throw new Error(`not in the SRD data: ${missing.join(', ')}`);

const out = {
  source: {
    data: `5e-bits/5e-database@${COMMIT} src/2024/en`,
    work: 'System Reference Document 5.2.1 by Wizards of the Coast LLC, https://www.dndbeyond.com/srd',
    license: 'CC-BY-4.0 https://creativecommons.org/licenses/by/4.0/legalcode',
  },
  monsters: Object.fromEntries(ENGINE_MONSTERS.map((i) => [i, monster(byIndex.get(i))])),
  spells: Object.fromEntries(
    spells
      .filter((s) => s.level <= 1)
      .map((s) => [s.name, { level: s.level, classes: s.classes.map((c) => c.index), concentration: !!s.concentration }])
  ),
  magicItems: Object.fromEntries(
    items
      .filter((i) => i.rarity?.name && i.rarity.name !== 'Rarity Varies' && !i.variant)
      .map((i) => [i.name, { rarity: i.rarity.name, attunement: !!i.attunement }])
  ),
};
mkdirSync(resolve('src/data/srd'), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(out, null, 1)}\n`);
console.log(`wrote ${OUT}: ${ENGINE_MONSTERS.length} monsters, ${Object.keys(out.spells).length} spells, ${Object.keys(out.magicItems).length} magic items`);
