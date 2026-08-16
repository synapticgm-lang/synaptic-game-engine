import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import {
  fetchOpenRouterModelCatalog,
  getDefaultModels,
  type OpenRouterCatalogModel,
} from '@/game/apiValidation';

interface Props {
  selectedId: string;
  onSelect: (modelId: string) => void;
  /** Fetch the public catalog even when no admin key is pasted (hosted OpenRouter). */
  enabled?: boolean;
}

const VISIBLE_LIMIT = 40;

export function OpenRouterModelPicker({ selectedId, onSelect, enabled = true }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<OpenRouterCatalogModel[]>(() =>
    getDefaultModels('openrouter').map((id) => ({ id, name: id }))
  );
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchOpenRouterModelCatalog()
      .then((rows) => {
        if (!cancelled) setModels(rows);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load models');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? models.filter((m) => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q))
      : models;
    return list.slice(0, VISIBLE_LIMIT);
  }, [models, query]);

  const selected = models.find((m) => m.id === selectedId);

  const choose = (id: string) => {
    onSelect(id);
    setQuery('');
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, Math.max(0, filtered.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const hit = filtered[highlight];
      if (hit) choose(hit.id);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-slate-200">Text model</label>
        {selectedId ? (
          <button
            type="button"
            onClick={() => onSelect('')}
            className="text-[10px] text-slate-500 hover:text-slate-300"
          >
            Use tier default
          </button>
        ) : (
          <span className="text-[10px] text-slate-500">Tier default</span>
        )}
      </div>
      {selected && (
        <p className="truncate text-[11px] text-emerald-300/90" title={selected.id}>
          {selected.name} <span className="text-slate-500">({selected.id})</span>
        </p>
      )}
      {!selected && selectedId ? (
        <p className="truncate text-[11px] text-slate-400" title={selectedId}>
          {selectedId}
        </p>
      ) : null}
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlight(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search models by name or id…"
          className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 pl-8 pr-8 text-sm text-slate-100 placeholder-slate-500 focus:border-crimson-500 focus:outline-none focus:ring-1 focus:ring-crimson-500"
        />
        {loading ? (
          <Loader2 size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-slate-500" />
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        ) : null}
        {open && (
          <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-700 bg-slate-900 py-1 shadow-xl">
            {!query.trim() ? (
              <li className="px-3 py-2 text-[11px] text-slate-500">
                Type a name or id to search {models.length} OpenRouter models.
              </li>
            ) : filtered.length === 0 ? (
              <li className="px-3 py-2 text-[11px] text-slate-500">No models match that search.</li>
            ) : (
              filtered.map((m, i) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => choose(m.id)}
                    className={`flex w-full flex-col items-start px-3 py-1.5 text-left ${
                      m.id === selectedId
                        ? 'bg-crimson-950/50 text-crimson-100'
                        : i === highlight
                          ? 'bg-slate-800 text-slate-100'
                          : 'text-slate-300'
                    }`}
                  >
                    <span className="text-xs font-medium">{m.name}</span>
                    <span className="font-mono text-[10px] text-slate-500">{m.id}</span>
                  </button>
                </li>
              ))
            )}
            {query.trim() && models.filter((m) => {
              const q = query.trim().toLowerCase();
              return m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q);
            }).length > VISIBLE_LIMIT ? (
              <li className="px-3 py-1 text-[10px] text-slate-600">Showing first {VISIBLE_LIMIT} — type more to narrow.</li>
            ) : null}
          </ul>
        )}
      </div>
      <p className="text-[10px] text-slate-500">
        {loading ? 'Loading OpenRouter catalog…' : `${models.length} models. Search by name or id.`}
        {error ? ` · ${error}` : ''}
      </p>
    </div>
  );
}
