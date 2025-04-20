import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from '../shared/schema';
import 'dotenv/config';

// Required for Neon DB to work with serverless environments
neonConfig.webSocketConstructor = ws;

async function main() {
  console.log('🚀 Starting database migration...');
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set.');
  }
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  
  console.log('🔄 Pushing schema changes to database...');
  
  try {
    // Push the schema to the database
    await db.execute(`
      DO $$ 
      BEGIN
        -- Create enum types if they don't exist
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
          CREATE TYPE project_status AS ENUM ('Not Started', 'In Progress', 'At Risk', 'Completed');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'milestone_status') THEN
          CREATE TYPE milestone_status AS ENUM ('Not Started', 'In Progress', 'Completed');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'issue_status') THEN
          CREATE TYPE issue_status AS ENUM ('Open', 'In Progress', 'Resolved', 'Closed');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'issue_priority') THEN
          CREATE TYPE issue_priority AS ENUM ('Low', 'Medium', 'High', 'Critical');
        END IF;
      END $$;
    `);
    
    // Create projects table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        number TEXT,
        module_name TEXT,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'Not Started',
        progress INTEGER DEFAULT 0,
        start_date DATE,
        end_date DATE,
        pm_name TEXT,
        dl_name TEXT,
        ba_name TEXT,
        tl_name TEXT,
        ui_lead_name TEXT,
        db_lead_name TEXT,
        qa_lead_name TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Create milestones table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS milestones (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'Not Started',
        start_date DATE,
        end_date DATE,
        owner TEXT,
        "order" INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Create subtasks table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS subtasks (
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
      );
    `);
    
    // Create issues table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS issues (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'Open',
        priority TEXT NOT NULL DEFAULT 'Medium',
        owner TEXT,
        reported_by TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        resolved_at TIMESTAMP
      );
    `);
    
    // Create updates table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS updates (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        processed_content JSONB,
        created_by TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Create chat_messages table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log('✅ Database migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('Failed to run migration script:', err);
  process.exit(1);
});