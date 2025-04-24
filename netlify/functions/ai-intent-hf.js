// ai-intent-hf.js
// Hugging Face Transformers intent detection using the Inference API
const axios = require('axios');

// Helper: extract all entities from a prompt
function extractEntities(prompt) {
  const entities = {};
  // Project
  const projectMatch = prompt.match(/project(?: name)? ['"]?([^'"\n]+)['"]?/i);
  if (projectMatch) entities.project = projectMatch[1].trim();
  // Issue title
  const issueMatch = prompt.match(/issue(?: called| name)? ['"]?([^'"\n]+)['"]?/i);
  if (issueMatch) entities.issue_title = issueMatch[1].trim();
  // Milestone
  const milestoneMatch = prompt.match(/milestone ['"]?([^'"\n]+)['"]?/i);
  if (milestoneMatch) entities.milestone = milestoneMatch[1].trim();
  // Subtask
  const subtaskMatch = prompt.match(/subtask ['"]?([^'"\n]+)['"]?/i);
  if (subtaskMatch) entities.subtask = subtaskMatch[1].trim();
  // Assignee - more robust patterns
  // Try multiple patterns to catch different ways of specifying assignee
  let assignee = null;
  
  // Pattern 1: "assign to X" or "assigned to X"
  const assignPattern = prompt.match(/assign(?:ed)?(?: to)? ([^,\n.]+)/i);
  if (assignPattern) assignee = assignPattern[1].trim();
  
  // Pattern 2: "assignee: X" or "assignee=X"
  const assigneeColonPattern = prompt.match(/assignee[:=]?\s*([^,\n.]+)/i);
  if (assigneeColonPattern) assignee = assigneeColonPattern[1].trim();
  
  // Pattern 3: Just the name "Balak P" by itself on a line or after other fields
  const namePattern = prompt.match(/(?:^|\s|,|and|\n)\s*(Balak\s*P)(?:\s|$|,|\.|\n)/i);
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
  
  return entities;
}


// You can set this to any zero-shot or intent classification model on HF Hub
const HF_API_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-mnli';
const HF_API_TOKEN = process.env.HF_API_TOKEN || null; // Optional, for higher limits

/**
 * Detects intent and extracts entities using Hugging Face Inference API.
 * Returns: { intent: ..., entities: {...} }
 */
async function detectIntentHF(prompt) {
  // Extract entities from user reply (robust, multi-field)
  const entities = extractEntities(prompt);

  // Define possible intents and entity patterns
  const labels = ['create_issue', 'add_subtask'];
  // Zero-shot classification
  const response = await axios.post(
    HF_API_URL,
    { inputs: prompt, parameters: { candidate_labels: labels } },
    HF_API_TOKEN ? { headers: { Authorization: `Bearer ${HF_API_TOKEN}` } } : {}
  );
  const result = response.data;
  let intent = 'unknown';
  if (result && result.labels && result.labels.length > 0) {
    intent = result.labels[0];
    if (result.scores && result.scores[0] < 0.5) intent = 'unknown';
  }
  // Always return all entities found, regardless of intent
  return { intent, entities };
}

module.exports = { detectIntentHF };
