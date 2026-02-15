type BuildJob = {
  id: string;
  projectId: string;
  type: 'build-apk';
};

class InMemoryBuildQueue {
  private _jobs: BuildJob[] = [];

  async add(type: BuildJob['type'], input: { projectId: string }): Promise<BuildJob> {
    const job: BuildJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      projectId: input.projectId,
      type,
    };
    this._jobs.push(job);
    return job;
  }
}

export class FlutterBuildService {
  private _queue = new InMemoryBuildQueue();

  async buildAPK(projectId: string): Promise<{ url: string; jobId: string }> {
    const job = await this._queue.add('build-apk', { projectId });
    const artifact = await this.executeOnCloud(job);
    return { url: artifact.downloadUrl, jobId: job.id };
  }

  private async executeOnCloud(job: BuildJob): Promise<{ downloadUrl: string }> {
    return {
      downloadUrl: `https://example.invalid/flutter-artifacts/${job.projectId}/${job.id}/app-release.apk`,
    };
  }
}

