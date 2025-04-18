import OpenAI from "openai";
import { Update, Issue, Project, Milestone, Subtask } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "sk-dummy-key-for-development" });

interface ProcessedUpdate {
  affectedMilestones: {
    id: number;
    name: string;
    newStatus?: string;
  }[];
  affectedSubtasks: {
    id: number;
    name: string;
    newStatus?: string;
  }[];
  issues: {
    title: string;
    description: string;
    priority: "High" | "Medium" | "Low";
  }[];
  statusChanges: {
    entityType: "project" | "milestone" | "subtask";
    entityId: number;
    oldStatus: string;
    newStatus: string;
  }[];
  delayNotifications: {
    entityType: "project" | "milestone" | "subtask";
    entityId: number;
    entityName: string;
    delayDays: number;
    reason?: string;
  }[];
  summary: string;
}

export async function processNaturalLanguageUpdate(
  update: Update, 
  project: Project, 
  milestones: Milestone[], 
  subtasks: Subtask[]
): Promise<ProcessedUpdate> {
  try {
    const prompt = `
    You are a project management AI assistant. Analyze the following project update message and extract structured information.
    
    PROJECT CONTEXT:
    Project: ${project.name} (${project.status}, ${project.progress}% complete)
    Current Milestones: ${milestones.map(m => `${m.name} (${m.status})`).join(', ')}
    
    PROJECT UPDATE:
    "${update.content}"
    
    Based on this update, provide the following information in JSON format:
    1. Affected milestones with their IDs and any status changes
    2. Affected subtasks with their IDs and any status changes
    3. Any new issues or blockers that should be created
    4. Explicit status changes mentioned (from what to what)
    5. Any delays mentioned and their impact
    6. A brief summary of the update
    
    Only include items that are explicitly or strongly implied in the update.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    return {
      affectedMilestones: result.affectedMilestones || [],
      affectedSubtasks: result.affectedSubtasks || [],
      issues: result.issues || [],
      statusChanges: result.statusChanges || [],
      delayNotifications: result.delayNotifications || [],
      summary: result.summary || "Update processed successfully."
    };
  } catch (error) {
    console.error("Error processing natural language update:", error);
    return {
      affectedMilestones: [],
      affectedSubtasks: [],
      issues: [],
      statusChanges: [],
      delayNotifications: [],
      summary: "Failed to process update."
    };
  }
}

export async function generateWeeklySummary(
  project: Project, 
  milestones: Milestone[],
  subtasks: Subtask[],
  issues: Issue[],
  updates: Update[]
): Promise<string> {
  try {
    const prompt = `
    Generate a concise weekly summary for the following project:
    
    PROJECT DETAILS:
    Name: ${project.name}
    Status: ${project.status}
    Progress: ${project.progress}%
    
    MILESTONES:
    ${milestones.map(m => `- ${m.name}: ${m.status}`).join('\n')}
    
    ACTIVE ISSUES (${issues.filter(i => i.status === 'Open').length}):
    ${issues.filter(i => i.status === 'Open').map(i => `- ${i.title} (${i.priority})`).join('\n')}
    
    RECENT UPDATES:
    ${updates.slice(0, 5).map(u => `- ${u.content}`).join('\n')}
    
    Generate a professional weekly summary that highlights progress, challenges, and next steps.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error generating weekly summary:", error);
    return "Unable to generate weekly summary at this time.";
  }
}

export async function getAssistantResponse(question: string, projectContext?: any): Promise<string> {
  try {
    let prompt = `You are a project management assistant. Answer the following question helpfully and concisely:\n\n${question}`;
    
    if (projectContext) {
      prompt = `
      You are a project management assistant. You have access to the following project information:
      
      PROJECT DETAILS:
      ${JSON.stringify(projectContext.project, null, 2)}
      
      MILESTONES:
      ${JSON.stringify(projectContext.milestones, null, 2)}
      
      ISSUES:
      ${JSON.stringify(projectContext.issues, null, 2)}
      
      Answer the following question helpfully and concisely based on this information:
      
      "${question}"
      `;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error getting assistant response:", error);
    return "I'm sorry, I'm having trouble answering that question right now. Please try again later.";
  }
}
