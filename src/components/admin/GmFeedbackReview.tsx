import { useState, useEffect } from 'react';
import { Download, ThumbsUp, ThumbsDown, Filter, Loader2, ExternalLink, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import {
  listAllGmFeedback,
  exportGmFeedbackToCsv,
  type GmFeedbackRecord,
  type GmFeedbackType,
} from '@/services/gmFeedbackService';

const FEEDBACK_TYPE_LABELS: Record<GmFeedbackType, string> = {
  positive: 'Positive',
  negative: 'Negative',
};

const GAME_MODE_LABELS: Record<string, string> = {
  litrpg: 'LitRPG',
  dnd: 'Tabletop D&D',
  rpg: 'Story RPG',
  pyoa: 'PYOA',
};

export function GmFeedbackReview() {
  const [records, setRecords] = useState<GmFeedbackRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<GmFeedbackType | 'all'>('all');
  const [filterMode, setFilterMode] = useState<string | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    void loadFeedback();
  }, [filterType, filterMode]);

  const loadFeedback = async () => {
    setLoading(true);
    setError(null);
    
    const result = await listAllGmFeedback({
      feedbackType: filterType === 'all' ? undefined : filterType,
      gameMode: filterMode === 'all' ? undefined : filterMode,
      limit: 100,
    });
    
    setLoading(false);
    
    if (result.ok) {
      setRecords(result.records);
      setTotalCount(result.count || 0);
    } else {
      setError(result.error || 'Failed to load feedback');
    }
  };

  const handleExport = () => {
    const csv = exportGmFeedbackToCsv(records);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gm-feedback-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleExpanded = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  const uniqueModes = Array.from(new Set(records.map((r) => r.game_mode).filter(Boolean)));

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">GM Response Feedback</h2>
          <p className="text-sm text-slate-500">
            Tester feedback on individual GM turns ({totalCount} total)
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={records.length === 0}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500" />
          <span className="text-xs font-medium text-slate-400">Feedback:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as GmFeedbackType | 'all')}
            className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="all">All</option>
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400">Mode:</span>
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="all">All</option>
            {uniqueModes.map((mode) => (
              <option key={mode} value={mode}>
                {GAME_MODE_LABELS[mode] || mode}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-8 text-slate-500">
          <Loader2 size={20} className="animate-spin" />
          <span>Loading feedback...</span>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Feedback List */}
      {!loading && !error && records.length === 0 && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-8 text-center text-sm text-slate-500">
          No feedback found matching the current filters.
        </div>
      )}

      {!loading && !error && records.length > 0 && (
        <div className="space-y-2">
          {records.map((record) => (
            <FeedbackCard
              key={record.id}
              record={record}
              expanded={expandedId === record.id}
              onToggle={() => toggleExpanded(record.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FeedbackCardProps {
  record: GmFeedbackRecord;
  expanded: boolean;
  onToggle: () => void;
}

function FeedbackCard({ record, expanded, onToggle }: FeedbackCardProps) {
  const isPositive = record.feedback_type === 'positive';
  const hasComment = Boolean(record.comment);

  return (
    <div
      className={`rounded-lg border transition-colors ${
        isPositive
          ? 'border-emerald-900/50 bg-emerald-950/20'
          : 'border-rose-900/50 bg-rose-950/20'
      }`}
    >
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-900/40"
      >
        {/* Feedback Icon */}
        <div
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
            isPositive
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/20 text-rose-400'
          }`}
        >
          {isPositive ? <ThumbsUp size={14} /> : <ThumbsDown size={14} />}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${isPositive ? 'text-emerald-300' : 'text-rose-300'}`}>
              {FEEDBACK_TYPE_LABELS[record.feedback_type]}
            </span>
            {hasComment && (
              <MessageSquare size={12} className="text-cyan-500" title="Has comment" />
            )}
            <span className="text-xs text-slate-600">•</span>
            <span className="text-xs text-slate-500">
              Turn {record.turn_number}
            </span>
            <span className="text-xs text-slate-600">•</span>
            <span className="text-xs text-slate-500">
              {GAME_MODE_LABELS[record.game_mode || ''] || record.game_mode || 'Unknown'}
            </span>
            {record.bible_id && (
              <>
                <span className="text-xs text-slate-600">•</span>
                <span className="text-xs text-slate-500 font-mono">
                  {record.bible_id}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-600">
            <span>{new Date(record.created_at).toLocaleString()}</span>
            <span>•</span>
            <span className="font-mono">{record.user_id.slice(0, 8)}</span>
            <span>•</span>
            <span className="font-mono">{record.save_id.slice(0, 8)}</span>
          </div>
        </div>

        {/* Expand Icon */}
        <div className="mt-1 text-slate-500">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="space-y-3 border-t border-slate-800 px-4 py-3">
          {/* Comment */}
          {hasComment && (
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                Comment
              </span>
              <p className="rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm leading-relaxed text-slate-200">
                {record.comment}
              </p>
            </div>
          )}

          {/* Player Action */}
          {record.player_action && (
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Player Action
              </span>
              <p className="rounded-md border border-slate-700/60 bg-slate-900/40 px-3 py-2 text-xs leading-relaxed text-slate-300">
                {record.player_action}
              </p>
            </div>
          )}

          {/* GM Story */}
          {record.gm_story && (
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                GM Response
              </span>
              <div className="max-h-48 overflow-y-auto rounded-md border border-slate-700/60 bg-slate-900/40 px-3 py-2">
                <p className="text-xs leading-relaxed text-slate-300 whitespace-pre-wrap">
                  {record.gm_story}
                </p>
              </div>
            </div>
          )}

          {/* Metadata Links */}
          <div className="flex items-center gap-3 text-[10px] text-slate-600">
            <span>User: <code className="text-slate-500">{record.user_id}</code></span>
            <span>Save: <code className="text-slate-500">{record.save_id}</code></span>
          </div>
        </div>
      )}
    </div>
  );
}
