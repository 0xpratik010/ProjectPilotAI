// Use CommonJS syntax for Netlify functions
const serverless = require('serverless-http');
const express = require('express');
const dotenv = require('dotenv');

// Initialize environment variables
dotenv.config();

// Create Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple routes for API endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

app.get('/api/projects', (req, res) => {
  res.json([
    { id: 1, name: 'Sample Project 1', status: 'Active' },
    { id: 2, name: 'Sample Project 2', status: 'Planning' }
  ]);
});

// Error handling middleware
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Export the serverless handler
exports.handler = serverless(app);
