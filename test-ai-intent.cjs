// test-ai-intent.cjs
// Simple script to test the AI intent API
// Using CommonJS format

const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:5000/api/ai-intent'; // Update port if needed
const SESSION_ID = 'test_session_' + Date.now();

// Test prompts
const testPrompts = [
  "Create an issue called API Integration Bug in Zephyr Migration",
  "Assign it to Pratik M and make it high priority",
  "Add an issue called Mobile App Crash in E-Commerce Platform due in 3 days",
  "Create a bug report for Healthcare Management System and assign it to Balak P"
];

// Function to send a prompt to the AI intent API
async function testPrompt(prompt) {
  console.log(`\n----- Testing Prompt: "${prompt}" -----`);
  console.log(`Session ID: ${SESSION_ID}`);
  
  try {
    const response = await axios.post(API_URL, 
      { prompt }, 
      { headers: { 'x-session-id': SESSION_ID } }
    );
    
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response Data:', error.response.data);
    }
    return null;
  }
}

// Run tests sequentially
async function runTests() {
  console.log('Starting AI Intent API Tests');
  console.log('============================');
  
  for (const prompt of testPrompts) {
    await testPrompt(prompt);
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\nTests completed');
}

// Run the tests
runTests();
