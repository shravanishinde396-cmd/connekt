import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext.js';
import { Button } from './Button.js';
import { motion, AnimatePresence } from 'framer-motion';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 hover:text-zinc-100 transition-colors overflow-hidden group"
      aria-label="Toggle visual theme mode"
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === 'dark' ? (
          <motion.div
            key="moon"
            initial={{ y: 20, opacity: 0, rotate: 40 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -20, opacity: 0, rotate: -40 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center text-purple-400 group-hover:text-purple-300"
          >
            <Moon className="w-4.5 h-4.5" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ y: 20, opacity: 0, rotate: -40 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -20, opacity: 0, rotate: 40 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center text-amber-500 group-hover:text-amber-400"
          >
            <Sun className="w-4.5 h-4.5" />
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  );
};
