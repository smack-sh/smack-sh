/**
 * ServerManager - Manages the lifecycle of the Smack-7B Python model server
 */

import { logger } from '~/utils/logger';

export interface ServerStatus {
  running: boolean;
  healthy: boolean;
  modelLoaded: boolean;
  error?: string;
  uptime?: number;
  pid?: number;
}

export interface ServerMetrics {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    cores: number;
  };
  model: {
    status: string;
    queue_length: number;
    average_response_time: number;
  };
  requests: {
    total: number;
    successful: number;
    failed: number;
  };
}

export class ServerManager {
  private static instance: ServerManager;
  private serverProcess: any = null;
  private serverUrl = 'http://127.0.0.1:8001';
  private serverPath!: string;
  private startTime: number | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private restartAttempts = 0;
  private maxRestartAttempts = 3;
  private isShuttingDown = false;

  private constructor() {
    // Set up cleanup handlers
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
    process.on('exit', () => this.shutdown());
  }

  private async init() {
    const { join } = await import('path');
    this.serverPath = join(process.cwd(), 'smack-server');
  }

  static async getInstance(): Promise<ServerManager> {
    if (!ServerManager.instance) {
      ServerManager.instance = new ServerManager();
      await ServerManager.instance.init();
    }

    return ServerManager.instance;
  }

