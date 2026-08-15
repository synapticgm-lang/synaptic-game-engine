import { useMemo, useState } from 'react';
import {
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Map as MapIcon,
  Layers,
  Users,
  ScrollText,
  Shield,
  Sparkles,
  Swords,
  Skull,
  Compass,
  Castle,
  Trees,
  Waves,
  Mountain,
  Flame,
  type LucideIcon,
} from 'lucide-react';
import type { CampaignArchetype } from '@/game/archetypes';
import type { ContentMode, EngineMode } from '@/game/types';
import {
  ALL_CAMPAIGN_BIBLES,
  filterBiblesForContentMode,
  getCampaignBlurb,
  type CampaignBible,
  type LoreSnippet,
  type KeyNPC,
} from '@/data/campaigns';

interface GMLibraryProps {
  open: boolean;
  contentMode?: ContentMode;
  onClose: () => void;
  onSelectCampaign?: (archetype: CampaignArchetype, engineMode: EngineMode, bibleId?: string) => void;
  onSelectMap?: (mapId: string) => void;
}

type Difficulty = 'Easy' | 'Standard' | 'Hardcore';
type InfoCategory = 'lore' | 'npcs' | 'rules' | 'locations' | 'items';

interface CampaignStarter {
  id: string;
  archetype: CampaignArchetype;
  engineMode: EngineMode;
  title: string;
  tagline: string;
  description: string;
  difficulty: Difficulty;
  accent: string;
  icon: LucideIcon;
  nsfw?: boolean;
  genreTag?: string;
}

interface MapTemplate {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  tier: number;
}

interface InfoCard {
  id: string;
  category: InfoCategory;
  title: string;
  summary: string;
  tags: string[];
  icon: LucideIcon;
  campaignId: string;
}

const ARCHETYPE_ACCENTS: Record<string, string> = {
  system_apocalypse: 'crimson',
  isekai: 'amber',
  vrmmo: 'sky',
  monster_reincarnation: 'emerald',
  void_audience: 'violet',
  regression: 'cyan',
  cyberpunk: 'fuchsia',
  dungeon_transport: 'orange',
  tower_ascent: 'violet',
  magic_academy: 'sky',
  dungeon_core: 'emerald',
  custom_world: 'amber',
  caravan_escort: 'amber',
  prisoner_shipwrecked: 'sky',
  patrons_quest: 'crimson',
  under_siege: 'crimson',
  cursed_manor: 'violet',
  wilderness_expedition: 'emerald',
  ai_random: 'amber',
  ai_custom: 'amber',
};

const ARCHETYPE_ICONS: Record<string, LucideIcon> = {
  system_apocalypse: Flame,
  isekai: Sparkles,
  vrmmo: Shield,
  monster_reincarnation: Skull,
  void_audience: Layers,
  regression: Compass,
  cyberpunk: Swords,
  dungeon_transport: Mountain,
  tower_ascent: Mountain,
  magic_academy: BookOpen,
  dungeon_core: Skull,
  custom_world: Sparkles,
  caravan_escort: Castle,
  prisoner_shipwrecked: Waves,
  patrons_quest: Shield,
  under_siege: Shield,
  cursed_manor: BookOpen,
  wilderness_expedition: Trees,
  ai_random: Sparkles,
  ai_custom: Sparkles,
};

const LORE_CATEGORY_MAP: Record<string, InfoCategory> = {
  history: 'lore',
  world: 'lore',
  faction: 'lore',
  culture: 'lore',
  mechanic: 'rules',
  mystery: 'lore',
};

const LORE_ICON: Record<string, LucideIcon> = {
  history: BookOpen,
  world: Compass,
  faction: Shield,
  culture: BookOpen,
  mechanic: ScrollText,
  mystery: Layers,
};

function bibleToStarter(bible: CampaignBible): CampaignStarter {
  return {
    id: bible.id,
    archetype: bible.archetype,
    engineMode: bible.engineMode,
    title: bible.title,
    tagline: bible.tagline,
    description: getCampaignBlurb(bible),
    difficulty: bible.difficulty,
    accent: ARCHETYPE_ACCENTS[bible.archetype] ?? 'crimson',
    icon: ARCHETYPE_ICONS[bible.archetype] ?? Sparkles,
    nsfw: bible.nsfw,
    genreTag: bible.genreTag,
  };
}

