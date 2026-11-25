import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(() => {});
const ICONS = { success: 'fa-circle-check', error: 'fa-circle-exclamation', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback(
    (message, type = 'success') => {
      const id = crypto.randomUUID();
      setToasts((t) => [...t, { id, message, type }]);
      setTimeout(() => dismiss(id), 3500);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="erp-toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`erp-toast ${t.type}`}>
            <i className={`erp-toast-icon fa-solid ${ICONS[t.type] ?? ICONS.info}`} />
            <div className="erp-toast-msg">{t.message}</div>
            <button className="erp-toast-close" onClick={() => dismiss(t.id)} aria-label="Close">
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Returns toast(message, type) where type is success | error | warning | info. Use instead of alert(). */
export const useToast = () => useContext(ToastContext);
