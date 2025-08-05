# 🚀 Enhanced Asana Dashboard - Complete Codebase Documentation

## 📁 Project Structure Overview

```
asana-custom-frontend/
├── src/
│   ├── App.jsx                    # Main application entry point
│   ├── services/
│   │   └── api.js                 # API communication layer
│   ├── context/
│   │   └── AsanaContext.js        # Global state management
│   ├── components/
│   │   ├── Modal.jsx              # Reusable modal component
│   │   ├── ProjectForm.jsx        # Project creation/editing form
│   │   ├── ProjectCard.jsx        # Individual project display
│   │   ├── TaskForm.jsx           # Task creation/editing form
│   │   ├── TaskItem.jsx           # Individual task display
│   │   ├── Dashboard.jsx          # Dashboard overview page
│   │   └── Navigation.jsx         # Sidebar navigation
│   └── [other existing files]
├── server.js                      # Backend API server
└── [config files]
```

---

## 🔧 Core Services & Infrastructure

### 📡 `services/api.js` - API Communication Layer

**Purpose**: Centralizes all HTTP requests to your backend server

**Key Functions**:
- `api.get(url)` - GET requests (fetch data)
- `api.post(url, data)` - POST requests (create new items)
- `api.put(url, data)` - PUT requests (update existing items)
- `api.delete(url)` - DELETE requests (remove items)

**What it handles**:
- ✅ Error handling with detailed messages
- ✅ Request/response logging for debugging
- ✅ Consistent base URL management
- ✅ JSON parsing and error extraction

**When to edit**:
- Change server URL (currently `localhost:3001`)
- Add authentication headers
- Modify error handling logic
- Add request interceptors

**Example usage**:
```javascript
// Get all projects
const projects = await api.get('/projects?workspace=123');

// Create new project
const newProject = await api.post('/projects', {
  name: 'My Project',
  workspace: '123'
});
```

---

### 🌐 `context/AsanaContext.js` - Global State Management

**Purpose**: Manages all application state and provides data/actions to components

**State Variables**:
- `user` - Current user information
- `workspaces` - Available Asana workspaces
- `projects` - All projects in current workspace
- `tasks` - Tasks for currently selected project
- `workspaceUsers` - Team members for assignments
- `selectedProject` - Currently viewing project
- `loading` - Loading state for UI feedback
- `error` - Error messages for user display
- `serverStatus` - Connection status to backend

**Key Functions**:

#### 🔄 Data Loading:
- `loadUserData()` - Initial data fetch (user, workspaces, projects)
- `loadProjectTasks(project)` - Load tasks for specific project
- `checkServerConnection()` - Verify backend is running

#### ➕ Create Operations:
- `createProject(projectData)` - Add new project
- `createTask(taskData)` - Add new task

#### ✏️ Update Operations:
- `updateProject(projectId, data)` - Modify existing project
- `updateTask(taskId, data)` - Modify existing task
- `toggleTaskComplete(task)` - Mark task complete/incomplete

#### 🗑️ Delete Operations:
- `deleteProject(project)` - Remove project
- `deleteTask(task)` - Remove task

**When to edit**:
- Add new data fields to state
- Implement caching logic
- Add new CRUD operations
- Modify error handling
- Add real-time updates

**Connection to Components**:
```javascript
// Any component can access global state
const { projects, loading, createProject } = useAsana();
```

---

## 🎨 UI Components

### 🪟 `components/Modal.jsx` - Reusable Modal Component

**Purpose**: Generic popup overlay for forms and dialogs

**Props**:
- `isOpen` (boolean) - Controls visibility
- `onClose` (function) - Close handler
- `title` (string) - Modal header text
- `children` (ReactNode) - Modal content

**Features**:
- ✅ Overlay background with click-to-close
- ✅ Escape key handling
- ✅ Scrollable content area
- ✅ Responsive sizing

**When to edit**:
- Change modal sizing or positioning
- Add animations or transitions
- Modify close behavior
- Add different modal variants

**Usage Example**:
```javascript
<Modal 
  isOpen={showModal} 
  onClose={() => setShowModal(false)}
  title="Create Project"
>
  <ProjectForm onSave={handleSave} />
</Modal>
```

---

### 📝 `components/ProjectForm.jsx` - Project Creation/Editing Form

**Purpose**: Handles creating new projects and editing existing ones

