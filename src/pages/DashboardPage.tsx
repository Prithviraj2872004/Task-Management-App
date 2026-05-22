import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI, projectsAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { DashboardStats, Activity, Project } from '../types.js';
import { 
  CheckCircle2, PlayCircle, Clock, AlertTriangle, ListTodo,
  TrendingUp, Calendar, ArrowRight, Kanban, FolderPlus, BellRing
} from 'lucide-react';
import { motion } from 'motion/react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const { stats: fetchedStats, activities: fetchedActs } = await dashboardAPI.getStats();
      const fetchedProjects = await projectsAPI.list();
      setStats(fetchedStats);
      setActivities(fetchedActs);
      setProjects(fetchedProjects);
    } catch (err) {
      console.error('Failure fetching dashboard data', err);
      showToast('Error loading server stats', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-slate-200 dark:border-slate-850 border-t-indigo-600 dark:border-t-indigo-505 animate-spin" />
        <p className="text-xs font-mono text-slate-400 uppercase tracking-widest animate-pulse">
          Syncing Analytics...
        </p>
      </div>
    );
  }

  // Cards layout logic helper
  const cards = [
    { label: 'Total Tasks', value: stats?.total || 0, icon: ListTodo, color: 'text-indigo-600 bg-indigo-50 border-indigo-100 dark:text-indigo-400 dark:bg-indigo-950/40 dark:border-indigo-900/40' },
    { label: 'Completed Tasks', value: stats?.completed || 0, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-900/40' },
    { label: 'In Progress Tasks', value: stats?.progress || 0, icon: PlayCircle, color: 'text-blue-600 bg-blue-50 border-blue-100 dark:text-blue-400 dark:bg-blue-950/40 dark:border-blue-900/40' },
    { label: 'Pending Tasks', value: stats?.pending || 0, icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-100 dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-900/40' },
    { label: 'Overdue Tasks', value: stats?.overdue || 0, icon: AlertTriangle, color: 'text-rose-600 bg-rose-50 border-rose-100 dark:text-rose-400 dark:bg-rose-950/40 dark:border-rose-900/30' },
  ];

  // Helper formatting for activities time
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHrs = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHrs / 24);

      if (diffSec < 60) return 'just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHrs < 24) return `${diffHrs}h ago`;
      return `${diffDays}d ago`;
    } catch (e) {
      return '';
    }
  };

  const hasNoProjects = projects.length === 0;

  return (
    <div className="flex flex-col gap-8">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="serif text-3xl md:text-4xl text-slate-900 dark:text-white">
            Hello, {user?.name}!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Here's what is happening across your projects today.
          </p>
        </div>

        <Link
          to="/projects"
          className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold shadow-md hover:bg-indigo-700 flex items-center gap-2 cursor-pointer transition-colors active:scale-95"
        >
          <FolderPlus className="w-4 h-4" />
          Manage Projects
        </Link>
      </div>

      {/* Onboarding State if absolute starter */}
      {hasNoProjects ? (
        <div className="p-8 md:p-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-center gap-4 py-16">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Kanban className="w-8 h-8" />
          </div>
          <div className="max-w-md flex flex-col gap-1.5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Create Your First Project
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              To start tracking tasks, assignees, and activities, you must create a workspace project first.
            </p>
          </div>
          <Link
            to="/projects"
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md flex items-center gap-2 mt-2 transition-all"
          >
            Go Create a Project
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <>
          {/* Key Analytics Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {cards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-4 md:p-5 border rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex items-start justify-between gap-4 transition-transform hover:scale-[1.01] ${
                    card.label === 'Overdue Tasks' && card.value > 0 ? 'border-rose-300 dark:border-rose-900/60' : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {card.label}
                    </span>
                    <span className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white leading-none">
                      {card.value}
                    </span>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${card.color}`}>
                    <Icon className="w-5 h-5 shrink-0" />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Core Analytics Blocks: Charts & Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Visual Task Distribution - CSS SVG Chart */}
            <div className="lg:col-span-2 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <h2 className="serif text-xl text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Tasks Assignment Distribution
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    A status overview of active tasks assigned per system user
                  </p>
                </div>
              </div>

              {/* Dynamic bar charts */}
              {stats && stats.tasksPerUser && stats.tasksPerUser.length > 0 ? (
                <div className="flex flex-col gap-5 pt-2">
                  {stats.tasksPerUser.map((item, idx) => {
                    // Compute percentages relative to max value
                    const maxVal = Math.max(...stats.tasksPerUser.map(t => t.count), 1);
                    const percent = Math.max((item.count / maxVal) * 100, 4); // minimum bar length
                    
                    return (
                      <div key={item.name} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {item.name}
                          </span>
                          <span className="font-bold text-slate-500 dark:text-slate-400 font-mono">
                            {item.count} {item.count === 1 ? 'task' : 'tasks'}
                          </span>
                        </div>
                        {/* Slide progress background container */}
                        <div className="h-4 w-full bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 0.8, delay: idx * 0.1 }}
                            className="h-full bg-indigo-600 dark:bg-indigo-505 rounded-full flex items-center justify-end px-2"
                          >
                            <span className="text-[9px] font-black text-white scale-90">
                              {Math.round((item.count / (stats.total || 1)) * 100)}%
                            </span>
                          </motion.div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-slate-400 text-sm italic">
                  No tasks have been created or assigned yet.
                </div>
              )}
            </div>

            {/* Recent Collaborative Activities Panel */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col gap-6">
              <div className="flex flex-col gap-0.5">
                <h2 className="serif text-xl text-slate-900 dark:text-white flex items-center gap-2">
                  <BellRing className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-swing" />
                  Recent Activity Log
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Logs representing changes across active project boards
                </p>
              </div>

              {/* Feed items */}
              <div className="flex-1 flex flex-col gap-4 overflow-y-auto max-h-[340px] pr-2">
                {activities.length > 0 ? (
                  activities.map((act) => (
                    <div 
                      key={act._id} 
                      className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100/60 dark:bg-slate-850/40 dark:hover:bg-slate-800/40 border border-slate-100/60 dark:border-slate-850 transition-colors"
                    >
                      <img 
                        src={act.user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${act.user.name}`} 
                        alt={act.user.name} 
                        className="w-8 h-8 rounded-full border border-white dark:border-slate-800 bg-slate-100"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-950 dark:text-slate-250 leading-normal">
                          <span className="font-bold text-slate-900 dark:text-white text-xs">{act.user.name}</span>{' '}
                          {act.text}
                        </p>
                        <span className="text-[10px] text-slate-400 tracking-wider inline-flex items-center gap-1 mt-1 font-mono">
                          <Calendar className="w-3 h-3" />
                          {formatTime(act.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-xs italic gap-1">
                    <span>No operations logged yet.</span>
                    <span className="text-[10px] text-slate-500 not-italic">Build tasks or add members to test logs!</span>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </>
      )}

    </div>
  );
};
