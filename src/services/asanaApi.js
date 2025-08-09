import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// API response interceptor to handle responses
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
      console.error('API Error:', error.response?.data || error.message);
      return Promise.reject(error);
    }
);

// ========== USER & WORKSPACE APIs ==========
export const userApi = {
  getMe: () => api.get('/users/me'),
  getWorkspaces: () => api.get('/workspaces'),
  getWorkspaceUsers: (workspaceId) => api.get(`/workspaces/${workspaceId}/users`),
};

// ========== PROJECT APIs ==========
export const projectApi = {
  getProjects: (workspaceId, opt_fields) =>
      api.get(`/projects?workspace=${workspaceId}${opt_fields ? `&opt_fields=${opt_fields}` : ''}`),

  getProject: (projectId) =>
      api.get(`/projects/${projectId}`),

  createProject: (projectData) =>
      api.post('/projects', projectData),

  updateProject: (projectId, projectData) =>
      api.put(`/projects/${projectId}`, projectData),

  deleteProject: (projectId) =>
      api.delete(`/projects/${projectId}`),

  addMembers: (projectId, members) =>
      api.post(`/projects/${projectId}/members`, { members }),

  removeMembers: (projectId, members) =>
      api.delete(`/projects/${projectId}/members`, { members }),

  getStatus: (projectId) =>
      api.get(`/projects/${projectId}/status`),

  updateStatus: (projectId, text, color = 'green') =>
      api.post(`/projects/${projectId}/status`, { text, color }),
};

// ========== TASK APIs ==========
export const taskApi = {
  getTasks: (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    return api.get(`/tasks?${queryParams.toString()}`);
  },

  getTask: (taskId) =>
      api.get(`/tasks/${taskId}`),

  createTask: (taskData) =>
      api.post('/tasks', taskData),

  updateTask: (taskId, taskData) =>
      api.put(`/tasks/${taskId}`, taskData),

  deleteTask: (taskId) =>
      api.delete(`/tasks/${taskId}`),

  toggleCompletion: (taskId, completed) =>
      api.put(`/tasks/${taskId}/toggle`, { completed }),

  getSubtasks: (taskId) =>
      api.get(`/tasks/${taskId}/subtasks`),

  getStories: (taskId) =>
      api.get(`/tasks/${taskId}/stories`),

  addComment: (taskId, text) =>
      api.post(`/tasks/${taskId}/stories`, { text }),

  getAttachments: (taskId) =>
      api.get(`/tasks/${taskId}/attachments`),

  addTimeEntry: (taskId, duration, description, date) =>
      api.post(`/tasks/${taskId}/time`, { duration, description, date }),
};

// ========== TEAM APIs ==========
export const teamApi = {
  getTeams: (workspaceId) =>
      api.get(`/teams?workspace=${workspaceId}`),

  getTeamMembers: (teamId) =>
      api.get(`/teams/${teamId}/members`),
};

// ========== TAG APIs ==========
export const tagApi = {
  getTags: (workspaceId) =>
      api.get(`/tags?workspace=${workspaceId}`),

  createTag: (name, color, workspaceId) =>
      api.post('/tags', { name, color, workspace: workspaceId }),
};

// ========== THEME APIs ==========
export const themeApi = {
  getThemes: () =>
      api.get('/themes'),

  createTheme: (themeData) =>
      api.post('/themes', themeData),

  updateTheme: (themeId, themeData) =>
      api.put(`/themes/${themeId}`, themeData),

  deleteTheme: (themeId) =>
      api.delete(`/themes/${themeId}`),
};

// ========== NOTIFICATION APIs ==========
export const notificationApi = {
  getNotifications: () =>
      api.get('/notifications'),

  createNotification: (title, message, type = 'info', userId) =>
      api.post('/notifications', { title, message, type, userId }),

  markAsRead: (notificationId) =>
      api.put(`/notifications/${notificationId}/read`),

  deleteNotification: (notificationId) =>
      api.delete(`/notifications/${notificationId}`),
};

// ========== AI & ANALYTICS APIs ==========
export const aiApi = {
  getInsights: (workspaceId) =>
      api.get(`/ai/insights?workspace=${workspaceId}`),

  getDashboardAnalytics: (workspaceId) =>
      api.get(`/analytics/dashboard?workspace=${workspaceId}`),
};

// ========== ACTIVITY APIs ==========
export const activityApi = {
  getActivityLog: (limit = 20) =>
      api.get(`/activity?limit=${limit}`),
};

// ========== SEARCH APIs ==========
export const searchApi = {
  search: (query, workspaceId) =>
      api.get(`/search?query=${encodeURIComponent(query)}&workspace=${workspaceId}`),
};

// ========== WEBHOOK APIs ==========
export const webhookApi = {
  getWebhooks: (workspaceId) =>
      api.get(`/webhooks?workspace=${workspaceId}`),

  createWebhook: (resource, target) =>
      api.post('/webhooks', { resource, target }),
};

