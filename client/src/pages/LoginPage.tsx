import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import { useToast } from '../contexts/ToastContext.js';
import { Mail, Lock, ArrowRight, Shield } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    setErrorMsg('');
    setSubmitting(true);

    try {
      await login(email, password);
      toast('Login successful!', 'success');
      // AuthLayout will automatically redirect them since AuthContext user changes,
      // but navigate to /dashboard serves as a good trigger
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid credentials. Please try again.');
      toast(err.message || 'Login failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full text-xs font-semibold mb-3">
          <Shield className="w-3.5 h-3.5" />
          Enterprise Portal Gateway
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Welcome Back</h2>
        <p className="text-sm text-zinc-400 mt-1.5">Sign in to control your recruitment desk</p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-xl text-red-200 text-xs font-medium animate-in fade-in">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@organization.com"
              required
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-950/50 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-zinc-100 placeholder-zinc-600 transition-colors"
            />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Password</label>
            <Link to="/auth/forgot-password" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-950/50 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-zinc-100 placeholder-zinc-650 transition-colors"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 mt-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 disabled:bg-purple-900 disabled:opacity-40 text-sm font-semibold rounded-xl text-zinc-100 shadow-lg shadow-purple-600/10 transition-all focus:outline-none"
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-zinc-100 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              Sign In
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="text-center text-xs text-zinc-500">
        Don&apos;t have an account?{' '}
        <Link to="/auth/register" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
          Create account
        </Link>
      </div>
    </div>
  );
};
export default LoginPage;
