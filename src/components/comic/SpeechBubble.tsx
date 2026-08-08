import type { CSSProperties } from 'react';
import type { UiOverlayTheme } from '@/styles/styleSpecs';

export interface SpeechBubbleData {
  speaker: string;
  text: string;
  type: 'speech' | 'thought' | 'narration';
  tailDirection?: 'left' | 'right' | 'down-left' | 'down-right';
}

/**
 * Renders a dialogue/thought/narration overlay chip. When `theme` is provided (Style Spec
 * Configuration — see `styles/styleSpecs.ts`), the bubble's font, colors, border width/radius
 * dynamically match the active illustration style instead of one fixed classic-comic look.
 */
export function SpeechBubble({
  data,
  theme,
  className = '',
}: {
  data: SpeechBubbleData;
  theme?: UiOverlayTheme;
  /**
   * Layout classes are supplied by ComicPanelCell's absolutely positioned overlay group.
   * Bubbles themselves stay in normal flow inside that anchored cluster.
   */
  className?: string;
}) {
  const bubbleStyle: CSSProperties | undefined = theme
    ? {
        fontFamily: theme.bubbleFontFamily,
        backgroundColor: theme.bubbleBackground,
        color: theme.bubbleTextColor,
        borderColor: theme.bubbleBorderColor,
        borderWidth: theme.bubbleBorderWidth,
        borderRadius: theme.bubbleBorderRadius,
      }
    : undefined;
  if (data.type === 'narration') {
    const captionStyle: CSSProperties | undefined = theme
      ? { fontFamily: theme.captionFontFamily, backgroundColor: theme.captionBackground, color: theme.captionTextColor }
      : undefined;
    return (
      <div
        className={`comic-caption comic-overlay-scrollbar h-fit min-h-min w-fit max-h-[45vh] max-w-[90%] shrink-0 overflow-y-auto whitespace-pre-wrap break-words p-3 text-center ${className}`}
        style={captionStyle}
      >
        {data.text}
      </div>
    );
  }

  // Speaker name inherits the bubble's own themed text color (when set) instead of a fixed
  // gray, since a themed bubble background may not have enough contrast against slate-700/800.
  const speakerColorStyle: CSSProperties | undefined = theme ? { color: theme.bubbleTextColor } : undefined;

  if (data.type === 'thought') {
    return (
      <div
        className={`comic-thought-bubble comic-overlay-scrollbar h-fit min-h-min w-fit max-h-[45vh] max-w-[90%] shrink-0 overflow-y-auto whitespace-pre-wrap break-words p-3 text-center text-xs ${className}`}
        style={bubbleStyle}
      >
        {data.speaker && (
          <span className="font-semibold text-slate-700" style={speakerColorStyle}>
            {data.speaker}:{' '}
          </span>
        )}
        {data.text}
      </div>
    );
  }

  const isLeftTail = data.tailDirection === 'left';
  const tailClass = isLeftTail
    ? 'border-r-black border-b-transparent border-t-transparent left-2 -bottom-2'
    : 'border-l-black border-b-transparent border-t-transparent right-2 -bottom-2';
  // The tail is a colored triangle mimicking the bubble's own fill — keep it in sync with a
  // themed background instead of the hardcoded classic-comic black/white default.
  const tailStyle: CSSProperties | undefined = theme
    ? isLeftTail
      ? { borderRightColor: theme.bubbleBackground }
      : { borderLeftColor: theme.bubbleBackground }
    : undefined;

  return (
    <div
      className={`comic-speech-bubble h-fit min-h-min w-fit max-w-[90%] shrink-0 p-3 text-xs ${className}`}
      style={bubbleStyle}
    >
      <div className="comic-overlay-scrollbar max-h-[45vh] overflow-y-auto whitespace-pre-wrap break-words">
        {data.speaker && (
          <span className="font-bold text-slate-800" style={speakerColorStyle}>
            {data.speaker}:{' '}
          </span>
        )}
        {data.text}
      </div>
      <span className={`comic-speech-tail ${tailClass}`} style={tailStyle} />
    </div>
  );
}
