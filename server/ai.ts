import OpenAI from "openai";
import { Update, Issue, Project, Milestone, Subtask } from "@shared/schema";
import 'dotenv/config';

type Role = "system" | "user" | "assistant";
interface ChatMessage {
  role: Role;
  content: string;
}

// Initialize OpenAI with fallback and retry logic
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || '',
  maxRetries: 3,
  timeout: 30000
});

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
    const systemPrompt = `You are a project management AI assistant. Your role is to analyze project updates and extract structured information.

Key Responsibilities:
1. Identify affected milestones and subtasks
2. Detect status changes
3. Identify potential issues or risks
4. Track delays and their impact
5. Provide concise summaries

Project Context:
- Project: ${project.name} (${project.status})
- Progress: ${project.progress}%
- Milestones: ${milestones.map(m => `${m.name} (${m.status})`).join(', ')}
- Active Subtasks: ${subtasks.map(s => `${s.name} (${s.status})`).join(', ')}

Guidelines:
- Only extract information that is explicitly mentioned or strongly implied
- Maintain consistency with existing project structure
- Be precise with status changes and delays
- Prioritize actionable insights`;

    const userPrompt = `Analyze this project update and provide structured information:
"${update.content}"

Return a JSON object with:
1. affectedMilestones: Array of {id, name, newStatus?}
2. affectedSubtasks: Array of {id, name, newStatus?}
3. issues: Array of {title, description, priority}
4. statusChanges: Array of {entityType, entityId, oldStatus, newStatus}
5. delayNotifications: Array of {entityType, entityId, entityName, delayDays, reason?}
6. summary: String (concise summary of key points)`;

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // Validate and clean the response
    return {
      affectedMilestones: validateMilestones(result.affectedMilestones || [], milestones),
      affectedSubtasks: validateSubtasks(result.affectedSubtasks || [], subtasks),
      issues: validateIssues(result.issues || []),
      statusChanges: validateStatusChanges(result.statusChanges || []),
      delayNotifications: validateDelays(result.delayNotifications || []),
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

// Validation helpers
function validateMilestones(affected: any[], existing: Milestone[]) {
  return affected.filter(a => 
    existing.some(e => e.id === a.id) &&
    typeof a.name === 'string' &&
    (!a.newStatus || typeof a.newStatus === 'string')
  );
}

function validateSubtasks(affected: any[], existing: Subtask[]) {
  return affected.filter(a => 
    existing.some(e => e.id === a.id) &&
    typeof a.name === 'string' &&
    (!a.newStatus || typeof a.newStatus === 'string')
  );
}

function validateIssues(issues: any[]) {
  return issues.filter(i =>
    typeof i.title === 'string' &&
    typeof i.description === 'string' &&
    ['High', 'Medium', 'Low'].includes(i.priority)
  );
}

function validateStatusChanges(changes: any[]) {
  return changes.filter(c =>
    ['project', 'milestone', 'subtask'].includes(c.entityType) &&
    typeof c.entityId === 'number' &&
    typeof c.oldStatus === 'string' &&
    typeof c.newStatus === 'string'
  );
}

function validateDelays(delays: any[]) {
  return delays.filter(d =>
    ['project', 'milestone', 'subtask'].includes(d.entityType) &&
    typeof d.entityId === 'number' &&
    typeof d.entityName === 'string' &&
    typeof d.delayDays === 'number' &&
    (!d.reason || typeof d.reason === 'string')
  );
}

export async function generateWeeklySummary(
  project: Project, 
  milestones: Milestone[],
  subtasks: Subtask[],
  issues: Issue[],
  updates: Update[]
): Promise<string> {
  try {
    const systemPrompt = `You are a project management AI assistant specialized in creating concise, informative weekly summaries.

Key Focus Areas:
1. Progress highlights
2. Key achievements
3. Current challenges
4. Risk mitigation
5. Next week's priorities

Guidelines:
- Be concise but comprehensive
- Highlight actionable insights
- Focus on key metrics and milestones
- Maintain a professional tone`;

    const userPrompt = `Generate a weekly summary for:

Project: ${project.name}
Status: ${project.status}
Progress: ${project.progress}%

Milestones:
${milestones.map(m => `- ${m.name}: ${m.status}`).join('\n')}

Active Issues (${issues.filter(i => i.status === 'Open').length}):
${issues.filter(i => i.status === 'Open').map(i => `- ${i.title} (${i.priority})`).join('\n')}

Recent Updates:
${updates.slice(0, 5).map(u => `- ${u.content}`).join('\n')}`;

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.3
    });

    return response.choices[0].message.content || "Unable to generate summary.";
  } catch (error) {
    console.error("Error generating weekly summary:", error);
    return "Unable to generate weekly summary. Please try again later.";
  }
}

export async function getAssistantResponse(
  question: string, 
  projectContext?: {
    project: Project;
    milestones: Milestone[];
    issues: Issue[];
    updates: Update[];
  }
): Promise<string> {
  try {
    const systemPrompt = `You are a project management AI assistant with expertise in:
- Project planning and tracking
- Risk management
- Resource allocation
- Timeline optimization
- Issue resolution

Guidelines:
- Provide clear, actionable advice
- Be concise but thorough
- Support answers with project data when available
- Maintain a helpful, professional tone`;

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: question }
    ];

    if (projectContext) {
      messages.splice(1, 0, {
        role: "system",
        content: `Current Project Context:
Project: ${projectContext.project.name}
Status: ${projectContext.project.status}
Progress: ${projectContext.project.progress}%

Milestones:
${projectContext.milestones.map(m => `- ${m.name}: ${m.status}`).join('\n')}

Active Issues:
${projectContext.issues.filter(i => i.status === 'Open').map(i => `- ${i.title} (${i.priority})`).join('\n')}

Recent Updates:
${projectContext.updates.slice(0, 3).map(u => `- ${u.content}`).join('\n')}`
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.3
    });

    return response.choices[0].message.content || "No response generated.";
  } catch (error) {
    console.error("Error getting assistant response:", error);
    return "I apologize, but I'm having trouble processing your request. Please try again or rephrase your question.";
  }
}
