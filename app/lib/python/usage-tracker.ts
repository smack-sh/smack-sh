import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('PythonUsageTracker');

/**
 * Storage interface for compatibility between server and client
 */
export interface StorageInterface {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Client-side storage implementation
 */
class ClientStorage implements StorageInterface {
  getItem(key: string): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      logger.error('Failed to read from localStorage:', error);
      return null;
    }
  }

  setItem(key: string, value: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      logger.error('Failed to write to localStorage:', error);
    }
  }

  removeItem(key: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      logger.error('Failed to remove from localStorage:', error);
    }
  }
}

/**
 * Server-side in-memory storage implementation
 */
class ServerStorage implements StorageInterface {
  private storage = new Map<string, string>();

  getItem(key: string): string | null {
    return this.storage.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.storage.set(key, value);
  }

  removeItem(key: string): void {
    this.storage.delete(key);
  }
}

/**
 * Storage factory - creates appropriate storage based on environment
 */
function createStorage(): StorageInterface {
  if (typeof window !== 'undefined') {
    try {
      if (typeof window.localStorage !== 'undefined') {
        return new ClientStorage();
      }
      logger.warn('localStorage is unavailable; falling back to server storage.');
    } catch (error) {
      logger.warn('Unable to access localStorage; falling back to server storage.', error);
    }
  }
  return new ServerStorage();
}

// Global storage instance
let storageInstance: StorageInterface | null = null;

export function setUsageStorage(storage: StorageInterface | null): void {
  storageInstance = storage;
}

function getStorage(): StorageInterface {
  if (!storageInstance) {
    storageInstance = createStorage();
  }
  return storageInstance;
}

/**
 * Usage tracking configuration
 */
const USAGE_CONFIG = {
  // Rate limit: 10 requests per minute per user
  RATE_LIMIT_REQUESTS: 10,
  RATE_LIMIT_WINDOW_MS: 60 * 1000, // 1 minute

  // Daily quota limits
  DAILY_QUOTA: 100,

  // Storage keys
  STORAGE_KEY_PREFIX: 'python_usage_',
  RATE_LIMIT_KEY_PREFIX: 'python_rate_limit_',
};

/**
 * User usage data
 */
export interface UserUsage {
  userId: string;
  date: string; // YYYY-MM-DD
  requestCount: number;
  executionTimeTotal: number;
  lastRequestTime: number;
}

/**
 * Rate limit data
 */
export interface RateLimitData {
  userId: string;
  requests: number[]; // Timestamps of requests in current window
  windowStart: number;
}

/**
 * Usage analytics
 */
export interface UsageAnalytics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageExecutionTime: number;
  mostUsedModules: string[];
  peakUsageHour: number;
}

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  currentUsage: number;
}

/**
 * Get today's date string (YYYY-MM-DD)
 */
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get storage key for user usage
 */
function getUsageKey(userId: string): string {
  return `${USAGE_CONFIG.STORAGE_KEY_PREFIX}${userId}_${getTodayString()}`;
}

/**
 * Get storage key for rate limit data
 */
function getRateLimitKey(userId: string): string {
  return `${USAGE_CONFIG.RATE_LIMIT_KEY_PREFIX}${userId}`;
}

/**
 * Check if user is within rate limits
 */
export function checkRateLimit(userId: string): RateLimitResult {
  const now = Date.now();
  const windowStart = now - USAGE_CONFIG.RATE_LIMIT_WINDOW_MS;

  try {
    // Get existing rate limit data
    const rateLimitKey = getRateLimitKey(userId);
    const stored = getStorage().getItem(rateLimitKey);
    let rateLimitData: RateLimitData;

    if (stored) {
      rateLimitData = JSON.parse(stored);

      // Clean up old requests outside the window
      rateLimitData.requests = rateLimitData.requests.filter((timestamp) => timestamp > windowStart);
    } else {
      rateLimitData = {
        userId,
        requests: [],
        windowStart: now,
      };
    }

    const currentUsage = rateLimitData.requests.length;
    const allowed = currentUsage < USAGE_CONFIG.RATE_LIMIT_REQUESTS;
    const remaining = Math.max(0, USAGE_CONFIG.RATE_LIMIT_REQUESTS - currentUsage);

    // Calculate reset time (when oldest request will expire or current window ends)
    let resetTime: number;
    if (rateLimitData.requests.length > 0) {
      resetTime = Math.min(...rateLimitData.requests) + USAGE_CONFIG.RATE_LIMIT_WINDOW_MS;
    } else {
      resetTime = now + USAGE_CONFIG.RATE_LIMIT_WINDOW_MS;
    }

    return {
      allowed,
      remaining,
      resetTime,
      currentUsage,
    };
  } catch (error) {
    logger.error('Error checking rate limit:', error);

    // Fail closed to avoid unlimited requests when storage fails
    return {
      allowed: false,
      remaining: 0,
      resetTime: now + USAGE_CONFIG.RATE_LIMIT_WINDOW_MS,
      currentUsage: USAGE_CONFIG.RATE_LIMIT_REQUESTS,
    };
  }
}

/**
 * Record a request for rate limiting
 */
