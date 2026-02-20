import { forwardRef } from 'react';
import { classNames } from '~/utils/classNames';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

const Card = forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={classNames(
        'rounded-xl border border-smack-elements-borderColor bg-smack-elements-background-depth-2 text-smack-elements-textPrimary shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300',
        className,
      )}
      {...props}
    />
  );
});
Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => {
  return <div ref={ref} className={classNames('flex flex-col space-y-1.5 p-6', className)} {...props} />;
});
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={classNames('text-2xl font-semibold leading-none tracking-tight text-smack-elements-textPrimary', className)}
        {...props}
      />
    );
  },
);
CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    return <p ref={ref} className={classNames('text-sm text-smack-elements-textSecondary', className)} {...props} />;
  },
);
CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => {
  return <div ref={ref} className={classNames('p-6 pt-0', className)} {...props} />;
});
CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={classNames('flex items-center p-6 pt-0', className)} {...props} />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
