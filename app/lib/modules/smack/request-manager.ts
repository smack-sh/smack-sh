/**
 * RequestManager - Manages request queuing, throttling, and load balancing
 */

import { createScopedLogger } from '~/utils/logger';
import { resourceMonitor } from './resource-monitor';

const logger = createScopedLogger('RequestManager');

export interface RequestConfig {
  maxConcurrentRequests: number;
  maxQueueSize: number;
  requestTimeout: number;
  throttleThreshold: number;
  priorityLevels: number;
}

export interface QueuedRequest {
  id: string;
  priority: number;
  timestamp: number;
  timeout: number;
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  execute: () => Promise<any>;
}

export interface RequestStats {
  totalRequests: number;
  completedRequests: number;
  failedRequests: number;
  queuedRequests: number;
  activeRequests: number;
  averageWaitTime: number;
  averageProcessingTime: number;
  throughputPerMinute: number;
}

export class RequestManager {
  private static instance: RequestManager;
  private requestQueue: QueuedRequest[] = [];
  private activeRequests = new Map<string, QueuedRequest>();
  private requestStats: RequestStats;
  private config: RequestConfig;
  private isThrottling = false;
  private requestCounter = 0;
  private completionTimes: number[] = [];
  private waitTimes: number[] = [];

  private constructor() {
    this.config = {
      maxConcurrentRequests: 4,
      maxQueueSize: 20,
      requestTimeout: 60000, // 60 seconds
      throttleThreshold: 0.8, // Start throttling at 80% resource usage
      priorityLevels: 3,
    };

    this.requestStats = {
      totalRequests: 0,
      completedRequests: 0,
      failedRequests: 0,
      queuedRequests: 0,
      activeRequests: 0,
      averageWaitTime: 0,
      averageProcessingTime: 0,
      throughputPerMinute: 0,
    };

    this.startStatsCollection();
  }

  static getInstance(): RequestManager {
    if (!RequestManager.instance) {
      RequestManager.instance = new RequestManager();
    }
    return RequestManager.instance;
  }

