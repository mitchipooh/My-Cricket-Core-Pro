
import React, { useRef } from 'react';
import { Coordinates } from '../../types.ts';

interface PitchViewProps {
  deliveries?: { coords: Coordinates; color?: string }[];
  onRecord?: (coords: Coordinates) => void;
  readonly?: boolean;
}

export const PitchView: React.FC<PitchViewProps> = ({ deliveries = [], onRecord, readonly = false }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (readonly || !onRecord || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 200;
    onRecord({ x, y });
  };

  return (
    <div className="relative aspect-[1/2] w-full max-w-[150px] mx-auto">
      <svg
        ref={svgRef}
        viewBox="0 0 100 200"
        className={`w-full h-full bg-[#d2b48c] border-2 border-[#b08d55] shadow-inner ${!readonly ? 'cursor-crosshair' : ''}`}
        onClick={handleClick}
      >
        {/* Pitch Markings */}
        {/* Crease Lines */}
        <line x1="10" y1="20" x2="90" y2="20" stroke="white" strokeWidth="1" /> {/* Bowling Crease Top */}
        <line x1="10" y1="40" x2="90" y2="40" stroke="white" strokeWidth="1" /> {/* Popping Crease Top */}

        <line x1="10" y1="180" x2="90" y2="180" stroke="white" strokeWidth="1" /> {/* Bowling Crease Bottom */}
        <line x1="10" y1="160" x2="90" y2="160" stroke="white" strokeWidth="1" /> {/* Popping Crease Bottom */}

        {/* Stumps */}
        <rect x="48" y="10" width="4" height="10" fill="#333" />
        <rect x="48" y="180" width="4" height="10" fill="#333" />

        {/* Zones (Subtle overlay) */}
        <rect x="0" y="40" width="100" height="70" fill="#f59e0b" fillOpacity="0.1" /> {/* Short: 40 to 110 */}
        <rect x="0" y="110" width="100" height="30" fill="#10b981" fillOpacity="0.1" /> {/* BOL: 110 to 140 */}
        <rect x="0" y="140" width="100" height="20" fill="#06b6d4" fillOpacity="0.1" /> {/* Full: 140 to 160 */}

        {/* Zone Labels */}
        <text x="5" y="105" fontSize="4" fontWeight="bold" fill="#f59e0b" opacity="0.4" pointerEvents="none">SHORT</text>
        <text x="5" y="135" fontSize="4" fontWeight="bold" fill="#10b981" opacity="0.4" pointerEvents="none">BOL</text>
        <text x="5" y="155" fontSize="4" fontWeight="bold" fill="#06b6d4" opacity="0.4" pointerEvents="none">FULL</text>

        {/* Deliveries */}
        {deliveries.map((ball, i) => (
          <circle key={i} cx={ball.coords.x} cy={ball.coords.y} r="3" fill={ball.color || 'red'} stroke="black" strokeWidth="0.5" />
        ))}
      </svg>
      <div className="absolute top-2 left-2 text-[8px] font-black text-black/30 uppercase tracking-widest pointer-events-none rotate-90 origin-top-left translate-x-4">
        Pitch Map
      </div>
    </div>
  );
};

