'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { classNames } from '~/utils/classNames';

const badgeVariants = cva(
  'inline-flex items-center gap-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-smack-elements-background text-smack-elements-textPrimary hover:bg-smack-elements-background-depth-2',
        secondary:
          'border-transparent bg-smack-elements-background-depth-2 text-smack-elements-textSecondary hover:bg-smack-elements-background-depth-3',
        destructive: 'border-transparent bg-red-500/10 text-red-500 hover:bg-red-500/20',
        outline: 'border border-smack-elements-borderColor text-smack-elements-textPrimary',
        primary: 'border-transparent bg-accent/10 text-accent-600 dark:text-accent-400',
        success: 'border-transparent bg-green-500/10 text-green-600 dark:text-green-400',
        warning: 'border-transparent bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
        danger: 'border-transparent bg-red-500/10 text-red-600 dark:text-red-400',
        info: 'border-transparent bg-blue-500/10 text-blue-600 dark:text-blue-400',
        subtle:
          'border border-smack-elements-borderColor/30 dark:border-smack-elements-borderColor-dark/30 bg-white/50 dark:bg-smack-elements-background-depth-4/50 backdrop-blur-sm text-smack-elements-textSecondary dark:text-smack-elements-textSecondary-dark',
      },
      size: {
        default: 'rounded-full px-2.5 py-0.5 text-xs font-semibold',
        sm: 'rounded-full px-1.5 py-0.5 text-xs',
        md: 'rounded-md px-2 py-1 text-xs font-medium',
        lg: 'rounded-md px-2.5 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  icon?: string;
}

function Badge({ className, variant, size, icon, children, ...props }: BadgeProps) {
  return (
    <div className={classNames(badgeVariants({ variant, size }), className)} {...props}>
      {icon && <span className={icon} />}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
