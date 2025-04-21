import { Request, Response } from "express";
import OpenAI from "openai";
import { storage } from "./storage";
import 'dotenv/config';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// In-memory session store for conversational state (for demo; use Redis/db for production)
const sessionState: Record<string, any> = {};

type QuickUpdateType = "issue" | "subtask";
const REQUIRED_FIELDS: Record<QuickUpdateType, string[]> = {
  issue: ["title", "description", "priority", "assignee", "dueDate", "projectName"],
  subtask: ["title", "description", "parentTaskId", "assignee", "dueDate", "projectName"],
};

function getMissingFields(type: QuickUpdateType, data: Record<string, any>) {
  return REQUIRED_FIELDS[type]?.filter((field: string) => !data[field]);
}

export async function aiQuickUpdateHandler(req: Request, res: Response) {
  const { prompt, sessionId } = req.body;
  if (!prompt || !sessionId) {
    return res.status(400).json({ success: false, message: "Prompt and sessionId are required." });
  }

  // Get or initialize session data
  let session = sessionState[sessionId] || { type: null, data: {} };

  // Using OpenAI API
  const systemPrompt = `You are an assistant for a project management tool. Users give you natural language prompts to add issues or subtasks.

Your job is to extract information from the prompt and return ONLY a valid JSON object with no additional text or formatting.

Extract these fields:
- type: Always "issue" unless explicitly mentioned as a subtask
- title: The main title of the issue (use the main problem described)
- description: A brief description (can be same as title if not specified)
- priority: "High", "Medium", or "Low" (default to "Medium" if not specified)
- assignee: Who it's assigned to (look for "assigned to X")
- dueDate: When it's due (as provided in the prompt)
- projectName: Which project it belongs to (look for "in X project")

YOUR RESPONSE MUST BE VALID JSON IN THIS EXACT FORMAT:
{
  "type": "issue",
  "data": {
    "title": "...",
    "description": "...",
    "priority": "...",
    "assignee": "...",
    "dueDate": "...",
    "projectName": "..."
  },
  "missing": []
}

If information is missing, include the field names in the "missing" array.
DO NOT include any explanation, markdown formatting, or code blocks - ONLY the JSON object.`;

  // Function to extract valid JSON from text
  function extractValidJson(text: string): any {
    // Try direct parsing first
    try {
      return JSON.parse(text);
    } catch (e) {
      // Remove code block markers and trim
      let cleaned = text.replace(/```json|```/gi, '').trim();
      try {
        return JSON.parse(cleaned);
      } catch (e) {
        // Find the first { and last } in the string
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          try {
            return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
          } catch (e) {
            // Last resort: manually build a minimal valid JSON
            console.error("Failed to parse JSON after multiple attempts. Raw content:", text);
            return { 
              type: "issue",
              data: {},
              missing: ["title", "description", "priority", "assignee", "dueDate", "projectName"]
            };
          }
        } else {
          console.error("No JSON object found in response. Raw content:", text);
          return { 
            type: "issue",
            data: {},
            missing: ["title", "description", "priority", "assignee", "dueDate", "projectName"]
          };
        }
      }
    }
  }

  let aiResponse: any;
  try {
    // Call OpenAI API with explicit timeout and retry
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }, // Explicitly request JSON format
      max_tokens: 1000, // Limit token count to avoid incomplete responses
    });
    
    // Log the entire completion object for debugging
    console.log("[OpenAI Completion Object]", JSON.stringify(completion, null, 2));
    
    // Safely extract content with fallbacks
    const rawContent = completion.choices && 
                      completion.choices[0] && 
                      completion.choices[0].message && 
                      completion.choices[0].message.content ? 
                      completion.choices[0].message.content : '{}';
    
    console.log("[OpenAI Quick Update RAW RESPONSE]", rawContent);
    
    // Try to parse the response, with multiple fallbacks
    try {
      aiResponse = extractValidJson(rawContent);
      
      // Verify the response has the expected structure
      if (!aiResponse || typeof aiResponse !== 'object' || !aiResponse.type) {
        console.warn("Invalid AI response structure, using fallback", aiResponse);
        aiResponse = {
          type: "issue",
          data: {},
          missing: ["title", "description", "priority", "assignee", "dueDate", "projectName"]
        };
      }
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      // Provide a default response when parsing fails
      aiResponse = {
        type: "issue",
        data: {},
        missing: ["title", "description", "priority", "assignee", "dueDate", "projectName"]
      };
    }
  } catch (e) {
    console.error("OpenAI API error:", e);
    return res.status(500).json({ success: false, message: "OpenAI API error: " + (e as Error).message });
  }

  // Defensive: Ensure aiResponse is an object with expected keys
  if (!aiResponse || typeof aiResponse !== 'object') {
    return res.status(500).json({ success: false, message: "AI response was not understood. Please rephrase your request." });
  }
  // Defensive: Fallback to empty data if not present
  const aiType = aiResponse.type || session.type;
  const aiData = aiResponse.data && typeof aiResponse.data === 'object' ? aiResponse.data : {};
  session.type = aiType;
  session.data = { ...session.data, ...aiData };
  const missing = Array.isArray(aiResponse.missing) ? aiResponse.missing : getMissingFields(session.type, session.data);

  if (!session.type || !REQUIRED_FIELDS[session.type]) {
    return res.status(400).json({ success: false, message: "Could not determine if this is an issue or subtask. Please clarify your intent." });
  }

  if (missing && missing.length > 0) {
    // Save session and ask follow-up
    sessionState[sessionId] = session;
    return res.json({
      success: true,
      followUp: true,
      missing,
      question: `Please provide: ${missing.join(", ")}`,
      sessionId,
      data: session.data,
    });
  }

  // All fields present: create record in DB
  let created;
  try {
    // Map the collected data to the database schema
    if (session.type === "issue") {
      // Find project ID from project name
      const projects = await storage.getProjects();
      const project = projects.find(p => 
        p.name.toLowerCase() === session.data.projectName?.toLowerCase() ||
        p.name.toLowerCase().includes(session.data.projectName?.toLowerCase())
      );
      
      if (!project) {
        return res.status(400).json({ 
          success: false, 
          message: `Project '${session.data.projectName}' not found. Please specify a valid project name.` 
        });
      }

      // Format due date if it's not a proper date
      let dueDate = session.data.dueDate;
      if (dueDate && typeof dueDate === 'string' && !dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Handle relative dates like "tomorrow", "in 2 days", etc.
        const today = new Date();
        if (dueDate.toLowerCase().includes('tomorrow')) {
          today.setDate(today.getDate() + 1);
          dueDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        } else if (dueDate.toLowerCase().includes('day')) {
          // Extract number from strings like "2 days"
          const days = parseInt(dueDate.match(/\d+/)?.[0] || '1');
          today.setDate(today.getDate() + days);
          dueDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        }
      }

      // Map the data to the database schema
      const issueData: any = {
        projectId: project.id,
        title: session.data.title,
        // Auto-generate description if missing
        description: session.data.description || `${session.data.title} (auto-generated)`,
        // Normalize priority (case-insensitive)
        priority: typeof session.data.priority === 'string' 
          ? session.data.priority.charAt(0).toUpperCase() + session.data.priority.slice(1).toLowerCase()
          : 'Medium',
        // Map assignee to owner
        owner: session.data.assignee,
        // Set source to AI
        source: 'ai',
      };

      // Add due date if provided
      if (dueDate) {
        issueData.dueDate = dueDate;
      }

      console.log("Creating issue with data:", issueData);
      created = await storage.createIssue(issueData);
    } else if (session.type === "subtask") {
      // Similar mapping for subtasks
      // Find project ID from project name
      const projects = await storage.getProjects();
      const project = projects.find(p => 
        p.name.toLowerCase() === session.data.projectName?.toLowerCase() ||
        p.name.toLowerCase().includes(session.data.projectName?.toLowerCase())
      );
      
      if (!project) {
        return res.status(400).json({ 
          success: false, 
          message: `Project '${session.data.projectName}' not found. Please specify a valid project name.` 
        });
      }

      // Find milestone from parentTaskId if provided
      let milestoneId;
      if (session.data.parentTaskId) {
        const milestones = await storage.getMilestones(project.id);
        const milestone = milestones.find(m => 
          m.name.toLowerCase() === session.data.parentTaskId?.toLowerCase() ||
          m.name.toLowerCase().includes(session.data.parentTaskId?.toLowerCase())
        );
        if (milestone) {
          milestoneId = milestone.id;
        }
      }

      // Format due date if it's not a proper date
      let dueDate = session.data.dueDate;
      if (dueDate && typeof dueDate === 'string' && !dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Handle relative dates like "tomorrow", "in 2 days", etc.
        const today = new Date();
        if (dueDate.toLowerCase().includes('tomorrow')) {
          today.setDate(today.getDate() + 1);
          dueDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        } else if (dueDate.toLowerCase().includes('day')) {
          // Extract number from strings like "2 days"
          const days = parseInt(dueDate.match(/\d+/)?.[0] || '1');
          today.setDate(today.getDate() + days);
          dueDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        }
      }

      // Map the data to the database schema
      const subtaskData: any = {
        milestoneId: milestoneId,
        name: session.data.title,
        description: session.data.description,
        assignedTo: session.data.assignee,
        order: 1, // Default order
      };

      // Add due date if provided
      if (dueDate) {
        subtaskData.dueDate = dueDate;
      }

      console.log("Creating subtask with data:", subtaskData);
      created = await storage.createSubtask(subtaskData);
    }
  } catch (e) {
    console.error("Error creating record:", e);
    return res.status(500).json({ success: false, message: `Failed to create ${session.type}: ${(e as Error).message}` });
  }
  // Clear session
  delete sessionState[sessionId];
  return res.json({ success: true, created, message: `${session.type} created successfully.` });
}
