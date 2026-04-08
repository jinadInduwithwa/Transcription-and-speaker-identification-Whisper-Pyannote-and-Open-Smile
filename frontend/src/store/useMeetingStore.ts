import { create } from 'zustand';

// Types for the store
export type ThemeType = 'default' | 'obsidian' | 'ocean' | 'light';

export interface Participant {
  id: string;
  name: string;
  isSpeaking: boolean;
  avatar?: string;
  muted?: boolean;
}

export interface TranscriptEntry {
  id: string;
  speakerName: string;
  text: string;
  timestamp: string;
  speakerId: string;
}

export interface User {
  name: string;
  email: string;
  meetingId: string;
}

interface MeetingState {
  // Authentication/Identity
  user: User | null;
  setUser: (user: User) => void;
  logout: () => void;

  // Appearance
  theme: ThemeType;
  gridDensity: 'compact' | 'standard' | 'relaxed';
  setTheme: (theme: ThemeType) => void;
  setGridDensity: (density: 'compact' | 'standard' | 'relaxed') => void;
  
  // Audio Levels
  micVolume: number;
  speakerVolume: number;
  setMicVolume: (vol: number) => void;
  setSpeakerVolume: (vol: number) => void;
  
  // Layout
  isLeftSidebarOpen: boolean;
  isRightSidebarOpen: boolean;
  isRecording: boolean;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  toggleRecording: () => void;
  
  // Media Status
  isMuted: boolean;
  isVideoOff: boolean;
  isSharingScreen: boolean;
  toggleMic: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => void;
  
  // Participants
  participants: Participant[];
  updateParticipantSpeaking: (id: string, isSpeaking: boolean) => void;
  
  // Transcription
  transcript: TranscriptEntry[];
  addTranscriptEntry: (entry: Omit<TranscriptEntry, 'id' | 'timestamp'>) => void;
  clearTranscript: () => void;
}

export const useMeetingStore = create<MeetingState>((set) => ({
  // Defaults
  user: null,
  theme: 'light',
  gridDensity: 'standard',
  micVolume: 80,
  speakerVolume: 75,
  isLeftSidebarOpen: true,
  isRightSidebarOpen: true,
  isRecording: false,
  isMuted: true,
  isVideoOff: false,
  isSharingScreen: false,
  participants: [
    { id: 'me', name: 'Guest', isSpeaking: false, muted: false },
    { id: '1', name: 'Dr. Aris Thorne', isSpeaking: false, muted: false, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aris' },
    { id: '2', name: 'Sarah Chen', isSpeaking: false, muted: false, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
  ],
  transcript: [],

  // Actions
  setUser: (user) => set((state) => ({ 
    user,
    participants: state.participants.map(p => 
      p.id === 'me' ? { ...p, name: user.name } : p
    )
  })),
  logout: () => set({ user: null }),
  setTheme: (theme) => set({ theme }),
  setGridDensity: (gridDensity) => set({ gridDensity }),
  setMicVolume: (micVolume) => set({ micVolume }),
  setSpeakerVolume: (speakerVolume) => set({ speakerVolume }),
  
  toggleLeftSidebar: () => set((state) => ({ isLeftSidebarOpen: !state.isLeftSidebarOpen })),
  
  toggleRightSidebar: () => set((state) => ({ isRightSidebarOpen: !state.isRightSidebarOpen })),
  
  toggleRecording: () => set((state) => ({ isRecording: !state.isRecording })),
  
  toggleMic: () => set((state) => ({ isMuted: !state.isMuted })),
  
  toggleVideo: () => set((state) => ({ isVideoOff: !state.isVideoOff })),
  
  toggleScreenShare: () => set((state) => ({ isSharingScreen: !state.isSharingScreen })),
  
  updateParticipantSpeaking: (id, isSpeaking) => set((state) => ({
    participants: state.participants.map(p => 
      p.id === id ? { ...p, isSpeaking } : p
    )
  })),

  addTranscriptEntry: (entry) => set((state) => ({
    transcript: [
      ...state.transcript,
      {
        ...entry,
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        })
      }
    ].slice(-100) // Keep last 100 entries
  })),

  clearTranscript: () => set({ transcript: [] }),
}));