function bibleToInfoCards(bible: CampaignBible): InfoCard[] {
  const loreCards: InfoCard[] = bible.loreSnippets.map((snippet: LoreSnippet) => ({
    id: `${bible.id}-lore-${snippet.id}`,
    category: LORE_CATEGORY_MAP[snippet.category] ?? 'lore',
    title: snippet.title,
    summary: snippet.body,
    tags: snippet.tags,
    icon: LORE_ICON[snippet.category] ?? BookOpen,
    campaignId: bible.id,
  }));

  const npcCards: InfoCard[] = bible.keyNPCs.map((npc: KeyNPC) => ({
    id: `${bible.id}-npc-${npc.id}`,
    category: 'npcs',
    title: npc.name,
    summary: npc.description,
    tags: [npc.role, npc.disposition, ...npc.hooks.slice(0, 1)],
    icon: Users,
    campaignId: bible.id,
  }));

  const itemCards: InfoCard[] = bible.starterItems.map((item) => ({
    id: `${bible.id}-item-${item.id}`,
    category: 'items',
    title: item.name,
    summary: item.description,
    tags: [item.rarity, item.itemType],
    icon: Sparkles,
    campaignId: bible.id,
  }));

  return [...loreCards, ...npcCards, ...itemCards];
}

const MAP_TEMPLATES: MapTemplate[] = [
  { id: 'dungeon-classic', name: 'Classic Dungeon', description: 'Stone corridors, torchlit rooms, secret doors', icon: Mountain, tier: 1 },
  { id: 'forest-trail', name: 'Forest Trail', description: 'Dense woodland paths, hidden clearings, wildlife', icon: Trees, tier: 1 },
  { id: 'coastal-town', name: 'Coastal Town', description: 'Harbor district, docks, merchant quarter', icon: Waves, tier: 1 },
  { id: 'mountain-pass', name: 'Mountain Pass', description: 'High altitude switchbacks, snow, avalanches', icon: Mountain, tier: 2 },
  { id: 'castle-keep', name: 'Castle Keep', description: 'Fortified halls, battlements, throne room', icon: Castle, tier: 2 },
  { id: 'volcanic-cavern', name: 'Volcanic Cavern', description: 'Magma rivers, heat hazards, obsidian bridges', icon: Flame, tier: 3 },
  { id: 'void-rift', name: 'Void Rift', description: 'Fractured reality, floating debris, cosmic entities', icon: Layers, tier: 4 },
];

const CATEGORY_META: Record<InfoCategory, { label: string; icon: LucideIcon }> = {
  lore: { label: 'Lore', icon: BookOpen },
  npcs: { label: 'NPCs', icon: Users },
  rules: { label: 'Rules', icon: ScrollText },
  locations: { label: 'Locations', icon: Compass },
  items: { label: 'Items', icon: Sparkles },
};

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  Easy: 'border-emerald-600/40 bg-emerald-950/40 text-emerald-300',
  Standard: 'border-amber-600/40 bg-amber-950/40 text-amber-300',
  Hardcore: 'border-crimson-600/50 bg-crimson-950/50 text-crimson-300',
};

const ACCENT_RING: Record<string, string> = {
  crimson: 'hover:border-crimson-500',
  amber: 'hover:border-amber-500',
  sky: 'hover:border-sky-500',
  emerald: 'hover:border-emerald-500',
  violet: 'hover:border-violet-500',
  cyan: 'hover:border-cyan-500',
  fuchsia: 'hover:border-fuchsia-500',
  orange: 'hover:border-orange-500',
};

const ACCENT_ICON: Record<string, string> = {
  crimson: 'text-crimson-400',
  amber: 'text-amber-400',
  sky: 'text-sky-400',
  emerald: 'text-emerald-400',
  violet: 'text-violet-400',
  cyan: 'text-cyan-400',
  fuchsia: 'text-fuchsia-400',
  orange: 'text-orange-400',
};

