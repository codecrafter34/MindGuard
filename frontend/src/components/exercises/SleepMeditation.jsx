import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, CheckCircle, Volume2, VolumeX } from 'lucide-react';

const STEPS = [
  "Close your eyes and take a slow, deep breath...",
  "Imagine you are lying on a soft, warm cloud...",
  "Feel the tension melting away from your toes...",
  "Slowly moving up through your legs...",
  "Relaxing your stomach and your chest...",
  "Releasing any tension in your shoulders and neck...",
  "Finally, letting your head sink deep into the pillow...",
  "Breathe slowly and deeply. You are safe. You are calm."
];

export default function SleepMeditation({ onComplete, onClose }) {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10 * 60); // 10 minutes
  const [stepIdx, setStepIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  
  const timerRef = useRef(null);
  const stepRef = useRef(null);

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

      // Change text every 30 seconds
      stepRef.current = setInterval(() => {
        setStepIdx(prev => (prev < STEPS.length - 1 ? prev + 1 : prev));
      }, 30000);
      
    } else {
      clearInterval(timerRef.current);
      clearInterval(stepRef.current);
    }
    return () => {
      clearInterval(timerRef.current);
      clearInterval(stepRef.current);
    };
  }, [isActive, timeLeft]);

  const finishSession = () => {
    setIsFinished(true);
    setIsActive(false);
  };

  const handleComplete = () => {
    const durationMins = 10 - Math.floor(timeLeft / 60);
    onComplete(Math.max(1, durationMins));
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center relative z-10 w-full px-4">
      
      {/* Animated soft background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} 
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-20 -left-20 w-96 h-96 bg-indigo-400 rounded-full mix-blend-screen filter blur-3xl opacity-30"
        />
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }} 
          transition={{ duration: 12, repeat: Infinity, delay: 2 }}
          className="absolute bottom-10 right-10 w-80 h-80 bg-purple-400 rounded-full mix-blend-screen filter blur-3xl opacity-30"
        />
      </div>

      {!isFinished ? (
        <>
          <h2 className="text-3xl font-bold text-white mb-2">Sleep Meditation</h2>
          <p className="text-indigo-200 mb-12 font-medium">Guided Visualization</p>

          <div className="w-48 h-48 rounded-full border-4 border-white/20 flex items-center justify-center mb-12 relative backdrop-blur-sm">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <motion.circle 
                cx="50" cy="50" r="46" fill="none" stroke="#fff" strokeWidth="2"
                strokeDasharray="289"
                animate={{ strokeDashoffset: isActive ? 289 - (289 * (timeLeft / 600)) : 289 - (289 * (timeLeft / 600)) }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </svg>
            <span className="text-4xl font-light text-white">{formatTime(timeLeft)}</span>
          </div>

          <div className="h-24 flex items-center justify-center max-w-md">
            <AnimatePresence mode="wait">
              <motion.p 
                key={stepIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 1 }}
                className="text-2xl text-white font-medium leading-relaxed"
              >
                {isActive ? STEPS[stepIdx] : 'Ready to drift off?'}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-6 mt-12">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="w-12 h-12 bg-black/20 text-white rounded-full flex items-center justify-center hover:bg-black/30 transition-colors"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => setIsActive(!isActive)}
              className="w-16 h-16 bg-white text-indigo-600 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
            >
              {isActive ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current pl-1" />}
            </button>
            <button 
              onClick={timeLeft < 600 ? finishSession : onClose}
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
          <h2 className="text-4xl font-bold text-white mb-4">Peaceful Rest</h2>
          <p className="text-indigo-100 text-lg mb-8 max-w-sm">You've completed your meditation. Sleep well.</p>
          <button 
            onClick={handleComplete}
            className="bg-white text-indigo-600 px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
          >
            Finish & Save
          </button>
        </motion.div>
      )}
    </div>
  );
}
