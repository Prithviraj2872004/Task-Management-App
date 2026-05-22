import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowRight } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
        <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: '8s' }} />
      </div>

      <h1 className="font-sans font-extrabold text-3xl tracking-tight text-slate-900 dark:text-white mt-6">
        Page Not Found
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm leading-relaxed">
        The task board or url link you are trying to visit does not exist or has been archived.
      </p>

      <Link
        to="/dashboard"
        className="px-5 py-3 bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-1.5 mt-6 transition-all"
      >
        Go Back to Dashboard
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
};
