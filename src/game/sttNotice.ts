/**
 * Order STT-N: speech-to-text privacy notice.
 * Browser speech recognition (Web Speech API) may send audio to the browser vendor's servers
 * (Chrome: Google; Edge: Microsoft). Source: MDN "SpeechRecognition" (processing is server-based
 * in some browsers) and the Web Speech API spec. Recognition only starts after the player accepts.
 */
export const STT_NOTICE_KEY = 'sttNoticeAccepted';

export const STT_NOTICE_TITLE = 'Voice input uses your browser.';
export const STT_NOTICE_BODY =
  "In Chrome and Edge, what you say is sent to Google's or Microsoft's servers to turn it into text. We don't receive or keep the audio. If you'd rather not, just type instead.";

type KeyStore = Pick<Storage, 'getItem' | 'setItem'>;

function defaultStore(): KeyStore | null {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

/** True once the player chose "Use voice" on this device. */
export function sttNoticeAccepted(store: KeyStore | null = defaultStore()): boolean {
  try {
    return store?.getItem(STT_NOTICE_KEY) === '1';
  } catch {
    return false;
  }
}

/** Record the player's "Use voice" choice for this device. */
export function acceptSttNotice(store: KeyStore | null = defaultStore()): void {
  try {
    store?.setItem(STT_NOTICE_KEY, '1');
  } catch {
    /* storage blocked: the notice shows again next time */
  }
}
