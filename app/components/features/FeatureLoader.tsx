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
    let active = true;

    const loadFeature = async () => {
      try {
        const feature = getFeatureById(featureId);

        if (!feature || !feature.component) {
          throw new Error(`Feature ${featureId} not found`);
        }

        const { default: Component } = await feature.component();

        if (active) {
          setComponent(() => Component);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err as Error);
        }
      }
    };

    loadFeature();

    return () => {
      active = false;
    };
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
