/**
 * Datasworn character role / goal / descriptor oracles as seed tables.
 *
 * Credit: Shawn Tomkin (Ironsworn), rsek (Datasworn), XenotropicDev (TheOracle).
 * Datasworn code/schema MIT; oracle text CC BY 4.0 (Tomkin Press extended CC BY to
 * Ironsworn, Delve and Starforged oracle tables).
 * https://github.com/rsek/datasworn
 * https://tomkinpress.com/pages/licensing
 *
 * Import ONLY objects whose source.license is CC BY 4.0; never NC / non-commercial text.
 * LitRPG / Story RPG: seed tables. Tabletop: flavour seeds only (picker; no rule math).
 */
import raw from '../data/datasworn/characterOracles.json';

export const DATASWORN_CREDIT =
  'Shawn Tomkin (Ironsworn), rsek (Datasworn), XenotropicDev (TheOracle); MIT code, CC BY 4.0 oracle text';

export const DATASWORN_CC_BY_40 = 'CC BY 4.0';

export type DataswornOracleTable = 'role' | 'goal' | 'descriptor';

export type DataswornSeedRow = {
  text: string;
  table: DataswornOracleTable;
  source: {
    license: string;
    title: string;
    authors: string[];
    url?: string;
    dataswornId?: string;
  };
};

type RawRow = {
  text: string;
  min?: number;
  max?: number;
  source?: {
    license?: string;
    title?: string;
    authors?: string[];
    url?: string;
    dataswornId?: string;
  };
};

type RawTables = {
  tables?: Record<string, { name?: string; id?: string; rows?: RawRow[] }>;
  credit?: string;
};

/**
 * Every imported Datasworn character-oracle row after the licence filter.
 * Each row carries source.license === "CC BY 4.0" (normalized). Never NC.
 */
export function dataswornCharacterOracleRows(): DataswornSeedRow[] {
  const pack = raw as RawTables;
  const out: DataswornSeedRow[] = [];
  const names: DataswornOracleTable[] = ['role', 'goal', 'descriptor'];
  for (let t = 0; t < names.length; t++) {
    const table = names[t]!;
    const rows = pack.tables?.[table]?.rows ?? [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]!;
      const n = String(r.source?.license ?? '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');
      if (!n) continue;
      if (n.includes('nc') || n.includes('noncommercial') || n.includes('non-commercial')) continue;
      const ok = n === 'cc by 4.0' || n === 'cc-by-4.0' || n.includes('creativecommons.org/licenses/by/4.0');
      if (!ok) continue;
      const authors = r.source?.authors ?? [];
      const authorList: string[] = [];
      for (let a = 0; a < authors.length; a++) authorList.push(String(authors[a]));
      out.push({
        text: String(r.text ?? '').trim(),
        table,
        source: {
          license: DATASWORN_CC_BY_40,
          title: String(r.source?.title ?? 'Ironsworn Rulebook'),
          authors: authorList.length ? authorList : ['Shawn Tomkin'],
          url: r.source?.url,
          dataswornId: r.source?.dataswornId,
        },
      });
    }
  }
  return out;
}

/** Deterministic pick from one oracle table (LitRPG/RPG seeds; tabletop flavour). */
export function pickDataswornCharacterSeed(table: DataswornOracleTable, salt: number): string {
  const rows = dataswornCharacterOracleRows();
  let count = 0;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i]!.table === table && rows[i]!.text) count++;
  }
  if (count <= 0) return '';
  let idx = salt % count;
  if (idx < 0) idx += count;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    if (row.table !== table || !row.text) continue;
    if (idx === 0) return row.text;
    idx--;
  }
  return '';
}
