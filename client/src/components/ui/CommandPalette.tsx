import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Compass, User, Briefcase, Settings, Sparkles, Building2, Users } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext.js';
import { useAuth } from '../../contexts/AuthContext.js';

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

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

  // Create role-specific items dynamically
  const getItems = () => {
    if (!user) return [];

    const baseItems = [
      { id: 'home', name: 'Go to Landing Page', category: 'Navigation', path: '/', icon: <Compass className="w-4 h-4" /> }
    ];

    if (user.role === 'student') {
      return [
        ...baseItems,
        { id: 's-dash', name: 'Go to Student Dashboard', category: 'Student Portal', path: '/dashboard/student', icon: <Compass className="w-4 h-4" /> },
        { id: 's-profile', name: 'Manage Resume & Profile', category: 'Student Portal', path: '/dashboard/student/profile', icon: <User className="w-4 h-4" /> },
        { id: 's-drives', name: 'Browse Placement Drives', category: 'Student Portal', path: '/dashboard/student/drives', icon: <Briefcase className="w-4 h-4" /> },
        { id: 's-chat', name: 'Chat with Connekt AI Advisor', category: 'Features', action: 'toggle-ai-chat', icon: <Sparkles className="w-4 h-4 text-purple-400" /> }
      ];
    }

    if (user.role === 'placement_officer') {
      return [
        ...baseItems,
        { id: 'o-dash', name: 'Go to Officer Overview', category: 'Officer Portal', path: '/dashboard/placement_officer', icon: <Compass className="w-4 h-4" /> },
        { id: 'o-companies', name: 'Manage Corporate Partners', category: 'Officer Portal', path: '/dashboard/placement_officer/companies', icon: <Building2 className="w-4 h-4" /> },
        { id: 'o-drives', name: 'Manage Placement Drives', category: 'Officer Portal', path: '/dashboard/placement_officer/drives', icon: <Briefcase className="w-4 h-4" /> }
      ];
    }

    if (user.role === 'recruiter') {
      return [
        ...baseItems,
        { id: 'r-dash', name: 'Go to Recruiter Overview', category: 'Recruiter Portal', path: '/dashboard/recruiter', icon: <Compass className="w-4 h-4" /> },
        { id: 'r-drives', name: 'Manage Corporate Hiring Drives', category: 'Recruiter Portal', path: '/dashboard/recruiter/drives', icon: <Briefcase className="w-4 h-4" /> },
        { id: 'r-applicants', name: 'Manage Candidates & Applications', category: 'Recruiter Portal', path: '/dashboard/recruiter/applicants', icon: <Users className="w-4 h-4" /> }
      ];
    }

    if (user.role === 'admin') {
      return [
        ...baseItems,
        { id: 'a-overview', name: 'Go to Admin Overview', category: 'Admin Panel', path: '/dashboard/admin?tab=overview', icon: <Compass className="w-4 h-4" /> },
        { id: 'a-users', name: 'Manage User Accounts', category: 'Admin Panel', path: '/dashboard/admin?tab=users', icon: <Users className="w-4 h-4" /> },
        { id: 'a-audit', name: 'View System Audit Logs', category: 'Admin Panel', path: '/dashboard/admin?tab=audit', icon: <Settings className="w-4 h-4" /> }
      ];
    }

    return baseItems;
  };

  const items = getItems();

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAction = (item: any) => {
    if (item.path) {
      navigate(item.path);
      toast(`Navigating to ${item.name}`, 'info');
    } else if (item.action === 'toggle-ai-chat') {
      window.dispatchEvent(new CustomEvent('open-ai-chat'));
      toast(`Opening Connekt AI Career Advisor`, 'success');
    }
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
                      onClick={() => handleAction(item)}
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
