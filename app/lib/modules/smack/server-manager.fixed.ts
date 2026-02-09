/**
 * ServerManager - Stub implementation that doesn't start the Smack-7B server
 */

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
  private isShuttingDown = false;
  private startTime: number | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // No-op in this stub implementation
  }

  static getInstance(): ServerManager {
    if (!ServerManager.instance) {
      ServerManager.instance = new ServerManager();
    }

    return ServerManager.instance;
  }

  async startServer(): Promise<boolean> {
    console.log('Smack-7B server is disabled in this build');
    return false;
  }

  async stopServer(): Promise<void> {
    // No-op
  }

  async restartServer(): Promise<boolean> {
    console.log('Smack-7B server is disabled in this build');
    return false;
  }

  getServerStatus(): ServerStatus {
    return {
      running: false,
      healthy: false,
      modelLoaded: false,
      error: 'Smack-7B server is disabled in this build',
    };
  }

  getServerMetrics(): ServerMetrics {
    return {
      memory: {
        used: 0,
        total: 0,
        percentage: 0,
      },
      cpu: {
        usage: 0,
        cores: 0,
      },
      model: {
        status: 'disabled',
        queue_length: 0,
        average_response_time: 0,
      },
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
      },
    };
  }

  isServerRunning(): boolean {
    return false;
  }

  private cleanup(): void {
    // No-op
  }

  async shutdown(): Promise<void> {
    // No-op
  }
}

// Export singleton instance
export const serverManager = ServerManager.getInstance();