**Form Fields**:
- `name` - Project name (required)
- `notes` - Project description
- `color` - Visual color theme (16 Asana colors)
- `isPublic` - Team visibility setting
- `archived` - Archive status (edit only)

**Key Features**:
- ✅ Real Asana color picker with visual swatches
- ✅ Form validation (required fields)
- ✅ Loading states during save
- ✅ Archive/unarchive toggle for existing projects
- ✅ Error handling with user feedback

**Color System**:
Uses authentic Asana colors:
- `dark-blue`, `light-blue`
- `dark-green`, `light-green`
- `dark-red`, `light-red`
- And 10 more variants

**When to edit**:
- Add new form fields
- Modify validation rules
- Change color options
- Add custom styling
- Implement auto-save

**State Management**:
```javascript
const [name, setName] = useState(project?.name || '');
const [loading, setLoading] = useState(false);
```

---

### 🎴 `components/ProjectCard.jsx` - Individual Project Display

**Purpose**: Shows project information in card layout

**Visual Elements**:
- **Color-coded left border** using project color
- **Archive badge** for archived projects
- **Task count** display
- **Creation date** formatting
- **Public/Private indicators**
- **Action buttons** (edit/delete)

**Interactive Features**:
- ✅ Click to view project tasks
- ✅ Edit button opens project form
- ✅ Delete with confirmation dialog
- ✅ Visual states for archived projects

**Styling Logic**:
```javascript
// Color mapping for borders and indicators
const getProjectColor = (colorName) => {
  const colorMap = {
    'dark-blue': '#4169e1',
    'dark-green': '#00c875',
    // ... more colors
  };
  return colorMap[colorName] || '#4169e1';
};
```

**When to edit**:
- Add new project metadata
- Modify card layout or styling
- Add new action buttons
- Change hover effects
- Implement drag-and-drop

---

### 📋 `components/TaskForm.jsx` - Task Creation/Editing Form

**Purpose**: Handles creating and editing tasks within projects

**Form Fields**:
- `name` - Task title (required)
- `notes` - Task description
- `assignee` - Team member assignment
- `dueDate` - Due date picker
- `priority` - Task priority level

**Assignment System**:
- Dropdown populated from `workspaceUsers`
- Supports unassigned tasks
- Real team member names from Asana

**When to edit**:
- Add custom fields (priority, tags, etc.)
- Implement recurring tasks
- Add time tracking
- Modify date picker behavior
- Add file attachments

---

### ✅ `components/TaskItem.jsx` - Individual Task Display

**Purpose**: Shows individual task in list view with actions

**Visual Features**:
- **Checkbox** for completion toggle
- **Strikethrough** for completed tasks
- **Overdue highlighting** in red
- **Priority badges** (High/Low)
- **Assignee avatars** and names
- **Due date** with overdue warnings

**Interactive Elements**:
- ✅ Click checkbox to toggle completion
- ✅ Edit button opens task form
- ✅ Delete with confirmation
- ✅ Visual feedback for all states

**Smart Date Handling**:
```javascript
// Overdue detection
const isOverdue = new Date(task.due_on) < new Date() && !task.completed;
```

**When to edit**:
- Add subtasks display
- Implement time tracking
- Add task comments
- Modify priority system
- Add task dependencies

---

### 📊 `components/Dashboard.jsx` - Dashboard Overview Page

**Purpose**: Main landing page showing project and task statistics

**Statistics Cards**:
- **Workspaces** count
- **Projects** total
- **Pending tasks** count
- **Completed tasks** count

**Recent Projects Section**:
- Shows last 6 projects
- Quick access to project tasks
- Create new project button

**When to edit**:
- Add new metrics or charts
- Implement data filtering
- Add recent activity feed
- Create custom widgets
- Add export functionality

---

### 🧭 `components/Navigation.jsx` - Sidebar Navigation

**Purpose**: App navigation with dynamic menu items

**Navigation Items**:
- **Dashboard** - Always visible
- **Projects** - Shows project count
- **Tasks** - Only visible when tasks loaded

**Dynamic Behavior**:
- Task count badges
- Active state highlighting
- Conditional menu items

**When to edit**:
- Add new navigation sections
- Implement user preferences
- Add search functionality
- Create nested menus
- Add keyboard shortcuts

---

## 🏗️ Main Application

### 🎯 `App.jsx` - Main Application Component

**Purpose**: Root component that orchestrates the entire application

**Component Structure**:

