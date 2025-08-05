# Replace your server.js with the enhanced debug version
cat > server.js << 'EOF'
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

// User and workspace endpoints
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

// Get projects
app.get('/api/projects', async (req, res) => {
  try {
    const { workspace } = req.query;
    const endpoint = `/projects?workspace=${workspace}&opt_fields=name,color,created_at,modified_at,owner.name,archived,notes`;
    const data = await makeAsanaRequest(endpoint);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE PROJECT - The problematic endpoint
app.post('/api/projects', async (req, res) => {
  try {
    console.log('🎯 CREATE PROJECT REQUEST RECEIVED');
    console.log('📥 Full request body:', JSON.stringify(req.body, null, 2));

    const { name, notes, color, workspace } = req.body;

    if (!name) {
      console.log('❌ Missing project name');
      return res.status(400).json({ error: 'Project name is required' });
    }

    if (!workspace) {
      console.log('❌ Missing workspace');
      return res.status(400).json({ error: 'Workspace is required' });
    }

    // Create minimal project data (start simple)
    const projectData = {
      name: name.trim(),
      workspace: workspace
    };

    // Add notes if provided
    if (notes && notes.trim()) {
      projectData.notes = notes.trim();
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

// Get tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const { project } = req.query;
    const endpoint = `/tasks?project=${project}&opt_fields=name,completed,assignee.name,due_date,created_at,notes`;
    const data = await makeAsanaRequest(endpoint);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle task completion
app.put('/api/tasks/:taskId/toggle', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { completed } = req.body;
    const data = await makeAsanaRequest(`/tasks/${taskId}`, 'PUT', { completed });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get workspace users
app.get('/api/workspaces/:workspaceId/users', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const data = await makeAsanaRequest(`/workspaces/${workspaceId}/users?opt_fields=name,email`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log('🚀 Debug Server Started!');
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`🔑 Token: ${process.env.VITE_ASANA_TOKEN ? 'Present' : 'Missing'}`);
  console.log('🐛 Debug mode: ON');
});
EOF
// ========== TASK ENDPOINTS ==========

// Create task
app.post('/api/tasks', async (req, res) => {
  try {
    console.log('🎯 CREATE TASK REQUEST');
    console.log('📥 Request body:', JSON.stringify(req.body, null, 2));
    
    const { name, notes, due_date, assignee, projects } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Task name is required' });
    }
    if (!projects) {
      return res.status(400).json({ error: 'Project is required' });
    }
    
    const taskData = {
      name: name.trim(),
      projects: [projects] // Asana expects an array
    };
    
    // Add optional fields with proper formatting
    if (notes && notes.trim()) {
      taskData.notes = notes.trim();
    }
    
    if (due_date && due_date.trim()) {
      // Asana expects YYYY-MM-DD format
      taskData.due_date = due_date.trim();
      console.log('📅 Setting due date:', taskData.due_date);
    }
    
    if (assignee && assignee.trim()) {
      taskData.assignee = assignee.trim();
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
    
    const { name, notes, due_date, completed, assignee } = req.body;
    
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (notes !== undefined) updateData.notes = notes;
    if (completed !== undefined) updateData.completed = completed;
    
    // Handle due date with proper formatting
    if (due_date !== undefined) {
      if (due_date && due_date.trim()) {
        // Ensure YYYY-MM-DD format
        updateData.due_date = due_date.trim();
        console.log('📅 Updating due date to:', updateData.due_date);
      } else {
        // Clear due date if empty string
        updateData.due_date = null;
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

