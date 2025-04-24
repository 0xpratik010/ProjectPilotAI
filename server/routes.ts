import express, { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { processNaturalLanguageUpdate, generateWeeklySummary, getAssistantResponse } from "./ai";
import { generateAndSendReport } from "./reports";
import { insertProjectSchema, insertMilestoneSchema, insertSubtaskSchema, insertIssueSchema, insertUpdateSchema, insertChatMessageSchema } from "@shared/schema";
import { z } from "zod";
import { PromptHandler } from "./services/prompt-handler";
import { aiQuickUpdateHandler } from "./aiQuickUpdate";
import { openaiTaskHandler } from "./openaiTaskHandler";
import { aiIntentHandler } from "./aiIntentHandler";

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(express.json());

  // AI Quick Update
  app.post("/api/ai/quick-update", aiQuickUpdateHandler);

  // OpenAI Natural Language Task Creation
  app.post("/api/ai/parse-task", openaiTaskHandler);
  
  // AI Intent Detection for creating issues and subtasks
  app.post("/api/ai-intent", aiIntentHandler);

  // Projects
  app.get("/api/projects", async (req: Request, res: Response) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error getting projects:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json(project);
    } catch (error) {
      console.error("Error getting project:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/projects", async (req: Request, res: Response) => {
    try {
      // Accepts: {...projectFields, people: [...], timeline: [...]}
      const { people, timeline, ...projectData } = req.body;
      const data = insertProjectSchema.parse(projectData);
      // people/timeline validated in backend, skip here for flexibility
      const project = await storage.createProject({ ...data, people, timeline });
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  // Project People CRUD
  app.get("/api/projects/:projectId/people", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const people = await storage.getProjectPeople(projectId);
      res.json(people);
    } catch (error) {
      console.error("Error getting project people:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/projects/:projectId/people", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const person = { ...req.body, projectId };
      // TODO: validate person fields if needed
      const created = await storage.addProjectPerson(person);
      res.status(201).json(created);
    } catch (error) {
      console.error("Error adding project person:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/people/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateProjectPerson(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating project person:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/people/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.removeProjectPerson(id);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting project person:", error);
      res.status(500).json({ error: "Internal server error" });
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
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProject(id);
      
      if (!success) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Milestones
  app.get("/api/projects/:projectId/milestones", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const milestones = await storage.getMilestones(projectId);
      res.json(milestones);
    } catch (error) {
      console.error("Error getting milestones:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/milestones/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const milestone = await storage.getMilestone(id);
      
      if (!milestone) {
        return res.status(404).json({ message: "Milestone not found" });
      }
      
      res.json(milestone);
    } catch (error) {
      console.error("Error getting milestone:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/milestones", async (req: Request, res: Response) => {
    try {
      // Accepts all milestone fields, including color, isCritical, etc.
      const data = insertMilestoneSchema.parse(req.body);
      const milestone = await storage.createMilestone(data);
      res.status(201).json(milestone);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      if (error instanceof Error && error.message.includes('subtasks')) {
        return res.status(400).json({ message: error.message });
      }
      console.error("Error creating milestone:", error);
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
      if (error instanceof Error && error.message.includes('subtasks')) {
        return res.status(400).json({ message: error.message });
      }
      console.error("Error updating milestone:", error);
      res.status(500).json({ message: "Failed to update milestone" });
    }
  });

  app.delete("/api/milestones/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMilestone(id);
      
      if (!success) {
        return res.status(404).json({ message: "Milestone not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting milestone:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Subtasks
  app.get("/api/milestones/:id/subtasks", async (req, res) => {
    try {
      const subtasks = await storage.getSubtasks(Number(req.params.id));
      res.json(subtasks);
    } catch (error) {
      console.error("Error getting subtasks:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/milestones/:id/issues", async (req, res) => {
    try {
      const milestoneId = Number(req.params.id);
      // Get all issues for the project that this milestone belongs to
      const milestone = await storage.getMilestone(milestoneId);
      if (!milestone) {
        return res.status(404).json({ message: "Milestone not found" });
      }
      
      // Get all issues for the project
      const allIssues = await storage.getIssues(milestone.projectId);
      
      // Filter issues that are related to this milestone
      const milestoneIssues = allIssues.filter(issue => issue.milestoneId === milestoneId);
      res.json(milestoneIssues);
    } catch (error) {
      console.error("Error getting milestone issues:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/subtasks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const subtask = await storage.getSubtask(id);
      
      if (!subtask) {
        return res.status(404).json({ message: "Subtask not found" });
      }
      
      res.json(subtask);
    } catch (error) {
      console.error("Error getting subtask:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/milestones/:id/subtasks", async (req, res) => {
    try {
      const data = insertSubtaskSchema.parse({
        ...req.body,
        milestoneId: Number(req.params.id),
        // Allow status/assignedTo/dueDate from body, fallback to defaults
        status: req.body.status || "not_started",
        assignedTo: req.body.assignedTo || null,
        dueDate: req.body.dueDate || null,
        order: req.body.order || 1
      });
      const result = await storage.createSubtask(data);
      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating subtask:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", errors: error.errors });
      }
      res.status(400).json({ error: "Bad request", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/subtasks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const subtask = await storage.getSubtask(id);
      
      if (!subtask) {
        return res.status(404).json({ message: "Subtask not found" });
      }
      
      // Check if the request has a 'data' property (from frontend mutation)
      const updateData = req.body.data || req.body;
      
      // Make sure we have data to update
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No update data provided" });
      }
      
      const data = insertSubtaskSchema.partial().parse(updateData);
      const updatedSubtask = await storage.updateSubtask(id, data);
      res.json(updatedSubtask);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating subtask:", error);
      res.status(500).json({ message: "Failed to update subtask" });
    }
  });

  app.delete("/api/subtasks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteSubtask(id);
      
      if (!success) {
        return res.status(404).json({ message: "Subtask not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting subtask:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Issues
  app.get("/api/projects/:projectId/issues", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const issues = await storage.getIssues(projectId);
      res.json(issues);
    } catch (error) {
      console.error("Error getting project issues:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/issues/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const issue = await storage.getIssue(id);
      
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }
      
      res.json(issue);
    } catch (error) {
      console.error("Error getting issue:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/issues", async (req: Request, res: Response) => {
    try {
      // Accepts milestoneId, subtaskId, severity, source, etc.
      const data = insertIssueSchema.parse(req.body);
      const issue = await storage.createIssue(data);
      res.status(201).json(issue);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating issue:", error);
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
      console.error("Error updating issue:", error);
      res.status(500).json({ message: "Failed to update issue" });
    }
  });

  app.delete("/api/issues/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteIssue(id);
      
      if (!success) {
        return res.status(404).json({ message: "Issue not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting issue:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Updates
  app.get("/api/projects/:projectId/updates", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const updates = await storage.getUpdates(projectId);
      res.json(updates);
    } catch (error) {
      console.error("Error getting updates:", error);
      res.status(500).json({ error: "Internal server error" });
    }
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
    try {
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      const messages = await storage.getChatMessages(projectId);
      res.json(messages);
    } catch (error) {
      console.error("Error getting chat messages:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const data = insertChatMessageSchema.parse(req.body);
      
      // Save the user message
      await storage.createChatMessage(data);
      
      // Get project context if available
      let projectContext = undefined;
      if (data.projectId) {
        try {
          const [project, milestones, issues, updates] = await Promise.all([
            storage.getProject(data.projectId),
            storage.getMilestones(data.projectId),
            storage.getIssues(data.projectId),
            storage.getUpdates(data.projectId)
          ]);

          if (project && milestones && issues && updates) {
            projectContext = {
              project,
              milestones,
              issues,
              updates
            };
          }
        } catch (error) {
          console.error("Error fetching project context:", error);
          // Continue without context if there's an error
        }
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
      console.error("Error processing chat message:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // AI Project Assistant
  app.post("/api/projects/:id/assistant", async (req, res) => {
    try {
      console.log("Received assistant request:", {
        projectId: req.params.id,
        body: req.body
      });

      const projectId = Number(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }

      // Verify project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const { prompt } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: "Prompt is required and must be a string" });
      }

      const promptHandler = new PromptHandler(storage);
      const result = await promptHandler.handlePrompt(prompt, projectId);
      console.log("Assistant response:", result);

      res.json({ result });
    } catch (error) {
      console.error("Error handling prompt:", error);
      if (error instanceof Error && error.message.includes("Milestone")) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ 
        error: "Internal server error", 
        details: error instanceof Error ? error.message : String(error) 
      });
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
      
      const subtasks = [];
      for (const milestone of milestones) {
        const milestoneSubtasks = await storage.getSubtasks(milestone.id);
        subtasks.push(...milestoneSubtasks);
      }
      
      const summary = await generateWeeklySummary(project, milestones, subtasks, issues, updates);
      
      res.json({ summary });
    } catch (error) {
      console.error("Error generating weekly summary:", error);
      res.status(500).json({ message: "Failed to generate weekly summary" });
    }
  });
  
  // Generate and send report
  app.post("/api/reports/generate", async (req: Request, res: Response) => {
    try {
      const reportSchema = z.object({
        projectId: z.number(),
        reportDate: z.string(),
        reportType: z.enum(['weekly', 'milestone', 'status']),
        recipients: z.array(z.string().email())
      });
      
      const data = reportSchema.parse(req.body);
      
      const result = await generateAndSendReport({
        projectId: data.projectId,
        reportDate: data.reportDate,
        reportType: data.reportType,
        recipients: data.recipients
      });
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error("Error generating report:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false, 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to generate report" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
