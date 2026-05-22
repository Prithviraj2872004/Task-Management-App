import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { useToast } from '../context/ToastContext.js';
import { 
  Menu, X, Sun, Moon, LogOut, 
  LayoutDashboard, FolderKanban, User as UserIcon, ShieldAlert 
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    showToast('Successfully logged out', 'success');
    navigate('/login');
  };

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Projects', path: '/projects', icon: FolderKanban },
    { label: 'My Profile', path: '/profile', icon: UserIcon }
  ];

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const currentPath = location.pathname;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex transition-colors duration-200">
      
      {/* Sidebar - Desktop Layout */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white font-black text-lg">
            T
          </div>
          <span className="font-sans font-bold text-xl tracking-tight text-slate-900 dark:text-white">
            TaskFlow
          </span>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = currentPath === link.path || (link.path !== '/dashboard' && currentPath.startsWith(link.path));
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-505 dark:bg-indigo-950/40 dark:text-indigo-400 font-semibold shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User Stats & Footer section */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-3">
          {user && (
            <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
              <img 
                src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} 
                alt={user.name} 
                className="w-10 h-10 rounded-full bg-slate-200"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">{user.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${
                    user.role === 'admin' 
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30' 
                      : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Core Controls */}
          <div className="flex items-center justify-between gap-1">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-200 dark:hover:border-rose-900/30 transition-all font-medium text-sm cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Sidebar - Mobile Slide-over Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden bg-slate-900/60 backdrop-blur-xs">
          <div className="w-64 bg-white dark:bg-slate-900 h-full flex flex-col border-r border-slate-200 dark:border-slate-800 pt-5 pb-4 px-4 relative">
            <button
              onClick={toggleMobileMenu}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 px-2 mb-8">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white font-black text-lg">
                T
              </div>
              <span className="font-sans font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                TaskFlow
              </span>
            </div>

            <nav className="flex-1 flex flex-col gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = currentPath === link.path || (link.path !== '/dashboard' && currentPath.startsWith(link.path));
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive 
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 font-semibold' 
                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex flex-col gap-3">
              {user && (
                <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
                  <img 
                    src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} 
                    alt={user.name} 
                    className="w-9 h-9 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">{user.name}</p>
                    <span className={`text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full ${
                      user.role === 'admin' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-1">
                <button
                  onClick={() => {
                    toggleTheme();
                    setIsMobileOpen(false);
                  }}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
                </button>

                <button
                  onClick={() => {
                    setIsMobileOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-medium text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Mobile Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 md:hidden">
          <button
            onClick={toggleMobileMenu}
            className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-8/60"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <span className="font-sans font-bold text-lg tracking-tight text-slate-900 dark:text-white">
            TaskFlow
          </span>

          <img 
            src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`} 
            alt={user?.name} 
            className="w-8 h-8 rounded-full"
            referrerPolicy="no-referrer"
          />
        </header>

        {/* Content Panel Area */}
        <main className="flex-grow p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
