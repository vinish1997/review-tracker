import { useCallback, useMemo, useState } from "react";
import ToastCtx from "./ToastContext";

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((message, type = 'info', ttl = 3000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    if (ttl > 0) setTimeout(() => setToasts((t) => t.filter(x => x.id !== id)), ttl);
  }, []);
  const remove = useCallback((id) => setToasts((t) => t.filter(x => x.id !== id)), []);
  const value = useMemo(() => ({ show, remove }), [show, remove]);
  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`px-4 py-2 rounded shadow border cursor-pointer transition-colors
              ${t.type==='error' ? 'bg-red-50 text-red-800 border-red-200' : t.type==='success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-slate-50 text-slate-800 border-slate-200'}`}
               onClick={() => remove(t.id)}
               role="status">
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
