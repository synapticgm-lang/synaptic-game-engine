import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import {
  submitPlayerFeedback,
  feedbackRemainingToday,
  type FeedbackType,
} from '@/services/feedbackService';

interface Props {
  playerId?: string | null;
  characterName?: string | null;
  campaign?: string | null;
  engineMode?: string | null;
  turn?: number | null;
}

const TYPES: Array<{ id: FeedbackType; label: string }> = [
  { id: 'bug', label: 'Bug' },
  { id: 'request', label: 'Request' },
  { id: 'message', label: 'Message' },
  { id: 'praise', label: 'Praise' },
];

export function FeedbackPanel({ playerId, characterName, campaign, engineMode, turn }: Props) {
  const [type, setType] = useState<FeedbackType>('bug');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [remaining, setRemaining] = useState(() => feedbackRemainingToday());

  const send = async () => {
    setSending(true);
    setError(null);
    setDone(false);
    const result = await submitPlayerFeedback({
      type,
      subject,
      body,
      playerId,
      campaign,
      engineMode,
      turn,
      payload: characterName ? { characterName } : null,
    });
    setSending(false);
    if (!result.ok) {
      setError(result.error);
      setRemaining(feedbackRemainingToday());
      return;
    }
    setDone(true);
    setBody('');
    setSubject('');
    setRemaining(feedbackRemainingToday());
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Bugs, requests, and messages go to the Admin inbox. {remaining} left today.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setType(t.id)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              type === t.id
                ? 'bg-crimson-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject (optional)"
        maxLength={120}
        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-crimson-500 focus:outline-none focus:ring-1 focus:ring-crimson-500"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What happened, what you expected, or what you want…"
        rows={4}
        maxLength={8000}
        className="w-full resize-y rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-crimson-500 focus:outline-none focus:ring-1 focus:ring-crimson-500"
      />
      {error && <p className="text-[11px] text-red-400">{error}</p>}
      {done && <p className="text-[11px] text-emerald-400">Sent — thank you. We’ll see it in Admin.</p>}
      <button
        type="button"
        onClick={() => void send()}
        disabled={sending || remaining <= 0 || body.trim().length < 8}
        className="flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
      >
        {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        Send feedback
      </button>
    </div>
  );
}
