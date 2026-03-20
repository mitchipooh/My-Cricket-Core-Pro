
import React, { useState } from 'react';
import { PlayerWithContext, Team, Organization } from '@shared/types';

interface ContractModalProps {
  player: PlayerWithContext;
  isOpen: boolean;
  onClose: () => void;
  myTeams: Team[];
  onSign: (playerId: string, toTeamId: string) => void;
}

export const ContractModal: React.FC<ContractModalProps> = ({ player, isOpen, onClose, myTeams, onSign }) => {
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [offerAmount, setOfferAmount] = useState('');
  const [contractType, setContractType] = useState<'PERMANENT' | 'LOAN'>('PERMANENT');
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [negotiationResult, setNegotiationResult] = useState<'SUCCESS' | 'FAILURE' | null>(null);

  if (!isOpen) return null;

  const handleOffer = () => {
    if (!selectedTeamId) return;
    
    setIsNegotiating(true);
    
    // Simulate API/AI Negotiation
    setTimeout(() => {
        setIsNegotiating(false);
        setNegotiationResult('SUCCESS'); // Always succeed for demo
        
        // Auto close after success
        setTimeout(() => {
            onSign(player.id, selectedTeamId);
            onClose();
        }, 1500);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
            <div className="relative z-10">
                <div className="w-20 h-20 mx-auto bg-white p-1 rounded-full shadow-lg mb-4">
                    <img src={player.photoUrl || `https://ui-avatars.com/api/?name=${player.name}`} className="w-full h-full rounded-full object-cover" />
                </div>
                <h2 className="text-2xl font-black text-white">{player.name}</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{player.role} • {player.teamName || 'Free Agent'}</p>
            </div>
            <div className="absolute inset-0 bg-indigo-600/20 opacity-50"></div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
            {!isNegotiating && !negotiationResult && (
                <>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Destination Team</label>
                        <select 
                            value={selectedTeamId} 
                            onChange={(e) => setSelectedTeamId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 outline-none focus:border-indigo-500 transition-all"
                        >
                            <option value="">Select a squad...</option>
                            {myTeams.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Contract Type</label>
                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                <button onClick={() => setContractType('PERMANENT')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${contractType === 'PERMANENT' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>Full</button>
                                <button onClick={() => setContractType('LOAN')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${contractType === 'LOAN' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>Loan</button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Fee / Salary ($)</label>
                            <input 
                                type="number" 
                                value={offerAmount}
                                onChange={(e) => setOfferAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 outline-none focus:border-indigo-500 transition-all"
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleOffer}
                        disabled={!selectedTeamId}
                        className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:shadow-none"
                    >
                        Submit Offer
                    </button>
                </>
            )}

            {isNegotiating && (
                <div className="py-12 text-center">
                    <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                    <h3 className="text-xl font-black text-slate-900">Negotiating Terms...</h3>
                    <p className="text-slate-500 text-xs mt-2">Agent is reviewing your proposal.</p>
                </div>
            )}

            {negotiationResult === 'SUCCESS' && (
                <div className="py-12 text-center animate-in zoom-in">
                    <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-4xl text-white mx-auto mb-6 shadow-xl shadow-emerald-200">🤝</div>
                    <h3 className="text-2xl font-black text-slate-900">Deal Sealed!</h3>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">{player.name} has joined the squad.</p>
                </div>
            )}
        </div>
        
        {/* Footer */}
        {!isNegotiating && !negotiationResult && (
            <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                <button onClick={onClose} className="text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600">Cancel Negotiation</button>
            </div>
        )}
      </div>
    </div>
  );
};

