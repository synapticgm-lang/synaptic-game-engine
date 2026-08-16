import { useEffect, useState } from 'react';
import { Copy, Check, Mail, ExternalLink } from 'lucide-react';
import { LEGAL_SUPPORT_EMAIL } from '@/legal/legalDocs';
import {
  listMyMail,
  markMailRead,
  unreadMailCount,
  type PlayerMailMessage,
} from '@/services/mailService';

interface Props {
  /** Auth UUID — same ID Admin sees and players should quote in email. */
  supportUserId: string | null;
  signedIn: boolean;
}

export function SupportAccountPanel({ supportUserId, signedIn }: Props) {
  const [copied, setCopied] = useState(false);
  const [messages, setMessages] = useState<PlayerMailMessage[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!signedIn || !supportUserId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    void listMyMail().then((r) => {
      if (cancelled) return;
      setMessages(r.messages);
      setLoadError(r.error);
    });
    return () => {
      cancelled = true;
    };
  }, [signedIn, supportUserId]);

  const copyId = async () => {
    if (!supportUserId) return;
    try {
      await navigator.clipboard.writeText(supportUserId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  const mailtoHref = (() => {
    const subject = encodeURIComponent('SynapticGM support');
    const body = encodeURIComponent(
      supportUserId
        ? `Support ID: ${supportUserId}\n\nDescribe your issue:\n`
        : 'Please sign in to SynapticGM and copy your Support ID from Settings, then paste it here.\n\nDescribe your issue:\n'
    );
    return `mailto:${LEGAL_SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  })();

  const openMessage = async (msg: PlayerMailMessage) => {
    setExpandedId((id) => (id === msg.id ? null : msg.id));
    if (msg.status === 'unread') {
      await markMailRead(msg.id);
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, status: 'read' as const } : m))
      );
    }
  };

  const unread = unreadMailCount(messages);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-3 space-y-2">
        <p className="text-[11px] text-slate-400 leading-relaxed">
          When you email{' '}
          <a href={mailtoHref} className="text-cyan-400 hover:underline">
            {LEGAL_SUPPORT_EMAIL}
          </a>
          , include your Support ID so we can find your account.
        </p>
        {signedIn && supportUserId ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-slate-950/60 px-2 py-1.5 text-[11px] font-mono text-slate-200 border border-slate-700">
              {supportUserId}
            </code>
            <button
              type="button"
              onClick={() => void copyId()}
              className="inline-flex items-center gap-1 rounded-md border border-slate-600 bg-slate-900 px-2 py-1.5 text-[11px] text-slate-200 hover:bg-slate-800"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        ) : (
          <p className="text-[11px] text-amber-200/80">Sign in with Google to get a Support ID.</p>
        )}
        <a
          href={mailtoHref}
          className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
        >
          <ExternalLink size={12} />
          Open email to support
        </a>
      </div>

      {signedIn && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
              <Mail size={14} className="text-cyan-400" />
              Messages from Support
            </p>
            {unread > 0 && (
              <span className="rounded-full bg-crimson-600/80 px-2 py-0.5 text-[10px] font-semibold text-white">
                {unread} new
              </span>
            )}
          </div>
          {loadError && <p className="text-[11px] text-red-400">{loadError}</p>}
          {!loadError && messages.length === 0 && (
            <p className="text-[11px] text-slate-500">No messages yet.</p>
          )}
          <ul className="space-y-1.5 max-h-48 overflow-y-auto">
            {messages.map((msg) => {
              const open = expandedId === msg.id;
              return (
                <li key={msg.id}>
                  <button
                    type="button"
                    onClick={() => void openMessage(msg)}
                    className={`w-full rounded-md border px-2.5 py-2 text-left transition-colors ${
                      msg.status === 'unread'
                        ? 'border-cyan-700/50 bg-cyan-950/30'
                        : 'border-slate-700/60 bg-slate-950/40'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-[12px] font-medium text-slate-100 truncate">
                        {msg.subject || 'Message from Support'}
                      </span>
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {msg.createdAt.slice(0, 10)}
                      </span>
                    </span>
                    {open && (
                      <span className="mt-2 block whitespace-pre-wrap text-[11px] leading-relaxed text-slate-300">
                        {msg.body}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
