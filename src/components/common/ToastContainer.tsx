import React, { useEffect } from 'react';
import { useApp, ToastItem } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastMessage: React.FC<{ toast: ToastItem; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-600 shrink-0" />
  };

  const borderColors = {
    success: 'border-emerald-200 bg-white',
    error: 'border-rose-200 bg-white',
    warning: 'border-amber-200 bg-white',
    info: 'border-blue-200 bg-white'
  };

  return (
    <div
      className={`flex items-start gap-3 w-80 md:w-96 p-4 rounded-xl border shadow-lg ${borderColors[toast.type]} transition-all animate-in fade-in slide-in-from-top-2 duration-200`}
    >
      {icons[toast.type]}
      <div className="flex-1 text-xs text-slate-800 leading-relaxed font-medium">
        {toast.message}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { state, dispatch } = useApp();

  return (
    <div className="fixed top-20 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      <div className="flex flex-col gap-2 pointer-events-auto">
        {state.toasts.map(toast => (
          <ToastMessage
            key={toast.id}
            toast={toast}
            onDismiss={(id) => dispatch({ type: 'REMOVE_TOAST', payload: id })}
          />
        ))}
      </div>
    </div>
  );
};
