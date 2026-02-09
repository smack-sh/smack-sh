import { useState } from 'react';
import { useLoaderData } from '@remix-run/react';

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  environment: string;
  userSegments: string[];
  rolloutPercentage: number;
  lastModified: string;
  modifiedBy: string;
}

interface Environment {
  id: string;
  name: string;
  color: string;
}

interface UserSegment {
  id: string;
  name: string;
}

export default function FeatureFlags() {
  const { featureFlags, environments, userSegments } = useLoaderData<{
    featureFlags: FeatureFlag[];
    environments: Environment[];
    userSegments: UserSegment[];
  }>();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const categories = ['all', ...Array.from(new Set(featureFlags.map((flag) => flag.category)))];

  // Add Firebase feature flag if it doesn't exist
  const allFeatureFlags = [
    ...featureFlags,
    {
      id: 'firebase-integration',
      name: 'Firebase Integration',
      description: 'Enable Firebase services (Authentication, Firestore, etc.)',
      category: 'Integrations',
      enabled: false,
      environment: 'all',
      userSegments: ['all'],
      rolloutPercentage: 0,
      lastModified: new Date().toISOString(),
      modifiedBy: 'system',
    },
  ].filter((flag, index, self) => index === self.findIndex((f) => f.id === flag.id));

  const filteredFlags = allFeatureFlags.filter((flag) => {
    const matchesSearch =
      flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || flag.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getEnvironmentColor = (environment: string) => {
    const env = environments.find((e) => e.id === environment);
    return env?.color || 'gray';
  };

  const toggleFeature = async (flagId: string, enabled: boolean) => {
    // TODO: Implement feature flag toggle API call
    console.log(`Toggling ${flagId} to ${enabled}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Feature Flags</h2>
          <p className="text-gray-600 dark:text-gray-400">Control feature availability and rollout</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500"
        >
          Create Feature Flag
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-600">{featureFlags.filter((f) => f.enabled).length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Enabled</div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-red-600">{featureFlags.filter((f) => !f.enabled).length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Disabled</div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-blue-600">{environments.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Environments</div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-purple-600">{userSegments.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">User Segments</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div className="md:w-48">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Feature Flags List */}
      <div className="space-y-4">
        {filteredFlags.map((flag) => (
          <div
            key={flag.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{flag.name}</h3>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      flag.enabled
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                    }`}
                  >
                    {flag.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-3">{flag.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    {flag.category}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      flag.environment === 'production'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : flag.environment === 'staging'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                    }`}
                  >
                    {flag.environment}
                  </span>
                  <span>{flag.rolloutPercentage}% rollout</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleFeature(flag.id, !flag.enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 ${
                    flag.enabled ? 'bg-accent-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-gray-900 transition-transform ${
                      flag.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>User segments: {flag.userSegments.join(', ')}</span>
                <span>
                  Last modified: {new Date(flag.lastModified).toLocaleDateString()} by {flag.modifiedBy}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredFlags.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">No feature flags found matching your criteria.</p>
        </div>
      )}

      {/* Create Feature Flag Modal */}
      {isCreateModalOpen && (
        <CreateFeatureFlagModal
          environments={environments}
          userSegments={userSegments}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  );
}

function CreateFeatureFlagModal({
  environments,
  userSegments,
  onClose,
}: {
  environments: any[];
  userSegments: any[];
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    environment: 'development',
    userSegments: [] as string[],
    rolloutPercentage: 100,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: Implement create feature flag API call
    console.log('Creating feature flag:', formData);
    onClose();
  };

  const toggleUserSegment = (segmentId: string) => {
    setFormData((prev) => ({
      ...prev,
      userSegments: prev.userSegments.includes(segmentId)
        ? prev.userSegments.filter((id) => id !== segmentId)
        : [...prev.userSegments, segmentId],
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Create Feature Flag</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Feature Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent-500 focus:border-accent-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="e.g., New Dashboard"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent-500 focus:border-accent-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="e.g., UI Improvements"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent-500 focus:border-accent-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Describe what this feature does..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Environment</label>
              <select
                value={formData.environment}
                onChange={(e) => setFormData((prev) => ({ ...prev, environment: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent-500 focus:border-accent-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {environments.map((env) => (
                  <option key={env.id} value={env.id}>
                    {env.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rollout Percentage
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.rolloutPercentage}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    rolloutPercentage: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent-500 focus:border-accent-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              User Segments ({formData.userSegments.length} selected)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {userSegments.map((segment) => (
                <label
                  key={segment.id}
                  className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.userSegments.includes(segment.id)}
                    onChange={() => toggleUserSegment(segment.id)}
                    className="mr-3 text-accent-600 focus:ring-accent-500"
                  />
                  <span className="text-sm text-gray-900 dark:text-white">{segment.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-accent-600 text-white text-sm font-medium rounded-md hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500"
            >
              Create Feature Flag
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
