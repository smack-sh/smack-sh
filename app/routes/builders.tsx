import { useState } from 'react';

type BuilderTab = 'desktop' | 'flutter' | 'react-native' | 'game';

export default function BuildersPage() {
  const [tab, setTab] = useState<BuilderTab>('desktop');
  const [runMode, setRunMode] = useState<'generate' | 'build'>('generate');
  const [prompt, setPrompt] = useState('Build a productivity timer with reports and reminders');
  const [output, setOutput] = useState('// Output will appear here');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const promptSnippet = '<div onClick={() => {}} className="card">' + prompt + '</div>';

  const callBuilder = async () => {
    setLoading(true);
    setError(null);

    try {
      const endpointMap: Record<BuilderTab, string> = {
        desktop: '/api/builders/desktop',
        flutter: '/api/builders/flutter',
        'react-native': '/api/builders/react-native',
        game: '/api/builders/game',
      };

      const bodyMap: Record<BuilderTab, Record<string, unknown>> = {
        desktop:
          runMode === 'build'
            ? { mode: 'build', projectRoot: '.' }
            : { prompt, template: 'productivity-timer', mode: 'generate' },
        flutter:
          runMode === 'build'
            ? { mode: 'build-apk', projectId: 'flutter-demo', projectRoot: '.' }
            : { mode: 'generate', prompt },
        'react-native':
          runMode === 'build' ? { mode: 'build-eas', projectRoot: '.' } : { mode: 'convert', webCode: promptSnippet },
        game: { prompt },
      };

      const response = await fetch(endpointMap[tab], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyMap[tab]),
      });

      const data = (await response.json()) as Record<string, unknown> & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      setOutput(JSON.stringify(data, null, 2));

      const maybeJobId = typeof data.jobId === 'string' ? data.jobId : null;
      setJobId(maybeJobId);

      if (maybeJobId) {
        pollJobStatus(maybeJobId).catch((pollError) => {
          console.error('Job polling failed:', pollError);
        });
      }
    } catch (err) {
      console.error('Builder request failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown builder error');
    } finally {
      setLoading(false);
    }
  };

  const pollJobStatus = async (id: string) => {
    for (let i = 0; i < 30; i++) {
      const response = await fetch(`/api/builders/jobs/${id}`);

      if (!response.ok) {
        break;
      }

      const status = (await response.json()) as { status?: string };
      setOutput((prev) => `${prev}\n\n--- JOB STATUS ---\n${JSON.stringify(status, null, 2)}`);

      if (status.status === 'completed' || status.status === 'failed') {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  };

  return (
    <div className="min-h-screen bg-smack-elements-background-depth-1 p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-smack-elements-textPrimary">Multi-Platform AI Builders</h1>
        <p className="text-smack-elements-textSecondary">
          Desktop (Tauri), Flutter, React Native, and Game generation from a single control panel.
        </p>

        <div className="flex gap-2 flex-wrap">
          {(['desktop', 'flutter', 'react-native', 'game'] as BuilderTab[]).map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-3 py-2 rounded text-sm ${
                tab === key ? 'bg-accent-600 text-white' : 'bg-smack-elements-background-depth-3'
              }`}
            >
              {key}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['generate', 'build'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setRunMode(mode)}
              className={`px-3 py-2 rounded text-sm ${
                runMode === mode ? 'bg-emerald-600 text-white' : 'bg-smack-elements-background-depth-3'
              }`}
            >
              {mode}
            </button>
          ))}
          {jobId && <span className="text-xs text-smack-elements-textSecondary self-center">Job: {jobId}</span>}
        </div>

        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={5}
          className="w-full p-3 rounded border border-smack-elements-borderColor bg-smack-elements-background-depth-2"
        />

        <div className="flex items-center gap-3">
          <button
            onClick={callBuilder}
            disabled={loading || !prompt.trim()}
            className="px-4 py-2 rounded bg-accent-600 text-white"
          >
            {loading ? 'Generating...' : `Generate ${tab}`}
          </button>
          {error && <span className="text-sm text-red-500">{error}</span>}
        </div>

        <pre className="w-full min-h-[420px] p-4 rounded border border-smack-elements-borderColor bg-smack-elements-background-depth-2 overflow-auto text-xs">
          {output}
        </pre>
      </div>
    </div>
  );
}
