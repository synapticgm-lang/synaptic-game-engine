import { useState, useEffect, useRef } from 'react';
import { ChevronRight, Baby, Shield, KeyRound, Eye, EyeOff, Sparkles, Check, Loader2, RefreshCw, X, ChevronDown, Zap } from 'lucide-react';
import type { ContentMode, AiProvider, KeyStatus } from '@/game/types';
import { validateApiKey, fetchModelsForProvider, getDefaultModels, detectProviderFromKey } from '@/game/apiValidation';

interface Props {
  initialContentMode: ContentMode;
  initialApiKey: string;
  onComplete: (contentMode: ContentMode, apiKey: string, provider: AiProvider, model: string, baseUrl: string) => void;
}

export function SetupScreen({ initialContentMode, initialApiKey, onComplete }: Props) {
  const [contentMode, setContentMode] = useState<ContentMode>(initialContentMode);
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [showKey, setShowKey] = useState(false);
  const [detectedProvider, setDetectedProvider] = useState<AiProvider | null>(detectProviderFromKey(initialApiKey));
  const [provider, setProvider] = useState<AiProvider>(detectedProvider ?? 'gemini');
  const [keyStatus, setKeyStatus] = useState<KeyStatus>('untested');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [fetchedModels, setFetchedModels] = useState<string[]>(getDefaultModels(detectedProvider ?? 'gemini'));
  const [selectedModel, setSelectedModel] = useState(getDefaultModels(detectedProvider ?? 'gemini')[0] ?? '');
  const [customModelId, setCustomModelId] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [fetchingModels, setFetchingModels] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runValidation = async (key: string, prov: AiProvider) => {
    if (!key || key.trim().length < 5) {
      setKeyStatus('untested');
      setValidationError(null);
      return;
    }
    setKeyStatus('validating');
    const result = await validateApiKey(prov, key.trim(), baseUrl.trim() || undefined);
    if (result.ok) {
      setKeyStatus('valid');
      setValidationError(null);
    } else {
      setKeyStatus('invalid');
      setValidationError(result.error ?? 'Unknown error');
    }
  };

  useEffect(() => {
    const detected = detectProviderFromKey(apiKey);
    setDetectedProvider(detected);
    if (detected) {
      setProvider(detected);
      setFetchedModels(getDefaultModels(detected));
      setSelectedModel(getDefaultModels(detected)[0] ?? '');
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!apiKey || apiKey.trim().length < 5) {
      setKeyStatus('untested');
      return;
    }
    const prov = detected ?? provider;
    debounceRef.current = setTimeout(() => runValidation(apiKey, prov), 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, baseUrl]);

  const handleFetchModels = async () => {
    if (!apiKey || apiKey.trim().length < 5) return;
    setFetchingModels(true);
    try {
      const models = await fetchModelsForProvider(provider, apiKey.trim(), baseUrl.trim() || undefined);
      setFetchedModels(models);
      if (models.length > 0 && !customModelId) setSelectedModel(models[0]);
    } catch {
      setFetchedModels(getDefaultModels(provider));
    } finally {
      setFetchingModels(false);
    }
  };

  const canContinue = keyStatus === 'valid';

  const providerLabel = detectedProvider
    ? detectedProvider === 'gemini' ? 'Google Gemini'
    : detectedProvider === 'openrouter' ? 'OpenRouter'
    : detectedProvider === 'openai' ? 'OpenAI'
    : detectedProvider === 'anthropic' ? 'Anthropic'
    : detectedProvider === 'groq' ? 'Groq'
    : detectedProvider === 'ollama' ? 'Ollama'
    : 'Unknown'
    : null;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-8">
      <BackgroundFx />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <img src="/game-logo.jpg" alt="Game logo" className="w-24 h-24 object-cover mix-blend-screen rounded-full drop-shadow-lg mb-4" />
          <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-100">Prepare Your Adventure</h1>
          <p className="text-sm text-slate-500">Set your content preferences and AI key to begin.</p>
        </div>

        <div className="space-y-5 rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-sm">
          <div>
            <label className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300">
              <Shield size={16} className="text-crimson-400" />
              Content Profile
            </label>
            <div className="grid grid-cols-1 gap-2">
              <ProfileCard
                icon={<Baby size={18} />}
                title="Kid / Safe Mode"
                description="Family-friendly. No swearing, gore, or mature themes."
                selected={contentMode === 'kid'}
                onClick={() => setContentMode('kid')}
              />
              <ProfileCard
                icon={<Shield size={18} />}
                title="Standard / Adult Mode"
                description="Mature themes enabled. Strong language and graphic violence."
                selected={contentMode === 'adult'}
                onClick={() => setContentMode('adult')}
              />
            </div>
          </div>

          <div className="border-t border-slate-700 pt-5">
            <div className="mb-1.5 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <KeyRound size={16} className="text-crimson-400" />
                API Key
              </label>
              <KeyStatusBadge status={keyStatus} error={validationError} onTest={() => runValidation(apiKey, provider)} />
            </div>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste any API key — we'll detect the provider"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 pr-10 text-sm text-slate-100 placeholder-slate-500 focus:border-crimson-500 focus:outline-none focus:ring-1 focus:ring-crimson-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {detectedProvider && (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-700/40 bg-emerald-950/20 px-3 py-2">
                <Zap size={14} className="text-emerald-400" />
                <span className="text-xs text-emerald-300">
                  Detected: <strong className="font-semibold">{providerLabel}</strong>
                </span>
              </div>
            )}

            {apiKey.trim().length >= 5 && !detectedProvider && (
              <p className="mt-2 text-[11px] text-amber-400/80">
                Could not auto-detect the provider. Select one manually below.
              </p>
            )}

            <p className="mt-1.5 text-[11px] text-slate-500">
              Stored locally on this device. Supports Gemini, OpenRouter, OpenAI, Anthropic, and Groq keys.
            </p>
          </div>

          {keyStatus === 'valid' && fetchedModels.length > 0 && (
            <div className="border-t border-slate-700 pt-4">
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Model Selection</label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-crimson-500 focus:outline-none"
                >
                  {fetchedModels.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleFetchModels}
                  disabled={fetchingModels}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-crimson-300 hover:bg-slate-700 disabled:opacity-40 transition-colors"
                >
                  {fetchingModels ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  Fetch
                </button>
              </div>
              <input
                value={customModelId}
                onChange={(e) => setCustomModelId(e.target.value)}
                placeholder="Custom Model ID override (optional)..."
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-crimson-500 focus:outline-none"
              />
            </div>
          )}

          <div className="border-t border-slate-700 pt-4">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex w-full items-center justify-between text-sm font-medium text-slate-300 hover:text-slate-100 transition-colors"
            >
              <span>Advanced / Override Provider</span>
              <ChevronDown size={16} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-3 rounded-lg border border-slate-700 bg-slate-800/40 p-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-300">Force Provider</label>
                  <select
                    value={provider}
                    onChange={(e) => {
                      const p = e.target.value as AiProvider;
                      setProvider(p);
                      setDetectedProvider(null);
                      setFetchedModels(getDefaultModels(p));
                      setSelectedModel(getDefaultModels(p)[0] ?? '');
                    }}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-crimson-500 focus:outline-none"
                  >
                    <option value="gemini">Google Gemini</option>
                    <option value="openrouter">OpenRouter</option>
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="groq">Groq</option>
                    <option value="ollama">Ollama (Local)</option>
                  </select>
                </div>

                {provider !== 'gemini' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-300">Base URL (optional)</label>
                    <input
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="https://api.openai.com/v1"
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-crimson-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => onComplete(contentMode, apiKey.trim(), provider, customModelId.trim() || selectedModel, baseUrl.trim())}
            disabled={!canContinue}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-crimson-600 px-4 py-3 text-sm font-medium text-white hover:bg-crimson-500 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
          >
            <Sparkles size={16} />
            Continue to Main Hub
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function KeyStatusBadge({ status, error, onTest }: { status: KeyStatus; error: string | null; onTest: () => void }) {
  if (status === 'validating') {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-sky-950/50 px-2.5 py-1 text-xs text-sky-300">
        <Loader2 size={12} className="animate-spin" />
        Testing key...
      </span>
    );
  }
  if (status === 'valid') {
    return (
      <span className="flex items-center gap-1.5 rounded-full border border-emerald-600/50 bg-emerald-950/40 px-2.5 py-1 text-xs text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
        <Check size={12} />
        Connected & Ready
      </span>
    );
  }
  if (status === 'invalid') {
    return (
      <span className="group relative flex items-center gap-1.5 rounded-full border border-rose-600/50 bg-rose-950/40 px-2.5 py-1 text-xs text-rose-300" title={error ?? 'Connection failed'}>
        <X size={12} />
        Connection Failed
        {error && (
          <span className="pointer-events-none absolute left-0 top-full z-10 mt-1 hidden whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-300 shadow-lg group-hover:block">
            {error}
          </span>
        )}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onTest}
      className="flex items-center gap-1.5 rounded-full border border-slate-600 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
    >
      <RefreshCw size={12} />
      Test Key
    </button>
  );
}

function ProfileCard({
  icon, title, description, selected, onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-all ${
        selected
          ? 'border-crimson-500 bg-crimson-950/30 shadow-[0_0_16px_rgba(220,38,38,0.15)]'
          : 'border-slate-700 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/70'
      }`}
    >
      <span className={`mt-0.5 ${selected ? 'text-crimson-400' : 'text-slate-500'}`}>{icon}</span>
      <div className="flex-1">
        <div className="text-sm font-medium text-slate-200">{title}</div>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
      {selected && (
        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-crimson-600">
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
        </span>
      )}
    </button>
  );
}

function BackgroundFx() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <img
        src="https://images.pexels.com/photos/127723/pexels-photo-127723.jpeg?auto=compress&cs=tinysrgb&w=1920"
        alt=""
        className="h-full w-full object-cover opacity-30"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/50 to-slate-950/85" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(15,23,42,0)_0%,_rgba(2,6,23,0.8)_70%)]" />
    </div>
  );
}
