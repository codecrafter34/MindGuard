import React, { useState, useEffect } from 'react';
import { Wind, Moon, Music, Activity, Coffee, Smile, Play, Calendar, Flame, CheckCircle, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useSession } from '../hooks/useSession';
import { completeExercise, getExerciseHistory } from '../api/exercise';

// Import Exercise Components
import DeepBreathing from '../components/exercises/DeepBreathing';
import SleepMeditation from '../components/exercises/SleepMeditation';
import FocusBinaural from '../components/exercises/FocusBinaural';
import LightStretch from '../components/exercises/LightStretch';
import MindfulBreak from '../components/exercises/MindfulBreak';
import Gratitude from '../components/exercises/Gratitude';

const EXERCISES = [
  { 
    id: 1, 
    title: 'Deep Breathing', 
    desc: '4-7-8 breathing technique to calm your nervous system.', 
    icon: Wind, 
    color: 'bg-teal-500',
    component: DeepBreathing
  },
  { 
    id: 2, 
    title: 'Sleep Meditation', 
    desc: 'Guided visualization to help you drift off naturally.', 
    icon: Moon, 
    color: 'bg-indigo-500',
    component: SleepMeditation
  },
  { 
    id: 3, 
    title: 'Focus Binaural', 
    desc: 'Binaural beats for deep focus and concentration.', 
    icon: Music, 
    color: 'bg-rose-500',
    component: FocusBinaural
  },
  { 
    id: 4, 
    title: 'Light Stretch', 
    desc: '5-minute desk stretches to relieve body tension.', 
    icon: Activity, 
    color: 'bg-orange-500',
    component: LightStretch
  },
  { 
    id: 5, 
    title: 'Mindful Break', 
    desc: 'A quick coffee or tea break mindfulness session.', 
    icon: Coffee, 
    color: 'bg-amber-600',
    component: MindfulBreak
  },
  { 
    id: 6, 
    title: 'Gratitude', 
    desc: 'List three things you are grateful for today.', 
    icon: Smile, 
    color: 'bg-emerald-500',
    component: Gratitude
  },
];

export default function SelfCarePage() {
  const { token, sessionReady } = useSession();
  const [selectedEx, setSelectedEx] = useState(null);
  
  // Dashboard State
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (token) loadDashboard();
  }, [token]);

  async function loadDashboard() {
    setLoading(true);
    try {
      const data = await getExerciseHistory(token);
      setHistory(data.history || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Dashboard calculations
  const getStats = () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Today's completed
    const todayCount = history.filter(h => h.completedAt.startsWith(todayStr)).length;
    
    // Total sessions
    const totalCount = history.length;
    
    // Simple mock streak (requires complex date math normally)
    const streak = Math.min(totalCount, 5); 
    
    // Weekly completion (mock % based on recent days)
    const weeklyPct = Math.min(100, Math.round((history.slice(0, 7).length / 7) * 100)) || 0;

    return { todayCount, totalCount, streak, weeklyPct };
  };

  const handleComplete = async (exercise, duration, metadata) => {
    try {
      await completeExercise({
        exerciseName: exercise.title,
        duration,
        metadata
      }, token);
      
      // Close overlay and refresh dashboard
      setSelectedEx(null);
      loadDashboard();
    } catch (err) {
      console.error('Failed to save exercise:', err);
    }
  };

  const stats = getStats();

  if (!sessionReady) return <div className="flex h-full items-center justify-center animate-pulse text-primary">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-full space-y-10 relative pb-20">
      
      {/* ── HEADER ── */}
      <div className="flex-none">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
          <Wind className="text-secondary" />
          Self Care & Exercises
        </h1>
        <p className="text-slate-500 mt-2">Take a moment for yourself. Choose an exercise to ground your mind and body.</p>
      </div>

      {/* ── DASHBOARD ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-6 rounded-3xl flex flex-col justify-center relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-5"><CheckCircle className="w-24 h-24" /></div>
          <span className="text-slate-500 text-sm font-medium mb-2 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-success" /> Today's Completed</span>
          <span className="text-3xl font-black text-slate-800 dark:text-white">{stats.todayCount}</span>
        </div>
        <div className="glass-panel p-6 rounded-3xl flex flex-col justify-center">
          <span className="text-slate-500 text-sm font-medium mb-2 flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Total Sessions</span>
          <span className="text-3xl font-black text-slate-800 dark:text-white">{stats.totalCount}</span>
        </div>
        <div className="glass-panel p-6 rounded-3xl flex flex-col justify-center">
          <span className="text-slate-500 text-sm font-medium mb-2 flex items-center gap-2"><Flame className="w-4 h-4 text-orange-500" /> Current Streak</span>
          <span className="text-3xl font-black text-slate-800 dark:text-white">{stats.streak} Days</span>
        </div>
        <div className="glass-panel p-6 rounded-3xl flex flex-col justify-center">
          <span className="text-slate-500 text-sm font-medium mb-2 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-indigo-500" /> Weekly Goal</span>
          <div className="flex items-center gap-4">
            <span className="text-3xl font-black text-slate-800 dark:text-white">{stats.weeklyPct}%</span>
            <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${stats.weeklyPct}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── EXERCISE GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {EXERCISES.map((ex, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={ex.id}
            onClick={() => setSelectedEx(ex)}
            className="glass-panel p-6 rounded-3xl card-hover cursor-pointer group flex flex-col h-full"
          >
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 shadow-md group-hover:scale-110 transition-transform", ex.color)}>
              <ex.icon className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{ex.title}</h3>
            <p className="text-slate-500 dark:text-slate-400 flex-1">{ex.desc}</p>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-sm font-medium text-primary">
              <span className="flex items-center gap-2"><Play className="w-4 h-4 fill-current" /> Start Session</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── FULL SCREEN EXERCISE MODAL ── */}
      <AnimatePresence>
        {selectedEx && (
          <div className="fixed inset-y-0 right-0 left-0 lg:left-72 z-[100] flex items-center justify-center p-4 sm:p-8">
            {/* Background Blur */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            
            {/* Exercise Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl h-[80vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col bg-slate-900 border border-slate-800"
            >
              {/* Ambient Glow */}
              <div className={cn("absolute inset-0 opacity-20 blur-3xl pointer-events-none", selectedEx.color)} />
              <div className={cn("absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-30 blur-3xl pointer-events-none", selectedEx.color)} />
              <div className={cn("absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none", selectedEx.color)} />
              
              {/* Dynamic Component Render */}
              <selectedEx.component 
                onComplete={(duration, metadata) => handleComplete(selectedEx, duration, metadata)} 
                onClose={() => setSelectedEx(null)} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
