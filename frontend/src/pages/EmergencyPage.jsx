import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, ShieldAlert, Heart, Globe } from 'lucide-react';
import { getResources } from '../api/resources';

export default function EmergencyPage() {
  const [helplines, setHelplines] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await getResources();
        // Filter only helplines
        const lines = (data.resources || []).filter(r => r.category === 'crisis_helpline' && r.phone);
        setHelplines(lines);
      } catch (err) {
        console.error('Failed to load emergency resources:', err);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center px-4 space-y-8">
      
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-32 h-32 bg-danger/10 rounded-full flex items-center justify-center mb-4 relative"
      >
        <div className="absolute inset-0 bg-danger/20 rounded-full animate-ping opacity-75"></div>
        <ShieldAlert className="w-16 h-16 text-danger relative z-10" />
      </motion.div>
      
      <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white">
        You are <span className="text-danger">not alone.</span>
      </h1>
      
      <p className="text-xl text-slate-600 dark:text-slate-300 max-w-lg">
        If you are in immediate danger or experiencing a crisis, please reach out to professional help right away.
      </p>

      <div className="w-full space-y-4 mt-8">
        {helplines.length > 0 ? (
          helplines.map((line, i) => (
            <motion.a 
              key={line.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              href={`tel:${line.phone}`}
              className="flex items-center justify-between p-6 bg-danger text-white rounded-3xl shadow-lg hover:bg-red-600 transition-colors group"
            >
              <div className="text-left">
                <h3 className="text-xl font-bold">{line.name}</h3>
                <p className="text-danger-subtle text-sm mt-1">{line.description}</p>
              </div>
              <div className="bg-white/20 p-4 rounded-full group-hover:scale-110 transition-transform">
                <Phone className="w-8 h-8" />
              </div>
            </motion.a>
          ))
        ) : (
          <div className="p-8 glass-panel rounded-3xl border-2 border-danger/50 text-slate-800 dark:text-slate-200">
            <h3 className="text-2xl font-bold mb-4">Dial your local emergency number</h3>
            <p className="text-lg">Please call <strong>911</strong> (US), <strong>112</strong> (EU/India), or your local emergency services immediately.</p>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 mt-12 text-slate-500">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-primary" />
          <span>We care about you</span>
        </div>
        <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></div>
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-secondary" />
          <span>Help is available worldwide</span>
        </div>
      </div>
    </div>
  );
}
