
import React from 'react';
import { Organization, UserProfile } from '../../types.ts';
import { Can } from '../common/Can.tsx';

interface OrgCardProps {
  org: Organization;
  userRole: UserProfile['role'];
  onOpen: (id: string) => void;
  onDeleteRequest: (org: Organization) => void;
}

export const OrgCard: React.FC<OrgCardProps> = ({ org, userRole, onOpen, onDeleteRequest }) => {
  const isClub = org.type === 'CLUB';

  return (
    <div
      onClick={() => onOpen(org.id)}
      className="group bg-white border border-slate-200 p-3 md:p-4 rounded-2xl hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-100 transition-all cursor-pointer relative overflow-hidden h-full flex flex-col"
    >
      <div className="absolute -top-1 -right-1 p-2 md:p-3 opacity-[0.05] text-4xl md:text-5xl font-black text-slate-900 group-hover:opacity-[0.08] transition-opacity select-none italic">
        {org.name.charAt(0)}
      </div>
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-2">
          <div className={`w-8 h-8 md:w-10 md:h-10 border rounded-xl flex items-center justify-center text-lg md:text-xl shadow-sm group-hover:scale-110 transition-transform duration-300 ${isClub ? 'bg-emerald-50 border-emerald-100 text-emerald-500' : 'bg-purple-50 border-purple-100 text-purple-500'}`}>
            {isClub ? '🛡️' : '🏛️'}
          </div>
          <Can role={userRole} perform="org:delete">
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteRequest(org); }}
              className="text-slate-300 hover:text-red-500 p-1 transition-colors text-xs"
            >
              ✕
            </button>
          </Can>
        </div>

        <div className="mb-1 flex items-center gap-1.5 flex-wrap">
          {isClub ? (
            <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[7px] md:text-[8px] font-black uppercase tracking-wider">Club</span>
          ) : (
            <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[7px] md:text-[8px] font-black uppercase tracking-wider">Org</span>
          )}
          <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">
            {org.country || 'Global'}
          </span>
        </div>

        <h3 className="text-xs md:text-sm font-black text-slate-900 mb-2 tracking-tight line-clamp-2 leading-tight flex-1">{org.name}</h3>

        <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-auto">
          <div className="text-center flex-1">
            <div className="text-sm md:text-base font-black text-slate-900 leading-none">{org.memberTeams.length + (org.childOrgIds?.length || 0)}</div>
            <div className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Squads</div>
          </div>
          <div className="w-px h-4 bg-slate-100 mx-2"></div>
          {(!isClub || org.tournaments.length > 0) && (
            <>
              <div className="text-center flex-1">
                <div className="text-sm md:text-base font-black text-slate-900 leading-none">{org.tournaments.length}</div>
                <div className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">{isClub ? 'Leagues' : 'Seasons'}</div>
              </div>
              <div className="w-px h-4 bg-slate-100 mx-2"></div>
            </>
          )}
          <div className="text-center flex-1">
            <div className="text-sm md:text-base font-black text-slate-900 leading-none">{org.establishedYear || '---'}</div>
            <div className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">EST.</div>
          </div>
        </div>
      </div>
    </div>

  );
};

