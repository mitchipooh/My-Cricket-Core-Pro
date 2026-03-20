
import React, { useState } from 'react';
import { GameIssue } from '../../types';

interface IssueResolutionModalProps {
    issue: GameIssue | null;
    isOpen: boolean;
    onClose: () => void;
    onResolve: (issueId: string, resolution: 'UPHELD' | 'DISMISSED' | 'ACKNOWLEDGED', response: string) => void;
}

export const IssueResolutionModal: React.FC<IssueResolutionModalProps> = ({
    issue,
    isOpen,
    onClose,
    onResolve
}) => {
    const [response, setResponse] = useState('');

    if (!isOpen || !issue) return null;

    const handleSubmit = (resolution: 'UPHELD' | 'DISMISSED' | 'ACKNOWLEDGED') => {
        onResolve(issue.id, resolution, response);
        onClose();
        setResponse('');
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">

                {/* HEADER */}
                <div className="p-8 pb-4 shrink-0">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 ${issue.type === 'PROTEST' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                                }`}>
                                {issue.type}
                            </span>
                            <h2 className="text-3xl font-black text-slate-900 leading-tight">{issue.title}</h2>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
                                {new Date(issue.timestamp).toLocaleString()} • ID: {issue.id}
                            </p>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 flex items-center justify-center transition-colors font-bold">✕</button>
                    </div>
                </div>

                {/* SCROLLABLE CONTENT */}
                <div className="px-8 overflow-y-auto custom-scrollbar space-y-8 pb-8">

                    {/* DESCRIPTION */}
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        <p className="font-bold text-slate-700 leading-relaxed whitespace-pre-wrap">{issue.description}</p>
                    </div>

                    {/* EVIDENCE */}
                    {issue.evidenceUrls && issue.evidenceUrls.length > 0 && (
                        <div>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Evidence Attached</h3>
                            <div className="grid gap-4">
                                {issue.evidenceUrls.map((url, idx) => (
                                    <div key={idx} className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                                        {url.toLowerCase().endsWith('.pdf') || url.includes('application/pdf') ? (
                                            <iframe src={url} className="w-full h-64 bg-white" title="Evidence PDF" />
                                        ) : (
                                            <img src={url} className="w-full h-auto object-contain max-h-96" alt="Evidence" />
                                        )}
                                        <div className="px-4 py-2 bg-white flex justify-end">
                                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-700">Open Original ↗</a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ADMIN ACTION AREA */}
                    {issue.status !== 'RESOLVED' && issue.status !== 'DISMISSED' ? (
                        <div className="pt-6 border-t-2 border-slate-100">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Official Resolution</h3>
                            <textarea
                                value={response}
                                onChange={e => setResponse(e.target.value)}
                                placeholder="Enter your official response or reasoning here..."
                                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 h-32 resize-none mb-6 active:scale-[0.99] transition-transform"
                            />

                            {issue.type === 'PROTEST' ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => handleSubmit('DISMISSED')}
                                        disabled={!response.trim()}
                                        className="py-4 bg-red-100 text-red-600 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-red-200 transition-colors disabled:opacity-50 disabled:grayscale"
                                    >
                                        👎 Dismiss Protest (Lost)
                                    </button>
                                    <button
                                        onClick={() => handleSubmit('UPHELD')}
                                        disabled={!response.trim()}
                                        className="py-4 bg-emerald-500 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:grayscale"
                                    >
                                        👍 Uphold Protest (Won)
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleSubmit('ACKNOWLEDGED')}
                                    disabled={!response.trim()}
                                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:grayscale"
                                >
                                    ✓ Mark as Resolved
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="pt-6 border-t-2 border-slate-100">
                            <div className={`p-6 rounded-2xl border ${issue.resolution === 'UPHELD' ? 'bg-emerald-50 border-emerald-100' : issue.resolution === 'DISMISSED' ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-200'}`}>
                                <div className="flex justify-between items-center mb-4">
                                    <span className={`text-xs font-black uppercase tracking-widest ${issue.resolution === 'UPHELD' ? 'text-emerald-600' : issue.resolution === 'DISMISSED' ? 'text-red-600' : 'text-slate-500'}`}>
                                        Resolution: {issue.resolution}
                                    </span>
                                    {issue.resolvedAt && <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(issue.resolvedAt).toLocaleString()}</span>}
                                </div>
                                <p className="font-bold text-slate-700">{issue.adminResponse}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
