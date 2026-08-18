import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon, ICONS } from './Icon';

export default function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'Confirmar', 
  cancelText = 'Cancelar',
  type = 'danger' // 'danger' | 'warning' | 'info'
}) {
  // Manejo de teclado (Escape y Enter)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onConfirm, onCancel]);

  const config = {
    danger: {
      icon: ICONS.trash,
      color: 'text-[#EF4444]',
      bg: 'bg-[#EF4444]/15',
      border: 'border-[#EF4444]/30',
      btn: 'bg-[#EF4444] hover:bg-[#DC2626] text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
    },
    warning: {
      icon: ICONS.alert,
      color: 'text-[#F59E0B]',
      bg: 'bg-[#F59E0B]/15',
      border: 'border-[#F59E0B]/30',
      btn: 'bg-[#F59E0B] hover:bg-[#D97706] text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]'
    },
    info: {
      icon: ICONS.check,
      color: 'text-[#3B82F6]',
      bg: 'bg-[#3B82F6]/15',
      border: 'border-[#3B82F6]/30',
      btn: 'bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]'
    }
  };

  const style = config[type] || config.info;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
          {/* Backdrop con blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-[#0A0A0B]/80 backdrop-blur-sm"
          />

          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
            className="relative w-full max-w-md bg-[#141416] border border-[#242428] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Modal Body */}
            <div className="p-6 sm:p-8 flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border mb-6 ${style.bg} ${style.color} ${style.border}`}>
                <Icon path={style.icon} size={32} />
              </div>
              <h3 className="text-xl font-heading font-black tracking-wider text-white mb-2">{title}</h3>
              <p className="text-sm font-medium text-zinc-400 leading-relaxed">{message}</p>
            </div>

            {/* Modal Actions */}
            <div className="p-4 sm:px-8 sm:pb-8 flex flex-col sm:flex-row items-center gap-3 w-full">
              <button
                onClick={onCancel}
                className="w-full sm:w-1/2 py-3 px-4 rounded-xl text-sm font-bold uppercase tracking-wider text-white bg-[#1C1C20] border border-[#2D2D35] hover:bg-[#242428] hover:border-zinc-500 transition-all focus:outline-none"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`w-full sm:w-1/2 py-3 px-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all focus:outline-none ${style.btn}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
