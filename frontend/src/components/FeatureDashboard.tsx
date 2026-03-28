import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap, LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  label: string;
  value: number;
  color: string;
  icon: LucideIcon;
  unit: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ label, value, color, icon: Icon, unit }) => (
  <div className="flex flex-col gap-4 p-6 glass rounded-2xl border border-white/10 flex-1 hover:bg-white/10 transition-colors duration-500">
    <div className="flex items-center justify-between">
      <div className={`p-2 rounded-lg ${color} bg-opacity-20`}>
        <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
      </div>
      <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">{label}</span>
    </div>
    
    <div className="flex items-baseline gap-2">
      <h2 className="text-4xl font-extrabold tracking-tighter text-slate-100 italic transition-all duration-300">
        {value.toFixed(1)}
      </h2>
      <span className="text-sm font-bold text-slate-500 uppercase">{unit}</span>
    </div>
    
    <div className="relative h-2 w-full bg-slate-800/50 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, (value / 500) * 100)}%` }} // Normalized example scale
        className={`absolute h-full rounded-full ${color}`}
      />
    </div>
  </div>
);

interface FeatureDashboardProps {
  pitch: number;
  energy: number;
}

const FeatureDashboard: React.FC<FeatureDashboardProps> = ({ pitch, energy }) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-4">
        <FeatureCard 
          label="Pitch" 
          value={pitch} 
          color="bg-cyan-500" 
          icon={Activity} 
          unit="Hz" 
        />
        <FeatureCard 
          label="Energy" 
          value={energy} 
          color="bg-fuchsia-500" 
          icon={Zap} 
          unit="DB" 
        />
      </div>
      
      <div className="glass rounded-2xl p-6 h-32 flex items-center justify-center gap-1 overflow-hidden">
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.div
            key={i}
            animate={{ 
              height: [20, Math.random() * 60 + 20, 20],
              opacity: [0.3, 0.7, 0.3]
            }}
            transition={{ 
                repeat: Infinity, 
                duration: 0.5 + Math.random(),
                ease: "easeInOut"
            }}
            className="w-1.5 rounded-full bg-gradient-to-t from-cyan-500/50 to-fuchsia-500/50"
          />
        ))}
      </div>
    </div>
  );
};

export default FeatureDashboard;
