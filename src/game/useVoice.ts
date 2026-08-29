import { useCallback, useEffect, useRef, useState } from 'react';
import { shopItemById, type ShopItem } from './cosmeticCatalog';

type SpeechRecognitionType = typeof window & {
  SpeechRecognition?: new () => SpeechRecognitionInstance;
  webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
};

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
  resultIndex: number;
}

export type SpeakOpts = {
  entryId?: string;
  /** True when called from a tap (play / Settings toggle / Send). */
  fromUserGesture?: boolean;
};

export interface VoiceState {
  speaking: boolean;
  speakingEntryId: string | null;
  listening: boolean;
  transcript: string;
  voices: SpeechSynthesisVoice[];
  ttsSupported: boolean;
  sttSupported: boolean;
  ttsEnabled: boolean;
  speak: (text: string, opts?: SpeakOpts) => void;
  speakSequence: (texts: string[], opts?: SpeakOpts) => void;
  stopSpeaking: () => void;
  primeTts: () => void;
  startListening: () => void;
  stopListening: () => void;
}

export type SpeechVoicePick = {
  voiceURI: string;
  name: string;
  lang: string;
};

function normLang(lang: string): string {
  return lang.toLowerCase().replace(/_/g, '-');
}

/** Prefer a saved voiceURI; if missing, en-US then en-GB then any English then first voice. */
export function pickSpeechVoice(
  voices: SpeechVoicePick[],
  savedURI?: string | null,
): SpeechVoicePick | null {
  if (!voices.length) return null;
  const saved = savedURI?.trim();
  if (saved) {
    const exact = voices.find((v) => v.voiceURI === saved);
    if (exact) return exact;
    const byName = voices.find((v) => v.name === saved);
    if (byName) return byName;
  }
  const enUs = voices.find((v) => normLang(v.lang).startsWith('en-us'));
  if (enUs) return enUs;
  const enGb = voices.find((v) => normLang(v.lang).startsWith('en-gb'));
  if (enGb) return enGb;
  const en = voices.find((v) => normLang(v.lang).startsWith('en'));
  if (en) return en;
  return voices[0];
}

export function sortSpeechVoices(voices: SpeechVoicePick[]): SpeechVoicePick[] {
  return [...voices].sort((a, b) => {
    const ae = normLang(a.lang).startsWith('en') ? 0 : 1;
    const be = normLang(b.lang).startsWith('en') ? 0 : 1;
    if (ae !== be) return ae - be;
    return a.name.localeCompare(b.name) || a.lang.localeCompare(b.lang);
  });
}

function resolveTts(voices: SpeechSynthesisVoice[], voicePackId?: string, ttsVoiceURI?: string) {
  const pack = voicePackId ? shopItemById(voicePackId) : undefined;
  const tts = pack?.tts ?? { rate: 0.95, pitch: 0.9, voiceHint: 'en' };
  const picked = pickSpeechVoice(voices, ttsVoiceURI);
  const match = picked
    ? voices.find((v) => v.voiceURI === picked.voiceURI) ?? voices.find((v) => v.name === picked.name)
    : undefined;
  return { voice: match, rate: tts.rate, pitch: tts.pitch };
}

/**
 * Story prose only — STATUS chrome, system tags, and markup are stripped so TTS
 * does not read HUD / ledger lines. Emphasis markers keep their inner words
 * (the old `*...*` wipe deleted whispered lines).
 */
