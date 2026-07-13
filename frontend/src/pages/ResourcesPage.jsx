import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Phone, ExternalLink, Search } from 'lucide-react';
import { getResources } from '../api/resources';

export default function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadResources() {
      try {
        const data = await getResources();
        setResources(data.resources || []);
      } catch (err) {
        console.error('Failed to load resources:', err);
      } finally {
        setLoading(false);
      }
    }
    loadResources();
  }, []);

  const filteredResources = resources.filter(res => 
    res.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    res.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-full space-y-8">
      <div className="flex-none">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
          <ShieldCheck className="text-primary" />
          Trusted Resources
        </h1>
        <p className="text-slate-500 mt-2">Verified mental health guides and crisis helplines — available immediately.</p>
      </div>

      <div className="glass-panel p-2 rounded-full flex items-center px-4">
        <Search className="w-5 h-5 text-slate-400 mr-2" />
        <input 
          type="text" 
          placeholder="Search for organizations or helplines..." 
          className="w-full bg-transparent border-none focus:ring-0 text-slate-700 dark:text-slate-200 outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-slate-500 font-medium">Loading trusted resources...</div>
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-12 text-slate-500 font-medium">No resources found matching your search.</div>
        ) : (
          <AnimatePresence>
            {filteredResources.map((res, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.05 }}
                key={res.id} 
                className="glass-panel p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 card-hover"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-md">
                      {res.category === 'crisis_helpline' ? 'Helpline' : 'Organization'}
                    </span>
                    {res.country && (
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-md">
                        {res.country}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{res.name}</h3>
                  <p className="text-slate-500 mt-1">{res.description}</p>
                </div>
                <div>
                  {res.phone ? (
                    <a href={`tel:${res.phone}`} className="flex items-center justify-center gap-2 px-6 py-3 bg-danger-subtle text-danger-darkSubtle hover:bg-danger hover:text-white rounded-full font-bold transition-colors w-full sm:w-auto">
                      <Phone className="w-4 h-4" /> {res.phone}
                    </a>
                  ) : (
                    <a href={res.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-6 py-3 glass-button rounded-full font-bold text-slate-700 dark:text-slate-200 w-full sm:w-auto">
                      Visit Site <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
