import type { ComicTextAnchor } from '@/types/comicScript';
import { COMIC_TEXT_ANCHORS, normalizeTextAnchor } from '@/types/comicScript';

export interface AcceptedUtterance {
  utteranceId: string;
  speakerId: string;
  speakerLabel: string;
  text: string;
}

/**
 * Bind overlay lettering to accepted utterance/speaker IDs.
 * Image metadata cannot change speaker — fail closed on mismatch.
 */
export function bindOverlayUtterance(opts: {
  utteranceId?: string | null;
  claimedSpeakerId?: string | null;
  accepted?: AcceptedUtterance | null;
}): { ok: true; speakerLabel: string; text: string; utteranceId: string; speakerId: string }
  | { ok: false; reason: 'missing_accepted' | 'speaker_mismatch' } {
  if (!opts.accepted) {
    // No accepted record — allow display from payload only when no claim was made
    if (opts.utteranceId || opts.claimedSpeakerId) {
      return { ok: false, reason: 'missing_accepted' };
    }
    return { ok: false, reason: 'missing_accepted' };
  }
  if (
    opts.claimedSpeakerId
    && opts.claimedSpeakerId.trim().toLowerCase() !== opts.accepted.speakerId.trim().toLowerCase()
  ) {
    return { ok: false, reason: 'speaker_mismatch' };
  }
  if (
    opts.utteranceId
    && opts.utteranceId.trim() !== opts.accepted.utteranceId.trim()
  ) {
    return { ok: false, reason: 'speaker_mismatch' };
  }
  return {
    ok: true,
    speakerLabel: opts.accepted.speakerLabel,
    text: opts.accepted.text,
    utteranceId: opts.accepted.utteranceId,
    speakerId: opts.accepted.speakerId,
  };
}

const ANCHOR_FALLBACK_ORDER: ComicTextAnchor[] = [
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
  'bottom-center',
];

/** Card-approved fallback among the five anchors only. */
export function fallbackOverlayAnchor(
  preferred: unknown,
  fallbackIndex = 0
): ComicTextAnchor {
  const normalized = normalizeTextAnchor(preferred, 'bottom-center');
  if ((COMIC_TEXT_ANCHORS as readonly string[]).includes(
    typeof preferred === 'string' ? preferred.trim().toLowerCase().replace(/_/g, '-') : ''
  )) {
    return normalized;
  }
  // Invalid planner anchor → card-approved fallback chain
  return ANCHOR_FALLBACK_ORDER[fallbackIndex % ANCHOR_FALLBACK_ORDER.length] ?? 'bottom-center';
}

export function isFiveAnchorVocabulary(raw: unknown): boolean {
  if (typeof raw !== 'string') return false;
  const key = raw.trim().toLowerCase().replace(/_/g, '-');
  return (COMIC_TEXT_ANCHORS as readonly string[]).includes(key)
    || key === 'center-bottom'
    || key === 'bottom-middle'
    || key === 'middle-bottom';
}
