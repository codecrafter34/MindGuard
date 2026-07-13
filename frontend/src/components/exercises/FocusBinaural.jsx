import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, X, CheckCircle, Volume2, Settings } from 'lucide-react';

export default function FocusBinaural({ onComplete, onClose }) {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes Pomodoro
  const [isFinished, setIsFinished] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isActive && !isFinished) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            finishSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isActive, isFinished]);

  const finishSession = () => {
    setIsFinished(true);
    setIsActive(false);
  };

  const handleComplete = () => {
    const durationMins = 25 - Math.floor(timeLeft / 60);
    onComplete(Math.max(1, durationMins));
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center relative z-10 w-full px-4">
      {!isFinished ? (
        <>
          <h2 className="text-3xl font-bold text-white mb-2">Deep Focus</h2>
          <p className="text-rose-200 mb-12 font-medium">Binaural Beats 40Hz</p>

          {/* Visualizer */}
          <div className="flex items-end justify-center gap-2 h-32 mb-12">
            {[...Array(12)].map((_, i) => (
              <motion.div 
                key={i}
                animate={isActive ? { height: ['20%', '80%', '40%', '90%', '20%'] } : { height: '20%' }}
                transition={isActive ? { duration: 1.5 + (i * 0.1), repeat: Infinity, repeatType: "reverse" } : {}}
                className="w-3 bg-white/40 rounded-t-full"
                style={{ height: '20%' }}
              />
            ))}
          </div>

          <div className="text-6xl font-black text-white mb-12 tracking-widest tabular-nums">
            {formatTime(timeLeft)}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-6">
            <button 
              className="w-12 h-12 bg-black/20 text-white rounded-full flex items-center justify-center hover:bg-black/30 transition-colors"
            >
              <Volume2 className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsActive(!isActive)}
              className="w-20 h-20 bg-white text-rose-600 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
            >
              {isActive ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current pl-1" />}
            </button>
            <button 
              onClick={timeLeft < 25 * 60 - 60 ? finishSession : onClose}
              className="w-12 h-12 bg-black/20 text-white rounded-full flex items-center justify-center hover:bg-black/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </>
      ) : (
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center"
        >
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Focus Session Complete</h2>
          <p className="text-rose-100 text-lg mb-8 max-w-sm">You maintained deep focus. Take a short break now.</p>
          <button 
            onClick={handleComplete}
            className="bg-white text-rose-600 px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
          >
            Finish & Save
          </button>
        </motion.div>
      )}
    </div>
  );
}
