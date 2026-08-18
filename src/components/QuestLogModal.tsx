import React, { useState } from 'react';
import type { Quest, QuestStatus } from '@/game/types';
import { isJournalQuest } from '@/game/questPlay';

interface QuestLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  quests: Quest[];
}

function isKnownQuest(q: Quest): boolean {
  return isJournalQuest(q);
}

export const QuestLogModal: React.FC<QuestLogModalProps> = ({
  isOpen,
  onClose,
  quests = [],
}) => {
  const [filter, setFilter] = useState<QuestStatus | 'all'>('active');
  const knownQuests = quests.filter(isKnownQuest);
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(
    knownQuests[0]?.id ?? null
  );

  function formatQuestRewards(rewards: Quest['rewards']): string {
    if (!rewards) return '';
    if (typeof rewards === 'string') return rewards;
    const bits: string[] = [];
    if (rewards.xp) bits.push(`${rewards.xp} XP`);
    if (rewards.gold) bits.push(`${rewards.gold} gold`);
    if (rewards.items?.length) bits.push(rewards.items.join(', '));
    return bits.join(' · ');
  }

  if (!isOpen) return null;

  const filteredQuests = knownQuests.filter((q) => {
    if (filter === 'all') return true;
    if (filter === 'active') return q.status === 'active' && q.revealed === true;
    return q.status === filter;
  });

  const selectedQuest =
    knownQuests.find((q) => q.id === selectedQuestId) || filteredQuests[0];

  const tabCount = (tab: QuestStatus | 'all') =>
    tab === 'all' ? knownQuests.length : knownQuests.filter((q) => q.status === tab).length;

  const getStatusBadge = (status: QuestStatus) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-0.5 text-xs font-bold rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">Active</span>;
      case 'completed':
        return <span className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Completed</span>;
      case 'failed':
        return <span className="px-2 py-0.5 text-xs font-bold rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">Failed</span>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="sgm-turn-frame sgm-info-panel relative w-full max-w-4xl h-[80vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="sgm-turn-frame-bar h-1 w-full shrink-0" />
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-black/20">
          <div className="flex items-center gap-3">
            <span className="sgm-info-accent font-mono text-[10px] uppercase tracking-[0.2em]">System</span>
            <h2 className="sgm-info-heading text-xl font-bold tracking-wide uppercase">
              Quest Journal
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex border-b border-slate-800/80 bg-black/10 px-6 gap-2 pt-2">
          {(['active', 'completed', 'failed', 'all'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 text-sm font-semibold capitalize border-b-2 transition-colors ${
                filter === tab
                  ? 'sgm-info-tab-on'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab} ({tabCount(tab)})
            </button>
          ))}
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-1/3 border-r border-slate-800/60 overflow-y-auto p-4 space-y-2">
            {filteredQuests.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No quests found in this category.
              </div>
            ) : (
              filteredQuests.map((quest) => {
                const isSelected = selectedQuest?.id === quest.id;
                return (
                  <button
                    key={quest.id}
                    onClick={() => setSelectedQuestId(quest.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      isSelected
                        ? 'sgm-info-tab-on border shadow-md'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-xs uppercase font-semibold tracking-wider ${
                        quest.type === 'main' ? 'text-amber-400' : 'text-cyan-400'
                      }`}>
                        {quest.type === 'main' ? '★ Main' : '⚡ Side'}
                      </span>
                      {getStatusBadge(quest.status)}
                    </div>
                    <div className="font-bold text-sm text-slate-200 truncate">
                      {quest.name}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-slate-950/30">
            {selectedQuest ? (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs uppercase font-bold tracking-widest ${
                      selectedQuest.type === 'main' ? 'text-amber-400' : 'text-cyan-400'
                    }`}>
                      {selectedQuest.type === 'main' ? 'Main Campaign Quest' : 'Side Quest'}
                    </span>
                    {getStatusBadge(selectedQuest.status)}
                  </div>
                  <h3 className="sgm-info-heading text-2xl font-bold mb-2">
                    {selectedQuest.name}
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {selectedQuest.description}
                  </p>
                </div>

                {selectedQuest.objectives?.length ? (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Objectives
                    </h4>
                    <div className="space-y-2">
                      {selectedQuest.objectives.map((obj) => (
                        <div
                          key={obj.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border ${
                            obj.completed
                              ? 'bg-emerald-950/20 border-emerald-800/40 text-slate-300'
                              : 'bg-slate-900/80 border-slate-800 text-slate-200'
                          }`}
                        >
                          <span className="mt-0.5 text-base">
                            {obj.completed ? '✅' : '⚪'}
                          </span>
                          <div className="flex-1 text-sm">
                            <p className={obj.completed ? 'line-through text-slate-400' : ''}>
                              {obj.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {selectedQuest.whatNext ? (
                  <div className="sgm-info-tab-on p-4 rounded-lg border">
                    <h4 className="sgm-info-heading text-xs font-bold uppercase tracking-wider mb-1">
                      What next
                    </h4>
                    <p className="text-sm text-slate-300">{selectedQuest.whatNext}</p>
                  </div>
                ) : null}

                {selectedQuest.provenance ? (
                  <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/40">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Why this is on file
                    </h4>
                    <p className="text-xs text-slate-400">{selectedQuest.provenance}</p>
                  </div>
                ) : null}

                {formatQuestRewards(selectedQuest.rewards) && (
                  <div className="sgm-info-tab-on p-4 rounded-lg border">
                    <h4 className="sgm-info-heading text-xs font-bold uppercase tracking-wider mb-1">
                      Quest Rewards
                    </h4>
                    <p className="text-sm text-slate-300">{formatQuestRewards(selectedQuest.rewards)}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <p className="sgm-info-accent font-mono text-xs uppercase tracking-widest mb-2 opacity-80">System</p>
                <p>No quest on file yet. Survive. The System will ping you.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
