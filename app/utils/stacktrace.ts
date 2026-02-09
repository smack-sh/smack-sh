/**
 * Utility for working with stack traces
 */

/**
 * Gets the current stack trace
 */
export function getStackTrace(): string {
  try {
    throw new Error();
  } catch (e) {
    return (e as Error).stack || '';
  }
}

/**
 * Gets the current file name and line number from the stack trace
 */
export function getCurrentPosition(): { file: string; line: number; column: number } | null {
  const stack = getStackTrace();
  const stackLines = stack.split('\n');

  // The 3rd line in the stack trace is where our actual code is called from
  if (stackLines.length >= 3) {
    const callerLine = stackLines[2].trim();
    const match = /at\s+.+\((.+):(\d+):(\d+)\)/.exec(callerLine) || /at\s+(.+):(\d+):(\d+)/.exec(callerLine);

    if (match) {
      return {
        file: match[1],
        line: parseInt(match[2]),
        column: parseInt(match[3]),
      };
    }
  }

  return null;
}

/**
 * Formats a position object into a readable string
 */
export function formatPosition(pos: { file: string; line: number; column: number }): string {
  return `${pos.file}:${pos.line}:${pos.column}`;
}

/**
 * Cleans up a stack trace by removing noise and formatting it nicely
 */
export function cleanStackTrace(stack: string): string {
  if (!stack) {
    return '';
  }

  return stack
    .split('\n')
    .filter((line) => {
      // Remove webpack/vite internals
      if (line.includes('webpack') || line.includes('vite') || line.includes('node_modules')) {
        return false;
      }

      return true;
    })
    .join('\n');
}
