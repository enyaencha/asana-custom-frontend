# Custom Asana Frontend

A custom frontend interface that connects to Asana's API, giving you full control over the user experience while leveraging Asana's powerful backend.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- An Asana account
- Personal Access Token from Asana

### 1. Get Your Asana API Token

1. Log into your Asana account
2. Go to **Profile Settings** → **Apps** → **Developer Console**
3. Click "Create New Personal Access Token"
4. Copy the generated token (keep it secure!)

### 2. Clone and Setup

```bash
# Create project directory
mkdir asana-custom-frontend
cd asana-custom-frontend

# Initialize project
npm init -y

# Install dependencies
npm install react react-dom axios react-router-dom lucide-react @tanstack/react-query tailwindcss
npm install -D @vitejs/plugin-react vite autoprefixer postcss
```

### 3. Environment Configuration

1. Create `.env` file in root directory
2. Add your token:
```env
VITE_ASANA_TOKEN=your_personal_access_token_here
VITE_APP_NAME=Custom Asana Frontend
```

### 4. Run the Application

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
asana-custom-frontend/
├── src/
│   ├── components/          # React components
│   │   ├── Sidebar.jsx
│   │   ├── Dashboard.jsx
│   │   ├── ProjectBoard.jsx
│   │   ├── TaskList.jsx
│   │   └── TaskCard.jsx
│   ├── services/           # API services
│   │   └── asanaApi.js
│   ├── hooks/              # Custom React hooks
│   │   └── useAsanaData.js
│   ├── utils/              # Utility functions
│   └── App.jsx             # Main app component
├── public/                 # Static assets
├── .env                    # Environment variables
└── package.json
```

## 🔧 Key Features

### API Integration
- **Complete Asana API wrapper** with all major endpoints
- **Automatic error handling** and response parsing
- **Request/response interceptors** for consistent data flow
- **Rate limiting awareness** built-in

### React Query Integration
- **Intelligent caching** with configurable stale times
- **Optimistic updates** for better UX
- **Background refetching** to keep data fresh
- **Mutation handling** for CRUD operations

### Custom Components
- **Project boards** with drag-and-drop (can be added)
- **Task management** with real-time updates
- **User management** and team collaboration
- **Search functionality** across all data

## 🛠️ Available API Methods

### Projects
```javascript
import { useProjects, useCreateProject } from './hooks/useAsanaData';

// Get all projects
const { data: projects, isLoading } = useProjects(workspaceId);

// Create new project
const createProject = useCreateProject();
createProject.mutate({
  name: "New Project",
  workspace: workspaceId
});
```

### Tasks
```javascript
import { useTasks, useCreateTask, useUpdateTask } from './hooks/useAsanaData';

// Get tasks for a project
const { data: tasks } = useTasks(projectId);

// Create new task
const createTask = useCreateTask();
createTask.mutate({
  name: "New Task",
  projects: [projectId]
});

// Update task
const updateTask = useUpdateTask();
updateTask.mutate({
  taskId: "task_id",
  data: { completed: true }
});
```

## 🎨 Customization Options

### UI Themes
- Easy to customize with Tailwind CSS
- Component-based architecture for easy modification
- Responsive design out of the box

### Data Views
- List view, board view, calendar view
- Custom filters and sorting
- Bulk operations support

### Workflow Automation
- Custom task templates
- Automated status updates
- Integration webhooks (can be added)

## 🔒 Security Considerations

### API Token Security
- Store tokens in environment variables only
- Never commit tokens to version control
- Use different tokens for different environments

### CORS and API Limits
- Asana API has rate limits (150 requests/minute)
- Consider implementing request queuing for heavy usage
- Use caching to minimize API calls

## 🚀 Deployment Options

### Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```

### Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

### Self-hosted
```bash
npm run build
# Serve dist/ folder with any web server
```

## 📈 Performance Tips

1. **Use React Query caching** effectively
2. **Implement pagination** for large datasets
3. **Lazy load components** for better initial load
4. **Optimize API calls** with proper dependency arrays
5. **Use React.memo** for expensive components

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - feel free to use this in your own projects!

## 🆘 Troubleshooting

### Common Issues

**"Unauthorized" errors:**
- Check your API token is correct
- Ensure token has proper permissions

**CORS errors:**
- Asana API should allow CORS, but check your browser console
- Consider using a proxy for development

**Rate limiting:**
- Implement exponential backoff
- Use caching to reduce API calls
- Consider upgrading your Asana plan

### Getting Help

- Check the [Asana API documentation](https://developers.asana.com/docs)
- Review browser developer tools for network errors
- Check React Query DevTools for cache issues