// This script prepares files for Netlify deployment
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');

// Ensure netlify/functions directory exists
const netlifyFunctionsDir = path.join(rootDir, 'netlify', 'functions');
if (!fs.existsSync(netlifyFunctionsDir)) {
  fs.mkdirSync(netlifyFunctionsDir, { recursive: true });
}

// Update the server.js file in netlify/functions to use CommonJS syntax with comprehensive API endpoints
const serverJsPath = path.join(netlifyFunctionsDir, 'server.js');
const serverJsContent = `// Use CommonJS syntax for Netlify functions
const serverless = require('serverless-http');
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

// Initialize environment variables
dotenv.config();

// Sample data for API responses
const sampleProjects = [
  {
    id: 1,
    name: 'E-Commerce Platform',
    description: 'Building a modern e-commerce platform with React and Node.js',
    status: 'In Progress',
    progress: 65,
    current_phase: 'Development',
    start_date: '2025-01-15',
    end_date: '2025-05-30',
    pm_name: 'John Smith',
    dl_name: 'Sarah Johnson',
    ba_name: 'Michael Brown',
    tl_name: 'Emily Davis',
    ui_lead_name: 'David Wilson',
    db_lead_name: 'Lisa Anderson',
    qa_lead_name: 'Robert Taylor',
    email: 'project1@example.com'
  },
  {
    id: 2,
    name: 'Mobile Banking App',
    description: 'Developing a secure mobile banking application',
    status: 'Planning',
    progress: 25,
    current_phase: 'Requirement Gathering',
    start_date: '2025-03-01',
    end_date: '2025-08-15',
    pm_name: 'Jennifer Lee',
    dl_name: 'Thomas White',
    ba_name: 'Jessica Martin',
    tl_name: 'Daniel Clark',
    ui_lead_name: 'Amanda Lewis',
    db_lead_name: 'Kevin Harris',
    qa_lead_name: 'Michelle Walker',
    email: 'project2@example.com'
  },
  {
    id: 3,
    name: 'Healthcare Management System',
    description: 'Creating a comprehensive healthcare management system',
    status: 'Active',
    progress: 40,
    current_phase: 'Design',
    start_date: '2025-02-10',
    end_date: '2025-07-20',
    pm_name: 'Christopher Allen',
    dl_name: 'Stephanie Young',
    ba_name: 'Matthew King',
    tl_name: 'Laura Scott',
    ui_lead_name: 'Brian Green',
    db_lead_name: 'Nicole Baker',
    qa_lead_name: 'Steven Hall',
    email: 'project3@example.com'
  }
];

const sampleMilestones = [
  { id: 1, project_id: 1, name: 'Requirements Phase', status: 'Completed', start_date: '2025-01-15', end_date: '2025-02-15' },
  { id: 2, project_id: 1, name: 'Design Phase', status: 'Completed', start_date: '2025-02-16', end_date: '2025-03-15' },
  { id: 3, project_id: 1, name: 'Development Phase', status: 'In Progress', start_date: '2025-03-16', end_date: '2025-04-30' },
  { id: 4, project_id: 1, name: 'Testing Phase', status: 'Not Started', start_date: '2025-05-01', end_date: '2025-05-20' },
  { id: 5, project_id: 1, name: 'Deployment Phase', status: 'Not Started', start_date: '2025-05-21', end_date: '2025-05-30' },
  { id: 6, project_id: 2, name: 'Requirements Phase', status: 'In Progress', start_date: '2025-03-01', end_date: '2025-04-15' },
  { id: 7, project_id: 3, name: 'Requirements Phase', status: 'Completed', start_date: '2025-02-10', end_date: '2025-03-10' },
  { id: 8, project_id: 3, name: 'Design Phase', status: 'In Progress', start_date: '2025-03-11', end_date: '2025-04-20' }
];

// Create Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS headers for API access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
    return res.status(200).json({});
  }
  next();
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Projects API
app.get('/api/projects', (req, res) => {
  res.json(sampleProjects);
});

app.get('/api/projects/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const project = sampleProjects.find(p => p.id === id);
  
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }
  
  res.json(project);
});

app.post('/api/projects', (req, res) => {
  const newProject = {
    id: sampleProjects.length + 1,
    ...req.body,
    created_at: new Date().toISOString()
  };
  
  sampleProjects.push(newProject);
  res.status(201).json(newProject);
});

// Milestones API
app.get('/api/projects/:projectId/milestones', (req, res) => {
  const projectId = parseInt(req.params.projectId);
  const projectMilestones = sampleMilestones.filter(m => m.project_id === projectId);
  res.json(projectMilestones);
});

// Chat API
app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  
  // Simple AI response simulation
  const responses = [
    'I understand your concern. Let me help you with that.',
    'Based on the project timeline, we should be able to complete that by next week.',
    'I recommend scheduling a meeting with the team to discuss this further.',
    'The project is currently on track. No major issues have been reported.',
    'I have analyzed the data and everything looks good so far.'
  ];
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  res.json({
    role: 'assistant',
    content: randomResponse,
    created_at: new Date().toISOString()
  });
});

// Reports API
app.get('/api/reports', (req, res) => {
  res.json([
    { id: 1, title: 'Weekly Progress Report', date: '2025-04-15', type: 'progress' },
    { id: 2, title: 'Monthly Status Report', date: '2025-04-01', type: 'status' },
    { id: 3, title: 'Risk Assessment Report', date: '2025-03-20', type: 'risk' }
  ]);
});

// AI endpoints
app.post('/api/ai/quick-update', (req, res) => {
  res.json({
    success: true,
    data: {
      processed: true,
      message: 'Update processed successfully',
      results: {
        status: 'Updated',
        progress: 75,
        phase: 'Implementation'
      }
    }
  });
});

app.post('/api/ai/parse-task', (req, res) => {
  res.json({
    success: true,
    data: {
      task: 'Implement new feature',
      assignee: 'John Doe',
      dueDate: '2025-05-15',
      priority: 'High'
    }
  });
});

// Catch-all route for SPA
app.all('*', (req, res) => {
  res.json({ message: 'Route not found. This is a serverless function that only handles API routes.' });
});

// Error handling middleware
app.use((err, _req, res, _next) => {
  console.error('Server error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ message });
});

// Export the serverless handler
exports.handler = serverless(app, {
  binary: ['image/*', 'application/pdf']
});`;

