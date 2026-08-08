import { useCallback, useRef, useState } from 'react';
import {
  UploadCloud, FileImage, CheckCircle2, Sparkles, X, ScanLine,
} from 'lucide-react';

type Phase = 'idle' | 'scanning' | 'complete';

interface Props {
  onFileSelected?: (file: File) => void;
}

export function UploadImport({ onFileSelected }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scanTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    if (scanTimer.current) clearTimeout(scanTimer.current);
    setPhase('idle');
    setFileName(null);
    setFileUrl(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const handleFile = useCallback((file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, etc.).');
      return;
    }
    setError(null);
    setFileName(file.name);
    setFileUrl(URL.createObjectURL(file));
    setPhase('idle');
    onFileSelected?.(file);
  }, [onFileSelected]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  }, [handleFile]);

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
  }, [handleFile]);

  const startScan = useCallback(() => {
    if (!fileName) return;
    setPhase('scanning');
    if (scanTimer.current) clearTimeout(scanTimer.current);
    scanTimer.current = setTimeout(() => setPhase('complete'), 3200);
  }, [fileName]);

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Header */}
      <div className="mb-4 text-center">
        <h2 className="font-serif text-lg font-bold text-slate-100 sm:text-xl">Upload &amp; Import</h2>
        <p className="mt-1 text-xs text-slate-500">Import a physical character sheet or custom map photo</p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`group relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-all duration-300 ${
          isDragging
            ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
            : phase === 'complete'
              ? 'border-emerald-500/50 bg-emerald-950/20'
              : 'border-slate-700 bg-slate-900/50 hover:border-cyan-600/60 hover:bg-slate-800/40'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onChange}
        />

        {/* Tech grid background */}
        <div className="pointer-events-none absolute inset-0 opacity-20" style={{
          backgroundImage: 'linear-gradient(rgba(34,211,238,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.15) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />

        {/* Content */}
        <div className="relative flex flex-col items-center justify-center px-4 py-10 text-center sm:py-14">
          {phase === 'idle' && (
            <IdleState fileName={fileName} fileUrl={fileUrl} />
          )}
          {phase === 'scanning' && (
            <ScanningState fileUrl={fileUrl} />
          )}
          {phase === 'complete' && (
            <CompleteState fileName={fileName} fileUrl={fileUrl} />
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="mt-2 text-center text-xs text-rose-400">{error}</p>
      )}

      {/* Action buttons */}
      <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
        {phase === 'idle' && fileName && (
          <>
            <button
              onClick={startScan}
              className="flex items-center gap-2 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-5 py-2.5 text-sm font-semibold text-cyan-300 transition-all hover:bg-cyan-500/20 hover:shadow-lg hover:shadow-cyan-900/40"
            >
              <ScanLine size={16} />
              Test Scan
            </button>
            <button
              onClick={reset}
              className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm text-slate-400 transition-all hover:bg-slate-700/60"
            >
              <X size={14} />
              Clear
            </button>
          </>
        )}
        {phase === 'complete' && (
          <button
            onClick={reset}
            className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800/60 px-5 py-2.5 text-sm font-medium text-slate-300 transition-all hover:bg-slate-700/60"
          >
            <UploadCloud size={16} />
            Upload Another
          </button>
        )}
      </div>
    </div>
  );
}

/* ============ IDLE STATE ============ */

function IdleState({ fileName, fileUrl }: { fileName: string | null; fileUrl: string | null }) {
  if (fileName) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-32 w-full max-w-xs overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
          {fileUrl && <img src={fileUrl} alt={fileName} className="h-full w-full object-cover opacity-80" />}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <FileImage size={15} className="text-cyan-400" />
          <span className="font-medium">{fileName}</span>
        </div>
        <p className="text-xs text-slate-500">Ready to scan. Press "Test Scan" to simulate import.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-cyan-500/30 bg-cyan-500/5 transition-transform group-hover:scale-110">
        <UploadCloud size={28} className="text-cyan-400" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-200 sm:text-base">
          Drag &amp; Drop your Character Sheet or Map here
        </p>
        <p className="mt-0.5 text-xs text-slate-500">or click to browse</p>
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5 text-[10px] text-slate-600">
        <span className="rounded border border-slate-700 px-1.5 py-0.5">PNG</span>
        <span className="rounded border border-slate-700 px-1.5 py-0.5">JPG</span>
        <span className="rounded border border-slate-700 px-1.5 py-0.5">WEBP</span>
      </div>
    </div>
  );
}

/* ============ SCANNING STATE ============ */

function ScanningState({ fileUrl }: { fileUrl: string | null }) {
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="relative h-44 w-full max-w-sm overflow-hidden rounded-lg border border-cyan-500/40 bg-slate-950">
        {/* Preview image */}
        {fileUrl && (
          <img src={fileUrl} alt="scanning" className="h-full w-full object-cover opacity-40" />
        )}

        {/* Tech grid overlay */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(34,211,238,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.25) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }} />

        {/* Sweeping scan line */}
        <div className="scan-sweep absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_4px_rgba(34,211,238,0.6)]" />

        {/* Corner brackets */}
        <CornerBrackets color="border-cyan-400" />

        {/* Status text */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-[10px] font-mono text-cyan-300">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
          SCANNING...
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-sm">
        <div className="h-1.5 overflow-hidden rounded-full border border-cyan-800/40 bg-slate-900">
          <div className="scan-progress h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400" />
        </div>
        <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-wider text-cyan-400/70">
          Analyzing document structure
        </p>
      </div>
    </div>
  );
}

/* ============ COMPLETE STATE ============ */

function CompleteState({ fileName, fileUrl }: { fileName: string | null; fileUrl: string | null }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-32 w-full max-w-xs overflow-hidden rounded-lg border border-emerald-500/40 bg-slate-950">
        {fileUrl && <img src={fileUrl} alt={fileName ?? 'uploaded'} className="h-full w-full object-cover opacity-70" />}
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/40 to-transparent" />
        <CornerBrackets color="border-emerald-400" />
      </div>
      <div className="flex items-center gap-2 text-emerald-400">
        <CheckCircle2 size={20} />
        <span className="font-serif text-sm font-bold">Upload Complete</span>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-slate-400">
        <Sparkles size={12} className="text-emerald-400" />
        {fileName} imported successfully
      </p>
    </div>
  );
}

/* ============ SHARED ============ */

function CornerBrackets({ color }: { color: string }) {
  const base = `absolute h-4 w-4 border-${color}`;
  return (
    <>
      <div className={`${base} left-1 top-1 border-l-2 border-t-2`} />
      <div className={`${base} right-1 top-1 border-r-2 border-t-2`} />
      <div className={`${base} bottom-1 left-1 border-b-2 border-l-2`} />
      <div className={`${base} bottom-1 right-1 border-b-2 border-r-2`} />
    </>
  );
}
