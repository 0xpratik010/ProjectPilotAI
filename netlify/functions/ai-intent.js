// ai-intent.js
// This module handles AI intent detection and entity extraction for project management actions.
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

/**
 * Detects intent and extracts entities from a natural language command.
 * Returns: { intent: 'create_issue'|'add_subtask'|'unknown', entities: {...} }
 */
async function detectIntent(prompt) {
  const provider = process.env.AI_PROVIDER || 'openai';
  if (provider === 'hf') {
    // Use Hugging Face
    const { detectIntentHF } = require('./ai-intent-hf');
    return await detectIntentHF(prompt);
  }
  // Default: OpenAI
  // Few-shot prompt for intent detection and entity extraction
  const systemPrompt = `
You are an AI assistant for a project management tool. 
Given a user's command, extract the intent and relevant entities. 
Possible intents: create_issue, add_subtask. 
Return a JSON object with 'intent' and 'entities'.

Examples:
Input: "Create an issue in the Mobile Banking App called 'Login fails on iOS'"
Output: { "intent": "create_issue", "entities": { "project": "Mobile Banking App", "issue_title": "Login fails on iOS" } }

Input: "Add a subtask 'Write test cases' to milestone 'Development Phase' in project 'E-Commerce Platform'"
Output: { "intent": "add_subtask", "entities": { "project": "E-Commerce Platform", "milestone": "Development Phase", "subtask": "Write test cases" } }

If the intent is not recognized, return { "intent": "unknown", "entities": {} }
`;

  const completion = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    temperature: 0.1,
    max_tokens: 200
  });

  // Try to parse the response as JSON
  try {
    const responseText = completion.data.choices[0].message.content.trim();
    return JSON.parse(responseText);
  } catch (e) {
    return { intent: 'unknown', entities: {} };
  }
}

module.exports = { detectIntent };
