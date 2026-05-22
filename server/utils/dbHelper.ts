import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { UserModel } from '../models/User.js';
import { ProjectModel } from '../models/Project.js';
import { TaskModel } from '../models/Task.js';
import { ActivityModel } from '../models/Activity.js';

const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists for fallback files
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const ACTIVITIES_FILE = path.join(DATA_DIR, 'activities.json');

// Initialize fallback files if empty
const initFile = (filePath: string, defaultData: any) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf8');
  }
};
initFile(USERS_FILE, []);
initFile(PROJECTS_FILE, []);
initFile(TASKS_FILE, []);
initFile(ACTIVITIES_FILE, []);

const isMongoEnabled = (): boolean => {
  return !!process.env.MONGODB_URI;
};

// Connect to MongoDB if enabled
export const connectDB = async () => {
  if (isMongoEnabled()) {
    try {
      console.log('Connecting to MongoDB Atlas...');
      await mongoose.connect(process.env.MONGODB_URI!);
      console.log('MongoDB connected successfully!');
    } catch (err) {
      console.error('MongoDB connection error. Falling back to Local File Engine.', err);
    }
  } else {
    console.log('--- ROOT NOTE ---');
    console.log('No MONGODB_URI specified in environment secrets.');
    console.log('TaskFlow is automatically starting up in resilient Local File Mode.');
    console.log(`Persistent data stored in: ${DATA_DIR}`);
    console.log('-----------------');
  }
};

// Define standard types for our records in local file storage
interface LocalUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'member';
  avatar?: string;
  createdAt: string;
}

interface LocalProject {
  _id: string;
  title: string;
  description: string;
  admin: string;
  members: string[];
  createdAt: string;
}

interface LocalTask {
  _id: string;
  title: string;
  description: string;
  dueDate: any; // Type cast to any to allow direct string strings or Date objects across controllers
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'inprogress' | 'done';
  assignedTo?: string;
  project: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface LocalActivity {
  _id: string;
  text: string;
  project?: string;
  task?: string;
  user: string;
  createdAt: string;
}

// Read/write helpers for files
const readJson = <T>(filePath: string): T[] => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    return [];
  }
};

const writeJson = <T>(filePath: string, data: T[]) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
};

const generateId = () => {
  return new mongoose.Types.ObjectId().toString();
};

