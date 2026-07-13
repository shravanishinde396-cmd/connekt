import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import api from '../services/api.js';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, Sparkles, User } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AIChatbox: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi ${user?.name || 'there'}! I am Connekt AI, your campus placement assistant. Ask me anything about resume scores, interview prep, career eligibility, or general placement tips!`,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  useEffect(() => {
    const handleOpenChat = () => {
      setIsOpen(true);
    };
    window.addEventListener('open-ai-chat', handleOpenChat);
    return () => window.removeEventListener('open-ai-chat', handleOpenChat);
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await api.post('/ai/chat', {
        messages: [...messages, userMessage],
        context: {
          currentPath: location.pathname,
          userRole: user?.role,
          userName: user?.name,
        },
      });

      const aiReply = response.data.reply || "Sorry, I couldn't process that request.";
      setMessages((prev) => [...prev, { role: 'assistant', content: aiReply }]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Connection issue. I am running in local fallback mode. Please ensure the backend is active.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expanded Chatbox Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="w-80 sm:w-96 h-[480px] bg-zinc-950/95 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden mb-4 backdrop-blur-md"
          >
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-purple-600/30 to-indigo-600/30 border-b border-zinc-800 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-600/20">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-100 flex items-center gap-1">
                    Connekt AI Assistant
                    <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
                  </h3>
                  <span className="text-[10px] text-zinc-400 font-mono">Status: Online</span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors focus:outline-none cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((msg, index) => {
                const isAI = msg.role === 'assistant';
                return (
                  <div
                    key={index}
                    className={`flex gap-3 max-w-[85%] ${isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                  >
                    {/* Avatar icon */}
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                        isAI ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20' : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {isAI ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                    </div>

                    {/* Chat Bubble */}
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        isAI
                          ? 'bg-zinc-900 border border-zinc-850 text-zinc-200 rounded-tl-sm'
                          : 'bg-purple-650 text-white rounded-tr-sm shadow-md shadow-purple-950/20'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}

              {/* Typing Loader */}
              {loading && (
                <div className="flex gap-3 max-w-[85%] mr-auto">
                  <div className="w-6 h-6 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-zinc-900 border border-zinc-850 p-3 rounded-2xl rounded-tl-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <form onSubmit={handleSendMessage} className="p-4 bg-zinc-900/40 border-t border-zinc-850 flex gap-2">
              <input
                type="text"
                placeholder="Ask me about placements, resume score..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-purple-500 text-zinc-100 placeholder-zinc-500"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || loading}
                className="p-2 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-800 disabled:text-zinc-650 rounded-xl text-white shadow-lg transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (FAB) */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-purple-650 hover:bg-purple-755 text-white rounded-full flex items-center justify-center shadow-2xl cursor-pointer relative group"
      >
        <span className="absolute inset-0 rounded-full bg-purple-500/10 scale-100 group-hover:scale-125 transition-transform duration-500"></span>
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </motion.button>
    </div>
  );
};

export default AIChatbox;
