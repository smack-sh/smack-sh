import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { classNames } from '~/utils/classNames';
import { createScopedLogger } from '~/utils/logger';
import { Button } from '~/components/ui/Button';
import type { PythonExecutionResult } from '~/lib/python/executor';
import { getTodayUsage, getAnalytics, getRemainingQuota, getUsageConfig } from '~/lib/python/usage-tracker';

const logger = createScopedLogger('PythonConsole');

/**
 * Execution history item
 */
interface ExecutionHistoryItem {
  id: string;
  timestamp: number;
  code: string;
  result: PythonExecutionResult;
}

/**
 * Variable info
 */
interface VariableInfo {
  name: string;
  type: string;
  value: unknown;
  size?: number;
}

/**
 * Python Console Props
 */
interface PythonConsoleProps {
  className?: string;
  executionHistory?: ExecutionHistoryItem[];
  currentVariables?: Record<string, unknown>;
}

/**
 * Format variable value for display
 */
function formatVariableValue(value: unknown): string {
  if (value === null) return 'None';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value).substring(0, 100);
    } catch {
      return '<object>';
    }
  }
  return String(value);
}

/**
 * Get variable type
 */
function getVariableType(value: unknown): string {
  if (value === null) return 'NoneType';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'list';
  if (typeof value === 'object') {
    return value.constructor?.name || 'object';
  }
  return typeof value;
}

/**
 * Python Console Component
 */
