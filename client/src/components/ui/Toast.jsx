import React, { useEffect, useState } from 'react';
import { Icon, ICONS } from './Icon';

export function Toast({ message, type = 'info', onClose }) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 3200);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 250);
  };

  const getStyle = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-gradient-to-br from-[#10B981]/25 to-[#10B981]/5',
          text: 'text-[#10B981]',
          border: 'border-[#10B981]/40',
          glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]',
          progressBar: 'bg-[#10B981]',
          icon: ICONS.check,
          title: 'Confirmación'
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-br from-[#F59E0B]/25 to-[#F59E0B]/5',
          text: 'text-[#F59E0B]',
          border: 'border-[#F59E0B]/40',
          glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
          progressBar: 'bg-[#F59E0B]',
          icon: ICONS.bell,
          title: 'Alerta Operativa'
        };
      case 'error':
      case 'destructive':
        return {
          bg: 'bg-gradient-to-br from-[#EF4444]/25 to-[#EF4444]/5',
          text: 'text-[#EF4444]',
          border: 'border-[#EF4444]/40',
          glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
          progressBar: 'bg-[#EF4444]',
          icon: ICONS.trash,
          title: 'Error de Sistema'
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-[#E85D2F]/25 to-[#E85D2F]/5',
          text: 'text-[#E85D2F]',
          border: 'border-[#E85D2F]/40',
          glow: 'shadow-[0_0_20px_rgba(232,93,47,0.3)]',
          progressBar: 'bg-[#E85D2F]',
          icon: ICONS.burger,
          title: 'Notificación FastFood'
        };
    }
  };

  const style = getStyle();

  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col overflow-hidden bg-[#141416]/95 backdrop-blur-2xl text-white border border-[#242428] rounded-2xl ${style.glow} min-w-[380px] max-w-lg transition-all duration-300 ${isClosing ? 'opacity-0 -translate-y-6 scale-90' : 'animate-pop-in'}`}>
      
      {/* Top Accent Line */}
      <div className={`h-1 w-full ${style.progressBar}`} />

      <div className="flex items-center gap-4 px-6 py-4">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${style.bg} ${style.text} ${style.border} border shadow-inner transition-transform hover:scale-105`}>
          <Icon path={style.icon} size={22} />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-xs font-heading font-black uppercase tracking-wider text-white flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${style.progressBar} animate-pulse`} />
            {style.title}
          </p>
          <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed font-medium">
            {message}
          </p>
        </div>
        
        <button 
          onClick={handleClose} 
          className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Cerrar notificación"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
