import { ClientOnly } from 'remix-utils/client-only';
import { OSPreview } from '../../smack-os/components/OSPreview';

/**
 * Smack OS Route
 *
 * Provides access to the full Linux operating system environment
 * for the agentic AI system.
 */
export default function OSRoute() {
  const handleOSReady = () => {
    console.log('Smack OS is ready');
  };

  const handleCommand = (command: string, output: string) => {
    console.log('Command executed:', command);
    console.log('Output:', output);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-smack-elements-background-depth-1">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-smack-elements-borderColor">
        <div>
          <h1 className="text-2xl font-bold text-smack-elements-textPrimary">Smack OS</h1>
          <p className="text-sm text-smack-elements-textSecondary mt-1">
            Full Linux environment powered by Alpine Linux
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-smack-elements-textSecondary">
            <span className="font-medium">Distribution:</span> Alpine Linux 3.19
          </div>
          <div className="text-sm text-smack-elements-textSecondary">
            <span className="font-medium">Kernel:</span> 6.6.x
          </div>
        </div>
      </div>

      {/* OS Preview */}
      <div className="flex-1 p-6">
        <ClientOnly
          fallback={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-smack-elements-textSecondary">Loading OS environment...</p>
              </div>
            </div>
          }
        >
          {() => <OSPreview onReady={handleOSReady} onCommand={handleCommand} />}
        </ClientOnly>
      </div>

      {/* Info Panel */}
      <div className="px-6 py-4 border-t border-smack-elements-borderColor bg-smack-elements-background-depth-2">
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-smack-elements-textSecondary">Package Manager:</span>
            <span className="ml-2 text-smack-elements-textPrimary font-mono">apk</span>
          </div>
          <div>
            <span className="text-smack-elements-textSecondary">Shell:</span>
            <span className="ml-2 text-smack-elements-textPrimary font-mono">ash/bash</span>
          </div>
          <div>
            <span className="text-smack-elements-textSecondary">Memory:</span>
            <span className="ml-2 text-smack-elements-textPrimary">512MB</span>
          </div>
          <div>
            <span className="text-smack-elements-textSecondary">Storage:</span>
            <span className="ml-2 text-smack-elements-textPrimary">2GB</span>
          </div>
        </div>
      </div>
    </div>
  );
}
