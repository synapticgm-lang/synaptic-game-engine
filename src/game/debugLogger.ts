// src/game/debugLogger.ts

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

function getOrCreateDeviceId(): string {
  if (typeof localStorage === 'undefined') return 'unknown-device';
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = generateUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

function getSessionId(): string {
  if (typeof localStorage === 'undefined') return 'session-unknown';
  let id = localStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = generateUUID();
    localStorage.setItem(SESSION_ID_KEY, id);
  }
  return id;
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
    sessionId: getSessionId(),
    platform,
    userAgent: nav?.userAgent ?? 'unknown',
    screenResolution: screen ? `${screen.width}x${screen.height}` : 'unknown',
    viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown',
    pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 'unknown',
    language: nav?.language ?? 'unknown',
    online: nav?.onLine ?? 'unknown',
  };
}

export interface DebugLogEntry {
  timestamp: string;
  type: string;
  message: string;
  data?: any;
  telemetry?: Record<string, unknown>;
}

class DebugLogger {
  private logs: DebugLogEntry[] = [];
  private maxLogs = 500;
  private listeners: Set<() => void> = new Set();

  constructor() {
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
    }
  }

  public record(type: string, message: string, data?: any) {
    const entry: DebugLogEntry = {
      timestamp: new Date().toISOString(),
      type: type.toUpperCase(),
      message,
      data,
      telemetry: collectTelemetry(),
    };
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
    this.listeners.forEach((l) => l());
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  public getLogs(): DebugLogEntry[] {
    return this.logs;
  }

  public getDeviceId(): string {
    return getOrCreateDeviceId();
  }

  public getTelemetry(): Record<string, unknown> {
    return collectTelemetry();
  }

  public buildLogPayload(currentState: any, currentSettings: any, logType: 'event' | 'error' = 'event'): string {
    const now = new Date();
    const telemetry = collectTelemetry();

    if (logType === 'error') {
      const errorPackage = {
        logType: 'error-log',
        exportTimestamp: now.toISOString(),
        ...telemetry,
        totalErrors: this.logs.filter(l => l.type === 'ERROR' || l.type === 'CRITICAL').length,
        errors: this.logs.filter(l => l.type === 'ERROR' || l.type === 'CRITICAL'),
        fullRecentBuffer: this.logs.slice(0, 50),
      };
      return JSON.stringify(errorPackage, null, 2);
    }

    const eventPackage = {
      logType: 'event-log',
      exportTimestamp: now.toISOString(),
      ...telemetry,
      settings: currentSettings,
      character: currentState?.character || null,
      recentTurns: currentState?.log?.slice(-25) || [],
      recentRolls: currentState?.rolls?.slice(-20) || [],
      eventLog: this.logs,
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
    } catch (e) {
      // clipboard API may be blocked on insecure origins; fall through to fallback
    }
    return false;
  }

  public downloadUnifiedLog(currentState: any, currentSettings: any, logType: 'event' | 'error' = 'event') {
    const payload = this.buildLogPayload(currentState, currentSettings, logType);
    const now = new Date();
    const dateTag = now.toISOString().slice(0, 10);
    const timeTag = now.toTimeString().slice(0, 8).replace(/:/g, '-');
    const timestampTag = `${dateTag} at ${timeTag}`;
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${logType} log - ${timestampTag}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const debugLogger = new DebugLogger();
