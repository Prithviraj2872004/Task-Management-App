import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { 
  User as UserIcon, ShieldAlert, BadgeCheck, Mail, Calendar, 
  Sparkles, Camera, Save, ArrowRight 
} from 'lucide-react';
import { motion } from 'motion/react';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [avatarSeed, setAvatarSeed] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  // Auto avatar string helper
  const currentAvatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(avatarSeed)}`;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Name string cannot be empty', 'error');
      return;
    }

    setSaving(true);
    try {
      await updateProfile(name, currentAvatarUrl);
      showToast('Profile updated successfully!', 'success');
    } catch (err: any) {
      showToast(err || 'Failed to update profile details', 'error');
    } finally {
      setSaving(false);
    }
  };

  const regenerateAvatar = () => {
    const randomSeeds = ['Delta', 'Apex', 'Nova', 'Pinnacle', 'Summit', 'Zenith', 'Echo', 'Vortex', 'Pulse', 'Aero'];
    const randomSeed = randomSeeds[Math.floor(Math.random() * randomSeeds.length)] + '-' + Math.floor(Math.random() * 100);
    setAvatarSeed(randomSeed);
    showToast('Randomized avatar seed string!', 'info');
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8">
      
      {/* Page Title */}
      <div>
        <h1 className="serif text-3xl md:text-4xl text-slate-900 dark:text-white">
          Account Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal metadata, profile initials, and access roles
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        
        {/* Left column - Avatar and permissions summary card */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden group">
          <div className="relative">
            <img 
              src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} 
              alt={user.name} 
              className="w-24 h-24 rounded-full border-2 border-indigo-600 dark:border-indigo-500 bg-slate-50 shadow-md group-hover:scale-[1.01] transition-all"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={regenerateAvatar}
              className="absolute bottom-0 right-0 p-2 bg-indigo-600 dark:bg-indigo-505 rounded-full text-white hover:bg-indigo-700 shadow-lg cursor-pointer transition-colors"
              title="Regenerate random seed avatar initials"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-1 mt-1">
            <h2 className="font-sans font-extrabold text-lg text-slate-950 dark:text-white leading-normal">
              {user.name}
            </h2>
            <div className="flex items-center gap-1.5 justify-center">
              <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                user.role === 'admin' 
                  ? 'bg-amber-150 border-amber-200 text-amber-800 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-900/30 font-semibold' 
                  : 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-705 dark:text-slate-300'
              }`}>
                {user.role === 'admin' ? <ShieldAlert className="w-3.5 h-3.5" /> : <BadgeCheck className="w-3.5 h-3.5 text-indigo-500" />}
                {user.role} role
              </span>
            </div>
          </div>

          {/* Metadata quick lists */}
          <div className="w-full border-t border-slate-100 dark:border-slate-850 pt-4 flex flex-col gap-2.5 text-xs text-left text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-slate-450 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
            
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 text-slate-450 shrink-0 mt-0.5" />
              <span>
                {user.role === 'admin' 
                  ? 'Unlocked: Build projects, add members and assign tasks globally.' 
                  : 'Assigned: Review project boards and check statuses.'}
              </span>
            </div>
          </div>
        </div>

        {/* Right column - profile credentials change forms */}
        <div className="md:col-span-2 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-6 md:p-8 shadow-sm text-left">
          <h3 className="font-sans font-bold text-lg text-slate-900 dark:text-white mb-6">
            Profile Credentials
          </h3>

          <form onSubmit={handleUpdateProfile} className="flex flex-col gap-5">
            
            {/* Read-only login email input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                Registered Email (Read-Only)
              </label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-950/45 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none text-slate-500 dark:text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Editable name input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Name Header Change
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Change name"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 rounded-xl text-sm font-semibold outline-none focus:border-indigo-500 transition-colors dark:text-white"
                />
              </div>
            </div>

            {/* Selected avatar seed preview */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Custom Initials Seed Vector
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={avatarSeed}
                  onChange={(e) => setAvatarSeed(e.target.value)}
                  placeholder="Enter seed for initials vector"
                  className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 hover:border-slate-300 rounded-xl text-sm font-semibold outline-none focus:border-indigo-500 transition-colors dark:text-white"
                />
                <button
                  type="button"
                  onClick={regenerateAvatar}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold rounded-xl text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Randomize
                </button>
              </div>
            </div>

            {/* Actions submit row */}
            <div className="border-t border-slate-100 dark:border-slate-850 pt-5 flex items-center justify-end gap-3 mt-4">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-3 bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5 shrink-0 active:scale-95 disabled:scale-100"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>

          </form>
        </div>

      </div>

    </div>
  );
};