  /**
   * Start the Python model server
   */
  async startServer(): Promise<boolean> {
    const { existsSync } = await import('fs');
    const { join } = await import('path');
    const { spawn } = await import('child_process');

    if (this.serverProcess && !this.serverProcess.killed) {
      logger.info('Server is already running');
      return true;
    }

    if (this.isShuttingDown) {
      logger.warn('Cannot start server during shutdown');
      return false;
    }

    try {
      // Check if server directory exists
      if (!existsSync(this.serverPath)) {
        logger.error(`Server directory not found: ${this.serverPath}`);
        return false;
      }

      // Check if main.py exists
      const mainPyPath = join(this.serverPath, 'main.py');

      if (!existsSync(mainPyPath)) {
        logger.error(`Server main.py not found: ${mainPyPath}`);
        return false;
      }

      logger.info('Starting Smack-7B model server...');

      // Spawn the Python server process
      this.serverProcess = spawn('python3', ['main.py'], {
        cwd: this.serverPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1', // Ensure real-time output
        },
      });

      this.startTime = Date.now();

      // Handle server output
      this.serverProcess.stdout?.on('data', (data: Buffer) => {
        const output = data.toString().trim();

        if (output) {
          logger.info(`[Smack Server] ${output}`);
        }
      });

      this.serverProcess.stderr?.on('data', (data: Buffer) => {
        const error = data.toString().trim();

        if (error) {
          logger.error(`[Smack Server Error] ${error}`);
        }
      });

      // Handle server exit
      this.serverProcess.on('exit', (code: any, signal: any) => {
        logger.info(`Server process exited with code ${code}, signal ${signal}`);
        this.serverProcess = null;
        this.startTime = null;

        // Attempt restart if not shutting down and within retry limits
        if (!this.isShuttingDown && this.restartAttempts < this.maxRestartAttempts) {
          this.restartAttempts++;
          logger.info(`Attempting server restart (${this.restartAttempts}/${this.maxRestartAttempts})`);
          setTimeout(async () => {
            await this.startServer();
          }, 5000); // Wait 5 seconds before restart
        } else if (this.restartAttempts >= this.maxRestartAttempts) {
          logger.error('Max restart attempts reached. Server will not be restarted automatically.');
        }
      });

      this.serverProcess.on('error', (error: any) => {
        logger.error(`Server process error: ${error.message}`);
        this.serverProcess = null;
        this.startTime = null;
      });

      // Wait for server to be ready
      const isReady = await this.waitForServerReady();

      if (isReady) {
        logger.info('Smack-7B server started successfully');
        this.restartAttempts = 0; // Reset restart attempts on successful start
        this.startHealthMonitoring();
        this.startResourceMonitoring();

        return true;
      } else {
        logger.error('Server failed to become ready within timeout');
        this.stopServer();

        return false;
      }
    } catch (error) {
      logger.error(`Failed to start server: ${error}`);
      return false;
    }
  }

  /**
   * Stop the Python model server
   */
  async stopServer(): Promise<void> {
    if (!this.serverProcess) {
      return;
    }

    logger.info('Stopping Smack-7B server...');

    this.stopHealthMonitoring();
    this.stopResourceMonitoring();

    try {
      // Try graceful shutdown first
      this.serverProcess.kill('SIGTERM');

      // Wait for graceful shutdown
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          // Force kill if graceful shutdown takes too long
          if (this.serverProcess && !this.serverProcess.killed) {
            logger.warn('Forcing server shutdown...');
            this.serverProcess.kill('SIGKILL');
          }

          resolve();
        }, 10000); // 10 second timeout

        this.serverProcess?.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });

      this.serverProcess = null;
      this.startTime = null;
      logger.info('Smack-7B server stopped');
    } catch (error) {
      logger.error(`Error stopping server: ${error}`);
    }
  }

  /**
   * Restart the server
   */
  async restartServer(): Promise<boolean> {
    logger.info('Restarting Smack-7B server...');
    await this.stopServer();
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Wait 2 seconds
    return await this.startServer();
  }

  /**
   * Get current server status
   */
  async getStatus(): Promise<ServerStatus> {
    const isRunning = this.serverProcess !== null && !this.serverProcess.killed;

    if (!isRunning) {
      return {
        running: false,
        healthy: false,
        modelLoaded: false,
        error: 'Server is not running',
      };
    }

    try {
      // Check health endpoint
      const healthResponse = await fetch(`${this.serverUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (!healthResponse.ok) {
        return {
          running: true,
          healthy: false,
          modelLoaded: false,
          error: `Health check failed: ${healthResponse.status}`,
          uptime: this.getUptime(),
          pid: this.serverProcess?.pid,
        };
      }

      const healthData: unknown = await healthResponse.json();
      let modelLoaded = false;

      if (healthData && typeof healthData === 'object' && 'model_loaded' in healthData) {
        try {
          modelLoaded = Boolean((healthData as any).model_loaded);
        } catch {
          modelLoaded = false;
        }
      }

      return {
        running: true,
        healthy: true,
        modelLoaded,
        uptime: this.getUptime(),
        pid: this.serverProcess?.pid,
      };
    } catch (error) {
      return {
        running: true,
        healthy: false,
        modelLoaded: false,
        error: `Health check error: ${error}`,
        uptime: this.getUptime(),
        pid: this.serverProcess?.pid,
      };
    }
  }

  /**
   * Get server metrics
   */
  async getMetrics(): Promise<ServerMetrics | null> {
    try {
      const response = await fetch(`${this.serverUrl}/metrics`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`Metrics request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error(`Failed to get server metrics: ${error}`);
      return null;
    }
  }

  /**
   * Check if server is healthy
   */
  async isHealthy(): Promise<boolean> {
    const status = await this.getStatus();
    return status.healthy;
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    logger.info('Shutting down ServerManager...');

    this.stopHealthMonitoring();
    this.stopResourceMonitoring();
    await this.stopServer();

    logger.info('ServerManager shutdown complete');
  }

  /**
   * Wait for server to be ready
   */
  private async waitForServerReady(timeoutMs = 60000): Promise<boolean> {
    const startTime = Date.now();
    const checkInterval = 2000; // Check every 2 seconds

    while (Date.now() - startTime < timeoutMs) {
      try {
        const response = await fetch(`${this.serverUrl}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          return true;
        }
      } catch (error) {
        // Server not ready yet, continue waiting
      }

      await new Promise((resolve) => setTimeout(resolve, checkInterval));
    }

    return false;
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      return;
    }

    this.healthCheckInterval = setInterval(async () => {
      const status = await this.getStatus();

      if (!status.healthy && status.running) {
        logger.warn('Server health check failed, attempting restart...');
        this.restartServer();
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Stop health monitoring
   */
  private stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Start resource monitoring
   */
  private startResourceMonitoring(): void {
    try {
      // Import and start resource monitor
      import('./resource-monitor')
        .then(({ resourceMonitor }) => {
          resourceMonitor.startMonitoring(15000); // Monitor every 15 seconds
          logger.info('Resource monitoring started');
        })
        .catch((error) => {
          logger.error('Failed to start resource monitoring:', error);
        });
    } catch (error) {
      logger.error('Error starting resource monitoring:', error);
    }
  }

  /**
   * Stop resource monitoring
   */
  private stopResourceMonitoring(): void {
    try {
      import('./resource-monitor')
        .then(({ resourceMonitor }) => {
          resourceMonitor.stopMonitoring();
          logger.info('Resource monitoring stopped');
        })
        .catch((error) => {
          logger.error('Failed to stop resource monitoring:', error);
        });
    } catch (error) {
      logger.error('Error stopping resource monitoring:', error);
    }
  }

  /**
   * Get server uptime in seconds
   */
  private getUptime(): number | undefined {
    if (!this.startTime) {
      return undefined;
    }

    return Math.floor((Date.now() - this.startTime) / 1000);
  }
}

// Export singleton instance
export const serverManager = await ServerManager.getInstance();