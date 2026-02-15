import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { getBuilderJob } from '~/lib/builders/jobs.server';

export async function loader({ params }: LoaderFunctionArgs) {
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
