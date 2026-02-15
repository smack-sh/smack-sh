import { json, type ActionFunctionArgs } from '@remix-run/node';
import { DesktopAIGeneratorAdapter, type TauriProjectTemplate } from '~/lib/builders/desktop';
import { enqueueBuilderJob } from '~/lib/builders/jobs.server';

const generator = new DesktopAIGeneratorAdapter();

export async function action({ request }: ActionFunctionArgs) {
  try {
    const payload = (await request.json()) as {
      prompt?: string;
      template?: TauriProjectTemplate;
      mode?: 'generate' | 'build';
      projectRoot?: string;
    };

    if (payload.mode === 'build') {
      const job = await enqueueBuilderJob('desktop-build', {
        projectRoot: payload.projectRoot || process.cwd(),
      });

      return json({ jobId: job.id, status: job.status, type: job.type });
    }

    const prompt = payload.prompt?.trim();

    if (!prompt) {
      return json({ error: 'prompt is required' }, { status: 400 });
    }

    const result = await generator.generateFromPrompt(prompt, payload.template || 'note-taking-app');

    return json(result);
  } catch (error) {
    console.error('Desktop builder generation failed:', error);
    return json({ error: error instanceof Error ? error.message : 'Desktop generation failed' }, { status: 500 });
  }
}
