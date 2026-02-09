import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { aiPool, codePool } from '../app/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runQuery(pool: any, query: string) {
  const client = await pool.connect();
  try {
    await client.query(query);
    console.log('Query executed successfully');
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function initializeDatabase() {
  try {
    console.log('Initializing AI database...');
    const aiSchema = readFileSync(
      path.join(__dirname, '../app/models/ai/schema.sql'), 
      'utf8'
    );
    await runQuery(aiPool, aiSchema);
    
    console.log('Initializing Code database...');
    const codeSchema = readFileSync(
      path.join(__dirname, '../app/models/code/schema.sql'), 
      'utf8'
    );
    await runQuery(codePool, codeSchema);
    
    console.log('Both databases initialized successfully!');
  } catch (error) {
    console.error('Failed to initialize databases:', error);
    process.exit(1);
  } finally {
    await aiPool.end();
    await codePool.end();
    process.exit(0);
  }
}

initializeDatabase();
