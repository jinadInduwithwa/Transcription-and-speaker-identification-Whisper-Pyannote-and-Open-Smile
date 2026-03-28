import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface RecordButtonProps {
  isRecording: boolean;
  onStart: () => void;
  onStop: () => void;
}

const RecordButton: React.FC<RecordButtonProps> = ({ isRecording, onStart, onStop }) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={isRecording ? onStop : onStart}
        className={`relative group h-24 w-24 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl ${
          isRecording 
            ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/50' 
            : 'bg-cyan-500 hover:bg-cyan-600 shadow-cyan-500/50'
        }`}
      >
        {isRecording && (
          <motion.div
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute inset-0 bg-rose-500 rounded-full"
          />
        )}
        
        <div className="relative z-10">
          {isRecording ? (
            <MicOff className="w-10 h-10 text-white" />
          ) : (
            <Mic className="w-10 h-10 text-white" />
          )}
        </div>
      </motion.button>
      
      <span className={`text-sm font-semibold tracking-widest uppercase transition-colors duration-300 ${isRecording ? 'text-rose-400' : 'text-slate-400'}`}>
        {isRecording ? 'Recording Live' : 'Start Recording'}
      </span>
    </div>
  );
};

export default RecordButton;
