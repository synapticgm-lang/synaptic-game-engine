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

export interface VoiceState {
  speaking: boolean;
  listening: boolean;
  transcript: string;
  voices: SpeechSynthesisVoice[];
  ttsSupported: boolean;
  sttSupported: boolean;
}

function resolveTts(voices: SpeechSynthesisVoice[], voicePackId?: string) {
  const pack = voicePackId ? shopItemById(voicePackId) : undefined;
  const tts = pack?.tts ?? { rate: 0.95, pitch: 0.9, voiceHint: 'en' };
  const hint = tts.voiceHint.toLowerCase();
  const english = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  const hinted =
    english.find((v) => v.name.toLowerCase().includes(hint))
    ?? english.find((v) => v.name.toLowerCase().includes('google'))
    ?? english[0]
    ?? voices[0];
  return { voice: hinted, rate: tts.rate, pitch: tts.pitch };
}

export function useVoice(ttsEnabled: boolean, voicePackId?: string) {
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const ttsEnabledRef = useRef(ttsEnabled);
  ttsEnabledRef.current = ttsEnabled;
  /** Set while a `speakSequence` chain is in flight; calling it (from `stopSpeaking` or a new
   *  `speak`/`speakSequence` call) stops the chain from queuing its next utterance. */
  const stopActiveSequenceRef = useRef<(() => void) | null>(null);

  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const sttSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!ttsSupported) return;
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length) setVoices(v);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [ttsSupported]);

  const preferredVoice = useCallback(
    () => resolveTts(voices, voicePackId),
    [voices, voicePackId],
  );

  const cleanForSpeech = (text: string) => text.replace(/\[[^\]]*\]/g, '').replace(/\*[^*]*\*/g, '').trim();

  const speak = useCallback((text: string) => {
    if (!ttsSupported || !ttsEnabledRef.current) return;
    stopActiveSequenceRef.current?.();
    stopActiveSequenceRef.current = null;
    window.speechSynthesis.cancel();
    const clean = cleanForSpeech(text);
    if (!clean) return;
    const u = new SpeechSynthesisUtterance(clean);
    const preferred = preferredVoice();
    u.rate = preferred.rate;
    u.pitch = preferred.pitch;
    if (preferred.voice) u.voice = preferred.voice;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  }, [ttsSupported, preferredVoice]);

  /**
   * Reads a list of text fragments back-to-back as one continuous speech session — one
   * utterance per fragment, chained via `onend` so they play strictly in order with a natural
   * pause between them. Built for Comic Mode: each panel's `caption`/`dialogue` lines are
   * discrete JSON/segment fields (see `comicScriptAdapter.ts` / `parseNarrativeSegments`)
   * rather than one flat paragraph, so reading them as a single utterance would run captions
   * and different speakers' lines together with no distinction.
   */
  const speakSequence = useCallback((texts: string[]) => {
    if (!ttsSupported || !ttsEnabledRef.current) return;
    stopActiveSequenceRef.current?.();
    window.speechSynthesis.cancel();

    const queue = texts.map(cleanForSpeech).filter(Boolean);
    if (queue.length === 0) return;

    const preferred = preferredVoice();
    let cancelled = false;
    let index = 0;

    const speakNext = () => {
      if (cancelled) return;
      if (index >= queue.length) {
        setSpeaking(false);
        stopActiveSequenceRef.current = null;
        return;
      }
      const u = new SpeechSynthesisUtterance(queue[index]);
      index += 1;
      u.rate = preferred.rate;
      u.pitch = preferred.pitch;
      if (preferred.voice) u.voice = preferred.voice;
      u.onstart = () => setSpeaking(true);
      u.onend = () => speakNext();
      u.onerror = () => { cancelled = true; setSpeaking(false); };
      window.speechSynthesis.speak(u);
    };

    stopActiveSequenceRef.current = () => { cancelled = true; };
    speakNext();
  }, [ttsSupported, preferredVoice]);

  const stopSpeaking = useCallback(() => {
    if (!ttsSupported) return;
    stopActiveSequenceRef.current?.();
    stopActiveSequenceRef.current = null;
    window.speechSynthesis.cancel();
    setSpeaking(false);
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
    speaking, listening, transcript, voices,
    ttsSupported, sttSupported,
    speak, speakSequence, stopSpeaking, startListening, stopListening,
  };
}

/** Shop / locker sample — uses the existing browser TTS stack, ignores the in-play mute. */
export function previewVoiceLine(item: ShopItem): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
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
