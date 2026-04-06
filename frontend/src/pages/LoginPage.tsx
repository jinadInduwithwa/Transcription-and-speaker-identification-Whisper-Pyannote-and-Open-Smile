import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ShieldCheck, ArrowRight, Radio, Info } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isHumanVerified, setIsHumanVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isHumanVerified) return;
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      navigate('/');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#00040a] relative overflow-hidden text-slate-100 selection:bg-cyan-500/30">
      
      {/* Superb AI Layered Background */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-50 pointer-events-none" />
      <div className="absolute inset-0 neural-mesh pointer-events-none opacity-[0.15]" />
      
      {/* Scanning Line Effect */}
      <div className="absolute top-0 left-0 w-full h-[100px] bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent pointer-events-none animate-scan z-0" />

      {/* Dynamic AI Nodes (Floating Orbs) */}
      <motion.div 
        animate={{ 
          x: [0, 150, -150, 0], 
          y: [0, -80, 80, 0],
          scale: [1, 1.2, 0.9, 1]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[15%] left-[15%] w-[40rem] h-[40rem] bg-cyan-600/20 rounded-full ai-glow-orb pointer-events-none blur-[120px]" 
      />
      <motion.div 
        animate={{ 
          x: [0, -120, 120, 0], 
          y: [0, 100, -100, 0],
          scale: [1, 0.8, 1.1, 1]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[10%] right-[15%] w-[45rem] h-[45rem] bg-blue-700/20 rounded-full ai-glow-orb pointer-events-none blur-[140px]" 
      />
      
      {/* Binary Streams (Subtle AI feel) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10 binary-stream flex justify-around px-8">
         {[...Array(6)].map((_, i) => (
           <motion.div 
             key={i}
             className="text-[10px] font-mono text-cyan-500 flex flex-col items-center"
             initial={{ y: -1000 }}
             animate={{ y: 1000 }}
             transition={{ 
               duration: 10 + Math.random() * 20, 
               repeat: Infinity, 
               ease: "linear",
               delay: i * -5
             }}
           >
             {[...Array(20)].map((_, j) => (
               <span key={j}>{Math.round(Math.random())}</span>
             ))}
           </motion.div>
         ))}
      </div>

      {/* Decorative Neural Connectors */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
         {[...Array(12)].map((_, i) => (
           <motion.div 
             key={i}
             className="absolute w-[3px] h-[3px] bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]"
             style={{ 
               top: `${Math.random() * 100}%`, 
               left: `${Math.random() * 100}%` 
             }}
             animate={{ 
               opacity: [0, 0.8, 0],
               scale: [0.5, 1.5, 0.5]
             }}
             transition={{ 
               duration: 3 + Math.random() * 4, 
               repeat: Infinity, 
               delay: Math.random() * 8 
             }}
           />
         ))}
      </div>


      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md px-6 py-12 relative z-10"
      >
        <div className="glass p-8 rounded-[2rem] border border-white/10 relative overflow-hidden backdrop-blur-3xl">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
          
          {/* Header Internal Title */}
          <div className="flex flex-col items-center mb-8 pt-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center shadow-xl shadow-cyan-500/10 mb-5">
              <Radio size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter uppercase flex items-center gap-2">
              Aether<span className="text-cyan-400">Node</span>
            </h1>
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em] mt-2">Executive Intel Gateway</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Terminal ID</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-cyan-400 transition-colors" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@enterprise.com" 
                  className="w-full bg-slate-950/40 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-cyan-500/50 focus:bg-slate-950/80 transition-all font-medium text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Access Key</label>
                <a href="#" className="text-[9px] font-black uppercase tracking-widest text-cyan-500 hover:text-cyan-400 transition-colors">Recover Code</a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-cyan-400 transition-colors" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-slate-950/40 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-cyan-500/50 focus:bg-slate-950/80 transition-all font-medium text-sm"
                  required
                />
              </div>
            </div>

            {/* Human Verification */}
            <div className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between cursor-pointer ${isHumanVerified ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'bg-slate-950/40 border-white/5 hover:border-white/10'}`} 
                 onClick={() => setIsHumanVerified(!isHumanVerified)}>
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${isHumanVerified ? 'bg-cyan-500 border-cyan-500 shadow-[0_0_10px_#06b6d4]' : 'bg-slate-800 border-white/10'}`}>
                    {isHumanVerified && <ShieldCheck size={14} className="text-white" />}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Biological Audit</span>
              </div>
              <Info size={14} className="text-slate-600" />
            </div>

            <button 
              type="submit"
              disabled={isLoading || !isHumanVerified}
              className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
                isLoading || !isHumanVerified 
                ? 'bg-slate-900 text-slate-700 cursor-not-allowed' 
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] text-white'
              }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>Establish Uplink <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-white/5">
             <span className="text-slate-600 text-[10px] uppercase font-black tracking-widest">New Operator? </span>
             <Link to="/signup" className="text-cyan-500 text-[10px] uppercase font-black tracking-widest hover:text-white transition-colors">Register Profile</Link>
          </div>
        </div>
        
        <p className="mt-12 text-center text-[8px] font-bold text-slate-800 uppercase tracking-[0.5em] opacity-50">Intelligence Core v4.2 • Secure Encryption Enabled</p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
