import {
  Project, InsertProject, Milestone, InsertMilestone, 
  Subtask, InsertSubtask, Issue, InsertIssue, 
  Update, InsertUpdate, ChatMessage, InsertChatMessage
} from "@shared/schema";

export interface IStorage {
  // Project methods
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Milestone methods
  getMilestones(projectId: number): Promise<Milestone[]>;
  getMilestone(id: number): Promise<Milestone | undefined>;
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;
  updateMilestone(id: number, milestone: Partial<Milestone>): Promise<Milestone | undefined>;
  deleteMilestone(id: number): Promise<boolean>;
  
  // Subtask methods
  getSubtasks(milestoneId: number): Promise<Subtask[]>;
  getSubtask(id: number): Promise<Subtask | undefined>;
  createSubtask(subtask: InsertSubtask): Promise<Subtask>;
  updateSubtask(id: number, subtask: Partial<Subtask>): Promise<Subtask | undefined>;
  deleteSubtask(id: number): Promise<boolean>;
  
  // Issue methods
  getIssues(projectId: number): Promise<Issue[]>;
  getIssue(id: number): Promise<Issue | undefined>;
  createIssue(issue: InsertIssue): Promise<Issue>;
  updateIssue(id: number, issue: Partial<Issue>): Promise<Issue | undefined>;
  deleteIssue(id: number): Promise<boolean>;
  
  // Update methods
  getUpdates(projectId: number): Promise<Update[]>;
  getUpdate(id: number): Promise<Update | undefined>;
  createUpdate(update: InsertUpdate): Promise<Update>;
  
  // Chat methods
  getChatMessages(projectId?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
}

export class MemStorage implements IStorage {
  private projects: Map<number, Project>;
  private milestones: Map<number, Milestone>;
  private subtasks: Map<number, Subtask>;
  private issues: Map<number, Issue>;
  private updates: Map<number, Update>;
  private chatMessages: Map<number, ChatMessage>;
  
  private projectId: number;
  private milestoneId: number;
  private subtaskId: number;
  private issueId: number;
  private updateId: number;
  private chatMessageId: number;
  
  constructor() {
    this.projects = new Map();
    this.milestones = new Map();
    this.subtasks = new Map();
    this.issues = new Map();
    this.updates = new Map();
    this.chatMessages = new Map();
    
    this.projectId = 1;
    this.milestoneId = 1;
    this.subtaskId = 1;
    this.issueId = 1;
    this.updateId = 1;
    this.chatMessageId = 1;
    
    // Add initial data for demo purposes
    this.seedData();
  }
  
  // Project methods
  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }
  
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    const id = this.projectId++;
    const now = new Date();
    const newProject: Project = { ...project, id, createdAt: now };
    this.projects.set(id, newProject);
    
    // Create default milestones for the project
    await this.createDefaultMilestones(id);
    