#### 1. **Connection Management**:
```javascript
const ConnectionStatus = () => {
  // Handles server connection states
  // Shows loading/error/retry screens
};
```

#### 2. **Main Dashboard App**:
```javascript
const DashboardApp = () => {
  // Core application logic
  // View routing and state management
  // Modal handling
};
```

#### 3. **Provider Wrapper**:
```javascript
function App() {
  return (
    <AsanaProvider>
      <DashboardApp />
    </AsanaProvider>
  );
}
```

**View Management**:
- `currentView` state controls what page shows
- Routes: 'dashboard', 'projects', 'tasks'
- No external router needed

**Modal Management**:
- `showProjectModal` - Project creation/editing
- `showTaskModal` - Task creation/editing
- `editingProject/editingTask` - Form data

**When to edit**:
- Add new views/pages
- Implement routing library
- Add global error boundaries
- Create layout components
- Add theme switching

---

## 🖥️ Backend Server

### 🌐 `server.js` - Backend API Server

**Purpose**: Proxy server between frontend and Asana API

**Key Features**:
- **CORS handling** for cross-origin requests
- **Authentication** with Asana API token
- **Request logging** with emoji indicators
- **Error handling** and debugging
- **All CRUD operations** for projects and tasks

**API Endpoints**:

#### User & Workspace:
- `GET /api/users/me` - Current user info
- `GET /api/workspaces` - Available workspaces
- `GET /api/workspaces/:id/users` - Team members

#### Projects:
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

#### Tasks:
- `GET /api/tasks` - List tasks for project
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

**Environment Variables**:
- `VITE_ASANA_TOKEN` - Your Asana API token

**When to edit**:
- Add new Asana API endpoints
- Implement caching
- Add rate limiting
- Improve error handling
- Add authentication middleware

---

## 🔄 Data Flow Architecture

### How Data Moves Through the App:

1. **Initial Load**:
   ```
   App.jsx → AsanaContext → api.js → server.js → Asana API
   ```

2. **User Actions**:
   ```
   Component → useAsana hook → Context function → API call → Update state
   ```

3. **State Updates**:
   ```
   Context state change → All subscribed components re-render
   ```

---

## 🛠️ Common Customization Tasks

### Adding New Project Fields:

1. **Update API** (`server.js`):
   ```javascript
   // Add field to opt_fields parameter
   &opt_fields=name,notes,color,archived,your_new_field
   ```

2. **Update Context** (`AsanaContext.js`):
   ```javascript
   // No changes needed - data flows through automatically
   ```

3. **Update Form** (`ProjectForm.jsx`):
   ```javascript
   const [newField, setNewField] = useState(project?.new_field || '');
   ```

4. **Update Display** (`ProjectCard.jsx`):
   ```javascript
   {project.new_field && (
     <div>New Field: {project.new_field}</div>
   )}
   ```

### Adding New Views:

1. **Add to Navigation** (`Navigation.jsx`):
   ```javascript
   { key: 'newview', icon: '🆕', label: 'New View' }
   ```

2. **Add Route Handler** (`App.jsx`):
   ```javascript
   case 'newview':
     return <NewViewComponent />;
   ```

### Styling Customizations:

- **Colors**: Modify color maps in `ProjectCard.jsx`
- **Layout**: Adjust CSS-in-JS styles in components
- **Themes**: Add theme context for consistent styling

---

## 🐛 Debugging Guide

### Common Issues:

1. **Server Connection**: Check console for connection logs
2. **API Errors**: Look for 🔗 and 📥 emoji logs in server
3. **State Issues**: Add console.logs in Context functions
4. **UI Problems**: Check component props and state

### Debug Tools:

- **Browser DevTools**: Network tab for API calls
- **Server Console**: Detailed request/response logs
- **React DevTools**: Component state inspection

---

## 🚀 Future Enhancement Ideas

### Short Term:
- Add task search and filtering
- Implement drag-and-drop task reordering
- Add keyboard shortcuts
- Create task templates

### Medium Term:
- Real-time updates with WebSockets
- Offline mode with local storage
- Advanced reporting and analytics
- Team collaboration features

### Long Term:
- Mobile app version
- Integration with other tools
- Custom workflows
- AI-powered task suggestions

---

This documentation provides a complete understanding of every part of your Asana dashboard. Each section explains not just what the code does, but why it's structured that way and how to modify it for your needs
