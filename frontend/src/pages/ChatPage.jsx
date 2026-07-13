import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Paperclip, AlertCircle, Phone, Heart } from 'lucide-react';
import { useSession } from '../hooks/useSession';
import { sendChatMessage, sendRagMessage } from '../api/chat';
import { cn } from '../lib/utils';

const SUGGESTIONS = [
  "I'm feeling anxious",
  "I can't sleep",
  "I feel lonely",
  "Help me calm down",
  "Breathing exercise"
];

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  const isCrisis = msg.isCrisisResponse;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div className={cn(
        "max-w-[85%] sm:max-w-[75%] px-5 py-4 shadow-sm",
        isUser 
          ? "bg-gradient-to-br from-primary to-primary-light text-white rounded-[24px] rounded-br-[8px]"
          : isCrisis 
            ? "bg-danger-subtle border border-danger/20 text-slate-800 dark:bg-danger-darkSubtle/20 dark:text-slate-200 rounded-[24px] rounded-bl-[8px]"
            : "glass-panel rounded-[24px] rounded-bl-[8px]"
      )}>
        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

        {isCrisis && msg.resources && (
          <div className="mt-4 pt-4 border-t border-danger/20">
            <div className="flex items-center gap-2 mb-3 text-danger-darkSubtle dark:text-danger-subtle font-semibold">
              <AlertCircle className="h-5 w-5" />
              <span>Crisis Helplines</span>
            </div>
            <div className="space-y-2">
              {msg.resources.map(r => (
                <div key={r.name} className="flex justify-between items-center bg-white/50 dark:bg-slate-900/50 p-3 rounded-xl">
                  <span className="font-medium">{r.name}</span>
                  {r.phone && (
                    <a href={`tel:${r.phone}`} className="flex items-center gap-2 bg-danger text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-red-600 transition-colors">
                      <Phone className="h-4 w-4" />
                      {r.phone}
                    </a>
                  )}
                </div>
              ))}
            </div>
            {msg.emergency && <p className="mt-3 text-sm font-semibold text-danger">{msg.emergency}</p>}
          </div>
        )}

        {!isUser && msg.sources && msg.sources.length > 0 && (
          <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            Sources: {msg.sources.join(', ')}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function ChatPage() {
  const { token, sessionReady } = useSession();
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello. I\'m MindGuard AI — a supportive companion for mental wellness. How are you feeling today?\n\nI\'m here to listen, share information, and help you find professional resources. I\'m not a doctor and I cannot diagnose — but I\'m always here to talk.',
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  async function handleSend(textOverride = null) {
    const text = textOverride || input.trim();
    if (!text || loading) return;

    const userMsg = { id: Date.now(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const data = await sendChatMessage(text, token);
      
      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.response,
        isCrisisResponse: data.isCrisisResponse || false,
        resources: data.resources || null,
        emergency: data.emergency || null,
        sources: data.sources || [],
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: err.status === 401 
          ? 'Session expired. Please refresh the page.' 
          : 'I\'m having trouble connecting right now. Please try again in a moment.'
      }]);
    } finally {
      setLoading(false);
    }
  }

  if (!sessionReady) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Heart className="h-12 w-12 text-primary animate-pulse" />
        <p className="text-slate-500 font-medium heartbeat">Preparing your safe space...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)] max-w-4xl mx-auto">
      {/* Header Area */}
      <div className="flex-none pb-6">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
          Supportive Chat
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Talk freely — I'm here to listen and support.</p>
      </div>

      {/* Chat Container */}
      <div className="flex-1 glass-panel rounded-3xl flex flex-col overflow-hidden relative shadow-lg">
        {/* Messages Thread */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <AnimatePresence initial={false}>
            {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
            {loading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                className="flex w-full justify-start"
              >
                <div className="glass-panel px-5 py-4 rounded-[24px] rounded-bl-[8px] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary/60 typing-dot"></span>
                  <span className="w-2 h-2 rounded-full bg-primary/60 typing-dot"></span>
                  <span className="w-2 h-2 rounded-full bg-primary/60 typing-dot"></span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Suggestion Chips (only show if no recent messages or on welcome) */}
        {messages.length === 1 && (
          <div className="px-6 py-2 flex flex-wrap gap-2">
            {SUGGESTIONS.map(sug => (
              <button 
                key={sug}
                onClick={() => handleSend(sug)}
                className="glass-button text-sm px-4 py-2 rounded-full text-slate-600 dark:text-slate-300 transition-transform active:scale-95"
              >
                {sug}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-end gap-2 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-2 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
            <button className="btn-icon text-slate-400 hover:text-primary">
              <Paperclip className="h-5 w-5" />
            </button>
            <textarea
              rows={input.split('\n').length > 1 ? Math.min(input.split('\n').length, 4) : 1}
              className="flex-1 max-h-32 bg-transparent border-none focus:ring-0 resize-none py-3 px-2 text-slate-700 dark:text-slate-200 placeholder-slate-400"
              placeholder="Type a message... (Shift+Enter for new line)"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              disabled={loading}
            />
            {input.trim() ? (
              <button 
                onClick={() => handleSend()}
                disabled={loading}
                className="bg-primary hover:bg-primary-light text-white p-3 rounded-full shadow-md transition-transform active:scale-90 disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </button>
            ) : (
              <button className="btn-icon text-slate-400 hover:text-primary">
                <Mic className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
