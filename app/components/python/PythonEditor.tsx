import React, { useState, useCallback, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { classNames } from '~/utils/classNames';
import { createScopedLogger } from '~/utils/logger';
import { Button } from '~/components/ui/Button';
import type { PythonExecutionResult } from '~/lib/python/executor';
import { executePython, preloadPythonEnvironment } from '~/lib/python/executor';

const logger = createScopedLogger('PythonEditor');

/**
 * Python Editor Props
 */
interface PythonEditorProps {
  className?: string;
  initialCode?: string;
  height?: string;
  onExecute?: (result: PythonExecutionResult) => void;
  showOutput?: boolean;
}

/**
 * Default Python code template
 */
const DEFAULT_CODE = `# Welcome to the Python Editor!
# You can write and execute Python code here.

import numpy as np
import pandas as pd

# Example: Create a simple calculation
def calculate_stats(numbers):
    \"\"\"Calculate mean and standard deviation\"\"\"
    return {
        'mean': np.mean(numbers),
        'std': np.std(numbers),
        'count': len(numbers)
    }

# Example data
data = [12, 45, 67, 23, 89, 34, 56, 78, 90, 11]

# Calculate and display results
result = calculate_stats(data)
print("Statistics:")
for key, value in result.items():
    print(f"  {key}: {value:.2f}")
`;

/**
 * Python Editor Component
 */
export function PythonEditor({
  className,
  initialCode = DEFAULT_CODE,
  height = '500px',
  onExecute,
  showOutput = true,
}: PythonEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionTime, setExecutionTime] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnvReady, setIsEnvReady] = useState(false);
  const editorRef = useRef<unknown>(null);

  // Preload Python environment on mount
  useEffect(() => {
    const preload = async () => {
      try {
        logger.info('Preloading Python environment...');
        await preloadPythonEnvironment();
        setIsEnvReady(true);
        logger.info('Python environment ready');
      } catch (err) {
        logger.error('Failed to preload Python environment:', err);
        toast.error('Failed to initialize Python environment');
      }
    };

    preload();
  }, []);

  // Handle editor mount
  const handleEditorDidMount = useCallback((editor: unknown) => {
    editorRef.current = editor;
    setIsLoading(false);
  }, []);

  // Execute Python code
  const handleExecute = useCallback(async () => {
    if (!code.trim()) {
      toast.error('Please enter some Python code to execute');
      return;
    }

    setIsExecuting(true);
    setOutput('');
    setError(null);

    try {
      logger.info('Executing Python code...');
      const result = await executePython(code, {
        captureVariables: true,
        timeout: 30000,
      });

      setExecutionTime(result.executionTime);

      if (result.success) {
        setOutput(result.output);
        toast.success(`Execution completed in ${result.executionTime}ms`);
      } else {
        setError(result.error || 'Execution failed');
        setOutput(result.output);
        toast.error(`Execution failed: ${result.error}`);
      }

      if (onExecute) {
        onExecute(result);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      logger.error('Error executing code:', err);
      setError(errorMessage);
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsExecuting(false);
    }
  }, [code, onExecute]);

  // Export code to .py file
  const handleExport = useCallback(() => {
    try {
      const blob = new Blob([code], { type: 'text/x-python' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'script.py';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Code exported to script.py');
    } catch (err) {
      logger.error('Error exporting code:', err);
      toast.error('Failed to export code');
    }
  }, [code]);

  // Clear editor
  const handleClear = useCallback(() => {
    setCode('');
    setOutput('');
    setError(null);
    setExecutionTime(0);
  }, []);

  // Load example code
  const handleLoadExample = useCallback(() => {
    const examples = [
      {
        name: 'Data Analysis',
        code: `import numpy as np
import pandas as pd

# Create sample data
data = {
    'A': np.random.randn(100),
    'B': np.random.randn(100),
    'C': np.random.randint(0, 100, 100)
}

# Create DataFrame
df = pd.DataFrame(data)

# Display statistics
print("Data Summary:")
print(df.describe())

print("\\nCorrelation Matrix:")
print(df.corr())`,
      },
      {
        name: 'Plotting',
        code: `import numpy as np
import matplotlib.pyplot as plt

# Generate data
x = np.linspace(0, 10, 100)
y1 = np.sin(x)
y2 = np.cos(x)

# Create plot
plt.figure(figsize=(10, 6))
plt.plot(x, y1, label='sin(x)', color='blue')
plt.plot(x, y2, label='cos(x)', color='red')
plt.xlabel('x')
plt.ylabel('y')
plt.title('Trigonometric Functions')
plt.legend()
plt.grid(True)

# Display plot info
print("Plot created successfully!")
print(f"Data points: {len(x)}")
print(f"x range: [{x.min():.2f}, {x.max():.2f}]")
print(f"sin(x) range: [{y1.min():.2f}, {y1.max():.2f}]")`,
      },
      {
        name: 'HTTP Request',
        code: `import json
import requests

# Example: Fetch data from an API
try:
    # Note: In sandboxed environment, network requests may be limited
    url = 'https://jsonplaceholder.typicode.com/posts/1'

    print(f"Fetching data from: {url}")
    print("Note: Network requests may be restricted in the sandboxed environment")

    # Simulate data parsing
    sample_data = {
        "userId": 1,
        "id": 1,
        "title": "Sample Post",
        "body": "This is sample post content"
    }

    print("\\nParsed data:")
    print(json.dumps(sample_data, indent=2))

    print("\\nData keys:")
    for key in sample_data.keys():
        print(f"  - {key}")

except Exception as e:
    print(f"Error: {e}")`,
      },
    ];

    // Simple random selection
    const randomExample = examples[Math.floor(Math.random() * examples.length)];
    setCode(randomExample.code);
    setOutput('');
    setError(null);
    toast.success(`Loaded example: ${randomExample.name}`);
  }, []);

  return (
    <div className={classNames('flex flex-col gap-4', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-smack-elements-background-depth-2 dark:bg-smack-elements-background-depth-3 rounded-lg border border-smack-elements-borderColor dark:border-smack-elements-borderColor-dark">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-smack-elements-textPrimary dark:text-smack-elements-textPrimary-dark">
            Python Editor
          </span>
          {isEnvReady && (
            <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <span className="i-ph:check-circle w-3 h-3" />
              Ready
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleLoadExample} disabled={isExecuting}>
            <span className="i-ph:lightbulb w-4 h-4 mr-1" />
            Example
          </Button>

          <Button variant="outline" size="sm" onClick={handleClear} disabled={isExecuting}>
            <span className="i-ph:eraser w-4 h-4 mr-1" />
            Clear
          </Button>

          <Button variant="outline" size="sm" onClick={handleExport} disabled={isExecuting || !code.trim()}>
            <span className="i-ph:download w-4 h-4 mr-1" />
            Export .py
          </Button>

          <Button
            size="sm"
            onClick={handleExecute}
            disabled={isExecuting || !isEnvReady}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isExecuting ? (
              <>
                <span className="i-ph:spinner animate-spin w-4 h-4 mr-1" />
                Running...
              </>
            ) : (
              <>
                <span className="i-ph:play w-4 h-4 mr-1" />
                Run
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="relative rounded-lg overflow-hidden border border-smack-elements-borderColor dark:border-smack-elements-borderColor-dark">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-smack-elements-background-depth-1 z-10">
            <div className="flex items-center gap-2 text-smack-elements-textSecondary">
              <span className="i-ph:spinner animate-spin w-5 h-5" />
              Loading editor...
            </div>
          </div>
        )}

        <Editor
          height={height}
          defaultLanguage="python"
          value={code}
          onChange={(value) => setCode(value || '')}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: isExecuting,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            wordWrap: 'on',
            folding: true,
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
            padding: { top: 16, bottom: 16 },
          }}
        />
      </div>

      {/* Output Panel */}
      <AnimatePresence>
        {showOutput && (output || error || isExecuting) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg overflow-hidden border border-smack-elements-borderColor dark:border-smack-elements-borderColor-dark"
          >
            <div className="flex items-center justify-between px-4 py-2 bg-smack-elements-background-depth-3 dark:bg-smack-elements-background-depth-4 border-b border-smack-elements-borderColor dark:border-smack-elements-borderColor-dark">
              <span className="text-sm font-medium text-smack-elements-textPrimary dark:text-smack-elements-textPrimary-dark">
                Output
              </span>
              {executionTime > 0 && (
                <span className="text-xs text-smack-elements-textSecondary">
                  Executed in {executionTime}ms
                </span>
              )}
            </div>

            <div className="p-4 bg-smack-elements-background-depth-2 dark:bg-smack-elements-background-depth-3 font-mono text-sm">
              {isExecuting && !output && (
                <div className="flex items-center gap-2 text-smack-elements-textSecondary">
                  <span className="i-ph:spinner animate-spin w-4 h-4" />
                  Executing...
                </div>
              )}

              {error && (
                <div className="text-red-600 dark:text-red-400 mb-2">
                  <span className="font-semibold">Error:</span>
                  <pre className="mt-1 whitespace-pre-wrap">{error}</pre>
                </div>
              )}

              {output && (
                <pre className="text-smack-elements-textPrimary dark:text-smack-elements-textPrimary-dark whitespace-pre-wrap">
                  {output}
                </pre>
              )}

              {!output && !error && !isExecuting && (
                <span className="text-smack-elements-textTertiary italic">No output yet. Run your code to see results.</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-smack-elements-background-depth-1 dark:bg-smack-elements-background-depth-2 rounded-lg text-xs text-smack-elements-textSecondary">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="i-ph:file-code w-3 h-3" />
            {code.split('\n').length} lines
          </span>
          <span className="flex items-center gap-1">
            <span className="i-ph:text-t w-3 h-3" />
            {code.length} chars
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span>Python 3.11 (Pyodide)</span>
          {!isEnvReady && (
            <span className="flex items-center gap-1 text-yellow-600">
              <span className="i-ph:warning w-3 h-3" />
              Initializing...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default PythonEditor;
