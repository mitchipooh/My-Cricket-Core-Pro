
import React, { useRef } from 'react';
import { Coordinates } from '../../types.ts';

interface FieldViewProps {
  shots?: { coords: Coordinates; color?: string }[];
  onRecord?: (coords: Coordinates) => void;
  readonly?: boolean;
}

export const FieldView: React.FC<FieldViewProps> = ({ shots = [], onRecord, readonly = false }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (readonly || !onRecord || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onRecord({ x, y });
  };

  return (
    <div className="relative aspect-square w-full max-w-[300px] mx-auto">
      <svg 
        ref={svgRef}
        viewBox="0 0 100 100" 
        className={`w-full h-full rounded-full bg-emerald-700 border-4 border-emerald-800 shadow-inner ${!readonly ? 'cursor-crosshair' : ''}`}
        onClick={handleClick}
      >
        {/* Field Markings */}
        <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="30" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" strokeDasharray="2 2" />
        <rect x="48" y="42" width="4" height="16" fill="#e2e8f0" rx="1" opacity="0.8" /> {/* Pitch */}

        {/* Shots */}
        {shots.map((shot, i) => (
          <g key={i}>
             <line x1="50" y1="50" x2={shot.coords.x} y2={shot.coords.y} stroke={shot.color || 'yellow'} strokeWidth="0.5" opacity="0.6" />
             <circle cx={shot.coords.x} cy={shot.coords.y} r="1.5" fill={shot.color || 'yellow'} stroke="white" strokeWidth="0.2" />
          </g>
        ))}
      </svg>
      <div className="absolute top-2 right-2 text-[8px] font-black text-white/50 uppercase tracking-widest pointer-events-none">
         Wagon Wheel
      </div>
    </div>
  );
};

