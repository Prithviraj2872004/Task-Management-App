import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';

export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-indigo-600 dark:border-t-indigo-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 font-mono tracking-widest uppercase animate-pulse">
          Starting...
        </p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
