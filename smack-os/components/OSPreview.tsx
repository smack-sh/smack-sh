import { useEffect, useRef, useState } from 'react';
import { OSTerminal } from './OSTerminal';

interface OSPreviewProps {
  onReady?: () => void;
  onCommand?: (command: string, output: string) => void;
}

/**
 * OSPreview - Linux OS Preview Component
 * 
 * Provides a full Linux environment using WebVM (Alpine Linux)
 * This component integrates with the agentic AI system to provide
 * a real operating system for code execution and development.
 */
export function OSPreview({ onReady, onCommand }: OSPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [osReady, setOsReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Initialize WebVM/v86 emulator
    const initializeOS = async () => {
      try {
        // WebVM uses Alpine Linux compiled to WebAssembly
        // This provides a full Linux environment in the browser
        setIsLoading(true);
        
        // Wait for iframe to load
        if (iframeRef.current) {
          iframeRef.current.onload = () => {
            setIsLoading(false);
            setOsReady(true);
            onReady?.();
          };
        }
      } catch (error) {
        console.error('Failed to initialize OS:', error);
        setIsLoading(false);
      }
    };

    initializeOS();
  }, [onReady]);

  const executeCommand = async (command: string): Promise<string> => {
    if (!osReady || !iframeRef.current) {
      throw new Error('OS not ready');
    }

    // Send command to WebVM iframe
    return new Promise((resolve) => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'command-output') {
          window.removeEventListener('message', handleMessage);
          const output = event.data.output;
          onCommand?.(command, output);
          resolve(output);
        }
      };

      window.addEventListener('message', handleMessage);
      
      iframeRef.current?.contentWindow?.postMessage({
        type: 'execute-command',
        command,
      }, '*');
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-950 rounded-lg overflow-hidden border border-gray-800">
      {/* OS Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-sm font-medium text-gray-300 ml-2">
            Smack OS - Alpine Linux
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && (
            <span className="text-xs text-gray-400">Booting...</span>
          )}
          {osReady && (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              Ready
            </span>
          )}
        </div>
      </div>

      {/* OS Content */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-950">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Initializing Alpine Linux...</p>
              <p className="text-xs text-gray-500 mt-2">
                Loading kernel and filesystem
              </p>
            </div>
          </div>
        )}

        {/* WebVM Iframe - Alpine Linux */}
        <iframe
          ref={iframeRef}
          src="https://webvm.io"
          className="w-full h-full border-0"
          title="Smack OS - Alpine Linux"
          sandbox="allow-same-origin allow-scripts allow-forms allow-downloads"
        />
      </div>

      {/* Terminal Interface */}
      <OSTerminal
        onCommand={executeCommand}
        isReady={osReady}
      />
    </div>
  );
}
