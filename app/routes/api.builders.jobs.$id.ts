import { getAuth } from '@clerk/remix/ssr.server';
import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { getBuilderJob } from '~/lib/builders/jobs.server';

export async function loader(args: LoaderFunctionArgs) {
  const { params } = args;
  const { userId } = await getAuth(args);

  if (!userId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const jobId = params.id;

  if (!jobId) {
    return json({ error: 'job id is required' }, { status: 400 });
  }

  const job = await getBuilderJob(jobId);

  if (!job) {
    return json({ error: 'job not found' }, { status: 404 });
  }

  return json(job);
}
