#!/bin/bash

# Create the src directory structure
mkdir -p src/{config,controllers,services,utils,database,middleware,routes}

# Create config files
touch src/config/database.js
touch src/config/server.js

# Create controller files
touch src/controllers/workspaceController.js
touch src/controllers/projectController.js
touch src/controllers/taskController.js
touch src/controllers/syncController.js
touch src/controllers/settingsController.js

# Create service files
touch src/services/syncService.js
touch src/services/asanaApiService.js

# Create utility files
touch src/utils/jsonUtils.js
touch src/utils/validators.js

# Create database schema file
touch src/database/schema.js

# Create middleware files
touch src/middleware/errorHandler.js

# Create route files
touch src/routes/index.js
touch src/routes/workspaces.js
touch src/routes/projects.js
touch src/routes/tasks.js
touch src/routes/sync.js
touch src/routes/settings.js

echo "✅ All missing directories and files have been created!"
echo ""
echo "📁 Created structure:"
echo "src/"
echo "├── config/"
echo "│   ├── database.js"
echo "│   └── server.js"
echo "├── controllers/"
echo "│   ├── workspaceController.js"
echo "│   ├── projectController.js"
echo "│   ├── taskController.js"
echo "│   ├── syncController.js"
echo "│   └── settingsController.js"
echo "├── services/"
echo "│   ├── syncService.js"
echo "│   └── asanaApiService.js"
echo "├── utils/"
echo "│   ├── jsonUtils.js"
echo "│   └── validators.js"
echo "├── database/"
echo "│   └── schema.js"
echo "├── middleware/"
echo "│   └── errorHandler.js"
echo "└── routes/"
echo "    ├── index.js"
echo "    ├── workspaces.js"
echo "    ├── projects.js"
echo "    ├── tasks.js"
echo "    ├── sync.js"
echo "    └── settings.js"
