// This script will help you update your .env file with a new DATABASE_URL
// Run this script with: node update-db-url.js "your-new-connection-string"

const fs = require('fs');
const path = require('path');

const newDbUrl = process.argv[2];

if (!newDbUrl) {
  console.error('Please provide a new DATABASE_URL as an argument');
  console.error('Example: node update-db-url.js "postgresql://user:password@hostname:port/dbname"');
  process.exit(1);
}

// Path to .env file
const envPath = path.join(__dirname, '.env');

try {
  // Read the current .env file
  let envContent = '';
  try {
    envContent = fs.readFileSync(envPath, 'utf8');
  } catch (err) {
    // If .env doesn't exist, create an empty one
    console.log('.env file not found, creating a new one');
  }

  // Replace or add the DATABASE_URL
  const dbUrlRegex = /^DATABASE_URL=.*/m;
  if (dbUrlRegex.test(envContent)) {
    // Replace existing DATABASE_URL
    envContent = envContent.replace(dbUrlRegex, `DATABASE_URL=${newDbUrl}`);
  } else {
    // Add DATABASE_URL if it doesn't exist
    envContent += `\nDATABASE_URL=${newDbUrl}`;
  }

  // Write the updated content back to .env
  fs.writeFileSync(envPath, envContent);
  console.log('Successfully updated DATABASE_URL in .env file');
} catch (err) {
  console.error('Error updating .env file:', err.message);
  process.exit(1);
}
