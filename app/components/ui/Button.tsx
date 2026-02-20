import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { classNames } from '~/utils/classNames';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-smack-elements-background text-smack-elements-textPrimary hover:bg-smack-elements-background-depth-2 border border-smack-elements-borderColor hover:border-accent/30 hover:shadow-lg',
        destructive: 'bg-red-500 text-white hover:bg-red-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5',
        outline:
          'border border-smack-elements-borderColor bg-transparent hover:bg-smack-elements-background-depth-2 hover:text-smack-elements-textPrimary hover:border-accent/30 text-smack-elements-textPrimary',
        secondary:
          'bg-smack-elements-background-depth-2 text-smack-elements-textPrimary hover:bg-smack-elements-background-depth-3 border border-smack-elements-borderColor/50',
        ghost: 'hover:bg-smack-elements-background-depth-2 hover:text-smack-elements-textPrimary rounded-lg',
        link: 'text-accent underline-offset-4 hover:underline',
        accent: 'bg-accent text-white hover:bg-accent-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-12 rounded-xl px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  _asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, _asChild = false, ...props }, ref) => {
    return <button className={classNames(buttonVariants({ variant, size }), className)} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