export const db = {
  // USER OPERATIONS
  users: {
    async find(query: Partial<LocalUser> = {}): Promise<any[]> {
      if (isMongoEnabled() && mongoose.connection.readyState === 1) {
        return (UserModel as any).find(query).lean();
      }
      const users = readJson<LocalUser>(USERS_FILE);
      return users.filter(u => {
        return Object.entries(query).every(([key, val]) => (u as any)[key] === val);
      });
    },

    async findOne(query: Partial<LocalUser>): Promise<any | null> {
      if (isMongoEnabled() && mongoose.connection.readyState === 1) {
        return (UserModel as any).findOne(query).lean();
      }
      const users = readJson<LocalUser>(USERS_FILE);
      const user = users.find(u => {
        return Object.entries(query).every(([key, val]) => {
          if (typeof val === 'string' && typeof (u as any)[key] === 'string') {
            return (u as any)[key].toLowerCase() === val.toLowerCase();
          }
          return (u as any)[key] === val;
        });
      });
      return user || null;
    },

    async findById(id: string): Promise<any | null> {
      if (isMongoEnabled() && mongoose.connection.readyState === 1) {
        return (UserModel as any).findById(id).lean();
      }
      const users = readJson<LocalUser>(USERS_FILE);
      const user = users.find(u => u._id === id);
      return user || null;
    },

    async create(data: Omit<LocalUser, '_id' | 'createdAt'>): Promise<any> {
      if (isMongoEnabled() && mongoose.connection.readyState === 1) {
        return (UserModel as any).create(data);
      }
      const users = readJson<LocalUser>(USERS_FILE);
      const newUser: LocalUser = {
        _id: generateId(),
        ...data,
        createdAt: new Date().toISOString()
      };
      users.push(newUser);
      writeJson(USERS_FILE, users);
      return newUser;
    },

    async updateProfile(id: string, data: Partial<Pick<LocalUser, 'name' | 'avatar'>>): Promise<any | null> {
      if (isMongoEnabled() && mongoose.connection.readyState === 1) {
        return (UserModel as any).findByIdAndUpdate(id, data, { new: true }).lean();
      }
      const users = readJson<LocalUser>(USERS_FILE);
      const idx = users.findIndex(u => u._id === id);
      if (idx === -1) return null;
      users[idx] = { ...users[idx], ...data };
      writeJson(USERS_FILE, users);
      return users[idx];
    }
  },

  // PROJECT OPERATIONS
  projects: {
    async findForUser(userId: string): Promise<any[]> {
      if (isMongoEnabled() && mongoose.connection.readyState === 1) {
        // Find projects where user is either admin or in members
        const items = await (ProjectModel as any).find({
          $or: [
            { admin: userId },
            { members: userId }
          ]
        }).populate('admin', 'name email avatar').populate('members', 'name email avatar').lean();
        return items;
      }

      const projects = readJson<LocalProject>(PROJECTS_FILE);
      const matched = projects.filter(p => p.admin === userId || p.members.includes(userId));
      
      // Populate admin and members
      const users = readJson<LocalUser>(USERS_FILE);
      const userMap = new Map(users.map(u => [u._id, { _id: u._id, name: u.name, email: u.email, avatar: u.avatar || '' }]));

      return matched.map(p => ({
        ...p,
        admin: userMap.get(p.admin) || { _id: p.admin, name: 'Unknown', email: '' },
        members: p.members.map(mId => userMap.get(mId)).filter(Boolean)
      }));
    },

    async findById(id: string): Promise<any | null> {
      if (isMongoEnabled() && mongoose.connection.readyState === 1) {
        return (ProjectModel as any).findById(id).populate('admin', 'name email avatar').populate('members', 'name email avatar').lean();
      }
      const projects = readJson<LocalProject>(PROJECTS_FILE);
      const project = projects.find(p => p._id === id);
      if (!project) return null;

      const users = readJson<LocalUser>(USERS_FILE);
      const userMap = new Map(users.map(u => [u._id, { _id: u._id, name: u.name, email: u.email, avatar: u.avatar || '' }]));

      return {
        ...project,
        admin: userMap.get(project.admin) || { _id: project.admin, name: 'Unknown', email: '' },
        members: project.members.map(mId => userMap.get(mId)).filter(Boolean)
      };
    },

    async create(data: Omit<LocalProject, '_id' | 'createdAt'>): Promise<any> {
      if (isMongoEnabled() && mongoose.connection.readyState === 1) {
        const p = await (ProjectModel as any).create(data);
        return p;
      }
      const projects = readJson<LocalProject>(PROJECTS_FILE);
      const newProj: LocalProject = {
        _id: generateId(),
        title: data.title,
        description: data.description,
        admin: data.admin,
        members: data.members || [],
        createdAt: new Date().toISOString()
      };
      projects.push(newProj);
      writeJson(PROJECTS_FILE, projects);
      return newProj;
    },

    async update(id: string, data: Partial<Pick<LocalProject, 'title' | 'description'>>): Promise<any | null> {
      if (isMongoEnabled() && mongoose.connection.readyState === 1) {
        return (ProjectModel as any).findByIdAndUpdate(id, data, { new: true }).lean();
      }
      const projects = readJson<LocalProject>(PROJECTS_FILE);
      const idx = projects.findIndex(p => p._id === id);
      if (idx === -1) return null;
      projects[idx] = { ...projects[idx], ...data };
      writeJson(PROJECTS_FILE, projects);
      return projects[idx];
    },

    async delete(id: string): Promise<boolean> {
      if (isMongoEnabled() && mongoose.connection.readyState === 1) {
        await (ProjectModel as any).findByIdAndDelete(id);
        // Cascading deletion of tasks
        await (TaskModel as any).deleteMany({ project: id });
        return true;
      }
      const projects = readJson<LocalProject>(PROJECTS_FILE);
      const filtered = projects.filter(p => p._id !== id);
      writeJson(PROJECTS_FILE, filtered);

      // Cascading deletion of tasks for this project
      const tasks = readJson<LocalTask>(TASKS_FILE);
      const remainingTasks = tasks.filter(t => t.project !== id);
      writeJson(TASKS_FILE, remainingTasks);
      return true;
    },

    async addMember(projectId: string, email: string): Promise<any | null> {
      // Find user by email
      const users = readJson<LocalUser>(USERS_FILE);
      const targetUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!targetUser) return { error: 'User not found' };

      if (isMongoEnabled() && mongoose.connection.readyState === 1) {
        const project = await (ProjectModel as any).findById(projectId);
        if (!project) return null;
        if (project.members.includes(targetUser._id)) {
          return { error: 'User already in project' };
        }
        project.members.push(targetUser._id);
        await project.save();
        return this.findById(projectId);
      }

      const projects = readJson<LocalProject>(PROJECTS_FILE);
      const idx = projects.findIndex(p => p._id === projectId);
      if (idx === -1) return null;

      const p = projects[idx];
      if (p.admin === targetUser._id || p.members.includes(targetUser._id)) {
        return { error: 'User is already a member of this project' };
      }

      p.members.push(targetUser._id);
      writeJson(PROJECTS_FILE, projects);
      return this.findById(projectId);
    },

    async removeMember(projectId: string, memberId: string): Promise<any | null> {
      if (isMongoEnabled() && mongoose.connection.readyState === 1) {
        const project = await (ProjectModel as any).findById(projectId);
        if (!project) return null;
        project.members = project.members.filter((m: any) => m.toString() !== memberId);
        await project.save();
        return this.findById(projectId);
      }

      const projects = readJson<LocalProject>(PROJECTS_FILE);
      const idx = projects.findIndex(p => p._id === projectId);
      if (idx === -1) return null;

      const p = projects[idx];
      p.members = p.members.filter(mId => mId !== memberId);
      writeJson(PROJECTS_FILE, projects);

      // Also unassign tasks assigned to this user inside this project
      const tasks = readJson<LocalTask>(TASKS_FILE);
      const updatedTasks = tasks.map(t => {
        if (t.project === projectId && t.assignedTo === memberId) {
          return { ...t, assignedTo: undefined };
        }
        return t;
      });
      writeJson(TASKS_FILE, updatedTasks);

      return this.findById(projectId);
    }
  },

  // TASK OPERATIONS
  tasks: {
    async findForProject(projectId: string): Promise<any[]> {
      if (isMongoEnabled() && mongoose.connection.readyState === 1) {
        return (TaskModel as any).find({ project: projectId })
          .populate('assignedTo', 'name email avatar role')
          .populate('createdBy', 'name email avatar role')
          .lean();
      }

      const tasks = readJson<LocalTask>(TASKS_FILE);
      const matched = tasks.filter(t => t.project === projectId);

      const users = readJson<LocalUser>(USERS_FILE);
      const userMap = new Map(users.map(u => [u._id, { _id: u._id, name: u.name, email: u.email, avatar: u.avatar || '', role: u.role }]));

      return matched.map(t => ({
        ...t,
        assignedTo: t.assignedTo ? userMap.get(t.assignedTo) : null,
        createdBy: userMap.get(t.createdBy) || { _id: t.createdBy, name: 'Unknown', email: '' }
      }));
    },

    async findById(id: string): Promise<any | null> {
      if (isMongoEnabled() && mongoose.connection.readyState === 1) {
        return (TaskModel as any).findById(id)
          .populate('assignedTo', 'name email avatar role')
          .populate('createdBy', 'name email avatar role')
          .lean();
      }
      const tasks = readJson<LocalTask>(TASKS_FILE);
      const task = tasks.find(t => t._id === id);
      if (!task) return null;

      const users = readJson<LocalUser>(USERS_FILE);
      const userMap = new Map(users.map(u => [u._id, { _id: u._id, name: u.name, email: u.email, avatar: u.avatar || '', role: u.role }]));

      return {
        ...task,
        assignedTo: task.assignedTo ? userMap.get(task.assignedTo) : null,
        createdBy: userMap.get(task.createdBy) || { _id: task.createdBy, name: 'Unknown', email: '' }
      };
    },

    async create(data: Omit<LocalTask, '_id' | 'createdAt' | 'updatedAt'>): Promise<any> {
      if (isMongoEnabled() && mongoose.connection.readyState === 1) {
        const t = await (TaskModel as any).create(data);
        return this.findById(t._id.toString());
      }
      const tasks = readJson<LocalTask>(TASKS_FILE);
      const newT: LocalTask = {
        _id: generateId(),
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        priority: data.priority,
        status: data.status,
        assignedTo: data.assignedTo,
        project: data.project,
        createdBy: data.createdBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      tasks.push(newT);
      writeJson(TASKS_FILE, tasks);
      return this.findById(newT._id);
    },

    async update(id: string, data: Partial<Omit<LocalTask, '_id' | 'createdAt' | 'updatedAt'>>): Promise<any | null> {
      if (isMongoEnabled() && mongoose.connection.readyState === 1) {
        const updated = await (TaskModel as any).findByIdAndUpdate(id, data, { new: true });
        if (!updated) return null;
        return this.findById(id);
      }
      const tasks = readJson<LocalTask>(TASKS_FILE);
      const idx = tasks.findIndex(t => t._id === id);
      if (idx === -1) return null;

      tasks[idx] = {
        ...tasks[idx],
        ...data,
        updatedAt: new Date().toISOString()
      };
      writeJson(TASKS_FILE, tasks);
      return this.findById(id);
    },

    async delete(id: string): Promise<boolean> {
      if (isMongoEnabled() && mongoose.connection.readyState === 1) {
        await (TaskModel as any).findByIdAndDelete(id);
        return true;
      }
      const tasks = readJson<LocalTask>(TASKS_FILE);
      const filtered = tasks.filter(t => t._id !== id);
      writeJson(TASKS_FILE, filtered);
      return true;
    },

    // Get user statistics (tasks statistics for dashboard layout)
    async getUserStats(userId: string): Promise<any> {
      let filteredTasks: any[] = [];

      if (isMongoEnabled() && mongoose.connection.readyState === 1) {
        // Find visible projects for user
        const visibleProjects = await (ProjectModel as any).find({
          $or: [{ admin: userId }, { members: userId }]
        }, '_id');
        const projectIds = visibleProjects.map((p: any) => p._id);
        
        filteredTasks = await (TaskModel as any).find({ project: { $in: projectIds } }).lean();
      } else {
        const projects = readJson<LocalProject>(PROJECTS_FILE);
        const visibleProjIds = projects
          .filter(p => p.admin === userId || p.members.includes(userId))
          .map(p => p._id);

        const tasks = readJson<LocalTask>(TASKS_FILE);
        filteredTasks = tasks.filter(t => visibleProjIds.includes(t.project));
      }

      // Compute statistics based on tasks
      const total = filteredTasks.length;
      const completed = filteredTasks.filter(t => t.status === 'done').length;
      const progress = filteredTasks.filter(t => t.status === 'inprogress').length;
      const pending = filteredTasks.filter(t => t.status === 'todo').length;
      
      const now = new Date();
      const overdue = filteredTasks.filter(t => {
        return t.status !== 'done' && new Date(t.dueDate) < now;
      }).length;

      // Group tasks by assignee for chart
      const userMapCounts: { [key: string]: { name: string; count: number } } = {};
      
      // Load user details if in local fallback helper
      let userList: any[] = [];
      if (isMongoEnabled() && mongoose.connection.readyState === 1) {
        userList = await (UserModel as any).find({}, '_id name').lean();
      } else {
        userList = readJson<LocalUser>(USERS_FILE);
      }
      const uMap = new Map(userList.map(u => [String(u._id), u.name]));

      filteredTasks.forEach(t => {
        const assigneeId = t.assignedTo ? String(t.assignedTo) : 'Unassigned';
        const name = assigneeId === 'Unassigned' ? 'Unassigned' : (uMap.get(assigneeId) || 'Unknown');
        if (!userMapCounts[assigneeId]) {
          userMapCounts[assigneeId] = { name, count: 0 };
        }
        userMapCounts[assigneeId].count += 1;
      });

      const tasksPerUser = Object.values(userMapCounts);

      return {
        total,
        completed,
        progress,
        pending,
        overdue,
        tasksPerUser
      };
    }
  },

  // ACTIVITY OPERATIONS
  activities: {
    async findForUser(userId: string): Promise<any[]> {
      let activities: any[] = [];
      
      if (isMongoEnabled() && mongoose.connection.readyState === 1) {
        // Retrieve visible projects for this user
        const projects = await (ProjectModel as any).find({
          $or: [{ admin: userId }, { members: userId }]
        }, '_id');
        const projectIds = projects.map((p: any) => p._id);

        activities = await (ActivityModel as any).find({
          $or: [
            { project: { $in: projectIds } },
            { user: userId }
          ]
        })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('user', 'name email avatar')
        .lean();

        return activities;
      }

      const allActivities = readJson<LocalActivity>(ACTIVITIES_FILE);
      const projects = readJson<LocalProject>(PROJECTS_FILE);
      const visibleProjIds = projects
        .filter(p => p.admin === userId || p.members.includes(userId))
        .map(p => p._id);

      const matched = allActivities.filter(a => {
        return a.user === userId || (a.project && visibleProjIds.includes(a.project));
      });

      // Sort by recency
      matched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Limit to 20
      const limited = matched.slice(0, 20);

      // Populate user info
      const users = readJson<LocalUser>(USERS_FILE);
      const userMap = new Map(users.map(u => [u._id, { _id: u._id, name: u.name, email: u.email, avatar: u.avatar || '' }]));

      return limited.map(a => ({
        ...a,
        user: userMap.get(a.user) || { _id: a.user, name: 'System User', email: '' }
      }));
    },

    async create(text: string, userId: string, projectId?: string, taskId?: string): Promise<any> {
      if (isMongoEnabled() && mongoose.connection.readyState === 1) {
        const act = await (ActivityModel as any).create({
          text,
          user: userId,
          project: projectId,
          task: taskId
        });
        return act;
      }

      const activities = readJson<LocalActivity>(ACTIVITIES_FILE);
      const newAct: LocalActivity = {
        _id: generateId(),
        text,
        user: userId,
        project: projectId,
        task: taskId,
        createdAt: new Date().toISOString()
      };
      activities.unshift(newAct); // add to beginning
      writeJson(ACTIVITIES_FILE, activities.slice(0, 100)); // cap at 100 on local
      return newAct;
    }
  }
};
