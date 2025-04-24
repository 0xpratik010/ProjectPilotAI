// services/entity-extraction.ts
/**
 * Entity extraction service for AI intent detection
 * Extracts entities like project names, issue titles, assignees, etc. from natural language prompts
 */

/**
 * Extract all relevant entities from a natural language prompt
 */
export function extractEntities(prompt: string): Record<string, string> {
  const entities: Record<string, string> = {};
  
  // Project - multiple patterns for robust matching
  let projectName: string | null = null;
  
  // Pattern 1: "project [name] X" or "project: X"
  const projectMatch = prompt.match(/project(?:\s+name)?[:\s]+['"']?([^'"'\n]+)['"']?/i);
  if (projectMatch) projectName = projectMatch[1].trim();
  
  // Pattern 2: "in [the] X project" or "in X"
  const inProjectMatch = prompt.match(/in\s+(?:the\s+)?['"']?([^'"'\n]+?)(?:\s+project|['"']|$)/i);
  if (inProjectMatch && !projectName) projectName = inProjectMatch[1].trim();
  
  // Pattern 3: "X project" at the end of a sentence
  const projectSuffixMatch = prompt.match(/['"']?([^'"'\n,]+?)\s+project['"']?(?:\s|$|\.|,)/i);
  if (projectSuffixMatch && !projectName) projectName = projectSuffixMatch[1].trim();
  
  // Common project names in your system
  const knownProjects = ['Zephyr Migration', 'E-Commerce Platform', 'Mobile Banking App', 'Healthcare Management System'];
  
  // Check if the extracted name contains or is contained by a known project
  if (projectName) {
    // Check for exact or partial matches with known projects
    const exactMatch = knownProjects.find(p => 
      p.toLowerCase() === projectName!.toLowerCase()
    );
    
    if (exactMatch) {
      projectName = exactMatch; // Use the exact casing from known projects
    } else {
      // Check for partial matches
      const partialMatch = knownProjects.find(p => 
        p.toLowerCase().includes(projectName!.toLowerCase()) || 
        projectName!.toLowerCase().includes(p.toLowerCase())
      );
      
      if (partialMatch) {
        projectName = partialMatch; // Use the known project name instead
      }
    }
    
    console.log(`Found project: "${projectName}" in prompt: "${prompt}"`);
    entities.project = projectName;
  }
  
  // Issue title
  const issueMatch = prompt.match(/issue(?: called| name)? ['"]?([^'"\n]+)['"]?/i);
  if (issueMatch) entities.issue_title = issueMatch[1].trim();
  
  // Milestone
  const milestoneMatch = prompt.match(/milestone ['"]?([^'"\n]+)['"]?/i);
  if (milestoneMatch) entities.milestone = milestoneMatch[1].trim();
  
  // Subtask
  const subtaskMatch = prompt.match(/subtask ['"]?([^'"\n]+)['"]?/i);
  if (subtaskMatch) entities.subtask = subtaskMatch[1].trim();
  
  // Assignee - multiple patterns
  let assignee = null;
  
  // Pattern 1: "assign to X" or "assigned to X"
  const assignPattern = prompt.match(/assign(?:ed)?(?: to)? ([^,\n.]+)/i);
  if (assignPattern) assignee = assignPattern[1].trim();
  
  // Pattern 2: "assignee: X" or "assignee=X"
  const assigneeColonPattern = prompt.match(/assignee[:=]?\s*([^,\n.]+)/i);
  if (assigneeColonPattern) assignee = assigneeColonPattern[1].trim();
  
  // Pattern 3: Just the name by itself on a line or after other fields
  const namePattern = prompt.match(/(?:^|\s|,|and|\n)\s*((?:Balak|Pratik)\s*[A-Z]?)(?:\s|$|,|\.|\n)/i);
  if (namePattern) assignee = namePattern[1].trim();
  
  // Set the assignee if found by any pattern
  if (assignee) {
    console.log(`Found assignee: "${assignee}" in prompt: "${prompt}"`);
    entities.assignee = assignee;
  }
  
  // Due date
  const dueMatch = prompt.match(/due(?: date)?[:=]?\s*([0-9\/-]+|in [^,\n]+)/i);
  if (dueMatch) entities.dueDate = dueMatch[1].trim();
  
  // Date in format like 24/04
  const dateMatch = prompt.match(/([0-9]{1,2}\/[0-9]{1,2})/);
  if (dateMatch && !entities.dueDate) entities.dueDate = dateMatch[1];
  
  // Priority extraction
  const priorityMatch = prompt.match(/(?:high|medium|low)(?:\s+|-)priority/i);
  if (priorityMatch) {
    const priority = priorityMatch[0].toLowerCase().replace(/\s+|-priority/g, '');
    console.log(`Found priority: "${priority}" in prompt: "${prompt}"`);
    entities.priority = priority;
  } else if (prompt.match(/urgent|critical|important/i)) {
    console.log(`Found high priority keywords in prompt: "${prompt}"`);
    entities.priority = 'high';
  }
  
  // Alias population for robust downstream compatibility
  if (entities.project && !entities.projectName) entities.projectName = entities.project;
  if (entities.projectName && !entities.project) entities.project = entities.projectName;
  if (entities.issue_title && !entities.title) entities.title = entities.issue_title;
  if (entities.title && !entities.issue_title) entities.issue_title = entities.title;
  if (entities.dueDate && !entities.due_date) entities.due_date = entities.dueDate;
  if (entities.due_date && !entities.dueDate) entities.dueDate = entities.due_date;
  return entities;
}
