import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import { useTheme } from '../contexts/ThemeContext.js';
import { Sun, Moon, ArrowRight, Menu, X } from 'lucide-react';

export const PublicLayout: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Background decoration */}
      <div className="absolute top-[-300px] right-[-100px] w-[600px] h-[600px] rounded-full bg-purple-600/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-300px] left-[-100px] w-[600px] h-[600px] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none"></div>

      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-zinc-950/70 border-b border-zinc-900/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-600/30 group-hover:scale-105 transition-transform">
              P
            </div>
            <span className="font-semibold text-lg tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-300 bg-clip-text text-transparent">
              Connekt
            </span>
          </Link>

          {/* Desktop links */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Features</a>
            <a href="#about" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">About</a>
            <a href="#faq" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">FAQ</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2.5 bg-zinc-900/40 border border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-100 transition-colors focus:outline-none"
            >
              {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {isAuthenticated && user ? (
              <Link
                to={`/dashboard/${user.role}`}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-sm font-semibold rounded-xl text-zinc-100 shadow-lg shadow-purple-600/20 transition-all"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/auth/login"
                  className="text-sm font-semibold text-zinc-300 hover:text-zinc-100 transition-colors px-4 py-2"
                >
                  Log In
                </Link>
                <Link
                  to="/auth/register"
                  className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-850 active:bg-zinc-800 border border-zinc-800 text-sm font-semibold rounded-xl text-zinc-100 transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 md:hidden text-zinc-400 hover:text-zinc-100 focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu panel */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-900 bg-zinc-950 p-6 flex flex-col gap-4 animate-in slide-in-from-top-4 duration-200">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm text-zinc-400 hover:text-zinc-100"
            >
              Features
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm text-zinc-400 hover:text-zinc-100"
            >
              About
            </a>
            <hr className="border-zinc-900" />
            <button
              onClick={() => {
                toggleTheme();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 py-1"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              Toggle Theme
            </button>
            {isAuthenticated && user ? (
              <Link
                to={`/dashboard/${user.role}`}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 bg-purple-600 rounded-xl text-sm font-semibold"
              >
                Go to Dashboard
              </Link>
            ) : (
              <div className="flex flex-col gap-2 mt-2">
                <Link
                  to="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-semibold"
                >
                  Log In
                </Link>
                <Link
                  to="/auth/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 bg-purple-600 rounded-xl text-sm font-semibold"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main landing container */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-900 bg-zinc-950 py-12 text-center text-sm text-zinc-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              P
            </div>
            <span className="font-semibold text-zinc-300">Connekt</span>
          </div>
          <div className="flex gap-6 text-xs">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
            <a href="#" className="hover:underline">Support</a>
          </div>
          <p className="text-xs text-zinc-600">&copy; {new Date().getFullYear()} Connekt. Built for campus recruitment excellence.</p>
        </div>
      </footer>
    </div>
  );
};
export default PublicLayout;
