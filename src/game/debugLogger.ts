// src/game/debugLogger.ts
//
// Reality check (for Cursor / agents):
// - We cannot magically watch Android Chrome on John's phone.
// - This module keeps a full in-session event log (no mid-session 500-cap truncate),
//   exports it as synaptic-debug-latest.json / synaptic-debug-session-<id>.json,
//   and high-signal ERROR/WARN still POST to Supabase telemetry_logs via telemetryService.
// - Screenshots remain useful for UI; for agent pull: drop the latest log file once,
//   or say "pull last session" with sessionId / deviceId when signed-in telemetry is live.

import { hostedBackendDiagnostics } from './gmProxy';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const DEVICE_ID_KEY = 'tactical-litrpg-device-id';
const SESSION_ID_KEY = 'tactical-litrpg-session-id';
const SESSION_STARTED_KEY = 'tactical-litrpg-session-started';
const SESSION_LOG_KEY = 'tactical-litrpg-session-debug-log';
const LAST_SESSION_LOG_KEY = 'tactical-litrpg-last-session-debug-log';
const AUTO_DOWNLOAD_KEY = 'tactical-litrpg-auto-download-debug';

/**
 * Soft memory guard only — never a hard "last N events" ring for the play session.
 * Priority types (ERROR/WARN/CRITICAL/TURN_START) are kept preferentially when trimming INFO.
 * ~8MB JSON estimate; browsers often cap localStorage near 5MB so persistence may store less.
 */
const SOFT_BYTE_CAP = 8 * 1024 * 1024;
const PERSIST_BYTE_CAP = 4 * 1024 * 1024;
const ABSOLUTE_MAX_ENTRIES = 50_000;
const AUTO_DOWNLOAD_THROTTLE_MS = 30_000;

const PRIORITY_TYPES = new Set(['ERROR', 'CRITICAL', 'WARN', 'TURN_START', 'SESSION']);

/** Types retained in production builds (avoid click/state spam). */
const PROD_KEEP_TYPES = new Set(['ERROR', 'CRITICAL', 'WARN', 'TURN_START', 'SESSION']);

function getOrCreateDeviceId(): string {
  if (typeof localStorage === 'undefined') return 'unknown-device';
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = generateUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

function readSessionId(): string {
  if (typeof localStorage === 'undefined') return 'session-unknown';
  let id = localStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = generateUUID();
    localStorage.setItem(SESSION_ID_KEY, id);
  }
  return id;
}

function readSessionStartedAt(): string {
  if (typeof localStorage === 'undefined') return new Date().toISOString();
  let started = localStorage.getItem(SESSION_STARTED_KEY);
  if (!started) {
    started = new Date().toISOString();
    localStorage.setItem(SESSION_STARTED_KEY, started);
  }
  return started;
}

function collectTelemetry(): Record<string, unknown> {
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  const screen = typeof window !== 'undefined' ? window.screen : undefined;

  let platform = 'unknown';
  if (nav) {
    if ((nav as any).userAgentData) {
      const uaData = (nav as any).userAgentData;
      platform = `${uaData.platform || 'unknown'} (${uaData.brands?.map((b: any) => b.brand).join(', ') || ''})`;
    } else if (nav.platform) {
      platform = nav.platform;
    }
  }

  return {
    deviceId: getOrCreateDeviceId(),
    sessionId: readSessionId(),
    sessionStartedAt: readSessionStartedAt(),
    platform,
    userAgent: nav?.userAgent ?? 'unknown',
    screenResolution: screen ? `${screen.width}x${screen.height}` : 'unknown',
    viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown',
    pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 'unknown',
    language: nav?.language ?? 'unknown',
    online: nav?.onLine ?? 'unknown',
  };
}

function estimateEntryBytes(entry: DebugLogEntry): number {
  try {
    return JSON.stringify(entry).length;
  } catch {
    return (entry.message?.length ?? 0) + 128;
  }
}

function isPriority(type: string): boolean {
  return PRIORITY_TYPES.has(type.toUpperCase());
}

export interface DebugLogEntry {
  timestamp: string;
  type: string;
  message: string;
  data?: any;
  telemetry?: Record<string, unknown>;
}

