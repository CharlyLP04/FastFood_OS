import React from 'react';
import { Icon, ICONS } from './Icon';

export default function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-screen bg-[#0A0A0B] text-white">
      <div className="relative flex items-center justify-center w-24 h-24 mb-6">
        {/* Anillo exterior animado */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#E85D2F] border-r-[#E85D2F] opacity-70 animate-spin" style={{ animationDuration: '1.5s' }} />
        {/* Anillo interior animado en dirección contraria */}
        <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-[#DC2626] border-l-[#DC2626] opacity-50 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
        {/* Icono central */}
        <div className="relative bg-[#141416] w-12 h-12 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(232,93,47,0.3)]">
          <Icon path={ICONS.burger} size={24} className="text-[#E85D2F] animate-pulse" />
        </div>
      </div>
      
      <h2 className="text-xl font-heading font-black tracking-wider uppercase mb-2">
        <span className="text-[#E85D2F]">FastFood</span> OS
      </h2>
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <p className="mt-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">
        Inicializando Módulos...
      </p>
    </div>
  );
}
