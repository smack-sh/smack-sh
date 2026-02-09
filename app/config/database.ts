import { Pool } from 'pg';
import { config } from 'dotenv';

// Load environment variables
config();

// AI Database Configuration
export const aiPool = new Pool({
  user: process.env.AI_DB_USER || 'postgres',
  host: process.env.AI_DB_HOST || 'localhost',
  database: process.env.AI_DB_NAME || 'smack_ai',
  password: process.env.AI_DB_PASSWORD || 'postgres',
  port: parseInt(process.env.AI_DB_PORT || '5432'),
});

// Code Database Configuration
export const codePool = new Pool({
  user: process.env.CODE_DB_USER || 'postgres',
  host: process.env.CODE_DB_HOST || 'localhost',
  database: process.env.CODE_DB_NAME || 'smack_code',
  password: process.env.CODE_DB_PASSWORD || 'postgres',
  port: parseInt(process.env.CODE_DB_PORT || '5433'), // Different port for the second DB
});

// Test connection function
export const testConnections = async () => {
  try {
    const aiClient = await aiPool.connect();
    console.log('AI Database connected successfully');
    aiClient.release();

    const codeClient = await codePool.connect();
    console.log('Code Database connected successfully');
    codeClient.release();

    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
};

export default { aiPool, codePool, testConnections };
