import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { projectsAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Project, User } from '../types.js';
import { 
  FolderLock, FolderOpen, Plus, MailOpen, UserMinus, Trash2, 
  Settings, Layers, Users, X, Info, FileEdit
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // Member management state
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [memberEmail, setMemberEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  // Edit details state
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchProjects = async () => {
    try {
      const data = await projectsAPI.list();
      setProjects(data);
    } catch (err) {
      console.error('Failure fetching projects list', err);
      showToast('Error syncing projects list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) {
      showToast('Project title is required', 'error');
      return;
    }

    setCreating(true);
    try {
      const result = await projectsAPI.create({ title: newTitle, description: newDesc });
      showToast(`Created project "${result.title}" successful!`, 'success');
      setNewTitle('');
      setNewDesc('');
      setCreateOpen(false);
      // Refresh list
      await fetchProjects();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create project', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    if (!editTitle) {
      showToast('Title cannot be empty', 'error');
      return;
    }

    setUpdating(true);
    try {
      await projectsAPI.update(editingProject._id, { title: editTitle, description: editDesc });
      showToast('Project details updated successfully!', 'success');
      setEditingProject(null);
      await fetchProjects();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update details', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (projectId: string, title: string) => {
    if (!window.confirm(`Are you absolutely sure you want to delete "${title}"? This is irreversible and will delete all associated tasks.`)) {
      return;
    }

    try {
      await projectsAPI.delete(projectId);
      showToast(`Project "${title}" and all tasks deleted`, 'info');
      await fetchProjects();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete project', 'error');
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    if (!memberEmail) {
      showToast('Email address is required', 'error');
      return;
    }

    setInviting(true);
    try {
      await projectsAPI.addMember(selectedProject._id, memberEmail);
      showToast(`Invited ${memberEmail} successfully!`, 'success');
      setMemberEmail('');
      setSelectedProject(null);
      await fetchProjects();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to invite collaborator', 'error');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (projectId: string, memberId: string, memberName: string) => {
    if (!window.confirm(`Are you sure you want to remove "${memberName}" from this project board?`)) {
      return;
    }

    try {
      await projectsAPI.removeMember(projectId, memberId);
      showToast(`Successfully removed "${memberName}"`, 'info');
      await fetchProjects();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to remove member', 'error');
    }
  };

  const isProjectAdmin = (proj: Project) => {
    if (!user) return false;
    const adminId = typeof proj.admin === 'object' ? proj.admin._id : proj.admin;
    return adminId === user._id || user.role === 'admin';
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-slate-200 dark:border-slate-850 border-t-indigo-600 dark:border-t-indigo-505 animate-spin" />
        <p className="text-xs font-mono text-slate-400 uppercase tracking-widest animate-pulse">
          Fetching Projects...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      
      {/* Upper header action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="serif text-3xl md:text-4xl text-slate-900 dark:text-white">
            Project Boards
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Create, collaborate, and configure project members
          </p>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2 justify-center active:scale-95"
        >
          <Plus className="w-4.5 h-4.5" />
          Create Project
        </button>
      </div>

      {/* Main Boards List Grid */}
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((proj) => {
            const isAdmin = isProjectAdmin(proj);
            return (
              <motion.div
                key={proj._id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col gap-5 relative group"
              >
                {/* Board top category indicators */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 flex items-center justify-center">
                      {isAdmin ? <FolderLock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> : <FolderOpen className="w-5 h-5" />}
                    </div>
                    <div>
                      <h2 className="font-sans font-bold text-lg text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {proj.title}
                      </h2>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Created {new Date(proj.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Active context settings block for Project Creator */}
                  {isAdmin && (
                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingProject(proj);
                          setEditTitle(proj.title);
                          setEditDesc(proj.description);
                        }}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-indigo-600"
                        title="Edit Project Details"
                      >
                        <FileEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(proj._id, proj.title)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-rose-600"
                        title="Delete Project Board"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Description details */}
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed min-h-[40px]">
                  {proj.description || 'No project description supplied.'}
                </p>

                {/* Administrators / Creator profile display */}
                <div className="flex items-center gap-3 p-3 bg-slate-50/60 dark:bg-slate-850/30 rounded-xl border border-slate-100 dark:border-slate-850">
                  <img 
                    src={proj.admin?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${proj.admin?.name || 'Admin'}`} 
                    alt="admin" 
                    className="w-8 h-8 rounded-full bg-slate-200 border border-white"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Project Admin</span>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{proj.admin?.name || 'Registered Admin'}</p>
                  </div>
                </div>

                {/* Collaborative Team Members listing */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Users className="w-4 h-4 text-indigo-500 shrink-0" />
                      Team Members ({proj.members.length})
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => setSelectedProject(proj)}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                      >
                        + Add Member
                      </button>
                    )}
                  </div>

                  {proj.members.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {proj.members.map((member) => (
                        <div 
                          key={member._id}
                          className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/45 text-xs font-medium text-slate-700 dark:text-slate-300 group/member"
                        >
                          <img 
                            src={member.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`} 
                            alt={member.name} 
                            className="w-5 h-5 rounded-full"
                            referrerPolicy="no-referrer"
                          />
                          <span className="truncate max-w-[80px]">{member.name}</span>
                          
                          {isAdmin && (
                            <button
                              onClick={() => handleRemoveMember(proj._id, member._id, member.name)}
                              className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors ml-0.5"
                              title={`Remove ${member.name}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-slate-500 italic pb-1">
                      No team members added. Add colleagues to start collaborating!
                    </span>
                  )}
                </div>

                {/* Footer anchor link to project details */}
                <div className="border-t border-slate-100 dark:border-slate-850 pt-4 mt-auto">
                  <Link
                    to={`/projects/${proj._id}`}
                    className="w-full py-3 px-4 bg-slate-100 hover:bg-indigo-600 dark:bg-slate-800/80 dark:hover:bg-indigo-505 hover:text-white transition-all text-center rounded-xl font-bold text-xs text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 group-hover:scale-[1.01]"
                  >
                    <Layers className="w-4 h-4" />
                    Open Project Board
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-center gap-3 py-16">
          <FolderLock className="w-12 h-12 text-slate-450 text-slate-400 animate-pulse" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug mt-2">
            No Projects Assigned
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
            You don't belong to any project workspace yet. Create a brand new project to begin.
          </p>
        </div>
      )}

      {/* CREATE NEW PROJECT MODAL */}
      <AnimatePresence>
        {createOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden p-6 md:p-8 flex flex-col gap-5 text-left"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create Workspace Board</h3>
                <button
                  onClick={() => setCreateOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Project Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., Marketing Q3 Camp, API Redesign"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 hover:border-slate-300Focus rounded-xl text-sm font-medium outline-none transition-colors dark:text-white"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={4}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Provide a clear high-level description for collaborators to understand the project objectives."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 hover:border-slate-300 rounded-xl text-sm font-medium outline-none transition-colors resize-none dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-850">
                  <button
                    type="button"
                    onClick={() => setCreateOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-indigo-700 flex items-center justify-center"
                  >
                    {creating ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT DETAILS MODAL */}
      <AnimatePresence>
        {editingProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden p-6 md:p-8 flex flex-col gap-5 text-left"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Board Details</h3>
                <button
                  onClick={() => setEditingProject(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Project Title
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 hover:border-slate-300 rounded-xl text-sm font-medium outline-none transition-colors dark:text-white"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 hover:border-slate-300 rounded-xl text-sm font-medium outline-none transition-colors resize-none dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-850">
                  <button
                    type="button"
                    onClick={() => setEditingProject(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-indigo-700 flex items-center justify-center"
                  >
                    {updating ? 'Updating...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TEAM MEMBER ADDITION MODAL */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-xl p-6 flex flex-col gap-4 text-left"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                  <MailOpen className="w-5 h-5 text-indigo-500 shrink-0" />
                  Invite Collaborator
                </h3>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl text-xs text-indigo-700 dark:text-indigo-400 flex items-start gap-2 leading-relaxed">
                <Info className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <span>
                  Provide the email address of a user who is already registered in TaskFlow to add them directly to <strong>{selectedProject.title}</strong>.
                </span>
              </div>

              <form onSubmit={handleInvite} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Collaborator Email
                  </label>
                  <input
                    type="email"
                    required
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    placeholder="colleague@taskflow.com"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 hover:border-slate-300 rounded-xl text-xs font-semibold outline-none transition-colors dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-850">
                  <button
                    type="button"
                    onClick={() => setSelectedProject(null)}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px] uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl shadow-md shrink-0 flex items-center justify-center"
                  >
                    {inviting ? 'Inviting...' : 'Add to Board'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
