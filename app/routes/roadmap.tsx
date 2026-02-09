import { FeatureRoadmap } from '~/components/roadmap/FeatureRoadmap';
import { FeatureRequest } from '~/components/roadmap/FeatureRequest';
import { FeatureLoader } from '~/components/features/FeatureLoader';

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-smack-elements-background-depth-1">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-12">
          <FeatureRoadmap />

          {/* Feature Previews */}
          <div className="space-y-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Released Features</h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Team Management</h4>
                <FeatureLoader
                  featureId="team_management"
                  fallback={
                    <div className="p-6 bg-gray-100 dark:bg-gray-700 rounded-lg">Loading team management...</div>
                  }
                />
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Project Templates</h4>
                <FeatureLoader
                  featureId="project_templates"
                  fallback={
                    <div className="p-6 bg-gray-100 dark:bg-gray-700 rounded-lg">Loading project templates...</div>
                  }
                />
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Code Snippets</h4>
                <FeatureLoader
                  featureId="code_snippet_manager"
                  fallback={<div className="p-6 bg-gray-100 dark:bg-gray-700 rounded-lg">Loading code snippets...</div>}
                />
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Theme Manager</h4>
                <FeatureLoader
                  featureId="dark_light_theme"
                  fallback={<div className="p-6 bg-gray-100 dark:bg-gray-700 rounded-lg">Loading theme manager...</div>}
                />
              </div>
            </div>
          </div>

          <FeatureRequest />
        </div>
      </div>
    </div>
  );
}
