import {
  Project, InsertProject, Milestone, InsertMilestone, 
  Subtask, InsertSubtask, Issue, InsertIssue, 
  Update, InsertUpdate, ChatMessage, InsertChatMessage,
  projects, milestones, subtasks, issues, updates, chatMessages
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  constructor() {
    // No initialization needed for database storage
  }
  
  // Project methods
  async getProjects(): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.isDeleted, false));
  }
  
  async getProject(id: number): Promise<Project | undefined> {
    const result = await db
      .select()
      .from(projects)
      .where(and(
        eq(projects.id, id),
        eq(projects.isDeleted, false)
      ));
    return result[0];
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    const [result] = await db.insert(projects).values(project).returning();
    
    // Create default milestones for the project
    await this.createDefaultMilestones(result.id);
    
    return result;
  }
  
  async updateProject(id: number, project: Partial<Project>): Promise<Project | undefined> {
    const [result] = await db
      .update(projects)
      .set(project)
      .where(eq(projects.id, id))
      .returning();
    
    return result;
  }
  
  async deleteProject(id: number): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id));
    return !!result;
  }
  
  async updateExistingProjectsWithDefaults() {
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
  }

  async getProjectStatus(projectId: number) {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
      with: {
        milestones: {
          with: {
            subtasks: true
          }
        },
        issues: true
      }
    });

    if (!project) {
      throw new Error("Project not found");
    }

    return {
      project: {
        name: project.name,
        status: project.status,
        progress: project.progress,
        currentPhase: project.currentPhase
      },
      milestones: project.milestones.map(m => ({
        name: m.name,
        status: m.status,
        subtasks: m.subtasks.length,
        completedSubtasks: m.subtasks.filter(s => s.status === 'Completed').length
      })),
      openIssues: project.issues.filter(i => i.status === 'Open').length,
      criticalIssues: project.issues.filter(i => i.priority === 'Critical' && i.status === 'Open').length
    };
  }

  async getProjectUpdates(projectId: number) {
    const updatesResult = await db.query.updates.findMany({
      where: eq(updates.projectId, projectId),
      orderBy: [desc(updates.createdAt)],
      limit: 5
    });

    return updatesResult;
  }

  async getProjectIssues(projectId: number) {
    const issuesResult = await db.query.issues.findMany({
      where: eq(issues.projectId, projectId),
      orderBy: [desc(issues.createdAt)]
    });

    return issuesResult;
  }

  // Milestone methods
  async getMilestones(projectId: number): Promise<Milestone[]> {
    return await db
      .select()
      .from(milestones)
      .where(eq(milestones.projectId, projectId))
      .orderBy(milestones.order);
  }
  
  async getMilestone(id: number): Promise<Milestone | undefined> {
    const result = await db.select().from(milestones).where(eq(milestones.id, id));
    return result[0];
  }
  
  async createMilestone(milestone: InsertMilestone): Promise<Milestone> {
    const [result] = await db.insert(milestones).values(milestone).returning();
    return result;
  }
  
  async updateMilestone(id: number, milestone: Partial<Milestone>): Promise<Milestone | undefined> {
    const [result] = await db
      .update(milestones)
      .set(milestone)
      .where(eq(milestones.id, id))
      .returning();
    
    return result;
  }
  
  async deleteMilestone(id: number): Promise<boolean> {
    const result = await db.delete(milestones).where(eq(milestones.id, id));
    return !!result;
  }
  
  // Subtask methods
  async getSubtasks(milestoneId: number): Promise<Subtask[]> {
    return await db
      .select()
      .from(subtasks)
      .where(eq(subtasks.milestoneId, milestoneId))
      .orderBy(subtasks.order);
  }

  async getSubtask(id: number): Promise<Subtask | undefined> {
    const result = await db.select().from(subtasks).where(eq(subtasks.id, id));
    return result[0];
  }

  async createSubtask(subtask: InsertSubtask): Promise<Subtask> {
    console.log("Creating subtask with data:", subtask);
    try {
      const [result] = await db.insert(subtasks).values({
        milestoneId: subtask.milestoneId,
        name: subtask.name,
        description: subtask.description || null,
        status: subtask.status || "Not Started",
        startDate: subtask.startDate || null,
        endDate: subtask.endDate || null,
        owner: subtask.owner || null,
        emailToSend: subtask.emailToSend || null,
        order: subtask.order
      }).returning();
      console.log("Subtask created successfully:", result);
      return result;
    } catch (error) {
      console.error("Error creating subtask:", error);
      throw error;
    }
  }

  async updateSubtask(id: number, subtask: Partial<Subtask>): Promise<Subtask | undefined> {
    const [result] = await db
      .update(subtasks)
      .set(subtask)
      .where(eq(subtasks.id, id))
      .returning();
    return result;
  }

  async deleteSubtask(id: number): Promise<boolean> {
    const result = await db.delete(subtasks).where(eq(subtasks.id, id));
    return !!result;
  }
  
  // Issue methods
  async getIssues(projectId: number): Promise<Issue[]> {
    return await db
      .select()
      .from(issues)
      .where(eq(issues.projectId, projectId));
  }
  
  async getIssue(id: number): Promise<Issue | undefined> {
    const result = await db.select().from(issues).where(eq(issues.id, id));
    return result[0];
  }
  
  async createIssue(issue: InsertIssue): Promise<Issue> {
    const [result] = await db.insert(issues).values(issue).returning();
    return result;
  }
  
  async updateIssue(id: number, issue: Partial<Issue>): Promise<Issue | undefined> {
    const [result] = await db
      .update(issues)
      .set(issue)
      .where(eq(issues.id, id))
      .returning();
    
    return result;
  }
  
  async deleteIssue(id: number): Promise<boolean> {
    const result = await db.delete(issues).where(eq(issues.id, id));
    return !!result;
  }
  
  // Update methods
  async getUpdates(projectId: number): Promise<Update[]> {
    return await db
      .select()
      .from(updates)
      .where(eq(updates.projectId, projectId))
      .orderBy(desc(updates.createdAt));
  }
  
  async getUpdate(id: number): Promise<Update | undefined> {
    const result = await db.select().from(updates).where(eq(updates.id, id));
    return result[0];
  }
  
  async createUpdate(update: InsertUpdate): Promise<Update> {
    const [result] = await db.insert(updates).values(update).returning();
    return result;
  }
  
  // Chat methods
  async getChatMessages(projectId?: number): Promise<ChatMessage[]> {
    if (projectId) {
      return await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.projectId, projectId))
        .orderBy(chatMessages.createdAt);
    }
    
    return await db
      .select()
      .from(chatMessages)
      .orderBy(chatMessages.createdAt);
  }
  
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [result] = await db.insert(chatMessages).values(message).returning();
    return result;
  }
  
  // Helper methods
  private async createDefaultMilestones(projectId: number): Promise<void> {
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
      const milestone = await this.createMilestone({
        projectId,
        name: milestoneNames[i],
        description: `${milestoneNames[i]} phase`,
        status: "Not Started",
        startDate: null,
        endDate: null,
        owner: null,
        order: i + 1
      });
      
      // Add default subtasks for each milestone
      await this.createDefaultSubtasks(milestone.id, milestone.name);
    }
  }
  
  private async createDefaultSubtasks(milestoneId: number, milestoneName: string): Promise<void> {
    let subtasks: {name: string, description: string}[] = [];
    
    switch(milestoneName) {
      case "Requirement Gathering":
        subtasks = [
          { name: "Project Kick-off", description: "Initial project meeting" },
          { name: "Fit Gap Analysis", description: "Analyze requirements and gaps" },
          { name: "BFRD Writing Start", description: "Begin documenting requirements" }
        ];
        break;
      case "BFRD Sign-off":
        subtasks = [
          { name: "BFRD Finish Writing", description: "Complete requirements documentation" },
          { name: "Share Details with Client", description: "Present documentation to stakeholders" },
          { name: "BFRD Sign-off", description: "Obtain formal approval" }
        ];
        break;
      case "Configuration":
        subtasks = [
          { name: "Configuration Start", description: "Begin system configuration" },
          { name: "Sprint Demo 1", description: "First demo of progress" },
          { name: "UI Code Review", description: "Review UI implementation" },
          { name: "DB Code Review", description: "Review database implementation" },
          { name: "Sprint Demo 2", description: "Second demo of progress" },
          { name: "Configuration End", description: "Complete system configuration" }
        ];
        break;
      case "SIT-IN":
        subtasks = [
          { name: "Internal Testing Start", description: "Begin internal system testing" },
          { name: "QA Kick-off", description: "Start quality assurance process" },
          { name: "SIT 1", description: "First round of system integration testing" },
          { name: "SIT 1 Exit", description: "Conclude first testing round" },
          { name: "SIT 2", description: "Second round of system integration testing" },
          { name: "SIT 2 Exit", description: "Conclude second testing round" }
        ];
        break;
      case "UAT":
        subtasks = [
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
        subtasks = [
          { name: "Security Assessment", description: "Evaluate system security" },
          { name: "Security Remediation", description: "Address security findings" },
          { name: "Security Sign-off", description: "Obtain security approval" }
        ];
        break;
      case "Cut-off":
        subtasks = [
          { name: "Cutover Start", description: "Begin migration process" },
          { name: "Data Migration", description: "Move data to production" },
          { name: "Cutover End", description: "Complete migration process" }
        ];
        break;
      case "Go-Live":
        subtasks = [
          { name: "Go-Live Date", description: "System deployment to production" }
        ];
        break;
      case "Hypercare":
        subtasks = [
          { name: "Hypercare Start", description: "Begin extended support" },
          { name: "Weekly Status Reporting", description: "Provide weekly status updates" },
          { name: "Hypercare End", description: "Complete extended support" }
        ];
        break;
    }
    
    for (let i = 0; i < subtasks.length; i++) {
      await this.createSubtask({
        milestoneId,
        name: subtasks[i].name,
        description: subtasks[i].description,
        status: "Not Started",
        startDate: null,
        endDate: null,
        owner: null,
        emailToSend: null,
        order: i + 1
      });
    }
  }
}