export function PythonConsole({
  className,
  executionHistory = [],
  currentVariables = {},
}: PythonConsoleProps) {
  const [activeTab, setActiveTab] = useState<'variables' | 'history' | 'errors' | 'usage'>('variables');
  const [usage, setUsage] = useState({
    remainingQuota: 100,
    dailyQuota: 100,
    todayRequests: 0,
  });
  const [analytics, setAnalytics] = useState<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageExecutionTime: number;
  } | null>(null);

  // Load usage data
  useEffect(() => {
    const loadUsage = () => {
      // For development, use a default user ID
      const userId = 'default_user';

      const todayUsage = getTodayUsage(userId);
      const remainingQuota = getRemainingQuota(userId);
      const config = getUsageConfig();
      const analyticsData = getAnalytics();

      setUsage({
        remainingQuota,
        dailyQuota: config.dailyQuota,
        todayRequests: todayUsage?.requestCount || 0,
      });

      if (analyticsData) {
        setAnalytics({
          totalRequests: analyticsData.totalRequests || 0,
          successfulRequests: analyticsData.successfulRequests || 0,
          failedRequests: analyticsData.failedRequests || 0,
          averageExecutionTime: analyticsData.averageExecutionTime || 0,
        });
      }
    };

    loadUsage();

    // Refresh every 30 seconds
    const interval = setInterval(loadUsage, 30000);
    return () => clearInterval(interval);
  }, []);

  // Convert variables to display format
  const variables: VariableInfo[] = Object.entries(currentVariables).map(([name, value]) => ({
    name,
    type: getVariableType(value),
    value,
    size: Array.isArray(value) ? value.length : undefined,
  }));

  // Filter history for errors
  const errorHistory = executionHistory.filter((item) => !item.result.success);

  // Clear history handler
  const handleClearHistory = useCallback(() => {
    // This would need to be implemented via a prop callback in real usage
    toast.info('History clear functionality would be implemented here');
  }, []);

  // Export history handler
  const handleExportHistory = useCallback(() => {
    try {
      const data = {
        timestamp: new Date().toISOString(),
        history: executionHistory,
        variables: currentVariables,
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `python-session-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Session exported successfully');
    } catch (err) {
      logger.error('Error exporting history:', err);
      toast.error('Failed to export session');
    }
  }, [executionHistory, currentVariables]);

  return (
    <div className={classNames('flex flex-col h-full bg-smack-elements-background-depth-1 rounded-lg overflow-hidden', className)}>
      {/* Tabs */}
      <div className="flex items-center border-b border-smack-elements-borderColor dark:border-smack-elements-borderColor-dark">
        {[
          { id: 'variables', label: 'Variables', icon: 'i-ph:brackets-curly', count: variables.length },
          { id: 'history', label: 'History', icon: 'i-ph:clock-counter-clockwise', count: executionHistory.length },
          { id: 'errors', label: 'Errors', icon: 'i-ph:warning-circle', count: errorHistory.length },
          { id: 'usage', label: 'Usage', icon: 'i-ph:chart-bar' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={classNames(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
              'border-b-2',
              activeTab === tab.id
                ? 'border-smack-elements-item-contentAccent text-smack-elements-item-contentAccent'
                : 'border-transparent text-smack-elements-textSecondary hover:text-smack-elements-textPrimary',
            )}
          >
            <span className={tab.icon} />
            {tab.label}
            {typeof tab.count === 'number' && tab.count > 0 && (
              <span
                className={classNames(
                  'px-2 py-0.5 text-xs rounded-full',
                  tab.id === 'errors'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-smack-elements-background-depth-3 text-smack-elements-textSecondary',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          {/* Variables Tab */}
          {activeTab === 'variables' && (
            <motion.div
              key="variables"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4"
            >
              {variables.length === 0 ? (
                <div className="text-center py-8 text-smack-elements-textTertiary">
                  <span className="i-ph:brackets-curly text-4xl mb-2 block" />
                  <p>No variables defined yet</p>
                  <p className="text-sm mt-1">Run some code to see variables here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {variables.map((variable) => (
                    <div
                      key={variable.name}
                      className="p-3 bg-smack-elements-background-depth-2 dark:bg-smack-elements-background-depth-3 rounded-lg border border-smack-elements-borderColor dark:border-smack-elements-borderColor-dark"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-sm font-semibold text-smack-elements-item-contentAccent">
                          {variable.name}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-smack-elements-background-depth-3 dark:bg-smack-elements-background-depth-4 rounded text-smack-elements-textSecondary">
                          {variable.type}
                        </span>
                      </div>
                      <div className="font-mono text-sm text-smack-elements-textPrimary dark:text-smack-elements-textPrimary-dark truncate">
                        {formatVariableValue(variable.value)}
                      </div>
                      {variable.size !== undefined && (
                        <div className="text-xs text-smack-elements-textTertiary mt-1">
                          Size: {variable.size} items
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4"
            >
              {executionHistory.length === 0 ? (
                <div className="text-center py-8 text-smack-elements-textTertiary">
                  <span className="i-ph:clock-counter-clockwise text-4xl mb-2 block" />
                  <p>No execution history</p>
                  <p className="text-sm mt-1">Run some code to see history here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {executionHistory.map((item) => (
                    <div
                      key={item.id}
                      className={classNames(
                        'p-3 rounded-lg border',
                        item.result.success
                          ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                          : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800',
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-smack-elements-textTertiary">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                        <span
                          className={classNames(
                            'text-xs px-2 py-0.5 rounded',
                            item.result.success
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                          )}
                        >
                          {item.result.success ? 'Success' : 'Failed'}
                        </span>
                      </div>
                      <pre className="text-xs font-mono text-smack-elements-textPrimary dark:text-smack-elements-textPrimary-dark whitespace-pre-wrap line-clamp-3">
                        {item.code}
                      </pre>
                      <div className="text-xs text-smack-elements-textTertiary mt-1">
                        {item.result.executionTime}ms
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Errors Tab */}
          {activeTab === 'errors' && (
            <motion.div
              key="errors"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4"
            >
              {errorHistory.length === 0 ? (
                <div className="text-center py-8 text-smack-elements-textTertiary">
                  <span className="i-ph:check-circle text-4xl mb-2 block text-green-500" />
                  <p>No errors</p>
                  <p className="text-sm mt-1">All executions have been successful</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {errorHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-red-600 dark:text-red-400 font-semibold">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="text-xs text-red-600 dark:text-red-400">
                          {item.result.executionTime}ms
                        </span>
                      </div>
                      <pre className="text-xs font-mono text-red-700 dark:text-red-400 whitespace-pre-wrap line-clamp-2 mb-2">
                        {item.code}
                      </pre>
                      <div className="text-xs font-mono text-red-800 dark:text-red-300 bg-red-100 dark:bg-red-900/30 p-2 rounded">
                        {item.result.error}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Usage Tab */}
          {activeTab === 'usage' && (
            <motion.div
              key="usage"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4"
            >
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-smack-elements-background-depth-2 dark:bg-smack-elements-background-depth-3 rounded-lg">
                  <div className="text-sm text-smack-elements-textSecondary mb-1">Remaining Quota</div>
                  <div className="text-2xl font-bold text-smack-elements-textPrimary">
                    {usage.remainingQuota}
                  </div>
                  <div className="text-xs text-smack-elements-textTertiary">
                    of {usage.dailyQuota} daily
                  </div>
                </div>

                <div className="p-4 bg-smack-elements-background-depth-2 dark:bg-smack-elements-background-depth-3 rounded-lg">
                  <div className="text-sm text-smack-elements-textSecondary mb-1">Today's Requests</div>
                  <div className="text-2xl font-bold text-smack-elements-textPrimary">
                    {usage.todayRequests}
                  </div>
                  <div className="text-xs text-smack-elements-textTertiary">
                    executions today
                  </div>
                </div>
              </div>

              {analytics && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-smack-elements-textPrimary">All Time Statistics</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-smack-elements-background-depth-2 dark:bg-smack-elements-background-depth-3 rounded-lg">
                      <div className="text-xs text-smack-elements-textSecondary">Total Requests</div>
                      <div className="text-lg font-semibold text-smack-elements-textPrimary">
                        {analytics.totalRequests}
                      </div>
                    </div>

                    <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                      <div className="text-xs text-green-700 dark:text-green-400">Successful</div>
                      <div className="text-lg font-semibold text-green-700 dark:text-green-400">
                        {analytics.successfulRequests}
                      </div>
                    </div>

                    <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                      <div className="text-xs text-red-700 dark:text-red-400">Failed</div>
                      <div className="text-lg font-semibold text-red-700 dark:text-red-400">
                        {analytics.failedRequests}
                      </div>
                    </div>

                    <div className="p-3 bg-smack-elements-background-depth-2 dark:bg-smack-elements-background-depth-3 rounded-lg">
                      <div className="text-xs text-smack-elements-textSecondary">Avg Execution Time</div>
                      <div className="text-lg font-semibold text-smack-elements-textPrimary">
                        {Math.round(analytics.averageExecutionTime)}ms
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-xs text-smack-elements-textSecondary mb-2">Success Rate</div>
                    <div className="w-full bg-smack-elements-background-depth-3 dark:bg-smack-elements-background-depth-4 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${analytics.totalRequests > 0 ? (analytics.successfulRequests / analytics.totalRequests) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-smack-elements-textTertiary mt-1">
                      {analytics.totalRequests > 0
                        ? Math.round((analytics.successfulRequests / analytics.totalRequests) * 100)
                        : 0}
                      % success rate
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-smack-elements-borderColor dark:border-smack-elements-borderColor-dark bg-smack-elements-background-depth-2 dark:bg-smack-elements-background-depth-3">
        <div className="text-xs text-smack-elements-textTertiary">
          Python Console v1.0
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportHistory}>
            <span className="i-ph:export w-3 h-3 mr-1" />
            Export
          </Button>

          {(activeTab === 'history' || activeTab === 'errors') && (
            <Button variant="outline" size="sm" onClick={handleClearHistory}>
              <span className="i-ph:trash w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PythonConsole;
