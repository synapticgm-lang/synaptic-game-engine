import { useState, useEffect, useRef } from 'react';
import type { GameState, Settings, ArtStylePreset } from './types';
import { ART_STYLE_PRESETS } from './types';
import { bgGet, bgPut, generateBgWithOpenRouter } from './bgCache';
import { SETTINGS_EVENT_NAME } from './useGame';

export type Orientation = 'portrait' | 'landscape';

function detectOrientation(): Orientation {
  if (typeof window === 'undefined') return 'landscape';
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
}

function getArtStyleKeywords(preset: ArtStylePreset): string {
  const entry = ART_STYLE_PRESETS.find((p) => p.value === preset);
  return entry?.keywords ?? ART_STYLE_PRESETS[0].keywords;
}

function buildAdaptivePrompt(state: GameState, settings: Settings, orientation: Orientation): string {
  const location = state.currentLocation || state.log.slice(-3).filter(e => e.role === 'gm').map(e => e.content.slice(0, 80)).join(' ') || 'fantasy landscape';
  const artKeywords = getArtStyleKeywords(settings.artStylePreset);
  const aspectHint = orientation === 'portrait' ? 'vertical portrait composition, 9:16 aspect ratio' : 'wide landscape composition, 16:9 aspect ratio';
  return `${artKeywords} landscape of ${location}, atmospheric detailed backdrop, low contrast environment, no text, no UI, no characters. ${aspectHint}.`;
}

function buildSceneKey(state: GameState, orientation: Orientation): string {
  const location = state.currentLocation || 'default';
  const style = state.turnFrameTheme?.frameStyle ?? 'minimal-holo';
  // Namespace by saveId so adaptive backgrounds never leak across campaigns/players.
  return `adaptive_${state.saveId}_${location}_${style}_${orientation}`;
}

export interface BgImageState {
  url: string | null;
  prevUrl: string | null;
  loading: boolean;
  sceneKey: string | null;
  orientation: Orientation;
  opacity: number;
}

export function useBgImage(state: GameState | null, settings: Settings): BgImageState {
  const [currentSettings, setCurrentSettings] = useState<Settings>(settings);
  const [url, setUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sceneKey, setSceneKey] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<Orientation>(detectOrientation());
  const lastKeyRef = useRef<string | null>(null);
  const lastLocationRef = useRef<string | null>(null);

  // Synchronize prop updates
  useEffect(() => {
    setCurrentSettings(settings);
  }, [settings]);

  // Global Event Listener for immediate background settings reactivity
  useEffect(() => {
    const handleSettingsUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<Settings>;
      if (customEvent.detail) {
        setCurrentSettings(customEvent.detail);
      }
    };

    window.addEventListener(SETTINGS_EVENT_NAME, handleSettingsUpdate);
    window.addEventListener('storage', handleSettingsUpdate);

    return () => {
      window.removeEventListener(SETTINGS_EVENT_NAME, handleSettingsUpdate);
      window.removeEventListener('storage', handleSettingsUpdate);
    };
  }, []);

  const opacity = currentSettings.bgMode === 'off' ? 0 : (currentSettings.bgOpacity ?? 25);

  // Orientation detection via matchMedia + resize
  useEffect(() => {
    const updateOrientation = () => {
      const next: Orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
      setOrientation((prev) => prev === next ? prev : next);
    };
    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    let mql: MediaQueryList | null = null;
    if (typeof window.matchMedia === 'function') {
      mql = window.matchMedia('(orientation: portrait)');
      const handler = (e: MediaQueryListEvent) => setOrientation(e.matches ? 'portrait' : 'landscape');
      if (typeof mql.addEventListener === 'function') mql.addEventListener('change', handler);
      else mql.addListener(handler);
      return () => {
        window.removeEventListener('resize', updateOrientation);
        if (typeof mql!.removeEventListener === 'function') mql!.removeEventListener('change', handler);
        else mql!.removeListener(handler);
      };
    }
    return () => { window.removeEventListener('resize', updateOrientation); };
  }, []);

  // Static mode: swap between portrait/landscape files
  useEffect(() => {
    if (currentSettings.bgMode !== 'static') return;
    const staticUrl = orientation === 'portrait'
      ? '/backgrounds/bg-portrait.png'
      : '/backgrounds/bg-landscape.png';
    setPrevUrl(url);
    setUrl(staticUrl);
    setSceneKey(`static_${orientation}`);
    lastKeyRef.current = `static_${orientation}`;
  }, [currentSettings.bgMode, orientation]);

  // Off mode
  useEffect(() => {
    if (currentSettings.bgMode === 'off') {
      setPrevUrl(url);
      setUrl(null);
      setSceneKey(null);
      lastKeyRef.current = null;
    }
  }, [currentSettings.bgMode]);

  // Adaptive AI mode: trigger only when currentLocation changes
  useEffect(() => {
    if (currentSettings.bgMode !== 'adaptive' || !state) return;

    const apiKey = currentSettings.geminiApiKey || currentSettings.openrouterApiKey;
    const currentLocation = state.currentLocation || '';

    // Only fire when location changes, not every turn
    if (currentLocation === lastLocationRef.current) return;
    lastLocationRef.current = currentLocation;

    const key = buildSceneKey(state, orientation);
    if (key === lastKeyRef.current) return;
    lastKeyRef.current = key;
    setSceneKey(key);

    let cancelled = false;

    async function load() {
      if (!state) return;
      if (!apiKey) return;

      const cached = await bgGet(key);
      if (cached) {
        if (!cancelled) {
          setPrevUrl(url);
          setUrl(cached.dataUrl);
        }
        return;
      }

      setLoading(true);
      try {
        const prompt = buildAdaptivePrompt(state, currentSettings, orientation);
        const dataUrl = await generateBgWithOpenRouter(prompt, currentSettings);
        await bgPut({
          key,
          dataUrl,
          prompt,
          genre: state.turnFrameTheme?.frameStyle ?? 'minimal-holo',
          createdAt: Date.now(),
        });
        if (!cancelled) {
          setPrevUrl(url);
          setUrl(dataUrl);
        }
      } catch {
        // silently fail — background is cosmetic
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [state?.currentLocation, currentSettings.bgMode, currentSettings.artStylePreset, orientation]);

  return { url, prevUrl, loading, sceneKey, orientation, opacity };
}