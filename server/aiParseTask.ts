import OpenAI from "openai";
import { storage } from "./storage";
import { Project, Milestone, Issue, Subtask } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  maxRetries: 3,
  timeout: 30000
});

export interface ParsedTask {
  type: "issue" | "subtask";
  title: string;
  description: string;
  milestone?: string;
  priority?: string;
}

export async function parseTaskWithOpenAI(prompt: string, project: Project, milestones: Milestone[]): Promise<ParsedTask> {
  const systemPrompt = `You are a project management AI assistant. Analyze the user's prompt and extract a structured task for the project tracker. If the prompt is vague or incomplete, reply with an error message.`;
  const userPrompt = `Prompt: "${prompt}"

Return a JSON object with:
- type: "issue" or "subtask"
- title: short string
- description: string (optional)
- milestone: string (if mentioned)
- priority: High, Medium, Low (if mentioned)

If the prompt is vague or incomplete, return { error: "..." } with a helpful message.`;
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ];
  const response = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages,
    response_format: { type: "json_object" },
    temperature: 0.2
  });
  let content = response.choices[0]?.message?.content || '{}';
  try {
    return JSON.parse(content);
  } catch {
    // Try to clean up code block formatting
    content = content.replace(/```json|```/gi, '').trim();
    try {
      return JSON.parse(content);
    } catch {
      throw new Error("Failed to parse OpenAI response");
    }
  }
}
