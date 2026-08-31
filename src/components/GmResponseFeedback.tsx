import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Loader2, Check } from 'lucide-react';
import {
  submitGmFeedback,
  getGmFeedback,
  deleteGmFeedback,
  type GmFeedbackType,
} from '@/services/gmFeedbackService';
import { isSupabaseConfigured } from '@/lib/supabase';
import { noteThumbsDownFeedback } from '@/game/craftBookCompiler';

interface Props {
  saveId: string;
  turnNumber: number;
  /** Per-bubble id so opening / turn-0 / later same-turn GM lines each rate separately. */
  logEntryId?: string | null;
  gmStory: string;
  playerAction?: string | null;
  gameMode?: string | null;
  bibleId?: string | null;
}

const MAX_COMMENT_LENGTH = 500;

export function GmResponseFeedback({
  saveId,
  turnNumber,
  logEntryId,
  gmStory,
  playerAction,
  gameMode,
  bibleId,
}: Props) {
  const [feedbackType, setFeedbackType] = useState<GmFeedbackType | null>(null);
  const [comment, setComment] = useState('');
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Any signed-in play account (tester / player / staff / admin) can rate.
  // Own-row RLS only — no role or lab gate.
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    void getGmFeedback(saveId, turnNumber, logEntryId)
      .then((existing) => {
        if (existing) {
          setFeedbackType(existing.feedback_type);
          setComment(existing.comment || '');
          setShowCommentBox(Boolean(existing.comment));
        }
      })
      .catch((err) => {
        console.error('Failed to load GM feedback:', err);
      });
  }, [saveId, turnNumber, logEntryId]);

  const handleFeedbackClick = async (type: GmFeedbackType) => {
    setError(null);
    
    // Toggle off if clicking the same type
    if (feedbackType === type) {
      setSaving(true);
      const result = await deleteGmFeedback(saveId, turnNumber, logEntryId);
      setSaving(false);
      
      if (result.ok) {
        setFeedbackType(null);
        setComment('');
        setShowCommentBox(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError(result.error || 'Failed to remove feedback');
      }
      return;
    }

    // Set new feedback type and show comment box
    setFeedbackType(type);
    setShowCommentBox(true);
    
    // Submit feedback immediately (comment can be added later)
    setSaving(true);
    const result = await submitGmFeedback({
      saveId,
      turnNumber,
      logEntryId,
      feedbackType: type,
      comment: comment || null,
      gmStory,
      playerAction,
      gameMode,
      bibleId,
    });
    setSaving(false);
    
    if (result.ok) {
      if (type === 'down') noteThumbsDownFeedback(turnNumber);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      setError(result.error || 'Failed to save feedback');
    }
  };

  const handleCommentBlur = async () => {
    if (!feedbackType) return;
    
    const trimmedComment = comment.trim();
    
    // Only submit if comment changed
    setSaving(true);
    const result = await submitGmFeedback({
      saveId,
      turnNumber,
      logEntryId,
      feedbackType,
      comment: trimmedComment || null,
      gmStory,
      playerAction,
      gameMode,
      bibleId,
    });
    setSaving(false);
    
    if (result.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      setError(result.error || 'Failed to save comment');
    }
  };

  if (!isSupabaseConfigured) return null;

  const commentCharCount = comment.length;
  const commentOverLimit = commentCharCount > MAX_COMMENT_LENGTH;

  return (
    <div className="flex items-start gap-2 px-1">
      {/* Feedback buttons — any signed-in tester/player/staff/admin. */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => void handleFeedbackClick('positive')}
          disabled={saving}
          className={`group relative flex min-h-11 min-w-11 items-center justify-center rounded-md border transition-all ${
            feedbackType === 'positive'
              ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-400'
              : 'border-slate-700/60 bg-slate-900/40 text-slate-500 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400'
          } ${saving ? 'cursor-not-allowed opacity-50' : ''}`}
          title="Good response"
          aria-label="Good response"
        >
          <ThumbsUp size={18} />
        </button>

        <button
          type="button"
          onClick={() => void handleFeedbackClick('negative')}
          disabled={saving}
          className={`group relative flex min-h-11 min-w-11 items-center justify-center rounded-md border transition-all ${
            feedbackType === 'negative'
              ? 'border-rose-500/60 bg-rose-500/20 text-rose-400'
              : 'border-slate-700/60 bg-slate-900/40 text-slate-500 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400'
          } ${saving ? 'cursor-not-allowed opacity-50' : ''}`}
          title="Poor response"
          aria-label="Poor response"
        >
          <ThumbsDown size={18} />
        </button>

        {/* Status indicators */}
        {saving && (
          <Loader2 size={12} className="ml-1 animate-spin text-slate-500" />
        )}
        {saved && !saving && (
          <Check size={12} className="ml-1 text-emerald-500" />
        )}
        {feedbackType && comment && !saving && !saved && (
          <MessageSquare size={12} className="ml-1 text-cyan-500" title="Comment added" />
        )}
      </div>

      {/* Comment box - shown when feedback is given */}
      {showCommentBox && feedbackType && (
        <div className="flex-1 space-y-1">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onBlur={() => void handleCommentBlur()}
            placeholder="Why? (optional)"
            rows={2}
            maxLength={MAX_COMMENT_LENGTH}
            disabled={saving}
            className={`w-full resize-y rounded-md border px-2 py-1.5 text-xs transition-colors ${
              commentOverLimit
                ? 'border-red-500/60 bg-red-950/20 text-red-200'
                : 'border-slate-700/60 bg-slate-900/40 text-slate-200'
            } placeholder-slate-600 focus:border-cyan-500/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-50`}
          />
          <div className="flex items-center justify-between px-1">
            <span
              className={`text-[10px] ${
                commentOverLimit ? 'text-red-400' : 'text-slate-600'
              }`}
            >
              {commentCharCount} / {MAX_COMMENT_LENGTH}
            </span>
            {commentOverLimit && (
              <span className="text-[10px] text-red-400">Comment too long</span>
            )}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex-1">
          <p className="text-[10px] text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
