import { Component, type ReactNode } from 'react';
import { logger } from '@/game/logger';
import { isChunkLoadError } from '@/utils/safeLazy';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
  chunkMiss: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '', chunkMiss: false };

  static getDerivedStateFromError(error: unknown): State {
    logger.error('error-boundary', `Uncaught React error: ${error instanceof Error ? error.message : 'unknown'}`, error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error);
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Something went wrong.',
      chunkMiss: isChunkLoadError(error),
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-center text-slate-300">
          <h1 className="font-serif text-2xl text-slate-100">The realm has fractured</h1>
          <p className="max-w-md text-sm text-slate-500">
            {this.state.chunkMiss
              ? 'The app updated while this tab was open. Reload to load the new build — your save is safe.'
              : 'An unexpected error occurred while loading the app. Reloading the page will usually fix it.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 rounded-lg bg-crimson-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-crimson-500"
          >
            Reload
          </button>
          <button
            onClick={() => logger.downloadLog()}
            className="rounded-lg border border-slate-700 bg-slate-800/60 px-5 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
          >
            Download Error Log
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
