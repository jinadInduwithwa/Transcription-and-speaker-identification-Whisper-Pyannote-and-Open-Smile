import React, { useRef, useEffect } from 'react';
import { MicOff } from 'lucide-react';
import { Participant } from '../store/useMeetingStore';

interface ParticipantCardProps {
  participant: Participant;
  isLocal?: boolean;
  isVideoOff?: boolean;
  isSmall?: boolean;
  localVideoRef?: React.RefObject<HTMLVideoElement | null>;
}

export const ParticipantCard: React.FC<ParticipantCardProps> = ({ 
  participant, 
  isLocal, 
  isVideoOff, 
  isSmall,
  localVideoRef 
}) => {
  return (
    <div 
      className={`relative rounded-2xl overflow-hidden bg-[var(--bg-surface)] border-2 transition-all duration-300 flex-shrink-0 ${
        participant.isSpeaking ? 'border-[var(--accent-blue)] ring-4 ring-blue-500/10' : 'border-transparent'
      } ${isSmall ? 'h-32 w-full' : 'aspect-video w-full'}`}
    >
      <div className="absolute inset-0 w-full h-full">
        {isLocal && !isVideoOff ? (
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover mirror bg-black" 
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--bg-sidebar)]">
            {participant.avatar ? (
              <img 
                src={participant.avatar} 
                className={`${isSmall ? 'w-10 h-10' : 'w-20 h-20'} rounded-full border-2 border-[var(--border-color)] shadow-xl`} 
                alt={participant.name} 
              />
            ) : (
              <div className={`${isSmall ? 'w-10 h-10 text-xs' : 'w-20 h-20 text-xl'} rounded-full bg-[var(--bg-surface)] flex items-center justify-center border border-[var(--border-color)]`}>
                <span className="font-black text-[var(--text-dim)] uppercase">
                  {participant.name === 'You (Local)' ? 'YOU' : participant.name.substring(0,2)}
                </span>
              </div>
            )}
            {/* Centered name removed to avoid overlap in narrow views */}
          </div>
        )}
      </div>
      
      {/* Participant Name Badge */}
      <div className={`absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-[var(--bg-main)]/80 backdrop-blur-md rounded-lg border border-white/5 font-black uppercase tracking-widest z-10 ${isSmall ? 'text-[7px]' : 'text-[9px]'}`}>
        <span className="truncate max-w-[120px]">{participant.name}</span>
        {participant.muted && <MicOff size={isSmall ? 8 : 10} className="text-rose-500" />}
      </div>
      
      {/* Speaking Indicator */}
      {participant.isSpeaking && (
        <div className={`absolute top-3 right-3 px-2 py-1 bg-[var(--accent-blue)] rounded font-black uppercase tracking-widest text-white shadow-lg z-10 animate-pulse ${isSmall ? 'text-[7px]' : 'text-[8px]'}`}>
          {isSmall ? '' : 'Speaking'}
        </div>
      )}
    </div>
  );
};
