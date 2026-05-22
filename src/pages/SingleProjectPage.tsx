import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectsAPI, tasksAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Project, Task, User } from '../types.js';
import { 
  ArrowLeft, Plus, Calendar, BadgeAlert, Trash2, Edit, ChevronRight, 
  Search, SlidersHorizontal, CheckSquare, Clock, UserCheck, AlertCircle, X, Check, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const SingleProjectPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters and Sort State
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('dueDate'); // 'dueDate' | 'priority' | 'createdAt'

  // Drag and Drop active column visual guides
  const [activeDragCol, setActiveDragCol] = useState<string | null>(null);

  // Create Task state
  const [createOpen, setCreateOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskAssignedTo, setTaskAssignedTo] = useState<string>('');
  const [taskSaving, setTaskSaving] = useState(false);

  // Edit Task state (Admins can edit everything, Members see status update or standard inputs constrained relative to credentials)
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [editAssignedTo, setEditAssignedTo] = useState<string>('');
  const [editStatus, setEditStatus] = useState<'todo' | 'inprogress' | 'done'>('todo');
  const [editSaving, setEditSaving] = useState(false);

  // Load project details & tasks
  const fetchData = async () => {
    if (!id) return;
    try {
      const projData = await projectsAPI.getDetails(id);
      const tasksData = await tasksAPI.listByProject(id);
      setProject(projData);
      setTasks(tasksData);
    } catch (err) {
      console.error('Failure fetching board details', err);
      showToast('Error syncing project board data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const isProjectAdmin = () => {
    if (!project || !user) return false;
    const adminId = typeof project.admin === 'object' ? project.admin._id : project.admin;
    return adminId === user._id || user.role === 'admin';
  };

  // CREATE TASK
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!taskTitle || !taskDueDate) {
      showToast('Task title and due date are required', 'error');
      return;
    }

    setTaskSaving(true);
    try {
      await tasksAPI.create({
        title: taskTitle,
        description: taskDesc,
        dueDate: taskDueDate,
        priority: taskPriority,
        project: id,
        assignedTo: taskAssignedTo || undefined
      });

      showToast(`Task "${taskTitle}" successfully logged!`, 'success');
      setTaskTitle('');
      setTaskDesc('');
      setTaskDueDate('');
      setTaskPriority('medium');
      setTaskAssignedTo('');
      setCreateOpen(false);
      await fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create task', 'error');
    } finally {
      setTaskSaving(false);
    }
  };

  // UPDATE TASK STATUS (drag & drop drop-handler)
  const handleStatusChange = async (taskId: string, newStatus: 'todo' | 'inprogress' | 'done') => {
    // Optimistic status update inside local state for instantaneous fluid visuals
    const updatedTasks = tasks.map(t => {
      if (t._id === taskId) {
        return { ...t, status: newStatus };
      }
      return t;
    });
    setTasks(updatedTasks);

    try {
      await tasksAPI.update(taskId, { status: newStatus });
      showToast('Task card moved successfully!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Unauthorized: Only members of this project can move cards', 'error');
      // Re-sync tasks if error
      await fetchData();
    }
  };

  // UPDATE FULL TASK DETAILS
  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    setEditSaving(true);
    try {
      const payload: any = {};
      const isAdmin = isProjectAdmin();

      if (isAdmin) {
        payload.title = editTitle;
        payload.description = editDesc;
        payload.dueDate = editDueDate;
        payload.priority = editPriority;
        payload.assignedTo = editAssignedTo || null;
        payload.status = editStatus;
      } else {
        // Restricted to status modifications
        payload.status = editStatus;
      }

      await tasksAPI.update(editingTask._id, payload);
      showToast('Task card details updated', 'success');
      setEditingTask(null);
      await fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update task info', 'error');
    } finally {
      setEditSaving(false);
    }
  };

  // DELETE TASK
  const handleDeleteTask = async (taskId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete task "${title}"?`)) {
      return;
    }

    try {
      await tasksAPI.delete(taskId);
      showToast(`Task "${title}" removed from board`, 'info');
      setEditingTask(null);
      await fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete task', 'error');
    }
  };

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: 'todo' | 'inprogress' | 'done') => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      handleStatusChange(taskId, targetStatus);
    }
    setActiveDragCol(null);
  };

  // SEARCH, FILTER, AND SORT LOGIC
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                          t.description.toLowerCase().includes(search.toLowerCase());
    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
    
    let matchesAssignee = true;
    if (filterAssignee !== 'all') {
      if (filterAssignee === 'unassigned') {
        matchesAssignee = !t.assignedTo;
      } else {
        matchesAssignee = !!t.assignedTo && t.assignedTo._id === filterAssignee;
      }
    }

    return matchesSearch && matchesPriority && matchesAssignee;
  });

  // Sorting
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'dueDate') {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (sortBy === 'createdAt') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'priority') {
      const priorityMap = { high: 3, medium: 2, low: 1 };
      return priorityMap[b.priority] - priorityMap[a.priority];
    }
    return 0;
  });

  // Divide into Kanban statuses columns
  const todoTasks = sortedTasks.filter(t => t.status === 'todo');
  const progressTasks = sortedTasks.filter(t => t.status === 'inprogress');
  const doneTasks = sortedTasks.filter(t => t.status === 'done');

  const getPriorityBadgeColor = (prio: string) => {
    switch (prio) {
      case 'high': return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-100 dark:border-rose-900/30';
      case 'medium': return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-100 dark:border-amber-900/30';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200/50 dark:border-slate-700/60';
    }
  };

  const isOverdue = (dueDateStr: string, status: string) => {
    if (status === 'done') return false;
    return new Date(dueDateStr) < new Date();
  };

  // Get list of unique available project assignable members (Admin + collaborators)
  const getAssignableUsers = (): User[] => {
    if (!project) return [];
    const membersList = [...project.members];
    if (project.admin) {
      // Avoid duplication
      const hasAdmin = membersList.some(m => m._id === project.admin._id);
      if (!hasAdmin) {
        membersList.unshift(project.admin);
      }
    }
    return membersList;
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-slate-200 dark:border-slate-850 border-t-indigo-600 dark:border-t-indigo-550 animate-spin" />
        <p className="text-xs font-mono text-slate-400 uppercase tracking-widest animate-pulse">
          Opening Board...
        </p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-16 flex flex-col items-center gap-4">
        <AlertCircle className="w-14 h-14 text-rose-500" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Project workspace not found</h2>
        <p className="text-slate-500 text-sm">This project board might have been deleted or moved permissions.</p>
        <Link to="/projects" className="px-4 py-2 bg-indigo-650 text-white rounded-xl text-sm font-semibold">
          Return to Projects list
        </Link>
      </div>
    );
  }

  const isAdmin = isProjectAdmin();

  return (
    <div className="flex flex-col gap-6">
      
      {/* Back to Projects Header row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5 gap-4">
        <div className="flex flex-col gap-2">
          <Link
            to="/projects"
            className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 uppercase tracking-wide group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Boards
          </Link>
          <div className="flex flex-col md:flex-row md:items-baseline gap-2 mt-1">
            <h1 className="serif text-3xl md:text-4xl text-slate-950 dark:text-white">
              {project.title}
            </h1>
            <span className="text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 px-2.5 py-0.5 rounded-full font-bold">
              {isAdmin ? 'Admin View' : 'Member View'}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed mt-0.5">
            {project.description || 'No project description supplied.'}
          </p>
        </div>

        {/* Create Task button visible to Project Creators */}
        {isAdmin && (
          <button
            onClick={() => setCreateOpen(true)}
            className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5 active:scale-95 shrink-0"
          >
            <Plus className="w-4.5 h-4.5" />
            Create Task
          </button>
        )}
      </div>

      {/* SEARCH, FILTER, AND SORT ACTIONS BAR */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Search Input bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks by title, decription..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none focus:border-indigo-500 transition-colors dark:text-white"
          />
        </div>

        {/* Dropdowns panel */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Priority filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Prio:</span>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-slate-300"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Assignee filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">User:</span>
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-slate-300 max-w-[140px]"
            >
              <option value="all">All Collaborators</option>
              <option value="unassigned">Unassigned</option>
              {getAssignableUsers().map(u => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* Sort By criteria */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none dark:text-slate-300"
            >
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
              <option value="createdAt">Date Created</option>
            </select>
          </div>

        </div>
      </div>

      {/* THE KANBAN TASK BOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Render status columns helpers */}
        {([
          { title: 'To Do', status: 'todo', tasksList: todoTasks, glow: 'border-slate-200/50 dark:border-slate-800' },
          { title: 'In Progress', status: 'inprogress', tasksList: progressTasks, glow: 'border-indigo-100/50 dark:border-indigo-900/30' },
          { title: 'Completed', status: 'done', tasksList: doneTasks, glow: 'border-emerald-100/30 dark:border-emerald-950/20' }
        ] as const).map((col) => {
          const isOver = activeDragCol === col.status;
          return (
            <div
              key={col.status}
              onDragOver={(e) => {
                e.preventDefault();
                if (activeDragCol !== col.status) setActiveDragCol(col.status);
              }}
              onDragLeave={() => setActiveDragCol(null)}
              onDrop={(e) => handleDrop(e, col.status)}
              className={`flex flex-col gap-4 p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-905 bg-slate-150/40 dark:bg-slate-900/50 border min-h-[500px] transition-all duration-200 ${
                isOver 
                  ? 'border-indigo-500 bg-indigo-50/20 dark:border-indigo-505 dark:bg-indigo-950/20 shadow-inner' 
                  : 'border-slate-200/40 dark:border-slate-800/60'
              }`}
            >
              {/* Column header */}
              <div className="flex items-center justify-between pb-1 shrink-0">
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-250 uppercase tracking-wider flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    col.status === 'todo' ? 'bg-amber-400' : col.status === 'inprogress' ? 'bg-indigo-500' : 'bg-emerald-505 bg-emerald-500'
                  }`} />
                  {col.title}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-black font-mono text-slate-600 dark:text-slate-400">
                  {col.tasksList.length}
                </span>
              </div>

              {/* Stack list of column tasks */}
              <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[560px] pr-1">
                {col.tasksList.length > 0 ? (
                  col.tasksList.map((task) => {
                    const overdue = isOverdue(task.dueDate, task.status);
                    return (
                      <div
                        key={task._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task._id)}
                        className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/85 p-4 rounded-xl shadow-xs hover:shadow-md cursor-grab active:cursor-grabbing hover:border-slate-300 dark:hover:border-slate-705 group relative transition-all"
                      >
                        {/* Priority / overdue display indicators */}
                        <div className="flex items-center justify-between gap-3 mb-2.5">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${getPriorityBadgeColor(task.priority)}`}>
                            {task.priority} Priority
                          </span>

                          {overdue && (
                            <span className="text-[9px] font-bold text-rose-600 dark:text-rose-450 flex items-center gap-0.5 animate-pulse bg-rose-50 dark:bg-rose-950/30 px-1.5 py-0.5 rounded-md">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Overdue
                            </span>
                          )}
                        </div>

                        {/* Title details */}
                        <h3 className="font-sans font-bold text-sm text-slate-900 dark:text-white leading-normal mb-1.5 line-clamp-1">
                          {task.title}
                        </h3>

                        {/* Description */}
                        {task.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3.5">
                            {task.description}
                          </p>
                        )}

                        {/* Footer row metadata (Due date + assignee avatar) */}
                        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-50 dark:border-slate-850">
                          
                          {/* Due date status */}
                          <span className={`text-[10px] inline-flex items-center gap-1 font-mono hover:underline ${
                            overdue 
                              ? 'text-rose-600 dark:text-rose-400 font-bold' 
                              : 'text-slate-400 dark:text-slate-500'
                          }`}>
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>

                          {/* Assignee display initials */}
                          <div className="flex items-center gap-2">
                            {task.assignedTo ? (
                              <div className="flex items-center gap-1.5 cursor-help" title={`Assigned to ${task.assignedTo.name}`}>
                                <img 
                                  src={task.assignedTo.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${task.assignedTo.name}`} 
                                  alt={task.assignedTo.name} 
                                  className="w-5.5 h-5.5 rounded-full border border-slate-100 bg-slate-200 shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 truncate max-w-[50px]">{task.assignedTo.name.split(' ')[0]}</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">Unassigned</span>
                            )}
                          </div>

                        </div>

                        {/* Rapid trigger configuration overlay indicator */}
                        <button
                          onClick={() => {
                            setEditingTask(task);
                            setEditTitle(task.title);
                            setEditDesc(task.description);
                            setEditStatus(task.status);
                            setEditPriority(task.priority);
                            setEditDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
                            setEditAssignedTo(task.assignedTo ? task.assignedTo._id : '');
                          }}
                          className="absolute top-2 right-2 p-1 rounded-md bg-slate-50 dark:bg-slate-800 hover:bg-slate-150 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 shrink-0 cursor-pointer"
                          title="View / Modify TaskCard"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 border border-dashed border-slate-200/50 dark:border-slate-800/40 rounded-xl text-slate-400 dark:text-slate-500 text-xs italic">
                    No items in this column
                  </div>
                )}
              </div>

            </div>
          );
        })}

      </div>

      {/* CREATE TASK MODAL */}
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
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Add Task Card
                </h3>
                <button
                  onClick={() => setCreateOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Task Title
                  </label>
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g., Design landing UI mockup"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 hover:border-slate-300 rounded-xl text-sm font-medium outline-none transition-colors dark:text-white"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Task Description
                  </label>
                  <textarea
                    rows={3}
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    placeholder="Summarize objectives, requirements, and deliverables for this task."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 hover:border-slate-300 rounded-xl text-sm font-medium outline-none transition-colors resize-none dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Due Date
                    </label>
                    <input
                      type="date"
                      required
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 hover:border-slate-300 rounded-xl text-sm font-medium outline-none transition-colors dark:text-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Priority Level
                    </label>
                    <select
                      value={taskPriority}
                      onChange={(e: any) => setTaskPriority(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 hover:border-slate-300 rounded-xl text-sm font-bold outline-none transition-colors dark:text-slate-300"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Assign Task To
                  </label>
                  <select
                    value={taskAssignedTo}
                    onChange={(e) => setTaskAssignedTo(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 hover:border-slate-300 rounded-xl text-sm font-bold outline-none transition-colors dark:text-slate-300"
                  >
                    <option value="">Choose Collaborator...</option>
                    {getAssignableUsers().map((collab) => (
                      <option key={collab._id} value={collab._id}>
                        {collab.name} ({collab.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-850 mt-2">
                  <button
                    type="button"
                    onClick={() => setCreateOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={taskSaving}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center shrink-0"
                  >
                    {taskSaving ? 'Publishing...' : 'Save Task Card'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAIL / EDIT TASK CONFIGURATION MODAL */}
      <AnimatePresence>
        {editingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden p-6 md:p-8 flex flex-col gap-5 text-left"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Task Administration</h3>
                  <span className="text-[10px] text-zinc-400 font-mono">ID: {editingTask._id}</span>
                </div>
                <button
                  onClick={() => setEditingTask(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateTask} className="flex flex-col gap-4">
                
                {isAdmin ? (
                  // Full inputs for Admins
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Task Title
                      </label>
                      <input
                        type="text"
                        required
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 hover:border-slate-300 rounded-xl text-sm font-medium outline-none transition-colors dark:text-white"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Task Description
                      </label>
                      <textarea
                        rows={3}
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 hover:border-slate-300 rounded-xl text-sm font-medium outline-none transition-colors resize-none dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Due Date
                        </label>
                        <input
                          type="date"
                          required
                          value={editDueDate}
                          onChange={(e) => setEditDueDate(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 hover:border-slate-300 rounded-xl text-sm font-medium outline-none transition-colors dark:text-white"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Priority Level
                        </label>
                        <select
                          value={editPriority}
                          onChange={(e: any) => setEditPriority(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 hover:border-slate-300 rounded-xl text-sm font-bold outline-none transition-colors dark:text-slate-300"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Assign Member
                      </label>
                      <select
                        value={editAssignedTo}
                        onChange={(e) => setEditAssignedTo(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 hover:border-slate-300 rounded-xl text-sm font-bold outline-none transition-colors dark:text-slate-300"
                      >
                        <option value="">Unassigned</option>
                        {getAssignableUsers().map((c) => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  // Restricted view for Members
                  <div className="flex flex-col gap-3 p-4 bg-slate-50 dark:bg-slate-950 border rounded-xl leading-relaxed">
                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-250 uppercase tracking-widest">
                      {editingTask.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {editingTask.description || 'No task notes.'}
                    </p>
                    <div className="text-xs text-slate-500 dark:text-slate-400 grid grid-cols-2 gap-2 mt-1">
                      <div><strong>Due Date:</strong> {new Date(editingTask.dueDate).toLocaleDateString()}</div>
                      <div className="capitalize"><strong>Priority:</strong> {editingTask.priority}</div>
                      <div><strong>Assigned To:</strong> {editingTask.assignedTo?.name || 'Unassigned'}</div>
                      <div><strong>Created By:</strong> {editingTask.createdBy?.name || 'System'}</div>
                    </div>
                  </div>
                )}

                {/* Status selection is editable by everyone */}
                <div className="flex flex-col gap-1.5 mt-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Workflow Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { label: 'To Do', val: 'todo' },
                      { label: 'In Progress', val: 'inprogress' },
                      { label: 'Done', val: 'done' }
                    ] as const).map(s => (
                      <button
                        key={s.val}
                        type="button"
                        onClick={() => setEditStatus(s.val)}
                        className={`py-2 px-3 border text-xs font-bold rounded-xl transition-all cursor-pointer ${
                          editStatus === s.val
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 dark:bg-slate-850 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-850 mt-2">
                  {/* Delete trigger only for Admins */}
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(editingTask._id, editingTask.title)}
                      className="px-4 py-2.5 rounded-xl border border-rose-200 hover:bg-rose-50 hover:text-rose-650 dark:border-rose-950/40 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Task
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingTask(null)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={editSaving}
                      className="px-4.5 py-2.5 bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <Save className="w-4 h-4" />
                      {editSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
