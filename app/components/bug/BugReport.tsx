import { useState } from 'react';

export function BugReport() {
  const [formData, setFormData] = useState({
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<null | 'success' | 'error' | 'loading'>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/bug-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus('success');
        setFormData({ email: '', subject: '', message: '' });
        setTimeout(() => setStatus(null), 5000);
      } else {
        throw new Error('Failed to submit bug report');
      }
    } catch (error) {
      console.error('Error submitting bug report:', error);
      setStatus('error');
      setTimeout(() => setStatus(null), 5000);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md dark:bg-gray-800">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Report a Bug</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Found an issue? Let us know and we'll look into it right away.
        </p>
      </div>

      {status === 'success' && (
        <div className="mb-6 p-4 rounded-lg bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-200">
          Thank you for your report! We've received it and will get back to you soon.
        </div>
      )}

      {status === 'error' && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-200">
          Oops! Something went wrong. Please try again later or email us directly at support@smack.netlify.app
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Subject
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Brief description of the issue"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            value={formData.message}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Please describe the bug in detail. Include steps to reproduce, expected behavior, and actual behavior."
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Need help? Email us at{' '}
            <a
              href="mailto:support@smack.netlify.app"
              className="text-accent-600 hover:text-accent-500 dark:text-accent-400 dark:hover:text-accent-300"
            >
              support@smack.netlify.app
            </a>
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-6 py-2 bg-accent-600 text-white font-medium rounded-lg hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? 'Sending...' : 'Submit Report'}
          </button>
        </div>
      </form>
    </div>
  );
}
