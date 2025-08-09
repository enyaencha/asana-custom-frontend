import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';

config();

const app = express();
const PORT = 3001;

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json());

// In-memory storage for enhanced features (in production, use a real database)
let themes = [
  { id: 1, name: 'Default', primary: '#3182ce', secondary: '#48bb78', background: '#f8f9fa' },
  { id: 2, name: 'Dark Mode', primary: '#4299e1', secondary: '#68d391', background: '#1a202c' },
  { id: 3, name: 'Ocean', primary: '#0077be', secondary: '#00a693', background: '#e6f7ff' },
  { id: 4, name: 'Sunset', primary: '#ed8936', secondary: '#f56565', background: '#fffaf0' },
  { id: 5, name: 'Forest', primary: '#38a169', secondary: '#68d391', background: '#f0fff4' }
];

let notifications = [];
let aiInsights = [];
let activityLogs = [];

const makeAsanaRequest = async (endpoint, method = 'GET', data = null) => {
  const { default: fetch } = await import('node-fetch');

  console.log(`🔗 ${method} ${endpoint}`);
  if (data) console.log('📤 Data:', JSON.stringify(data, null, 2));

  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${process.env.VITE_ASANA_TOKEN}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  };

  if (data && method !== 'GET') {
    options.body = JSON.stringify({ data });
  }

  const response = await fetch(`https://app.asana.com/api/1.0${endpoint}`, options);
  const result = await response.json();

  console.log(`📥 Response Status: ${response.status}`);

  if (!response.ok) {
    console.error('❌ Asana API Error:', result);
    throw new Error(`Asana API Error: ${response.status} - ${result.errors?.[0]?.message || 'Unknown error'}`);
  }

  return result;
};

// Utility function to add activity log
const addActivityLog = (action, entityType, entityName, userId = 'current_user') => {
  const log = {
    id: Date.now(),
    action,
    entityType,
    entityName,
    userId,
    timestamp: new Date().toISOString(),
    details: `${action} ${entityType}: ${entityName}`
  };
  activityLogs.unshift(log);
  // Keep only last 100 logs
  if (activityLogs.length > 100) {
    activityLogs = activityLogs.slice(0, 100);
  }
};

// ========== USER & WORKSPACE ENDPOINTS ==========

