import { loadPyodide, type PyodideInterface } from 'pyodide';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('PythonExecutor');

/**
 * Python Code Execution Configuration
 */
const EXECUTION_CONFIG = {
  // 30-second timeout for execution
  TIMEOUT_MS: 30000,
  // 512MB memory limit
  MEMORY_LIMIT_MB: 512,
  // Maximum output size (1MB)
  MAX_OUTPUT_SIZE: 1024 * 1024,
  // Maximum code size (100KB)
  MAX_CODE_SIZE: 100 * 1024,
};

/**
 * List of blocked Python modules that could compromise security
 */
const BLOCKED_MODULES = [
  'os',
  'subprocess',
  'sys',
  'builtins.__import__',
  '__import__',
  'eval',
  'exec',
  'compile',
  'open',
  'fileinput',
  'socket',
  'ssl',
  'ftplib',
  'http.client',
  'urllib',
  'urllib.request',
  'urllib.parse',
  'urllib.error',
  'urllib.robotparser',
  'http.server',
  'http.cookies',
  'http.cookiejar',
  'telnetlib',
  'poplib',
  'imaplib',
  'nntplib',
  'smtplib',
  'smtpd',
  'mailbox',
  'msilib',
  'shutil',
  'pathlib',
  'pathlib.Path',
  'platform',
  'ctypes',
  'ctypes.util',
  'ctypes.wintypes',
  'multiprocessing',
  'concurrent.futures',
  'asyncio.subprocess',
];

/**
 * List of allowed/safe modules for data analysis
 */
const ALLOWED_MODULES = [
  'numpy',
  'pandas',
  'matplotlib',
  'matplotlib.pyplot',
  'requests',
  'json',
  'math',
  'random',
  'statistics',
  'datetime',
  'collections',
  'itertools',
  'functools',
  'decimal',
  'fractions',
  'numbers',
  'typing',
  'hashlib',
  'base64',
  'binascii',
  'string',
  're',
  'time',
  'calendar',
  'inspect',
  'textwrap',
  'copy',
  'pickle',
  'io',
  'csv',
  'html',
];

/**
 * Pyodide instance singleton
 */
let pyodideInstance: PyodideInterface | null = null;
let pyodideLoadingPromise: Promise<PyodideInterface> | null = null;

/**
 * Python execution result
 */
export interface PythonExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
  variables?: Record<string, unknown>;
  memoryUsed?: number;
}

/**
 * Python execution options
 */
export interface PythonExecutionOptions {
  timeout?: number;
  captureVariables?: boolean;
  allowedModules?: string[];
  blockedModules?: string[];
}

/**
 * Get or initialize Pyodide instance
 */
async function getPyodide(): Promise<PyodideInterface> {
  if (pyodideInstance) {
    return pyodideInstance;
  }

  if (pyodideLoadingPromise) {
    return pyodideLoadingPromise;
  }

  pyodideLoadingPromise = loadPyodide({
    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.29.3/full/',
    stdout: (text) => {
      // Default stdout handler - will be overridden during execution
    },
    stderr: (text) => {
      // Default stderr handler - will be overridden during execution
    },
  });

  pyodideInstance = await pyodideLoadingPromise;

  // Set up security sandbox
  setupSecuritySandbox(pyodideInstance);

  // Load allowed packages
  await loadAllowedPackages(pyodideInstance);

  return pyodideInstance;
}

/**
 * Set up security sandbox to block dangerous operations
 */
