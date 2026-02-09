import { useState, useEffect, useRef } from 'react';
import { useLoaderData, useFetcher } from '@remix-run/react';
import { json, type LoaderFunctionArgs } from '@remix-run/node';
import type { TerminalSession } from '~/types/terminal';

interface Command {
  command: string;
  output: string;
  status: 'running' | 'completed' | 'failed';
}

interface TerminalSessionWithCommands extends TerminalSession {
  commands: Command[];
}

interface LoaderData {
  sessions: TerminalSessionWithCommands[];
}

export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
  // Return empty initially - data will be fetched client-side for real-time updates
  return json<LoaderData>({ sessions: [] });
}

export default function AITerminal() {
  const { sessions: initialSessions } = useLoaderData<LoaderData>();
  const fetcher = useFetcher<{ sessions?: TerminalSession[]; session?: TerminalSession; error?: string }>();
  const [sessions, setSessions] = useState<TerminalSessionWithCommands[]>(initialSessions);
  const [activeSession, setActiveSession] = useState<TerminalSessionWithCommands | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionEnv, setNewSessionEnv] = useState('development');
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Fetch real-time terminal sessions on mount and periodically
  useEffect(() => {
    const fetchSessions = () => {
      fetcher.load('/api/terminal/sessions');
    };

    // Fetch immediately
    fetchSessions();

    // Poll every 5 seconds for real-time updates
    const interval = setInterval(fetchSessions, 5000);

    return () => clearInterval(interval);
  }, []);

  // Update sessions when fetcher data changes
  useEffect(() => {
    if (fetcher.data?.sessions) {
      const sessionsWithCommands: TerminalSessionWithCommands[] = fetcher.data.sessions.map((session) => ({
        ...session,
        commands: [
          {
            command: 'npm install',
            output: 'Installing dependencies...',
            status: 'completed' as const,
          },
          {
            command: 'git status',
            output: 'On branch main\nNothing to commit, working tree clean',
            status: 'completed' as const,
          },
        ],
      }));
      setSessions(sessionsWithCommands);
    }
  }, [fetcher.data]);

  // Handle new session creation response
  useEffect(() => {
    if (fetcher.data?.session) {
      const newSession: TerminalSessionWithCommands = {
        ...fetcher.data.session,
        commands: [],
      };
      setSessions((prev) => [newSession, ...prev]);
      setActiveSession(newSession);
      setIsCreatingSession(false);
      setNewSessionName('');
    }
  }, [fetcher.data?.session]);

  // Find the current session based on activeSessionId
  const currentSession = activeSession || sessions[0];

  // Set first session as active by default
  useEffect(() => {
    if (sessions.length > 0 && !activeSession) {
      setActiveSession(sessions[0]);
    }
  }, [sessions, activeSession]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newSessionName.trim()) {
      return;
    }

    fetcher.submit(
      { name: newSessionName, environment: newSessionEnv },
      { method: 'POST', action: '/api/terminal/sessions' },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const command = currentCommand.trim();

      if (command) {
        setCommandHistory((prev) => [...prev, command]);
        setCurrentCommand('');

        // Here you would execute the command and update the session
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();

      if (commandHistory.length > 0) {
        const lastCommand = commandHistory[commandHistory.length - 1];
        setCurrentCommand(lastCommand);
        setCommandHistory((prev) => prev.slice(0, -1));
      }
    }
  };

  const formatLastActivity = (dateString: string): string => {
    try {
      const date = new Date(dateString);

      if (isNaN(date.getTime())) {
        return 'Unknown';
      }

      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) {
        return 'Just now';
      }

      if (diffInSeconds < 3600) {
        return `${Math.floor(diffInSeconds / 60)}m ago`;
      }

      if (diffInSeconds < 86400) {
        return `${Math.floor(diffInSeconds / 3600)}h ago`;
      }

      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown';
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 p-4 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Terminal Sessions</h2>
          <button
            onClick={() => setIsCreatingSession(true)}
            className="p-2 bg-red-600 rounded hover:bg-red-700"
            title="New Session"
          >
            +
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto mb-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => setActiveSession(session)}
              className={`p-3 mb-2 rounded cursor-pointer ${
                activeSession?.id === session.id ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <div className="font-medium">{session.name}</div>
              <div className="text-xs text-gray-400">{formatLastActivity(session.lastActivity)}</div>
            </div>
          ))}
        </div>

        {/* Create Session Modal */}
        {isCreatingSession && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg w-96">
              <h3 className="text-xl font-bold mb-4">Create New Session</h3>
              <form onSubmit={handleCreateSession}>
                <input
                  type="text"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="Session name"
                  className="w-full p-2 mb-4 bg-gray-700 rounded text-white"
                  autoFocus
                />
                <select
                  value={newSessionEnv}
                  onChange={(e) => setNewSessionEnv(e.target.value)}
                  className="w-full p-2 mb-4 bg-gray-700 rounded text-white"
                >
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                </select>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 p-2 bg-red-600 rounded hover:bg-red-700"
                    disabled={fetcher.state === 'submitting'}
                  >
                    {fetcher.state === 'submitting' ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingSession(false);
                      setNewSessionName('');
                    }}
                    className="flex-1 p-2 bg-gray-700 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Terminal Content */}
      <div className="flex-1 flex flex-col">
        {currentSession && (
          <>
            <div className="p-4 bg-gray-800 border-b border-gray-700">
              <h3 className="text-lg font-bold">{currentSession.name}</h3>
              <div className="text-sm text-gray-400">
                {currentSession.environment} • {formatLastActivity(currentSession.lastActivity)}
              </div>
            </div>

            <div ref={terminalRef} className="flex-1 p-4 overflow-y-auto font-mono text-sm bg-black">
              {currentSession.commands.map((cmd, index) => (
                <div key={index} className="mb-4">
                  <div className="flex items-center gap-2 text-green-400 mb-1">
                    <span className="text-blue-400">$</span>
                    <span>{cmd.command}</span>
                  </div>
                  <div className={`pl-4 ${cmd.status === 'running' ? 'text-yellow-400' : 'text-gray-300'}`}>
                    {cmd.output}
                  </div>
                </div>
              ))}

              {/* Command Input */}
              <div className="flex items-center gap-2 text-green-400">
                <span className="text-blue-400">$</span>
                <input
                  type="text"
                  value={currentCommand}
                  onChange={(e) => setCurrentCommand(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent outline-none text-gray-300"
                  placeholder="Type a command..."
                  autoFocus
                />
              </div>
            </div>

            {/* Command History Sidebar */}
            <div className="w-64 bg-gray-800 p-4 border-l border-gray-700">
              <h3 className="text-lg font-bold mb-4">Command History</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {commandHistory
                  .slice(-20)
                  .reverse()
                  .map((cmd, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentCommand(cmd)}
                      className="block w-full text-left px-3 py-2 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 font-mono"
                    >
                      <span className="text-blue-400">$</span> {cmd}
                    </button>
                  ))}
              </div>
            </div>
          </>
        )}

        {!currentSession && (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-xl mb-4">No terminal sessions</p>
              <button
                onClick={() => setIsCreatingSession(true)}
                className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
              >
                Create Your First Session
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
