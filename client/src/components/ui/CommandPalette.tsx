import React, { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Compass, User, Briefcase, Settings, Sparkles } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext.js';


export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Autofocus input when palette opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const items = [
    { id: '1', name: 'Go to Student Dashboard', category: 'Navigation', icon: <Compass className="w-4 h-4" /> },
    { id: '2', name: 'Manage My Profile', category: 'Navigation', icon: <User className="w-4 h-4" /> },
    { id: '3', name: 'Browse Placement Drives', category: 'Navigation', icon: <Briefcase className="w-4 h-4" /> },
    { id: '4', name: 'Open System Settings', category: 'Admin', icon: <Settings className="w-4 h-4" /> },
    { id: '5', name: 'Gemini AI Advisor', category: 'Features', icon: <Sparkles className="w-4 h-4 text-purple-400" /> },
  ];

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAction = (name: string) => {
    toast(`Command executed: ${name}`, 'success');
    setIsOpen(false);
    setSearch('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] p-4">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm"
          />

          {/* Palette Frame */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col z-10"
          >
            {/* Input Bar */}
            <div className="flex items-center gap-3.5 px-5 py-4 border-b border-border/40">
              <Search className="w-5 h-5 text-zinc-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a command or search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-zinc-100 placeholder-zinc-500 bg-transparent text-sm focus:outline-none"
              />
              <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-950 px-2 py-1 rounded-md border border-zinc-850">ESC</span>
            </div>

            {/* Results list */}
            <div className="max-h-[350px] overflow-y-auto p-2.5">
              {filteredItems.length > 0 ? (
                <div className="space-y-1">
                  {filteredItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleAction(item.name)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-zinc-850/50 text-zinc-300 hover:text-zinc-100 transition-colors text-left text-sm cursor-pointer select-none group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-500 group-hover:text-zinc-300 transition-colors">{item.icon}</span>
                        <span>{item.name}</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-850">{item.category}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-zinc-500">
                  No commands found matching "{search}"
                </div>
              )}
            </div>

            {/* Keyboard shortcuts footer */}
            <div className="flex items-center justify-between p-4 border-t border-border/40 bg-zinc-950/20 text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
              <span>Use ↑↓ to navigate, Enter to select</span>
              <span>Ctrl+K to toggle</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
