
import React, { useEffect, useState } from 'react';
import { offlineQueue, Mutation } from '@shared/services/offlineQueue.ts';

export const NetworkStatus: React.FC = () => {
  const [status, setStatus] = useState({
    pendingCount: 0,
    isOnline: navigator.onLine,
    isProcessing: false
  });

  useEffect(() => {
    const unsub = offlineQueue.subscribe((queue, isOnline) => {
      setStatus({
        pendingCount: queue.length,
        isOnline,
        isProcessing: offlineQueue.getStatus().isProcessing
      });
    });
    return unsub;
  }, []);

  // Determine State
  const isSynced = status.pendingCount === 0;
  const isOffline = !status.isOnline;

  return (
    <div className={`
      flex items-center gap-3 px-4 py-2 rounded-full border shadow-lg backdrop-blur-md transition-all duration-500
      ${isOffline 
        ? 'bg-red-500/10 border-red-500/50 text-red-500' 
        : status.isProcessing 
          ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-500'
          : isSynced
            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500'
            : 'bg-amber-500/10 border-amber-500/50 text-amber-500'
      }
    `}>
      <div className="relative">
        {isOffline ? (
           <span className="text-lg">☁️</span>
        ) : status.isProcessing ? (
           <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
        ) : isSynced ? (
           <span className="text-lg">☁️</span>
        ) : (
           <span className="text-lg">📤</span>
        )}
        
        {/* Status Dot */}
        <div className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white ${isOffline ? 'bg-red-500' : isSynced ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
      </div>

      <div className="flex flex-col leading-none">
        <span className="text-[10px] font-black uppercase tracking-widest">
            {isOffline ? 'Offline' : status.isProcessing ? 'Syncing...' : isSynced ? 'Cloud Synced' : 'Changes Pending'}
        </span>
        {!isSynced && (
            <span className="text-[9px] font-bold opacity-80">
                {status.pendingCount} action{status.pendingCount !== 1 ? 's' : ''} queued
            </span>
        )}
      </div>
    </div>
  );
};

