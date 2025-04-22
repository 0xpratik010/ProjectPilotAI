import { Request, Response } from "express";
import { storage } from "./storage";
import { parseTaskWithOpenAI, ParsedTask } from "./aiParseTask";

export async function openaiTaskHandler(req: Request, res: Response) {
  try {
    const { prompt, projectId } = req.body;
    if (!prompt || !projectId) {
      return res.status(400).json({ error: "Missing prompt or projectId" });
    }
    const project = await storage.getProject(Number(projectId));
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    const milestones = await storage.getMilestones(project.id);
    const parsed: ParsedTask | { error: string } = await parseTaskWithOpenAI(prompt, project, milestones);
    if ("error" in parsed) {
      return res.status(400).json({ error: parsed.error });
    }
    let created;
    if (parsed.type === "issue") {
      created = await storage.createIssue({
        projectId: project.id,
        title: parsed.title,
        description: parsed.description || '',
        priority: parsed.priority || 'Medium',
        status: 'Open',
      });
    } else if (parsed.type === "subtask") {
      let milestoneId;
      if (parsed.milestone && typeof parsed.milestone === 'string') {
        const found = milestones.find(m => m.name.toLowerCase() === parsed.milestone.toLowerCase());
        if (!found) {
          return res.status(400).json({ error: `Milestone '${parsed.milestone}' not found in this project.` });
        }
        milestoneId = found.id;
      } else if (milestones.length === 1) {
        milestoneId = milestones[0].id;
      } else {
        return res.status(400).json({ error: "Milestone is required for subtask and was not specified or could not be inferred." });
      }
      // Find the next order for this milestone's subtasks
      const subtasks = await storage.getSubtasks(milestoneId);
      const order = subtasks.length > 0 ? Math.max(...subtasks.map(s => s.order || 0)) + 1 : 1;
      created = await storage.createSubtask({
        milestoneId,
        name: parsed.title,
        description: parsed.description || '',
        status: 'Not Started',
        order,
      });
    } else {
      return res.status(400).json({ error: "Parsed type is not supported." });
    }
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message || String(err) });
  }
}
