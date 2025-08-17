import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ToastMessage } from '../components/ui/Toast';

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'info', duration: number = 3000) => {
    const id = uuidv4();
    const newToast: ToastMessage = { id, message, type };
    setToasts((prevToasts) => [...prevToasts, newToast]);

    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    }, duration);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return { toasts, showToast, dismissToast };
}