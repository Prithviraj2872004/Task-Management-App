export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  avatar?: string;
}

export interface Project {
  _id: string;
  title: string;
  description: string;
  admin: User;
  members: User[];
  createdAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'inprogress' | 'done';
  assignedTo?: User | null;
  project: string;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  _id: string;
  text: string;
  project?: string;
  task?: string;
  user: User;
  createdAt: string;
}

export interface DashboardStats {
  total: number;
  completed: number;
  progress: number;
  pending: number;
  overdue: number;
  tasksPerUser: { name: string; count: number }[];
}
