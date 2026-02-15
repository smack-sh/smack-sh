import { getAuth } from '@clerk/remix/ssr.server';
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node';
import { enqueueBuilderJob, listBuilderJobs } from '~/lib/builders/jobs.server';

export async function loader(args: LoaderFunctionArgs) {
  const { request } = args;
  const { userId } = await getAuth(args);

  if (!userId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit') || 20)));
  const jobs = await listBuilderJobs(limit);

  return json({ jobs });
}

export async function action(args: ActionFunctionArgs) {
  try {
    const { request } = args;
    const { userId } = await getAuth(args);

    if (!userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = (await request.json()) as {
      type?: 'desktop-build' | 'flutter-apk-build' | 'react-native-eas-build';
      projectRoot?: string;
      metadata?: Record<string, unknown>;
    };

    if (!payload.type) {
      return json({ error: 'type is required' }, { status: 400 });
    }

    const job = await enqueueBuilderJob(payload.type, {
      projectRoot: payload.projectRoot || process.cwd(),
      metadata: payload.metadata || {},
    });

    return json({ jobId: job.id, status: job.status, createdAt: job.createdAt });
  } catch (error) {
    console.error('Failed to create builder job:', error);
    return json({ error: error instanceof Error ? error.message : 'Unable to create job' }, { status: 500 });
  }
}