const ACCENT_GRADIENT: Record<string, string> = {
  crimson: 'from-crimson-950/60 to-slate-900',
  amber: 'from-amber-950/50 to-slate-900',
  sky: 'from-sky-950/50 to-slate-900',
  emerald: 'from-emerald-950/50 to-slate-900',
  violet: 'from-violet-950/50 to-slate-900',
  cyan: 'from-cyan-950/50 to-slate-900',
  fuchsia: 'from-fuchsia-950/50 to-slate-900',
  orange: 'from-orange-950/50 to-slate-900',
};

type Tab = 'campaigns' | 'maps' | 'info';

export function GMLibrary({ open, contentMode, onClose, onSelectCampaign, onSelectMap }: GMLibraryProps) {
  const [tab, setTab] = useState<Tab>('campaigns');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selectedMap, setSelectedMap] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<InfoCategory | 'all'>('all');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const visibleBibles = useMemo(
    () => filterBiblesForContentMode(ALL_CAMPAIGN_BIBLES, contentMode),
    [contentMode],
  );
  const starters = useMemo(() => visibleBibles.map(bibleToStarter), [visibleBibles]);
  const infoCards = useMemo(() => visibleBibles.flatMap(bibleToInfoCards), [visibleBibles]);

  const carouselVisible = useMemo(() => {
    const start = carouselIndex * 3;
    return starters.slice(start, start + 3);
  }, [carouselIndex, starters]);

  const maxCarouselPage = Math.max(0, Math.ceil(starters.length / 3) - 1);

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    return infoCards.filter((c) => {
      if (activeCategory !== 'all' && c.category !== activeCategory) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q) ||
        c.tags.some((t) => t.includes(q))
      );
    });
  }, [search, activeCategory, infoCards]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4">
      <div
        className="relative flex h-full max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-slate-700/60 bg-slate-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-crimson-500/30 bg-crimson-950/40 text-crimson-400">
              <BookOpen size={18} />
            </div>
            <div>
              <h2 className="font-serif text-base font-bold tracking-wide text-slate-100 sm:text-lg">
                GM Library
              </h2>
              <p className="hidden text-[11px] text-slate-500 sm:block">
                Campaign starters, map templates, and world reference cards
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex shrink-0 gap-1 border-b border-slate-800 bg-slate-900/60 px-3 py-2 sm:px-6">
          <TabButton active={tab === 'campaigns'} onClick={() => setTab('campaigns')} icon={<Swords size={15} />} label="Campaign Starters" />
          <TabButton active={tab === 'maps'} onClick={() => setTab('maps')} icon={<MapIcon size={15} />} label="Map Templates" />
          <TabButton active={tab === 'info'} onClick={() => setTab('info')} icon={<Layers size={15} />} label="Info Cards" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {tab === 'campaigns' && (
            <CampaignCarousel
              visible={carouselVisible}
              index={carouselIndex}
              maxPage={maxCarouselPage}
              onPrev={() => setCarouselIndex((i) => Math.max(0, i - 1))}
              onNext={() => setCarouselIndex((i) => Math.min(maxCarouselPage, i + 1))}
              onSelect={(c) => onSelectCampaign?.(c.archetype, c.engineMode, c.id)}
            />
          )}

          {tab === 'maps' && (
            <MapGallery
              templates={MAP_TEMPLATES}
              selected={selectedMap}
              onSelect={(id) => {
                setSelectedMap(id);
                onSelectMap?.(id);
              }}
            />
          )}

          {tab === 'info' && (
            <InfoViewer
              cards={filteredCards}
              search={search}
              onSearch={setSearch}
              activeCategory={activeCategory}
              onCategory={setActiveCategory}
              mobileFilterOpen={mobileFilterOpen}
              onToggleMobileFilter={() => setMobileFilterOpen((v) => !v)}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-slate-800 bg-slate-950 px-4 py-3 sm:px-6">
          <span className="text-[11px] text-slate-600">
            {tab === 'campaigns' && `${starters.length} campaign starters available`}
            {tab === 'maps' && `${MAP_TEMPLATES.length} map templates`}
            {tab === 'info' && `${filteredCards.length} info cards`}
          </span>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700"
          >
            Close Library
          </button>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? 'border border-crimson-500/40 bg-crimson-950/30 text-crimson-300'
          : 'border border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{label.split(' ')[0]}</span>
    </button>
  );
}

