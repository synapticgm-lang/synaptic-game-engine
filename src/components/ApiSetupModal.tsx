import { useState, useEffect, useRef } from 'react';
import { X, Eye, EyeOff, Baby, Shield, ExternalLink, KeyRound, Sparkles, ChevronDown, ChevronUp, AlertCircle, Rocket, Check, Loader2, RefreshCw, Zap } from 'lucide-react';
import type { Settings, ContentMode, AiProvider, KeyStatus } from '@/game/types';
import { validateApiKey, fetchModelsForProvider, getDefaultModels, detectProviderFromKey } from '@/game/apiValidation';

interface Props {
  settings: Settings;
  onSave: (s: Settings) => void;
  onSetContentMode: (mode: ContentMode, pin?: string) => void;
  onClose: () => void;
}

const AI_STUDIO_URL = 'https://aistudio.google.com/';

export function ApiSetupModal({ settings, onSave, onSetContentMode, onClose }: Props) {
  const [step, setStep] = useState<'mode' | 'kid' | 'adult'>('mode');
  const [apiKey, setApiKey] = useState(settings.geminiApiKey || settings.openrouterApiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [selectedMode, setSelectedMode] = useState<ContentMode | null>(null);

  const [detectedProvider, setDetectedProvider] = useState<AiProvider | null>(detectProviderFromKey(settings.geminiApiKey || settings.openrouterApiKey || ''));
  const [provider, setProvider] = useState<AiProvider>(settings.aiProvider ?? detectedProvider ?? 'gemini');
  const [customModelId, setCustomModelId] = useState(settings.customModelId ?? '');
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl ?? '');
  const [fetchedModels, setFetchedModels] = useState<string[]>(getDefaultModels(settings.aiProvider ?? detectedProvider ?? 'gemini'));
  const [selectedModel, setSelectedModel] = useState(settings.customModelId ?? getDefaultModels(settings.aiProvider ?? detectedProvider ?? 'gemini')[0] ?? '');

  const [keyStatus, setKeyStatus] = useState<KeyStatus>('untested');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [imageProvider, setImageProvider] = useState<'gemini' | 'custom'>(settings.imageProvider ?? 'gemini');
  const [imageBaseUrl, setImageBaseUrl] = useState(settings.imageBaseUrl ?? '');
  const [imageApiKey, setImageApiKey] = useState(settings.imageApiKey ?? '');
  const [imageEndpointType, setImageEndpointType] = useState<'openai' | 'automatic1111' | 'comfyui'>(settings.imageEndpointType ?? 'openai');
  const [imageModel, setImageModel] = useState(settings.imageModel ?? '');
  const [showImageAdvanced, setShowImageAdvanced] = useState(false);
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

  const handleSave = (mode: ContentMode) => {
    const isGemini = (detectedProvider ?? provider) === 'gemini';
    onSave({
      ...settings,
      geminiApiKey: isGemini ? apiKey.trim() : '',
      openrouterApiKey: (detectedProvider ?? provider) === 'openrouter' ? apiKey.trim() : '',
      aiProvider: detectedProvider ?? provider,
      customModelId: customModelId.trim() || selectedModel,
      baseUrl: baseUrl.trim(),
      imageProvider,
      imageBaseUrl: imageBaseUrl.trim(),
      imageApiKey: imageApiKey.trim(),
      imageEndpointType,
      imageModel: imageModel.trim(),
    } as Settings);
    onSetContentMode(mode);
    onClose();
  };

  const canLaunch = keyStatus === 'valid' || (apiKey.trim().length >= 10 && keyStatus === 'untested');

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-crimson-700/50 bg-slate-900 shadow-2xl shadow-crimson-900/20 max-h-[90vh] flex flex-col">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/70 to-slate-950/90" />

        <div className="relative z-10 flex items-center justify-between border-b border-slate-700 px-5 py-4 shrink-0">
          <h2 className="font-serif text-lg text-slate-100 flex items-center gap-2">
            <KeyRound size={18} className="text-crimson-400" />
            {step === 'mode' && 'Choose Your Mode'}
            {step === 'kid' && 'Kid Mode Setup'}
            {step === 'adult' && 'Adult Mode Setup'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="relative z-10 overflow-y-auto p-5 flex-1">
          {step === 'mode' && (
            <ModeSelection
              selectedMode={selectedMode}
              onSelect={(m) => {
                setSelectedMode(m);
                setStep(m === 'kid' ? 'kid' : 'adult');
              }}
            />
          )}

          {step === 'kid' && (
            <KidModeFlow
              apiKey={apiKey}
              setApiKey={setApiKey}
              showKey={showKey}
              setShowKey={setShowKey}
              detectedProvider={detectedProvider}
              providerLabel={providerLabel}
              keyStatus={keyStatus}
              validationError={validationError}
              onTestKey={() => runValidation(apiKey, detectedProvider ?? provider)}
              onBack={() => setStep('mode')}
              onLaunch={() => handleSave('kid')}
              canLaunch={canLaunch}
            />
          )}

          {step === 'adult' && (
            <AdultModeFlow
              apiKey={apiKey}
              setApiKey={setApiKey}
              showKey={showKey}
              setShowKey={setShowKey}
              detectedProvider={detectedProvider}
              providerLabel={providerLabel}
              showAdvanced={showAdvanced}
              setShowAdvanced={setShowAdvanced}
              provider={provider}
              setProvider={setProvider}
              setDetectedProvider={setDetectedProvider}
              baseUrl={baseUrl}
              setBaseUrl={setBaseUrl}
              fetchedModels={fetchedModels}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              customModelId={customModelId}
              setCustomModelId={setCustomModelId}
              keyStatus={keyStatus}
              validationError={validationError}
              onTestKey={() => runValidation(apiKey, detectedProvider ?? provider)}
              onFetchModels={handleFetchModels}
              fetchingModels={fetchingModels}
              setFetchedModels={setFetchedModels}
              imageProvider={imageProvider}
              setImageProvider={setImageProvider}
              imageBaseUrl={imageBaseUrl}
              setImageBaseUrl={setImageBaseUrl}
              imageApiKey={imageApiKey}
              setImageApiKey={setImageApiKey}
              imageEndpointType={imageEndpointType}
              setImageEndpointType={setImageEndpointType}
              imageModel={imageModel}
              setImageModel={setImageModel}
              showImageAdvanced={showImageAdvanced}
              setShowImageAdvanced={setShowImageAdvanced}
              onBack={() => setStep('mode')}
              onLaunch={() => handleSave('adult')}
              canLaunch={canLaunch}
            />
          )}
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

function ModelSelector({
  fetchedModels, selectedModel, setSelectedModel, customModelId, setCustomModelId, onFetchModels, fetchingModels,
}: {
  fetchedModels: string[];
  selectedModel: string;
  setSelectedModel: (m: string) => void;
  customModelId: string;
  setCustomModelId: (m: string) => void;
  onFetchModels: () => void;
  fetchingModels: boolean;
}) {
  return (
    <div className="space-y-2">
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
          onClick={onFetchModels}
          disabled={fetchingModels}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-crimson-300 hover:bg-slate-700 disabled:opacity-40 transition-colors"
        >
          {fetchingModels ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Fetch Models
        </button>
      </div>
      <input
        value={customModelId}
        onChange={(e) => setCustomModelId(e.target.value)}
        placeholder="Custom Model ID override (optional)..."
        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-crimson-500 focus:outline-none"
      />
    </div>
  );
}

function ModeSelection({ selectedMode, onSelect }: { selectedMode: ContentMode | null; onSelect: (m: ContentMode) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-slate-400">
        Welcome! Choose how you'd like to experience the game. You can change this later in Settings.
      </p>
      <button
        onClick={() => onSelect('kid')}
        className={`w-full rounded-xl border p-4 text-left transition-all ${selectedMode === 'kid' ? 'border-amber-500 bg-amber-950/30' : 'border-slate-700 bg-slate-800/40 hover:bg-slate-800/70'}`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-900/40">
            <Baby size={20} className="text-amber-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-100">Kid Mode</div>
            <div className="text-xs text-slate-500">Family-friendly. No swearing, gore, or mature themes.</div>
          </div>
        </div>
      </button>
      <button
        onClick={() => onSelect('adult')}
        className={`w-full rounded-xl border p-4 text-left transition-all ${selectedMode === 'adult' ? 'border-crimson-500 bg-crimson-950/30' : 'border-slate-700 bg-slate-800/40 hover:bg-slate-800/70'}`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-crimson-900/40">
            <Shield size={20} className="text-crimson-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-100">Adult Mode</div>
            <div className="text-xs text-slate-500">Mature themes, intense combat, dark fantasy.</div>
          </div>
        </div>
      </button>
    </div>
  );
}

function KidModeFlow({
  apiKey, setApiKey, showKey, setShowKey, detectedProvider, providerLabel, keyStatus, validationError, onTestKey, onBack, onLaunch, canLaunch,
}: {
  apiKey: string;
  setApiKey: (v: string) => void;
  showKey: boolean;
  setShowKey: (v: boolean) => void;
  detectedProvider: AiProvider | null;
  providerLabel: string | null;
  keyStatus: KeyStatus;
  validationError: string | null;
  onTestKey: () => void;
  onBack: () => void;
  onLaunch: () => void;
  canLaunch: boolean;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-amber-600/50 bg-amber-950/30 p-4">
        <div className="flex items-center gap-2 text-amber-400">
          <AlertCircle size={18} />
          <span className="text-sm font-bold">Parent/Adult Help Required to Play!</span>
        </div>
        <p className="mt-2 text-xs text-amber-200/80">
          To run the game's storyteller engine without cost, an adult needs to set up a free Google Gemini API key.
        </p>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
          <Sparkles size={15} className="text-crimson-400" />
          How to Get a Free API Key
        </div>
        <ol className="space-y-2.5 text-xs text-slate-400">
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-crimson-600 text-[10px] font-bold text-white">1</span>
            <span>Go to <a href={AI_STUDIO_URL} target="_blank" rel="noopener noreferrer" className="text-crimson-400 underline hover:text-crimson-300 inline-flex items-center gap-0.5">Google AI Studio <ExternalLink size={10} /></a> and sign in with a Google account.</span>
          </li>
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-crimson-600 text-[10px] font-bold text-white">2</span>
            <span>Click <strong className="text-slate-300">"Get API key"</strong> in the left sidebar, then <strong className="text-slate-300">"Create API key"</strong>.</span>
          </li>
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-crimson-600 text-[10px] font-bold text-white">3</span>
            <span>Copy the generated key and paste it into the field below.</span>
          </li>
        </ol>
      </div>

      <UniversalKeyInput
        apiKey={apiKey}
        setApiKey={setApiKey}
        showKey={showKey}
        setShowKey={setShowKey}
        detectedProvider={detectedProvider}
        providerLabel={providerLabel}
        keyStatus={keyStatus}
        validationError={validationError}
        onTestKey={onTestKey}
      />

      <div className="flex gap-2 pt-1">
        <button onClick={onBack} className="rounded-lg px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 transition-colors">
          Back
        </button>
        <button
          onClick={onLaunch}
          disabled={!canLaunch}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Rocket size={16} />
          Save & Launch Kid Mode
        </button>
      </div>
    </div>
  );
}

function UniversalKeyInput({
  apiKey, setApiKey, showKey, setShowKey, detectedProvider, providerLabel, keyStatus, validationError, onTestKey,
}: {
  apiKey: string;
  setApiKey: (v: string) => void;
  showKey: boolean;
  setShowKey: (v: boolean) => void;
  detectedProvider: AiProvider | null;
  providerLabel: string | null;
  keyStatus: KeyStatus;
  validationError: string | null;
  onTestKey: () => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <KeyRound size={15} className="text-crimson-400" />
          API Key
        </label>
        <KeyStatusBadge status={keyStatus} error={validationError} onTest={onTestKey} />
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
          Could not auto-detect the provider. Select one manually in Advanced.
        </p>
      )}

      <p className="mt-1.5 text-[11px] text-slate-500">Stored locally on this device. Supports Gemini, OpenRouter, OpenAI, Anthropic, and Groq keys.</p>
    </div>
  );
}

function AdultModeFlow({
  apiKey, setApiKey, showKey, setShowKey, detectedProvider, providerLabel,
  showAdvanced, setShowAdvanced,
  provider, setProvider, setDetectedProvider, baseUrl, setBaseUrl,
  fetchedModels, selectedModel, setSelectedModel, customModelId, setCustomModelId,
  keyStatus, validationError, onTestKey, onFetchModels, fetchingModels,
  setFetchedModels,
  imageProvider, setImageProvider, imageBaseUrl, setImageBaseUrl, imageApiKey, setImageApiKey,
  imageEndpointType, setImageEndpointType, imageModel, setImageModel,
  showImageAdvanced, setShowImageAdvanced,
  onBack, onLaunch, canLaunch,
}: {
  apiKey: string;
  setApiKey: (v: string) => void;
  showKey: boolean;
  setShowKey: (v: boolean) => void;
  detectedProvider: AiProvider | null;
  providerLabel: string | null;
  showAdvanced: boolean;
  setShowAdvanced: (v: boolean) => void;
  provider: AiProvider;
  setProvider: (p: AiProvider) => void;
  setDetectedProvider: (p: AiProvider | null) => void;
  baseUrl: string;
  setBaseUrl: (v: string) => void;
  fetchedModels: string[];
  selectedModel: string;
  setSelectedModel: (m: string) => void;
  customModelId: string;
  setCustomModelId: (m: string) => void;
  keyStatus: KeyStatus;
  validationError: string | null;
  onTestKey: () => void;
  onFetchModels: () => void;
  fetchingModels: boolean;
  setFetchedModels: (m: string[]) => void;
  imageProvider: 'gemini' | 'custom';
  setImageProvider: (v: 'gemini' | 'custom') => void;
  imageBaseUrl: string;
  setImageBaseUrl: (v: string) => void;
  imageApiKey: string;
  setImageApiKey: (v: string) => void;
  imageEndpointType: 'openai' | 'automatic1111' | 'comfyui';
  setImageEndpointType: (v: 'openai' | 'automatic1111' | 'comfyui') => void;
  imageModel: string;
  setImageModel: (v: string) => void;
  showImageAdvanced: boolean;
  setShowImageAdvanced: (v: boolean) => void;
  onBack: () => void;
  onLaunch: () => void;
  canLaunch: boolean;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
          <Sparkles size={15} className="text-crimson-400" />
          Universal API Key
        </div>
        <p className="text-xs text-slate-400 mb-3">
          Paste any API key below — the game will automatically detect the provider (Gemini, OpenRouter, OpenAI, Anthropic, Groq). Get a free Gemini key from <a href={AI_STUDIO_URL} target="_blank" rel="noopener noreferrer" className="text-crimson-400 underline hover:text-crimson-300 inline-flex items-center gap-0.5">Google AI Studio <ExternalLink size={10} /></a>.
        </p>
        <UniversalKeyInput
          apiKey={apiKey}
          setApiKey={setApiKey}
          showKey={showKey}
          setShowKey={setShowKey}
          detectedProvider={detectedProvider}
          providerLabel={providerLabel}
          keyStatus={keyStatus}
          validationError={validationError}
          onTestKey={onTestKey}
        />
      </div>

      {keyStatus === 'valid' && fetchedModels.length > 0 && (
        <div className="border-t border-slate-700 pt-4">
          <label className="mb-1.5 block text-xs font-medium text-slate-300">Model Selection</label>
          <ModelSelector
            fetchedModels={fetchedModels}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            customModelId={customModelId}
            setCustomModelId={setCustomModelId}
            onFetchModels={onFetchModels}
            fetchingModels={fetchingModels}
          />
        </div>
      )}

      <div className="border-t border-slate-700 pt-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex w-full items-center justify-between text-sm font-medium text-slate-300 hover:text-slate-100 transition-colors"
        >
          <span>Advanced / Override Provider</span>
          {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
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

      <div className="border-t border-slate-700 pt-4">
        <button
          onClick={() => setShowImageAdvanced(!showImageAdvanced)}
          className="flex w-full items-center justify-between text-sm font-medium text-slate-300 hover:text-slate-100 transition-colors"
        >
          <span>Image Generation Provider</span>
          {showImageAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showImageAdvanced && (
          <div className="mt-3 space-y-3 rounded-lg border border-slate-700 bg-slate-800/40 p-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Image Provider</label>
              <select
                value={imageProvider}
                onChange={(e) => setImageProvider(e.target.value as 'gemini' | 'custom')}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-100 focus:border-crimson-500 focus:outline-none"
              >
                <option value="gemini">Google Gemini (Imagen)</option>
                <option value="custom">Custom / Local Endpoint</option>
              </select>
            </div>
            {imageProvider === 'custom' && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Endpoint Type</label>
                  <select
                    value={imageEndpointType}
                    onChange={(e) => setImageEndpointType(e.target.value as 'openai' | 'automatic1111' | 'comfyui')}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-100 focus:border-crimson-500 focus:outline-none"
                  >
                    <option value="openai">OpenAI-compatible</option>
                    <option value="automatic1111">Automatic1111</option>
                    <option value="comfyui">ComfyUI</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Base URL</label>
                  <input
                    value={imageBaseUrl}
                    onChange={(e) => setImageBaseUrl(e.target.value)}
                    placeholder="http://localhost:7860"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-crimson-500 focus:outline-none"
                  />
                </div>
                {imageEndpointType === 'openai' && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-400">API Key (optional for local)</label>
                      <input
                        type="password"
                        value={imageApiKey}
                        onChange={(e) => setImageApiKey(e.target.value)}
                        placeholder="sk-... or leave blank"
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-crimson-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-400">Model</label>
                      <input
                        value={imageModel}
                        onChange={(e) => setImageModel(e.target.value)}
                        placeholder="dall-e-3, sdxl, etc."
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-crimson-500 focus:outline-none"
                      />
                    </div>
                  </>
                )}
                <p className="text-[10px] text-slate-500">Route all image generation to your self-hosted or custom endpoint. Bypasses cloud content filters.</p>
              </>
            )}
            {imageProvider === 'gemini' && (
              <p className="text-[10px] text-slate-500">Uses your Gemini API key to generate cinematic scene images via Google Imagen.</p>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={onBack} className="rounded-lg px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 transition-colors">
          Back
        </button>
        <button
          onClick={onLaunch}
          disabled={!canLaunch}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-crimson-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-crimson-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Rocket size={16} />
          Save & Launch Adult Mode
        </button>
      </div>
    </div>
  );
}
