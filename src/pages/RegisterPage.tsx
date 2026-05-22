import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Eye, EyeOff, Lock, Mail, User, ShieldAlert, ArrowRight, KanbanSquare } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await register(name, email, password, role);
      showToast('Welcome to TaskFlow! Account created successfully.', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      showToast(err || 'Registration failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 transition-colors duration-200">
      
      {/* Container Card */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden p-8 flex flex-col gap-6">
        
        {/* Banner Title */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white shadow-md">
            <KanbanSquare className="w-6 h-6" />
          </div>
          <h1 className="font-sans font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white mt-1">
            Get Started Free
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create an account to build projects and track deliverables
          </p>
        </div>

        {/* Input Forms */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Full Name input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Full Name
            </label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Johnson"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-850 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-600 dark:focus:border-indigo-505 dark:bg-slate-950 rounded-xl text-sm font-medium outline-none transition-all dark:text-white"
              />
            </div>
          </div>

          {/* Email input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-850 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-600 dark:focus:border-indigo-505 dark:bg-slate-950 rounded-xl text-sm font-medium outline-none transition-all dark:text-white"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••• (min 6 chars)"
                className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-850 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-600 dark:focus:border-indigo-505 dark:bg-slate-950 rounded-xl text-sm font-medium outline-none transition-all dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Role selector selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Application Access Role
            </label>
            <div className="grid grid-cols-2 gap-35 gap-3">
              <button
                type="button"
                onClick={() => setRole('member')}
                className={`flex flex-col p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  role === 'member'
                    ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900 dark:border-indigo-500 dark:bg-indigo-950/20 dark:text-indigo-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                <span className="text-sm font-bold">Member</span>
                <span className="text-[10px] mt-0.5 opacity-80 leading-normal">
                  View assigned boards and progress tasks.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex flex-col p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  role === 'admin'
                    ? 'border-amber-600 bg-amber-50/20 text-amber-900 dark:border-amber-500 dark:bg-amber-950/10 dark:text-amber-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                <span className="text-sm font-bold flex items-center gap-1">
                  Admin <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                </span>
                <span className="text-[10px] mt-0.5 opacity-80 leading-normal">
                  Create and manage global projects and user tasks.
                </span>
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 bg-indigo-600 text-white rounded-xl font-semibold text-sm shadow-md hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50 disabled:scale-100"
          >
            {submitting ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <>
                Create Account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle navigation links */}
        <div className="text-center text-sm text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-850 pt-4 mt-2">
          Already registered?{' '}
          <Link
            to="/login"
            className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5"
          >
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};
