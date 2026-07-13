import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, CheckCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

const PHASES = [
  { name: 'Inhale', duration: 4, scale: 1.5, text: 'Breathe In...' },
  { name: 'Hold', duration: 7, scale: 1.5, text: 'Hold...' },
  { name: 'Exhale', duration: 8, scale: 1, text: 'Breathe Out...' }
];
const TOTAL_ROUNDS = 5;

export default function DeepBreathing({ onComplete, onClose }) {
  const [isActive, setIsActive] = useState(false);
  const [round, setRound] = useState(1);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(PHASES[0].duration);
  const [isFinished, setIsFinished] = useState(false);
  
  // Track total duration spent in seconds
  const totalDuration = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isActive && !isFinished) {
      timerRef.current = setInterval(() => {
        totalDuration.current += 1;
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Next Phase
            const nextIdx = phaseIdx + 1;
            if (nextIdx >= PHASES.length) {
              // Next Round
              if (round >= TOTAL_ROUNDS) {
                finishSession();
                return 0;
              }
              setRound(r => r + 1);
              setPhaseIdx(0);
              return PHASES[0].duration;
            } else {
              setPhaseIdx(nextIdx);
              return PHASES[nextIdx].duration;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isActive, isFinished, phaseIdx, round]);

  const finishSession = () => {
    setIsFinished(true);
    setIsActive(false);
  };

  const handleComplete = () => {
    // 1 round = ~19 seconds. 5 rounds = ~95 seconds.
    // Convert to minutes, minimum 1 min.
    const minutes = Math.max(1, Math.round(totalDuration.current / 60));
    onComplete(minutes);
  };

  const currentPhase = PHASES[phaseIdx];

  return (
    <div className="flex flex-col items-center justify-center h-full text-center relative z-10 w-full">
      {!isFinished ? (
        <>
          <h2 className="text-3xl font-bold text-white mb-2">Deep Breathing</h2>
          <p className="text-teal-100 mb-8 font-medium">Round {round} of {TOTAL_ROUNDS}</p>

          {/* Animated Circle */}
          <div className="relative w-64 h-64 flex items-center justify-center mb-12">
            {/* Outer Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
              <motion.circle 
                cx="50" cy="50" r="45" fill="none" stroke="#fff" strokeWidth="4"
                strokeDasharray="283"
                animate={{ strokeDashoffset: isActive ? 0 : 283 }}
                transition={{ duration: currentPhase.duration, ease: "linear" }}
                key={phaseIdx + round}
              />
            </svg>
            
            {/* Inner Expanding Circle */}
            <motion.div
              className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md shadow-2xl"
              animate={isActive ? { scale: currentPhase.scale } : { scale: 1 }}
              transition={{ duration: isActive ? currentPhase.duration : 1, ease: "easeInOut" }}
            >
              <div className="w-24 h-24 bg-white/40 rounded-full flex items-center justify-center">
                <span className="text-4xl font-black text-white mix-blend-overlay">{timeLeft}</span>
              </div>
            </motion.div>
          </div>

          <h3 className="text-2xl font-bold text-white mb-8 h-8">
            {isActive ? currentPhase.text : 'Ready?'}
          </h3>

          {/* Controls */}
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsActive(!isActive)}
              className="w-16 h-16 bg-white text-teal-600 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
            >
              {isActive ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current pl-1" />}
            </button>
            <button 
              onClick={onClose}
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
          <h2 className="text-4xl font-bold text-white mb-4">Great Job!</h2>
          <p className="text-teal-100 text-lg mb-8 max-w-sm">You completed 5 rounds of deep breathing. Your nervous system is now calmer.</p>
          <button 
            onClick={handleComplete}
            className="bg-white text-teal-600 px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
          >
            Finish & Save
          </button>
        </motion.div>
      )}
    </div>
  );
}
