import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-center px-4">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mb-8"
      >
        <Compass className="w-16 h-16 text-primary" />
      </motion.div>
      
      <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-4">404</h1>
      <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-md">
        Looks like you're a little lost. Let's get you back to a safe place.
      </p>
      
      <Link to="/" className="primary-button inline-flex items-center gap-2 px-8 py-4 rounded-full text-lg">
        <Home className="w-5 h-5" />
        Return Home
      </Link>
    </div>
  );
}
