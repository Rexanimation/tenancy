import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';

interface MoneyCorporateLoaderProps {
  message?: string;
}

export default function MoneyCorporateLoader({ message }: MoneyCorporateLoaderProps) {
  const [statusText, setStatusText] = useState('Initializing secure interface...');
  
  const statuses = [
    'Establishing secure protocol...',
    'Synchronizing corporate ledger...',
    'Verifying cryptographic tokens...',
    'Connecting to banking portal...',
    'Encrypting session vault...',
    'Optimizing transaction engine...',
  ];

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % statuses.length;
      setStatusText(statuses[index]);
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 text-white font-sans overflow-hidden">
      {/* Dynamic Animated Tech Backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.08),transparent_70%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20" />
      
      {/* Elegant Glowing Circular Track & Rotating Coin */}
      <div className="relative flex items-center justify-center w-40 h-40 mb-8">
        {/* Glow behind */}
        <div className="absolute w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
        
        {/* Dynamic Glowing Segments */}
        <div className="absolute inset-0 border-2 border-emerald-500/10 rounded-full" />
        <div className="absolute inset-0 border-t-2 border-r-2 border-emerald-400 rounded-full animate-spin [animation-duration:1.5s]" />
        <div className="absolute inset-2 border-b-2 border-l-2 border-amber-500/50 rounded-full animate-spin [animation-duration:2.5s] [animation-direction:reverse]" />

        {/* 3D Spinning Gold Metallic Coin */}
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 p-[3px] shadow-[0_0_20px_rgba(245,158,11,0.5)] select-none animate-[coin-spin_2s_infinite_linear]">
          <div className="w-full h-full rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-inner">
            <span className="text-amber-950 font-black text-3xl select-none drop-shadow-[0_1.5px_1px_rgba(255,255,255,0.6)]">$</span>
          </div>
        </div>

        {/* Orbiting Tech Particles */}
        <div className="absolute w-2 h-2 bg-emerald-400 rounded-full animate-[ping_1.5s_infinite] top-6 left-6" />
        <div className="absolute w-1.5 h-1.5 bg-amber-400 rounded-full animate-[ping_2s_infinite] bottom-8 right-6" />
      </div>

      {/* Corporate branding & status */}
      <div className="relative z-10 flex flex-col items-center max-w-sm px-6 text-center">
        <div className="flex items-center gap-2 mb-2 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
          <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold tracking-widest text-slate-400 uppercase">Secure Ledger Portal</span>
        </div>

        <h3 className="text-lg font-bold tracking-tight text-white mb-1">
          {message || 'Authorizing Session'}
        </h3>
        
        <p className="text-sm text-emerald-400/90 font-mono h-6 transition-all duration-300 animate-pulse">
          {statusText}
        </p>

        {/* Progress Bar Container */}
        <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden mt-6 border border-slate-700/50">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full animate-[loading-progress_2.5s_infinite_ease-in-out]" />
        </div>
      </div>
    </div>
  );
}
