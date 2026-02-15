import { getAuth } from '@clerk/remix/ssr.server';
import { json, type ActionFunctionArgs } from '@remix-run/node';
import { FlutterAIGeneratorAdapter, FlutterBuildServiceAdapter } from '~/lib/builders/flutter';
import { enqueueBuilderJob } from '~/lib/builders/jobs.server';

const generator = new FlutterAIGeneratorAdapter();
const buildService = new FlutterBuildServiceAdapter();

export async function action(args: ActionFunctionArgs) {
  try {
    const { request } = args;
    const { userId } = await getAuth(args);

    if (!userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = (await request.json()) as {
      prompt?: string;
      projectId?: string;
      mode?: 'generate' | 'build-apk';
      projectRoot?: string;
    };
    const mode = payload.mode || 'generate';

    if (mode === 'build-apk') {
      if (!payload.projectId) {
        return json({ error: 'projectId is required for build-apk mode' }, { status: 400 });
      }

      const build = await buildService.buildAPK(payload.projectId);
      const job = await enqueueBuilderJob('flutter-apk-build', {
        projectRoot: payload.projectRoot || process.cwd(),
        projectId: payload.projectId,
      });

      return json({ ...build, jobId: job.id, status: job.status });
    }

    if (!payload.prompt) {
      return json({ error: 'prompt is required for generate mode' }, { status: 400 });
    }

    const widgetTree = await generator.generateWidgetTree(payload.prompt);
    const state = await generator.generateStateManagement(payload.prompt);
    const platform = await generator.adaptForPlatform(widgetTree);

    return json({ widgetTree, state, platform });
  } catch (error) {
    console.error('Flutter builder request failed:', error);
    return json({ error: error instanceof Error ? error.message : 'Flutter generation failed' }, { status: 500 });
  }
}