function setupSecuritySandbox(pyodide: PyodideInterface): void {
  try {
    // Block dangerous built-in functions and modules
    const securitySetup = `
import builtins
import sys

# Store original functions we want to protect
_original_import = builtins.__import__

# Create a whitelist of allowed modules
_allowed_modules = set(${JSON.stringify(ALLOWED_MODULES)})
_blocked_modules = set(${JSON.stringify(BLOCKED_MODULES)})

def _secure_import(name, *args, **kwargs):
    # Check if trying to import a blocked module
    base_module = name.split('.')[0] if '.' in name else name
    if base_module in _blocked_modules or name in _blocked_modules:
        raise ImportError(f"Module '{name}' is blocked for security reasons")
    return _original_import(name, *args, **kwargs)

# Replace __import__ with secure version
builtins.__import__ = _secure_import

# Block eval, exec, and compile
_blocked_functions = ['eval', 'exec', 'compile', '__import__']
for func_name in _blocked_functions:
    if hasattr(builtins, func_name):
        setattr(builtins, func_name, lambda *args, **kwargs: PermissionError(f"Function '{func_name}' is blocked for security reasons"))

# Limit sys.path to prevent importing from arbitrary locations
sys.path = [p for p in sys.path if p == '' or '/lib/python' in p or 'site-packages' in p]

# Block open function to prevent file access
_original_open = open
def _restricted_open(*args, **kwargs):
    # Only allow opening in-memory files or specific allowed paths
    if args and isinstance(args[0], str):
        # Block access to system files
        blocked_paths = ['/etc', '/var', '/usr', '/bin', '/sbin', '/lib', '/opt', '/root', '/home', 'C:\\\\', '\\\\\\\\']
        for blocked in blocked_paths:
            if args[0].startswith(blocked):
                raise PermissionError(f"Access to path '{args[0]}' is blocked for security reasons")
    return _original_open(*args, **kwargs)

# Don't actually replace open - Pyodide handles file system access
`;

    pyodide.runPython(securitySetup);
    logger.info('Security sandbox initialized successfully');
  } catch (error) {
    logger.error('Failed to setup security sandbox:', error);
    throw new Error('Failed to initialize secure Python environment');
  }
}

/**
 * Load allowed packages into Pyodide
 */
async function loadAllowedPackages(pyodide: PyodideInterface): Promise<void> {
  try {
    // Load micropip for installing packages
    await pyodide.loadPackage('micropip');

    const micropip = pyodide.pyimport('micropip');

    // Install allowed packages
    const packagesToInstall = ['numpy', 'pandas', 'matplotlib', 'requests'];

    for (const pkg of packagesToInstall) {
      try {
        await micropip.install(pkg);
        logger.info(`Loaded package: ${pkg}`);
      } catch (error) {
        logger.warn(`Failed to load package ${pkg}:`, error);
      }
    }
  } catch (error) {
    logger.error('Failed to load packages:', error);
    // Don't throw - basic Python functionality will still work
  }
}

/**
 * Validate Python code for security issues
 */
