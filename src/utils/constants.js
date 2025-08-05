// API Configuration
export const API_BASE_URL = 'https://app.asana.com/api/1.0'\;

// Task Status
export const TASK_STATUS = {
  INCOMPLETE: 'incomplete',
  COMPLETE: 'complete',
};

// Project Colors (Asana standard colors)
export const PROJECT_COLORS = {
  'dark-pink': '#e01e5a',
  'dark-green': '#2d9f5d',
  'dark-orange': '#f2994a',
  'dark-purple': '#9f40ff',
  'dark-blue': '#4a90e2',
  'dark-teal': '#17a2b8',
  'dark-brown': '#8d4e2a',
  'dark-red': '#e21c49',
  'dark-yellow': '#ffc312',
  'light-pink': '#fd9fb3',
  'light-green': '#a4dd00',
  'light-orange': '#ffd700',
  'light-purple': '#b794f6',
  'light-blue': '#87ceeb',
  'light-teal': '#4fd1c7',
  'light-brown': '#deb887',
  'light-red': '#ff6b6b',
  'light-yellow': '#fff3cd',
};

// Query Keys for React Query
export const QUERY_KEYS = {
  USER: 'user',
  WORKSPACES: 'workspaces',
  PROJECTS: 'projects',
  TASKS: 'tasks',
  TASK: 'task',
  TEAMS: 'teams',
  SEARCH: 'search',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  AUTH_ERROR: 'Authentication failed. Please check your API token.',
  NOT_FOUND: 'Resource not found.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
};
