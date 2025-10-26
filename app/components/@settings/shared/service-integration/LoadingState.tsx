import React from 'react';
import { motion } from 'framer-motion';
import { classNames } from '~/utils/classNames';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showProgress?: boolean;
  progress?: number;
}

export function LoadingState({
  message = 'Loading...',
  size = 'md',
  className,
  showProgress = false,
  progress = 0,
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <motion.div
      className={classNames('flex flex-col items-center justify-center gap-3', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex items-center gap-2">
        <div
          className={classNames(
            'i-ph:spinner-gap animate-spin text-smack-elements-item-contentAccent',
            sizeClasses[size],
          )}
        />
        <span className="text-smack-elements-textSecondary">{message}</span>
      </div>

      {showProgress && (
        <div className="w-full max-w-xs">
          <div className="w-full bg-smack-elements-background-depth-2 rounded-full h-1">
            <motion.div
              className="bg-smack-elements-item-contentAccent h-1 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className, lines = 1 }: SkeletonProps) {
  return (
    <div className={classNames('animate-pulse', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className={classNames(
            'bg-smack-elements-background-depth-2 rounded',
            i === lines - 1 ? 'h-4' : 'h-4 mb-2',
            i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full',
          )}
        />
      ))}
    </div>
  );
}

interface ServiceLoadingProps {
  serviceName: string;
  operation: string;
  progress?: number;
}

export function ServiceLoading({ serviceName, operation, progress }: ServiceLoadingProps) {
  return (
    <LoadingState
      message={`${operation} ${serviceName}...`}
      showProgress={progress !== undefined}
      progress={progress}
    />
  );
}
