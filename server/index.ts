import dotenv from "dotenv";
dotenv.config();
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db } from "./db";
import { sql } from "drizzle-orm";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

async function initializeDatabase() {
  try {
    // First, update all NULL values to defaults
    await db.execute(sql`
      UPDATE projects 
      SET 
        start_date = CURRENT_DATE,
        end_date = CURRENT_DATE + INTERVAL '12 weeks',
        pm_name = '',
        dl_name = '',
        ba_name = '',
        tl_name = '',
        ui_lead_name = '',
        db_lead_name = '',
        qa_lead_name = '',
        email = '',
        current_phase = 'Requirement Gathering',
        progress = 0,
        status = 'Not Started'
      WHERE start_date IS NULL 
         OR end_date IS NULL 
         OR pm_name IS NULL 
         OR dl_name IS NULL 
         OR ba_name IS NULL 
         OR tl_name IS NULL 
         OR ui_lead_name IS NULL 
         OR db_lead_name IS NULL 
         OR qa_lead_name IS NULL 
         OR email IS NULL
         OR current_phase IS NULL
         OR progress IS NULL
         OR status IS NULL;
    `);
    log("Database initialized with defaults");
  } catch (error) {
    let errorMsg: string;
    if (error instanceof Error) {
      errorMsg = error.message;
    } else {
      errorMsg = String(error);
    }
    log("Error initializing database:", errorMsg);
  }
}

