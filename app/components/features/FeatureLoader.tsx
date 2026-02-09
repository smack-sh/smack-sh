import { useState, useEffect, Suspense } from 'react';
import { getFeatureById } from '~/features/featureRegistry';

interface FeatureLoaderProps {
  featureId: string;
  fallback?: React.ReactNode;
  errorFallback?: (error: Error) => React.ReactNode;
}

export function FeatureLoader({
  featureId,
  fallback = <div>Loading...</div>,
  errorFallback = (error) => <div>Error loading feature: {error.message}</div>,
}: FeatureLoaderProps) {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadFeature = async () => {
      try {
        const feature = getFeatureById(featureId);

        if (!feature || !feature.component) {
          throw new Error(`Feature ${featureId} not found`);
        }

        const { default: Component } = await feature.component();
        setComponent(() => Component);
      } catch (err) {
        setError(err as Error);
      }
    };

    loadFeature();
  }, [featureId]);

  if (error) {
    return <>{errorFallback(error)}</>;
  }

  if (!Component) {
    return <>{fallback}</>;
  }

  return (
    <Suspense fallback={fallback}>
      <Component />
    </Suspense>
  );
}
