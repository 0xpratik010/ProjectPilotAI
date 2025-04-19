import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from '../shared/schema';
import { projects, milestones, subtasks, issues, updates, chatMessages } from '../shared/schema';

// Required for Neon DB to work with serverless environments
neonConfig.webSocketConstructor = ws;

async function main() {
  console.log('🌱 Starting database seeding...');
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set.');
  }
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  
  try {
    console.log('Creating demo project...');
    
    // Create a sample project for demo purposes
    const [demoProject] = await db.insert(projects).values({
      name: "CRM Migration",
      number: "P1001",
      moduleName: "Customer Management",
      description: "Customer Relationship Management system migration project",
      status: "In Progress",
      progress: 68,
      startDate: new Date("2023-06-15"),
      endDate: new Date("2023-12-30"),
      pmName: "Sarah Chen",
      dlName: "Michael Johnson",
      baName: "Raj Patel",
      tlName: "Emma Wilson",
      uiLeadName: "David Kim",
      dbLeadName: "Alex Rodriguez",
      qaLeadName: "Jennifer Lopez"
    }).returning();
    
    console.log('Creating default milestones...');
    await createDefaultMilestones(db, demoProject.id);
    
    console.log('Creating demo issues...');
    await db.insert(issues).values([
      {
        projectId: demoProject.id,
        title: "API Integration Failure",
        description: "The external payment gateway API integration is failing with timeout errors during UAT testing.",
        status: "Open",
        priority: "High",
        owner: "John Davies",
        reportedBy: "QA Team"
      },
      {
        projectId: demoProject.id,
        title: "Data Migration Discrepancy",
        description: "Customer contact history shows discrepancies when comparing legacy vs. new system data.",
        status: "Open",
        priority: "Medium",
        owner: "Maria Rodriguez",
        reportedBy: "Data Team"
      },
      {
        projectId: demoProject.id,
        title: "Performance Issue in Reports Module",
        description: "Dashboard reports with large data sets are taking over 30 seconds to load, exceeding performance requirements.",
        status: "Open",
        priority: "Medium",
        owner: "Robert Chen",
        reportedBy: "Performance Team"
      }
    ]);
    
    console.log('Creating demo updates...');
    await db.insert(updates).values([
      {
        projectId: demoProject.id,
        content: "UAT kickoff meeting completed successfully. All stakeholders are aligned on the test plan.",
        createdBy: "Sarah Chen"
      },
      {
        projectId: demoProject.id,
        content: "Discovered API integration issue with payment gateway. Working with vendor to resolve.",
        createdBy: "John Davies"
      }
    ]);
    
    console.log('Creating initial chat messages...');
    await db.insert(chatMessages).values([
      {
        projectId: null,
        role: "assistant",
        content: "How can I help you with your projects today?"
      },
      {
        projectId: null,
        role: "user",
        content: "Which projects are at risk of missing their deadlines?"
      },
      {
        projectId: null,
        role: "assistant",
        content: "Based on current progress and milestone dates, the CRM Migration project has a high risk of missing its deadline due to API integration issues that were recently reported. I recommend focusing on resolving the payment gateway API timeout errors that are currently blocking UAT testing progress."
      }
    ]);
    
    console.log('✅ Database seeding completed successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

async function createDefaultMilestones(db, projectId: number) {
  const milestoneNames = [
    "Requirement Gathering",
    "BFRD Sign-off",
    "Configuration",
    "SIT-IN",
    "UAT",
    "Security",
    "Cut-off",
    "Go-Live",
    "Hypercare"
  ];
  
  for (let i = 0; i < milestoneNames.length; i++) {
    const [milestone] = await db.insert(milestones).values({
      projectId,
      name: milestoneNames[i],
      description: `${milestoneNames[i]} phase`,
      status: "Not Started",
      startDate: null,
      endDate: null,
      owner: null,
      order: i + 1
    }).returning();
    
    // Create default subtasks for each milestone
    await createDefaultSubtasks(db, milestone.id, milestone.name);
  }
}

async function createDefaultSubtasks(db, milestoneId: number, milestoneName: string) {
  let subtasksList: {name: string, description: string}[] = [];
  
  switch(milestoneName) {
    case "Requirement Gathering":
      subtasksList = [
        { name: "Project Kick-off", description: "Initial project meeting" },
        { name: "Fit Gap Analysis", description: "Analyze requirements and gaps" },
        { name: "BFRD Writing Start", description: "Begin documenting requirements" }
      ];
      break;
    case "BFRD Sign-off":
      subtasksList = [
        { name: "BFRD Finish Writing", description: "Complete requirements documentation" },
        { name: "Share Details with Client", description: "Present documentation to stakeholders" },
        { name: "BFRD Sign-off", description: "Obtain formal approval" }
      ];
      break;
    case "Configuration":
      subtasksList = [
        { name: "Configuration Start", description: "Begin system configuration" },
        { name: "Sprint Demo 1", description: "First demo of progress" },
        { name: "UI Code Review", description: "Review UI implementation" },
        { name: "DB Code Review", description: "Review database implementation" },
        { name: "Sprint Demo 2", description: "Second demo of progress" },
        { name: "Configuration End", description: "Complete system configuration" }
      ];
      break;
    case "SIT-IN":
      subtasksList = [
        { name: "Internal Testing Start", description: "Begin internal system testing" },
        { name: "QA Kick-off", description: "Start quality assurance process" },
        { name: "SIT 1", description: "First round of system integration testing" },
        { name: "SIT 1 Exit", description: "Conclude first testing round" },
        { name: "SIT 2", description: "Second round of system integration testing" },
        { name: "SIT 2 Exit", description: "Conclude second testing round" }
      ];
      break;
    case "UAT":
      subtasksList = [
        { name: "UAT Kick-off", description: "Start user acceptance testing" },
        { name: "UAT Start", description: "Begin testing with users" },
        { name: "CPI Approval", description: "Obtain CPI approval" },
        { name: "QA Approval", description: "Obtain QA approval" },
        { name: "Product BA's Approval", description: "Obtain BA approval" },
        { name: "UAT End", description: "Complete user acceptance testing" },
        { name: "UAT Exit", description: "Final UAT review and sign-off" }
      ];
      break;
    case "Security":
      subtasksList = [
        { name: "Security Assessment", description: "Evaluate system security" },
        { name: "Security Remediation", description: "Address security findings" },
        { name: "Security Sign-off", description: "Obtain security approval" }
      ];
      break;
    case "Cut-off":
      subtasksList = [
        { name: "Cutover Start", description: "Begin migration process" },
        { name: "Data Migration", description: "Move data to production" },
        { name: "Cutover End", description: "Complete migration process" }
      ];
      break;
    case "Go-Live":
      subtasksList = [
        { name: "Go-Live Date", description: "System deployment to production" }
      ];
      break;
    case "Hypercare":
      subtasksList = [
        { name: "Hypercare Start", description: "Begin extended support" },
        { name: "Weekly Status Reporting", description: "Provide weekly status updates" },
        { name: "Hypercare End", description: "Complete extended support" }
      ];
      break;
  }
  
  if (subtasksList.length > 0) {
    const subtasksToInsert = subtasksList.map((subtask, index) => ({
      milestoneId,
      name: subtask.name,
      description: subtask.description,
      status: "Not Started",
      startDate: null,
      endDate: null,
      owner: null,
      emailToSend: null,
      order: index + 1
    }));
    
    await db.insert(subtasks).values(subtasksToInsert);
  }
}

main().catch(err => {
  console.error('Failed to run seeding script:', err);
  process.exit(1);
});