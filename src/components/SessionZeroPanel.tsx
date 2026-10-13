import { useEffect, useState } from 'react';
import type { Settings } from '@/game/types';
import { SessionZeroRules } from './CampaignSettings';
import { defaultSheetId, importSheetText, listSheets, setDefaultSheet, sheetLabel, type SavedSheet } from '@/game/tabletop/sheetLibrary';
import { keepSheet, syncSheetLibrary } from '@/game/tabletop/sheetLibrarySync';

export interface SessionZeroDraft {
  lines: string;
  veils: string;
  /** Library sheet to play; null = build in the inn book. */
  sheetId: string | null;
}

interface Props {
  settings: Settings;
  onSettingsChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  value: SessionZeroDraft;
  onChange: (next: SessionZeroDraft) => void;
}

/**
 * Tabletop session zero on the New Game page: the table rules, the player's lines and veils, and which
 * character to bring (a saved sheet, a pasted one, or a new build in the inn book).
 */
export function SessionZeroPanel({ settings, onSettingsChange, value, onChange }: Props) {
  const [sheets, setSheets] = useState<SavedSheet[]>(listSheets);
  const [paste, setPaste] = useState('');
  const [check, setCheck] = useState<{ ok: boolean; lines: string[] } | null>(null);

  useEffect(() => {
    let live = true;
    void syncSheetLibrary().then((list) => {
      if (live) setSheets(list);
    });
    return () => {
      live = false;
    };
  }, []);

  const importPaste = () => {
    const res = importSheetText(paste);
    if (!res.ok) {
      setCheck({ ok: false, lines: res.problems });
      return;
    }
    setSheets(keepSheet(res.sheet));
    onChange({ ...value, sheetId: res.sheet.id });
    setCheck({ ok: true, lines: [`${sheetLabel(res.sheet)} saved to your sheets.`, ...res.corrections] });
    setPaste('');
  };

  const def = defaultSheetId();

  return (
    <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-800/40 p-3" data-testid="session-zero">
      <div>
        <div className="font-medium text-slate-200">Session zero</div>
        <p className="text-[10px] leading-snug text-slate-500">
          Settle the table before play. These rules also live in Settings → House Rules.
        </p>
      </div>
      <SessionZeroRules settings={settings} onChange={onSettingsChange} />

      <label className="block">
        <span className="mb-1 block text-xs text-slate-300">Lines (never in the story), one per line</span>
        <textarea
          value={value.lines}
          onChange={(e) => onChange({ ...value, lines: e.target.value })}
          rows={2}
          className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-100"
          data-testid="session-zero-lines"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-slate-300">Veils (can happen, off-screen only), one per line</span>
        <textarea
          value={value.veils}
          onChange={(e) => onChange({ ...value, veils: e.target.value })}
          rows={2}
          className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-100"
          data-testid="session-zero-veils"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs text-slate-300">Character</span>
        <select
          value={value.sheetId ?? ''}
          onChange={(e) => onChange({ ...value, sheetId: e.target.value || null })}
          className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-200"
          data-testid="session-zero-sheet"
        >
          <option value="">{def ? 'My default sheet (or build in the inn book)' : 'Build in the inn book'}</option>
          {sheets.map((s) => (
            <option key={s.id} value={s.id}>{sheetLabel(s)}{s.id === def ? ' (default)' : ''}</option>
          ))}
        </select>
      </label>
      {value.sheetId && (
        <button
          type="button"
          onClick={() => {
            setDefaultSheet(value.sheetId === def ? null : value.sheetId);
            setSheets(listSheets());
          }}
          className="text-[11px] text-sky-300 underline"
        >
          {value.sheetId === def ? 'Stop using as my default' : 'Make this my default sheet'}
        </button>
      )}

      <details className="text-xs text-slate-300">
        <summary className="cursor-pointer">Bring your own sheet</summary>
        <p className="mt-1 text-[10px] leading-snug text-slate-500">
          Paste JSON or lines like “Class: Fighter”, “Species: Dwarf”, “Background: Soldier”, “STR 15 DEX 14 CON 13 INT 12 WIS 10 CHA 8”.
          The engine works out HP, AC and every other number from the SRD rules.
        </p>
        <textarea
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 font-mono text-[11px] text-slate-100"
          data-testid="session-zero-paste"
        />
        <button type="button" onClick={importPaste} className="mt-1 rounded bg-slate-700 px-2 py-1 text-xs text-slate-100 hover:bg-slate-600">
          Check and save
        </button>
        {check && (
          <ul className={`mt-1 list-disc pl-4 text-[11px] ${check.ok ? 'text-emerald-300' : 'text-amber-300'}`} data-testid="session-zero-check">
            {check.lines.map((l) => <li key={l}>{l}</li>)}
          </ul>
        )}
      </details>
    </div>
  );
}
