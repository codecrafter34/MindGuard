import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, HeartPulse, BookOpen, Wind, PhoneCall, Settings, ShieldCheck, Clock, Menu } from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { path: '/chat', label: 'Chat', icon: MessageCircle },
  { path: '/journal', label: 'Journal', icon: BookOpen },
  { path: '/mood', label: 'Mood Tracker', icon: HeartPulse },
  { path: '/self-care', label: 'Exercises', icon: Wind },
  { path: '/resources', label: 'Resources', icon: ShieldCheck },
  { path: '/emergency', label: 'Emergency', icon: PhoneCall, isDanger: true },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <motion.aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 bg-surface-light dark:bg-surface-dark border-r border-slate-200 dark:border-slate-800 shadow-soft transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo Area */}
          <div className="h-20 flex items-center px-8 border-b border-slate-100 dark:border-slate-800">
            <NavLink to="/" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-glow">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                MindGuard<span className="text-primary font-medium">AI</span>
              </span>
            </NavLink>
          </div>

          {/* Nav Links */}
          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group relative",
                    isActive 
                      ? item.isDanger 
                        ? "bg-danger-subtle text-danger-darkSubtle dark:bg-danger-darkSubtle/30 dark:text-danger-subtle"
                        : "bg-primary/10 text-primary-dark dark:bg-primary/20 dark:text-primary-light"
                      : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                  )}
                >
                  {isActive && !item.isDanger && (
                    <motion.div 
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-2xl bg-primary/10 dark:bg-primary/20"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <item.icon className={cn(
                    "h-5 w-5 relative z-10",
                    isActive ? "animate-pulse" : "group-hover:scale-110 transition-transform"
                  )} />
                  <span className="font-medium text-sm relative z-10">{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Bottom Area */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 p-4 border border-primary/10">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 text-center mb-2">
                "Every small step matters."
              </p>
              <p className="text-[10px] text-center text-slate-400">
                Data is stored safely in IBM Cloudant.
              </p>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
