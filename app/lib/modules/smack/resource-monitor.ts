/**
 * ResourceMonitor - Monitors system resources and server performance
 */

import { createScopedLogger } from '~/utils/logger';
import { serverManager } from './server-manager.server';

const logger = createScopedLogger('ResourceMonitor');

export interface ResourceThresholds {
  maxMemoryPercent: number;
  maxCpuPercent: number;
  maxQueueLength: number;
  maxResponseTime: number;
}

export interface ResourceAlert {
  type: 'memory' | 'cpu' | 'queue' | 'response_time';
  severity: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
}

export interface ResourceStats {
  memory: {
    used: number;
    total: number;
    percentage: number;
    available: number;
  };
  cpu: {
    usage: number;
    cores: number;
    loadAverage?: number[];
  };
  server: {
    queueLength: number;
    averageResponseTime: number;
    requestsPerMinute: number;
    uptime: number;
  };
  alerts: ResourceAlert[];
  timestamp: number;
}

export class ResourceMonitor {
  private static instance: ResourceMonitor;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  private resourceHistory: ResourceStats[] = [];
  private maxHistorySize = 100; // Keep last 100 readings
  private alerts: ResourceAlert[] = [];
  private maxAlerts = 50; // Keep last 50 alerts

  private thresholds: ResourceThresholds = {
    maxMemoryPercent: 85,
    maxCpuPercent: 80,
    maxQueueLength: 10,
    maxResponseTime: 30000, // 30 seconds
  };

  private constructor() {}

  static getInstance(): ResourceMonitor {
    if (!ResourceMonitor.instance) {
      ResourceMonitor.instance = new ResourceMonitor();
    }

    return ResourceMonitor.instance;
  }

  /**
   * Start monitoring resources
   */
  startMonitoring(intervalMs = 10000): void {
    if (this.isMonitoring) {
      logger.warn('Resource monitoring is already running');
      return;
    }

    logger.info(`Starting resource monitoring (interval: ${intervalMs}ms)`);
    this.isMonitoring = true;

    this.monitoringInterval = setInterval(async () => {
      try {
        const stats = await this.collectResourceStats();
        this.addToHistory(stats);
        this.checkThresholds(stats);
      } catch (error) {
        logger.error('Error collecting resource stats:', error);
      }
    }, intervalMs);
  }

  /**
   * Stop monitoring resources
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    logger.info('Stopping resource monitoring');
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Get current resource statistics
   */
  async getCurrentStats(): Promise<ResourceStats> {
    return await this.collectResourceStats();
  }

  /**
   * Get resource history
   */
  getHistory(): ResourceStats[] {
    return [...this.resourceHistory];
  }

  /**
   * Get recent alerts
   */
  getAlerts(): ResourceAlert[] {
    return [...this.alerts];
  }

  /**
   * Clear alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Update resource thresholds
   */
  updateThresholds(newThresholds: Partial<ResourceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    logger.info('Updated resource thresholds:', this.thresholds);
  }

  /**
   * Get current thresholds
   */
  getThresholds(): ResourceThresholds {
    return { ...this.thresholds };
  }

  /**
   * Check if system is under stress
   */
  isSystemUnderStress(): boolean {
    if (this.resourceHistory.length === 0) {
      return false;
    }

    const latest = this.resourceHistory[this.resourceHistory.length - 1];

    return (
      latest.memory.percentage > this.thresholds.maxMemoryPercent ||
      latest.cpu.usage > this.thresholds.maxCpuPercent ||
      latest.server.queueLength > this.thresholds.maxQueueLength ||
      latest.server.averageResponseTime > this.thresholds.maxResponseTime
    );
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    averageMemoryUsage: number;
    averageCpuUsage: number;
    averageResponseTime: number;
    totalRequests: number;
    alertCount: number;
  } {
    if (this.resourceHistory.length === 0) {
      return {
        averageMemoryUsage: 0,
        averageCpuUsage: 0,
        averageResponseTime: 0,
        totalRequests: 0,
        alertCount: 0,
      };
    }

    const recent = this.resourceHistory.slice(-10); // Last 10 readings

    const avgMemory = recent.reduce((sum, stat) => sum + stat.memory.percentage, 0) / recent.length;
    const avgCpu = recent.reduce((sum, stat) => sum + stat.cpu.usage, 0) / recent.length;
    const avgResponseTime = recent.reduce((sum, stat) => sum + stat.server.averageResponseTime, 0) / recent.length;

    return {
      averageMemoryUsage: Math.round(avgMemory * 100) / 100,
      averageCpuUsage: Math.round(avgCpu * 100) / 100,
      averageResponseTime: Math.round(avgResponseTime),
      totalRequests: recent[recent.length - 1]?.server.requestsPerMinute || 0,
      alertCount: this.alerts.length,
    };
  }

  /**
   * Collect current resource statistics
   */
  private async collectResourceStats(): Promise<ResourceStats> {
    const timestamp = Date.now();

    // Get system memory info
    const memoryInfo = await this.getSystemMemoryInfo();

    // Get CPU info
    const cpuInfo = await this.getCpuInfo();

    // Get server metrics
    const serverInfo = await this.getServerInfo();

    return {
      memory: memoryInfo,
      cpu: cpuInfo,
      server: serverInfo,
      alerts: [...this.alerts],
      timestamp,
    };
  }

