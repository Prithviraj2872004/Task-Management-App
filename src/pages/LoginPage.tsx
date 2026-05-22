import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Eye, EyeOff, Lock, Mail, ArrowRight, KanbanSquare } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      showToast('Welcome back to TaskFlow!', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      showToast(err || 'Failed to authenticate user', 'error');
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
            Access Your Board
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Sign in to collaborate, update tasks, and check statuses
          </p>
        </div>

        {/* Input Forms */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
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
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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

          {/* Submit Action */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 bg-indigo-600 text-white rounded-xl font-semibold text-sm shadow-md hover:bg-indigo-505 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Toggle text */}
        <div className="text-center text-sm text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-850 pt-4 mt-2">
          New to TaskFlow?{' '}
          <Link
            to="/register"
            className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5"
          >
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
};