export interface DebugSessionStats {
  sessionId: string;
  sessionStartedAt: string;
  eventCount: number;
  errorCount: number;
  warnCount: number;
  estimatedBytes: number;
  softByteCap: number;
  softCapPolicy: string;
  autoDownloadOnError: boolean;
}

class DebugLogger {
  /** Newest-first (index 0 = most recent). Export reverses for chronological order. */
  private logs: DebugLogEntry[] = [];
  private estimatedBytes = 0;
  private listeners: Set<() => void> = new Set();
  private persistTimer: ReturnType<typeof setTimeout> | null = null;
  private lastAutoDownloadAt = 0;
  private sessionStartedAt = readSessionStartedAt();

  constructor() {
    this.restorePersistedLogs();

    if (typeof window !== 'undefined') {
      window.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        this.record('USER_ACTION', `Clicked: ${target.tagName} (${target.className || 'no-class'})`, {
          text: target.innerText?.slice(0, 50),
        });
      }, true);

      window.addEventListener('error', (event) => {
        this.record('ERROR', event.message, {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack,
        });
      });

      window.addEventListener('beforeunload', () => {
        this.flushPersistSync();
      });
    }
  }

  private restorePersistedLogs(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(SESSION_LOG_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        sessionId?: string;
        sessionStartedAt?: string;
        logs?: DebugLogEntry[];
      };
      if (!parsed?.logs?.length) return;
      if (parsed.sessionId && parsed.sessionId !== readSessionId()) return;
      this.logs = parsed.logs;
      this.sessionStartedAt = parsed.sessionStartedAt || readSessionStartedAt();
      this.estimatedBytes = this.logs.reduce((sum, e) => sum + estimateEntryBytes(e), 0);
    } catch {
      // Corrupt buffer — start fresh; do not break play.
    }
  }

  private schedulePersist(): void {
    if (typeof localStorage === 'undefined') return;
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => this.flushPersistSync(), 750);
  }

  private flushPersistSync(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      // Prefer priority events if the full buffer will not fit localStorage (~5MB).
      let toStore = this.logs;
      let size = this.estimatedBytes;
      if (size > PERSIST_BYTE_CAP) {
        toStore = this.logs.filter((e) => isPriority(e.type));
        size = toStore.reduce((sum, e) => sum + estimateEntryBytes(e), 0);
        while (size > PERSIST_BYTE_CAP && toStore.length > 50) {
          const dropped = toStore.pop();
          if (dropped) size -= estimateEntryBytes(dropped);
        }
      }
      localStorage.setItem(
        SESSION_LOG_KEY,
        JSON.stringify({
          sessionId: readSessionId(),
          sessionStartedAt: this.sessionStartedAt,
          logs: toStore,
          note:
            toStore.length < this.logs.length
              ? 'Persisted priority subset only (full buffer still in memory until tab close).'
              : undefined,
        })
      );
    } catch {
      // Quota exceeded — drop persist; in-memory session log remains.
      try {
        localStorage.removeItem(SESSION_LOG_KEY);
      } catch {
        /* ignore */
      }
    }
  }

  /**
   * Soft-trim: drop oldest non-priority (INFO/SYSTEM/…) when over SOFT_BYTE_CAP.
   * Never truncates ERROR/WARN/CRITICAL/TURN_START until ABSOLUTE_MAX_ENTRIES.
   */
  private softTrimIfNeeded(): void {
    while (this.estimatedBytes > SOFT_BYTE_CAP && this.logs.length > 0) {
      let dropIdx = -1;
      for (let i = this.logs.length - 1; i >= 0; i--) {
        if (!isPriority(this.logs[i].type)) {
          dropIdx = i;
          break;
        }
      }
      if (dropIdx < 0) break;
      const [removed] = this.logs.splice(dropIdx, 1);
      this.estimatedBytes -= estimateEntryBytes(removed);
    }
    while (this.logs.length > ABSOLUTE_MAX_ENTRIES) {
      const removed = this.logs.pop();
      if (removed) this.estimatedBytes -= estimateEntryBytes(removed);
    }
  }

  public record(type: string, message: string, data?: any) {
    if (import.meta.env.PROD) {
      const t = type.toUpperCase();
      if (!PROD_KEEP_TYPES.has(t)) {
        return;
      }
      if (data && typeof data === 'object') {
        const clone = { ...data };
        delete (clone as any).prompt;
        delete (clone as any).systemPrompt;
        delete (clone as any).apiKey;
        delete (clone as any).settings;
        data = clone;
      }
    }
    const entry: DebugLogEntry = {
      timestamp: new Date().toISOString(),
      type: type.toUpperCase(),
      message,
      data,
      telemetry: collectTelemetry(),
    };
    this.logs.unshift(entry);
    this.estimatedBytes += estimateEntryBytes(entry);
    this.softTrimIfNeeded();
    this.listeners.forEach((l) => l());
    this.schedulePersist();

    if (entry.type === 'ERROR' || entry.type === 'CRITICAL') {
      this.maybeAutoDownloadOnError();
    }
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  public getLogs(): DebugLogEntry[] {
    return this.logs;
  }

  /** Chronological (oldest → newest) for session-long reports. */
  public getLogsChronological(): DebugLogEntry[] {
    return [...this.logs].reverse();
  }

  public getDeviceId(): string {
    return getOrCreateDeviceId();
  }

  public getSessionId(): string {
    return readSessionId();
  }

  public getSessionStartedAt(): string {
    return this.sessionStartedAt;
  }

  public getTelemetry(): Record<string, unknown> {
    return collectTelemetry();
  }

  public getSessionStats(): DebugSessionStats {
    return {
      sessionId: readSessionId(),
      sessionStartedAt: this.sessionStartedAt,
      eventCount: this.logs.length,
      errorCount: this.logs.filter((l) => l.type === 'ERROR' || l.type === 'CRITICAL').length,
      warnCount: this.logs.filter((l) => l.type === 'WARN').length,
      estimatedBytes: this.estimatedBytes,
      softByteCap: SOFT_BYTE_CAP,
      softCapPolicy:
        'Unlimited for ERROR/WARN/CRITICAL/TURN_START/SESSION within session. Soft-trim oldest INFO/other only if buffer exceeds ~8MB. Absolute ceiling 50k entries.',
      autoDownloadOnError: this.isAutoDownloadOnError(),
    };
  }

  public isAutoDownloadOnError(): boolean {
    if (typeof localStorage === 'undefined') return false;
    const raw = localStorage.getItem(AUTO_DOWNLOAD_KEY);
    if (raw === '1') return true;
    if (raw === '0') return false;
    // Default on when Test Lab flag is present so founder playtests get a file without pasting.
    try {
      const lab = localStorage.getItem('synapticgm-test-lab');
      if (lab) {
        const parsed = JSON.parse(lab) as { enabled?: boolean };
        if (parsed?.enabled) return true;
      }
    } catch {
      /* ignore */
    }
    return false;
  }

  public setAutoDownloadOnError(on: boolean): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(AUTO_DOWNLOAD_KEY, on ? '1' : '0');
    this.listeners.forEach((l) => l());
  }

  /**
   * Rotate session id + clear buffer. Call on New Game / Continue so each play
   * stretch has a stable id John can give the agent ("pull session <id>").
   */
  public beginPlaySession(reason: string): string {
    const id = generateUUID();
    const started = new Date().toISOString();
    if (typeof localStorage !== 'undefined') {
      try {
        const prev = localStorage.getItem(SESSION_LOG_KEY);
        if (prev) localStorage.setItem(LAST_SESSION_LOG_KEY, prev);
      } catch {
        /* ignore quota */
      }
      localStorage.setItem(SESSION_ID_KEY, id);
      localStorage.setItem(SESSION_STARTED_KEY, started);
      try {
        localStorage.removeItem(SESSION_LOG_KEY);
      } catch {
        /* ignore */
      }
    }
    this.logs = [];
    this.estimatedBytes = 0;
    this.sessionStartedAt = started;
    this.listeners.forEach((l) => l());
    this.record('SESSION', `Play session started (${reason})`, { sessionId: id, reason });
    return id;
  }

  public clearSessionLogs(): void {
    this.logs = [];
    this.estimatedBytes = 0;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(SESSION_LOG_KEY);
      } catch {
        /* ignore */
      }
    }
    this.record('SESSION', 'User cleared debug session log buffer');
  }

  private redactSettings(currentSettings: any): Record<string, unknown> | null {
    if (!currentSettings) return null;
    return {
      ...currentSettings,
      openrouterApiKey: currentSettings.openrouterApiKey ? '[redacted]' : '',
      geminiApiKey: currentSettings.geminiApiKey ? '[redacted]' : '',
      fluxApiKey: currentSettings.fluxApiKey ? '[redacted]' : '',
      imageApiKey: currentSettings.imageApiKey ? '[redacted]' : '',
      videoApiKey: currentSettings.videoApiKey ? '[redacted]' : '',
    };
  }

  public buildLogPayload(currentState: any, currentSettings: any, logType: 'event' | 'error' = 'event'): string {
    const now = new Date();
    const telemetry = collectTelemetry();
    const stats = this.getSessionStats();
    const chronological = this.getLogsChronological();
    const errors = chronological.filter((l) => l.type === 'ERROR' || l.type === 'CRITICAL');
    const warns = chronological.filter((l) => l.type === 'WARN');

    const common = {
      exportTimestamp: now.toISOString(),
      ...telemetry,
      hostedBackend: hostedBackendDiagnostics(),
      sessionStats: stats,
      softCapPolicy: stats.softCapPolicy,
      agentPullHint:
        'Give Cursor the sessionId + deviceId, or drop synaptic-debug-latest.json into the workspace. Hosted: query telemetry_logs WHERE session_id = <sessionId> (signed-in / Ops).',
    };

    if (logType === 'error') {
      // Full session errors + warns — no mid-session slice truncation.
      const errorPackage = {
        logType: 'error-log',
        ...common,
        totalErrors: errors.length,
        totalWarns: warns.length,
        errors,
        warns,
        fullSessionEventLog: chronological,
      };
      return JSON.stringify(errorPackage, null, 2);
    }

    let previousSession: unknown = null;
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(LAST_SESSION_LOG_KEY);
        if (raw) previousSession = JSON.parse(raw);
      } catch {
        previousSession = null;
      }
    }

    const eventPackage = {
      logType: 'event-log',
      ...common,
      settings: this.redactSettings(currentSettings),
      character: currentState?.character || null,
      recentTurns: currentState?.log?.slice(-25) || [],
      recentRolls: currentState?.rolls?.slice(-20) || [],
      eventLog: chronological,
      totalEvents: chronological.length,
      previousSession,
    };
    return JSON.stringify(eventPackage, null, 2);
  }

  public async copyToClipboard(currentState: any, currentSettings: any, logType: 'event' | 'error' = 'event'): Promise<boolean> {
    const payload = this.buildLogPayload(currentState, currentSettings, logType);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(payload);
        return true;
      }
    } catch {
      // clipboard API may be blocked on insecure origins; fall through to fallback
    }
    return false;
  }

  public async copySessionId(): Promise<boolean> {
    const id = this.getSessionId();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(id);
        return true;
      }
    } catch {
      /* ignore */
    }
    return false;
  }

  private triggerDownload(payload: string, filename: string): void {
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Downloads the full session report. Always also writes synaptic-debug-latest.json
   * so John can drop one predictable filename for the agent.
   */
  public downloadUnifiedLog(currentState: any, currentSettings: any, logType: 'event' | 'error' = 'event') {
    const payload = this.buildLogPayload(currentState, currentSettings, logType);
    const shortId = this.getSessionId().slice(0, 8);
    const sessionName = `synaptic-debug-session-${shortId}.json`;
    this.triggerDownload(payload, sessionName);
    // Second download with stable name for agent drop-folder workflows.
    try {
      this.triggerDownload(payload, 'synaptic-debug-latest.json');
    } catch {
      /* ignore second download failures */
    }
  }

  private maybeAutoDownloadOnError(): void {
    if (!this.isAutoDownloadOnError()) return;
    if (typeof document === 'undefined') return;
    const now = Date.now();
    if (now - this.lastAutoDownloadAt < AUTO_DOWNLOAD_THROTTLE_MS) return;
    this.lastAutoDownloadAt = now;
    try {
      // Minimal error-focused package (still full session errors, not last-50).
      const payload = this.buildLogPayload(null, null, 'error');
      this.triggerDownload(payload, 'synaptic-debug-latest.json');
    } catch {
      /* never break play for debug download */
    }
  }
}

export const debugLogger = new DebugLogger();
