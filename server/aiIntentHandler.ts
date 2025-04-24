// aiIntentHandler.ts
import { Request, Response } from "express";
import { storage } from "./storage";
import { extractEntities } from "./services/entity-extraction";

// In-memory session store for multi-turn conversations
const conversationState: Record<string, any> = {};

/**
 * AI Intent Handler - Processes natural language commands to create issues or add subtasks
 */
export async function aiIntentHandler(req: Request, res: Response) {
  const { prompt } = req.body;
  // Use sessionId from header or fallback to a static demo value
  const sessionId = req.headers['x-session-id'] as string || 'demo-session';
  
  console.log(`[SESSION ${sessionId}] Received prompt: ${prompt}`);
  
  if (!prompt) {
    return res.status(400).json({ message: 'Missing prompt in request body.' });
  }
  
  try {
    // Get previous state for this session
    if (!conversationState[sessionId]) {
      console.log(`[SESSION ${sessionId}] Creating new session state`);
      conversationState[sessionId] = {};
    } else {
      console.log(`[SESSION ${sessionId}] Existing state:`, conversationState[sessionId]);
    }
    const prevState = conversationState[sessionId];

    // Extract entities from the prompt
    const entities = extractEntities(prompt);
    console.log(`[SESSION ${sessionId}] Extracted entities:`, entities);
    
    // Merge with previous state, only overwrite with non-empty values
    const merged = { ...prevState };
    for (const [key, value] of Object.entries(entities)) {
      if (value !== undefined && value !== null && value !== "") {
        merged[key] = value;
      }
    }
    // Alias support for backward compatibility
    if (!merged.project && merged.projectName) merged.project = merged.projectName;
    if (!merged.issue_title && merged.title) merged.issue_title = merged.title;
    if (!merged.dueDate && merged.due_date) merged.dueDate = merged.due_date;
    console.log(`[SESSION ${sessionId}] Merged state:`, merged);

    // Determine intent based on entities
    let intent = 'unknown';
    if (merged.project && merged.issue_title) {
      intent = 'create_issue';
    } else if (merged.project && merged.milestone && merged.subtask) {
      intent = 'add_subtask';
    }

    // Determine required fields for each intent
    let requiredFields: string[] = [];
    if (intent === 'create_issue') {
      requiredFields = ['project', 'issue_title', 'assignee', 'dueDate'];
    } else if (intent === 'add_subtask') {
      requiredFields = ['project', 'milestone', 'subtask', 'assignee', 'dueDate'];
    }

    // Find missing fields
    const missingFields = requiredFields.filter(f => !merged[f]);
    console.log(`[SESSION ${sessionId}] Missing fields:`, missingFields);

    if (intent === 'create_issue' && missingFields.length === 0) {
      // All data collected, proceed to create issue
      try {
        // Find project by name with detailed logging
        const projects = await storage.getProjects();
        console.log(`[DEBUG] All projects:`, projects.map(p => ({ id: p.id, name: p.name })));
        console.log(`[DEBUG] Looking for project with name: "${merged.project}"`);
        
        // More flexible project matching
        const projectNameLower = (merged.project || '').toLowerCase();
        let project = null;
        
        // Exact match
        project = projects.find(p => p.name.toLowerCase() === projectNameLower);
        
        // Partial match if no exact match found
        if (!project) {
          console.log(`[DEBUG] No exact match found, trying partial match`);
          project = projects.find(p => p.name.toLowerCase().includes(projectNameLower) || 
                                     projectNameLower.includes(p.name.toLowerCase()));
        }
        
        console.log(`[DEBUG] Project match result:`, project ? { id: project.id, name: project.name } : 'Not found');
        
        if (!project) {
          return res.status(404).json({ message: 'Project not found.' });
        }
        
        // Create issue in database with detailed logging
        // Prepare and validate InsertIssue payload
        const issuePayload = {
          projectId: project.id,
          title: merged.issue_title,
          description: merged.description || '',
          status: 'open', // DB expects lowercase for status
          priority: merged.priority ? String(merged.priority).charAt(0).toUpperCase() + String(merged.priority).slice(1).toLowerCase() : 'Medium', // Capitalize first letter
          owner: merged.assignee || '',
          source: 'ai',
          reportedBy: 'AI Assistant',
        };
        console.log(`[DEBUG] Creating issue with validated payload:`, issuePayload);
        
        try {
          const newIssue = await storage.createIssue(issuePayload);
          console.log(`[DEBUG] Issue created successfully:`, newIssue);
          
          // Clear state
          delete conversationState[sessionId];
          
          return res.status(201).json({ 
            message: `Issue "${merged.issue_title}" created in project "${project.name}".`, 
            issue: newIssue,
            project: project.name,
            projectId: project.id,
            success: true
          });
        } catch (error) {
          console.error(`[ERROR] Failed to create issue:`, error);
          return res.status(500).json({ 
            message: 'Failed to create issue in database.', 
            error: String(error),
            success: false
          });
        }
      } catch (error) {
        console.error('Error creating issue:', error);
        return res.status(500).json({ message: 'Failed to create issue in database.', error: String(error) });
      }
    } else if (intent === 'add_subtask' && missingFields.length === 0) {
      // All data collected, proceed to add subtask
      try {
        // Find project and milestone
        const projects = await storage.getProjects();
        const project = projects.find(p => 
          p.name.toLowerCase() === (merged.project || '').toLowerCase()
        );
        
        if (!project) {
          return res.status(404).json({ message: 'Project not found.' });
        }
        
        const milestones = await storage.getMilestones(project.id);
        const milestone = milestones.find(m => 
          m.name.toLowerCase() === (merged.milestone || '').toLowerCase()
        );
        
        if (!milestone) {
          return res.status(404).json({ message: 'Milestone not found in project.' });
        }
        
        // Create subtask in database
        const newSubtask = await storage.createSubtask({
          milestoneId: milestone.id,
          name: merged.subtask, // Use subtask description as name
          description: merged.subtask,
          status: 'not_started',
          owner: merged.assignee,
          dueDate: merged.dueDate,
          order: 1, // Default order
        });
        
        console.log(`Added subtask to milestone "${milestone.name}" in project "${project.name}":`, newSubtask);
        
        // Clear state
        delete conversationState[sessionId];
        
        return res.status(201).json({ 
          message: `Subtask added to milestone "${milestone.name}" in project "${project.name}".`, 
          subtask: newSubtask,
          milestone: milestone.name,
          project: project.name
        });
      } catch (error) {
        console.error('Error creating subtask:', error);
        return res.status(500).json({ message: 'Failed to create subtask in database.', error: String(error) });
      }
    } else if (requiredFields.length > 0 && missingFields.length > 0) {
      // Still missing fields, update state and prompt user
      conversationState[sessionId] = merged;
      console.log(`[SESSION ${sessionId}] Asking for missing fields: ${missingFields.join(', ')}`);
      return res.status(200).json({ 
        message: `Please provide: ${missingFields.join(', ')}`, 
        missingFields, 
        collected: merged, 
        sessionId,
        success: true,
        followUp: true
      });
    } else {
      // Intent not recognized or not supported
      return res.status(200).json({ 
        message: 'Intent not recognized or not supported.', 
        entities 
      });
    }
  } catch (error) {
    console.error('AI Intent Error:', error);
    return res.status(500).json({ message: 'Failed to process AI intent.', error: String(error) });
  }
}
