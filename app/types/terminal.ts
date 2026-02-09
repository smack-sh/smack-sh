export interface ITerminal {
  readonly cols?: number;
  readonly rows?: number;

  reset: () => void;
  write: (data: string) => void;
  onData: (cb: (data: string) => void) => void;
  input: (data: string) => void;
}

export type TerminalStatus = 'active' | 'inactive' | 'terminated';

export interface TerminalSession {
  id: string;
  userId: string;
  name: string;
  status: TerminalStatus;
  environment: string;
  lastActivity: string;
  createdAt: string;
  updatedAt: string;
}