fs.writeFileSync(serverJsPath, serverJsContent);
console.log('✅ Created Netlify function file with comprehensive API endpoints');

// Create a package.json file for the Netlify function
const functionPackageJsonPath = path.join(netlifyFunctionsDir, 'package.json');
const functionPackageJsonContent = JSON.stringify({
  "name": "netlify-functions",
  "version": "1.0.0",
  "description": "Netlify Functions for ProjectPilotAI",
  "dependencies": {
    "express": "^4.21.2",
    "serverless-http": "^3.2.0",
    "dotenv": "^16.5.0",
    "cors": "^2.8.5"
  }
}, null, 2);

fs.writeFileSync(functionPackageJsonPath, functionPackageJsonContent);
console.log('✅ Created package.json for Netlify function');

// Ensure the netlify.toml file is correctly configured
const netlifyTomlPath = path.join(rootDir, 'netlify.toml');
const netlifyTomlContent = `[build]
  command = "npm run build"
  publish = "dist/public"
  functions = "netlify/functions"
  ignore = "git diff --quiet $CACHED_COMMIT_REF $COMMIT_REF ./"

[dev]
  command = "npm run dev"
  port = 8888

[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/server"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
    [headers.values]
    Access-Control-Allow-Origin = "*"
    Access-Control-Allow-Methods = "GET, POST, PUT, DELETE, OPTIONS"
    Access-Control-Allow-Headers = "Origin, X-Requested-With, Content-Type, Accept, Authorization"
`;

fs.writeFileSync(netlifyTomlPath, netlifyTomlContent);
console.log('✅ Updated netlify.toml configuration with CORS headers');

// Build the frontend with Vite if it hasn't been built yet
if (!fs.existsSync(path.join(rootDir, 'dist', 'public'))) {
  console.log('Building frontend with Vite...');
  try {
    execSync('npx vite build', { stdio: 'inherit', cwd: rootDir });
    console.log('✅ Frontend built successfully');
  } catch (error) {
    console.error('❌ Error building frontend:', error);
  }
}

console.log('✅ Netlify deployment preparation complete');
