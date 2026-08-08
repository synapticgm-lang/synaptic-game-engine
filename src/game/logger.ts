export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  t: number;
  level: LogLevel;
  category: string;
  message: string;
  data?: unknown;
}

const MAX_ENTRIES = 2000;
const buffer: LogEntry[] = [];
const listeners = new Set<() => void>();

const originalConsole = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

let capturing = false;

import { debugLogger } from './debugLogger';

const levelMap: Record<LogLevel, string> = {
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
};

function pushEntry(level: LogLevel, category: string, message: string, data?: unknown) {
  const entry: LogEntry = { t: Date.now(), level, category, message, data };
  buffer.push(entry);
  if (buffer.length > MAX_ENTRIES) buffer.shift();
  listeners.forEach((l) => l());

  // Bridge into the UI-visible Debug panel
  debugLogger.record(levelMap[level], `[${category}] ${message}`, data);
}

export const logger = {
  debug(category: string, message: string, data?: unknown) {
    pushEntry('debug', category, message, data);
  },
  info(category: string, message: string, data?: unknown) {
    pushEntry('info', category, message, data);
  },
  warn(category: string, message: string, data?: unknown) {
    pushEntry('warn', category, message, data);
  },
  error(category: string, message: string, data?: unknown) {
    pushEntry('error', category, message, data);
  },

  getEntries(): LogEntry[] {
    return [...buffer];
  },

  clear() {
    buffer.length = 0;
    listeners.forEach((l) => l());
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  startConsoleCapture() {
    if (capturing) return;
    capturing = true;
    console.log = (...args: unknown[]) => {
      originalConsole.log(...args);
      pushEntry('debug', 'console', args.map(formatArg).join(' '));
    };
    console.info = (...args: unknown[]) => {
      originalConsole.info(...args);
      pushEntry('info', 'console', args.map(formatArg).join(' '));
    };
    console.warn = (...args: unknown[]) => {
      originalConsole.warn(...args);
      pushEntry('warn', 'console', args.map(formatArg).join(' '));
    };
    console.error = (...args: unknown[]) => {
      originalConsole.error(...args);
      pushEntry('error', 'console', args.map(formatArg).join(' '));
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleGlobalRejection);
  },

  downloadLog(filename?: string) {
    const entries = buffer;
    const lines: string[] = [];
    lines.push('========================================');
    lines.push('  SYNAPTIC AI GAME - DEBUG LOG EXPORT');
    lines.push(`  Generated: ${new Date().toISOString()}`);
    lines.push(`  Entries: ${entries.length}`);
    lines.push('========================================');
    lines.push('');

    for (const e of entries) {
      const ts = new Date(e.t).toISOString();
      const prefix = `[${ts}] [${e.level.toUpperCase()}] [${e.category}]`;
      let line = `${prefix} ${e.message}`;
      if (e.data !== undefined) {
        try {
          const dataStr = typeof e.data === 'string' ? e.data : JSON.stringify(e.data, null, 0);
          if (dataStr && dataStr.length <= 2000) {
            line += `\n  data: ${dataStr}`;
          } else if (dataStr) {
            line += `\n  data: ${dataStr.slice(0, 2000)}… (truncated)`;
          }
        } catch {
          line += '\n  data: [unserializable]';
        }
      }
      lines.push(line);
    }

    lines.push('');
    lines.push('========================================');
    lines.push('  END OF LOG');
    lines.push('========================================');

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `synaptic-debug-${Date.now()}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};

function formatArg(arg: unknown): string {
  if (arg instanceof Error) return `${arg.name}: ${arg.message}\n${arg.stack ?? ''}`;
  if (typeof arg === 'string') return arg;
  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
}

function handleGlobalError(event: ErrorEvent) {
  pushEntry('error', 'window', `Uncaught error: ${event.message}`, {
    filename: event.filename,
    line: event.lineno,
    col: event.colno,
    stack: event.error?.stack,
  });
}

function handleGlobalRejection(event: PromiseRejectionEvent) {
  const reason = event.reason;
  pushEntry('error', 'window', `Unhandled promise rejection: ${reason instanceof Error ? reason.message : String(reason)}`, {
    stack: reason instanceof Error ? reason.stack : undefined,
  });
}
