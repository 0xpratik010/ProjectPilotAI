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

// Update the server.js file in netlify/functions to use CommonJS syntax
const serverJsPath = path.join(netlifyFunctionsDir, 'server.js');
const serverJsContent = `// Use CommonJS syntax for Netlify functions
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
exports.handler = serverless(app);`;

fs.writeFileSync(serverJsPath, serverJsContent);
console.log('✅ Created Netlify function file with CommonJS syntax');

// Create a package.json file for the Netlify function
const functionPackageJsonPath = path.join(netlifyFunctionsDir, 'package.json');
const functionPackageJsonContent = JSON.stringify({
  "name": "netlify-functions",
  "version": "1.0.0",
  "description": "Netlify Functions for ProjectPilotAI",
  "dependencies": {
    "express": "^4.21.2",
    "serverless-http": "^3.2.0",
    "dotenv": "^16.5.0"
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
`;

fs.writeFileSync(netlifyTomlPath, netlifyTomlContent);
console.log('✅ Updated netlify.toml configuration');

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
