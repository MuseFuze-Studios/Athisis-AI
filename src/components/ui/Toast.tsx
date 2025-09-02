import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, Info, XCircle } from 'lucide-react';
import { clsx } from 'clsx';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface ToastProps {
  messages: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ messages, onDismiss }) => {
  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col-reverse items-end space-y-3">
      <AnimatePresence>
        {messages.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.5 }}
            transition={{ duration: 0.3 }}
            className={clsx(
              "flex items-center p-4 rounded-lg shadow-lg text-white max-w-xs w-full",
              {
                'bg-green-600': toast.type === 'success',
                'bg-blue-600': toast.type === 'info',
                'bg-red-600': toast.type === 'error',
              }
            )}
          >
            <div className="flex-shrink-0 mr-3">
              {toast.type === 'success' && <CheckCircle size={20} />}
              {toast.type === 'info' && <Info size={20} />}
              {toast.type === 'error' && <XCircle size={20} />}
            </div>
            <div className="flex-grow text-sm font-medium">
              {toast.message}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="ml-4 flex-shrink-0 text-white opacity-75 hover:opacity-100"
            >
              <XCircle size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};