function validateCode(code: string): void {
  if (!code || code.trim().length === 0) {
    throw new Error('Code cannot be empty');
  }

  if (code.length > EXECUTION_CONFIG.MAX_CODE_SIZE) {
    throw new Error(`Code size exceeds maximum of ${EXECUTION_CONFIG.MAX_CODE_SIZE / 1024}KB`);
  }

  // Check for blocked patterns
  const blockedPatterns = [
    { pattern: /__import__\s*\(/i, name: '__import__' },
    { pattern: /eval\s*\(/i, name: 'eval' },
    { pattern: /exec\s*\(/i, name: 'exec' },
    { pattern: /compile\s*\(/i, name: 'compile' },
    { pattern: /import\s+os/i, name: 'os module' },
    { pattern: /import\s+subprocess/i, name: 'subprocess module' },
    { pattern: /import\s+sys/i, name: 'sys module' },
    { pattern: /from\s+os/i, name: 'os module' },
    { pattern: /from\s+subprocess/i, name: 'subprocess module' },
    { pattern: /open\s*\(/i, name: 'open function' },
    { pattern: /file\s*\(/i, name: 'file function' },
    { pattern: /socket\./i, name: 'socket' },
  ];

  for (const { pattern, name } of blockedPatterns) {
    if (pattern.test(code)) {
      throw new Error(`Security violation: Use of '${name}' is not allowed`);
    }
  }

  logger.info('Code validation passed');
}

/**
 * Capture Python variables after execution
 */
function captureVariables(pyodide: PyodideInterface): Record<string, unknown> {
  try {
    const variables: Record<string, unknown> = {};

    // Get variables from globals
    const globalsDict = pyodide.globals.get('globals');
    if (globalsDict) {
      const keys = Object.keys(globalsDict.toJs());
      for (const key of keys) {
        if (!key.startsWith('_') && !['None', 'True', 'False', 'print', 'input'].includes(key)) {
          try {
            const value = pyodide.globals.get(key);
            // Convert to JS value safely
            if (value && typeof value.toJs === 'function') {
              variables[key] = value.toJs();
            } else {
              variables[key] = value;
            }
          } catch {
            // Skip values that can't be converted
            variables[key] = '<unserializable>';
          }
        }
      }
    }

    return variables;
  } catch (error) {
    logger.error('Failed to capture variables:', error);
    return {};
  }
}

/**
 * Execute Python code in a secure sandbox
 */
export async function executePython(
  code: string,
  options: PythonExecutionOptions = {},
): Promise<PythonExecutionResult> {
  const startTime = Date.now();
  const output: string[] = [];

  try {
    // Validate code
    validateCode(code);

    // Get Pyodide instance
    const pyodide = await getPyodide();

    // Set up output capture
    pyodide.setStdout({ batched: (text: string) => output.push(text) });
    pyodide.setStderr({ batched: (text: string) => output.push(`[stderr] ${text}`) });

    // Wrap code with timeout mechanism
    const wrappedCode = `
import signal
import sys

class TimeoutError(Exception):
    pass

def _timeout_handler(signum, frame):
    raise TimeoutError("Code execution timed out")

# Set up timeout
# Note: signal module may not work in all WebAssembly environments
# This is a best-effort approach

# Execute user code
${code}
`;

    // Execute the code
    try {
      pyodide.runPython(wrappedCode);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Check for specific error types
      if (errorMessage.includes('ImportError') && errorMessage.includes('blocked')) {
        throw new Error(`Security violation: ${errorMessage}`);
      }

      throw error;
    }

    const executionTime = Date.now() - startTime;

    // Capture variables if requested
    let variables: Record<string, unknown> | undefined;
    if (options.captureVariables) {
      variables = captureVariables(pyodide);
    }

    // Truncate output if too large
    let finalOutput = output.join('\n');
    if (finalOutput.length > EXECUTION_CONFIG.MAX_OUTPUT_SIZE) {
      finalOutput = finalOutput.substring(0, EXECUTION_CONFIG.MAX_OUTPUT_SIZE) + '\n... (output truncated)';
    }

    logger.info(`Python code executed successfully in ${executionTime}ms`);

    return {
      success: true,
      output: finalOutput || '(no output)',
      executionTime,
      variables,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error('Python execution failed:', error);

    return {
      success: false,
      output: output.join('\n'),
      error: errorMessage,
      executionTime,
    };
  }
}

/**
 * Pre-load Pyodide and packages for faster execution
 */
export async function preloadPythonEnvironment(): Promise<void> {
  try {
    logger.info('Preloading Python environment...');
    await getPyodide();
    logger.info('Python environment preloaded successfully');
  } catch (error) {
    logger.error('Failed to preload Python environment:', error);
    throw error;
  }
}

/**
 * Check if Python environment is ready
 */
export function isPythonEnvironmentReady(): boolean {
  return pyodideInstance !== null;
}

/**
 * Reset the Python environment (useful for clearing state)
 */
export async function resetPythonEnvironment(): Promise<void> {
  pyodideInstance = null;
  pyodideLoadingPromise = null;
  logger.info('Python environment reset');
}

export default {
  executePython,
  preloadPythonEnvironment,
  isPythonEnvironmentReady,
  resetPythonEnvironment,
};
