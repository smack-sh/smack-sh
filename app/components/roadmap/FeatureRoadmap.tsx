import { features, getFeaturesByStatus, getAllCategories, type Feature } from '~/features/featureRegistry';

export function FeatureRoadmap() {
  const releasedFeatures = getFeaturesByStatus('released');
  const plannedFeatures = getFeaturesByStatus('planned');
  const categories = getAllCategories();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold">Feature Roadmap</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">What's coming next to Smack AI - 100+ features planned</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.slice(0, 20).map((feature) => (
          <div key={feature.id} className="p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">{feature.name}</h3>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  feature.status === 'released'
                    ? 'bg-green-100 text-green-800'
                    : feature.status === 'beta'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {feature.status}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{feature.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">{feature.category}</span>
              <span className="text-sm text-gray-500">Priority: {feature.priority}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <p className="text-lg font-semibold">And 80+ more features in development!</p>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category) => (
            <div key={category} className="p-3 bg-gray-100 dark:bg-gray-800 rounded">
              <p className="font-medium">{category}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {features.filter((f) => f.category === category).length} features
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
