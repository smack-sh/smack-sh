import { readFile, writeFile } from 'node:fs/promises';
import { runEasBuild, runFlutterBuildApk, runTauriBuild, type BuildRunnerResult } from '~/lib/builders/runners.server';

type BuilderJobType = 'desktop-build' | 'flutter-apk-build' | 'react-native-eas-build';
type BuilderJobStatus = 'queued' | 'running' | 'completed' | 'failed';

export type BuilderJob = {
  id: string;
  type: BuilderJobType;
  status: BuilderJobStatus;
  createdAt: string;
  updatedAt: string;
  payload: Record<string, unknown>;
  result?: BuildRunnerResult;
  error?: string;
};

const JOBS_DB_PATH = '/tmp/smack-builder-jobs.json';
const jobs = new Map<string, BuilderJob>();
let hydrationAttempted = false;

async function hydrateJobs() {
  if (hydrationAttempted) {
    return;
  }

  hydrationAttempted = true;

  try {
    const content = await readFile(JOBS_DB_PATH, 'utf8');
    const parsed = JSON.parse(content) as BuilderJob[];

    for (const job of parsed) {
      jobs.set(job.id, job);
    }
  } catch {
    // Ignore missing/corrupt db.
  }
}

async function persistJobs() {
  const serialized = JSON.stringify(Array.from(jobs.values()), null, 2);
  await writeFile(JOBS_DB_PATH, serialized, 'utf8');
}

function createJob(type: BuilderJobType, payload: Record<string, unknown>): BuilderJob {
  const now = new Date().toISOString();
  return {
    id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    type,
    status: 'queued',
    createdAt: now,
    updatedAt: now,
    payload,
  };
}

async function executeJob(job: BuilderJob) {
  job.status = 'running';
  job.updatedAt = new Date().toISOString();
  await persistJobs();

  try {
    const projectRoot = String(job.payload.projectRoot || process.cwd());
    let result: BuildRunnerResult;

    switch (job.type) {
      case 'desktop-build':
        result = await runTauriBuild(projectRoot);
        break;
      case 'flutter-apk-build':
        result = await runFlutterBuildApk(projectRoot);
        break;
      case 'react-native-eas-build':
        result = await runEasBuild(projectRoot);
        break;
      default:
        result = {
          success: false,
          command: 'unknown',
          stdout: '',
          stderr: '',
          error: `Unsupported job type: ${job.type}`,
        };
    }

    job.result = result;
    job.status = result.success ? 'completed' : 'failed';
    job.error = result.error;
    job.updatedAt = new Date().toISOString();
    await persistJobs();
  } catch (error) {
    job.status = 'failed';
    job.error = error instanceof Error ? error.message : 'Job execution failed';
    job.updatedAt = new Date().toISOString();
    await persistJobs();
  }
}

export async function enqueueBuilderJob(type: BuilderJobType, payload: Record<string, unknown>) {
  await hydrateJobs();

  const job = createJob(type, payload);
  jobs.set(job.id, job);
  await persistJobs();

  setTimeout(() => {
    executeJob(job).catch((error) => {
      console.error(`Failed to execute job ${job.id}:`, error);
    });
  }, 0);

  return job;
}

export async function getBuilderJob(jobId: string): Promise<BuilderJob | null> {
  await hydrateJobs();
  return jobs.get(jobId) || null;
}

export async function listBuilderJobs(limit = 20): Promise<BuilderJob[]> {
  await hydrateJobs();
  return Array.from(jobs.values())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}
