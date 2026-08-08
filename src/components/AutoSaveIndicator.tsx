import React from 'react';

export interface AutoSaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved';
}

export function AutoSaveIndicator({ status }: AutoSaveIndicatorProps) {
  if (status === 'idle') return null;

  return (
    <div 
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium tracking-wide shadow-lg transition-all duration-300 pointer-events-none ${
        status === 'saving' 
          ? 'bg-blue-500/80 text-white animate-pulse' 
          : 'bg-green-500/80 text-white'
      }`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        {status === 'saving' ? (
          // Spinner/Sync Icon
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        ) : (
          // Checkmark Icon
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        )}
      </svg>
      {status === 'saving' ? 'Saving...' : 'Saved'}
    </div>
  );
}