  /**
   * Get system memory information
   */
  private async getSystemMemoryInfo(): Promise<ResourceStats['memory']> {
    try {
      // Try to get memory info from server metrics first
      const metrics = await serverManager.getMetrics();

      if (metrics?.memory) {
        return {
          used: metrics.memory.used,
          total: metrics.memory.total,
          percentage: metrics.memory.percentage,
          available: metrics.memory.total - metrics.memory.used,
        };
      }
    } catch (error) {
      // Fallback to basic estimation
    }

    // Fallback: estimate based on Node.js process memory
    const memUsage = process.memoryUsage();
    const totalMemory = 8 * 1024 * 1024 * 1024; // Assume 8GB default

    return {
      used: memUsage.heapUsed + memUsage.external,
      total: totalMemory,
      percentage: ((memUsage.heapUsed + memUsage.external) / totalMemory) * 100,
      available: totalMemory - (memUsage.heapUsed + memUsage.external),
    };
  }

  /**
   * Get CPU information
   */
  private async getCpuInfo(): Promise<ResourceStats['cpu']> {
    try {
      // Try to get CPU info from server metrics
      const metrics = await serverManager.getMetrics();

      if (metrics?.cpu) {
        return {
          usage: metrics.cpu.usage,
          cores: metrics.cpu.cores,
          loadAverage: this.getLoadAverage(),
        };
      }
    } catch (error) {
      // Fallback to basic estimation
    }

    // Fallback: estimate based on process CPU usage
    const cpuUsage = process.cpuUsage();
    const cores = require('os').cpus().length;

    return {
      usage: 0, // Can't easily calculate without external tools
      cores,
      loadAverage: this.getLoadAverage(),
    };
  }

  /**
   * Get server-specific information
   */
  private async getServerInfo(): Promise<ResourceStats['server']> {
    try {
      const status = await serverManager.getStatus();
      const metrics = await serverManager.getMetrics();

      if (metrics) {
        return {
          queueLength: metrics.model.queue_length,
          averageResponseTime: metrics.model.average_response_time * 1000, // Convert to ms
          requestsPerMinute: this.calculateRequestsPerMinute(metrics.requests.total),
          uptime: status.uptime || 0,
        };
      }
    } catch (error) {
      // Server not available
    }

    return {
      queueLength: 0,
      averageResponseTime: 0,
      requestsPerMinute: 0,
      uptime: 0,
    };
  }

  /**
   * Get system load average (Unix-like systems)
   */
  private getLoadAverage(): number[] | undefined {
    try {
      return require('os').loadavg();
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Calculate requests per minute from total requests
   */
  private calculateRequestsPerMinute(totalRequests: number): number {
    if (this.resourceHistory.length < 2) {
      return 0;
    }

    const previous = this.resourceHistory[this.resourceHistory.length - 1];
    const timeDiff = (Date.now() - previous.timestamp) / 1000 / 60; // minutes

    if (timeDiff === 0) {
      return 0;
    }

    const requestDiff = totalRequests - (previous.server.requestsPerMinute || 0);

    return Math.round(requestDiff / timeDiff);
  }

  /**
   * Add stats to history
   */
  private addToHistory(stats: ResourceStats): void {
    this.resourceHistory.push(stats);

    // Keep only the most recent entries
    if (this.resourceHistory.length > this.maxHistorySize) {
      this.resourceHistory = this.resourceHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Check resource thresholds and generate alerts
   */
  private checkThresholds(stats: ResourceStats): void {
    const alerts: ResourceAlert[] = [];

    // Memory threshold check
    if (stats.memory.percentage > this.thresholds.maxMemoryPercent) {
      alerts.push({
        type: 'memory',
        severity: stats.memory.percentage > 95 ? 'critical' : 'warning',
        message: `Memory usage is ${stats.memory.percentage.toFixed(1)}%`,
        value: stats.memory.percentage,
        threshold: this.thresholds.maxMemoryPercent,
        timestamp: stats.timestamp,
      });
    }

    // CPU threshold check
    if (stats.cpu.usage > this.thresholds.maxCpuPercent) {
      alerts.push({
        type: 'cpu',
        severity: stats.cpu.usage > 95 ? 'critical' : 'warning',
        message: `CPU usage is ${stats.cpu.usage.toFixed(1)}%`,
        value: stats.cpu.usage,
        threshold: this.thresholds.maxCpuPercent,
        timestamp: stats.timestamp,
      });
    }

    // Queue length check
    if (stats.server.queueLength > this.thresholds.maxQueueLength) {
      alerts.push({
        type: 'queue',
        severity: stats.server.queueLength > 20 ? 'critical' : 'warning',
        message: `Request queue length is ${stats.server.queueLength}`,
        value: stats.server.queueLength,
        threshold: this.thresholds.maxQueueLength,
        timestamp: stats.timestamp,
      });
    }

    // Response time check
    if (stats.server.averageResponseTime > this.thresholds.maxResponseTime) {
      alerts.push({
        type: 'response_time',
        severity: stats.server.averageResponseTime > 60000 ? 'critical' : 'warning',
        message: `Average response time is ${(stats.server.averageResponseTime / 1000).toFixed(1)}s`,
        value: stats.server.averageResponseTime,
        threshold: this.thresholds.maxResponseTime,
        timestamp: stats.timestamp,
      });
    }

    // Add new alerts
    for (const alert of alerts) {
      this.addAlert(alert);
    }
  }

  /**
   * Add an alert to the alerts list
   */
  private addAlert(alert: ResourceAlert): void {
    // Avoid duplicate alerts within a short time window
    const recentSimilar = this.alerts.find(
      (existing) =>
        existing.type === alert.type &&
        existing.severity === alert.severity &&
        alert.timestamp - existing.timestamp < 60000, // Within 1 minute
    );

    if (!recentSimilar) {
      this.alerts.push(alert);
      logger.warn(`Resource alert: ${alert.message}`);

      // Keep only the most recent alerts
      if (this.alerts.length > this.maxAlerts) {
        this.alerts = this.alerts.slice(-this.maxAlerts);
      }
    }
  }
}

// Export singleton instance
export const resourceMonitor = ResourceMonitor.getInstance();
