import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Automatically inject JWT tokens into request headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data: any) => api.post('/auth/register', data).then(r => r.data),
  login: (data: any) => api.post('/auth/login', data).then(r => r.data),
  getProfile: () => api.get('/auth/profile').then(r => r.data),
  updateProfile: (data: { name: string; avatar: string }) => api.put('/auth/profile', data).then(r => r.data)
};

export const projectsAPI = {
  list: () => api.get('/projects').then(r => r.data),
  create: (data: { title: string; description?: string }) => api.post('/projects', data).then(r => r.data),
  getDetails: (id: string) => api.get(`/projects/${id}`).then(r => r.data),
  update: (id: string, data: { title: string; description: string }) => api.put(`/projects/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/projects/${id}`).then(r => r.data),
  addMember: (id: string, email: string) => api.post(`/projects/${id}/add-member`, { email }).then(r => r.data),
  removeMember: (id: string, memberId: string) => api.delete(`/projects/${id}/remove-member`, { data: { memberId } }).then(r => r.data)
};

export const tasksAPI = {
  listByProject: (projectId: string) => api.get(`/tasks/project/${projectId}`).then(r => r.data),
  create: (data: { title: string; description?: string; dueDate: string; priority: string; status?: string; assignedTo?: string; project: string }) => api.post('/tasks', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/tasks/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/tasks/${id}`).then(r => r.data)
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats').then(r => r.data)
};

export default api;
