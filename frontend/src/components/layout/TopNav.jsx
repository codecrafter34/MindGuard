import React from 'react';
import { Menu, ShieldAlert, Moon, Sun } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function TopNav({ onOpenSidebar, toggleTheme, isDark }) {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between px-6 glass-panel border-b-0 lg:px-10 lg:h-24">
      <div className="flex items-center gap-4">
        <button 
          onClick={onOpenSidebar}
          className="lg:hidden btn-icon"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6 text-slate-700 dark:text-slate-200" />
        </button>
        <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 hidden sm:block">
          Welcome to your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Safe Space</span>
        </h1>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleTheme}
          className="btn-icon bg-slate-100 dark:bg-slate-800"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-slate-600" />}
        </button>
        
        <button className="flex items-center gap-2 bg-danger-subtle text-danger-darkSubtle hover:bg-danger hover:text-white px-4 py-2 rounded-full font-medium transition-all shadow-sm group dark:bg-danger-darkSubtle dark:text-danger-subtle dark:hover:bg-danger dark:hover:text-white">
          <ShieldAlert className="h-4 w-4 group-hover:animate-pulse" />
          <span className="text-sm">SOS Help</span>
        </button>
      </div>
    </header>
  );
}