function CampaignCarousel({
  visible,
  index,
  maxPage,
  onPrev,
  onNext,
  onSelect,
}: {
  visible: CampaignStarter[];
  index: number;
  maxPage: number;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (c: CampaignStarter) => void;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-serif text-sm font-semibold text-slate-200">Pre-Made Campaign Settings</h3>
          <p className="text-[11px] text-slate-500">Choose a starting scenario to launch your adventure</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onPrev}
            disabled={index === 0}
            className="rounded-lg border border-slate-700 bg-slate-800/60 p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-[11px] tabular-nums text-slate-500">
            {index + 1} / {maxPage + 1}
          </span>
          <button
            onClick={onNext}
            disabled={index >= maxPage}
            className="rounded-lg border border-slate-700 bg-slate-800/60 p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={`${c.archetype}-${c.engineMode}`}
              onClick={() => onSelect(c)}
              className={`group flex flex-col overflow-hidden rounded-xl border border-slate-700 bg-gradient-to-b ${ACCENT_GRADIENT[c.accent]} text-left transition-all duration-200 ${ACCENT_RING[c.accent]} hover:shadow-lg`}
            >
              {/* Image placeholder */}
              <div className="relative flex h-28 items-center justify-center overflow-hidden border-b border-slate-800/60 bg-slate-900/50">
                <div className="absolute inset-0 opacity-20 comic-halftone" />
                <Icon className={`relative z-10 ${ACCENT_ICON[c.accent]}`} size={48} strokeWidth={1.2} />
                <div className={`absolute bottom-0 left-0 right-0 h-1 ${ACCENT_ICON[c.accent].replace('text-', 'bg-')}`} />
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col gap-2 p-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-serif text-sm font-semibold text-slate-100">{c.title}</h4>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${DIFFICULTY_STYLES[c.difficulty]}`}
                  >
                    {c.difficulty}
                  </span>
                </div>
                {(c.nsfw || c.genreTag) && (
                  <div className="flex flex-wrap items-center gap-1">
                    {c.nsfw ? (
                      <span className="rounded-full border border-rose-500/80 bg-rose-950/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-100">
                        NSFW
                      </span>
                    ) : null}
                    {c.genreTag ? (
                      <span className="rounded-full border border-crimson-700/70 bg-crimson-950/55 px-2 py-0.5 text-[10px] font-medium text-crimson-200">
                        {c.genreTag}
                      </span>
                    ) : null}
                  </div>
                )}
                {c.tagline && (
                  <p className="text-[11px] italic leading-snug text-slate-300">{c.tagline}</p>
                )}
                <p className="text-[11px] leading-relaxed text-slate-400">{c.description}</p>
                <div className="mt-auto flex items-center gap-1.5 pt-1">
                  <span className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-slate-500">
                    {c.engineMode === 'dnd'
                      ? '5e Fantasy'
                      : c.engineMode === 'pyoa'
                        ? 'Pick Your Own Adventure'
                        : c.engineMode === 'rpg'
                          ? 'Story RPG'
                          : 'LitRPG'}
                  </span>
                  <span className={`text-[10px] ${ACCENT_ICON[c.accent]} opacity-0 transition-opacity group-hover:opacity-100`}>
                    Select →
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MapGallery({
  templates,
  selected,
  onSelect,
}: {
  templates: MapTemplate[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-4">
        <h3 className="font-serif text-sm font-semibold text-slate-200">Starting Map Templates</h3>
        <p className="text-[11px] text-slate-500">Pick a terrain template for your adventure's opening region</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {templates.map((m) => {
          const Icon = m.icon;
          const isSelected = selected === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onSelect(m.id)}
              className={`group flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all duration-200 ${
                isSelected
                  ? 'border-crimson-500 bg-crimson-950/30 shadow-lg'
                  : 'border-slate-700 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800/60'
              }`}
            >
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-lg border ${
                  isSelected ? 'border-crimson-500/40 bg-crimson-950/40 text-crimson-400' : 'border-slate-700 bg-slate-800/60 text-slate-400 group-hover:text-slate-300'
                }`}
              >
                <Icon size={28} strokeWidth={1.3} />
              </div>
              <div className="min-w-0">
                <div className="truncate font-serif text-xs font-semibold text-slate-200">{m.name}</div>
                <div className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-slate-500">{m.description}</div>
              </div>
              <span className="rounded-full border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-[9px] text-slate-400">
                Tier {m.tier}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function InfoViewer({
  cards,
  search,
  onSearch,
  activeCategory,
  onCategory,
  mobileFilterOpen,
  onToggleMobileFilter,
}: {
  cards: InfoCard[];
  search: string;
  onSearch: (v: string) => void;
  activeCategory: InfoCategory | 'all';
  onCategory: (c: InfoCategory | 'all') => void;
  mobileFilterOpen: boolean;
  onToggleMobileFilter: () => void;
}) {
  const categories: (InfoCategory | 'all')[] = ['all', 'lore', 'npcs', 'rules', 'locations', 'items'];

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* Sidebar — desktop */}
      <aside className="hidden w-48 shrink-0 lg:block">
        <h3 className="mb-2 font-serif text-xs font-semibold uppercase tracking-wide text-slate-500">Categories</h3>
        <div className="flex flex-col gap-1">
          {categories.map((cat) => {
            const Icon = cat === 'all' ? Layers : CATEGORY_META[cat].icon;
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => onCategory(cat)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${
                  isActive
                    ? 'border border-crimson-500/40 bg-crimson-950/30 text-crimson-300'
                    : 'border border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <Icon size={14} />
                <span className="capitalize">{cat === 'all' ? 'All Cards' : CATEGORY_META[cat].label}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 min-w-0">
        {/* Search bar */}
        <div className="mb-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search lore, NPCs, rules..."
              className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-600 focus:border-crimson-500 focus:outline-none"
            />
          </div>
          {/* Mobile filter toggle */}
          <button
            onClick={onToggleMobileFilter}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-300 transition-colors hover:bg-slate-700 lg:hidden"
          >
            <Layers size={14} />
            Filter
          </button>
        </div>

        {/* Mobile filter bottom sheet */}
        {mobileFilterOpen && (
          <div className="mb-3 lg:hidden">
            <div className="rounded-lg border border-slate-700 bg-slate-900 p-2">
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => {
                  const Icon = cat === 'all' ? Layers : CATEGORY_META[cat].icon;
                  const isActive = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        onCategory(cat);
                        onToggleMobileFilter();
                      }}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        isActive
                          ? 'border border-crimson-500/40 bg-crimson-950/30 text-crimson-300'
                          : 'border border-slate-700 bg-slate-800/40 text-slate-400'
                      }`}
                    >
                      <Icon size={13} />
                      <span className="capitalize">{cat === 'all' ? 'All' : CATEGORY_META[cat].label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Cards grid */}
        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <Search size={32} className="text-slate-700" />
            <p className="text-sm text-slate-500">No info cards match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {cards.map((card) => {
              const Icon = card.icon;
              const catMeta = CATEGORY_META[card.category];
              return (
                <div
                  key={card.id}
                  className="group flex flex-col gap-2 rounded-xl border border-slate-700 bg-slate-900/50 p-4 transition-all hover:border-slate-600 hover:bg-slate-800/50"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/60 text-slate-400">
                      <Icon size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-serif text-sm font-semibold text-slate-100">{card.title}</h4>
                      <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-slate-500">
                        {catMeta.label}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-400">{card.summary}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {card.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-slate-700 bg-slate-800/40 px-2 py-0.5 text-[9px] text-slate-500"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
