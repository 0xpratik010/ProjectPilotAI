require('dotenv').config();

// Print only the hostname part of the DATABASE_URL to avoid exposing credentials
const dbUrl = process.env.DATABASE_URL || '';
if (dbUrl) {
  try {
    const url = new URL(dbUrl);
    console.log('Database hostname:', url.hostname);
    console.log('Database protocol:', url.protocol);
  } catch (err) {
    console.error('Invalid DATABASE_URL format:', err.message);
  }
} else {
  console.error('DATABASE_URL is not set');
}
