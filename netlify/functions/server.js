const serverless = require('serverless-http');
const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

// Import your main app logic
const { registerRoutes } = require('../../server/routes');
const { setupVite, serveStatic, log } = require('../../server/vite');
const { db } = require('../../server/db');
const { sql } = require('drizzle-orm');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

registerRoutes(app);

// Add any additional middleware or static serving if needed

module.exports.handler = serverless(app);
