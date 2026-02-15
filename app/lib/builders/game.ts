import { generateGeminiText } from '~/lib/builders/gemini.server';

export type PhaserGame = {
  scenes: string[];
  sprites: string[];
  physics: Record<string, unknown>;
  controls: Record<string, string>;
  logic: string;
};

export class PhaserGameBuilderAdapter {
  async generateFromPrompt(description: string): Promise<PhaserGame> {
    const logic = await generateGeminiText({
      systemPrompt: 'Generate Phaser TypeScript game logic with movement, collisions, scoring.',
      userPrompt: description,
    });

    return {
      scenes: ['BootScene', 'MenuScene', 'GameScene'],
      sprites: [
        `sprite://player?prompt=${encodeURIComponent(description)}`,
        `sprite://enemy?prompt=${encodeURIComponent(description)}`,
      ],
      physics: { engine: 'arcade', gravity: { y: 500 } },
      controls: { moveLeft: 'ArrowLeft', moveRight: 'ArrowRight', jump: 'Space' },
      logic: logic || `// Phaser logic for ${description}`,
    };
  }
}
