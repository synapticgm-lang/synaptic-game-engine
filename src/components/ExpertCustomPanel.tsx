import { Dices, Plus, Trash2 } from 'lucide-react';
import type {
  ExpertCustomDraft,
  ExpertLoreDraft,
  ExpertNpcDraft,
  ExpertQuestDraft,
  ExpertSectionId,
  LoreCategory,
  NpcDisposition,
} from '@/game/customExpertDraft';
import { randomizeExpertSection } from '@/game/customExpertDraft';

const inputClass =
  'w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-100 focus:border-crimson-500 focus:outline-none';
const labelClass = 'mb-1 block font-medium text-slate-300';

function SectionHeader({
  title,
  section,
  draft,
  onChange,
}: {
  title: string;
  section: ExpertSectionId;
  draft: ExpertCustomDraft;
  onChange: (next: ExpertCustomDraft) => void;
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <h3 className="text-xs font-semibold text-slate-200">{title}</h3>
      <button
        type="button"
        onClick={() => onChange(randomizeExpertSection(draft, section))}
        className="inline-flex items-center gap-1 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-[10px] font-medium text-sky-300 hover:border-sky-500 hover:bg-slate-700"
        title="Reroll this section only"
      >
        <Dices size={12} /> Randomize
      </button>
    </div>
  );
}

interface Props {
  draft: ExpertCustomDraft;
  onChange: (next: ExpertCustomDraft) => void;
  charName: string;
  setCharName: (v: string) => void;
  className: string;
  setClassName: (v: string) => void;
  appearance: string;
  setAppearance: (v: string) => void;
  backstory: string;
  setBackstory: (v: string) => void;
  askNameLater: boolean;
  setAskNameLater: (v: boolean) => void;
  onRandomizePc: () => void;
}

