import { useState } from 'react';
import { X, Backpack, Swords, Heart, Zap, Plus, Search, Trash2, Save, ChevronDown, ChevronUp, Shield, Layers, AlertTriangle } from 'lucide-react';
import type { GameState, Rarity, LoreCard, LoreCardType, Item } from '@/game/types';
import { RARITY_COLORS } from '@/game/types';
import { computeInventoryCapacity, getItemsInContainer } from '@/game/inventory';

interface Props {
  state: GameState;
  open: boolean;
  onClose: () => void;
  onUpdateLorebook?: (cards: LoreCard[]) => void;
}

const EQUIP_SLOTS = ['Head', 'Chest', 'Main Hand', 'Off Hand', 'Boots', 'Accessories'] as const;

export function RightDrawer({ state, open, onClose, onUpdateLorebook }: Props) {
  const [tab, setTab] = useState<'gear' | 'materials' | 'containers' | 'companions' | 'codex'>('gear');
  const [showProfile, setShowProfile] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [expandedBagId, setExpandedBagId] = useState<string | null>(null);

  const c = state.character;
  const equipped = state.inventory.filter(i => i.equipped);
  const slotMap = new Map<string, Item>();
  for (const item of equipped) {
    if (item.slot) slotMap.set(item.slot, item);
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onClose} />}
      <aside className={`fixed right-0 top-0 z-40 h-full w-80 transform overflow-y-auto border-l border-slate-800 bg-slate-950 transition-transform duration-300 lg:static lg:z-0 lg:w-80 lg:translate-x-0 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <span className="font-serif text-slate-200">Adventurer Panel</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X size={18} /></button>
        </div>

        <div className="p-4 space-y-4">
          {/* Adventurer Summary Card */}
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-serif text-sm text-slate-200">{c.name || 'Adventurer'}</span>
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="text-[10px] px-2 py-0.5 bg-crimson-600/30 hover:bg-crimson-600/50 text-crimson-300 rounded border border-crimson-500/40 transition"
              >
                {showProfile ? 'Hide Profile' : 'Show Profile'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Heart size={12} className="text-rose-500" /> {c.hp}/{c.maxHp}</span>
              <span className="flex items-center gap-1"><Zap size={12} className="text-sky-400" /> {c.mp}/{c.maxMp}</span>
              <span>SP {c.sp}/{c.maxSp}</span>
              <span>Lv {c.level}</span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] text-slate-500 border-t border-slate-800 pt-2">
              {Object.entries(c.attributes).map(([k, v]) => (
                <span key={k}>{k} {v}</span>
              ))}
            </div>

            {/* Expandable Character Profile & Equipment */}
            {showProfile && (
              <div className="mt-3 pt-3 border-t border-slate-800 space-y-3">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-crimson-500/60 overflow-hidden mb-1 flex items-center justify-center text-slate-400">
                    <span className="text-2xl">🛡️</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-200">{c.name}</div>
                  <div className="text-[10px] text-slate-400">Class: {c.classTitle || 'Wanderer'}</div>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Equipped Gear</div>
                  <div className="space-y-1">
                    {EQUIP_SLOTS.map(slot => {
                      const item = slotMap.get(slot);
                      if (!item) {
                        return (
                          <div key={slot} className="flex items-center justify-between rounded bg-slate-950/50 px-2 py-1 text-[11px] text-slate-600">
                            <span>{slot}</span>
                            <span className="italic">empty</span>
                          </div>
                        );
                      }
                      const color = RARITY_COLORS[item.rarity] || '#cbd5e1';
                      return (
                        <div key={slot} className="flex items-center justify-between rounded bg-slate-950 px-2 py-1 text-[11px]">
                          <span className="text-slate-500">{slot}</span>
                          <span className="font-medium truncate max-w-[120px]" style={{ color }}>{item.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-1 rounded-lg bg-slate-900 p-1">
            {(['gear', 'materials', 'containers', 'companions', 'codex'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium capitalize transition-colors ${tab === t ? 'bg-crimson-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Gear Tab */}
          {tab === 'gear' && (
            <div className="space-y-1.5">
              <CapacityBar state={state} />
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Equipped</div>
              {state.inventory.filter(i => i.equipped).map(i => (
                <ItemCard key={i.id} item={i} />
              ))}
              <div className="mt-3 text-[10px] uppercase tracking-wider text-slate-500">Unequipped / Inventory</div>
              {state.inventory.filter(i => !i.equipped).map(i => (
                <ItemCard key={i.id} item={i} />
              ))}
            </div>
          )}

          {/* Materials Tab */}
          {tab === 'materials' && (
            <MaterialsTab state={state} />
          )}

          {/* Containers Tab with Bag Contents Dropdown */}
          {tab === 'containers' && (
            <div className="space-y-2">
              {state.containers.length === 0 ? (
                <p className="text-xs text-slate-500">No containers equipped.</p>
              ) : (
                state.containers.map(con => {
                  const contents = getItemsInContainer(state, con.id);
                  const used = contents.length;
                  const expanded = expandedBagId === con.id;
                  return (
                    <div
                      key={con.id}
                      onClick={() => setExpandedBagId(expanded ? null : con.id)}
                      className="cursor-pointer rounded-lg border border-slate-800 bg-slate-900 p-2.5 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs text-slate-200"><Backpack size={14} /> {con.name}</span>
                        <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          {used}/{con.capacity}
                          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-800">
                        <div className="h-full rounded-full bg-crimson-500" style={{ width: `${con.capacity > 0 ? (used / con.capacity) * 100 : 0}%` }} />
                      </div>
                      {expanded && (
                        <div className="mt-2 pt-2 border-t border-slate-800 space-y-1 pl-2">
                          <div className="text-[10px] text-slate-400 font-medium">Contents:</div>
                          {contents.length > 0 ? (
                            contents.map((item) => (
                              <div key={item.id} className="text-xs text-slate-300 flex justify-between gap-2">
                                <span className="truncate">• {item.name}</span>
                                <span className="shrink-0 text-slate-500">
                                  {item.equipped
                                    ? <span className="text-emerald-400">equipped{item.slot ? ` · ${item.slot}` : ''}</span>
                                    : item.quantity > 1 ? `x${item.quantity}` : null}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="text-[11px] text-slate-500 italic">Bag is empty</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Companions Tab */}
          {tab === 'companions' && (
            <div className="space-y-2">
              {state.companions.length === 0 ? (
                <p className="text-xs text-slate-500">No companions, mounts, or beasts.</p>
              ) : (
                state.companions.map(comp => (
                  <div key={comp.id} className="rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-200">{comp.name}</span>
                      <span className="capitalize text-slate-500">{comp.type}</span>
                    </div>
                    <div className="mt-1 text-slate-500">{comp.role}</div>
                    <div className="mt-1 flex items-center gap-1 text-slate-500"><Swords size={11} /> {comp.hp}/{comp.maxHp} HP</div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Codex Tab */}
          {tab === 'codex' && (
            <CodexTab lorebook={state.lorebook ?? []} onUpdate={onUpdateLorebook} />
          )}
        </div>
      </aside>
    </>
  );
}

function ItemCard({ item }: { item: { name: string; rarity: Rarity; quantity: number; provenance?: string; equipped?: boolean; slot?: string } }) {
  const color = RARITY_COLORS[item.rarity] || '#cbd5e1';
  return (
    <div className="rounded-md border-l-2 bg-slate-900 px-2.5 py-1.5 text-xs" style={{ borderColor: color }}>
      <div className="flex items-center justify-between">
        <span className="font-medium" style={{ color }}>{item.name}</span>
        {item.quantity > 1 && <span className="text-slate-500">x{item.quantity}</span>}
      </div>
      <div className="flex items-center gap-2 text-[10px] text-slate-500">
        <span className="uppercase" style={{ color }}>{item.rarity}</span>
        {item.equipped && <span className="text-emerald-400">equipped{item.slot ? ` · ${item.slot}` : ''}</span>}
      </div>
      {item.provenance && <div className="text-[10px] text-slate-600">{item.provenance}</div>}
    </div>
  );
}

function CapacityBar({ state }: { state: GameState }) {
  const cap = computeInventoryCapacity(state);
  const pct = cap.totalSlots > 0 ? Math.min(100, (cap.usedSlots / cap.totalSlots) * 100) : 0;
  const isFull = cap.availableSlots === 0;

  return (
    <div className="rounded-md border border-slate-800 bg-slate-900 p-2">
      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
        <span className="flex items-center gap-1"><Backpack size={11} /> Inventory</span>
        <span className={isFull ? 'text-rose-400 font-bold' : ''}>{cap.usedSlots}/{cap.totalSlots}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${isFull ? 'bg-rose-500' : 'bg-crimson-500'}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {cap.containerBreakdown.map((c, i) => (
          <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded border ${c.kind === 'magical' ? 'border-purple-500/30 text-purple-300 bg-purple-500/10' : 'border-slate-700 text-slate-400 bg-slate-800/50'}`}>
            {c.name} ({c.used}/{c.capacity})
          </span>
        ))}
      </div>
    </div>
  );
}

