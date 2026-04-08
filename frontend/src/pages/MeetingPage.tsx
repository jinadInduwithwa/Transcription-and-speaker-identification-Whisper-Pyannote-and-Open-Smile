import React, { useEffect } from 'react';
import { 
  Settings, Users, MessageSquare, Shield, Activity, LayoutGrid, Radio, Sparkles, Download
} from 'lucide-react';

import { useMeetingStore } from '../store/useMeetingStore';
import { useSpeechSocket } from '../hooks/useSpeechSocket';

// Internal Components
import { MeetingHeader } from '../components/meeting/MeetingHeader';
import { ParticipantGrid } from '../components/meeting/ParticipantGrid';
import { TranscriptSidebar } from '../components/meeting/TranscriptSidebar';
import { ControlBar } from '../components/meeting/ControlBar';

export const MeetingPage: React.FC = () => {
  const { 
    isMuted, toggleMic,
    isVideoOff, toggleVideo,
    gridDensity,
    participants,
    transcript, clearTranscript,
    user, logout
  } = useMeetingStore();

  const { isConnected, isMicActive, toggleMic: toggleHardwareMic } = useSpeechSocket();

  // Sync Global State with Hardware State
  useEffect(() => {
    const shouldBeActive = !isMuted;
    if (shouldBeActive !== isMicActive) {
      toggleHardwareMic();
    }
  }, [isMuted, isMicActive, toggleHardwareMic]);

  return (
    <div className="flex h-screen bg-[#F4F7FB] text-gray-800 font-sans selection:bg-blue-100 overflow-hidden">
      
      {/* ─── Left Sidebar: Navigation ─── */}
      <div className="w-16 sm:w-20 bg-white border-r border-gray-200 flex flex-col items-center py-6 gap-8 z-20 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-2">
            <Radio size={24} className="text-white" />
        </div>
        
        <div className="flex flex-col gap-6 flex-grow">
          <button className="p-3 rounded-xl bg-blue-50 text-blue-600 transition-all"><LayoutGrid size={22} /></button>
          <button className="p-3 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all"><Users size={22} /></button>
          <button className="p-3 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all"><MessageSquare size={22} /></button>
          <button className="p-3 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all"><Activity size={22} /></button>
          <button className="p-3 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all"><Shield size={22} /></button>
        </div>

        <button className="p-3 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 mb-2"><Settings size={22} /></button>
      </div>

      <div className="flex-grow flex flex-col min-w-0 relative">
        <MeetingHeader 
            userName={user?.name}
            meetingId={user?.meetingId}
            isConnected={isConnected}
        />

        <main className="flex-grow flex p-4 sm:p-6 gap-6 overflow-hidden">
          <div className="flex-grow flex flex-col gap-4 min-w-0">
            <ParticipantGrid 
                user={user}
                participants={participants}
                isMuted={isMuted}
                gridDensity={gridDensity}
            />
            
            {/* Context Insights Bar */}
            <div className="h-14 sm:h-16 bg-white border border-gray-100 rounded-2xl px-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 text-xs font-bold">
                        <Sparkles size={14} /> Topic Detection: <span className="text-gray-900 ml-1 italic font-medium">Architecture Review</span>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-gray-400">
                    <button className="flex items-center gap-2 text-xs font-semibold hover:text-blue-600 transition-colors"><Download size={16} /> Save Brief</button>
                    <div className="w-px h-6 bg-gray-100 focus:outline-none" />
                    <button className="flex items-center gap-2 text-xs font-semibold hover:text-blue-600 transition-colors"><Download size={16} /> Export Logs</button>
                </div>
            </div>
          </div>

          <TranscriptSidebar 
              transcript={transcript}
              clearTranscript={clearTranscript}
          />
          
          <div className="absolute right-8 bottom-32 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hidden xl:block w-64 z-30">
              <div className="flex items-center gap-2 mb-3">
                  <Activity size={16} className="text-blue-500" />
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Acoustics</h3>
              </div>
              <div className="space-y-3">
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Emotion State</span>
                      <div className="flex items-center gap-2">
                          <div className="flex-grow h-1 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 w-[80%]" />
                          </div>
                          <span className="text-[9px] font-bold text-emerald-600">Neutral</span>
                      </div>
                  </div>
              </div>
          </div>
        </main>

        <ControlBar 
            isMuted={isMuted}
            toggleMic={toggleMic}
            isVideoOff={isVideoOff}
            toggleVideo={toggleVideo}
            logout={logout}
        />
      </div>
    </div>
  );
};

export default MeetingPage;