export function ExpertCustomPanel({
  draft,
  onChange,
  charName,
  setCharName,
  className,
  setClassName,
  appearance,
  setAppearance,
  backstory,
  setBackstory,
  askNameLater,
  setAskNameLater,
  onRandomizePc,
}: Props) {
  const patch = (partial: Partial<ExpertCustomDraft>) => onChange({ ...draft, ...partial });

  const addLore = () => {
    if (draft.lore.length >= 12) return;
    const row: ExpertLoreDraft = { title: '', category: 'world', body: '' };
    onChange({ ...draft, lore: [...draft.lore, row] });
  };

  const addNpc = () => {
    if (draft.npcs.length >= 8) return;
    const row: ExpertNpcDraft = {
      name: '',
      role: '',
      disposition: 'neutral',
      description: '',
      hooks: '',
    };
    onChange({ ...draft, npcs: [...draft.npcs, row] });
  };

  const addQuest = () => {
    if (draft.quests.length >= 6) return;
    const row: ExpertQuestDraft = { title: '', description: '', objectives: '' };
    onChange({ ...draft, quests: [...draft.quests, row] });
  };

  return (
    <div className="space-y-4">
      <p className="rounded-lg border border-amber-700/40 bg-amber-950/20 px-3 py-2 text-[10px] leading-snug text-amber-100/90">
        Original names only. Do not paste closed novels or licensed settings. Each Randomize rerolls that section — mash until you like it.
      </p>

      <section className="rounded-lg border border-slate-700 bg-slate-800/30 p-3">
        <SectionHeader title="1 · Framing" section="framing" draft={draft} onChange={onChange} />
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <label className={labelClass}>Title</label>
            <input className={inputClass} value={draft.title} onChange={(e) => patch({ title: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Tagline</label>
            <input className={inputClass} value={draft.tagline} onChange={(e) => patch({ tagline: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Genre chip</label>
            <input className={inputClass} value={draft.genreTag} onChange={(e) => patch({ genreTag: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Difficulty</label>
            <select
              className={inputClass}
              value={draft.difficulty}
              onChange={(e) => patch({ difficulty: e.target.value as ExpertCustomDraft['difficulty'] })}
            >
              <option value="Easy">Easy</option>
              <option value="Standard">Standard</option>
              <option value="Hardcore">Hardcore</option>
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-800/30 p-3">
        <SectionHeader title="2 · Premise & rails" section="premise" draft={draft} onChange={onChange} />
        <label className={labelClass}>Premise</label>
        <textarea
          rows={4}
          className={`${inputClass} resize-y`}
          value={draft.premise}
          onChange={(e) => patch({ premise: e.target.value })}
          placeholder="What is always true in this campaign?"
        />
        <label className={`${labelClass} mt-2`}>Style rail (optional)</label>
        <textarea
          rows={2}
          className={`${inputClass} resize-y`}
          value={draft.styleRail}
          onChange={(e) => patch({ styleRail: e.target.value })}
          placeholder="Tone / hard rules for the writer…"
        />
        <label className="mt-2 flex cursor-pointer items-start gap-2 text-[11px] text-slate-300">
          <input
            type="checkbox"
            checked={draft.fillGaps}
            onChange={(e) => patch({ fillGaps: e.target.checked })}
            className="mt-0.5 accent-crimson-500"
          />
          <span>Fill gaps — AI may soft-texture empty sheets (never override your cards)</span>
        </label>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-800/30 p-3">
        <SectionHeader title="3 · World" section="world" draft={draft} onChange={onChange} />
        <label className={labelClass}>Starting location</label>
        <input
          className={inputClass}
          value={draft.startingLocation}
          onChange={(e) => patch({ startingLocation: e.target.value })}
          placeholder="where this tale opens"
        />
        <label className={`${labelClass} mt-2`}>World-shape notes</label>
        <textarea
          rows={2}
          className={`${inputClass} resize-y`}
          value={draft.worldNotes}
          onChange={(e) => patch({ worldNotes: e.target.value })}
          placeholder="Fantasy city, frontier, sky-port, modern street…"
        />
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-800/30 p-3">
        <SectionHeader title="4 · Lore pack" section="lore" draft={draft} onChange={onChange} />
        <div className="space-y-2">
          {draft.lore.map((card, idx) => (
            <div key={`lore-${idx}`} className="rounded border border-slate-700/80 bg-slate-900/40 p-2 space-y-1.5">
              <div className="flex gap-1.5">
                <input
                  className={inputClass}
                  placeholder="Title"
                  value={card.title}
                  onChange={(e) => {
                    const lore = [...draft.lore];
                    lore[idx] = { ...card, title: e.target.value };
                    patch({ lore });
                  }}
                />
                <select
                  className={`${inputClass} max-w-[7rem]`}
                  value={card.category}
                  onChange={(e) => {
                    const lore = [...draft.lore];
                    lore[idx] = { ...card, category: e.target.value as LoreCategory };
                    patch({ lore });
                  }}
                >
                  {(['world', 'faction', 'history', 'mechanic', 'culture'] as LoreCategory[]).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="rounded border border-slate-700 px-2 text-slate-400 hover:text-rose-300"
                  onClick={() => patch({ lore: draft.lore.filter((_, i) => i !== idx) })}
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <textarea
                rows={2}
                className={`${inputClass} resize-y`}
                placeholder="Body"
                value={card.body}
                onChange={(e) => {
                  const lore = [...draft.lore];
                  lore[idx] = { ...card, body: e.target.value };
                  patch({ lore });
                }}
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addLore}
          className="mt-2 inline-flex items-center gap-1 text-[10px] text-sky-300 hover:text-sky-200"
        >
          <Plus size={12} /> Add lore card ({draft.lore.length}/12)
        </button>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-800/30 p-3">
        <SectionHeader title="5 · People" section="people" draft={draft} onChange={onChange} />
        <div className="space-y-2">
          {draft.npcs.map((npc, idx) => (
            <div key={`npc-${idx}`} className="rounded border border-slate-700/80 bg-slate-900/40 p-2 space-y-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  className={inputClass}
                  placeholder="Name"
                  value={npc.name}
                  onChange={(e) => {
                    const npcs = [...draft.npcs];
                    npcs[idx] = { ...npc, name: e.target.value };
                    patch({ npcs });
                  }}
                />
                <input
                  className={inputClass}
                  placeholder="Role"
                  value={npc.role}
                  onChange={(e) => {
                    const npcs = [...draft.npcs];
                    npcs[idx] = { ...npc, role: e.target.value };
                    patch({ npcs });
                  }}
                />
              </div>
              <div className="flex gap-1.5">
                <select
                  className={inputClass}
                  value={npc.disposition}
                  onChange={(e) => {
                    const npcs = [...draft.npcs];
                    npcs[idx] = { ...npc, disposition: e.target.value as NpcDisposition };
                    patch({ npcs });
                  }}
                >
                  {(['friendly', 'neutral', 'hostile', 'ambiguous'] as NpcDisposition[]).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="rounded border border-slate-700 px-2 text-slate-400 hover:text-rose-300"
                  onClick={() => patch({ npcs: draft.npcs.filter((_, i) => i !== idx) })}
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <textarea
                rows={2}
                className={`${inputClass} resize-y`}
                placeholder="Description"
                value={npc.description}
                onChange={(e) => {
                  const npcs = [...draft.npcs];
                  npcs[idx] = { ...npc, description: e.target.value };
                  patch({ npcs });
                }}
              />
              <input
                className={inputClass}
                placeholder="Hooks (separate with ;)"
                value={npc.hooks}
                onChange={(e) => {
                  const npcs = [...draft.npcs];
                  npcs[idx] = { ...npc, hooks: e.target.value };
                  patch({ npcs });
                }}
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addNpc}
          className="mt-2 inline-flex items-center gap-1 text-[10px] text-sky-300 hover:text-sky-200"
        >
          <Plus size={12} /> Add NPC ({draft.npcs.length}/8)
        </button>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-800/30 p-3">
        <SectionHeader title="6 · Quests" section="quests" draft={draft} onChange={onChange} />
        <p className="mb-2 text-[10px] text-slate-500">Guide Book gated — stay unspoken until play reveals them.</p>
        <div className="space-y-2">
          {draft.quests.map((q, idx) => (
            <div key={`quest-${idx}`} className="rounded border border-slate-700/80 bg-slate-900/40 p-2 space-y-1.5">
              <div className="flex gap-1.5">
                <input
                  className={inputClass}
                  placeholder="Title"
                  value={q.title}
                  onChange={(e) => {
                    const quests = [...draft.quests];
                    quests[idx] = { ...q, title: e.target.value };
                    patch({ quests });
                  }}
                />
                <button
                  type="button"
                  className="rounded border border-slate-700 px-2 text-slate-400 hover:text-rose-300"
                  onClick={() => patch({ quests: draft.quests.filter((_, i) => i !== idx) })}
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <textarea
                rows={2}
                className={`${inputClass} resize-y`}
                placeholder="Description"
                value={q.description}
                onChange={(e) => {
                  const quests = [...draft.quests];
                  quests[idx] = { ...q, description: e.target.value };
                  patch({ quests });
                }}
              />
              <input
                className={inputClass}
                placeholder="Objectives (separate with ;)"
                value={q.objectives}
                onChange={(e) => {
                  const quests = [...draft.quests];
                  quests[idx] = { ...q, objectives: e.target.value };
                  patch({ quests });
                }}
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addQuest}
          className="mt-2 inline-flex items-center gap-1 text-[10px] text-sky-300 hover:text-sky-200"
        >
          <Plus size={12} /> Add quest ({draft.quests.length}/6)
        </button>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-800/30 p-3">
        <SectionHeader title="7 · Opening" section="opening" draft={draft} onChange={onChange} />
        <label className={labelClass}>Opening mode</label>
        <select
          className={inputClass}
          value={draft.openingMode}
          onChange={(e) => patch({ openingMode: e.target.value as ExpertCustomDraft['openingMode'] })}
        >
          <option value="weave">Weave — scene then covers</option>
          <option value="scene">Scene — drop into play</option>
        </select>
        <label className={`${labelClass} mt-2`}>Opening hook ingredients</label>
        <textarea
          rows={3}
          className={`${inputClass} resize-y`}
          value={draft.openingHook}
          onChange={(e) => patch({ openingHook: e.target.value })}
          placeholder="Ingredients for the first page — writer rewrites, does not reprint…"
        />
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-800/30 p-3">
        <SectionHeader title="8 · Kit" section="kit" draft={draft} onChange={onChange} />
        <textarea
          rows={2}
          className={`${inputClass} resize-y`}
          value={draft.kitNote}
          onChange={(e) => patch({ kitNote: e.target.value })}
          placeholder="What you start with — no endgame inventions…"
        />
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-800/30 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-xs font-semibold text-slate-200">9 · You (PC)</h3>
          <button
            type="button"
            onClick={onRandomizePc}
            className="inline-flex items-center gap-1 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-[10px] font-medium text-sky-300 hover:border-sky-500"
          >
            <Dices size={12} /> Randomize
          </button>
        </div>
        <label className="mb-2 flex cursor-pointer items-center gap-2 text-[11px] text-slate-300">
          <input
            type="checkbox"
            checked={askNameLater}
            onChange={(e) => setAskNameLater(e.target.checked)}
            className="accent-crimson-500"
          />
          Ask name at opening
        </label>
        <div className="grid grid-cols-2 gap-2">
          {!askNameLater && (
            <div>
              <label className={labelClass}>Name</label>
              <input className={inputClass} value={charName} onChange={(e) => setCharName(e.target.value)} />
            </div>
          )}
          <div className={askNameLater ? 'col-span-2' : ''}>
            <label className={labelClass}>Class / role</label>
            <input className={inputClass} value={className} onChange={(e) => setClassName(e.target.value)} />
          </div>
        </div>
        <label className={`${labelClass} mt-2`}>Folk / body</label>
        <input
          className={inputClass}
          value={draft.folk}
          onChange={(e) => patch({ folk: e.target.value })}
          placeholder="Human, elf, beastfolk…"
        />
        <label className={`${labelClass} mt-2`}>Appearance</label>
        <input className={inputClass} value={appearance} onChange={(e) => setAppearance(e.target.value)} />
        <label className={`${labelClass} mt-2`}>Backstory</label>
        <textarea
          rows={3}
          className={`${inputClass} resize-y`}
          value={backstory}
          onChange={(e) => setBackstory(e.target.value)}
        />
      </section>
    </div>
  );
}