function MaterialsTab({ state }: { state: GameState }) {
  const cap = computeInventoryCapacity(state);
  const matPct = cap.materialsSlots > 0 ? Math.min(100, (cap.materialsUsed / cap.materialsSlots) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="rounded-md border border-slate-800 bg-slate-900 p-2">
        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
          <span className="flex items-center gap-1"><Layers size={11} /> Materials</span>
          <span>{cap.materialsUsed} / {cap.materialsSlots === 0 && cap.hasMagicalContainer ? '∞' : cap.materialsSlots || '—'}</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: cap.hasMagicalContainer ? '15%' : `${matPct}%` }} />
        </div>
        <div className="mt-1.5">
          {cap.hasMagicalContainer ? (
            <p className="text-[9px] text-purple-300/70 flex items-center gap-1"><Layers size={9} /> Magical container active — materials stack infinitely.</p>
          ) : (
            <p className="text-[9px] text-slate-500 flex items-center gap-1"><AlertTriangle size={9} /> No materials container — mats use inventory slots.</p>
          )}
        </div>
      </div>

      {state.materials.length === 0 ? (
        <p className="py-4 text-center text-xs text-slate-500">No crafting materials yet. Salvage items to obtain materials.</p>
      ) : (
        state.materials.map((mat) => (
          <div key={mat.id} className="rounded-md border-l-2 bg-slate-900 px-2.5 py-1.5 text-xs" style={{ borderColor: RARITY_COLORS[mat.rarity] }}>
            <div className="flex items-center justify-between">
              <span className="font-medium" style={{ color: RARITY_COLORS[mat.rarity] }}>{mat.name}</span>
              <span className="text-slate-500">x{mat.quantity}</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase">{mat.rarity}</div>
          </div>
        ))
      )}
    </div>
  );
}