async function resetDatabase() {
  try {
    // Drop all related tables
    await db.execute(sql`
      DROP TABLE IF EXISTS chat_messages CASCADE;
      DROP TABLE IF EXISTS updates CASCADE;
      DROP TABLE IF EXISTS issues CASCADE;
      DROP TABLE IF EXISTS subtasks CASCADE;
      DROP TABLE IF EXISTS milestones CASCADE;
      DROP TABLE IF EXISTS projects CASCADE;
    `);
    
    // Create the projects table
    await db.execute(sql`
      CREATE TABLE projects (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        number TEXT,
        module_name TEXT,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'Not Started',
        progress INTEGER NOT NULL DEFAULT 0,
        current_phase TEXT NOT NULL DEFAULT 'Requirement Gathering',
        start_date DATE NOT NULL DEFAULT CURRENT_DATE,
        end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '12 weeks'),
        pm_name TEXT NOT NULL DEFAULT '',
        dl_name TEXT NOT NULL DEFAULT '',
        ba_name TEXT NOT NULL DEFAULT '',
        tl_name TEXT NOT NULL DEFAULT '',
        ui_lead_name TEXT NOT NULL DEFAULT '',
        db_lead_name TEXT NOT NULL DEFAULT '',
        qa_lead_name TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL DEFAULT '',
        is_deleted BOOLEAN NOT NULL DEFAULT false,
        timeline_config JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create milestones table
    await db.execute(sql`
      CREATE TABLE milestones (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'Not Started',
        start_date DATE,
        end_date DATE,
        owner TEXT,
        "order" INTEGER NOT NULL,
        duration_in_weeks INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create subtasks table
    await db.execute(sql`
      CREATE TABLE subtasks (
        id SERIAL PRIMARY KEY,
        milestone_id INTEGER NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'Not Started',
        start_date DATE,
        end_date DATE,
        owner TEXT,
        email_to_send TEXT,
        "order" INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create issues table
    await db.execute(sql`
      CREATE TABLE issues (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'Open',
        priority TEXT NOT NULL DEFAULT 'Medium',
        owner TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        resolved_at TIMESTAMP,
        reported_by TEXT
      )
    `);

    // Create updates table
    await db.execute(sql`
      CREATE TABLE updates (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        processed_content JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_by TEXT
      )
    `);

    // Create chat_messages table
    await db.execute(sql`
      CREATE TABLE chat_messages (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Insert a test project
    await db.execute(sql`
      INSERT INTO projects (name, description, status, progress, current_phase)
      VALUES ('Test Project', 'A test project to verify database setup', 'In Progress', 25, 'Requirement Gathering')
      RETURNING id
    `);

    // Insert default milestones for the test project
    const milestoneNames = [
      'Requirement Gathering',
      'BFRD Sign-off',
      'Configuration',
      'SIT-IN',
      'UAT',
      'Security',
      'Cut-off',
      'Go-Live',
      'Hypercare'
    ];

    for (let i = 0; i < milestoneNames.length; i++) {
      await db.execute(sql`
        INSERT INTO milestones (project_id, name, "order", duration_in_weeks)
        VALUES (
          (SELECT id FROM projects WHERE name = 'Test Project'),
          ${milestoneNames[i]},
          ${i + 1},
          2
        )
      `);
    }

    log("Database reset completed successfully");
  } catch (error) {
    log("Error resetting database:", error);
    throw error;
  }
}

async function seedProjectsIfNeeded() {
  // Check if there are any projects
  const result = await db.execute(sql`SELECT COUNT(*) as count FROM projects;`);
  const count = parseInt(result.rows?.[0]?.count || "0", 10);
  if (count <= 1) {
    // Insert 5 sample projects
    await db.execute(sql`
      INSERT INTO projects (name, status, progress, start_date, end_date, pm_name, dl_name, ba_name, tl_name, ui_lead_name, db_lead_name, qa_lead_name, email, current_phase)
      VALUES
        ('Apollo Redesign', 'In Progress', 45, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '60 days', 'Alice PM', 'Bob DL', 'Carol BA', 'Dave TL', 'Eve UI', 'Frank DB', 'Grace QA', 'alice@example.com', 'Development'),
        ('Zephyr Migration', 'Not Started', 0, CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days', 'Hank PM', 'Ivy DL', 'Jack BA', 'Ken TL', 'Lily UI', 'Mona DB', 'Nina QA', 'hank@example.com', 'Requirement Gathering'),
        ('Orion Launch', 'At Risk', 20, CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '75 days', 'Oscar PM', 'Pam DL', 'Quinn BA', 'Rick TL', 'Sara UI', 'Tom DB', 'Uma QA', 'oscar@example.com', 'Design'),
        ('Atlas Upgrade', 'Completed', 100, CURRENT_DATE - INTERVAL '120 days', CURRENT_DATE - INTERVAL '10 days', 'Vera PM', 'Will DL', 'Xena BA', 'Yuri TL', 'Zane UI', 'Amy DB', 'Ben QA', 'vera@example.com', 'Deployment'),
        ('Pegasus Revamp', 'Delayed', 60, CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE + INTERVAL '45 days', 'Cleo PM', 'Duke DL', 'Elle BA', 'Finn TL', 'Gina UI', 'Hugo DB', 'Iris QA', 'cleo@example.com', 'Testing')
    `);
    // Fetch all projects
    const projectsRes = await db.execute(sql`SELECT id, name FROM projects;`);
    const projects = projectsRes.rows;
    // Define milestones and subtasks for each project
    const milestonesData = [
      {
        name: 'Requirement Gathering',
        description: 'Gather all requirements',
        owner: 'Carol BA',
        subtasks: [
          { name: 'Interview Stakeholders', owner: 'Carol BA' },
          { name: 'Document Requirements', owner: 'Carol BA' }
        ]
      },
      {
        name: 'Development',
        description: 'Development phase',
        owner: 'Dave TL',
        subtasks: [
          { name: 'Setup Repo', owner: 'Dave TL' },
          { name: 'Implement Features', owner: 'Bob DL' },
          { name: 'Code Review', owner: 'Alice PM' }
        ]
      },
      {
        name: 'Testing',
        description: 'Testing and QA',
        owner: 'Grace QA',
        subtasks: [
          { name: 'Write Test Cases', owner: 'Grace QA' },
          { name: 'Perform Testing', owner: 'Grace QA' }
        ]
      }
    ];
    // For each project, insert milestones and subtasks
    for (const project of projects) {
      let milestoneOrder = 1;
      for (const milestone of milestonesData) {
        const milestoneRes = await db.execute(sql`
          INSERT INTO milestones (project_id, name, description, status, owner, "order", duration_in_weeks)
          VALUES (${project.id}, ${milestone.name}, ${milestone.description}, 'Not Started', ${milestone.owner}, ${milestoneOrder}, 2)
          RETURNING id
        `);
        const milestoneId = milestoneRes.rows[0].id;
        let subtaskOrder = 1;
        for (const subtask of milestone.subtasks) {
          await db.execute(sql`
            INSERT INTO subtasks (milestone_id, name, description, status, owner, "order")
            VALUES (${milestoneId}, ${subtask.name}, '', 'Not Started', ${subtask.owner}, ${subtaskOrder})
          `);
          subtaskOrder++;
        }
        milestoneOrder++;
      }
    }
    log('Seeded 5 sample projects with milestones and subtasks.');
  } else {
    log('Projects table already has data, skipping seed.');
  }
}

(async () => {
  await initializeDatabase();
  await seedProjectsIfNeeded();
  // await resetDatabase(); // Removed to avoid data loss
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
