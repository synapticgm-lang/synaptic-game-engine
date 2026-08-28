import type { CSSProperties } from 'react';
import type { UiOverlayTheme } from '@/styles/styleSpecs';
import { bindOverlayUtterance, type AcceptedUtterance } from '@/game/comicOverlayBind';

export interface SpeechBubbleData {
  speaker: string;
  text: string;
  type: 'speech' | 'thought' | 'narration';
  tailDirection?: 'left' | 'right' | 'down-left' | 'down-right';
  /** Optional accepted-utterance binding (G04 / R02). */
  utteranceId?: string;
  speakerId?: string;
  accepted?: AcceptedUtterance | null;
}

const SCRIM_STYLE: CSSProperties = {
  backgroundColor: 'rgba(15, 23, 42, 0.82)',
  boxShadow: '0 0 0 1px rgba(15, 23, 42, 0.9), 0 8px 24px rgba(0,0,0,0.45)',
};

/**
 * Renders a dialogue/thought/narration overlay chip. When `theme` is provided (Style Spec
 * Configuration — see `styles/styleSpecs.ts`), the bubble's font, colors, border width/radius
 * dynamically match the active illustration style instead of one fixed classic-comic look.
 *
 * Contrast scrim is always applied so lettering stays readable on busy art (G05).
 * When utterance binding is provided, speaker mismatches fail closed (R02).
 */
export function SpeechBubble({
  data,
  theme,
  className = '',
}: {
  data: SpeechBubbleData;
  theme?: UiOverlayTheme;
  className?: string;
}) {
  let speaker = data.speaker;
  let text = data.text;

  if (data.utteranceId || data.speakerId || data.accepted) {
    const bound = bindOverlayUtterance({
      utteranceId: data.utteranceId,
      claimedSpeakerId: data.speakerId,
      accepted: data.accepted,
    });
    if (!bound.ok) {
      return null;
    }
    speaker = bound.speakerLabel;
    text = bound.text;
  }

  const bubbleStyle: CSSProperties | undefined = theme
    ? {
        fontFamily: theme.bubbleFontFamily,
        color: theme.bubbleTextColor,
        borderColor: theme.bubbleBorderColor,
        borderWidth: theme.bubbleBorderWidth,
        borderRadius: theme.bubbleBorderRadius,
        ...SCRIM_STYLE,
        backgroundColor: theme.bubbleBackground || SCRIM_STYLE.backgroundColor,
      }
    : { ...SCRIM_STYLE };

  if (data.type === 'narration') {
    const captionStyle: CSSProperties | undefined = theme
      ? {
          fontFamily: theme.captionFontFamily,
          backgroundColor: theme.captionBackground || SCRIM_STYLE.backgroundColor,
          color: theme.captionTextColor,
          ...SCRIM_STYLE,
        }
      : { ...SCRIM_STYLE };
    return (
      <div
        className={`comic-caption comic-overlay-scrollbar comic-contrast-scrim h-fit min-h-min w-fit max-h-[45vh] max-w-[90%] shrink-0 overflow-y-auto whitespace-pre-wrap break-words p-3 text-center ${className}`}
        style={captionStyle}
        data-utterance-id={data.utteranceId || undefined}
        data-speaker-id={data.speakerId || undefined}
      >
        {text}
      </div>
    );
  }

  const speakerColorStyle: CSSProperties | undefined = theme ? { color: theme.bubbleTextColor } : undefined;

  if (data.type === 'thought') {
    return (
      <div
        className={`comic-thought-bubble comic-overlay-scrollbar comic-contrast-scrim h-fit min-h-min w-fit max-h-[45vh] max-w-[90%] shrink-0 overflow-y-auto whitespace-pre-wrap break-words p-3 text-center text-xs ${className}`}
        style={bubbleStyle}
        data-utterance-id={data.utteranceId || undefined}
        data-speaker-id={data.speakerId || undefined}
      >
        {speaker && (
          <span className="font-semibold text-slate-700" style={speakerColorStyle}>
            {speaker}:{' '}
          </span>
        )}
        {text}
      </div>
    );
  }

  const isLeftTail = data.tailDirection === 'left';
  const tailClass = isLeftTail
    ? 'border-r-black border-b-transparent border-t-transparent left-2 -bottom-2'
    : 'border-l-black border-b-transparent border-t-transparent right-2 -bottom-2';
  const fill = theme?.bubbleBackground || 'rgba(15, 23, 42, 0.82)';
  const tailStyle: CSSProperties | undefined = isLeftTail
    ? { borderRightColor: fill }
    : { borderLeftColor: fill };

  return (
    <div
      className={`comic-speech-bubble comic-contrast-scrim h-fit min-h-min w-fit max-w-[90%] shrink-0 p-3 text-xs ${className}`}
      style={bubbleStyle}
      data-utterance-id={data.utteranceId || undefined}
      data-speaker-id={data.speakerId || undefined}
    >
      <div className="comic-overlay-scrollbar max-h-[45vh] overflow-y-auto whitespace-pre-wrap break-words">
        {speaker && (
          <span className="font-bold text-slate-800" style={speakerColorStyle}>
            {speaker}:{' '}
          </span>
        )}
        {text}
      </div>
      <span className={`comic-speech-tail ${tailClass}`} style={tailStyle} />
    </div>
  );
}
