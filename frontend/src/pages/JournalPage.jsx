import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, PenTool, Clock, ShieldCheck, Search, Calendar, ChevronRight } from 'lucide-react';
import { useSession } from '../hooks/useSession';
import { submitJournalEntry, getJournalEntries } from '../api/journal';
import { cn } from '../lib/utils';

export default function JournalPage() {
  const { token, sessionReady } = useSession();
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingHist, setLoadingHist] = useState(false);
  const [view, setView] = useState('write'); 

  useEffect(() => {
    if (view === 'history' && token) loadHistory();
  }, [view, token]);

  async function loadHistory() {
    setLoadingHist(true);
    try {
      const data = await getJournalEntries(token, 10);
      setEntries(data.entries || []);
    } catch {
      setEntries([]);
    } finally {
      setLoadingHist(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await submitJournalEntry(text.trim(), token);
      setResult(data);
      setText('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (!sessionReady) return <div className="flex items-center justify-center h-full"><span className="heartbeat">Loading...</span></div>;

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-full">
      <div className="flex-none mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
          <Book className="text-primary" />
          Journal & Reflect
        </h1>
        <p className="text-slate-500 mt-2">Write freely about your day. Receive gentle, supportive reflections.</p>
      </div>

      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => setView('write')}
          className={cn("px-6 py-2 rounded-full font-medium transition-all duration-300", view === 'write' ? "bg-primary text-white shadow-glow" : "glass-button")}
        >
          Write Entry
        </button>
        <button 
          onClick={() => setView('history')}
          className={cn("px-6 py-2 rounded-full font-medium transition-all duration-300", view === 'history' ? "bg-primary text-white shadow-glow" : "glass-button")}
        >
          Past Entries
        </button>
      </div>

      <AnimatePresence mode="wait">
        {view === 'write' ? (
          <motion.div 
            key="write"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex-1 flex flex-col"
          >
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col relative glass-panel rounded-3xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <PenTool className="h-4 w-4" />
                  <span>Today, {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                </div>
                <div className="text-xs text-slate-400">Autosaved</div>
              </div>
              <textarea
                className="flex-1 w-full bg-transparent border-none focus:ring-0 resize-none p-6 text-lg text-slate-700 dark:text-slate-200 placeholder-slate-400 font-sans leading-relaxed custom-scrollbar"
                placeholder="What's on your mind today? Write as much or as little as you like..."
                value={text}
                onChange={e => setText(e.target.value)}
                disabled={loading}
              />
              <div className="px-6 py-4 bg-white/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-sm text-slate-400">{text.length} / 3000 chars</span>
                <button 
                  type="submit" 
                  disabled={loading || !text.trim()}
                  className="primary-button px-8 py-3 rounded-2xl flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"/> Reflecting...</>
                  ) : (
                    <>Submit & Reflect <ChevronRight className="w-5 h-5" /></>
                  )}
                </button>
              </div>
            </form>

            {result && !result.isCrisisResponse && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-3xl"
              >
                <div className="flex items-center gap-2 text-primary font-bold mb-3 uppercase tracking-wider text-xs">
                  <ShieldCheck className="w-4 h-4" /> Supportive Reflection
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{result.reflection}</p>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="history"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Search/Filter Bar */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 glass-panel rounded-full px-4 py-2 flex items-center gap-2 focus-within:ring-2 ring-primary">
                <Search className="w-5 h-5 text-slate-400" />
                <input type="text" placeholder="Search entries..." className="bg-transparent border-none focus:ring-0 flex-1 outline-none text-slate-700 dark:text-slate-200" />
              </div>
              <button className="glass-button px-4 py-2 rounded-full flex items-center gap-2">
                <Calendar className="w-5 h-5 text-slate-500" />
                <span>Filter</span>
              </button>
            </div>

            {loadingHist ? (
              <div className="text-center py-12 text-slate-500">Loading your history...</div>
            ) : entries.length === 0 ? (
              <div className="glass-panel p-12 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                <Book className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium text-lg">No entries yet</p>
                <p className="text-slate-400">Write your first journal entry to see it here.</p>
              </div>
            ) : (
              entries.map(e => (
                <div key={e.id} className="glass-panel p-6 rounded-3xl card-hover">
                  <div className="flex justify-between items-center mb-4 text-sm text-slate-500">
                    <span className="flex items-center gap-2"><Clock className="w-4 h-4"/> {new Date(e.createdAt).toLocaleString()}</span>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold uppercase",
                      e.safetyLabel === 'SAFE' ? "bg-success-subtle text-success-darkSubtle" : "bg-warning-subtle text-warning-darkSubtle"
                    )}>
                      {e.safetyLabel || 'SAFE'}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-3">{e.reflection}</p>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
