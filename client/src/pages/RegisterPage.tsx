import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import { useToast } from '../contexts/ToastContext.js';
import { User, Mail, Lock, ArrowRight, ClipboardList } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'placement_officer' | 'recruiter'>('student');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !role) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setErrorMsg('');
    setSubmitting(true);

    try {
      await register(name, email, password, role);
      toast('Registration successful!', 'success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Try again.');
      toast(err.message || 'Registration failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full text-xs font-semibold mb-3">
          <ClipboardList className="w-3.5 h-3.5" />
          Create Security Identity
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Get Started</h2>
        <p className="text-sm text-zinc-400 mt-1.5">Configure your credentials to join PlacePilot</p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-xl text-red-200 text-xs font-medium animate-in fade-in">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Full Name</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-950/50 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-zinc-100 placeholder-zinc-600 transition-colors"
            />
          </div>
        </div>

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
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••••••• (Min 6 chars)"
              required
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-950/50 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 text-zinc-100 placeholder-zinc-650 transition-colors"
            />
          </div>
        </div>

        {/* Role Select */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">I am registering as a</label>
          <div className="grid grid-cols-3 gap-2">
            {(['student', 'placement_officer', 'recruiter'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`py-2 px-1 text-xs font-bold border rounded-xl capitalize transition-all ${
                  role === r
                    ? 'bg-purple-600 border-purple-500 text-zinc-100 shadow-md shadow-purple-600/10'
                    : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                {r.replace('_', ' ')}
              </button>
            ))}
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
              Register Account
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="text-center text-xs text-zinc-500">
        Already have an account?{' '}
        <Link to="/auth/login" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
          Log In
        </Link>
      </div>
    </div>
  );
};
export default RegisterPage;
