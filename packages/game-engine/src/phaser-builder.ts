import type { GameAiProvider, PhaserGame } from './types';

class MockGameAiProvider implements GameAiProvider {
  async generate(input: {
    systemPrompt: string;
    userPrompt: string;
    includePhysics?: boolean;
    language?: 'typescript';
    includeComments?: boolean;
  }): Promise<string> {
    return `// ${input.systemPrompt}\n// ${input.userPrompt}\n`;
  }
}

export class PhaserGameBuilder {
  private _ai: GameAiProvider;

  constructor(aiProvider: GameAiProvider = new MockGameAiProvider()) {
    this._ai = aiProvider;
  }

  async generateFromPrompt(description: string): Promise<PhaserGame> {
    const gameConfig = await this._ai.generate({
      systemPrompt: 'Generate Phaser 3 game from description',
      userPrompt: description,
      includePhysics: true,
    });

    return {
      scenes: await this.generateScenes(description),
      sprites: await this.generateSprites(description),
      physics: this.setupPhysics(gameConfig),
      controls: this.setupControls(),
      logic: await this.generateGameLogic(description),
    };
  }

  async generateScenes(description: string): Promise<string[]> {
    return [`BootScene`, `MenuScene`, `GameScene`, `SummaryScene`, `// ${description}`];
  }

  async generateSprites(description: string): Promise<string[]> {
    return [
      `sprite://player?prompt=${encodeURIComponent(description)}`,
      `sprite://enemy?prompt=${encodeURIComponent(description)}`,
      `sprite://environment?prompt=${encodeURIComponent(description)}`,
    ];
  }

  async generateGameLogic(gameplay: string): Promise<string> {
    return this._ai.generate({
      systemPrompt: 'Generate Phaser game logic in TypeScript',
      userPrompt: gameplay,
      language: 'typescript',
      includeComments: true,
    });
  }

  private setupPhysics(gameConfig: string): Record<string, unknown> {
    return {
      engine: 'arcade',
      gravity: { y: 500 },
      configPreview: gameConfig.slice(0, 120),
    };
  }

  private setupControls(): Record<string, string> {
    return {
      moveLeft: 'ArrowLeft',
      moveRight: 'ArrowRight',
      jump: 'Space',
      action: 'Enter',
    };
  }
}

