import { aiPool, codePool } from '~/config/database';

export class UserService {
  // Delete all user data across both databases
  static async deleteUserAccount(userId: string): Promise<boolean> {
    const clientAI = await aiPool.connect();
    const clientCode = await codePool.connect();

    try {
      // Start transactions on both databases
      await clientAI.query('BEGIN');
      await clientCode.query('BEGIN');

      try {
        // Delete AI-related data
        await clientAI.query('DELETE FROM ai_training_data WHERE user_id = $1', [userId]);
        await clientAI.query('DELETE FROM ai_sessions WHERE user_id = $1', [userId]);
        await clientAI.query('DELETE FROM ai_users WHERE user_id = $1', [userId]);

        // Get all user's projects to delete related data
        const projectsResult = await clientCode.query('SELECT id FROM projects WHERE user_id = $1', [userId]);

        const projectIds = projectsResult.rows.map((row) => row.id);

        if (projectIds.length > 0) {
          // Delete terminal commands for user's projects
          await clientCode.query(
            'DELETE FROM terminal_commands WHERE terminal_id IN (SELECT id FROM terminals WHERE project_id = ANY($1::int[]))',
            [projectIds],
          );

          // Delete terminals for user's projects
          await clientCode.query('DELETE FROM terminals WHERE project_id = ANY($1::int[])', [projectIds]);

          // Delete files for user's projects
          await clientCode.query('DELETE FROM files WHERE project_id = ANY($1::int[])', [projectIds]);

          // Delete projects
          await clientCode.query('DELETE FROM projects WHERE id = ANY($1::int[])', [projectIds]);
        }

        // Delete any remaining user data
        await clientCode.query('DELETE FROM code_users WHERE user_id = $1', [userId]);

        // Commit both transactions
        await clientAI.query('COMMIT');
        await clientCode.query('COMMIT');

        return true;
      } catch (error) {
        // Rollback both transactions in case of error
        await clientAI.query('ROLLBACK');
        await clientCode.query('ROLLBACK');
        console.error('Error deleting user account:', error);
        throw error;
      }
    } catch (error) {
      console.error('Database connection error during account deletion:', error);
      throw error;
    } finally {
      clientAI.release();
      clientCode.release();
    }
  }

  // Get user data (for export or debugging)
  static async getUserData(userId: string) {
    const clientAI = await aiPool.connect();
    const clientCode = await codePool.connect();

    try {
      const [aiUser, codeUser, projects, aiSessions, aiTrainingData] = await Promise.all([
        clientAI.query('SELECT * FROM ai_users WHERE user_id = $1', [userId]),
        clientCode.query('SELECT * FROM code_users WHERE user_id = $1', [userId]),
        clientCode.query('SELECT * FROM projects WHERE user_id = $1', [userId]),
        clientAI.query('SELECT * FROM ai_sessions WHERE user_id = $1', [userId]),
        clientAI.query('SELECT * FROM ai_training_data WHERE user_id = $1', [userId]),
      ]);

      return {
        aiUser: aiUser.rows[0] || null,
        codeUser: codeUser.rows[0] || null,
        projects: projects.rows,
        aiSessions: aiSessions.rows,
        aiTrainingData: aiTrainingData.rows,
      };
    } finally {
      clientAI.release();
      clientCode.release();
    }
  }

  // Initialize user in both databases
  static async initializeUser(userId: string, userData: any) {
    const clientAI = await aiPool.connect();
    const clientCode = await codePool.connect();

    try {
      await clientAI.query(
        'INSERT INTO ai_users (user_id, ai_preferences) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING',
        [userId, { theme: 'dark', model: 'gpt-4' }],
      );

      await clientCode.query(
        'INSERT INTO code_users (user_id, code_preferences) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING',
        [userId, { theme: 'vs-dark', fontSize: 14 }],
      );

      return true;
    } finally {
      clientAI.release();
      clientCode.release();
    }
  }
}

export default UserService;
