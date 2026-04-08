import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, MoreVertical, Mic, Send } from 'lucide-react';
import { TranscriptEntry } from '../../store/useMeetingStore';

interface TranscriptSidebarProps {
    transcript: TranscriptEntry[];
    clearTranscript: () => void;
}

export const TranscriptSidebar: React.FC<TranscriptSidebarProps> = ({ transcript, clearTranscript }) => {
    const transcriptEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    return (
        <aside className="hidden lg:flex w-80 xl:w-96 flex-col gap-4">
            <div className="flex-grow bg-white rounded-3xl border border-gray-200 flex flex-col overflow-hidden shadow-sm">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><MessageSquare size={20} /></div>
                        <div>
                            <h2 className="font-bold text-gray-900 text-sm">Transcription</h2>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Real-time Stream</p>
                        </div>
                    </div>
                    <button
                        onClick={clearTranscript}
                        className="p-2 text-gray-300 hover:text-gray-500"
                    >
                        <MoreVertical size={20} />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto p-5 space-y-6 custom-scrollbar bg-white/50">
                    <AnimatePresence initial={false}>
                        {transcript.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20 px-6">
                                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4"><Mic size={32} className="text-gray-400" /></div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Listening for audio...</p>
                                <p className="text-[10px] text-gray-400 mt-2">Unmute your microphone to start the live transcription stream.</p>
                            </div>
                        ) : (
                            transcript.map((entry, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-2 group text-left"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">{entry.speakerId}</span>
                                        <span className="text-[9px] text-gray-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">{entry.timestamp}</span>
                                    </div>
                                    <p className="text-sm text-gray-700 leading-relaxed font-medium bg-gray-50 p-3 rounded-2xl border border-gray-100 shadow-sm">{entry.text}</p>
                                </motion.div>
                            ))
                        )}
                        <div ref={transcriptEndRef} />
                    </AnimatePresence>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Add tag or quick note..."
                            className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-4 pr-10 outline-none focus:border-blue-400 transition-all text-xs"
                        />
                        <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500">
                            <Send size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
};
