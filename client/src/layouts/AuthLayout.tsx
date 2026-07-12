import React from 'react';
import { Navigate, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext.js';

export const AuthLayout: React.FC = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // If already authenticated, redirect to appropriate dashboard
  if (!loading && isAuthenticated && user) {
    return <Navigate to={`/dashboard/${user.role}`} replace />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none"></div>

      {/* Top navbar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between z-10">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-600/30 group-hover:scale-105 transition-transform">
            P
          </div>
          <span className="font-semibold text-lg tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-300 bg-clip-text text-transparent">
            PlacePilot
          </span>
        </Link>

        <button
          onClick={toggleTheme}
          className="p-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-100 transition-colors focus:outline-none"
        >
          {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </button>
      </header>

      {/* Main Form Area */}
      <main className="flex-grow flex items-center justify-center px-4 py-8 z-10">
        <div className="w-full max-w-md bg-zinc-900/65 border border-zinc-800/80 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-6 text-xs text-zinc-600 z-10 border-t border-zinc-900/50">
        &copy; {new Date().getFullYear()} PlacePilot. All rights reserved. Secure commercial placement suite.
      </footer>
    </div>
  );
};
export default AuthLayout;
