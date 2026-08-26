import { Component, lazy, type ComponentType, type ReactNode } from 'react';

const CHUNK_LOAD_RE =
  /Failed to fetch dynamically imported module|Loading chunk [\w-]+ failed|Importing a module script failed|error loading dynamically imported module/i;

const RELOAD_KEY = 'sgm-lazy-chunk-reload';

export function isChunkLoadError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? '');
  return CHUNK_LOAD_RE.test(msg);
}

/**
 * Vite lazy() that survives a post-deploy chunk hash miss: reload once, then rethrow.
 * Prevents "Failed to fetch dynamically imported module" from hard-crashing play.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function safeLazy<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      const mod = await factory();
      try {
        sessionStorage.removeItem(RELOAD_KEY);
      } catch {
        /* ignore */
      }
      return mod;
    } catch (err) {
      if (isChunkLoadError(err)) {
        try {
          if (!sessionStorage.getItem(RELOAD_KEY)) {
            sessionStorage.setItem(RELOAD_KEY, '1');
            window.location.reload();
            return await new Promise<{ default: T }>(() => {});
          }
          sessionStorage.removeItem(RELOAD_KEY);
        } catch {
          /* ignore */
        }
      }
      throw err;
    }
  });
}

interface LazyChunkBoundaryProps {
  children: ReactNode;
  onFail?: (error: Error) => void;
}

interface LazyChunkBoundaryState {
  error: Error | null;
}

/** Isolates a lazy modal so a chunk miss closes the modal instead of fracturing the realm. */
export class LazyChunkBoundary extends Component<LazyChunkBoundaryProps, LazyChunkBoundaryState> {
  state: LazyChunkBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): LazyChunkBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error) {
    this.props.onFail?.(error);
  }

  componentDidUpdate(prevProps: LazyChunkBoundaryProps) {
    if (this.state.error && prevProps.children !== this.props.children) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) return null;
    return this.props.children;
  }
}
