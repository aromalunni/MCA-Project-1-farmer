// frontend/src/components/Toast.jsx
import { useState, useEffect, createContext, useContext } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export function useToast() {
    return useContext(ToastContext);
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = 'success', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    };

    const toast = {
        success: (msg) => addToast(msg, 'success'),
        error: (msg) => addToast(msg, 'error', 4000),
        info: (msg) => addToast(msg, 'info'),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            {/* Toast Container */}
            <div style={{
                position: 'fixed', top: '20px', right: '20px', zIndex: 99999,
                display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '380px'
            }}>
                {toasts.map(t => (
                    <div key={t.id} style={{
                        background: t.type === 'success' ? '#E8F5E9' : t.type === 'error' ? '#FFEBEE' : '#E3F2FD',
                        color: t.type === 'success' ? '#2E7D32' : t.type === 'error' ? '#C62828' : '#1565C0',
                        border: `1px solid ${t.type === 'success' ? '#A5D6A7' : t.type === 'error' ? '#EF9A9A' : '#90CAF9'}`,
                        padding: '12px 16px', borderRadius: '12px',
                        display: 'flex', alignItems: 'center', gap: '10px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        animation: 'fadeInUp 0.3s ease',
                        fontSize: '0.9rem', fontWeight: 500
                    }}>
                        {t.type === 'success' && <CheckCircle size={18} />}
                        {t.type === 'error' && <AlertTriangle size={18} />}
                        {t.type === 'info' && <Info size={18} />}
                        <span style={{ flex: 1 }}>{t.message}</span>
                        <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, display: 'flex' }}>
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
