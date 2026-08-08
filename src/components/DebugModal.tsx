import { useState, useMemo, useEffect, useSyncExternalStore } from 'react';
import { X, Copy, Download, Trash2, Bug, Cpu, Monitor, Smartphone, Fingerprint, Search } from 'lucide-react';
import { debugLogger, type DebugLogEntry } from '../game/debugLogger';
import type { GameState, Settings } from '../game/types';
import type { Toast } from './ToastStack';

interface Props {
  state: GameState;
  settings: Settings;
  onClose: () => void;
  addToast: (message: string, type?: Toast['type']) => void;
}

export function DebugModal({ state, settings, onClose, addToast }: Props) {
  const [filter, setFilter] = useState<'all' | 'error' | 'event'>('all');
  const [search, setSearch] = useState('');

  useSyncExternalStore(
    (cb) => debugLogger.subscribe(cb),
    () => debugLogger.getLogs().length
  );

  const allLogs = debugLogger.getLogs();
  const telemetry = debugLogger.getTelemetry();
  const deviceId = debugLogger.getDeviceId();

  const filteredLogs = useMemo(() => {
    let logs = allLogs;
    if (filter === 'error') logs = logs.filter(l => l.type === 'ERROR' || l.type === 'CRITICAL');
    if (filter === 'event') logs = logs.filter(l => l.type !== 'ERROR' && l.type !== 'CRITICAL');
    if (search.trim()) {
      const q = search.toLowerCase();
      logs = logs.filter(l =>
        l.message.toLowerCase().includes(q) ||
        l.type.toLowerCase().includes(q)
      );
    }
    return logs;
  }, [allLogs, filter, search]);

  const handleCopy = async () => {
    const success = await debugLogger.copyToClipboard(state, settings, filter === 'error' ? 'error' : 'event');
    if (success) {
      addToast('Log copied to clipboard!', 'success');
    } else {
      addToast('Clipboard blocked — using download instead', 'info');
      debugLogger.downloadUnifiedLog(state, settings, filter === 'error' ? 'error' : 'event');
    }
  };

  const handleDownload = () => {
    debugLogger.downloadUnifiedLog(state, settings, filter === 'error' ? 'error' : 'event');
    addToast('Log downloaded', 'success');
  };

  const handleClear = () => {
    debugLogger.record('DEBUG', 'User cleared debug log buffer');
    // Force re-render
    setTick(t => t + 1);
    addToast('Debug log cleared', 'info');
  };

  const errorCount = allLogs.filter(l => l.type === 'ERROR' || l.type === 'CRITICAL').length;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="debug-modal-title"
    >
      <div
        className="relative w-full max-w-3xl h-[85vh] mx-2 rounded-xl border border-slate-700 bg-slate-950 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <Bug size={18} className="text-rose-400" />
            <h2 id="debug-modal-title" className="text-sm font-bold text-slate-100">Diagnostics &amp; Telemetry</h2>
            {errorCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-900/60 border border-rose-700 text-[10px] font-mono text-rose-300">
                {errorCount} errors
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            aria-label="Close debug modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Device Info Bar */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/40 grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
          <div className="flex items-center gap-1.5">
            <Fingerprint size={14} className="text-amber-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-slate-500 font-mono">Device ID</div>
              <div className="text-slate-300 font-mono truncate" title={deviceId}>{deviceId.slice(0, 18)}…</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Monitor size={14} className="text-cyan-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-slate-500 font-mono">Screen</div>
              <div className="text-slate-300 font-mono truncate">{String(telemetry.screenResolution)}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Cpu size={14} className="text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-slate-500 font-mono">Platform</div>
              <div className="text-slate-300 font-mono truncate" title={String(telemetry.platform)}>
                {String(telemetry.platform).slice(0, 20)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Smartphone size={14} className="text-violet-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-slate-500 font-mono">Viewport</div>
              <div className="text-slate-300 font-mono truncate">{String(telemetry.viewport)}</div>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800 bg-slate-900/30 flex-wrap">
          <div className="flex rounded-lg overflow-hidden border border-slate-700">
            {(['all', 'error', 'event'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-[11px] font-medium transition-colors ${
                  filter === f
                    ? 'bg-slate-700 text-slate-100'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {f === 'all' ? 'All' : f === 'error' ? 'Errors' : 'Events'}
              </button>
            ))}
          </div>

          <div className="relative flex-1 min-w-[120px]">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search logs…"
              className="w-full pl-8 pr-3 py-1.5 text-[11px] rounded-lg bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-500"
            />
          </div>

          <button
            onClick={handleClear}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-rose-300 hover:border-rose-700 transition-colors"
            title="Clear logs"
            aria-label="Clear debug logs"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Log List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
          {filteredLogs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
              <Bug size={32} className="opacity-30" />
              <p className="text-xs">No logs match the current filter.</p>
            </div>
          )}
          {filteredLogs.map((log, i) => (
            <LogRow key={`${log.timestamp}-${i}`} log={log} />
          ))}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-t border-slate-800 bg-slate-900/80">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors shadow-lg shadow-emerald-900/30"
          >
            <Copy size={16} />
            Copy Diagnostics to Clipboard
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-medium transition-colors"
            title="Download as file"
            aria-label="Download diagnostics as file"
          >
            <Download size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function LogRow({ log }: { log: DebugLogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const isError = log.type === 'ERROR' || log.type === 'CRITICAL';

  const typeColor = isError
    ? 'bg-rose-900/60 text-rose-300 border-rose-700'
    : log.type === 'WARN'
    ? 'bg-amber-900/50 text-amber-300 border-amber-700'
    : log.type === 'DEBUG'
    ? 'bg-slate-800 text-slate-400 border-slate-700'
    : 'bg-sky-900/50 text-sky-300 border-sky-700';

  const time = log.timestamp.slice(11, 19);

  return (
    <div
      className={`rounded-lg border ${isError ? 'border-rose-800/40 bg-rose-950/20' : 'border-slate-800/60 bg-slate-900/40'} overflow-hidden cursor-pointer transition-colors hover:border-slate-600`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-2 px-3 py-2">
        <span className="text-[10px] font-mono text-slate-500 mt-0.5 shrink-0">{time}</span>
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border shrink-0 ${typeColor}`}>
          {log.type}
        </span>
        <span className="text-[11px] text-slate-300 flex-1 break-words">{log.message}</span>
      </div>
      {expanded && log.data && (
        <pre className="px-3 pb-2 text-[10px] font-mono text-slate-500 whitespace-pre-wrap break-all overflow-x-auto">
          {JSON.stringify(log.data, null, 2)}
        </pre>
      )}
    </div>
  );
}