// ========== HEALTH CHECK API ==========
export const healthApi = {
  check: () =>
      api.get('/health'),
};

// ========== COMBINED APIS FOR COMPLEX OPERATIONS ==========
export const combinedApi = {
  // Get complete dashboard data
  getDashboardData: async (workspaceId) => {
    try {
      const [user, projects, analytics, notifications, insights] = await Promise.all([
        userApi.getMe(),
        projectApi.getProjects(workspaceId),
        aiApi.getDashboardAnalytics(),
        notificationApi.getNotifications(),
        aiApi.getInsights()
      ]);

      return {
        user: user.data,
        projects: projects.data,
        analytics: analytics.data,
        notifications: notifications.data,
        insights: insights.data
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },

  // Get project with all related data
  getProjectDetails: async (projectId) => {
    try {
      const [project, tasks, status] = await Promise.all([
        projectApi.getProject(projectId),
        taskApi.getTasks({ project: projectId }),
        projectApi.getStatus(projectId).catch(() => ({ data: [] }))
      ]);

      return {
        project: project.data,
        tasks: tasks.data,
        status: status.data
      };
    } catch (error) {
      console.error('Error fetching project details:', error);
      throw error;
    }
  },

  // Get task with all related data
  getTaskDetails: async (taskId) => {
    try {
      const [task, subtasks, stories, attachments] = await Promise.all([
        taskApi.getTask(taskId),
        taskApi.getSubtasks(taskId).catch(() => ({ data: [] })),
        taskApi.getStories(taskId).catch(() => ({ data: [] })),
        taskApi.getAttachments(taskId).catch(() => ({ data: [] }))
      ]);

      return {
        task: task.data,
        subtasks: subtasks.data,
        stories: stories.data,
        attachments: attachments.data
      };
    } catch (error) {
      console.error('Error fetching task details:', error);
      throw error;
    }
  },

  // Get workspace overview
  getWorkspaceOverview: async (workspaceId) => {
    try {
      const [users, teams, tags, projects] = await Promise.all([
        userApi.getWorkspaceUsers(workspaceId),
        teamApi.getTeams(workspaceId),
        tagApi.getTags(workspaceId),
        projectApi.getProjects(workspaceId)
      ]);

      return {
        users: users.data,
        teams: teams.data,
        tags: tags.data,
        projects: projects.data
      };
    } catch (error) {
      console.error('Error fetching workspace overview:', error);
      throw error;
    }
  }
};

// ========== UTILITY FUNCTIONS ==========
export const apiUtils = {
  // Format date for Asana API
  formatDate: (date) => {
    if (!date) return null;
    return new Date(date).toISOString().split('T')[0];
  },

  // Parse Asana date
  parseDate: (dateString) => {
    if (!dateString) return null;
    return new Date(dateString);
  },

  // Get priority label
  getPriorityLabel: (priority) => {
    const priorities = {
      'high': 'High',
      'medium': 'Medium',
      'low': 'Low',
      'none': 'None'
    };
    return priorities[priority] || 'None';
  },

  // Get task status
  getTaskStatus: (task) => {
    if (task.completed) return 'completed';
    if (task.due_on && new Date(task.due_on) < new Date()) return 'overdue';
    if (task.due_on && new Date(task.due_on) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)) return 'due_soon';
    return 'active';
  },

  // Calculate project progress
  calculateProjectProgress: (tasks) => {
    if (!tasks || tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => task.completed).length;
    return Math.round((completedTasks / tasks.length) * 100);
  },

  // Group tasks by status
  groupTasksByStatus: (tasks) => {
    return tasks.reduce((groups, task) => {
      const status = apiUtils.getTaskStatus(task);
      if (!groups[status]) groups[status] = [];
      groups[status].push(task);
      return groups;
    }, {});
  },

  // Filter tasks by assignee
  filterTasksByAssignee: (tasks, assigneeId) => {
    if (!assigneeId) return tasks;
    return tasks.filter(task => task.assignee?.gid === assigneeId);
  },

  // Sort tasks by priority
  sortTasksByPriority: (tasks) => {
    const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1, 'none': 0 };
    return [...tasks].sort((a, b) => {
      return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
    });
  },

  // Sort tasks by due date
  sortTasksByDueDate: (tasks) => {
    return [...tasks].sort((a, b) => {
      if (!a.due_on && !b.due_on) return 0;
      if (!a.due_on) return 1;
      if (!b.due_on) return -1;
      return new Date(a.due_on) - new Date(b.due_on);
    });
  }
};

// Default export with all APIs
export default {
  user: userApi,
  project: projectApi,
  task: taskApi,
  team: teamApi,
  tag: tagApi,
  theme: themeApi,
  notification: notificationApi,
  ai: aiApi,
  activity: activityApi,
  search: searchApi,
  webhook: webhookApi,
  health: healthApi,
  combined: combinedApi,
  utils: apiUtils
};