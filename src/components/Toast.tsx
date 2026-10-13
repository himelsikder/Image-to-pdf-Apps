import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastData {
  id: string;
  type?: 'success' | 'error' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

/**
 * Dispatch a global toast event to show notifications anywhere in the app
 */
export function showToast(options: {
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}) {
  if (typeof window === 'undefined') return;
  const event = new CustomEvent<ToastData>('app:toast', {
    detail: {
      id: Math.random().toString(36).substring(2, 9),
      type: options.type || 'success',
      title: options.title,
      description: options.description,
      duration: options.duration || 4000,
    },
  });
  window.dispatchEvent(event);
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<ToastData>;
      if (!customEvent.detail) return;
      const newToast = customEvent.detail;

      setToasts((prev) => [newToast, ...prev.slice(0, 2)]);

      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, newToast.duration || 4000);

      return () => clearTimeout(timer);
    };

    window.addEventListener('app:toast', handleToast);
    return () => window.removeEventListener('app:toast', handleToast);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-md pointer-events-none flex flex-col gap-2.5 pt-safe"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success' || !toast.type;
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all duration-300 animate-fadeIn ${
              isSuccess
                ? 'bg-emerald-600/95 dark:bg-emerald-800/95 border-emerald-400/50 dark:border-emerald-600/60 text-white shadow-emerald-950/30'
                : isError
                ? 'bg-rose-600/95 dark:bg-rose-800/95 border-rose-400/50 dark:border-rose-600/60 text-white shadow-rose-950/30'
                : 'bg-slate-900/95 dark:bg-slate-800/95 border-slate-700 text-white shadow-slate-950/30'
            }`}
          >
            <div className="p-1.5 rounded-full bg-white/20 shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-white" />}
              {isError && <AlertCircle className="w-5 h-5 text-white" />}
              {!isSuccess && !isError && <Info className="w-5 h-5 text-white" />}
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <h5 className="font-bold text-sm sm:text-base leading-snug tracking-tight">
                {toast.title}
              </h5>
              {toast.description && (
                <p className="text-xs sm:text-xs text-white/90 leading-relaxed mt-0.5 break-words font-medium">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition shrink-0 mt-0.5"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
