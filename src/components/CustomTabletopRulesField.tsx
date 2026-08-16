import { useRef, useState } from 'react';
import { Paperclip } from 'lucide-react';
import {
  clipCustomTabletopRules,
  CUSTOM_TABLETOP_RULES_MAX_CHARS,
} from '@/game/customTabletopRules';

interface Props {
  value: string;
  onChange: (text: string) => void;
  kidMode?: boolean;
  compact?: boolean;
}

/** Neutral paste box — never labels licensed tabletop brands. */
export function CustomTabletopRulesField({ value, onChange, kidMode, compact }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [truncated, setTruncated] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const apply = (raw: string) => {
    const clipped = clipCustomTabletopRules(raw);
    setTruncated(clipped.truncated);
    setFileError(null);
    onChange(clipped.text);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const lower = file.name.toLowerCase();
    if (!/\.(txt|md|text|rtf)$/.test(lower) && file.type && !file.type.startsWith('text/')) {
      setFileError('Attach a text file (.txt or .md).');
      return;
    }
    try {
      apply(await file.text());
    } catch {
      setFileError('Could not read that file as text.');
    }
  };

  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className={`font-medium text-slate-200 ${compact ? 'text-[11px]' : 'text-sm'}`}>
            Use my own rules
          </div>
          <p className={`mt-0.5 leading-snug text-slate-500 ${compact ? 'text-[10px]' : 'text-xs'}`}>
            Custom tabletop rules for this campaign. Paste (or attach as text) rules you already own.
            Leave empty to use SynapticGM Tabletop Fantasy. Player rules win on conflict.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="shrink-0 inline-flex items-center gap-1 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-[10px] text-slate-300 hover:bg-slate-700"
        >
          <Paperclip size={12} />
          Attach text
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.md,.text,text/plain"
          className="hidden"
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>
      <textarea
        value={value}
        onChange={(e) => apply(e.target.value)}
        rows={compact ? 5 : 8}
        placeholder="Paste your house rules here…"
        className="w-full resize-y rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:border-crimson-500 focus:outline-none"
      />
      <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-500">
        <span>
          {value.length.toLocaleString()} / {CUSTOM_TABLETOP_RULES_MAX_CHARS.toLocaleString()} characters
        </span>
        {value.trim() ? (
          <span className="text-amber-300/80">Active for this campaign</span>
        ) : (
          <span>Empty = SynapticGM tabletop core</span>
        )}
      </div>
      {truncated && (
        <p className="text-[10px] text-amber-300">
          This paste was trimmed to {CUSTOM_TABLETOP_RULES_MAX_CHARS.toLocaleString()} characters so the GM can still run.
        </p>
      )}
      {fileError && <p className="text-[10px] text-red-400">{fileError}</p>}
      {kidMode && (
        <p className="text-[10px] leading-snug text-slate-500">
          Kid Mode still filters everything the GM writes. Sexual or graphic instruction blocks in the paste are skipped.
        </p>
      )}
    </div>
  );
}