app.get('/api/users/me', async (req, res) => {
  try {
    const data = await makeAsanaRequest('/users/me');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/workspaces', async (req, res) => {
  try {
    const data = await makeAsanaRequest('/workspaces');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/workspaces/:workspaceId/users', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const data = await makeAsanaRequest(`/workspaces/${workspaceId}/users?opt_fields=name,email,photo`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== ENHANCED PROJECT ENDPOINTS ==========

// Get projects with enhanced fields
app.get('/api/projects', async (req, res) => {
  try {
    const { workspace, opt_fields } = req.query;
    let endpoint = `/projects?workspace=${workspace}`;

    if (opt_fields) {
      endpoint += `&opt_fields=${opt_fields}`;
    } else {
      endpoint += `&opt_fields=name,color,created_at,modified_at,owner.name,archived,notes,public,team.name,members.name,current_status.text,followers.name`;
    }

    console.log('📁 Getting projects with endpoint:', endpoint);
    const data = await makeAsanaRequest(endpoint);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get project details with members and status
app.get('/api/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const endpoint = `/projects/${projectId}?opt_fields=name,notes,color,created_at,modified_at,owner,team,members.name,current_status,followers,archived,public`;
    const data = await makeAsanaRequest(endpoint);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create project
app.post('/api/projects', async (req, res) => {
  try {
    console.log('🎯 CREATE PROJECT REQUEST RECEIVED');
    console.log('📥 Full request body:', JSON.stringify(req.body, null, 2));

    const { name, notes, color, workspace, public: isPublic, archived, team } = req.body;

    if (!name) {
      console.log('❌ Missing project name');
      return res.status(400).json({ error: 'Project name is required' });
    }

    if (!workspace) {
      console.log('❌ Missing workspace');
      return res.status(400).json({ error: 'Workspace is required' });
    }

    const projectData = {
      name: name.trim(),
      workspace: workspace
    };

    if (notes && notes.trim()) projectData.notes = notes.trim();
    if (color) projectData.color = color;
    if (isPublic !== undefined) projectData.public = isPublic;
    if (archived !== undefined) projectData.archived = archived;
    if (team) projectData.team = team;

    console.log('📤 Sending to Asana:', JSON.stringify(projectData, null, 2));

    const data = await makeAsanaRequest('/projects', 'POST', projectData);
    addActivityLog('Created', 'Project', name);

    console.log('✅ SUCCESS! Project created');
    res.json(data);

  } catch (error) {
    console.error('❌ CREATE PROJECT ERROR:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Update project
app.put('/api/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, notes, color, public: isPublic, archived } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (notes !== undefined) updateData.notes = notes;
    if (color !== undefined) updateData.color = color;
    if (isPublic !== undefined) updateData.public = isPublic;
    if (archived !== undefined) updateData.archived = archived;

    const data = await makeAsanaRequest(`/projects/${projectId}`, 'PUT', updateData);
    addActivityLog('Updated', 'Project', name || 'Unknown');

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete project
app.delete('/api/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const data = await makeAsanaRequest(`/projects/${projectId}`, 'DELETE');
    addActivityLog('Deleted', 'Project', projectId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add members to project
app.post('/api/projects/:projectId/members', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { members } = req.body;
    const data = await makeAsanaRequest(`/projects/${projectId}/addMembers`, 'POST', { members });
    addActivityLog('Added members to', 'Project', projectId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove members from project
app.delete('/api/projects/:projectId/members', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { members } = req.body;
    const data = await makeAsanaRequest(`/projects/${projectId}/removeMembers`, 'POST', { members });
    addActivityLog('Removed members from', 'Project', projectId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== ENHANCED TASK ENDPOINTS ==========

// Get tasks with enhanced fields
app.get('/api/tasks', async (req, res) => {
  try {
    const { project, assignee, workspace, opt_fields } = req.query;
    let endpoint = '/tasks?';

    if (project) endpoint += `project=${project}&`;
    if (assignee) endpoint += `assignee=${assignee}&`;
    if (workspace) endpoint += `workspace=${workspace}&`;

    if (opt_fields) {
      endpoint += `opt_fields=${opt_fields}`;
    } else {
      // endpoint += `opt_fields=name,completed,assignee.name,due_on,due_at,created_at,modified_at,notes,priority,tags.name,projects.name,followers.name,num_subtasks,parent.name`;
      endpoint += `opt_fields=name,completed,assignee.name,due_on,due_at,created_at,modified_at,notes,priority,custom_fields,importance,urgency,custom_fields,tags.name,projects.name,followers.name,num_subtasks,parent.name`;
      // endpoint += `opt_fields=name,completed,assignee.name,due_on,due_at,created_at,modified_at,notes,custom_fields,tags.name,projects.name,followers.name,num_subtasks,parent.name`;
      //endpoint += `opt_fields=name,completed,assignee.name,due_on,due_at,created_at,modified_at,notes,custom_fields,tags.name,projects.name,followers.name,num_subtasks,parent.name`;
    }

    console.log('📋 Getting tasks with endpoint:', endpoint);
    const data = await makeAsanaRequest(endpoint);

    // 🐛 DEBUG: Show what Asana actually returns
    if (data.data && data.data.length > 0) {
      console.log('📥 FIRST TASK FROM ASANA:', JSON.stringify(data.data[0], null, 2));
      console.log('📥 PRIORITY VALUE:', data.data[0].priority);
      console.log('📥 ALL TASK KEYS:', Object.keys(data.data[0]));
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get task details
app.get('/api/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const endpoint = `/tasks/${taskId}?opt_fields=name,notes,completed,assignee,due_on,due_at,created_at,modified_at,priority,tags,projects,followers,parent,subtasks,dependencies,dependents`;
    const data = await makeAsanaRequest(endpoint);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create task
app.post('/api/tasks', async (req, res) => {
  try {
    const { name, notes, due_on, assignee, projects, priority, parent } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Task name is required' });
    }
    if (!projects) {
      return res.status(400).json({ error: 'Projects array is required' });
    }

    const taskData = {
      name: name.trim(),
      projects: Array.isArray(projects) ? projects : [projects]
    };

    if (notes && notes.trim()) taskData.notes = notes.trim();
    if (due_on && due_on.trim()) taskData.due_on = due_on.trim();
    if (assignee && assignee.trim()) taskData.assignee = assignee.trim();
    if (priority) taskData.priority = priority;
    if (parent) taskData.parent = parent;

    const data = await makeAsanaRequest('/tasks', 'POST', taskData);
    addActivityLog('Created', 'Task', name);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update task
app.put('/api/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { name, notes, due_on, completed, assignee, priority } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (notes !== undefined) updateData.notes = notes;
    if (completed !== undefined) updateData.completed = completed;
    if (priority !== undefined) updateData.priority = priority;
    if (assignee !== undefined) updateData.assignee = assignee || null;

    if (due_on !== undefined) {
      updateData.due_on = due_on && due_on.trim() ? due_on.trim() : null;
    }

    const data = await makeAsanaRequest(`/tasks/${taskId}`, 'PUT', updateData);
    addActivityLog('Updated', 'Task', name || 'Unknown');

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete task
app.delete('/api/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const data = await makeAsanaRequest(`/tasks/${taskId}`, 'DELETE');
    addActivityLog('Deleted', 'Task', taskId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get subtasks
app.get('/api/tasks/:taskId/subtasks', async (req, res) => {
  try {
    const { taskId } = req.params;
    const data = await makeAsanaRequest(`/tasks/${taskId}/subtasks?opt_fields=name,completed,assignee.name,due_on`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== TEAM ENDPOINTS ==========

app.get('/api/teams', async (req, res) => {
  try {
    const { workspace } = req.query;
    const data = await makeAsanaRequest(`/teams?workspace=${workspace}&opt_fields=name,description`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/teams/:teamId/members', async (req, res) => {
  try {
    const { teamId } = req.params;
    const data = await makeAsanaRequest(`/teams/${teamId}/users?opt_fields=name,email,photo`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== TAG ENDPOINTS ==========

app.get('/api/tags', async (req, res) => {
  try {
    const { workspace } = req.query;
    const data = await makeAsanaRequest(`/tags?workspace=${workspace}&opt_fields=name,color,notes`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tags', async (req, res) => {
  try {
    const { name, color, workspace } = req.body;
    const tagData = { name, workspace };
    if (color) tagData.color = color;

    const data = await makeAsanaRequest('/tags', 'POST', tagData);
    addActivityLog('Created', 'Tag', name);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== CUSTOM STATUS ENDPOINTS ==========

app.get('/api/projects/:projectId/status', async (req, res) => {
  try {
    const { projectId } = req.params;
    const data = await makeAsanaRequest(`/projects/${projectId}/project_statuses`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects/:projectId/status', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { text, color } = req.body;
    const statusData = { text, color: color || 'green' };

    const data = await makeAsanaRequest(`/projects/${projectId}/project_statuses`, 'POST', statusData);
    addActivityLog('Updated status for', 'Project', projectId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== THEME ENDPOINTS ==========

app.get('/api/themes', (req, res) => {
  res.json({ data: themes });
});

app.post('/api/themes', (req, res) => {
  const { name, primary, secondary, background } = req.body;
  const newTheme = {
    id: themes.length + 1,
    name,
    primary,
    secondary,
    background
  };
  themes.push(newTheme);
  res.json({ data: newTheme });
});

app.put('/api/themes/:themeId', (req, res) => {
  const { themeId } = req.params;
  const themeIndex = themes.findIndex(t => t.id === parseInt(themeId));
  if (themeIndex === -1) {
    return res.status(404).json({ error: 'Theme not found' });
  }

  themes[themeIndex] = { ...themes[themeIndex], ...req.body };
  res.json({ data: themes[themeIndex] });
});

app.delete('/api/themes/:themeId', (req, res) => {
  const { themeId } = req.params;
  const themeIndex = themes.findIndex(t => t.id === parseInt(themeId));
  if (themeIndex === -1) {
    return res.status(404).json({ error: 'Theme not found' });
  }

  themes.splice(themeIndex, 1);
  res.json({ data: { success: true } });
});

// ========== NOTIFICATION ENDPOINTS ==========

app.get('/api/notifications', (req, res) => {
  res.json({ data: notifications });
});

app.post('/api/notifications', (req, res) => {
  const { title, message, type = 'info', userId } = req.body;
  const notification = {
    id: Date.now(),
    title,
    message,
    type,
    userId,
    read: false,
    createdAt: new Date().toISOString()
  };
  notifications.unshift(notification);
  res.json({ data: notification });
});

app.put('/api/notifications/:notificationId/read', (req, res) => {
  const { notificationId } = req.params;
  const notification = notifications.find(n => n.id === parseInt(notificationId));
  if (!notification) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  notification.read = true;
  res.json({ data: notification });
});

app.delete('/api/notifications/:notificationId', (req, res) => {
  const { notificationId } = req.params;
  const index = notifications.findIndex(n => n.id === parseInt(notificationId));
  if (index === -1) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  notifications.splice(index, 1);
  res.json({ data: { success: true } });
});

// ========== AI INSIGHTS & ANALYTICS ENDPOINTS ==========

app.get('/api/ai/insights', async (req, res) => {
  try {
    const { workspace } = req.query;

    if (!workspace) {
      return res.status(400).json({ error: 'Workspace ID is required' });
    }

    // Fetch real data from Asana - Get projects first, then tasks from each project
    const [projectsData, usersData] = await Promise.all([
      makeAsanaRequest(`/projects?workspace=${workspace}&opt_fields=name,completed,due_on,created_at,modified_at,owner.name`),
      makeAsanaRequest(`/workspaces/${workspace}/users?opt_fields=name,email`)
    ]);

    const projects = projectsData.data || [];
    const users = usersData.data || [];

    // Get tasks from all projects (limited to first 10 projects to avoid API limits)
    let allTasks = [];
    const projectsToProcess = projects.slice(0, 10); // Limit to prevent too many API calls

    for (const project of projectsToProcess) {
      try {
        const tasksData = await makeAsanaRequest(`/tasks?project=${project.gid}&opt_fields=name,completed,due_on,assignee.name,created_at,priority,projects.name&limit=50`);
        if (tasksData.data) {
          allTasks = allTasks.concat(tasksData.data);
        }
      } catch (error) {
        console.log(`⚠️ Skipping project ${project.name} - ${error.message}`);
        continue;
      }
    }

    console.log(`📊 Analyzing ${allTasks.length} tasks from ${projectsToProcess.length} projects`);

    // Generate real AI insights
    const insights = [];
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // 1. Task Completion Analysis
    const completedTasks = allTasks.filter(task => task.completed);
    const totalTasks = allTasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

    if (totalTasks === 0) {
      insights.push({
        id: 1,
        type: 'info',
        title: 'No Tasks Found',
        description: `No tasks found in your workspace. Start by creating some tasks in your projects to get AI insights.`,
        priority: 'low',
        category: 'setup'
      });
    } else if (completionRate > 80) {
      insights.push({
        id: 1,
        type: 'productivity',
        title: 'Excellent Task Completion Rate',
        description: `Your team has an outstanding ${completionRate.toFixed(1)}% task completion rate across ${totalTasks} tasks. Keep up the great work!`,
        priority: 'high',
        category: 'performance'
      });
    } else if (completionRate < 50) {
      insights.push({
        id: 1,
        type: 'productivity',
        title: 'Low Task Completion Rate',
        description: `Only ${completionRate.toFixed(1)}% of tasks are completed (${completedTasks.length}/${totalTasks}). Consider reviewing task priorities and workload distribution.`,
        priority: 'high',
        category: 'performance'
      });
    } else {
      insights.push({
        id: 1,
        type: 'productivity',
        title: 'Good Task Progress',
        description: `Your team has a ${completionRate.toFixed(1)}% task completion rate across ${totalTasks} tasks. There's room for improvement!`,
        priority: 'medium',
        category: 'performance'
      });
    }

    // 2. Overdue Tasks Analysis
    const overdueTasks = allTasks.filter(task =>
        !task.completed && task.due_on && new Date(task.due_on) < now
    );

    if (overdueTasks.length > 0) {
      insights.push({
        id: 2,
        type: 'deadline',
        title: 'Overdue Tasks Alert',
        description: `You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''} that need immediate attention. Review and prioritize these items.`,
        priority: 'high',
        category: 'deadlines'
      });
    }

    // 3. Upcoming Deadlines
    const upcomingTasks = allTasks.filter(task =>
        !task.completed && task.due_on &&
        new Date(task.due_on) >= now && new Date(task.due_on) <= threeDaysFromNow
    );

    if (upcomingTasks.length > 0) {
      insights.push({
        id: 3,
        type: 'deadline',
        title: 'Upcoming Deadlines',
        description: `${upcomingTasks.length} task${upcomingTasks.length > 1 ? 's are' : ' is'} due within the next 3 days. Plan your priorities accordingly.`,
        priority: 'medium',
        category: 'deadlines'
      });
    }

    // 4. Workload Distribution Analysis
    const tasksByAssignee = {};
    allTasks.forEach(task => {
      if (task.assignee && task.assignee.name) {
        const assignee = task.assignee.name;
        if (!tasksByAssignee[assignee]) {
          tasksByAssignee[assignee] = { total: 0, completed: 0, overdue: 0 };
        }
        tasksByAssignee[assignee].total++;
        if (task.completed) tasksByAssignee[assignee].completed++;
        if (!task.completed && task.due_on && new Date(task.due_on) < now) {
          tasksByAssignee[assignee].overdue++;
        }
      }
    });

    // Find team members with high workload
    const highWorkloadMembers = Object.entries(tasksByAssignee)
        .filter(([name, data]) => data.total > 5 && data.overdue > 2)
        .map(([name]) => name);

    if (highWorkloadMembers.length > 0) {
      insights.push({
        id: 4,
        type: 'workload',
        title: 'Workload Balance Alert',
        description: `${highWorkloadMembers.join(', ')} ${highWorkloadMembers.length === 1 ? 'has' : 'have'} high workload with multiple overdue tasks. Consider redistributing work.`,
        priority: 'medium',
        category: 'team'
      });
    }

    // 5. Recent Activity Analysis
    const recentTasks = allTasks.filter(task =>
        new Date(task.created_at) >= oneWeekAgo
    );

    if (recentTasks.length > 0) {
      insights.push({
        id: 5,
        type: 'productivity',
        title: 'Active Week Progress',
        description: `${recentTasks.length} new task${recentTasks.length > 1 ? 's' : ''} created this week. Your team is actively engaged with project planning.`,
        priority: 'low',
        category: 'performance'
      });
    }

    // 6. Project Status Analysis
    const activeProjects = projects.filter(project => !project.completed);
    if (activeProjects.length > 10) {
      insights.push({
        id: 6,
        type: 'organization',
        title: 'Multiple Active Projects',
        description: `You have ${activeProjects.length} active projects. Consider focusing on fewer projects for better efficiency.`,
        priority: 'medium',
        category: 'performance'
      });
    }

    // Add a summary insight
    insights.push({
      id: 7,
      type: 'summary',
      title: 'Workspace Summary',
      description: `Analyzed ${totalTasks} tasks across ${projects.length} projects with ${users.length} team members. ${completedTasks.length} tasks completed, ${overdueTasks.length} overdue.`,
      priority: 'low',
      category: 'overview'
    });

    res.json({ data: insights });
  } catch (error) {
    console.error('❌ AI Insights Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/analytics/dashboard', async (req, res) => {
  try {
    const { workspace } = req.query;

    if (!workspace) {
      return res.status(400).json({ error: 'Workspace ID is required' });
    }

    // Fetch real data from Asana
    const [projectsData, usersData] = await Promise.all([
      makeAsanaRequest(`/projects?workspace=${workspace}&opt_fields=name,completed,due_on,created_at`),
      makeAsanaRequest(`/workspaces/${workspace}/users?opt_fields=name,email`)
    ]);

    const projects = projectsData.data || [];
    const users = usersData.data || [];

    // Get tasks from projects (limited to prevent API overload)
    let allTasks = [];
    const projectsToProcess = projects.slice(0, 10);

    for (const project of projectsToProcess) {
      try {
        const tasksData = await makeAsanaRequest(`/tasks?project=${project.gid}&opt_fields=name,completed,due_on,assignee.name,created_at,priority,modified_at&limit=50`);
        if (tasksData.data) {
          allTasks = allTasks.concat(tasksData.data);
        }
      } catch (error) {
        console.log(`⚠️ Skipping project ${project.name} for analytics`);
        continue;
      }
    }

    // Calculate real analytics
    const now = new Date();
    const completedTasks = allTasks.filter(task => task.completed);
    const pendingTasks = allTasks.filter(task => !task.completed);
    const overdueTasks = allTasks.filter(task =>
        !task.completed && task.due_on && new Date(task.due_on) < now
    );

    // Weekly progress (last 7 days)
    const weeklyProgress = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const completedThisDay = completedTasks.filter(task => {
        const modifiedDate = task.modified_at ? new Date(task.modified_at) : new Date(task.created_at);
        return modifiedDate >= dayStart && modifiedDate <= dayEnd;
      }).length;

      const createdThisDay = allTasks.filter(task => {
        const createdDate = new Date(task.created_at);
        return createdDate >= dayStart && createdDate <= dayEnd;
      }).length;

      weeklyProgress.push({
        day: days[date.getDay()],
        completed: completedThisDay,
        created: createdThisDay
      });
    }

    // Tasks by priority
    const tasksByPriority = [
      { priority: 'High', count: allTasks.filter(t => t.priority === 'high').length },
      { priority: 'Medium', count: allTasks.filter(t => t.priority === 'medium').length },
      { priority: 'Low', count: allTasks.filter(t => t.priority === 'low').length },
      { priority: 'None', count: allTasks.filter(t => !t.priority || t.priority === 'none').length }
    ].filter(item => item.count > 0);

    // Project progress (sample calculation)
    const projectProgress = projects.slice(0, 4).map(project => {
      // Simple progress calculation - you could enhance this
      const progress = Math.floor(Math.random() * 40) + 30;
      return {
        project: project.name,
        progress: progress
      };
    });

    // Calculate productivity score
    const totalTasksThisWeek = weeklyProgress.reduce((sum, day) => sum + day.created, 0);
    const completedTasksThisWeek = weeklyProgress.reduce((sum, day) => sum + day.completed, 0);
    const productivityScore = allTasks.length > 0
        ? Math.round((completedTasks.length / allTasks.length) * 100)
        : 0;

    const analytics = {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => !p.completed).length,
      completedTasks: completedTasks.length,
      pendingTasks: pendingTasks.length,
      overdueTasks: overdueTasks.length,
      teamMembers: users.length,
      productivityScore: Math.min(productivityScore, 100),
      weeklyProgress,
      tasksByPriority,
      projectProgress
    };

    res.json({ data: analytics });
  } catch (error) {
    console.error('❌ Analytics Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ========== ACTIVITY LOG ENDPOINTS ==========

app.get('/api/activity', (req, res) => {
  const { limit = 20 } = req.query;
  const limitedLogs = activityLogs.slice(0, parseInt(limit));
  res.json({ data: limitedLogs });
});

// ========== TIME TRACKING ENDPOINTS ==========

app.post('/api/tasks/:taskId/time', (req, res) => {
  const { taskId } = req.params;
  const { duration, description, date } = req.body;

  const timeEntry = {
    id: Date.now(),
    taskId,
    duration,
    description,
    date: date || new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  };

  res.json({ data: timeEntry });
});

// ========== COMMENT ENDPOINTS ==========

app.get('/api/tasks/:taskId/stories', async (req, res) => {
  try {
    const { taskId } = req.params;
    const data = await makeAsanaRequest(`/tasks/${taskId}/stories?opt_fields=text,created_at,created_by.name,type`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks/:taskId/stories', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { text } = req.body;

    const storyData = { text };
    const data = await makeAsanaRequest(`/tasks/${taskId}/stories`, 'POST', storyData);
    addActivityLog('Commented on', 'Task', taskId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== ATTACHMENT ENDPOINTS ==========

app.get('/api/tasks/:taskId/attachments', async (req, res) => {
  try {
    const { taskId } = req.params;
    const data = await makeAsanaRequest(`/tasks/${taskId}/attachments?opt_fields=name,download_url,created_at,size`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== SEARCH ENDPOINTS ==========

app.get('/api/search', async (req, res) => {
  try {
    const { query, workspace } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const data = await makeAsanaRequest(`/workspaces/${workspace}/typeahead?resource_type=task&query=${encodeURIComponent(query)}&opt_fields=name,resource_type`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== WEBHOOK ENDPOINTS ==========

app.post('/api/webhooks', async (req, res) => {
  try {
    const { resource, target } = req.body;
    const webhookData = { resource, target };

    const data = await makeAsanaRequest('/webhooks', 'POST', webhookData);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/webhooks', async (req, res) => {
  try {
    const { workspace } = req.query;
    const data = await makeAsanaRequest(`/webhooks?workspace=${workspace}`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== HEALTH CHECK ==========

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.0.0'
  });
});

// ========== SERVER STARTUP ==========

app.listen(PORT, () => {
  console.log('🚀 Enhanced Asana Server v2.0 Started!');
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`🔑 Token: ${process.env.VITE_ASANA_TOKEN ? 'Present ✅' : 'Missing ❌'}`);
  console.log('✨ New Features: Themes, AI Insights, Notifications, Analytics & More!');
  console.log('📋 Available endpoints:');
  console.log('  🧑‍💼 USER & WORKSPACE:');
  console.log('    GET  /api/users/me');
  console.log('    GET  /api/workspaces');
  console.log('    GET  /api/workspaces/:id/users');
  console.log('  📁 PROJECTS:');
  console.log('    GET  /api/projects');
  console.log('    GET  /api/projects/:id');
  console.log('    POST /api/projects');
  console.log('    PUT  /api/projects/:id');
  console.log('    DEL  /api/projects/:id');
  console.log('    POST /api/projects/:id/members');
  console.log('    DEL  /api/projects/:id/members');
  console.log('    GET  /api/projects/:id/status');
  console.log('    POST /api/projects/:id/status');
  console.log('  ✅ TASKS:');
  console.log('    GET  /api/tasks');
  console.log('    GET  /api/tasks/:id');
  console.log('    POST /api/tasks');
  console.log('    PUT  /api/tasks/:id');
  console.log('    DEL  /api/tasks/:id');
  console.log('    GET  /api/tasks/:id/subtasks');
  console.log('    GET  /api/tasks/:id/stories');
  console.log('    POST /api/tasks/:id/stories');
  console.log('    GET  /api/tasks/:id/attachments');
  console.log('    POST /api/tasks/:id/time');
  console.log('  👥 TEAMS & TAGS:');
  console.log('    GET  /api/teams');
  console.log('    GET  /api/teams/:id/members');
  console.log('    GET  /api/tags');
  console.log('    POST /api/tags');
  console.log('  🎨 THEMES:');
  console.log('    GET  /api/themes');
  console.log('    POST /api/themes');
  console.log('    PUT  /api/themes/:id');
  console.log('    DEL  /api/themes/:id');
  console.log('  🔔 NOTIFICATIONS:');
  console.log('    GET  /api/notifications');
  console.log('    POST /api/notifications');
  console.log('    PUT  /api/notifications/:id/read');
  console.log('    DEL  /api/notifications/:id');
  console.log('  🤖 AI & ANALYTICS:');
  console.log('    GET  /api/ai/insights');
  console.log('    GET  /api/analytics/dashboard');
  console.log('  📊 ACTIVITY & SEARCH:');
  console.log('    GET  /api/activity');
  console.log('    GET  /api/search');
  console.log('  🔗 WEBHOOKS:');
  console.log('    GET  /api/webhooks');
  console.log('    POST /api/webhooks');
  console.log('  💊 HEALTH:');
  console.log('    GET  /api/health');
});