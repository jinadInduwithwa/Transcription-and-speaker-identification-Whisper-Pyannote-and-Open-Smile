import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Check, Mic, Volume2, Layout, Maximize2, Minimize2, Grid3X3 } from 'lucide-react';
import { useMeetingStore, ThemeType } from '../store/useMeetingStore';

interface SettingsDockProps {
  onClose: () => void;
}

export const SettingsDock: React.FC<SettingsDockProps> = ({ onClose }) => {
  const { 
    theme, setTheme, 
    gridDensity, setGridDensity,
    micVolume, setMicVolume,
    speakerVolume, setSpeakerVolume
  } = useMeetingStore();

  const themes: { id: ThemeType; label: string; bg: string }[] = [
    { id: 'default', label: 'Midnight', bg: 'bg-slate-800' },
    { id: 'obsidian', label: 'Obsidian', bg: 'bg-black' },
    { id: 'ocean', label: 'Ocean Blue', bg: 'bg-blue-900' },
    { id: 'light', label: 'Enterprise', bg: 'bg-slate-200' },
  ];

  const densities: { id: 'compact' | 'standard' | 'relaxed'; label: string; icon: any }[] = [
    { id: 'compact', label: 'Compact', icon: Minimize2 },
    { id: 'standard', label: 'Standard', icon: Grid3X3 },
    { id: 'relaxed', label: 'Relaxed', icon: Maximize2 },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute top-full right-0 mt-3 w-80 bg-[var(--bg-sidebar)] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
    >
      <div className="p-4 border-b border-white/5 bg-black/20 flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)] flex items-center gap-2">
              <Settings size={14} className="text-[var(--accent-blue)]" />
              Intelligence Settings
          </h3>
          <button onClick={onClose} className="text-[var(--text-dim)] hover:text-white transition-colors">
              <Check size={16} />
          </button>
      </div>

      <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          {/* Audio Section */}
          <div className="space-y-4">
              <label className="text-[9px] font-black uppercase tracking-widest text-[var(--accent-blue)]">Audio Control</label>
              
              <div className="space-y-3">
                  <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold text-[var(--text-dim)]">
                          <span className="flex items-center gap-2 px-1"><Mic size={12} /> Mic Sensitivity</span>
                          <span>{micVolume}%</span>
                      </div>
                      <input 
                        type="range" value={micVolume} 
                        onChange={(e) => setMicVolume(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[var(--accent-blue)]" 
                      />
                  </div>

                  <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold text-[var(--text-dim)]">
                          <span className="flex items-center gap-2 px-1"><Volume2 size={12} /> Speaker Volume</span>
                          <span>{speakerVolume}%</span>
                      </div>
                      <input 
                        type="range" value={speakerVolume} 
                        onChange={(e) => setSpeakerVolume(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[var(--accent-blue)]" 
                      />
                  </div>
              </div>
          </div>

          <div className="h-px bg-white/5" />

          {/* Grid Layout Section */}
          <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-[var(--accent-blue)]">Grid Interface</label>
              <div className="grid grid-cols-3 gap-2">
                  {densities.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setGridDensity(d.id)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                            gridDensity === d.id 
                                ? 'bg-[var(--accent-blue)]/10 border-[var(--accent-blue)] text-[var(--accent-blue)]' 
                                : 'bg-white/5 border-transparent text-[var(--text-dim)] hover:border-white/10'
                        }`}
                      >
                          <d.icon size={16} />
                          <span className="text-[9px] font-black uppercase tracking-widest">{d.label}</span>
                      </button>
                  ))}
              </div>
          </div>

          <div className="h-px bg-white/5" />

          {/* Theme Section */}
          <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-[var(--accent-blue)]">Visual Workspace</label>
              <div className="grid grid-cols-2 gap-2">
                  {themes.map((t) => (
                      <button
                          key={t.id}
                          onClick={() => setTheme(t.id)}
                          className={`flex flex-col p-2 rounded-xl border transition-all group ${
                              theme === t.id 
                                  ? 'bg-[var(--accent-blue)]/10 border-[var(--accent-blue)]' 
                                  : 'bg-white/5 border-transparent hover:border-white/10'
                          }`}
                      >
                          <div className={`w-full h-10 rounded-lg mb-2 ${t.bg} border border-white/5 flex items-center justify-center`}>
                               {theme === t.id && <div className="w-2 h-2 rounded-full bg-[var(--accent-blue)] shadow-[0_0_10px_var(--accent-blue)]" />}
                          </div>
                          <span className={`text-[9px] font-black uppercase tracking-widest text-center ${theme === t.id ? 'text-[var(--accent-blue)]' : 'text-[var(--text-dim)]'}`}>{t.label}</span>
                      </button>
                  ))}
              </div>
          </div>
      </div>

      <div className="p-3 bg-black/40 text-center">
          <p className="text-[8px] font-bold text-slate-600 uppercase tracking-[0.2em]">Enterprise Terminal v4.2.0</p>
      </div>
    </motion.div>
  );
};
