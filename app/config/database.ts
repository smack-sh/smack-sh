import { Pool } from 'pg';
import { dbEnv } from './env.server';

/**
 * Validates database password and throws if not set
 * Never uses default credentials for security
 */
function validateDatabasePassword(password: string | undefined, dbName: string): string {
  if (!password || password.trim() === '') {
    throw new Error(
      `CRITICAL SECURITY ERROR: Database password for ${dbName} is not set. ` +
        `Application cannot start with default credentials. ` +
        `Please set the appropriate environment variable.`,
    );
  }

  // Check for common default passwords
  const insecurePasswords = ['postgres', 'password', '123456', 'admin', 'root', 'default'];
  if (insecurePasswords.includes(password.toLowerCase())) {
    throw new Error(
      `CRITICAL SECURITY ERROR: Database password for ${dbName} appears to be a default/insecure password. ` +
        `Please use a strong, unique password.`,
    );
  }

  return password;
}

// AI Database Configuration - No default credentials
export const aiPool = new Pool({
  user: dbEnv.ai.user,
  host: dbEnv.ai.host,
  database: dbEnv.ai.database,
  password: validateDatabasePassword(dbEnv.ai.password, 'AI_DB'),
  port: dbEnv.ai.port,
});

// Code Database Configuration - No default credentials
export const codePool = new Pool({
  user: dbEnv.code.user,
  host: dbEnv.code.host,
  database: dbEnv.code.database,
  password: validateDatabasePassword(dbEnv.code.password, 'CODE_DB'),
  port: dbEnv.code.port,
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
