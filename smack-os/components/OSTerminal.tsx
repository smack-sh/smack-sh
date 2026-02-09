import { useState, useRef, useEffect } from 'react';

interface OSTerminalProps {
  onCommand: (command: string) => Promise<string>;
  isReady: boolean;
}

/**
 * OSTerminal - Terminal interface for Smack OS
 * 
 * Provides a command-line interface to interact with the Linux environment
 */
export function OSTerminal({ onCommand, isReady }: OSTerminalProps) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<Array<{ command: string; output: string }>>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when history updates
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || !isReady || isExecuting) return;

    const command = input.trim();
    setInput('');
    setIsExecuting(true);

    try {
      const output = await onCommand(command);
      setHistory(prev => [...prev, { command, output }]);
    } catch (error) {
      setHistory(prev => [...prev, { 
        command, 
        output: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }]);
    } finally {
      setIsExecuting(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-64 bg-gray-900 border-t border-gray-800">
      {/* Terminal Output */}
      <div
        ref={historyRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm"
      >
        {history.length === 0 && (
          <div className="text-gray-500">
            <p>Smack OS Terminal - Alpine Linux</p>
            <p className="mt-1">Type commands to interact with the OS</p>
            <p className="mt-2 text-xs">
              Examples: ls, pwd, apk add python3, gcc --version
            </p>
          </div>
        )}
        
        {history.map((entry, index) => (
          <div key={index} className="mb-3">
            <div className="flex items-center gap-2 text-green-400">
              <span>$</span>
              <span className="text-gray-300">{entry.command}</span>
            </div>
            <pre className="text-gray-400 mt-1 whitespace-pre-wrap">
              {entry.output}
            </pre>
          </div>
        ))}

        {isExecuting && (
          <div className="flex items-center gap-2 text-yellow-400">
            <span className="animate-pulse">Executing...</span>
          </div>
        )}
      </div>

      {/* Terminal Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-4 border-t border-gray-800">
        <span className="text-green-400 font-mono">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!isReady || isExecuting}
          placeholder={isReady ? "Enter command..." : "Waiting for OS..."}
          className="flex-1 bg-transparent text-gray-300 font-mono text-sm outline-none placeholder-gray-600 disabled:opacity-50"
          autoFocus
        />
      </form>
    </div>
  );
}
