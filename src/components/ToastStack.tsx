import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface Props {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function ToastStack({ toasts, onDismiss }: Props) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icon = toast.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-400" />
    : toast.type === 'error' ? <AlertCircle size={18} className="text-rose-400" />
    : <Info size={18} className="text-sky-400" />;

  const border = toast.type === 'success' ? 'border-emerald-800/60'
    : toast.type === 'error' ? 'border-rose-800/60'
    : 'border-sky-800/60';

  return (
    <div
      className={`pointer-events-auto flex items-center gap-2.5 rounded-lg border ${border} bg-slate-900/95 px-4 py-3 shadow-xl backdrop-blur transition-all duration-300 ${visible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}
    >
      {icon}
      <span className="text-sm text-slate-200">{toast.message}</span>
      <button onClick={() => onDismiss(toast.id)} className="ml-2 text-slate-500 hover:text-slate-300">
        <X size={14} />
      </button>
    </div>
  );
}
