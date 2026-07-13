import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, CheckCircle, Coffee } from 'lucide-react';

const PROMPTS = [
  "Hold your warm cup. Feel the heat radiating into your palms.",
  "Take a slow sip. Notice the flavor, the temperature...",
  "Pay attention to the sensation as you swallow.",
  "Breathe in the aroma. Let it ground you in this moment.",
  "For the next minute, just be here with your cup. No phone, no work."
];

export default function MindfulBreak({ onComplete, onClose }) {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3 * 60); // 3 minutes
  const [promptIdx, setPromptIdx] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  
  const timerRef = useRef(null);
  const promptRef = useRef(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            finishSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      promptRef.current = setInterval(() => {
        setPromptIdx(prev => (prev < PROMPTS.length - 1 ? prev + 1 : prev));
      }, 35000);
      
    } else {
      clearInterval(timerRef.current);
      clearInterval(promptRef.current);
    }
    return () => {
      clearInterval(timerRef.current);
      clearInterval(promptRef.current);
    };
  }, [isActive, timeLeft]);

  const finishSession = () => {
    setIsFinished(true);
    setIsActive(false);
  };

  const handleComplete = () => {
    const durationMins = 3 - Math.floor(timeLeft / 60);
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
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6">
            <Coffee className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Mindful Break</h2>
          <p className="text-amber-200 mb-12 font-medium">Be present in this moment.</p>

          <div className="text-6xl font-black text-white mb-12 tracking-widest tabular-nums">
            {formatTime(timeLeft)}
          </div>

          <div className="h-24 max-w-lg mb-12 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.p 
                key={promptIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 1 }}
                className="text-2xl text-white font-medium leading-relaxed italic"
              >
                "{isActive ? PROMPTS[promptIdx] : 'Ready to start your break?'}"
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsActive(!isActive)}
              className="w-16 h-16 bg-white text-amber-600 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
            >
              {isActive ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current pl-1" />}
            </button>
            <button 
              onClick={timeLeft < 170 ? finishSession : onClose}
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
          <h2 className="text-4xl font-bold text-white mb-4">Refreshed</h2>
          <p className="text-amber-100 text-lg mb-8 max-w-sm">Taking small moments for yourself builds long-term resilience.</p>
          <button 
            onClick={handleComplete}
            className="bg-white text-amber-600 px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
          >
            Finish & Save
          </button>
        </motion.div>
      )}
    </div>
  );
}
