import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Cpu, Layers, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.js';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full max-w-7xl px-6 pt-20 pb-16 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full text-xs font-semibold mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          Next-Gen AI Campus Recruitments
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
          Pilot Your Campus{' '}
          <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Placements
          </span>{' '}
          with intelligence
        </h1>

        <p className="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto mt-6 leading-relaxed">
          Connekt connects students, officers, and recruiters in a unified commercial-grade portal driven by Gemini AI matching, instant pipelines, and live tracking.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-10">
          {isAuthenticated && user ? (
            <Link
              to={`/dashboard/${user.role}`}
              className="flex items-center gap-2 px-7 py-3.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-base font-semibold rounded-xl text-zinc-100 shadow-xl shadow-purple-600/20 transition-all scale-100 hover:scale-[1.02]"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <>
              <Link
                to="/auth/register"
                className="flex items-center gap-2 px-7 py-3.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-base font-semibold rounded-xl text-zinc-100 shadow-xl shadow-purple-600/20 transition-all scale-100 hover:scale-[1.02]"
              >
                Get Started Now
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/auth/login"
                className="px-7 py-3.5 bg-zinc-900 hover:bg-zinc-850 active:bg-zinc-800 border border-zinc-800 text-base font-semibold rounded-xl text-zinc-100 transition-colors"
              >
                Log In
              </Link>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto mt-20 p-8 bg-zinc-900/35 border border-zinc-850 rounded-3xl backdrop-blur-md">
          <div className="text-center">
            <p className="text-3xl font-extrabold text-purple-400">98%</p>
            <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wider font-semibold">Placement Rate</p>
          </div>
          <div className="text-center border-l border-zinc-850">
            <p className="text-3xl font-extrabold text-purple-400">24 LPA</p>
            <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wider font-semibold">Highest Package</p>
          </div>
          <div className="text-center border-l border-zinc-850">
            <p className="text-3xl font-extrabold text-purple-400">150+</p>
            <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wider font-semibold">Hiring Partners</p>
          </div>
          <div className="text-center border-l border-zinc-850">
            <p className="text-3xl font-extrabold text-purple-400">10x</p>
            <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wider font-semibold">Faster Pipelines</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full bg-zinc-900/10 border-y border-zinc-900 py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Engineered for Modern Institutions</h2>
            <p className="text-zinc-400 mt-4">Connekt replaces legacy spreadsheets with a secure automated pipeline.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-2xl relative overflow-hidden group hover:border-zinc-700 transition-all duration-300">
              <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">Gemini AI Assistant</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Smart resume analyzer, automated applicant grading, job-JD matching scores, and real-time student career advising.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-2xl relative overflow-hidden group hover:border-zinc-700 transition-all duration-300">
              <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">Automated Eligibility</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Drives automatically cross-reference CGPA cutoffs, batch year, branches, and backlog rules to secure compliance.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-2xl relative overflow-hidden group hover:border-zinc-700 transition-all duration-300">
              <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">Hiring Pipeline CRM</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Real-time status updates, multi-stage scheduling dashboards for recruiters, and interactive candidate analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust section */}
      <section className="w-full max-w-7xl px-6 py-24 z-10 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6">Designed with Absolute Security</h2>
        <p className="text-zinc-500 text-sm max-w-md mx-auto mb-10 leading-relaxed">
          Connekt integrates secure JWT rotation sessions, Helmet headers, request rate-limiting, and auditable action logs for complete enterprise safety.
        </p>
        <div className="flex flex-wrap justify-center gap-8 text-zinc-500 max-w-lg mx-auto">
          <div className="flex items-center gap-1.5 font-semibold text-xs"><CheckCircle2 className="w-4 h-4 text-purple-500" /> SECURE JWT</div>
          <div className="flex items-center gap-1.5 font-semibold text-xs"><CheckCircle2 className="w-4 h-4 text-purple-500" /> CLOUDINARY STORAGE</div>
          <div className="flex items-center gap-1.5 font-semibold text-xs"><CheckCircle2 className="w-4 h-4 text-purple-500" /> AUDITED LOGS</div>
        </div>
      </section>
    </div>
  );
};
export default LandingPage;
