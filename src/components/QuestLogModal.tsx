import React, { useState } from 'react';
import type { Quest, QuestStatus } from './types';

interface QuestLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  quests: Quest[];
}

export const QuestLogModal: React.FC<QuestLogModalProps> = ({
  isOpen,
  onClose,
  quests = [],
}) => {
  const [filter, setFilter] = useState<QuestStatus | 'all'>('active');
  const knownIds = quests
    .filter((q) => q.revealed === true || q.status === 'completed')
    .map((q) => q.id);
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(
    knownIds[0] ?? null
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

  const knownQuests = quests.filter((q) => q.revealed === true || q.status === 'completed');
  const filteredQuests = knownQuests.filter((q) => {
    if (filter === 'all') return true;
    return q.status === filter;
  });

  const selectedQuest = quests.find((q) => q.id === selectedQuestId) || filteredQuests[0];

  const getStatusBadge = (status: QuestStatus) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-0.5 text-xs font-bold rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">Active</span>;
      case 'completed':
        return <span className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Completed</span>;
      case 'failed':
        return <span className="px-2 py-0.5 text-xs font-bold rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">Failed</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl h-[80vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📜</span>
            <h2 className="text-xl font-bold tracking-wide text-amber-400 uppercase">
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

        {/* Filter Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-6 gap-2 pt-2">
          {(['active', 'completed', 'failed', 'all'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 text-sm font-semibold capitalize border-b-2 transition-colors ${
                filter === tab
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab} ({tab === 'all' ? quests.length : quests.filter((q) => q.status === tab).length})
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Quest List (Left Column) */}
          <div className="w-1/3 border-r border-slate-800 overflow-y-auto p-4 space-y-2">
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
                        ? 'bg-slate-800 border-amber-500/50 shadow-md'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-xs uppercase font-semibold tracking-wider ${
                        quest.category === 'main' ? 'text-amber-400' : 'text-cyan-400'
                      }`}>
                        {quest.category === 'main' ? '★ Main Campaign' : '⚡ Side Quest'}
                      </span>
                      {getStatusBadge(quest.status)}
                    </div>
                    <div className="font-bold text-sm text-slate-200 truncate">
                      {quest.title}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Quest Details (Right Column) */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-950/30">
            {selectedQuest ? (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs uppercase font-bold tracking-widest ${
                      selectedQuest.category === 'main' ? 'text-amber-400' : 'text-cyan-400'
                    }`}>
                      {selectedQuest.category === 'main' ? 'Main Campaign Quest' : 'Side Quest'}
                    </span>
                    {getStatusBadge(selectedQuest.status)}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-100 mb-2">
                    {selectedQuest.title}
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {selectedQuest.description}
                  </p>
                </div>

                {/* Objectives */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Objectives
                  </h4>
                  <div className="space-y-2">
                    {selectedQuest.objectives?.map((obj) => (
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
                          {obj.target !== undefined && obj.target > 1 && (
                            <div className="mt-1 text-xs text-slate-400">
                              Progress: {obj.current || 0} / {obj.target}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rewards section if available */}
                {formatQuestRewards(selectedQuest.rewards) && (
                  <div className="p-4 rounded-lg bg-amber-950/10 border border-amber-800/30">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                      Quest Rewards
                    </h4>
                    <p className="text-sm text-slate-300">{formatQuestRewards(selectedQuest.rewards)}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <span className="text-4xl mb-2">📖</span>
                <p>Select a quest to view its objectives.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};