import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle, Smile } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Gratitude({ onComplete, onClose }) {
  const [notes, setNotes] = useState(['', '', '']);
  const [isFinished, setIsFinished] = useState(false);

  const handleNoteChange = (index, value) => {
    const newNotes = [...notes];
    newNotes[index] = value;
    setNotes(newNotes);
  };

  const handleFinish = () => {
    // Only proceed if they've written at least one
    if (notes.some(n => n.trim().length > 0)) {
      setIsFinished(true);
    }
  };

  const handleComplete = () => {
    // Pass duration = 5, and metadata containing the notes
    onComplete(5, { notes: notes.filter(n => n.trim().length > 0) });
  };

  const isFormValid = notes.some(n => n.trim().length > 0);

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
            <Smile className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Gratitude Journal</h2>
          <p className="text-emerald-100 mb-8 max-w-sm">Reflecting on what went well can dramatically shift your mood. List up to three things.</p>

          <div className="w-full max-w-md space-y-4 mb-8">
            {[0, 1, 2].map((i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {i + 1}
                </div>
                <input
                  type="text"
                  placeholder={`I am grateful for...`}
                  value={notes[i]}
                  onChange={(e) => handleNoteChange(i, e.target.value)}
                  className="w-full bg-black/10 border border-white/20 rounded-xl py-4 pl-14 pr-4 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                />
              </motion.div>
            ))}
          </div>

          <button 
            onClick={handleFinish}
            disabled={!isFormValid}
            className="bg-white text-emerald-600 px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
          >
            Reflect & Finish
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
          <h2 className="text-4xl font-bold text-white mb-4">Heart Full</h2>
          <p className="text-emerald-100 text-lg mb-8 max-w-sm">You've successfully locked in these moments of gratitude. Your journal is saved.</p>
          <button 
            onClick={handleComplete}
            className="bg-white text-emerald-600 px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
          >
            Save to Cloudant
          </button>
        </motion.div>
      )}
    </div>
  );
}
