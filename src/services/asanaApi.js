import axios from 'axios';

// Create axios instance with base configuration
const asanaApi = axios.create({
  baseURL: 'https://app.asana.com/api/1.0',
  headers: {
    'Authorization': `Bearer ${import.meta.env.VITE_ASANA_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

// API response interceptor to handle Asana's data structure
asanaApi.interceptors.response.use(
  (response) => response.data.data,
  (error) => {
    console.error('Asana API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// User and Workspace APIs
export const userApi = {
  getMe: () => asanaApi.get('/users/me'),
  getWorkspaces: () => asanaApi.get('/workspaces'),
};

// Project APIs
export const projectApi = {
  getProjects: (workspaceId) => 
    asanaApi.get(`/projects?workspace=${workspaceId}&opt_fields=name,color,created_at,modified_at,owner`),
  
  getProject: (projectId) => 
    asanaApi.get(`/projects/${projectId}?opt_fields=name,notes,color,created_at,modified_at,owner,team`),
};

export default asanaApi;