const LORE_TYPES: LoreCardType[] = ['npc', 'location', 'item', 'quest', 'faction', 'lore'];
const LORE_TYPE_ICONS: Record<LoreCardType, string> = {
  npc: '👤', location: '📍', item: '🗡️', quest: '❗', faction: '⚔️', lore: '📜',
};

function CodexTab({ lorebook, onUpdate }: { lorebook: LoreCard[]; onUpdate?: (cards: LoreCard[]) => void }) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<LoreCard | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = lorebook.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q) || c.keywords.some(k => k.toLowerCase().includes(q));
  });

  const handleSave = (card: LoreCard) => {
    if (!onUpdate) return;
    const existing = lorebook.findIndex(c => c.id === card.id);
    const updated = existing >= 0
      ? lorebook.map(c => (c.id === card.id ? card : c))
      : [...lorebook, card];
    onUpdate(updated);
    setEditing(null);
    setCreating(false);
  };

  const handleDelete = (id: string) => {
    if (!onUpdate) return;
    onUpdate(lorebook.filter(c => c.id !== id));
    setEditing(null);
  };

  if (creating || editing) {
    return (
      <LoreCardEditor
        card={editing}
        onSave={handleSave}
        onCancel={() => { setEditing(null); setCreating(false); }}
        onDelete={editing ? () => handleDelete(editing.id) : undefined}
      />
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search codex..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800 py-1.5 pl-8 pr-3 text-xs text-slate-150 placeholder-slate-500 focus:border-crimson-500 focus:outline-none"
          />
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1 rounded-lg bg-crimson-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-crimson-500 transition-colors"
        >
          <Plus size={14} /> New
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-500">
          {lorebook.length === 0 ? 'No lore entries yet. The GM will auto-create cards as you explore.' : 'No matching entries.'}
        </p>
      ) : (
        filtered.map(card => (
          <button
            key={card.id}
            onClick={() => setEditing(card)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-left transition-colors hover:bg-slate-800"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{LORE_TYPE_ICONS[card.type]}</span>
              <span className="flex-1 text-xs font-medium text-slate-200">{card.name}</span>
              <span className="text-[10px] uppercase text-slate-500">{card.type}</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">{card.summary}</p>
          </button>
        ))
      )}
    </div>
  );
}

function LoreCardEditor({ card, onSave, onCancel, onDelete }: any) {
  const [name, setName] = useState(card?.name ?? '');
  const [type, setType] = useState<LoreCardType>(card?.type ?? 'npc');
  const [keywords, setKeywords] = useState((card?.keywords ?? []).join(', '));
  const [summary, setSummary] = useState(card?.summary ?? '');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: card?.id ?? `lore-${Date.now()}`,
      name: name.trim(),
      type,
      keywords: keywords.split(',').map((k: string) => k.trim()).filter(Boolean),
      summary: summary.trim(),
      lastSeenTurn: card?.lastSeenTurn ?? 0,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-200">{card ? 'Edit Entry' : 'New Entry'}</span>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-200"><X size={16} /></button>
      </div>
      <div>
        <label className="mb-1 block text-[11px] text-slate-500">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-100 focus:border-crimson-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-[11px] text-slate-500">Summary</label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-100 focus:border-crimson-500 focus:outline-none"
        />
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-lg px-3 py-1.5 text-xs text-slate-400">Cancel</button>
        <button onClick={handleSave} className="rounded-lg bg-crimson-600 px-3 py-1.5 text-xs font-medium text-white">Save</button>
      </div>
    </div>
  );
}