  /**
   * Queue a request for execution
   */
  async queueRequest<T>(
    executeFunction: () => Promise<T>,
    priority = 1,
    timeout?: number
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const requestId = this.generateRequestId();
      const requestTimeout = timeout || this.config.requestTimeout;
      
      // Check if queue is full
      if (this.requestQueue.length >= this.config.maxQueueSize) {
        reject(new Error('Request queue is full. Please try again later.'));
        return;
      }

      // Check if system is under stress and apply throttling
      if (this.shouldThrottle()) {
        const delay = this.calculateThrottleDelay();
        setTimeout(() => {
          this.addRequestToQueue(requestId, priority, requestTimeout, resolve, reject, executeFunction);
        }, delay);
      } else {
        this.addRequestToQueue(requestId, priority, requestTimeout, resolve, reject, executeFunction);
      }
    });
  }

  /**
   * Get current request statistics
   */
  getStats(): RequestStats {
    return {
      ...this.requestStats,
      queuedRequests: this.requestQueue.length,
      activeRequests: this.activeRequests.size,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<RequestConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Request manager configuration updated:', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): RequestConfig {
    return { ...this.config };
  }

  /**
   * Clear the request queue (emergency stop)
   */
  clearQueue(): void {
    logger.warn('Clearing request queue');
    
    // Reject all queued requests
    for (const request of this.requestQueue) {
      request.reject(new Error('Request queue cleared'));
    }
    
    this.requestQueue = [];
    this.updateStats();
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    queueLength: number;
    activeRequests: number;
    isThrottling: boolean;
    estimatedWaitTime: number;
  } {
    return {
      queueLength: this.requestQueue.length,
      activeRequests: this.activeRequests.size,
      isThrottling: this.isThrottling,
      estimatedWaitTime: this.estimateWaitTime(),
    };
  }

  /**
   * Add request to queue
   */
  private addRequestToQueue<T>(
    requestId: string,
    priority: number,
    timeout: number,
    resolve: (value: T) => void,
    reject: (error: Error) => void,
    executeFunction: () => Promise<T>
  ): void {
    const request: QueuedRequest = {
      id: requestId,
      priority: Math.max(1, Math.min(priority, this.config.priorityLevels)),
      timestamp: Date.now(),
      timeout,
      resolve,
      reject,
      execute: executeFunction,
    };

    // Insert request based on priority (higher priority first)
    const insertIndex = this.requestQueue.findIndex(r => r.priority < request.priority);
    if (insertIndex === -1) {
      this.requestQueue.push(request);
    } else {
      this.requestQueue.splice(insertIndex, 0, request);
    }

    this.requestStats.totalRequests++;
    this.processQueue();
  }

  /**
   * Process the request queue
   */
  private async processQueue(): Promise<void> {
    // Process requests while we have capacity and queued requests
    while (
      this.activeRequests.size < this.config.maxConcurrentRequests &&
      this.requestQueue.length > 0
    ) {
      const request = this.requestQueue.shift();
      if (!request) break;

      // Check if request has timed out while waiting
      if (Date.now() - request.timestamp > request.timeout) {
        request.reject(new Error('Request timed out while waiting in queue'));
        this.requestStats.failedRequests++;
        continue;
      }

      // Start processing the request
      this.activeRequests.set(request.id, request);
      this.executeRequest(request);
    }

    this.updateStats();
  }

  /**
   * Execute a request
   */
  private async executeRequest(request: QueuedRequest): Promise<void> {
    const startTime = Date.now();
    const waitTime = startTime - request.timestamp;
    
    try {
      // Set up timeout for the execution
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Request execution timed out'));
        }, request.timeout);
      });

      // Race between execution and timeout
      const result = await Promise.race([
        request.execute(),
        timeoutPromise,
      ]);

      const processingTime = Date.now() - startTime;
      
      // Record timing statistics
      this.waitTimes.push(waitTime);
      this.completionTimes.push(processingTime);
      
      // Keep only recent timing data
      if (this.waitTimes.length > 100) {
        this.waitTimes = this.waitTimes.slice(-100);
      }
      if (this.completionTimes.length > 100) {
        this.completionTimes = this.completionTimes.slice(-100);
      }

      request.resolve(result);
      this.requestStats.completedRequests++;
      
    } catch (error) {
      logger.error(`Request ${request.id} failed:`, error);
      request.reject(error instanceof Error ? error : new Error(String(error)));
      this.requestStats.failedRequests++;
    } finally {
      // Remove from active requests
      this.activeRequests.delete(request.id);
      
      // Process next requests in queue
      this.processQueue();
    }
  }

  /**
   * Check if throttling should be applied
   */
  private shouldThrottle(): boolean {
    try {
      const resourceStats = resourceMonitor.getPerformanceSummary();
      
      // Check if system is under stress
      const memoryStress = resourceStats.averageMemoryUsage > (this.config.throttleThreshold * 100);
      const cpuStress = resourceStats.averageCpuUsage > (this.config.throttleThreshold * 100);
      const queueStress = this.requestQueue.length > (this.config.maxQueueSize * 0.7);
      
      this.isThrottling = memoryStress || cpuStress || queueStress;
      
      return this.isThrottling;
    } catch (error) {
      // If we can't get resource stats, don't throttle
      return false;
    }
  }

  /**
   * Calculate throttling delay
   */
  private calculateThrottleDelay(): number {
    const baseDelay = 1000; // 1 second base delay
    const queueFactor = Math.min(this.requestQueue.length / this.config.maxQueueSize, 1);
    const resourceFactor = resourceMonitor.isSystemUnderStress() ? 2 : 1;
    
    return baseDelay * (1 + queueFactor) * resourceFactor;
  }

  /**
   * Estimate wait time for new requests
   */
  private estimateWaitTime(): number {
    if (this.requestQueue.length === 0) {
      return 0;
    }

    const avgProcessingTime = this.completionTimes.length > 0
      ? this.completionTimes.reduce((sum, time) => sum + time, 0) / this.completionTimes.length
      : 5000; // Default 5 seconds

    const queuePosition = this.requestQueue.length;
    const concurrentSlots = this.config.maxConcurrentRequests;
    
    return Math.ceil(queuePosition / concurrentSlots) * avgProcessingTime;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${++this.requestCounter}`;
  }

  /**
   * Update statistics
   */
  private updateStats(): void {
    // Calculate averages
    if (this.waitTimes.length > 0) {
      this.requestStats.averageWaitTime = 
        this.waitTimes.reduce((sum, time) => sum + time, 0) / this.waitTimes.length;
    }

    if (this.completionTimes.length > 0) {
      this.requestStats.averageProcessingTime = 
        this.completionTimes.reduce((sum, time) => sum + time, 0) / this.completionTimes.length;
    }

    // Calculate throughput (requests per minute)
    const recentCompletions = this.completionTimes.slice(-10); // Last 10 requests
    if (recentCompletions.length > 0) {
      const avgTime = recentCompletions.reduce((sum, time) => sum + time, 0) / recentCompletions.length;
      this.requestStats.throughputPerMinute = Math.round(60000 / avgTime); // 60000ms = 1 minute
    }
  }

  /**
   * Start periodic statistics collection
   */
  private startStatsCollection(): void {
    setInterval(() => {
      this.updateStats();
      
      // Log stats periodically if there's activity
      if (this.requestStats.totalRequests > 0) {
        logger.debug('Request stats:', this.getStats());
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Shutdown the request manager
   */
  shutdown(): void {
    logger.info('Shutting down request manager...');
    
    // Clear the queue and reject pending requests
    this.clearQueue();
    
    // Wait for active requests to complete or timeout
    const activeRequestIds = Array.from(this.activeRequests.keys());
    if (activeRequestIds.length > 0) {
      logger.info(`Waiting for ${activeRequestIds.length} active requests to complete...`);
      
      // Give active requests some time to complete
      setTimeout(() => {
        // Force reject any remaining active requests
        for (const [id, request] of this.activeRequests) {
          request.reject(new Error('Request manager shutting down'));
          this.activeRequests.delete(id);
        }
      }, 10000); // 10 second grace period
    }
    
    logger.info('Request manager shutdown complete');
  }
}

// Export singleton instance
export const requestManager = RequestManager.getInstance();