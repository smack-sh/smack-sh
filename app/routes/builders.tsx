import { useEffect, useRef, useState } from 'react';

type BuilderTab = 'desktop' | 'flutter' | 'react-native' | 'game';
type BuilderRunMode = 'generate' | 'build';

function getBuilderEndpoint(tab: BuilderTab): string {
  const endpointMap: Record<BuilderTab, string> = {
    desktop: '/api/builders/desktop',
    flutter: '/api/builders/flutter',
    'react-native': '/api/builders/react-native',
    game: '/api/builders/game',
  };

  return endpointMap[tab];
}

function getBuilderBody(tab: BuilderTab, runMode: BuilderRunMode, prompt: string, promptSnippet: string): string {
  const builders: Record<BuilderTab, Record<BuilderRunMode, () => string>> = {
    desktop: {
      build: () => '{"mode":"build","projectRoot":"."}',
      generate: () => '{"mode":"generate","prompt":' + JSON.stringify(prompt) + ',"template":"productivity-timer"}',
    },
    flutter: {
      build: () => '{"mode":"build-apk","projectId":"flutter-demo","projectRoot":"."}',
      generate: () => '{"mode":"generate","prompt":' + JSON.stringify(prompt) + '}',
    },
    'react-native': {
      build: () => '{"mode":"build-eas","projectRoot":"."}',
      generate: () => '{"mode":"convert","webCode":' + JSON.stringify(promptSnippet) + '}',
    },
    game: {
      build: () => '{"prompt":' + JSON.stringify(prompt) + '}',
      generate: () => '{"prompt":' + JSON.stringify(prompt) + '}',
    },
  };

  return builders[tab][runMode]();
}

export default function BuildersPage() {
  const [tab, setTab] = useState<BuilderTab>('desktop');
  const [runMode, setRunMode] = useState<BuilderRunMode>('generate');
  const [prompt, setPrompt] = useState('Build a productivity timer with reports and reminders');
  const [output, setOutput] = useState('// Output will appear here');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const pollControllerRef = useRef<AbortController | null>(null);

  const promptSnippet = '<div onClick={() => {}} className="card">' + prompt + '</div>';

  useEffect(() => {
    return () => {
      pollControllerRef.current?.abort();
    };
  }, []);

  const callBuilder = async () => {
    setLoading(true);
    setError(null);

    try {
      pollControllerRef.current?.abort();

      const controller = new AbortController();
      pollControllerRef.current = controller;

      const response = await fetch(getBuilderEndpoint(tab), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: getBuilderBody(tab, runMode, prompt, promptSnippet),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let message = `Request failed (${response.status})`;

        try {
          const parsed = JSON.parse(errorText) as { error?: string };

          if (parsed?.error) {
            message = parsed.error;
          }
        } catch {
          if (errorText.trim().length > 0) {
            message = `${message}: ${errorText.slice(0, 240)}`;
          }
        }

        throw new Error(message);
      }

      const data = (await response.json()) as Record<string, unknown> & { error?: string };
      setOutput(JSON.stringify(data, null, 2));

      const maybeJobId = typeof data.jobId === 'string' ? data.jobId : null;
      setJobId(maybeJobId);

      if (maybeJobId) {
        pollJobStatus(maybeJobId, controller.signal).catch((pollError) => {
          console.error('Job polling failed:', pollError);
        });
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }

      console.error('Builder request failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown builder error');
    } finally {
      setLoading(false);
    }
  };

  const pollJobStatus = async (id: string, signal: AbortSignal) => {
    for (let i = 0; i < 30; i++) {
      if (signal.aborted) {
        return;
      }

      const response = await fetch(`/api/builders/jobs/${id}`, { signal });

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
