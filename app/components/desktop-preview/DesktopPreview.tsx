// app/components/desktop-preview/DesktopPreview.tsx
import React, { useState, useEffect } from 'react';
import { classNames } from '~/utils/classNames';

interface DesktopPreviewProps {
  url: string;
  className?: string;
}

export const DesktopPreview: React.FC<DesktopPreviewProps> = ({ url, className }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
  }, [url]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError('Failed to load preview. Ensure the app is running and accessible.');
  };

  return (
    <div className={classNames('relative w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden', className)}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
          Loading preview...
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 text-center">
          {error}
        </div>
      )}
      <iframe
        src={url}
        title="Desktop App Preview"
        className={classNames('w-full h-full border-none', { 'invisible': isLoading || error })}
        onLoad={handleLoad}
        onError={handleError}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms" // Restrict iframe capabilities for security
      />
    </div>
  );
};
