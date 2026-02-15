import { json, type ActionFunctionArgs } from '@remix-run/node';
import { PhaserGameBuilderAdapter } from '~/lib/builders/game';

const builder = new PhaserGameBuilderAdapter();

export async function action({ request }: ActionFunctionArgs) {
  try {
    const payload = (await request.json()) as { prompt?: string };

    if (!payload.prompt) {
      return json({ error: 'prompt is required' }, { status: 400 });
    }

    const game = await builder.generateFromPrompt(payload.prompt);

    return json(game);
  } catch (error) {
    console.error('Game engine generation failed:', error);
    return json({ error: error instanceof Error ? error.message : 'Game generation failed' }, { status: 500 });
  }
}
