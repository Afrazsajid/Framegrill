'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useUIStore } from '@/store/ui-store';

const toastStyles = {
  success: {
    bg: 'bg-emerald-50 border-emerald-200',
    icon: <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />,
    text: 'text-emerald-800',
  },
  error: {
    bg: 'bg-red-50 border-red-200',
    icon: <AlertCircle className="size-5 text-red-600 shrink-0" />,
    text: 'text-red-800',
  },
  info: {
    bg: 'bg-blue-50 border-blue-200',
    icon: <Info className="size-5 text-blue-600 shrink-0" />,
    text: 'text-blue-800',
  },
};

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  useEffect(() => {
    const handlers = toasts.map((toast) => {
      const timer = setTimeout(() => removeToast(toast.id), 3500);
      return () => clearTimeout(timer);
    });
    return () => handlers.forEach((h) => h());
  }, [toasts, removeToast]);

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const style = toastStyles[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${style.bg}`}
            >
              {style.icon}
              <p className={`text-sm font-medium flex-1 ${style.text}`}>{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 rounded-full p-0.5 hover:bg-black/5 transition-colors"
              >
                <X className="size-4 text-muted-foreground" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}