import { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { processNaturalLanguageUpdate, generateWeeklySummary, getAssistantResponse } from "./ai";
import { insertProjectSchema, insertMilestoneSchema, insertSubtaskSchema, insertIssueSchema, insertUpdateSchema, insertChatMessageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Projects
  app.get("/api/projects", async (req: Request, res: Response) => {
    const projects = await storage.getProjects();
    res.json(projects);
  });

  app.get("/api/projects/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const project = await storage.getProject(id);
    
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    res.json(project);
  });

  app.post("/api/projects", async (req: Request, res: Response) => {
    try {
      const data = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(data);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.patch("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const data = insertProjectSchema.partial().parse(req.body);
      const updatedProject = await storage.updateProject(id, data);
      res.json(updatedProject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteProject(id);
    
    if (!success) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    res.status(204).end();
  });

  // Milestones
  app.get("/api/projects/:projectId/milestones", async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.projectId);
    const milestones = await storage.getMilestones(projectId);
    res.json(milestones);
  });

  app.get("/api/milestones/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const milestone = await storage.getMilestone(id);
    
    if (!milestone) {
      return res.status(404).json({ message: "Milestone not found" });
    }
    
    res.json(milestone);
  });

  app.post("/api/milestones", async (req: Request, res: Response) => {
    try {
      const data = insertMilestoneSchema.parse(req.body);
      const milestone = await storage.createMilestone(data);
      res.status(201).json(milestone);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create milestone" });
    }
  });

  app.patch("/api/milestones/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const milestone = await storage.getMilestone(id);
      
      if (!milestone) {
        return res.status(404).json({ message: "Milestone not found" });
      }
      
      const data = insertMilestoneSchema.partial().parse(req.body);
      const updatedMilestone = await storage.updateMilestone(id, data);
      res.json(updatedMilestone);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update milestone" });
    }
  });

  app.delete("/api/milestones/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteMilestone(id);
    
    if (!success) {
      return res.status(404).json({ message: "Milestone not found" });
    }
    
    res.status(204).end();
  });

  // Subtasks
  app.get("/api/milestones/:milestoneId/subtasks", async (req: Request, res: Response) => {
    const milestoneId = parseInt(req.params.milestoneId);
    const subtasks = await storage.getSubtasks(milestoneId);
    res.json(subtasks);
  });

  app.get("/api/subtasks/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const subtask = await storage.getSubtask(id);
    
    if (!subtask) {
      return res.status(404).json({ message: "Subtask not found" });
    }
    
    res.json(subtask);
  });

  app.post("/api/subtasks", async (req: Request, res: Response) => {
    try {
      const data = insertSubtaskSchema.parse(req.body);
      const subtask = await storage.createSubtask(data);
      res.status(201).json(subtask);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create subtask" });
    }
  });

  app.patch("/api/subtasks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const subtask = await storage.getSubtask(id);
      
      if (!subtask) {
        return res.status(404).json({ message: "Subtask not found" });
      }
      
      const data = insertSubtaskSchema.partial().parse(req.body);
      const updatedSubtask = await storage.updateSubtask(id, data);
      res.json(updatedSubtask);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update subtask" });
    }
  });

  app.delete("/api/subtasks/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteSubtask(id);
    
    if (!success) {
      return res.status(404).json({ message: "Subtask not found" });
    }
    
    res.status(204).end();
  });

  // Issues
  app.get("/api/projects/:projectId/issues", async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.projectId);
    const issues = await storage.getIssues(projectId);
    res.json(issues);
  });

  app.get("/api/issues/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const issue = await storage.getIssue(id);
    
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }
    
    res.json(issue);
  });

  app.post("/api/issues", async (req: Request, res: Response) => {
    try {
      const data = insertIssueSchema.parse(req.body);
      const issue = await storage.createIssue(data);
      res.status(201).json(issue);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create issue" });
    }
  });

  app.patch("/api/issues/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const issue = await storage.getIssue(id);
      
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }
      
      const data = insertIssueSchema.partial().parse(req.body);
      const updatedIssue = await storage.updateIssue(id, data);
      res.json(updatedIssue);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update issue" });
    }
  });

  app.delete("/api/issues/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteIssue(id);
    
    if (!success) {
      return res.status(404).json({ message: "Issue not found" });
    }
    
    res.status(204).end();
  });

  // Updates
  app.get("/api/projects/:projectId/updates", async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.projectId);
    const updates = await storage.getUpdates(projectId);
    res.json(updates);
  });

  app.post("/api/updates", async (req: Request, res: Response) => {
    try {
      const data = insertUpdateSchema.parse(req.body);
      const update = await storage.createUpdate(data);
      
      // Get project, milestones, and subtasks for processing
      const project = await storage.getProject(data.projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const milestones = await storage.getMilestones(data.projectId);
      const allSubtasks = [];
      
      for (const milestone of milestones) {
        const subtasks = await storage.getSubtasks(milestone.id);
        allSubtasks.push(...subtasks);
      }
      
      // Process the update with AI
      const processedUpdate = await processNaturalLanguageUpdate(update, project, milestones, allSubtasks);
      
      // Create any issues mentioned in the update
      for (const issueData of processedUpdate.issues) {
        await storage.createIssue({
          projectId: data.projectId,
          title: issueData.title,
          description: issueData.description,
          priority: issueData.priority,
          status: "Open",
          owner: null,
          reportedBy: data.createdBy || "System"
        });
      }
      
      // Update the status of milestones
      for (const milestoneChange of processedUpdate.affectedMilestones) {
        if (milestoneChange.newStatus) {
          await storage.updateMilestone(milestoneChange.id, {
            status: milestoneChange.newStatus
          });
        }
      }
      
      // Update the status of subtasks
      for (const subtaskChange of processedUpdate.affectedSubtasks) {
        if (subtaskChange.newStatus) {
          await storage.updateSubtask(subtaskChange.id, {
            status: subtaskChange.newStatus
          });
        }
      }
      
      // Return the processed update
      res.status(201).json({ 
        update, 
        processedContent: processedUpdate 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error processing update:", error);
      res.status(500).json({ message: "Failed to process update" });
    }
  });

  // Chat messages
  app.get("/api/chat", async (req: Request, res: Response) => {
    const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
    const messages = await storage.getChatMessages(projectId);
    res.json(messages);
  });

  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const data = insertChatMessageSchema.parse(req.body);
      
      // Save the user message
      await storage.createChatMessage(data);
      
      // Get project context if available
      let projectContext = null;
      if (data.projectId) {
        const project = await storage.getProject(data.projectId);
        const milestones = await storage.getMilestones(data.projectId);
        const issues = await storage.getIssues(data.projectId);
        
        projectContext = {
          project,
          milestones,
          issues
        };
      }
      
      // Get AI response
      const aiResponse = await getAssistantResponse(data.content, projectContext);
      
      // Save the AI response
      const assistantMessage = await storage.createChatMessage({
        projectId: data.projectId,
        role: "assistant",
        content: aiResponse
      });
      
      res.status(201).json(assistantMessage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // Weekly Summary
  app.get("/api/projects/:projectId/weekly-summary", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const milestones = await storage.getMilestones(projectId);
      const issues = await storage.getIssues(projectId);
      const updates = await storage.getUpdates(projectId);
      
      const summary = await generateWeeklySummary(project, milestones, issues, updates);
      
      res.json({ summary });
    } catch (error) {
      console.error("Error generating weekly summary:", error);
      res.status(500).json({ message: "Failed to generate weekly summary" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