export function recordRequest(userId: string): void {
  const now = Date.now();

  try {
    const rateLimitKey = getRateLimitKey(userId);
    const stored = getStorage().getItem(rateLimitKey);
    let rateLimitData: RateLimitData;

    if (stored) {
      rateLimitData = JSON.parse(stored);
    } else {
      rateLimitData = {
        userId,
        requests: [],
        windowStart: now,
      };
    }

    // Add current request
    rateLimitData.requests.push(now);

    // Clean up old requests
    const windowStart = now - USAGE_CONFIG.RATE_LIMIT_WINDOW_MS;
    rateLimitData.requests = rateLimitData.requests.filter((timestamp) => timestamp > windowStart);

    // Save updated data
    getStorage().setItem(rateLimitKey, JSON.stringify(rateLimitData));

    logger.debug(`Recorded request for user ${userId}. Current count: ${rateLimitData.requests.length}`);
  } catch (error) {
    logger.error('Error recording request:', error);
  }
}

/**
 * Track usage for a user
 */
export function trackUsage(userId: string, executionTime: number, success: boolean): void {
  const today = getTodayString();

  try {
    const usageKey = getUsageKey(userId);
    const stored = getStorage().getItem(usageKey);
    let usage: UserUsage;

    if (stored) {
      usage = JSON.parse(stored);

      // Reset if it's a new day
      if (usage.date !== today) {
        usage = {
          userId,
          date: today,
          requestCount: 0,
          executionTimeTotal: 0,
          lastRequestTime: 0,
        };
      }
    } else {
      usage = {
        userId,
        date: today,
        requestCount: 0,
        executionTimeTotal: 0,
        lastRequestTime: 0,
      };
    }

    usage.requestCount++;
    usage.executionTimeTotal += executionTime;
    usage.lastRequestTime = Date.now();

    getStorage().setItem(usageKey, JSON.stringify(usage));

    // Also store analytics
    updateAnalytics(success, executionTime);

    logger.debug(`Tracked usage for user ${userId}. Today's requests: ${usage.requestCount}`);
  } catch (error) {
    logger.error('Error tracking usage:', error);
  }
}

/**
 * Get today's usage for a user
 */
export function getTodayUsage(userId: string): UserUsage | null {
  try {
    const usageKey = getUsageKey(userId);
    const stored = getStorage().getItem(usageKey);

    if (!stored) {
      return null;
    }

    const usage: UserUsage = JSON.parse(stored);

    // Check if it's still today
    if (usage.date !== getTodayString()) {
      return null;
    }

    return usage;
  } catch (error) {
    logger.error('Error getting today usage:', error);
    return null;
  }
}

/**
 * Check if user has exceeded daily quota
 */
export function hasExceededQuota(userId: string): boolean {
  const usage = getTodayUsage(userId);

  if (!usage) {
    return false;
  }

  return usage.requestCount >= USAGE_CONFIG.DAILY_QUOTA;
}

/**
 * Get remaining quota for a user
 */
export function getRemainingQuota(userId: string): number {
  const usage = getTodayUsage(userId);

  if (!usage) {
    return USAGE_CONFIG.DAILY_QUOTA;
  }

  return Math.max(0, USAGE_CONFIG.DAILY_QUOTA - usage.requestCount);
}

/**
 * Update global analytics
 */
function updateAnalytics(success: boolean, executionTime: number): void {
  try {
    const analyticsKey = 'python_analytics';
    const stored = getStorage().getItem(analyticsKey);
    let analytics: Partial<UsageAnalytics>;

    if (stored) {
      analytics = JSON.parse(stored);
    } else {
      analytics = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageExecutionTime: 0,
      };
    }

    analytics.totalRequests = (analytics.totalRequests || 0) + 1;

    if (success) {
      analytics.successfulRequests = (analytics.successfulRequests || 0) + 1;
    } else {
      analytics.failedRequests = (analytics.failedRequests || 0) + 1;
    }

    // Update average execution time
    const currentAvg = analytics.averageExecutionTime || 0;
    const totalRequests = analytics.totalRequests;
    analytics.averageExecutionTime = (currentAvg * (totalRequests - 1) + executionTime) / totalRequests;

    getStorage().setItem(analyticsKey, JSON.stringify(analytics));
  } catch (error) {
    logger.error('Error updating analytics:', error);
  }
}

/**
 * Get usage analytics
 */
export function getAnalytics(): UsageAnalytics | null {
  try {
    const analyticsKey = 'python_analytics';
    const stored = getStorage().getItem(analyticsKey);

    if (!stored) {
      return null;
    }

    return JSON.parse(stored) as UsageAnalytics;
  } catch (error) {
    logger.error('Error getting analytics:', error);
    return null;
  }
}

/**
 * Reset usage data for a user
 */
export function resetUsage(userId: string): void {
  try {
    const usageKey = getUsageKey(userId);
    const rateLimitKey = getRateLimitKey(userId);

    getStorage().removeItem(usageKey);
    getStorage().removeItem(rateLimitKey);

    logger.info(`Reset usage data for user ${userId}`);
  } catch (error) {
    logger.error('Error resetting usage:', error);
  }
}

/**
 * Get usage configuration
 */
export function getUsageConfig() {
  return {
    rateLimitRequests: USAGE_CONFIG.RATE_LIMIT_REQUESTS,
    rateLimitWindowMinutes: USAGE_CONFIG.RATE_LIMIT_WINDOW_MS / 1000 / 60,
    dailyQuota: USAGE_CONFIG.DAILY_QUOTA,
  };
}

export default {
  checkRateLimit,
  recordRequest,
  trackUsage,
  getTodayUsage,
  hasExceededQuota,
  getRemainingQuota,
  getAnalytics,
  resetUsage,
  getUsageConfig,
};
