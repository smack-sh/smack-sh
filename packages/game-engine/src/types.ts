export type GameAiProvider = {
  generate: (input: {
    systemPrompt: string;
    userPrompt: string;
    includePhysics?: boolean;
    language?: 'typescript';
    includeComments?: boolean;
  }) => Promise<string>;
};

export type PhaserGame = {
  scenes: string[];
  sprites: string[];
  physics: Record<string, unknown>;
  controls: Record<string, string>;
  logic: string;
};

