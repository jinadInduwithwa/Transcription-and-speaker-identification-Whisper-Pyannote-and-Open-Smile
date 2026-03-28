import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TranscriptSegment } from '../hooks/useSpeechSocket';

interface SpeakerBadgeProps {
  speakerId: string;
}

const SpeakerBadge: React.FC<SpeakerBadgeProps> = ({ speakerId }) => {
  const colors: Record<string, string> = {
    '1': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    '2': 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30',
    '3': 'bg-lime-500/20 text-lime-400 border-lime-500/30',
    'default': 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  };
  
  const color = colors[speakerId] || colors['default'];
  
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border transition-all ${color}`}>
      Speaker {speakerId}
    </span>
  );
};

interface TranscriptAreaProps {
  transcript: TranscriptSegment[];
}

const TranscriptArea: React.FC<TranscriptAreaProps> = ({ transcript }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <div className="flex flex-col h-full glass rounded-3xl overflow-hidden border border-white/10 shadow-2xl transition-all duration-500">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
        <h3 className="text-sm font-bold tracking-widest uppercase text-slate-400">Live Transcript</h3>
        <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-cyan-500/30" />
            <div className="w-2 h-2 rounded-full bg-cyan-500/10" />
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-grow p-6 overflow-y-auto custom-scrollbar space-y-4"
      >
        <AnimatePresence initial={false}>
          {transcript.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-600 italic">
                Waiting for speech...
            </div>
          ) : (
            transcript.map((item, idx) => (
              <motion.div
                key={`${idx}-${item.timestamp}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-1"
              >
                <div className="flex items-center gap-2">
                  <SpeakerBadge speakerId={item.speaker_id} />
                  <span className="text-[10px] text-slate-500 font-medium">
                    {item.timestamp}
                  </span>
                </div>
                <p className="text-lg font-medium leading-relaxed max-w-[90%] text-slate-200">
                  {item.text}
                </p>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TranscriptArea;
