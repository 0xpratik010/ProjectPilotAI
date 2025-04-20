import { DatabaseStorage } from '../database-storage';
import { addDays } from 'date-fns';
import OpenAI from 'openai';
import { InsertIssue } from '@shared/schema';
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize OpenAI with proper configuration
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || '',
  maxRetries: 3,
  timeout: 30000
});

interface Intent {
  type: 'issue' | 'subtask' | 'query';
  title?: string;
  description?: string;
  priority?: 'High' | 'Medium' | 'Low';
  name?: string;
  owner?: string;
  endDate?: string;
  milestoneId?: number;
  queryType?: 'status' | 'updates' | 'issues';
}

type Role = "system" | "user" | "assistant";
interface ChatMessage {
  role: Role;
  content: string;
}

export class PromptHandler {
  constructor(private storage: DatabaseStorage) {}

  private async determineIntent(prompt: string, projectId: number): Promise<Intent> {
    try {
      const milestones = await this.storage.getMilestones(projectId);
      
      const systemPrompt = `You are a project management AI assistant that helps users manage their projects through natural language commands.
      
Available Commands:
1. Create issues (e.g., "Create an issue for the delay in deployment")
2. Create subtasks (e.g., "Add a subtask to implement login")
3. Query project information (e.g., "Show me the project status")

Available Milestones:
${milestones.map(m => `- ${m.name} (ID: ${m.id})`).join('\n')}

Analyze the user's input and return a JSON object with the following structure:
{
  "type": "issue" | "subtask" | "query",
  // For issues
  "title": "string",
  "description": "string",
  "priority": "High" | "Medium" | "Low",
  // For subtasks
  "name": "string",
  "owner": "string" | null,
  "endDate": "YYYY-MM-DD" | null,
  "milestoneId": number,
  // For queries
  "queryType": "status" | "updates" | "issues"
}`;

      const messages: ChatMessage[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');

      // Validate milestone exists
      if (result.type === 'subtask' && result.milestoneId) {
        const milestone = milestones.find(m => m.id === result.milestoneId);
        if (!milestone) {
          throw new Error(`Milestone with ID ${result.milestoneId} not found`);
        }
      }

      return result;
    } catch (error) {
      console.error("Error determining intent:", error);
      throw error;
    }
  }

  public async handlePrompt(prompt: string, projectId: number) {
    console.log("Handling prompt:", { prompt, projectId });
    try {
      const intent = await this.determineIntent(prompt, projectId);
      console.log("Determined intent:", intent);

      switch (intent.type) {
        case 'issue': {
          console.log("Creating issue");
          const issueData: InsertIssue = {
            projectId,
            title: intent.title!,
            description: intent.description!,
            status: 'Open',
            priority: intent.priority || 'Medium',
            owner: null,
            reportedBy: 'AI Assistant'
          };
          return await this.storage.createIssue(issueData);
        }

        case 'subtask': {
          console.log("Creating subtask with data:", intent);
          const subtaskData = {
            milestoneId: intent.milestoneId!,
            name: intent.name!,
            status: 'Not Started',
            order: 1,
            description: null,
            owner: intent.owner || null,
            endDate: intent.endDate || null,
            emailToSend: null,
            startDate: null
          };

          return await this.storage.createSubtask(subtaskData);
        }

        case 'query': {
          console.log("Handling query");
          switch (intent.queryType) {
            case 'status':
              return await this.storage.getProjectStatus(projectId);
            case 'updates':
              return await this.storage.getProjectUpdates(projectId);
            case 'issues':
              return await this.storage.getProjectIssues(projectId);
            default:
              throw new Error(`Unknown query type: ${intent.queryType}`);
          }
        }

        default:
          throw new Error(`Unknown intent type: ${intent.type}`);
      }
    } catch (error) {
      console.error("Error in handlePrompt:", error);
      throw error;
    }
  }
}
