import { useState } from 'react';
import { useFetcher } from '@remix-run/react';

export function FirebaseConfig() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState('');
  const [error, setError] = useState('');
  const fetcher = useFetcher();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate JSON
      const parsedConfig = JSON.parse(config);

      fetcher.submit({ config: JSON.stringify(parsedConfig) }, { method: 'post', action: '/api/configure-firebase' });

      setIsOpen(false);
    } catch (err) {
      setError('Invalid JSON configuration');
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
      >
        Configure Firebase
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 p-6 rounded-lg shadow-xl w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Firebase Configuration</h2>

        {error && <div className="mb-4 p-2 bg-red-900 text-red-100 rounded">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Paste your Firebase config (from Firebase Console):</label>
            <textarea
              className="w-full h-64 p-2 bg-gray-800 text-white font-mono text-sm rounded"
              value={config}
              onChange={(e) => setConfig(e.target.value)}
              placeholder={
                '{\n  "apiKey": "your-api-key",\n  "authDomain": "your-project.firebaseapp.com",\n  "projectId": "your-project-id",\n  "storageBucket": "your-project.appspot.com",\n  "messagingSenderId": "1234567890",\n  "appId": "1:1234567890:web:abcdef123456"\n}'
              }
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              disabled={!config.trim()}
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
