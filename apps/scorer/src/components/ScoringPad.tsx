
import React from 'react';
import { MainPad } from './scoring-pad/MainPad';
import { MobileScoringPad } from './scoring-pad/MobileScoringPad';
import { ExtrasPad } from './scoring-pad/ExtrasPad';
import { EventsPad } from './scoring-pad/EventsPad';
import { ConfirmationPad } from './scoring-pad/ConfirmationPad';
import { ScoringPadProps } from './scoring-pad/types';

export type { ScoringPadProps };

export const ScoringPad: React.FC<ScoringPadProps> = (props) => {
  const { padView, onBack } = props;

  if (padView === 'main') {
    return (
      <>
        <div className="md:hidden h-full w-full">
          <MobileScoringPad {...props} />
        </div>
        <div className="hidden md:block h-full w-full">
          <MainPad {...props} />
        </div>
      </>
    );
  }

  if (padView === 'extras') {
    return <ExtrasPad {...props} />;
  }

  if (padView === 'events') {
    return <EventsPad {...props} />;
  }

  if (padView === 'declare_confirm' || padView === 'end_match_confirm') {
    return <ConfirmationPad {...props} />;
  }

  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-4 bg-slate-900 rounded-xl border border-slate-800">
      <div className="text-2xl mb-2 opacity-20">⚙️</div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">View Not Ready</p>
      <button onClick={onBack} className="mt-4 px-6 py-2 bg-slate-800 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all">Back</button>
    </div>
  );
};

