import { Pause, Play } from 'lucide-react';
import { proseForSpeech } from '@/game/useVoice';

interface Props {
  visible: boolean;
  entryId: string;
  text: string;
  speaking: boolean;
  speakingEntryId: string | null;
  onPlay: (entryId: string, text: string) => void;
  onStop: () => void;
}

/**
 * Play / pause at the bottom of a story bubble. Only mounted when TTS is on.
 * 40px tap target for mobile; theme accent via CSS vars so Phoenix Ashrise still reads.
 */
export function BubbleSpeakControl({
  visible,
  entryId,
  text,
  speaking,
  speakingEntryId,
  onPlay,
  onStop,
}: Props) {
  if (!visible) return null;
  if (!proseForSpeech(text)) return null;
  const active = speaking && speakingEntryId === entryId;

  return (
    <div className="mt-2 flex justify-end">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (active) onStop();
          else onPlay(entryId, text);
        }}
        aria-label={active ? 'Pause narration' : 'Play narration'}
        title={active ? 'Pause' : 'Play aloud'}
        className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-md border bg-black/20 text-slate-300 transition-colors hover:bg-black/35 hover:text-white"
        style={{
          borderColor: 'color-mix(in srgb, var(--sgm-accent, #64748b) 42%, transparent)',
          color: 'var(--sgm-text, #cbd5e1)',
        }}
      >
        {active ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}
      </button>
    </div>
  );
}