    return newProject;
  }
  
  async updateProject(id: number, project: Partial<Project>): Promise<Project | undefined> {
    const existingProject = this.projects.get(id);
    if (!existingProject) return undefined;
    
    const updatedProject = { ...existingProject, ...project };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }
  
  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }
  
  // Milestone methods
  async getMilestones(projectId: number): Promise<Milestone[]> {
    return Array.from(this.milestones.values())
      .filter(milestone => milestone.projectId === projectId)
      .sort((a, b) => a.order - b.order);
  }
  
  async getMilestone(id: number): Promise<Milestone | undefined> {
    return this.milestones.get(id);
  }
  
  async createMilestone(milestone: InsertMilestone): Promise<Milestone> {
    const id = this.milestoneId++;
    const now = new Date();
    const newMilestone: Milestone = { ...milestone, id, createdAt: now };
    this.milestones.set(id, newMilestone);
    return newMilestone;
  }
  
  async updateMilestone(id: number, milestone: Partial<Milestone>): Promise<Milestone | undefined> {
    const existingMilestone = this.milestones.get(id);
    if (!existingMilestone) return undefined;
    
    const updatedMilestone = { ...existingMilestone, ...milestone };
    this.milestones.set(id, updatedMilestone);
    return updatedMilestone;
  }
  
  async deleteMilestone(id: number): Promise<boolean> {
    return this.milestones.delete(id);
  }
  
  // Subtask methods
  async getSubtasks(milestoneId: number): Promise<Subtask[]> {
    return Array.from(this.subtasks.values())
      .filter(subtask => subtask.milestoneId === milestoneId)
      .sort((a, b) => a.order - b.order);
  }
  
  async getSubtask(id: number): Promise<Subtask | undefined> {
    return this.subtasks.get(id);
  }
  
  async createSubtask(subtask: InsertSubtask): Promise<Subtask> {
    const id = this.subtaskId++;
    const now = new Date();
    const newSubtask: Subtask = { ...subtask, id, createdAt: now };
    this.subtasks.set(id, newSubtask);
    return newSubtask;
  }
  
  async updateSubtask(id: number, subtask: Partial<Subtask>): Promise<Subtask | undefined> {
    const existingSubtask = this.subtasks.get(id);
    if (!existingSubtask) return undefined;
    
    const updatedSubtask = { ...existingSubtask, ...subtask };
    this.subtasks.set(id, updatedSubtask);
    return updatedSubtask;
  }
  
  async deleteSubtask(id: number): Promise<boolean> {
    return this.subtasks.delete(id);
  }
  
  // Issue methods
  async getIssues(projectId: number): Promise<Issue[]> {
    return Array.from(this.issues.values())
      .filter(issue => issue.projectId === projectId);
  }
  
  async getIssue(id: number): Promise<Issue | undefined> {
    return this.issues.get(id);
  }
  
  async createIssue(issue: InsertIssue): Promise<Issue> {
    const id = this.issueId++;
    const now = new Date();
    const newIssue: Issue = { ...issue, id, createdAt: now, resolvedAt: null };
    this.issues.set(id, newIssue);
    return newIssue;
  }
  
  async updateIssue(id: number, issue: Partial<Issue>): Promise<Issue | undefined> {
    const existingIssue = this.issues.get(id);
    if (!existingIssue) return undefined;
    
    const updatedIssue = { ...existingIssue, ...issue };
    this.issues.set(id, updatedIssue);
    return updatedIssue;
  }
  
  async deleteIssue(id: number): Promise<boolean> {
    return this.issues.delete(id);
  }
  
  // Update methods
  async getUpdates(projectId: number): Promise<Update[]> {
    return Array.from(this.updates.values())
      .filter(update => update.projectId === projectId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getUpdate(id: number): Promise<Update | undefined> {
    return this.updates.get(id);
  }
  
  async createUpdate(update: InsertUpdate): Promise<Update> {
    const id = this.updateId++;
    const now = new Date();
    const newUpdate: Update = { ...update, id, createdAt: now, processedContent: null };
    this.updates.set(id, newUpdate);
    return newUpdate;
  }
  
  // Chat methods
  async getChatMessages(projectId?: number): Promise<ChatMessage[]> {
    const messages = Array.from(this.chatMessages.values());
    
    if (projectId) {
      return messages
        .filter(message => message.projectId === projectId)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    }
    
    return messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const id = this.chatMessageId++;
    const now = new Date();
    const newMessage: ChatMessage = { ...message, id, createdAt: now };
    this.chatMessages.set(id, newMessage);
    return newMessage;
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
      await this.createMilestone({
        projectId,
        name: milestoneNames[i],
        description: `${milestoneNames[i]} phase`,
        status: "Not Started",
        startDate: null,
        endDate: null,
        owner: null,
        order: i + 1
      });
    }
    
    // Add default subtasks for each milestone
    const milestones = await this.getMilestones(projectId);
    
    for (const milestone of milestones) {
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
  
  private seedData(): void {
    // Create a sample project for demo purposes
    const demoProject: InsertProject = {
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
    };
    
    // Create the demo project
    this.createProject(demoProject).then(project => {
      // Create some issues for the demo project
      this.createIssue({
        projectId: project.id,
        title: "API Integration Failure",
        description: "The external payment gateway API integration is failing with timeout errors during UAT testing.",
        status: "Open",
        priority: "High",
        owner: "John Davies",
        reportedBy: "QA Team"
      });
      
      this.createIssue({
        projectId: project.id,
        title: "Data Migration Discrepancy",
        description: "Customer contact history shows discrepancies when comparing legacy vs. new system data.",
        status: "Open",
        priority: "Medium",
        owner: "Maria Rodriguez",
        reportedBy: "Data Team"
      });
      
      this.createIssue({
        projectId: project.id,
        title: "Performance Issue in Reports Module",
        description: "Dashboard reports with large data sets are taking over 30 seconds to load, exceeding performance requirements.",
        status: "Open",
        priority: "Medium",
        owner: "Robert Chen",
        reportedBy: "Performance Team"
      });
      
      // Add some updates
      this.createUpdate({
        projectId: project.id,
        content: "UAT kickoff meeting completed successfully. All stakeholders are aligned on the test plan.",
        createdBy: "Sarah Chen"
      });
      
      this.createUpdate({
        projectId: project.id,
        content: "Discovered API integration issue with payment gateway. Working with vendor to resolve.",
        createdBy: "John Davies"
      });
      
      // Add initial chat messages
      this.createChatMessage({
        projectId: null,
        role: "assistant",
        content: "How can I help you with your projects today?"
      });
      
      this.createChatMessage({
        projectId: null,
        role: "user",
        content: "Which projects are at risk of missing their deadlines?"
      });
      
      this.createChatMessage({
        projectId: null,
        role: "assistant",
        content: "Based on current progress, 1 project is at risk: CRM Migration (UAT phase delayed by 3 days due to API integration issues)."
      });
    });
    
    // Create more sample projects
    const demoProject2: InsertProject = {
      name: "ERP Implementation",
      number: "P1002",
      moduleName: "Finance",
      description: "Enterprise Resource Planning system implementation",
      status: "In Progress",
      progress: 42,
      startDate: new Date("2023-07-10"),
      endDate: new Date("2024-02-28"),
      pmName: "David Johnson",
      dlName: "Lisa Wong",
      baName: "Steve Miller",
      tlName: "Tom Chen",
      uiLeadName: "Jessica Thompson",
      dbLeadName: "Mark Davis",
      qaLeadName: "Amanda Rogers"
    };
    
    this.createProject(demoProject2);
    
    const demoProject3: InsertProject = {
      name: "Document Management",
      number: "P1003",
      moduleName: "Content",
      description: "New document management system implementation",
      status: "In Progress",
      progress: 27,
      startDate: new Date("2023-08-01"),
      endDate: new Date("2024-03-15"),
      pmName: "Robert Smith",
      dlName: "Emily Davis",
      baName: "Daniel Lee",
      tlName: "Sophia Martinez",
      uiLeadName: "William Brown",
      dbLeadName: "Olivia Taylor",
      qaLeadName: "James Wilson"
    };
    
    this.createProject(demoProject3);
  }
}

export const storage = new MemStorage();
