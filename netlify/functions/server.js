// Use CommonJS syntax for Netlify functions
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
    email: 'project1@example.com',
    issues: [] // Initialize issues array
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
    email: 'project2@example.com',
    issues: [] // Initialize issues array
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
    email: 'project3@example.com',
    issues: [] // Initialize issues array
  },
  {
    id: 4,
    name: 'Zephyr Migration',
    description: 'Migration of legacy systems to the Zephyr platform',
    status: 'Active',
    progress: 30,
    current_phase: 'Planning',
    start_date: '2025-03-15',
    end_date: '2025-08-30',
    pm_name: 'Pratik M',
    dl_name: 'Alex Johnson',
    ba_name: 'Sophia Chen',
    tl_name: 'David Miller',
    ui_lead_name: 'Emma Wilson',
    db_lead_name: 'James Taylor',
    qa_lead_name: 'Olivia Brown',
    email: 'zephyr@example.com',
    issues: [] // Initialize issues array
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

// Import AI intent handler
const { detectIntent } = require('./ai-intent');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add CORS headers to allow frontend to send custom headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-session-id');
  next();
});

// Simple in-memory session store (for demo)
const conversationState = {};

// AI Intent API
app.post('/api/ai-intent', async (req, res) => {
  const { prompt } = req.body;
  // Use sessionId from header or fallback to a static demo value
  const sessionId = req.headers['x-session-id'] || 'demo-session';
  
  console.log(`[SESSION ${sessionId}] Received prompt: ${prompt}`);
  console.log(`[SESSION ${sessionId}] Headers:`, req.headers);
  
  if (!prompt) {
    return res.status(400).json({ message: 'Missing prompt in request body.' });
  }
  try {
    // Get previous state for this session
    if (!conversationState[sessionId]) {
      console.log(`[SESSION ${sessionId}] Creating new session state`);
      conversationState[sessionId] = {};
    } else {
      console.log(`[SESSION ${sessionId}] Existing state:`, conversationState[sessionId]);
    }
    const prevState = conversationState[sessionId];

    // Run AI intent detection
    const aiResult = await detectIntent(prompt);
    console.log(`[SESSION ${sessionId}] AI result:`, aiResult);
    
    // Direct entity extraction as fallback
    // This ensures we extract entities even if the AI model fails
    const directEntities = require('./ai-intent-hf').extractEntities(prompt);
    console.log(`[SESSION ${sessionId}] Direct entities:`, directEntities);
    
    // Merge all entities (prioritize direct extraction for follow-up messages)
    const merged = { 
      ...prevState, 
      ...aiResult.entities,
      ...directEntities // Direct extraction gets priority for follow-ups
    };
    console.log(`[SESSION ${sessionId}] Merged state:`, merged);

    // Determine required fields for each intent
    let requiredFields = [];
    let intent = aiResult.intent;
    // If we already have a project and issue_title, assume create_issue intent
    if (merged.project && merged.issue_title) {
      intent = 'create_issue';
    }
    // If we have project, milestone and subtask, assume add_subtask intent
    else if (merged.project && merged.milestone && merged.subtask) {
      intent = 'add_subtask';
    }
    
    if (intent === 'create_issue') {
      requiredFields = ['project', 'issue_title', 'assignee', 'dueDate'];
    } else if (intent === 'add_subtask') {
      requiredFields = ['project', 'milestone', 'subtask', 'assignee', 'dueDate'];
    }

    // Find missing fields
    const missingFields = requiredFields.filter(f => !merged[f]);
    console.log(`[SESSION ${sessionId}] Missing fields:`, missingFields);

    if (intent === 'create_issue' && missingFields.length === 0) {
      // All data collected, proceed to create issue
      const project = sampleProjects.find(p => p.name.toLowerCase() === (merged.project || '').toLowerCase());
      if (!project) {
        return res.status(404).json({ message: 'Project not found.' });
      }
      // Create issue with all fields from merged data
      const newIssue = {
        id: (project.issues ? project.issues.length : 0) + 1,
        title: merged.issue_title,
        assignee: merged.assignee,
        dueDate: merged.dueDate,
        priority: merged.priority || 'medium',
        status: 'Open',
        created_at: new Date().toISOString(),
      };
      
      // Ensure project has issues array
      if (!project.issues) project.issues = [];
      
      // Add issue to project
      project.issues.push(newIssue);
      console.log(`Created issue in project "${project.name}": `, newIssue);
      
      // Clear state
      delete conversationState[sessionId];
      return res.status(201).json({ 
        message: `Issue "${newIssue.title}" created in project "${project.name}".`, 
        issue: newIssue, 
        project: project.name,
        projectId: project.id
      });
    } else if (intent === 'add_subtask' && missingFields.length === 0) {
      // All data collected, proceed to add subtask
      const project = sampleProjects.find(p => p.name.toLowerCase() === (merged.project || '').toLowerCase());
      if (!project) {
        return res.status(404).json({ message: 'Project not found.' });
      }
      const milestone = sampleMilestones.find(m => m.project_id === project.id && m.name.toLowerCase() === (merged.milestone || '').toLowerCase());
      if (!milestone) {
        return res.status(404).json({ message: 'Milestone not found in project.' });
      }
      if (!milestone.subtasks) milestone.subtasks = [];
      const newSubtask = {
        id: milestone.subtasks.length + 1,
        description: merged.subtask,
        assignee: merged.assignee,
        dueDate: merged.dueDate,
        created_at: new Date().toISOString(),
      };
      milestone.subtasks.push(newSubtask);
      // Clear state
      delete conversationState[sessionId];
      return res.status(201).json({ message: 'Subtask added.', subtask: newSubtask, milestone: milestone.name, project: project.name });
    } else if (requiredFields.length > 0 && missingFields.length > 0) {
      // Still missing fields, update state and prompt user
      conversationState[sessionId] = merged;
      console.log(`[SESSION ${sessionId}] Asking for missing fields: ${missingFields.join(', ')}`);
      return res.status(200).json({ message: `Please provide: ${missingFields.join(', ')}`, missingFields, collected: merged, sessionId });
    } else {
      // Intent not recognized or not supported
      return res.status(200).json({ message: 'Intent not recognized or not supported.', aiResult });
    }
  } catch (error) {
    console.error('AI Intent Error:', error);
    return res.status(500).json({ message: 'Failed to process AI intent.', error: error.message });
  }
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

// Project Issues API
app.get('/api/projects/:id/issues', (req, res) => {
  const id = parseInt(req.params.id);
  const project = sampleProjects.find(p => p.id === id);
  
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }
  
  // Return issues array (or empty array if not initialized)
  res.json(project.issues || []);
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
});