export function proseForSpeech(text: string): string {
  let s = String(text ?? '');
  s = s.replace(/<system\b[^>]*>[\s\S]*?<\/system>/gi, ' ');
  s = s.replace(/<image-prompt\b[^>]*>[\s\S]*?<\/image-prompt>/gi, ' ');
  s = s.replace(/<\/?(dialogue|thought|panel|effect|item-gain|item-loss|quest-[a-z-]+)[^>]*>/gi, ' ');
  s = s.replace(/<[^>]+>/g, ' ');
  s = s.replace(/^\s*(?:#{1,3}\s*)?STATUS\b.*$/gim, ' ');
  s = s.replace(/^\s*XP Gained:.*$/gim, ' ');
  s = s.replace(/\[\s*(SYSTEM|THE AUDITOR|THE TALE|THE STORY|STATUS|UNCOMMON)\s*\]/gi, ' ');
  s = s.replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1');
  s = s.replace(/_{1,2}([^_]+)_{1,2}/g, '$1');
  s = s.replace(/[`#]/g, '');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function hasSpeechSynthesis(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Kick the browser TTS engine during a user gesture so later async GM speaks
 * are allowed on Android Chrome. Must stay synchronous (no setTimeout).
 */
export function primeTts(): boolean {
  if (!hasSpeechSynthesis()) return false;
  try {
    window.speechSynthesis.resume();
    const u = new SpeechSynthesisUtterance('\u00A0');
    u.volume = 0;
    u.rate = 10;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
    return true;
  } catch {
    return false;
  }
}

export function stopAllSpeech(): void {
  if (!hasSpeechSynthesis()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}

/** Settings confirm — same-tick speak so the toggle gesture unlocks TTS. */
export function speakTtsNow(text: string, voiceURI?: string): void {
  if (!hasSpeechSynthesis()) return;
  const clean = proseForSpeech(text);
  if (!clean) return;
  try {
    window.speechSynthesis.resume();
  } catch {
    /* ignore */
  }
  const u = new SpeechSynthesisUtterance(clean);
  u.rate = 1;
  u.pitch = 1;
  const list = window.speechSynthesis.getVoices();
  const picked = pickSpeechVoice(list, voiceURI);
  const match = picked
    ? list.find((v) => v.voiceURI === picked.voiceURI)
    : undefined;
  if (match) u.voice = match;
  try {
    window.speechSynthesis.speak(u);
    window.speechSynthesis.resume();
  } catch {
    /* ignore */
  }
}

function speakNow(u: SpeechSynthesisUtterance): void {
  const synth = window.speechSynthesis;
  try {
    synth.resume();
  } catch {
    /* ignore */
  }
  synth.speak(u);
  try {
    synth.resume();
  } catch {
    /* ignore */
  }
}

export function useVoice(ttsEnabled: boolean, voicePackId?: string, ttsVoiceURI?: string) {
  const [speaking, setSpeaking] = useState(false);
  const [speakingEntryId, setSpeakingEntryId] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const ttsEnabledRef = useRef(ttsEnabled);
  ttsEnabledRef.current = ttsEnabled;
  const ttsVoiceURIRef = useRef(ttsVoiceURI);
  ttsVoiceURIRef.current = ttsVoiceURI;
  const speakTimerRef = useRef<number | null>(null);
  /** Set while a `speakSequence` chain is in flight; calling it (from `stopSpeaking` or a new
   *  `speak`/`speakSequence` call) stops the chain from queuing its next utterance. */
  const stopActiveSequenceRef = useRef<(() => void) | null>(null);

  const ttsSupported = hasSpeechSynthesis();
  const sttSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!ttsSupported) return;
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length) setVoices(v);
    };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [ttsSupported]);

  // Chrome / Android Chrome pause synthesis after ~15s without a resume tick.
  useEffect(() => {
    if (!ttsSupported || !speaking) return;
    const id = window.setInterval(() => {
      try {
        if (window.speechSynthesis.paused) window.speechSynthesis.resume();
      } catch {
        /* ignore */
      }
    }, 4000);
    return () => window.clearInterval(id);
  }, [ttsSupported, speaking]);

  useEffect(() => {
    if (!ttsEnabled && ttsSupported) {
      stopActiveSequenceRef.current?.();
      stopActiveSequenceRef.current = null;
      if (speakTimerRef.current != null) {
        window.clearTimeout(speakTimerRef.current);
        speakTimerRef.current = null;
      }
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setSpeakingEntryId(null);
    }
  }, [ttsEnabled, ttsSupported]);

  const preferredVoice = useCallback(
    () => resolveTts(voices, voicePackId, ttsVoiceURIRef.current),
    [voices, voicePackId, ttsVoiceURI],
  );

  const clearSpeakTimer = () => {
    if (speakTimerRef.current != null) {
      window.clearTimeout(speakTimerRef.current);
      speakTimerRef.current = null;
    }
  };

  const launchUtterance = (u: SpeechSynthesisUtterance, fromUserGesture: boolean) => {
    const synth = window.speechSynthesis;
    if (synth.speaking || synth.pending) {
      synth.cancel();
      if (fromUserGesture) {
        requestAnimationFrame(() => speakNow(u));
        return;
      }
      speakTimerRef.current = window.setTimeout(() => {
        speakTimerRef.current = null;
        speakNow(u);
      }, 80);
      return;
    }
    speakNow(u);
  };

  const bindUtterance = (u: SpeechSynthesisUtterance, entryId?: string, onEnded?: () => void) => {
    u.onstart = () => {
      setSpeaking(true);
      setSpeakingEntryId(entryId ?? null);
    };
    u.onend = () => {
      if (onEnded) {
        onEnded();
        return;
      }
      setSpeaking(false);
      setSpeakingEntryId(null);
    };
    u.onerror = (ev) => {
      const err = (ev as SpeechSynthesisErrorEvent).error;
      if (err === 'canceled' || err === 'interrupted') return;
      setSpeaking(false);
      setSpeakingEntryId(null);
    };
  };

  const speak = useCallback((text: string, opts?: SpeakOpts) => {
    if (!ttsSupported || !ttsEnabledRef.current) return;
    stopActiveSequenceRef.current?.();
    stopActiveSequenceRef.current = null;
    clearSpeakTimer();
    const clean = proseForSpeech(text);
    if (!clean) return;
    const u = new SpeechSynthesisUtterance(clean);
    const preferred = preferredVoice();
    u.rate = preferred.rate;
    u.pitch = preferred.pitch;
    if (preferred.voice) u.voice = preferred.voice;
    bindUtterance(u, opts?.entryId);
    launchUtterance(u, opts?.fromUserGesture === true);
  }, [ttsSupported, preferredVoice]);

  /**
   * Reads a list of text fragments back-to-back as one continuous speech session — one
   * utterance per fragment, chained via `onend` so they play strictly in order with a natural
   * pause between them. Built for Comic Mode: each panel's `caption`/`dialogue` lines are
   * discrete JSON/segment fields (see `comicScriptAdapter.ts` / `parseNarrativeSegments`)
   * rather than one flat paragraph, so reading them as a single utterance would run captions
   * and different speakers' lines together with no distinction.
   */
  const speakSequence = useCallback((texts: string[], opts?: SpeakOpts) => {
    if (!ttsSupported || !ttsEnabledRef.current) return;
    stopActiveSequenceRef.current?.();
    clearSpeakTimer();
    window.speechSynthesis.cancel();

    const queue = texts.map(proseForSpeech).filter(Boolean);
    if (queue.length === 0) return;

    const preferred = preferredVoice();
    let cancelled = false;
    let index = 0;
    const fromGesture = opts?.fromUserGesture === true;
    const entryId = opts?.entryId;

    const speakNext = (nextFromGesture = false) => {
      if (cancelled) return;
      if (index >= queue.length) {
        setSpeaking(false);
        setSpeakingEntryId(null);
        stopActiveSequenceRef.current = null;
        return;
      }
      const u = new SpeechSynthesisUtterance(queue[index]);
      index += 1;
      u.rate = preferred.rate;
      u.pitch = preferred.pitch;
      if (preferred.voice) u.voice = preferred.voice;
      bindUtterance(u, entryId, () => speakNext(false));
      launchUtterance(u, nextFromGesture);
    };

    stopActiveSequenceRef.current = () => { cancelled = true; };
    speakNext(fromGesture);
  }, [ttsSupported, preferredVoice]);

  const stopSpeaking = useCallback(() => {
    if (!ttsSupported) return;
    stopActiveSequenceRef.current?.();
    stopActiveSequenceRef.current = null;
    clearSpeakTimer();
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setSpeakingEntryId(null);
  }, [ttsSupported]);

  const prime = useCallback(() => {
    if (!ttsSupported || !ttsEnabledRef.current) return;
    primeTts();
  }, [ttsSupported]);

  const startListening = useCallback(() => {
    if (!sttSupported) return;
    const SR = (window as unknown as SpeechRecognitionType).SpeechRecognition
      ?? (window as unknown as SpeechRecognitionType).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'en-US';
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      let text = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      setTranscript(text);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    setTranscript('');
    setListening(true);
    rec.start();
  }, [sttSupported]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return {
    speaking,
    speakingEntryId,
    listening,
    transcript,
    voices,
    ttsSupported,
    sttSupported,
    ttsEnabled,
    speak,
    speakSequence,
    stopSpeaking,
    primeTts: prime,
    startListening,
    stopListening,
  };
}

/** Shop / locker sample — uses the existing browser TTS stack, ignores the in-play mute. */
export function previewVoiceLine(item: ShopItem): void {
  if (!hasSpeechSynthesis()) return;
  window.speechSynthesis.cancel();
  const line = (item.flavour ?? item.blurb).trim();
  if (!line) return;
  const u = new SpeechSynthesisUtterance(line);
  if (item.tts) {
    u.rate = item.tts.rate;
    u.pitch = item.tts.pitch;
    const hint = item.tts.voiceHint.toLowerCase();
    const match = window.speechSynthesis.getVoices().find(
      (v) => v.lang.toLowerCase().startsWith('en') && v.name.toLowerCase().includes(hint),
    );
    if (match) u.voice = match;
  }
  window.speechSynthesis.speak(u);
}
