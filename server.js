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
    const data = await makeAsanaRequest(`/workspaces/${workspaceId}/users?opt_fields=name,email`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== PROJECT ENDPOINTS ==========

// Get projects
app.get('/api/projects', async (req, res) => {
  try {
    const { workspace, opt_fields } = req.query;
    let endpoint = `/projects?workspace=${workspace}`;

    if (opt_fields) {
      endpoint += `&opt_fields=${opt_fields}`;
    } else {
      endpoint += `&opt_fields=name,color,created_at,modified_at,owner.name,archived,notes,public`;
    }

    console.log('📁 Getting projects with endpoint:', endpoint);
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

    const { name, notes, color, workspace, public: isPublic, archived } = req.body;

    if (!name) {
      console.log('❌ Missing project name');
      return res.status(400).json({ error: 'Project name is required' });
    }

    if (!workspace) {
      console.log('❌ Missing workspace');
      return res.status(400).json({ error: 'Workspace is required' });
    }

    // Create project data
    const projectData = {
      name: name.trim(),
      workspace: workspace
    };

    // Add optional fields
    if (notes && notes.trim()) {
      projectData.notes = notes.trim();
    }

    if (color) {
      projectData.color = color;
    }

    if (isPublic !== undefined) {
      projectData.public = isPublic;
    }

    if (archived !== undefined) {
      projectData.archived = archived;
    }

    console.log('📤 Sending to Asana:', JSON.stringify(projectData, null, 2));

    const data = await makeAsanaRequest('/projects', 'POST', projectData);

    console.log('✅ SUCCESS! Project created');
    res.json(data);

  } catch (error) {
    console.error('❌ CREATE PROJECT ERROR:', error.message);
    console.error('❌ Full error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update project
app.put('/api/projects/:projectId', async (req, res) => {
  try {
    console.log('🎯 UPDATE PROJECT REQUEST');
    const { projectId } = req.params;
    console.log('📝 Project ID:', projectId);
    console.log('📥 Request body:', JSON.stringify(req.body, null, 2));

    const { name, notes, color, public: isPublic, archived } = req.body;

    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (notes !== undefined) updateData.notes = notes;
    if (color !== undefined) updateData.color = color;
    if (isPublic !== undefined) updateData.public = isPublic;
    if (archived !== undefined) updateData.archived = archived;

    console.log('📤 Update data to Asana:', JSON.stringify(updateData, null, 2));

    const data = await makeAsanaRequest(`/projects/${projectId}`, 'PUT', updateData);

    console.log('✅ Project updated successfully!');
    res.json(data);

  } catch (error) {
    console.error('❌ Update project error:', error.message);
    console.error('❌ Full error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete project
app.delete('/api/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    console.log('🗑️ Deleting project:', projectId);

    const data = await makeAsanaRequest(`/projects/${projectId}`, 'DELETE');

    console.log('✅ Project deleted successfully!');
    res.json(data);
  } catch (error) {
    console.error('❌ Delete project error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ========== TASK ENDPOINTS ==========

// Get tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const { project, opt_fields } = req.query;
    let endpoint = `/tasks?project=${project}`;

    if (opt_fields) {
      endpoint += `&opt_fields=${opt_fields}`;
    } else {
      endpoint += `&opt_fields=name,completed,assignee.name,due_on,due_at,created_at,modified_at,notes,priority,tags`;
    }

    console.log('📋 Getting tasks with endpoint:', endpoint);
    const data = await makeAsanaRequest(endpoint);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create task
app.post('/api/tasks', async (req, res) => {
  try {
    console.log('🎯 CREATE TASK REQUEST');
    console.log('📥 Request body:', JSON.stringify(req.body, null, 2));

    const { name, notes, due_on, assignee, projects, priority } = req.body;

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

    // Add optional fields
    if (notes && notes.trim()) {
      taskData.notes = notes.trim();
    }

    if (due_on && due_on.trim()) {
      taskData.due_on = due_on.trim();
      console.log('📅 Setting due date:', taskData.due_on);
    }

    if (assignee && assignee.trim()) {
      taskData.assignee = assignee.trim();
    }

    if (priority) {
      taskData.priority = priority;
    }

    console.log('📤 Task data to Asana:', JSON.stringify(taskData, null, 2));

    const data = await makeAsanaRequest('/tasks', 'POST', taskData);

    console.log('✅ Task created successfully!');
    res.json(data);

  } catch (error) {
    console.error('❌ Create task error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Update task
app.put('/api/tasks/:taskId', async (req, res) => {
  try {
    console.log('🎯 UPDATE TASK REQUEST');
    const { taskId } = req.params;
    console.log('📝 Task ID:', taskId);
    console.log('📥 Request body:', JSON.stringify(req.body, null, 2));

    const { name, notes, due_on, completed, assignee, priority } = req.body;

    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (notes !== undefined) updateData.notes = notes;
    if (completed !== undefined) updateData.completed = completed;
    if (priority !== undefined) updateData.priority = priority;

    // Handle due date
    if (due_on !== undefined) {
      if (due_on && due_on.trim()) {
        updateData.due_on = due_on.trim();
        console.log('📅 Updating due date to:', updateData.due_on);
      } else {
        updateData.due_on = null;
        console.log('📅 Clearing due date');
      }
    }

    if (assignee !== undefined) {
      updateData.assignee = assignee || null;
    }

    console.log('📤 Update data to Asana:', JSON.stringify(updateData, null, 2));

    const data = await makeAsanaRequest(`/tasks/${taskId}`, 'PUT', updateData);

    console.log('✅ Task updated successfully!');
    res.json(data);

  } catch (error) {
    console.error('❌ Update task error:', error.message);
    console.error('❌ Full error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete task
app.delete('/api/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    console.log('🗑️ Deleting task:', taskId);

    const data = await makeAsanaRequest(`/tasks/${taskId}`, 'DELETE');

    console.log('✅ Task deleted successfully!');
    res.json(data);
  } catch (error) {
    console.error('❌ Delete task error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Toggle task completion (separate endpoint for convenience)
app.put('/api/tasks/:taskId/toggle', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { completed } = req.body;

    console.log(`🔄 Toggling task ${taskId} to ${completed ? 'completed' : 'incomplete'}`);

    const data = await makeAsanaRequest(`/tasks/${taskId}`, 'PUT', { completed });

    console.log('✅ Task completion toggled!');
    res.json(data);
  } catch (error) {
    console.error('❌ Toggle task error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ========== SERVER STARTUP ==========

app.listen(PORT, () => {
  console.log('🚀 Enhanced Debug Server Started!');
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`🔑 Token: ${process.env.VITE_ASANA_TOKEN ? 'Present ✅' : 'Missing ❌'}`);
  console.log('🐛 Debug mode: ON');
  console.log('📋 Available endpoints:');
  console.log('  GET  /api/users/me');
  console.log('  GET  /api/workspaces');
  console.log('  GET  /api/workspaces/:id/users');
  console.log('  GET  /api/projects');
  console.log('  POST /api/projects');
  console.log('  PUT  /api/projects/:id');
  console.log('  DEL  /api/projects/:id');
  console.log('  GET  /api/tasks');
  console.log('  POST /api/tasks');
  console.log('  PUT  /api/tasks/:id');
  console.log('  DEL  /api/tasks/:id');
  console.log('  PUT  /api/tasks/:id/toggle');
});