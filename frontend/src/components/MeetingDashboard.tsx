import React, { useEffect, useRef, useState } from 'react';
import {
  MessageSquare, Radio, Settings, Monitor, MonitorOff, Play, Square, PhoneOff, Users, ChevronRight, Activity, Info,
  Mic, MicOff, Video, VideoOff, Layout, Wifi, WifiOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMeetingStore } from '../store/useMeetingStore';
import { useSpeechSocket } from '../hooks/useSpeechSocket';
import { ParticipantCard } from './ParticipantCard';
import { SettingsDock } from './SettingsDock';

export const MeetingDashboard: React.FC = () => {
  const {
    theme, isLeftSidebarOpen, toggleLeftSidebar, isRightSidebarOpen, toggleRightSidebar,
    isRecording, toggleRecording,
    isVideoOff, toggleVideo,
    isSharingScreen, toggleScreenShare,
    gridDensity,
    participants, updateParticipantSpeaking,
    transcript, addTranscriptEntry, clearTranscript
  } = useMeetingStore();

  // Real-time WebSocket transcription (connects on mount, mic starts muted)
  const {
    isMicActive,
    isConnected,
    transcript: wsTranscript,
    acousticFeatures,
    toggleMic,
  } = useSpeechSocket();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  // Apply Theme 
  useEffect(() => {
    const classMap: Record<string, string> = { default: '', obsidian: 'theme-obsidian', ocean: 'theme-ocean', light: 'theme-light' };
    Object.values(classMap).forEach(c => c && document.body.classList.remove(c));
    if (classMap[theme]) document.body.classList.add(classMap[theme]);
  }, [theme]);

  // Handle Click Outside settings
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setIsSettingsOpen(false);
    };
    if (isSettingsOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSettingsOpen]);

  // Video and Screen Capture
  useEffect(() => {
    let stream: MediaStream | null = null;
    const startVideo = async () => {
      try {
        if (!isVideoOff) {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        } else if (localVideoRef.current) localVideoRef.current.srcObject = null;
      } catch (err) { console.error("Camera denied:", err); }
    };
    startVideo();
    return () => stream?.getTracks().forEach(t => t.stop());
  }, [isVideoOff]);

  useEffect(() => {
    const startScreen = async () => {
      if (isSharingScreen && !screenStream) {
        try {
          const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          setScreenStream(stream);
          if (screenVideoRef.current) screenVideoRef.current.srcObject = stream;
          stream.getTracks()[0].onended = () => { setScreenStream(null); if (isSharingScreen) toggleScreenShare(); };
        } catch (err) { console.error("Screen Share denied:", err); toggleScreenShare(); }
      } else if (!isSharingScreen && screenStream) {
        screenStream.getTracks().forEach(t => t.stop());
        setScreenStream(null);
      }
    };
    startScreen();
  }, [isSharingScreen, toggleScreenShare, screenStream]);

  // Scroll transcript to bottom
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [transcript]);

  // Sync WebSocket transcript into the Zustand store
  useEffect(() => {
    if (wsTranscript.length > 0) {
      const latest = wsTranscript[wsTranscript.length - 1];
      addTranscriptEntry({
        speakerName: `Speaker ${latest.speaker_id}`,
        speakerId: latest.speaker_id,
        text: latest.text,
      });
    }
  }, [wsTranscript, addTranscriptEntry]);

  // Handle footer Mic button — toggles real mic streaming
  const handleMicToggle = async () => {
    await toggleMic();
  };

  // Density Mapping
  const densityStyles = {
    compact: { gap: 'gap-3', padding: 'p-3' },
    standard: { gap: 'gap-6', padding: 'p-6' },
    relaxed: { gap: 'gap-10', padding: 'p-10' }
  }[gridDensity];

  return (
    <div className="flex h-screen bg-[var(--bg-main)] text-[var(--text-main)] overflow-hidden font-sans select-none transition-colors duration-500">

      {/* LEFT SIDEBAR: PARTICIPANT HUB */}
      <aside className={`flex flex-col bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] transition-all duration-500 overflow-hidden ${isLeftSidebarOpen ? 'w-80' : 'w-0'}`}>
        <div className="h-16 flex items-center px-6 border-b border-[var(--border-color)] flex-shrink-0">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)] flex items-center gap-2">
            <Users size={14} className="text-[var(--accent-blue)]" />
            Active Nodes
          </h2>
        </div>
        <div className="flex-grow overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3">
          {participants.map(p => (
            <ParticipantCard
              key={p.id}
              participant={p}
              isLocal={p.id === 'me'}
              isVideoOff={isVideoOff}
              isSmall={true}
              localVideoRef={p.id === 'me' ? localVideoRef : undefined}
            />
          ))}
          <div className="p-4 rounded-2xl border border-dashed border-white/5 opacity-20 flex flex-col items-center justify-center text-center">
            <Activity size={16} className="mb-2" />
            <span className="text-[8px] font-black uppercase tracking-widest">Awaiting Identity</span>
          </div>
        </div>
      </aside>

      <div className="flex-grow flex flex-col relative overflow-hidden transition-all duration-500">

        {/* Dashboard Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-[var(--bg-sidebar)] border-b border-[var(--border-color)] z-40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[var(--accent-blue)] flex items-center justify-center flex-shrink-0"><Radio size={16} className="text-white" /></div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-sm tracking-tight truncate max-w-[150px]">Executive Intelligence</h1>
              <div className="flex items-center gap-2 text-[10px] text-[var(--text-dim)] font-black uppercase tracking-widest leading-none mt-0.5"><span className="text-emerald-500">Secure Node</span><span>•</span><span>03:10:45</span></div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 px-2">
            {/* Record session button */}
            <button onClick={toggleRecording} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 ${isRecording ? 'bg-rose-500/10 border-rose-500 text-rose-500 shadow-lg' : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-dim)]'}`}>
              <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-rose-500 animate-pulse' : 'bg-slate-500'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest hidden xs:inline">{isRecording ? 'STOP' : 'START'} REC</span>
              {isRecording ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
            </button>

            {/* WebSocket Connection Status — always visible */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-500 ${isConnected ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' : 'border-rose-500/30 bg-rose-500/5 text-rose-400 animate-pulse'}`}>
              {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
              <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">{isConnected ? 'LIVE' : 'RECONNECTING...'}</span>
            </div>

            {/* Mic Status Badge */}
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isMicActive ? 'text-cyan-400' : 'text-slate-600'}`}>
              {isMicActive ? <Mic size={12} /> : <MicOff size={12} />}
              <span className="hidden sm:inline">{isMicActive ? 'MIC ON' : 'MIC OFF'}</span>
            </div>

            <div className="w-px h-6 bg-[var(--border-color)]" />

            {/* SEPARATE SETTINGS COMPONENT */}
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`p-2 rounded-xl border transition-all ${isSettingsOpen ? 'bg-[var(--accent-blue)] text-white border-transparent' : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-dim)]'}`}
              >
                <Settings size={18} />
              </button>
              <AnimatePresence>
                {isSettingsOpen && <SettingsDock onClose={() => setIsSettingsOpen(false)} />}
              </AnimatePresence>
            </div>

            <div className="w-px h-6 bg-[var(--border-color)]" />

            <button
              onClick={toggleLeftSidebar}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${isLeftSidebarOpen ? 'bg-[var(--accent-blue)] text-white border-transparent shadow-lg' : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-dim)]'}`}
            >
              <Users size={16} />
            </button>

            <button
              onClick={toggleRightSidebar}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${isRightSidebarOpen ? 'bg-[var(--accent-blue)] text-white border-transparent shadow-lg' : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-dim)]'}`}
            >
              <Layout size={16} />
            </button>
          </div>
        </header>

        {/* Intelligence Main Hub */}
        <div className={`flex-grow flex ${densityStyles.padding} overflow-hidden bg-black/5`}>

          <div className="flex-grow flex flex-col gap-6 overflow-hidden min-w-0">
            {isSharingScreen ? (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex-grow relative rounded-3xl bg-black border-2 border-[var(--accent-blue)] overflow-hidden shadow-2xl min-h-0">
                <video ref={screenVideoRef} autoPlay playsInline className="w-full h-full object-contain" />
                <div className="absolute top-4 left-4 px-3 py-1 bg-blue-600 rounded text-[10px] font-black uppercase shadow-lg flex items-center gap-2"><Monitor size={14} /> Shared Workspace View</div>
              </motion.div>
            ) : (
              <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 content-start overflow-y-auto custom-scrollbar p-2 h-full">
                {participants.map(p => (
                  <ParticipantCard
                    key={p.id}
                    participant={p}
                    isLocal={p.id === 'me'}
                    isVideoOff={isVideoOff}
                    localVideoRef={p.id === 'me' ? localVideoRef : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Consoles */}
        <div className="h-20 flex items-center justify-center gap-2 sm:gap-3 bg-[var(--bg-sidebar)] border-t border-[var(--border-color)]">
          {/* MIC BUTTON — Controls real audio streaming to backend */}
          <button onClick={handleMicToggle} className={`flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border transition-all ${!isMicActive ? 'bg-rose-500/10 border-rose-500 text-rose-500' : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--bg-sidebar)]'}`}>
            {!isMicActive ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button onClick={toggleVideo} className={`flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border transition-all ${isVideoOff ? 'bg-rose-500/10 border-rose-500 text-rose-500' : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--bg-sidebar)]'}`}>
            {isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}
          </button>
          <button onClick={toggleScreenShare} className={`flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border transition-all ${isSharingScreen ? 'bg-blue-600 border-transparent text-white shadow-lg shadow-blue-500/10' : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-main)]'}`}>
            {isSharingScreen ? <Monitor size={18} /> : <MonitorOff size={18} />}
          </button>
          <div className="w-px h-8 bg-[var(--border-color)] mx-1" />
          <button className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)]"><Users size={18} /></button>
          <div className="w-px h-8 bg-[var(--border-color)] mx-1" />
          <button className="px-5 sm:px-10 h-11 sm:h-12 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-rose-600/30 transition-all active:scale-95"><PhoneOff size={18} /><span className="hidden xs:inline">Terminate</span></button>
        </div>
      </div>

      {/* Corporate Minutes Sidebar — Live Transcript */}
      <AnimatePresence>
        {isRightSidebarOpen && (
          <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 450, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="hidden lg:flex flex-col bg-[var(--bg-sidebar)] shadow-2xl overflow-hidden border-l border-white/5">
            <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--border-color)] min-w-[450px]">
              <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest text-[var(--text-dim)]"><Activity size={14} className="text-[var(--accent-blue)]" /> Live Transcript</div>
              <button onClick={toggleRightSidebar} className="text-slate-500 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-colors"><ChevronRight size={20} /></button>
            </div>
            <div ref={scrollRef} className="flex-grow p-6 overflow-y-auto space-y-6 custom-scrollbar bg-black/5 min-w-[450px]">
              {transcript.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4">
                  <MicOff size={32} className="opacity-50" />
                  <p className="text-[8px] font-black uppercase tracking-[0.3em]">Unmute mic to begin transcription...</p>
                </div>
              ) : (
                transcript.map((e) => (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="group border-l-2 border-[var(--border-color)] pl-5 py-0.5 hover:border-[var(--accent-blue)] transition-all duration-300"
                  >
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${e.speakerId === 'me' ? 'text-[var(--accent-blue)]' : 'text-[var(--text-dim)]'}`}>{e.speakerName}</span>
                      <span className="text-[9px] text-[var(--text-dim)] opacity-50">{e.timestamp}</span>
                    </div>
                    <p className="text-[13px] leading-relaxed text-[var(--text-main)] font-medium opacity-90">{e.text}</p>
                  </motion.div>
                ))
              )}
            </div>
            <div className="p-4 bg-black/10 border-t border-[var(--border-color)] min-w-[450px]">
              <div className="bg-[var(--bg-surface)]/50 border border-white/5 rounded-2xl p-4 flex items-start gap-3">
                <Info className="text-[var(--accent-blue)] mt-1" size={14} />
                <p className="text-[11px] text-[var(--text-dim)] italic font-medium leading-relaxed">
                  {isMicActive 
                    ? 'Transcribing in real-time via Whisper. Speak naturally.' 
                    : 'Click the mic button below to start live transcription.'}
                </p>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{
        __html: `
        .mirror { transform: scaleX(-1); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar-thumb { @apply bg-slate-800/50; }
        input[type=range]::-webkit-slider-runnable-track { background: var(--bg-surface); border-radius: 9999px; }
      `}} />
    </div>
  );
};

export default MeetingDashboard;
