import FeatureFlags from '~/features/flags/FeatureFlags';

export default function FeatureFlagsPage() {
  return (
    <div className="min-h-screen bg-smack-elements-background-depth-1">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <FeatureFlags />
      </div>
    </div>
  );
}
