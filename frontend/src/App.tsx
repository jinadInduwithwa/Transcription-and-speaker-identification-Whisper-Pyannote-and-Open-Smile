import React from 'react';
import { useSpeechSocket } from './hooks/useSpeechSocket';
import RecordButton from './components/RecordButton';
import TranscriptArea from './components/TranscriptArea';
import FeatureDashboard from './components/FeatureDashboard';
import { Activity, Mic, Waves, Radio } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatusBadgeProps {
  isConnected: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ isConnected }) => (
  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border transition-all duration-500 ${
    isConnected 
        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
        : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
  }`}>
    <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-400'} ${isConnected ? 'animate-pulse' : ''}`} />
    {isConnected ? 'Backend Online' : 'Backend Offline'}
  </div>
);

function App() {
  const {
    isRecording,
    isConnected,
    transcript,
    acousticFeatures,
    startRecording,
    stopRecording
  } = useSpeechSocket();

  return (
    <div className="min-h-screen p-8 lg:p-12 font-sans grid grid-cols-1 lg:grid-cols-12 gap-12 bg-[#020617]">
      {/* Background Decorative Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[10%] left-[10%] w-[40rem] h-[40rem] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[10%] right-[10%] w-[35rem] h-[35rem] bg-fuchsia-500/10 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
      </div>

      {/* Sidebar / Left Column */}
      <div className="lg:col-span-4 flex flex-col gap-10">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500 rounded-2xl shadow-lg shadow-cyan-500/20">
                <Radio className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tighter italic text-slate-100 uppercase">
                Aether<span className="text-cyan-500">Node</span>
              </h1>
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-slate-500">Real-Time Speech Intel</p>
            </div>
          </div>
          <StatusBadge isConnected={isConnected} />
        </motion.div>

        <div className="flex-grow flex items-center justify-center py-10">
          <RecordButton 
            isRecording={isRecording}
            onStart={startRecording}
            onStop={stopRecording}
          />
        </div>

        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
        >
          <FeatureDashboard 
            pitch={acousticFeatures.pitch} 
            energy={acousticFeatures.energy} 
          />
        </motion.div>
      </div>

      {/* Main Content / Right Column */}
      <div className="lg:col-span-8 flex flex-col h-full min-h-[600px]">
        <TranscriptArea transcript={transcript} />
      </div>

      {/* Footer Info */}
      <div className="lg:col-span-12 flex justify-between items-center text-[10px] text-slate-500 font-bold tracking-widest uppercase border-t border-white/5 pt-8 mt-4">
        <div className="flex gap-4">
            <span className="flex items-center gap-1"><Mic className="w-3 h-3" /> 16kHz MONO</span>
            <span className="flex items-center gap-1"><Waves className="w-3 h-3" /> 16-BIT PCM</span>
            <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> WHISPER V3</span>
        </div>
        <div>
            &copy; 2026 RESEARCH ARCHIVE
        </div>
      </div>
    </div>
  );
}

export default App;
