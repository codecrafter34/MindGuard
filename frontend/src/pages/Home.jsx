import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeartPulse, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-12 min-h-[calc(100vh-8rem)]">
      {/* Left Content */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex-1 space-y-8 max-w-2xl"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary-dark dark:bg-primary/20 dark:text-primary-light font-medium text-sm">
          <HeartPulse className="h-4 w-4" />
          <span>IBM watsonx.ai Powered</span>
        </div>
        
        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
          You're never <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">alone.</span>
        </h1>
        
        <p className="text-lg lg:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
          MindGuard AI provides emotional support, mental wellness guidance, trusted resources and early intervention.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Link to="/chat" className="primary-button inline-flex items-center justify-center px-8 py-4 rounded-2xl text-lg w-full sm:w-auto">
            Start Conversation
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <Link to="/mood" className="glass-button inline-flex items-center justify-center px-8 py-4 rounded-2xl text-lg font-medium text-slate-700 dark:text-slate-200 w-full sm:w-auto">
            Take Mental Health Check
          </Link>
        </div>
      </motion.div>

      {/* Right Illustration */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="flex-1 w-full max-w-lg lg:max-w-none relative"
      >
        {/* Abstract SVG representing Hope and Growth */}
        <div className="relative aspect-square w-full">
          {/* Soft background glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-primary/20 dark:bg-primary/10 blur-[80px] rounded-full" />
          <div className="absolute top-1/4 right-1/4 w-1/2 h-1/2 bg-secondary/30 dark:bg-secondary/20 blur-[60px] rounded-full" />
          
          <svg viewBox="0 0 400 400" className="w-full h-full relative z-10 drop-shadow-2xl">
            {/* Minimal Shield/Heart shape */}
            <motion.path
              d="M200 50 C200 50, 320 80, 320 180 C320 280, 200 350, 200 350 C200 350, 80 280, 80 180 C80 80, 200 50, 200 50 Z"
              fill="url(#grad1)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
            {/* Inner gentle curve / leaf */}
            <motion.path
              d="M150 250 Q200 150 250 250"
              stroke="white"
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, delay: 1 }}
            />
            <circle cx="200" cy="180" r="12" fill="white" />
            
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.8" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </motion.div>
    </div>
  );
}
