import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, ArrowRight, Activity } from 'lucide-react';

const STRETCHES = [
  { title: "Neck Rolls", desc: "Slowly roll your head in a full circle. Do 3 rotations clockwise, then 3 counter-clockwise.", time: 30 },
  { title: "Shoulder Shrugs", desc: "Lift your shoulders up to your ears, hold for 3 seconds, then release them down.", time: 30 },
  { title: "Torso Twist", desc: "Keep your hips facing forward. Gently twist your upper body to the right, hold, then left.", time: 40 },
  { title: "Wrist Flex", desc: "Extend one arm forward, palm up. Gently pull your fingers down with the other hand.", time: 40 },
  { title: "Chest Opener", desc: "Clasp your hands behind your back, puff your chest out, and look slightly upward.", time: 40 },
];

export default function LightStretch({ onComplete, onClose }) {
  const [step, setStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(STRETCHES[0].time);
  const [isFinished, setIsFinished] = useState(false);
  const [isActive, setIsActive] = useState(true);
  
  const timerRef = useRef(null);
  const totalTimeRef = useRef(0);

  useEffect(() => {
    if (isActive && !isFinished) {
      timerRef.current = setInterval(() => {
        totalTimeRef.current += 1;
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleNext();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isActive, isFinished, step]);

  const handleNext = () => {
    if (step < STRETCHES.length - 1) {
      setStep(s => s + 1);
      setTimeLeft(STRETCHES[step + 1].time);
    } else {
      setIsFinished(true);
      setIsActive(false);
    }
  };

  const handleComplete = () => {
    const durationMins = Math.max(1, Math.round(totalTimeRef.current / 60));
    onComplete(durationMins);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center relative z-10 w-full px-4">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 w-12 h-12 bg-black/20 text-white rounded-full flex items-center justify-center hover:bg-black/30 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {!isFinished ? (
        <>
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6">
            <Activity className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Desk Stretches</h2>
          <div className="w-64 h-2 bg-white/20 rounded-full mb-12 overflow-hidden">
            <motion.div 
              className="h-full bg-white"
              animate={{ width: `${((step) / STRETCHES.length) * 100}%` }}
            />
          </div>

          <div className="h-48 max-w-md">
            <AnimatePresence mode="wait">
              <motion.div 
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-3xl font-bold text-white">{STRETCHES[step].title}</h3>
                <p className="text-xl text-orange-100">{STRETCHES[step].desc}</p>
                <div className="text-4xl font-black text-white pt-4">{timeLeft}s</div>
              </motion.div>
            </AnimatePresence>
          </div>

          <button 
            onClick={handleNext}
            className="mt-8 bg-white text-orange-600 px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
          >
            Skip to Next <ArrowRight className="w-5 h-5" />
          </button>
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
          <h2 className="text-4xl font-bold text-white mb-4">Body Relieved</h2>
          <p className="text-orange-100 text-lg mb-8 max-w-sm">You completed your stretching routine. Your body thanks you.</p>
          <button 
            onClick={handleComplete}
            className="bg-white text-orange-600 px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
          >
            Finish & Save
          </button>
        </motion.div>
      )}
    </div>
  );
}
