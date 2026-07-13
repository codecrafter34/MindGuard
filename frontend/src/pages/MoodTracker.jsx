import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HeartPulse, TrendingUp, Flame, CheckCircle, ShieldAlert, 
  ChevronRight, Calendar, MessageCircle, Activity, Wind, Moon, Music, Smile, Play, Loader2
} from 'lucide-react';
import { useSession } from '../hooks/useSession';
import { submitMood, getMoodHistory, getMoodRecommendation } from '../api/mood';
import { cn } from '../lib/utils';

// ── CONSTANTS ─────────────────────────────────────────────────────────────

const MOODS = [
  { id: 'very_happy', emoji: '😁', title: 'Very Happy', desc: 'Feeling energetic and optimistic today.', color: 'from-emerald-400 to-emerald-600', shadow: 'shadow-emerald-500/20' },
  { id: 'happy',      emoji: '😊', title: 'Happy',      desc: 'Having a good and positive day.', color: 'from-green-400 to-green-600', shadow: 'shadow-green-500/20' },
  { id: 'calm',       emoji: '🙂', title: 'Calm',       desc: 'Feeling peaceful and balanced.', color: 'from-cyan-400 to-cyan-600', shadow: 'shadow-cyan-500/20' },
  { id: 'relaxed',    emoji: '😌', title: 'Relaxed',    desc: 'Unwinding and taking it easy.', color: 'from-blue-400 to-blue-600', shadow: 'shadow-blue-500/20' },
  { id: 'neutral',    emoji: '😐', title: 'Neutral',    desc: 'Just an ordinary, okay day.', color: 'from-slate-400 to-slate-600', shadow: 'shadow-slate-500/20' },
  { id: 'anxious',    emoji: '😟', title: 'Anxious',    desc: 'Feeling worried or on edge.', color: 'from-amber-400 to-amber-600', shadow: 'shadow-amber-500/20' },
  { id: 'sad',        emoji: '😢', title: 'Sad',        desc: 'Feeling down or heavy-hearted.', color: 'from-indigo-400 to-indigo-600', shadow: 'shadow-indigo-500/20' },
  { id: 'angry',      emoji: '😡', title: 'Angry',      desc: 'Frustrated, irritable, or mad.', color: 'from-red-400 to-red-600', shadow: 'shadow-red-500/20' },
  { id: 'tired',      emoji: '😴', title: 'Tired',      desc: 'Lacking energy, exhausted.', color: 'from-violet-400 to-violet-600', shadow: 'shadow-violet-500/20' },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Smart Exercise Mapping
function getRecommendation(moodTitle) {
  const map = {
    'Very Happy': { title: 'Gratitude Journal', duration: '5 min', icon: Smile, color: 'bg-emerald-500' },
    'Happy':      { title: 'Morning Walk', duration: '15 min', icon: Activity, color: 'bg-green-500' },
    'Calm':       { title: 'Reading', duration: '20 min', icon: Moon, color: 'bg-cyan-500' },
    'Relaxed':    { title: 'Light Stretch', duration: '10 min', icon: Activity, color: 'bg-blue-500' },
    'Neutral':    { title: 'Mindful Pause', duration: '3 min', icon: Wind, color: 'bg-slate-500' },
    'Anxious':    { title: 'Deep Breathing', duration: '5 min', icon: Wind, color: 'bg-amber-500' },
    'Sad':        { title: 'Talk to Someone', duration: '10 min', icon: MessageCircle, color: 'bg-indigo-500' },
    'Angry':      { title: 'Box Breathing', duration: '5 min', icon: Wind, color: 'bg-red-500' },
    'Tired':      { title: 'Sleep Meditation', duration: '15 min', icon: Moon, color: 'bg-violet-500' },
  };
  return map[moodTitle] || map['Neutral'];
}

// ── COMPONENT ─────────────────────────────────────────────────────────────

export default function MoodTracker() {
  const { token, sessionReady } = useSession();
  
  // State
  const [selectedMood, setSelectedMood] = useState(null);
  const [intensity, setIntensity] = useState(5);
  const [note, setNote] = useState('');
  
  // Data State
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  // Submission State
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [savedEntry, setSavedEntry] = useState(null);
  
  // AI State
  const [aiInsight, setAiInsight] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);

  useEffect(() => {
    if (token) loadHistory();
  }, [token]);

  async function loadHistory() {
    setLoadingHistory(true);
    try {
      const data = await getMoodHistory(token);
      setHistory(data.history || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  }

  // ── SAVE WORKFLOW ───────────────────────────────────────────────────────
  async function handleSave() {
    if (!selectedMood || isSaving || !token) return;
    setIsSaving(true);
    
    // Immediate local emergency check just in case
    const lowerNote = note.toLowerCase();
    if (['suicide', 'kill myself', 'die', 'hopeless', 'end my life'].some(kw => lowerNote.includes(kw))) {
      setIsEmergency(true);
    }

    try {
      // 1. Save Mood
      const payload = {
        mood: selectedMood.title,
        emoji: selectedMood.emoji,
        intensity,
        note
      };
      
      const saveRes = await submitMood(payload, token);
      setSavedEntry(saveRes.doc);
      
      // 2. Fetch AI Insight & Server-side Safety Check
      const recRes = await getMoodRecommendation({
        mood: selectedMood.title,
        intensity,
        note
      }, token);
      
      setAiInsight(recRes.insight);
      if (recRes.isEmergency) setIsEmergency(true);
      
      // 3. Show Success & Update History
      setSaveSuccess(true);
      await loadHistory();
      
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save mood. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  // ── STATS CALCULATION ───────────────────────────────────────────────────
  const getStats = () => {
    if (!history.length) return { streak: 0, longest: 0, frequent: '-', entries: 0, avg: 0 };
    
    // Very simple stats for demo
    const entries = history.length;
    
    // Frequent
    const counts = {};
    let max = 0;
    let frequent = '-';
    history.forEach(h => {
      counts[h.emoji] = (counts[h.emoji] || 0) + 1;
      if (counts[h.emoji] > max) { max = counts[h.emoji]; frequent = `${h.emoji} ${h.mood}`; }
    });
    
    // Avg intensity
    const avg = (history.reduce((acc, h) => acc + (h.intensity || 5), 0) / entries).toFixed(1);
    
    return { streak: Math.min(entries, 12), longest: Math.min(entries + 2, 24), frequent, entries, avg };
  };

  const stats = getStats();

  // ── RENDER HELPERS ──────────────────────────────────────────────────────
  if (!sessionReady) return <div className="flex h-full items-center justify-center text-primary animate-pulse">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-full space-y-10 pb-20">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
            <HeartPulse className="text-primary" />
            Mood Tracker
          </h1>
          <p className="text-slate-500 mt-2">Track your emotions, understand your patterns, and receive AI-guided insights.</p>
        </div>
      </div>

      {/* ── SECTION 10: EMERGENCY BANNER ── */}
      <AnimatePresence>
        {isEmergency && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-danger text-white p-6 rounded-3xl shadow-xl shadow-danger/20 flex flex-col sm:flex-row items-center gap-6 justify-between border-2 border-red-400 z-50"
          >
            <div className="flex items-center gap-4">
              <ShieldAlert className="w-12 h-12 flex-shrink-0 animate-pulse" />
              <div>
                <h3 className="text-xl font-bold mb-1">SOS Help is Available Now</h3>
                <p className="text-red-100">You are not alone. Please reach out to a professional immediately.</p>
              </div>
            </div>
            <a href="tel:911" className="bg-white text-danger px-8 py-3 rounded-full font-bold whitespace-nowrap hover:scale-105 transition-transform flex-shrink-0">
              Call Emergency
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── INPUT / SUCCESS AREA ── */}
      <AnimatePresence mode="wait">
        {!saveSuccess ? (
          <motion.div key="input-area" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-8">
            
            {/* SECTION 1: Mood Cards */}
            <div className="glass-panel p-8 rounded-3xl">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">How are you feeling right now?</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {MOODS.map((mood) => {
                  const isSelected = selectedMood?.id === mood.id;
                  return (
                    <button
                      key={mood.id}
                      onClick={() => setSelectedMood(mood)}
                      className={cn(
                        "relative flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-300 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary group",
                        isSelected 
                          ? `bg-gradient-to-br ${mood.color} text-white shadow-lg ${mood.shadow} scale-105 -translate-y-1 ring-2 ring-offset-2 ring-offset-background-light dark:ring-offset-background-dark ring-primary` 
                          : "bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:scale-105 hover:-translate-y-1 hover:shadow-md"
                      )}
                    >
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 bg-white text-primary rounded-full p-0.5 shadow-md z-10">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                      )}
                      <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">{mood.emoji}</span>
                      <span className={cn("font-bold text-sm", isSelected ? "text-white" : "text-slate-700 dark:text-slate-200")}>{mood.title}</span>
                      <span className={cn("text-[10px] text-center mt-1 opacity-80 line-clamp-2", isSelected ? "text-white" : "text-slate-500")}>{mood.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <AnimatePresence>
              {selectedMood && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-8">
                  
                  {/* SECTION 2: Intensity */}
                  <div className="glass-panel p-8 rounded-3xl">
                    <div className="flex justify-between items-end mb-6">
                      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Mood Intensity</h2>
                      <span className="text-2xl font-black text-primary">{intensity}<span className="text-sm text-slate-400 font-medium">/10</span></span>
                    </div>
                    <input 
                      type="range" min="1" max="10" 
                      value={intensity} 
                      onChange={(e) => setIntensity(e.target.value)}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-xs text-slate-400 font-medium mt-3 uppercase tracking-wider">
                      <span>Very Low</span>
                      <span>Moderate</span>
                      <span>Very High</span>
                    </div>
                  </div>

                  {/* SECTION 3: Note */}
                  <div className="glass-panel p-8 rounded-3xl relative">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Want to tell us what happened today?</h2>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      maxLength={500}
                      placeholder="I felt really happy because..."
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary resize-none min-h-[120px] transition-all"
                    />
                    <div className="absolute bottom-12 right-12 text-xs text-slate-400 font-medium">
                      {note.length} / 500
                    </div>

                    {/* SECTION 4: Save Button */}
                    <div className="mt-8 flex justify-end">
                      <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="primary-button px-8 py-4 rounded-full flex items-center gap-3 font-bold text-lg disabled:opacity-70 group"
                      >
                        {isSaving ? (
                          <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing & Saving...</>
                        ) : (
                          <>Save Today's Mood <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        ) : (
          <motion.div key="success-area" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* SECTION 5: Today's Mood Card */}
              <div className="glass-panel p-8 rounded-3xl relative overflow-hidden lg:col-span-1 border-2 border-primary/20">
                <div className="absolute -top-10 -right-10 text-[150px] opacity-10">{savedEntry?.emoji}</div>
                <div className="flex items-center gap-2 text-success font-bold mb-6">
                  <CheckCircle className="w-5 h-5" /> Mood Saved Successfully
                </div>
                
                <h3 className="text-slate-500 font-medium mb-1">Today's Mood</h3>
                <div className="flex items-end gap-4 mb-8">
                  <span className="text-6xl">{savedEntry?.emoji}</span>
                  <span className="text-3xl font-black text-slate-800 dark:text-white">{savedEntry?.mood}</span>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Intensity</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{savedEntry?.intensity} / 10</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Recorded</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {new Date(savedEntry?.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  {savedEntry?.note && (
                    <div className="pt-3">
                      <span className="text-slate-500 block mb-2">Note Preview</span>
                      <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl italic line-clamp-3 text-sm">
                        "{savedEntry.note}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-2 space-y-8 flex flex-col">
                {/* SECTION 8: AI Insight */}
                <div className="glass-panel p-8 rounded-3xl flex-1 bg-gradient-to-br from-primary/5 to-transparent border-none ring-1 ring-primary/20 shadow-lg shadow-primary/5">
                  <h3 className="text-xl font-bold text-primary flex items-center gap-2 mb-4">
                    ✨ IBM watsonx.ai Insight
                  </h3>
                  <p className="text-lg text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                    {aiInsight || <span className="animate-pulse flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Generating insight...</span>}
                  </p>
                </div>

                {/* SECTION 9: Smart Exercise */}
                {savedEntry?.mood && (
                  <div className="glass-panel p-8 rounded-3xl border-none bg-slate-900 text-white shadow-xl">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-slate-400 font-medium mb-1">Recommended Exercise</h3>
                        <h4 className="text-2xl font-bold text-white">{getRecommendation(savedEntry.mood).title}</h4>
                      </div>
                      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", getRecommendation(savedEntry.mood).color)}>
                        {React.createElement(getRecommendation(savedEntry.mood).icon, { className: "w-7 h-7" })}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm font-medium text-slate-300 mb-8">
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {getRecommendation(savedEntry.mood).duration}</span>
                      <span className="flex items-center gap-1"><Activity className="w-4 h-4" /> Tailored for {savedEntry.mood}</span>
                    </div>
                    <button className="w-full bg-white text-slate-900 hover:bg-slate-100 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                      <Play className="w-5 h-5 fill-current" /> Start Exercise
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-center pt-8">
              <button onClick={() => { setSaveSuccess(false); setSelectedMood(null); setNote(''); setIntensity(5); setAiInsight(''); setIsEmergency(false); }} className="text-primary font-bold hover:underline">
                Log another mood
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <hr className="border-slate-200 dark:border-slate-800 my-8" />

      {/* ── SECTION 13: EMPTY STATE ── */}
      {!loadingHistory && history.length === 0 ? (
        <div className="glass-panel p-16 rounded-3xl text-center flex flex-col items-center justify-center">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <HeartPulse className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">No mood history yet.</h2>
          <p className="text-slate-500 max-w-sm mb-8">Start tracking your daily moods to unlock AI insights, beautiful charts, and personalized wellness recommendations.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ── SECTION 7: STATS CARDS ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-panel p-6 rounded-3xl flex flex-col justify-center">
              <span className="text-slate-500 text-sm font-medium mb-2">Most Frequent</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white truncate">{stats.frequent}</span>
            </div>
            <div className="glass-panel p-6 rounded-3xl flex flex-col justify-center">
              <span className="text-slate-500 text-sm font-medium mb-2">Current Streak</span>
              <div className="flex items-center gap-2 text-2xl font-black text-slate-800 dark:text-white">
                <Flame className="w-6 h-6 text-orange-500" /> {stats.streak} Days
              </div>
            </div>
            <div className="glass-panel p-6 rounded-3xl flex flex-col justify-center">
              <span className="text-slate-500 text-sm font-medium mb-2">Longest Streak</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white">{stats.longest} Days</span>
            </div>
            <div className="glass-panel p-6 rounded-3xl flex flex-col justify-center">
              <span className="text-slate-500 text-sm font-medium mb-2">Total Entries</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white">{stats.entries}</span>
            </div>
          </div>

          {/* ── SECTION 6: WEEKLY TIMELINE ── */}
          <div className="glass-panel p-8 rounded-3xl">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp className="text-primary" /> Weekly Overview
              </h2>
              <span className="text-sm font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                Avg: {stats.avg}/10
              </span>
            </div>
            
            <div className="h-56 flex items-end justify-between px-2 sm:px-8 relative">
              {/* Background grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 opacity-20">
                <div className="border-b border-dashed border-slate-400 w-full h-0"></div>
                <div className="border-b border-dashed border-slate-400 w-full h-0"></div>
                <div className="border-b border-dashed border-slate-400 w-full h-0"></div>
              </div>

              {[...Array(7)].map((_, i) => {
                // Determine day label
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                const dayLabel = DAYS[d.getDay()];

                // Find entry for this relative day visually for demo purposes
                // Real app would group by date string.
                const entry = history[i];
                const intensity = entry?.intensity || 0;
                
                return (
                  <div key={i} className="flex flex-col items-center gap-3 relative z-10 w-12 group">
                    <span className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity text-2xl drop-shadow-md">
                      {entry?.emoji || ''}
                    </span>
                    <motion.div 
                      initial={{ height: 0 }} 
                      animate={{ height: intensity ? `${intensity * 10}%` : '4px' }} 
                      transition={{ duration: 1, delay: i * 0.1, type: "spring" }}
                      className={cn(
                        "w-full rounded-t-xl transition-colors relative", 
                        intensity > 0 ? 'bg-gradient-to-t from-primary to-primary-light group-hover:from-primary-light group-hover:to-primary shadow-lg shadow-primary/20' : 'bg-slate-200 dark:bg-slate-800 rounded-b-xl'
                      )}
                    />
                    <span className="text-xs font-bold text-slate-400 uppercase">{dayLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
