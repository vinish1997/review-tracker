import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
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
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-2 rounded shadow text-white ${t.type==='error' ? 'bg-red-600' : t.type==='success' ? 'bg-green-600' : 'bg-gray-800'}`}
               onClick={() => remove(t.id)}
               role="status">
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx) || { show: () => {}, remove: () => {} };
}

